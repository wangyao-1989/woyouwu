import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      const res = await axios.get(`/api/contents/${id}`);
      setContent(res.data);
      setLikesCount(res.data.likes ? res.data.likes.length : 0);
      if (user) {
        setIsLiked(res.data.likes?.some(like => like._id === user.id || like === user.id));
      }
    } catch (error) {
      console.error('Failed to fetch content');
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
      const res = await axios.post(`/api/contents/${id}/like`);
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
      await axios.post(`/api/contents/${id}/favorite`);
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
      await axios.post(`/api/contents/${id}/comment`, { content: newComment });
      setNewComment('');
      fetchContent();
    } catch (error) {
      console.error('Failed to comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除这条内容吗？')) return;
    try {
      await axios.delete(`/api/contents/${id}`);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete');
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available': return '🟢 可用';
      case 'given': return '🔵 已送出';
      case 'exchanged': return '🟡 交换中';
      case 'borrowed': return '🔴 已借出';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">内容不存在</p>
      </div>
    );
  }

  const isOwner = user && content.owner && user.id === content.owner._id;

  return (
    <div className="min-h-screen bg-[#F5F0E8] pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {content.images && content.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-4">
              {content.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt=""
                  className="w-full h-64 object-cover rounded-xl"
                />
              ))}
            </div>
          )}

          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(content.type)} mb-3`}>
                  {getTypeLabel(content.type)}
                </span>
                {content.status && (
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 ml-2">
                    {getStatusLabel(content.status)}
                  </span>
                )}
              </div>

              {isOwner && (
                <div className="flex space-x-2">
                  <Link
                    to={`/edit/${id}`}
                    className="px-4 py-2 text-gray-600 hover:text-primary-600"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-gray-600 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>

            {content.title && (
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {content.title}
              </h1>
            )}

            {content.link && (
              <a
                href={content.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-lg mb-6 hover:bg-primary-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                查看链接
              </a>
            )}

            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {content.content}
              </p>
            </div>

            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {content.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <Link
                to={`/profile/${content.owner._id}`}
                className="flex items-center space-x-3"
              >
                <img
                  src={content.owner.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${content.owner.nickname}`}
                  alt={content.owner.nickname}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-800">{content.owner.nickname}</p>
                  <p className="text-sm text-gray-500">@{content.owner.username}</p>
                </div>
              </Link>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    isLiked
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100'
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
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-yellow-100 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>收藏</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t p-8 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              评论 ({content.comments ? content.comments.length : 0})
            </h3>

            {user && (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="写下你的评论..."
                />
                <button
                  type="submit"
                  className="mt-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  发布评论
                </button>
              </form>
            )}

            <div className="space-y-4">
              {content.comments && content.comments.length > 0 ? (
                content.comments.map((comment) => (
                  <div key={comment._id} className="bg-white rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={comment.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.userName}`}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">{comment.userName}</span>
                          <span className="text-sm text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">还没有评论</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentDetail;