import java.io.*;
import java.util.StringTokenizer;


public class dwite200601p5{

 private static String problem="51";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;

 private static dwite200601p5[] town=new dwite200601p5[13]; // All 13 towns, 'A' to 'M'


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  String line=in.readLine();
  int source=line.charAt(0)-'A';
  int target=line.charAt(1)-'A';
  for(int i=0;i<town.length;i++)town[i].mindist=-1;
  town[source].mindist=0;
  town[source].walk();
  out.println(town[target].mindist);}


 private dwite200601p5[] edgetarget;
 private int[] edgedist;
 private int edgelen;
 private int mindist;

 private dwite200601p5(){
  edgetarget=new dwite200601p5[30]; // Maximum number of edges in total
  edgedist=new int[edgetarget.length];
  edgelen=0;
  mindist=0;}

 private void addEdge(dwite200601p5 target,int dist){
  edgetarget[edgelen]=target;
  edgedist[edgelen]=dist;
  edgelen++;}

 private void walk(){ // A stupid recursive flood fill algorithm
  for(int i=0;i<edgelen;i++){
   if(mindist+edgedist[i]<edgetarget[i].mindist||edgetarget[i].mindist==-1){
    edgetarget[i].mindist=mindist+edgedist[i];
    edgetarget[i].walk();}}}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  for(int i=0;i<town.length;i++)town[i]=new dwite200601p5();
  for(int i=0,n=Integer.parseInt(in2.readLine());i<n;i++){
   StringTokenizer st=new StringTokenizer(in2.readLine()," ");
   String edge=st.nextToken();
   int dist=Integer.parseInt(st.nextToken());
   int a=edge.charAt(0)-'A'; // One terminal
   int b=edge.charAt(1)-'A'; // The other terminal
   town[a].addEdge(town[b],dist);
   town[b].addEdge(town[a],dist);}
  for(int i=0;i<5;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}}