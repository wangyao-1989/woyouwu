const { v4: uuidv4 } = require('uuid');

// 存储所有游戏房间
const rooms = new Map();
// 用户ID到Socket的映射
const userSockets = new Map();

// ====== 日志工具 ======
function log(tag, msg, extra = '') {
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const suffix = extra ? ` | ${extra}` : '';
  console.log(`[${ts}] [Game:${tag}] ${msg}${suffix}`);
}

function setupGameServer(io) {
  // 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      log('AUTH', '❌ 连接被拒：未提供 token');
      return next(new Error('未登录'));
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'woyouwu_jwt_secret');
      socket.userId = decoded.userId || decoded.id;
      socket.username = decoded.nickname || decoded.username || '未知';
      log('AUTH', `✅ 认证通过`, `userId=${socket.userId} username=${socket.username}`);
      next();
    } catch (err) {
      log('AUTH', `❌ 认证失败`, `err=${err.message}`);
      next(new Error('认证失败'));
    }
  });

  io.on('connection', (socket) => {
    log('CONNECT', `用户上线`, `socketId=${socket.id} userId=${socket.userId} username=${socket.username}`);
    userSockets.set(socket.userId, socket);
    log('ONLINE', `当前在线游戏用户: ${userSockets.size}`, `rooms=${rooms.size}`);

    // 创建房间
    socket.on('create_room', ({ gameType }) => {
      const roomId = uuidv4().slice(0, 8);
      const room = {
        id: roomId,
        gameType,
        players: [{
          id: socket.userId,
          username: socket.username,
          ready: true,
        }],
        state: 'waiting', // waiting, playing, finished
        gameState: null,
        createdAt: Date.now(),
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('room_created', { roomId, room });
      socket.emit('room_state', room);
      log('ROOM', `📦 创建房间`, `roomId=${roomId} game=${gameType} creator=${socket.username}`);
    });

    // 加入房间
    socket.on('join_room', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) {
        log('ROOM', `❌ 加入失败：房间不存在`, `roomId=${roomId} joiner=${socket.username}`);
        return socket.emit('error', { message: '房间不存在' });
      }
      if (room.players.length >= 2) {
        log('ROOM', `❌ 加入失败：房间已满`, `roomId=${roomId} joiner=${socket.username}`);
        return socket.emit('error', { message: '房间已满' });
      }
      if (room.state !== 'waiting') {
        log('ROOM', `❌ 加入失败：游戏已开始`, `roomId=${roomId} joiner=${socket.username}`);
        return socket.emit('error', { message: '游戏已开始' });
      }

      room.players.push({ id: socket.userId, username: socket.username, ready: true });
      socket.join(roomId);
      io.to(roomId).emit('room_state', room);
      io.to(roomId).emit('player_joined', { player: room.players[1] });
      log('ROOM', `👤 玩家加入`, `roomId=${roomId} joiner=${socket.username} total=${room.players.length}`);

      // 两人齐了，开始游戏
      if (room.players.length === 2) {
        room.state = 'playing';
        room.gameState = createInitialGameState(room.gameType);
        io.to(roomId).emit('game_start', { gameState: room.gameState, players: room.players });
        log('GAME', `🚀 游戏开始`, `roomId=${roomId} game=${room.gameType} p1=${room.players[0].username} p2=${room.players[1].username}`);
      }
    });

    // 邀请玩家
    socket.on('invite_player', ({ invitedUserId, gameType, roomId }) => {
      const targetSocket = userSockets.get(invitedUserId);
      if (!targetSocket) {
        log('INVITE', `❌ 邀请失败：对方不在线`, `inviter=${socket.username} guestId=${invitedUserId}`);
        return socket.emit('error', { message: '对方不在线' });
      }

      let room;
      // 如果提供了 roomId，使用已有房间
      if (roomId) {
        room = rooms.get(roomId);
        if (!room) {
          log('INVITE', `❌ 邀请失败：房间不存在`, `roomId=${roomId} inviter=${socket.username}`);
          return socket.emit('error', { message: '房间不存在' });
        }
        if (room.players.length >= 2) {
          log('INVITE', `❌ 邀请失败：房间已满`, `roomId=${roomId} inviter=${socket.username}`);
          return socket.emit('error', { message: '房间已满' });
        }
        log('INVITE', `📨 使用已有房间发送邀请`, `roomId=${roomId} inviter=${socket.username} guest=${targetSocket.username}`);
      } else {
        // 否则创建新房间
        const newRoomId = uuidv4().slice(0, 8);
        room = {
          id: newRoomId,
          gameType,
          players: [{
            id: socket.userId,
            username: socket.username,
            ready: true,
          }],
          state: 'waiting',
          gameState: null,
          createdAt: Date.now(),
        };
        rooms.set(newRoomId, room);
        socket.join(newRoomId);
        socket.emit('room_created', { roomId: newRoomId, room });
        log('INVITE', `📨 创建新房间并发送邀请`, `roomId=${newRoomId} game=${gameType} inviter=${socket.username} guest=${targetSocket.username}`);
      }

      // 发送邀请给被邀请者
      targetSocket.emit('invite_received', {
        roomId: room.id,
        gameType: room.gameType,
        from: { id: socket.userId, username: socket.username },
      });
    });

    // 离开房间
    socket.on('leave_room', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      socket.leave(roomId);
      room.players = room.players.filter(p => p.id !== socket.userId);
      log('ROOM', `🚪 玩家离开`, `roomId=${roomId} leaver=${socket.username} remain=${room.players.length}`);
      if (room.players.length === 0) {
        rooms.delete(roomId);
        log('ROOM', `🗑️ 房间销毁（无玩家）`, `roomId=${roomId}`);
      } else {
        io.to(roomId).emit('room_state', room);
        io.to(roomId).emit('player_left', { userId: socket.userId });
      }
    });

    // 落子/移动 (通用游戏动作)
    socket.on('game_move', ({ roomId, move }) => {
      const room = rooms.get(roomId);
      if (!room) {
        log('MOVE', `❌ 落子失败：房间不存在`, `roomId=${roomId}`);
        return socket.emit('error', { message: '房间不存在' });
      }
      if (room.state !== 'playing') {
        log('MOVE', `❌ 落子失败：游戏未进行`, `roomId=${roomId} state=${room.state}`);
        return socket.emit('error', { message: '游戏未进行' });
      }

      const playerIndex = room.players.findIndex(p => p.id === socket.userId);
      if (playerIndex === -1) {
        log('MOVE', `❌ 落子失败：非房间玩家`, `roomId=${roomId} userId=${socket.userId}`);
        return;
      }

      const moveInfo = typeof move === 'object' ? JSON.stringify(move) : move;
      log('MOVE', `⬛ 收到落子`, `roomId=${roomId} player=${socket.username} idx=${playerIndex} move=${moveInfo}`);

      const result = processMove(room.gameType, room.gameState, move, playerIndex);
      if (result.error) {
        log('MOVE', `❌ 落子非法`, `roomId=${roomId} player=${socket.username} err=${result.error}`);
        return socket.emit('error', { message: result.error });
      }

      room.gameState = result.gameState;
      io.to(roomId).emit('game_state', { gameState: room.gameState, lastMove: move, currentPlayer: result.nextPlayer });

      if (result.winner !== null) {
        room.state = 'finished';
        io.to(roomId).emit('game_over', { winner: result.winner, reason: result.reason });
        const winnerName = result.winner === -1 ? '平局' : room.players[result.winner]?.username || '未知';
        log('GAME', `🏆 游戏结束`, `roomId=${roomId} winner=${winnerName} reason=${result.reason}`);
      }
    });

    // 重开
    socket.on('restart_game', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.state = 'playing';
      room.gameState = createInitialGameState(room.gameType);
      io.to(roomId).emit('game_start', { gameState: room.gameState, players: room.players });
      log('GAME', `🔄 重开游戏`, `roomId=${roomId} game=${room.gameType}`);
    });

    socket.on('disconnect', () => {
      log('CONNECT', `用户下线`, `userId=${socket.userId} username=${socket.username}`);
      userSockets.delete(socket.userId);
      log('ONLINE', `当前在线游戏用户: ${userSockets.size}`);
      // 清理玩家所在房间
      for (const [roomId, room] of rooms) {
        if (room.players.some(p => p.id === socket.userId)) {
          room.players = room.players.filter(p => p.id !== socket.userId);
          if (room.players.length === 0) {
            rooms.delete(roomId);
            log('ROOM', `🗑️ 房间销毁（房主断线）`, `roomId=${roomId}`);
          } else {
            io.to(roomId).emit('room_state', room);
            io.to(roomId).emit('player_left', { userId: socket.userId });
            log('ROOM', `🔌 玩家断线离开`, `roomId=${roomId} leaver=${socket.username}`);
          }
        }
      }
    });
  });
}

