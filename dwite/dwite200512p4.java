import java.io.*;


public class dwite200512p4{

 private static String problem="41";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  String line=in.readLine();
  int[] freq=new int[26];
  for(int i=0;i<line.length();i++){
   char c=line.charAt(i);
   if(c>='A'&&c<='Z'||c>='a'&&c<='z')freq[(c-'A')%32]++;}
  boolean initial=true;
  for(int i=0;i<freq.length;i++){
   if(freq[i]>0){
    if(!initial)out.print(':');
    else initial=false;
    out.print((char)('A'+i)+"-"+freq[i]);}}
  out.println();}


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