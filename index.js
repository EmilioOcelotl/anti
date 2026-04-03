
/////////// 4NT1 /////////////////

import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow-models/face-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as faceMesh from '@mediapipe/face_mesh';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as THREE from 'three';
import {TRIANGULATION} from './js/triangulation';
import * as Tone from 'tone';
import Stats from 'stats.js';
import {EffectComposer} from './jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './jsm/postprocessing/UnrealBloomPass.js';
import {GlitchPass} from './jsm/postprocessing/GlitchPass.js';
import {TTFLoader} from './jsm/loaders/TTFLoader.js';
import {AfterimagePass} from './jsm/postprocessing/AfterimagePass.js';
import {ImprovedNoise} from './jsm/math/ImprovedNoise.js';
import { GUI } from './jsm/libs/dat.gui.module.js';
// const TWEEN = require('@tweenjs/tween.js')

///////////////////// Variables importantes

let boolText = true; 
let boolGui = false; 
let boolStats = false; 
let boolMic = true; 
let numCasos = 13; 
let boton = false;
let irises = false; // costoso. Evaluar 
let boolSynth = false; 

// con boton

document.querySelector('button').addEventListener('click', async () => {
    // console.log('audio is ready')   
    await Tone.start();   
    init();
})

let detector; 

// Tone.start().then( (x) => init());
// sin botón ( modo exhibición ) 

var txtsc1=[];  

const loader = new THREE.FileLoader();

loader.load(
	'txt/txtsc1.txt',
	function ( data ) {
	    var arrLines = data.split("\n");
	    for (var i = 0; i < arrLines.length; i++) {
		txtsc1.push(arrLines[i]);
	    }
	}
);

var txtsc2=[];  

loader.load(
	'txt/txtsc2.txt',
	function ( data ) {
	    var arrLines = data.split("\n");
	    for (var i = 0; i < arrLines.length; i++) {
		txtsc2.push(arrLines[i]);
	    }
	}
);

var txtsc3=[];  

loader.load(
	'txt/txtsc3.txt',
	function ( data ) {
	    var arrLines = data.split("\n");
	    for (var i = 0; i < arrLines.length; i++) {
		txtsc3.push(arrLines[i]);
	    }
	}
);

var txtInstrucciones=[];  

loader.load(
	'txt/txtInstrucciones.txt',
	function ( data ) {
	    var arrLines = data.split("\n");
	    for (var i = 0; i < arrLines.length; i++) {
		txtInstrucciones.push(arrLines[i]);
	    }
	}
);

let outline, out, respawn, line; 
let freeverb, distortion, pitchShift, mic, openmic, panner; 

/////////////////////

let scene, camera, renderer, material, geometryPoints;
let geometryC, materialC, materialC2;
let cuboGrande = new THREE.Mesh(); let cuboGrande2 = new THREE.Mesh();
let font;
let text = new THREE.Mesh(); let text2 = new THREE.Mesh();
let matArray = [];
let prueba = 4;
let postB = true;
let matLite; 

const pGeometry = [new THREE.BufferGeometry(), new THREE.BufferGeometry(), new THREE.BufferGeometry];

const pVertices1 = []; const pVertices2 = []; const pVertices3 = [];

for ( let i = 0; i < 468; i ++ ) {
    const x = Math.random() * 2000 - 1000;
    const y = Math.random() * 2000 - 1000;
    const z = Math.random() * 2000 - 1000;
    pVertices1.push( x, y, z );
    pVertices2.push( x, y, z );
    pVertices3.push( x, y, z );
}

pGeometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( pVertices1, 3 ) );
pGeometry[1].setAttribute( 'position', new THREE.Float32BufferAttribute( pVertices2, 3 ) );
pGeometry[2].setAttribute( 'position', new THREE.Float32BufferAttribute( pVertices3, 3 ) );

let position = [];

for (var i = 0; i < 3; i++) {
    position[i] = pGeometry[i].attributes.position;
    position[i].usage = THREE.DynamicDrawUsage;
}

let geometryB;
let vertices = [];
let points = [];
let normals = [];
let  keypoints = []; 
let laterales = [];
let geometry = new THREE.BufferGeometry();
let mesh = new THREE.Mesh();
let meshB = new THREE.Mesh();
let degree = 0;
let xMid;

let model, videoWidth, videoHeight, video;

const loaderHTML = document.getElementById('loaderHTML');
const startButton = document.getElementById( 'startButton' );
const myProgress = document.getElementById( 'myProgress' );
const myBar = document.getElementById( 'myBar' );
const body = document.getElementById( 'body' );

let colores = [], colores2 = [], colores3 = [];
const stats = new Stats();
let predictions = [];
let container;
let planeB = [];
let composer;
let planeVideo;
let planeBuscando;
let materialVideo;
let escena = 0;
let rendereo;
let buscando = false;
let player, antiKick;
let seq1, seq2, seq3;
let flow, curve, curveHandles = [];
let textMesh1;

function isMobile() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isAndroid || isiOS;
}

const mobile = isMobile();

// /////////// Retro

const dpr = window.devicePixelRatio;
let textureSize;

if (mobile) {
    textureSize = 512 * dpr;
    console.log('En movimiento');
} else {
    textureSize =1024 * dpr;
    console.log('Estático');
}

let texture;
const vector = new THREE.Vector2();
let afterimagePass, bloomPass; 
let vueltas;

// /////////// Camera

let mouseX = 0;
let mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let aletx=[], alety=[], aletz=[];

let model2;
const annotateBoxes = true;
let landmarks;

let inicio;
let fin, transcurso;
let segundo;

const perlin = new ImprovedNoise();
let intro; 
let gSegundo; 

let glitchPass; 
let stream
let gSignal, gFin, gTranscurso; 
let stopRendering = false; 
let suspendido = false; 
let modoOscuro = true; 
let txtPosX = 1;
let txtPosY = 1; 
let txtPosX2 = 1;
let txtPosY2 = 1; 
let matPoints = []; 
let clock;
let creditos = false; 
let antifont; 

/*
var voz = new Tone.Players({
  "aun": "audio/voces/aun.mp3",
  // "snare":"samples/505/snare.mp3"
}).toDestination();
*/ 

let perlinValue;
let perlinAmp;
let cuboGBool = false;
let loopOf, loopRod, loopTxt, loopTres; 

let blinkRate;
let blinked = false;
let tempBlinkRate = 0;
let rendering = true;
let rateInterval;
const EAR_THRESHOLD = 0.27;

let blinkConta = 0;

let txtPos1 = [], txtPos2 = []; 
let txtPosCopy1 = [], txtPosCopy2 = []; 
let textCopy1, textCopy2; 

let cuboGrandeOrg;

let camWidth, camHeight; 
let wCor, hCor;
let camSz; 

let gometryVideo; 
let vidGeometry; 
let planeVideoOrg;

let exBool = true;
// let cotiBool = false; 
let escenasFolder = []; 
let objEsc1, objEsc2; 

var params = {opacidad: 0.5,damp: 0.5,tamaño: 10,perlin: 0.01, rojo: 255,verde: 0,azul: 255,texto: true,retro: true, sonido: true, voz: false,grano: 0.01,altura: 0}

let videoFolder = []; 
let audioFolder = []; 
let wireline; 

let keyactualX = [];
let keyanteriorX = [];

let keyactualY = [];
let keyanteriorY = [];
let velsX = [], velsY = [], vels = [];

let avg;
let velarriba, velabajo, velizquierda, velderecha; 
let trigeom = new THREE.BufferGeometry();
let trimesh = new THREE.Mesh(); 
let triPosiciones = [];
let triCantidad = 880; // un parámetro que podríamoso cambiar 
let triGeometry = [];
let blackPlane; 

let triangulos = []; 

let vit;
let trimaterial; 


var hydra = new Hydra({
    canvas: document.getElementById("myCanvas"),
    detectAudio: false
})
    
const elCanvas = document.getElementById( 'myCanvas');
elCanvas.style.display = 'none'; 

let arre = []; 
vit = new THREE.CanvasTexture(elCanvas);


let silueta; 

// /////////// Camara

function mostrarErrorCamara(err) {
    loaderHTML.style.display = 'none';
    let msg;
    if (err.name === 'NotFoundError' || err.name === 'DeviceNotFoundError') {
	msg = 'No se encontró ninguna cámara.<br>Conecta una cámara y recarga la página.';
    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
	msg = 'Se necesita permiso para usar la cámara.<br>Permite el acceso en el navegador y recarga la página.';
    } else if (err.name === 'NotReadableError') {
	msg = 'La cámara está siendo usada por otra aplicación.<br>Ciérrala y recarga la página.';
    } else {
	msg = 'No fue posible acceder a la cámara.<br>Verifica que esté conectada y disponible.';
    }
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;font-family:Monospace;font-size:14px;text-align:center;z-index:999;line-height:2;';
    div.innerHTML = msg;
    document.body.appendChild(div);
}

async function setupCamera() {

    if(navigator.userAgent.match(/firefox|fxios/i)){

	camWidth = 640;
	camHeight = 480;	
	wCor = 30.5;
	hCor = 25;
	if(!mobile){
	    camSz = 7;
	} else {
	    camSz = 10; 
	}
	
    } else {

	camWidth = 640;
	camHeight = 480;
	wCor = 38.5;
	hCor = 28
	if(!mobile){
	    camSz = 7;
	} else {
	    camSz = 10; 
		
	}}
    
    video = document.getElementById('video');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
	mostrarErrorCamara({ name: 'NotFoundError' });
	throw new Error('getUserMedia no disponible');
    }

    try {
	stream = await navigator.mediaDevices.getUserMedia({
	    'audio': false,
	    'video': {
		facingMode: 'user',
		width: mobile ? undefined : camWidth,
		height: mobile ? undefined : camHeight,
		// frameRate: {ideal: 20, max: 60},
	    }
	});
    } catch (err) {
	mostrarErrorCamara(err);
	throw err;
    }

    video.srcObject = stream;
    let {width, height} = stream.getTracks()[0].getSettings();
    console.log('Resolución:'+ `${width}x${height}`); // 640x480
    return new Promise((resolve) => {
	video.onloadedmetadata = () => {
	    resolve(video);
	    initBlinkRateCalculator();	
	};
    });
}

async function renderPrediction() {

    // ahora predictions se llama estimate faces

    predictions = await detector.estimateFaces(video);

    /*
    predictions = await model.estimateFaces({
	input: video,
	returnTensors: false,
	flipHorizontal: false,
	predictIrises: irises,
    });

    */
    
    if( buscando && exBool ){
	fin = Date.now();
	transcurso = (fin - inicio) / 1000;
    }

    if(buscando && creditos){
	finCreditos = Date.now();
	transCreditos = ( finCreditos - inicioCreditos) / 1000; 
    }
    
    score();
        
    if (prueba != predictions.length ) {
	initsc0();
    }

    prueba = predictions.length;

    arre = []; 
    vueltas = 0;
    
    trimaterial.map.needsUpdate = true;

    for(let i = 0; i < triCantidad; i++){
	triGeometry[i].attributes.position.needsUpdate = true;
    }
    
    if (predictions.length > 0) {
	predictions.forEach((prediction) => {

	    //keypoints = prediction.scaledMesh;
	    keypoints = prediction.keypoints.map((keypoint) => [keypoint.x, keypoint.y, keypoint.z]); 
	    
	    for (let i = 0; i < TRIANGULATION.length / 3; i++) {
		points = [
		    TRIANGULATION[i * 3],
		    TRIANGULATION[i * 3 + 1],
		    TRIANGULATION[i * 3 + 2],
		].map((index) => keypoints[index]);		
		arre.push(points); // si hay más predicciones este array es más grande
	    }
	    
	    let time = Date.now() * 0.0005;
	    
	    if (buscando) {
		switch ( escena ) {
		case 0: // 0 - titulo 1 Podría suspenderse ? 
		    animsc1();
		    break;
		case 1: // 1 - escena 1
		    animsc1();
		    break;
		case 2: // 2 - titulo 2 Podría suspenderse? 
		    animsc1();
		    break;
		case 3: // 3 - escena 2
		    animsc2();
		    break;
		case 4: // 4 - titulo 3
		    // animsc3(); 
		    break;
		case 5: // 5 - escena 5
		    // animIrises(); // antes
		    animsc3() 
		    break; 
		case 6: // 6 - Creditos 
		    animCreditos();
		    break; 
		case 7: // epilogo  
		    break;
		case 8: // reinicio
		    break; 
		}
	    }

	    //// parpadeo

	    if(irises){
		
		let lowerRight = prediction.annotations.rightEyeUpper0;
		let upperRight = prediction.annotations.rightEyeLower0;
		const rightEAR = getEAR(upperRight, lowerRight);
	    
		let lowerLeft = prediction.annotations.leftEyeUpper0;
		let upperLeft = prediction.annotations.leftEyeLower0;
		const leftEAR = getEAR(upperLeft, lowerLeft);
		
		let blinked = leftEAR <= EAR_THRESHOLD && rightEAR <= EAR_THRESHOLD;
		if (blinked) {
		    updateBlinkRate();
		}

		if( getIsVoluntaryBlink(blinked) ){
		    // console.log(prediction.annotations.rightEyeUpper0); 
		    // console.log("parpadeo");
		    //blinkSignal = Date.now(); 
		    // aquí hay que agregar un contador. Si pasa cierto número de tiempo entonces miau
		    blinkConta++;
		    selektor(Math.floor(Math.random() * numCasos)); 
		    console.log("parpadeo"); 
		    if(blinkConta == 10){
			
		    selektor(Math.floor(Math.random() * numCasos));
			//console.log("ojos cerrados o muchos parpadeos"); 
		    } 
		    
		} else {
		    blinkConta = 0; 
		    // blinkConta = 0; 
		    // console.log(getIsVoluntaryBlink(blinked)); 
		}
	    }
	});
    }

    /*
   if (predictions.length > 0) {
	const {annotations} = predictions[0]; // solo agarra una prediccion
	const [topX, topY] = annotations['midwayBetweenEyes'][0];
	const [rightX, rightY] = annotations['rightCheek'][0];
	const [leftX, leftY] = annotations['leftCheek'][0];
	const bottomX = (rightX + leftX) / 2;
	const bottomY = (rightY + leftY) / 2;
	degree = Math.atan((topY - bottomY) / (topX - bottomX));
	
    } else {	
	text.position.x = txtPosX;
	text.position.y = txtPosY;	
	text2.position.x = txtPosX2;
	text2.position.y = txtPosY2;
	}
    */
    
    // panner.positionX.value = degree *2; // degree reducido

    camera.lookAt( scene.position );
    camera.rotation.z = Math.PI;

    if(boolStats){
	stats.update();
    }
    
    renderer.render( scene, camera );
 
    vertices = [];
    composer.render();
  
    if(cuboGBool || suspendido ){
	vector.x = ( window.innerWidth * dpr / 2 ) - ( textureSize / 2 );
	vector.y = ( window.innerHeight * dpr / 2 ) - ( textureSize / 2 );
	renderer.copyFramebufferToTexture( vector, texture );
    }

    /// texto movimiento

    let delta, time; 
	delta = clock.getDelta();
	time = clock.getElapsedTime() * 10;
	var time2 = Date.now() * 0.0005;

    if(!mobile){
	// const position = geometry.attributes.position;
	text.geometry.attributes.position.needsUpdate = true;
	for ( let i = 0; i < text.geometry.attributes.position.count; i ++ ) {
	    // let d = perlin.noise(txtPos1[i] * 0.001 +time  );
	    let d = perlin.noise(
		text.geometry.attributes.position.getX(i) * 0.04+ time2,
		text.geometry.attributes.position.getY(i) * 0.04 + time2,
		text.geometry.attributes.position.getZ(i) * 0.04+ time2) *  0.125; 
	    text.geometry.attributes.position.setZ( i, textCopy1.geometry.attributes.position.getZ(i) + d ); 
	}
	text2.geometry.attributes.position.needsUpdate = true;
	for ( let i = 0; i < text2.geometry.attributes.position.count; i ++ ) {
	    let d = perlin.noise(
		text2.geometry.attributes.position.getX(i) * 0.04+ time2,
		text2.geometry.attributes.position.getY(i) * 0.04 + time2,
		text2.geometry.attributes.position.getZ(i) * 0.04+ time2) *  0.125; 
	    text2.geometry.attributes.position.setZ( i, textCopy2.geometry.attributes.position.getZ(i) + d );
	    
	}
    }

    /*
      let oldAvg;
      
    for(let i = 0; i < keypoints.length; i++){

	keyanteriorX[i] = keyactualX[i];
	keyactualX[i] = keypoints[i][0];
	velsX[i] = Math.abs(keyanteriorX[i] - keyactualX[i]);
	
	keyanteriorY[i] = keyactualY[i];
	keyactualY[i] = keypoints[i][1];
	velsY[i] = Math.abs(keyanteriorY[i] - keyactualY[i]);

	vels[i] = (velsX[i] + velsY[i]) / 2;
	// aqui va el promedio de velocidades por punto 
	
    }

    const sumX = velsX.reduce((a, b) => a + b, 0);
    const avgX = (sumX / velsX.length) || 0;

    const sumY = velsY.reduce((a, b) => a + b, 0);
    const avgY = (sumY / velsY.length) || 0;
   
    
    const sum = vels.reduce((a, b) => a + b, 0);
    oldAvg = avg; 
    avg = (sum / vels.length) || 0;

    */
    
    //sphereNuevo.scale.x.lerp(avg/4, 0.1) ; // Ñep 
    
    // arriba 10
    // abajo 152
    // izq 234
    // der 454
    
    // promedio de las velocidades de todos los puntos
    // promedios dependiendo de puntos específicos
    
   // console.log( avg / 100 ); // Promedio general 

    requestAnimationFrame(renderPrediction);
};

