import { Material, Mesh, OrthographicCamera, PlaneGeometry, WebGLRenderTargetOptions } from "three";
import { SizeInfo } from ".";
import Pass from "./pass";

export default abstract class ImagePass extends Pass {
    material: Material;
    protected constructor(size: SizeInfo, material: Material, inputOptions: (WebGLRenderTargetOptions | undefined)[]) {
        const mesh = new Mesh(new PlaneGeometry(2, 2), material);
        const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        super(size, mesh, camera, inputOptions);
        this.material = material;
    }
    protected setMaterial(material: Material): void {
        this.material = material;
        (this.scene as Mesh).material = material;
    }
}