import { useEffect, useRef } from 'react';

/* ==================== 配置参数 ==================== */
const CONFIG = {
  SIM_RESOLUTION: 96,
  DYE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 3.0,
  VELOCITY_DISSIPATION: 1.5,
  PRESSURE: 0.1,
  PRESSURE_ITERATIONS: 20,
  CURL: 3,
  SPLAT_RADIUS: 0.15,
  SPLAT_FORCE: 4000,
  SHADING: true,
  COLOR_UPDATE_SPEED: 8,
  TRANSPARENT: true,
};

/* 暖色系调色板 */
const PALETTE = [
  { r: 0.71, g: 0.35, b: 0.24 }, // 陶土棕
  { r: 0.85, g: 0.55, b: 0.35 }, // 暖橙
  { r: 0.90, g: 0.65, b: 0.45 }, // 浅杏
  { r: 0.60, g: 0.30, b: 0.18 }, // 深陶土
];

function generateColor() {
  const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const v = 0.18 + Math.random() * 0.10;
  return {
    r: Math.min(1, Math.max(0, c.r * v)),
    g: Math.min(1, Math.max(0, c.g * v)),
    b: Math.min(1, Math.max(0, c.b * v)),
  };
}

/* ==================== GLSL 着色器源码 ==================== */
const BASE_VERTEX = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const COPY_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
void main () { gl_FragColor = texture2D(uTexture, vUv); }`;

const MULTIPLY_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`;

const DISPLAY_SHADER_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uTexture;
uniform vec2 texelSize;
void main () {
  vec3 c = texture2D(uTexture, vUv).rgb;
  #ifdef SHADING
    vec3 lc = texture2D(uTexture, vL).rgb;
    vec3 rc = texture2D(uTexture, vR).rgb;
    vec3 tc = texture2D(uTexture, vT).rgb;
    vec3 bc = texture2D(uTexture, vB).rgb;
    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);
    vec3 n = normalize(vec3(dx, dy, length(texelSize)));
    vec3 l = vec3(0.0, 0.0, 1.0);
    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
  #endif
  float a = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c, a);
}`;

const SPLAT_SHADER = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}`;

const ADVECTION_SHADER_SRC = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;
vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}
void main () {
  #ifdef MANUAL_FILTERING
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    vec4 result = bilerp(uSource, coord, dyeTexelSize);
  #else
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
  #endif
  float decay = 1.0 + dissipation * dt;
  gl_FragColor = result / decay;
}`;

const DIVERGENCE_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const CURL_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`;

