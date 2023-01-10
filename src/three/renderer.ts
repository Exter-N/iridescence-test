import { WebGLRenderer } from 'three';
import { registerTickFunction } from './tick';
import Pipeline, { SizeInfo } from './pipeline';

export const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.physicallyCorrectLights = true;
renderer.setClearColor(0x333333, 0);

export const pipeline = new Pipeline(renderer);

function onResize() {
    pipeline.setSize(SizeInfo.fromWindow());
}

onResize();
addEventListener('resize', onResize, false);

document.getElementById('three')!.appendChild(renderer.domElement);

registerTickFunction('render', (time, deltaTime) => {
    pipeline.render(time, deltaTime);
});