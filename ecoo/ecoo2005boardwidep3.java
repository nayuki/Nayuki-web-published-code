import java.io.*;


public class ecoo2005boardwidep3{

 private static String alphabet=" .,'!?ABCDEFGHIJKLMNOPQRSTUVWXYZ";

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   String line=in.readLine();
   byte[] message=new byte[line.length()];
   for(int i=0;i<message.length;i++)message[i]=(byte)alphabet.indexOf(line.charAt(i));
   int shift=-1;
   for(int i=0;i<4;i++){
    if((message[message.length-1]>>>i&1)==0){
     shift=4-i;
     break;}}
   StringBuffer sb=new StringBuffer(message.length-1);
   for(int i=0;i<message.length-1;i++)sb.append(alphabet.charAt((message[i]&((1<<(5-shift))-1))<<shift|message[i+1]>>>(5-shift)));
   out.println(sb.toString());
   out.println();}}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA31.txt");
  OutputStream out0=System.out;
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  main(in2,out3);
  in2.close();
  in1.close();
  out3.close();
  out2.close();
  out1.close();}}