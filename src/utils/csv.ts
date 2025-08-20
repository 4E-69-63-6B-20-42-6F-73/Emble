export type ShapeName = 'circle'|'square'|'triangle'|'diamond'|'cross' | null

export function parseCSV(text: string){
  const delim =  ','
  const lines = text.trim().split(/\r?\n/)
  const head = lines[0].split(delim).map(s=>s.trim())
  const labelIdx = head.findIndex(h=>/^(label|target|class|y)$/i.test(h))
  const shapeIdx = head.findIndex(h=>/^shape$/i.test(h))
  const featIdx = head.map((_,i)=>i).filter(i=>i!==labelIdx && i!==shapeIdx)
  const rows = lines.slice(1).map(l=>l.split(delim))
  const feats: number[][] = []
  const labs: (string|null)[] = []
  const shapes: ShapeName[] = []
  for(const row of rows){
    const v = featIdx.map(i=>+row[i])
    if (v.some(x=>!Number.isFinite(x))) continue
    feats.push(v)
    labs.push(labelIdx>=0 ? row[labelIdx] : null)
    const s = shapeIdx>=0 ? (row[shapeIdx] || '').toLowerCase() : null
    shapes.push((['circle','square','triangle','diamond','cross'] as const).includes(s as any) ? s as any : null)
  }
  return {feats, labs, shapes}
}
