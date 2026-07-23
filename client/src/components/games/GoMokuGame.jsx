import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGameSocket } from '../../context/GameSocketContext';

function hasNeighbor(board, row, col, dist) {
  for (let r=Math.max(0,row-dist); r<=Math.min(14,row+dist); r++)
    for (let c=Math.max(0,col-dist); c<=Math.min(14,col+dist); c++)
      if (board[r][c]!==null) return true;
  return false;
}

function countDir(board, row, col, dx, dy, player) {
  let count=1, open=0;
  let r=row+dx, c=col+dy;
  while (r>=0&&r<15&&c>=0&&c<15&&board[r][c]===player) { count++; r+=dx; c+=dy; }
  if (r>=0&&r<15&&c>=0&&c<15&&board[r][c]===null) open++;
  r=row-dx; c=col-dy;
  while (r>=0&&r<15&&c>=0&&c<15&&board[r][c]===player) { count++; r-=dx; c-=dy; }
  if (r>=0&&r<15&&c>=0&&c<15&&board[r][c]===null) open++;
  return {count, open};
}

function scorePat({count, open}) {
  if (count>=5) return 100000;
  if (count===4&&open===2) return 10000;
  if (count===4&&open===1) return 1000;
  if (count===3&&open===2) return 1000;
  if (count===3&&open===1) return 100;
  if (count===2&&open===2) return 100;
  if (count===2&&open===1) return 10;
  if (count===1&&open===2) return 10;
  if (count===1&&open===1) return 1;
  return 0;
}

function evalPos(board, row, col, ai, opp) {
  const dirs=[[1,0],[0,1],[1,1],[1,-1]];
  let aiS=0, oppS=0;
  for (const [dx,dy] of dirs) {
    aiS+=scorePat(countDir(board,row,col,dx,dy,ai));
    oppS+=scorePat(countDir(board,row,col,dx,dy,opp));
  }
  return aiS*1.1+oppS;
}

function getAIMove(board, aiPlayer) {
  const opp=aiPlayer===0?1:0;
  let best=-Infinity, bestMove=null;
  const cells=[];
  let total=0;
  for (let r=0; r<15; r++)
    for (let c=0; c<15; c++) {
      if (board[r][c]!==null) total++;
      else if (hasNeighbor(board,r,c,2)) cells.push({row:r,col:c});
    }
  if (total<=1) return {row:7,col:7};
  for (const cell of cells) {
    const sc=evalPos(board,cell.row,cell.col,aiPlayer,opp);
    if (sc>best) { best=sc; bestMove=cell; }
  }
  return bestMove||{row:7,col:7};
}

function checkWin(board, row, col, player) {
  const dirs=[[1,0],[0,1],[1,1],[1,-1]];
  for (const [dx,dy] of dirs) {
    let count=1;
    for (let i=1; i<5; i++) {
      const r=row+dx*i, c=col+dy*i;
      if (r<0||r>=15||c<0||c>=15||board[r][c]!==player) break;
      count++;
    }
    for (let i=1; i<5; i++) {
      const r=row-dx*i, c=col-dy*i;
      if (r<0||r>=15||c<0||c>=15||board[r][c]!==player) break;
      count++;
    }
    if (count>=5) return true;
  }
  return false;
}

const CELL=32, PAD=20;

