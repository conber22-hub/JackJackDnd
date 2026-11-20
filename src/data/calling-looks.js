/* ⛨ How each Calling looks, and its Paths where they change it (docs/homebrew/callings.md): over a hero's own look
   (engine/look.js sheetLook), under whatever the player chooses for their mini. Keys are the figure builder's
   (data/looks.js: outfit, helm, cloak, off, pose, metal; render/forge/build.js draws them). The weapon in hand stays
   the sheet's own, so what they hold is what they strike with. */
export const CALLING_LOOKS = {
  vanguard:{ look:{ outfit:'relic', helm:'visor', cloak:'none', pose:'hero' },
    paths:{ hoplite:{ outfit:'cuirass', helm:'crested', off:'aspis', cloak:'cape' }, breacher:{ outfit:'relic', helm:'visor' }, hollowed:{ outfit:'relic', helm:'none', cloak:'hood' } } },
  huscarl:{ look:{ outfit:'chain', helm:'conical', cloak:'cloak', pose:'ready' },
    paths:{ 'hearth-sworn':{ off:'shield' }, rotblood:{ outfit:'hide', helm:'none' } } },
  outrider:{ look:{ outfit:'leather', cloak:'hood', pose:'sneak' } },
  marksman:{ look:{ outfit:'leather', cloak:'cloak', helm:'cap', pose:'ready' },
    paths:{ 'long-watch':{ cloak:'hood', helm:'none' } } },
  warden:{ look:{ outfit:'plate', helm:'great', cloak:'cape', pose:'regal', metal:'silver' },
    paths:{ penitent:{ cloak:'hood', helm:'none', metal:'steel' } } },
  chaplain:{ look:{ outfit:'chain', cloak:'mantle', off:'holy', pose:'ready' } },
  archivist:{ look:{ outfit:'robe', cloak:'hood', off:'lantern', pose:'caster' } },
  relicborn:{ look:{ outfit:'robe', cloak:'mantle', off:'orb', pose:'caster' } },
  seepbound:{ look:{ outfit:'rags', cloak:'hood', off:'orb', pose:'slump' } },
  herald:{ look:{ outfit:'tunic', cloak:'cape', off:'drum', pose:'hero' },
    paths:{ 'standard-bearer':{ off:'banner' } } },
  mistwalker:{ look:{ outfit:'hide', cloak:'cloak', pose:'ready' } },
  pankratiast:{ look:{ outfit:'monk', cloak:'none', helm:'none', pose:'ready' } },
};
// The look for a Calling and Path ({} for none)
export const callingLook = (calling, path) => { const c = CALLING_LOOKS[calling]; return c ? { ...c.look, ...(c.paths?.[path] || {}) } : {}; };
