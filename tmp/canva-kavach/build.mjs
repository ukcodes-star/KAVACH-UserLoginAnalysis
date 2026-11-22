import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Presentation, PresentationFile} from '@oai/artifact-tool';

const build=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(build,'../..');
const detailedArchitecture=process.argv.includes('--architecture-deck');
const approvedOpening=detailedArchitecture||process.argv.includes('--approved-opening');
const aiHelpsDeck=approvedOpening||process.argv.includes('--ai-helps-deck');
const aiReportDeck=aiHelpsDeck||process.argv.includes('--ai-report-deck');
const grokDeck=aiReportDeck||process.argv.includes('--grok-deck');
const demoDeck=grokDeck||process.argv.includes('--demo-deck');
const mergedDeck=demoDeck||process.argv.includes('--merged-deck');
const finalDeck=mergedDeck||process.argv.includes('--final-deck');
const riskUpdate=finalDeck||process.argv.includes('--risk-update');
const revision=riskUpdate||process.argv.includes('--presentation');
const compact=revision||process.argv.includes('--compact');
const dataFile=detailedArchitecture?'architecture-deck.json':approvedOpening?'approved-opening.json':aiHelpsDeck?'ai-helps-deck.json':aiReportDeck?'ai-report-deck.json':grokDeck?'grok-deck.json':demoDeck?'demo-deck.json':mergedDeck?'merged-deck.json':finalDeck?'final-deck.json':riskUpdate?'risk-update.json':revision?'presentation.json':compact?'compact.json':'slides.json';
const input=JSON.parse(await fs.readFile(path.join(build,dataFile),'utf8'));
const data=compact?input.slides:input;
const P=Presentation.create({slideSize:{width:1280,height:720}});
const C={blue:'#EBF6F8',cover:'#DBE6F2',ivory:'#F7F3EB',plum:'#4D354E',purple:'#76638E',ink:'#292332',muted:'#504A55',rust:'#9D421E',lav:'#EEE2F2',peach:'#FBE5D5',green:'#E5ECDE',white:'#FFFFFF',line:'#D8CFD5',wire:'#9F7A72'};
const quiet={fill:'none',width:0};
function box(s,x,y,w,h,fill,stroke='none'){
 return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:1}});
}
function tx(s,value,x,y,w,h,size=22,opts={}){
 const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:quiet});
 sh.text=value;
 sh.text.style={typeface:'Arial',fontSize:size,bold:opts.bold??false,color:opts.color??C.ink,alignment:opts.align??'left',verticalAlignment:opts.vertical??'middle',insets:0,wrap:'square'};
 return sh;
}
function rule(s,x,y,w,color=C.line){box(s,x,y,w,1.3,color);}
function pathLine(s, points, color=C.wire, width=1.35){
 const left=Math.min(...points.map(p=>p[0])), top=Math.min(...points.map(p=>p[1]));
 const w=Math.max(1,Math.max(...points.map(p=>p[0]))-left),h=Math.max(1,Math.max(...points.map(p=>p[1]))-top);
 const [start,...rest]=points;
 s.shapes.add({geometry:'custom',position:{left,top,width:w,height:h},fill:'none',line:{fill:color,width,style:'solid'},
 customPaths:[{width:w,height:h,commands:[{moveTo:{x:start[0]-left,y:start[1]-top}},...rest.map(([x,y])=>({lineTo:{x:x-left,y:y-top}}))]}]});
}
function arrow(s,x1,y,x2){
 const sign=Math.sign(x2-x1);
 pathLine(s,[[x1,y],[x2,y],[x2-8*sign,y-4]],C.wire,1.4);
 pathLine(s,[[x2-8*sign,y+4],[x2,y]],C.wire,1.4);
}
function header(s,title,sub){
 tx(s,title,58,42,1164,64,title.length>53?42:47,{bold:true});
 rule(s,58,118,1164);
 tx(s,sub,58,133,1164,46,22,{color:C.muted,vertical:'top'});
}
function foot(s,value){
 if(value)tx(s,value,58,645,1164,46,17,{color:C.muted,vertical:'middle'});
}
function tile(s,title,body,x,y,w,h,fill=C.white,align='left'){
 box(s,x,y,w,h,fill);
 tx(s,title,x+17,y+12,w-34,33,23,{bold:true,align});
 tx(s,body,x+17,y+52,w-34,h-63,21,{color:C.muted,align,vertical:'top'});
}
async function png(s,file,alt,x,y,w,h,crop){
 const bytes=await fs.readFile(file);
 s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:'image/png',alt,fit:crop?'cover':'contain',crop,position:{left:x,top:y,width:w,height:h}});
}
function contours(s,side){
 for(let k=0;k<9;k++){
  let pts=[];
  for(let p=0;p<=34;p++){
   if(side==='top'){
    const y=8+p*7;
    pts.push([6+k*13+150*Math.exp(-(y+11)/76),y]);
   }else{
    const x=442+p*23;
    const y=Math.min(713,685-k*6+21*Math.sin(p*.35)-.022*Math.max(0,p-24)**3*13);
    pts.push([x,y]);
   }
  }
  pathLine(s,pts,C.purple,1.1);
 }
}
for(const [i,[title,sub,layout,a,b,f]] of data.entries()){
 const s=P.slides.add();
 const n=i+1;
 const ivory=finalDeck?[4,6,10]:riskUpdate?[3,5,9]:revision?[3,5,8]:compact?[3,5,7]:[3,5,6,7,8,9,10,11,17,18,19];
 s.background.fill=n===1?C.cover:(ivory.includes(n)?C.ivory:C.blue);
 if(n!==1&&n!==2)header(s,title,sub);
 if(layout==='cover'){
  contours(s,'top');contours(s,'bottom');
  box(s,76,189,67,4,C.plum);
  tx(s,title,76,209,1020,131,121,{bold:true,color:C.plum});
  tx(s,sub,81,354,1050,60,36,{color:C.rust});
  tx(s,'Umakant Yadav  ·  24MCA026',81,506,780,38,27,{bold:true});
  tx(s,'MCA, NIT Agartala  ·  November 2026\nSupervisor: Dr. Ranjita Das',81,552,780,63,22);
  await png(s,path.join(root,'output/pdf/KAVACH_Report/images/nita_logo.png'),'NIT Agartala crest',1057,92,115,115);
 } else if(layout==='problem'){
  box(s,0,0,408,720,C.purple);
  tx(s,finalDeck?'Problem\nStatement':'The login\nmonitoring\nproblem',43,230,321,225,53,{color:C.white,bold:true});
  const context=finalDeck?'What makes suspicious logins hard to spot':compact?'From login history to investigation':'What KAVACH lets users and administrators do';
  tx(s,context,453,64,760,66,28,{color:C.rust,bold:true});
  const [first,spacing,height]=a.length===4?[136,132,116]:[155,161,136];
  a.forEach(([t,d],j)=>tile(s,t,d,453,first+j*spacing,762,height,[C.lav,C.peach,C.green,C.white][j]));
 } else if(layout==='architecture-detail'){
  const zones=[
   ['React frontend',58,239,442,C.white],
   ['Spring Boot backend',351,548,442,C.white],
   ['PostgreSQL',951,271,268,C.green],
   ['Grok API',951,271,158,C.peach]
  ];
  zones.forEach(([label,x,w,h,fill],j)=>{
   const y=j===3?461:177;
   box(s,x,y,w,h,fill,C.line);
   box(s,x,y,w,42,C.plum);
   tx(s,label,x+12,y+4,w-24,34,23,{bold:true,color:C.white});
  });
  a.client.forEach(([label,detail],j)=>{
   const y=234+j*114;
   if(j>0)rule(s,72,y-6,211);
   tx(s,label,72,y,211,31,19,{bold:true});
   tx(s,detail,72,y+36,211,71,19,{vertical:'top'});
  });
  a.services.forEach(([label,detail],j)=>{
   const y=227+j*76;
   box(s,363,y,524,73,j%2?C.white:C.lav);
   tx(s,label,376,y+2,498,26,21,{bold:true});
   tx(s,detail,376,y+30,498,40,18,{vertical:'top'});
  });
  a.tables.forEach((label,j)=>{
   const y=231+j*37;
   box(s,963,y,247,32,j%2?C.green:C.white);
   tx(s,label,975,y+2,223,28,19,{bold:true});
  });
  tx(s,'Analyzes selected alert details and returns an explanation with suggested checks.',965,512,243,91,19,{vertical:'top'});
  tx(s,'REST',299,246,50,30,14,{align:'center',bold:true,color:C.rust});
  arrow(s,301,283,347);
  arrow(s,347,297,301);
  tx(s,'JPA',900,280,50,29,14,{align:'center',bold:true,color:C.rust});
  arrow(s,903,319,947);
  arrow(s,947,333,903);
  tx(s,'JSON',900,528,50,29,14,{align:'center',bold:true,color:C.rust});
  arrow(s,903,566,947);
  arrow(s,947,580,903);
  foot(s,'Protected requests use JWT. The backend calculates risk scores and calls Grok when an AI report is requested.');
 } else if(layout==='architecture'){
  const xs=[58,471,884], widths=[332,337,338];
  a.slice(0,3).forEach(([t,d],j)=>{
   box(s,xs[j],255,widths[j],233,[C.white,C.lav,C.green][j],C.line);
   box(s,xs[j],255,widths[j],47,C.plum);
   tx(s,t,xs[j]+16,263,widths[j]-32,31,23,{bold:true,color:C.white});
   tx(s,d,xs[j]+16,320,widths[j]-32,145,21,{vertical:'top'});
  });
  tx(s,revision?'REST':'HTTPS',392,300,77,33,17,{align:'center',color:C.rust});arrow(s,400,344,461);
  tx(s,'JPA',810,300,74,33,17,{align:'center',color:C.rust});arrow(s,818,344,874);
  box(s,471,525,337,91,C.peach);
  pathLine(s,[[640,488],[640,523]]);
  tx(s,a[3][0],485,533,309,27,21,{bold:true,align:'center'});
  tx(s,'Model inference and deterministic fallback',485,564,309,41,17,{align:'center'});
  foot(s,'Deterministic detection runs in the application. PostgreSQL holds the evidence used for investigation.');
 } else if(layout==='flow'){
  const gap=20,w=(1164-gap*(a.length-1))/a.length;
  a.forEach(([t,d],j)=>{
   tile(s,t,d,58+j*(w+gap),255,w,179,j===a.length-1?C.green:(j%2?C.lav:C.white),'center');
   if(j<a.length-1)arrow(s,58+j*(w+gap)+w+2,349,58+(j+1)*(w+gap)-2);
  });
  box(s,58,490,1164,79,C.peach);
  tx(s,b,76,503,1128,52,21,{color:C.plum});
 } else if(layout==='sequence'){
  const centers=a.map((_,j)=>58+1164*(j+.5)/a.length);
  const w=a.length===5?209:253;
  a.forEach((t,j)=>{
   box(s,centers[j]-w/2,183,w,38,j===0?C.plum:C.lav);
   tx(s,t,centers[j]-w/2+4,186,w-8,31,19,{bold:true,align:'center',color:j===0?C.white:C.plum});
   box(s,centers[j],221,1,399,C.line);
  });
  const sp=b.length===8?49:55;
  b.forEach(([from,to,t],j)=>{
   const x=centers[from],x2=centers[to],y=266+j*sp,left=Math.min(x,x2),width=Math.abs(x-x2);
   if(j===b.length-1)box(s,58,y-40,1164,53,C.peach);
   tx(s,t,left+5,y-41,width-10,36,a.length===5&&width<240?16:18,{align:'center',vertical:'bottom'});
   arrow(s,x,y,x2);
  });
  foot(s,f);
 } else if(layout==='columns'){
  const w=370;
  a.forEach(([t,...pairs],j)=>{
   const x=58+j*397;
   box(s,x,191,w,424,[C.white,C.white,C.peach][j],C.line);
   box(s,x,191,w,42,C.plum);
   tx(s,t,x+13,196,w-26,32,23,{bold:true,color:C.white});
   for(let k=0;k<3;k++){
    const y=248+k*112;
    if(k>0)rule(s,x+14,y-8,w-28);
    tx(s,pairs[k*2],x+15,y,w-30,29,22,{bold:true});
    tx(s,pairs[k*2+1],x+15,y+34,w-30,66,20,{vertical:'top',color:C.muted});
   }
  });
 } else if(layout==='states'){
  a.forEach(([label,states,detail],j)=>{
   const y=219+j*186,w=(1164-22*(states.length-1))/states.length;
   tx(s,label,58,y-40,1164,34,24,{bold:true,color:C.rust});
   states.forEach((state,k)=>{
    const x=58+k*(w+22);
    box(s,x,y,w,61,[C.white,C.green,C.lav,C.peach][k]);
    tx(s,state,x+5,y+5,w-10,51,24,{bold:true,align:'center'});
   });
   tx(s,detail,58,y+73,1164,49,20,{color:C.muted});
  });
 } else if(layout==='grid'){
  const cols=a.length===6?3:2,w=(1164-(cols-1)*23)/cols;
  const h=180;
  a.forEach(([t,d],j)=>tile(s,t,d,58+j%cols*(w+23),194+Math.floor(j/cols)*206,w,h,[C.white,C.peach,C.lav,C.green,C.lav,C.white][j%6]));
  foot(s,b);
 } else if(layout==='deploy'){
  tile(s,...a[0],58,310,248,126,C.white,'center');
  tile(s,...a[1],350,310,249,126,C.lav,'center');
  tile(s,...a[2],645,310,249,126,C.white,'center');
  tile(s,...a[3],950,220,272,120,C.green,'center');
  tile(s,...a[4],950,437,272,120,C.peach,'center');
  arrow(s,313,371,343);arrow(s,607,371,638);
  pathLine(s,[[903,372],[924,372],[924,280],[942,280]]);
  pathLine(s,[[924,372],[924,497],[942,497]]);
  foot(s,b);
 } else if(layout==='rules'){
  const widths=[305,586,114,159];
  const columns=['Rule and anomaly type','When it matches','Points','Severity'];
  box(s,58,179,1164,44,C.plum);
  let x=58;
  columns.forEach((label,j)=>{
   tx(s,label,x+12,184,widths[j]-24,34,20,{bold:true,color:C.white});
   x+=widths[j];
  });
  a.forEach(([label,code,condition,points,severity],j)=>{
   const y=226+j*63;
   box(s,58,y,1164,60,j%2?C.lav:C.white);
   tx(s,label,70,y+3,281,30,20,{bold:true});
   tx(s,code,70,y+33,281,20,15,{color:C.muted});
   tx(s,condition,375,y+5,562,49,20);
   tx(s,points,961,y+5,90,49,22,{bold:true,color:C.rust});
   tx(s,severity,1075,y+5,135,49,20,{bold:true});
  });
  foot(s,'Severity describes one alert. The next slide shows how points from multiple alerts combine into account risk.');
 } else if(layout==='formula' && riskUpdate){
  const blocks=[
   ['1  Add points for recent alerts','Total risk = Σ riskScore(a)','Include each anomaly a detected for the same account in the previous 24 hours.'],
   ['2  Cap the account score','Composite score = min(Total risk, 100)','The score is 0 with no recent alerts. Older alerts stop contributing as the window moves.']
  ];
  blocks.forEach(([label,formula,detail],j)=>{
   const y=185+j*207;
   box(s,58,y,1164,182,j===0?C.plum:C.lav);
   const color=j===0?C.white:C.plum;
   tx(s,label,82,y+12,1116,35,24,{bold:true,color});
   tx(s,formula,82,y+53,1116,64,43,{bold:true,color});
   tx(s,detail,82,y+128,1116,38,22,{color});
  });
  foot(s,'Source: RiskService.calculateUserRisk. The 24-hour window uses the time each anomaly was detected.');
 } else if(layout==='tiers'){
  a.forEach(([label,range,action,description],j)=>{
   const x=58+(j%2)*596,y=191+Math.floor(j/2)*190,w=568;
   box(s,x,y,w,165,[C.white,C.green,C.lav,C.peach][j]);
   tx(s,label,x+17,y+10,w-134,37,25,{bold:true,color:C.plum});
   tx(s,range,x+w-128,y+10,111,37,25,{bold:true,align:'right',color:C.rust});
   tx(s,action,x+17,y+56,w-34,33,22,{bold:true});
   tx(s,description,x+17,y+96,w-34,52,20,{vertical:'top'});
  });
  foot(s,'The dashboard counts scores of 60+ as risky. The ranked watchlist shows up to 10 accounts with positive scores.');
 } else if(layout==='example'){
  const stages=[
   ['02:15  First failed login','Wrong password from a new IP during off-hours.','20 failed login + 25 unusual time + 40 new IP','85 / 100','Critical'],
   ['02:16  Five more failures','Same IP and device. The 5th and 6th failures overall also trigger brute force.','85 + 5 × (20 + 25) + 2 × 70 = 450 raw points','100 / 100','Critical after capping']
  ];
  stages.forEach(([label,description,calc,score,tier],j)=>{
   const x=58+j*596,y=195,w=568;
   box(s,x,y,w,341,j===0?C.white:C.lav);
   box(s,x,y,w,48,C.plum);
   tx(s,label,x+18,y+6,w-36,36,23,{bold:true,color:C.white});
   tx(s,description,x+18,y+63,w-36,65,22,{vertical:'top'});
   tx(s,calc,x+18,y+136,w-36,54,20,{bold:true});
   rule(s,x+18,y+198,w-36);
   tx(s,score,x+18,y+204,w-36,75,54,{bold:true,color:C.rust});
   tx(s,tier,x+18,y+282,w-36,40,24,{bold:true});
  });
  foot(s,'Starting score: 0. Both scores qualify for the Risky Accounts count. An administrator decides whether to quarantine.');
 } else if(layout==='formula'){
  box(s,58,199,1164,153,C.plum);
  tx(s,'Risk(u, t) = min(100, Σ w(a))',78,219,1124,77,53,{bold:true,align:'center',color:C.white});
  tx(s,'Sum over alerts a for account u detected in the 24 hours before time t.',78,297,1124,37,23,{align:'center',color:C.white});
  tile(s,'Add the preset weights','Each alert contributes the weight w(a) assigned to its detection rule.',58,392,568,155,C.white);
  tile(s,'Keep the result between 0 and 100','No alerts gives a score of 0. A sum above 100 gives a score of 100.',655,392,567,155,C.lav);
  foot(s,'Source: KAVACH RiskService.calculateUserRisk and thesis risk calculation.');
 } else if(layout==='risk'){
  const w=262;
  a.forEach(([label,points],j)=>{
   const x=58+j*300.67;
   box(s,x,215,w,152,j===3?C.plum:[C.white,C.lav,C.peach][j]);
   tx(s,points,x+14,222,w-28,85,66,{bold:true,align:'center',color:j===3?C.white:C.rust});
   tx(s,label,x+12,312,w-24,39,25,{bold:true,align:'center',color:j===3?C.white:C.ink});
   if(j<3)tx(s,j===2?'=':'+',x+w,253,39,62,30,{bold:true,align:'center',color:C.rust});
  });
  tx(s,'Risk tiers',58,414,1164,34,24,{bold:true});
  b.forEach((tier,j)=>{
   const x=58+j*300.67;
   box(s,x,462,w,57,[C.white,C.green,C.lav,C.peach][j]);
   tx(s,tier,x+5,467,w-10,47,22,{bold:true,align:'center'});
  });
  foot(s,f);
 } else if(layout==='ai-report'){
  const width=368,gap=30;
  a.forEach(([label,description,caption],j)=>{
   const x=58+j*(width+gap);
   box(s,x,199,width,379,[C.white,C.peach,C.lav][j],C.line);
   box(s,x,199,width,57,C.plum);
   tx(s,label,x+13,209,width-26,37,21,{bold:true,color:C.white});
   const content=tx(s,description,x+16,279,width-32,203,j===0?20:23,{vertical:'top'});
   if(j===0)content.text.typeface='Consolas';
   rule(s,x+16,493,width-32);
   tx(s,caption,x+16,504,width-32,56,18,{color:C.muted,vertical:'top'});
   if(j<a.length-1)arrow(s,x+width+3,384,x+width+gap-4);
  });
  foot(s,'The report explains the risk and suggests what to review. The scoring rules still set the points.');
 } else if(layout==='grok-example'){
  box(s,58,189,1164,83,C.plum);
  tx(s,'Admin asks',77,203,153,52,22,{bold:true,color:C.white});
  tx(s,a,237,201,963,57,29,{bold:true,color:C.white});
  const [[evidenceTitle,evidence],[responseTitle,response]]=b;
  box(s,58,309,449,249,C.white,C.line);
  tx(s,evidenceTitle,76,323,413,38,25,{bold:true,color:C.plum});
  evidence.forEach((item,j)=>{
   const y=368+j*54;
   if(j>0)rule(s,76,y,413);
   tx(s,item,76,y+3,413,47,22,{bold:j===0,color:j===0?C.rust:C.ink});
  });
  box(s,529,309,693,249,C.lav);
  tx(s,responseTitle,548,323,655,38,25,{bold:true,color:C.plum});
  tx(s,response,548,370,655,158,27,{vertical:'top'});
  foot(s,'KAVACH calculates the score. Grok explains the evidence and suggests what to review.');
 } else if(layout==='account-review'){
  const [user,steps]=a;
  box(s,58,184,1164,76,C.lav);
  tx(s,'User',78,197,105,50,25,{bold:true,color:C.plum});
  tx(s,user,190,197,1012,50,23);
  tx(s,'Administrator investigation',58,289,1164,45,29,{bold:true,color:C.plum});
  const width=368,gap=30;
  steps.forEach(([label,description],j)=>{
   const x=58+j*(width+gap);
   tile(s,label,description,x,350,width,183,[C.white,C.peach,C.green][j]);
   if(j<steps.length-1)arrow(s,x+width+3,441,x+width+gap-4);
  });
 } else if(layout==='split'){
  a.forEach(([label,items],j)=>{
   const x=58+j*599,w=565;
   box(s,x,212,w,361,j===0?C.white:C.lav,C.line);
   box(s,x,212,w,57,C.plum);
   tx(s,label,x+20,222,w-40,37,27,{bold:true,color:C.white});
   items.forEach((item,k)=>{
    const y=283+k*87;
    if(k>0)rule(s,x+20,y-5,w-40);
    tx(s,item,x+20,y,w-40,72,25,{vertical:'middle'});
   });
  });
 } else if(layout==='dashboard-demo'){
  box(s,57,190,840,410,C.white,C.line);
  await png(s,b,'KAVACH dashboard showing login telemetry and anomaly severity',58,191,838,408,{left:338/1917,top:104/867,right:29/1917,bottom:10/867});
  box(s,918,190,304,410,C.white,C.line);
  a.forEach(([value,label],j)=>{
   const y=204+j*70;
   tx(s,value,934,y,76,60,43,{bold:true,color:C.rust});
   tx(s,label,1014,y,192,60,21,{bold:true});
   rule(s,934,y+65,272);
  });
  box(s,934,429,272,151,C.peach);
  tx(s,'81.3% failed',946,439,248,45,31,{bold:true,color:C.rust});
  tx(s,'26 of 32 attempts failed. Check the login records to see which accounts had repeated failures.',946,487,248,84,18,{vertical:'top'});
  foot(s,'Demonstration data from the KAVACH dashboard.');
 } else if(layout==='closing'){
  box(s,58,166,1164,147,C.plum);
  tx(s,a,82,185,1116,107,35,{bold:true,color:C.white});
  tx(s,'Next validation',58,345,1164,42,29,{bold:true,color:C.plum});
  b.forEach(([label,description],j)=>{
   tile(s,label,description,58+j*397,402,370,180,[C.white,C.lav,C.peach][j]);
  });
 } else if(layout==='metrics'){
  a.forEach(([value,label],j)=>{
   tx(s,value,58+j*397,209,350,105,85,{bold:true,color:C.rust});
   tx(s,label,58+j*397,320,350,42,28,{bold:true});
  });
  box(s,58,398,1164,43,C.lav);
  box(s,58,398,1164*26/32,43,C.rust);
  tx(s,'81.3% failed',73,402,920,35,21,{bold:true,color:C.white});
  tx(s,b,58,470,1164,76,23,{color:C.muted,vertical:'top'});
  foot(s,'Source: KAVACH administrator dashboard capture. Figures reflect the demonstration state.');
 } else if(layout==='layers'){
  a.forEach(([t,owner,d],j)=>{
   const y=188+j*106;
   box(s,58,y,395,90,j%2?C.lav:C.white);
   tx(s,t,73,y+7,364,34,23,{bold:true});
   tx(s,owner,73,y+46,364,32,19,{color:C.muted});
   tx(s,d,473,y+5,321,72,20);
   arrow(s,807,y+44,843);
  });
  box(s,861,188,361,408,C.plum);
  tx(s,'PostgreSQL',883,211,317,55,35,{bold:true,color:C.white});
  tx(s,'Shared application records',883,268,317,41,20,{color:C.white});
  ['User and login records','Anomalies and scores','Audit and analysis history'].forEach((t,j)=>{
   box(s,882,320+j*71,319,51,C.lav);tx(s,t,895,325+j*71,293,41,20,{bold:true});
  });
 } else if(layout==='table'){
  const widths=a[0].length===4?[235,589,150,190]:[333,426,405];
  const rowH=a.length>6?57:76;
  a.forEach((row,r)=>{
   const y=192+r*rowH;
   box(s,58,y,1164,rowH-4,r===0?C.plum:r%2?C.white:C.lav);
   let x=58;
   row.forEach((v,j)=>{
    tx(s,v,x+13,y+4,widths[j]-26,rowH-12,20,{bold:r===0||j===0,color:r===0?C.white:C.ink});
    x+=widths[j];
   });
  });
  foot(s,b);
 }
 const source=n===1?'Thesis metadata.tex':layout==='dashboard-demo'?'User-provided KAVACH dashboard screenshot, 17 November 2026':layout==='metrics'?'Thesis administrator dashboard screenshot (screenshot-dashboard.png)':layout==='deploy'?'Frontend package.json and backend pom.xml and application.properties':'KAVACH thesis chapters 3–5 and backend implementation';
 const speaking=compact?input.notes[i]+'\n\n':'';
 s.speakerNotes.text=speaking+'Project source: '+source+'.\nSlide style adapted from Opportunity Engine, supplied Canva reference.';
}
const draft=path.join(build,detailedArchitecture?'architecture-deck-candidate.pptx':approvedOpening?'approved-opening-candidate.pptx':aiReportDeck?'ai-report-deck-candidate.pptx':grokDeck?'grok-deck-candidate.pptx':demoDeck?'demo-deck-candidate.pptx':mergedDeck?'merged-deck-candidate.pptx':finalDeck?'final-deck-candidate.pptx':riskUpdate?'risk-update-candidate.pptx':revision?'presentation-candidate.pptx':compact?'compact-candidate.pptx':'candidate.pptx');
await (await PresentationFile.exportPptx(P)).save(draft);
console.log('Exported '+P.slides.items.length+' slides');
const preview=path.join(build,detailedArchitecture?'architecture-deck-previews':approvedOpening?'approved-opening-previews':aiReportDeck?'ai-report-deck-previews':grokDeck?'grok-deck-previews':demoDeck?'demo-deck-previews':mergedDeck?'merged-deck-previews':finalDeck?'final-deck-previews':riskUpdate?'risk-update-previews':revision?'presentation-previews':compact?'compact-previews':'previews');
await fs.mkdir(preview,{recursive:true});
for(const [i,s] of P.slides.items.entries()){
 const png=await P.export({slide:s,format:'png',scale:.75});
 await fs.writeFile(path.join(preview,String(i+1).padStart(2,'0')+'.png'),new Uint8Array(await png.arrayBuffer()));
}
