"use client";

import { useRef, useEffect } from "react";
import { initSkinnedSamplerScene } from "@/3d/skinned-sampler";

export const SkinnedSamplerScene = () => {
  const containerRef = useRef();
  useEffect(() => {
    initSkinnedSamplerScene(containerRef.current);
  }, []);
  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full" />
  );
};
