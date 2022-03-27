import {
  settings,
} from './settings.js';
import {
  getLocalStorage,
  setLocalStorage,
  loadSettings,
  saveSettings,
} from './utils.js';
import {GUI} from './gui.js';

async function main() {
  await loadSettings();

  const controlsElem = document.querySelector('#controls');
  const gui = new GUI();
  controlsElem.appendChild(gui.elem);

  gui.add(settings, 'time').name('Time').onChange(saveSettings);
  gui.add(settings, 'seconds').name('Seconds').onChange(saveSettings);
  gui.add(settings, 'date').name('Date').onChange(saveSettings);
  gui.add(settings, 'battery').name('Battery').onChange(saveSettings);
  gui.add(settings, 'devices').name('Devices').onChange(saveSettings);
  gui.add(settings, 'hPosition', ['Left', 'Center', 'Right']).onChange(saveSettings);
  gui.add(settings, 'vPosition', ['Top', 'Middle', 'Bottom']).onChange(saveSettings);
  gui.add(settings, 'videoOdds', 0, 100).name('Video%:').onChange(saveSettings);
}

main();
