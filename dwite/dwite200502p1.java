import java.io.*;


public class dwite200502p1{

 private static String problem="11";


 private static int[] x={1,-1,-2,2,2,-2,-3,1,3,-1,-4,3,4,-4,-4,4,2,-4,-2,1};
 private static int[] y={1,2,-1,-2,2,3,-3,-3,3,4,-2,-5,5,5,-5,-5,4,1,-4,-1};

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   String s=in.readLine();
   int a=s.charAt(0)-'A',b=s.charAt(1)-'A',c=s.charAt(2)-'A',d=s.charAt(3)-'A';
   long area=Math.round(calculateArea(a,b,c,d)*10);
   out.println(area/10+"."+area%10);}}

 private static double calculateArea(int A,int B,int C,int D){
  int tp=distSqr(B,C)+distSqr(D,A)-distSqr(A,B)-distSqr(C,D);
  return Math.sqrt(4*distSqr(B,D)*distSqr(A,C)-tp*tp)/4;}

 private static int distSqr(int a,int b){
  return (x[a]-x[b])*(x[a]-x[b])+(y[a]-y[b])*(y[a]-y[b]);}


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