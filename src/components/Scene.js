"use client";

import { useRef, useEffect } from "react";
import { SkinnedSamplerScene } from "@/3d/skinned-sampler";

export const Scene = () => {
  const containerRef = useRef();
  useEffect(() => {
    SkinnedSamplerScene(containerRef.current);
  });
  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full" />
  );
};
