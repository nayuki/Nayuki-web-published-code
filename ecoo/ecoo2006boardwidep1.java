import java.io.*;
import java.util.*;


public class ecoo2006boardwidep1{

 public static void main(BufferedReader in,int p) throws IOException{
  String line=in.readLine();
  StringTokenizer st=new StringTokenizer(line," ");
  int life=Integer.parseInt(st.nextToken());
  int time=Integer.parseInt(st.nextToken());
  /*
  // O(life*time) version, simple, trusted
  int[] born=new int[time];
  born[0]=1;
  for(int i=1;i<time;i++){ // Note that alive[i] = sum(born[j], i-life < j <= i)
   for(int j=2;j<life&&i-j>=0;j++)born[i]+=born[i-j];}
  System.out.println("in problem #"+(p+1)+" there are "+(2*born[time-1]+born[time-2])+" rabbit pair(s)");
  */

  // O(time) version - fast (is there a closed formula for even faster evaluation?)
  int[] born=new int[life]; // Circular history buffer
  born[0]=1;
  int bornsum=0;
  int alive=1;
  for(int i=1;i<time;i++){
   if(i>=life){
    alive-=born[i%life];
    bornsum-=born[i%life];}
   if(i>=2)bornsum+=born[(i-2+life)%life];
   born[i%life]=bornsum;
   alive+=born[i%life];}
  System.out.println("in problem #"+(p+1)+" there are "+alive+" rabbit pair(s)");}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA11.txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  for(int i=0;i<5;i++)main(in2,i);
  in2.close();
  in1.close();
  in0.close();}}