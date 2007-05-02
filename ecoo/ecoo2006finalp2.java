import java.io.*;
import java.util.StringTokenizer;


public class ecoo2006finalp2{

 static char[][] map;


 static void main(BufferedReader in) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int height=Integer.parseInt(st.nextToken());
  int width=Integer.parseInt(st.nextToken());
  map=new char[height+2][width+2];
  for(int y=0;y<height;y++){
   String line=in.readLine();
   for(int x=0;x<width;x++)map[y+1][x+1]=line.charAt(x);}

  int blobs=0;
  int maxblobsize=0;
  for(int y=1;y<=height;y++){
   for(int x=1;x<=width;x++){
    if(map[y][x]>='A'&&map[y][x]<='Z'){
     int size=fill(x,y);
     if(size>=5){
      blobs++;
      maxblobsize=Math.max(size,maxblobsize);}}}}
  if(blobs>0)System.out.printf("There are %d blobs, the largest contains %d letters",blobs,maxblobsize);
  else System.out.println("There are no blobs.");}


 // Clears this cell and its matching neighbours, and returns the number of cells filled.
 static int fill(int x,int y){
  char value=map[y][x];
  map[y][x]=' '; // Clear the letter from this cell
  int count=1;
  if(map[y+0][x-1]==value)count+=fill(x-1,y+0);
  if(map[y+0][x+1]==value)count+=fill(x+1,y+0);
  if(map[y-1][x+0]==value)count+=fill(x+0,y-1);
  if(map[y+1][x+0]==value)count+=fill(x+0,y+1);
  return count;}


 public static void main(String[] args) throws IOException{
  BufferedReader in=new BufferedReader(new InputStreamReader(new FileInputStream("DATA21.txt"),"US-ASCII"));
  for(int i=0;i<5;i++)main(in);
  in.close();}}