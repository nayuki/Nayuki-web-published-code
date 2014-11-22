/* 
 * Kaminarimon Nanoblock model
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/
 */

// Note: The preferred aspect ratio is 4:3

#version 3.7;
#include "nanoblock.inc"


// User configuration
#local CameraMode = 0;  // 0 for normal, 1 or 2 for debug
#local ShowStep = 0;  // 0 means to render all steps; a number from 1 to 10 means to render only that particular step


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
		location   <0.5, 2.5, 0.75>
		right      AspectRatio * x
		up         y
		direction  z
		sky        z
		look_at    <-0.10, -0.05, 0.32>
		angle      35  // Similar to 57 mm focal length on 35 mm full-frame camera
	}
#elseif (CameraMode = 1)  // Debugging top view
	camera {
		orthographic
		location   <0, 0, 4>
		right      AspectRatio * 1.1 * x
		up         1.1 * -y
		direction  -z
	}
#elseif (CameraMode = 2)  // Debugging front view
	camera {
		orthographic
		location   <0, 2, 0.5>
		right      AspectRatio * 1.1 * x
		up         1.1 * z
		direction  -y
	}
	light_source {
		<0, 2, 0.5>, rgb <1,1,1>
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
	<0.5, 2.5, 2>, rgb <1,1,1>*1.8
	area_light <1,0,0>, <0,1,0>, 30, 30
	adaptive 3
	fade_distance 3
	fade_power 2
}


/* The Kaminarimon Nanoblock model */

// Colors
#local Black = <0.002, 0.002, 0.002>;
#local Gray  = <0.25 , 0.25 , 0.25 >;
#local Brown = <0.10 , 0.03 , 0.01 >;
#local Red   = <0.50 , 0.02 , 0.00 >;
#local Green = <0.00 , 0.18 , 0.09 >;
#local White = <0.90 , 0.90 , 0.90 >;
#local Amber = <0.90 , 0.70 , 0.00 >;
#local ClearWhite = <0.90, 0.90, 0.90, 0.50>;


// Step-by-step parts

#local Step1 = union {
	Brick(<0, 0, 0>, <20,20>, Gray)  // The big base plate
	
	#local FiveBarrels = union {
		Barrel(<0, 2, 1>, Brown)
		Barrel(<2, 2, 1>, Brown)
		Barrel(<4, 2, 1>, Brown)
		Barrel(<0, 4, 1>, Brown)
		Barrel(<0, 6, 1>, Brown)
	};
	
	#local Half = union {
		object { FiveBarrels }
		object { FiveBarrels scale <1,-1,1> translate <0,16,0> }
		Brick(<2, 4, 1>, <4,1>, Black)
		Brick(<2, 5, 1>, <4,2>, Black)
		Brick(<2, 7, 1>, <4,2>, Black)
		Brick(<2, 9, 1>, <4,2>, Black)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
};


#local Step2 = union {
	#local Half = union {
		Brick(<1,  2, 0>, <4,1>, Brown)
		Brick(<0,  2, 0>, <1,4>, Brown)
		Brick(<0,  6, 0>, <1,4>, Brown)
		Brick(<0, 10, 0>, <1,4>, Brown)
		Brick(<1, 13, 0>, <4,1>, Brown)
		
		Barrel(<2,  4, 0>, Red)
		Barrel(<5,  4, 0>, Red)
		Barrel(<2,  7, 0>, Red)
		Barrel(<5,  7, 0>, Red)
		Barrel(<2, 10, 0>, Red)
		Barrel(<5, 10, 0>, Red)
		Barrel(<5,  8, 0>, Green)
		Barrel(<5,  9, 0>, Green)
		Barrel(<3, 10, 0>, Green)
		Barrel(<4, 10, 0>, Green)
		Brick(<3, 4, 0>, <2,1>, Red)
		Brick(<2, 5, 0>, <4,2>, Red)
		Brick(<3, 7, 0>, <2,1>, Red)
		Brick(<2, 8, 0>, <3,1>, Red)
		Brick(<2, 9, 0>, <3,1>, Red)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
};


#local Step3 = union {
	#local Half = union {
		Brick(<2,  4, 0>, <1,6>, Red)
		Brick(<5,  5, 0>, <1,6>, Red)
		Brick(<3,  4, 0>, <3,1>, Red)
		Brick(<3,  7, 0>, <3,1>, Red)
		Brick(<2, 10, 0>, <3,1>, Red)
		Brick(<3,  5, 0>, <2,2>, Black)
		Brick(<3,  8, 0>, <2,2>, Black)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
};


#local Step4 = union {
	#local Half = union {
		Barrel(<2,  4, 0>, Red)
		Barrel(<5,  4, 0>, Red)
		Barrel(<2,  7, 0>, Red)
		Barrel(<5,  7, 0>, Red)
		Barrel(<2, 10, 0>, Red)
		Barrel(<5, 10, 0>, Red)
		Barrel(<5,  8, 0>, Green)
		Barrel(<5,  9, 0>, Green)
		Barrel(<3, 10, 0>, Green)
		Barrel(<4, 10, 0>, Green)
		Barrel(<3,  6, 0>, Brown)
		Barrel(<4,  6, 0>, Brown)
		Barrel(<4,  9, 0>, Brown)
		Brick(<3, 4, 0>, <2,1>, Red)
		Brick(<2, 5, 0>, <1,2>, Red)
		Brick(<3, 7, 0>, <2,1>, Red)
		Brick(<2, 8, 0>, <1,2>, Red)
		
		Brick(<3, 6, 1>, <2,1>, Brown)
		Barrel(<3.5, 6, 2>, Brown)
		Brick(<3, 6, 3>, <2,1>, Brown)
		Barrel(<3.5, 6, 4>, Brown)
		
		Barrel(<2, 4, 1>, Red)
		Barrel(<2, 4, 2>, Red)
		Barrel(<2, 4, 3>, Red)
		Barrel(<2, 4, 4>, Red)
		Barrel(<2, 4, 5>, Red)
		Barrel(<5, 4, 1>, Red)
		Barrel(<5, 4, 2>, Red)
		Barrel(<5, 4, 3>, Red)
		Barrel(<5, 4, 4>, Red)
		Barrel(<5, 4, 5>, Red)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
};


#local Step5 = union {
	#local Half = union {
		Barrel(<5, 7, 0>, Red)
		Barrel(<5, 7, 1>, Red)
		Barrel(<5, 7, 2>, Red)
		Barrel(<5, 7, 3>, Red)
		Barrel(<5, 7, 4>, Red)
		Brick(<2, 5, 0>, <1,2>, Red)
		Brick(<2, 5, 1>, <1,2>, Red)
		Brick(<2, 5, 2>, <1,2>, Red)
		Brick(<2, 5, 3>, <1,2>, Red)
		Brick(<2, 5, 4>, <1,2>, Red)
		Brick(<3, 7, 0>, <2,1>, Red)
		Brick(<3, 7, 1>, <2,1>, Red)
		Brick(<3, 7, 2>, <2,1>, Red)
		Brick(<3, 7, 3>, <2,1>, Red)
		Brick(<3, 7, 4>, <2,1>, Red)
		Brick(<3, 7, 5>, <2,1>, Red)
		
		Barrel(<3, 8, -1>, Brown)
		Brick(<3, 8, 0>, <2,1>, Brown)
		Barrel(<3.5, 8, 1>, Brown)
		Brick(<3, 8, 2>, <2,1>, Brown)
		Barrel(<3.5, 8, 3>, Brown)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
};


#local Step6 = union {
	#local Half = union {
		Barrel(<2,  7, 0>, Red)
		Barrel(<2,  7, 1>, Red)
		Barrel(<2,  7, 2>, Red)
		Barrel(<2,  7, 3>, Red)
		Barrel(<2,  7, 4>, Red)
		Barrel(<2, 10, 0>, Red)
		Barrel(<2, 10, 1>, Red)
		Barrel(<2, 10, 2>, Red)
		Barrel(<2, 10, 3>, Red)
		Barrel(<2, 10, 4>, Red)
		Barrel(<5, 10, 0>, Red)
		Barrel(<5, 10, 1>, Red)
		Barrel(<5, 10, 2>, Red)
		Barrel(<5, 10, 3>, Red)
		Barrel(<5, 10, 4>, Red)
		Brick(<2, 8, 0>, <1,2>, Red)
		Brick(<2, 8, 1>, <1,2>, Red)
		Brick(<2, 8, 2>, <1,2>, Red)
		Brick(<2, 8, 3>, <1,2>, Red)
		Brick(<2, 8, 4>, <1,2>, Red)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
};


