import java.awt.*;
import java.awt.event.*;
import java.awt.geom.*;
import java.io.*;
import java.util.*;


public class ecoo2006regionalp3 extends Canvas implements MouseListener{

 static Graphics2D g;
 static int width=900;

 static void main(BufferedReader in,ecoo2006regionalp3 screen) throws IOException{
  double[] c0=new double[2];
  double r0;
  double[] c1=new double[2];
  double r1;

  String line=in.readLine();
  StringTokenizer st=new StringTokenizer(line," ");
  c0[0]=Integer.parseInt(st.nextToken());
  c0[1]=Integer.parseInt(st.nextToken());
  r0=Integer.parseInt(st.nextToken());
  line=in.readLine();
  st=new StringTokenizer(line," ");
  c1[0]=Integer.parseInt(st.nextToken());
  c1[1]=Integer.parseInt(st.nextToken());
  r1=Integer.parseInt(st.nextToken());

  clear();
  drawGrid();
  drawCircle(c0,r0);
  drawCircle(c1,r1);

  // Mathematical geometric processing starts here.
  double[] join=subtract(c1,c0); // The vector from c0 to c1
  double[] dir=perpendicular(subtract(c1,c0)); // The vector perpendicular to the previous one
  join=multiply(1/norm(join),join); // Scale it into a unit vector
  double[] mid=multiply(1/2D,add(add(c0,multiply(r0,join)),subtract(c1,multiply(r1,join)))); // The point on the line joining the two circle centres that is equidistant to both circumferences


  double[] p0=null;
  double[] p1=null;
  double min;
  double tp;
  // Find the closest intersection between the forward ray and a wall.
  min=Double.POSITIVE_INFINITY;
  tp=intersect(mid,dir,1,0,0);
  if(tp>=0&&(tp<min||min==0))min=tp; // Allow the ray's origin to be coincident with a wall, but prefer an intersection that is not.
  tp=intersect(mid,dir,0,1,0);
  if(tp>=0&&(tp<min||min==0))min=tp;
  tp=intersect(mid,dir,1,0,-40);
  if(tp>=0&&(tp<min||min==0))min=tp;
  tp=intersect(mid,dir,0,1,-40);
  if(tp>=0&&(tp<min||min==0))min=tp;
  p0=add(mid,multiply(min,dir));
  // Now with the backward ray.
  min=Double.NEGATIVE_INFINITY;
  tp=intersect(mid,dir,1,0,0);
  if(tp<=0&&(tp>min||min==0))min=tp;
  tp=intersect(mid,dir,0,1,0);
  if(tp<=0&&(tp>min||min==0))min=tp;
  tp=intersect(mid,dir,1,0,-40);
  if(tp<=0&&(tp>min||min==0))min=tp;
  tp=intersect(mid,dir,0,1,-40);
  if(tp<=0&&(tp>min||min==0))min=tp;
  p1=add(mid,multiply(min,dir));

  g.setStroke(new BasicStroke((float)(3*width*(40/42D)/400),BasicStroke.CAP_ROUND,BasicStroke.JOIN_ROUND));
  g.setColor(Color.RED);
  drawLine(p0[0],p0[1],p1[0],p1[1]);
  boolean startdone=true;
  boolean enddone=true;
  boolean p0done=false;
  boolean p1done=false;
  if(manhattanDistance(p0,new double[]{0,0})<=40){
   drawLine(0,0,p0[0],p0[1]);
   p0done=true;}
  else if(manhattanDistance(p1,new double[]{0,0})<=40){
   drawLine(0,0,p1[0],p1[1]);
   p1done=true;}
  else startdone=false;
  if(!p0done&&manhattanDistance(p0,new double[]{40,40})<=40){
   drawLine(p0[0],p0[1],40,40);
   p0done=true;}
  else if(!p1done&&manhattanDistance(p1,new double[]{40,40})<=40){
   drawLine(p1[0],p1[1],40,40);
   p1done=true;}
  else enddone=false;
  if(!startdone&&!enddone)throw new RuntimeException();;
  if(!startdone){
   double[] p2,p3;
   if(!p0done)p2=p0;
   else p2=p1;
   if(manhattanDistance(p2,new double[]{40,0})<=manhattanDistance(p2,new double[]{0,40}))p3=new double[]{40,0};
   else p3=new double[]{0,40};
   drawLine(0,0,p3[0],p3[1]);
   drawLine(p3[0],p3[1],p2[0],p2[1]);}
  if(!enddone){
   double[] p2,p3;
   if(!p0done)p2=p0;
   else p2=p1;
   if(manhattanDistance(p2,new double[]{40,0})<=manhattanDistance(p2,new double[]{0,40}))p3=new double[]{40,0};
   else p3=new double[]{0,40};
   drawLine(p3[0],p3[1],40,40);
   drawLine(p2[0],p2[1],p3[0],p3[1]);}

  screen.repaint();
  try{
   synchronized(screen){
    screen.wait();}}
  catch(InterruptedException e){}}


