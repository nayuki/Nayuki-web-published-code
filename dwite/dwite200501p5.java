import java.io.*;
import java.util.StringTokenizer;


public class dwite200501p5{

 private static String problem="51";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   String tp=st.nextToken();
   int a=Integer.parseInt(tp,Integer.parseInt(st.nextToken()));
   st=new StringTokenizer(in.readLine()," ");
   tp=st.nextToken();
   int b=Integer.parseInt(tp,Integer.parseInt(st.nextToken()));
   out.println(Integer.toString(a*b,Integer.parseInt(in.readLine())));}}


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