import java.io.*;


public class dwite200601p2{

 private static String problem="21";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static int[] lettervalue={1,3,3,2,1,4,2,4,1,8,5,1,3,1,1,3,10,1,1,1,1,4,4,8,4,10};
 private static int[][] boardvalue={ // 0 = normal, 1 = pink, 2 = red, 3 = light blue, 4 = dark blue, 5-9 = same meaning but to be cleared
  {2,0,0,3,0,0,0,2,0,0,0,3,0,0,2},
  {0,1,0,0,0,4,0,0,0,4,0,0,0,1,0},
  {0,0,1,0,0,0,3,0,3,0,0,0,1,0,0},
  {3,0,0,1,0,0,0,3,0,0,0,1,0,0,3},
  {0,0,0,0,1,0,0,0,0,0,1,0,0,0,0},
  {0,4,0,0,0,4,0,0,0,4,0,0,0,4,0},
  {0,0,3,0,0,0,3,0,3,0,0,0,3,0,0},
  {2,0,0,3,0,0,0,1,0,0,0,3,0,0,2},
  {0,0,3,0,0,0,3,0,3,0,0,0,3,0,0},
  {0,4,0,0,0,4,0,0,0,4,0,0,0,4,0},
  {0,0,0,0,1,0,0,0,0,0,1,0,0,0,0},
  {3,0,0,1,0,0,0,3,0,0,0,1,0,0,3},
  {0,0,1,0,0,0,3,0,3,0,0,0,1,0,0},
  {0,1,0,0,0,4,0,0,0,4,0,0,0,1,0},
  {2,0,0,3,0,0,0,2,0,0,0,3,0,0,2}};
 private static char[][] board=new char[15][15];

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  int c=in.readLine().charAt(0)-'A';
  int r=Integer.parseInt(in.readLine())-1;
  boolean horz=in.readLine().equals("ACROSS");
  String word=in.readLine();
  int dx=(horz?1:0),dy=(horz?0:1);
  int score=0;
  if(word.length()==7)score+=50;
  for(int i=0;i<word.length();r+=dy,c+=dx){
   if(board[r][c]==0){
    board[r][c]=word.charAt(i);
    boardvalue[r][c]+=5;
    i++;}}
  if(horz){
   score+=scoreHorizontal(c-1,r);
   for(int x=0;x<boardvalue[r].length;x++){
    if(boardvalue[r][x]>=5)score+=scoreVertical(x,r);}}
  else{
   score+=scoreVertical(c,r-1);
   for(int y=0;y<boardvalue.length;y++){
    if(boardvalue[y][c]>=5)score+=scoreHorizontal(c,y);}}
  for(int y=0;y<boardvalue.length;y++){
   for(int x=0;x<boardvalue[y].length;x++){
    if(boardvalue[y][x]>=5)boardvalue[y][x]=0;}}
  out.println(score);}


 private static int scoreHorizontal(int x,int y){
  int start,end;
  for(start=x;start>=1&&board[y][start-1]!=0;start--);
  for(end=x;end<board[y].length-1&&board[y][end+1]!=0;end++);
  if(end-start+1==1)return 0;
  int score=0;
  int mult=1;
  for(int i=start;i<=end;i++){
   int letterscore=lettervalue[board[y][i]-'A'];
   switch(boardvalue[y][i]){
    case 6: mult*=2; break;
    case 7: mult*=3; break;
    case 8: letterscore*=2; break;
    case 9: letterscore*=3; break;}
   score+=letterscore;}
  score*=mult;
  return score;}

 private static int scoreVertical(int x,int y){
  int start,end;
  for(start=y;start>=1&&board[start-1][x]!=0;start--);
  for(end=y;end<board.length-1&&board[end+1][x]!=0;end++);
  if(end-start+1==1)return 0;
  int score=0;
  int mult=1;
  for(int i=start;i<=end;i++){
   int letterscore=lettervalue[board[i][x]-'A'];
   switch(boardvalue[i][x]){
    case 6: mult*=2; break;
    case 7: mult*=3; break;
    case 8: letterscore*=2; break;
    case 9: letterscore*=3; break;}
   score+=letterscore;}
  score*=mult;
  return score;}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
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