import java.io.*;
import java.util.StringTokenizer;


public class dwite200511p1{

 private static String problem="11";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  double xf=0,yf=0;
  for(int i=0;i<4;i++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   xf+=Double.parseDouble(st.nextToken());
   yf+=Double.parseDouble(st.nextToken());}
  int x=(int)Math.round(xf*25);
  int y=(int)Math.round(yf*25);
  out.println(x/100+"."+Math.abs(x)/10%10+Math.abs(x)%10+" "+y/100+"."+Math.abs(y)/10%10+Math.abs(y)%10);}


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