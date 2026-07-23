import { useState, useEffect, useRef, useCallback } from 'react';

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 28;
const INITIAL_SPEED = 500;

const BLOCKS = {
  I: { shape: [[1,1,1,1]], light: '#00f0ff', dark: '#0088aa', glow: '#00f0ff' },
  O: { shape: [[1,1],[1,1]], light: '#ffdd00', dark: '#cc8800', glow: '#ffdd00' },
  T: { shape: [[0,1,0],[1,1,1]], light: '#c840ff', dark: '#6a00cc', glow: '#c840ff' },
  S: { shape: [[0,1,1],[1,1,0]], light: '#00ff40', dark: '#00aa20', glow: '#00ff40' },
  Z: { shape: [[1,1,0],[0,1,1]], light: '#ff3366', dark: '#cc0033', glow: '#ff3366' },
  J: { shape: [[1,0,0],[1,1,1]], light: '#4488ff', dark: '#0044cc', glow: '#4488ff' },
  L: { shape: [[0,0,1],[1,1,1]], light: '#ff8844', dark: '#cc4400', glow: '#ff8844' },
};

const PIECE_NAMES = Object.keys(BLOCKS);

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
  const b = BLOCKS[name];
  return {
    name,
    shape: b.shape.map(row => [...row]),
    light: b.light, dark: b.dark, glow: b.glow,
    x: Math.floor((COLS - b.shape[0].length) / 2),
    y: 0,
  };
}

function rotateShape(shape) {
  return shape[0].map((_, col) => shape.map(row => row[col]).reverse());
}

function isValid(shape, board, x, y) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const nx = x + c, ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) return false;
      }
  return true;
}

function mergePiece(board, piece) {
  const b = board.map(row => [...row]);
  const info = { light: piece.light, dark: piece.dark, glow: piece.glow };
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) {
        const y = piece.y + r, x = piece.x + c;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) b[y][x] = info;
      }
  return b;
}

function getGhostY(piece, board) {
  let gy = piece.y;
  while (isValid(piece.shape, board, piece.x, gy + 1)) gy++;
  return gy;
}

function clearLines(board) {
  const full = [];
  for (let y = 0; y < ROWS; y++) if (board[y].every(c => c !== null)) full.push(y);
  const nb = board.filter((_, i) => !full.includes(i));
  while (nb.length < ROWS) nb.unshift(Array(COLS).fill(null));
  return { board: nb, cleared: full.length, rows: full };
}

