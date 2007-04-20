import java.io.*;
import java.util.StringTokenizer;


public class dwite200602p1{

 private static String problem="11";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static int[] px,py;

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int x1=Integer.parseInt(st.nextToken());
  int y1=Integer.parseInt(st.nextToken());
  int x2=Integer.parseInt(st.nextToken());
  int y2=Integer.parseInt(st.nextToken());
  int n=0;
  for(int i=0;i<px.length;i++){
   if((px[i]-x1)*(py[i]-y2)==(px[i]-x2)*(py[i]-y1))n++;}
  out.println(n);}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  int n=Integer.parseInt(in2.readLine());
  px=new int[n];
  py=new int[n];
  for(int i=0;i<n;i++){
   StringTokenizer st=new StringTokenizer(in2.readLine()," ");
   px[i]=Integer.parseInt(st.nextToken());
   py[i]=Integer.parseInt(st.nextToken());}
  for(int i=0;i<5;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}}