///////////////////////// Inicialización

async function init() {

    await tf.setBackend('webgl');
    const overlay = document.getElementById( 'overlay' );
    overlay.remove();
    const info = document.getElementById( 'info' );
    info.remove();
    const fonca = document.getElementById( 'fonca' );
    fonca.remove();
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    document.body.style.cursor = 'none'; 
    loaderHTML.style.display = 'block';

    await setupCamera();
    
    video.play(); 

    // Esto tiene que ver con que no se pueda usar el modo retrato 

    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;
    video.width = videoWidth;
    video.height = videoHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    scene.background = vit;
    
    camera.position.z = 40;
    camera.rotation.z = Math.PI;
    
    clock = new THREE.Clock();

    const geometryVideo = new THREE.PlaneGeometry( camWidth/7, camHeight /7, 16, 16);
    materialVideo = new THREE.MeshBasicMaterial( {
	color: 0xffffff,
	side: THREE.DoubleSide,
	transparent: true,
	opacity: 1,
    } );
    
    planeVideo = new THREE.Mesh( geometryVideo, materialVideo );
    planeVideo.rotation.x = Math.PI;
    planeVideo.position.z = -10;
    
    // retro();
    materiales();

    for(let i = 0; i < 3; i++){
	matPoints[i] = new THREE.PointsMaterial( {
	    color: 0xffffff,
	    // blending: THREE.SubtractiveBlending,
	    //alphaTest: 0.9, 
	    map: vit 
	} );
    }

    planeB = [new THREE.Points( pGeometry[0], matPoints[0] ), new THREE.Points( pGeometry[1], matPoints[1] ), new THREE.Points( pGeometry[2], matPoints[2] )];
   
    for (var i = 0; i < 3; i++) {
	pGeometry[i].verticesNeedUpdate = true;
    }

    geometryB = new THREE.BufferGeometry();
    geometryB.verticesNeedUpdate = true;
    
    texto();
    loadFont(); 
    
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize );

    if( boolStats ){
	container.appendChild( stats.dom ); // para dibujar stats 
    }
    
    const renderScene = new RenderPass( scene, camera );

    //bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    
    composer = new EffectComposer( renderer );
    composer.addPass( renderScene );
    //composer.addPass( bloomPass );

    afterimagePass = new AfterimagePass();
    composer.addPass( afterimagePass );
    afterimagePass.uniforms['damp'].value = 0.85;


    /*
    model = await faceLandmarksDetection.load(
	faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, // cambiar 
	{maxFaces: 3,
	 shouldLoadIrisModel: true, // Hay que cargar un poco más de archivos 
	 // maxContinuousChecks: 120
	});
    */

    model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = {
	runtime: 'mediapipe', // or 'tfjs'
	solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
    }
    detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    
    trimaterial = new THREE.MeshBasicMaterial( {
	color: 0xffffff,
	side: THREE.DoubleSide,
	// blending: THREE.AdditiveBlending,
	map:vit,	
    } ); 

    for(let i = 0; i < 3; i++){
	const x = Math.random() * 200 - 100;
	const y = Math.random() * 200 - 100;
	const z = Math.random() * 200 - 100;
	triPosiciones.push(x, y, z); 	
    }
    
    var quad_uvs =[0.0, 0.0,1.0, 0.0, 1.0, 1.0];

    for(let i = 0; i < triCantidad; i++){
	
	triGeometry[i] = new THREE.BufferGeometry();
	triGeometry[i].setAttribute( 'position', new THREE.Float32BufferAttribute( triPosiciones, 3 ) );
	triGeometry[i].setAttribute( 'uv', new THREE.Float32BufferAttribute( quad_uvs, 2))
	triGeometry[i].usage = THREE.DynamicDrawUsage; 
	triangulos[i] = new THREE.Mesh( triGeometry[i], trimaterial  );
	//triangulos[i].rotation.y = Math.PI*2; 
	
    }

    /*
    for(let i = 0; i < triCantidad; i++){
	scene.add(triangulos[i]);
	triangulos[i].position.z = -4;
	triangulos[i].rotation.y = Math.PI*2;
    }
    */ 

    const geometryPlane = new THREE.PlaneGeometry( camWidth/camSz, camHeight/camSz );
    const materialPlane = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
    blackPlane = new THREE.Mesh( geometryPlane, materialPlane );
    blackPlane.position.z = -10;

    silueta = new THREE.TextureLoader().load( 'img/siluetaNeg.png' )
    
    sonido(); 
    detonar();
    
}

function initsc0() {

    cuboGrande.rotation.x = 0;
    cuboGrande.rotation.y = 0;

    if ( predictions.length < 1 ) {
    
	outline.stop(0);
	line.stop(0); 
	loopTxt.start(0); 
	loopRod.stop(0);
	loopOf.stop(0);
	loopTres.stop(0); 
	//out.start(); // out.loop? comentado, esto antes hacia un ruido
	matLite.map.dispose(); 	
	matLite.blending = THREE.NoBlending; 
	scene.add(planeVideo); 
	planeVideo.material.opacity = 1; 
	materialVideo.map = silueta;
	materialVideo.map.wrapS = THREE.RepeatWrapping;
	materialVideo.map.repeat.x = - 1;
	text.material.color = new THREE.Color(0xffffff); 
	planeVideo.geometry.dispose();
	const geometryVideoNew = new THREE.PlaneGeometry( 480/15, 640/15 );
	planeVideo.geometry = geometryVideoNew; 	
	rmsc1();
	rmsc2();
	rmsc3(); 
	hush();
	scene.background = new THREE.Color(0x000000);
	modoOscuro = true;

	for(let i = 0; i < triCantidad; i++){
	    scene.remove(triangulos[i]); 
	}

	if(boolText){
    	    chtexto(
		txtsc1[Math.floor(Math.random()*txtsc1.length)],
		txtsc1[Math.floor(Math.random()*txtsc1.length)],
		Math.random()*40 - 20,
		Math.random()*40 - 20,
		Math.random()*40 - 20,
		Math.random()*40 - 20
	    );
	}
	
	buscando = false;
	scene.remove( cuboGrande );
	intro.restart(); // que se detone hasta que la libería esté cargada 
	// intro.start();

    } else {

	loopRod.stop(0); 
	loopTxt.stop(0); 
	planeVideo.geometry.dispose();
	const geometryVideoNew = new THREE.PlaneGeometry( camWidth/camSz, camHeight/camSz ); 
	planeVideo.geometry = geometryVideoNew; 
	materialVideo.map = new THREE.VideoTexture( video );
	matLite.map = vit; 
	matLite.blending = THREE.AdditiveBlending; 
	// respawn.start(); // esto antes hacia ruido  
	escena = 0;
	titulo1(); 
	transcurso = 0; 
	inicio = Date.now();
	segundo = 0;
	modoOscuro = false;
	buscando = true;
	// scene.add( cuboGrande );
	scene.add( text );
	scene.add( text2 );
	intro.stop();

    }
}

