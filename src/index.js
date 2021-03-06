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

import * as dt from './dt'

export {math} from './math'
export * from './concat'
export * from './nd_array'
export * from './rand_normal'
export * from './stack'
export * from './tabulate'
export * from './zip_elems'

import * as geom from './geom'
import * as integrate from './integrate'
import * as io  from './io'
import * as iter from './iter'
import * as la  from './la'
import * as opt from './opt'
import * as rand from './rand'
import * as spatial from './spatial'

export {
  dt,
  geom,
  integrate,
  io,
  iter,
  la,
  opt,
  rand,
  spatial
}