 static void clear(){
  g.setColor(Color.WHITE);
  g.fillRect(0,0,width,width);}

 static void drawGrid(){
  g.setColor(Color.BLACK);
  g.setStroke(new BasicStroke((float)(width*(40/42D)/400)));
  for(int x=0;x<=40;x++)drawLine(x,0,x,40);
  for(int y=0;y<=40;y++)drawLine(0,y,40,y);}

 static void drawLine(double x0,double y0,double x1,double y1){
  g.draw(new Line2D.Double((x0+1)/42*width,(40-y0+1)/42*width,(x1+1)/42*width,(40-y1+1)/42*width));}

 static void drawCircle(double[] center,double radius){
  radius+=1/20D;
  g.setColor(Color.BLACK);
  g.fill(new Ellipse2D.Double((center[0]-radius+1)/42*width,(40-center[1]-radius+1)/42*width,radius*2/42*width,radius*2/42*width));
  g.setColor(Color.WHITE);
  radius-=1/10D;
  g.fill(new Ellipse2D.Double((center[0]-radius+1)/42*width,(40-center[1]-radius+1)/42*width,radius*2/42*width,radius*2/42*width));}


 static double[] add(double[] x,double[] y){
  double[] ret=new double[x.length];
  for(int i=0;i<x.length;i++)ret[i]=x[i]+y[i];
  return ret;}

 static double[] subtract(double[] x,double[] y){
  double[] ret=new double[x.length];
  for(int i=0;i<x.length;i++)ret[i]=x[i]-y[i];
  return ret;}

 static double[] multiply(double x,double[] y){
  double[] ret=new double[y.length];
  for(int i=0;i<y.length;i++)ret[i]=y[i]*x;
  return ret;}

 static double norm(double[] x){
  double s=0;
  for(int i=0;i<x.length;i++)s+=x[i]*x[i];
  return Math.sqrt(s);}

 static double[] perpendicular(double[] x){
  return new double[]{-x[1],x[0]};}

 static double manhattanDistance(double[] x,double[] y){
  return Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1]);}

 /*
 Intersects a ray and a plane:
  Plane: ax + by + c = 0
  Ray:
   x(t) = ox + t dx
   y(t) = oy + t dy
 Solves for t and returns it.
 */
 static double intersect(double[] origin,double[] direction,double a,double b,double c){
  return -(a*origin[0]+b*origin[1]+c)/(a*direction[0]+b*direction[1]);}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA31.txt"));
  ecoo2006regionalp3 screen=new ecoo2006regionalp3(width);
  g=screen.bufferg;
  g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
  for(int i=0;i<5;i++)main(in,screen);
  screen.dispose();}


 Frame frame;
 Object waiter=new Object();
 Image buffer;
 Graphics2D bufferg;


 ecoo2006regionalp3(int width){
  addMouseListener(this);
  frame=new Frame();
  frame.add(this);
  this.setSize(width,width);
  frame.pack();
  frame.setVisible(true);
  buffer=createImage(width,width);
  bufferg=(Graphics2D)buffer.getGraphics();}


 public void update(Graphics g){
  paint(g);}

 public void paint(Graphics g){
  g.drawImage(buffer,0,0,this);}


 public void mouseClicked(MouseEvent e){
  if(e.getSource()==this){
   synchronized(this){
    notify();}}}

 public void mouseEntered(MouseEvent e){}
 public void mouseExited(MouseEvent e){}
 public void mousePressed(MouseEvent e){}
 public void mouseReleased(MouseEvent e){}

 public void dispose(){
  frame.dispose();}}