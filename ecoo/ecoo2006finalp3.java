import java.io.*;


public class ecoo2006finalp3{

 static void main(BufferedReader in) throws IOException{
  String line=in.readLine();
  int headx=1,heady=1; // Head direction vector. Special values: [1,1] = up; [-1,-1] = down
  int posx =0,posy =0; // Head position vector
  for(int i=0;i<line.length();i++){
   int dirx,diry;
   switch(line.charAt(i)){
    case 'N': dirx= 0; diry= 1; break;
    case 'E': dirx= 1; diry= 0; break;
    case 'W': dirx=-1; diry= 0; break;
    case 'S': dirx= 0; diry=-1; break;
    default: throw new AssertionError();}
   if(headx==1&&heady==1){ // Head is up
    posx+=2*dirx;
    posy+=2*diry;
    headx=dirx;
    heady=diry;}
   else if(headx==-1&&heady==-1){ // Head is down
    posx+=dirx;
    posy+=diry;
    headx=-dirx;
    heady=-diry;}
   else if(headx==dirx&&heady==diry){ // Head faces the direction of rotation
    posx+=dirx;
    posy+=diry;
    headx=-1;
    heady=-1;}
   else if(headx==-dirx&&heady==-diry){ // Tail faces the direction of rotation
    posx+=2*dirx;
    posy+=2*diry;
    headx=1;
    heady=1;}
   else{ // Otherwise, roll sideways
    posx+=dirx;
    posy+=diry;}}
  System.out.printf("Tumbledee's head is at (%d,%d)%n",posx,posy);}


 public static void main(String[] args) throws IOException{
  BufferedReader in=new BufferedReader(new InputStreamReader(new FileInputStream("DATA31.txt"),"US-ASCII"));
  for(int i=0;i<5;i++)main(in);
  in.close();}}