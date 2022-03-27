/* eslint-env webextensions, browser */
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
  getLocalStorage,
  setLocalStorage,
  loadSettings,
  onNewSettings,
} from './utils.js';

async function getRandomImageURL() {
  const resp = await fetch('https://source.unsplash.com/random/1024x600');
  return resp.url;
}

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

  body.classList.remove(...hPosition, ...vPosition);
  body.classList.add(
      hPosition[settings.hPosition],
      vPosition[settings.vPosition],
  );

  updateTime();
  const elem = document.querySelector('#time');
  removeGap(elem);
}

onNewSettings(update);

(async function() {
  await loadSettings();
  update();

  const useVideo = Math.random() * 100 < settings.videoOdds;
  if (useVideo) {
    fetchVideo();
  } else {
    fetchImage();
  }

  async function fetchImage() {
    let imgURL = await getCachedImageURL();
    if (!imgURL) {
      imgURL = await getRandomImageURL();
    }
    const dom = document.querySelector('#bgimg');
    dom.style.backgroundColor = 'grey';
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
    return undefined;
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
