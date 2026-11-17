/* 🏆 The screens between the fights, for the spec: re-exports the four modules' open/close functions so
   tests/e2e/screens.spec.js can drive them through window.DreadDelve.screens. (Claude wires the real calls
   in from wander.js and the menu; see the PR.) */
export { openVictory, victoryOpen, victoryPress, closeVictory, setVictoryFace } from './victory.js';
export { openBestiary, bestiaryOpen, bestiaryPress, closeBestiary, setBestiaryFace } from './bestiary.js';
export { trophyBanner, openTrophies, trophiesOpen, trophiesPress, closeTrophies } from './trophies.js';
export { openLevelUp, levelUpOpen, levelUpPress, closeLevelUp } from './levelup.js';
