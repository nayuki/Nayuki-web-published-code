import java.io.*;
import java.util.StringTokenizer;


public class dwite200510p3{

 private static String problem="31";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int a=Integer.parseInt(st.nextToken());
  int b=Integer.parseInt(st.nextToken());
  if(a>b){
   int tp=a;
   a=b;
   b=tp;}
  int s=b*(b+1)/2-a*(a-1)/2; // Alternatively, (b-a+1)*a+(b-a)*(b-a+1)/2
  StringBuffer sb=new StringBuffer();
  for(;a<=b;a++){
   sb.append(a);
   if(a!=b)sb.append('+');}
  sb.append('=').append(s);
  out.println(sb.toString());}


 public static void main(String[] arg) throws IOException{
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