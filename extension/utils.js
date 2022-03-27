import {settings} from './settings.js';

export function getLocalStorage(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

export function setLocalStorage(obj) {
  return new Promise(resolve => chrome.storage.local.set(obj, resolve));
}

function updateSettings(newSettings) {
  for (const [k, v] of Object.entries(newSettings)) {
    if (typeof v === typeof settings[k]) {
      settings[k] = v;
    }
  }
}

export async function loadSettings() {
  const keys = await getLocalStorage(['settings']);
  if (keys && keys.settings) {
    updateSettings(keys.settings);
  }
}

export function saveSettings() {
  setLocalStorage({settings});
}

let onNewSettingsFn = () => {};
export function onNewSettings(fn) {
  const oldFn = onNewSettingsFn;
  onNewSettingsFn = fn;
  return oldFn;
}

async function settingsUpdated(newValue) {
  updateSettings(newValue);
  onNewSettingsFn();
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    switch (key) {
      case "settings":
        settingsUpdated(newValue);
    }
  }
});
