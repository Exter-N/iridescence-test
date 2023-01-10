import { Vector2, WebGLRenderer, WebGLRenderTarget } from "three";
import Pass, { PassParent } from "./pass";

function setSize(pass: Pass | undefined, size: SizeInfo): void {
    if (null == pass) {
        return;
    }
    for (const input of pass.inputs) {
        setSize(input, size);
    }
    pass.setSize(size);
}

function render(time: number, deltaTime: number, renderer: WebGLRenderer, pass: Pass | undefined, target: WebGLRenderTarget | null, parentPass: PassParent | undefined, index: number): void {
    if (null == pass || null != parentPass && !parentPass.shouldRenderInput(index, time, deltaTime, renderer)) {
        return;
    }
    if (pass.needsUpdate) {
        pass.update();
    }
    for (let i = 0; i < pass.inputTargets.length; ++i) {
        render(time, deltaTime, renderer, pass.inputs[i], pass.inputTargets[i], pass, i);
    }
    if (null != parentPass) {
        parentPass.willRenderInput(index, time, deltaTime, renderer);
    }
    try {
        renderer.setRenderTarget(target);
        pass.render(time, deltaTime, renderer);
    } finally {
        if (null != parentPass) {
            parentPass.didRenderInput(index, time, deltaTime, renderer);
        }
    }
}

export class SizeInfo {
    cssWidth: number;
    cssHeight: number;
    pixelRatio: number;
    constructor(cssWidth: number, cssHeight: number, pixelRatio: number) {
        this.cssWidth = cssWidth;
        this.cssHeight = cssHeight;
        this.pixelRatio = pixelRatio;
    }

    get width(): number {
        return this.cssWidth * this.pixelRatio;
    }
    get height(): number {
        return this.cssHeight * this.pixelRatio;
    }
    get aspect(): number {
        return this.cssWidth / this.cssHeight;
    }

    static fromRenderer(renderer: WebGLRenderer): SizeInfo {
        const { x, y } = renderer.getSize(new Vector2());

        return new SizeInfo(x, y, renderer.getPixelRatio());
    }
    static fromWindow(): SizeInfo {
        return new SizeInfo(innerWidth, innerHeight, devicePixelRatio);
    }

    applyToRenderer(renderer: WebGLRenderer) {
        renderer.setSize(this.cssWidth, this.cssHeight);
        renderer.setPixelRatio(this.pixelRatio);
    }
}

export default class Pipeline {
    readonly renderer: WebGLRenderer;
    size: SizeInfo;
    finalPass: Pass | undefined;
    finalPassParent: PassParent | undefined;
    constructor(renderer: WebGLRenderer) {
        this.renderer = renderer;
        this.size = SizeInfo.fromRenderer(renderer);
        this.finalPass = undefined;
        this.finalPassParent = undefined;
    }

    append(pass: Pass): void {
        if (null != this.finalPass && pass.inputs.length > 0) {
            pass.inputs[0] = this.finalPass;
        }
        this.finalPass = pass;
    }

    setSize(size: SizeInfo): void {
        this.size = size;
        size.applyToRenderer(this.renderer);
        setSize(this.finalPass, size);
    }

    render(time: number, deltaTime: number): void {
        render(time, deltaTime, this.renderer, this.finalPass, null, this.finalPassParent, 0);
    }
}