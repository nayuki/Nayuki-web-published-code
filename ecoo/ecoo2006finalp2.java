import java.io.*;
import java.util.*;


public class ecoo2006finalp2{

 static char[][] map;


 static void main(BufferedReader in) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int h=Integer.parseInt(st.nextToken());
  int w=Integer.parseInt(st.nextToken());
  map=new char[h+2][w+2];
  for(int y=0;y<h;y++){
   String line=in.readLine();
   for(int x=0;x<w;x++)map[y+1][x+1]=line.charAt(x);}
  int blob=0;
  int maxblob=0;
  for(int y=1;y<=h;y++){
   for(int x=1;x<=w;x++){
    if(map[y][x]<'A'||map[y][x]>'Z')continue;
    int tp=fill(x,y);
    if(tp>=5){
     blob++;
     maxblob=Math.max(tp,maxblob);}}}
  if(blob>0)System.out.println("There are "+blob+" blobs, the largest contains "+maxblob+" letters");
  else System.out.println("There are no blobs.");}


 static int fill(int x,int y){ // Returns the number of cells filled by this function and its recursions.
  int s=1;
  if(map[y][x-1]==map[y][x])s+=fill(x-1,y);
  if(map[y][x+1]==map[y][x])s+=fill(x+1,y);
  if(map[y-1][x]==map[y][x])s+=fill(x,y-1);
  if(map[y+1][x]==map[y][x])s+=fill(x,y+1);
  map[y][x]='\0';
  return s;}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA21.txt"));
  for(int i=0;i<5;i++)main(in);}}