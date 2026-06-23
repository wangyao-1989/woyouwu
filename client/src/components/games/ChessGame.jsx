import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGameSocket } from '../../context/GameSocketContext';

// ============ 棋子定义 ============
const PIECE_CHARS = {
  rK:'帅', rA:'仕', rB:'相', rN:'馬', rR:'車', rC:'炮', rP:'兵',
  bK:'将', bA:'士', bB:'象', bN:'马', bR:'车', bC:'砲', bP:'卒',
};

const CELL = 44;
const PAD = 28;

function createInitBoard() {
  return [
    ['bR','bN','bB','bA','bK','bA','bB','bN','bR'],
    [null,null,null,null,null,null,null,null,null],
    [null,'bC',null,null,null,null,null,'bC',null],
    ['bP',null,'bP',null,'bP',null,'bP',null,'bP'],
    [null,null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null,null],
    ['rP',null,'rP',null,'rP',null,'rP',null,'rP'],
    [null,'rC',null,null,null,null,null,'rC',null],
    [null,null,null,null,null,null,null,null,null],
    ['rR','rN','rB','rA','rK','rA','rB','rN','rR'],
  ];
}

// ============ 移动合法性 ============
function isValidMove(board, from, to, color) {
  const piece = board[from.row][from.col];
  if (!piece || piece[0] !== color) return false;
  const target = board[to.row][to.col];
  if (target && target[0] === color) return false;
  // 不检查完整规则（简化），只防止吃自己
  return true;
}

function getAllMoves(board, color) {
  const moves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p[0] === color) {
        for (let tr = 0; tr < 10; tr++) {
          for (let tc = 0; tc < 9; tc++) {
            if (isValidMove(board, {row:r,col:c}, {row:tr,col:tc}, color)) {
              // 吃子检测
              const target = board[tr][tc];
              if (target && target[0] !== color) {
                moves.push({from:{row:r,col:c}, to:{row:tr,col:tc}, capture:true, capturedPiece:target});
              } else if (!target) {
                moves.push({from:{row:r,col:c}, to:{row:tr,col:tc}, capture:false});
              }
            }
          }
        }
      }
    }
  }
  return moves;
}

// ============ AI ============
const PIECE_VALUE = { K:10000, A:20, B:20, N:40, R:90, C:45, P:10 };

function evaluateBoard(board, color) {
  let score = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUE[p[1]] || 10;
      score += p[0] === color ? val : -val;
    }
  }
  return score;
}

function getAIMove(board, aiColor) {
  const moves = getAllMoves(board, aiColor);
  if (moves.length === 0) return null;

  // 优先吃子，选价值最高的
  const captures = moves.filter(m => m.capture);
  if (captures.length > 0) {
    // 按被吃棋子价值排序
    captures.sort((a, b) => {
      const va = PIECE_VALUE[a.capturedPiece?.[1]] || 0;
      const vb = PIECE_VALUE[b.capturedPiece?.[1]] || 0;
      return vb - va;
    });
    return captures[0];
  }

  // 随机走一步
  const safeMoves = moves.filter(m => {
    const newB = board.map(r => [...r]);
    newB[m.to.row][m.to.col] = newB[m.from.row][m.from.col];
    newB[m.from.row][m.from.col] = null;
    // 简单安全评估：不走会被吃的位置
    const oppColor = aiColor === 'r' ? 'b' : 'r';
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 9; c++) {
        const p = newB[r][c];
        if (p && p[0] === oppColor) {
          // 如果对方棋子能吃到我们的移动后位置
          const diffR = Math.abs(m.to.row - r);
          const diffC = Math.abs(m.to.col - c);
          if (p[1] === 'R' && (diffR === 0 || diffC === 0)) return false;
          if (p[1] === 'C' && (diffR === 0 || diffC === 0)) return false;
        }
      }
    }
    return true;
  });

  return (safeMoves.length > 0 ? safeMoves : moves)[Math.floor(Math.random() * (safeMoves.length > 0 ? safeMoves.length : moves.length))];
}