function titulo1(){

    loopRod.stop(0); 
    matPoints[0].size = 0; 
    scene.background = vit; 
    selektor(Math.floor(Math.random() * numCasos)); 
    scene.add(blackPlane); 
    outline.stop(0);
    line.stop(0); 
    // console.log("titulo 1 "); 
    loopTxt.stop(0); 
    
    if(boolText){
	chtexto(
	    "I\nLa ofuscación como motivo",
	    "",
	    0,
	    0,
	    0,
	    0
	);
    }

    // planeVideo.material.map.dispose();
    //planeVideo.color = new THREE.Color( 0xffffff ); 
    scene.remove( planeVideo );
    // scene.remove( cuboGrande ); 
    // text.material.color = new THREE.Color(0xffffff);
    // text.material = trimaterial; 
    cuboGBool = false;

    /*
    if (predictions.length > 0) {
	for (let i = 0; i < planeB.length; i++) {
	    scene.remove( planeB[i] );
	}
    }
    */ 
    
    let cuentaPlane = 0;

    /*
    if (predictions.length > 0) {
	predictions.forEach((prediction) => {
	    scene.add( planeB[cuentaPlane] );
	    cuentaPlane++;
	});

    }
    */

    let tritotal = 0; 
    if (predictions.length > 0) {
	predictions.forEach((prediction) => {
	    for(let i = 0; i < triCantidad; i++){	    
		scene.remove(triangulos[tritotal]);
		tritotal++; 
	    }
	})
    }
    
}

function initsc1() {

    switch( Math.floor(Math.random() * 2 ) ) {
    case 0:
	trimaterial.blending = THREE.NoBlending;
	matPoints[0].material = THREE.NoBlending; 
	break;
    case 1:
	trimaterial.blending = THREE.AdditiveBlending;
	matPoints[0].material = THREE.AdditiveBlending; 
	break; 
    }

    perlinValue = THREE.MathUtils.mapLinear(Math.random(), 0.0, 1.0, 0.001, 0.2); 
    
    //scene.add( blackPlane );// tal vez que sea aleatorio  
    // cuboGBool = true;
    
    loopOf.start(0);
    line.stop();
    outline.stop(); 
    irises = false;    
    afterimagePass.uniforms['damp'].value = 0.85;
    perlinValue = 0.03;
    perlinAmp = 4;
    scene.add( planeVideo);
    planeVideo.material.opacity = 1; 
    // scene.remove( planeVideo ); 
    //scene.add( cuboGrande ); 
    scene.add(planeVideo); 
    
    if(boolText){
	chtexto(
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    Math.random()*40 - 20,
	    Math.random()*40 - 20,
	    Math.random()*40 - 20,
	    Math.random()*40 - 20
	);
    }
	
    if (predictions.length > 0) {
	for (let i = 0; i < planeB.length; i++) {
	    scene.remove( planeB[i] );
	}
    }

    let cuentaPlane = 0;

    /*
    if (predictions.length > 0) {
	predictions.forEach((prediction) => {
	    scene.add( planeB[cuentaPlane] );
	    cuentaPlane++;
	});
    }
    */

    /*
    for(let i = 0; i < triCantidad; i++){	    
	scene.add(triangulos[i]);
    }
    */

    let tritotal = 0; 
    if (predictions.length > 0) {
	predictions.forEach((prediction) => {
	    for(let i = 0; i < triCantidad; i++){	    
		scene.add(triangulos[tritotal]);
		tritotal++; 
	    }
	})
    }

    
    pitchShift.pitch = -4 ; // cambios dinámicos para el futuro 
   
}

function animsc1() { 

    var time2 = Date.now() * 0.0005;

    /*
    if(exBool){
	// perlinValue = 0.003+(transcurso/60*0.003); // suspendido temporalmente  
	// planeVideo.material.opacity = 0.75+transcurso/60;
	matPoints[0].size =  (Math.sin(time * 0.25) *0.5) +0.5; 
    }
    */
    
    // capa hydra

    // Necesitamos agregar algo para que sea el número de posiciones * la cantidad de rostros 

    // let tritotal = 0;
    let triconta = 0;

    if (predictions.length > 0) {
	predictions.forEach((prediction) => {	
	    arre = arre.flat(2);
	    for(let j = 0; j < triCantidad; j++){	
		let d = perlin.noise(
		    arre[triconta*3] * perlinValue + time2,
		    arre[(triconta*3)+1] * perlinValue + time2,
		    arre[(triconta*3)+2] * perlinValue + time2) *  0.125; 
		for(let i = 0; i < 3; i++){
	    triGeometry[j].attributes.position.setX( i, (arre[triconta*3] * 0.12 -wCor)*(1.1+d) ); 
		    triGeometry[j].attributes.position.setY( i, (arre[(triconta*3)+1] * 0.12 - hCor) * (1.1+d) );
		    triGeometry[j].attributes.position.setZ( i, (arre[(triconta*3)+2] * 0.05) * (1+d) );
   		    triconta++; 
		}
	    }
	})
    }		
    // capa blend

    /*
    var time2 = Date.now() * 0.0005;
    for ( let i = 0; i < position[vueltas].count; i ++ ) {
	let d = perlin.noise(
	    keypoints[i][0] * perlinValue + time2,
	    keypoints[i][1] * perlinValue + time2,
	    keypoints[i][2] * perlinValue + time2) *  0.5; 
	// const analisis = Tone.dbToGain ( analyser.getValue()[i%64] ) * 20;
	position[vueltas].setX( i, (1+keypoints[i][0] * 0.12 - wCor) * (1+d) ); 
	position[vueltas].setY( i, (1+keypoints[i][1] * 0.12 - hCor) * (1+d) ); 
	position[vueltas].setZ( i, (keypoints[i][2] * 0.05)   );
    }

    planeB[vueltas].geometry.computeVertexNormals();
    planeB[vueltas].geometry.attributes.position.needsUpdate = true;
    position[vueltas].needsUpdate = true;
    vueltas++;
    */
    
}

function rmsc1() {
   for (let i = 0; i < planeB.length; i++) {
	scene.remove( planeB[i] );
    }
}

function titulo2(){

    //scene.remove(blackPlane); 
    scene.background = vit; 
    selektor(Math.floor(Math.random() * numCasos)); 
    
    loopOf.stop(0);
    loopTxt.stop(0);
    loopRod.stop(0);
    loopTres.stop(0); 

    line.start(0); 
    if(boolText){
	chtexto(
	    "II\nLas consecuencias\nno buscadas del rodeo",
	    "",
	    0,
	    0,
	    0,
	    0
	);
    }

    // scene.remove( cuboGrande ); 
    scene.remove( planeVideo ); 
    text.material.color = new THREE.Color(0xffffff); 
    cuboGBool = false;

    for(let i = 0; i < triCantidad; i++){	    
	scene.remove(triangulos[i]);
    }
 
    pitchShift.pitch = -4 ; // cambios dinámicos para el futuro tal vez con una secuencia    
    
}

// Escena 2

function initsc2() {

    perlinValue = THREE.MathUtils.mapLinear(Math.random(), 0.0, 1.0, 0.001, 0.2); 
    
    switch( Math.floor(Math.random() * 2) ) {
    case 0:
	trimaterial.blending = THREE.NoBlending;
	matPoints[0].material = THREE.NoBlending; 
	break;
    case 1:
	trimaterial.blending = THREE.AdditiveBlending;
	matPoints[0].material = THREE.AdditiveBlending; 
	break; 
    }
    
    
    // scene.add( blackPlane); 
    // selektor(0); 
    
    // cuboGBool = true; 
    loopRod.start(0); 
    // line.start(0); 
    // loop.start(0); 
    
    text.material.color = new THREE.Color(0xffffff); 
    scene.add( planeVideo);
    afterimagePass.uniforms['damp'].value = 0.85;

    perlinValue = 0.003;
    perlinAmp = 2;
    
    // cuboGrande.material.opacity = 0; 
    // scene.add(cuboGrande); 
    // planeVideo.material.opacity = 0; 
    // scene.add( planeVideo);

    if(boolText){
	chtexto(
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    Math.random()*40 - 20,
	    Math.random()*40 - 20,
	    Math.random()*40 - 20,
	    Math.random()*40 - 20
	);
    }
	
    if (predictions.length > 0) {
	for (let i = 0; i < planeB.length; i++) {
	    scene.remove( planeB[i] );
	}
    }

    let cuentaPlane = 0;

    /*
    if (predictions.length > 0) {
	predictions.forEach((prediction) => {
	    planeB[0].material = matPoints[Math.floor(Math.random()*3)]; 
	    scene.add( planeB[cuentaPlane] );
	    cuentaPlane++;
	});
    }
    */

    for(let i = 0; i < triCantidad; i++){	    
	scene.add(triangulos[i]);
    }

}

