import { MosaicScene } from "@/components/MosaicScene";

export default function Home() {
  return (
    <>
      {/* <div>Hello World</div> */}
      <MosaicScene />
      <video id="webcam" className="hidden" autoPlay playsInline></video>

      {/* <canvas
        id="debug"
        className="z-10 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1024px] h-[1024px]"
      /> */}
    </>
  );
}
