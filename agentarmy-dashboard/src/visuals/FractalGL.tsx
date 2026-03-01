import { useEffect, useRef } from "react";
import { lowFreqOsc } from "../utils/oscillator";

type Props = { zpe?: number; theme?: "quantum" | "forest" | "architecture" };

function compileShader(gl: WebGLRenderingContext, src: string, type: number) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const msg = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("Shader compile error: " + msg);
  }
  return sh;
}

export function FractalGL({ zpe = 1, theme = "quantum" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;
    const gl2 = gl;

    const vert = `attribute vec2 position; void main(){ gl_Position = vec4(position,0.0,1.0); }`;

    const frag2 = `precision mediump float;
    uniform float u_time;
    uniform float u_zpe;
    uniform vec3 u_color;
    uniform vec2 u_resolution;
    void main(){
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float t = u_time * 0.001;
      float v = sin((uv.x*10.0 + t*u_zpe)*2.0) * cos((uv.y*8.0 + t*u_zpe)*2.0);
      float shade = 0.5 + 0.5*v;
      vec3 col = mix(u_color*0.3, u_color, shade);
      gl_FragColor = vec4(col,1.0);
    }`;

    const vs = compileShader(gl, vert, gl.VERTEX_SHADER);
    const fs = compileShader(gl, frag2, gl.FRAGMENT_SHADER);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const msg = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error("Program link error: " + msg);
    }

    const posLoc = gl2.getAttribLocation(prog, "position");
    const resLoc = gl2.getUniformLocation(prog, "u_resolution");
    const timeLoc = gl2.getUniformLocation(prog, "u_time");
    const zpeLoc = gl2.getUniformLocation(prog, "u_zpe");
    const colorLoc = gl2.getUniformLocation(prog, "u_color");

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const verts = new Float32Array([ -1,-1,  1,-1, -1,1,  -1,1, 1,-1, 1,1 ]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    let raf = 0;
    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.floor(c.clientWidth * dpr);
      const h = Math.floor(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
        gl2.viewport(0, 0, w, h);
      }
    }

    function themeColor(t: string) {
      if (t === "forest") return [0.2, 0.6, 0.2];
      if (t === "architecture") return [0.9, 0.7, 0.6];
      return [0.4, 0.5, 1.0];
    }

    function draw(time: number) {
      const c = canvasRef.current;
      if (!c) return;
      resize();
      gl2.clearColor(0,0,0,0);
      gl2.clear(gl2.COLOR_BUFFER_BIT);
      gl2.useProgram(prog);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, buf);
      gl2.enableVertexAttribArray(posLoc);
      gl2.vertexAttribPointer(posLoc, 2, gl2.FLOAT, false, 0, 0);

      const color = themeColor(theme);
      gl2.uniform3f(colorLoc, color[0], color[1], color[2]);
      const ambient = lowFreqOsc(time, 0.00008, 0.18) * (0.6 + zpe * 0.2);
      gl2.uniform1f(timeLoc, time * ambient);
      gl2.uniform1f(zpeLoc, zpe);
      if (resLoc) gl2.uniform2f(resLoc, c.width, c.height);

      gl2.drawArrays(gl2.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      try { gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs); } catch {}
    };
  }, [zpe, theme]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: 180, borderRadius: 12 }} />;
}