// 创建初始游戏状态
function createInitialGameState(gameType) {
  if (gameType === 'gomoku') {
    return { board: Array.from({ length: 15 }, () => Array(15).fill(null)), currentPlayer: 0 };
  }
  if (gameType === 'chess') {
    return { board: createChessInitBoard(), currentPlayer: 0 };
  }
  if (gameType === 'snake_multi') {
    // 双人贪吃蛇：各自在独立区域，比长度
    return {
      players: [
        { snake: [{x:5,y:10},{x:4,y:10},{x:3,y:10}], direction: {x:1,y:0}, food: {x:15,y:10}, score: 0 },
        { snake: [{x:14,y:10},{x:15,y:10},{x:16,y:10}], direction: {x:-1,y:0}, food: {x:5,y:10}, score: 0 },
      ],
      gridSize: 20,
    };
  }
  if (gameType === 'tetris_multi') {
    return {
      players: [
        { board: Array.from({length:20},()=>Array(10).fill(null)), currentPiece: null, score: 0 },
        { board: Array.from({length:20},()=>Array(10).fill(null)), currentPiece: null, score: 0 },
      ],
    };
  }
  if (gameType === 'sokoban_multi') {
    return { players: [], level: 0 };
  }
  return {};
}

// 处理游戏动作
function processMove(gameType, gameState, move, playerIndex) {
  if (gameType === 'gomoku') return processGomokuMove(gameState, move, playerIndex);
  if (gameType === 'chess') return processChessMove(gameState, move, playerIndex);
  return { error: '未知游戏类型' };
}

