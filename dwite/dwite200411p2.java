import java.io.*;


public class dwite200411p2{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA21.txt");
  out0=new FileOutputStream("OUT21.txt");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   int s0=Integer.parseInt(in.readLine());
   int s1=Integer.parseInt(in.readLine());
   int tp=sqrt(s0)-sqrt(s1)+1;
   out.println(tp*tp);}
  in.close();
  in1.close();
  in0.close();
  out.close();
  out2.close();
  out1.close();
  out0.close();}

 private static int sqrt(int x){
  int y=0;
  for(int i=15;i>=0;i--){
   y|=1<<i;
   if(y>46340||y*y>x)y^=1<<i;}
  return y;}


 private static InputStream in0;
 private static OutputStream out0;

 private static InputStreamReader in1;
 private static BufferedOutputStream out1;
 private static OutputStreamWriter out2;

 private static BufferedReader in;
 private static PrintWriter out;}