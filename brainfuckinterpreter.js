var runinstance=0;

var program;
var programcounter;
var data;
var dataindex;
var input;
var inputindex;
var output;
var hexoutput;
var execsteps;

function run(){
 program=compileProgram(document.getElementById("program").value);
 if(program==null)return;
 programcounter=0;
 data=new Array(0);
 dataindex=0;
 input=document.getElementById("input").value;
 inputindex=0;
 output="";
 document.getElementById("output").value=output;
 hexoutput=document.getElementById("hexOutput").checked;
 execsteps=0;
 execute(runinstance,20000);}

function execute(ri,steps){
 if(runinstance!=ri)return;
 var outputchanged=false;
 outer:
 for(var i=0;i<steps&&programcounter<program.length;i++,execsteps++){
  switch(program[programcounter]){
   case 0:
    dataindex++;
    programcounter++;
    break;
   case 1:
    dataindex--;
    programcounter++;
    break;
   case 2:
    setData((getData()+1)&0xFF);
    programcounter++;
    break;
   case 3:
    setData((getData()-1)&0xFF);
    programcounter++;
    break;
   case 4:
    if(!hexoutput)output+=String.fromCharCode(getData());
    else{
     var temp=getData().toString(16).toUpperCase();
     while(temp.length<2)temp="0"+temp;
     output+=temp+" ";}
    outputchanged=true;
    programcounter++;
    break;
   case 5:
/*
    if(inputindex==input.length){
     alert("Error: Attempted to read past end of input");
     programcounter=program.length;
     break outer;}
*/
    if(inputindex==input.length)setData(0);
    else{
     if(input.charCodeAt(inputindex)>=256){
      alert("Error: Input character has code greater than 255");
      programcounter=program.length;
      break outer;}
     setData(input.charCodeAt(inputindex));
     inputindex++;}
    programcounter++;
    break;
   case 6:
    if(getData()==0)programcounter=program[programcounter+1]+2;
    else programcounter+=2;
    break;
   case 7:
    if(getData()!=0)programcounter=program[programcounter+1]+2;
    else programcounter+=2;
    break;
   default:
    alert("Assertion error");
    programcounter=program.length;
    break outer;}}
 if(outputchanged)document.getElementById("output").value=output;
 document.getElementById("execSteps").value=execsteps+"";
 if(programcounter!=program.length)setTimeout("execute("+ri+","+steps+")",10);
 else{ // Done execution
  runinstance++;}}

function stop(){
 runinstance++;}


function compileProgram(str){
 var result=new Array(0);
 var openbrackets=new Array(0);
 var openbracketslen=0;
 for(var i=0;i<str.length;i++){
  var command;
  switch(str.charAt(i)){
   case '>': command=0; break;
   case '<': command=1; break;
   case '+': command=2; break;
   case '-': command=3; break;
   case '.': command=4; break;
   case ',': command=5; break;
   case '[': command=6; break;
   case ']': command=7; break;
   default:  command=-1; break;}
  if(command!=-1)result[result.length]=command;
  if(command==6){
   openbrackets[openbracketslen]=result.length-1;
   openbracketslen++;
   result[result.length]=-1;} // Placeholder
  else if(command==7){
   if(openbracketslen==0){
    alert("Mismatched brackets");
    return null;}
   result[openbrackets[openbracketslen-1]+1]=result.length-1;
   result[result.length]=openbrackets[openbracketslen-1];
   openbracketslen--;}}
 if(openbracketslen>0){
  alert("Mismatched brackets");
  return null;}
 return result;}

function getData(){
 if(data[dataindex]==undefined)data[dataindex]=0;
 return data[dataindex];}

function setData(value){
 data[dataindex]=value;}