import { useState, useEffect, useRef, useCallback } from 'react';
// 关卡数据： #墙  $箱  .目标  @人  *箱到位  +人在目标
const LEVELS = [
  {
    name: '第 1 关',
    map: [
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
    ],
  },
  {
    name: '第 2 关',
    map: [
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
    ],
  },
  {
    name: '第 3 关',
    map: [
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
    ],
  },
  {
    name: '第 4 关',
    map: [
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
    ],
  },
  {
    name: '第 5 关',
    map: [
      '  ######   ',
      '  #    ### ',
      '  # #$#  # ',
      '##### $  # ',
      '#  .  $$ # ',
      '#  .  ### ',
      '#####  #  ',
      '  # @  #  ',
      '  ######  ',
    ],
  },
];

function parseLevel(map) {
  const walls = [];
  const boxes = [];
  const targets = [];
  let player = null;

  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      const ch = map[r][c];
      if (ch === '#') walls.push({ x: c, y: r });
      else if (ch === '$') boxes.push({ x: c, y: r });
      else if (ch === '.') targets.push({ x: c, y: r });
      else if (ch === '*') { boxes.push({ x: c, y: r }); targets.push({ x: c, y: r }); }
      else if (ch === '@') player = { x: c, y: r };
      else if (ch === '+') { player = { x: c, y: r }; targets.push({ x: c, y: r }); }
    }
  }
  return { walls, boxes, targets, player };
}

function isWin(boxes, targets) {
  return boxes.length === targets.length && boxes.every(b => targets.some(t => t.x === b.x && t.y === b.y));
}

function cloneState({ walls, boxes, targets, player }) {
  return {
    walls: walls.map(w => ({ ...w })),
    boxes: boxes.map(b => ({ ...b })),
    targets: targets.map(t => ({ ...t })),
    player: { ...player },
  };
}

