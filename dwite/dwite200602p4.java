import java.io.*;


public class dwite200602p4{

 private static String problem="41";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static int[][] board=new int[7][6]; // 0 = unfilled, 1 = red, 2 = blue

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  String move=in.readLine();
  for(int i=0;i<42;i++){
   drop(move.charAt(i)-'1',i%2+1);
   if(hasWinner()){
    out.println((i%2==0?"RED":"BLUE")+"-"+(i+1));
    break;}}}

 private static void drop(int x,int color){
  for(int y=5;y>=0;y--){
   if(board[x][y]==0){
    board[x][y]=color;
    break;}}}

 private static boolean hasWinner(){
  // Check horizontal
  for(int y=0;y<6;y++){
   for(int x=0;x<4;x++){
    if(board[x][y]!=0&&board[x][y]==board[x+1][y]&&board[x][y]==board[x+2][y]&&board[x][y]==board[x+3][y])return true;}}
  // Check vertical
  for(int y=0;y<3;y++){
   for(int x=0;x<7;x++){
    if(board[x][y]!=0&&board[x][y]==board[x][y+1]&&board[x][y]==board[x][y+2]&&board[x][y]==board[x][y+3])return true;}}
  // Check diagonal (down-right)
  for(int y=0;y<3;y++){
   for(int x=0;x<4;x++){
    if(board[x][y]!=0&&board[x][y]==board[x+1][y+1]&&board[x][y]==board[x+2][y+2]&&board[x][y]==board[x+3][y+3])return true;}}
  // Check diagonal (up-right)
  for(int y=3;y<6;y++){
   for(int x=0;x<4;x++){
    if(board[x][y]!=0&&board[x][y]==board[x+1][y-1]&&board[x][y]==board[x+2][y-2]&&board[x][y]==board[x+3][y-3])return true;}}
  return false;}


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