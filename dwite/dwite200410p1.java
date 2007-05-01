import java.io.*;
import java.util.StringTokenizer;


public class dwite200410p1{

 static String problem="1";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  double x1=Double.parseDouble(st.nextToken());
  double y1=Double.parseDouble(st.nextToken());
  double x2=Double.parseDouble(st.nextToken());
  double y2=Double.parseDouble(st.nextToken());
  out.printf("%.3f%n",3.14159*magnitudeSquared(x1-x2,y1-y2));}

 static double magnitudeSquared(double x,double y){
  return x*x+y*y;}


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