import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await axios.get(`/api/articles/${id}`);
      setArticle(res.data);
      const likes = res.data.likes;
      setLikesCount(Array.isArray(likes) ? likes.length : (likes || 0));
      if (user) {
        setIsLiked(
          Array.isArray(likes) && likes.some(l => (l._id || l) === user.id)
        );
      }
      fetchComments();
    } catch (error) {
      console.error('Failed to fetch article');
      navigate('/articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/articles/${id}/comments`);
      setComments(res.data.comments || res.data);
    } catch (error) {
      console.error('Failed to fetch comments');
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(`/api/articles/${id}/like`);
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
      const res = await axios.post(`/api/articles/${id}/favorite`);
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

    setSubmitting(true);
    try {
      await axios.post(`/api/articles/${id}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定删除这篇文章吗？')) return;
    try {
      await axios.delete(`/api/articles/${id}`);
      navigate('/articles');
    } catch (error) {
      console.error('Failed to delete');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      '经验分享': 'bg-blue-100 text-blue-800',
      '教程': 'bg-green-100 text-green-800',
      '随笔': 'bg-purple-100 text-purple-800',
      '书评影评': 'bg-yellow-100 text-yellow-800',
      '技术文章': 'bg-red-100 text-red-800',
      '其他': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <p className="text-gray-500">文章不存在</p>
      </div>
    );
  }

  const isOwner = user && article.owner && user.id === (article.owner._id || article.owner);

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="mb-6 text-[#8B7355] hover:text-[#4A3728] flex items-center transition">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <div className="bg-white rounded-card border border-[#E8E0D5] shadow-card overflow-hidden">
          {article.cover && (
            <div className="aspect-[3/4] sm:aspect-[16/10] overflow-hidden max-h-[500px]">
              <img
                src={article.cover}
                alt={article.title}
                className="w-full h-full object-contain bg-[#F5F0E8]"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
                {article.tags && article.tags.length > 0 && article.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-[#F5F0E8] text-[#8B7355] text-sm rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              {isOwner && (
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/articles/edit/${id}`}
                    className="px-4 py-2 text-sm text-[#8B7355] hover:text-[#4A3728] border border-[#E8E0D5] rounded-btn transition"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-sm text-red-500 hover:text-red-600 border border-[#E8E0D5] rounded-btn transition"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-[#4A3728] mb-4">
              {article.title}
            </h1>

            <div className="flex items-center space-x-4 mb-6">
              <Link
                to={`/profile/${article.owner?._id || article.owner}`}
                className="flex items-center space-x-3"
              >
                <img
                  src={article.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${article.owner?.nickname || 'user'}`}
                  alt={article.owner?.nickname}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-[#4A3728]">{article.owner?.nickname || '匿名'}</p>
                  <p className="text-xs text-gray-400">
                    {article.createdAt ? new Date(article.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                </div>
              </Link>
            </div>

            {article.meta && Object.keys(article.meta).length > 0 && article.category !== '其他' && (
              <div className="bg-[#FAFAF7] rounded-card border border-[#E8E0D5] p-4 mb-6">
                {article.category === '经验分享' && (
                  <div className="space-y-2">
                    {article.meta.scenario && <div className="text-sm"><span className="text-gray-400">应用场景：</span><span className="text-[#4A3728]">{article.meta.scenario}</span></div>}
                    {article.meta.problem && <div className="text-sm"><span className="text-gray-400">遇到的问题：</span><span className="text-[#4A3728]">{article.meta.problem}</span></div>}
                    {article.meta.solution && <div className="text-sm"><span className="text-gray-400">解决方案：</span><span className="text-[#4A3728]">{article.meta.solution}</span></div>}
                    {article.meta.lesson && <div className="text-sm"><span className="text-gray-400">经验教训：</span><span className="text-[#4A3728]">{article.meta.lesson}</span></div>}
                  </div>
                )}
                {article.category === '教程' && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {article.meta.difficulty && <div className="text-sm"><span className="text-gray-400">难度：</span><span className="text-[#4A3728] font-medium">{article.meta.difficulty}</span></div>}
                    {article.meta.duration && <div className="text-sm"><span className="text-gray-400">预计耗时：</span><span className="text-[#4A3728]">{article.meta.duration}</span></div>}
                    {article.meta.prerequisites && <div className="text-sm"><span className="text-gray-400">前置知识：</span><span className="text-[#4A3728]">{article.meta.prerequisites}</span></div>}
                    {article.meta.tools && <div className="text-sm"><span className="text-gray-400">所需工具：</span><span className="text-[#4A3728]">{article.meta.tools}</span></div>}
                  </div>
                )}
                {article.category === '随笔' && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {article.meta.mood && <div className="text-sm"><span className="text-gray-400">心境：</span><span className="text-[#4A3728]">{article.meta.mood}</span></div>}
                    {article.meta.location && <div className="text-sm"><span className="text-gray-400">地点：</span><span className="text-[#4A3728]">{article.meta.location}</span></div>}
                    {article.meta.inspiration && <div className="text-sm"><span className="text-gray-400">灵感来源：</span><span className="text-[#4A3728]">{article.meta.inspiration}</span></div>}
                  </div>
                )}
                {article.category === '书评影评' && (
                  <div className="space-y-2">
                    {article.meta.workTitle && <div className="text-sm"><span className="text-gray-400">作品：</span><span className="text-[#4A3728] font-medium">{article.meta.workTitle}</span></div>}
                    {article.meta.creator && <div className="text-sm"><span className="text-gray-400">作者/导演：</span><span className="text-[#4A3728]">{article.meta.creator}</span></div>}
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {article.meta.rating && <div className="text-sm"><span className="text-gray-400">评分：</span><span className="text-[#4A3728]">{article.meta.rating}</span></div>}
                      {article.meta.recommend && <div className="text-sm"><span className="text-gray-400">推荐：</span><span className="text-[#4A3728]">{article.meta.recommend}</span></div>}
                    </div>
                  </div>
                )}
                {article.category === '技术文章' && (
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {article.meta.techStack && <div className="text-sm"><span className="text-gray-400">技术栈：</span><span className="text-[#4A3728] font-medium">{article.meta.techStack}</span></div>}
                    {article.meta.difficulty && <div className="text-sm"><span className="text-gray-400">难度：</span><span className="text-[#4A3728]">{article.meta.difficulty}</span></div>}
                    {article.meta.version && <div className="text-sm"><span className="text-gray-400">适用版本：</span><span className="text-[#4A3728]">{article.meta.version}</span></div>}
                  </div>
                )}
              </div>
            )}

            {article.summary && (
              <div className="bg-[#F5F0E8] border-l-4 border-[#8B7355] p-4 rounded-r-lg mb-6">
                <p className="text-[#4A3728] italic">{article.summary}</p>
              </div>
            )}

            <div className="prose max-w-none mb-8">
              <div className="text-[#4A3728] whitespace-pre-wrap leading-relaxed text-base">
                {article.content}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#E8E0D5]">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-btn transition ${
                    isLiked
                      ? 'bg-red-50 text-red-500'
                      : 'bg-[#F5F0E8] text-[#8B7355] hover:bg-red-50 hover:text-red-500'
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
                  <span className="text-sm font-medium">{likesCount}</span>
                </button>

                <button
                  onClick={handleFavorite}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-btn transition ${
                    isFavorited
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-[#F5F0E8] text-[#8B7355] hover:bg-yellow-50 hover:text-yellow-600'
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
                  <span className="text-sm font-medium">{isFavorited ? '已收藏' : '收藏'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8E0D5] p-6 sm:p-8 bg-[#FAFAF7]">
            <h3 className="text-lg font-bold text-[#4A3728] mb-6">
              评论 ({comments.length})
            </h3>

            {user ? (
              <form onSubmit={handleComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] bg-white text-sm text-[#4A3728] placeholder-[#B8A899] transition-all resize-none"
                  rows={3}
                  placeholder="写下你的评论..."
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="px-6 py-2 bg-[#4A3728] text-white text-sm font-medium rounded-btn hover:bg-[#3A2A1E] transition disabled:opacity-50"
                  >
                    {submitting ? '发布中...' : '发布评论'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-white rounded-card border border-[#E8E0D5] text-center">
                <p className="text-sm text-gray-500">
                  <Link to="/login" className="text-[#8B7355] hover:text-[#4A3728] font-medium">登录</Link>
                  {' '}后可以发表评论
                </p>
              </div>
            )}

            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="bg-white rounded-card border border-[#E8E0D5] p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={comment.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.user?.nickname || comment.userName || 'user'}`}
                        alt={comment.user?.nickname || comment.userName}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#4A3728] text-sm">
                            {comment.user?.nickname || comment.userName || '匿名'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('zh-CN') : ''}
                          </span>
                        </div>
                        <p className="text-[#4A3728]/80 text-sm mt-1 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8 text-sm">还没有评论，快来抢沙发吧</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleDetail;