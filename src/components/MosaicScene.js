"use client";

import { initMosaicScene } from "@/3d/mosaic";
import { useRef, useEffect } from "react";

export const MosaicScene = () => {
  const containerRef = useRef();
  useEffect(() => {
    initMosaicScene(containerRef.current);
  }, []);
  return (
    <div ref={containerRef} className="fixed top-0 left-0 w-full h-full" />
  );
};
