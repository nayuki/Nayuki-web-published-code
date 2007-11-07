import java.io.*;


public class dwite200511p3{

 private static String problem="31";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static int[] syllable={2,4,6,8,2};

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  int worstdev=0;
  int worstline=0;
  for(int i=0;i<5;i++){
   String line=in.readLine();
   int n=1;
   for(int j=0;j<line.length();j++){
    if(line.charAt(j)==' '||line.charAt(j)=='-')n++;}
   n-=syllable[i];
   if(Math.abs(n)>Math.abs(worstdev)){
    worstdev=n;
    worstline=i;}}
  out.println("LINE "+worstline+" - "+Math.abs(worstdev)+" SYLLABLE(S) TOO "+(worstdev>=0?"MANY":"FEW"));}


 public static void main(String[] arg) throws IOException{
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