import java.io.*;
import java.util.StringTokenizer;


public class dwite200410p1{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA1");
  out0=new FileOutputStream("OUT1");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine());
   double x1=Double.parseDouble(st.nextToken());
   double y1=Double.parseDouble(st.nextToken());
   double x2=Double.parseDouble(st.nextToken());
   double y2=Double.parseDouble(st.nextToken());
   long area=Math.round(3.14159*1000*((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2)));
   long dec=area%1000;
   out.println(area/1000+"."+(dec<100?"0":"")+(dec<10?"0":"")+dec);}
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