import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    try {
      const res = await axios.get(`/api/resources/${id}`);
      setResource(res.data);
    } catch (error) {
      console.error('Failed to fetch resource');
      navigate('/resources');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axios.post(`/api/resources/${id}/like`);
      setResource({
        ...resource,
        likeCount: res.data.likeCount,
        isLiked: res.data.isLiked
      });
    } catch (error) {
      console.error('Failed to like');
    }
  };

  const handleFavorite = async () => {
    if (!user) return;
    try {
      const res = await axios.post(`/api/resources/${id}/favorite`);
      setResource({
        ...resource,
        favoriteCount: res.data.favoriteCount,
        isFavorited: res.data.isFavorited
      });
    } catch (error) {
      console.error('Failed to favorite');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`/api/resources/${id}/comment`, { content: comment });
      setComment('');
      fetchResource();
    } catch (error) {
      alert(error.response?.data?.message || '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await axios.delete(`/api/resources/${id}/comment/${commentId}`);
      fetchResource();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个资源吗？')) return;
    try {
      await axios.delete(`/api/resources/${id}`);
      navigate('/resources');
    } catch (error) {
      alert('删除失败');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      '网址': '🌐',
      'APP': '📱',
      '文章': '📝',
      '其他': '📦'
    };
    return icons[type] || '📦';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">资源不存在</p>
      </div>
    );
  }

  const isOwner = user?.id === resource.uploader?._id || user?.id === resource.uploader;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 fade-in">
      <button onClick={() => navigate(-1)} className="mb-6 text-gray-600 hover:text-gray-800 flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 mb-6">
        <div className="flex items-start space-x-4 mb-6">
          <span className="text-5xl">{getTypeIcon(resource.type)}</span>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{resource.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium">
                {resource.type}
              </span>
              <span className="text-sm text-gray-500">
                分享者：{resource.uploaderName}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(resource.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {resource.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-secondary-50 text-secondary-700 text-sm rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {resource.link && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">外部链接</p>
                <a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-800 break-all">
                  {resource.link}
                </a>
              </div>
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                访问 →
              </a>
            </div>
          </div>
        )}

        <div className="prose max-w-none mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">资源介绍</h3>
          <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
            {resource.description}
          </div>
        </div>

        {resource.images && resource.images.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">相关图片</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {resource.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center space-x-2 ${resource.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'} disabled:cursor-not-allowed`}
            >
              <svg className="w-6 h-6" fill={resource.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{resource.likeCount} 点赞</span>
            </button>
            <button
              onClick={handleFavorite}
              disabled={!user}
              className={`flex items-center space-x-2 ${resource.isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'} disabled:cursor-not-allowed`}
            >
              <svg className="w-6 h-6" fill={resource.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>{resource.favoriteCount} 收藏</span>
            </button>
          </div>

          {isOwner && (
            <div className="flex items-center space-x-3">
              <Link
                to={`/resources/edit/${resource._id}`}
                className="px-4 py-2 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700"
              >
                编辑
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          评论 ({resource.commentCount || 0})
        </h3>

        {user ? (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 mb-3"
              placeholder="发表你的看法..."
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="px-6 py-2 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '发送中...' : '发送评论'}
            </button>
          </form>
        ) : (
          <p className="mb-6 text-gray-600">
            <Link to="/login" className="text-secondary-600 hover:text-secondary-700 font-medium">登录</Link>后可发表评论
          </p>
        )}

        <div className="space-y-4">
          {resource.comments && resource.comments.length > 0 ? (
            resource.comments.map((c) => (
              <div key={c._id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <img
                      src={c.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.userName}`}
                      alt={c.userName}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{c.userName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {(user?.id === c.user?._id || user?.id === c.user) && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>
                <p className="text-gray-600 ml-11">{c.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">暂无评论</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceDetail;