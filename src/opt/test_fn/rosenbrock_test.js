'use strict';

/* This file is part of ND4JS.
 *
 * ND4JS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ND4JS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ND4JS. If not, see <http://www.gnu.org/licenses/>.
 */

import {forEachItemIn, CUSTOM_MATCHERS} from '../../jasmine_utils'
import {array} from '../../nd_array'

import {generic_test_test_fn} from './_generic_test_test_fn'
import {Rosenbrock} from './rosenbrock'


describe('rosenbrock2d', () => {
  beforeEach( () => {
    jasmine.addMatchers(CUSTOM_MATCHERS)
  })

  const rosenbrock2d = new Rosenbrock(2);

  forEachItemIn(
    function*(){
      const  S = 3.14, Δ = 0.042

      for( let x = -S; x <= +S; x+=Δ )
      for( let y = -S; y <= +S; y+=Δ )
        yield [x,y]
    }()
  ).it('works for generated examples', ([x,y]) => {
    const f = rosenbrock2d( array([x,y]) ),
          F = ( 10*(y-x*x) )**2 + (1-x)**2;

    expect(f).toBeAllCloseTo(F);
  })
})

for( const length of [2,3] )
  generic_test_test_fn( new Rosenbrock(length), Array.from({length}, () => [-8,+8]) );
