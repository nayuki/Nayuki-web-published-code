import java.io.*;


public class dwite200412p5{

 private static String problem="51";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  String[] province={"British Columbia","Alberta","Saskatchewan","Manitoba","Ontario","Quebec","Nova Scotia","Newfoundland","New Brunswick","Prince Edward Island"};
  String[] provinceprocessed=new String[province.length];
  for(int i=0;i<province.length;i++)provinceprocessed[i]=process(province[i]);
  for(int ii=0;ii<5;ii++){
   String line=process(in.readLine());
   int j=-1,k=-1;
   for(int i=0;i<province.length;i++){
    int tp=line.indexOf(provinceprocessed[i]);
    if(tp!=-1&&(k==-1||tp<k)){
     j=i;
     k=tp;}}
   if(j!=-1)out.println(province[j]);
   else out.println("NO PROVINCE FOUND");}}

 private static String process(String in){
  char[] tpchar=new char[in.length()];
  int j=0;
  for(int i=0;i<tpchar.length;i++){
   char c=in.charAt(i);
   if(c>='a'&&c<='z')tpchar[j++]=c;
   else if(c>='A'&&c<='Z')tpchar[j++]=(char)(c+32);}
  return new String(tpchar,0,j);}


 public static void main(String[] arg) throws IOException{
  Object[] streams;
  streams=diskStreams();
  InputStreamReader in1=new InputStreamReader((InputStream)streams[0],"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream((OutputStream)streams[1]);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  main(in2,out3);
  in2.close();
  in1.close();
  out3.close();
  out2.close();
  out1.close();}

 private static Object[] diskStreams() throws IOException{
  return new Object[]{new FileInputStream("DATA"+problem+".txt"),new FileOutputStream("OUT"+problem+".txt")};}}