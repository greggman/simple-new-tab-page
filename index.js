"use strict";
(function () {
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

  //if (Math.random() < 0.5) {
  //  fetchVideo();
  //} else {
    fetchImage();
  //}

  async function fetchImage() {
    try {
      const resp = await fetch("https://source.unsplash.com/random/1024x600");
      const selectedImage = resp.url;
      const dom = document.getElementById("bgimg");
      dom.style.backgroundColor = "grey";
      dom.style.backgroundImage = `url(${selectedImage})`;
    } catch (e) {
      error(e);
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
  setDateDetails() {
    this.dateDetails = getdateDetails();
  }
}

let tab = new TabAction();
tab.getbatteryconnectionDetails();
tab.getAllDeviceDetails((devices) => {
  insertDevicesinDom(devices);
});
tab.setDateDetails();
insertinDom();
function insertinDom() {
  document.getElementById(
    "date"
  ).textContent = `${tab.dateDetails.day}, ${tab.dateDetails.month} ${tab.dateDetails.date}`;
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
  const date = new Date();
  const battery = await navigator.getBattery();
  const connection = navigator.onLine
    ? `~${navigator.connection.downlink} Mbps `
    : "Offline ";
  const batteryHealth = `${(battery.level * 100).toFixed()}% ${battery.charging ? "Charging" : "Battery"}`;
  document.getElementById("battery").textContent = `${connection} - ${batteryHealth}`;
  return { connection: connection, battery: batteryHealth };
}
function getdateDetails() {
  const today = new Date();
  const day = today.getDay();
  const dd = today.getDate();
  const mm = today.getMonth();
  const yyyy = today.getFullYear();
  const dL = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const mL = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return {
    day: dL[day],
    month: mL[mm],
    date: dd,
    year: yyyy,
  };
}
