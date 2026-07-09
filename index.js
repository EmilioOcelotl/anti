
/////////// 4NT1 /////////////////

import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow-models/face-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as faceMesh from '@mediapipe/face_mesh';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as THREE from 'three';
import {TRIANGULATION} from './js/triangulation';
import Stats from 'stats.js';
import {EffectComposer} from './jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './jsm/postprocessing/UnrealBloomPass.js';
import {GlitchPass} from './jsm/postprocessing/GlitchPass.js';
import {TTFLoader} from './jsm/loaders/TTFLoader.js';
import {AfterimagePass} from './jsm/postprocessing/AfterimagePass.js';
import {ImprovedNoise} from './jsm/math/ImprovedNoise.js';
import { GUI } from './jsm/libs/dat.gui.module.js';
// Import profundo a propósito: el index de treslib reexporta clases que
// importan hydra-synth/three (peerDeps que anti no cubre); GrainEngine es
// autocontenido y no arrastra nada al build de Parcel.
import { GrainEngine } from 'treslib/src/GrainEngine.js';
import { GrainSequencer } from 'treslib/src/GrainSequencer.js';
import { AudioBufferRecorder } from 'treslib/src/AudioBufferRecorder.js';
// const TWEEN = require('@tweenjs/tween.js')

///////////////////// Variables importantes

let boolText = true; 
let boolGui = false; 
let boolStats = false; 
// M4: el mic lo gobierna el botón visible (#micButton), apagado por defecto
// — evita retroalimentación y hace explícito el gesto de ceder la voz. Hoy
// solo gobierna el estado; M5 le conecta la voz granulada
// (micSource → AudioBufferRecorder → GrainEngine).
let micActivo = false;
let numCasos = 13; 
let boton = false;
let irises = false; // costoso. Evaluar

// Cronología de la pieza (modo exhibición). Única fuente de verdad de los
// tiempos: editar aquí cambia toda la duración sin tocar score().
// Cada fase se activa cuando `transcurso` (segundos) cruza su `inicio`.
// titulo1 es el estado inicial (lo arma initsc0), por eso no tiene `accion`.
const TIMELINE = [
    { nombre: 'titulo1',  inicio: 0,   fin: 5                                                          },
    { nombre: 'escena1',  inicio: 5,   fin: 35,  escena: 1, modoOscuro: false, accion: () => initsc1()  },
    { nombre: 'titulo2',  inicio: 35,  fin: 40,  escena: 2,                    accion: () => titulo2()  },
    { nombre: 'escena2',  inicio: 40,  fin: 70,  escena: 3, modoOscuro: false, accion: () => initsc2()  },
    { nombre: 'titulo3',  inicio: 70,  fin: 75,  escena: 4,                    accion: () => titulo3()  },
    { nombre: 'escena3',  inicio: 75,  fin: 105, escena: 5, modoOscuro: true,  accion: () => initsc3()  },
    { nombre: 'reinicio', inicio: 105, fin: 105, escena: 6,                    accion: () => reinicio() },
];

// con boton

document.querySelector('#startButton').addEventListener('click', async () => {
    // M4: el gesto del usuario desbloquea el AudioContext propio (antes Tone.start()).
    await audioCtx().resume();
    micButton.style.display = 'block';
    if (libre) {
	hud.style.display = 'block';
	actualizarHud();
    }
    init();
})

// HUD mínimo (previo a la GUI de Fase 7): barra de ofuscación + vuelta ·
// corpus · muestra. Solo tiene sentido en modo libre.
const hud = document.getElementById('hud');
const hudNivel = document.getElementById('hudNivel');
const hudTexto = document.getElementById('hudTexto');
function actualizarHud(){
    hudNivel.style.width = (ofuscacion * 100) + '%';
    hudTexto.textContent = 'vuelta ' + (vueltaCorpus + 1) + ' · ' +
	['manifiesto', 'escritura', 'manual'][vueltaCorpus % 3] +
	' · muestra ' + granoIndice;
}

