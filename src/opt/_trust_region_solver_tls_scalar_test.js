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

import {concat} from "../concat";
import {forEachItemIn, CUSTOM_MATCHERS} from '../jasmine_utils'
import {asarray, NDArray} from "../nd_array";
import {stack} from "../stack";
import {tabulate} from "../tabulate";
import {_rand_int,
        _rand_rankdef} from "../_test_data_generators";
import {zip_elems} from '../zip_elems';

import {checked_array} from "../arrays/_checked_array";
import {     is_array} from "../arrays/is_array";

import {eye} from "../la/eye";
import {lstsq} from "../la/lstsq";
import {matmul2} from "../la/matmul";
import {qr_decomp_full} from "../la/qr";
import {svd_lstsq} from "../la/svd";
import {svd_jac_2sided} from "../la/svd_jac_2sided";

import {num_grad} from "./num_grad";
import {TrustRegionSolverLSQ} from "./_trust_region_solver_lsq";
import {TrustRegionSolverTLS} from "./_trust_region_solver_tls";


//
// CREATE SCALAR TEST FUNCTIONS
// ----------------------------
const scalar_funcs = {
  lin1d: function(){
    const NP = 2,
          NX = 1,
        NDIM = 2;

    const f = ([a,b], x) => {
      x = asarray('float64', x);
      if( NDIM !== x.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== x.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  x.shape[0];
      x = x.data;

      const f = new Float64Array(MX);

      for( let i=MX; i-- > 0; ) f[i] = a + b*x[i];

      return new NDArray( Int32Array.of(MX), f );
    };

    const fgg = ([a,b], x) => {
      x = asarray('float64', x);
      if( NDIM !== x.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== x.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  x.shape[0];
      x = x.data;

      const f = new Float64Array(MX),
           gp = new Float64Array(MX*NP),
           gx = new Float64Array(MX*NX);

      for( let i=MX; i-- > 0; ) f[i] = a + b*x[i];

      for( let i=MX; i-- > 0; ) {
        gp[NP*i+0] = 1;
        gp[NP*i+1] = x[i];
      }

      for( let i=MX; i-- > 0; ) gx[i] = b;

      return [
        new NDArray( Int32Array.of(MX),    f ),
        new NDArray( Int32Array.of(MX,NP), gp),
        new NDArray( Int32Array.of(MX,NX), gx)
      ];
    };

    return {NP,NX,NDIM, f,fgg}
  }(),


  lin2d: function(){
    const NP = 3,
          NX = 2,
        NDIM = 2;

    const f = ([a,b,c], xy) => {
      xy = asarray('float64', xy);
      if( NDIM !== xy.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== xy.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  xy.shape[0];
      xy = xy.data;

      const f = new Float64Array(MX);

      for( let i=MX; i-- > 0; )
      {
        const x = xy[NX*i+0],
              y = xy[NX*i+1];
        f[i] = a + b*x + c*y;
      }

      return new NDArray( Int32Array.of(MX), f );
    };

    const fgg = ([a,b,c], xy) => {
      xy = asarray('float64', xy);
      if( NDIM !== xy.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== xy.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  xy.shape[0];
      xy = xy.data;

      const f = new Float64Array(MX),
           gp = new Float64Array(MX*NP),
           gx = new Float64Array(MX*NX);

      for( let i=MX; i-- > 0; )
      {
        const x = xy[NX*i+0],
              y = xy[NX*i+1];
        f[i] = a + b*x + c*y;
      }

      for( let i=MX; i-- > 0; )
      {
        const x = xy[NX*i+0],
              y = xy[NX*i+1];
        gp[NP*i+0] = 1;
        gp[NP*i+1] = x;
        gp[NP*i+2] = y;
      }

      for( let i=MX; i-- > 0; ) {
        gx[NX*i+0] = b;
        gx[NX*i+1] = c;
      }

      return [
        new NDArray( Int32Array.of(MX),    f ),
        new NDArray( Int32Array.of(MX,NP), gp),
        new NDArray( Int32Array.of(MX,NX), gx)
      ];
    };

    return {NP,NX,NDIM, f,fgg}
  }(),


  lin3d: function(){
    const NP = 4,
          NX = 3,
        NDIM = 2;

    const f = ([a,b,c,d], xyz) => {
      xyz = asarray('float64', xyz);
      if( NDIM !== xyz.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== xyz.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  xyz.shape[0];
      xyz = xyz.data;

      const f = new Float64Array(MX);

      for( let i=MX; i-- > 0; )
      {
        const x = xyz[NX*i+0],
              y = xyz[NX*i+1],
              z = xyz[NX*i+2];
        f[i] = a + b*x + c*y + d*z;
      }

      return new NDArray( Int32Array.of(MX), f );
    };

    const fgg = ([a,b,c,d], xyz) => {
      xyz = asarray('float64', xyz);
      if( NDIM !== xyz.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== xyz.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  xyz.shape[0];
      xyz = xyz.data;

      const f = new Float64Array(MX),
           gp = new Float64Array(MX*NP),
           gx = new Float64Array(MX*NX);

      for( let i=MX; i-- > 0; )
      {
        const x = xyz[NX*i+0],
              y = xyz[NX*i+1],
              z = xyz[NX*i+2];
        f[i] = a + b*x + c*y + d*z;
      }

      for( let i=MX; i-- > 0; )
      {
        const x = xyz[NX*i+0],
              y = xyz[NX*i+1],
              z = xyz[NX*i+2];
        gp[NP*i+0] = 1;
        gp[NP*i+1] = x;
        gp[NP*i+2] = y;
        gp[NP*i+3] = z;
      }

      for( let i=MX; i-- > 0; ) {
        gx[NX*i+0] = b;
        gx[NX*i+1] = c;
        gx[NX*i+2] = d;
      }

      return [
        new NDArray( Int32Array.of(MX),    f ),
        new NDArray( Int32Array.of(MX,NP), gp),
        new NDArray( Int32Array.of(MX,NX), gx)
      ];
    };

    return {NP,NX,NDIM, f,fgg}
  }(),


  sigmoid: function(){
    const NP = 4,
          NX = 1,
        NDIM = 1;

    const f = ([a,b,c,d], x) => {
      x = asarray('float64', x);
      if( NDIM !== x.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== x.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  x.shape[0];
      x = x.data;

      const f = new Float64Array(MX);

      for( let i=MX; i-- > 0; ) f[i] = a + b / (1 + Math.exp(c - d*x[i]));

      return new NDArray( Int32Array.of(MX), f );
    };

    const fgg = ([a,b,c,d], x) => {
      x = asarray('float64', x);
      if( NDIM !== x.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== x.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  x.shape[0];
      x = x.data;

      const f = new Float64Array(MX),
           gp = new Float64Array(MX*NP),
           gx = new Float64Array(MX*NX);

      for( let i=MX; i-- > 0; ) f[i] = a + b / (1 + Math.exp(c - d*x[i]));

      for( let i=MX; i-- > 0; ) {
        const exp = Math.exp(c - d*x[i]);
        gp[NP*i+0] = 1;
        gp[NP*i+1] =      1 / (1+exp);
        gp[NP*i+2] =     -b / (1/exp + exp + 2);
        gp[NP*i+3] = x[i]*b / (1/exp + exp + 2);
      }

      for( let i=MX; i-- > 0; )
      {
        const exp = Math.exp(c - d*x[i]);
        gx[i] = d*b / (1/exp + exp + 2);
      }

      return [
        new NDArray( Int32Array.of(MX),    f ),
        new NDArray( Int32Array.of(MX,NP), gp),
        new NDArray( Int32Array.of(MX),    gx)
      ];
    };

    return {NP,NX,NDIM, f,fgg}
  }(),


  poly2d: function(){
    const NP = 6,
          NX = 2,
        NDIM = 2;

    const f = ([a,b,c,d,e,f], xy) => {
      xy = asarray('float64', xy);
      if( NDIM !== xy.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== xy.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  xy.shape[0];
      xy = xy.data;

      const F = new Float64Array(MX);

      for( let i=MX; i-- > 0; )
      {
        const x = xy[NX*i+0],
              y = xy[NX*i+1];
        F[i] = a + b*x + c*y + d*x*x + e*y*y + f*x*y;
      }

      return new NDArray( Int32Array.of(MX), F );
    };

    const fgg = ([a,b,c,d,e,f], xy) => {
      xy = asarray('float64', xy);
      if( NDIM !== xy.ndim     ) throw new Error('Assertion failed.');
      if( NDIM === 2 &&
            NX !== xy.shape[1] ) throw new Error('Assertion failed.');
      const MX  =  xy.shape[0];
      xy = xy.data;

      const F = new Float64Array(MX),
           gp = new Float64Array(MX*NP),
           gx = new Float64Array(MX*NX);

      for( let i=MX; i-- > 0; )
      {
        const x = xy[NX*i+0],
              y = xy[NX*i+1];
        F[i] = a + b*x + c*y + d*x*x + e*y*y + f*x*y;
      }

      for( let i=MX; i-- > 0; )
      {
        const x = xy[NX*i+0],
              y = xy[NX*i+1];
        gp[NP*i+0] = 1;
        gp[NP*i+1] = x;
        gp[NP*i+2] = y;
        gp[NP*i+3] = x*x;
        gp[NP*i+4] = y*y;
        gp[NP*i+5] = x*y;
      }

      for( let i=MX; i-- > 0; ) {
        const x = xy[NX*i+0],
              y = xy[NX*i+1];
        gx[NX*i+0] = b + 2*d*x + f*y;
        gx[NX*i+1] = c + 2*e*y + f*x;
      }

      return [
        new NDArray( Int32Array.of(MX),    F ),
        new NDArray( Int32Array.of(MX,NP), gp),
        new NDArray( Int32Array.of(MX,NX), gx)
      ];
    };

    return {NP,NX,NDIM, f,fgg}
  }()
};
Object.freeze(scalar_funcs);


//
// TEST SCALAR TEST FUNCTIONS
// -----------------------------------------------------
describe('TrustRegionSolverTLS scalar functions', () => {
  beforeEach( () => {
    jasmine.addMatchers(CUSTOM_MATCHERS)
  });


  for( const [name,{NP,NX,NDIM,f,fgg}] of Object.entries(scalar_funcs) )
    forEachItemIn(
      function*(){
        for( let run=0; run++ < 256; )
        {
          const       MX = _rand_int(1,96)
          yield [
            tabulate(   [NP],               'float64', () => Math.random()*4 - 2),
            tabulate([MX,NX].slice(0,NDIM), 'float64', () => Math.random()*4 - 2)
          ];
        }
      }()
    ).it(`${name} derivatives are correct`, ([p, x]) => {
      const GP = num_grad( p => f(p,x) )(p),
            GX = stack( [...x].map( num_grad(
              x => f(p, x.reshape(...[1,NX].slice(0,NDIM))).reshape()
            )));

      const [F,gp,gx] = fgg(p,x);

      expect(F).toBeAllCloseTo(f(p,x), {rtol: 0.0, atol: 0.0});
      expect(gp).toBeAllCloseTo(GP);
      expect(gx).toBeAllCloseTo(GX);
    });
})


//
// TEST TrustRegionSolverTLS USING SCALAR TEST FUNCTIONS
// -----------------------------------------------------
for( const [name,{NP,NX,NDIM,f,fgg}] of Object.entries(scalar_funcs) )
  describe(`${TrustRegionSolverTLS.name} [scalar func.: ${name}]`, () => {
    beforeEach( () => {
      jasmine.addMatchers(CUSTOM_MATCHERS)
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 512; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial report is correct given random examples`, ([p0, dx0]) => {
      const solver = new TrustRegionSolverTLS(fgg, p0,dx0);

      const loss = (p,dx) => {
        const  dy = f(p,dx),
                M = dx.data.length +
                    dy.data.length;
        return dx.data.reduce( (loss,r) => loss + r*r/M, 0.0 ) +
               dy.data.reduce( (loss,r) => loss + r*r/M, 0.0 );
      };

      const ztol = {atol:0, rtol:0};

      expect(solver.loss).toBeAllCloseTo(solver.report_loss);
      expect(solver.loss).toBeAllCloseTo( loss(p0,dx0) );

      expect(solver.report_p ).toBeAllCloseTo( p0, ztol);
      expect(solver.report_dx).toBeAllCloseTo(dx0, ztol);
      expect(solver.report_dy).toBeAllCloseTo( f(p0,dx0) );

      const dloss_dp  = num_grad( p => loss(p ,dx0) )( p0),
            dloss_ddx = num_grad(dx => loss(p0,dx ) )(dx0);

      expect(solver.report_dloss_dp ).toBeAllCloseTo(dloss_dp , {atol: 1e-6});
      expect(solver.report_dloss_ddx).toBeAllCloseTo(dloss_ddx, {atol: 1e-6});

      const [
        report_p,
        report_dx,
        report_loss,
        report_dloss_dp,
        report_dloss_ddx,
        report_dy
      ] = solver.report();

      expect(report_loss).toBeAllCloseTo(solver.loss);
      expect(report_loss).toBeAllCloseTo( loss(p0,dx0) );

      expect(report_p ).toBeAllCloseTo( p0, ztol);
      expect(report_dx).toBeAllCloseTo(dx0, ztol);
      expect(report_dy).toBeAllCloseTo( f(p0,dx0) );

      expect(report_dloss_dp ).toBeAllCloseTo(dloss_dp , {atol: 1e-6});
      expect(report_dloss_ddx).toBeAllCloseTo(dloss_ddx, {atol: 1e-6});
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 128; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial X0,F0,G0,D,J is correct given random examples`, ([p0, dx0]) => {
      const     solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N} = solver;

      const                            X0 = concat([dx0.reshape(-1), p0]);
      expect(solver.X0).toBeAllCloseTo(X0);

      const F = X => {
        const p = new NDArray( p0.shape, X.data.slice(  -NP) ),
             dx = new NDArray(dx0.shape, X.data.slice(0,-NP) ),
             dy = f(p,dx);
        return concat([dx.reshape(-1), dy]);
      };

      const                            F0 = F(X0);
      expect(solver.F0).toBeAllCloseTo(F0);

      const         loss = x => F(x).data.reduce((loss,r) => loss + r*r/2, 0.0);
      expect(solver.loss).toBeAllCloseTo( loss(X0) / F0.shape[0] * 2 );

      expect(solver.G0).toBeAllCloseTo(num_grad(loss)(X0), {atol:1e-6});

      const  J = tabulate([M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j));
      expect(J).toBeAllCloseTo( num_grad(F)(X0) );

      const                            G0 = matmul2(F0.reshape(1,-1), J);
      expect(solver.G0).toBeAllCloseTo(G0);

      const D = J.reduceElems(0, 'float64', (x,y) => Math.hypot(x,y));
      expect(solver.D).toBeAllCloseTo(D);
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 173; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);

          function* seq() {
            for( let step=0; step++ < 8; )
              yield Float64Array.from({length: MX*NX+NP}, () => Math.random()*2e-3 - 1e-3);
          }

          yield [p0,dx0, seq()];
        }
      }()
    ).it(`considerMove(dX) returns correct loss and loss prediction`, ([p0, dx0, seq]) => {
      const solver = new TrustRegionSolverTLS(fgg, p0,dx0);

      const                            X0 = concat([dx0.reshape(-1), p0]);
      expect(solver.X0).toBeAllCloseTo(X0);

      const F = X => {
        const p = new NDArray(  p0.shape, X.data.slice(  -NP) ),
             dx = new NDArray( dx0.shape, X.data.slice(0,-NP) ),
             dy = f(p,dx);
        return concat([dx.reshape(-1), dy]);
      };

      const                            F0 = F(X0);
      expect(solver.F0).toBeAllCloseTo(F0);

      const [len] = F0.shape;

      const         loss = x => F(x).data.reduce((loss,r) => loss + r*r/len, 0.0);
      expect(solver.loss).toBeAllCloseTo( loss(X0) );

      for( const dX of seq )
      {
        const X1 = X0.mapElems((x0,i) => x0+dX[i]),
           loss1 = loss(X1);

        const [ loss_predict,
                loss_new ] = solver.considerMove(dX);

        expect(loss_new    ).toBeAllCloseTo(loss1);
        expect(loss_predict).toBeAllCloseTo(loss1, {atol: 1e-6});
        // expect(solver.loss).toBeAllCloseTo(loss1, {atol: 1e-6}); // <- should fail (counter sample)
      }

      const         G0 = num_grad( dX => solver.considerMove(dX.data)[0] * len / 2 )( new Float64Array(X0.shape[0]) );
      expect(solver.G0).toBeAllCloseTo(G0, {atol: 1e-6});
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 2048; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`cauchyTravel() finds min. along gradient direction`, ([p0, dx0]) => {
      const solver = new TrustRegionSolverTLS(fgg, p0,dx0);

      const g = num_grad( cp => {
        const                                      dx = solver.G0.map( g => g*cp ),
              [loss_predict] = solver.considerMove(dx);
        return loss_predict;
      });

      const  cp = solver.cauchyTravel();
      expect(cp).toBeLessThanOrEqual(0);

      expect( g(cp) ).toBeAllCloseTo(0, {atol: 1e-7});
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 137; )
        {
          const      MX = _rand_int( NP, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial computeNewton() QR decomposes J correctly given random over-determined examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = Math.random()*4 - 2;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = Math.random()*4 - 2;
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;

      const J = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) );

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      expect(solver.rank).toBe(N);

      if( J.data.some(isNaN) ) throw new Error('Assertion failed.');

      const [r,V,D] = solver.__DEBUG_RVD,
              [Q,R] = qr_decomp_full( matmul2( zip_elems([J,D], (j,d) => j/d), V.T ) );
      // QR decomp. may differ by sign
      ;{
        const L = Math.min(M,N),
              RR = R.data,
              rr = r.data,
              QQ = Q.data;
        for( let i=L; i-- > 0; )
        {
          let dot = 0.0;
          for( let j=N; j-- > 0; )
            dot += RR[N*i+j] * rr[N*i+j];

          if( dot < 0 )
          {
            for( let j=N; j-- > 0; ) RR[N*i+j] *= -1;
            for( let j=M; j-- > 0; ) QQ[M*j+i] *= -1;
          }
        }
      }

      const                                   I = eye(N);
      expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
      expect( matmul2(V.T,V) ).toBeAllCloseTo(I);

      if( r.data.some(isNaN) ) throw new Error('Assertion failed.');
      if( V.data.some(isNaN) ) throw new Error('Assertion failed.');

      expect(r).toBeAllCloseTo(R);

      const                    {rank} = solver;
      expect( solver.QF.slice(0,rank) ).toBeAllCloseTo( matmul2(Q.T,F).data.slice(0,rank) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 137; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial computeNewton() QR decomposes J correctly given random examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = Math.random()*4 - 2;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = Math.random()*4 - 2;
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random()*1.8 + 0.1) * (Math.random() < 0.99 || i < MX*NX);

      const J = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) );

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      expect(solver.rank).toBe( Math.min(M,N) );

      if( J.data.some(isNaN) ) throw new Error('Assertion failed.');

      const [r,V,D] = solver.__DEBUG_RVD,
              [Q,R] = qr_decomp_full( matmul2( zip_elems([J,D], (j,d) => j/d), V.T ) );
      // QR decomp. may differ by sign
      ;{
        const L = Math.min(M,N),
              RR = R.data,
              rr = r.data,
              QQ = Q.data;
        for( let i=L; i-- > 0; )
        {
          let dot = 0.0;
          for( let j=N; j-- > 0; )
            dot += RR[N*i+j] * rr[N*i+j];

          if( dot < 0 )
          {
            for( let j=N; j-- > 0; ) RR[N*i+j] *= -1;
            for( let j=M; j-- > 0; ) QQ[M*j+i] *= -1;
          }
        }
      }

      const                                   I = eye(N);
      expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
      expect( matmul2(V.T,V) ).toBeAllCloseTo(I);

      if( r.data.some(isNaN) ) throw new Error('Assertion failed.');
      if( V.data.some(isNaN) ) throw new Error('Assertion failed.');

      expect(r).toBeAllCloseTo(R);

      const                    {rank} = solver;
      expect( solver.QF.slice(0,rank) ).toBeAllCloseTo( matmul2(Q.T,F).data.slice(0,rank) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 128; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial computeNewton() QR decomposes J correctly given random rank-deficient examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      const [{data: J22},rnk] = _rand_rankdef(MX,NP);
      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = Math.random()*4 - 2;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = J22[i];
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random()*1.8 + 0.1) * (Math.random() < 0.99 || i < MX*NX);

      const J = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) );

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      expect(solver.rank).toBe( MX*NX + rnk );

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      expect(solver.rank).toBe( MX*NX + rnk );

      if( J.data.some(isNaN) ) throw new Error('Assertion failed.');

      const [r,V,D] = solver.__DEBUG_RVD,
              [Q,R] = qr_decomp_full( matmul2( zip_elems([J,D], (j,d) => j/d), V.T ) );
      // QR decomp. may differ by sign
      ;{
        const L = Math.min(M,N),
              RR = R.data,
              rr = r.data,
              QQ = Q.data;
        for( let i=L; i-- > 0; )
        {
          let dot = 0.0;
          for( let j=N; j-- > 0; )
            dot += RR[N*i+j] * rr[N*i+j];

          if( dot < 0 )
          {
            for( let j=N; j-- > 0; ) RR[N*i+j] *= -1;
            for( let j=M; j-- > 0; ) QQ[M*j+i] *= -1;
          }
        }
      }

      const                                   I = eye(N);
      expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
      expect( matmul2(V.T,V) ).toBeAllCloseTo(I);

      if( r.data.some(isNaN) ) throw new Error('Assertion failed.');
      if( V.data.some(isNaN) ) throw new Error('Assertion failed.');

      expect(r).toBeAllCloseTo(R);

      const                    {rank} = solver;
      expect( solver.QF.slice(0,rank) ).toBeAllCloseTo( matmul2(Q.T,F).data.slice(0,rank) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 137; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0];
        }
      }()
    ).it(`initial computeNewton() QR decomposes J correctly given random sparse examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] =(Math.random()*4 - 2) * (Math.random() < 0.95);
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] =(Math.random()*4 - 2) * (Math.random() < 0.95);
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random()*1.8 + 0.1) * (Math.random() < 0.99 || i < MX*NX);

      const J = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) );

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      if( J.data.some(isNaN) ) throw new Error('Assertion failed.');

      const [r,V,D] = solver.__DEBUG_RVD,
              [Q,R] = qr_decomp_full( matmul2( zip_elems([J,D], (j,d) => j/d), V.T ) );
      // QR decomp. may differ by sign
      ;{
        const L = Math.min(M,N),
              RR = R.data,
              rr = r.data,
              QQ = Q.data;
        for( let i=L; i-- > 0; )
        {
          let dot = 0.0;
          for( let j=N; j-- > 0; )
            dot += RR[N*i+j] * rr[N*i+j];

          if( dot < 0 )
          {
            for( let j=N; j-- > 0; ) RR[N*i+j] *= -1;
            for( let j=M; j-- > 0; ) QQ[M*j+i] *= -1;
          }
        }
      }

      const                                   I = eye(N);
      expect( matmul2(V,V.T) ).toBeAllCloseTo(I);
      expect( matmul2(V.T,V) ).toBeAllCloseTo(I);

      if( r.data.some(isNaN) ) throw new Error('Assertion failed.');
      if( V.data.some(isNaN) ) throw new Error('Assertion failed.');

      expect(r).toBeAllCloseTo(R);

      const                    {rank} = solver;
      expect( solver.QF.slice(0,rank) ).toBeAllCloseTo( matmul2(Q.T,F).data.slice(0,rank) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 337; )
        {
          const      MX = _rand_int( NP, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial computeNewton() solves random over-determined examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = Math.random()*4 - 2;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = Math.random()*4 - 2;
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;

      const J = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) );

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      expect(solver.rank).toBe(N);

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      const  X = new NDArray( Int32Array.of(N,1), solver.newton_dX.slice() );
      expect(X).toBeAllCloseTo( lstsq(J,F).mapElems('float64', x => -x) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 512; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0];
        }
      }()
    ).it(`initial computeNewton() solves random examples with J21=0`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = 0;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = Math.random()*4 - 2;
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random() < 0.99 || i < MX*NX) * (0.01 + Math.random()*2);

      const J  = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ),
             D = new NDArray( Int32Array.of(N,1), solver.D.slice() ),
            JD = zip_elems([J,D.T], (j,d) => d===0 ? j : j/d);

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      expect(solver.rank).toBe( Math.min(M,N) );

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      const   X = new NDArray( Int32Array.of(N,1), solver.newton_dX.slice() ),
             DX = zip_elems([D,X], (d,x) => d===0 ? x : d*x );
      expect(DX).toBeAllCloseTo( lstsq(JD,F).mapElems('float64', x => -x) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 373; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial computeNewton() solves random rank-deficient examples with J21=0`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      const [{data: J22},rnk] = _rand_rankdef(MX,NP);

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = 0;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = J22[i];
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random() < 0.99 || i < MX*NX) * (0.01 + Math.random()*2);

      const J  = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ),
             D = new NDArray( Int32Array.of(N,1), solver.D.slice() ),
            JD = zip_elems([J,D.T], (j,d) => d===0 ? j : j/d);

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      expect(solver.rank).toBe(MX*NX + rnk);

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      const   X = new NDArray( Int32Array.of(N,1), solver.newton_dX.slice() ),
              DX = zip_elems([D,X], (d,x) => d===0 ? x : d*x );
      expect(DX).toBeAllCloseTo( svd_lstsq(...svd_jac_2sided(JD),F).mapElems('float64', x => -x) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 373; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0];
        }
      }()
    ).it(`initial computeNewton() solves random examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = Math.random()*4 - 2;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = Math.random()*4 - 2;
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random() < 0.99 || i < MX*NX) * (0.01 + Math.random()*2);

      const J  = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ),
             D = new NDArray( Int32Array.of(N,1), solver.D.slice() ),
            JD = zip_elems([J,D.T], (j,d) => d===0 ? j : j/d);

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      expect(solver.rank).toBe( Math.min(M,N) );

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      const   X = new NDArray( Int32Array.of(N,1), solver.newton_dX.slice() ),
             DX = zip_elems([D,X], (d,x) => d===0 ? x : d*x );
      expect(DX).toBeAllCloseTo( lstsq(JD,F).mapElems('float64', x => -x) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 337; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial computeNewton() solves random rank-deficient examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      const [{data: J22},rnk] = _rand_rankdef(MX,NP);

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] = Math.random()*4 - 2;
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] = J22[i];
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random() < 0.99 || i < MX*NX) * (0.01 + Math.random()*2);

      const J  = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ),
             D = new NDArray( Int32Array.of(N,1), solver.D.slice() ),
            JD = zip_elems([J,D.T], (j,d) => d===0 ? j : j/d);

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      expect(solver.rank).toBe(MX*NX + rnk);

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      const   X = new NDArray( Int32Array.of(N,1), solver.newton_dX.slice() ),
             DX = zip_elems([D,X], (d,x) => d===0 ? x : d*x );
      expect(DX).toBeAllCloseTo( svd_lstsq(...svd_jac_2sided(JD),F).mapElems('float64', x => -x) );
    });


    forEachItemIn(
      function*(){
        for( let run=0; run++ < 256; )
        {
          const      MX = _rand_int( 1, Math.ceil(64/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => Math.random()*4 - 2),
              dx0 = tabulate(shape, 'float64', () => Math.random()*4 - 2);
          yield [p0,dx0]
        }
      }()
    ).it(`initial computeNewton() solves random sparse examples`, ([p0, dx0]) => {
      const        solver = new TrustRegionSolverTLS(fgg, p0,dx0),
        {M,N,MX} = solver;

      for( let i=MX*NX; i-- > 0; ) solver.J11[i] = Math.random()*1.8 + 0.1;
      for( let i=MX*NX; i-- > 0; ) solver.J21[i] =(Math.random()*4 - 2) * (Math.random() < 0.95);
      for( let i=MX*NP; i-- > 0; ) solver.J22[i] =(Math.random()*4 - 2) * (Math.random() < 0.95);
      for( let i=M    ; i-- > 0; ) solver. F0[i] = Math.random()*4 - 2;
      for( let i=N    ; i-- > 0; ) solver.  D[i] =(Math.random() < 0.99 || i < MX*NX) * (0.01 + Math.random()*2);

      const J  = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ),
             D = new NDArray( Int32Array.of(N,1), solver.D.slice() ),
            JD = zip_elems([J,D.T], (j,d) => d===0 ? j : j/d);

      const              F_shape = Int32Array.of(M,1),
        F = new NDArray( F_shape, solver.F0.slice() );

      solver.computeNewton();

      // check that J,F is unmodified by computeNewton
      expect(J).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
      expect(F).toBeAllCloseTo(  new NDArray( F_shape, solver.F0.slice() ) );

      const   X = new NDArray( Int32Array.of(N,1), solver.newton_dX.slice() ),
             DX = zip_elems([D,X], (d,x) => d===0 ? x : d*x );
      expect(DX).toBeAllCloseTo( svd_lstsq(...svd_jac_2sided(JD),F).mapElems('float64', x => -x) );
    });


    const data_computeNewtonRegularized = Object.freeze([[
      'random over-determined examples', function*(rng){
        for( let run=0; run++ < 173; )
        {
          const      MX = rng.int( NP, Math.ceil(32/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => rng.uniform(-2,+2) ),
              dx0 = tabulate(shape, 'float64', () => rng.uniform(-2,+2) );

          const     solver = new TrustRegionSolverTLS(fgg, p0,dx0),
            {M,N} = solver;
  
          for( let i=MX*NX; i-- > 0; ) solver.J11[i] = rng.uniform(0.1, 1.9);
          for( let i=MX*NX; i-- > 0; ) solver.J21[i] = rng.uniform( -2, +2 );
          for( let i=MX*NP; i-- > 0; ) solver.J22[i] = rng.uniform( -2, +2 );
          for( let i=M    ; i-- > 0; ) solver. F0[i] = rng.uniform( -2, +2 );
          for( let i=N    ; i-- > 0; ) solver.  D[i] = rng.uniform(0.01, 2 ) * (rng.uniform(0,1) < 0.99 || i < MX*NX);

          const lambdas = Array.from({length: 6}, () => rng.uniform(0,8) );
          lambdas[rng.int(0,lambdas.length)] = 0;
          lambdas[rng.int(0,lambdas.length)] = 0;
          Object.freeze(lambdas);

          yield [solver, lambdas];
        }
      }
    ],[
      'random under-determined examples', function*(rng){
        for( let run=0; run++ < 1024; )
        {
          const      MX = _rand_int( 1, NP ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => rng.uniform(-2,+2) ),
              dx0 = tabulate(shape, 'float64', () => rng.uniform(-2,+2) );

          const     solver = new TrustRegionSolverTLS(fgg, p0,dx0),
            {M,N} = solver;
  
          for( let i=MX*NX; i-- > 0; ) solver.J11[i] = rng.uniform(0.1, 1.9);
          for( let i=MX*NX; i-- > 0; ) solver.J21[i] = rng.uniform( -2, +2 );
          for( let i=MX*NP; i-- > 0; ) solver.J22[i] = rng.uniform( -2, +2 );
          for( let i=M    ; i-- > 0; ) solver. F0[i] = rng.uniform( -2, +2 );
          for( let i=N    ; i-- > 0; ) solver.  D[i] = rng.uniform(0.01, 2 ) * (rng.uniform(0,1) < 0.99 || i < MX*NX);

          const lambdas = Array.from({length: 6}, () => rng.uniform(0,8) );
          lambdas[rng.int(0,lambdas.length)] = 0;
          lambdas[rng.int(0,lambdas.length)] = 0;
          Object.freeze(lambdas);

          yield [solver, lambdas];
        }
      }
    ],[
      'random examples', function*(rng){
        for( let run=0; run++ < 256; )
        {
          const      MX = rng.int( 1, Math.ceil(32/NX) ),
            shape = [MX,NX].slice(0,NDIM),
               p0 = tabulate( [NP], 'float64', () => rng.uniform(-2,+2) ),
              dx0 = tabulate(shape, 'float64', () => rng.uniform(-2,+2) );

          const     solver = new TrustRegionSolverTLS(fgg, p0,dx0),
            {M,N} = solver;
  
          for( let i=MX*NX; i-- > 0; ) solver.J11[i] = rng.uniform(0.1, 1.9);
          for( let i=MX*NX; i-- > 0; ) solver.J21[i] = rng.uniform( -2, +2 );
          for( let i=MX*NP; i-- > 0; ) solver.J22[i] = rng.uniform( -2, +2 );
          for( let i=M    ; i-- > 0; ) solver. F0[i] = rng.uniform( -2, +2 );
          for( let i=N    ; i-- > 0; ) solver.  D[i] = rng.uniform(0.01, 2 ) * (rng.uniform(0,1) < 0.99 || i < MX*NX);

          const lambdas = Array.from({length: 6}, () => rng.uniform(0,8) );
          lambdas[rng.int(0,lambdas.length)] = 0;
          lambdas[rng.int(0,lambdas.length)] = 0;
          Object.freeze(lambdas);

          yield [solver, lambdas];
        }
      }
    ]]);


    for( const [example_type, items] of data_computeNewtonRegularized )
      forEachItemIn(
        items
      ).it(`computeNewtonRegularized(λ) solves ${example_type}`, ([solver, lambdas]) => {
        const {M,N} = solver;

        const J1 = tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ),
              D = new NDArray( Int32Array.of(N,1), solver.D.slice() );

        const               F_shape = Int32Array.of(M,1),
          F1 = new NDArray( F_shape, solver.F0.slice() );

        for( const λ of lambdas )
        {
          const λSqrt = Math.sqrt(λ);

          solver.computeNewtonRegularized(λ);

          const X = new NDArray( Int32Array.of(N,1), solver.regularized_dX.slice() );

          // check that J,F is unmodified by computeNewton
          expect(J1).toBeAllCloseTo( tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) ), {rtol:0, atol:0} );
          expect(F1).toBeAllCloseTo( new NDArray( F_shape, solver.F0.slice() ) );
          expect( D).toBeAllCloseTo( new NDArray( Int32Array.of(N,1), solver.D.slice() ) );

          if( 0 === λ )
          {
            const JD  = zip_elems([J1,D.T], (j,d) => d===0 ? j : j/d),
                   DX = zip_elems([D ,X  ], (d,x) => d===0 ? x : d*x);
            expect(DX).toBeAllCloseTo( lstsq(JD,F1).mapElems('float64', x => -x) );
          }
          else
          {
            const J2 = tabulate( [N,N], 'float64', (i,j) => i!==j ? 0 : (D(i,0)*λSqrt || 1) ),
                  F2 = tabulate( [N,1], 'float64',    () => 0 ),
                  J = concat([J1,J2]),
                  F = concat([F1,F2]);

            const  X = new NDArray( Int32Array.of(N,1), solver.regularized_dX.slice() );
            expect(X).toBeAllCloseTo( lstsq(J,F).mapElems('float64', x => -x) );
          }
        }
      });


    for( const [example_type, items] of data_computeNewtonRegularized )
      forEachItemIn(
        items
      ).it(`computeNewtonRegularized(0) returns correct [r,dr] given ${example_type}`, ([solver]) => {
        const {M,N} = solver;

        const fJ = x => [
          new NDArray(Int32Array.of(M), solver.F0.slice()),
          tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) )
        ];

        const x0 = new NDArray(Int32Array.of(N), solver.X0.slice());

        const reference = new TrustRegionSolverLSQ(fJ,x0);
        reference.D.set(solver.D);

        const [r,dr] =    solver.computeNewtonRegularized(0);
        const [R,DR] = reference.computeNewtonRegularized(0);

        expect(solver.newton_dX).toBeAllCloseTo(reference.newton_dX);
        expect( r).toBeAllCloseTo( R);
        expect(dr).toBeAllCloseTo(DR);
      });


    for( const [example_type, items] of data_computeNewtonRegularized )
      forEachItemIn(
        items
      ).it(`computeNewtonRegularized(λ) returns correct [r,dr] given ${example_type}`, ([solver, lambdas]) => {
        const {M,N} = solver;

        const fJ = x => [
          new NDArray(Int32Array.of(M), solver.F0.slice()),
          tabulate( [M,N], 'float64', (i,j) => solver.__DEBUG_J(i,j) )
        ];

        const x0 = new NDArray(Int32Array.of(N), solver.X0.slice());

        const reference = new TrustRegionSolverLSQ(fJ,x0);
              reference.D.set(solver.D);

        for( const λ of lambdas )
        {
          const [r,dr] =    solver.computeNewtonRegularized(λ);
          const [R,DR] = reference.computeNewtonRegularized(λ);

          if( 0 === λ )
          expect(solver.     newton_dX).toBeAllCloseTo(reference.     newton_dX);
          expect(solver.regularized_dX).toBeAllCloseTo(reference.regularized_dX);
          expect( r).toBeAllCloseTo( R);
          expect(dr).toBeAllCloseTo(DR);
        }
      });
  });
