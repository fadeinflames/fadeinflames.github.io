import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = (await readFile(new URL('../src/app.js', import.meta.url), 'utf8'))
  .replace(/^import \{ mountSphere \} from '\.\/sphere\.js';\r?\n/, '');

function eventSource() {
  const listeners = new Map();
  return {
    addEventListener(type, callback, options = {}) {
      const entries = listeners.get(type) || [];
      entries.push({ callback, once: options.once });
      listeners.set(type, entries);
    },
    dispatch(type, event = {}) {
      for (const entry of [...(listeners.get(type) || [])]) {
        entry.callback(event);
        if (entry.once) listeners.set(type, listeners.get(type).filter(item => item !== entry));
      }
    },
  };
}

function openPage({ saved = null, reduced = false } = {}) {
  const state = { stored: saved, paused: null, spherePaused: null, destroyed: 0 };
  const media = { ...eventSource(), matches: reduced };
  const window = { ...eventSource(), matchMedia: () => media };
  const attributes = new Map();
  const icons = { '.pause-icon': {}, '.play-icon': {} };
  const toggle = {
    ...eventSource(),
    setAttribute: (name, value) => attributes.set(name, value),
    querySelector: selector => icons[selector],
  };
  const elements = { '#sphere': {}, '#motion-toggle': toggle, '#motion-tip': {} };
  const sphere = {
    setPaused(value) { if (!state.destroyed) state.spherePaused = value; },
    destroy() { state.destroyed++; },
  };
  runInNewContext(source, {
    window,
    document: {
      documentElement: { classList: { toggle: (_name, value) => { state.paused = value; } } },
      querySelector: selector => elements[selector] || null,
      querySelectorAll: () => [],
    },
    localStorage: {
      getItem: () => state.stored,
      setItem: (_name, value) => { state.stored = value; },
    },
    mountSphere: () => sphere,
    console,
  }, { filename: 'src/app.js' });
  return {
    state, media, attributes,
    click: () => toggle.dispatch('click'),
    changeReduced(value) { media.matches = value; media.dispatch('change', { matches: value }); },
    hide: persisted => window.dispatch('pagehide', { persisted }),
    show: persisted => window.dispatch('pageshow', { persisted }),
  };
}

test('manual pause survives system reduced-motion changes', () => {
  const page = openPage();
  page.click();
  assert.equal(page.state.stored, 'paused');
  page.changeReduced(true);
  page.changeReduced(false);
  assert.equal(page.state.paused, true);
  assert.equal(page.state.spherePaused, true);
});

test('manual resume replaces a saved pause across system preference changes', () => {
  const page = openPage({ saved: 'paused' });
  page.click();
  assert.equal(page.state.stored, 'playing');
  page.changeReduced(true);
  page.changeReduced(false);
  assert.equal(page.state.paused, false);
  assert.equal(page.state.spherePaused, false);
});

test('system reduced motion keeps animation paused after a button click', () => {
  const page = openPage({ reduced: true });
  page.click();
  assert.equal(page.state.paused, true);
  assert.equal(page.state.spherePaused, true);
  assert.equal(page.attributes.get('aria-pressed'), 'true');
});

test('bfcache pauses and restores the sphere across repeated visits', () => {
  const page = openPage();
  for (let visit = 0; visit < 2; visit++) {
    page.hide(true);
    assert.equal(page.state.destroyed, 0);
    assert.equal(page.state.spherePaused, true);
    page.show(true);
    assert.equal(page.state.spherePaused, false);
  }
  page.hide(false);
  assert.equal(page.state.destroyed, 1);
});

test('bfcache restoration respects current system and manual preferences', () => {
  const page = openPage();
  page.hide(true);
  page.media.matches = true;
  page.show(true);
  assert.equal(page.state.paused, true);
  assert.equal(page.state.spherePaused, true);
  page.changeReduced(false);
  page.click();
  page.hide(true);
  page.show(true);
  assert.equal(page.state.paused, true);
  assert.equal(page.state.spherePaused, true);
});
