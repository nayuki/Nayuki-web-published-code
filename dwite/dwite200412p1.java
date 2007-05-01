import java.io.*;


public class dwite200412p1{

 static String problem="11";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  out.println(factor(Integer.parseInt(in.readLine())));}

 static String factor(int x){
  for(int i=2,end=sqrt(x);i<=end;i++){
   if(x%i==0)return i+"*"+factor(x/i);}
  return Integer.toString(x);}


 static int sqrt(int x){
  int y=0;
  for(int i=15;i>=0;i--){
   y|=1<<i;
   if(y>46340||y*y>x)y^=1<<i;}
  return y;}


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