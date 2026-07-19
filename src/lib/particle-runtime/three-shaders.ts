export const simulationVertexShader = `
  out vec2 vUv;

  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const initializationFragmentShader = `
  precision highp float;

  uniform sampler2D uInitialPosition;
  in vec2 vUv;
  layout(location = 0) out vec4 outPosition;
  layout(location = 1) out vec4 outVelocity;

  void main() {
    outPosition = texture(uInitialPosition, vUv);
    outVelocity = vec4(0.0);
  }
`;

export const simulationFragmentShader = `
  precision highp float;

  uniform sampler2D uPosition;
  uniform sampler2D uVelocity;
  uniform sampler2D uOrigin;
  uniform sampler2D uTargetFrom;
  uniform sampler2D uTargetTo;
  uniform sampler2D uMetadataFrom;
  uniform sampler2D uMetadataTo;
  uniform float uBlend;
  uniform float uSameStage;
  uniform float uExplode;
  uniform float uExplodeScale;
  uniform float uAssembly;
  uniform float uFrameScale;
  uniform vec2 uImpulseOrigin;
  uniform float uImpulseStrength;
  uniform float uImpulseAge;

  in vec2 vUv;
  layout(location = 0) out vec4 outPosition;
  layout(location = 1) out vec4 outVelocity;

  const float SPRING = 0.006;
  const float FRICTION = 0.892;

  float quintic(float value) {
    value = clamp(value, 0.0, 1.0);
    return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
  }

  float qinticInOut(float value) {
    value = clamp(value, 0.0, 1.0);
    return value < 0.5
      ? 16.0 * value * value * value * value * value
      : 1.0 + 16.0 * (value - 1.0) * (value - 1.0) * (value - 1.0)
        * (value - 1.0) * (value - 1.0);
  }

  float hash(float value) {
    return fract(sin(value * 91.733 + 17.17) * 43758.5453);
  }

  void main() {
    vec4 positionState = texture(uPosition, vUv);
    vec4 velocityState = texture(uVelocity, vUv);
    vec4 origin = texture(uOrigin, vUv);
    vec4 targetFrom = texture(uTargetFrom, vUv);
    vec4 targetTo = texture(uTargetTo, vUv);
    vec4 metadataFrom = texture(uMetadataFrom, vUv);
    vec4 metadataTo = texture(uMetadataTo, vUv);

    const float STAGGER_SPREAD = 5.0;
    float wave = clamp(
      uBlend * (1.0 + STAGGER_SPREAD) - metadataTo.x * STAGGER_SPREAD,
      0.0,
      1.0
    );
    float morph = qinticInOut(wave) * (1.0 - uSameStage);
    vec4 target = mix(targetFrom, targetTo, morph);
    float eWave = clamp(uExplode * 2.5 - targetTo.y * 1.5, 0.0, 1.0);
    float boom = 1.0
      + eWave * uExplodeScale * 4.0 * hash(targetFrom.w * 57.29);
    target.xyz = vec3(0.5) + (target.xyz - vec3(0.5)) * boom;

    float assembly = quintic((uAssembly - metadataFrom.x * 0.72) / 0.28);
    target.xyz = mix(origin.xyz, target.xyz, assembly);

    float frameScale = clamp(uFrameScale, 0.0, 3.0);
    vec2 rel = positionState.xy - uImpulseOrigin;
    float ringR = uImpulseAge * 0.9;
    float ring = exp(-pow((length(rel) - ringR) / 0.08, 2.0));
    velocityState.xy += normalize(rel + vec2(1e-4))
      * ring * uImpulseStrength * 0.0022 * frameScale;
    float spring = SPRING + (targetFrom.w - 0.5) * 2.0 * 1e-4;
    velocityState.xyz += (target.xyz - positionState.xyz) * spring * frameScale;
    velocityState.xyz *= pow(FRICTION, frameScale);
    positionState.xyz += velocityState.xyz * frameScale;
    positionState.w = mix(targetFrom.w, targetTo.w, morph);
    velocityState.w = 0.0;

    outPosition = positionState;
    outVelocity = velocityState;
  }
