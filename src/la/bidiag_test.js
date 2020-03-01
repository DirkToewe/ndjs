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
import {_rand_rows0,
        _rand_cols0,
        _rand_rankdef} from '../_test_data_generators'

import {matmul, matmul2} from './matmul'
import {bidiag_decomp} from './bidiag'
import {eye} from './eye'


describe('bidiag', () => {
  beforeEach( () => {
    jasmine.addMatchers(CUSTOM_MATCHERS)
  })


  const randInt = (from,until) => Math.floor( Math.random() * (until-from) ) + from;


  for( const [rng,suffix] of [
    [() =>                           Math.random()*8 - 4, ''                      ],
    [() => Math.random() < 0.1 ? 0 : Math.random()*8 - 4, ' with occasional zeros']
  ])
    forEachItemIn(
      function*(){
        for( let run=0; run < 32; run++ )
        for( let M=0; M++ < 8; )
        for( let N=0; N++ < 8; )
          yield tabulate(Int32Array.of(M,N), 'float64', rng);

        for( let run=1024; run-- > 0; )
        {
          const ndim = randInt(2,5),
               shape = Int32Array.from({ length: ndim }, () => randInt(1,32) );
          yield tabulate(shape, 'float64', rng);
        }
      }()
    ).it('bidiag_decomp works on random examples'+suffix, A => {
      const [N,M] = A.shape.slice(-2),
          [U,B,V] = bidiag_decomp(A);

      const a = matmul(U,B,V);

      expect(B).toBeUpperBidiagonal();

      if( N >= M ) {
        const I = eye(M);
        expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
        expect( matmul2(V.T,V) ).toBeAllCloseTo(I);
        expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
      }
      else {
        const I = eye(N);
        expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
        expect( matmul2(U,U.T) ).toBeAllCloseTo(I);
        expect( matmul2(V,V.T) ).toBeAllCloseTo( eye(N+1) );
      }

      expect(a).toBeAllCloseTo(A);
    })


  forEachItemIn(
    function*(){
      for( let run=1024; run-- > 0; )
      {
        const                         sparseness = Math.random(),
          rng = () => Math.random() < sparseness ? 0 : Math.random()*2 - 1;

        const ndim = randInt(2,5),
             shape = Int32Array.from({ length: ndim }, () => randInt(1,32) );
        yield tabulate(shape, 'float64', rng);
      }
    }()
  ).it('bidiag_decomp works on random sparse examples', A => {
    const [N,M] = A.shape.slice(-2),
        [U,B,V] = bidiag_decomp(A);

    const a = matmul(U,B,V);

    expect(B).toBeUpperBidiagonal();

    if( N >= M ) {
      const I = eye(M);
      expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
      expect( matmul2(V.T,V) ).toBeAllCloseTo(I);
      expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
    }
    else {
      const I = eye(N);
      expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
      expect( matmul2(U,U.T) ).toBeAllCloseTo(I);
      expect( matmul2(V,V.T) ).toBeAllCloseTo( eye(N+1) );
    }

    expect(a).toBeAllCloseTo(A, {atol: 1e-7});
  })


  forEachItemIn(
    function*(){
      function* shapes() {
        for( let M=8; M > 1; M-- )
        for( let N=8; N > 1; N-- )
          yield [M,N];

        for( let run=2048; run-- > 0; )
        {
          const M = randInt(1,128),
                N = randInt(1,128);
          yield [M,N];
        }
      }

      for( const [M,N] of shapes() )
        yield _rand_rows0(M,N);
    }()
  ).it('bidiag_decomp works on random matrices with zero rows', A => {
    const [N,M] = A.shape.slice(-2),
        [U,B,V] = bidiag_decomp(A);

    const a = matmul(U,B,V);

    expect(B).toBeUpperBidiagonal();

    if( N >= M ) {
      const I = eye(M);
      expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
      expect( matmul2(V.T,V) ).toBeAllCloseTo(I);
      expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
    }
    else {
      const I = eye(N);
      expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
      expect( matmul2(U,U.T) ).toBeAllCloseTo(I);
      expect( matmul2(V,V.T) ).toBeAllCloseTo( eye(N+1) );
    }

    expect(a).toBeAllCloseTo(A);
  });


  forEachItemIn(
    function*(){
      function* shapes() {
        for( let M=8; M > 1; M-- )
        for( let N=8; N > 1; N-- )
          yield [M,N];

        for( let run=2048; run-- > 0; )
        {
          const M = randInt(1,128),
                N = randInt(1,128); // <- TODO remove after testing
          yield [M,N];
        }
      }

      for( const [M,N] of shapes() )
        yield _rand_cols0(M,N);
    }()
  ).it('bidiag_decomp works on random matrices with zero columns', A => {
    const [M,N] = A.shape.slice(-2),
        [U,B,V] = bidiag_decomp(A);
    Object.freeze(U.data.buffer); Object.freeze(U);
    Object.freeze(B.data.buffer); Object.freeze(B);
    Object.freeze(V.data.buffer); Object.freeze(V);

    const a = matmul(U,B,V);

    expect(B).toBeUpperBidiagonal();

    if( M >= N ) {
      const I = eye(N);
      expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
      expect( matmul2(V.T,V) ).toBeAllCloseTo(I);
      expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
    }
    else {
      const I = eye(M)
      expect( matmul2(U.T,U) ).toBeAllCloseTo(I);
      expect( matmul2(U,U.T) ).toBeAllCloseTo(I);
      expect( matmul2(V,V.T) ).toBeAllCloseTo( eye(M+1) );
    }

    expect(a).toBeAllCloseTo(A);
  });
})
