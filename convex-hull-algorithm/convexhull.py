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
	i = 0
	while i + 1 < len(points) and points[i + 1][0] == points[i][0]:
		i += 1
	upperhull.append(points[i])
	
	for p in points[i + 1 : ]:
		while len(upperhull) >= 2:
			qx, qy = upperhull[-1]
			rx, ry = upperhull[-2]
			if (qx - p[0]) * (ry - p[1]) > (qy - p[1]) * (rx - p[0]):
				break
			else:
				del upperhull[-1]
		upperhull.append(p)
	
	lowerhull = []
	i = len(points) - 1
	while i > 0 and points[i - 1][0] == points[i][0]:
		i -= 1
	lowerhull.append(points[i])
	
	for p in reversed(points[ : i]):
		while len(lowerhull) >= 2:
			qx, qy = lowerhull[-1]
			rx, ry = lowerhull[-2]
			if (qx - p[0]) * (ry - p[1]) > (qy - p[1]) * (rx - p[0]):
				break
			else:
				del lowerhull[-1]
		lowerhull.append(p)
	
	if lowerhull[-1] == upperhull[0]:
		del lowerhull[-1]
	if len(lowerhull) > 0 and lowerhull[0] == upperhull[-1]:
		del lowerhull[0]
	return upperhull + lowerhull
