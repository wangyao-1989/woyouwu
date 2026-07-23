import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGameSocket } from '../../context/GameSocketContext';

const PIECE_CHARS = {
  rK:'帅', rA:'仕', rB:'相', rN:'馬', rR:'車', rC:'炮', rP:'兵',
  bK:'将', bA:'士', bB:'象', bN:'马', bR:'车', bC:'砲', bP:'卒',
};

const CELL=42, PAD=24;

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

function isValidMove(board, from, to, color) {
  const piece = board[from.row][from.col];
  if (!piece || piece[0] !== color) return false;
  const target = board[to.row][to.col];
  if (target && target[0] === color) return false;
  return true;
}

function getAllMoves(board, color) {
  const moves = [];
  for (let r=0; r<10; r++)
    for (let c=0; c<9; c++) {
      const p=board[r][c];
      if (p&&p[0]===color) {
        for (let tr=0; tr<10; tr++)
          for (let tc=0; tc<9; tc++) {
            if (isValidMove(board,{row:r,col:c},{row:tr,col:tc},color)) {
              const t=board[tr][tc];
              if (t&&t[0]!==color) moves.push({from:{row:r,col:c},to:{row:tr,col:tc},capture:true,capturedPiece:t});
              else if (!t) moves.push({from:{row:r,col:c},to:{row:tr,col:tc},capture:false});
            }
          }
      }
    }
  return moves;
}

const PIECE_VALUE = { K:10000, A:20, B:20, N:40, R:90, C:45, P:10 };

function getAIMove(board, aiColor) {
  const moves=getAllMoves(board,aiColor);
  if (moves.length===0) return null;
  const captures=moves.filter(m=>m.capture);
  if (captures.length>0) {
    captures.sort((a,b)=>(PIECE_VALUE[b.capturedPiece?.[1]]||0)-(PIECE_VALUE[a.capturedPiece?.[1]]||0));
    return captures[0];
  }
  const safe=moves.filter(m=>{
    const nb=board.map(r=>[...r]);
    nb[m.to.row][m.to.col]=nb[m.from.row][m.from.col];
    nb[m.from.row][m.from.col]=null;
    const opp=aiColor==='r'?'b':'r';
    for (let r=0;r<10;r++)
      for (let c=0;c<9;c++) {
        const p=nb[r][c];
        if (p&&p[0]===opp) {
          const dr=Math.abs(m.to.row-r), dc=Math.abs(m.to.col-c);
          if (p[1]==='R'&&(dr===0||dc===0)) return false;
          if (p[1]==='C'&&(dr===0||dc===0)) return false;
        }
      }
    return true;
  });
  return (safe.length>0?safe:moves)[Math.floor(Math.random()*(safe.length>0?safe.length:moves.length))];
}

