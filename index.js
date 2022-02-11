"use strict";
const settings = {
  videoOdds: 0,
};

const eventRE = /on([A-Z])(\w+)/;
function createElem(tag, attrs = {}) { 
  const elem = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        elem[key][k] = v;
      }
    } else if (typeof value === 'function') {
      const m = eventRE.exec(key);
      if (!m) {
        throw new Error('bad event: ${key}');
      }
      const eventType = `${m[1].toLowerCase()}${m[2]}`;
      elem.addEventListener(eventType, value);
    } else if (key.startsWith('data')) {
      const k = `${key[4].toLowerCase()}${key.substr(5)}`;
      elem.dataset[k] = value;
    } else if (elem[key] === undefined) {
      elem.setAttribute(key, value);
    } else {
      elem[key] = value;
    }
  }
  return elem;
}

function el(tag, attrs = {}, children  = []) {
  const elem = createElem(tag, attrs);
  for (const child of children) {
    elem.appendChild(child);
  }
  return elem;
}

function getLocalStorage(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function setLocalStorage(obj) {
  return new Promise(resolve => chrome.storage.local.set(obj, resolve));
}

async function getRandomImageURL() {
  const resp = await fetch("https://source.unsplash.com/random/1024x600");
  return resp.url;
}

(async function () {

  const useVideo = Math.random() < settings.videoOdds;
  if (useVideo) {
    fetchVideo();
  } else {
    fetchImage();
  }

  async function fetchImage() {
    let imgURL = await getCachedImageURL();
    if (!imgURL) {
      imgURL = getRandomImageURL();
    }
    const dom = document.getElementById("bgimg");
    dom.style.backgroundColor = "grey";
    dom.style.backgroundImage = `url(${imgURL})`;
 
    cacheImageForNextTime();
  }

  async function getCachedImageURL() {
    try {
      const keys = await getLocalStorage(['imgURL']);
      if (keys.imgURL) {
        await setLocalStorage({imgURL: undefined});
        return keys.imgURL;
      }
    } catch (e) {
      error(e);
    }
  }

  async function cacheImageForNextTime() {
    const imgURL = await getRandomImageURL();
    const img = new Image();
    img.src = imgURL;
    try {
      await img.decode();
      await setLocalStorage({imgURL});
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchVideo() {
    try {
      const resp = await fetch("https://randomvideo.vercel.app/randomvideo");
      const res = await resp.json();
      insertVideo(res?.src?.video_files[0].link);
    } catch (e) {
      error(e);
    }
  }
  function insertVideo(src) {
    var video = document.getElementById("myVideo");
    var source = document.createElement("source");
    source.setAttribute("src", src);
    video.appendChild(source);
    video.play();
  }
  function error() {
    let dom = document.getElementById("bgimg");
    dom.style.backgroundColor = "grey";
  }
})();

(function () {
  function checkTime(i) {
    return i.toString().padStart(2, '0');
  }
  function startTime() {
    const today = new Date();
    const h = checkTime(today.getHours());
    const m = checkTime(today.getMinutes());
    const s = checkTime(today.getSeconds());
    const time = `${h}:${m}`;
    document.getElementById("time").textContent = time;
    setTimeout(function () {
      startTime();
    }, 500);
  }
  startTime();
})();

class Init {
  constructor() {
    this.batteryconnectionDetails = null;
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
  getbatteryconnectionDetails() {
    let promise = insertconnectionDetails();
    promise.then((res) => {
      this.batteryconnectionDetails = res;
    });
  }
}

let tab = new TabAction();
tab.getbatteryconnectionDetails();
tab.getAllDeviceDetails((devices) => {
  insertDevicesinDom(devices);
});
insertinDom();
function insertinDom() {
  document.getElementById(
    "date"
  ).textContent = new Intl.DateTimeFormat([], {dateStyle:'long'}).format(new Date())
}
function insertDevicesinDom(devices) {
  for (const device of devices) {
    let lastSession = device.sessions;
    if (lastSession.length > 0) {
      lastSession = lastSession[0];
      let orgLink = lastSession.window["tabs"][0]["url"];
      let sessionLink = orgLink.substring(0, 20);
      document.getElementById("device").appendChild(el('span', {className: 'device'}, [
        el('strong', {textContent: device.deviceName}),
        el('span', {textContent: ` > `}),
        el('a', {href: orgLink, rel: 'noopenner', textContent: sessionLink}),
      ]));
    }
  }
}
async function insertconnectionDetails() {
  const battery = await navigator.getBattery();
  const connection = navigator.onLine
    ? `~${navigator.connection.downlink} Mbps `
    : "Offline ";
  const batteryHealth = `${(battery.level * 100).toFixed()}% ${battery.charging ? "Charging" : "Battery"}`;
  document.getElementById("battery").textContent = `${connection} - ${batteryHealth}`;
  return { connection: connection, battery: batteryHealth };
}
