import { Camera, Object3D, WebGLRenderTarget, WebGLRenderTargetOptions } from "three";
import { SizeInfo } from ".";
import Pass from "./pass";

export default class RenderPass extends Pass {
    constructor(size: SizeInfo, scene: Object3D, camera: Camera, inputOptions: (WebGLRenderTargetOptions | WebGLRenderTarget | undefined)[] = [ ]) {
        super(size, scene, camera, inputOptions);
    }
}