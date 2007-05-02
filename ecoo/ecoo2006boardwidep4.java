import java.io.*;


public class ecoo2006boardwidep4{

 public static void main(BufferedReader in) throws IOException{
  String line=in.readLine()+"X"; // Makes it slightly easier to check for EOF than testing the index against the length
  int[][] pos  ={{0,0,0},{0, 0, 0}};
  int[][] front={{1,0,0},{-1,0, 0}};
  int[][] up   ={{0,1,0},{ 0,1, 0}};
  int[][] right={{0,0,1},{ 0,0,-1}};
  int i=0; // Read position
  while(true){
   char c=line.charAt(i);
   i++;
   int robot;
   if(c=='A')robot=0;
   else if(c=='B')robot=1;
   else if(c=='X')break;
   else throw new RuntimeException();
   c=line.charAt(i);
   i++;
   switch(c){
    case 'L':
     rotate(up[robot],front[robot],1);
     rotate(up[robot],right[robot],1);
    break;
    case 'R':
     rotate(up[robot],front[robot],-1);
     rotate(up[robot],right[robot],-1);
    break;
    case 'U':
     rotate(right[robot],front[robot],1);
     rotate(right[robot],up[robot],1);
    break;
    case 'D':
     rotate(right[robot],front[robot],-1);
     rotate(right[robot],up[robot],-1);
    break;
    default:
     throw new RuntimeException();}
   String dist="";
   for(;line.charAt(i)>='0'&&line.charAt(i)<='9';i++)dist+=line.charAt(i);
   translate(pos[robot],front[robot],Integer.parseInt(dist));}
  System.out.println("A is located at ( "+pos[0][0]+" , "+pos[0][1]+" , "+pos[0][2]+" )");
  System.out.println("B is located at ( "+pos[1][0]+" , "+pos[1][1]+" , "+pos[1][2]+" )");
  System.out.println("A and B are "+Math.round(distance(pos[0],pos[1]))+" units apart");
  System.out.println();}


 /*
 angle: 1 is 90 deg counterclockwise, -1 is 90 deg clockwise.
 zOMG, this is so simple to do with the cross product: rotate y around x by 90 deg counterclockwise is equal to x cross y (right hand system). For clockwise rotation, it's y cross x (or -(x cross y)).
 */
 private static void rotate(int[] axis,int[] vec,int ang){
  int x=vec[0]*ang,y=vec[1]*ang,z=vec[2]*ang; // To handle the negative case (without branching!)
  vec[0]=axis[1]*z-axis[2]*y;
  vec[1]=axis[2]*x-axis[0]*z;
  vec[2]=axis[0]*y-axis[1]*x;}

 private static void translate(int[] vec,int[] dir,int dist){
  vec[0]+=dist*dir[0];
  vec[1]+=dist*dir[1];
  vec[2]+=dist*dir[2];}

 private static double distance(int[] a,int[] b){
  return Math.sqrt((a[0]-b[0])*(a[0]-b[0])+(a[1]-b[1])*(a[1]-b[1])+(a[2]-b[2])*(a[2]-b[2]));}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA41.txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  for(int i=0;i<5;i++)main(in2);
  in2.close();
  in1.close();
  in0.close();}}