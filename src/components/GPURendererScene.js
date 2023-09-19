"use client";

import { useRef, useEffect } from "react";
import { initGPURendererScene } from "@/3d/gpu-renderer";

export const GPURendererScene = () => {
  const containerRef = useRef();
  useEffect(() => {
    initGPURendererScene(containerRef.current);
  }, []);
  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full" />
  );
};
