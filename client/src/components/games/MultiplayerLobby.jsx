import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useGameSocket } from '../../context/GameSocketContext';

const GAME_NAMES = {
  gomoku: '五子棋',
  chess: '中国象棋',
  snake_multi: '贪吃蛇·对战',
  tetris_multi: '俄罗斯方块·对战',
  sokoban_multi: '推箱子·对战',
};

const GAME_ICONS = {
  gomoku: '⚫',
  chess: '♟',
  snake_multi: '🐍',
  tetris_multi: '🧱',
  sokoban_multi: '📦',
};

export default function MultiplayerLobby({ onStartGame }) {
  const { user } = useAuth();
  const gameSocket = useGameSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [followingMap, setFollowingMap] = useState({}); // userId -> { isFollowing, isFollowedBy }
  const [friends, setFriends] = useState([]); // 关注列表
  const [friendsLoaded, setFriendsLoaded] = useState(false);

  // 加载关注列表
  const loadFriends = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/users/following');
      setFriends(res.data || []);
    } catch { /* 忽略 */ }
    setFriendsLoaded(true);
  }, [user]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (activeTab === 'friends' && !friendsLoaded) {
      loadFriends();
    }
  }, [activeTab, friendsLoaded, loadFriends]);

  // 搜索用户
  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`/api/users/list?search=${encodeURIComponent(searchQuery)}&limit=20`);
        const users = (res.data.users || res.data).filter(u => u._id !== user._id);
        setSearchResults(users);
        const fm = {};
        users.forEach(u => {
          fm[u._id] = { isFollowing: u.isFollowing || false, isFollowedBy: u.isFollowedBy || false };
        });
        setFollowingMap(fm);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  // 关注/取消关注
  const handleFollow = useCallback(async (targetId) => {
    try {
      const res = await axios.post(`/api/users/${targetId}/follow`);
      const { isFollowing } = res.data;
      setFollowingMap(prev => ({
        ...prev,
        [targetId]: { ...prev[targetId], isFollowing },
      }));
      // 同步更新好友列表
      if (!isFollowing) {
        setFriends(prev => prev.filter(f => f._id !== targetId));
      }
    } catch (err) {
      console.error('关注失败:', err);
    }
  }, []);

  // 邀请好友
  const handleInvite = (targetUser, gameType) => {
    gameSocket.invitePlayer(targetUser._id, gameType);
    setActiveTab('invites');
  };

  const handleJoinRoom = (invite) => {
    gameSocket.joinRoom(invite.roomId);
    setActiveTab('room');
  };

  const handleCreateRoom = (gameType) => {
    gameSocket.createRoom(gameType);
    setActiveTab('room');
  };

  const handleLeaveRoom = () => {
    if (gameSocket.currentRoom) {
      gameSocket.leaveRoom(gameSocket.currentRoom);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        请先登录后再使用联机功能
      </div>
    );
  }

  const room = gameSocket.roomState;
  const roomId = gameSocket.currentRoom;

  // 渲染用户卡片（好友 + 找人共用）
  const renderUserCard = (u, fm, showFollow = true) => {
    const isMutual = fm.isFollowing && fm.isFollowedBy;

    return (
      <div key={u._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {u.nickname?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-gray-700 font-medium truncate">{u.nickname || u.username}</div>
            <div className="text-xs text-gray-400 truncate">@{u.username}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 关注按钮 */}
          {showFollow && (
            <button
              onClick={() => handleFollow(u._id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                isMutual
                  ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-400 border border-green-200'
                  : fm.isFollowing
                    ? 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              {isMutual ? '互相关注' : fm.isFollowing ? '已关注' : '+ 关注'}
            </button>
          )}

          {/* 邀请按钮：互关才显示 */}
          {isMutual ? (
            <div className="flex gap-1">
              {Object.entries(GAME_NAMES).slice(0, 2).map(([type, name]) => (
                <button
                  key={type}
                  onClick={() => handleInvite(u, type)}
                  className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition"
                  title={`邀请玩${name}`}
                >
                  {GAME_ICONS[type]} {name}
                </button>
              ))}
            </div>
          ) : fm.isFollowing && !fm.isFollowedBy ? (
            <span className="text-xs text-gray-400 italic">等待互关</span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* 连接状态 + Tab切换 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${gameSocket.connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">{gameSocket.connected ? '已连接' : '未连接'}</span>
        </div>
        {!roomId && (
          <div className="flex gap-1 text-xs text-gray-400">
            <button onClick={() => setActiveTab('friends')} className={`px-2 py-0.5 rounded ${activeTab === 'friends' ? 'bg-gray-200 text-gray-600' : ''}`}>好友</button>
            <button onClick={() => setActiveTab('invites')} className={`px-2 py-0.5 rounded ${activeTab === 'invites' ? 'bg-gray-200 text-gray-600' : ''}`}>邀请</button>
            <button onClick={() => setActiveTab('search')} className={`px-2 py-0.5 rounded ${activeTab === 'search' ? 'bg-gray-200 text-gray-600' : ''}`}>找人</button>
          </div>
        )}
      </div>

      {/* 已加入房间 */}
      {roomId && room ? (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">房间 #{roomId}</span>
            <button onClick={handleLeaveRoom} className="text-xs text-red-400 hover:text-red-600">退出</button>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            游戏: {GAME_NAMES[room.gameType] || room.gameType} |
            状态: {room.state === 'waiting' ? '等待中' : room.state === 'playing' ? '游戏中' : '已结束'}
          </div>
          <div className="flex gap-2">
            {room.players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border">
                <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-red-400' : 'bg-blue-400'}`} />
                {p.username} {p.id === user._id ? '(你)' : ''}
              </div>
            ))}
            {room.players.length < 2 && (
              <span className="text-xs text-gray-400">等待对手加入...</span>
            )}
          </div>
          {room.state === 'playing' && room.gameType && (
            <button
              onClick={() => onStartGame && onStartGame(room.gameType, roomId, true)}
              className="mt-2 w-full py-2 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition"
            >
              进入游戏
            </button>
          )}
          {room.state === 'finished' && (
            <div className="mt-2 text-center text-sm">
              {room.winner !== undefined && room.winner !== null && room.winner !== -1
                ? <span className="font-bold text-green-600">{room.players[room.winner]?.username} 获胜！</span>
                : room.winner === -1 ? <span className="font-bold text-yellow-600">平局！</span> : null}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 好友面板 */}
          {activeTab === 'friends' && (
            <div>
              <div className="text-xs font-bold text-gray-500 mb-2">👥 我的好友（{friends.length}人）</div>
              {friends.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <p className="mb-2">还没有关注任何人</p>
                  <button onClick={() => setActiveTab('search')} className="text-purple-500 hover:text-purple-600 text-xs underline">
                    去「找人」发现好友
                  </button>
                </div>
              ) : (
                <div>
                  {friends.map(u => {
                    const fm = { isFollowing: true, isFollowedBy: u.isFollowedBy || false };
                    return renderUserCard(u, fm, true);
                  })}
                </div>
              )}
            </div>
          )}

          {/* 邀请面板 */}
          {activeTab === 'invites' && (
            <div>
              {gameSocket.invites.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-gray-500 mb-1.5">📩 收到的邀请</div>
                  {gameSocket.invites.map((inv, i) => (
                    <div key={i} className="bg-purple-50 rounded-xl p-3 border border-purple-100 mb-2 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-bold text-purple-700">{inv.from.username}</span>
                        <span className="text-gray-500"> 邀请你玩 </span>
                        <span className="font-bold">{GAME_NAMES[inv.gameType] || inv.gameType}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleJoinRoom(inv)} className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg font-bold hover:bg-green-600 transition">接受</button>
                        <button onClick={() => gameSocket.dismissInvite(inv.roomId)} className="px-3 py-1 bg-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-300 transition">忽略</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs font-bold text-gray-500 mb-2">🎮 开房间邀请好友</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(GAME_NAMES).map(([type, name]) => (
                  <button key={type} onClick={() => { handleCreateRoom(type); }}
                    className="px-3 py-2 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 text-xs font-bold rounded-xl border border-purple-100 hover:shadow-sm transition"
                  >
                    创建 {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 找人面板 */}
          {activeTab === 'search' && (
            <div>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索用户名或昵称..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-purple-300 mb-2"
              />
              {searching && <p className="text-xs text-gray-400">搜索中...</p>}
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-xs text-gray-400">没有找到用户</p>
              )}
              {searchResults.map(u => {
                const fm = followingMap[u._id] || { isFollowing: false, isFollowedBy: false };
                return renderUserCard(u, fm, true);
              })}
            </div>
          )}
        </>
      )}

      {gameSocket.error && (
        <div className="mt-2 p-2 bg-red-50 text-red-500 text-xs rounded-lg">
          {gameSocket.error}
          <button onClick={() => gameSocket.setError(null)} className="ml-2 text-red-300 hover:text-red-500">✕</button>
        </div>
      )}
    </div>
  );
}
