import java.io.*;
import java.util.StringTokenizer;


public class dwite200502p2{

 private static String problem="21";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int h=Integer.parseInt(st.nextToken());
  int w=Integer.parseInt(st.nextToken());
  int[][] grid=new int[h+2][w+2];
  for(int y=0;y<grid.length;y++){
   for(int x=0;x<grid[y].length;x++)grid[y][x]='.';}
  for(int y=0;y<h;y++){
   String s=in.readLine();
   for(int x=0;x<w;x++)grid[y+1][x+1]=s.charAt(x);}
  int maxcoiled=0;
  int maxuncoiled=0;
  for(int y=1;y<=h;y++){
   for(int x=1;x<=w;x++){
    int temp=markSnakeAndGetLength(grid,x,y);
    if(isCurrentSnakeCoiled(grid))maxcoiled=Math.max(temp,maxcoiled);
    else maxuncoiled=Math.max(temp,maxuncoiled);
    clearCurrentSnake(grid);}}
  out.println(maxcoiled+" "+maxuncoiled);}


 private static boolean isCurrentSnakeCoiled(int[][] grid){
  for(int y=1;y<grid.length-1;y++){
   for(int x=1;x<grid[y].length-1;x++){
    if(grid[y][x]=='O'&&countCurrentNeighbours(grid,x,y)>=3)return true;}}
  return false;}

 private static int markSnakeAndGetLength(int[][] grid,int x,int y){
  if(grid[y][x]!='X')return 0;
  int count=1;
  grid[y][x]='O';
  count+=markSnakeAndGetLength(grid,x-1,y-1);
  count+=markSnakeAndGetLength(grid,x-1,y+0);
  count+=markSnakeAndGetLength(grid,x-1,y+1);
  count+=markSnakeAndGetLength(grid,x+0,y-1);
  count+=markSnakeAndGetLength(grid,x+0,y+1);
  count+=markSnakeAndGetLength(grid,x+1,y-1);
  count+=markSnakeAndGetLength(grid,x+1,y+0);
  count+=markSnakeAndGetLength(grid,x+1,y+1);
  return count;}

 private static int countCurrentNeighbours(int[][] grid,int x,int y){
  int count=0;
  if(grid[y-1][x-1]=='O')count++;
  if(grid[y-1][x+0]=='O')count++;
  if(grid[y-1][x+1]=='O')count++;
  if(grid[y+0][x-1]=='O')count++;
  if(grid[y+0][x+1]=='O')count++;
  if(grid[y+1][x-1]=='O')count++;
  if(grid[y+1][x+0]=='O')count++;
  if(grid[y+1][x+1]=='O')count++;
  return count;}

 private static void clearCurrentSnake(int[][] grid){
  for(int y=1;y<grid.length-1;y++){
   for(int x=1;x<grid[y].length-1;x++){
    if(grid[y][x]=='O')grid[y][x]='.';}}}


 public static void main(String[] arg) throws IOException{
  Object[] streams;
  streams=diskStreams();
  InputStreamReader in1=new InputStreamReader((InputStream)streams[0],"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream((OutputStream)streams[1]);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  for(int i=0;i<5;i++)main(in2,out3);
  in2.close();
  in1.close();
  out3.close();
  out2.close();
  out1.close();}

 private static Object[] diskStreams() throws IOException{
  return new Object[]{new FileInputStream("DATA"+problem+".txt"),new FileOutputStream("OUT"+problem+".txt")};}}