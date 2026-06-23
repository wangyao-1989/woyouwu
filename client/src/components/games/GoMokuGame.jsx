import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGameSocket } from '../../context/GameSocketContext';

// ============ AI 核心 ============
function hasNeighbor(board, row, col, dist) {
  for (let r = Math.max(0, row - dist); r <= Math.min(14, row + dist); r++)
    for (let c = Math.max(0, col - dist); c <= Math.min(14, col + dist); c++)
      if (board[r][c] !== null) return true;
  return false;
}

function countDir(board, row, col, dx, dy, player) {
  let count = 1, openEnds = 0;
  let r = row + dx, c = col + dy;
  while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) { count++; r += dx; c += dy; }
  if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === null) openEnds++;
  r = row - dx; c = col - dy;
  while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) { count++; r -= dx; c -= dy; }
  if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === null) openEnds++;
  return { count, openEnds };
}

function scorePattern({ count, openEnds }) {
  if (count >= 5) return 100000;
  if (count === 4 && openEnds === 2) return 10000;
  if (count === 4 && openEnds === 1) return 1000;
  if (count === 3 && openEnds === 2) return 1000;
  if (count === 3 && openEnds === 1) return 100;
  if (count === 2 && openEnds === 2) return 100;
  if (count === 2 && openEnds === 1) return 10;
  if (count === 1 && openEnds === 2) return 10;
  if (count === 1 && openEnds === 1) return 1;
  return 0;
}

function evaluatePos(board, row, col, ai, opp) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  let aiScore = 0, oppScore = 0;
  for (const [dx, dy] of dirs) {
    aiScore += scorePattern(countDir(board, row, col, dx, dy, ai));
    oppScore += scorePattern(countDir(board, row, col, dx, dy, opp));
  }
  return aiScore * 1.1 + oppScore;
}

function getAIMove(board, aiPlayer) {
  const opp = aiPlayer === 0 ? 1 : 0;
  let best = -Infinity, bestMove = null;
  const cells = [];
  let totalPieces = 0;
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] !== null) totalPieces++;
      else if (hasNeighbor(board, r, c, 2)) cells.push({ row: r, col: c });
    }
  }
  if (totalPieces <= 1) return { row: 7, col: 7 };
  for (const cell of cells) {
    const sc = evaluatePos(board, cell.row, cell.col, aiPlayer, opp);
    if (sc > best) { best = sc; bestMove = cell; }
  }
  return bestMove || { row: 7, col: 7 };
}

function checkWin(board, row, col, player) {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for (const [dx, dy] of dirs) {
    let count = 1;
    for (let i = 1; i < 5; i++) {
      const r = row + dx * i, c = col + dy * i;
      if (r < 0 || r >= 15 || c < 0 || c >= 15 || board[r][c] !== player) break;
      count++;
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dx * i, c = col - dy * i;
      if (r < 0 || r >= 15 || c < 0 || c >= 15 || board[r][c] !== player) break;
      count++;
    }
    if (count >= 5) return true;
  }
  return false;
}

const CELL = 32;
const PAD = 20;

