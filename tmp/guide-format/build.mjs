import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Presentation, PresentationFile} from '@oai/artifact-tool';

const build=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(build,'../..');
const P=Presentation.create({slideSize:{width:960,height:720}});
const W=960, H=720;
const blue='#363399', black='#000000', white='#FFFFFF', muted='#A9A9A9', ink='#181818';
const pastel={
 background:'#E9F4F6',
 cards:[white,'#FBE5D5','#EEE2F2','#E5ECDE'],
 heading:'#292332',
 body:'#504A55',
};
const sections=['Introduction','System Design','Risk Analysis','How AI Helps','Results and Discussion','Conclusion & Future Work'];
const none={fill:'none',width:0};
function rect(s,x,y,w,h,fill,stroke='none'){
 return s.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:1.2}});
}
function text(s,str,x,y,w,h,size=26,o={}){
 const shape=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:none});
 shape.text=str;
 shape.text.style={typeface:o.font??'Arial',fontSize:size,bold:o.bold??false,color:o.color??ink,alignment:o.align??'left',verticalAlignment:o.valign??'middle',insets:0,wrap:'square'};
 return shape;
}
function chrome(title,section,note){
 const s=P.slides.add();
 s.background.fill=white;
 rect(s,0,0,W,152,blue);
 rect(s,0,0,W/2,152,black);
 ['Outline',...sections].forEach((label,i)=>{
  const current=label===section;
  text(s,label,52,5+i*20,419,17,12,{color:current?white:muted,align:'right',bold:current});
 });
 if(title){
  rect(s,0,152,W,71,blue);
  text(s,title,24,161,912,52,32,{color:white});
 }
 rect(s,0,694,W/2,26,black);
 rect(s,W/2,694,W/2,26,blue);
 text(s,'Umakant Yadav (24MCA026)   ·   Supervisor: Dr. Ranjita Das',14,697,457,18,11,{color:white,align:'right'});
 text(s,'KAVACH: User Login Analysis Using LLM',492,697,390,18,11,{color:white});
 text(s,String(P.slides.items.length),887,697,60,18,11,{color:white,align:'right'});
 s.speakerNotes.text=note;
 return s;
}
function bullets(s,items,{x=83,y=272,w=800,step=72,size=24,h=62}={}){
 items.forEach((item,i)=>{
  const yy=y+i*step;
  text(s,'▸',x,yy,22,h,size,{color:blue,valign:'top'});
  text(s,item,x+30,yy,w-30,h,size,{valign:'top'});
 });
}
function arrow(s,x,y,w){
 s.shapes.add({geometry:'rightArrow',position:{left:x,top:y,width:w,height:10},fill:pastel.body,line:none});
}
function verticalArrow(s,x,y,h,bidirectional=false){
 s.shapes.add({geometry:bidirectional?'upDownArrow':'downArrow',position:{left:x,top:y,width:13,height:h},fill:pastel.body,line:none});
}
function table(s,values,x,y,widths,rowHeight,fontSize,rowFills){
 const width=widths.reduce((a,b)=>a+b,0);
 const t=s.tables.add({rows:values.length,columns:widths.length,left:x,top:y,width,height:values.length*rowHeight,columnWidths:widths,values});
 t.styleOptions={headerRow:false,bandedRows:false,firstColumn:false};
 t.borders.assign({style:'solid',fill:rowFills?'#B8C9CE':black,width:1});
 for(let r=0;r<values.length;r++){
  const fill=rowFills?.[r];
  for(let c=0;c<widths.length;c++){
   const cell=t.getCell(r,c);
   cell.fill=(Array.isArray(fill)?fill[c]:fill)??white;
   cell.text.style={typeface:'Arial',fontSize,bold:r===0||Boolean(rowFills&&(c===0||c>=2)),color:rowFills?pastel.heading:ink,alignment:c===0?'left':'center',verticalAlignment:'middle'};
  }
 }
 return t;
}
async function png(s,file,x,y,w,h,crop){
 const b=await fs.readFile(file);
 s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:'KAVACH Security Operations Dashboard demonstration',fit:crop?'cover':'contain',crop,position:{left:x,top:y,width:w,height:h}});
}