function animsc2() {

    //if(exBool){
	// perlinValue = 0.03-((transcurso-60)/60*0.03); 
	// planeVideo.material.opacity = 1;
	// matPoints[0].size = 1 - (transcurso-60)/60;
	//matPoints[0].size =  (Math.sin(time * 0.25) *0.5) +0.5;
    // }
    // capa hydra

    arre = arre.flat(2);
    let triconta = 0;
    var time2 = Date.now() * 0.0005;
    
    for(let j = 0; j < triCantidad; j++){	
	
	let d = perlin.noise(
	    arre[triconta*3] * perlinValue + time2,
	    arre[(triconta*3)+1] * perlinValue + time2,
	    arre[(triconta*3)+2] * perlinValue + time2) *  0.5; 
	
	for(let i = 0; i < 3; i++){
	    triGeometry[j].attributes.position.setX( i, (arre[triconta*3] * 0.12 -wCor)*(1.2+d) ); 
	    triGeometry[j].attributes.position.setY( i, (arre[(triconta*3)+1] * 0.12 - hCor) * (1.2+d) );
	    triGeometry[j].attributes.position.setZ( i, (arre[(triconta*3)+2] * 0.05) * (1.2*d) );
   	    triconta++; 
	}
    }
        
    var time2 = Date.now() * 0.0005;

    /*
    for ( let i = 0; i < position[vueltas].count; i ++ ) {

	let d = perlin.noise(keypoints[i][0] * perlinValue + time2,
			     keypoints[i][1] * perlinValue + time2,
			     keypoints[i][2] * perlinValue + time2) *  0.5; 

	position[vueltas].setX( i, (1+keypoints[i][0] * 0.12 - wCor) * (1+d) ); 
	position[vueltas].setY( i, (1+keypoints[i][1] * 0.12 - hCor) * (1+d) );
	position[vueltas].setZ( i, keypoints[i][2] * 0.05  );
    }

    planeB[vueltas].geometry.computeVertexNormals();
    planeB[vueltas].geometry.attributes.position.needsUpdate = true;
    position[vueltas].needsUpdate = true;
    vueltas++;
    */

}

function rmsc2() {
    /*
      for (let i = 0; i < planeB.length; i++) {
      scene.remove( planeB[i] );
      }
    */
}


// Titulo 3

function titulo3(){

    // scene.remove(blackPlane); 
    scene.background = vit; 
    selektor(Math.floor(Math.random() * numCasos)); 
    
    loopOf.stop(0);
    loopRod.stop(0); 
    loopTxt.stop(0);
    loopTres.stop(0); 
    outline.start();

    if(boolText){
	chtexto(
	    "III\nObservaciones multihilo",
	    "",
	    0,
	    0,
	    0,
	    0
	);
    }

    scene.remove( cuboGrande ); 
    scene.remove( planeVideo ); 
    text.material.color = new THREE.Color(0xffffff); 
    cuboGBool = false; 

    for(let i = 0; i < triCantidad; i++){	    
	scene.remove(triangulos[i]);
    }
    
    pitchShift.pitch = -4 ; // cambios dinámicos para el futuro 
   
    
}

// Escena 2

function initsc3() {

    perlinValue = THREE.MathUtils.mapLinear(Math.random(), 0.0, 1.0, 0.001, 0.2); 
    
    switch( Math.floor(Math.random() * 2) ) {
    case 0:
	trimaterial.blending = THREE.NoBlending;
	matPoints[0].material = THREE.NoBlending; 
	break;
    case 1:
	trimaterial.blending = THREE.AdditiveBlending;
	matPoints[0].material = THREE.AdditiveBlending; 
	break; 
    }
    
    // scene.add( blackPlane); 
    // cuboGBool = true; 
    loopTres.start(0); 
    // line.start(0); 
    // loop.start(0); 
    
    text.material.color = new THREE.Color(0xffffff); 
    scene.add( planeVideo);
    afterimagePass.uniforms['damp'].value = 0.85;

    perlinValue = 0.003;
    perlinAmp = 2;
    
    if(boolText){
	chtexto(
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    Math.random()*40 - 20,
	    Math.random()*40 - 20,
	    Math.random()*40 - 20,
	    Math.random()*40 - 20
	);
    }
	
    if (predictions.length > 0) {
	for (let i = 0; i < planeB.length; i++) {
	    scene.remove( planeB[i] );
	}
    }

    let cuentaPlane = 0;

    if (predictions.length > 0) {
	predictions.forEach((prediction) => {
	    planeB[0].material = matPoints[Math.floor(Math.random()*3)]; 
	    scene.add( planeB[cuentaPlane] );
	    cuentaPlane++;
	});
    }

    for(let i = 0; i < triCantidad; i++){	    
	scene.add(triangulos[i]);
    }

}

function animsc3() {

    /*
    if(exBool){
	perlinValue = 0.03-((transcurso-60)/60*0.03); 
	// planeVideo.material.opacity = 1;
	// matPoints[0].size = 1 - (transcurso-60)/60;
	matPoints[0].size =  (Math.sin(time * 0.25) *0.5) +0.5;
    }
    */
    
    // capa hydra aquí podrían ir las iteraciones por predicciones 

    arre = arre.flat(2);
    let triconta = 0;
    var time2 = Date.now() * 0.0005;
    
    for(let j = 0; j < triCantidad; j++){	
	
	let d = perlin.noise(
	    arre[triconta*3] * perlinValue + time2,
	    arre[(triconta*3)+1] * perlinValue + time2,
	    arre[(triconta*3)+2] * perlinValue + time2) *  0.5; 
	
	for(let i = 0; i < 3; i++){
	    triGeometry[j].attributes.position.setX( i, (arre[triconta*3] * 0.12 -wCor)*(1.2+d) ); 
	    triGeometry[j].attributes.position.setY( i, (arre[(triconta*3)+1] * 0.12 - hCor) * (1.2+d) );
	    triGeometry[j].attributes.position.setZ( i, (arre[(triconta*3)+2] * 0.05) * (1.2*d) );
   	    triconta++; 
	}
    }
        
    var time2 = Date.now() * 0.0005;

    /*
    for ( let i = 0; i < position[vueltas].count; i ++ ) {

	let d = perlin.noise(keypoints[i][0] * perlinValue + time2,
			     keypoints[i][1] * perlinValue + time2,
			     keypoints[i][2] * perlinValue + time2) *  0.5; 

	position[vueltas].setX( i, (1+keypoints[i][0] * 0.12 - wCor) * (1+d) ); 
	position[vueltas].setY( i, (1+keypoints[i][1] * 0.12 - hCor) * (1+d) );
	position[vueltas].setZ( i, keypoints[i][2] * 0.05  );
    }

    planeB[vueltas].geometry.computeVertexNormals();
    planeB[vueltas].geometry.attributes.position.needsUpdate = true;
    position[vueltas].needsUpdate = true;
    vueltas++;
    */
}

function rmsc3() {
    /*
   for (let i = 0; i < planeB.length; i++) {
	scene.remove( planeB[i] );
    }
    */
}

function reinicio(){

    transcurso = 0;
    escena = 0; 
    // titulo1(); 
    initsc0(); 
}

// Sin retroalimentación ordenar mejor esto 

