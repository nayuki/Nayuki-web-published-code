/* 
 * Facebook Anniversary
 * Copyright (c) 2012 Nayuki Minase
 */

// Note: The aspect ratio is 4/3


/* Globals */

global_settings {
  assumed_gamma   2.2
  max_trace_level 8
}

#default {
  finish {
    diffuse 0.9
    ambient 0.1
  }
}


/* Camera */

camera {
  perspective
  location < 2.0,  7.0, -5.0>
  right    < 4/3,  0.0,  0.0>
  up       < 0.0,  1.0,  0.0>
  look_at  <-0.1,  0.2,  0.0>
  angle    30  // Like a 67mm lens on a 35mm full-frame camera
}


/* Facebook cake */

union {
  // Rounded rectangular prism (centered at <0,0,0>)
  #local Roundness=0.2;
  #local Width=2.0;
  #local Depth=2.0;
  #local Height=0.6;
  #local Corner=<Width,Height,Depth>/2-Roundness*<1,1,1>;
  box { -Corner-Roundness*x, Corner+Roundness*x }
  box { -Corner-Roundness*y, Corner+Roundness*y }
  box { -Corner-Roundness*z, Corner+Roundness*z }
  cylinder { Corner*<-1,-1,-1>, Corner*<-1,-1,+1>, Roundness open }
  cylinder { Corner*<-1,-1,-1>, Corner*<-1,+1,-1>, Roundness open }
  cylinder { Corner*<-1,-1,-1>, Corner*<+1,-1,-1>, Roundness open }
  cylinder { Corner*<-1,+1,+1>, Corner*<-1,+1,-1>, Roundness open }
  cylinder { Corner*<-1,+1,+1>, Corner*<-1,-1,+1>, Roundness open }
  cylinder { Corner*<-1,+1,+1>, Corner*<+1,+1,+1>, Roundness open }
  cylinder { Corner*<+1,-1,+1>, Corner*<+1,-1,-1>, Roundness open }
  cylinder { Corner*<+1,-1,+1>, Corner*<+1,+1,+1>, Roundness open }
  cylinder { Corner*<+1,-1,+1>, Corner*<-1,+1,+1>, Roundness open }
  cylinder { Corner*<+1,+1,-1>, Corner*<+1,+1,+1>, Roundness open }
  cylinder { Corner*<+1,+1,-1>, Corner*<+1,-1,-1>, Roundness open }
  cylinder { Corner*<+1,+1,-1>, Corner*<-1,+1,-1>, Roundness open }
  sphere { Corner*<-1,-1,-1>, Roundness }
  sphere { Corner*<-1,-1,+1>, Roundness }
  sphere { Corner*<-1,+1,-1>, Roundness }
  sphere { Corner*<-1,+1,+1>, Roundness }
  sphere { Corner*<+1,-1,-1>, Roundness }
  sphere { Corner*<+1,-1,+1>, Roundness }
  sphere { Corner*<+1,+1,-1>, Roundness }
  sphere { Corner*<+1,+1,+1>, Roundness }
  
  translate <0,Height/2,0>
  pigment {
    image_map {
      jpeg "facebook-icon.jpg"
      once
      interpolate 2
    }
    translate <-0.5,-0.5>
    rotate 90*x
    scale 2
  }
  normal {
    bumps 0.2
    scale 0.04
  }
}


/* Birthday candle */

difference {
  // Main cylinder
  cylinder {
    <0,0.6,0>, <0,1.6,0>, 0.08
    pigment {
      color rgb <2,2,2>
    }
  }
  
  // Etch out some decorative spirals
  #macro spiral(N,Revs,StartAngle)
    union {
      #local i=0;
      #local PrevPoint=<0,0,0>;
      #while (i<=N)
        #local Frac=i/N;
        #local Angle=Frac*Revs*2*pi+StartAngle;
        #local Point=<cos(Angle)*0.08, 0.6+Frac, sin(Angle)*0.08>;
        sphere {
          Point, 0.025
        }
        #if (i>0)
          cylinder {
            PrevPoint, Point, 0.025
          }
        #end
        #local PrevPoint=Point;
        #local i=i+1;
      #end
    }
  #end
  union {
    spiral(50, 1.5, 0/3*2*pi)
    spiral(50, 1.5, 1/3*2*pi)
    spiral(50, 1.5, 2/3*2*pi)
    pigment {
      color rgb <1,0,0>
    }
  }
  normal {
    bumps 0.05
    scale 0.02
  }
}

cone {
  <0,1.6,0>, 0.08, <0,1.8,0>, 0
  pigment {
    color rgb <1,0,0>
  }
  normal {
    bumps 0.05
    scale 0.02
  }
}


/* Candle flame */

sphere {
  <0,0,0>, 1
  hollow
  scale <0.1,0.2,0.1>
  translate <0,2.0,0>
  pigment{
    transmit 1
  }
  interior {
    media {
      emission rgb <1,0.7,0.2>*5
    }
  }
}

// Area lights at 3 heights to simulate a volume light
light_source {
  <0,2.1,0>, rgb <1,0.7,0.2>*0.3
  area_light 0.1*x, 0.1*z, 4, 4
  fade_distance 1
  fade_power 2
  jitter
}
light_source {
  <0,2.0,0>, rgb <1,0.7,0.2>*0.6
  area_light 0.2*x, 0.2*z, 6, 6
  fade_distance 1
  fade_power 2
  jitter
}
light_source {
  <0,2.0,0>, rgb <1,0.76,0.2>*0.3
  area_light 0.1*x, 0.1*z, 4, 4
  fade_distance 1
  fade_power 2
  jitter
}


/* Silver cake tray */

cylinder {
  <0,0,0>, <0,-0.04,0>, 1.5
  pigment {
    color rgb <1,1,1>
  }
  finish {
    ambient 0.0
    diffuse 0.9
    reflection 0.99
  }
  normal {
    bumps 0.5
    scale 0.15
  }
}


/* Bottom plane */

plane {
  <0,1,0>, -0.04
  pigment {
    color rgb <1,1,1>*0.5
  }
}


/* Overhead lights */

light_source {
  <0,10,0>, rgb <1,1,1>
  area_light 4*x, 4*z, 15, 15
  fade_distance 5
  fade_power 2
  adaptive 1
  jitter
}