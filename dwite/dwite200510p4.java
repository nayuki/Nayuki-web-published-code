import java.io.*;
import java.util.StringTokenizer;


public class dwite200510p4{

 private static String problem="41";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static char[][] map;
 private static boolean[][] visited;

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int r=Integer.parseInt(st.nextToken());
  int c=Integer.parseInt(st.nextToken());
  if(map[r][c]=='X')out.println("MINE - YOU LOSE");
  else if(map[r][c]!='0')out.println("NO MINE - "+map[r][c]+" SURROUNDING IT");
  else{
   visited=new boolean[map.length][map[0].length];
   out.println("NO MINE - "+reveal(c,r)+" SQUARES REVEALED");}}


 private static int reveal(int x,int y){
  if(visited[y][x]||map[y][x]==' ')return 0;
  visited[y][x]=true;
  if(map[y][x]!='0')return 1;
  return 1+reveal(x-1,y-1)+reveal(x,y-1)+reveal(x+1,y-1)+reveal(x-1,y)+reveal(x+1,y)+reveal(x-1,y+1)+reveal(x,y+1)+reveal(x+1,y+1);}

 private static void calculateNeighbourMine(char[][] map){
  for(int y=1;y<map.length-1;y++){
   for(int x=1;x<map[0].length-1;x++){
    if(map[y][x]=='.')map[y][x]=(char)(neighbourMine(x,y)+'0');}}}

 private static int neighbourMine(int x,int y){
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


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  map=readMapPad(16,30,in2,' ');
  calculateNeighbourMine(map);
  for(int i=0;i<5;i++)main(in2,out3);
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