function selektor( sc ){
    
    switch(sc){
    case 0:
	shape(4,0.7)
	    .mult(osc(20,-0.009,9).modulate(noise(3,1)).rotate(0.7)).modulateScale(osc(4,-0.09,0).kaleid(50).scale(0.6),15,0.1).out()
	break;
    case 1:
	shape(4,0.7).mult(osc(20,-0.009,9).modulate(noise(3,1)).rotate(0.7)).modulateScale(osc(4,-0.09,0).kaleid(50).scale(0.6),15,0.1).out()
	break;
    case 2:
	noise(5,0.99).modulate(noise(2),0.92).scrollX(0.19,0.09).modulateScrollY(osc(2).modulate(osc().rotate(),.11)).scale(2.9).color(0.9,1.014,1).color(5,1,50).out()
	break;
    case 3:
	osc(3,0.01,9).mult(osc(2,-0.1,1).modulate(noise(3,1)).rotate(0.7)).posterize([3,10,2].fast(0.5).smooth(1)).modulateRotate(o0,() => Math.sin(time)*3).color(5,1,50).scrollX(1,() => (0.1 * Math.sin(time*.00009))).out()
	break;
    case 4:
	noise(1,0.99).modulate(noise(10),0.12).scrollX(0.19,0.09).modulateScrollY(osc(0.2).modulate(osc(0.1).rotate(),.11)).scale([.72,9,5,4,1].fast(1).smooth(0.9)).color(0.9,1.014,1).color(1,[50,2,20].fast(0.0),5).out()
	break;
    case 5:
	voronoi(8,1)
	    .mult(osc(10,0.1,()=>Math.sin(time)*3).saturate(3).kaleid(200))
	    .modulate(o0,0.05)
	    .add(o0,0.8)
	    .scrollY(-0.01)
	    .scale(0.99)
	    .modulate(voronoi(8,1),0.008)
	    .luma(0.3)
	    .out()
	break;
    case 6:
	voronoi(8,1)
	    .mult(osc(10,0.9,()=>Math.sin(time)*90).saturate(3).repeat(3,4))
	    .modulate(o0,0.05)
	    .add(o0,0.8)
	    .scrollX(-0.01)
	    .scale(0.9)
	    .modulate(voronoi(90,100),0.005)
	    .luma(0.3)
	    .out()
	break;
    case 7:
	voronoi(8,1)
	    .mult(osc(10,0.9,()=>Math.cos(time)*9).saturate(9).repeat(3,4))
	    .modulate(o0,0.05)
	    .add(o0,0.8)
	    .scrollX(-0.01)
	    .scale(()=>Math.cos(time)*0.9)
	    .modulate(voronoi(90,100),0.005)
	    .luma(0.4)
	    .hue(3)
	    .out()
	break;
    case 8:
	voronoi(8,1)
	    .diff(osc(10,0.9,0.8).saturate(9))
	    .modulate(noise(),0.05)
	    .add(noise(3,4),0.8)
	    .scrollX(-0.01)
	    .scale(0.9)
	    .modulate(voronoi(90,100),0.005)
	    .luma(1)
	    .shift(3,3)
	    .out()
	break;
    case 9:
	voronoi(8,1)
	    .diff(noise(2,0.08))
	    .modulate(noise(3,6),0.2)
	    .add(noise(1,4),9)
	    .modulate(noise(1,10),0.0005)
	    .luma(0.5)
	    .shift(3,3)
	    .out()
	break;
    case 10:
	voronoi(8,1)
	    .diff(noise(2,0.08))
	    .modulate(noise(3,6),0.2)
	    .add(noise(1,4),0.009)
	    .scale(1.2)
	    .modulate(noise(1,10),0.0005)
	    .luma(0.5)
	    .shift(3,3)
	    .out()
	break;
    case 11:
	voronoi(8,1)
	    .diff(noise(2,0.08))
	    .modulate(noise(30,8),0.2)
	    .add(noise(1,4),9)
	    .modulate(osc(1,10,1),0.5)
	    .luma(0.05)
	    .shift(3,3)
	    .color(0.1,2,7)
	    .out()
	break;
    case 12:
	shape(20,0.2,0.3)
	    .color(0.5,0.8,50)
	    .scale(() => Math.sin(time)+1*2)
	    .repeat(() => Math.sin(time)*100)
	    .scale(() => Math.sin(time)+1 *1.5)
	    .modulate(noise(2,2))
	    .rotate(1, .2)
	    .out()
	break; 
    }   
}

///////////////////////////////////////////////7
//// IMPORTANTE: ¿Con esto es necesario activar/desactivar con initsc0? Sip
//// iMPORTANTE2: ¿Podría hacerse con los secuenciadores de tone.js ? No se sabe
///////////////////////////////////////////////

function score() {

    /*
      1. titulo1   000 - 005 s
      2. initsc1   005 - 035 s
      3. titulo2   035 - 040 s
      4. initsc2   040 - 070 s
      5. titulo3   070 - 075 s
      6. initsc3   075 - 105 s
      7. reinicio   s 
     */
    
    if(buscando){

	//  Primera escena 
	
	if ( transcurso.toFixed() == 5 && segundo != 5 ) {
	    //console.log("Primera Escena"); 
	    segundo = transcurso.toFixed(); 
	    modoOscuro = false; 
	    escena = 1;
	    rmsc1();
	    rmsc2();
	    rmsc3(); 
	    // rmIrises(); 
	    initsc1();
	}

	// titulo 2 Estos números podrían variar ligeramente ? 
	
	if ( transcurso.toFixed() == 35 && segundo != 35 ) {
	    //console.log("Título 2");
	    segundo = transcurso.toFixed();
	    escena = 2; 
	    rmsc1();
	    rmsc2();
	    rmsc3(); 
	    // rmIrises();
	    titulo2(); 
	    
	}
	
	// Segunda escena 
    
	if ( transcurso.toFixed() == 40 && segundo != 40 ) {
	    //console.log("Segunda Escena"); 
	    segundo = transcurso.toFixed();
	    modoOscuro = false; 
	    escena = 3;
	    rmsc1();
	    rmsc2();
	    rmsc3(); 
	    initsc2();
	    
	}

	// Tercer Título 

	if ( transcurso.toFixed() == 70 && segundo != 70 ) {
	    //console.log("Título 3");
	    segundo = transcurso.toFixed();
	    escena = 4; 
	    rmsc1();
	    rmsc2();
	    rmsc3(); 
	    // rmIrises();
	    titulo3(); 
	}

	// Tercera escena 
	
	if ( transcurso.toFixed() == 75 && segundo != 75 ) {
	    //console.log("Tercera Escena"); 
	    segundo = transcurso.toFixed();
	    modoOscuro = true;
	    // irises = true; 
	    escena = 5;
	    rmsc1();
	    rmsc2();
	    rmsc3(); 
	    // initIrises(); // Antes
	    initsc3(); 
	    
	}

	// Mientras

	if ( transcurso.toFixed() == 105 && segundo != 105 ) {
	    //console.log("Reinicio"); 
	    segundo = transcurso.toFixed();
	    // modoOscuro = true; 
	    escena = 6;
	    rmsc1();
	    rmsc2();
	    rmsc3();
	    reinicio(); 
	    // rmIrises();	    
	}
		
    }
}

