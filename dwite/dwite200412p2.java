import java.io.*;
import java.util.StringTokenizer;


public class dwite200412p2{

 private static String problem="21";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   int n=Integer.parseInt(in.readLine());
   int s=Integer.parseInt(in.readLine());
   int[] yield=readLots(in,sqrt(n));
   out.println(findMaximum(yield,sqrt(n),sqrt(s)));}}

 private static int[] readLots(BufferedReader in,int sqrtn) throws IOException{
  int[] yield=new int[sqrtn*sqrtn];
  for(int y=0;y<sqrtn;y++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   for(int x=0;x<sqrtn;x++)yield[y*sqrtn+x]=Integer.parseInt(st.nextToken());}
  return yield;}

 private static int findMaximum(int[] yield,int sqrtn,int sqrts){
  int end=sqrtn-sqrts;
  int max=0;
  for(int y=0;y<=end;y++){
   int sum=0;
   for(int yy=0;yy<sqrts;yy++){
    int off=(y+yy)*sqrtn;
    for(int xx=0;xx<sqrts-1;xx++)sum+=yield[off+xx];}
   for(int x=0;x<=end;x++){
    int off=y*sqrtn+x+sqrts-1;
    for(int yy=0;yy<sqrts;yy++)sum+=yield[off+yy*sqrtn];
    if(sum>max)max=sum;
    off=y*sqrtn+x;
    for(int yy=0;yy<sqrts;yy++)sum-=yield[off+yy*sqrtn];}}
  return max;}

 private static int sqrt(int x){
  int y=0;
  for(int i=15;i>=0;i--){
   y|=1<<i;
   if(y>46340||y*y>x)y^=1<<i;}
  return y;}


 public static void main(String[] arg) throws IOException{
  Object[] streams;
  streams=diskStreams();
  InputStreamReader in1=new InputStreamReader((InputStream)streams[0],"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream((OutputStream)streams[1]);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  main(in2,out3);
  in2.close();
  in1.close();
  out3.close();
  out2.close();
  out1.close();}

 private static Object[] diskStreams() throws IOException{
  return new Object[]{new FileInputStream("DATA"+problem+".txt"),new FileOutputStream("OUT"+problem+".txt")};}}