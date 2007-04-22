import java.io.*;
import java.util.StringTokenizer;


public class dwite200501p2{

 private static String problem="21";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int h=Integer.parseInt(st.nextToken());
  int w=Integer.parseInt(st.nextToken());
  int[] neighbouringmine=new int[(w+2)*(h+2)];
  int[] abcdex=new int[5],abcdey=new int[5];
  for(int y=0;y<h;y++){
   String line=in.readLine();
   for(int x=0;x<w;x++){
    char c=line.charAt(x);
    if(c=='.');
    else if(c=='*'){
     for(int yy=y;yy<=y+2;yy++){
      for(int xx=x;xx<=x+2;xx++)neighbouringmine[yy*(w+2)+xx]++;}}
    else{
     abcdex[c-'a']=x;
     abcdey[c-'a']=y;}}}
  for(int i=0;i<5;i++)out.println((char)('a'+i)+"-"+neighbouringmine[(abcdey[i]+1)*(w+2)+abcdex[i]+1]);}


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