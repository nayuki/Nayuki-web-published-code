/* 
 * Alpaca Nanoblock model
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/nanoblock-modeling-in-povray
 */

// Note: The preferred aspect ratio is 4:5

#version 3.7;
#include "nanoblock.inc"


// User configuration
#local CameraMode = 0;  // 0 for normal, 1 or 2 for debug
#local ShowStep   = 0;  // 0 means to render all steps; a number from 1 to 6 means to render only that particular step


// Globals

global_settings {
	assumed_gamma 1
	max_trace_level 3
}

#default {
	finish {
		diffuse 0.9
		ambient 0.1
	}
}


// Camera
#local AspectRatio = image_width / image_height;  // Automatic
#if (CameraMode = 0)  // Normal view
	camera {
		perspective
		location   <-3.0, 2.0, 1.6>
		right      AspectRatio * x
		up         y
		direction  z
		sky        z
		look_at    <-0.2, 0.0, 0.85>
		// Vertical angle of view is 35 deg, similar to 57 mm focal length on 35 mm full-frame camera
		angle      degrees(atan(tan(radians(35 / 2)) * AspectRatio)) * 2
	}
#elseif (CameraMode = 1)  // Debugging top view
	camera {
		orthographic
		location   <0, 0, 4>
		right      AspectRatio * 1.2 * x
		up         1.2 * -y
		direction  -z
	}
#elseif (CameraMode = 2)  // Debugging front view
	camera {
		orthographic
		location   <-2, 0, 0.9>
		right      AspectRatio * 2.0 * y
		up         2.0 * z
		direction  x
	}
	light_source {
		<0, 2, 0.9>, rgb <1,1,1>
	}
#else
	#error "Invalid camera mode"
#end


// Bottom plane
plane {
	z, 0
	pigment {
		color rgb <1,1,1>*0.5
	}
}


// Overhead area light
light_source {
	<-2.0, 3.0, 2>, rgb <1,1,1>*1.8
	area_light <1,0,0>, <0,1,0>, 30, 30
	adaptive 3
	fade_distance 3
	fade_power 2
}


/* The alpaca Nanoblock model */

// Colors
#local Black = <0.002, 0.002, 0.002>;
#local Green = <0.25 , 0.45 , 0.05 >;
#local Tan   = <0.40 , 0.23 , 0.05 >;
#local White = <0.90 , 0.90 , 0.90 >;


// Step-by-step parts

#local Step1 = union {
	Brick(<2, 1, 0>, <2,4>, White)
	Brick(<7, 1, 0>, <2,4>, White)
	
	Brick(<1, 2, 1>, <4,2>, White)
	Brick(<5, 2, 1>, <4,2>, White)
	Brick(<9, 1, 1>, <1,4>, White)
	Brick(<2, 0, 1>, <2,2>, White)
	Brick(<7, 0, 1>, <2,2>, White)
	Brick(<2, 4, 1>, <2,2>, White)
	Brick(<7, 4, 1>, <2,2>, White)
	
	Brick(<1, 1, 2>, <1,4>, White)
	Brick(<3, 2, 2>, <4,2>, White)
	Brick(<7, 2, 2>, <4,2>, White)
	Brick(<2, 0, 2>, <4,2>, White)
	Brick(<6, 0, 2>, <4,2>, White)
	Brick(<2, 4, 2>, <4,2>, White)
	Brick(<6, 4, 2>, <4,2>, White)
};


#local Step2 = union {
	Brick(< 0, 2, 0>, <2,2>, White)
	Brick(< 9, 1, 0>, <1,4>, White)
	Brick(<10, 2, 0>, <1,2>, White)
	Brick(< 1, 1, 0>, <2,1>, White)
	Brick(< 2, 0, 0>, <2,1>, White)
	Brick(< 4, 0, 0>, <4,1>, White)
	Brick(< 8, 0, 0>, <2,1>, White)
	Brick(< 1, 4, 0>, <2,1>, White)
	Brick(< 2, 5, 0>, <2,1>, White)
	Brick(< 4, 5, 0>, <4,1>, White)
	Brick(< 8, 5, 0>, <2,1>, White)
};


#local Step3 = union {
	Brick(<0, 2, 0>, <1,2>, White)
	Brick(<1, 1, 0>, <1,4>, White)
	Brick(<9, 2, 0>, <2,2>, White)
	Brick(<2, 0, 0>, <1,2>, White)
	Brick(<3, 0, 0>, <4,1>, White)
	Brick(<7, 0, 0>, <2,2>, White)
	Brick(<9, 0, 0>, <1,2>, White)
	Brick(<2, 4, 0>, <1,2>, White)
	Brick(<3, 5, 0>, <4,1>, White)
	Brick(<7, 4, 0>, <2,2>, White)
	Brick(<9, 4, 0>, <1,2>, White)
	
	Brick(<0, 2, 1>, <2,2>, White)
	Brick(<8, 1, 1>, <2,4>, White)
	Brick(<1, 1, 1>, <1,1>, White)
	Brick(<2, 0, 1>, <4,2>, White)
	Brick(<6, 0, 1>, <2,2>, White)
	Brick(<8, 0, 1>, <1,1>, White)
	Brick(<1, 4, 1>, <1,1>, White)
	Brick(<2, 4, 1>, <4,2>, White)
	Brick(<6, 4, 1>, <2,2>, White)
	Brick(<8, 5, 1>, <1,1>, White)
	
	Brick(<0, 2, 2>, <1,2>, White)
	Brick(<1, 1, 2>, <2,4>, White)
	Brick(<3, 1, 2>, <2,4>, White)
	Brick(<5, 1, 2>, <2,4>, White)
	Brick(<7, 1, 2>, <2,4>, White)
};


