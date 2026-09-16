import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {emptyState} from './ccs-kitchen/model.js';
import {assertEnvironment} from './ccs-kitchen/sync-model.js';

export function openStores(directory){
 mkdirSync(directory,{recursive:true});
 const stores=new Map(['prod','debug'].map(environment=>{
  const db=new DatabaseSync(join(directory,environment+'.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY CHECK(id=1), instance TEXT NOT NULL); CREATE TABLE IF NOT EXISTS versions (revision INTEGER PRIMARY KEY, request_id TEXT UNIQUE, digest TEXT, saved_at TEXT NOT NULL, payload TEXT NOT NULL);');
  db.prepare('INSERT OR IGNORE INTO metadata VALUES (1, ?)').run(randomUUID());
  db.prepare('INSERT OR IGNORE INTO versions VALUES (0, NULL, NULL, ?, ?)').run(new Date().toISOString(),JSON.stringify(emptyState()));
  return [environment,db];
 }));
 function read(environment){const db=stores.get(environment);if(!db)throw Error('Unknown database.');const row=db.prepare('SELECT * FROM versions ORDER BY revision DESC LIMIT 1').get();return {environment,instance:db.prepare('SELECT instance FROM metadata WHERE id=1').get().instance,revision:row.revision,savedAt:row.saved_at,state:JSON.parse(row.payload)};}
 return {
  read,
  write(environment,input){
   if(!input||!Number.isSafeInteger(input.revision)||input.revision<0||typeof input.instance!=='string'||typeof input.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(input.requestId))throw Error('Invalid sync request.');
   assertEnvironment(input.state,environment);
   const db=stores.get(environment),payload=JSON.stringify(input.state),digest=createHash('sha256').update(payload).digest('hex');
   db.exec('BEGIN IMMEDIATE');
   try{
    const current=read(environment),prior=db.prepare('SELECT * FROM versions WHERE request_id=?').get(input.requestId);
    if(prior){if(prior.digest!==digest)throw Error('Request ID already used with different data.');db.exec('COMMIT');return {...current,revision:prior.revision,savedAt:prior.saved_at,state:JSON.parse(prior.payload)};}
    if(input.instance!==current.instance||input.revision!==current.revision){const err=Error('Database changed. Review the database again before pushing.');err.status=409;throw err;}
    db.prepare('INSERT INTO versions VALUES (?, ?, ?, ?, ?)').run(current.revision+1,input.requestId,digest,new Date().toISOString(),payload);
    const result=read(environment);db.exec('COMMIT');return result;
   }catch(error){db.exec('ROLLBACK');throw error;}
  },
  close(){for(const db of stores.values())db.close();}
 };
}
