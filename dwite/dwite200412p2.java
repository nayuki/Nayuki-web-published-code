import java.io.*;
import java.util.StringTokenizer;


public class dwite200412p2{

 static String problem="21";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  int n=Integer.parseInt(in.readLine());
  int s=Integer.parseInt(in.readLine());
  int sqrtn=sqrt(n);
  int sqrts=sqrt(s);
  int[][] map=new int[sqrtn][sqrtn];
  for(int y=0;y<map.length;y++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   for(int x=0;x<map[y].length;x++)map[y][x]=Integer.parseInt(st.nextToken());}
  int max=0;
  for(int y=0;y+sqrts<=sqrtn;y++){
   for(int x=0;x+sqrts<=sqrtn;x++)max=Math.max(sum(map,x,y,sqrts,sqrts),max);}
  out.println(max);}


 static int sum(int[][] map,int x,int y,int w,int h){
  int sum=0;
  for(int i=0;i<h;i++){
   for(int j=0;j<w;j++)sum+=map[y+i][x+j];}
  return sum;}

 static int sqrt(int x){
  int y=0;
  for(int i=15;i>=0;i--){
   y|=1<<i;
   if(y>46340||y*y>x)y^=1<<i;}
  return y;}


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