import java.io.*;


public class dwite200411p5{

 static String problem="51";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  int temp=Integer.parseInt(in.readLine()); // Variable Tair
  int wind=Integer.parseInt(in.readLine()); // Variable V10metre
  long wct=Math.round(13.12+0.6215*temp-11.37*Math.pow(wind,0.16)+0.3965*temp*Math.pow(wind,0.16));
  String rating;
  if     (wct>-10)rating="LOW";
  else if(wct>-25)rating="MODERATE";
  else if(wct>-45)rating="COLD";
  else if(wct>-60)rating="EXTREME";
  else            rating="DANGER";
  out.printf("%d %s%n",wct,rating);}


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