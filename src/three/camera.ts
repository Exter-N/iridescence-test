import { PerspectiveCamera } from "three";

const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 6, 10);
camera.lookAt(0, 5, 0);

export default camera;