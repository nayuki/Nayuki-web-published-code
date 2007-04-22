import java.io.*;


public class dwite200411p5{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA51.txt");
  out0=new FileOutputStream("OUT51.txt");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   int temp=Integer.parseInt(in.readLine());
   int wind=Integer.parseInt(in.readLine());
   long wct=Math.round(13.12+0.6215*temp-11.37*Math.pow(wind,0.16)+0.3965*temp*Math.pow(wind,0.16));
   String rating;
   if(wct>-10)rating="LOW";
   else if(wct>-25)rating="MODERATE";
   else if(wct>-45)rating="COLD";
   else if(wct>-60)rating="EXTREME";
   else rating="DANGER";
   out.println(wct+" "+rating);}
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