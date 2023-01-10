import { Camera, Object3D, PerspectiveCamera, WebGLRenderer, WebGLRenderTarget, WebGLRenderTargetOptions } from "three";
import Pipeline, { SizeInfo } from ".";

function setCameraAspect(camera: Camera, aspect: number) {
    if (camera instanceof PerspectiveCamera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
    }
}

export interface PassParent {
    shouldRenderInput(index: number, time: number, deltaTime: number, renderer: WebGLRenderer): boolean;
    willRenderInput(index: number, time: number, deltaTime: number, renderer: WebGLRenderer): void;
    didRenderInput(index: number, time: number, deltaTime: number, renderer: WebGLRenderer): void;
}

export default abstract class Pass implements PassParent {
    readonly inputTargets: readonly WebGLRenderTarget[];
    readonly inputs: (Pass | undefined)[];
    readonly scene: Object3D;
    readonly camera: Camera;
    layers: number | null;
    cached: boolean;
    needsUpdate: boolean;
    needsRender: boolean;

    protected constructor(size: SizeInfo, scene: Object3D, camera: Camera, inputOptions: (WebGLRenderTargetOptions | WebGLRenderTarget | undefined)[]) {
        this.inputTargets = inputOptions.map(opts => (opts instanceof WebGLRenderTarget) ? opts : new WebGLRenderTarget(size.width, size.height, opts));
        this.inputs = new Array(inputOptions.length);
        this.scene = scene;
        this.camera = camera;
        this.layers = null;
        this.cached = false;
        this.needsUpdate = false;
        this.needsRender = true;
        setCameraAspect(camera, size.aspect);
    }

    setSize(size: SizeInfo): void {
        this.needsRender = true;
        for (const target of this.inputTargets) {
            target.setSize(size.width, size.height);
        }
        setCameraAspect(this.camera, size.aspect);
    }
    update(): void {
    }

    shouldRenderInput(index: number, time: number, deltaTime: number, renderer: WebGLRenderer): boolean {
        return this.needsRender;
    }
    willRenderInput(index: number, time: number, deltaTime: number, renderer: WebGLRenderer): void {
    }
    didRenderInput(index: number, time: number, deltaTime: number, renderer: WebGLRenderer): void {
    }

    render(time: number, deltaTime: number, renderer: WebGLRenderer): void {
        if (!this.needsRender) {
            return;
        }

        if (null != this.layers) {
            const layers = this.camera.layers.mask;
            this.camera.layers.mask = this.layers;
            renderer.render(this.scene, this.camera);
            this.camera.layers.mask = layers;
        } else {
            renderer.render(this.scene, this.camera);
        }

        this.needsRender = !this.cached;
    }
}