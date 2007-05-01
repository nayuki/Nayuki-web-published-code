import java.io.*;
import java.util.*;


public class dwite200411p4{

 static String problem="41";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  int sum;
  int start,finish;
  List<String> formula=new ArrayList<String>();

  StringTokenizer st;
  st=new StringTokenizer(in.readLine()," "); // "sum = value"
  st.nextToken(); // Discard "sum"
  st.nextToken(); // Discard "="
  sum=Integer.parseInt(st.nextToken());
  st=new StringTokenizer(in.readLine()," "); // "For i = start To finish"
  st.nextToken(); // Discard "For"
  st.nextToken(); // Discard "i"
  st.nextToken(); // Discard "="
  start=Integer.parseInt(st.nextToken());
  st.nextToken(); // Discard "To"
  finish=Integer.parseInt(st.nextToken());
  st=new StringTokenizer(in.readLine()," "); // "sum = formula"
  st.nextToken(); // Discard "sum"
  st.nextToken(); // Discard "="
  while(st.hasMoreTokens())formula.add(st.nextToken());
  in.readLine(); // Discard "Next i"

  for(int i=start;i<=finish;i++){
   Stack<Integer> operands=new Stack<Integer>();
   Stack<Character> operators=new Stack<Character>();
   for(String token:formula){
    // Operators
    if     (token.equals("+")||token.equals("-" )){
     while(!operators.empty()&&(operators.peek()=='+'||operators.peek()=='-'||operators.peek()=='*'||operators.peek()=='\\')){
      int y=operands.pop();
      int x=operands.pop();
      operands.push(evaluate(x,y,operators.pop()));}
     operators.push(token.charAt(0));}
    else if(token.equals("*")||token.equals("\\")){
     while(!operators.empty()&&(operators.peek()=='*'||operators.peek()=='\\')){
      int y=operands.pop();
      int x=operands.pop();
      operands.push(evaluate(x,y,operators.pop()));}
     operators.push(token.charAt(0));}
    else{ // Values
     int value;
     if     (token.equals("sum") )value=sum;
     else if(token.equals("i")   )value=i;
     else if(token.charAt(0)=='(')value=Integer.parseInt(token.substring(1,token.length()-1));
     else                         value=Integer.parseInt(token);
     operands.push(value);}}
   while(!operators.empty()){
    int y=operands.pop();
    int x=operands.pop();
    operands.push(evaluate(x,y,operators.pop()));}
   sum=operands.pop();}

  out.println(sum);}

 static int evaluate(int x,int y,char op){
  switch(op){
   case '+' : return x+y;
   case '-' : return x-y;
   case '*' : return x*y;
   case '\\': return x/y;
   default: throw new AssertionError();}}


 public static void main(String[] args) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  for(int i=0;i<5;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}}