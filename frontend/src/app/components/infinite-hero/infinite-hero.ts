import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import * as THREE from 'three';
import {RouterLink} from '@angular/router';

gsap.registerPlugin(SplitText);

@Component({
  selector: 'app-infinite-hero',
  standalone: true,
  templateUrl: './infinite-hero.html',
  styleUrl: './infinite-hero.css',
  imports: [
    RouterLink
  ]
})
export class InfiniteHero implements AfterViewInit {
  @ViewChild('root', { static: true }) rootRef!: ElementRef<HTMLDivElement>;
  @ViewChild('bg', { static: true }) bgRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heading', { static: true }) h1Ref!: ElementRef<HTMLHeadingElement>;
  @ViewChild('desc', { static: true }) pRef!: ElementRef<HTMLParagraphElement>;
  @ViewChild('cta', { static: true }) ctaRef!: ElementRef<HTMLDivElement>;



  ngAfterViewInit(): void {
    this.initThree();
    this.initGsap();
  }

  // @HostListener('window:resize', ['$event'])
  // onResize(event: Event) {
  //   renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  // }

  private initThree() {
    const canvas = this.canvasRef.nativeElement;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const data = new Uint8Array([128, 128, 128, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector3(canvas.clientWidth, canvas.clientHeight, 1.0) },
      iChannel0: { value: texture }
    } as Record<string, { value: any }>;

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform float u_time;
      uniform vec3 u_resolution;
      uniform sampler2D iChannel0;
      #define STEP 256
      #define EPS .001
      float smin( float a, float b, float k ) {
        float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
        return mix( b, a, h ) - k*h*(1.0-h);
      }
      const mat2 m = mat2(.8,.6,-.6,.8);
      float noise( in vec2 x ) {
        return sin(1.5*x.x)*sin(1.5*x.y);
      }
      float fbm6( vec2 p ) {
        float f = 0.0;
        f += 0.500000*(0.5+0.5*noise( p )); p = m*p*2.02;
        f += 0.250000*(0.5+0.5*noise( p )); p = m*p*2.03;
        f += 0.125000*(0.5+0.5*noise( p )); p = m*p*2.01;
        f += 0.062500*(0.5+0.5*noise( p )); p = m*p*2.04;
        f += 0.015625*(0.5+0.5*noise( p ));
        return f/0.96875;
      }
      mat2 getRot(float a) {
        float sa = sin(a), ca = cos(a);
        return mat2(ca,-sa,sa,ca);
      }
      vec3 _position;
      float sphere(vec3 center, float radius) {
        return distance(_position,center) - radius;
      }
      float swingPlane(float height) {
        vec3 pos = _position + vec3(0.,0.,u_time * 5.5);
        float def =  fbm6(pos.xz * .25) * 0.5;
        float way = pow(abs(pos.x) * 34. ,2.5) *.0000125;
        def *= way;
        float ch = height + def;
        return max(pos.y - ch,0.);
      }
      float map(vec3 pos) {
        _position = pos;
        float dist;
        dist = swingPlane(0.);
        float sminFactor = 5.25;
        dist = smin(dist,sphere(vec3(0.,-15.,80.),60.),sminFactor);
        return dist;
      }
      vec3 getNormal(vec3 pos) {
        vec3 nor = vec3(0.);
        vec3 vv = vec3(0.,1.,-1.)*.01;
        nor.x = map(pos + vv.zxx) - map(pos + vv.yxx);
        nor.y = map(pos + vv.xzx) - map(pos + vv.xyx);
        nor.z = map(pos + vv.xxz) - map(pos + vv.xxy);
        nor /= 2.;
        return normalize(nor);
      }
      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
        vec2 uv = (fragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
        vec3 rayOrigin = vec3(uv + vec2(0.,6.), -1. );
        vec3 rayDir = normalize(vec3(uv , 1.));
        rayDir.zy = getRot(.15) * rayDir.zy;
        vec3 position = rayOrigin;
        float curDist; int nbStep = 0;
        for(; nbStep < STEP;++nbStep) {
          curDist = map(position + (texture(iChannel0, position.xz) - .5).xyz * .005);
          if(curDist < EPS) break;
          position += rayDir * curDist * .5;
        }
        float f;
        float dist = distance(rayOrigin,position);
        f = dist /(98.);
        f = float(nbStep) / float(STEP);
        f *= .9;
        vec3 col = vec3(f);
        fragColor = vec4(col,1.0);
      }
      void main() {
        vec4 fragColor;
        vec2 fragCoord = vUv * u_resolution.xy;
        mainImage(fragColor, fragCoord);
        gl_FragColor = fragColor;
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const animate = (t: number) => {
      material.uniforms["u_time"].value = t / 1000 * 0.5;
      material.uniforms["u_resolution"].value.set(canvas.clientWidth, canvas.clientHeight, 1.0);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    });
  }

  private initGsap() {
    const bg = this.bgRef.nativeElement;
    const h1 = this.h1Ref.nativeElement;
    const p = this.pRef.nativeElement;
    const cta = this.ctaRef.nativeElement;
    const ctas = Array.from(cta.children);

    const h1Split = new SplitText(h1, { type: 'lines' });
    const pSplit = new SplitText(p, { type: 'lines' });

    gsap.set(bg, { filter: 'blur(28px)' });
    gsap.set(h1Split.lines, { opacity: 0, y: 24, filter: 'blur(8px)' });
    gsap.set(pSplit.lines, { opacity: 0, y: 16, filter: 'blur(6px)' });
    gsap.set(ctas, { opacity: 0, y: 16 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(bg, { filter: 'blur(0px)', duration: 1.2 }, 0)
      .to(h1Split.lines, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, stagger: 0.1 }, 0.3)
      .to(pSplit.lines, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.08 }, '-=0.3')
      .to(ctas, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, '-=0.2');
  }
}
