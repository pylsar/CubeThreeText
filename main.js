import "./style.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer;
let cube, material;

let count = 0,
  cubeCamera1,
  cubeCamera2,
  cubeRenderTarget1,
  cubeRenderTarget2;

let onPointerDownPointerX,
  onPointerDownPointerY,
  onPointerDownLon,
  onPointerDownLat;

let lon = 0,
  lat = 0;
let phi = 0,
  theta = 0;

const textureLoader = new THREE.TextureLoader();

textureLoader.load("textures/1.jpg", function (texture) {
  texture.encoding = THREE.sRGBEncoding;
  texture.mapping = THREE.EquirectangularReflectionMapping;

  init(texture);
  animate();
});

function init(texture) {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = texture;

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  //

  cubeRenderTarget1 = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    encoding: THREE.sRGBEncoding // temporary -- to prevent the material's shader from recompiling every frame
  });

  cubeCamera1 = new THREE.CubeCamera(1, 1000, cubeRenderTarget1);

  cubeRenderTarget2 = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    encoding: THREE.sRGBEncoding
  });

  cubeCamera2 = new THREE.CubeCamera(1, 1000, cubeRenderTarget2);

  //

  material = new THREE.MeshBasicMaterial({
    envMap: cubeRenderTarget2.texture,
    combine: THREE.MultiplyOperation,
    reflectivity: 1
  });

  cube = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), material);
  scene.add(cube);

  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("wheel", onDocumentMouseWheel);

  window.addEventListener("resize", onWindowResized);
}

function onWindowResized() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function onPointerDown(event) {
  event.preventDefault();

  onPointerDownPointerX = event.clientX;
  onPointerDownPointerY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(event) {
  lon = (event.clientX - onPointerDownPointerX) * 0.1 + onPointerDownLon;
  lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
}

function onPointerUp() {
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
}

function onDocumentMouseWheel(event) {
  const fov = camera.fov + event.deltaY * 0.05;

  camera.fov = THREE.MathUtils.clamp(fov, 10, 75);

  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  const time = Date.now();

  lon += 0.15;

  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.MathUtils.degToRad(90 - lat);
  theta = THREE.MathUtils.degToRad(lon);

  cube.position.x = Math.cos(time * 0.001) * 1;
  cube.position.y = Math.sin(time * 0.001) * 1;
  cube.position.z = Math.sin(time * 0.001) * 1;

  cube.rotation.x += 0.002;
  cube.rotation.y += 0.003;

  camera.position.x = 100 * Math.sin(phi) * Math.cos(theta);
  camera.position.y = 100 * Math.cos(phi);
  camera.position.z = 100 * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(scene.position);

  // pingpong

  if (count % 2 === 0) {
    cubeCamera1.update(renderer, scene);
    material.envMap = cubeRenderTarget1.texture;
  } else {
    cubeCamera2.update(renderer, scene);
    material.envMap = cubeRenderTarget2.texture;
  }

  count++;

  renderer.render(scene, camera);
}