`;

export const particleVertexShader = `
  precision highp float;

  uniform sampler2D uPosition;
  uniform sampler2D uTargetFrom;
  uniform sampler2D uTargetTo;
  uniform sampler2D uStyleFrom;
  uniform sampler2D uStyleTo;
  uniform sampler2D uMetadataFrom;
  uniform sampler2D uMetadataTo;
  uniform float uBlend;
  uniform float uSameStage;
  uniform float uReducedMotion;
  uniform float uTime;
  uniform float uObjectScale;
  uniform float uViewHalfHeight;
  uniform float uAspect;
  uniform float uViewportHeight;
  uniform vec2 uPlacement;
  uniform vec2 uCloudOffset;
  uniform float uCloudSpin;
  uniform vec2 uPointerWorld;
  uniform vec2 uPointerDelta;
  uniform float uPointerActive;
  uniform float uOcclusionStrength;
  uniform vec2 uImpulseOrigin;
  uniform float uImpulseStrength;
  uniform float uImpulseAge;

  out vec3 vWorldPosition;
  out vec3 vColor;
  out float vAlpha;
  out float vHover;
  out float vSweep;
  out float vImpulse;

  const float HOVER_RADIUS = 0.78;
  const float HOVER_SCALE = 0.04;
  const float HOVER_WORLD_SCALE = 0.95;

  float hash(float value) {
    return fract(sin(value * 91.733 + 17.17) * 43758.5453);
  }

  float quintic(float value) {
    value = clamp(value, 0.0, 1.0);
    return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
  }

  float qinticInOut(float value) {
    value = clamp(value, 0.0, 1.0);
    return value < 0.5
      ? 16.0 * value * value * value * value * value
      : 1.0 + 16.0 * (value - 1.0) * (value - 1.0) * (value - 1.0)
        * (value - 1.0) * (value - 1.0);
  }

  mat3 rotateX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
  }

  mat3 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  }

  mat3 rotateZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
  }

  void main() {
    ivec2 size = textureSize(uPosition, 0);
    ivec2 texel = ivec2(gl_InstanceID % size.x, gl_InstanceID / size.x);
    vec4 metadataFrom = texelFetch(uMetadataFrom, texel, 0);
    vec4 metadataTo = texelFetch(uMetadataTo, texel, 0);
    const float STAGGER_SPREAD = 5.0;
    float wave = clamp(
      uBlend * (1.0 + STAGGER_SPREAD) - metadataTo.x * STAGGER_SPREAD,
      0.0,
      1.0
    );
    float morph = qinticInOut(wave) * (1.0 - uSameStage);

    vec4 simulated = texelFetch(uPosition, texel, 0);
    vec4 target = mix(
      texelFetch(uTargetFrom, texel, 0),
      texelFetch(uTargetTo, texel, 0),
      morph
    );
    vec4 particle = mix(simulated, target, uReducedMotion);
    vec4 style = mix(
      texelFetch(uStyleFrom, texel, 0),
      texelFetch(uStyleTo, texel, 0),
      morph
    );
    vec4 metadata = mix(metadataFrom, metadataTo, morph);

    vec3 local = particle.xyz - vec3(0.5);
    local = rotateY(uCloudSpin) * local;
    vec3 center = vec3(
      local.x * uObjectScale + uPlacement.x * uViewHalfHeight * uAspect,
      local.y * uObjectScale + uPlacement.y * uViewHalfHeight,
      local.z * 3.6
    );
    center.xy += uCloudOffset;
    float hoverDistance = length(center.xy - uPointerWorld);
    float hoverRadius = HOVER_RADIUS * HOVER_WORLD_SCALE;
    float hover = (1.0 - smoothstep(0.0, hoverRadius, hoverDistance))
      * uPointerActive * (1.0 - uReducedMotion);
    float spotlight = pow(max(hover, 0.0), 0.55)
      * (0.94 + sin(uTime * 1.35) * 0.06);
    float seed = fract(particle.w + metadata.y * 0.731 + float(gl_InstanceID) * 0.000137);
    vec2 hoverDelta = center.xy - uPointerWorld;
    vec2 sweepDirection = normalize(vec2(1.0, 0.48));
    float sweepPosition = (fract(uTime * 0.2) * 2.0 - 1.0) * hoverRadius * 1.15;
    float sweepDistance = dot(hoverDelta, sweepDirection) - sweepPosition;
    float sweepBand = exp(-pow(sweepDistance / (hoverRadius * 0.22), 2.0));
    float sweep = sweepBand * spotlight
      * (0.9 + min(length(uPointerDelta), 1.0) * 0.22);
    vec2 hoverTangent = normalize(vec2(-hoverDelta.y, hoverDelta.x) + vec2(0.01));
    float tangentWave = sin(
      dot(hoverDelta, vec2(7.0, 4.4)) - uTime * 2.8 + seed * 6.2831853
    );
    float counterWave = cos(
      dot(hoverDelta, vec2(3.8, -6.2)) + uTime * 2.1 + seed * 4.7
    );
    float flowAmount = tangentWave * 0.036 + counterWave * 0.018;
    center.xy += hoverTangent * flowAmount * spotlight * (0.82 + metadata.z * 0.35);
    center.xy += sweepDirection * counterWave * sweep * 0.012;
    center.z += sweep * 0.045;
    float rotationTime = mix(uTime, 0.0, uReducedMotion);
    mat3 rotation = rotateZ(metadata.y * 6.2831853 + rotationTime * metadata.w * 0.31)
      * rotateY(seed * 5.71 + rotationTime * (0.18 + metadata.w * 0.21))
      * rotateX(metadata.y * 8.13 + rotationTime * 0.13);
    float sizeAccent = smoothstep(0.93, 0.995, hash(seed + 11.7));
    float diameterPixels = mix(8.0, 13.5, pow(hash(seed + 2.3), 1.65));
    diameterPixels *= mix(1.0, 1.38, sizeAccent);
    float glyphRadius = diameterPixels * 1.44 * (2.0 * uViewHalfHeight / uViewportHeight);
    glyphRadius *= max(style.x, 0.05) * (1.0 + hover * HOVER_SCALE);
    vec3 worldPosition = center + rotation * position * glyphRadius;

    vWorldPosition = worldPosition;
    vColor = style.yzw;
    float structuralEmphasis = smoothstep(0.985, 1.0, metadata.z);
    vAlpha = min(
      mix(0.72, 0.38, clamp(particle.z, 0.0, 1.0)) + structuralEmphasis * 0.18,
      0.82
    );
    vAlpha *= mix(
      1.0,
      smoothstep(-2.6, 2.2, worldPosition.z),
      0.55
    );
    float behind = (1.0 - smoothstep(0.40, 0.48, particle.z))
      * (1.0 - smoothstep(0.198, 0.253, length(particle.xy - vec2(0.5))));
    vAlpha *= 1.0 - uOcclusionStrength * behind * 0.82;
    vHover = spotlight;
    vSweep = sweep;
    float impulseRadius = uImpulseAge * 0.9;
    float impulseRing = exp(-pow(
      (length(particle.xy - uImpulseOrigin) - impulseRadius) / 0.12,
      2.0
    ));
    vImpulse = impulseRing * uImpulseStrength * (1.0 - uReducedMotion);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
  }