#local Step7 = union {
	#local Half = union {
		Brick(<2, 4, 0>, <4,2>, Red)
		Brick(<2, 6, 0>, <1,3>, Red)
		Brick(<5, 6, 0>, <1,3>, Red)
		Brick(<2, 9, 0>, <4,2>, Red)
		
		Barrel(<2,  4, 1>, Red)
		Barrel(<5,  4, 1>, Red)
		Barrel(<2,  7, 1>, Red)
		Barrel(<2, 10, 1>, Red)
		Barrel(<5, 10, 1>, Red)
		Barrel(<5,  8, 1>, Green)
		Barrel(<5,  9, 1>, Green)
		Barrel(<3, 10, 1>, Green)
		Barrel(<4, 10, 1>, Green)
		Brick(<2, 5, 1>, <1,2>, Red)
		Brick(<5, 5, 1>, <1,2>, Red)
		Brick(<3, 7, 1>, <3,1>, Red)
		Brick(<2, 8, 1>, <1,2>, Red)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
};


#local Step8 = union {
	#local Half = union {
		Brick(<2,  4, 0>, <8,2>, Red)
		Brick(<2,  9, 0>, <8,2>, Red)
		Brick(<2,  6, 0>, <1,3>, Red)
		Brick(<5,  6, 0>, <1,3>, Red)
		
		Brick(<3,  4, 1>, <2,1>, White)
		Brick(<6,  4, 1>, <2,1>, White)
		Brick(<2,  5, 1>, <1,2>, White)
		Brick(<2,  8, 1>, <1,2>, White)
		Brick(<3, 10, 1>, <2,1>, White)
		Brick(<6, 10, 1>, <2,1>, White)
		Brick(<2,  3, 1>, <1,2>, Red)
		Brick(<2, 10, 1>, <1,2>, Red)
		Barrel(<2, 7, 1>, Red)
		Brick(<5, 4, 1>, <1,3>, Red)
		Brick(<5, 8, 1>, <1,3>, Red)
		Brick(<8, 4, 1>, <1,2>, Red)
		Brick(<9, 4, 1>, <1,6>, Red)
		
		Brick(<2, 4, 2>, <4,2>, Red)
		Brick(<1, 7, 2>, <2,1>, Red)
		Brick(<5, 6, 2>, <1,3>, Red)
		Brick(<2, 9, 2>, <8,2>, Red)
	};
	
	object { Half }
	object { Half scale <-1,1,1> translate <20,0,0> }
	
	// Center-bridging parts
	Brick(<8, 10, 1>, <4,2>, Green)
	Brick(<6,  4, 2>, <8,2>, Red)
	
	// Lantern
	Brick(< 9, 6,  0>, <2,2>, Black)
	Brick(< 9, 6, -1>, <2,1>, Red)
	Brick(< 9, 7, -1>, <2,1>, Red)
	Brick(< 9, 5, -2>, <2,4>, Red)
	Brick(< 8, 6, -2>, <1,2>, Red)
	Brick(<11, 6, -2>, <1,2>, Red)
	Brick(< 8, 5, -3>, <4,2>, Red)
	Brick(< 8, 7, -3>, <4,2>, Red)
	Brick(< 8, 5, -4>, <2,4>, Red)
	Brick(<10, 5, -4>, <2,4>, Red)
	Brick(< 8, 5, -5>, <4,2>, Red)
	Brick(< 8, 7, -5>, <4,2>, Red)
	Brick(< 8, 5, -6>, <2,4>, Red)
	Brick(<10, 5, -6>, <2,4>, Red)
	Brick(< 8, 6, -7>, <4,2>, Red)
	Brick(< 9, 5, -7>, <2,1>, Red)
	Brick(< 9, 8, -7>, <2,1>, Red)
	Brick(< 9, 6, -8>, <2,2>, Amber)
};


