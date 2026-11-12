export function followsDmTurn(ui){
  return ui.role === 'dm' && !ui.tableView && ui.dmFollowTurn !== false;
}

export function partyByFloor(tokens){
  const floors = new Map();
  for (const t of tokens){
    if (t.kind === 'monster' || t.flags?.gone) continue;
    if (!floors.has(t.floor)) floors.set(t.floor, []);
    floors.get(t.floor).push(t);
  }
  return new Map([...floors].sort(([a], [b]) => a - b));
}

// Prefer the active floor. If it is empty, frame the largest group.
export function partyFrame(tokens, viewedFloor){
  const floors = partyByFloor(tokens);
  let floor = viewedFloor;
  if (!floors.has(floor)){
    let largest = 0;
    for (const [level, group] of floors) if (group.length > largest){
      floor = level; largest = group.length;
    }
  }
  const group = floors.get(floor);
  if (!group) return null;
  const left = Math.min(...group.map(t => t.x - .5));
  const right = Math.max(...group.map(t => t.x + (t.size || 1) - .5));
  const top = Math.min(...group.map(t => t.y - .5));
  const bottom = Math.max(...group.map(t => t.y + (t.size || 1) - .5));
  return { floor, x:(left + right) / 2, y:(top + bottom) / 2, width:right - left, height:bottom - top };
}

export function topViewDistance(frame, fov, aspect, { width = .72, height = .72 } = {}){
  const halfFov = Math.tan(fov * Math.PI / 360);
  const horizontal = (frame.width + 4) / (2 * aspect * halfFov * width);
  const vertical = (frame.height + 4) / (2 * halfFov * height);
  return Math.max(10, horizontal, vertical);
}
