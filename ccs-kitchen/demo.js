import {rooms,meals} from './schema.js';
import {emptyState,localDate,monday,encodeMenu,validateBackup} from './model.js';
export function generateDemo(from,through,ranges={}){
 const limits={children:[68,74,200],infants:[0,4,12],adults:[10,12,50]},bounds={};
 for(const [key,[lo,hi,cap]] of Object.entries(limits)){const min=Number(ranges[key+'Min']??lo),max=Number(ranges[key+'Max']??hi);if(!Number.isInteger(min)||!Number.isInteger(max)||min<0||min>max||max>cap)throw Error(`${key}: enter whole-number minimum and maximum between 0 and ${cap}, with minimum no greater than maximum.`);bounds[key]=[min,max];}
 const pick=(key,i)=>bounds[key][0]+i%(bounds[key][1]-bounds[key][0]+1),share=(n,j,total)=>Math.floor(n/total)+(j<n%total?1:0);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(through)||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(through))||from>through)throw Error('Choose a valid date range.');
 const dates=[];for(let d=new Date(from+'T12:00:00');localDate(d)<=through;d.setDate(d.getDate()+1)){if(dates.length>=31)throw Error('Choose no more than 31 calendar days.');dates.push(localDate(d));}
 const days=dates.filter(date=>![0,6].includes(new Date(date+'T12:00:00').getDay()));if(!days.length)throw Error('Choose a range with at least one weekday.');
 const s=emptyState();s.demoFrom=from;s.demoThrough=through;for(const key of Object.keys(bounds)){s[key+'Min']=bounds[key][0];s[key+'Max']=bounds[key][1];}let seq=0;
 const add=(type,date,fields)=>{const r={id:`DEMO-${++seq}`,type,date,operator:'QA',role:'Debug',updatedAt:date+'T17:00:00',notes:'SYNTHETIC TEST DATA — not an actual observation.',...fields};s.records.push(r);return r;};
 const ingredients=[['milk','Unflavored milk (age-specific fat content)','Milk','cup'],['oats','Whole-grain oatmeal','Grain','cup'],['apple','Diced soft apple','Fruit','cup'],['chicken','Roasted chicken','Meat/meat alternate','oz'],['rice','Brown rice','Grain','cup'],['broccoli','Steamed broccoli','Vegetable','cup'],['yogurt','Plain yogurt','Meat/meat alternate','oz'],['banana','Banana','Fruit','cup']];
 const products=Object.fromEntries(ingredients.map(([key,name,component,unit])=>[key,add('product',days[0],{name:'DEMO '+name,unit,package:'Sample bulk ingredient; quantities in base units',allergens:key==='milk'||key==='yogurt'?'Milk':'None declared in sample',credit:'Synthetic product specification / FBG reference — verify real products separately',location:['milk','yogurt','chicken'].includes(key)?'DEMO Walk-in fridge':'DEMO Dry storage',front:'',back:''})]));
 const diet=add('diets',days[0],{room:'HS Fox',initials:'DX',localRef:'DEMO-DIET-01',category:'Preferences',avoid:'Prefers soft fruit',substitute:'Offer the soft fruit already on the menu; same credited portion.',document:'DEMO parent preference',documentStatus:'Not required — within pattern',plan:'Not applicable to sample preference',end:through});
 const times=['08:30','11:30','14:00'];
 days.forEach((date,i)=>{
 const variation=i%3,totals=[0,0,0],children=pick('children',i),infants=pick('infants',i),adultTotal=pick('adults',i);
 rooms.forEach((room,j)=>{const childCount=share(children,j,6),infantCount=j<2?share(infants,j,2):0,present=childCount+infantCount,adults=share(adultTotal,j,6),enrolled=share(bounds.children[1],j,6)+(j<2?share(bounds.infants[1],j,2):0);
 if(j<2){totals[0]+=Math.floor(childCount/2);totals[1]+=childCount-Math.floor(childCount/2);}else totals[2]+=childCount;
 meals.forEach((meal,m)=>{add('counts',date,{room,meal,enrolled:String(enrolled),attendance:String(present),requested:String(present),prepared:String(present),served:String(present),reimbursable:String(present),staff:String(adults),volunteers:'0',visitors:'0',laborAdults:String(adults),time:times[m],sourceRef:`DEMO-POS-${date}-${j}-${m}`,observer:'QA',family:'Verified',review:'Reviewed',reviewer:'QA',reason:'',notes:`SYNTHETIC: ${childCount} children age 1+, ${infantCount} infants. Infants individually fed; family-style applies to older children. Infant detail is included in these totals, not additional meals.`});
 for(let k=0;k<infantCount;k++)add('infant',date,{room,initials:'IX',localRef:`DEMO-INFANT-${j}-${k+1}`,age:'Birth–5 months',meal,time:times[m],milk:'DEMO iron-fortified formula',amount:'6 fl oz offered; individual appetite followed',solids:'Not developmentally applicable',plan:`DEMO individual feeding plan ${j}-${k+1}; fed responsively`,handling:'DEMO bottle label and preparation check complete',sourceRef:`DEMO-POS-${date}-${j}-${m}`});
 });});
 add('presence',date,{dietId:diet.id,presence:share(children,2,6)>0?'Present':'Absent',meals:'All meals'});
 if(infants>0)meals.forEach(meal=>add('production',date,{meal,age:'Birth–5 months',food:'DEMO iron-fortified formula',component:'Milk',portion:'6 fl oz offered per individual plan',planned:String(infants),adultPortions:'0',quantity:`${infants*6} fl oz`,leftovers:'Prepared individually; unused bottle contents discarded per sample procedure',actual:'Iron-fortified infant formula',credit:'DEMO infant feeding plan',wgr:'Not applicable',sugar:'Not applicable'}));
 const wk=monday(date);if(!s.menus[wk]){const menu={};for(let d=0;d<5;d++){menu[`${d}.breakfast`]='Whole-grain oatmeal, soft apple, unflavored age-appropriate milk';menu[`${d}.lunch`]='Roasted chicken, brown rice, steamed broccoli, soft apple, unflavored age-appropriate milk';menu[`${d}.snack`]='Plain yogurt and banana';}s.menus[wk]=encodeMenu(menu);}
 const usage={};
 meals.forEach((meal,m)=>{
 const keys=m===0?['milk','oats','apple']:m===1?['milk','chicken','rice','broccoli','apple']:['yogurt','banana'];
 totals.forEach((count,a)=>keys.forEach(key=>{const ingredient=ingredients.find(v=>v[0]===key),unit=ingredient[3],portion=key==='milk'?(a===2?.75:.5):key==='chicken'?(a===2?1.5:1):key==='yogurt'?2:key==='banana'?.5:key==='apple'&&m===0?(a===2?.5:.25):.25;
 const adults=a===2?adultTotal:0,quantity=(count+adults)*portion;
 const food=key==='milk'?(a===0?'Unflavored whole milk':'Unflavored 1% milk'):ingredient[1];
 add('production',date,{meal,age:['Age 1','Age 2','Ages 3–5'][a],food:'DEMO '+food,component:ingredient[2],portion:`${portion} ${unit}`,planned:String(count),adultPortions:String(adults),quantity:`${quantity} ${unit}`,leftovers:'0 — all portions issued for service',actual:food,credit:'DEMO crediting sheet; hypothetical standard product',wgr:['oats','rice'].includes(key)?'Yes — documentation held':'Not applicable',sugar:key==='yogurt'?'Verified against current limit':'Not applicable'});
 const k=key+'|'+meal;usage[k]=(usage[k]||0)+quantity;
 }));});
 for(const [key,p] of Object.entries(products)){const quantity=Object.entries(usage).filter(([k])=>k.startsWith(key+'|')).reduce((sum,[,n])=>sum+n,0);const lot=`DEMO-${date}-${key}`;if(quantity===0)continue;
 add('receiving',date,{productId:p.id,lot,quantity:String(quantity),vendor:'DEMO Supplier',invoice:`DEMO-INV-${date}`,cost:(quantity*.45).toFixed(2),expiry:through,temperature:['milk','yogurt','chicken'].includes(key)?String(34+variation):'',condition:'Intact packaging; sample accepted',decision:'Accepted',action:''});
 for(const meal of meals){const n=usage[key+'|'+meal];if(n)add('use',date,{productId:p.id,lot,quantity:String(n),purpose:`DEMO ${date} ${meal} production`,meal});}}
 for(const [equipment,kind,temp,target] of [['DEMO Walk-in fridge','Refrigerator',33+variation,'35 °F'],['DEMO Reach-in fridge','Refrigerator',32+variation,'35 °F'],['DEMO Freezer','Freezer',-5+variation,'0 °F']])add('cold',date,{equipment,kind,time:'07:15',temperature:String(temp),target,result:'Within target',recheck:''});
 add('thermal',date,{food:'DEMO roasted chicken',process:'Cooking',time:'10:45',temperature:String(168+variation),duration:'15 seconds',target:'Sample poultry target: at least 165 °F',result:'Within target',action:'',recheck:''});
 add('thermal',date,{food:'DEMO roasted chicken',process:'Hot holding',time:'11:20',temperature:String(145+variation),duration:'Service check',target:'Sample hot-holding target: at least 135 °F',result:'Within target',action:'',recheck:''});
 add('dishwasher',date,{equipment:'DEMO high-temp machine',time:'12:30',method:'Hot water',wash:String(160+variation),rinse:String(182+variation),surface:'160 °F indicator reached',chemical:'',ppm:'',contact:'',target:'Hypothetical machine: wash ≥160 °F, rinse 180–194 °F, utensil surface ≥160 °F',result:'Within target',action:''});
 add('sanitizer',date,{location:'DEMO three-compartment sink',time:'07:30',chemical:'Hot-water immersion',ppm:'',temperature:String(173+variation),contact:'30',ph:'Not applicable',target:'Sample hot-water immersion target: ≥171 °F for ≥30 seconds',test:'DEMO calibrated thermometer',result:'Within target',action:''});
 add('cleaning',date,{area:'DEMO preparation surfaces and utensils',task:'Wash, rinse, sanitize and air dry',frequency:'Before use and after each task; end-of-day check',time:'15:15',agent:'DEMO approved cleaning procedure',result:'Complete',action:''});
 if(children+adultTotal>0)add('waste',date,{kind:'Prepared / plate waste',productId:products.banana.id,lot:'',food:'DEMO banana plate waste',quantity:String(.25+variation*.125),unit:'cup',reason:'Plate waste',disposition:'Composted after service; already issued to production'});
 });
 add('training',days[0],{topic:'DEMO kitchen food-safety and CACFP orientation',location:'Synthetic training provider',participants:'QA / DEMO attendance register',document:'DEMO training record — not a real certificate',due:''});
 validateBackup(s);return {state:s,days:days.length};
}




