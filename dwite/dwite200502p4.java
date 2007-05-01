import java.io.*;
import java.util.*;


public class dwite200502p4{

 static String problem="41";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  List<Integer> dimensions=new ArrayList<Integer>();
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  while(true){
   int temp=Integer.parseInt(st.nextToken());
   if(temp==0)break;
   dimensions.add(temp);}
  int[][] mincost=new int[dimensions.size()-1][dimensions.size()]; // mincost[i][j] is the minimum cost of multiplying the chain from i (inclusive) to j (inclusive).
  int[][] maxcost=new int[dimensions.size()-1][dimensions.size()];
  for(int i=0;i<mincost.length;i++){ // Let uninitialized positions be invalid
   for(int j=0;j<mincost[i].length;j++)mincost[i][j]=maxcost[i][j]=-1;}
  for(int i=0;i+1<dimensions.size();i++){ // The cost for a single matrix (zero)
   mincost[i][i+1]=maxcost[i][i+1]=0;}
  for(int i=2;i<dimensions.size();i++){ // For each number of consecutive matrices
   for(int j=0;j+i<dimensions.size();j++){ // For each starting position
    int min=Integer.MAX_VALUE;
    int max=0;
    for(int k=1;k<i;k++){ // For each split position
     int cost=dimensions.get(j)*dimensions.get(j+k)*dimensions.get(j+i); // The cost of the current operation
     min=Math.min(cost+mincost[j][j+k]+mincost[j+k][j+i],min);
     max=Math.max(cost+maxcost[j][j+k]+maxcost[j+k][j+i],max);}
    mincost[j][j+i]=min;
    maxcost[j][j+i]=max;}}
  out.printf("%d %d%n",mincost[0][dimensions.size()-1],maxcost[0][dimensions.size()-1]);}


 public static void main(String[] args) throws IOException{
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