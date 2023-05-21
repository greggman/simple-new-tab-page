/* eslint-env webextensions, browser */
import * as twgl from './3rdparty/twgl-full.module.js';
import {
  settings,
} from './settings.js';
import {
  el,
} from './dom.js';
import {
  removeGap,
} from './gap.js';
import {
  loadSettings,
  onNewSettings,
} from './utils.js';

let imgWidth = 10000;
let imgHeight = 10000;
let useVideo = false;

//const lerp = (a, b, t) => a + (b - t) * t;
const clamp = (v, min, max) => Math.max(Math.min(max, v), min);
const clamp01 = v => clamp(v, 0, 1);
const mapRange = (v, x, y, s, t) => (v - x) * (t - s) / (y - x) + s;

const vs = `#version 300 es
void main() {
  vec4 points[3];
  points[0] = vec4(-1,  3, 0, 1);
  points[1] = vec4( 3, -1, 0, 1);
  points[2] = vec4(-1, -1, 0, 1);

  gl_Position = points[gl_VertexID];
}
`;

const fs = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / vec2(4000);
  float noise = fract(sin(dot(uv, vec2(12.9898,78.233)*2.0)) * 43758.5453);
  outColor = vec4(vec3(noise),1);    
}
`;

const gl = document.querySelector('#grain').getContext('webgl2');
const program = twgl.createProgram(gl, [vs, fs]);

function render([entry]) {
  update();
  gl.canvas.width  = entry.devicePixelContentBoxSize[0].inlineSize;
  gl.canvas.height = entry.devicePixelContentBoxSize[0].blockSize;
  //gl.canvas.width  = document.body.clientWidth;
  //gl.canvas.height = document.body.clientHeight;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.useProgram(program);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

const observer = new ResizeObserver(render);
observer.observe(gl.canvas);

// setInterval(() => {
//   gl.canvas.style.display = !!gl.canvas.style.display ? '' : 'none';
// }, 1000);

/*
function randomElem(array) {
  const ndx = Math.random() * array.length | 0;
  return array[ndx];
}
*/

// https://flickr.com/photo.gne?id=52891507238
// live.staticflickr.com/65535/52891507238_7eb2b36210_n.jpg

function looksLikeFilename(s) {
  const hasCommonPunctuation = s.includes('-') || s.includes('_') || s.includes('#');
  const hasLetters = /[a-z]/i.test(s);
  const hasNumbers = /[0-9]/i.test(s);
  const hasSpace = s.includes(' ');
  const hasExtension = /\.\w+$/.test(s);
  return hasExtension ||
    (hasCommonPunctuation && !hasSpace) ||
    ((hasLetters && hasNumbers) && !hasSpace);
}
*/

function removeFilenames(s) {
  return s.replace(/(DSC|IMG)[a-z0-9_ -]+/ig, '')
          .replace(/(\.| |-)(jpeg|jpg|png)/ig, '')
          .trim();
}

async function getRandomImageData(numImages) {
  numImages = numImages || 94979;
  const numPerSlice = 50;
  const id = numImages * Math.random() | 0;
  const sliceId = (id / numPerSlice | 0).toString().padStart(5, '0');
  const parts = /^(\d+)(\d)(\d)(\d)(\d)$/.exec(sliceId).slice(1);
  const file = `${parts.pop()}.json`;
  const url = ['https://random-image.org', 'images', ...parts, file].join('/');
  const res = await fetch(url);
  const slice = await res.json();
  const data = slice[id % numPerSlice];
  if (data.url.includes('flickr.com')) {
    data.url = data.url.replace(/_[a-z]\.jpg/, '_b.jpg');
    if (!data.imgLink) {
      const m = /\/(\d+)_[a-z0-9]+(_.|)\.jpg$/.exec(data.url);
      if (m) {
        data.imgLink = `https://flickr.com/photo.gne?id=${m[1]}`;
      }
    }
  }
  return data;
}

/*
async function getRandomImageURL() {
  const data = await getRandomImage();
  return data.url;
  //const keywords = settings.keywords.split(/\s+|,/);
  //const keyword = randomElem(keywords);
  //return `https://loremflickr.com/1024/720/${keyword}`;//,vista,architechture,food';

  // unsplash died?
  //const resp = await fetch('https://source.unsplash.com/random/1024x600');
  // return resp.url;

  // no cors?
  // const resp = await fetch('https://loremflickr.com/json/1024/720/');
  // const json = await resp.json();
  // return json.file;
}
*/

function formatTime(i) {
  return i.toString().padStart(2, '0');
}

function updateTime() {
  const today = new Date();
  const h = formatTime(today.getHours());
  const m = formatTime(today.getMinutes());
  const s = formatTime(today.getSeconds());
  const time = settings.seconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  const elem = document.querySelector('#time');
  elem.textContent = time;
  removeGap(elem);
}

