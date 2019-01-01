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

import {forEachItemIn, CUSTOM_MATCHERS} from '../jasmine_utils'
import {tabulate} from '../tabulate'
import {matmul2} from './matmul'
import {eye} from './eye'
import math from '../math'
import {zip_elems} from '../zip_elems'

import {eigen,
        eigen_balance_pre,
        eigen_balance_post} from './eigen'


describe('eigen', () => {
  beforeEach( () => {
    jasmine.addMatchers(CUSTOM_MATCHERS)
  })

  
  forEachItemIn(
    function*(){
      const randInt = (from,until) => Math.floor( Math.random() * (until-from) ) + from

      for( let run=1024; run-- > 0; )
      {
        const N = randInt(1,16),
           ndim = randInt(2, 5),
          shape = Array.from({ length: ndim-2 }, () => randInt(1,8) )
        shape.push(N,N)

        const A = tabulate(shape, 'float64', () => Math.random() < 0.1 ? 0 : Math.random()*2-1)
        Object.freeze(A.data.buffer)
        yield A
      }
    }()
  ).it('eigen works on random examples', A => {
    const [Λ,V] = eigen(A)

    expect(V.shape).toEqual( A.shape )
    expect(Λ.shape).toEqual( A.shape.slice(0,-1) )

    // ASSERT THAT THE EIGENVECTORS ARE NORMALIZED
    expect(
      V.   mapElems(   'float64', math.abs  )
       .reduceElems(-2,'float64', math.hypot)
    ).toBeAllCloseTo(1)

    const AV = matmul2(A,V);

    const λ = zip_elems([AV,V], 'complex128', (x,y) => math.mul(x, math.conj(y)) ).reduceElems(-2, 'complex128', math.add)
    expect(Λ).toBeAllCloseTo(λ)

    const λv = zip_elems([V,Λ.reshape(...Λ.shape.slice(0,-1),1,-1)], 'complex128', math.mul)
    expect(AV).toBeAllCloseTo(λv)
  })


  forEachItemIn(
    function*(){
      const randInt = (from,until) => Math.floor( Math.random() * (until-from) ) + from

      for( let run=1024; run-- > 0; )
      {
        const N = randInt(1,32),
           ndim = randInt(2, 5),
          shape = Array.from({ length: ndim-2 }, () => randInt(1,8) )
        shape.push(N,N)

        const A = tabulate(shape, 'float64', () => Math.random() < 0.1 ? 0 : Math.random()*2-1)
        Object.freeze(A.data.buffer)
        yield A
      }
    }()
  ).it('eigen_balance_pre works on random examples (p=2)', A => {
    const [D,S]= eigen_balance_pre(A,2),
         before= A.reduceElems('float64', math.hypot),
         after = S.reduceElems('float64', math.hypot)
    expect(after).not.toBeGreaterThan(before);

    const a = zip_elems(
      [D.reshape(...D.shape,1), S,
       D.reshape(...D.shape.slice(0,-1),1,-1)],
      'float64',
      (D_i,S_ij,D_j) => D_i * S_ij / D_j
    );

    expect(a).toBeAllCloseTo(A,{rtol:0, atol:0})
  })


  forEachItemIn(
    function*(){
      const randInt = (from,until) => Math.floor( Math.random() * (until-from) ) + from

      for( let run=1024; run-- > 0; )
      {
        const N = randInt(1,32),
           ndim = randInt(2, 5),
          shape = Array.from({ length: ndim-2 }, () => randInt(1,8) )
        shape.push(N,N)

        const A = tabulate(shape, 'float64', () => Math.random() < 0.1 ? 0 : Math.random()*2-1)
        Object.freeze(A.data.buffer)
        yield A
      }
    }()
  ).it('eigen_balance_pre works on random examples (p=∞)', A => {
    const absMax = (x,y) => math.max(
      math.abs(x),
      math.abs(y)
    )

    const [D,S]= eigen_balance_pre(A,Infinity),
         before= A.reduceElems('float64', absMax),
         after = S.reduceElems('float64', absMax)
    expect(after).not.toBeGreaterThan(before);

    const a = zip_elems(
      [D.reshape(...D.shape,1), S,
       D.reshape(...D.shape.slice(0,-1),1,-1)],
      'float64',
      (D_i,S_ij,D_j) => D_i * S_ij / D_j
    );

    expect(a).toBeAllCloseTo(A,{rtol:0, atol:0})
  })


  forEachItemIn(
    function*(){
      const randInt = (from,until) => Math.floor( Math.random() * (until-from) ) + from

      for( let run=1024; run-- > 0; )
      {
        const N = randInt(1,16),
           ndim = randInt(2, 5),
          shape = Array.from({ length: ndim-2 }, () => randInt(1,8) )
        shape.push(N,N)

        const A = tabulate(shape, 'float64', () => Math.random() < 0.1 ? 0 : Math.random()*2-1)
        Object.freeze(A.data.buffer)
        yield A
      }
    }()
  ).it('eigen_balance_post works on random examples', A => {
    const [D,B]= eigen_balance_pre(A,2),
          [Λ,U]= eigen(B),
             V = eigen_balance_post(D,U)

    expect(V.shape).toEqual( A.shape )
    expect(Λ.shape).toEqual( A.shape.slice(0,-1) )

    // ASSERT THAT THE EIGENVECTORS ARE NORMALIZED
    expect(
      V.   mapElems(   'float64', math.abs  )
       .reduceElems(-2,'float64', math.hypot)
    ).toBeAllCloseTo(1)

    const AV = matmul2(A,V);

    const λ = zip_elems([AV,V], 'complex128', (x,y) => math.mul(x, math.conj(y)) ).reduceElems(-2, 'complex128', math.add)
    expect(Λ).toBeAllCloseTo(λ)

    const λv = zip_elems([V,Λ.reshape(...Λ.shape.slice(0,-1),1,-1)], 'complex128', math.mul)
    expect(AV).toBeAllCloseTo(λv)
  })
})
