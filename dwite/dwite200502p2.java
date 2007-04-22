import java.io.*;
import java.util.StringTokenizer;


public class dwite200502p2{

 private static String problem="21";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   int h=Integer.parseInt(st.nextToken());
   int w=Integer.parseInt(st.nextToken());
   int[] snake=new int[(w+2)*(h+2)];
   for(int y=1;y<=h;y++){
    String s=in.readLine();
    int off=y*(w+2);
    for(int x=0;x<w;x++)snake[off+x+1]=(s.charAt(x)-'.')/('X'-'.');}
   int[] length=calculateLength(snake,w,h);
   out.println(length[0]+" "+length[1]);}}

 private static int[] calculateLength(int[] snake,int w,int h){
  int coiled=0,uncoiled=0;
  int i=2;
  for(int y=1;y<=h;y++){
   int off=y*(w+2);
   for(int x=1;x<=w;x++){
    if(snake[off+x]==1){
     int tp=calculateLength(snake,w+2,x,y,i);
     if(isCoiled(snake,w,h,i)){
      if(tp>coiled)coiled=tp;}
     else if(tp>uncoiled)uncoiled=tp;
     i++;}}}
  return new int[]{coiled,uncoiled};}

 private static int calculateLength(int[] snake,int w,int x,int y,int i){
  int len=1;
  int off=y*w+x;
  snake[y*w+x]=i;
  if(snake[off-w-1]==1)len+=calculateLength(snake,w,x-1,y-1,i);
  if(snake[off-w  ]==1)len+=calculateLength(snake,w,x  ,y-1,i);
  if(snake[off-w+1]==1)len+=calculateLength(snake,w,x+1,y-1,i);
  if(snake[off  -1]==1)len+=calculateLength(snake,w,x-1,y  ,i);
  if(snake[off  +1]==1)len+=calculateLength(snake,w,x+1,y  ,i);
  if(snake[off+w-1]==1)len+=calculateLength(snake,w,x-1,y+1,i);
  if(snake[off+w  ]==1)len+=calculateLength(snake,w,x  ,y+1,i);
  if(snake[off+w+1]==1)len+=calculateLength(snake,w,x+1,y+1,i);
  return len;}

 private static boolean isCoiled(int[] snake,int w,int h,int i){
  for(int y=1;y<=h;y++){
   int off=y*(w+2)+1;
   for(int x=1;x<=w;x++,off++){
    if(snake[off]==i){
     int neigh=0;
     if(snake[off-w-3]==i)neigh++;
     if(snake[off-w-2]==i)neigh++;
     if(snake[off-w-1]==i)neigh++;
     if(snake[off  -1]==i)neigh++;
     if(snake[off  +1]==i)neigh++;
     if(snake[off+w+1]==i)neigh++;
     if(snake[off+w+2]==i)neigh++;
     if(snake[off+w+3]==i)neigh++;
     if(neigh>=3)return true;}}}
  return false;}


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