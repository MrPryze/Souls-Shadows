// src/core/rng.js
let s = 0x2F6E2B1; // or from Date.now()
export function seed(x){ s = x|0 || s; }
export function rand(){ s ^= s<<13; s ^= s>>>17; s ^= s<<5; return (s>>>0)/0x100000000; }
export function chance(p){ return rand() < p; }
