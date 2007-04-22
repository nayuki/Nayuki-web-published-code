import java.io.*;


public class dwite200501p3{

 private static String problem="31";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   int start=Integer.parseInt(in.readLine());
   int end=Integer.parseInt(in.readLine());
   int runmax=0,runcurr=0;
   for(int i=start;i<=end;i++){
    if(i%(i%10+i/10%10+i/100%10+i/1000%10+i/10000%10+i/100000%10+i/1000000%10)==0)runcurr++;
    else{
     if(runcurr>runmax)runmax=runcurr;
     runcurr=0;}}
   if(runcurr>runmax)runmax=runcurr;
   out.println(runmax);}}


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