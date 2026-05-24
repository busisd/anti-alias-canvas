// https://en.wikipedia.org/wiki/Line_drawing_algorithm
// https://en.wikipedia.org/wiki/Line_clipping

// Start - PolyBool helpers

function intersect (shape1, shape2) {
  const pbResult = PolyBool.intersect({
      regions: [shape1],
      inverted: false
    },
    {
      regions: [shape2],
      inverted: false
  });
  return pbResult.regions[0];
}


// End - PolyBool helpers

// https://en.wikipedia.org/wiki/Shoelace_formula
function shoelace(shape) {
  let sum = 0;
  for (let i = 0; i < shape.length; i++) {
    const currentPoint = shape[i];
    const nextPoint = shape[(i + 1) % shape.length];

    sum += (currentPoint[0] * nextPoint[1]) - (nextPoint[0] * currentPoint[1]);
  }

  return Math.abs(sum) / 2;
}

const WIDTH = 32;
const HEIGHT = 32;

function setPixel (imgData, x, y, pixel, { w=WIDTH, h=HEIGHT } = {}) {
  const redIndex = y * (w * 4) + x * 4;
  imgData.data[redIndex] = pixel.r ?? 0;
  imgData.data[redIndex + 1] = pixel.g ?? 0;
  imgData.data[redIndex + 2] = pixel.b ?? 0;
  imgData.data[redIndex + 3] = pixel.a ?? 255;
}

const canvas = document.getElementById("main-canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const hiResCanvas = document.getElementById("hi-res-canvas");
hiResCanvas.width = WIDTH * 10;
hiResCanvas.height = HEIGHT * 10;
const hiResCtx = hiResCanvas.getContext("2d");

const verticesInput = document.getElementById("vertices-input");
const colorInputR = document.getElementById("color-input-r");
const colorInputG = document.getElementById("color-input-g");
const colorInputB = document.getElementById("color-input-b");
const colorInputA = document.getElementById("color-input-a");
const errorText = document.getElementById("error-text");

const getInputs = () => {
  return [
    JSON.parse(verticesInput.value),
    parseInt(colorInputR.value),
    parseInt(colorInputG.value),
    parseInt(colorInputB.value),
    parseInt(colorInputA.value),
  ]
}

// Pixels defined at corners: for example, the pixel at 0,0 is represented by corners at 0,0 0,1 1,0 1,1
const drawAntiAliasedShape = (vertices, r = 0, g = 0, b = 0, a = 255) => {
  const img = ctx.createImageData(WIDTH, HEIGHT);

  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const pixelShape = [[x,y],[x+1,y],[x+1,y+1],[x,y+1]]
      const intersectionPoly = intersect(vertices, pixelShape)
      if (intersectionPoly != null) {
        const area = shoelace(intersectionPoly);
        const transparency = Math.round(area * a);
        setPixel(img, x, y, { r, g, b, a: transparency });
      }
    }
  }

  ctx.putImageData(img, 0, 0);
}
const drawHiResShape = (vertices, r = 0, g = 0, b = 0, a = 255) => {
  hiResCtx.fillStyle=`rgba(${r},${g},${b},${a / 255})`
  hiResCtx.beginPath();
  for (const vertex of vertices) {
    hiResCtx.lineTo(vertex[0] * 10, vertex[1] * 10);
  }
  hiResCtx.closePath();
  hiResCtx.fill();
}

const inputsForm = document.getElementById("inputs-form");
inputsForm.onsubmit = (e) => {
  e.preventDefault();

  errorText.innerText = null;

  try {
    const inputs = getInputs();

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    hiResCtx.clearRect(0, 0, WIDTH * 10, HEIGHT * 10);
    
    drawAntiAliasedShape(...inputs);
    drawHiResShape(...inputs);
  } catch (e) {
    console.error(e);
    errorText.innerText = e.message;
  }
}

const initialInputs = getInputs();
drawAntiAliasedShape(...initialInputs);
drawHiResShape(...initialInputs);

/**
Some nice lines/shapes:
[[1,0],[32,31],[31,32],[0,1]]
[[1,0],[32,23],[31,24],[0,1]]
[[1,0],[32,15],[31,16],[0,1]]
[[0,0],[10,0],[10,10],[0,10]]
[[10,2],[18,16],[2,10]]
[[10, 2], [11, 3], [2, 16], [1, 15]]
[[15,15],[31,30],[31, 31],[30, 31]]
[[10, 2],[18,16],[2, 18],[5,13],[11,30]]
[[10, 2],[18,16],[2, 18],[5,13],[26,30],[16,37]]
*/

