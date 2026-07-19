export const fullscreenVertexShader = `#version 300 es
precision highp float;
out vec2 vUv;

void main() {
  vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = position;
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}`;

export const simulationFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D uPosition;
uniform sampler2D uVelocity;
uniform sampler2D uTargetFrom;
uniform sampler2D uTargetTo;
uniform float uBlend;
uniform float uDelta;
uniform float uTime;
uniform float uAssembly;
uniform vec2 uPlacement;
uniform float uObjectScale;
uniform float uAspect;
uniform float uTransitionEnergy;
uniform float uTransitionDirection;

layout(location = 0) out vec4 outPosition;
layout(location = 1) out vec4 outVelocity;

const float TAU = 6.28318530718;

float hashSeed(float value) {
  return fract(sin(value * 91.733 + 17.17) * 43758.5453);
}

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  vec4 position = texelFetch(uPosition, texel, 0);
  vec4 velocity = texelFetch(uVelocity, texel, 0);
  vec4 targetFrom = texelFetch(uTargetFrom, texel, 0);
  vec4 targetTo = texelFetch(uTargetTo, texel, 0);
  float morphBlend = smoothstep(0.22, 0.86, uBlend);
  vec4 target = mix(targetFrom, targetTo, morphBlend);
  float seed = targetFrom.w;
  float transitionEnergy = uTransitionEnergy;
  float transition = sin(3.14159265359 * uBlend);
  float angle = seed * TAU + uTime * (0.42 + seed * 0.36);
  vec2 direction = vec2(cos(angle), sin(angle));
  vec2 radial = normalize(target.xy - vec2(0.5) + vec2(0.0001));
  vec2 tangent = vec2(-radial.y, radial.x);
  target.xy += direction * (0.13 * transition + 0.055 * transitionEnergy);
  target.xy += radial * 0.055 * transition;
  target.z += sin(angle * 1.7) * 0.055 * transition;
  float ambient = step(0.978, seed);
  vec2 ambientBaseClip = vec2(
    mix(-0.95, 0.95, hashSeed(seed + 1.73)),
    mix(-0.9, 0.9, hashSeed(seed + 7.19))
  );
  float ambientAngle = hashSeed(seed + 13.7) * TAU;
  vec2 ambientDirection = vec2(cos(ambientAngle), sin(ambientAngle));
  float ambientPhase = seed * 113.0 + uTime * (0.08 + hashSeed(seed) * 0.07);
  float ambientLength = mix(0.018, 0.048, hashSeed(seed + 3.1));
  vec2 ambientClip = ambientBaseClip
    + ambientDirection * sin(ambientPhase) * ambientLength;
  vec3 ambientTarget = vec3(
    0.5 + (ambientClip.x - uPlacement.x) * uAspect / max(uObjectScale, 0.001),
    0.5 + (ambientClip.y - uPlacement.y) / max(uObjectScale, 0.001),
    0.32 + fract(seed * 17.31) * 0.48
  );
  target.xyz = mix(target.xyz, ambientTarget, ambient * 0.72);

  float frameScale = clamp(uDelta * 60.0, 0.0, 2.0);
  float spring = mix(0.012, 0.035, smoothstep(0.0, 1.0, uAssembly));
  velocity.xyz += (target.xyz - position.xyz) * spring * frameScale;
  velocity.xy += tangent * transitionEnergy * uTransitionDirection
    * (0.0025 + seed * 0.0018) * frameScale;
  velocity.xy += direction * transitionEnergy * 0.0015 * frameScale;
  velocity.z += sin(angle * 1.31) * transitionEnergy * 0.002 * frameScale;

  velocity.xyz *= pow(0.91, frameScale);
  velocity.w = 0.0;
  position.xyz += velocity.xyz * frameScale;
  position.w = seed;

  outPosition = position;
  outVelocity = velocity;
}`;

export const particleVertexShader = `#version 300 es
precision highp float;

uniform sampler2D uPosition;
uniform sampler2D uTargetFrom;
uniform sampler2D uTargetTo;
uniform float uBlend;
uniform float uReducedMotion;
uniform vec2 uPlacement;
uniform float uObjectScale;
uniform float uAspect;
uniform vec2 uViewport;
uniform vec2 uParallax;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform vec2 uImpulse;
uniform float uImpulseStrength;
uniform float uImpulseAge;
uniform float uTime;

