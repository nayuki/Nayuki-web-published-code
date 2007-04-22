import java.io.*;
import java.util.StringTokenizer;


public class dwite200411p4{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA41.txt");
  out0=new FileOutputStream("OUT41.txt");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   st.nextToken();
   st.nextToken();
   int sum=Integer.parseInt(st.nextToken());
   st=new StringTokenizer(in.readLine()," ");
   st.nextToken();
   st.nextToken();
   st.nextToken();
   int s=Integer.parseInt(st.nextToken());
   st.nextToken();
   int e=Integer.parseInt(st.nextToken());
   st=new StringTokenizer(in.readLine()," ");
   st.nextToken();
   st.nextToken();
   int[] opcodes=compile(st);
   for(int i=s;i<=e;i++)sum=eval(opcodes,sum,i);
   in.readLine(); // Discard "Next i"
   out.println(sum);}
  in.close();
  in1.close();
  in0.close();
  out.close();
  out2.close();
  out1.close();
  out0.close();}


 private static int[] compile(StringTokenizer st){
  int[] opcodes=new int[0];
  int[] stack=new int[256]; // Operator stack
  int stacklen=0;
  while(st.hasMoreTokens()){
   String s=st.nextToken();
   if(s.charAt(0)>='0'&&s.charAt(0)<='9')opcodes=append(opcodes,Integer.parseInt(s)+65536);
   if(s.charAt(0)=='(')opcodes=append(opcodes,Integer.parseInt(s.substring(1,s.length()-1))+65536);
   if(s.equals("sum"))opcodes=append(opcodes,0);
   if(s.equals("i"))opcodes=append(opcodes,1);
   if(s.equals("+")){
    while(stacklen>0)opcodes=append(opcodes,stack[--stacklen]);
    stack[stacklen++]=2;}
   if(s.equals("-")){
    while(stacklen>0)opcodes=append(opcodes,stack[--stacklen]);
    stack[stacklen++]=3;}
   if(s.equals("*")){
    if(stacklen>0&&stack[stacklen-1]>=4)opcodes=append(opcodes,stack[--stacklen]);
    stack[stacklen++]=4;}
   if(s.equals("\\")){
    if(stacklen>0&&stack[stacklen-1]>=4)opcodes=append(opcodes,stack[--stacklen]);
    stack[stacklen++]=5;}}
  while(stacklen>0)opcodes=append(opcodes,stack[--stacklen]);
  return opcodes;}

 private static int eval(int[] opcodes,int sum,int i){
  int[] stack=new int[256]; // Operand stack
  int stacklen=0;
  for(int ii=0;ii<opcodes.length;ii++){
   switch(opcodes[ii]){
    case 2: stack[(--stacklen)-1]=stack[stacklen-1]+stack[stacklen]; break;
    case 3: stack[(--stacklen)-1]=stack[stacklen-1]-stack[stacklen]; break;
    case 4: stack[(--stacklen)-1]=stack[stacklen-1]*stack[stacklen]; break;
    case 5: stack[(--stacklen)-1]=stack[stacklen-1]/stack[stacklen]; break;
    case 0: stack[stacklen++]=sum; break;
    case 1: stack[stacklen++]=i; break;
    default: stack[stacklen++]=opcodes[ii]-65536; break;}}
  return stack[0];}

 private static int[] append(int[] in,int item){
  int[] out=new int[in.length+1];
  int i;
  for(i=0;i<in.length;i++)out[i]=in[i];
  out[i]=item;
  return out;}


 private static InputStream in0;
 private static OutputStream out0;

 private static InputStreamReader in1;
 private static BufferedOutputStream out1;
 private static OutputStreamWriter out2;

 private static BufferedReader in;
 private static PrintWriter out;}