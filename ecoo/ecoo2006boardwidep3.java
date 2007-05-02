import java.io.*;


public class ecoo2006boardwidep3{

 public static void main(BufferedReader in) throws IOException{
  int height=Integer.parseInt(in.readLine());
  int width=Integer.parseInt(in.readLine());
  char[][] map=new char[height][width];
  for(int y=0;y<height;y++){
   String line=in.readLine();
   for(int x=0;x<width;x++)map[y][x]=line.charAt(x);}
  int word=0;
  for(int y=0;y<height;y++){ // Horizontal
   for(int x=0;x<width-2;x++)word+=isWord(map[y][x],map[y][x+1],map[y][x+2]);}
  for(int y=0;y<height-2;y++){ // Vertical
   for(int x=0;x<width;x++)word+=isWord(map[y][x],map[y+1][x],map[y+2][x]);}
  for(int y=0;y<height-2;y++){ // Diagonal (backslash)
   for(int x=0;x<width-2;x++)word+=isWord(map[y][x],map[y+1][x+1],map[y+2][x+2]);}
  for(int y=0;y<height-2;y++){ // Diagonal (forward slash)
   for(int x=2;x<width;x++)word+=isWord(map[y][x],map[y+1][x-1],map[y+2][x-2]);}
  System.out.println("There are "+word+" word(s) in the "+height+" by "+width+" array");}


 /*
 Allowed configurations:
  Consonant, vowel, consonant:
   0 1 0 // consonant, vowel, consonant
   0 2 0 // consonant, Y, consonant
   2 1 2 // Y, vowel, Y
   2 1 0 // Y, vowel, consonant
   0 1 2 // consonant, vowel, Y
  Vowel, consonant, vowel:
   1 0 1 // vowel, consonant, vowel
   1 2 1 // vowel, Y, vowel
   2 0 2 // Y, consonant, Y
   2 0 1 // Y, consonant, vowel
   1 0 2 // vowel, consonant, Y
 Disallowed configurations:
  0 0 0
  0 0 1
  0 0 2
  0 1 1
  0 2 1
  0 2 2
  1 0 0
  1 1 0
  1 1 1
  1 1 2
  1 2 0
  1 2 2
  2 0 0
  2 1 1
  2 2 0
  2 2 1
  2 2 2

 Pattern noticed:
  disallowed = (a==b || b==c || (b==2 && a!=c))
  allowed = (a!=b && b!=c && (b!=2 || a==c))
 */
 private static int isWord(char a,char b,char c){ // Returns 0 if false, 1 if true
  a=getClass(a);
  b=getClass(b);
  c=getClass(c);
  return (a!=b&&b!=c&&(b!=2||a==c))?1:0;}

 private static char getClass(char c){ // 0: consonant; 1: vowel; 2: Y
  if("BCDFGHJKLMNPQRSTVWXZ".indexOf(c)!=-1)return 0;
  if("AEIOU".indexOf(c)!=-1)return 1;
  if(c=='Y')return 2;
  throw new RuntimeException();}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA31.txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  for(int i=0;i<5;i++)main(in2);
  in2.close();
  in1.close();
  in0.close();}}