export type TextureOptions = {
  width: number;
  height: number;
  internalFormat: number;
  format: number;
  type: number;
  data?: ArrayBufferView | null;
  filter?: number;
};

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  let fragment: WebGLShader;
  try {
    fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  } catch (error: unknown) {
    gl.deleteShader(vertex);
    throw error;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error("Unable to allocate a WebGL program.");
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "Unknown linker error.";
    gl.deleteProgram(program);
    throw new Error(`Unable to link the particle shader: ${log}`);
  }
  return program;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate a WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Unknown compiler error.";
    gl.deleteShader(shader);
    throw new Error(`Unable to compile the particle shader: ${log}`);
  }
  return shader;
}

export function createTexture(
  gl: WebGL2RenderingContext,
  options: TextureOptions,
) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to allocate a WebGL texture.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const filter = options.filter ?? gl.NEAREST;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    options.internalFormat,
    options.width,
    options.height,
    0,
    options.format,
    options.type,
    options.data ?? null,
  );
  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

export function requireUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    throw new Error(`Particle shader is missing required uniform ${name}.`);
  }
  return location;
}

export function requireCompleteFramebuffer(
  gl: WebGL2RenderingContext,
  label: string,
) {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(
      `${label} framebuffer is incomplete (WebGL status 0x${status.toString(16)}).`,
    );
  }
}
