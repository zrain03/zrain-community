/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: tests/admin-key-eye.test.mjs
 * BM: Fail Admin key eye.test dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Admin key eye.test file according to Zrain Community contracts.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root,path),'utf8');
const admin = read('web/public/admin.html');
const script = read('web/public/admin-key-eye.js');
const style = read('web/public/admin-key-eye.css');

test('admin input has a proper eye toggle, not a submit action', () => {
  assert.match(admin, /id="adminKey" type="password"/);
  assert.match(admin, /id="adminKeyVisibility"[^>]*type="button"|type="button"[^>]*id="adminKeyVisibility"/);
  assert.match(admin, /aria-controls="adminKey"/);
  assert.match(admin, /aria-pressed="false"/);
  assert.match(admin, /class="eye-open"/);
  assert.match(admin, /class="eye-closed"/);
});

test('CSS and JS load only from admin, with password input spacing', () => {
  assert.match(admin, /admin-key-eye\.css\?v=0\.2\.3/);
  assert.match(admin, /admin-key-eye\.js\?v=0\.2\.3/);
  assert.match(style, /padding-right:62px/);
  assert.doesNotMatch(read('web/public/index.html'), /admin-key-eye\.(?:css|js)/);
});

test('eye toggles visibility and resets after submit or hiding the tab', () => {
  const listeners = new Map();
  const input = {type:'password', focus() {this.focused=true}};
  const attrs = {};
  const classes = new Set();
  const toggle = {
    title:'Show key',
    setAttribute(k,v){attrs[k]=v},
    classList:{toggle(k,v){v?classes.add(k):classes.delete(k)}},
    addEventListener(k,cb){listeners.set('toggle:'+k,cb)}
  };
  const form = {addEventListener(k,cb){listeners.set('form:'+k,cb)}};
  const document = {
    hidden:false,
    getElementById(id){return {adminKey:input, adminKeyVisibility:toggle, loginForm:form}[id] || null},
    addEventListener(k,cb){listeners.set('document:'+k,cb)}
  };
  vm.runInNewContext(script,{document});
  listeners.get('toggle:click')();
  assert.equal(input.type,'text');
  assert.equal(attrs['aria-label'],'Hide administrator API key');
  assert.equal(attrs['aria-pressed'],'true');
  assert.ok(classes.has('is-visible'));
  assert.ok(input.focused);
  listeners.get('toggle:click')();
  assert.equal(input.type,'password');
  listeners.get('toggle:click')();
  listeners.get('form:submit')();
  assert.equal(input.type,'password');
  listeners.get('toggle:click')();
  document.hidden = true;
  listeners.get('document:visibilitychange')();
  assert.equal(input.type,'password');
  assert.equal(attrs['aria-pressed'],'false');
});

test('key toggle does not access storage, clipboard, network, or secret values', () => {
  assert.doesNotMatch(script, /localStorage|sessionStorage|navigator\.clipboard|fetch\(|XMLHttpRequest|\.value\b/);
});
