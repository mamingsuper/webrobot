export function ParticleCanvas() {
  return (
    <div className="dala-particle-layer fixed fill w-1/1 h-1/1 z-negative user-select-none pointer-events-none">
      <canvas id="canvas" />
    </div>
  );
}
