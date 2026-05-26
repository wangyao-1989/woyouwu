import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resource, setResource] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchResource = async () => {
    try {
      const { data } = await axios.get(`/api/resources/${id}`);
      setResource(data);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to fetch resource');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await axios.post(`/api/resources/${id}/like`);
      setResource(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
      }));
    } catch (err) {
      console.error('Failed to like');
    }
  };

  const handleFavorite = async () => {
    try {
      await axios.post(`/api/resources/${id}/favorite`);
      setResource(prev => ({
        ...prev,
        isFavorited: !prev.isFavorited,
        favoriteCount: prev.isFavorited ? prev.favoriteCount - 1 : prev.favoriteCount + 1
      }));
    } catch (err) {
      console.error('Failed to favorite');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/resources/${id}/comment`, { text: commentText });
      setComments(prev => [data.comment || data, ...prev]);
      setResource(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      setCommentText('');
    } catch (err) {
      console.error('Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('确定删除这条评论吗？')) return;
    try {
      await axios.delete(`/api/resources/${id}/comment/${commentId}`);
      setComments(prev => prev.filter(c => (c._id || c.id) !== commentId));
      setResource(prev => ({ ...prev, commentCount: (prev.commentCount || 1) - 1 }));
    } catch (err) {
      console.error('Failed to delete comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定删除这个资源吗？')) return;
    try {
      await axios.delete(`/api/resources/${id}`);
      navigate('/resources');
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  useEffect(() => { fetchResource(); }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <p className="text-gray-500">资源不存在</p>
      </div>
    );
  }

  const isOwner = user && resource.uploader && (
    (resource.uploader._id || resource.uploader) === (user._id || user.id)
  );

  const typeIcons = { '网址': '🔗', 'APP': '📱', '文章': '📄', '其他': '📌' };

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/resources" className="inline-flex items-center text-sm text-[#8B7355] hover:text-[#4A3728] mb-6 transition">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回资源列表
        </Link>

        <div className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F0E8] text-[#8B7355] rounded-full text-sm">
                  {typeIcons[resource.type] || '📌'} {resource.type}
                </span>
                {resource.tags && resource.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-[#F5F0E8] text-[#8B7355] rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl font-bold text-[#4A3728] mb-3">{resource.title}</h1>
              <p className="text-gray-600 leading-relaxed mb-6">{resource.description}</p>

              {resource.link && (
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A3728] text-white rounded-btn text-sm hover:bg-[#3A2A1E] transition mb-6"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  访问链接
                </a>
              )}

              {resource.images && resource.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {resource.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Image ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>

            {isOwner && (
              <div className="flex items-center gap-2 ml-4">
                <Link
                  to={`/resources/edit/${id}`}
                  className="px-4 py-2 text-sm bg-[#F5F0E8] text-[#8B7355] rounded-btn hover:bg-[#E8E0D5] transition"
                >
                  编辑
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm bg-red-50 text-red-500 rounded-btn hover:bg-red-100 transition"
                >
                  删除
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-4 border-t border-[#E8E0D5]">
            <div className="flex items-center space-x-2">
              <img
                src={resource.uploader?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${resource.uploader?.nickname || resource.uploaderName || 'user'}`}
                alt={resource.uploader?.nickname || resource.uploaderName}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-gray-600">{resource.uploader?.nickname || resource.uploaderName || '匿名'}</span>
            </div>
            <div className="flex items-center space-x-6">
              <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition ${resource.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                <svg className="w-5 h-5" fill={resource.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{resource.likeCount || 0}</span>
              </button>
              <button onClick={handleFavorite} className={`flex items-center gap-1.5 text-sm transition ${resource.isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}`}>
                <svg className="w-5 h-5" fill={resource.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>{resource.favoriteCount || 0}</span>
              </button>
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{resource.commentCount || comments.length}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-card border border-[#E8E0D5] shadow-card p-8">
          <h2 className="text-lg font-semibold text-[#4A3728] mb-6">评论 ({comments.length})</h2>

          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写一条评论..."
                className="w-full px-4 py-3 border border-[#E8E0D5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!commentText.trim() || submitting}
                  className="px-6 py-2 bg-[#4A3728] text-white rounded-btn text-sm hover:bg-[#3A2A1E] transition disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '发表评论'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-[#F5F0E8] rounded-lg text-center">
              <span className="text-sm text-gray-500">请
                <Link to="/login" className="text-[#4A3728] hover:underline mx-1">登录</Link>
                后发表评论
              </span>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment, i) => (
              <div key={comment._id || comment.id || i} className="flex gap-3 pb-4 border-b border-[#E8E0D5] last:border-0">
                <img
                  src={comment.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.nickname || comment.userName || 'user'}`}
                  alt={comment.user?.nickname || comment.userName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#4A3728]">{comment.user?.nickname || comment.userName || '匿名'}</span>
                    {user && (comment.user?._id === user._id || comment.user === user._id || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment._id || comment.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition"
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{comment.text || comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">暂无评论</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceDetail;
