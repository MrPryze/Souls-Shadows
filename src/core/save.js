// src/core/save.js
const KEY='ss.save.v1';
export function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }
export function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch{ return null; } }
export function wipe(){ localStorage.removeItem(KEY); }
