import java.io.*;
import java.util.StringTokenizer;


public class dwite200501p4{

 private static String problem="41";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  String[] month={"JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"};
  String[] dayofweek={"SATURDAY","SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"};
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   String ms=st.nextToken();
   String ds=st.nextToken();
   int y=Integer.parseInt(st.nextToken());
   int m=-1;
   for(int i=0;i<month.length;i++){
    if(ms.equals(month[i]))m=i+1;}
   if(m<=2){
    m+=12;
    y--;}
   int c=y/100;
   y%=100;
   int d=Integer.parseInt(ds.substring(0,ds.length()-1));
   int dw=(26*(m+1)/10+d+y+y/4+c/4-2*c)%7;
   if(dw<0)dw+=7;
   out.println(dayofweek[dw]);}}


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