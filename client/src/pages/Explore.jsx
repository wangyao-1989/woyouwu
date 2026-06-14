import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Explore() {
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/contents/explore?limit=30');
      setContents(res.data.contents);
    } catch (error) {
      console.error('Failed to fetch contents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (id) => {
    if (!user) return;
    try {
      const res = await axios.post(`/api/contents/${id}/like`);
      setContents(contents.map(c => 
        c._id === id ? { ...c, isLiked: res.data.isLiked, likesCount: res.data.likesCount } : c
      ));
    } catch (error) {
      console.error('Failed to like');
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'achievement': return '✨ 个人成果';
      case 'inspiration': return '💡 瞬间灵感';
      case 'item': return '🎁 闲置物品';
      default: return '📦 内容';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'achievement': return 'bg-purple-100 text-purple-700';
      case 'inspiration': return 'bg-yellow-100 text-yellow-700';
      case 'item': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status, type) => {
    if (type !== 'item') return null;
    switch (status) {
      case 'available': return '🟢 可用';
      case 'given': return '🔵 已送出';
      case 'exchanged': return '🟡 交换中';
      case 'borrowed': return '🔴 已借出';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">正在探索...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🎲 盲盒探索
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            每次刷新都是新的惊喜，发现社区中的宝藏内容
          </p>
          <button
            onClick={fetchContents}
            disabled={refreshing}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {refreshing ? '🎰 探索中...' : '🎲 重新探索'}
          </button>
        </div>

        {contents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">还没有内容</h3>
            <p className="text-gray-500">成为第一个分享者吧！</p>
            {user && (
              <Link
                to="/create"
                className="inline-block mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                发布内容
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => (
              <div
                key={content._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
              >
                {content.images && content.images.length > 0 ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={content.images[0]}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(content.type)}`}>
                        {getTypeLabel(content.type)}
                      </span>
                    </div>
                    {getStatusLabel(content.status, content.type) && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700">
                          {getStatusLabel(content.status, content.type)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`h-32 flex items-center justify-center ${getTypeColor(content.type)}`}>
                    <span className="text-4xl">
                      {content.type === 'achievement' ? '✨' : content.type === 'inspiration' ? '💡' : '🎁'}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  {content.title && (
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {content.title}
                    </h3>
                  )}
                  
                  {content.content && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {content.content}
                    </p>
                  )}

                  {content.link && (
                    <a
                      href={content.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mb-3"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      查看链接
                    </a>
                  )}

                  {content.tags && content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {content.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <Link
                      to={`/profile/${content.owner._id}`}
                      className="flex items-center space-x-2"
                    >
                      <img
                        src={content.owner.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${content.owner.nickname}`}
                        alt={content.owner.nickname}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {content.owner.nickname}
                      </span>
                    </Link>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(content._id)}
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition"
                      >
                        <svg
                          className={`w-5 h-5 ${content.isLiked ? 'fill-current text-red-500' : ''}`}
                          fill={content.isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-sm">{content.likesCount || 0}</span>
                      </button>

                      <Link
                        to={`/content/${content._id}`}
                        className="flex items-center space-x-1 text-gray-500 hover:text-primary-500 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-sm">{content.commentsCount || 0}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;