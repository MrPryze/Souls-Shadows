// src/systems/effects.js
export const effects = new Map(); // name -> { untilDay, onTick }
export function addEffect(name, obj){ effects.set(name, obj); }
export function tickEffects(state){ for (const e of effects.values()) e.onTick?.(state); }