export default function GoMokuGame({ onlineRoomId, onlineMode }) {
  const { user } = useAuth();
  const gameSocket = onlineMode ? useGameSocket() : null;
  const [board, setBoard] = useState(Array.from({length:15},()=>Array(15).fill(null)));
  const [cur, setCur] = useState(0);
  const [mode, setMode] = useState('local');
  const [winner, setWinner] = useState(null);
  const [aiThink, setAiThink] = useState(false);
  const [hist, setHist] = useState([]);
  const [hover, setHover] = useState(null);
  const aiTimer = useRef(null);

  useEffect(() => {
    if (!onlineMode||!gameSocket) return;
    setMode('online');
    if (onlineRoomId&&gameSocket.currentRoom!==onlineRoomId) gameSocket.joinRoom(onlineRoomId);
  }, [onlineMode, gameSocket, onlineRoomId]);

  useEffect(() => {
    if (!onlineMode||!gameSocket||!gameSocket.roomState?.gameState) return;
    const gs=gameSocket.roomState.gameState;
    setBoard(gs.board); setCur(gs.currentPlayer); setWinner(null);
  }, [onlineMode, gameSocket?.roomState?.gameState]);

  useEffect(() => {
    if (!onlineMode||!gameSocket) return;
    if (gameSocket.roomState?.state==='finished') setWinner(gameSocket.roomState.winner);
  }, [onlineMode, gameSocket?.roomState?.state]);

  useEffect(() => {
    if (mode!=='ai'||winner!==null||cur!==1||aiThink) return;
    setAiThink(true);
    aiTimer.current = setTimeout(() => {
      const move = getAIMove(board, 1);
      if (move) {
        const nb = board.map(r=>[...r]);
        nb[move.row][move.col]=1;
        setBoard(nb); setHist(h=>[...h,{...move,player:1}]);
        if (checkWin(nb,move.row,move.col,1)) setWinner(1);
        else setCur(0);
      }
      setAiThink(false);
    }, 300);
    return () => clearTimeout(aiTimer.current);
  }, [mode, cur, winner, aiThink, board]);

  const click = useCallback((row, col) => {
    if (winner!==null) return;
    if (board[row][col]!==null) return;
    if (mode==='ai'&&cur!==0) return;
    if (mode==='online') {
      if (gameSocket?.sendMove) gameSocket.sendMove(onlineRoomId, {row,col});
      return;
    }
    const nb = board.map(r=>[...r]);
    nb[row][col]=cur;
    setBoard(nb); setHist(h=>[...h,{row,col,player:cur}]);
    if (checkWin(nb,row,col,cur)) setWinner(cur);
    else setCur(cur===0?1:0);
  }, [board, cur, winner, mode, onlineRoomId, gameSocket]);

  const reset = () => {
    setBoard(Array.from({length:15},()=>Array(15).fill(null)));
    setCur(0); setWinner(null); setHist([]); setAiThink(false); setHover(null);
    if (aiTimer.current) clearTimeout(aiTimer.current);
  };

  const switchMode = (nm) => {
    if (nm==='online'&&!user) return;
    reset(); setMode(nm);
  };

  const size = CELL*14+PAD*2;
  const ox=PAD, oy=PAD;
  const pn = winner===0?'白棋':winner===1?'黑棋':cur===0?'白棋':'黑棋';

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mb-4 gap-3 px-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">⚫</span> 五子棋
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {['local','ai','online'].map(m => {
            const labels={local:'本地',ai:'人机',online:'联机'};
            const colors={local:'bg-sky-500 text-white shadow-sky-500/25',ai:'bg-emerald-500 text-white shadow-emerald-500/25',online:'bg-fuchsia-500 text-white shadow-fuchsia-500/25'};
            const disabled=m==='online'&&!user;
            return (
              <button key={m} disabled={disabled} onClick={()=>switchMode(m)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${mode===m?colors[m]+' shadow-lg':'bg-slate-800 text-slate-400 hover:bg-slate-700'} ${disabled?'opacity-40 cursor-not-allowed':''}`}>
                {labels[m]}
              </button>
            );
          })}
          <button onClick={reset} className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition">重开</button>
        </div>
      </div>

      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${cur===0?'bg-slate-200 shadow-[0_0_6px_rgba(255,255,255,0.5)]':'bg-slate-900 border border-slate-500'}`} />
          <span className="text-sm text-slate-300">
            {winner!==null?(winner===-1?'🤝 平局':winner===0?'⚪ 白棋胜！':'⚫ 黑棋胜！'):aiThink?'🤔 AI 思考中...':`${pn}走棋`}
          </span>
        </div>
      </div>

      <svg width={size} height={size} className="rounded-2xl shadow-2xl shadow-sky-900/30 cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #e8cfa8 0%, #d4b88a 100%)', border: '2px solid #a07d4f' }}>
        <defs>
          <filter id="pieceShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.3"/>
          </filter>
          <filter id="glowWhite">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glowBlack">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* 棋盘线 */}
        {Array.from({length:15}).map((_,i) => (
          <line key={`h${i}`} x1={ox} y1={oy+i*CELL} x2={ox+14*CELL} y2={oy+i*CELL} stroke="#8B7355" strokeWidth="0.8"/>
        ))}
        {Array.from({length:15}).map((_,i) => (
          <line key={`v${i}`} x1={ox+i*CELL} y1={oy} x2={ox+i*CELL} y2={oy+14*CELL} stroke="#8B7355" strokeWidth="0.8"/>
        ))}
        {/* 星位 */}
        {[[3,3],[3,7],[3,11],[7,3],[7,7],[7,11],[11,3],[11,7],[11,11]].map(([r,c]) => (
          <circle key={`star-${r}-${c}`} cx={ox+c*CELL} cy={oy+r*CELL} r={3.5} fill="#6b5344" stroke="#5a4437" strokeWidth="0.5"/>
        ))}

        {/* 棋子 */}
        {board.map((row,r) => row.map((cell,c) => {
          if (cell===null) return null;
          const cx=ox+c*CELL, cy=oy+r*CELL, r2=CELL/2-2;
          const isWhite=cell===0;
          const isLast=hist.length>0 && hist[hist.length-1].row===r && hist[hist.length-1].col===c;
          return (
            <g key={`p-${r}-${c}`} filter="url(#pieceShadow)">
              <defs>
                <radialGradient id={`g${isWhite?'w':'b'}${r}${c}`} cx="35%" cy="30%">
                  <stop offset="0%" stopColor={isWhite?'#ffffff':'#94a3b8'}/>
                  <stop offset="40%" stopColor={isWhite?'#f1f5f9':'#64748b'}/>
                  <stop offset="100%" stopColor={isWhite?'#cbd5e1':'#1e293b'}/>
                </radialGradient>
              </defs>
              <circle cx={cx} cy={cy} r={r2} fill={`url(#g${isWhite?'w':'b'}${r}${c})`} stroke={isWhite?'#94a3b8':'#0f172a'} strokeWidth="0.8"/>
              {isLast && !winner && (
                <circle cx={cx} cy={cy} r={3} fill="#ef4444" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>
                </circle>
              )}
            </g>
          );
        }))}

        {/* 悬停提示 */}
        {hover && board[hover.row][hover.col]===null && winner===null && !(mode==='ai'&&cur!==0) && (
          <circle cx={ox+hover.col*CELL} cy={oy+hover.row*CELL} r={CELL/2-2}
            fill={cur===0?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.2)'} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="3 3"/>
        )}

        {/* 点击区域 */}
        {Array.from({length:15}).map((_,r) => Array.from({length:15}).map((_,c) => (
          <rect key={`click-${r}-${c}`}
            x={ox+c*CELL-CELL/2} y={oy+r*CELL-CELL/2}
            width={CELL} height={CELL} fill="transparent"
            onClick={()=>click(r,c)}
            onMouseEnter={()=>setHover({row:r,col:c})}
            onMouseLeave={()=>setHover(null)}
            className="cursor-pointer"
          />
        )))}
      </svg>

      {mode==='online'&&!user&&<p className="text-xs text-rose-400 mt-3">请先登录再使用联机模式</p>}
    </div>
  );
}
