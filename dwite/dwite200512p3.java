import java.io.*;
import java.util.StringTokenizer;


public class dwite200512p3{

 private static String problem="31";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int n=Integer.parseInt(st.nextToken());
  int d=Integer.parseInt(st.nextToken());
  if(d<0){ // Make only the numerator be possibly negative
   d=-d;
   n=-n;}
  if(n<0){ // Write the sign and handle positive fractions from now on
   out.print('-');
   n=-n;}
  int gcd=GCD(n,d); // Reduce to lowest terms
  n/=gcd;
  d/=gcd;
  if(n>=d||n==0){
   out.print(n/d);
   n%=d;
   if(n>0)out.print(' ');}
  if(n>0)out.print(n+"/"+d);
  out.println();}


 private static int GCD(int x,int y){
  while(y!=0){
   int z=x%y;
   x=y;
   y=z;}
  return x;}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?(OutputStream)System.out:new FileOutputStream("OUT"+problem+".txt");
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