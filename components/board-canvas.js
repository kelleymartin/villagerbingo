"use strict";

import { useEffect, useRef } from "react";
import { renderToCanvas } from "../lib/render-to-canvas";

export function BoardCanvas(props) {
  const { id, className, boardVillagers, selectedVillagers } = props;

  const canvasRef = useRef(null);

  useEffect(() => {
    renderToCanvas(canvasRef.current, { boardVillagers, selectedVillagers });
  }, [boardVillagers, selectedVillagers]);

  return (
    <canvas
      width={630}
      height={630}
      id={id}
      className={className}
      ref={canvasRef}
    />
  );
}
