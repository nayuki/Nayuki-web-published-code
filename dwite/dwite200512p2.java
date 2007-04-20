import java.io.*;
import java.util.StringTokenizer;


public class dwite200512p2{

 private static String problem="21";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static char[][] map;

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int h=Integer.parseInt(st.nextToken());
  int w=Integer.parseInt(st.nextToken());
  map=pad(readMap(w,h,in),'#');
  int startx=-1,starty=-1;
  label0:
  for(int y=1;y<=h;y++){
   for(int x=1;x<=w;x++){
    if(map[y][x]=='E'){
     startx=x;
     starty=y;
     break label0;}}}
  out.println(findShortestPath(startx,starty)-1);}


 private static int findShortestPath(int x,int y){
  if(map[y][x]=='X')return 0;
  int min=10000;
  map[y][x]='@';
  if(map[y][x-1]=='.'||map[y][x-1]=='X')min=Math.min(findShortestPath(x-1,y)+1,min);
  if(map[y][x+1]=='.'||map[y][x+1]=='X')min=Math.min(findShortestPath(x+1,y)+1,min);
  if(map[y-1][x]=='.'||map[y-1][x]=='X')min=Math.min(findShortestPath(x,y-1)+1,min);
  if(map[y+1][x]=='.'||map[y+1][x]=='X')min=Math.min(findShortestPath(x,y+1)+1,min);
  map[y][x]='.';
  return min;}

 private static char[][] readMap(int w,int h,BufferedReader in) throws IOException{
  char[][] map=new char[h][w];
  for(int y=0;y<h;y++){
   String line=in.readLine();
   for(int x=0;x<w;x++)map[y][x]=line.charAt(x);}
  return map;}

 private static char[][] pad(char[][] min,char border){
  int h=min.length,w=min[0].length;;
  char[][] mout=new char[h+2][w+2];
  for(int x=0;x<w+2;x++)mout[0][x]=mout[h+1][x]=border;
  for(int y=0;y<h;y++){
   mout[y+1][0]=mout[y+1][w+1]=border;
   for(int x=0;x<w;x++)mout[y+1][x+1]=min[y][x];}
  return mout;}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?(OutputStream)System.out:new FileOutputStream("OUT"+problem+".txt");
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