#local Step9 = union {
	#local DepthHalf = union {
		Brick(< 0, 11.5, 0>, <4,2>, Black)
		Brick(< 4, 11.5, 0>, <8,2>, Black)
		Brick(<12, 11.5, 0>, <8,2>, Black)
		Brick(< 0, 10.5, 1>, <8,2>, Black)
		Brick(< 8, 10.5, 1>, <8,2>, Black)
		Brick(<16, 10.5, 1>, <4,2>, Black)
		Brick(< 0,  9.5, 2>, <4,2>, Black)
		Brick(< 4,  9.5, 2>, <8,2>, Black)
		Brick(<12,  9.5, 2>, <8,2>, Black)
		Brick(< 0,  8.5, 3>, <8,2>, Black)
		Brick(< 8,  8.5, 3>, <8,2>, Black)
		Brick(<16,  8.5, 3>, <4,2>, Black)
		Brick(< 0,  7.5, 4>, <4,2>, Black)
		Brick(< 4,  7.5, 4>, <8,2>, Black)
		Brick(<12,  7.5, 4>, <8,2>, Black)
		
		Brick(< 1,  8.5, 5>, <1,2>, Black)
		Brick(< 1,  9.5, 4>, <1,2>, Black)
		Brick(< 1, 10.5, 3>, <1,2>, Black)
		Brick(<18,  8.5, 5>, <1,2>, Black)
		Brick(<18,  9.5, 4>, <1,2>, Black)
		Brick(<18, 10.5, 3>, <1,2>, Black)
	};
	
	#local BreadthHalf = union {
		Brick(<2, 3.5, 0>, <1,3>, Red  )
		Brick(<2, 6.5, 0>, <1,2>, White)
		Brick(<2, 8.5, 0>, <1,3>, Red  )
		Brick(<2, 4.5, 1>, <1,6>, Red  )
		Brick(<2, 5.5, 2>, <1,2>, Red  )
		Brick(<2, 7.5, 2>, <1,2>, Red  )
		Brick(<2, 6.5, 3>, <1,2>, Red  )
		
		Brick(<0, 6.5, 6>, <1,2>, Black)
		Brick(<1, 5.5, 6>, <1,4>, Black)
		Brick(<2, 6.5, 6>, <8,2>, Black)
		Brick(<1, 6.5, 7>, <1,2>, Black)
	};
	
	object { BreadthHalf }
	object { BreadthHalf scale <-1,1,1> translate <20,0,0> }
	object { DepthHalf }
	object { DepthHalf scale <1,-1,1> translate <0,15,0> }
	
	// Center-bridging parts
	Brick(< 0, 6.5, 5>, <8,2>, Black)
	Brick(< 8, 6.5, 5>, <8,2>, Black)
	Brick(<16, 6.5, 5>, <4,2>, Black)
};