`;

export const particleFragmentShader = `
  precision highp float;

  in vec3 vWorldPosition;
  in vec3 vColor;
  in float vAlpha;
  in float vHover;
  in float vSweep;
  in float vImpulse;
  uniform float uColorBoost;
  out vec4 outColor;

  void main() {
    vec3 boostedColor = vColor * uColorBoost;
    vec3 dx = dFdx(vWorldPosition);
    vec3 dy = dFdy(vWorldPosition);
    vec3 faceNormal = normalize(cross(dx, dy));
    vec3 lightDirection = normalize(vec3(-0.35, 0.5, 1.0));
    float light = 0.72 + abs(dot(faceNormal, lightDirection)) * 0.42;
    vec3 warmLight = vec3(1.0, 0.82, 0.5);
    float theatreLight = clamp(vHover * 0.48 + vSweep * 0.5, 0.0, 0.88);
    vec3 color = mix(boostedColor * light, warmLight, theatreLight);
    color *= 1.0 + vHover * 0.52 + vSweep * 0.72;
    color += vec3(min(vImpulse * 0.28, 0.28));
    outColor = vec4(
      color,
      min(vAlpha + vHover * 0.07 + vSweep * 0.08, 0.94)
    );
  }
`;

export const foregroundVertexShader = `
  precision highp float;

  in vec3 instancePosition;
  in float instanceScale;
  in vec3 instanceColor;
  in float instancePhase;

  uniform float uTime;
  uniform float uReducedMotion;
  uniform float uViewHalfHeight;
  uniform float uAspect;
  uniform float uViewportHeight;
  uniform vec2 uParallax;

  out vec3 vWorldPosition;
  out vec3 vColor;
  out float vAlpha;

  mat3 rotateX(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
  }

  mat3 rotateY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  }

  mat3 rotateZ(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
  }

  void main() {
    float animationTime = mix(uTime, 0.0, uReducedMotion);
    vec3 center = vec3(
      instancePosition.x * uViewHalfHeight * uAspect,
      instancePosition.y * uViewHalfHeight,
      instancePosition.z
    );
    center.xy += uParallax * mix(1.35, 0.45, clamp((instancePosition.z + 2.0) / 4.0, 0.0, 1.0));
    center.y += sin(animationTime * 0.12 + instancePhase * 17.0) * 0.018;
    mat3 rotation = rotateZ(instancePhase * 6.2831853 + animationTime * 0.08)
      * rotateY(instancePhase * 9.17 + animationTime * 0.11)
      * rotateX(instancePhase * 4.31 + animationTime * 0.06);
    float glyphRadius = instanceScale * (2.0 * uViewHalfHeight / uViewportHeight);
    vec3 worldPosition = center + rotation * position * glyphRadius;
    vWorldPosition = worldPosition;
    vColor = instanceColor;
    vAlpha = mix(0.28, 0.62, instancePhase);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
  }
