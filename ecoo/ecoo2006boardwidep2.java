import java.io.*;


public class ecoo2006boardwidep2{

 public static void main(BufferedReader in) throws IOException{
  String ct=in.readLine();
  if(ct.length()==0){
   System.out.println();
   return;}
  if(ct.length()%2==1)ct+=' ';
  int[] tp=new int[ct.length()*3];
  for(int i=0;i<ct.length();i++){
   int c=fromChar(ct.charAt(i));
   tp[i*3  ]=c/9;
   tp[i*3+1]=c/3%3;
   tp[i*3+2]=c%3;}
  for(int i=0;i<ct.length();i+=2)swap(tp,i*3,(i+1)*3);
  for(int i=1;i+1<ct.length();i+=2)swap(tp,i*3+2,(i+1)*3+2);
  swap(tp,2,(ct.length()-1)*3+2);
  char[] pt=new char[ct.length()];
  for(int i=0;i<pt.length;i++)pt[i]=toChar(tp[i*3]*9+tp[i*3+1]*3+tp[i*3+2]);
  System.out.println(new String(pt));}


 private static char toChar(int i){
  if(i==0)return ' ';
  if(i>=1&&i<27)return (char)('A'+i-1);
  throw new IllegalArgumentException();}

 private static int fromChar(char c){
  if(c==' ')return 0;
  if(c>='A'&&c<='Z')return c-'A'+1;
  throw new IllegalArgumentException();}

 private static void swap(int[] a,int i,int j){
  int tp=a[i];
  a[i]=a[j];
  a[j]=tp;}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA21.txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  for(int i=0;i<5;i++)main(in2);
  in2.close();
  in1.close();
  in0.close();}}