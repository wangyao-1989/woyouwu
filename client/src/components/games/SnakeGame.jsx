import { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 28;
const GAME_WIDTH = GRID_SIZE * CELL_SIZE;
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 120;

const DIRECTION = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

function getRandomFood(snake) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function createInitialState() {
  return {
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 10 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    gameOver: false,
    score: 0,
  };
}

export default function SnakeGame() {
  const [renderTick, setRenderTick] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 用 ref 存可变游戏状态，避免闭包陷阱
  const stateRef = useRef(createInitialState());
  const gameLoopRef = useRef(null);
  const prevIsPaused = useRef(false);

  const updateRender = useCallback(() => {
    setRenderTick(t => t + 1);
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = createInitialState();
    setIsPaused(false);
    setIsStarted(true);
    updateRender();
  }, [updateRender]);

  // 游戏主循环——只创建一次，通过 ref 读写状态
  useEffect(() => {
    if (!isStarted) return;

    gameLoopRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.gameOver || isPaused) return;

      const dir = s.nextDirection;
      const head = s.snake[0];
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };

      // 撞墙检测
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        s.gameOver = true;
        updateRender();
        return;
      }

      // 撞自身检测
      if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        s.gameOver = true;
        updateRender();
        return;
      }

      // 移动
      const ate = newHead.x === s.food.x && newHead.y === s.food.y;
      s.snake = [newHead, ...s.snake];
      if (!ate) s.snake.pop();

      if (ate) {
        s.score += 1;
        s.food = getRandomFood(s.snake);
      }

      s.direction = dir;
      updateRender();
    }, INITIAL_SPEED);

    return () => clearInterval(gameLoopRef.current);
    // 注意：isPaused 不需要在 deps 里，因为 interval 回调内部读取 ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  // 暂停时清空定时器，恢复时重建
  useEffect(() => {
    if (!isStarted) return;
    if (prevIsPaused.current !== isPaused) {
      prevIsPaused.current = isPaused;
      if (isPaused) {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
      } else {
        gameLoopRef.current = setInterval(() => {
          const s = stateRef.current;
          if (s.gameOver) return;

          const dir = s.nextDirection;
          const head = s.snake[0];
          const newHead = { x: head.x + dir.x, y: head.y + dir.y };

          if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            s.gameOver = true;
            updateRender();
            return;
          }

          if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            s.gameOver = true;
            updateRender();
            return;
          }

          const ate = newHead.x === s.food.x && newHead.y === s.food.y;
          s.snake = [newHead, ...s.snake];
          if (!ate) s.snake.pop();

          if (ate) {
            s.score += 1;
            s.food = getRandomFood(s.snake);
          }

          s.direction = dir;
          updateRender();
        }, INITIAL_SPEED);
      }
    }
  }, [isStarted, isPaused, updateRender]);

  // 键盘事件
  useEffect(() => {
    if (!isStarted) return;

    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const newDir = DIRECTION[e.key];
        const s = stateRef.current;
        const curDir = isPaused ? s.direction : s.nextDirection;
        if (newDir.x !== -curDir.x || newDir.y !== -curDir.y) {
          s.nextDirection = newDir;
        }
      }
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isPaused]);

  // 从 ref 读取渲染数据
  const { snake, food, gameOver, score } = stateRef.current;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="text-sm font-bold text-gray-700">🐍 贪吃蛇</div>
        <div className="text-sm font-bold text-green-600">得分: {score}</div>
      </div>

      <div
        className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {!isStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
            <p className="text-white text-lg font-bold mb-3">🐍 贪吃蛇</p>
            <p className="text-gray-300 text-xs mb-4">方向键移动 · 空格暂停</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition text-sm"
            >
              开始游戏
            </button>
          </div>
        )}

        {gameOver && isStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
            <p className="text-red-400 text-lg font-bold mb-1">游戏结束</p>
            <p className="text-white text-sm mb-3">得分: {score}</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition text-sm"
            >
              重新开始
            </button>
          </div>
        )}

        {isPaused && !gameOver && isStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <p className="text-white text-lg font-bold">已暂停</p>
          </div>
        )}

        {/* 蛇身 */}
        {snake.map((seg, i) => (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: seg.x * CELL_SIZE,
              top: seg.y * CELL_SIZE,
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
              backgroundColor: i === 0 ? '#22c55e' : '#16a34a',
              borderRadius: i === 0 ? '3px' : '2px',
              zIndex: snake.length - i,
            }}
          />
        ))}

        {/* 食物 */}
        <div
          className="absolute rounded-full"
          style={{
            left: food.x * CELL_SIZE + 2,
            top: food.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
            backgroundColor: '#ef4444',
          }}
        />
      </div>

      {isStarted && (
        <p className="text-xs text-gray-400 mt-2">方向键移动 · 空格/P 暂停</p>
      )}
    </div>
  );
}
