import java.io.*;


public class dwite200412p3{

 static String problem="31";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  double length    =Double.parseDouble(in.readLine()); // Variable L
  double separation=Double.parseDouble(in.readLine()); // Variable D
  double angle     =Double.parseDouble(in.readLine()); // Variable x
  double refldist=separation/Math.tan(Math.toRadians(angle)); // Horizontal distance between reflections
  out.println((int)Math.floor(length/refldist+0.5));}


 public static void main(String[] args) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  for(int i=0;i<5;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}}