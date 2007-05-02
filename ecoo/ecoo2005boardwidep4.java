import java.io.*;


public class ecoo2005boardwidep4{

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   String str=in.readLine();
   char[][] word=new char[9][3];
   for(int i=0;i<27;i++)word[i/3][i%3]=str.charAt(i);
   int bestlen=0;
   int[] besth={-1,-1,-1};
   int[] bestv={-1,-1,-1};
   for(int i=0;i<9;i++){
    for(int j=0;j<9;j++){
     if(j==i)continue;
     for(int k=0;k<9;k++){
      if(k==i||k==j)continue;
      int tp=evaluate(word,i,j,k);
      if(tp>bestlen){
       bestlen=tp;
       besth[0]=i;
       besth[1]=j;
       besth[2]=k;
       findVertical(word,i,j,k,bestv);}}}}
   out.println("h1 = "+new String(word[besth[0]])+"        "+(bestv[0]!=-1?"v1 = "+new String(word[bestv[0]]):""));
   out.println("h2 = "+new String(word[besth[1]])+"        "+(bestv[1]!=-1?"v2 = "+new String(word[bestv[1]]):""));
   out.println("h3 = "+new String(word[besth[2]])+"        "+(bestv[2]!=-1?"v3 = "+new String(word[bestv[2]]):""));
   out.println("                            "+(bestlen+3)+" words used");}}

 private static int evaluate(char[][] word,int a,int b,int c){
  int match=0;
  for(int i=0;i<3;i++){
   for(int j=0;j<9;j++){
    if(j==a||j==b||j==c)continue;
    if(word[a][i]==word[j][0]&&word[b][i]==word[j][1]&&word[c][i]==word[j][2]){
     match++;
     break;}}}
  return match;}

 private static void findVertical(char[][] word,int a,int b,int c,int[] vert){
  for(int i=0,j;i<3;i++){
   for(j=0;j<9;j++){
    if(j==a||i==b||i==c)continue;
    if(word[a][i]==word[j][0]&&word[b][i]==word[j][1]&&word[c][i]==word[j][2]){
     vert[i]=j;
     break;}}
   if(j==9)vert[i]=-1;}}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA41.txt");
  OutputStream out0=System.out;
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  main(in2,out3);
  in2.close();
  in1.close();
  out3.close();
  out2.close();
  out1.close();}}