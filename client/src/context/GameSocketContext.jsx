import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const GameSocketContext = createContext();

// ====== 前端日志工具（仅在开发环境输出详细日志） ======
const DEBUG = true; // 设为 false 可关闭前端游戏日志
function clog(tag, msg, extra = '') {
  if (!DEBUG) return;
  const ts = new Date().toISOString().slice(11, 23);
  const suffix = extra ? ` | ${extra}` : '';
  console.log(`[${ts}] [GameClient:${tag}] ${msg}${suffix}`);
}

export function GameSocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef({});

  // ====== 带日志的 setState 封装 ======
  const logSetState = useCallback((setter, name, value) => {
    if (typeof value === 'object' && value !== null) {
      const short = typeof value === 'object'
        ? (value.id ? `id=${value.id} ` : '') + (value.state ? `state=${value.state}` : '') + (value.gameType ? ` game=${value.gameType}` : '')
        : '';
      clog('STATE', `${name}=${short || JSON.stringify(value).slice(0, 80)}`);
    } else {
      clog('STATE', `${name}=${JSON.stringify(value)}`);
    }
    setter(value);
  }, []);

  useEffect(() => {
    if (!user) {
      clog('LIFECYCLE', '用户未登录，断开 Socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        setCurrentRoom(null);
        setRoomState(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    const serverUrl = import.meta.env.DEV ? 'http://localhost:5004' : window.location.origin;

    clog('LIFECYCLE', `正在连接 Socket...`, `url=${serverUrl} userId=${user.id}`);
    const newSocket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // ====== 连接生命周期 ======
    newSocket.on('connect', () => {
      clog('CONNECT', '✅ Socket 已连接', `socketId=${newSocket.id}`);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      clog('CONNECT', `🔌 Socket 断开`, `reason=${reason}`);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      clog('CONNECT', `❌ 连接错误`, `msg=${err.message}`);
    });

    // ====== 房间事件 ======
    newSocket.on('room_created', ({ roomId, room }) => {
      clog('EVENT', `📦 room_created`, `roomId=${roomId} game=${room.gameType} state=${room.state}`);
      logSetState(setCurrentRoom, 'currentRoom', roomId);
      logSetState(setRoomState, 'roomState', room);
      setError(null);
    });

    newSocket.on('room_state', (room) => {
      clog('EVENT', `📋 room_state`, `roomId=${room.id} state=${room.state} players=${room.players?.length}`);
      logSetState(setCurrentRoom, 'currentRoom', room.id);
      logSetState(setRoomState, 'roomState', room);
    });

    newSocket.on('player_joined', ({ player }) => {
      clog('EVENT', `👤 player_joined`, `player=${player?.username}`);
      setError(null);
    });

    newSocket.on('player_left', ({ userId }) => {
      clog('EVENT', `🚪 player_left`, `userId=${userId}`);
      setError(null);
    });

    // ====== 游戏事件 ======
    newSocket.on('game_start', ({ gameState, players }) => {
      const pnames = players?.map(p => p.username).join(',') || '';
      clog('EVENT', `🚀 game_start`, `players=${pnames}`);
      setRoomState(prev => ({ ...prev, state: 'playing', gameState, players }));
      setError(null);
    });

    newSocket.on('game_state', ({ gameState, lastMove, currentPlayer }) => {
      const mv = lastMove ? JSON.stringify(lastMove) : 'none';
      clog('EVENT', `⬛ game_state`, `cp=${currentPlayer} lastMove=${mv}`);
      setRoomState(prev => ({ ...prev, gameState }));
    });

    newSocket.on('game_over', ({ winner, reason }) => {
      clog('EVENT', `🏆 game_over`, `winner=${winner} reason=${reason}`);
      setRoomState(prev => ({ ...prev, state: 'finished', winner, reason }));
    });

    // ====== 邀请事件 ======
    newSocket.on('invite_received', (invite) => {
      clog('EVENT', `📨 invite_received`, `room=${invite.roomId} game=${invite.gameType} from=${invite.from?.username}`);
      setInvites(prev => [...prev, invite]);
    });

    // ====== 错误事件 ======
    newSocket.on('error', ({ message }) => {
      clog('EVENT', `❌ error`, `msg=${message}`);
      setError(message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      clog('LIFECYCLE', 'Socket 卸载，断开连接');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, logSetState]);

  // ====== 发送命令（带日志） ======
  const createRoom = (gameType) => {
    if (socketRef.current) {
      clog('EMIT', `create_room`, `game=${gameType}`);
      socketRef.current.emit('create_room', { gameType });
    }
  };

  const joinRoom = (roomId) => {
    clog('EMIT', `join_room`, `roomId=${roomId}`);
    setCurrentRoom(roomId);
    setError(null);
    if (socketRef.current) socketRef.current.emit('join_room', { roomId });
  };

  const invitePlayer = (invitedUserId, gameType) => {
    clog('EMIT', `invite_player`, `guest=${invitedUserId} game=${gameType} room=${currentRoom || 'new'}`);
    if (socketRef.current) socketRef.current.emit('invite_player', { invitedUserId, gameType, roomId: currentRoom });
  };

  const leaveRoom = (roomId) => {
    clog('EMIT', `leave_room`, `roomId=${roomId}`);
    if (socketRef.current) socketRef.current.emit('leave_room', { roomId });
    logSetState(setCurrentRoom, 'currentRoom', null);
    logSetState(setRoomState, 'roomState', null);
  };

  const sendMove = (roomId, move) => {
    const mv = typeof move === 'object' ? JSON.stringify(move) : move;
    clog('EMIT', `game_move`, `room=${roomId} move=${mv}`);
    if (socketRef.current) socketRef.current.emit('game_move', { roomId, move });
  };

  const restartGame = (roomId) => {
    clog('EMIT', `restart_game`, `roomId=${roomId}`);
    if (socketRef.current) socketRef.current.emit('restart_game', { roomId });
  };

  const dismissInvite = (roomId) => {
    clog('STATE', `dismissInvite`, `roomId=${roomId}`);
    setInvites(prev => prev.filter(inv => inv.roomId !== roomId));
  };

  return (
    <GameSocketContext.Provider value={{
      socket,
      connected,
      currentRoom,
      roomState,
      invites,
      error,
      createRoom,
      joinRoom,
      invitePlayer,
      leaveRoom,
      sendMove,
      restartGame,
      dismissInvite,
      setError,
    }}>
      {children}
    </GameSocketContext.Provider>
  );
}

export const useGameSocket = () => {
  const context = useContext(GameSocketContext);
  if (!context) throw new Error('useGameSocket must be used within GameSocketProvider');
  return context;
};
