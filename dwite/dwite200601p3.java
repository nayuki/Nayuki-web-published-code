import java.io.*;
import java.util.StringTokenizer;


public class dwite200601p3{

 private static String problem="31";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  int n=Integer.parseInt(in.readLine());
  String[] name=new String[n];
  int[][] stat=new int[8][n];
  for(int i=0;i<n;i++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   st.nextToken(); // Discard player number
   name[i]=st.nextToken(); // Last name
   name[i]=st.nextToken()+" "+name[i]; // First name
   for(int j=0;j<8;j++)stat[j][i]=Integer.parseInt(st.nextToken());}
  out.println(name[maxIndex(stat,1)]);
  out.println(name[maxIndex(stat,2)]);
  out.println(name[minIndex(stat,4)]);
  out.println(name[maxIndex(stat,5)]);
  out.println(name[maxIndex(stat,6)]);}


 private static int maxIndex(int[][] stat,int i){
  int max=Integer.MIN_VALUE;
  int maxind=-1;
  for(int j=0;j<stat[i].length;j++){
   if(stat[i][j]>max){
    max=stat[i][j];
    maxind=j;}}
  return maxind;}

 private static int minIndex(int[][] stat,int i){
  int min=Integer.MAX_VALUE;
  int minind=-1;
  for(int j=0;j<stat[i].length;j++){
   if(stat[i][j]<min){
    min=stat[i][j];
    minind=j;}}
  return minind;}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  for(int i=0;i<1;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}}