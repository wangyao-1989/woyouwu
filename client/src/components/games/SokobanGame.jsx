import { useState, useEffect, useRef, useCallback } from 'react';

const LEVELS = [
  { name: '第 1 关', map: [
    '    #####      ',
    '    #   #      ',
    '    #$  #      ',
    '  ###  $##     ',
    '  #  $ $ #     ',
    '### # ## #   ######',
    '#   # ## #####  ..#',
    '# $  $          ..#',
    '##### ### #@##  ..#',
    '    #     #########',
    '    #######       ',
  ]},
  { name: '第 2 关', map: [
    '  #####      ',
    '  #   #      ',
    '  # $ #      ',
    '###  $##     ',
    '#  $ $ #     ',
    '# # ## #     ',
    '#   $ .#     ',
    '##### .#     ',
    '    #@##     ',
    '    ###      ',
  ]},
  { name: '第 3 关', map: [
    '  ######    ',
    '  #    #    ',
    '  #  # #    ',
    '  # $  #    ',
    '  # $ ##    ',
    '###  $ #    ',
    '#   #  #####',
    '# $  . .  #',
    '##### . ##',
    '    #@##  ',
    '    ###   ',
  ]},
  { name: '第 4 关', map: [
    '    ######     ',
    '    #    #     ',
    '    # #  #     ',
    '  ### $  ##    ',
    '  #  $ $  #    ',
    '### # ## # #####',
    '#   # ##  # ..#',
    '# $  $     ..#',
    '##### ### #@##',
    '    #    ####  ',
    '    ######     ',
  ]},
  { name: '第 5 关', map: [
    '  ######   ',
    '  #    ### ',
    '  # #$#  # ',
    '##### $  # ',
    '#  .  $$ # ',
    '#  .  ### ',
    '#####  #  ',
    '  # @  #  ',
    '  ######  ',
  ]},
];

function parseLevel(map) {
  const walls=[], boxes=[], targets=[];
  let player=null;
  for (let r=0; r<map.length; r++)
    for (let c=0; c<map[r].length; c++) {
      const ch=map[r][c];
      if (ch==='#') walls.push({x:c,y:r});
      else if (ch==='$') boxes.push({x:c,y:r});
      else if (ch==='.') targets.push({x:c,y:r});
      else if (ch==='*') { boxes.push({x:c,y:r}); targets.push({x:c,y:r}); }
      else if (ch==='@') player={x:c,y:r};
      else if (ch==='+') { player={x:c,y:r}; targets.push({x:c,y:r}); }
    }
  return { walls, boxes, targets, player };
}

function isWin(boxes, targets) {
  return boxes.length===targets.length && boxes.every(b=>targets.some(t=>t.x===b.x&&t.y===b.y));
}

function clone({walls, boxes, targets, player}) {
  return { walls: walls.map(w=>({...w})), boxes: boxes.map(b=>({...b})), targets: targets.map(t=>({...t})), player: {...player} };
}

