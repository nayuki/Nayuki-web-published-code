import java.io.*;
import java.math.BigInteger;


public class dwite200410p5{

 static String problem="5";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  out.println(new BigInteger(in.readLine()).add(new BigInteger(in.readLine())));
//  out.println(add(in.readLine(),in.readLine()));
 }

 static String add(String x,String y){ // x and y each must have at least 1 digit
  StringBuffer sb=new StringBuffer();
  int carry=0;
  for(int i=0;i<Math.max(x.length(),y.length());i++){
   int sum=carry;
   if(i<x.length())sum+=x.charAt(x.length()-1-i)-'0';
   if(i<y.length())sum+=y.charAt(y.length()-1-i)-'0';
   sb.insert(0,sum%10);
   carry=sum/10;}
  if(carry>0)sb.insert(0,carry);
  return sb.toString();}


 public static void main(String[] args) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem);
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem);
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