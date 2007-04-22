import java.io.*;
import java.math.BigInteger;


public class dwite200410p5{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA5");
  out0=new FileOutputStream("OUT5");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++)out.println(new BigInteger(in.readLine()).add(new BigInteger(in.readLine())));
  in.close();
  in1.close();
  in0.close();
  out.close();
  out2.close();
  out1.close();
  out0.close();}


 private static InputStream in0;
 private static OutputStream out0;

 private static InputStreamReader in1;
 private static BufferedOutputStream out1;
 private static OutputStreamWriter out2;

 private static BufferedReader in;
 private static PrintWriter out;}