/* Regression: public-record tabs must never control the account's profile tabs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = fs.readFileSync(__dirname + '/script.js', 'utf8');
const start = script.indexOf('  const tablist = ');
const end = script.indexOf("  const film = ", start);
assert.ok(start >= 0 && end > start, 'The actual public-record controller must be exercised.');

class Element {
  constructor(attrs) {
    this.attrs = Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
    this.hidden = /(?:^|\s)hidden(?:\s|$)/.test(attrs);
    this.tabIndex = Number(this.attrs.tabindex || 0);
    this.listeners = {};
    this.focused = false;
  }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  focus() { this.focused = true; }
  fire(type, key) {
    const event = { key, prevented: false, preventDefault() { this.prevented = true; } };
    (this.listeners[type] || []).forEach(fn => fn(event));
    return event;
  }
}
const nodes = new Map([...html.matchAll(/<[\w-]+([^>]*\bid="([^"]+)"[^>]*)>/g)]
  .map(match => [match[2], new Element(match[1])]));
const allTabs = [...nodes.values()].filter(node => node.getAttribute('role') === 'tab');
const profileTabs = allTabs.filter(node => node.getAttribute('data-profile-mode'));
const recordTabs = allTabs.filter(node => node.getAttribute('class') === 'exploration-tab');
assert.equal(profileTabs.length, 2);
assert.equal(recordTabs.length, 3);
const recordList = new Element('role="tablist" aria-orientation="vertical"');
recordList.querySelectorAll = selector => selector === '[role=tab]' ? recordTabs : [];
const profileList = new Element('role="tablist" aria-orientation="horizontal"');
profileList.querySelectorAll = selector => selector === '[role=tab]' ? profileTabs : [];
const mobile = { matches: false, listeners: [], addEventListener(type, fn) { this.listeners.push(fn); } };
const profileBefore = JSON.stringify(profileTabs.map(tab => ({ attrs: tab.attrs, tabIndex: tab.tabIndex })));
const panelBefore = nodes.get('profile-panel').hidden;
const document = {
  querySelector: selector => selector === '.exploration-index[role=tablist]' ? recordList : selector === '[role=tablist]' ? profileList : null,
  querySelectorAll: selector => selector === '[role=tab]' ? allTabs : [],
  getElementById: id => nodes.get(id)
};
vm.runInNewContext(script.slice(start, end), { document, mobile }, { filename: 'script.js public-record controller' });

function profileUntouched() {
  assert.equal(JSON.stringify(profileTabs.map(tab => ({ attrs: tab.attrs, tabIndex: tab.tabIndex }))), profileBefore);
  assert.equal(nodes.get('profile-panel').hidden, panelBefore);
  assert.equal(profileList.getAttribute('aria-orientation'), 'horizontal');
}
function selected(index) {
  recordTabs.forEach((tab, i) => {
    assert.equal(tab.getAttribute('aria-selected'), String(i === index));
    assert.equal(tab.tabIndex, i === index ? 0 : -1);
    assert.equal(nodes.get(tab.getAttribute('aria-controls')).hidden, i !== index);
  });
  profileUntouched();
}
profileTabs.forEach(tab => assert.equal((tab.listeners.click || []).length, 0, 'Public-record navigation must not attach to a profile tab.'));
recordTabs.forEach((tab, index) => { tab.fire('click'); selected(index); });
assert.equal(recordTabs[2].fire('keydown', 'ArrowRight').prevented, true); selected(0);
assert.equal(recordTabs[0].focused, true);
recordTabs[0].fire('keydown', 'End'); selected(2);
recordTabs[2].fire('keydown', 'Home'); selected(0);
recordTabs[0].fire('keydown', 'ArrowLeft'); selected(2);
assert.equal(recordTabs[2].fire('keydown', 'Enter').prevented, false); selected(2);
mobile.matches = true; mobile.listeners.forEach(fn => fn()); selected(2);
assert.equal(recordList.getAttribute('aria-orientation'), 'horizontal');
mobile.matches = false; mobile.listeners.forEach(fn => fn()); selected(2);
assert.equal(recordList.getAttribute('aria-orientation'), 'vertical');
console.log('navigation check ok — public-record clicks, keyboard and resize leave the X profile tabs and preview untouched');
