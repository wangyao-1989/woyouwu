import { useState, useEffect, useRef, useCallback } from 'react';

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;
const INITIAL_SPEED = 500;

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#06b6d4' },
  O: { shape: [[1,1],[1,1]], color: '#eab308' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#3b82f6' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#f97316' },
};

const PIECE_NAMES = Object.keys(TETROMINOES);

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece() {
  const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
  const piece = TETROMINOES[name];
  return {
    name,
    shape: piece.shape.map(row => [...row]),
    color: piece.color,
    x: Math.floor((COLS - piece.shape[0].length) / 2),
    y: 0,
  };
}

function rotateShape(shape) {
  return shape[0].map((_, col) => shape.map(row => row[col]).reverse());
}

function isValid(shape, board, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = x + c;
        const newY = y + r;
        if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
          return false;
        }
      }
    }
  }
  return true;
}

function mergePiece(board, piece) {
  const newBoard = board.map(row => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const y = piece.y + r;
        const x = piece.x + c;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          newBoard[y][x] = piece.color;
        }
      }
    }
  }
  return newBoard;
}

function clearLines(board) {
  const newBoard = board.filter(row => row.some(cell => cell === null));
  const cleared = ROWS - newBoard.length;
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(null));
  }
  return { board: newBoard, cleared };
}

export default function TetrisGame() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef(null);

  const spawnPiece = useCallback((board) => {
    const piece = nextPiece || randomPiece();
    const newNext = randomPiece();
    if (!isValid(piece.shape, board, piece.x, piece.y)) {
      setGameOver(true);
      setCurrentPiece(piece);
      setNextPiece(newNext);
      return;
    }
    setCurrentPiece(piece);
    setNextPiece(newNext);
  }, [nextPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    let newY = currentPiece.y;
    while (isValid(currentPiece.shape, board, currentPiece.x, newY + 1)) {
      newY++;
    }
    const droppedPiece = { ...currentPiece, y: newY };
    const newBoard = mergePiece(board, droppedPiece);
    const { board: clearedBoard, cleared } = clearLines(newBoard);
    setBoard(clearedBoard);
    setScore(s => s + cleared * 100 * level + 2);
    if (cleared > 0) {
      setLevel(l => Math.min(Math.floor((s => s + cleared * 100 * level)(score) / 1000) + 1, 10));
    }
    setCurrentPiece(null);
    spawnPiece(clearedBoard);
  }, [currentPiece, board, gameOver, isPaused, level, score, spawnPiece]);

  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver || isPaused) return;
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    if (isValid(currentPiece.shape, board, newX, newY)) {
      setCurrentPiece(prev => ({ ...prev, x: newX, y: newY }));
    } else if (dy === 1) {
      hardDrop();
    }
  }, [currentPiece, board, gameOver, isPaused, hardDrop]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const rotated = rotateShape(currentPiece.shape);
    if (isValid(rotated, board, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }));
    }
  }, [currentPiece, board, gameOver, isPaused]);

  const startGame = useCallback(() => {
    setBoard(createEmptyBoard());
    const first = randomPiece();
    const second = randomPiece();
    setCurrentPiece(first);
    setNextPiece(second);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    setIsStarted(true);
  }, []);

  useEffect(() => {
    if (!isStarted || gameOver) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); movePiece(-1, 0); break;
        case 'ArrowRight': e.preventDefault(); movePiece(1, 0); break;
        case 'ArrowDown': e.preventDefault(); movePiece(0, 1); break;
        case 'ArrowUp': e.preventDefault(); rotatePiece(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
        case 'p': case 'P': setIsPaused(prev => !prev); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, gameOver, movePiece, rotatePiece, hardDrop]);

  useEffect(() => {
    if (!isStarted || gameOver || isPaused) return;

    const speed = Math.max(100, INITIAL_SPEED - (level - 1) * 40);

    gameLoopRef.current = setInterval(() => {
      movePiece(0, 1);
    }, speed);

    return () => clearInterval(gameLoopRef.current);
  }, [isStarted, gameOver, isPaused, level, movePiece]);

  // 初始生成
  useEffect(() => {
    if (isStarted && !currentPiece && !gameOver) {
      spawnPiece(board);
    }
  }, [isStarted, currentPiece, gameOver, board, spawnPiece]);

  const renderBoard = () => {
    const display = board.map(row => [...row]);
    if (currentPiece && !gameOver) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const y = currentPiece.y + r;
            const x = currentPiece.x + c;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
              display[y][x] = currentPiece.color;
            }
          }
        }
      }
    }
    return display;
  };

  const display = renderBoard();

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="text-sm font-bold text-gray-700">🧱 俄罗斯方块</div>
        <div className="flex gap-3">
          <div className="text-xs text-gray-500">Lv.{level}</div>
          <div className="text-sm font-bold text-purple-600">得分: {score}</div>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* 游戏主面板 */}
        <div
          className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700"
          style={{ width: COLS * CELL_SIZE, height: ROWS * CELL_SIZE }}
        >
          {!isStarted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
              <p className="text-white text-lg font-bold mb-3">🧱 俄罗斯方块</p>
              <p className="text-gray-300 text-xs mb-4">方向键移动 · 上旋转 · 空格硬降</p>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition text-sm"
              >
                开始游戏
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
              <p className="text-red-400 text-lg font-bold mb-1">游戏结束</p>
              <p className="text-white text-sm mb-3">得分: {score} · 等级: {level}</p>
              <button
                onClick={startGame}
                className="px-6 py-2 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition text-sm"
              >
                重新开始
              </button>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <p className="text-white text-lg font-bold">已暂停</p>
            </div>
          )}

          {display.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="absolute"
                style={{
                  left: x * CELL_SIZE,
                  top: y * CELL_SIZE,
                  width: CELL_SIZE - 1,
                  height: CELL_SIZE - 1,
                  backgroundColor: cell || '#1e293b',
                  borderRadius: cell ? '2px' : 0,
                  border: cell ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.03)',
                }}
              />
            ))
          )}
        </div>

        {/* 下一个方块 */}
        {isStarted && nextPiece && (
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-500 mb-2">下一个</p>
            <div
              className="bg-gray-900 rounded-lg p-2 border border-gray-700"
              style={{ minWidth: 4 * CELL_SIZE, minHeight: 4 * CELL_SIZE }}
            >
              {nextPiece.shape.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={r * 4 + c}
                    className="absolute"
                    style={{
                      left: c * CELL_SIZE + 8,
                      top: r * CELL_SIZE + 8,
                      width: CELL_SIZE - 1,
                      height: CELL_SIZE - 1,
                      backgroundColor: cell ? nextPiece.color : 'transparent',
                      borderRadius: cell ? '2px' : 0,
                      border: cell ? '1px solid rgba(255,255,255,0.15)' : 'none',
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {isStarted && (
        <p className="text-xs text-gray-400 mt-2">
          ← → 移动 · ↑ 旋转 · ↓ 加速 · 空格硬降 · P 暂停
        </p>
      )}
    </div>
  );
}
