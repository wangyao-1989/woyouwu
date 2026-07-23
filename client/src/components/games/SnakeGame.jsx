import { useState, useEffect, useRef, useCallback } from 'react';

const GRID = 20, CELL = 28;
const W = GRID * CELL, H = GRID * CELL;
const SPEED = 120;

const DIR = {
  ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1},
  ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0},
};

function randFood(snake) {
  let p;
  do { p = {x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID)}; }
  while (snake.some(s => s.x===p.x && s.y===p.y));
  return p;
}

function init() {
  return { snake: [{x:10,y:10}], food: {x:15,y:10}, dir: {x:1,y:0}, nextDir: {x:1,y:0}, over: false, score: 0, particles: [] };
}

export default function SnakeGame() {
  const [tick, setTick] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('snake_best')||'0'));
  const st = useRef(init());
  const loop = useRef(null);
  const lastPaused = useRef(false);

  const render = useCallback(() => setTick(t => t+1), []);

  const start = useCallback(() => {
    st.current = init(); setPaused(false); setStarted(true); render();
  }, [render]);

  useEffect(() => {
    if (!started) return;
    if (loop.current) { clearInterval(loop.current); loop.current = null; }
    if (st.current.over || paused) return;
    loop.current = setInterval(() => {
      const s = st.current;
      if (s.over || paused) return;
      const d = s.nextDir;
      const h = s.snake[0];
      const nh = {x: h.x+d.x, y: h.y+d.y};
      if (nh.x<0||nh.x>=GRID||nh.y<0||nh.y>=GRID) { s.over=true; render(); return; }
      if (s.snake.some(seg => seg.x===nh.x&&seg.y===nh.y)) { s.over=true; render(); return; }
      const ate = nh.x===s.food.x && nh.y===s.food.y;
      s.snake = [nh, ...s.snake];
      if (!ate) s.snake.pop();
      if (ate) {
        s.score++;
        s.particles = s.particles.concat([{x: s.food.x, y: s.food.y, life: 1, id: Date.now()+Math.random()}]);
        s.food = randFood(s.snake);
      }
      s.dir = d;
      // 衰减粒子
      s.particles = s.particles.filter(p => { p.life -= 0.04; return p.life > 0; });
      render();
    }, SPEED);
    return () => { if (loop.current) clearInterval(loop.current); };
  }, [started, paused]);

  useEffect(() => {
    if (!started) return;
    const h = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const nd = DIR[e.key];
        const s = st.current;
        const cd = paused ? s.dir : s.nextDir;
        if (!(nd.x === -cd.x && nd.y === -cd.y)) s.nextDir = nd;
      }
      if (e.key===' '||e.key==='p'||e.key==='P') setPaused(prev => !prev);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [started, paused]);

  useEffect(() => {
    if (st.current.over && st.current.score > best) {
      setBest(st.current.score);
      localStorage.setItem('snake_best', st.current.score);
    }
  }, [st.current.over, st.current.score, best]);

  const { snake, food, over, score, particles } = st.current;
  const head = snake[0];

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-4 px-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🐍</span> 贪吃蛇
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span className="text-xs text-slate-400">最高</span>
            <span className="text-sm font-bold text-amber-400 tabular-nums">{best}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-300">得分</span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">{score}</span>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-emerald-900/20"
        style={{ width: W, height: H, background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]">
          {Array.from({length: GRID+1}).map((_,i) => (
            <g key={i}>
              <line x1={i*CELL} y1={0} x2={i*CELL} y2={H} stroke="#fff" strokeWidth="0.5"/>
              <line x1={0} y1={i*CELL} x2={W} y2={i*CELL} stroke="#fff" strokeWidth="0.5"/>
            </g>
          ))}
        </svg>

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
            <p className="text-4xl mb-3">🐍</p>
            <p className="text-white text-lg font-bold mb-1">贪吃蛇</p>
            <p className="text-slate-400 text-xs mb-5">方向键移动 · 空格暂停</p>
            <button onClick={start} className="px-7 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition shadow-lg shadow-emerald-500/25">
              开始游戏
            </button>
          </div>
        )}

        {over && started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
            <p className="text-rose-400 text-lg font-bold mb-1">游戏结束</p>
            <p className="text-white text-3xl font-bold mb-1">{score}</p>
            {score >= best && score > 0 && <p className="text-amber-400 text-xs mb-3">🏆 新纪录！</p>}
            <button onClick={start} className="px-7 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition shadow-lg shadow-emerald-500/25">
              重新开始
            </button>
          </div>
        )}

        {paused && !over && started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <p className="text-white text-xl font-bold tracking-widest">已暂停</p>
          </div>
        )}

        {/* 食物粒子 */}
        {particles.map(p => (
          <div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x*CELL+CELL/2, top: p.y*CELL+CELL/2,
              width: CELL*0.8, height: CELL*0.8,
              transform: `translate(-50%, -50%) scale(${p.life})`,
              background: `radial-gradient(circle, rgba(52,211,153,${p.life}) 0%, transparent 70%)`,
              transition: 'none',
            }}
          />
        ))}

        {/* 蛇身 */}
        {snake.map((seg, i) => {
          const isHead = i === 0;
          const prev = i > 0 ? snake[i-1] : null;
          const next = i < snake.length-1 ? snake[i+1] : null;
          const progress = i / Math.max(snake.length - 1, 1);
          const r = Math.floor(52 + progress * 20);
          const g = Math.floor(211 - progress * 60);
          const b = Math.floor(153 - progress * 40);
          const color = `rgb(${r},${g},${b})`;
          const dark = `rgb(${r-20},${g-40},${b-30})`;
          return (
            <div key={i}
              className="absolute"
              style={{
                left: seg.x*CELL + 1, top: seg.y*CELL + 1,
                width: CELL-2, height: CELL-2,
                background: `linear-gradient(135deg, ${color} 0%, ${dark} 100%)`,
                borderRadius: isHead ? '7px' : '5px',
                boxShadow: isHead ? `0 0 16px rgba(52,211,153,0.6), inset 2px 2px 4px rgba(255,255,255,0.2)` : `inset 1px 1px 2px rgba(255,255,255,0.15)`,
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: snake.length - i,
                transition: 'none',
              }}
            >
              {isHead && (
                <>
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-white/80"
                    style={{
                      left: st.current.dir.x === 1 ? 13 : st.current.dir.x === -1 ? 4 : 7,
                      top: st.current.dir.y === 1 ? 13 : st.current.dir.y === -1 ? 4 : 7,
                    }}
                  />
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-white/80"
                    style={{
                      left: st.current.dir.x === 1 ? 13 : st.current.dir.x === -1 ? 4 : 13,
                      top: st.current.dir.y === 1 ? 13 : st.current.dir.y === -1 ? 4 : 13,
                    }}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* 食物 */}
        <div className="absolute animate-pulse"
          style={{
            left: food.x*CELL + 3, top: food.y*CELL + 3,
            width: CELL-6, height: CELL-6,
            background: 'radial-gradient(circle at 40% 40%, #ff6b8a, #e11d48)',
            borderRadius: '50%',
            boxShadow: '0 0 18px rgba(244,63,94,0.7), 0 0 36px rgba(244,63,94,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div className="absolute top-1 left-2 w-1 h-1 rounded-full bg-white/60" />
        </div>
      </div>

      {started && <p className="text-xs text-slate-500 mt-3">方向键移动 · 空格 / P 暂停</p>}
    </div>
  );
}
