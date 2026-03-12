import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

interface TerrainLayer {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly basePositions: Float32Array;
  readonly baseRotation: { x: number; y: number; z: number };
  readonly baseScale: THREE.Vector3;
  readonly amplitude: number;
  readonly frequency: number;
  readonly drift: { x: number; y: number };
  readonly spin: number;
}

export class AuthSurface {
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private terrainGroup?: THREE.Group;
  private readonly terrainLayers: TerrainLayer[] = [];
  private resizeObserver?: ResizeObserver;
  private animationFrameId?: number;
  private pendingResize?: { width: number; height: number; dpr: number };
  private readonly pointerTarget = new THREE.Vector2();
  private readonly pointerCurrent = new THREE.Vector2();
  private readonly simplex = new SimplexNoise();
  private elapsedTime = 0;
  private lastFrameTime?: number;

  private readonly handlePointerMove = (event: PointerEvent) => {
    const rect = this.observeTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    this.pointerTarget.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(-y, -1, 1));
  };

  private readonly handlePointerLeave = () => {
    this.pointerTarget.set(0, 0);
  };

  private readonly handleWindowResize = () => {
    this.queueResize();
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly observeTarget: HTMLElement
  ) {}

  start(): boolean {
    if (this.renderer) {
      return true;
    }

    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch {
      return false;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x03070d, 12, 48);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(25, 1, 0.01, 1000);
    camera.position.set(0, 2.1, 15);
    camera.lookAt(0, 0, 0);
    this.camera = camera;

    const terrainGroup = new THREE.Group();
    terrainGroup.position.set(0, -0.3, 0);
    this.terrainGroup = terrainGroup;
    scene.add(terrainGroup);

    this.createTerrainLayer(terrainGroup, {
      color: 0x86ddff,
      opacity: 0.44,
      amplitude: 0.38,
      frequency: 0.17,
      drift: { x: 0.04, y: 0.02 },
      scale: new THREE.Vector3(30, 34, 2.3),
      baseRotationZ: 0.42,
      spin: 0.04
    });
    this.createTerrainLayer(terrainGroup, {
      color: 0xffc286,
      opacity: 0.12,
      amplitude: 0.28,
      frequency: 0.2,
      drift: { x: -0.03, y: 0.015 },
      scale: new THREE.Vector3(27.5, 31, 1.9),
      baseRotationZ: 0.36,
      spin: 0.026
    });

    this.observeTarget.addEventListener('pointermove', this.handlePointerMove);
    this.observeTarget.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('resize', this.handleWindowResize);

    this.queueResize();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => this.queueResize());
      resizeObserver.observe(this.observeTarget);
      this.resizeObserver = resizeObserver;
    }

    const animate = (timestamp: number) => {
      if (this.lastFrameTime === undefined) {
        this.lastFrameTime = timestamp;
      }

      const delta = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
      this.lastFrameTime = timestamp;
      this.elapsedTime += delta;

      const pending = this.pendingResize;
      if (pending && this.camera) {
        renderer.setPixelRatio(pending.dpr);
        renderer.setSize(pending.width, pending.height, false);
        this.camera.aspect = pending.width / pending.height;
        this.camera.updateProjectionMatrix();
        this.applyCoverage(pending.width, pending.height);
        this.pendingResize = undefined;
      }

      this.pointerCurrent.lerp(this.pointerTarget, 0.08);

      if (this.terrainGroup) {
        this.terrainGroup.rotation.x = this.pointerCurrent.y * 0.08;
        this.terrainGroup.rotation.y = this.pointerCurrent.x * 0.14;
      }

      for (const layer of this.terrainLayers) {
        this.updateTerrainLayer(layer, this.elapsedTime);
        layer.mesh.rotation.x = layer.baseRotation.x;
        layer.mesh.rotation.y = layer.baseRotation.y;
        layer.mesh.rotation.z = layer.baseRotation.z + this.elapsedTime * layer.spin;
      }

      renderer.render(scene, camera);
      this.animationFrameId = window.requestAnimationFrame(animate);
    };

    this.animationFrameId = window.requestAnimationFrame(animate);
    return true;
  }

  destroy(): void {
    if (this.animationFrameId !== undefined) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    this.observeTarget.removeEventListener('pointermove', this.handlePointerMove);
    this.observeTarget.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('resize', this.handleWindowResize);

    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    this.terrainGroup?.traverse((child) => {
      if ('geometry' in child) {
        const geometry = child.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
          geometry.dispose();
        }
      }

      if ('material' in child) {
        const material = child.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material?.dispose();
        }
      }
    });

    this.scene?.clear();
    this.renderer?.dispose();

    this.terrainLayers.length = 0;
    this.scene = undefined;
    this.camera = undefined;
    this.terrainGroup = undefined;
    this.renderer = undefined;
    this.lastFrameTime = undefined;
    this.elapsedTime = 0;
  }

  private queueResize(): void {
    const width = Math.max(1, window.innerWidth || this.observeTarget.getBoundingClientRect().width);
    const height = Math.max(1, window.innerHeight || this.observeTarget.getBoundingClientRect().height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.pendingResize = { width, height, dpr };
  }

  private createTerrainLayer(
    group: THREE.Group,
    config: {
      color: THREE.ColorRepresentation;
      opacity: number;
      amplitude: number;
      frequency: number;
      drift: { x: number; y: number };
      scale: THREE.Vector3;
      baseRotationZ: number;
      spin: number;
    }
  ): void {
    const geometry = new THREE.PlaneGeometry(12, 12, 140, 140);
    const positions = geometry.attributes['position'].array as Float32Array;
    const basePositions = new Float32Array(positions);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      wireframe: true,
      transparent: true,
      opacity: config.opacity,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.lookAt(new THREE.Vector3(0, 1, 0));
    mesh.rotation.z += config.baseRotationZ;
    mesh.scale.copy(config.scale);
    group.add(mesh);

    const layer: TerrainLayer = {
      mesh,
      basePositions,
      baseRotation: {
        x: mesh.rotation.x,
        y: mesh.rotation.y,
        z: mesh.rotation.z
      },
      baseScale: config.scale.clone(),
      amplitude: config.amplitude,
      frequency: config.frequency,
      drift: config.drift,
      spin: config.spin
    };

    this.updateTerrainLayer(layer, 0);
    this.terrainLayers.push(layer);
  }

  private updateTerrainLayer(layer: TerrainLayer, time: number): void {
    const positions = layer.mesh.geometry.attributes['position'] as THREE.BufferAttribute;
    const array = positions.array as Float32Array;

    for (let offset = 0; offset < array.length; offset += 3) {
      const x = layer.basePositions[offset];
      const y = layer.basePositions[offset + 1];

      const ridge = this.simplex.noise(
        x * layer.frequency + time * layer.drift.x,
        y * layer.frequency + time * layer.drift.y
      );
      const detail = this.simplex.noise(
        x * layer.frequency * 2.3 - time * layer.drift.y * 1.4,
        y * layer.frequency * 2.1 + time * layer.drift.x * 1.1
      );

      array[offset + 2] = ridge * layer.amplitude + detail * layer.amplitude * 0.35;
    }

    positions.needsUpdate = true;
  }

  private applyCoverage(width: number, height: number): void {
    const aspect = width / height;
    const horizontalBoost = aspect >= 1
      ? 1.18 + Math.min(aspect - 1, 1.4) * 0.46
      : 1.12;
    const verticalBoost = aspect < 1
      ? 1.1 + Math.min(1 - aspect, 0.45) * 0.52
      : 1.08;

    for (const layer of this.terrainLayers) {
      layer.mesh.scale.set(
        layer.baseScale.x * horizontalBoost,
        layer.baseScale.y * verticalBoost,
        layer.baseScale.z
      );
    }
  }
}
