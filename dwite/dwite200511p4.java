import java.io.*;
import java.util.StringTokenizer;


public class dwite200511p4{

 private static String problem="41";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  int[] min=new int[32001];
  for(int i=1;i<min.length;i++)min[i]=-1;
  int n=Integer.parseInt(in.readLine());
  for(int i=0;i<n;i++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   int h=Integer.parseInt(st.nextToken());
   int m=Integer.parseInt(st.nextToken());
   for(int j=min.length-1;j>=0;j--){
    if(min[j]==-1)continue;
    for(int k=1;k<=m&&j+k*h<min.length;k++){
     if(min[j+k*h]==-1||min[j+k*h]>min[j]+k)min[j+k*h]=min[j]+k;}}}
  int t=Integer.parseInt(in.readLine());
  out.println(min[t]);}


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