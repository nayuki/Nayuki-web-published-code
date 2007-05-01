import java.io.*;


public class dwite200410p2{

 static String problem="2";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  String line=in.readLine();
  int h=Integer.parseInt(line.substring(0,2));
  String ap;
  if(h<12){
   ap="AM";}
  else{
   ap="PM";
   h-=12;}
  if(h==0)h=12;
  out.printf("%d:%s %s%n",h,line.substring(3,5),ap);}


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