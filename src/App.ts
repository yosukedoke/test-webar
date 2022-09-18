import * as THREE from "three";
import THREEx from "./THREEx";

export default () => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(new THREE.Color("lightgrey"), 0);
  renderer.setSize(640, 480);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0px";
  renderer.domElement.style.left = "0px";
  document.body.appendChild(renderer.domElement);
  // array of functions for the rendering loop
  // type Fn1 = () => void;
  // type Fn2 = (delta: number) => void;
  // type Fn3 = (a: number, b: number) => void;
  const onRenderFcts: Function[] = [];
  let arToolkitContext: any, arMarkerControls: any;
  // init scene and camera
  const scene = new THREE.Scene();
  //////////////////////////////////////////////////////////////////////////////////
  //		Initialize a basic camera
  //////////////////////////////////////////////////////////////////////////////////
  // Create a camera
  const camera = new THREE.Camera();
  scene.add(camera);
  ////////////////////////////////////////////////////////////////////////////////
  //          handle arToolkitSource
  ////////////////////////////////////////////////////////////////////////////////
  const arToolkitSource = new THREEx.ArToolkitSource({
    // to read from the webcam
    sourceType: "webcam",
    sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
    sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
  });
  arToolkitSource.init(function onReady() {
    arToolkitSource.domElement.addEventListener("canplay", () => {
      console.log(
        "canplay",
        "actual source dimensions",
        arToolkitSource.domElement.videoWidth,
        arToolkitSource.domElement.videoHeight
      );
      initARContext();
    });
    setTimeout(() => {
      onResize();
    }, 2000);
  });
  // handle resize
  window.addEventListener("resize", function () {
    onResize();
  });
  function onResize() {
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController !== null) {
      arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
  }
  ////////////////////////////////////////////////////////////////////////////////
  //          initialize arToolkitContext
  ////////////////////////////////////////////////////////////////////////////////
  function initARContext() {
    // create atToolkitContext
    arToolkitContext = new THREEx.ArToolkitContext({
      cameraParametersUrl:
        THREEx.ArToolkitContext.baseURL + "../data/data/camera_para.dat",
      detectionMode: "mono",
    });
    // initialize it
    arToolkitContext.init(() => {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
      arToolkitContext.arController.orientation = getSourceOrientation();
      arToolkitContext.arController.options.orientation =
        getSourceOrientation();
      console.log("arToolkitContext", arToolkitContext);
    });
    // MARKER
    arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
      type: "pattern",
      patternUrl: THREEx.ArToolkitContext.baseURL + "../data/data/patt.hiro",
      changeMatrixMode: "cameraTransformMatrix",
    });
    scene.visible = false;
    console.log("ArMarkerControls", arMarkerControls);
  }
  function getSourceOrientation() {
    if (!arToolkitSource) {
      return null;
    }
    console.log(
      "actual source dimensions",
      arToolkitSource.domElement.videoWidth,
      arToolkitSource.domElement.videoHeight
    );
    if (
      arToolkitSource.domElement.videoWidth >
      arToolkitSource.domElement.videoHeight
    ) {
      console.log("source orientation", "landscape");
      return "landscape";
    } else {
      console.log("source orientation", "portrait");
      return "portrait";
    }
  }
  // update artoolkit on every frame
  onRenderFcts.push(function () {
    if (!arToolkitContext || !arToolkitSource || !arToolkitSource.ready) {
      return;
    }
    arToolkitContext.update(arToolkitSource.domElement);

    scene.visible = camera.visible;
  });
  //////////////////////////////////////////////////////////////////////////////////
  //		add an object in the scene
  //////////////////////////////////////////////////////////////////////////////////
  // add a torus knot
  const geometry1 = new THREE.BoxGeometry(1, 1, 1);
  const material1 = new THREE.MeshNormalMaterial({
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const mesh1 = new THREE.Mesh(geometry1, material1);
  mesh1.position.y = geometry1.parameters.height / 2;
  scene.add(mesh1);
  const geometry2 = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
  const material2 = new THREE.MeshNormalMaterial();
  const mesh2 = new THREE.Mesh(geometry2, material2);
  mesh2.position.y = 0.5;
  scene.add(mesh2);
  onRenderFcts.push((delta?: number) => {
    if (typeof delta === "number") mesh2.rotation.x += Math.PI * delta;
  });
  //////////////////////////////////////////////////////////////////////////////////
  //		render the whole thing on the page
  //////////////////////////////////////////////////////////////////////////////////
  // render the scene
  onRenderFcts.push(function () {
    renderer.render(scene, camera);
  });
  // run the rendering loop
  let lastTimeMsec: number | null = null;
  requestAnimationFrame(function animate(nowMsec: number) {
    // keep looping
    requestAnimationFrame(animate);
    // measure time
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    const deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec = nowMsec;
    // call each update function
    onRenderFcts.forEach(function (onRenderFct) {
      onRenderFct(deltaMsec / 1000, nowMsec / 1000);
    });
  });
};
