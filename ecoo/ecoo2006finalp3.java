import java.io.*;


public class ecoo2006finalp3{

 static void main(BufferedReader in) throws IOException{
  String line=in.readLine();
  int headx=1,heady=1; // Head direction vector. Special values: {1,1} = up; {-1,-1} = down
  int posx=0,posy=0; // Head position vector
  for(int i=0;i<line.length();i++){
   int dirx,diry;
   switch(line.charAt(i)){
    case 'N': dirx= 0; diry= 1; break;
    case 'E': dirx= 1; diry= 0; break;
    case 'W': dirx=-1; diry= 0; break;
    case 'S': dirx= 0; diry=-1; break;
    default: throw new RuntimeException();}
   if(headx==1&&heady==1){
    posx+=2*dirx;
    posy+=2*diry;
    headx=dirx;
    heady=diry;}
   else if(headx==-1&&heady==-1){
    posx+=dirx;
    posy+=diry;
    headx=-dirx;
    heady=-diry;}
   else if(headx==dirx&&heady==diry){
    posx+=dirx;
    posy+=diry;
    headx=-1;
    heady=-1;}
   else if(headx==-dirx&&heady==-diry){
    posx+=2*dirx;
    posy+=2*diry;
    headx=1;
    heady=1;}
   else{
    posx+=dirx;
    posy+=diry;}}
  System.out.println("Tumbledee's head is at ("+posx+","+posy+")");}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA31.txt"));
  for(int i=0;i<5;i++)main(in);}}