{
 const s=chrome(null,'Outline','Introduce the MCA project and acknowledge your supervisor.');
 rect(s,75,191,810,77,blue);
 text(s,'KAVACH: User Login Analysis Using LLM',89,200,782,58,32,{color:white,align:'center'});
 text(s,'Under the Supervision of',150,301,660,38,25,{align:'center'});
 text(s,'Dr. Ranjita Das, Assistant Professor, CSE Department',127,342,706,39,23,{align:'center'});
 text(s,'Presented by',150,408,660,42,25,{align:'center'});
 text(s,'Umakant Yadav (24MCA026)',150,453,660,40,26,{align:'center'});
 text(s,'Master of Computer Applications\nNational Institute of Technology Agartala\nNovember 2026',139,511,682,105,22,{align:'center'});
}
{
 const s=chrome('Presentation Outline','Outline','I’ll start with the login monitoring problem and what KAVACH solves. Then I’ll show the system architecture, walk through the rules and a risk example, and explain how Grok helps. I’ll finish with the dashboard demo and future scope.');
 const outline=[
  ['Introduction','Problem statement and what KAVACH solves'],
  ['System Architecture','Frontend, backend, database, and Grok'],
  ['Risk Analysis','Six detection rules, formula, tiers, and worked example'],
  ['How AI Helps','Grok explains alerts and suggests what to check'],
  ['Results and Discussion','KAVACH dashboard demonstration'],
  ['Conclusion & Future Scope','Key takeaway, external login logs, and Telegram alerts'],
 ];
 outline.forEach(([topic,detail],i)=>{
  const y=260+i*62;
  text(s,topic,65,y,295,46,23,{color:blue,bold:true});
  text(s,detail,372,y,522,46,20);
 });
}
{
 const s=chrome('Introduction and Problem Statement','Introduction','KAVACH monitors login activity as it happens. It records whether a sign-in succeeded or failed, along with the time, IP address, and device. One failed login might be a typo. Several failures in a short time could point to password guessing. When there are many login records, an administrator has to sort through them to decide which account to check first.');
 text(s,'Introduction',83,260,800,42,27,{color:blue,bold:true});
 bullets(s,[
  'KAVACH monitors login activity as it happens.',
  'It saves the result (success or failure), time, IP address, and device.'
 ],{y:307,step:48,h:42});
 text(s,'Problem Statement',83,417,800,42,27,{color:blue,bold:true});
 bullets(s,[
  'One failed login could be a typo.',
  'Several failures in a short time could point to password guessing.',
  'With many login records, it is hard to know which account to check first.'
 ],{y:469,step:58,h:54});
}
{
 const s=chrome('What KAVACH Solves','Introduction','Explain the four jobs in order: preserve evidence, detect anomalies, prioritize accounts, and help administrators understand alerts.');
 rect(s,0,223,960,471,pastel.background);
 const cards=[
  ['Preserves failed-login evidence','For known accounts, KAVACH records failed attempts in a separate transaction from authentication.'],
  ['Detects suspicious activity','Six predefined rules flag patterns such as repeated failures, unfamiliar devices, and off-hours logins.'],
  ['Prioritizes accounts for review','KAVACH adds anomaly points from the last 24 hours and caps the score at 100.'],
  ['Helps administrators decide what to do','Grok explains the alert in plain language and suggests what to check. The administrator decides whether to deactivate the account.'],
 ];
 cards.forEach(([heading,body],index)=>{
  const x=38+(index%2)*451;
  const y=285+Math.floor(index/2)*175;
  rect(s,x,y,433,152,pastel.cards[index]);
  text(s,heading,x+13,y+12,407,34,20,{bold:true,color:pastel.heading});
  text(s,body,x+13,y+51,407,92,20,{color:pastel.body,valign:'top'});
 });
}
{
 const s=chrome('System Architecture','System Design','Start with React. Users sign in and review their own activity. Administrators can see the dashboard and request a report. Spring Boot checks credentials with BCrypt and issues a JWT on successful login. For known accounts, the telemetry service records the result, time, IP, and device independently of the authentication transaction. The detector evaluates six rules against the saved event. When the dashboard requests risk, Spring Boot totals the last 24 hours of anomaly points and caps the score at 100. The left branch uses JPA to read and write PostgreSQL records. The right branch sends selected anomaly and linked login details to Grok in a JSON request when analysis is requested. Grok returns an explanation and recommended checks that KAVACH displays as a report.');
 rect(s,0,223,960,471,pastel.background);
 rect(s,49,240,862,61,white);
 text(s,'React frontend',65,249,212,40,22,{color:pastel.heading,bold:true});
 text(s,'Sign-in, personal login history, and administrator dashboard',281,250,609,39,20,{color:pastel.body});
 verticalArrow(s,469,305,29);
 text(s,'REST API · JWT for protected requests',489,302,400,33,16,{color:pastel.body});

 rect(s,49,341,862,168,'none','#CBDCE0');
 text(s,'Spring Boot backend',63,344,834,34,22,{color:pastel.heading,bold:true});
 const steps=[
  ['1  Authenticate','Check account status and verify the password with BCrypt.'],
  ['2  Record the login','Save result, time, IP, and device for known accounts.'],
  ['3  Detect anomalies','Apply six rules and link matches to the login.'],
  ['4  Calculate risk','Use the last 24 hours of points and cap the score at 100.'],
 ];
 steps.forEach(([label,detail],i)=>{
  const x=62+i*215;
  rect(s,x,386,191,108,pastel.cards[i]);
  text(s,label,x+9,392,173,27,18,{color:pastel.heading,bold:true,align:'center'});
  text(s,detail,x+10,421,171,66,16,{color:pastel.body,align:'center',valign:'top'});
  if(i<steps.length-1)arrow(s,x+194,436,17);
 });

 verticalArrow(s,245,513,35,true);
 text(s,'JPA · Read and write',265,516,206,28,16,{color:pastel.body});
 verticalArrow(s,700,513,35,true);
 text(s,'JSON · On request',720,516,188,28,16,{color:pastel.body});
 rect(s,49,554,413,106,pastel.cards[3]);
 text(s,'PostgreSQL',62,559,387,35,21,{color:pastel.heading,bold:true});
 text(s,'Stores accounts, login events, anomalies, audit logs, and AI report history.',62,599,387,55,18,{color:pastel.body,valign:'top'});
 rect(s,498,554,413,106,pastel.cards[2]);
 text(s,'Grok AI report',511,559,387,35,21,{color:pastel.heading,bold:true});
 text(s,'Receives alert details and returns a risk explanation and suggested checks.',511,599,387,55,18,{color:pastel.body,valign:'top'});
}
{
 const s=chrome('Six Predefined Detection Rules','Risk Analysis','Explain that the points and severity belong to an individual anomaly. More than one rule can match an event. The first stored event provides the baseline for IP and device checks.');
 rect(s,0,223,960,471,pastel.background);
 table(s,[
 ['Rule','Predefined condition','Points','Severity'],
 ['Brute force','At least 5 failures for the account in 10 minutes','+70','High'],
 ['Inactive account','An inactive account attempts to sign in','+80','Critical'],
 ['New IP','IP is unseen after earlier login activity','+40','Medium'],
 ['New device','Device is unseen after earlier login activity','+30','Medium'],
 ['Unusual time','Login occurs between 00:00 and 04:59','+25','Low'],
 ['Failed login','The login event is marked FAILED','+20','Low']
 ],55,266,[177,442,82,149],45,19,[white,pastel.cards[1],pastel.cards[1],pastel.cards[2],pastel.cards[2],pastel.cards[3],pastel.cards[3]]);
 text(s,'One login can match several rules and add points for each match.',55,602,850,50,21,{align:'center',color:pastel.body});
}
{
 const s=chrome('Risk Formula and Tiers','Risk Analysis','For each account, add the points from alerts detected in the last 24 hours. Zero recent alerts means zero points. The min function takes the smaller of the total and 100. For example, 130 points becomes 100. Find the displayed score in the table to get the tier. A score of 60 or above counts as risky on the dashboard.');
 rect(s,0,223,960,471,pastel.background);
 rect(s,55,242,850,107,pastel.cards[0]);
 text(s,'1  Add the points',71,248,818,26,20,{color:pastel.heading,bold:true});
 text(s,'Total risk = sum of alert points from the last 24 hours',71,276,818,40,27,{color:pastel.heading,bold:true});
 text(s,'Use alerts for the same account. No recent alerts gives a total of 0.',71,318,818,22,17,{color:pastel.body});
 rect(s,55,361,850,107,pastel.cards[2]);
 text(s,'2  Cap the score at 100',71,367,818,26,20,{color:pastel.heading,bold:true});
 text(s,'Final risk score = min(total risk, 100)',71,395,818,40,27,{color:pastel.heading,bold:true});
 text(s,'Take the smaller of the total risk and 100.',71,437,818,22,17,{color:pastel.body});
 rect(s,55,480,850,43,pastel.cards[1]);
 text(s,'Example · 130 total points → 100 displayed',71,485,818,32,21,{color:pastel.heading,bold:true});
 text(s,'Risk tiers',55,535,850,28,20,{color:pastel.heading,bold:true});
 const tierFills=[pastel.cards[3],pastel.cards[2],pastel.cards[1],pastel.cards[1]];
 table(s,[
 ['Low','Medium','High','Critical'],
 ['0–29','30–59','60–79','80–100']
 ],55,566,[212,213,213,212],34,18,[tierFills,tierFills]);
 text(s,'The dashboard counts accounts scoring 60 or above as risky.',55,645,850,30,19,{color:pastel.body});
}
{
 const s=chrome('Worked Risk Example','Risk Analysis','Assume the account has earlier login history, zero recent risk points, and a familiar device. At 02:15 the first failed sign-in comes from a new IP. It adds 20 for failed login, 25 for unusual time, and 40 for the new IP. That makes 85, which is already Critical. At 02:16, five more attempts from the same IP each add 45 for failed login and unusual time. Two of those attempts are the fifth and sixth failures overall, so they each add 70 for brute force. The complete raw total is 85 plus 225 plus 140, or 450. KAVACH displays 100 because of the cap.');
 rect(s,0,223,960,471,pastel.background);
 text(s,'Example · An account starts at 0 risk points',55,241,850,37,23,{color:pastel.heading,bold:true});
 rect(s,55,291,407,261,pastel.cards[0]);
 rect(s,479,291,426,261,pastel.cards[2]);
 text(s,'02:15 · First failed login',71,305,375,39,24,{color:pastel.heading,bold:true});
 text(s,'The account uses a familiar device from a new IP.',71,353,375,49,19,{color:pastel.body,valign:'top'});
 text(s,'20 failed login + 25 unusual time\n+ 40 new IP',71,416,375,66,21,{color:pastel.heading,bold:true,valign:'top'});
 text(s,'85 points · Critical',71,493,375,44,25,{color:pastel.heading,bold:true});
 text(s,'02:16 · Five more failures',495,305,394,39,24,{color:pastel.heading,bold:true});
 text(s,'All five use the same IP and device.',495,353,394,49,19,{color:pastel.body,valign:'top'});
 text(s,'5 × (20 + 25) = 225 for failures and off-hours\n2 × 70 = 140 for brute force',495,411,394,63,18,{color:pastel.heading,bold:true,valign:'top'});
 text(s,'Brute force matches on failures 5 and 6 overall.',495,491,394,47,18,{color:pastel.body});
 rect(s,55,573,850,85,pastel.cards[1]);
 text(s,'85 + 225 + 140 = 450 raw points',71,585,470,58,25,{color:pastel.heading,bold:true});
 arrow(s,538,609,36);
 text(s,'100 displayed · Critical',596,585,292,58,24,{color:pastel.heading,bold:true});
}
{
 const s=chrome('How AI Helps','How AI Helps','On an alert, select Analyze with AI Engine. The backend builds a prompt from the selected anomaly and linked login details, sends it in a JSON request, and parses the structured response. The report explains the risk, indicators, possible implications, and what to check. The backend rules assign points separately.');
 bullets(s,[
 'The backend sends anomaly and linked login details to Grok in a JSON request.',
 'Grok returns a report explaining why the activity may be suspicious and suggesting what to check.',
 'Example. For a New IP alert, compare the IP and device with the account’s earlier logins.'
 ],{y:277,step:95,h:83,size:25});
 text(s,'KAVACH calculates the score. Grok explains the evidence.',65,596,830,43,22,{align:'center',color:blue});
}
{
 const s=chrome('Results and Discussion','Results and Discussion','These numbers are from a dashboard demonstration, not controlled evaluation. Point out that 26 of 32 sessions failed. An administrator can use Login Telemetry to find the repeated failures and open any related anomalies.');
 const source=path.join(root,'output/pdf/KAVACH_Report/images/screenshot-dashboard.png');
 await png(s,source,96,239,768,374,{left:338/1917,top:104/867,right:29/1917,bottom:10/867});
 text(s,'Figure: KAVACH dashboard demonstration · 17 November 2026',46,617,868,31,18,{align:'center',color:blue});
 text(s,'11 monitored users   ·   26 of 32 logins failed (81.3%)   ·   35 anomalies',46,650,868,29,20,{align:'center'});
}
{
 const s=chrome('Conclusion','Conclusion & Future Work','Bring the presentation back to the original problem. An account score points to the underlying login evidence. An administrator can make and audit a decision using that evidence.');
 bullets(s,[
 'KAVACH helps administrators decide which accounts need review and shows the login evidence behind each alert.',
 'An administrator can compare activity, deactivate an account when warranted, and review the action in the audit trail.',
 'Users can review their own login history, alerts, and risk.'
 ],{y:295,step:94,h:82,size:25});
}
{
 const s=chrome('Future Scope','Conclusion & Future Work','Today KAVACH monitors its own website. In the future, I would collect sign-in records from other web apps, identity providers, and VPNs through live feeds or batch imports. I would match verified accounts and count each login once. A Telegram bot could notify the administrator when an account reaches High or Critical risk and include a link to the report in KAVACH.');
 const scope=[
  ['Log collection','Bring in sign-in logs from other applications, single sign-on providers, and VPNs through live feeds or batch imports.'],
  ['Account matching','Link verified accounts across systems and count each login once.'],
  ['Telegram alerts','Use a bot to notify administrators of High or Critical risk and link to the KAVACH report.'],
 ];
 scope.forEach(([label,detail],i)=>{
  const y=316+i*85;
  text(s,'▸',83,y,22,64,24,{color:blue,valign:'top'});
  const item=text(s,`${label}. ${detail}`,113,y,774,64,24,{valign:'top'});
  item.text.get(`${label}.`).bold=true;
 });
}
{
 const s=chrome(null,'Conclusion & Future Work','Thank the committee and invite questions.');
 text(s,'THANK YOU!',66,354,828,84,47,{align:'center'});
}
const candidate=path.join(build,'guide-candidate.pptx');
await (await PresentationFile.exportPptx(P)).save(candidate);
const previews=path.join(build,'render');
await fs.mkdir(previews,{recursive:true});
for(const [i,s] of P.slides.items.entries()){
 const png=await P.export({slide:s,format:'png',scale:1});
 await fs.writeFile(path.join(previews,String(i+1).padStart(2,'0')+'.png'),new Uint8Array(await png.arrayBuffer()));
}