function guiFunc(){

    const gui = new GUI();

    const modosFolder = gui.addFolder('Modos');
   escenasFolder = gui.addFolder('Escenas'); 
    
    var audioGUI = {
	vozAjena: true,
	audio: true,
	vozPropia: false, 
    }

    var videoGUI = {
	texto: true,
	retro: true,
	
    }
    
    //modosFolder.add(options, 'exhibición').onChange( modoEx ); 
    // modosFolder.add(options, 'cotidiano' ).onChange( modoCot ); 

    var obj = { clicExhibición:modoEx };
    modosFolder.add(obj,'clicExhibición');

    var obj2 = { clicUsoCotidiano:modoCot };
    modosFolder.add(obj2,'clicUsoCotidiano');

    modosFolder.open(); 

    objEsc1 = { escena_1:cotEscena1 };
    escenasFolder.add(objEsc1, 'escena_1');
        
    objEsc2 = { escena_2:cotEscena2 };
    escenasFolder.add(objEsc2, 'escena_2'); 

    videoFolder = gui.addFolder('Video');
    
    videoFolder.add(params, 'opacidad', 0, 1, 0.001).onChange(function(){
	planeVideo.material.opacity = params.opacidad; 
    })

    videoFolder.add(params, 'damp', 0, 1, 0.001).onChange(function(){
	afterimagePass.uniforms['damp'].value = params.damp; 
    })

    videoFolder.add(params, 'tamaño',  0.01, 50, 0.01).onChange(function(){
	for(let i = 0; i < 3; i++){
	    matPoints[i].size = params.tamaño; 
	}
    })

    videoFolder.add(params, 'perlin',  0.001, 0.05, 0.001).onChange(function(){
	perlinValue = params.perlin; 
    })

    videoFolder.add(params, 'retro',  true).onChange(function(){
	cuboGBool = params.retro;
	if(cuboGBool){
	    scene.add(cuboGrande);
	} else {
	    scene.remove(cuboGrande); 
	}
    })
    
    videoFolder.add(params, 'rojo',  0, 1, 0.01).onChange(function(){
	const nuevoColor = new THREE.Color(params.rojo, params.verde, params.azul);
	for(let i = 0; i < 3; i++){
	    matPoints[i].color = nuevoColor; 
	}
    })

    videoFolder.add(params, 'verde',  0, 1, 0.01).onChange(function(){
	const nuevoColor = new THREE.Color(params.rojo, params.verde, params.azul);
	for(let i = 0; i < 3; i++){
	    matPoints[i].color = nuevoColor; 
	}
    })

    videoFolder.add(params, 'azul',  0, 1, 0.01).onChange(function(){
	const nuevoColor = new THREE.Color(params.rojo, params.verde, params.azul);
	for(let i = 0; i < 3; i++){
	    matPoints[i].color = nuevoColor; 
	}
    })

    videoFolder.add(params, 'texto', true).onChange(function(){
	boolText = params.texto; 
	if(boolText){
	    scene.add(text);
	    scene.add(text2); 
	} else {
	    scene.remove(text);
	    scene.remove(text2); 
	}
    })

    audioFolder = gui.addFolder('Audio');

    audioFolder.add(params, 'sonido',  true).onChange(function(){
	const audioBool = params.sonido; 
	if(audioBool){
	    fondos.mute = false; 
	} else {
	    fondos.mute = true; 
	}
    })

    audioFolder.add(params, 'voz',  true).onChange(function(){
	if(params.voz){
	    distortion.toDestination(); 
	} else {
	    distortion.disconnect(); 
	}
    })
    
    audioFolder.add(params, 'grano',  0.001, 0.1, 0.001).onChange(function(){
	pitchShift.windowSize = params.grano; 
    })

    audioFolder.add(params, 'altura',  -24, 24, 1).onChange(function(){
	pitchShift.pitch = params.altura; 
    })

}

function texto() {

    if(boolText){
	const color = 0xffffff;
	
	matLite = new THREE.MeshBasicMaterial( {
	    color: 0xffffff,
	    side: THREE.DoubleSide,
	    blending: THREE.AdditiveBlending,
	} );

	matLite.map = vit; 

    const loader1 = new THREE.FontLoader();

	loader1.load( 'fonts/square.json', function( font ) {
	    
	    const message = "";
	    const shapes = font.generateShapes( message, 0.75);
	    const geometry = new THREE.ShapeGeometry( shapes );
	    geometry.computeBoundingBox();
	    
	    const xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
 	    geometry.translate( xMid, 0, 0 );
	    text = new THREE.Mesh( geometry, matLite );
	    text.position.z = 5;
	    text.rotation.z = Math.PI;
	    scene.add( text );
	    
	    text2 = new THREE.Mesh( geometry, matLite );
	    text2.position.z = 5;
	    text2.rotation.z = Math.PI;
	    scene.add( text2 );
	
	});
    }
    
}

function chtexto( mensaje, mensaje2, posX,  posY, posX2, posY2 ) {

    txtPosX = posX;
    txtPosY = posY;	
    txtPosX2 = posX2;
    txtPosY2 = posY2;
    
    const message = mensaje; 
    const shapes = antifont.generateShapes( message, 1.25 );
    const geometry = new THREE.ShapeGeometry( shapes );
    geometry.computeBoundingBox();
    geometry.computeVertexNormals(); 
    const xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
    geometry.translate( xMid, 0, 0 );
    text.geometry.dispose(); 
    text.geometry= geometry;
    text.material.dispose();

    text.position.x = txtPosX; 
    text.position.y = txtPosY;
    text.position.z = 10;
    
    const message2 = mensaje2; 
    const shapes2 = antifont.generateShapes( message2, 1.25 );
    const geometry2 = new THREE.ShapeGeometry( shapes2 );
    geometry2.computeBoundingBox();
    geometry2.computeVertexNormals(); 
    const xMid2 = - 0.5 * ( geometry2.boundingBox.max.x - geometry2.boundingBox.min.x );
    geometry2.translate( xMid2, 0, 0 );
    text2.geometry.dispose(); 
    text2.geometry= geometry2;
    text2.material.dispose();
    
    text2.position.x = txtPosX2; 
    text2.position.y = txtPosY2;
    text2.position.z = 10;
    
    if(!mobile){
	text.geometry.usage = THREE.DynamicDrawUsage;
	textCopy1 = text.clone(); 
	text2.geometry.usage = THREE.DynamicDrawUsage;
	textCopy2 = text2.clone(); 
    }
}

/*
function retro() {
    const data = new Uint8Array( textureSize * textureSize * 3 );
    texture = new THREE.DataTexture( data, textureSize, textureSize, THREE.RGBFormat );
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
}
*/

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

async function detonar() {

    await renderPrediction();

    // sonido();

    if(boolGui){
	guiFunc(); 
    }
    
    loaderHTML.style.display = 'none';

    console.log('██╗  ██╗███╗   ██╗████████╗ ██╗\n██║  ██║████╗  ██║╚══██╔══╝███║\n███████║██╔██╗ ██║   ██║   ╚██║\n╚════██║██║╚██╗██║   ██║    ██║\n     ██║██║ ╚████║   ██║    ██║\n     ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═╝'); // fps();
    inicio = Date.now();
    // respawn.start(); 
}

/*
function cols() {
    colores = [new THREE.Color( 0x59181E ),
	       new THREE.Color( 0x5C1452 ),
	       new THREE.Color( 0x45195C ),
	       new THREE.Color( 0x25145C ),
	       new THREE.Color( 0x000000 )];
}
*/

function materiales() {

    materialC = new THREE.MeshStandardMaterial( {
	roughness: 0.2,
	color: 0xffffff,
	metalness: 0.7,
	bumpScale: 0.0005,
	side: THREE.DoubleSide,
	// map: texture
    } );

    materialC2 = new THREE.MeshBasicMaterial( {
	map: texture,
	side: THREE.DoubleSide,
    } );

}

function modoEx(){
    exBool = true;
    transcurso  = 0; 
    initsc0(); 
    escenasFolder.close();
    videoFolder.close();
    audioFolder.close(); 
}

function modoCot(){
    exBool = false;
    transcurso = 0;
    escenasFolder.open();
    videoFolder.open();
    audioFolder.open(); 
    // initsc0();
    // options['exhibicion']= false; 
}

function cotEscena1(){

    modoOscuro = false; 
    escena = 1;
    rmsc1();
    rmsc2();
    rmIrises(); 
    initsc1();

}

function cotEscena2(){
    //console.log("Segunda Escena"); 
    // segundo = transcurso.toFixed();
    // aquí puede ir algo asociado a las predicciones 
    modoOscuro = false; 
    escena = 3;
    rmsc1();
    rmsc2();
    initsc2();
    //transcurso = 0; 
}

//////////////////// PARPADEO

function initBlinkRateCalculator() {
  rateInterval = setInterval(() => {
    blinkRate = tempBlinkRate * 6;
    tempBlinkRate = 0;
  }, 10000);
}

function updateBlinkRate() {
  tempBlinkRate++;
}

function getEucledianDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function getEAR(upper, lower) {
  return (
    (getEucledianDistance(upper[5][0], upper[5][1], lower[4][0], lower[4][1]) +
      getEucledianDistance(
        upper[3][0],
        upper[3][1],
        lower[2][0],
        lower[2][1]
      )) /
    (2 *
      getEucledianDistance(upper[0][0], upper[0][1], upper[8][0], upper[8][1]))
  );
}

function getIsVoluntaryBlink(blinkDetected) {
  if (blinkDetected) {
    if (blinked) {
      return true;
    }
    blinked = true;
  } else {
    blinked = false;
  }
  return false;
}

function loadFont(){
    const loader = new THREE.FontLoader();
    loader.load( 'fonts/cimatics.json', function ( response ) {
	antifont = response;
    } );
}