`;

export const foregroundFragmentShader = `
  precision highp float;

  in vec3 vWorldPosition;
  in vec3 vColor;
  in float vAlpha;
  out vec4 outColor;

  void main() {
    vec3 normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    float light = 0.4 + abs(dot(normal, normalize(vec3(0.25, 0.6, 1.0)))) * 0.6;
    outColor = vec4(vColor * light, vAlpha);
  }
`;

export const vignetteGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uOffset: { value: 0.3 },
    uDarkness: { value: 4 },
    uBackdropOffset: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uOffset;
    uniform float uDarkness;
    uniform vec2 uBackdropOffset;
    varying vec2 vUv;

    float hash(vec2 value) {
      return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      vec2 centered = (vUv - 0.5) * vec2(uOffset);
      vec3 vignette = mix(source.rgb, vec3(1.0 - uDarkness), dot(centered, centered));
      vec2 plateUv = vUv - 0.5 + uBackdropOffset * vec2(1.25, 1.0);
      plateUv += vec2(
        plateUv.y * uBackdropOffset.x * 0.75,
        -plateUv.x * uBackdropOffset.y * 0.58
      );
      float weaveA = 0.5 + 0.5 * sin(
        (plateUv.x * 238.0 + plateUv.y * 151.0) * 6.2831853
      );
      float weaveB = 0.5 + 0.5 * sin(
        (plateUv.x * 173.0 - plateUv.y * 271.0) * 6.2831853
      );
      float wovenPlate = pow(weaveA * weaveB, 3.4);
      float matteBands = smoothstep(0.30, 0.70, 0.5 + 0.5 * sin(
        (plateUv.x * 1.8 + plateUv.y * 0.72) * 6.2831853
      ));
      float sourceLight = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
      float darkBackground = 1.0 - smoothstep(0.025, 0.24, sourceLight);
      vec3 plateColor = vec3(0.042, 0.038, 0.056)
        * (0.34 + wovenPlate * 0.92 + matteBands * 0.34);
      vignette += plateColor * darkBackground;
      float grain = (hash(vUv * 1400.0 + fract(uTime) * 31.0) - 0.5) * 0.012;
      gl_FragColor = vec4(max(vignette + grain, vec3(0.0)), source.a);
    }
  `,
};
