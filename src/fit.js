const n = v => Number(v || 0)
const avg = (...xs) => xs.reduce((a,b)=>a+n(b),0) / xs.length

export function roleFit(p, role='balanced') {
  const base = {
    pace:n(p.pace), shooting:n(p.shooting), passing:n(p.passing),
    dribbling:n(p.dribbling), defending:n(p.defending), physical:n(p.physical)
  }
  const maps = {
    striker: [base.pace*1.2, base.shooting*1.6, base.dribbling*1.15, base.physical*.75, base.passing*.55],
    winger: [base.pace*1.45, base.dribbling*1.4, base.passing*.9, base.shooting*.95, base.physical*.45],
    creator: [base.passing*1.55, base.dribbling*1.35, base.pace*.75, base.shooting*.7, base.physical*.35],
    box: [base.passing*1.15, base.dribbling*.95, base.defending*.95, base.physical*1.1, base.pace*.8, base.shooting*.75],
    holding: [base.defending*1.55, base.physical*1.3, base.passing*.9, base.pace*.55, base.dribbling*.45],
    fullback: [base.pace*1.25, base.defending*1.2, base.physical*.9, base.passing*.8, base.dribbling*.65],
    centerback: [base.defending*1.7, base.physical*1.35, base.pace*.75, base.passing*.35],
    balanced: Object.values(base)
  }
  const values = maps[role] || maps.balanced
  const weighted = values.reduce((a,b)=>a+b,0) / values.length
  const wf = Math.max(0, n(p.weak_foot)-3) * .8
  const sm = Math.max(0, n(p.skill_moves)-3) * .7
  const ps = (p.playstyles_plus?.length || 0) * 1.7 + (p.playstyles?.length || 0) * .25
  return Math.max(0, Math.min(99, Math.round(weighted + wf + sm + ps)))
}

export function bestRole(p) {
  const roles=['striker','winger','creator','box','holding','fullback','centerback']
  return roles.map(role=>({role,score:roleFit(p,role)})).sort((a,b)=>b.score-a.score)[0]
}
