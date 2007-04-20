import java.io.*;
import java.util.StringTokenizer;


public class dwite200601p4{

 private static String problem="41";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;

 /*
 1 bushel = 4 peck = 6144 teaspoon
 1 peck = 8 quart = 1536 teaspoon
 1 gallon = 4 quart = 768 teaspoon
 1 quart = 4 cup = 192 teaspoon
 1 pint = 2 cup = 96 teaspoon
 1 cup = 16 tablespoon = 48 teaspoon
 1 tablespoon = 3 teaspoon
 */
 private static String[] unit={"TEASPOONS","TABLESPOONS","CUPS","PINTS","QUARTS","GALLONS","PECKS","BUSHELS"};
 private static int[] size={1,3,48,96,192,768,1536,6144}; // In number of teaspoons

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int x=Integer.parseInt(st.nextToken());
  int fromunit=getIndex(st.nextToken());
  st.nextToken(); // Discard "="
  st.nextToken(); // Discard "?"
  int tounit=getIndex(st.nextToken());
  double y=(double)x*size[fromunit]/size[tounit];
  int z=(int)Math.round(y*100);
  out.println(z/100+"."+z/10%10+z%10);}

 private static int getIndex(String s){
  for(int i=0;i<unit.length;i++){
   if(s.equals(unit[i]))return i;}
  return -1;}


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