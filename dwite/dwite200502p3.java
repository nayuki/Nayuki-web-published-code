import java.io.*;


public class dwite200502p3{

 private static String problem="31";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   int n=Integer.parseInt(in.readLine());
   int d=Integer.parseInt(in.readLine());
   int gcf=GCF(n,d);
   n/=gcf;
   d/=gcf;
   do{
    int tp=n/d;
    out.print(tp);
    tp=n-tp*d;
    if(tp==0)break;
    n=d;
    d=tp;
    out.print(' ');}
   while(true);
   out.println();}}

 private static int GCF(int x,int y){
  while(y!=0){
   int z=x%y;
   x=y;
   y=z;}
  return x;}


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