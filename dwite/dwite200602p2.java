import java.io.*;


public class dwite200602p2{

 private static String problem="21";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  boolean[] possible=new boolean[1441];
  possible[0]=true;
  int n=Integer.parseInt(in.readLine());
  for(int i=0;i<n;i++){
   int size=Integer.parseInt(in.readLine());
   for(int j=possible.length-1;j>=0;j--){
    if(possible[j]&&j+size<possible.length)possible[j+size]=true;}}
  for(int i=possible.length-1;i>=0;i--){
   if(possible[i]){
    out.println(1440-i);
    break;}}}


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