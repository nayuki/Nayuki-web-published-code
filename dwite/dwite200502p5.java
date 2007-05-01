import java.io.*;


public class dwite200502p5{

 static String problem="51";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  int h=Integer.parseInt(in.readLine());
  int d=Integer.parseInt(in.readLine())*1000;
  double c=Math.sqrt(9.8*h);
  long time=Math.round(d/c);
  out.printf("%d hour(s) %d minute(s) %d second(s)%n",time/3600,time/60%60,time%60);}


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