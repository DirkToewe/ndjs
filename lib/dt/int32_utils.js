'use strict';
/* This file is part of ND.JS.
 *
 * ND.JS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ND.JS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ND.JS. If not, see <http://www.gnu.org/licenses/>.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bitCount = bitCount;

function bitCount(bits) {
  bits = bits | 0;
  bits = (bits >>> 1 & 1431655765) + (bits & 1431655765);
  bits = (bits >>> 2 & 858993459) + (bits & 858993459);
  bits = (bits >>> 4 & 252645135) + (bits & 252645135);
  bits = (bits >>> 8 & 16711935) + (bits & 16711935);
  bits = (bits >>> 16) + (bits & 65535);
  return bits;
}