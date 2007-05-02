import java.io.*;


public class ecoo2006regionalp21{

 static int[] stack=new int[4];
 static int stacklen;

 static void main(BufferedReader in) throws IOException{
  int n=Integer.parseInt(in.readLine());
  System.out.print(n+" = ");
  for(int i=0;i<stack.length;i++){
   stacklen=0;
   if(decompose(n,i))break;}
  System.out.print(stack[0]+" squared");
  for(int i=1;i<stacklen;i++)System.out.print(" + "+stack[i]+" squared");
  System.out.println();}


 static boolean decompose(int n,int level){ // level == number of recursions remaining
  stacklen++;
  for(int i=sqrt(n);i>=1;i--){
   stack[stacklen-1]=i;
   if(level==0&&i*i==n||level>0&&decompose(n-i*i,level-1))return true;}
  stacklen--;
  return false;}

 static int sqrt(int x){
  int y=0;
  for(int i=15;i>=0;i--){
   y|=1<<i;
   if(y>46340||y*y>x)y^=1<<i;}
  return y;}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA21.txt"));
  for(int i=0;i<5;i++)main(in);}}