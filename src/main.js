import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Pickr from "@simonwep/pickr";
import * as fabric from 'fabric';

let model;

var shirtURL = new URL('../assets/models/shirt_baked.glb', import.meta.url);
var container = document.getElementById('canvas');

var scene = new THREE.Scene();
scene.background = new THREE.Color('gainsboro');

var camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight);
camera.position.set(0, 0, 1.5);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth - 16, container.clientHeight - 16);
renderer.setAnimationLoop(animationLoop);
container.appendChild(renderer.domElement);

var controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enableDamping = true;

var ambientLight = new THREE.AmbientLight('white', 0.5);
scene.add(ambientLight);

var light = new THREE.DirectionalLight('white', 0.5);
light.position.set(1, 1, 1);
scene.add(light);

var assetLoader = new GLTFLoader();
assetLoader.load(shirtURL.href, function(gltf) {
    model = gltf.scene;
    scene.add(model);
    model.position.set(0, 0, 0);
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            console.log(child.material); 
        }
    });
}, undefined, function(error) { 
    console.error(error);
});

scene.add(new THREE.AxesHelper(2));

function animationLoop(t) {
    controls.update();
    light.position.copy(camera.position);
    renderer.render(scene, camera);
}


const pickr = Pickr.create({
    el: '#pickr-container',
    theme: 'nano', 
    default: '#00ff00',
    components: {
        preview: true,
        opacity: false,
        hue: true,
        interaction: {
            hex: true,
            rgba: true,
            input: true,
        }
    }
});


pickr.on('change', (color) => {
    if (model) {
        const newColor = new THREE.Color(color.toHEXA().toString());


        model.traverse((child) => {
            if (child.isMesh && child.material) {
                console.log("Updating material color");  
                child.material.color.set(newColor);
                child.material.needsUpdate = true; 
            }
        });
    }
});


const canvas = new fabric.Canvas('texture-canvas');
canvas.setDimensions({ width: 512, height: 512 });


document.getElementById('add-text-btn').addEventListener('click', function () {
    const inputText = document.getElementById('text-input').value;
    const text = new fabric.Text(inputText, {
        left: 50,
        top: 100,
        fontSize: 30,
        fill: '#000000',
        selectable: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
});


document.getElementById('upload-logo-btn').addEventListener('click', function () {
    const fileInput = document.getElementById('upload-logo');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        fabric.Image.fromURL(event.target.result, function(img) {
            img.set({
                left: 50,
                top: 50,
                scaleX: 0.5,
                scaleY: 0.5
            });
            canvas.add(img);
            canvas.setActiveObject(img);
        });
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});


function applyCanvasTexture() {
    if (model) {
        const canvasTexture = new THREE.CanvasTexture(canvas.getElement());
        
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.map = canvasTexture;
                child.material.needsUpdate = true; 
            }
        });
    }
}


canvas.on('object:modified', function() {
    applyCanvasTexture();
});

canvas.on('object:added', function() {
    applyCanvasTexture();
});


canvas.setBackgroundColor('#ffffff', function() {
    canvas.renderAll();
});

applyCanvasTexture();


function updateCanvasText(text) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000'; 
    ctx.fillText(text, 50, 100); 
    canvasTexture.needsUpdate = true; 
    applyCanvasTexture();
}

document.getElementById('add-text-btn').addEventListener('click', function () {
    const newText = document.getElementById('text-input').value;
    updateCanvasText(newText); 
});