function sonido(){

    
    var fondos = new Tone.Players({
	"0": "audio/fondos/0.mp3",
	"1": "audio/fondos/1.mp3",
	"2": "audio/fondos/2.mp3",
	"3": "audio/fondos/3.mp3",
	"4": "audio/fondos/4.mp3",
	"5": "audio/fondos/5.mp3",
	"6": "audio/fondos/6.mp3",
	"7": "audio/fondos/7.mp3",
	"8": "audio/fondos/8.mp3",
	"9": "audio/fondos/9.mp3",
	"10": "audio/fondos/10.mp3",
	"11": "audio/fondos/11.mp3",
	"12": "audio/fondos/12.mp3",
	"13": "audio/fondos/13.mp3",
	"14": "audio/fondos/14.mp3",
	"15": "audio/fondos/15.mp3"
    }).toDestination();

    fondos.volume.value = -6;

// Textos generales 

loopOf = new Tone.Loop((time) => {
    if(boolText){
	chtexto(
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    txtsc1[Math.floor(Math.random()*txtsc1.length)],
	    Math.random()*20 - 10,
	    Math.random()*40 - 20,
	    Math.random()*20 - 10,
	    Math.random()*40 - 20
	);
    }
    let fondosAl = Math.floor(Math.random()*14);
    fondos.player(fondosAl.toString()).start(time);   
}, "4");

loopRod = new Tone.Loop((time) => {
    if(boolText){
	chtexto(
	    txtsc2[Math.floor(Math.random()*txtsc2.length)],
	    txtsc2[Math.floor(Math.random()*txtsc2.length)],
	    Math.random()*20 - 10,
	    Math.random()*40 - 20,
	    Math.random()*20 - 10,
	    Math.random()*40 - 10
	);
    }
    let fondosAl = Math.floor(Math.random()*14);
    fondos.player(fondosAl.toString()).start(time);   
}, "4");

// Instrucciones 

loopTxt = new Tone.Loop((time) => {
    if(boolText){
	chtexto(
	    txtInstrucciones[Math.floor(Math.random()*txtInstrucciones.length)],
	    txtInstrucciones[Math.floor(Math.random()*txtInstrucciones.length)],
	    Math.random()*40 - 20,
	    Math.random()*40  -20,
	    Math.random()*40 - 20,
	    Math.random()*40 - 20
	);
    }	
}, "10");

// Descanso 

loopTres = new Tone.Loop((time) => {
    if(boolText){
	chtexto(
	    txtsc3[Math.floor(Math.random()*txtsc3.length)],
	    txtsc3[Math.floor(Math.random()*txtsc3.length)],
	    Math.random()*20 - 0,
	    Math.random()*40 - 30,
	    Math.random()*20 - 0,
	    Math.random()*40 - 30
	); 
    }
}, "4");

Tone.Transport.start();

    
    line = new Tone.Player('audio/fondos/line.mp3').toDestination(); 
    antiKick = new Tone.Player('audio/perc/antiKick.mp3').toDestination();
    respawn = new Tone.Player('audio/perc/respawn.mp3').toDestination(); 
    out = new Tone.Player('audio/perc/out.mp3').toDestination(); 
    intro = new Tone.Player('audio/fondos/espera.mp3').toDestination();
    intro.loop = true; 
    
    intro.volume.value = -6;
    respawn.volume.value = -6;
    out.volume.value = -6;
    line.volume.value = -6;
    
    outline = new Tone.Player('audio/fondos/outline.mp3').toDestination(); 
    outline.volume.value = -6;

/*
const panner = new Tone.Panner3D({
	panningModel: 'HRTF',
    });

*/

// let aKurd = [ 24, 26, 30, 36, 38, 40, 46 ];

let hira = [ 24, 26, 27, 31, 32 ];

// console.log( hira ); 

hira.push(hira[4] + ( hira[1] - hira[0] ));
hira.shift();

    /*
    freeverb = new Tone.Reverb().toDestination();
    // freeverb.dampening = 50;
    freeverb.decay = 5.2;
    freeverb.preDelay = 0.5;
    // freeverb.wet = 0.1
    */

    distortion = new Tone.Distortion(0.15).toDestination() ;
    
    pitchShift = new Tone.PitchShift().connect(distortion);
    pitchShift.pitch = -4;
    pitchShift.windowSize = 0.2;
    pitchShift.sampleTIme = 0.85; 

    mic = new Tone.UserMedia(2);

    panner = new Tone.Panner(0).connect(pitchShift) ;
    
    if(boolMic){
	mic.open().then(() => {
	    openmic = true;
	    mic.connect( panner ); 
	});
    }

/*
const kick = new Tone.MembraneSynth({
    envelope: {
	sustain: 0,
	attack: 0.002,
	decay: 0.05
    },
    octaves: 10,
    pitchDecay: 0.01,
}).connect(panner);
*/

    if(boolSynth){
	const kick = new Tone.MembraneSynth({
	    pitchDecay: 0.008,
	    octaves: 12,
	    envelope: {
		attack: 0.0006,
		decay: 0.5,
		sustain: 0
	    }
	}).connect(panner);
	
	let pbRate = [0.25, 6/4, 2.5/4, 0.5, 2, 3/2, 5/4];
	
	randDiv = Math.floor(Math.random() * 4) + 1; 
	console.log(randDiv+'n' ); 
	
	loopS = new Tone.Loop((time) => {
	    
	    let rand = Math.floor(Math.random() * 5); 
	    let hiraNote = Tone.Frequency(hira[rand]+12, "midi").toNote();
	    // console.log(hiraNote); 
	    kick.triggerAttackRelease(hiraNote, '4n', time );
	    //synth.triggerAttack(hiraNote, now );
	    //synth.triggerRelease(now + 1)
	    
	    loopS.playbackRate = pbRate[Math.floor(Math.random() * pbRate.length)] / 2; 
	    console.log(randDiv+'n' ); 
	    hira.push(hira[4] + ( hira[1] - hira[0] ));
	    hira.shift();
	    console.log(hira[0]);
	    
	    if(hira[0] > 70 ){
		hira = [ hira[0]-48, hira[1]-48, hira[2]-48, hira[3]-48, hira[4]-48 ];
	    }
	    
	}, '4n' ).start(0); 

	
    Tone.Transport.bpm.rampTo(50, 20);

    }

    
}

video = document.getElementById( 'video' );

// const texture = new THREE.VideoTexture( video );

// texture.wrapS = THREE.RepeatWrapping;
// texture.repeat.x = - 1;
// texture.rotation.y = Math.PI / 2;

/*

// para osc

// const OSC = require('osc-js'); // pal osc
// const osc = new OSC();
// const osc = new OSC({ plugin: new OSC.WebsocketServerPlugin() })


async function oscSend(){

    // osc.open();

    // Creo que cada mitad tiene 16 menos uno 15 - 30 puntos en total
    // 76 - 93 sin 79
    // 310 - 327 sin 323

    // keypoints en x
    /*
    osc.on('open', () => {
	setInterval(function(){
	    const message = new OSC.Message('/kpxBoca');
	    for(let i = 76; i < 93; i++){
		if(i != 79){
		    message.add( keypoints[i][0]);
		}
		if((i+234) != 323){
		    message.add( keypoints[i+234][0]);
		}
	    }
	    osc.send(message);
	    // synth.triggerAttackRelease("C4", "8n"); // para enviar una señal cada cierto tiempo
	}, 1000);
    })

    // keypoints en y

    osc.on('open', () => {
	setInterval(function(){
	    const message = new OSC.Message('/kpyBoca');
	    for(let i = 76; i < 93; i++){
		if(i != 79){
		    message.add( keypoints[i][1]);
		}
		if((i+234) != 323){
		    message.add( keypoints[i+234][1]);
		}
	    }
	    osc.send(message);
	}, 100);
    })

    // keypoints en z

    osc.on('open', () => {
	setInterval(function(){
	    const message = new OSC.Message('/kpzBoca');
	    for(let i = 76; i < 93; i++){
		if(i != 79){
		    message.add( keypoints[i][2]);
		}
		if((i+234) != 323){
		    message.add( keypoints[i+234][2]);
		}
	    }
	    osc.send(message);
	}, 100);
    })
}

*/
