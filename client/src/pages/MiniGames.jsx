import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import SnakeGame from '../components/games/SnakeGame';
import TetrisGame from '../components/games/TetrisGame';
import SokobanGame from '../components/games/SokobanGame';
import GoMokuGame from '../components/games/GoMokuGame';
import ChessGame from '../components/games/ChessGame';
import MultiplayerLobby from '../components/games/MultiplayerLobby';
import { GameSocketProvider, useGameSocket } from '../context/GameSocketContext';
import { useAuth } from '../context/AuthContext';

const GAMES = [
  { id: 'snake', path: '/mini-games/snake', name: '贪吃蛇', emoji: '🐍', desc: '控制小蛇吃食物，越吃越长', color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/10' },
  { id: 'tetris', path: '/mini-games/tetris', name: '俄罗斯方块', emoji: '🧱', desc: '消除满行，挑战高分', color: 'from-violet-400 to-purple-500', bg: 'bg-violet-500/10' },
  { id: 'sokoban', path: '/mini-games/sokoban', name: '推箱子', emoji: '📦', desc: '经典益智，把箱子推到目标', color: 'from-amber-400 to-orange-500', bg: 'bg-orange-500/10' },
  { id: 'gomoku', path: '/mini-games/gomoku', name: '五子棋', emoji: '⚫', desc: '人机对战或联机对弈', color: 'from-sky-400 to-blue-500', bg: 'bg-blue-500/10' },
  { id: 'chess', path: '/mini-games/chess', name: '中国象棋', emoji: '♟', desc: '传统棋艺，支持人机', color: 'from-rose-400 to-red-500', bg: 'bg-red-500/10' },
  { id: 'multiplayer', path: '/mini-games/multiplayer', name: '联机大厅', emoji: '🌐', desc: '邀请好友在线对战', color: 'from-fuchsia-400 to-pink-500', bg: 'bg-pink-500/10' },
];

function GameList() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-lg px-4 pt-20 pb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 mb-4">
            <span className="text-3xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">娱乐岛</h1>
          <p className="text-sm text-slate-400">挑选一款小游戏，放松一下</p>
        </div>

        <div className="grid gap-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              className="group w-full text-left rounded-2xl p-4 bg-slate-900/60 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/60 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className={`w-13 h-13 rounded-xl flex items-center justify-center text-2xl ${game.bg} ring-1 ring-white/5`}>
                  {game.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-100 group-hover:text-white transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{game.desc}</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${game.color} text-white shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">方向键 / 鼠标 / 触控操作</p>
      </div>
    </div>
  );
}

function GameView({ gameId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const onlineMode = searchParams.get('online') === '1';
  const onlineRoomId = searchParams.get('roomId');

  const gameInfo = GAMES.find(g => g.id === gameId);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-start justify-center pt-24 px-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center">
          <div className="text-5xl mb-4">{gameInfo?.emoji || '🎮'}</div>
          <h2 className="text-lg font-bold text-white mb-2">{gameInfo?.name || '游戏'}</h2>
          <p className="text-sm text-slate-400 mb-8">需要登录后才能开始游戏</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/mini-games')}
              className="px-5 py-2.5 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              返回
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 text-sm text-white font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
            >
              去登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderGame = () => {
    switch (gameId) {
      case 'snake': return <SnakeGame />;
      case 'tetris': return <TetrisGame />;
      case 'sokoban': return <SokobanGame />;
      case 'gomoku': return <GoMokuGame onlineRoomId={onlineRoomId} onlineMode={onlineMode} />;
      case 'chess': return <ChessGame onlineRoomId={onlineRoomId} onlineMode={onlineMode} />;
      case 'multiplayer': return <MultiplayerLobbyWithNav navigate={navigate} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 pt-20 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/mini-games')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回娱乐岛
          </button>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/40 p-5 sm:p-6">
          {renderGame()}
        </div>
      </div>
    </div>
  );
}

function MultiplayerLobbyWithNav({ navigate }) {
  const gameSocket = useGameSocket();

  const handleStartGame = (gameType, roomId) => {
    const gamePaths = {
      gomoku: '/mini-games/gomoku',
      chess: '/mini-games/chess',
      snake_multi: '/mini-games/snake',
      tetris_multi: '/mini-games/tetris',
      sokoban_multi: '/mini-games/sokoban',
    };
    navigate(`${gamePaths[gameType] || '/mini-games'}?roomId=${roomId}&online=1`);
  };

  return <MultiplayerLobby onStartGame={handleStartGame} />;
}

export default function MiniGames() {
  const location = useLocation();

  return (
    <GameSocketProvider>
      <MiniGamesRouter location={location} />
    </GameSocketProvider>
  );
}

function MiniGamesRouter({ location }) {
  if (location.pathname === '/mini-games') return <GameList />;

  const gameId = location.pathname.replace('/mini-games/', '');
  if (GAMES.some(g => g.id === gameId)) return <GameView gameId={gameId} />;

  return <GameList />;
}