function update() {
  document.querySelector('#time').style.display = settings.time ? '' : 'none';
  document.querySelector('#date').style.display = settings.date ? '' : 'none';
  document.querySelector('#battery').style.display = settings.battery ? '' : 'none';
  document.querySelector('#device').style.display = settings.devices ? '' : 'none';
  const body = document.querySelector('body');

  const hPosition = ['all-left', 'all-center', 'all-right'];
  const vPosition = ['all-top', 'all-middle', 'all-bottom'];
  const infoCSS = [
    //     left                  center              right
    [ ['right', 'bottom'], ['center', 'bottom'], ['left', 'bottom'] ],   // top
    [ ['left',  'top'   ], ['center', 'top'   ], ['right', 'top'  ] ],   // middle
    [ ['left',  'top'   ], ['center', 'top',  ], ['right', 'top'  ] ],   // bottom
  ];

  body.classList.remove(...hPosition, ...vPosition);
  body.classList.add(
      hPosition[settings.hPosition],
      vPosition[settings.vPosition],
  );

  const info = document.querySelector('#info');
  info.classList.remove(...infoCSS.flat().flat());
  info.classList.add(...infoCSS[settings.vPosition][settings.hPosition]);

  const imgAspectH = document.body.clientWidth / imgWidth;
  const imgAspectV = document.body.clientHeight / imgHeight;
  const maxAspect = Math.max(imgAspectH, imgAspectV);
  const opacity = clamp01(mapRange(maxAspect, 1.5, 2.5, 0, 1));
  //console.log('opacity:', opacity, 'body:', document.body.clientWidth, document.body.clientHeight, 'img:', imgWidth, imgHeight, 'aspect:', maxAspect, 'video:', useVideo);

  //gl.canvas.style.opacity = `${settings.grain ? opacity * 12 : 0}%`;
  gl.canvas.style.opacity = `${opacity * 12}%`;

  updateTime();
  const elem = document.querySelector('#time');
  removeGap(elem);
}

async function getLocalStorage(keys) {
  const obj = {};
  for (const key of keys) {
    obj[key] = localStorage.getItem(key);
  }
  return obj;
}

async function setLocalStorage(keyValues) {
  for (const [k, v] of Object.entries(keyValues)) {
    if (v instanceof Blob) {
      const fr = new FileReader();
      fr.onload = function(e) {
          localStorage.setItem(k, e.target.result);
      };
      fr.readAsDataURL(v);
    } else {
      localStorage.setItem(k, v);
    }
  }
}

onNewSettings(() => {
  update();
  setLocalStorage({img: '', data: '{}'});
});