out vec3 vBarycentric;
out vec3 vColor;
out float vAlpha;
out float vDepth;
out float vInteraction;
out float vHover;

vec2 triangleVertex(int vertexId) {
  if (vertexId == 0) return vec2(0.0, 1.0);
  if (vertexId == 1) return vec2(-0.8660254, -0.5);
  return vec2(0.8660254, -0.5);
}

vec3 barycentric(int vertexId) {
  if (vertexId == 0) return vec3(1.0, 0.0, 0.0);
  if (vertexId == 1) return vec3(0.0, 1.0, 0.0);
  return vec3(0.0, 0.0, 1.0);
}

vec3 rotateX(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return vec3(point.x, cosine * point.y - sine * point.z, sine * point.y + cosine * point.z);
}

vec3 rotateY(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return vec3(cosine * point.x + sine * point.z, point.y, -sine * point.x + cosine * point.z);
}

vec3 rotateZ(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return vec3(cosine * point.x - sine * point.y, sine * point.x + cosine * point.y, point.z);
}

void main() {
  int side = textureSize(uPosition, 0).x;
  ivec2 texel = ivec2(gl_InstanceID % side, gl_InstanceID / side);
  vec4 simulated = texelFetch(uPosition, texel, 0);
  vec4 target = mix(
    texelFetch(uTargetFrom, texel, 0),
    texelFetch(uTargetTo, texel, 0),
    uBlend
  );
  vec4 particle = mix(simulated, target, uReducedMotion);
  float seed = particle.w;
  float depth = clamp(particle.z, 0.0, 1.0);
  float depthScale = mix(1.18, 0.68, depth);
  vec2 center = vec2(
    (particle.x - 0.5) * uObjectScale / uAspect + uPlacement.x,
    (particle.y - 0.5) * uObjectScale + uPlacement.y
  );
  center += uParallax * mix(1.35, 0.38, depth);
  vec2 hoverDelta = center - uPointer;
  vec2 hoverScreenDelta = vec2(hoverDelta.x * uAspect, hoverDelta.y);
  float hoverDistance = length(hoverScreenDelta);
  float hover = (1.0 - smoothstep(0.04, 0.34, hoverDistance))
    * uPointerActive * (1.0 - uReducedMotion);
  vec2 hoverWobble = vec2(
    sin(uTime * 3.2 + seed * 19.0),
    cos(uTime * 2.8 + seed * 23.0)
  );
  center += hoverWobble * hover * 0.0022;

  float rotationTime = mix(uTime, 0.0, uReducedMotion);
  float baseAngle = seed * 6.28318530718;
  vec3 facet = vec3(triangleVertex(gl_VertexID), 0.0);
  vec3 normal = vec3(0.0, 0.0, 1.0);
  float spin = rotationTime * (0.22 + seed * 0.72);
  facet = rotateX(facet, baseAngle * 1.7 + spin * (0.45 + seed));
  facet = rotateY(facet, baseAngle * 0.83 + spin * (0.72 + seed * 0.4));
  facet = rotateZ(facet, baseAngle * 2.3 + spin);
  normal = rotateX(normal, baseAngle * 1.7 + spin * (0.45 + seed));
  normal = rotateY(normal, baseAngle * 0.83 + spin * (0.72 + seed * 0.4));
  normal = rotateZ(normal, baseAngle * 2.3 + spin);

  float regularSize = 4.0 + seed * 4.0;
  float shardSize = 10.0 + seed * 8.0;
  float sizeVariation = fract(seed * 19.17 + 0.37);
  float pixelSize = mix(regularSize, shardSize, smoothstep(0.84, 0.98, sizeVariation))
    * depthScale;
  pixelSize *= 1.0 + hover * (0.25 + seed * 0.2);
  float ambientShard = step(0.978, seed);
  pixelSize *= mix(1.0, 0.78, ambientShard);
  vec2 glyph = facet.xy * pixelSize * 2.0 / uViewport;
  float facetDepth = facet.z * pixelSize / max(uViewport.y, 1.0);
  gl_Position = vec4(center + glyph, (depth - 0.5) * 0.32 + facetDepth, 1.0);
  vBarycentric = barycentric(gl_VertexID);

  vec3 ivory = vec3(0.82, 0.79, 0.71);
  vec3 amber = vec3(0.96, 0.56, 0.035);
  vec3 violet = vec3(0.46, 0.16, 0.82);
  vec3 teal = vec3(0.015, 0.56, 0.48);
  float palette = fract(seed * 7.713);
  vColor = palette < 0.08 ? ivory : palette < 0.4 ? amber : palette < 0.71 ? violet : teal;
  float facing = mix(0.34, 1.0, abs(normal.z));
  vAlpha = (0.23 + seed * 0.4) * facing * mix(1.0, 0.56, depth)
    * mix(1.0, 0.24, ambientShard);
  vDepth = depth;
  vec2 impulseDelta = vec2((center.x - uImpulse.x) * uAspect, center.y - uImpulse.y);
  float impulseDistance = length(impulseDelta);
  float impulseLife = 1.0 - smoothstep(0.0, 0.3, uImpulseAge);
  float impulseMask = (1.0 - smoothstep(0.04, 0.32, impulseDistance))
    * impulseLife * uImpulseStrength * (1.0 - ambientShard);
  vInteraction = min(impulseMask * 0.14, 0.28);
  vHover = hover;
}`;

export const particleFragmentShader = `#version 300 es
precision highp float;