#local Step4 = union {
	Brick(<0, 2, 0>, <4,2>, White)
	Brick(<1, 1, 0>, <2,1>, White)
	Brick(<1, 4, 0>, <2,1>, White)
	Brick(<1, 1, 1>, <2,4>, White)
	Brick(<0, 2, 1>, <1,2>, White)
	Brick(<3, 2, 1>, <1,2>, White)
	Brick(<0, 2, 2>, <4,2>, White)
	Brick(<1, 1, 2>, <2,1>, White)
	Brick(<1, 4, 2>, <2,1>, White)
	Brick(<1, 1, 3>, <2,4>, White)
	Brick(<0, 2, 3>, <1,2>, White)
	Brick(<3, 2, 3>, <1,2>, White)
	
	Brick(< 0, 1, 4>, <2,4>, White)
	Brick(< 2, 1, 4>, <2,4>, White)
	Brick(<-1, 2, 4>, <1,2>, White)
	Brick(< 1, 0, 4>, <2,1>, White)
	Brick(< 1, 5, 4>, <2,1>, White)
	Brick(<-2, 2, 5>, <4,2>, White)
	Brick(< 2, 2, 5>, <2,2>, White)
	Brick(< 0, 0, 5>, <4,2>, White)
	Brick(< 0, 4, 5>, <4,2>, White)
	
	Brick(<-2, 2, 6>, <1,2>, White)
	Brick(<-1, 2, 6>, <1,2>, White)
	Brick(< 0, 1, 6>, <2,4>, White)
	Brick(< 2, 1, 6>, <2,4>, White)
	Brick(< 0, 0, 6>, <4,1>, White)
	Brick(< 0, 5, 6>, <4,1>, White)
	Brick(<-1, 2.5, 7>, <1,1>, White)
	Brick(< 0, 2, 7>, <2,2>, White)
	Brick(< 2, 2, 7>, <1,2>, White)
	Brick(< 3, 1, 7>, <1,4>, White)
	Brick(< 1, 0, 7>, <2,2>, White)
	Brick(< 1, 4, 7>, <2,2>, White)
	Barrel(<0, 1, 7>, Black)
	Barrel(<0, 4, 7>, Black)
	
	Brick(<-1, 1,  8>, <2,4>, White)
	Brick(< 1, 2,  8>, <1,2>, White)
	Brick(< 2, 2,  8>, <2,2>, White)
	Brick(< 1, 1,  8>, <2,1>, White)
	Brick(< 1, 4,  8>, <2,1>, White)
	Brick(<-1, 2,  9>, <1,2>, White)
	Brick(< 0, 1,  9>, <2,4>, White)
	Brick(< 2, 2,  9>, <1,2>, White)
	Brick(< 2, 0,  9>, <1,2>, Tan)
	Brick(< 2, 0, 10>, <1,2>, Tan)
	Brick(< 2, 4,  9>, <1,2>, Tan)
	Brick(< 2, 4, 10>, <1,2>, Tan)
};


#local Step5 = union {
	#local Leg = union {
		Brick (<0  , 0, 4>, <2,1>, White)
		Brick (<0  , 0, 3>, <2,1>, White)
		Brick (<0.5, 0, 2>, <1,1>, White)
		Barrel(<0.5, 0, 1>,        White)
		Brick (<0.5, 0, 0>, <1,1>, White)
	};
	object { Leg translate <1.5, 3, 0> }
	object { Leg translate <6.5, 3, 0> }
	object { Leg translate <1.5, 5, 0> }
	object { Leg translate <6.5, 5, 0> }
};


#local Step6 = object {
	Brick(<0, 0, 0>, <10,10>, Green)
};


// The whole Nanoblock model put together
union {
	#if (ShowStep = 0 | ShowStep = 1)  object { Step1 translate <-0.5, 1.5,  6> }  #end
	#if (ShowStep = 0 | ShowStep = 2)  object { Step2 translate <-0.5, 1.5,  9> }  #end
	#if (ShowStep = 0 | ShowStep = 3)  object { Step3 translate <-0.5, 1.5, 10> }  #end
	#if (ShowStep = 0 | ShowStep = 4)  object { Step4 translate <-0.5, 1.5, 13> }  #end
	#if (ShowStep = 0 | ShowStep = 5)  object { Step5 translate <0, 0, 1> }  #end
	#if (ShowStep = 0 | ShowStep = 6)  object { Step6 translate <0, 0, 0> }  #end
	scale <1, 1, 0.75>         // Shrink the z-axis slightly because Nanoblock bricks are not perfect cubes; they're slightly flattened in height
	scale 1/10                 // Shrink the model so that the base plate is 1 unit long in both the x and y axes
	translate <-0.5, -0.5, 0>  // Center the model on (0, 0) in the x and y axes
}
