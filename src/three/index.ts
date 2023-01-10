import camera from "./camera";
import RenderPass from "./pipeline/render-pass";
import { pipeline, renderer } from "./renderer";
import scene from "./scene";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const mainPass = new RenderPass(pipeline.size, scene, camera);

pipeline.append(mainPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();