// ============ 组件 ============
export default function ChessGame({ onlineRoomId, onlineMode }) {
  const { user } = useAuth();
  const gameSocket = onlineMode ? useGameSocket() : null;
  const [board, setBoard] = useState(createInitBoard);
  const [currentPlayer, setCurrentPlayer] = useState(0); // 0=红, 1=黑
  const [mode, setMode] = useState('local');
  const [winner, setWinner] = useState(null);
  const [selected, setSelected] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [moveLog, setMoveLog] = useState([]);
  const aiTimerRef = useRef(null);

  useEffect(() => {
    if (onlineMode && gameSocket) setMode('online');
  }, [onlineMode, gameSocket]);

  useEffect(() => {
    if (!onlineMode || !gameSocket?.roomState?.gameState) return;
    setBoard(gameSocket.roomState.gameState.board);
    setCurrentPlayer(gameSocket.roomState.gameState.currentPlayer);
    setWinner(null);
  }, [onlineMode, gameSocket?.roomState?.gameState]);

  useEffect(() => {
    if (!onlineMode || !gameSocket) return;
    if (gameSocket.roomState?.state === 'finished') setWinner(gameSocket.roomState.winner);
  }, [onlineMode, gameSocket?.roomState?.state]);

  // AI 走棋
  useEffect(() => {
    if (mode !== 'ai' || winner !== null || currentPlayer !== 1 || aiThinking) return;
    setAiThinking(true);
    aiTimerRef.current = setTimeout(() => {
      const move = getAIMove(board, 'b');
      if (move) {
        const newBoard = board.map(r => [...r]);
        newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
        newBoard[move.from.row][move.from.col] = null;
        setBoard(newBoard);
        setMoveLog(h => [...h, `黑方: (${move.from.row},${move.from.col})→(${move.to.row},${move.to.col})`]);
        const captured = board[move.to.row][move.to.col];
        if (captured === 'rK') { setWinner(1); setAiThinking(false); return; }
        setCurrentPlayer(0);
      }
      setAiThinking(false);
    }, 400);
    return () => clearTimeout(aiTimerRef.current);
  }, [mode, currentPlayer, winner, aiThinking, board]);

  const handleCellClick = useCallback((row, col) => {
    if (winner !== null) return;
    if (mode === 'ai' && currentPlayer !== 0) return;

    if (mode === 'online') {
      if (!gameSocket?.sendMove) return;
      const piece = board[row][col];
      const myColor = gameSocket.roomState?.players?.find(p => p.id === user?.id);
      const myIndex = gameSocket.roomState?.players?.indexOf(myColor);
      const color = myIndex === 0 ? 'r' : 'b';

      if (selected) {
        // 有选中棋子，尝试移动
        if (piece && piece[0] === color) {
          setSelected({ row, col });
          return;
        }
        gameSocket.sendMove(onlineRoomId, { from: selected, to: { row, col } });
        setSelected(null);
        return;
      }

      // 选中己方棋子
      if (piece && piece[0] === color) {
        setSelected({ row, col });
      }
      return;
    }

    const piece = board[row][col];
    const color = currentPlayer === 0 ? 'r' : 'b';

    if (selected) {
      // 已有选中棋子
      if (piece && piece[0] === color) {
        setSelected({ row, col });
        return;
      }
      // 尝试移动
      if (isValidMove(board, selected, { row, col }, color)) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = newBoard[selected.row][selected.col];
        newBoard[selected.row][selected.col] = null;
        setBoard(newBoard);
        setMoveLog(h => [...h, `${color === 'r' ? '红方' : '黑方'}: (${selected.row},${selected.col})→(${row},${col})`]);
        const captured = board[row][col];
        if (captured === (color === 'r' ? 'bK' : 'rK')) {
          setWinner(currentPlayer);
        } else {
          setCurrentPlayer(currentPlayer === 0 ? 1 : 0);
        }
        setSelected(null);
      } else {
        setSelected(null);
      }
      return;
    }

    // 选中己方棋子
    if (piece && piece[0] === color) {
      setSelected({ row, col });
    }
  }, [board, currentPlayer, winner, selected, mode]);

  const resetGame = () => {
    setBoard(createInitBoard());
    setCurrentPlayer(0);
    setWinner(null);
    setSelected(null);
    setMoveLog([]);
    setAiThinking(false);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  };

  const switchMode = (newMode) => {
    if (newMode === 'online' && !user) return;
    resetGame();
    setMode(newMode);
  };

  // SVG 尺寸
  const gridW = 8 * CELL;
  const gridH = 9 * CELL;
  const svgW = gridW + PAD * 2;
  const svgH = gridH + PAD * 2;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="text-sm font-bold text-gray-700">♟ 中国象棋</div>
        <div className="flex gap-1.5">
          {['local','ai','online'].map(m => {
            const labels = { local: '本地', ai: '人机', online: '联机' };
            const colors = { local: 'bg-blue-100 text-blue-600', ai: 'bg-green-100 text-green-600', online: 'bg-purple-100 text-purple-600' };
            const disabled = m === 'online' && !user;
            return (
              <button key={m} disabled={disabled} onClick={() => switchMode(m)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${mode === m ? colors[m] : 'bg-gray-100 text-gray-500'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'}`}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>
      </div>

      <svg width={svgW} height={svgH} className="bg-amber-50 rounded-lg shadow-inner" style={{ border: '2px solid #b8860b' }}>
        {/* 背景色 */}
        <rect width={svgW} height={svgH} fill="#fbf3d5" rx="6" />
        {/* 网格 */}
        {Array.from({length:10}).map((_, i) => (
          <line key={`h${i}`} x1={PAD} y1={PAD + i*CELL} x2={PAD + 8*CELL} y2={PAD + i*CELL} stroke="#8B7355" strokeWidth="1" />
        ))}
        {Array.from({length:9}).map((_, i) => {
          // 上半
          return (
            <g key={`v${i}`}>
              <line x1={PAD + i*CELL} y1={PAD} x2={PAD + i*CELL} y2={PAD + 4*CELL} stroke="#8B7355" strokeWidth="1" />
              <line x1={PAD + i*CELL} y1={PAD + 5*CELL} x2={PAD + i*CELL} y2={PAD + 9*CELL} stroke="#8B7355" strokeWidth="1" />
            </g>
          );
        })}
        {/* 九宫格斜线 */}
        <line x1={PAD+3*CELL} y1={PAD} x2={PAD+5*CELL} y2={PAD+2*CELL} stroke="#8B7355" strokeWidth="0.8" />
        <line x1={PAD+5*CELL} y1={PAD} x2={PAD+3*CELL} y2={PAD+2*CELL} stroke="#8B7355" strokeWidth="0.8" />
        <line x1={PAD+3*CELL} y1={PAD+7*CELL} x2={PAD+5*CELL} y2={PAD+9*CELL} stroke="#8B7355" strokeWidth="0.8" />
        <line x1={PAD+5*CELL} y1={PAD+7*CELL} x2={PAD+3*CELL} y2={PAD+9*CELL} stroke="#8B7355" strokeWidth="0.8" />
        {/* 楚河汉界 */}
        <text x={PAD + 2*CELL} y={PAD + 4.65*CELL} fill="#8B7355" fontSize="20" fontWeight="bold" fontFamily="serif">楚 河</text>
        <text x={PAD + 5.5*CELL} y={PAD + 4.65*CELL} fill="#8B7355" fontSize="20" fontWeight="bold" fontFamily="serif">漢 界</text>

        {/* 棋子 */}
        {board.map((row, r) => row.map((cell, c) => {
          if (!cell) return null;
          const cx = PAD + c * CELL;
          const cy = PAD + r * CELL;
          const isRed = cell[0] === 'r';
          const isSelected = selected && selected.row === r && selected.col === c;
          return (
            <g key={`p-${r}-${c}`} onClick={() => handleCellClick(r, c)} className="cursor-pointer">
              <circle cx={cx} cy={cy} r={CELL/2-2} fill={isRed ? '#ffcccc' : '#ddd'} stroke={isRed ? '#c00' : '#333'} strokeWidth={isSelected ? 2.5 : 1.5} />
              {isSelected && <circle cx={cx} cy={cy} r={CELL/2} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 3" />}
              <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="central" fontSize="16" fill={isRed ? '#c00' : '#111'} fontWeight="bold" fontFamily="'Noto Sans SC',sans-serif">
                {PIECE_CHARS[cell] || cell}
              </text>
            </g>
          );
        }))}

        {/* 未选中时可点击棋子背面 */}
        {board.map((row, r) => row.map((cell, c) => (
          <rect key={`bg-${r}-${c}`}
            x={PAD + c*CELL - CELL/2}
            y={PAD + r*CELL - CELL/2}
            width={CELL} height={CELL}
            fill="transparent"
            onClick={() => handleCellClick(r, c)}
            className="cursor-pointer"
          />
        )))}
      </svg>

      {/* 状态栏 */}
      <div className="flex items-center justify-between w-full mt-2">
        <div className="text-xs text-gray-500">
          {winner !== null
            ? (winner === 0 ? '🔴 红方胜' : '⚫ 黑方胜')
            : aiThinking ? '🤔 AI 思考中...'
            : currentPlayer === 0 ? '🔴 红方走棋' : '⚫ 黑方走棋'}
        </div>
        <button onClick={resetGame} className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition">🔄 重开</button>
      </div>

      {mode === 'online' && !user && <p className="text-xs text-red-400 mt-1">请先登录再使用联机模式</p>}
    </div>
  );
}
