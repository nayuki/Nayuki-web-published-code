import java.io.*;


public class ecoo2005boardwidep2{

 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   char[][] screen=new char[25][79];
   for(int y=0;y<25;y++){
    for(int x=0;x<79;x++)screen[y][x]=' ';}
   int x=39;
   int y=12;
   String line=in.readLine();
   char last='#';
   for(int i=0;i<line.length();i++){
    char c=line.charAt(i);
    if(c=='?')last=screen[y][x++]=line.charAt(++i);
    else if(c=='<'){
     int tp0=line.indexOf('>',++i);
     int tp1=Integer.parseInt(line.substring(i+1,tp0));
     switch(line.charAt(i)){
      case 'U': y-=tp1; break;
      case 'D': y+=tp1; break;
      case 'L': x-=tp1; break;
      case 'R': x+=tp1; break;
      case 'M': for(int j=0;j<tp1-1;j++,x++)screen[y][x]=last; break;}
     i=tp0;}
    else last=screen[y][x++]=c;}
   for(y=0;y<25;y++)out.println(new String(screen[y]));}}


 public static void main(String[] arg) throws IOException{
  InputStream in0=new FileInputStream("DATA21.txt");
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