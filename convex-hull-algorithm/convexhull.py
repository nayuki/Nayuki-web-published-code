# 
# Convex hull algorithm - Library (Python)
# 
# Copyright (c) 2017 Project Nayuki
# https://www.nayuki.io/page/convex-hull-algorithm
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
# 
# You should have received a copy of the GNU Lesser General Public License
# along with this program (see COPYING.txt and COPYING.LESSER.txt).
# If not, see <http://www.gnu.org/licenses/>.
# 


# Returns a new list of points representing the convex hull of
# the given set of points. The convex hull excludes collinear points.
# This algorithm runs in O(n log n) time.
def make_hull(points):
	return make_hull_presorted(sorted(points))


# Returns the convex hull, assuming that each points[i] <= points[i + 1]. Runs in O(n) time.
def make_hull_presorted(points):
	if len(points) <= 1:
		return list(points)
	
	# Andrew's monotone chain algorithm. Positive y coordinates correspond to "up"
	# as per the mathematical convention, instead of "down" as per the computer
	# graphics convention. This doesn't affect the correctness of the result.
	
	upperhull = []
	for p in points:
		while len(upperhull) >= 2:
			qx, qy = upperhull[-1]
			rx, ry = upperhull[-2]
			if p[0] == upperhull[0][0] or (qx - rx) * (p[1] - ry) >= (qy - ry) * (p[0] - rx):
				del upperhull[-1]
			else:
				break
		upperhull.append(p)
	del upperhull[-1]
	
	lowerhull = []
	for p in reversed(points):
		while len(lowerhull) >= 2:
			qx, qy = lowerhull[-1]
			rx, ry = lowerhull[-2]
			if p[0] == lowerhull[0][0] or (qx - rx) * (p[1] - ry) >= (qy - ry) * (p[0] - rx):
				del lowerhull[-1]
			else:
				break
		lowerhull.append(p)
	del lowerhull[-1]
	
	if not (len(upperhull) == 1 and upperhull == lowerhull):
		upperhull.extend(lowerhull)
	return upperhull
