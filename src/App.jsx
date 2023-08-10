import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { init } from "./3d";

function App() {
  const containerRef = useRef();
  useEffect(() => {
    console.log("init");
    init(containerRef.current);
  }, []);

  return (
    <>
      <div>Hello World</div>
      <div ref={containerRef} className="fixed top-0 left-0 w-full h-full" />
    </>
  );
}

export default App;