export default function SokobanGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState([]);
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(32);

  const loadLevel = useCallback((idx) => {
    const parsed = parseLevel(LEVELS[idx].map);
    setGameState(parsed);
    setMoves(0);
    setWon(false);
    setHistory([]);
  }, []);

  useEffect(() => { loadLevel(0); }, [loadLevel]);

  // 自适应 CELL 尺寸（用 ResizeObserver 替代 resize 事件，更可靠）
  useEffect(() => {
    if (!containerRef.current || !gameState) return;
    const el = containerRef.current;

    const calcSize = () => {
      const containerW = el.clientWidth;
      if (!containerW) return;

      const { walls, boxes, targets, player } = gameState;
      const all = [...walls, ...targets, player, ...boxes];
      const cols = Math.max(...all.map(c => c.x)) - Math.min(...all.map(c => c.x)) + 1;
      const rows = Math.max(...all.map(c => c.y)) - Math.min(...all.map(c => c.y)) + 1;

      const maxW = containerW - 16;
      const maxH = 480;
      setCellSize(Math.max(24, Math.min(Math.floor(maxW / cols), Math.floor(maxH / rows))));
    };

    calcSize();
    const ro = new ResizeObserver(calcSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gameState]);

  const tryMove = useCallback((dx, dy) => {
    if (!gameState || won) return;
    const { walls, boxes, targets, player } = gameState;
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (walls.some(w => w.x === nx && w.y === ny)) return;

    const boxIdx = boxes.findIndex(b => b.x === nx && b.y === ny);
    if (boxIdx !== -1) {
      const bx = nx + dx;
      const by = ny + dy;
      if (walls.some(w => w.x === bx && w.y === by) || boxes.some(b => b.x === bx && b.y === by)) return;

      const newBoxes = boxes.map((b, i) => i === boxIdx ? { x: bx, y: by } : { ...b });
      const newState = { walls, boxes: newBoxes, targets, player: { x: nx, y: ny } };
      setHistory(prev => [...prev, cloneState(gameState)]);
      setGameState(newState);
      setMoves(m => m + 1);
      if (isWin(newBoxes, targets)) setWon(true);
      return;
    }

    setHistory(prev => [...prev, cloneState(gameState)]);
    setGameState({ walls, boxes: boxes.map(b => ({ ...b })), targets, player: { x: nx, y: ny } });
    setMoves(m => m + 1);
  }, [gameState, won]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setGameState(prev);
    setHistory(h => h.slice(0, -1));
    setMoves(m => Math.max(0, m - 1));
    setWon(false);
  }, [history]);

  const resetLevel = useCallback(() => { loadLevel(levelIndex); }, [levelIndex, loadLevel]);
  const nextLevel = useCallback(() => {
    if (levelIndex < LEVELS.length - 1) {
      const next = levelIndex + 1;
      setLevelIndex(next);
      loadLevel(next);
    }
  }, [levelIndex, loadLevel]);

  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); tryMove(0, -1); break;
        case 'ArrowDown': e.preventDefault(); tryMove(0, 1); break;
        case 'ArrowLeft': e.preventDefault(); tryMove(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); tryMove(1, 0); break;
        case 'z': case 'Z': e.preventDefault(); undo(); break;
        case 'r': case 'R': e.preventDefault(); resetLevel(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tryMove, undo, resetLevel]);

  if (!gameState) return null;

  const { walls, boxes, targets, player } = gameState;
  const allCells = [...walls, ...targets, player, ...boxes];
  const minX = Math.min(...allCells.map(c => c.x));
  const maxX = Math.max(...allCells.map(c => c.x));
  const minY = Math.min(...allCells.map(c => c.y));
  const maxY = Math.max(...allCells.map(c => c.y));
  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;
  const offsetX = -minX;
  const offsetY = -minY;

  // 构建网格二维数组
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  walls.forEach(w => { grid[w.y + offsetY][w.x + offsetX] = 'wall'; });
  targets.forEach(t => {
    grid[t.y + offsetY][t.x + offsetX] = grid[t.y + offsetY][t.x + offsetX] === 'wall' ? 'wall' : 'target';
  });
  boxes.forEach(b => {
    const onT = targets.some(t => t.x === b.x && t.y === b.y);
    grid[b.y + offsetY][b.x + offsetX] = onT ? 'box-ok' : 'box';
  });
  if (player) {
    grid[player.y + offsetY][player.x + offsetX] = 'player';
  }

  const targetSet = new Set(targets.map(t => `${t.x},${t.y}`));

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="text-sm font-bold text-gray-700">📦 推箱子</div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{LEVELS[levelIndex].name}</span>
          <span>步数: {moves}</span>
        </div>
      </div>

      <div
        className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700"
        style={{ width: cols * cellSize, height: rows * cellSize }}
      >
        <svg width={cols * cellSize} height={rows * cellSize}>
          {/* 地面 + 墙壁 + 目标 */}
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const x = c * cellSize;
              const y = r * cellSize;
              if (cell === 'wall') {
                return (
                  <g key={`${r}-${c}`}>
                    <rect x={x} y={y} width={cellSize} height={cellSize} fill="#1e293b" />
                    <rect x={x} y={y} width={cellSize} height={cellSize} fill="#475569" rx="3" />
                    <rect x={x + 2} y={y + 2} width={8} height={8} fill="#64748b" opacity="0.3" rx="1" />
                    <rect x={x + cellSize - 10} y={y + cellSize - 10} width={8} height={8} fill="#64748b" opacity="0.3" rx="1" />
                  </g>
                );
              }
              // 地面
              return (
                <g key={`${r}-${c}`}>
                  <rect x={x} y={y} width={cellSize} height={cellSize} fill="#1e293b" />
                  {/* 目标点 */}
                  {cell === 'target' && (
                    <>
                      <circle cx={x + cellSize / 2} cy={y + cellSize / 2} r={Math.max(3, cellSize * 0.14)} fill="#f97316" opacity="0.6" />
                      <circle cx={x + cellSize / 2} cy={y + cellSize / 2} r={Math.max(1.5, cellSize * 0.06)} fill="#f97316" opacity="0.3" />
                    </>
                  )}
                </g>
              );
            })
          )}

          {/* 箱子 */}
          {boxes.map((b, i) => {
            const x = (b.x + offsetX) * cellSize;
            const y = (b.y + offsetY) * cellSize;
            const onTarget = targetSet.has(`${b.x},${b.y}`);
            const bg = onTarget ? '#22c55e' : '#d97706';
            return (
              <g key={`box-${i}`}>
                <rect x={x + 2} y={y + 2} width={cellSize - 4} height={cellSize - 4} fill={bg} rx="4" />
                <rect x={x + 5} y={y + 5} width={cellSize - 10} height={cellSize - 10} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" rx="2" />
                {onTarget && (
                  <text x={x + cellSize / 2} y={y + cellSize / 2} dominantBaseline="central" textAnchor="middle" fill="white" fontSize={Math.max(10, cellSize * 0.35)} fontWeight="bold">✓</text>
                )}
              </g>
            );
          })}

          {/* 玩家 */}
          {player && (
            <circle
              cx={(player.x + offsetX) * cellSize + cellSize / 2}
              cy={(player.y + offsetY) * cellSize + cellSize / 2}
              r={cellSize * 0.38}
              fill="#3b82f6"
            />
          )}
        </svg>

        {/* 过关弹窗 */}
        {won && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30">
            <p className="text-green-400 text-xl font-bold mb-1">🎉 过关！</p>
            <p className="text-white text-sm mb-3">用了 {moves} 步</p>
            <div className="flex gap-3">
              {levelIndex < LEVELS.length - 1 ? (
                <button onClick={nextLevel} className="px-5 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition text-sm">
                  下一关
                </button>
              ) : (
                <p className="text-yellow-400 text-sm font-bold">🎊 恭喜通关所有关卡！</p>
              )}
              <button onClick={resetLevel} className="px-5 py-2 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition text-sm">
                重玩
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          onClick={undo}
          disabled={history.length === 0 || won}
          className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition disabled:opacity-40"
        >
          ↩ 撤回 (Z)
        </button>
        <button
          onClick={resetLevel}
          className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
        >
          🔄 重置 (R)
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">方向键移动 · Z 撤回 · R 重置</p>
    </div>
  );
}
