import React from "react";
import { FractalCanvas } from "../visuals/FractalCanvas";
import { FractalGL } from "../visuals/FractalGL";

type Props = {
  zpe: number;
  setZpe: (v: number) => void;
  useWebGL: boolean;
  setUseWebGL: (b: boolean) => void;
  theme: "quantum" | "forest" | "architecture";
  expanded: string | null;
  setExpanded: (s: string | null) => void;
};

export function ZPECard({ zpe, setZpe, useWebGL, setUseWebGL, theme, expanded, setExpanded }: Props) {
  return (
    <div
      className={`card ${expanded === "zpe" ? "expanded" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => setExpanded("zpe")}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded("zpe"); }}
    >
      <h2>ZPE</h2>
      {useWebGL ? <FractalGL zpe={zpe} theme={theme} /> : <FractalCanvas zpe={zpe} theme={theme} />}
      <p>Effective ZPE: <strong>{zpe.toFixed(2)}</strong></p>
      <div className="controls">
        <input
          data-testid="zpe-range"
          type="range"
          min={0.2}
          max={2}
          step={0.01}
          value={zpe}
          onChange={(e) => setZpe(Number(e.target.value))}
        />
        <label style={{marginLeft:8}}>
          <input data-testid="webgl-checkbox" type="checkbox" checked={useWebGL} onChange={(e)=>setUseWebGL(e.target.checked)} /> WebGL
        </label>
      </div>
    </div>
  );
}
