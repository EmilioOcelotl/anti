![portada](https://github.com/EmilioOcelotl/4NT1/blob/main/img/antiyo.png)

# ANT1

La ofuscación como motivo, la escritura como rodeo. 

Anti es un llamado a la responsabilidad de los datos, al compromiso y el cuidado y a la realización de usuarixs que desdibujan las fronteras de la pasividad política y económica teniendo como epicentro lo sensible.

[Modos](https://emilioocelotl.github.io/anti/)

[Ejecución](https://github.com/EmilioOcelotl/4NT1/tree/main/ejecucion.md)

[Bitácora](https://github.com/EmilioOcelotl/anti/tree/main/bitacora) 

[Diagrama de montaje](https://github.com/EmilioOcelotl/anti/tree/main/pdf/antiEx.pdf)  

---

# Documentación técnica

Anti es una pieza de arte web que se ejecuta por completo en el navegador. Captura el rostro por cámara, lo deforma en tiempo real y genera una capa audiovisual de ofuscación sincronizada con audio procedural.

## Cómo funciona

El flujo de datos es una sola cadena que corre en cada cuadro:

```
cámara + micrófono (un permiso)
        │
        ▼
MediaPipe FaceMesh  ──►  468 puntos de referencia del rostro (keypoints)
        │
        ▼
TRIANGULATION (Delaunay predefinida)  ──►  880 triángulos
        │
        ▼
deformación con ruido Perlin 3D  ──►  un BufferGeometry fusionado (Three.js)
        │
        ▼
post-processing (afterimage) + textura de Hydra  ──►  render en pantalla
```

En paralelo, el track de audio del mismo `getUserMedia` alimenta a **Tone.js**: el micrófono pasa por `pitchShift` + `distortion` y se mezcla con loops de audio de fondo (`audio/fondos/`). La detección facial usa `@tensorflow-models/face-landmarks-detection` con runtime **mediapipe** sobre el backend WebGL de TensorFlow.js.

## Modos

- **Exhibición** — cronología fija de **105 segundos** con 6 escenas (dos títulos, tres escenas y reinicio). Los tiempos viven en un único array `TIMELINE` al inicio de `index.js`; `score()` es la máquina de estados que dispara cada fase cuando el tiempo transcurrido cruza su `inicio`. El ciclo se reinicia solo.
- **Cotidiano** — interfaz `dat.gui` para ajustar parámetros en tiempo real: opacidad, *damp* del afterimage, tamaño de puntos, escala del ruido Perlin, color, texto y audio (volumen, voz, grano y altura del pitch).

## Stack tecnológico

| Área | Herramienta |
|------|-------------|
| Render 3D | [Three.js](https://threejs.org/) `0.131.3` (con módulos locales en `jsm/`) |
| Detección facial | TensorFlow.js + [MediaPipe FaceMesh](https://google.github.io/mediapipe/) |
| Audio | [Tone.js](https://tonejs.github.io/) `14.7.77` |
| Visuales generativos | [Hydra](https://hydra.ojack.xyz/) (usado como textura) |
| Bundler / dev server | [Parcel](https://parceljs.org/) `1.x` |
| GUI de parámetros | dat.gui |

## Desarrollo

Requiere Node.js y una cámara web (con micrófono).

```bash
npm install     # instalar dependencias
npm run watch   # servidor de desarrollo, abre el navegador
npm run build   # build de producción en dist/ (copia audio, img, fonts y txt)
```

## Estructura del repositorio

```
index.html   entrada: loader, canvas de Hydra y botón de inicio
index.js     toda la lógica: detección facial, escena, audio y cronología
js/          triangulación de Delaunay y librerías auxiliares
jsm/         módulos locales de Three.js (postprocessing, loaders, math)
audio/       loops de fondo y percusión (mp3)
txt/         textos que aparecen en cada escena
fonts/       tipografías
img/         imágenes
```

## Notas de rendimiento

- Los 880 triángulos se dibujan como **un solo `BufferGeometry` fusionado** (1 draw call por cuadro en vez de 880); las posiciones se actualizan escribiendo directo al array de vértices en cada `animsc*`.
- La resolución de la textura (`textureSize`) se reduce automáticamente en dispositivos móviles.
- `TIMELINE` centraliza toda la cronología: cambiar la duración de la pieza es editar un solo array.

## Escritura

Algunas ideas-reflexiones previas/paralelas relacionadas con este proyecto se encuentran en:

- [Panorama](https://piranhalab.github.io/panorama/). Escritura de espacios libres e inmersivos para el performance audiovisual - Dorian Sotomayor, Marianne Teixido y Emilio Ocelotl (en proceso). 
- [Tres Estudios Abiertos](https://emilioocelotl.github.io/tres-estudios-abiertos/). Prácticas performáticas, audiovisuales y experimentales en el navegador - Emilio Ocelotl

## Referencias

- Comité-invisible (2014). [A nuestros amigos](http://mexico.indymedia.org/IMG/pdf/a_nuestros_amigos_-_comite_invisible.pdf).
- Cox, G. y McLean, A. (2013). Speaking Code. Coding as Aesthetic and Political Expression. The MIT Press.
- Platohedro, Correa, A., Alvarez, L. M., Fleischmann, L., Rodrı́guez, Y., Rueda, D., Jaramillo, J. A., Correa, C., y Narváez, O. (2019). Platohedro. [Multiversos](https://platohedro.org/multiversos/). Cráneo Invertido, Medellı́n, Colombia.
- Roads, C. (2001). Microsound. The MIT Press. 
- Soon, W. y Cox, G. (2020) [Aesthetic Programming: A Handbook of Software Studies](http://openhumanitiespress.org/books/download/Soon-Cox_2020_Aesthetic-Programming.pdf). Open Humanities Press.