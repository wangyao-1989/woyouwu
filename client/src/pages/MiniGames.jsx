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
  { id: 'snake', path: '/mini-games/snake', name: '🐍 贪吃蛇', desc: '经典贪吃蛇，控制小蛇吃食物不断变长', color: '#22c55e', bgColor: '#f0fdf4' },
  { id: 'tetris', path: '/mini-games/tetris', name: '🧱 俄罗斯方块', desc: '经典俄罗斯方块，消除满行赢得高分', color: '#a855f7', bgColor: '#faf5ff' },
  { id: 'sokoban', path: '/mini-games/sokoban', name: '📦 推箱子', desc: '经典推箱子，将箱子推到目标位置', color: '#d97706', bgColor: '#fffbeb' },
  { id: 'gomoku', path: '/mini-games/gomoku', name: '⚫ 五子棋', desc: '经典五子棋，支持人机和联机对战', color: '#2563eb', bgColor: '#eff6ff' },
  { id: 'chess', path: '/mini-games/chess', name: '♟ 中国象棋', desc: '经典中国象棋，支持人机和联机对战', color: '#dc2626', bgColor: '#fef2f2' },
  { id: 'multiplayer', path: '/mini-games/multiplayer', name: '🌐 联机大厅', desc: '邀请好友，联机对战', color: '#7c3aed', bgColor: '#f5f3ff' },
];

function GameList() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#EDE5D9]">
      <div className="mx-auto max-w-lg px-4 pt-20 pb-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">🎮 娱乐岛</h1>
          <p className="text-sm text-gray-500">挑选一款游戏开始玩吧</p>
        </div>
        <div className="grid gap-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: game.bgColor }}
                >
                  {game.name.split(' ')[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800" style={{ color: game.color }}>{game.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{game.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
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

  // 未登录时显示登录引导
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#EDE5D9]">
        <div className="mx-auto max-w-lg px-4 pt-20 pb-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">{gameInfo ? gameInfo.name.split(' ')[0] : '🎮'}</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">{gameInfo ? gameInfo.name : '游戏'}</h2>
            <p className="text-sm text-gray-500 mb-6">需要登录后才能开始游戏</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/mini-games')}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                ← 返回
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 text-sm text-white font-bold bg-purple-500 hover:bg-purple-600 rounded-xl transition"
              >
                去登录
              </button>
            </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#EDE5D9]">
      <div className="mx-auto max-w-3xl px-4 pt-20 pb-6">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/mini-games')}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              ← 返回游戏列表
            </button>
          </div>
          {renderGame()}
        </div>
      </div>
    </div>
  );
}

// 联机大厅封装，放在 Socket 内使用
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

// 整个 MiniGames 子页面共用同一个 Socket 连接
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
