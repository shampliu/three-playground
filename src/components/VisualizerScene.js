"use client";

import { useRef, useEffect } from "react";
import { initVisualizerScene } from "@/3d/visualizer";

export const VisualizerScene = () => {
  const containerRef = useRef();
  useEffect(() => {
    initVisualizerScene(containerRef.current);
  }, []);
  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full" />
  );
};
