import java.io.*;


public class ecoo2006regionalp2{

 static int[] next=new int[10001]; // Points to x, where subtracting x^2 and going to that index will eventually lead to 0.

 static{
  for(int i=0;i<next.length;i++)next[i]=-1;
  next[0]=0; // The only sum reachable with 0 terms.
  int[] tp=next.clone();
  for(int i=0;i<4;i++){
   for(int j=sqrt(next.length-1);j>=1;j--){
    for(int jj=j*j,k=next.length-1;k>=0;k--){
     if(next[k]!=-1&&k+jj<next.length&&tp[k+jj]==-1)tp[k+jj]=j;}}
   for(int j=0;j<next.length;j++)next[j]=tp[j];}}

 static void main(BufferedReader in) throws IOException{
  int n=Integer.parseInt(in.readLine());
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


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA21.txt"));
  for(int i=0;i<5;i++)main(in);}}