#local Step10 = union {
	// Tree
	union {
		Barrel(< 1, 18, 0>, Brown)
		Barrel(< 1, 18, 1>, Brown)
		Barrel(< 1, 18, 2>, Brown)
		Barrel(< 1, 18, 3>, Brown)
		Barrel(< 1, 18, 4>, Brown)
		Barrel(< 1, 18, 5>, Brown)
		
		Brick (<-1, 18, 6>, <4,1>, Brown)
		Barrel(<-1, 18, 5>, Green)
		Barrel(<-1, 18, 4>, Green)
		Barrel(< 2, 18, 5>, Green)
		
		Brick (< 1, 17, 7>, <1,4>, Brown)
		Barrel(< 1, 17, 6>, Green)
		Barrel(< 1, 17, 5>, Green)
		Barrel(< 1, 17, 4>, Green)
		Barrel(< 1, 19, 6>, Green)
		Barrel(< 1, 19, 5>, Green)
		Barrel(< 1, 20, 6>, Green)
		Barrel(< 1, 20, 5>, Green)
		Barrel(< 1, 20, 4>, Green)
		Barrel(< 1, 18, 8>, Brown)
		Barrel(< 1, 18, 9>, Green)
		Barrel(< 1, 19, 8>, Green)
		
		translate <-1.5, -18.5, 0>
		rotate <0, 0, 45>
		translate < 1.5,  18.5, 0>
	}

	// Thingamajig
	union {
		Brick(<14, 14, 0>, <3,1>, Black)
		Brick(<14, 18, 0>, <3,1>, Black)
		
		Brick(<14, 14, 1>, <1,1>, Black)
		Brick(<16, 14, 1>, <1,1>, Black)
		Brick(<14, 18, 1>, <1,1>, Black)
		Brick(<16, 18, 1>, <1,1>, Black)
		Brick(<15, 14, 1>, <1,2>, ClearWhite)
		Brick(<15, 17, 1>, <1,2>, ClearWhite)
		
		Brick(<14, 14, 2>, <3,1>, Black)
		Brick(<14, 18, 2>, <3,1>, Black)
		
		Brick(<14, 15, 1>, <1,3>, Black)
		Brick(<13, 15, 2>, <3,1>, Red)
		Brick(<13, 16, 2>, <3,1>, Red)
		Brick(<13, 17, 2>, <3,1>, Red)
		Brick(<14, 15, 3>, <1,3>, Red)
		
		object {  // An arm
			Brick(<10, 15, 1>, <4,1>, Black)
			translate <-13.5, -15.5, 0>
			rotate <0, 0, -degrees(atan2(1,6))>
			translate < 13.5,  15.5, 0>
		}
		object {  // An arm
			Brick(<10, 17, 1>, <4,1>, Black)
			translate <-13.5, -17.5, 0>
			rotate <0, 0, degrees(atan2(1,6))>
			translate < 13.5,  17.5, 0>
		}
		Brick(<13 - sqrt(35)/2, 15, 2>, <1,3>, Amber)
		
		Brick(<15, 14, 3>, <1,1>, Black)
		Brick(<15, 18, 3>, <1,1>, Black)
		Brick(<15, 14, 4>, <2,1>, Black)
		Brick(<15, 18, 4>, <2,1>, Black)
		
		Brick(<16, 15, 2>, <1,3>, Black)
		Brick(<15, 15, 3>, <2,1>, Black)
		Brick(<15, 16, 3>, <2,2>, Black)
		Brick(<15, 15, 4>, <1,3>, Red  )
		Brick(<16, 15, 4>, <2,1>, Gray )
		Brick(<16, 17, 4>, <2,1>, Gray )
		Brick(<17, 15, 5>, <1,1>, Gray )
		Brick(<17, 15, 6>, <1,1>, Gray )
		Brick(<17, 17, 5>, <1,1>, Gray )
		Brick(<17, 17, 6>, <1,1>, Gray )
		Brick(<16, 14.5, 7>, <2,4>, Black)
	}
};


// The whole Nanoblock model put together
union {
	#if (ShowStep = 0 | ShowStep =  1)  object { Step1  translate <0, 0,  0> }  #end
	#if (ShowStep = 0 | ShowStep =  2)  object { Step2  translate <0, 0,  2> }  #end
	#if (ShowStep = 0 | ShowStep =  3)  object { Step3  translate <0, 0,  3> }  #end
	#if (ShowStep = 0 | ShowStep =  4)  object { Step4  translate <0, 0,  4> }  #end
	#if (ShowStep = 0 | ShowStep =  5)  object { Step5  translate <0, 0,  5> }  #end
	#if (ShowStep = 0 | ShowStep =  6)  object { Step6  translate <0, 0,  5> }  #end
	#if (ShowStep = 0 | ShowStep =  7)  object { Step7  translate <0, 0, 10> }  #end
	#if (ShowStep = 0 | ShowStep =  8)  object { Step8  translate <0, 0, 12> }  #end
	#if (ShowStep = 0 | ShowStep =  9)  object { Step9  translate <0, 0, 15> }  #end
	#if (ShowStep = 0 | ShowStep = 10)  object { Step10 translate <0, 0,  1> }  #end
	
	scale <1, 1, 0.75>         // Shrink the z-axis slightly because Nanoblock bricks are not perfect cubes; they're slightly flattened in height
	scale 1/20                 // Shrink the model so that the base plate is 1 unit long in both the x and y axes
	translate <-0.5, -0.5, 0>  // Center the model on (0, 0) in the x and y axes
}
