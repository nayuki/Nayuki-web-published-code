import java.io.*;
import java.util.*;


public class ecoo2006finalp1{

 static int[][] distance={
  { 0,28,22,18,32,36,20},
  {28, 0,17,39,52,40,23},
  {22,17, 0,20,45,40,37},
  {18,39,20, 0,28,38,46},
  {32,52,45,28, 0,22,47},
  {36,40,40,38,22, 0,30},
  {20,23,37,46,47,30, 0}};


 static void main(BufferedReader in) throws IOException{
  int[] carrot=new int[7]; // Number of carrots picked up at each city
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  for(int i=0;i<carrot.length;i++)carrot[i]=Integer.parseInt(st.nextToken());
  int[] perm=new int[6]; // The 6 cities to visit between starting at city 0 and ending at city 0
  for(int i=0;i<perm.length;i++)perm[i]=i+1;
  int mintime=Integer.MAX_VALUE; // Expressed in units of 1/10 hours
  int[] bestpath=null;
  int[] path=new int[8];
  path[0]=path[7]=0;
  do{
   for(int i=0;i<perm.length;i++)path[i+1]=perm[i];
   int tp=getTime(path,carrot);
   if(tp<mintime){
    mintime=tp;
    bestpath=path.clone();}}
  while(nextPermutation(perm));
  System.out.println("The best route is: "+toString(bestpath)+" with total time = "+mintime/10+"."+mintime%10+" hours");}


 static boolean nextPermutation(int[] a){
  int i,n=a.length;
  for(i=n-2;;i--){
   if(i<0)return false;
   if(a[i]<a[i+1])break;}
  for(int j=1;i+j<n-j;j++){
   int tp=a[i+j];
   a[i+j]=a[n-j];
   a[n-j]=tp;}
  int j;
  for(j=i+1;a[j]<=a[i];j++);
  int tp=a[i];
  a[i]=a[j];
  a[j]=tp;
  return true;}

 static int getTime(int[] path,int[] carrot){
  int car=carrot[0]; // Current number of carrots
  int time=0;
  for(int i=1;i<path.length;i++){
   int dist=distance[path[i-1]][path[i]]; // Distance to travel
   int tp=Math.min(car,dist); // Use up all the carrots or go the full distance, whichever comes first
   dist-=tp;
   car-=tp;
   time+=tp;
   if(dist>0)time+=dist*10; // Human donkey case
   car+=carrot[path[i]];}
  return time;}

 static String toString(int[] path){
  String s="";
  for(int i=0;i<path.length;i++)s+=(char)('A'+path[i]);
  return s;}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA11.txt"));
  for(int i=0;i<5;i++)main(in);}}