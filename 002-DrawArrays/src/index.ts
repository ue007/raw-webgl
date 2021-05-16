import Renderer from './renderer';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = canvas.height = 640;
const renderer = new Renderer(canvas);
renderer.start();
