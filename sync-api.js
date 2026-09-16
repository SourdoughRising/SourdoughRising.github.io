import express from 'express';
import {timingSafeEqual} from 'node:crypto';
export function syncApi(stores,{prodKey,debugKey,origins=[]}={}){
 if(prodKey&&debugKey&&prodKey===debugKey)throw Error('Production and Debug must have different access keys.');
 const router=express.Router();
 router.use((req,res,next)=>{
  res.set('Cache-Control','no-store');
  const origin=req.get('Origin');
  if(origin&&!origins.includes(origin))return res.status(403).json({error:'This website origin is not allowed by the sync server.'});
  if(origin){res.set('Access-Control-Allow-Origin',origin);res.vary('Origin');res.set('Access-Control-Allow-Headers','Authorization, Content-Type');res.set('Access-Control-Allow-Methods','GET, PUT, OPTIONS');}
  if(req.method==='OPTIONS')return res.sendStatus(204);
  next();
 });
 router.use('/:environment/snapshot',(req,res,next)=>{
  const env=req.params.environment;if(!['prod','debug'].includes(env))return res.status(404).json({error:'Unknown database.'});
  const key=env==='prod'?prodKey:debugKey;
  if(!key||key.length<32)return res.status(503).json({error:'This database is not configured. Ask the server administrator to set its access key.'});
  const provided=Buffer.from((req.get('Authorization')||'').replace(/^Bearer /,'')),expected=Buffer.from(key);
  if(provided.length!==expected.length||!timingSafeEqual(provided,expected))return res.status(401).json({error:'The access key is not valid for this database.'});
  next();
 });
 router.get('/:environment/snapshot',(req,res)=>res.json(stores.read(req.params.environment)));
 router.put('/:environment/snapshot',express.json({limit:'80mb'}),(req,res)=>{
  try{res.json(stores.write(req.params.environment,req.body));}catch(error){res.status(error.status||400).json({error:error.message});}
 });
 router.use((error,req,res,next)=>res.status(error.status===413?413:400).json({error:error.status===413?'Dataset exceeds the 80 MB sync limit.':'Invalid request body.'}));
 return router;
}
