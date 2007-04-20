import java.io.*;
import java.util.StringTokenizer;


public class dwite200510p5{

 private static String problem="51";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int d1=Integer.parseInt(st.nextToken());
  int d2=Integer.parseInt(st.nextToken());
  int[] dig=new int[d1];
  int div=0;
  for(int i=0,e=factorial(d1);i<e;i++){
   for(int j=0;j<d1;j++)dig[j]=j+1;
   permute(dig,i);
   if(toNumber(dig)%d2==0)div++;}
  out.println(div);}


 private static int factorial(int x){
  int p=1;
  for(;x>=2;x--)p*=x;
  return p;}

 private static void permute(int[] a,int p){
  for(int i=a.length-1;i>=0;i--){
   int tp=a[i];
   a[i]=a[p%(i+1)];
   a[p%(i+1)]=tp;
   p/=i+1;}}

 private static int toNumber(int[] dig){
  int s=0;
  for(int i=dig.length-1;i>=0;i--)s=s*10+dig[i];
  return s;}


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