export default function GoMokuGame({ onlineRoomId, onlineMode }) {
  const { user } = useAuth();
  const gameSocket = onlineMode ? useGameSocket() : null;
  const [board, setBoard] = useState(Array.from({length:15},()=>Array(15).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [mode, setMode] = useState('local'); // local, ai, online
  const [winner, setWinner] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const boardRef = useRef(null);
  const aiTimerRef = useRef(null);

  // 联机监听
  useEffect(() => {
    if (!onlineMode || !gameSocket) return;
    setMode('online');
    // 如果不在这个房间里，自动加入
    if (onlineRoomId && gameSocket.currentRoom !== onlineRoomId) {
      gameSocket.joinRoom(onlineRoomId);
    }
  }, [onlineMode, gameSocket, onlineRoomId]);

  // 联机房间状态
  useEffect(() => {
    if (!onlineMode || !gameSocket || !gameSocket.roomState?.gameState) return;
    const gs = gameSocket.roomState.gameState;
    setBoard(gs.board);
    setCurrentPlayer(gs.currentPlayer);
    setWinner(null);
  }, [onlineMode, gameSocket?.roomState?.gameState]);

  useEffect(() => {
    if (!onlineMode || !gameSocket) return;
    if (gameSocket.roomState?.state === 'finished') {
      setWinner(gameSocket.roomState.winner);
    }
  }, [onlineMode, gameSocket?.roomState?.state]);

  // 人机模式 AI 走棋
  useEffect(() => {
    if (mode !== 'ai' || winner !== null || currentPlayer !== 1 || aiThinking) return;
    setAiThinking(true);
    aiTimerRef.current = setTimeout(() => {
      const move = getAIMove(board, 1);
      if (move) {
        const newBoard = board.map(r => [...r]);
        newBoard[move.row][move.col] = 1;
        setBoard(newBoard);
        setMoveHistory(h => [...h, { ...move, player: 1 }]);
        if (checkWin(newBoard, move.row, move.col, 1)) {
          setWinner(1);
        } else {
          setCurrentPlayer(0);
        }
      }
      setAiThinking(false);
    }, 300);
    return () => clearTimeout(aiTimerRef.current);
  }, [mode, currentPlayer, winner, aiThinking, board]);

  const handleClick = useCallback((row, col) => {
    if (winner !== null) return;
    if (board[row][col] !== null) return;
    if (mode === 'ai' && currentPlayer !== 0) return;
    if (mode === 'online') {
      if (gameSocket?.sendMove) gameSocket.sendMove(onlineRoomId, { row, col });
      return;
    }

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    setMoveHistory(h => [...h, { row, col, player: currentPlayer }]);
    if (checkWin(newBoard, row, col, currentPlayer)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer(currentPlayer === 0 ? 1 : 0);
    }
  }, [board, currentPlayer, winner, mode, onlineRoomId, gameSocket]);

  const resetGame = () => {
    setBoard(Array.from({length:15},()=>Array(15).fill(null)));
    setCurrentPlayer(0);
    setWinner(null);
    setMoveHistory([]);
    setAiThinking(false);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  };

  const switchMode = (newMode) => {
    if (newMode === 'online' && !user) return;
    resetGame();
    setMode(newMode);
  };

  // SVG 棋盘
  const size = CELL * 14 + PAD * 2;
  const ox = PAD, oy = PAD;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="text-sm font-bold text-gray-700">⚫ 五子棋</div>
        <div className="flex gap-1.5">
          {['local','ai','online'].map(m => {
            const labels = { local: '本地', ai: '人机', online: '联机' };
            const colors = { local: 'bg-blue-100 text-blue-600', ai: 'bg-green-100 text-green-600', online: 'bg-purple-100 text-purple-600' };
            const disabled = m === 'online' && !user;
            return (
              <button
                key={m}
                disabled={disabled}
                onClick={() => switchMode(m)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                  mode === m ? colors[m] : 'bg-gray-100 text-gray-500'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'}`}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>
      </div>

      <svg
        width={size}
        height={size}
        className="bg-amber-50 rounded-lg shadow-inner cursor-pointer"
        style={{ border: '2px solid #b8860b' }}
        ref={boardRef}
      >
        {/* 网格线 */}
        {Array.from({length:15}).map((_, i) => (
          <line key={`h${i}`} x1={ox} y1={oy + i*CELL} x2={ox + 14*CELL} y2={oy + i*CELL} stroke="#8B7355" strokeWidth="0.8" />
        ))}
        {Array.from({length:15}).map((_, i) => (
          <line key={`v${i}`} x1={ox + i*CELL} y1={oy} x2={ox + i*CELL} y2={oy + 14*CELL} stroke="#8B7355" strokeWidth="0.8" />
        ))}
        {/* 星位 */}
        {[[3,3],[3,7],[3,11],[7,3],[7,7],[7,11],[11,3],[11,7],[11,11]].map(([r,c]) => (
          <circle key={`star-${r}-${c}`} cx={ox + c*CELL} cy={oy + r*CELL} r={3} fill="#8B7355" />
        ))}
        {/* 棋子 */}
        {board.map((row, r) => row.map((cell, c) => {
          if (cell === null) return null;
          const cx = ox + c * CELL, cy = oy + r * CELL;
          return (
            <g key={`piece-${r}-${c}`}>
              <defs>
                <radialGradient id={`grad-${cell}`}>
                  <stop offset="0%" stopColor={cell === 0 ? '#fff' : '#555'} />
                  <stop offset="100%" stopColor={cell === 0 ? '#ccc' : '#111'} />
                </radialGradient>
              </defs>
              <circle cx={cx} cy={cy} r={CELL/2-2} fill={`url(#grad-${cell})`} stroke={cell === 0 ? '#999' : '#000'} strokeWidth="0.5" />
              {/* 最后一手的标记 */}
              {moveHistory.length > 0 && moveHistory[moveHistory.length-1].row === r && moveHistory[moveHistory.length-1].col === c && (
                <circle cx={cx} cy={cy} r={3} fill={cell === 0 ? '#e00' : '#f80'} />
              )}
            </g>
          );
        }))
        }
        {/* 点击区域 */}
        {Array.from({length:15}).map((_, r) => Array.from({length:15}).map((_, c) => (
          <rect
            key={`click-${r}-${c}`}
            x={ox + c*CELL - CELL/2}
            y={oy + r*CELL - CELL/2}
            width={CELL}
            height={CELL}
            fill="transparent"
            onClick={() => handleClick(r, c)}
            className="cursor-pointer"
          />
        )))}
      </svg>

      {/* 状态栏 */}
      <div className="flex items-center justify-between w-full mt-2">
        <div className="text-xs text-gray-500">
          {winner !== null
            ? (winner === -1 ? '🤝 平局' : winner === 0 ? '⚪ 白方胜' : '⚫ 黑方胜')
            : aiThinking ? '🤔 AI 思考中...' : currentPlayer === 0 ? '⚪ 白方走棋' : '⚫ 黑方走棋'}
        </div>
        <button onClick={resetGame} className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition">
          🔄 重开
        </button>
      </div>

      {mode === 'online' && !user && (
        <p className="text-xs text-red-400 mt-1">请先登录再使用联机模式</p>
      )}
    </div>
  );
}
