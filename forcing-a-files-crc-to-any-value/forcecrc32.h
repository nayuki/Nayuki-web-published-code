/*
 * CRC-32 forcer (C)
 *
 * Copyright (c) 2016 Project Nayuki
 * https://www.nayuki.io/page/forcing-a-files-crc-to-any-value
 *
 * Copyright (c) 2016 Elliott Mitchell
 * Creation of this whole header.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program (see COPYING.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */


#ifndef _FORCECRC32_H_
#define _FORCECRC32_H_

#include <stdint.h>


/* to induce a change of "delta" by changing 4 bytes starting endDistance
* from the end of the data, exclusive-or with the returned value (note,
* endDistance better be at least 4) */
extern uint32_t reverse_crc32(uint32_t delta, uint64_t endDistance);

#endif