export default function SokobanGame() {
  const [li, setLi] = useState(0);
  const [gs, setGs] = useState(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState([]);
  const [cellSize, setCellSize] = useState(32);
  const [playerDir, setPlayerDir] = useState('down');
  const containerRef = useRef(null);

  const load = useCallback((idx) => {
    const parsed = parseLevel(LEVELS[idx].map);
    setGs(parsed); setMoves(0); setWon(false); setHistory([]); setPlayerDir('down');
  }, []);

  useEffect(() => { load(0); }, [load]);

  useEffect(() => {
    if (!containerRef.current || !gs) return;
    const el = containerRef.current;
    const calc = () => {
      const all = [...gs.walls, ...gs.targets, gs.player, ...gs.boxes];
      const cols = Math.max(...all.map(c=>c.x)) - Math.min(...all.map(c=>c.x)) + 1;
      const rows = Math.max(...all.map(c=>c.y)) - Math.min(...all.map(c=>c.y)) + 1;
      setCellSize(Math.max(24, Math.min(Math.floor((el.clientWidth-16)/cols), Math.floor(480/rows))));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gs]);

  const tryMove = useCallback((dx, dy) => {
    if (!gs || won) return;
    setPlayerDir(dx===1?'right':dx===-1?'left':dy===1?'down':'up');
    const { walls, boxes, targets, player } = gs;
    const nx = player.x+dx, ny = player.y+dy;
    if (walls.some(w=>w.x===nx&&w.y===ny)) return;
    const bi = boxes.findIndex(b=>b.x===nx&&b.y===ny);
    if (bi!==-1) {
      const bx=nx+dx, by=ny+dy;
      if (walls.some(w=>w.x===bx&&w.y===by) || boxes.some(b=>b.x===bx&&b.y===by)) return;
      const nb = boxes.map((b,i) => i===bi?{x:bx,y:by}:{...b});
      const ns = { walls, boxes: nb, targets, player: {x:nx,y:ny} };
      setHistory(prev=>[...prev, clone(gs)]);
      setGs(ns); setMoves(m=>m+1);
      if (isWin(nb, targets)) setWon(true);
      return;
    }
    setHistory(prev=>[...prev, clone(gs)]);
    setGs({ walls, boxes: boxes.map(b=>({...b})), targets, player: {x:nx,y:ny} });
    setMoves(m=>m+1);
  }, [gs, won]);

  const undo = useCallback(() => {
    if (history.length===0 || won) return;
    const prev = history[history.length-1];
    setGs(prev); setHistory(h=>h.slice(0,-1)); setMoves(m=>Math.max(0,m-1)); setWon(false);
  }, [history, won]);

  const reset = useCallback(() => { load(li); }, [li, load]);
  const nextLevel = useCallback(() => {
    if (li < LEVELS.length-1) { const n=li+1; setLi(n); load(n); }
  }, [li, load]);

  useEffect(() => {
    const h = (e) => {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); tryMove(0,-1); break;
        case 'ArrowDown': e.preventDefault(); tryMove(0,1); break;
        case 'ArrowLeft': e.preventDefault(); tryMove(-1,0); break;
        case 'ArrowRight': e.preventDefault(); tryMove(1,0); break;
        case 'z': case 'Z': e.preventDefault(); undo(); break;
        case 'r': case 'R': e.preventDefault(); reset(); break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [tryMove, undo, reset]);

  if (!gs) return null;

  const { walls, boxes, targets, player } = gs;
  const all = [...walls, ...targets, player, ...boxes];
  const minX=Math.min(...all.map(c=>c.x)), maxX=Math.max(...all.map(c=>c.x));
  const minY=Math.min(...all.map(c=>c.y)), maxY=Math.max(...all.map(c=>c.y));
  const cols=maxX-minX+1, rows=maxY-minY+1;
  const ox=-minX, oy=-minY;
  const targetSet = new Set(targets.map(t=>`${t.x},${t.y}`));

  const grid = Array.from({length: rows}, () => Array(cols).fill(null));
  walls.forEach(w=>{grid[w.y+oy][w.x+ox]='wall';});
  targets.forEach(t=>{if(grid[t.y+oy][t.x+ox]!=='wall') grid[t.y+oy][t.x+ox]='target';});
  boxes.forEach(b=>{
    const onT = targets.some(t=>t.x===b.x&&t.y===b.y);
    grid[b.y+oy][b.x+ox] = onT?'box-ok':'box';
  });
  if (player) grid[player.y+oy][player.x+ox] = 'player';

  const dirAngles = { right: 0, down: 90, left: 180, up: 270 };

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-4 px-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">📦</span> 推箱子
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span className="text-xs text-slate-400">关卡</span>
            <span className="text-sm font-bold text-orange-400 tabular-nums">{LEVELS[li].name}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <span className="text-xs text-orange-300">步数</span>
            <span className="text-sm font-bold text-orange-400 tabular-nums">{moves}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto w-full pb-1">
        {LEVELS.map((_, idx) => (
          <button key={idx} onClick={() => { setLi(idx); load(idx); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              idx===li ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >第 {idx+1} 关</button>
        ))}
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-orange-900/20"
        style={{ width: cols*cellSize, height: rows*cellSize, background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)' }}>
        <svg width={cols*cellSize} height={rows*cellSize}>
          {grid.map((row, r) => row.map((cell, c) => {
            const x=c*cellSize, y=r*cellSize;
            if (cell==='wall') return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={cellSize} height={cellSize} fill="#0f172a" />
                <rect x={x+2} y={y+2} width={cellSize-4} height={cellSize-4} fill="#334155" rx={cellSize*0.15} />
                <rect x={x+cellSize*0.22} y={y+cellSize*0.22} width={cellSize*0.56} height={cellSize*0.56} fill="#1e293b" rx={cellSize*0.1} />
                <rect x={x+cellSize*0.26} y={y+cellSize*0.26} width={cellSize*0.48} height={cellSize*0.48} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" rx={cellSize*0.06} />
              </g>
            );
            if (cell==='target') return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={cellSize} height={cellSize} fill="transparent" />
                <circle cx={x+cellSize/2} cy={y+cellSize/2} r={Math.max(3, cellSize*0.12)} fill="#fb923c" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;0.35;0.9" dur="2.5s" repeatCount="indefinite" />
                </circle>
                <circle cx={x+cellSize/2} cy={y+cellSize/2} r={Math.max(3, cellSize*0.12)} fill="none" stroke="#fb923c" strokeWidth="1.5" opacity="0.5">
                  <animate attributeName="r" values={Math.max(3,cellSize*0.12)} to={Math.max(3,cellSize*0.25)} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                </circle>
              </g>
            );
            return <rect key={`${r}-${c}`} x={x} y={y} width={cellSize} height={cellSize} fill="transparent" />;
          }))}

          {boxes.map((b, i) => {
            const x=(b.x+ox)*cellSize, y=(b.y+oy)*cellSize;
            const onT=targetSet.has(`${b.x},${b.y}`);
            const pad=cellSize*0.12, pad2=cellSize*0.22;
            const c1=onT?'#22c55e':'#f97316', c2=onT?'#16a34a':'#ea580c';
            return (
              <g key={`box-${i}`}>
                <rect x={x+pad} y={y+pad} width={cellSize-pad*2} height={cellSize-pad*2} fill={c1} rx={cellSize*0.15} />
                <rect x={x+pad} y={y+pad} width={cellSize-pad*2} height={cellSize*0.35} fill={c2} rx={cellSize*0.1} opacity="0.4" />
                <rect x={x+pad2} y={y+pad2} width={cellSize-pad2*2} height={cellSize-pad2*2} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" rx={cellSize*0.08} />
                {onT && <text x={x+cellSize/2} y={y+cellSize/2+1} dominantBaseline="central" textAnchor="middle" fill="white" fontSize={Math.max(10,cellSize*0.35)} fontWeight="bold">✓</text>}
              </g>
            );
          })}

          {player && (
            <g transform={`translate(${(player.x+ox)*cellSize+cellSize/2},${(player.y+oy)*cellSize+cellSize/2})`}>
              <circle cx={0} cy={0} r={cellSize*0.36} fill="#38bdf8" stroke="#0ea5e9" strokeWidth="2" />
              <circle cx={0} cy={-cellSize*0.08} r={cellSize*0.18} fill="#e0f2fe" />
              <circle cx={-cellSize*0.08} cy={-cellSize*0.08} r={cellSize*0.06} fill="#0c4a6e" />
              <circle cx={cellSize*0.08} cy={-cellSize*0.08} r={cellSize*0.06} fill="#0c4a6e" />
              <line x1={0} y1={cellSize*0.08} x2={0} y2={cellSize*0.26} stroke="#0c4a6e" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
        </svg>

        {won && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-30">
            <p className="text-green-400 text-2xl font-bold mb-1">🎉 过关！</p>
            <p className="text-slate-300 text-sm mb-5">用了 {moves} 步</p>
            <div className="flex gap-3">
              {li < LEVELS.length-1 ? (
                <button onClick={nextLevel} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition shadow-lg shadow-emerald-500/25">
                  下一关
                </button>
              ) : (
                <p className="text-yellow-400 text-sm font-bold">🎊 恭喜通关所有关卡！</p>
              )}
              <button onClick={reset} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition">
                重玩
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
        <button onClick={undo} disabled={history.length===0||won}
          className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed">
          ↩ 撤回 (Z)
        </button>
        <button onClick={reset} className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition">
          🔄 重置 (R)
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-3">方向键移动 · Z 撤回 · R 重置</p>
    </div>
  );
}
