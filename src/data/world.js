import { rand, chance } from '../core/rng';
export function isCaveEntrance(state){
  return state.area==='cave' && state.room==='entrance';
}
export const WORLD = {
  cave: {
    rooms: {
      cell:      { next: 'tunnel'    },
      tunnel:    { next: 'alcove'    },
      alcove:    { next: 'pool'      },
      pool:      { next: 'junction'  },
      junction:  { next: 'entrance'  },
      entrance:  { next: 'cell'      } // loops, but entrance has Exit action
    },
    encounters: [
      // id, chance (0..1), where (array or 'any'), gate
      { id:'rat', chance:0.35, where:['tunnel','alcove','junction'], gate:(st)=>!st.flags.ratDone }
    ]
  },
  forest_edge: {
    rooms: {
      clearing: { next: 'hollow' },
      hollow:   { next: 'clearing' }
    },
    encounters: []
  }
};

// roll encounters for given area/room
export function rollEncounter(state){
  const area = WORLD[state.area];
  if (!area || !area.encounters) return null;
  for (const e of area.encounters){
    const inPlace = e.where === 'any' || e.where.includes(state.room);
    const ok = !e.gate || e.gate(state);
    if (inPlace && ok && rand()/chance() < e.chance) return e.id;
  }
  return null;
}

// step room forward
export function nextRoom(state){
  const area = WORLD[state.area];
  const r = area?.rooms?.[state.room];
  return r?.next || state.room;
}
