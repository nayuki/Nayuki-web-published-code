import java.io.*;


public class dwite200411p1{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA11.txt");
  out0=new FileOutputStream("OUT11.txt");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   int[] dig=toDigits(in.readLine());
   int sum=calculateLUHNSum(dig);
   if(sum%10==0)out.println("VALID");
   else{
    for(int i=0;i<10;i++){
     dig[dig.length-1]=i;
     if(calculateLUHNSum(dig)%10==0){
      out.println("INVALID "+dig[dig.length-1]);
      break;}}}}
  in.close();
  in1.close();
  in0.close();
  out.close();
  out2.close();
  out1.close();
  out0.close();}

 private static int[] toDigits(String s){
  int[] d=new int[s.length()];
  for(int i=0;i<d.length;i++)d[i]=s.charAt(i)-'0';
  return d;}

 private static int calculateLUHNSum(int[] d){
  int sum=0;
  for(int i=0;i<d.length;i++){
   if((i+d.length)%2==1)sum+=d[i];
   else sum+=d[i]/5+d[i]%5*2;}
  return sum;}


 private static InputStream in0;
 private static OutputStream out0;

 private static InputStreamReader in1;
 private static BufferedOutputStream out1;
 private static OutputStreamWriter out2;

 private static BufferedReader in;
 private static PrintWriter out;}