// ============ 五子棋逻辑 ============
function processGomokuMove(gameState, { row, col }, playerIndex) {
  if (gameState.currentPlayer !== playerIndex) return { error: '还没轮到你' };
  if (gameState.board[row][col] !== null) return { error: '这个位置已有棋子' };

  gameState.board[row][col] = playerIndex;
  gameState.currentPlayer = playerIndex === 0 ? 1 : 0;

  // 检查胜利
  if (checkGomokuWin(gameState.board, row, col, playerIndex)) {
    return { gameState, nextPlayer: gameState.currentPlayer, winner: playerIndex, reason: '五子连珠' };
  }

  // 检查平局
  const isDraw = gameState.board.every(row => row.every(cell => cell !== null));
  if (isDraw) {
    return { gameState, nextPlayer: gameState.currentPlayer, winner: -1, reason: '平局' };
  }

  return { gameState, nextPlayer: gameState.currentPlayer, winner: null };
}

function checkGomokuWin(board, row, col, player) {
  const directions = [[1,0],[0,1],[1,1],[1,-1]];
  for (const [dx, dy] of directions) {
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

// ============ 中国象棋逻辑 ============
function createChessInitBoard() {
  // 10行x9列，null为空，'r'红方 'b'黑方
  // 棋子: K帅/将, A仕/士, B相/象, N馬/马, R車/车, C炮/砲, P兵/卒
  const init = [
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
  return { board: init, currentPlayer: 0 };
}

function processChessMove(gameState, move, playerIndex) {
  // move = { from: {row, col}, to: {row, col} }
  if (gameState.currentPlayer !== playerIndex) return { error: '还没轮到你' };
  const { from, to } = move;
  const piece = gameState.board[from.row]?.[from.col];
  if (!piece) return { error: '没有棋子' };

  const color = piece[0] === 'r' ? 'r' : 'b';
  const playerColor = playerIndex === 0 ? 'r' : 'b';
  if (color !== playerColor) return { error: '这不是你的棋子' };

  // 简单合法性检查
  const target = gameState.board[to.row]?.[to.col];
  if (target && target[0] === color) return { error: '不能吃自己的棋子' };

  // 应用移动
  gameState.board[to.row][to.col] = piece;
  gameState.board[from.row][from.col] = null;

  gameState.currentPlayer = playerIndex === 0 ? 1 : 0;

  // 检查是否吃掉对方将/帅
  if (target === 'bK' || target === 'rK') {
    return { gameState, nextPlayer: gameState.currentPlayer, winner: playerIndex, reason: '将/帅被吃' };
  }

  return { gameState, nextPlayer: gameState.currentPlayer, winner: null };
}

module.exports = { setupGameServer };
