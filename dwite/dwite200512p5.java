import java.io.*;
import java.util.StringTokenizer;


public class dwite200512p5{

 private static String problem="51";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  int t=Integer.parseInt(in.readLine());
  int n=Integer.parseInt(in.readLine());
  int[] list=new int[12];
  int[] rep=new int[12];
  int listlen=0;
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  for(int i=0;i<n;i++){
   int x=Integer.parseInt(st.nextToken());
   if(listlen==0||x!=list[listlen-1]){
    list[listlen]=x;
    rep[listlen]=1;
    listlen++;}
   else rep[listlen-1]++;}
  int comb=1; // Number of possibilities to try
  for(int i=0;i<listlen;i++)comb*=(rep[i]+1);
  int p=0;
  for(int i=0;i<comb;i++){
   int s=0;
   for(int j=0,k=i;j<listlen;k/=(rep[j]+1),j++)s+=list[j]*(k%(rep[j]+1));
   if(s==t)p++;}
  out.println(p);}


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