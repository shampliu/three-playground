"use client";

import { useRef, useEffect } from "react";
import { initPointCloudScene } from "@/3d/point-cloud";

export const PointCloudScene = () => {
  const containerRef = useRef();
  useEffect(() => {
    initPointCloudScene(containerRef.current);
  }, []);
  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full" />
  );
};
