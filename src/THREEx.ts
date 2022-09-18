import * as THREE from "three";

declare global {
  interface Window {
    THREEx: any;
  }
}

const loadScript = async (src: string) => {
  if (!window.THREE) {
    window.THREE = THREE;
  }

  const promise = new Promise<void>((resolve) => {
    if (window.THREEx) {
      resolve();
    } else {
      const script = document.createElement("script");
      script.onload = () => {
        document.body.removeChild(script);

        resolve();
      };
      script.src = src;
      document.body.appendChild(script);
    }
  });

  return promise;
};

let THREEx: any;
await loadScript(
  "https://raw.githack.com/AR-js-org/AR.js/master/three.js/build/ar-threex.js"
);

THREEx = window.THREEx;

export default THREEx;