(async function() {
  await loadSettings();
  useVideo = Math.random() * 100 < settings.videoOdds;
  update();

  if (useVideo) {
    fetchVideo();
  } else {
    fetchImage();
  }

  function setIfTruthy(obj, key, value) {
    if (value) {
      obj[key] = value;
    }
  }

  async function fetchImage() {
    let data = await getCachedImageData();
    if (!data) {
      data = await getRandomImageData();
    }
    const imgURL = data.url;
    const dom = document.querySelector('#bgimg');
    dom.style.backgroundColor = 'grey';
    dom.style.backgroundImage = `url(${imgURL})`;

    const title = document.querySelector('#title');
    const user = document.querySelector('#user');

    const img = new Image();
    img.src = imgURL;
    await img.decode();
    imgWidth = img.naturalWidth;
    imgHeight = img.naturalHeight;
    update();

    const desc = removeFilenames(data.desc);
    title.textContent = desc ? desc : '⬥';
    setIfTruthy(title, 'href', data.imgLink);
    user.textContent = data.user || '';
    setIfTruthy(user, 'href', data.link);

    cacheImageForNextTime();
  }

  async function getCachedImageData() {
    try {
      const keys = await getLocalStorage(['data', 'img']);
      const dataURL = keys.img;
      if (dataURL) {
        const data = JSON.parse(keys.data);
        data.url = dataURL;
        return data;
      }
    } catch (e) {
      error(e);
    }
    return undefined;
  }

function findEdge(edgeColor, width, height, pixels, x, y, perPixelDX, perPixelDY, perLineDX, perLineDY) {
  //const mask = 0xFFFFFFFF;
  //const mask = 0xFEFEFEFE;
  //const mask = 0xFCFCFCFC;
  //const mask = 0xF8F8F8F8;
  const mask = 0xF0F0F0F0;
  edgeColor &= mask;
  while (x >= 0 && y >= 0 && x < width && y < height) {
    let lineX = x;
    let lineY = y;
    while (lineX >= 0 && lineY >= 0 && lineX < width && lineY < height) {
      const offset = lineY * width + lineX;
      const pixel = pixels[offset] & mask;
      if (pixel !== edgeColor) {
        return [x, y];
      }
      lineX += perPixelDX;
      lineY += perPixelDY;
    }
    x += perLineDX;
    y += perLineDY;
  }

  return [x, y];
}

async function cropImage(blob) {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const {width, height} = canvas;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = new Uint32Array(imgData.data.buffer);
  const edgeColor = pixels[0];

  //                                                        x          y           dx dy lineDX lineDY
  const top    = findEdge(edgeColor, width, height, pixels, 0,         0,          1,  0,  0,  1)[1];
  const bottom = findEdge(edgeColor, width, height, pixels, 0,         height - 1, 1,  0,  0, -1)[1];
  const left   = findEdge(edgeColor, width, height, pixels, 0,         0,          0,  1,  1,  0)[0];
  const right  = findEdge(edgeColor, width, height, pixels, width - 1, 0,          0,  1, -1,  0)[0];
  const w = Math.max(0, right - left + 1);
  const h = Math.max(0, bottom - top + 1);

  //console.log('lrtbwh', left, right, top, bottom, w, h, img.naturalWidth, img.naturalHeight);

  const cropAreaSize = w * h;
  const imageAreaSize = width * height;
  if (cropAreaSize > imageAreaSize / 2 && w < width - 2 && h < height - 2) {
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    //console.log('crop:', left, top, w, h, 'orig:', width, height);
    ctx.drawImage(img,
      left + 2, top + 2, w - 4, h - 4,
      0, 0, w - 4, h - 4,
    );
    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
  }
  return blob;
}

  async function cacheImageForNextTime() {
    let numImages;
    try {
      const resp = await fetch('https://random-image.org/num-images.json');
      const data = await resp.json();
      numImages = data.numImages;
    } catch (e) {
      //
    }

    const data = await getRandomImageData(numImages);
    try {
      const res = await fetch(data.url);
      const blob = await cropImage(await res.blob());

      await setLocalStorage({data: JSON.stringify(data), img: blob});
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchVideo() {
    try {
      const resp = await fetch('https://randomvideo.vercel.app/randomvideo');
      const res = await resp.json();
      insertVideo(res?.src?.video_files[0].link);
    } catch (e) {
      error(e);
    }
  }

  function insertVideo(src) {
    const video = document.querySelector('#myVideo');
    const source = document.createElement('source');
    source.setAttribute('src', src);
    video.addEventListener('playing', () => {
      video.style.opacity = 1;
    });
    video.appendChild(source);
    video.play();

    function handleVisibilityChange() {
      if (document.hidden) {
        video.pause();
      } else {
        video.play();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  function error() {
    const dom = document.querySelector('#bgimg');
    dom.style.backgroundColor = 'grey';
  }

  setInterval(updateTime, 500);
  updateTime();
})();

class Init {
  constructor() {
    this.batteryConnectionDetails = null;
    this.deviceDetails = null;
    this.dateDetails = null;
  }
}

class TabAction extends Init {
  constructor(props) {
    super(props);
  }
  getAllDeviceDetails(callback) {
    chrome.sessions.getDevices((res) => {
      this.deviceDetails = res;
      callback(res);
    });
  }
  async getBatteryConnectionDetails() {
    this.batteryConnectionDetails = await insertConnectionDetails();
  }
}

const tab = new TabAction();
tab.getBatteryConnectionDetails();
tab.getAllDeviceDetails((devices) => {
  insertDevicesInDom(devices);
});
insertInDom();

function insertInDom() {
  const elem = document.querySelector('#date');
  elem.textContent = new Intl.DateTimeFormat([], { dateStyle:'long' }).format(new Date());
}

function insertDevicesInDom(devices) {
  for (const device of devices) {
    let lastSession = device.sessions;
    if (lastSession.length > 0) {
      lastSession = lastSession[0];
      const tab = lastSession.window.tabs[0];
      const orgLink = tab.title || tab.url;
      document.querySelector('#device').appendChild(el('div', {className: 'device'}, [
        el('div', {className: 'name', textContent: device.deviceName}),
        el('div', {className: 'arrow', textContent: '>'}),
        el('a', {href: orgLink, rel: 'noopenner', textContent: orgLink}),
      ]));
    }
  }
}

async function insertConnectionDetails() {
  const battery = await navigator.getBattery();
  const connection = navigator.onLine
      ? `~${navigator.connection.downlink} Mbps `
      : 'Offline ';
  const batteryHealth = `${(battery.level * 100).toFixed()}% ${battery.charging ? 'Charging' : 'Battery'}`;
  document.querySelector('#battery').textContent = `${connection} - ${batteryHealth}`;
  return { connection: connection, battery: batteryHealth };
}