export default function ChessGame({ onlineRoomId, onlineMode }) {
  const { user } = useAuth();
  const gameSocket = onlineMode ? useGameSocket() : null;
  const [board, setBoard] = useState(createInitBoard);
  const [cur, setCur] = useState(0);
  const [mode, setMode] = useState('local');
  const [winner, setWinner] = useState(null);
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [aiThink, setAiThink] = useState(false);
  const [moveLog, setMoveLog] = useState([]);
  const aiTimer = useRef(null);

  useEffect(() => { if (onlineMode&&gameSocket) setMode('online'); }, [onlineMode, gameSocket]);
  useEffect(() => {
    if (!onlineMode||!gameSocket?.roomState?.gameState) return;
    setBoard(gameSocket.roomState.gameState.board);
    setCur(gameSocket.roomState.gameState.currentPlayer);
    setWinner(null);
  }, [onlineMode, gameSocket?.roomState?.gameState]);
  useEffect(() => {
    if (!onlineMode||!gameSocket) return;
    if (gameSocket.roomState?.state==='finished') setWinner(gameSocket.roomState.winner);
  }, [onlineMode, gameSocket?.roomState?.state]);

  useEffect(() => {
    if (mode!=='ai'||winner!==null||cur!==1||aiThink) return;
    setAiThink(true);
    aiTimer.current = setTimeout(() => {
      const move = getAIMove(board, 'b');
      if (move) {
        const nb = board.map(r=>[...r]);
        nb[move.to.row][move.to.col]=nb[move.from.row][move.from.col];
        nb[move.from.row][move.from.col]=null;
        setBoard(nb); setMoveLog(h=>[...h,`黑: (${move.from.row},${move.from.col})→(${move.to.row},${move.to.col})`]);
        if (board[move.to.row][move.to.col]==='rK') { setWinner(1); setAiThink(false); return; }
        setCur(0);
      }
      setAiThink(false);
    }, 400);
    return () => clearTimeout(aiTimer.current);
  }, [mode, cur, winner, aiThink, board]);

  const handleClick = useCallback((row, col) => {
    if (winner!==null) return;
    if (mode==='ai'&&cur!==0) return;
    if (mode==='online') {
      if (!gameSocket?.sendMove) return;
      const piece=board[row][col];
      const myColor=gameSocket.roomState?.players?.find(p=>p.id===user?.id);
      const myIdx=gameSocket.roomState?.players?.indexOf(myColor);
      const color=myIdx===0?'r':'b';
      if (selected) {
        if (piece&&piece[0]===color) { setSelected({row,col}); return; }
        gameSocket.sendMove(onlineRoomId,{from:selected,to:{row,col}});
        setSelected(null); return;
      }
      if (piece&&piece[0]===color) setSelected({row,col});
      return;
    }
    const piece=board[row][col];
    const color=cur===0?'r':'b';
    if (selected) {
      if (piece&&piece[0]===color) { setSelected({row,col}); return; }
      if (isValidMove(board,selected,{row,col},color)) {
        const nb=board.map(r=>[...r]);
        nb[row][col]=nb[selected.row][selected.col];
        nb[selected.row][selected.col]=null;
        setBoard(nb); setMoveLog(h=>[...h,`${color==='r'?'红':'黑'}: (${selected.row},${selected.col})→(${row},${col})`]);
        if (board[row][col]===(color==='r'?'bK':'rK')) setWinner(cur);
        else setCur(cur===0?1:0);
        setSelected(null);
      } else setSelected(null);
      return;
    }
    if (piece&&piece[0]===color) setSelected({row,col});
  }, [board, cur, winner, selected, mode]);

  const reset = () => {
    setBoard(createInitBoard()); setCur(0); setWinner(null); setSelected(null); setMoveLog([]); setAiThink(false); setHover(null);
    if (aiTimer.current) clearTimeout(aiTimer.current);
  };

  const switchMode = (nm) => {
    if (nm==='online'&&!user) return;
    reset(); setMode(nm);
  };

  const gridW=8*CELL, gridH=9*CELL;
  const svgW=gridW+PAD*2, svgH=gridH+PAD*2;
  const pn = winner===0?'红方':winner===1?'黑方':cur===0?'红方':'黑方';

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mb-4 gap-3 px-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">♟</span> 中国象棋
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
          <div className={`w-3 h-3 rounded-full border ${cur===0?'bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.5)]':'bg-slate-900 border-slate-500'}`} />
          <span className="text-sm text-slate-300">
            {winner!==null?(winner===0?'🔴 红方胜！':'⚫ 黑方胜！'):aiThink?'🤔 AI 思考中...':`${pn}走棋`}
          </span>
        </div>
      </div>

      <svg width={svgW} height={svgH} className="rounded-2xl shadow-2xl shadow-rose-900/30"
        style={{ background: 'linear-gradient(135deg, #e8cfa8 0%, #d4b88a 100%)', border: '2px solid #a07d4f' }}>
        <defs>
          <filter id="pieceShadow2">
            <feDropShadow dx="1.5" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.35"/>
          </filter>
        </defs>
        <rect width={svgW} height={svgH} fill="transparent" rx="14"/>

        {Array.from({length:10}).map((_,i) => (
          <line key={`h${i}`} x1={PAD} y1={PAD+i*CELL} x2={PAD+8*CELL} y2={PAD+i*CELL} stroke="#8B7355" strokeWidth="1"/>
        ))}
        {Array.from({length:9}).map((_,i) => (
          <g key={`v${i}`}>
            <line x1={PAD+i*CELL} y1={PAD} x2={PAD+i*CELL} y2={PAD+4*CELL} stroke="#8B7355" strokeWidth="1"/>
            <line x1={PAD+i*CELL} y1={PAD+5*CELL} x2={PAD+i*CELL} y2={PAD+9*CELL} stroke="#8B7355" strokeWidth="1"/>
          </g>
        ))}
        <line x1={PAD+3*CELL} y1={PAD} x2={PAD+5*CELL} y2={PAD+2*CELL} stroke="#8B7355" strokeWidth="0.8"/>
        <line x1={PAD+5*CELL} y1={PAD} x2={PAD+3*CELL} y2={PAD+2*CELL} stroke="#8B7355" strokeWidth="0.8"/>
        <line x1={PAD+3*CELL} y1={PAD+7*CELL} x2={PAD+5*CELL} y2={PAD+9*CELL} stroke="#8B7355" strokeWidth="0.8"/>
        <line x1={PAD+5*CELL} y1={PAD+7*CELL} x2={PAD+3*CELL} y2={PAD+9*CELL} stroke="#8B7355" strokeWidth="0.8"/>
        <text x={PAD+1.8*CELL} y={PAD+4.6*CELL} fill="#8B7355" fontSize="18" fontWeight="bold" fontFamily="serif">楚 河</text>
        <text x={PAD+5.3*CELL} y={PAD+4.6*CELL} fill="#8B7355" fontSize="18" fontWeight="bold" fontFamily="serif">漢 界</text>

        {/* 棋子 */}
        {board.map((row,r) => row.map((cell,c) => {
          if (!cell) return null;
          const cx=PAD+c*CELL, cy=PAD+r*CELL;
          const isRed=cell[0]==='r';
          const isSel=selected&&selected.row===r&&selected.col===c;
          return (
            <g key={`p-${r}-${c}`} filter="url(#pieceShadow2)" onClick={()=>handleClick(r,c)} className="cursor-pointer">
              <circle cx={cx} cy={cy} r={CELL/2-3} fill={isRed?'#fef2f2':'#f8fafc'} stroke={isRed?'#dc2626':'#334155'} strokeWidth={isSel?3:2}/>
              {isSel && <circle cx={cx} cy={cy} r={CELL/2-1} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="4 3"/>}
              <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="central" fontSize="17" fill={isRed?'#b91c1c':'#1f2937'} fontWeight="bold" fontFamily="'Noto Sans SC',sans-serif">
                {PIECE_CHARS[cell]||cell}
              </text>
            </g>
          );
        }))}

        {/* 点击区域 */}
        {board.map((row,r) => row.map((_,c) => (
          <rect key={`bg-${r}-${c}`}
            x={PAD+c*CELL-CELL/2} y={PAD+r*CELL-CELL/2}
            width={CELL} height={CELL} fill="transparent"
            onClick={()=>handleClick(r,c)} className="cursor-pointer"
          />
        )))}
      </svg>
      {mode==='online'&&!user&&<p className="text-xs text-rose-400 mt-3">请先登录再使用联机模式</p>}
    </div>
  );
}
