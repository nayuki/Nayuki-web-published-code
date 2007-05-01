import java.io.*;
import java.util.StringTokenizer;


public class dwite200410p4{

 static String problem="4";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int capacity=Integer.parseInt(st.nextToken()); // Variable A
  int files=Integer.parseInt(st.nextToken()); // Variable n
  boolean[] possible=new boolean[capacity+1];
  possible[0]=true;
  for(int i=0;i<files;i++){
   int filesize=Integer.parseInt(st.nextToken()); // Variable s_{i+1}
   for(int j=capacity-filesize;j>=0;j--)possible[j+filesize]|=possible[j];}
  for(int i=capacity;i>=0;i--){
   if(possible[i]){ // Guaranteed to execute before the loop ends
    out.println(i);
    break;}}}


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