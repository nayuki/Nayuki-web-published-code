var englishFreq=new Array(0.08167,0.01492,0.02782,0.04253,0.12702,0.02228,0.02015,0.06094,0.06966,0.00153,0.00772,0.04025,0.02406,0.06749,0.07507,0.01929,0.00095,0.05987,0.06327,0.09056,0.02758,0.00978,0.02360,0.00150,0.01974,0.00074);


function crack(){
 var freq=new Array(26);
 for(var i=0;i<freq.length;i++)freq[i]=0;
 var count=0;
 var input=document.getElementById("text").value;
 for(var i=0;i<input.length;i++){
  var c=input.charCodeAt(i);
  if(c>=65&&c<=90||c>=97&&c<=122){
   freq[(c-65)%32]++;
   count++;}}
 var key;
 if(count==0)key=0;
 else{
  for(var i=0;i<freq.length;i++)freq[i]/=count;
  var corrs=new Array(freq.length);
  key=-1;
  var max;
  for(var i=0;i<freq.length;i++){
   var temp=corrs[i]=getCorrelation(freq,i);
   if(key==-1||temp>max){
    key=i;
    max=temp;}}
  visualizeCorrelations(corrs);}
 document.getElementById("text").value=decrypt(input,key);
 document.getElementById("shift").value=key;}

function next(shift){
 document.getElementById("text").value=decrypt(document.getElementById("text").value,shift);
 document.getElementById("shift").value=(parseInt(document.getElementById("shift").value)+shift)%26;}

function decrypt(input,key){
 key=(26-key)%26;
 var output="";
 for(var i=0;i<input.length;i++){
  var c=input.charCodeAt(i);
  if(c>=65&&c<=90)output+=String.fromCharCode((c-65+key)%26+65);
  else if(c>=97&&c<=122)output+=String.fromCharCode((c-97+key)%26+97);
  else output+=input.charAt(i);}
 return output;}

function visualizeCorrelations(corrs){
 var min=corrs[0];
 var max=corrs[0];
 for(var i=1;i<corrs.length;i++){
  min=Math.min(corrs[i],min);
  max=Math.max(corrs[i],max);}
 var container=document.getElementById("correlations");
 if(container.firstChild==null){
  for(var i=0;i<corrs.length;i++)container.appendChild(document.createElement("div"));}
 var bars=container.childNodes;
 for(var i=0;i<bars.length&&i<corrs.length;i++){
  var width=(corrs[i]-min)/(max-min)*20+1;
  if(!isNaN(width))bars[i].setAttribute("style","width:"+width+"em; height:1em; background: rgb(0,0,255)");}}

function getCorrelation(freq,key){
 var sum=0;
 for(var i=0;i<freq.length;i++)sum-=Math.abs(freq[(i+key)%26]-englishFreq[i]);
 return sum;}

function isNaN(x){
 return x!=x;}