// M4/M5: botón de mic, apagado por defecto. Enciende/apaga la voz granulada
// (Capa B); al apagar, el buffer rodante se borra — nada persiste.
const micButton = document.getElementById('micButton');
micButton.addEventListener('click', () => {
    micActivo = !micActivo;
    micButton.textContent = micActivo ? 'mic encendido' : 'mic apagado';
    if (micActivo) {
	encenderVoz();
    } else {
	apagarVoz();
    }
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
const loaderText = document.getElementById('loaderText');
const buscandoText = document.getElementById('buscandoText');
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
let rostroVisto = false; // se vuelve true al detectar el primer rostro (guía de onboarding)
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
// Amplitud de deformación de los triángulos en animsc1 (0.125 = la amplitud
// histórica, que estaba hardcodeada). En modo libre se sobreescribe por frame.
let perlinAmp = 0.125;
let cuboGBool = false;

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
// Modo libre (default): la pieza no avanza por la cronología de exhibición.
// El usuario explora/ofusca sin tiempo determinado. Exhibición dormida: el
// TIMELINE y score() siguen intactos, pero score() sale temprano si `libre`.
let libre = true;
// Fase 1 (modo libre) — calibración de la señal de movimiento. avg se suaviza
// con media móvil exponencial y se normaliza a [0,1]; estas constantes
// dependen de FPS y resolución, se afinan con cámara.
const AVG_SUAVIZADO = 0.98;  // fracción del avg previo que se conserva por frame
const AVG_PISO = 0.4;        // avg (px/frame) por debajo del cual es jitter de FaceMesh, no movimiento
const AVG_MAX = 5;           // avg (px/frame) que cuenta como movimiento máximo
const PERLIN_QUIETO = 0.003; // perlinValue (frecuencia espacial del ruido) con el rostro quieto
const PERLIN_MOVIDO = 0.12;  // perlinValue en movimiento máximo
const AMP_QUIETO = 0.06;     // perlinAmp (amplitud de deformación) con el rostro quieto
const AMP_MOVIDO = 0.12;     // perlinAmp en movimiento máximo
// Fase 2 — acumulador `ofuscacion` ∈ [0,1]: integra movimiento, decae al
// detenerse, efímero (nunca se guarda). El cuerpo es el reloj.
const OFU_SUBIDA = 0.004;    // aporte por frame a movimiento máximo (~4 s sostenidos para llegar a 1)
const OFU_BAJADA = 0.001;    // decaimiento por frame (~17 s de quietud para volver a 0)
const DAMP_BASE = 0.85;      // afterimage en reposo (valor histórico de initsc1)
const DAMP_TOPE = 0.96;      // afterimage en máxima ofuscación (trazas largas, sin white-out)
const OPACIDAD_PISO = 0.15;  // opacidad mínima del video: la cámara se difumina pero no desaparece
// Fase 2 — lecho granular (Capa A, treslib). `ofuscacion` gobierna densidad y
// nivel; el pointer recorre la muestra conforme te ofuscas; el movimiento
// instantáneo agrega jitter de posición/pitch.
const GRANO_MUESTRA = 0;     // muestra inicial de audio/fondos/
const GRANO_TOTAL = 16;      // muestras numeradas 0..15, recorridas en orden numérico
// Avance por picos (adelanto solo-audio de la "vuelta" de Fase 4): tocar el
// techo de ofuscación arma el cambio de muestra; volver a la base lo ejecuta,
// justo cuando la amplitud está en el piso y el pointer cerca de 0 — el swap
// es casi inaudible. Cada ciclo esfuerzo→relajación entrega material nuevo.
const OFU_TECHO = 0.95;      // ofuscación que cuenta como pico (arma el avance)
const OFU_BASE = 0.2;        // ofuscación de regreso a base (ejecuta el avance)
const GRANO_VENTANA = 0.08;  // windowSize (s) de cada grano
const GRANO_AMP_BASE = 0.1;  // nivel en reposo (granos escasos, nunca silencio total con rostro)
const GRANO_AMP_TOPE = 0.7;  // nivel en máxima ofuscación
const GRANO_OVERLAPS_MAX = 8;// granos simultáneos en máxima ofuscación (mínimo 1)
// M3 — GrainSequencer (treslib): un solo reloj para granos y texto.
const SEQ_BPM = 30;           // tempo de la pieza: 2 s por beat
const SEQ_STEPS_POR_BEAT = 2; // resolución del grid: 1 step = 1 s
// Micro-ritmo del lecho — los ejes que el cuerpo no toca. rate emparentado
// con los pbRate del synth retirado; windowSize respira alrededor de GRANO_VENTANA.
const SEQ_RATE_PATRON = [1, 1.5, 1, 0.5, 1, 2, 0.75, 1];
const SEQ_VENTANA_PATRON = [0.08, 0.1, 0.06, 0.12, 0.08, 0.05, 0.14, 0.08];
// Scrub del pointer por step, alrededor de la base que pone el cuerpo (ofuscación).
const SEQ_POINTER_PATRON = [0, 0.03, -0.02, 0.05, 0, -0.04, 0.02, 0.06];
// Suavizado de parámetros del motor: GrainEngine interpola cada parámetro
// por grano a lo largo de smoothingTime. Casi un step completo (0.9 s) para
// que pointer y rate se deslicen entre valores (se escucha el recorrido)
// en vez de saltar. Es global al motor: suaviza todos sus parámetros.
const GRANO_SUAVIZADO = 0.9;
const TEXTO_CADA_STEPS = 4;   // cadencia de texto con rostro (~4 s, la histórica)
const TEXTO_ESPERA_STEPS = 8; // cadencia de instrucciones en espera, más pausada
const OFU_TXT_BANDA = 0.35;   // banda de ofuscación: debajo instrucciones, encima manifiesto
// M5 — Capa B: voz granulada. Buffer rodante del mic (efímero: se
// sobreescribe siempre, se borra al apagar — nunca se guarda) granulado con
// un GrainEngine propio. El pointer sigue la cabeza de escritura con un
// retraso corto: tu voz casi en vivo. Quieto se oye poco velada; la
// ofuscación la dispersa. Todos sus parámetros son del cuerpo (por frame);
// el secuenciador no toca este motor.
const VOZ_BUFFER_S = 4;          // duración del buffer rodante (s)
const VOZ_RETRASO = 0.35;        // s detrás de la cabeza de escritura (> ventana máxima)
// Crossfade directa↔granulada: en reposo la voz pasa (casi) directa y se
// entiende; la ofuscación la disuelve en granos (directa baja, granular sube).
const VOZ_DIRECTA_AMP = 0.8;     // nivel de la vía directa en reposo
const VOZ_AMP = 0.5;             // nivel de la voz granulada en máxima ofuscación
const VOZ_VENTANA_QUIETO = 0.18; // granos largos: voz casi íntegra
const VOZ_VENTANA_MOVIDO = 0.06; // granos cortos en máxima ofuscación
const VOZ_OVERLAPS_QUIETO = 2;
const VOZ_OVERLAPS_MOVIDO = 6;
const VOZ_PITCH_MOVIDO = 0.6;    // randomPitch en máxima ofuscación
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

let avg = 0;
let ofuscacion = 0;     // acumulador del modo libre (Fase 2), efímero
let grainEngine = null; // lecho granular treslib (Capa A), null hasta cargar la muestra
let grainSeq = null;    // GrainSequencer (M3): el reloj único de granos y texto
let vozEngine = null;   // GrainEngine de la voz (M5), null hasta encender el mic
let vozRecorder = null; // AudioBufferRecorder: buffer rodante del mic, efímero
let vozMicSource = null;
let vozDirecta = null;  // GainNode de la vía directa (crossfade con la granular)
let granoIndice = GRANO_MUESTRA; // muestra actual del recorrido (avanza por picos)
let picoArmado = false;          // tocó el techo; el avance se ejecuta al volver a la base
// Fase 4: cada pico completo (techo→base) es una "vuelta" que rota el corpus
// de texto — txtsc1 (manifiesto) → txtsc2 (escritura) → txtsc3 (el manual) →
// de vuelta al 1 ("rota, no hay un centro"). Se evapora si el rostro sale
// del cuadro. (Distinto de `vueltas`, el contador de triángulos por frame.)
let vueltaCorpus = 0;
let granoBuffers = {};           // caché corto de AudioBuffers: muestra actual + siguiente (lookahead)
let velarriba, velabajo, velizquierda, velderecha;
let trigeom = new THREE.BufferGeometry();
let trimesh = new THREE.Mesh();
let triCantidad = 880; // un parámetro que podríamoso cambiar
let blackPlane;

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
    loaderText.style.display = 'none';
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
	    // Cámara y micrófono en un solo permiso, para evitar un segundo
	    // prompt: el track de audio queda en reserva para la voz granulada
	    // de M5 (se activa con el botón de mic, apagado por defecto).
	    'audio': true,
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
    // El stream trae audio; silenciamos el <video> para que el micrófono
    // nunca se reproduzca crudo por las bocinas.
    video.muted = true;
    let {width, height} = stream.getVideoTracks()[0].getSettings();
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

    trigeom.attributes.position.needsUpdate = true;

    // Guía de onboarding: pide acercar el rostro solo hasta la primera detección;
    // una vez visto el rostro no reaparece aunque la cara salga entre escenas.
    if (predictions.length > 0) rostroVisto = true;
    buscandoText.style.display = (buscando && !rostroVisto) ? 'block' : 'none';

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

    // Señal de movimiento (Fase 1, modo libre): velocidad promedio de los
    // keypoints entre frames → avg suavizado → perlinValue. Si el rostro sale
    // del cuadro, keypoints se queda con el último frame → vels caen a 0 y
    // avg decae solo ("quieto se aquieta").
    if (libre && keypoints.length > 0) {
	for (let i = 0; i < keypoints.length; i++) {
	    keyanteriorX[i] = keyactualX[i];
	    keyactualX[i] = keypoints[i][0];
	    // || 0 cubre el primer frame (keyanterior undefined → NaN)
	    velsX[i] = Math.abs(keyanteriorX[i] - keyactualX[i]) || 0;

	    keyanteriorY[i] = keyactualY[i];
	    keyactualY[i] = keypoints[i][1];
	    velsY[i] = Math.abs(keyanteriorY[i] - keyactualY[i]) || 0;

	    vels[i] = (velsX[i] + velsY[i]) / 2;
	}
	const cruda = (vels.reduce((a, b) => a + b, 0) / vels.length) || 0;
	avg = avg * AVG_SUAVIZADO + cruda * (1 - AVG_SUAVIZADO);
	// normalizado [0,1] descontando el piso de jitter
	const movimiento = Math.min(Math.max((avg - AVG_PISO) / (AVG_MAX - AVG_PISO), 0), 1);
	perlinValue = PERLIN_QUIETO + (PERLIN_MOVIDO - PERLIN_QUIETO) * movimiento;
	perlinAmp = AMP_QUIETO + (AMP_MOVIDO - AMP_QUIETO) * movimiento;

	// Acumulador de ofuscación (Fase 2): integra el movimiento y decae
	// al detenerse. Gobierna la capa lenta: trazas, opacidad del video
	// y densidad/nivel del lecho granular.
	ofuscacion = Math.min(1, Math.max(0, ofuscacion + movimiento * OFU_SUBIDA - OFU_BAJADA));

	afterimagePass.uniforms['damp'].value = DAMP_BASE + (DAMP_TOPE - DAMP_BASE) * ofuscacion;
	// La cámara se difumina con la ofuscación pero nunca desaparece
	// (los triángulos siguen: presencia dispersa, no borrada).
	planeVideo.material.opacity = 1 - (1 - OPACIDAD_PISO) * ofuscacion;

	if (grainEngine) {
	    // El pointer ya no se escribe aquí: es del secuenciador (M3),
	    // que lo cuantiza al grid con base en esta misma ofuscación.
	    grainEngine.setOverlaps(1 + (GRANO_OVERLAPS_MAX - 1) * ofuscacion);
	    grainEngine.setMasterAmp(GRANO_AMP_BASE + (GRANO_AMP_TOPE - GRANO_AMP_BASE) * ofuscacion);
	    grainEngine.setParamAtTime('randomPosition', movimiento);
	    grainEngine.setParamAtTime('randomPitch', movimiento * 0.5);

	    // Recorrido por picos: techo arma (y revela la línea-hito de la
	    // vuelta), base ejecuta — material nuevo en audio Y texto.
	    if (ofuscacion >= OFU_TECHO && !picoArmado) {
		picoArmado = true;
		revelarHito();
	    }
	    if (picoArmado && ofuscacion <= OFU_BASE) {
		picoArmado = false;
		avanzarMuestra();
		vueltaCorpus++; // Fase 4: la vuelta rota el corpus de texto
	    }
	}

	actualizarHud();

	// Voz granulada (M5): el cuerpo escribe todos sus parámetros por
	// frame (el secuenciador no toca este motor). Reintento perezoso por
	// si el botón se encendió antes de que existiera el stream.
	if (micActivo && !vozEngine) encenderVoz();
	if (micActivo && vozEngine) {
	    // Crossfade directa↔granulada: la ofuscación disuelve la voz.
	    vozDirecta.gain.setTargetAtTime(
		VOZ_DIRECTA_AMP * (1 - ofuscacion), audioCtx().currentTime, 0.05);
	    vozEngine.setMasterAmp(VOZ_AMP * ofuscacion);
	    vozEngine.setParamAtTime('windowSize',
		VOZ_VENTANA_QUIETO + (VOZ_VENTANA_MOVIDO - VOZ_VENTANA_QUIETO) * ofuscacion);
	    vozEngine.setOverlaps(
		VOZ_OVERLAPS_QUIETO + (VOZ_OVERLAPS_MOVIDO - VOZ_OVERLAPS_QUIETO) * ofuscacion);
	    vozEngine.setParamAtTime('randomPitch', VOZ_PITCH_MOVIDO * ofuscacion);
	    vozEngine.setParamAtTime('randomPosition', movimiento);
	    // El pointer persigue la cabeza de escritura con retraso corto:
	    // lo recién dicho, granulado casi en vivo.
	    const cabeza = vozRecorder.currentPosition / vozRecorder.bufferSize;
	    const retraso = VOZ_RETRASO / VOZ_BUFFER_S;
	    vozEngine.setParamAtTime('pointer', (cabeza - retraso + 1) % 1);
	}
    }

    // arriba 10
    // abajo 152
    // izq 234
    // der 454
    // promedios dependiendo de puntos específicos

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
    // Modo web abierta: el cursor permanece visible (antes se ocultaba para kiosko).
    loaderHTML.style.display = 'block';
    loaderText.style.display = 'block';

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

    // Geometria fusionada: un solo BufferGeometry con los triCantidad triangulos
    // (triCantidad * 3 vertices) y un solo Mesh. Antes eran triCantidad geometrias
    // y triCantidad meshes => triCantidad draw calls por frame; ahora es 1.
    const triPositionArray = new Float32Array( triCantidad * 3 * 3 );
    const triUvArray = new Float32Array( triCantidad * 3 * 2 );
    for(let t = 0; t < triCantidad; t++){
	triUvArray.set( [0.0, 0.0, 1.0, 0.0, 1.0, 1.0], t * 6 );
    }

    trigeom = new THREE.BufferGeometry();
    trigeom.setAttribute( 'position', new THREE.BufferAttribute( triPositionArray, 3 ) );
    trigeom.setAttribute( 'uv', new THREE.BufferAttribute( triUvArray, 2 ) );
    trigeom.attributes.position.usage = THREE.DynamicDrawUsage;
    trimesh = new THREE.Mesh( trigeom, trimaterial );

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
	// M3: el texto de espera (instrucciones) lo despacha el secuenciador
	// vía !buscando (despacharTexto); los loops de Tone murieron.
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

	scene.remove(trimesh);

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
	// Fase 4: sin rostro, el progreso se evapora — la ofuscación cae a 0
	// y las vueltas vuelven al manifiesto. Nada persiste.
	ofuscacion = 0;
	picoArmado = false;
	vueltaCorpus = 0;
	if (libre) actualizarHud();
	scene.remove( cuboGrande );
	intro.restart(); // que se detone hasta que la libería esté cargada
	// intro.start();

    } else {

	planeVideo.geometry.dispose();
	const geometryVideoNew = new THREE.PlaneGeometry( camWidth/camSz, camHeight/camSz );
	planeVideo.geometry = geometryVideoNew; 
	materialVideo.map = new THREE.VideoTexture( video );
	matLite.map = vit; 
	matLite.blending = THREE.AdditiveBlending; 
	// respawn.start(); // esto antes hacia ruido  
	// Modo libre: entrar directo a la escena de ofuscación persistente
	// (escena 1) en vez del título; la cronología (score/TIMELINE) queda
	// dormida y el usuario se queda aquí sin auto-avanzar ni reiniciar.
	if (libre) {
		escena = 1;
		scene.background = vit;
		selektor(Math.floor(Math.random() * numCasos));
		initsc1();
	} else {
		escena = 0;
		titulo1();
	}
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

    matPoints[0].size = 0;
    scene.background = vit; 
    selektor(Math.floor(Math.random() * numCasos)); 
    scene.add(blackPlane); 
    outline.stop(0);
    line.stop(0); 
    // console.log("titulo 1 ");
    
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

    scene.remove(trimesh);
    
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
    
    line.stop();
    outline.stop();
    irises = false;    
    afterimagePass.uniforms['damp'].value = 0.85;
    perlinValue = 0.03;
    // Antes 4, pero nunca se leía; ahora animsc1 la usa como amplitud real:
    // 0.125 conserva el aspecto original de la escena en exhibición.
    perlinAmp = 0.125;
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
    scene.add(trimesh);
    */

    scene.add(trimesh);

    
   
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
	const triPos = trigeom.attributes.position.array;
	predictions.forEach((prediction) => {
	    arre = arre.flat(2);
	    for(let j = 0; j < triCantidad; j++){
		let d = perlin.noise(
		    arre[triconta*3] * perlinValue + time2,
		    arre[(triconta*3)+1] * perlinValue + time2,
		    arre[(triconta*3)+2] * perlinValue + time2) * perlinAmp;
		for(let i = 0; i < 3; i++){
		    const base = triconta * 3;
		    triPos[base]     = (arre[base] * 0.12 - wCor) * (1.1 + d);
		    triPos[base + 1] = (arre[base + 1] * 0.12 - hCor) * (1.1 + d);
		    triPos[base + 2] = (arre[base + 2] * 0.05) * (1 + d);
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

    scene.remove(trimesh);
 
    
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
    // M3: exhibición despierta — material nuevo del lecho al entrar a escena
    // (traduce el viejo sorteo de fondos).
    if (!libre) avanzarMuestra();
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

    scene.add(trimesh);

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
    const triPos = trigeom.attributes.position.array;
    
    for(let j = 0; j < triCantidad; j++){	
	
	let d = perlin.noise(
	    arre[triconta*3] * perlinValue + time2,
	    arre[(triconta*3)+1] * perlinValue + time2,
	    arre[(triconta*3)+2] * perlinValue + time2) *  0.5; 
	
	for(let i = 0; i < 3; i++){
	    const base = triconta * 3;
	    triPos[base]     = (arre[base] * 0.12 - wCor) * (1.2 + d);
	    triPos[base + 1] = (arre[base + 1] * 0.12 - hCor) * (1.2 + d);
	    triPos[base + 2] = (arre[base + 2] * 0.05) * (1.2 * d);
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

    scene.remove(trimesh);
    
   
    
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
    // M3: exhibición despierta — material nuevo del lecho al entrar a escena.
    if (!libre) avanzarMuestra();
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

    scene.add(trimesh);

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
    const triPos = trigeom.attributes.position.array;
    
    for(let j = 0; j < triCantidad; j++){	
	
	let d = perlin.noise(
	    arre[triconta*3] * perlinValue + time2,
	    arre[(triconta*3)+1] * perlinValue + time2,
	    arre[(triconta*3)+2] * perlinValue + time2) *  0.5; 
	
	for(let i = 0; i < 3; i++){
	    const base = triconta * 3;
	    triPos[base]     = (arre[base] * 0.12 - wCor) * (1.2 + d);
	    triPos[base + 1] = (arre[base + 1] * 0.12 - hCor) * (1.2 + d);
	    triPos[base + 2] = (arre[base + 2] * 0.05) * (1.2 * d);
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

// Avanza la máquina de estados de escenas según la cronología en `TIMELINE`.
function score() {

    // Modo libre: cronología de exhibición suspendida (ver `libre`).
    if (libre) return;

    if (!buscando) return;

    // Segundo entero transcurrido. `segundo` recuerda el último ya procesado
    // para que cada fase se dispare una sola vez.
    const t = Number(transcurso.toFixed());
    if (t === segundo) return;

    const fase = TIMELINE.find((f) => f.inicio === t && f.accion);
    if (!fase) return;

    segundo = t;
    if (fase.modoOscuro !== undefined) modoOscuro = fase.modoOscuro;
    escena = fase.escena;
    rmsc1();
    rmsc2();
    rmsc3();
    fase.accion();
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
	// M2: murió `fondos` (y con él, el crash de alcance si boolGui=true).
	// Fase 7 reencuadra este control sobre el lecho granular.
    })

    // M4: murieron los controles de voz/grano/altura (operaban la cadena de
    // mic de Tone). Fase 7 los reencuadra como técnicas de ofuscación sobre
    // la voz granulada de M5.

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
    loaderText.style.display = 'none';

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

// M1/M4 (migración Tone→treslib): fuente única de AudioContext, ya propio
// (sin Tone). El gesto del botón de inicio lo desbloquea con resume().
let _audioCtx = null;
function audioCtx(){
    if (!_audioCtx) _audioCtx = new AudioContext();
    return _audioCtx;
}

// Capa A (Fase 2): carga una muestra de fondos/ y arranca el motor granular
// de treslib sobre el mismo AudioContext que ya usa Tone (un solo contexto,
// mismo permiso). El motor nace escaso y quieto; el bloque de movimiento de
// renderPrediction lo gobierna por frame vía `ofuscacion` y `movimiento`.
async function initGranular(){
    try {
	const ctx = audioCtx();
	const buffer = await cargarMuestra(granoIndice);
	grainEngine = new GrainEngine(ctx, buffer, {
	    pointer: 0,
	    rate: 1,
	    overlaps: 1,
	    windowSize: GRANO_VENTANA,
	});
	grainEngine.smoothingTime = GRANO_SUAVIZADO;
	grainEngine.setMasterAmp(GRANO_AMP_BASE);
	grainEngine.connect(ctx.destination);
	grainEngine.start();
	initSecuenciador();
	// Lookahead: la siguiente muestra se descarga durante el ciclo, para
	// que el avance por pico nunca espere red. Si falla, cargarMuestra
	// limpia el caché y el avance la reintenta.
	cargarMuestra((granoIndice + 1) % GRANO_TOTAL).catch(() => {});
    } catch (err) {
	// Sin lecho granular la pieza sigue (solo visual); no es fatal.
	console.warn('Lecho granular no disponible:', err);
    }
}

// Descarga y decodifica una muestra de fondos/, con caché corto (la actual y
// la siguiente; las demás se sueltan al avanzar — nada se acumula).
function cargarMuestra(i){
    if (!granoBuffers[i]) {
	const ctx = audioCtx();
	granoBuffers[i] = fetch('audio/fondos/' + i + '.mp3')
	    .then((resp) => resp.arrayBuffer())
	    .then((datos) => ctx.decodeAudioData(datos))
	    .catch((err) => {
		delete granoBuffers[i]; // reintentable en el siguiente pico
		throw err;
	    });
    }
    return granoBuffers[i];
}

// Pico completo (techo → base): la muestra siguiente entra al granulador.
// GrainEngine lee this.buffer al nacer cada grano, así que el swap es en
// caliente y sin clics; con la amplitud en el piso es casi imperceptible.
function avanzarMuestra(){
    const previa = granoIndice;
    granoIndice = (granoIndice + 1) % GRANO_TOTAL;
    const objetivo = granoIndice;
    cargarMuestra(objetivo).then((buffer) => {
	if (grainEngine && granoIndice === objetivo) {
	    grainEngine.buffer = buffer;
	    delete granoBuffers[previa];
	    console.log('lecho granular → muestra ' + objetivo);
	    cargarMuestra((objetivo + 1) % GRANO_TOTAL).catch(() => {});
	}
    }).catch((err) => {
	console.warn('No se pudo avanzar a la muestra ' + objetivo + ':', err);
    });
}

// M3: el GrainSequencer de treslib toma el reloj — un solo tempo para el
// micro-ritmo del lecho (rate/windowSize), el pointer (base del cuerpo +
// patrón de scrub, cuantizado al grid) y el pulso del texto (onStepChange).
// Propiedad de parámetros: renderPrediction escribe por frame overlaps,
// masterAmp y jitter; el secuenciador escribe por step rate, windowSize y
// pointer. Nadie escribe el parámetro del otro.
function initSecuenciador(){
    grainSeq = new GrainSequencer(audioCtx(), SEQ_BPM, SEQ_STEPS_POR_BEAT);
    grainSeq.addSequence('rate', SEQ_RATE_PATRON, grainEngine);
    grainSeq.addSequence('windowSize', SEQ_VENTANA_PATRON, grainEngine);
    grainSeq.onStepChange = (step) => {
	const scrub = SEQ_POINTER_PATRON[step % SEQ_POINTER_PATRON.length];
	const pointer = Math.min(1, Math.max(0, ofuscacion + scrub));
	grainEngine.setParamAtTime('pointer', pointer);
	despacharTexto(step);
    };
    grainSeq.start();
}

// Fase 4: el corpus de la vuelta actual. Vuelta 1 = manifiesto, 2 =
// escritura, 3 = el manual (el desbordamiento: instrucciones para ofuscarse
// fuera de la pieza); después rota de nuevo.
function corpusVuelta(){
    return [txtsc1, txtsc2, txtsc3][vueltaCorpus % 3];
}

// Fase 4: línea-hito al tocar el techo — la primera línea del corpus de la
// vuelta, centrada, como marca de capítulo en el punto de máxima ofuscación.
function revelarHito(){
    if (!boolText || !antifont) return;
    const corpus = corpusVuelta();
    if (!corpus || !corpus.length) return;
    chtexto(corpus[0], "", 0, 0, 0, 0);
}

// M3: despacho de texto al pulso del secuenciador (sustituye a los cuatro
// Tone.Loop). El corpus se decide en el momento: instrucciones en espera,
// bandas de ofuscación en libre (Fase 3), corpus por vuelta en libre alto
// (Fase 4), corpus por escena en exhibición.
function despacharTexto(step){
    // antifont/text llegan async (loadFont); el primer step puede ganarles.
    if (!boolText || !antifont || !text) return;
    const espera = !buscando;
    if (step % (espera ? TEXTO_ESPERA_STEPS : TEXTO_CADA_STEPS) !== 0) return;

    let corpus;
    if (espera) {
	corpus = txtInstrucciones;
    } else if (libre) {
	corpus = (ofuscacion < OFU_TXT_BANDA) ? txtInstrucciones : corpusVuelta();
    } else {
	// Escenas de exhibición; en títulos (2, 4, 6) no pulsa texto, como
	// cuando los loops se detenían.
	corpus = ({ 1: txtsc1, 3: txtsc2, 5: txtsc3 })[escena];
    }
    if (!corpus || !corpus.length) return;

    // Las instrucciones se abren más en pantalla (rango histórico de loopTxt).
    const rx = (corpus === txtInstrucciones) ? 40 : 20;
    chtexto(
	corpus[Math.floor(Math.random()*corpus.length)],
	corpus[Math.floor(Math.random()*corpus.length)],
	Math.random()*rx - rx/2,
	Math.random()*40 - 20,
	Math.random()*rx - rx/2,
	Math.random()*40 - 20
    );
}

// M5 (Capa B): enciende la voz granulada. El buffer rodante graba el mic en
// círculo (efímero) y el GrainEngine de voz granula lo recién dicho. Si el
// stream aún no existe (botón presionado muy temprano), renderPrediction
// reintenta en cuanto haya cámara.
function encenderVoz(){
    if (!stream || !micActivo) return;
    const ctx = audioCtx();
    if (!vozRecorder) {
	vozMicSource = ctx.createMediaStreamSource(stream);
	// connectToOutput=true: el ScriptProcessor necesita colgar del
	// destino para procesar en Chrome; su salida es silencio (no escribe
	// el buffer de salida), así que no se oye el mic crudo.
	vozRecorder = new AudioBufferRecorder(ctx, vozMicSource, VOZ_BUFFER_S, true);
    }
    vozRecorder.startRecording(); // crea un buffer nuevo (el anterior se evaporó)
    if (!vozDirecta) {
	// Vía directa: la voz se entiende en reposo; el crossfade por frame
	// la disuelve hacia la granular conforme sube la ofuscación.
	vozDirecta = ctx.createGain();
	vozDirecta.gain.value = 0; // el mapeo por frame la sube enseguida
	vozMicSource.connect(vozDirecta);
	vozDirecta.connect(ctx.destination);
    }
    if (!vozEngine) {
	vozEngine = new GrainEngine(ctx, vozRecorder.getRecordedBuffer(), {
	    pointer: 0,
	    rate: 1,
	    overlaps: VOZ_OVERLAPS_QUIETO,
	    windowSize: VOZ_VENTANA_QUIETO,
	});
	vozEngine.setMasterAmp(0); // nace muda: solo la ofuscación la trae
	vozEngine.connect(ctx.destination);
    } else {
	vozEngine.buffer = vozRecorder.getRecordedBuffer();
    }
    vozEngine.start();
}

// M5: apaga la voz y evapora el buffer — "no hay datos almacenados" sonando.
function apagarVoz(){
    if (vozDirecta) vozDirecta.gain.setTargetAtTime(0, audioCtx().currentTime, 0.02);
    if (vozEngine) vozEngine.stop();
    if (vozRecorder) {
	vozRecorder.stopRecording();
	vozRecorder.clearBuffer();
    }
}

// M2 (migración Tone→treslib): reproductor mínimo en Web Audio crudo para
// one-shots y la espera; sustituye a Tone.Player. Tolerante a la carrera de
// carga: start() antes de que llegue el buffer queda pendiente y suena al
// cargar, salvo stop() posterior (la carrera que tumbaba a loopOf).
class Reproductor {
    constructor(url, opciones = {}){
	this.loop = opciones.loop || false;
	this.nivel = 0.5; // ≈ −6 dB, el nivel histórico de estos players
	this.buffer = null;
	this.source = null;
	this.deseado = false;
	fetch(url)
	    .then((resp) => resp.arrayBuffer())
	    .then((datos) => audioCtx().decodeAudioData(datos))
	    .then((buffer) => {
		this.buffer = buffer;
		if (this.deseado) this.start();
	    })
	    .catch((err) => console.warn('No se pudo cargar ' + url + ':', err));
    }

    start(){
	this.deseado = true;
	if (!this.buffer) return; // sonará al terminar de cargar
	this.detenerFuente();
	const ctx = audioCtx();
	this.source = ctx.createBufferSource();
	this.source.buffer = this.buffer;
	this.source.loop = this.loop;
	const gain = ctx.createGain();
	gain.gain.value = this.nivel;
	this.source.connect(gain);
	gain.connect(ctx.destination);
	this.source.start();
    }

    restart(){
	this.start();
    }

    stop(){
	this.deseado = false;
	this.detenerFuente();
    }

    detenerFuente(){
	if (this.source) {
	    try { this.source.stop(); } catch (e) { /* nunca inició */ }
	    this.source.disconnect();
	    this.source = null;
	}
    }
}

function sonido(){

    
    // M2/M3: murió `fondos` (Tone.Players) y murieron los cuatro Tone.Loop
    // de texto junto con Tone.Transport — el lecho es la Capa A granular
    // (también para la exhibición despierta: su sorteo se traduce en avances
    // de muestra al entrar a escena, ver initsc2/initsc3) y el pulso del
    // texto vive en el GrainSequencer (initSecuenciador/despacharTexto).
    initGranular();

    
    // M2: one-shots y espera en Web Audio crudo, fuera de Tone. Mismos
    // nombres y llamadas (start/stop/restart); nivel −6 dB dentro de la clase.
    line = new Reproductor('audio/fondos/line.mp3');
    antiKick = new Reproductor('audio/perc/antiKick.mp3');
    respawn = new Reproductor('audio/perc/respawn.mp3');
    out = new Reproductor('audio/perc/out.mp3');
    intro = new Reproductor('audio/fondos/espera.mp3', { loop: true });
    outline = new Reproductor('audio/fondos/outline.mp3');

    // M4: murió la cadena de mic de Tone (panner → pitchShift → distortion)
    // y el synth dormido de boolSynth (MembraneSynth/loopS/hira). La voz
    // renace granular en M5: micSource (del stream unificado) →
    // AudioBufferRecorder → GrainEngine, gobernada por el botón de mic.
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
