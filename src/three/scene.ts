import { BufferGeometry, DirectionalLight, HemisphereLight, Line, LineBasicMaterial, Mesh, Object3D, Scene, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import material from "./material";

const scene = new Scene();

const loader = new STLLoader();
loader.load('./models/' + (location.hash?.replace(/^#/, '') || 'Utah_teapot_(solid)') + '.stl', geometry => {
    const mesh = new Mesh(geometry, material);
    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
});

// Axes

function addLine(group: Object3D, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: number): Line {
    const geometry = (new BufferGeometry()).setFromPoints([
        new Vector3(x1, y1, z1),
        new Vector3(x2, y2, z2),
    ]);

    const line = new Line(geometry, new LineBasicMaterial({ color }));
    group.add(line);

    return line;
}

addLine(scene, 0, 0, 0, 1, 0, 0, 0xFF0000);
addLine(scene, 0, 0, 0, 0, 1, 0, 0x00FF00);
addLine(scene, 0, 0, 0, 0, 0, 1, 0x0000FF);

// Ground

/*const ground = new Mesh(new PlaneGeometry(10, 10), new MeshBasicMaterial({ color: 0x808080 }));
ground.rotation.set(-Math.PI / 2, 0, 0);
scene.add(ground);*/

// Lights

scene.add(new HemisphereLight(0x443333, 0x111122));

function addShadowedLight(group: Object3D, x: number, y: number, z: number, color: number, intensity: number): DirectionalLight {
    const directionalLight = new DirectionalLight(color, intensity * 2);
    directionalLight.position.set(x, y, z);

    directionalLight.castShadow = true;

    const d = 1;
    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;

    directionalLight.shadow.bias = - 0.002;

    group.add(directionalLight);

    addLine(scene, x, y, z, x + 1, y, z, color);
    addLine(scene, x, y, z, x, y + 1, z, color);
    addLine(scene, x, y, z, x, y, z + 1, color);

    return directionalLight;
}

addShadowedLight(scene, 10, 10, 10, 0xffffff, 1.35);
addShadowedLight(scene, -5, 10, -10, 0xffffff/*0xffaa00*/, 1);

export default scene;