import java.io.*;


public class ecoo2005boardwidep1{

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   int x=Integer.parseInt(in.readLine());
   int y=1;
   for(int i=2;i<=x;i++)y*=i/GCF(y,i);
   out.println(y);}}

 private static int GCF(int x,int y){
  while(y!=0){
   int z=x%y;
   x=y;
   y=z;}
  return x;}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA11.txt");
  OutputStream out0=System.out;
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  main(in2,out3);
  in2.close();
  in1.close();
  out3.close();
  out2.close();
  out1.close();}}