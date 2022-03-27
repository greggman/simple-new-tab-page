import {el} from './dom.js';

let nextId = 0;
function getId() {
  return `elem${nextId++}`;
}

class Control {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
    this.elem = el('div', {className: 'control'});
    this.changeFn = () => {};
  }
  get() {
    return obj[prop];
  }
  set(v) {
    obj[prop] = v;
    return this;
  }
  name(v) {
    this.labelElem.textContent = v;
    return this;
  }
  onChange(fn) {
    this.changeFn = fn;
    return this;
  }
  changed() {
    this.changeFn(this);
  }
}

class Slider extends Control {
  constructor(obj, prop, min, max, step) {
    super(obj, prop);
    const id = getId();
    const that = this;
    this.inputElem = el('input', {
      id,
      min,
      max,
      step: step || '1',
      type: 'range', 
      value: obj[prop],
      onInput: function() {
        console.log(`${prop}: ${this.value}`);
        obj[prop] = parseFloat(this.value);
        that.valueElem.textContent = this.value;
        that.changed();
      },
    });
    this.labelElem = el('label', {for: id, textContent: prop}),
    this.valueElem = el('div',{textContent: obj[prop]}),
    this.elem.classList.add('slider');
    this.elem.appendChild(this.inputElem);
    this.elem.appendChild(this.labelElem);
    this.elem.appendChild(this.valueElem);
  }
  set(v) {
    super.set(v);
    const value = this.get();
    this.inputElem.value = value;
    this.valueElem.textContent = value;
  }
}

class Checkbox extends Control {
  constructor(obj, prop) {
    super(obj, prop);
    const id = getId();
    const that = this;
    this.inputElem = el('input', {
      id, 
      type: 'checkbox', 
      checked: obj[prop],
      onChange: function() {
        obj[prop] = this.checked;
        that.changed();
      },
    });
    this.labelElem = el('label', {for: id, textContent: prop}),
    this.elem.classList.add('checkbox');
    this.elem.appendChild(this.inputElem);
    this.elem.appendChild(this.labelElem);
  }
  set(v) {
    super.set(v);
    this.inputElem.checked = this.get();
  }
}

class Radio extends Control {
  constructor(obj, prop, options) {
    super(obj, prop);
    const that = this;

    options = new Map(Array.isArray(options)
        ? options.map((a, i) => [a, i])
        : Object.entries(options));
    this._valueToInputMap = new Map();
    const sharedName = getId();
    const div = el('div', {className: 'radio'}, [...options].map(([name, value]) => {

      const id = getId();
      const input = el('input', {
        name: sharedName,
        id,
        type: 'radio',
        ...(obj[prop] === value && {checked: true}),
        onChange: function() {
          obj[prop] = value;
          that.changed();
        },
      });
      this._valueToInputMap.set(value, input);
      return el('div', {}, [
        input,
        el('label', {for: id, textContent: name}),
      ]);
    }));
    this.elem.appendChild(div);
  }
  set(v) {
    super.set(v);
    this._valueToInputMap((input, value) => {
      input.checked = v === value;
    });
  }
}



function createControl(obj, prop, a1, a2, a3) {
  const v = obj[prop];
  if (typeof v === 'boolean') {
    return new Checkbox(obj, prop);
  } else if (typeof v === 'number') {
    if (Array.isArray(a1) || typeof a1 === 'object') {
      return new Radio(obj, prop, a1);
    } else if (a1 === undefined) {
      // number field
    } else if (typeof a1 === 'number') {
      // slider
      let max = a1;
      let min = 0;
      let step = 0;
      if (typeof a2 === 'number') {
        min = max;
        max = a2;
      }
      if (typeof a3 === 'number') {
        step = a3;
      }
      return new Slider(obj, prop, min, max, step)
    }
  } else {
    throw new Error('unhandled type');
  }
}

export class GUI {
  constructor() {
    this.elem = el('div', {className: 'controls'});
  }
  add(obj, prop, ...args) {
    const control = createControl(obj, prop, ...args);
    this.elem.appendChild(control.elem);
    return control;
  }
}