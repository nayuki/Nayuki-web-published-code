import java.io.*;


public class dwite200410p2{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA2");
  out0=new FileOutputStream("OUT2");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   String s=in.readLine();
   int h=Integer.parseInt(s.substring(0,2));
   String ap;
   if(h<12)ap="AM";
   else{
    h-=12;
    ap="PM";}
   if(h==0)h=12;
   out.println(h+":"+s.substring(3,5)+" "+ap);}
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