export default function TetrisGame() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clearingRows, setClearingRows] = useState([]);
  const [comboText, setComboText] = useState('');
  const [scorePop, setScorePop] = useState(null);
  const gameLoopRef = useRef(null);
  const clearTimerRef = useRef(null);

  const spawnPiece = useCallback((brd) => {
    const piece = nextPiece || randomPiece();
    const newNext = randomPiece();
    if (!isValid(piece.shape, brd, piece.x, piece.y)) {
      setGameOver(true);
      setCurrentPiece(piece);
      setNextPiece(newNext);
      return;
    }
    setCurrentPiece(piece);
    setNextPiece(newNext);
  }, [nextPiece]);

  const lockPiece = useCallback((brd, piece) => {
    const newBoard = mergePiece(brd, piece);
    const { board: clearedBoard, cleared, rows } = clearLines(newBoard);
    if (cleared > 0) {
      setClearingRows(rows);
      const txt = cleared === 4 ? 'TETRIS!' : cleared === 3 ? 'Triple!' : cleared === 2 ? 'Double!' : 'Single!';
      const emoji = cleared === 4 ? '🔥' : cleared === 3 ? '✨' : cleared === 2 ? '⚡' : '';
      setScorePop({ text: `${txt} ${emoji}`, key: Date.now() });
      setComboText(txt + ' ' + emoji);
      setTimeout(() => setComboText(''), 900);
      const pts = [0, 100, 300, 500, 800][cleared] * level;
      setScore(s => s + pts);
      setLines(l => l + cleared);
      setLevel(l => Math.min(10, Math.floor((lines + cleared + 1) / 10) + 1));
      clearTimerRef.current = setTimeout(() => {
        setBoard(clearedBoard);
        setClearingRows([]);
        setCurrentPiece(null);
        spawnPiece(clearedBoard);
      }, 300);
    } else {
      setBoard(clearedBoard);
      setCurrentPiece(null);
      spawnPiece(clearedBoard);
    }
  }, [level, lines, spawnPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || clearingRows.length > 0) return;
    const gy = getGhostY(currentPiece, board);
    lockPiece(board, { ...currentPiece, y: gy });
  }, [currentPiece, board, gameOver, isPaused, clearingRows, lockPiece]);

  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver || isPaused || clearingRows.length > 0) return;
    const nx = currentPiece.x + dx, ny = currentPiece.y + dy;
    if (isValid(currentPiece.shape, board, nx, ny)) {
      setCurrentPiece(prev => ({ ...prev, x: nx, y: ny }));
    } else if (dy === 1) {
      lockPiece(board, currentPiece);
    }
  }, [currentPiece, board, gameOver, isPaused, clearingRows, lockPiece]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || clearingRows.length > 0) return;
    const rotated = rotateShape(currentPiece.shape);
    if (isValid(rotated, board, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }));
    }
  }, [currentPiece, board, gameOver, isPaused, clearingRows]);

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setClearingRows([]); setComboText(''); setScorePop(null);
    const first = randomPiece(), second = randomPiece();
    setCurrentPiece(first); setNextPiece(second);
    setScore(0); setLevel(1); setLines(0);
    setGameOver(false); setIsPaused(false); setIsStarted(true);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isStarted || gameOver) return;
    const h = (e) => {
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); movePiece(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePiece(1, 0); break;
        case 'ArrowDown': e.preventDefault(); movePiece(0, 1); break;
        case 'ArrowUp': e.preventDefault(); rotatePiece(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
        case 'p': case 'P': setIsPaused(prev => !prev); break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isStarted, gameOver, movePiece, rotatePiece, hardDrop]);

  useEffect(() => {
    if (!isStarted || gameOver || isPaused || clearingRows.length > 0) return;
    const speed = Math.max(80, INITIAL_SPEED - (level - 1) * 40);
    gameLoopRef.current = setInterval(() => movePiece(0, 1), speed);
    return () => clearInterval(gameLoopRef.current);
  }, [isStarted, gameOver, isPaused, level, movePiece, clearingRows]);

  useEffect(() => {
    if (isStarted && !currentPiece && !gameOver && clearingRows.length === 0) spawnPiece(board);
  }, [isStarted, currentPiece, gameOver, board, spawnPiece, clearingRows]);

  useEffect(() => () => clearTimeout(clearTimerRef.current), []);

  const ghostY = currentPiece && !gameOver ? getGhostY(currentPiece, board) : null;

  const display = board.map(row => [...row]);
  if (currentPiece && !gameOver && clearingRows.length === 0) {
    for (let r = 0; r < currentPiece.shape.length; r++)
      for (let c = 0; c < currentPiece.shape[r].length; c++)
        if (currentPiece.shape[r][c]) {
          const y = currentPiece.y + r, x = currentPiece.x + c;
          if (y >= 0 && y < ROWS) display[y][x] = currentPiece;
        }
  }

  const boardW = COLS * CELL_SIZE, boardH = ROWS * CELL_SIZE;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-4 px-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🧱</span> 俄罗斯方块
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span className="text-xs text-slate-400">Lv</span>
            <span className="text-sm font-bold text-violet-400 tabular-nums">{level}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
            <span className="text-xs text-slate-400">行</span>
            <span className="text-sm font-bold text-amber-400 tabular-nums">{lines}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
            <span className="text-xs text-violet-300">得分</span>
            <span className="text-sm font-bold text-violet-400 tabular-nums">{score}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative" style={{ width: boardW, height: boardH }}>
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-violet-900/30"
            style={{ width: boardW, height: boardH, background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)' }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]">
              {Array.from({ length: ROWS + 1 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i * CELL_SIZE} x2={boardW} y2={i * CELL_SIZE} stroke="#fff" strokeWidth="0.5" />
              ))}
              {Array.from({ length: COLS + 1 }).map((_, i) => (
                <line key={`v${i}`} x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={boardH} stroke="#fff" strokeWidth="0.5" />
              ))}
            </svg>

            {!isStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                <p className="text-4xl mb-3">🧱</p>
                <p className="text-white text-lg font-bold mb-1">俄罗斯方块</p>
                <p className="text-slate-400 text-xs mb-5">方向键移动 · 上旋转 · 空格硬降</p>
                <button onClick={startGame} className="px-7 py-2.5 bg-violet-500 hover:bg-violet-400 text-white rounded-xl font-bold transition shadow-lg shadow-violet-500/25">
                  开始游戏
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                <p className="text-rose-400 text-lg font-bold mb-1">游戏结束</p>
                <p className="text-white text-3xl font-bold mb-1">{score}</p>
                <p className="text-slate-400 text-xs mb-1">Lv.{level} · {lines} 行</p>
                <button onClick={startGame} className="mt-4 px-7 py-2.5 bg-violet-500 hover:bg-violet-400 text-white rounded-xl font-bold transition shadow-lg shadow-violet-500/25">
                  重新开始
                </button>
              </div>
            )}

            {isPaused && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                <p className="text-white text-xl font-bold tracking-widest">已暂停</p>
              </div>
            )}

            {/* 幽灵方块 */}
            {currentPiece && !gameOver && ghostY !== null && ghostY !== currentPiece.y && clearingRows.length === 0 &&
              currentPiece.shape.map((row, r) =>
                row.map((cell, c) => cell ? (
                  <div key={`g-${r}-${c}`} className="absolute rounded-[3px] border-2 border-dashed"
                    style={{
                      left: (currentPiece.x + c) * CELL_SIZE + 2,
                      top: (ghostY + r) * CELL_SIZE + 2,
                      width: CELL_SIZE - 4, height: CELL_SIZE - 4,
                      borderColor: currentPiece.light + '80',
                      backgroundColor: currentPiece.light + '10',
                    }}
                  />
                ) : null)
              )
            }

            {/* 3D 方块 */}
            {display.map((row, y) =>
              row.map((cell, x) => {
                if (!cell) return null;
                const isClearing = clearingRows.includes(y);
                const c = cell.light || cell, d = cell.dark || cell;
                return (
                  <div key={`${y}-${x}`} className="absolute rounded-[3px]"
                    style={{
                      left: x * CELL_SIZE + 1, top: y * CELL_SIZE + 1,
                      width: CELL_SIZE - 2, height: CELL_SIZE - 2,
                      background: `linear-gradient(135deg, ${c} 0%, ${d} 100%)`,
                      boxShadow: `inset 2px 2px 4px rgba(255,255,255,0.25), inset -2px -2px 4px rgba(0,0,0,0.4), 0 0 6px ${c}60`,
                      border: '1px solid rgba(255,255,255,0.12)',
                      opacity: isClearing ? 0 : 1,
                      transform: isClearing ? 'scale(1.1)' : 'scale(1)',
                      transition: isClearing ? 'opacity 0.3s, transform 0.3s' : 'none',
                    }}
                  />
                );
              })
            )}

            {/* 消除闪光 */}
            {clearingRows.map(y => (
              <div key={`flash-${y}`} className="absolute w-full rounded-lg"
                style={{
                  top: y * CELL_SIZE, height: CELL_SIZE,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                  animation: 'tetrisFlash 0.3s ease-out',
                }}
              />
            ))}

            {/* 消除文字 */}
            {comboText && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <span className="text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" style={{ animation: 'tetrisCombo 0.9s ease-out forwards' }}>
                  {comboText}
                </span>
              </div>
            )}

            {/* 得分弹出 */}
            {scorePop && (
              <div key={scorePop.key} className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none z-20 text-sm font-bold text-amber-400" style={{ animation: 'tetrisScorePop 1s ease-out forwards', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }}>
                +{scorePop.text}
              </div>
            )}
          </div>
        </div>

        {/* 侧边 */}
        <div className="flex flex-row sm:flex-col gap-3">
          {isStarted && nextPiece && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-3">
              <p className="text-xs text-slate-400 mb-2 text-center">下一个</p>
              <div className="relative bg-slate-950 rounded-xl border border-slate-700" style={{ width: 4 * CELL_SIZE, height: 4 * CELL_SIZE }}>
                {nextPiece.shape.map((row, r) =>
                  row.map((cell, c) => cell ? (
                    <div key={`n-${r}-${c}`}
                      style={{
                        position: 'absolute', left: c * CELL_SIZE + 1, top: r * CELL_SIZE + 1,
                        width: CELL_SIZE - 2, height: CELL_SIZE - 2,
                        background: `linear-gradient(135deg, ${nextPiece.light} 0%, ${nextPiece.dark} 100%)`,
                        borderRadius: '3px',
                        boxShadow: `inset 2px 2px 3px rgba(255,255,255,0.2), inset -2px -2px 3px rgba(0,0,0,0.3), 0 0 4px ${nextPiece.light}40`,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                  ) : null)
                )}
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-3 text-xs text-slate-400 leading-loose">
            <p>← → 移动</p><p>↑ 旋转</p><p>↓ 加速</p><p>空格 硬降</p><p>P 暂停</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tetrisFlash { 0% { opacity: 0 } 50% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes tetrisCombo { 0% { opacity: 0; transform: scale(0.5) } 30% { opacity: 1; transform: scale(1.2) } 100% { opacity: 0; transform: scale(1.5) translateY(-20px) } }
        @keyframes tetrisScorePop { 0% { opacity: 1; transform: translateY(0) } 100% { opacity: 0; transform: translateY(-40px) } }
      `}</style>
    </div>
  );
}
