/* 
 * Nanoblock common definitions (POV-Ray)
 * 
 * Copyright (c) 2015 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/nanoblock-modeling-in-povray
 */


#declare Gap = 0.02;


#macro Brick(Offset, Size, Color)
	box {
		Offset + Gap * <1,1,1>, Offset + Size + <0,0,1> - Gap * <1,1,1>
		pigment {
			color rgbf Color
		}
	}
#end


#macro Barrel(Offset, Color)
	cylinder {
		Offset + <0.5,0.5,0> + Gap * <0,0,1>, Offset + <0.5,0.5,1> - Gap * <0,0,1>, (1 - Gap) / 2
		pigment {
			color rgbf Color
		}
	}
#end
