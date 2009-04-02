var starttime;
var beatcount;
var beattime=new Array(16);
var xsum;
var xxsum;
var ysum;
var yysum;
var xysum;
var periodprev,aprev,bprev;
var isDone;

init();


function beat(e){
 if(!isDone)countBeat(new Date().getTime());
 return true;}

function countBeat(currtime){
 if(beatcount==0)starttime=currtime;
 var x=beatcount;
 var y=currtime-starttime;
 if(beatcount==beattime.length)beattime=increaseCapacity(beattime);
 beattime[beatcount]=y;
 beatcount++;
 xsum+=x;
 xxsum+=x*x;
 ysum+=y;
 yysum+=y*y;
 xysum+=x*y;
 document.getElementById("smpbeat").value=beatcount;
 var period=y/x;
 var tempo=60000*x/y;
 if(beatcount<8||tempo<190)document.getElementById("smppos").value=Math.floor(x/4)+" : "+x%4;
 else document.getElementById("smppos").value=Math.floor(x/8)+" : "+Math.floor(x/2)%4+"."+x%2*5;
 document.getElementById("smptime").value=floatToString(y/1000,3);
 if(beatcount>=2){
  document.getElementById("smptempo").value=floatToString(tempo,2);
  document.getElementById("smpperiod").value=floatToString(period,2);
  var xx=beatcount*xxsum-xsum*xsum;
  var yy=beatcount*yysum-ysum*ysum;
  var xy=beatcount*xysum-xsum*ysum;
  var a=(beatcount*xysum-xsum*ysum)/xx;
  var b=(ysum*xxsum-xsum*xysum)/xx;
  document.getElementById("advperiod").value=floatToString(a,3);
  document.getElementById("advoffset").value=floatToString(b,3);
  document.getElementById("advcor").value=floatToString(xy*xy/(xx*yy),9);
  if(beatcount>=3){
  document.getElementById("smplastdev").value=floatToString(periodprev*x-y,1);
   document.getElementById("advstddev").value=floatToString(Math.sqrt(((yy-xy*xy/xx)/beatcount)/(beatcount-2)),3);
   document.getElementById("advlastdev").value=floatToString(aprev*x+bprev-y,1);}
  document.getElementById("advtempo").value=floatToString(60000*xx/(beatcount*xysum-xsum*ysum),3);
  periodprev=period;
  aprev=a;
  bprev=b;}}


function done(){
 isDone=true;
 document.getElementById("smppos").value="";
 document.getElementById("smplastdev").value="";
 document.getElementById("advlastdev").value="";}

function init(){
 beatcount=0;
 xsum=0;
 xxsum=0;
 ysum=0;
 yysum=0;
 xysum=0;
 isDone=false;}


function floatToString(x,d){ // d: Number of decimal places
 if(x<0)return "-"+floatToString(-x,d);
 var m=Math.pow(10,d);
 var tp=Math.round(x%1*m);
 var s="";
 for(var i=0;i<d;i++){
  s=tp%10+s;
  tp=Math.floor(tp/10);}
 return Math.floor(Math.round(x*m)/m)+"."+s;}

function increaseCapacity(a){
 var b=new Array(a.length*2);
 for(var i=0;i<a.length;i++)b[i]=a[i];
 return b;}