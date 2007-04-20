import java.io.*;
import java.util.StringTokenizer;


public class dwite200510p2{

 private static String problem="21";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  char[][] map=readMapPad(Integer.parseInt(st.nextToken()),Integer.parseInt(st.nextToken()),in,' ');
  for(int i=0;;){
   nextGeneration(map);
   i++;
   if(i==1||i==5||i==10||i==50||i==100){
    out.println(totalAlive(map));
    if(i==100)break;}}}


 private static void nextGeneration(char[][] map){
  char[][] mapnew=new char[map.length][map[0].length];
  for(int y=1;y<map.length-1;y++){
   for(int x=1;x<map[0].length-1;x++){
    int a=neighbourAlive(map,x,y);
    if(map[y][x]=='.'&&a==3)mapnew[y][x]='X';
    else if(map[y][x]=='X'&&(a<2||a>3))mapnew[y][x]='.';
    else mapnew[y][x]=map[y][x];}}
  for(int y=0;y<map.length;y++){
   for(int x=0;x<map[0].length;x++)map[y][x]=mapnew[y][x];}}

 private static int neighbourAlive(char[][] map,int x,int y){
  int s=0;
  if(map[y-1][x-1]=='X')s++;
  if(map[y-1][x  ]=='X')s++;
  if(map[y-1][x+1]=='X')s++;
  if(map[y  ][x-1]=='X')s++;
  if(map[y  ][x+1]=='X')s++;
  if(map[y+1][x-1]=='X')s++;
  if(map[y+1][x  ]=='X')s++;
  if(map[y+1][x+1]=='X')s++;
  return s;}

 private static int totalAlive(char[][] map){
  int s=0;
  for(int y=1;y<map.length-1;y++){
   for(int x=1;x<map[0].length-1;x++){
    if(map[y][x]=='X')s++;}}
  return s;}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  for(int i=0;i<1;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}


 private static char[][] readMapPad(int h,int w,BufferedReader in,char border) throws IOException{
  char[][] map=new char[h+2][w+2];
  for(int y=1;y<=h;y++){
   String line=in.readLine();
   for(int x=1;x<=w;x++)map[y][x]=line.charAt(x-1);
   map[y][0]=map[y][w+1]=border;}
  for(int x=0;x<w+2;x++)map[0][x]=map[h+1][x]=border;
  return map;}}