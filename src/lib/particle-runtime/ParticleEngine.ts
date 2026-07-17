import * as THREE from "three";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import { parseParticleTargets } from "./binary";
import {
  clampStageProgress,
  damp,
  resolveDalaStageState,
  resolveViewportStagePlacement,
} from "./math";
import {
  DALA_ASSEMBLY_SECONDS,
  DALA_FOREGROUND_PALETTE,
  DALA_FOREGROUND_PARTICLE_COUNT,
  DALA_MAIN_PALETTE,
  DALA_MAIN_PARTICLE_COUNT,
  DALA_MOBILE_PARTICLE_COUNT,
  DALA_POSTPROCESSING,
  DALA_SIMULATION_SIDE,
  IMPULSE_SECONDS,
  createDalaGlyphGeometry,
  type ParticleTargetDataV2Compatible,
} from "./three-kernel";
import {
  foregroundFragmentShader,
  foregroundVertexShader,
  initializationFragmentShader,
  particleFragmentShader,
  particleVertexShader,
  simulationFragmentShader,
  simulationVertexShader,
  vignetteGrainShader,
} from "./three-shaders";

export type ParticleEngineOptions = {
  canvas: HTMLCanvasElement;
  targetUrl: string;
  reducedMotion: boolean;
  onProgress?: (progress: number) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
};

type SimulationState = THREE.WebGLRenderTarget;

const CAMERA_FOV = 38;
const CAMERA_Z = 7.4;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 30;
const TAU = Math.PI * 2;
const PARTICLE_COLOR_BOOST = 1.1;

function errorFrom(value: unknown) {
  return value instanceof Error ? value : new Error(String(value));
}

function deterministicHash(value: number) {
  return Math.abs(Math.sin(value * 91.733 + 17.17) * 43758.5453) % 1;
}

