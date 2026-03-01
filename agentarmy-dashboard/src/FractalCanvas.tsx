import { useEffect, useRef } from "react";

type Props = {
  zpe?: number; // expected range ~0.2 - 2.0
  theme?: "quantum" | "forest" | "architecture";
};

export function FractalCanvas({ zpe = 1, theme = "quantum" }: Readonly<Props>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let t = 0;

    function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
      }
      return false;
    }

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      resizeCanvasToDisplaySize(canvas);
      const { width, height } = canvas;

      // Map zpe to visual parameters
      const speed = 0.4 + zpe * 1.6; // 0.6 - 3.0
      const densityStep = Math.max(2, Math.floor(6 - zpe * 2.5)); // smaller -> denser
      // theme-driven color base
      let baseR = 180, baseG = 180, baseB = Math.min(255, Math.floor(180 + zpe * 40));
      if (theme === "forest") { baseR = 80; baseG = Math.min(220, 140 + zpe * 40); baseB = 80; }
      if (theme === "architecture") { baseR = Math.min(240, 200 + zpe * 20); baseG = 160; baseB = 140; }

      ctx.clearRect(0, 0, width, height);

      for (let x = 0; x < width; x += densityStep) {
        for (let y = 0; y < height; y += densityStep) {
          const vx = (x / (width || 1)) * Math.PI * 4;
          const vy = (y / (height || 1)) * Math.PI * 4;
          const v = Math.sin((vx + t) * 0.02 * speed) * Math.cos((vy + t) * 0.02 * speed);
          const shade = Math.floor((v + 1) * 127);
          const r = Math.min(255, Math.floor((shade * baseR) / 255));
          const g = Math.min(255, Math.floor((shade * baseG) / 255));
          const b = Math.min(255, Math.floor((shade * baseB) / 255));
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, y, densityStep, densityStep);
        }
      }

      t += speed;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [zpe, theme]);

  return (
    <canvas
      ref={canvasRef}
      // allow CSS to size; default pixel size will be set on draw
      width={300}
      height={180}
      style={{ borderRadius: 12, width: "100%", height: 180 }}
    />
  );
}
