import java.io.*;


public class ecoo2006regionalp2{

 static int[] next=new int[10000]; // Subtract next[i]*next[i] from i to get one step closer to i=0.

 static{
  for(int i=0;i<next.length;i++)next[i]=-1;
  next[0]=0;
  for(int i=0;i<4;i++){ // For 4 addends
   int[] newnext=next.clone();
   for(int j=sqrt(next.length-1);j>=1;j--){ // For each square
    for(int jsqr=j*j,k=next.length-jsqr-1;k>=0;k--){ // For each number
     if(next[k]!=-1&&newnext[k+jsqr]==-1)newnext[k+jsqr]=j;}}
   next=newnext;}}


 static void main(BufferedReader in) throws IOException{
  int n=Integer.parseInt(in.readLine());
  if(n<=0)throw new AssertionError();
  System.out.print(n+" = ");
  while(true){
   System.out.print(next[n]+" squared");
   n-=next[n]*next[n];
   if(n==0)break;
   System.out.print(" + ");}
  System.out.println();}

 static int sqrt(int x){
  int y=0;
  for(int i=15;i>=0;i--){
   y|=1<<i;
   if(y>46340||y*y>x)y^=1<<i;}
  return y;}


 public static void main(String[] args) throws IOException{
  BufferedReader in=new BufferedReader(new InputStreamReader(new FileInputStream("DATA21.txt"),"US-ASCII"));
  for(int i=0;i<5;i++)main(in);
  in.close();}}