function srgbChannelToLinear(value: number) {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function createFloatTexture(data: Float32Array) {
  const texture = new THREE.DataTexture(
    data,
    DALA_SIMULATION_SIDE,
    DALA_SIMULATION_SIDE,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

function createSimulationTarget(): SimulationState {
  const target = new THREE.WebGLRenderTarget(DALA_SIMULATION_SIDE, DALA_SIMULATION_SIDE, {
    count: 2,
    depthBuffer: false,
    stencilBuffer: false,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    generateMipmaps: false,
  });
  target.textures[0].name = "Dala.position";
  target.textures[1].name = "Dala.velocity";
  return target;
}

function createInstancedGlyphGeometry(base: THREE.BufferGeometry) {
  const geometry = new THREE.InstancedBufferGeometry();
  for (const [name, attribute] of Object.entries(base.attributes)) {
    geometry.setAttribute(name, attribute.clone());
  }
  if (base.index) geometry.setIndex(base.index.clone());
  geometry.boundingBox = base.boundingBox?.clone() ?? null;
  geometry.boundingSphere = base.boundingSphere?.clone() ?? null;
  return geometry;
}

export class ParticleEngine {
  private readonly options: ParticleEngineOptions;
  private readonly canvas: HTMLCanvasElement;
  private targets: ParticleTargetDataV2Compatible | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private bokehPass: BokehPass | null = null;
  private vignettePass: ShaderPass | null = null;
  private outputPass: OutputPass | null = null;
  private mainGeometry: THREE.InstancedBufferGeometry | null = null;
  private foregroundGeometry: THREE.InstancedBufferGeometry | null = null;
  private mainMaterial: THREE.ShaderMaterial | null = null;
  private foregroundMaterial: THREE.ShaderMaterial | null = null;
  private targetTextures: THREE.DataTexture[] = [];
  private styleTextures: THREE.DataTexture[] = [];
  private metadataTextures: THREE.DataTexture[] = [];
  private originTexture: THREE.DataTexture | null = null;
  private simulationStates: SimulationState[] = [];
  private simulationScene: THREE.Scene | null = null;
  private simulationCamera: THREE.OrthographicCamera | null = null;
  private simulationQuad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private initializationMaterial: THREE.ShaderMaterial | null = null;
  private simulationMaterial: THREE.ShaderMaterial | null = null;
  private readStateIndex = 0;
  private stageProgress = 0;
  private pointerTarget = { x: 0, y: 0, active: false };
  private pointer = { x: 0, y: 0 };
  private pointerDelta = { x: 0, y: 0 };
  private pointerInfluence = 0;
  private sweep = { x: 0, y: 0, spin: 0 };
  private occlusionStrength = 0;
  private impulse = { origin: { x: 0.5, y: 0.5 }, age: 0, strength: 0 };
  private rafId: number | null = null;
  private startPromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;
  private lastFrameTime = 0;
  private elapsedSeconds = 0;
  private paused = false;
  private hidden = false;
  private destroyed = false;
  private contextLost = false;
  private listenersAttached = false;
  private particleCount = DALA_MAIN_PARTICLE_COUNT;
  private viewHalfHeight = 1;
  private cssWidth = 1;
  private cssHeight = 1;

  constructor(options: ParticleEngineOptions) {
    this.options = options;
    this.canvas = options.canvas;
  }

  start(): Promise<void> {
    if (this.destroyed) {
      return Promise.reject(
        new Error("Cannot start a ParticleEngine after it has been destroyed."),
      );
    }
    this.startPromise ??= this.initialize().catch((value: unknown) => {
      const error = errorFrom(value);
      if (this.destroyed && error.name === "AbortError") return;
      if (!this.destroyed) {
        this.cancelFrame();
        this.deleteResources(true);
        this.detachListeners();
        this.options.onError?.(error);
      }
      throw error;
    });
    return this.startPromise;
  }

  setStageProgress(progress: number) {
    if (this.destroyed) return;
    this.stageProgress = clampStageProgress(
      progress,
      this.targets?.stageCount ?? 4,
    );
    if (this.options.reducedMotion && this.mainMaterial) this.renderStaticFrame();
  }

  setDebugTime(seconds: number | null) {
    if (this.destroyed || seconds === null || !Number.isFinite(seconds)) return;
    this.elapsedSeconds = Math.max(0, seconds);
    this.renderStaticFrame();
  }

  /** Pointer coordinates are normalized WebGL clip coordinates in [-1, 1]. */
  setPointer(x: number, y: number, active: boolean) {
    if (this.destroyed) return;
    const nextX = active && Number.isFinite(x)
      ? Math.min(Math.max(x, -1), 1)
      : this.pointerTarget.x;
    const nextY = active && Number.isFinite(y)
      ? Math.min(Math.max(y, -1), 1)
      : this.pointerTarget.y;
    if (active) {
      this.pointerDelta.x = Math.min(Math.max(nextX - this.pointerTarget.x, -2), 2);
      this.pointerDelta.y = Math.min(Math.max(nextY - this.pointerTarget.y, -2), 2);
    }
    this.pointerTarget = {
      x: nextX,
      y: nextY,
      active,
    };
  }

  triggerImpulse(clipX: number, clipY: number) {
    const camera = this.camera;
    if (
      this.destroyed ||
      this.options.reducedMotion ||
      !this.simulationMaterial ||
      !this.mainMaterial ||
      !camera ||
      !Number.isFinite(clipX) ||
      !Number.isFinite(clipY)
    ) {
      return;
    }
    const stage = this.resolveStageState();
    const placement = resolveViewportStagePlacement(
      stage.from + stage.morph,
      this.cssWidth / Math.max(this.cssHeight, 1),
    );
    const objectScale = placement.scale * this.viewHalfHeight;
    const worldX = clipX * this.viewHalfHeight * camera.aspect;
    const worldY = clipY * this.viewHalfHeight;
    this.impulse.origin.x = Math.min(Math.max(
      0.5 + (
        worldX - placement.x * this.viewHalfHeight * camera.aspect
      ) / objectScale,
      0,
    ), 1);
    this.impulse.origin.y = Math.min(Math.max(
      0.5 + (worldY - placement.y * this.viewHalfHeight) / objectScale,
      0,
    ), 1);
    this.impulse.age = 0;
    this.impulse.strength = 1;
  }

  resize() {
    const renderer = this.renderer;
    const camera = this.camera;
    const composer = this.composer;
    if (this.destroyed || !renderer || !camera || !composer || this.contextLost) return;

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const mobile = coarsePointer || window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75);
    this.cssWidth = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    this.cssHeight = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    this.particleCount = mobile
      ? DALA_MOBILE_PARTICLE_COUNT
      : DALA_MAIN_PARTICLE_COUNT;

    renderer.setPixelRatio(dpr);
    renderer.setSize(this.cssWidth, this.cssHeight, false);
    camera.aspect = this.cssWidth / this.cssHeight;
    camera.updateProjectionMatrix();
    this.viewHalfHeight = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV * 0.5)) * CAMERA_Z;
    composer.setPixelRatio(dpr);
    composer.setSize(this.cssWidth, this.cssHeight);
    if (this.mainGeometry) this.mainGeometry.instanceCount = this.particleCount;
    if (this.bokehPass) this.bokehPass.enabled = !mobile;
    if (this.simulationMaterial) {
      this.simulationMaterial.uniforms.uExplodeScale.value = mobile ? 0.6 : 1;
    }
    this.updateViewportUniforms();
    if (this.options.reducedMotion) this.renderStaticFrame();
  }

  setPaused(paused: boolean) {
    if (this.destroyed || this.paused === paused) return;
    this.paused = paused;
    if (paused) this.cancelFrame();
    else this.scheduleFrame();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abortController?.abort();
    this.abortController = null;
    this.cancelFrame();
    this.detachListeners();
    this.deleteResources(true);
    this.targets = null;
    this.startPromise = null;
  }

  private async initialize() {
    this.reportProgress(0);
    this.attachListeners();
    this.abortController = new AbortController();
    const response = await fetch(this.options.targetUrl, {
      signal: this.abortController.signal,
      cache: "force-cache",
    });
    if (!response.ok) {
      throw new Error(
        `Unable to load particle targets (${response.status} ${response.statusText}).`,
      );
    }
    const buffer = await response.arrayBuffer();
    this.reportProgress(0.2);
    this.targets = parseParticleTargets(buffer) as ParticleTargetDataV2Compatible;
    if (this.destroyed) return;
    this.initializeRendererAndResources();
    this.resize();
    this.reportProgress(1);
    this.options.onReady?.();
    if (this.options.reducedMotion) this.renderStaticFrame();
    else this.scheduleFrame();
  }

  private initializeRendererAndResources() {
    if (!this.targets) throw new Error("Particle target data is not ready.");
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: false,
        depth: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
      });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.renderer.toneMappingExposure = 1;
    }
    const gl = this.renderer.getContext();
    if (!("drawBuffers" in gl)) {
      throw new Error("WebGL2 is unavailable; semantic content remains active.");
    }
    if (!gl.getExtension("EXT_color_buffer_float")) {
      throw new Error(
        "WebGL2 float render targets are unavailable (EXT_color_buffer_float is required).",
      );
    }
    this.createResources();
  }

  private createResources() {
    const renderer = this.renderer;
    const targets = this.targets;
    if (!renderer || !targets) throw new Error("Particle renderer is not ready.");

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      1,
      CAMERA_NEAR,
      CAMERA_FAR,
    );
    this.camera.position.set(0, 0, CAMERA_Z);
    this.camera.lookAt(0, 0, 0);

    this.createTargetTextures(targets);
    this.reportProgress(0.42);
    this.createSimulationResources();
    this.reportProgress(0.64);
    this.createParticleLayers();
    this.createPostProcessing();
    this.reportProgress(0.86);
  }

  private createTargetTextures(targets: ParticleTargetDataV2Compatible) {
    const styles = targets.styles;
    const metadata = targets.metadata;
    for (let stageIndex = 0; stageIndex < targets.stageCount; stageIndex += 1) {
      const stage = targets.stages[stageIndex];
      const stageStyles = styles?.[stageIndex]?.length === stage.length
        ? this.linearizeStyles(styles[stageIndex])
        : this.createFallbackStyles(stage, stageIndex);
      const metadataCandidate = metadata instanceof Float32Array
        ? metadata
        : metadata?.[stageIndex];
      const stageMetadata = metadataCandidate?.length === stage.length
        ? metadataCandidate
        : this.createFallbackMetadata(stage, stageIndex);
      this.targetTextures.push(createFloatTexture(stage));
      this.styleTextures.push(createFloatTexture(stageStyles));
      this.metadataTextures.push(createFloatTexture(stageMetadata));
    }

    const firstStage = targets.stages[0];
    const firstMetadata = this.textureData(this.metadataTextures[0]);
    const origins = new Float32Array(firstStage.length);
    for (let index = 0; index < targets.pointsPerStage; index += 1) {
      const offset = index * 4;
      const phase = firstMetadata[offset + 1];
      const angle = phase * TAU + index * 0.754877666;
      const radius = 0.7 + deterministicHash(phase * 31 + index) * 0.95;
      origins[offset] = 0.5 + Math.cos(angle) * radius;
      origins[offset + 1] = 0.5 + Math.sin(angle) * radius;
      origins[offset + 2] = deterministicHash(index * 0.413 + phase) * 1.4 - 0.2;
      origins[offset + 3] = firstStage[offset + 3];
    }
    this.originTexture = createFloatTexture(origins);
  }

  private createFallbackStyles(stage: Float32Array, stageIndex: number) {
    const styles = new Float32Array(stage.length);
    const colors = DALA_MAIN_PALETTE.map((value) => new THREE.Color(value));
    for (let index = 0; index < stage.length / 4; index += 1) {
      const offset = index * 4;
      const seed = stage[offset + 3] + stageIndex * 0.137 + index * 0.00013;
      const color = colors[Math.floor(deterministicHash(seed * 17.3) * colors.length)];
      styles[offset] = 0.74 + deterministicHash(seed * 11.1) * 0.52;
      styles[offset + 1] = color.r;
      styles[offset + 2] = color.g;
      styles[offset + 3] = color.b;
    }
    return styles;
  }

  private linearizeStyles(encodedStyles: Float32Array) {
    const styles = encodedStyles.slice();
    for (let offset = 0; offset < styles.length; offset += 4) {
      styles[offset + 1] = srgbChannelToLinear(styles[offset + 1]);
      styles[offset + 2] = srgbChannelToLinear(styles[offset + 2]);
      styles[offset + 3] = srgbChannelToLinear(styles[offset + 3]);
    }
    return styles;
  }

  private createFallbackMetadata(stage: Float32Array, stageIndex: number) {
    const pointCount = stage.length / 4;
    const metadata = new Float32Array(stage.length);
    const indices = Array.from({ length: pointCount }, (_, index) => index);
    indices.sort((left, right) => {
      const leftOffset = left * 4;
      const rightOffset = right * 4;
      const leftOrder = stage[leftOffset] * 0.62 + stage[leftOffset + 1] * 0.38;
      const rightOrder = stage[rightOffset] * 0.62 + stage[rightOffset + 1] * 0.38;
      return leftOrder - rightOrder;
    });
    for (let rank = 0; rank < indices.length; rank += 1) {
      const index = indices[rank];
      const offset = index * 4;
      const seed = stage[offset + 3] + stageIndex * 1.73 + index * 0.00019;
      metadata[offset] = rank / Math.max(pointCount - 1, 1);
      metadata[offset + 1] = deterministicHash(seed * 7.13);
      metadata[offset + 2] = 0.45 + deterministicHash(seed * 13.7) * 0.55;
      metadata[offset + 3] = 0.5 + deterministicHash(seed * 23.1) * 0.75;
    }
    return metadata;
  }

  private textureData(texture: THREE.DataTexture) {
    const data = texture.image.data;
    if (!(data instanceof Float32Array)) {
      throw new Error("Particle metadata texture must use Float32Array data.");
    }
    return data;
  }

  private createSimulationResources() {
    const renderer = this.renderer;
    const originTexture = this.originTexture;
    if (!renderer || !originTexture) throw new Error("Simulation inputs are unavailable.");

    this.simulationScene = new THREE.Scene();
    this.simulationCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.initializationMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: { uInitialPosition: { value: originTexture } },
      vertexShader: simulationVertexShader,
      fragmentShader: initializationFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.simulationMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uPosition: { value: null },
        uVelocity: { value: null },
        uOrigin: { value: originTexture },
        uTargetFrom: { value: this.targetTextures[0] },
        uTargetTo: { value: this.targetTextures[0] },
        uMetadataFrom: { value: this.metadataTextures[0] },
        uMetadataTo: { value: this.metadataTextures[0] },
        uBlend: { value: 0 },
        uSameStage: { value: 1 },
        uExplode: { value: 0 },
        uExplodeScale: { value: 1 },
        uAssembly: { value: 0 },
        uFrameScale: { value: 1 },
        uImpulseOrigin: { value: new THREE.Vector2(0.5, 0.5) },
        uImpulseStrength: { value: 0 },
        uImpulseAge: { value: 0 },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.simulationQuad = new THREE.Mesh(geometry, this.initializationMaterial);
    this.simulationScene.add(this.simulationQuad);
    this.simulationStates = [createSimulationTarget(), createSimulationTarget()];
    for (const state of this.simulationStates) {
      renderer.setRenderTarget(state);
      renderer.render(this.simulationScene, this.simulationCamera);
    }
    renderer.setRenderTarget(null);
    this.simulationQuad.material = this.simulationMaterial;
    this.readStateIndex = 0;
  }

  private createParticleLayers() {
    const scene = this.scene;
    if (!scene || this.simulationStates.length !== 2) {
      throw new Error("Particle scene inputs are unavailable.");
    }
    const baseGeometry = createDalaGlyphGeometry();
    this.mainGeometry = createInstancedGlyphGeometry(baseGeometry);
    this.mainGeometry.instanceCount = this.particleCount;
    this.mainMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uPosition: { value: this.simulationStates[0].textures[0] },
        uTargetFrom: { value: this.targetTextures[0] },
        uTargetTo: { value: this.targetTextures[0] },
        uStyleFrom: { value: this.styleTextures[0] },
        uStyleTo: { value: this.styleTextures[0] },
        uMetadataFrom: { value: this.metadataTextures[0] },
        uMetadataTo: { value: this.metadataTextures[0] },
        uBlend: { value: 0 },
        uSameStage: { value: 1 },
        uReducedMotion: { value: this.options.reducedMotion ? 1 : 0 },
        uTime: { value: 0 },
        uObjectScale: { value: 1 },
        uViewHalfHeight: { value: 1 },
        uAspect: { value: 1 },
        uViewportHeight: { value: 1 },
        uPlacement: { value: new THREE.Vector2() },
        uCloudOffset: { value: new THREE.Vector2() },
        uCloudSpin: { value: 0 },
        uPointerWorld: { value: new THREE.Vector2() },
        uPointerDelta: { value: new THREE.Vector2() },
        uPointerActive: { value: 0 },
        uOcclusionStrength: { value: 0 },
        uColorBoost: { value: PARTICLE_COLOR_BOOST },
        uImpulseOrigin: { value: new THREE.Vector2(0.5, 0.5) },
        uImpulseStrength: { value: 0 },
        uImpulseAge: { value: 0 },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    const mainMesh = new THREE.Mesh(this.mainGeometry, this.mainMaterial);
    mainMesh.frustumCulled = false;
    mainMesh.renderOrder = 1;
    scene.add(mainMesh);

    this.foregroundGeometry = createInstancedGlyphGeometry(baseGeometry);
    this.foregroundGeometry.instanceCount = DALA_FOREGROUND_PARTICLE_COUNT;
    this.populateForegroundAttributes(this.foregroundGeometry);
    this.foregroundMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        uTime: { value: 0 },
        uReducedMotion: { value: this.options.reducedMotion ? 1 : 0 },
        uViewHalfHeight: { value: 1 },
        uAspect: { value: 1 },
        uViewportHeight: { value: 1 },
        uParallax: { value: new THREE.Vector2() },
      },
      vertexShader: foregroundVertexShader,
      fragmentShader: foregroundFragmentShader,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
    const foregroundMesh = new THREE.Mesh(
      this.foregroundGeometry,
      this.foregroundMaterial,
    );
    foregroundMesh.frustumCulled = false;
    foregroundMesh.renderOrder = 2;
    scene.add(foregroundMesh);
    baseGeometry.dispose();
  }

  private populateForegroundAttributes(geometry: THREE.InstancedBufferGeometry) {
    const positions = new Float32Array(DALA_FOREGROUND_PARTICLE_COUNT * 3);
    const scales = new Float32Array(DALA_FOREGROUND_PARTICLE_COUNT);
    const colors = new Float32Array(DALA_FOREGROUND_PARTICLE_COUNT * 3);
    const phases = new Float32Array(DALA_FOREGROUND_PARTICLE_COUNT);
    const palette = DALA_FOREGROUND_PALETTE.map((value) => new THREE.Color(value));
    for (let index = 0; index < DALA_FOREGROUND_PARTICLE_COUNT; index += 1) {
      const phase = deterministicHash(index * 3.173 + 0.37);
      const positionOffset = index * 3;
      positions[positionOffset] = deterministicHash(index * 5.71 + 1.1) * 5.6 - 2.8;
      positions[positionOffset + 1] = deterministicHash(index * 7.13 + 2.7) * 4.8 - 2.4;
      positions[positionOffset + 2] = deterministicHash(index * 11.17 + 4.2) * 6 - 3.4;
      scales[index] = 12 + Math.pow(deterministicHash(index * 13.31), 1.5) * 23;
      const color = palette[Math.floor(phase * palette.length)];
      colors[positionOffset] = color.r;
      colors[positionOffset + 1] = color.g;
      colors[positionOffset + 2] = color.b;
      phases[index] = phase;
    }
    geometry.setAttribute("instancePosition", new THREE.InstancedBufferAttribute(positions, 3));
    geometry.setAttribute("instanceScale", new THREE.InstancedBufferAttribute(scales, 1));
    geometry.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(colors, 3));
    geometry.setAttribute("instancePhase", new THREE.InstancedBufferAttribute(phases, 1));
  }

  private createPostProcessing() {
    const renderer = this.renderer;
    const scene = this.scene;
    const camera = this.camera;
    if (!renderer || !scene || !camera) throw new Error("Post-processing inputs are unavailable.");

    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.bokehPass = new BokehPass(scene, camera, {
      focus: DALA_POSTPROCESSING.focalDepth,
      aperture:
        DALA_POSTPROCESSING.focalLength /
        DALA_POSTPROCESSING.fstop /
        1000,
      maxblur: DALA_POSTPROCESSING.maxblur,
    });
    this.vignettePass = new ShaderPass(vignetteGrainShader);
    this.outputPass = new OutputPass();
    this.vignettePass.uniforms.uOffset.value = DALA_POSTPROCESSING.vignetteOffset;
    this.vignettePass.uniforms.uDarkness.value = DALA_POSTPROCESSING.vignetteDarkness;
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bokehPass);
    this.composer.addPass(this.vignettePass);
    this.composer.addPass(this.outputPass);
  }

  private scheduleFrame() {
    if (
      this.destroyed ||
      this.paused ||
      this.hidden ||
      this.contextLost ||
      this.options.reducedMotion ||
      this.rafId !== null ||
      !this.composer
    ) {
      return;
    }
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  private readonly frame = (time: number) => {
    this.rafId = null;
    if (this.destroyed || this.paused || this.hidden || this.contextLost) return;
    const delta = Math.min(Math.max((time - this.lastFrameTime) / 1000, 0), 0.05);
    this.lastFrameTime = time;
    this.elapsedSeconds += delta;
    this.pointer.x = damp(this.pointer.x, this.pointerTarget.x, 4.7, delta);
    this.pointer.y = damp(this.pointer.y, this.pointerTarget.y, 4.7, delta);
    this.pointerInfluence = damp(
      this.pointerInfluence,
      this.pointerTarget.active ? 1 : 0,
      4.7,
      delta,
    );
    this.pointerDelta.x = damp(this.pointerDelta.x, 0, 6, delta);
    this.pointerDelta.y = damp(this.pointerDelta.y, 0, 6, delta);
    this.simulate(delta);
    this.renderFrame(delta);
    this.scheduleFrame();
  };

  private simulate(delta: number) {
    const renderer = this.renderer;
    const scene = this.simulationScene;
    const camera = this.simulationCamera;
    const material = this.simulationMaterial;
    if (!renderer || !scene || !camera || !material || this.simulationStates.length !== 2) return;
    const source = this.simulationStates[this.readStateIndex];
    const writeIndex = 1 - this.readStateIndex;
    const destination = this.simulationStates[writeIndex];
    const stage = this.resolveStageState();
    material.uniforms.uPosition.value = source.textures[0];
    material.uniforms.uVelocity.value = source.textures[1];
    material.uniforms.uTargetFrom.value = this.targetTextures[stage.from];
    material.uniforms.uTargetTo.value = this.targetTextures[stage.to];
    material.uniforms.uMetadataFrom.value = this.metadataTextures[stage.from];
    material.uniforms.uMetadataTo.value = this.metadataTextures[stage.to];
    material.uniforms.uBlend.value = stage.morph;
    material.uniforms.uSameStage.value = stage.from === stage.to ? 1 : 0;
    material.uniforms.uExplode.value = stage.explode;
    if (this.impulse.strength > 0) {
      this.impulse.age += delta;
      if (this.impulse.age > IMPULSE_SECONDS) {
        this.impulse.strength = 0;
        material.uniforms.uImpulseStrength.value = 0;
      } else {
        this.impulse.strength = Math.exp(-2.6 * this.impulse.age);
        material.uniforms.uImpulseOrigin.value.set(
          this.impulse.origin.x,
          this.impulse.origin.y,
        );
        material.uniforms.uImpulseStrength.value = this.impulse.strength;
        material.uniforms.uImpulseAge.value = this.impulse.age;
      }
    }
    material.uniforms.uAssembly.value = Math.min(
      this.elapsedSeconds / DALA_ASSEMBLY_SECONDS,
      1,
    );
    material.uniforms.uFrameScale.value = delta * 60;
    renderer.setRenderTarget(destination);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    this.readStateIndex = writeIndex;
  }

  private renderStaticFrame() {
    if (!this.composer || !this.mainMaterial) return;
    this.renderFrame(0);
  }

  private renderFrame(delta: number) {
    const composer = this.composer;
    const camera = this.camera;
    const mainMaterial = this.mainMaterial;
    const foregroundMaterial = this.foregroundMaterial;
    const state = this.simulationStates[this.readStateIndex];
    if (!composer || !camera || !mainMaterial || !foregroundMaterial || !state) return;
    const stage = this.resolveStageState();
    const smoothingDelta = delta > 0 ? delta : 1 / 60;
    this.sweep.x = damp(this.sweep.x, stage.sweep.x, 6, smoothingDelta);
    this.sweep.y = damp(this.sweep.y, stage.sweep.y, 6, smoothingDelta);
    this.sweep.spin = damp(this.sweep.spin, stage.sweep.spin, 6, smoothingDelta);
    const occlusionTarget = stage.settledStage === 3
      ? 1
      : stage.from === 2 && stage.to === 3
        ? stage.morph
        : 0;
    this.occlusionStrength = damp(
      this.occlusionStrength,
      occlusionTarget,
      6,
      smoothingDelta,
    );
    const placement = resolveViewportStagePlacement(
      stage.from + stage.morph,
      this.cssWidth / Math.max(this.cssHeight, 1),
    );
    const pointerWorld = new THREE.Vector2(
      this.pointer.x * this.viewHalfHeight * camera.aspect,
      this.pointer.y * this.viewHalfHeight,
    );
    mainMaterial.uniforms.uPosition.value = state.textures[0];
    mainMaterial.uniforms.uTargetFrom.value = this.targetTextures[stage.from];
    mainMaterial.uniforms.uTargetTo.value = this.targetTextures[stage.to];
    mainMaterial.uniforms.uStyleFrom.value = this.styleTextures[stage.from];
    mainMaterial.uniforms.uStyleTo.value = this.styleTextures[stage.to];
    mainMaterial.uniforms.uMetadataFrom.value = this.metadataTextures[stage.from];
    mainMaterial.uniforms.uMetadataTo.value = this.metadataTextures[stage.to];
    mainMaterial.uniforms.uBlend.value = stage.morph;
    mainMaterial.uniforms.uSameStage.value = stage.from === stage.to ? 1 : 0;
    mainMaterial.uniforms.uTime.value = this.options.reducedMotion ? 0 : this.elapsedSeconds;
    mainMaterial.uniforms.uObjectScale.value = placement.scale * this.viewHalfHeight;
    mainMaterial.uniforms.uPlacement.value.set(placement.x, placement.y);
    mainMaterial.uniforms.uCloudOffset.value.set(
      this.sweep.x * this.viewHalfHeight * camera.aspect,
      this.sweep.y * this.viewHalfHeight,
    );
    mainMaterial.uniforms.uCloudSpin.value = this.sweep.spin;
    mainMaterial.uniforms.uPointerWorld.value.copy(pointerWorld);
    mainMaterial.uniforms.uPointerDelta.value.set(
      this.options.reducedMotion ? 0 : this.pointerDelta.x,
      this.options.reducedMotion ? 0 : this.pointerDelta.y,
    );
    mainMaterial.uniforms.uPointerActive.value = this.options.reducedMotion
      ? 0
      : this.pointerInfluence;
    mainMaterial.uniforms.uOcclusionStrength.value = this.occlusionStrength;
    mainMaterial.uniforms.uColorBoost.value = PARTICLE_COLOR_BOOST;
    mainMaterial.uniforms.uImpulseOrigin.value.set(
      this.impulse.origin.x,
      this.impulse.origin.y,
    );
    mainMaterial.uniforms.uImpulseStrength.value = this.impulse.strength;
    mainMaterial.uniforms.uImpulseAge.value = this.impulse.age;

    foregroundMaterial.uniforms.uTime.value = this.options.reducedMotion
      ? 0
      : this.elapsedSeconds;
    foregroundMaterial.uniforms.uParallax.value.set(
      this.options.reducedMotion ? 0 : this.pointer.x * this.pointerInfluence * -0.12,
      this.options.reducedMotion ? 0 : this.pointer.y * this.pointerInfluence * -0.08,
    );
    camera.position.x = this.options.reducedMotion
      ? 0
      : this.pointer.x * this.pointerInfluence * -0.08;
    camera.position.y = this.options.reducedMotion
      ? 0
      : this.pointer.y * this.pointerInfluence * -0.05;
    camera.lookAt(0, 0, 0);
    if (this.vignettePass) {
      this.vignettePass.uniforms.uTime.value = this.options.reducedMotion
        ? 0
        : this.elapsedSeconds;
    }
    composer.render(delta);
  }

  private updateViewportUniforms() {
    const camera = this.camera;
    if (!camera || !this.mainMaterial || !this.foregroundMaterial) return;
    for (const material of [this.mainMaterial, this.foregroundMaterial]) {
      material.uniforms.uViewHalfHeight.value = this.viewHalfHeight;
      material.uniforms.uAspect.value = camera.aspect;
      material.uniforms.uViewportHeight.value = this.cssHeight;
    }
  }

  private resolveStageState() {
    return resolveDalaStageState(
      this.stageProgress,
      this.targets?.stageCount ?? 4,
    );
  }

  private reportProgress(progress: number) {
    this.options.onProgress?.(Math.min(Math.max(progress, 0), 1));
  }

  private readonly handleVisibilityChange = () => {
    this.hidden = document.visibilityState === "hidden";
    if (this.hidden) this.cancelFrame();
    else this.scheduleFrame();
  };

  private readonly handleContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.cancelFrame();
  };

  private readonly handleContextRestored = () => {
    if (this.destroyed || !this.targets) return;
    try {
      this.contextLost = false;
      this.deleteResources(false);
      this.initializeRendererAndResources();
      this.resize();
      if (this.options.reducedMotion) this.renderStaticFrame();
      else this.scheduleFrame();
    } catch (value: unknown) {
      this.deleteResources(true);
      this.options.onError?.(errorFrom(value));
    }
  };

  private attachListeners() {
    if (this.listenersAttached) return;
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
    this.hidden = document.visibilityState === "hidden";
    this.listenersAttached = true;
  }

  private detachListeners() {
    if (!this.listenersAttached) return;
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.listenersAttached = false;
  }

  private cancelFrame() {
    if (this.rafId === null) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private deleteResources(disposeRenderer: boolean) {
    this.scene?.clear();
    this.simulationScene?.clear();
    this.mainGeometry?.dispose();
    this.foregroundGeometry?.dispose();
    this.mainMaterial?.dispose();
    this.foregroundMaterial?.dispose();
    this.simulationQuad?.geometry.dispose();
    this.initializationMaterial?.dispose();
    this.simulationMaterial?.dispose();
    for (const texture of this.targetTextures) texture.dispose();
    for (const texture of this.styleTextures) texture.dispose();
    for (const texture of this.metadataTextures) texture.dispose();
    this.originTexture?.dispose();
    for (const state of this.simulationStates) state.dispose();
    this.renderPass?.dispose();
    this.bokehPass?.dispose();
    this.vignettePass?.dispose();
    this.outputPass?.dispose();
    this.composer?.dispose();
    if (disposeRenderer) {
      this.renderer?.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.composer = null;
    this.renderPass = null;
    this.bokehPass = null;
    this.vignettePass = null;
    this.outputPass = null;
    this.mainGeometry = null;
    this.foregroundGeometry = null;
    this.mainMaterial = null;
    this.foregroundMaterial = null;
    this.targetTextures = [];
    this.styleTextures = [];
    this.metadataTextures = [];
    this.originTexture = null;
    this.simulationStates = [];
    this.simulationScene = null;
    this.simulationCamera = null;
    this.simulationQuad = null;
    this.initializationMaterial = null;
    this.simulationMaterial = null;
    this.readStateIndex = 0;
  }
}