const VORTICITY_SHADER = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main () {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

const PRESSURE_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SUB_SHADER = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main () {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}`;

const TEXT_CHARS = ['W', 'O', 'Y', 'O', 'U', 'W', 'U'];
const CELL_SIZE = 20;

export default function FluidCursor({ showText = true }) {
  const canvasRef = useRef(null);
  const textCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const textCanvas = textCanvasRef.current;
    if (!canvas || !textCanvas) return;

    let animationFrameId;
    let isActive = true;

    /* ==================== WebGL 初始化 ==================== */
    function getWebGLContext(c) {
      const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let gl = c.getContext('webgl2', params);
      const isWebGL2 = !!gl;
      if (!isWebGL2) gl = c.getContext('webgl', params) || c.getContext('experimental-webgl', params);
      if (!gl) return null;

      let halfFloat, supportLinearFiltering;
      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
      } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
      }
      gl.clearColor(0.969, 0.961, 0.949, 1.0);

      const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat && halfFloat.HALF_FLOAT_OES);
      return {
        gl, ext: {
          formatRGBA: getFormat(gl, isWebGL2, halfFloatTexType),
          formatRG: getFormatRG(gl, isWebGL2, halfFloatTexType),
          formatR: getFormatR(gl, isWebGL2, halfFloatTexType),
          halfFloatTexType,
          supportLinearFiltering
        }
      };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
      if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        return { internalFormat: gl.RGBA, format: gl.RGBA };
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    }

    function getFormat(gl, isWebGL2, halfFloatTexType) {
      if (isWebGL2) return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
      return getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }
    function getFormatRG(gl, isWebGL2, halfFloatTexType) {
      if (isWebGL2) return getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      return getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }
    function getFormatR(gl, isWebGL2, halfFloatTexType) {
      if (isWebGL2) return getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
      return getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    const ctx = getWebGLContext(canvas);
    if (!ctx) return;
    const { gl, ext } = ctx;

    function compileShader(type, source, keywords) {
      source = addKeywords(source, keywords);
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.warn(gl.getShaderInfoLog(shader));
      return shader;
    }

    function addKeywords(source, keywords) {
      if (!keywords) return source;
      let str = '';
      keywords.forEach(k => { str += '#define ' + k + '\n'; });
      return str + source;
    }

    function createProgram(vs, fs) {
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.warn(gl.getProgramInfoLog(program));
      return program;
    }

    function getUniforms(program) {
      const uniforms = {};
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const name = gl.getActiveUniform(program, i).name;
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      return uniforms;
    }

    /* ==================== Material 和 Program 类 ==================== */
    class Material {
      constructor(vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = {};
        this.activeProgram = null;
        this.uniforms = [];
      }
      setKeywords(keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);
        let program = this.programs[hash];
        if (program == null) {
          const fs = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
          program = createProgram(this.vertexShader, fs);
          this.programs[hash] = program;
        }
        if (program === this.activeProgram) return;
        this.uniforms = getUniforms(program);
        this.activeProgram = program;
      }
      bind() { gl.useProgram(this.activeProgram); }
    }

    class Program {
      constructor(vs, fs) {
        this.program = createProgram(vs, fs);
        this.uniforms = getUniforms(this.program);
      }
      bind() { gl.useProgram(this.program); }
    }

    function hashCode(s) {
      if (s.length === 0) return 0;
      let hash = 0;
      for (let i = 0; i < s.length; i++) { hash = (hash << 5) - hash + s.charCodeAt(i); hash |= 0; }
      return hash;
    }

    /* ==================== 编译着色器 ==================== */
    const baseVertexShader = compileShader(gl.VERTEX_SHADER, BASE_VERTEX);
    const copyShader = compileShader(gl.FRAGMENT_SHADER, COPY_SHADER);
    const multiplyShader = compileShader(gl.FRAGMENT_SHADER, MULTIPLY_SHADER);
    const splatShader = compileShader(gl.FRAGMENT_SHADER, SPLAT_SHADER);
    const advectionShader = compileShader(gl.FRAGMENT_SHADER, ADVECTION_SHADER_SRC, ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']);
    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, DIVERGENCE_SHADER);
    const curlShaderFS = compileShader(gl.FRAGMENT_SHADER, CURL_SHADER);
    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, VORTICITY_SHADER);
    const pressureShader = compileShader(gl.FRAGMENT_SHADER, PRESSURE_SHADER);
    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, GRADIENT_SUB_SHADER);

    const copyProgram = new Program(baseVertexShader, copyShader);
    const multiplyProgram = new Program(baseVertexShader, multiplyShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShaderFS);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgramObj = new Program(baseVertexShader, pressureShader);
    const gradientSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const displayMaterial = new Material(baseVertexShader, DISPLAY_SHADER_SRC);

    /* ==================== 全屏四边形 ==================== */
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(target, clear) {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) { gl.clear(gl.COLOR_BUFFER_BIT); }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    /* ==================== FBO ==================== */
    let dye, velocity, divergence, curl, pressure;

    function createFBO(w, h, internalFormat, format, type, param) {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const texelSizeX = 1 / w, texelSizeY = 1 / h;
      return {
        texture, fbo, width: w, height: h, texelSizeX, texelSizeY,
        attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; }
      };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; }, set read(v) { fbo1 = v; },
        get write() { return fbo2; }, set write(v) { fbo2 = v; },
        swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; }
      };
    }

    function resizeFBO(target, w, h, internalFormat, format, type, param) {
      const newFBO = createFBO(w, h, internalFormat, format, type, param);
      copyProgram.bind();
      gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
      blit(newFBO);
      return newFBO;
    }

    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
      if (target.width === w && target.height === h) return target;
      target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
      target.write = createFBO(w, h, internalFormat, format, type, param);
      target.width = w; target.height = h;
      target.texelSizeX = 1 / w; target.texelSizeY = 1 / h;
      return target;
    }

    function getResolution(resolution) {
      let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
      return { width: min, height: max };
    }

    function initFramebuffers() {
      const simRes = getResolution(CONFIG.SIM_RESOLUTION);
      const dyeRes = getResolution(CONFIG.DYE_RESOLUTION);
      const texType = ext.halfFloatTexType;
      const rgba = ext.formatRGBA;
      const rg = ext.formatRG;
      const r = ext.formatR;
      const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

      gl.disable(gl.BLEND);

      if (!dye)
        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
      else
        dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

      if (!velocity)
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
      else
        velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

      divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    }

    /* ==================== Canvas 尺寸 ==================== */
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(canvas.offsetWidth * dpr);
      const h = Math.floor(canvas.offsetHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        textCanvas.width = w; textCanvas.height = h;
        return true;
      }
      return false;
    }

    /* ==================== 文本层 ==================== */
    const textCtx = textCanvas.getContext('2d');
    let textCells = [];
    let textCols = 0, textRows = 0;

    function initTextGrid() {
      textCols = Math.floor(textCanvas.width / CELL_SIZE);
      textRows = Math.floor(textCanvas.height / CELL_SIZE);
      textCells = [];
      for (let i = 0; i < textRows * textCols; i++) {
        textCells.push({ char: '', alpha: 0 });
      }
    }

    function activateTextCells(x, y, intensity = 1) {
      if (!showText) return;
      const col = Math.floor(x / CELL_SIZE);
      const row = Math.floor(y / CELL_SIZE);
      const radius = Math.max(1, Math.floor(2 + intensity * 1.6));
      for (let r = row - radius; r <= row + radius; r++) {
        for (let c = col - radius; c <= col + radius; c++) {
          if (r < 0 || r >= textRows || c < 0 || c >= textCols) continue;
          const dist = Math.sqrt((c - col) ** 2 + (r - row) ** 2);
          if (dist > radius) continue;
          const cell = textCells[r * textCols + c];
          if (cell && Math.random() < 0.86 - dist / (radius + 0.01) * 0.5) {
            cell.char = TEXT_CHARS[Math.floor(Math.random() * TEXT_CHARS.length)];
            cell.alpha = Math.min(0.65, Math.max(cell.alpha, 0.12 + (1 - dist / (radius + 0.001)) * 0.35));
          }
        }
      }
    }

    function renderText(dt) {
      if (!showText) { textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height); return; }
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';
      const fontSize = Math.floor(CELL_SIZE * 0.88);
      textCtx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
      for (let r = 0; r < textRows; r++) {
        for (let c = 0; c < textCols; c++) {
          const cell = textCells[r * textCols + c];
          if (!cell) continue;
          cell.alpha = Math.max(0, cell.alpha - dt * 0.55);
          if (cell.alpha <= 0.01) continue;
          textCtx.fillStyle = `rgba(180, 120, 90, ${cell.alpha})`;
          textCtx.fillText(cell.char, c * CELL_SIZE + CELL_SIZE * 0.5, r * CELL_SIZE + CELL_SIZE * 0.54);
        }
      }
    }

    /* ==================== 鼠标输入 ==================== */
    const pointers = [{
      id: -1, texcoordX: 0, texcoordY: 0, prevTexcoordX: 0, prevTexcoordY: 0,
      deltaX: 0, deltaY: 0, down: false, moved: false, color: generateColor()
    }];

    function updatePointerDownData(pointer, id, x, y) {
      pointer.id = id; pointer.down = true; pointer.moved = false;
      pointer.texcoordX = x / canvas.width;
      pointer.texcoordY = 1 - y / canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0; pointer.deltaY = 0;
      pointer.color = generateColor();
    }

    function updatePointerMoveData(pointer, x, y) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = x / canvas.width;
      pointer.texcoordY = 1 - y / canvas.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    function correctDeltaX(delta) {
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio < 1) delta *= aspectRatio;
      return delta;
    }
    function correctDeltaY(delta) {
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) delta /= aspectRatio;
      return delta;
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      // Only process when mouse is within the hero section
      if (rawX < 0 || rawY < 0 || rawX > rect.width || rawY > rect.height) return;
      const x = rawX * (window.devicePixelRatio || 1);
      const y = rawY * (window.devicePixelRatio || 1);
      const pointer = pointers[0];
      if (pointer.texcoordX === 0 && pointer.texcoordY === 0) {
        updatePointerDownData(pointer, -1, x, y);
        pointer.down = false;
        return;
      }
      updatePointerMoveData(pointer, x, y);
      if (pointer.moved) {
        const force = Math.min(2.5, Math.hypot(pointer.deltaX, pointer.deltaY) * 1800);
        activateTextCells(x, y, 1 + force);
      }
    }

    /* ==================== 喷射 & 模拟 ==================== */
    function splat(x, y, dx, dy, color) {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0);
      gl.uniform1f(splatProgram.uniforms.radius, correctRadius(CONFIG.SPLAT_RADIUS / 100));
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    function correctRadius(radius) {
      const aspectRatio = canvas.width / canvas.height;
      if (aspectRatio > 1) radius *= aspectRatio;
      return radius;
    }

    function splatPointer(p) {
      const dx = p.deltaX * CONFIG.SPLAT_FORCE;
      const dy = p.deltaY * CONFIG.SPLAT_FORCE;
      splat(p.texcoordX, p.texcoordY, dx, dy, p.color);
    }

    function step(dt) {
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 1);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, CONFIG.CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      multiplyProgram.bind();
      gl.uniform1f(multiplyProgram.uniforms.value, CONFIG.PRESSURE);
      gl.uniform1i(multiplyProgram.uniforms.uTexture, pressure.read.attach(0));
      blit(pressure.write);
      pressure.swap();

      pressureProgramObj.bind();
      gl.uniform2f(pressureProgramObj.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgramObj.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgramObj.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradientSubtractProgram.bind();
      gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      const velId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation, CONFIG.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.clearColor(0.969, 0.961, 0.949, 1.0);
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      if (CONFIG.SHADING) displayMaterial.setKeywords(['SHADING']); else displayMaterial.setKeywords([]);
      displayMaterial.bind();
      gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / width, 1 / height);
      gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
      blit(null, true);
    }

    let colorUpdateTimer = 0;
    function updateColors(dt) {
      colorUpdateTimer += dt * CONFIG.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer %= 1;
        pointers.forEach(p => { p.color = generateColor(); });
      }
    }

    /* ==================== 主循环 ==================== */
    let lastTime = Date.now();

    function loop() {
      if (!isActive) return;
      animationFrameId = requestAnimationFrame(loop);
      const now = Date.now();
      let dt = (now - lastTime) / 1000;
      dt = Math.min(dt, 0.016666);
      lastTime = now;

      if (resizeCanvas()) initFramebuffers();
      updateColors(dt);
      pointers.forEach(p => { if (p.moved) { splatPointer(p); p.moved = false; } });
      step(dt);
      render();
      renderText(dt);
    }

    /* ==================== 初始化 ==================== */
    resizeCanvas();
    initTextGrid();
    initFramebuffers();

    document.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      resizeCanvas();
      initTextGrid();
      initFramebuffers();
    };
    window.addEventListener('resize', handleResize);

    const handleVisibility = () => {
      isActive = !document.hidden;
      if (isActive) { lastTime = Date.now(); requestAnimationFrame(loop); }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    setTimeout(() => {
      lastTime = Date.now();
      animationFrameId = requestAnimationFrame(loop);
    }, 150);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [showText]);

  return (
    <div className="splash-cursor" style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <canvas
        ref={textCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 1,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          opacity: 1,
        }}
      />
    </div>
  );
}
