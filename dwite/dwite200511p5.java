import java.io.*;
import java.util.StringTokenizer;


public class dwite200511p5{

 private static String problem="51";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  String line=in.readLine();
  for(int i=0;i<line.length();i+=4){
   int n=fromBase64(line.charAt(i))<<18|fromBase64(line.charAt(i+1))<<12|fromBase64(line.charAt(i+2))<<6|fromBase64(line.charAt(i+3));
   if(line.charAt(i+3)!='=')out.print((char)(n>>>16)+""+(char)(n>>>8&0xFF)+""+(char)(n&0xFF));
   else if(line.charAt(i+2)!='=')out.print((char)(n>>>16)+""+(char)(n>>>8&0xFF));
   else out.print((char)(n>>>16));}
  out.println();}


 private static int fromBase64(char c){
  if(c>='A'&&c<='Z')return c-'A';
  if(c>='a'&&c<='z')return c-'a'+26;
  if(c>='0'&&c<='9')return c-'0'+52;
  if(c=='+')return 62;
  if(c=='/')return 63;
  if(c=='=')return 0;
  return -1;}


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