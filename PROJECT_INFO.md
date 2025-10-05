🧩 Architecture
Core Concepts
Module	Purpose
state.js	Central game state, flags, resources, emit/save logic
actions.js	Handles verbs (Channel, Sleep, Explore, etc.)
day.js	Energy, hunger, time passage
effects.js	Temporary status effects (e.g., Wet, Poisoned)
ui.js	Renders main screen, action bar, chronicle, status panel
inkRunner.js	Runs Ink JSON stories, handles choices & locking
inkBook.js	Utility for snippets and area file caching
world.js	Defines available areas, rooms, encounters
rng.js	Seeded random number generator
save.js	Save/load to localStorage
Game Flow
UI Action → actions.js → Ink snippet/dialogue → inkRunner → UI update + logs

Ink Organization

Areas: one Ink file per location (cave.ink, forest_edge.ink, …)

snip_{action}_{room} → short narrations

dlg_{topic}_{event} → interactive dialogues

Dialogues: small single-use files in /data/dialogues

Each exported to JSON (*.json) and loaded dynamically.

🧰 Development Notes
To Add / Edit Ink Content

Write or update .ink file in src/data/areas/

Export from Inky → File → Export for web (JSON) → overwrite corresponding .json

Bump the version constant in inkBook.js if browser cache interferes.

To Add New Actions

Add a case in actions.js

Add snippets/dialogues in the proper area Ink

Update UI button list if it’s a new verb.

Debugging

F12 → Console: logs show handled action types and Ink keys.

Dev Log (bottom card) mirrors all internal events and errors.

Ink exceptions are caught and logged in red.

🧠 Design Principles

JS = Logic, Ink = Words.

Ink files never change variables that affect game math (only display).

Everything the player can do is a JS function; everything they read is Ink.

Areas & nodes (rooms) are small, interconnected modules.

📜 Current Features

Dialogue + action system

Basic resources (Soul, Energy)

Day cycle & hunger

Chronicle log

Rat encounter & pool death

Cave → Forest transition (in progress)

Mobile-friendly responsive UI

🔮 Planned / In Progress

See TODO.md
 for a living checklist.

Highlights:

Save/load system

Seeded RNG for encounters

Status effects (Wet, Poisoned)

Map/area navigation UI

Quest + minion management (future arcs)

Audio/SFX + ambient visuals

Localization framework (future)