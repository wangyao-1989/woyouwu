import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function InspirationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inspiration, setInspiration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchInspiration();
  }, [id]);

  const fetchInspiration = async () => {
    try {
      const res = await axios.get(`/api/inspirations/${id}`);
      setInspiration(res.data);
      setLikesCount(res.data.likesCount || res.data.likes?.length || 0);
      if (user) {
        setIsLiked(
          res.data.likes?.some(like => (like._id || like) === (user._id || user.id))
        );
        setIsFavorited(
          res.data.favorites?.some(fav => (fav._id || fav) === (user._id || user.id))
        );
      }
    } catch (error) {
      console.error('Failed to fetch inspiration');
      navigate('/inspirations');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(`/api/inspirations/${id}/like`);
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likesCount);
    } catch (error) {
      console.error('Failed to like');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(`/api/inspirations/${id}/favorite`);
      setIsFavorited(res.data.isFavorited);
    } catch (error) {
      console.error('Failed to favorite');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    try {
      await axios.post(`/api/inspirations/${id}/comments`, { content: newComment });
      setNewComment('');
      fetchInspiration();
    } catch (error) {
      console.error('Failed to comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除这条灵感吗？')) return;
    try {
      await axios.delete(`/api/inspirations/${id}`);
      navigate('/inspirations');
    } catch (error) {
      console.error('Failed to delete');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case '纯想法':
        return 'bg-purple-100 text-purple-700';
      case '探索中':
        return 'bg-amber-100 text-amber-700';
      case '已落地':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case '产品想法': return '🚀';
      case '设计灵感': return '🎨';
      case '技术方案': return '⚙️';
      case '商业模式': return '📊';
      case '其他': return '📌';
      default: return '💡';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
      </div>
    );
  }

  if (!inspiration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <p className="text-gray-500">灵感不存在</p>
      </div>
    );
  }

  const isOwner = user && (inspiration.author?._id === user.id || inspiration.author === user.id || inspiration.author?._id === user._id);

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-8 fade-in">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="mb-6 text-[#8B7355] hover:text-[#4A3728] flex items-center text-sm">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回列表
        </button>

        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getCategoryIcon(inspiration.category)}</span>
                <span className={`tag-capsule ${getStatusStyle(inspiration.status)}`}>
                  {inspiration.status}
                </span>
              </div>

              {isOwner && (
                <div className="flex space-x-2">
                  <Link
                    to={`/inspirations/edit/${inspiration._id}`}
                    className="px-4 py-2 text-sm text-[#8B7355] hover:text-[#4A3728] border border-[#E8E0D5] rounded-btn hover:border-[#C8BAAA] transition-all"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm text-red-500 hover:text-red-700 border border-[#E8E0D5] rounded-btn hover:border-red-300 transition-all"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>

            <h1 className="heading-xl mb-4">
              {inspiration.title}
            </h1>

            <p className="text-[#8B7355] text-lg mb-6">
              {inspiration.description}
            </p>

            {inspiration.detail && (
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {inspiration.detail}
                </p>
              </div>
            )}

            {inspiration.refLinks && inspiration.refLinks.length > 0 && (
              <div className="mb-6 p-4 bg-[#F5F0E8] rounded-xl">
                <h3 className="text-sm font-medium text-[#4A3728] mb-2">参考链接</h3>
                <div className="space-y-1.5">
                  {inspiration.refLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-[#8B7355] hover:text-[#4A3728] truncate"
                    >
                      <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {inspiration.tags && inspiration.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {inspiration.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#F5F0E8] text-[#8B7355] rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-[#F5F0E8]">
              <div className="flex items-center space-x-3">
                <img
                  src={inspiration.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${inspiration.author?.nickname || 'anonymous'}`}
                  alt={inspiration.author?.nickname}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-[#4A3728]">{inspiration.author?.nickname || '匿名'}</p>
                  <p className="text-sm text-[#B8A899]">
                    {inspiration.createdAt ? new Date(inspiration.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-btn text-sm transition-all active:scale-95 ${
                    isLiked
                      ? 'bg-red-100 text-red-600'
                      : 'bg-[#F5F0E8] text-[#8B7355] hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{likesCount}</span>
                </button>

                <button
                  onClick={handleFavorite}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-btn text-sm transition-all active:scale-95 ${
                    isFavorited
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-[#F5F0E8] text-[#8B7355] hover:bg-yellow-50 hover:text-yellow-700'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isFavorited ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>{isFavorited ? '已收藏' : '收藏'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#F5F0E8] p-8 bg-[#FAF7F2]">
            <h3 className="heading-md mb-6">
              评论 ({inspiration.comments ? inspiration.comments.length : 0})
            </h3>

            {user ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] text-sm text-[#4A3728] placeholder-[#B8A899] resize-none"
                  rows={3}
                  placeholder="写下你的想法..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="btn-primary text-sm active:scale-95"
                  >
                    发布评论
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-[#F5F0E8] rounded-xl text-center">
                <p className="text-sm text-[#8B7355]">
                  <Link to="/login" className="text-[#4A3728] underline">登录</Link>
                  后即可评论
                </p>
              </div>
            )}

            <div className="space-y-4">
              {inspiration.comments && inspiration.comments.length > 0 ? (
                inspiration.comments.map((comment) => (
                  <div key={comment._id} className="bg-white rounded-xl p-4 border border-[#E8E0D5]">
                    <div className="flex items-start space-x-3">
                      <img
                        src={comment.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.nickname || 'user'}`}
                        alt={comment.user?.nickname}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-[#4A3728] text-sm">
                            {comment.user?.nickname || comment.userName || '匿名'}
                          </span>
                          <span className="text-xs text-[#B8A899]">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('zh-CN') : ''}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[#B8A899] py-8 text-sm">还没有评论，来抢沙发吧</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InspirationDetail;