in vec3 vBarycentric;
in vec3 vColor;
in float vAlpha;
in float vDepth;
in float vInteraction;
in float vHover;
out vec4 outColor;

void main() {
  float edge = min(min(vBarycentric.x, vBarycentric.y), vBarycentric.z);
  float width = max(fwidth(edge) * 0.94, 0.01);
  float outline = 1.0 - smoothstep(width, width * 1.72, edge);
  if (outline < 0.02) discard;
  float depthLight = mix(1.08, 0.62, vDepth);
  vec3 interactionIvory = vec3(1.0, 0.91, 0.72);
  vec3 color = mix(vColor * depthLight, interactionIvory, vInteraction);
  vec3 hoverIvory = vec3(0.94, 0.87, 0.7);
  color = mix(color, hoverIvory, vHover * 0.82);
  float alpha = min(vAlpha + vInteraction * 0.42 + vHover * 0.22, 0.92);
  outColor = vec4(color, outline * alpha);
}`;

export const bloomFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform vec2 uTexel;
uniform vec2 uDirection;
uniform float uBrightPass;
uniform float uThreshold;
uniform float uKnee;
in vec2 vUv;
out vec4 outColor;

vec3 brightPass(vec3 color) {
  float brightness = max(max(color.r, color.g), color.b);
  float soft = clamp((brightness - uThreshold + uKnee) / max(2.0 * uKnee, 0.0001), 0.0, 1.0);
  float contribution = max(brightness - uThreshold, 0.0) + soft * soft * uKnee;
  return color * contribution / max(brightness, 0.0001);
}

vec3 sampleSource(vec2 uv) {
  vec3 color = texture(uSource, uv).rgb;
  return mix(color, brightPass(color), uBrightPass);
}

void main() {
  vec3 color = sampleSource(vUv) * 0.227027;
  color += sampleSource(vUv + uDirection * uTexel * 1.384615) * 0.316216;
  color += sampleSource(vUv - uDirection * uTexel * 1.384615) * 0.316216;
  color += sampleSource(vUv + uDirection * uTexel * 3.230769) * 0.070270;
  color += sampleSource(vUv - uDirection * uTexel * 3.230769) * 0.070270;
  outColor = vec4(color, 1.0);
}`;

export const compositeFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uTime;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 scene = texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  float distanceFromCenter = distance(vUv, vec2(0.5));
  float vignette = 1.0 - smoothstep(0.34, 0.82, distanceFromCenter) * 0.46;
  float grain = (hash(vUv * 1300.0 + fract(uTime) * 17.0) - 0.5) * 0.018;
  vec3 depthTint = mix(vec3(0.0, 0.018, 0.04), vec3(0.025, 0.009, 0.0), vUv.y);
  vec3 color = (scene + bloom * 0.16 + depthTint) * vignette + grain;
  outColor = vec4(max(color, vec3(0.0)), 1.0);
}`;
