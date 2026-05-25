import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchComments();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await axios.get(`/api/projects/${id}`);
      console.log('ProjectDetail fetchProject success, id:', id, 'data keys:', Object.keys(res.data));
      setProject(res.data);
    } catch (error) {
      console.error('ProjectDetail fetchProject error:', error.message, 'status:', error.response?.status);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await axios.get(`/api/projects/${id}/comments`);
      setComments(res.data.comments || res.data || []);
    } catch (error) {
      console.error('Failed to fetch comments');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLiking(true);
    try {
      const res = await axios.post(`/api/projects/${id}/like`);
      setProject(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likes: res.data.likes ?? (prev.isLiked ? prev.likes - 1 : prev.likes + 1)
      }));
    } catch (error) {
      console.error('Failed to like');
    } finally {
      setLiking(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFavoriting(true);
    try {
      const res = await axios.post(`/api/projects/${id}/favorite`);
      setProject(prev => ({
        ...prev,
        isFavorited: !prev.isFavorited,
        favorites: res.data.favorites ?? (prev.isFavorited ? prev.favorites - 1 : prev.favorites + 1)
      }));
    } catch (error) {
      console.error('Failed to favorite');
    } finally {
      setFavoriting(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await axios.post(`/api/projects/${id}/comments`, {
        content: newComment.trim()
      });
      setComments(prev => [res.data.comment || res.data, ...prev]);
      setNewComment('');
      setProject(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
    } catch (error) {
      console.error('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await axios.delete(`/api/projects/${id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => (c._id || c.id) !== commentId));
      setProject(prev => ({ ...prev, commentCount: Math.max((prev.commentCount || 1) - 1, 0) }));
    } catch (error) {
      console.error('Failed to delete comment');
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复。')) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      navigate('/projects');
    } catch (error) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#F5F0E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#F5F0E8]">
        <p className="text-gray-500">项目不存在</p>
      </div>
    );
  }

  const isOwner = user && (user.id === (project.owner?._id || project.owner) || user._id === (project.owner?._id || project.owner));
  const authorInfo = project.owner;

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="mb-6 text-[#8B7355] hover:text-[#4A3728] flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <div className="bg-white rounded-card border border-[#E8E0D5] shadow-card overflow-hidden">
          {project.cover && (
            <div className="w-full overflow-hidden bg-[#F5F0E8] rounded-t-card flex items-center justify-center" style={{ maxHeight: '60vh' }}>
              <img
                src={project.cover}
                alt={project.title}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          )}

          <div className="p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-[#4A3728] mb-3">{project.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {project.category && (
                    <span className="inline-block px-3 py-1 bg-[#F5F0E8] text-[#8B7355] text-sm rounded-full font-medium">
                      {project.category}
                    </span>
                  )}
                  {project.completionDate && (
                    <span className="text-sm text-gray-400">
                      完成于 {formatDate(project.completionDate)}
                    </span>
                  )}
                </div>
                {project.techTags && project.techTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.techTags.map((tag, i) => (
                      <span key={i} className="inline-block px-2.5 py-0.5 bg-[#8B7355]/10 text-[#8B7355] text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-btn border transition-all ${
                    project.isLiked
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-[#E8E0D5] text-gray-500 hover:border-red-200 hover:text-red-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill={project.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium">{project.likes || 0}</span>
                </button>
                <button
                  onClick={handleFavorite}
                  disabled={favoriting}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-btn border transition-all ${
                    project.isFavorited
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-500'
                      : 'bg-white border-[#E8E0D5] text-gray-500 hover:border-yellow-300 hover:text-yellow-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill={project.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span className="text-sm font-medium">{project.favorites || 0}</span>
                </button>
              </div>
            </div>

            {authorInfo && (
              <div className="flex items-center mb-6 pb-6 border-b border-[#F5F0E8]">
                <img
                  src={authorInfo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${authorInfo.nickname || 'author'}`}
                  alt={authorInfo.nickname}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <p className="font-medium text-[#4A3728]">{authorInfo.nickname}</p>
                  <p className="text-sm text-gray-400">作者</p>
                </div>
              </div>
            )}

            {project.summary && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">简介</h3>
                <p className="text-gray-600 bg-[#F5F0E8] p-4 rounded-lg">{project.summary}</p>
              </div>
            )}

            {project.content && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">详细内容</h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.content}</div>
              </div>
            )}

            {project.link && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">项目链接</h3>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[#8B7355] hover:text-[#4A3728] underline transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {project.link}
                </a>
              </div>
            )}

            {project.collaborators && project.collaborators.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">协作者</h3>
                <div className="flex flex-wrap gap-2">
                  {project.collaborators.map((collab, i) => (
                    <span key={i} className="inline-block px-3 py-1 bg-[#F5F0E8] text-[#4A3728] text-sm rounded-full">
                      {typeof collab === 'string' ? collab : collab.nickname || collab.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isOwner && (
              <div className="flex space-x-3 mb-6 pb-6 border-b border-[#F5F0E8]">
                <Link
                  to={`/projects/edit/${project._id || project.id}`}
                  className="flex-1 py-2.5 bg-[#8B7355] text-white text-center font-medium rounded-btn hover:bg-[#7A6348] transition-all"
                >
                  编辑项目
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-50 text-red-600 font-medium rounded-btn hover:bg-red-100 transition-all"
                >
                  删除项目
                </button>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-[#4A3728] mb-4">
                评论 ({project.commentCount || comments.length})
              </h3>

              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex space-x-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="写下你的评论..."
                      rows={3}
                      className="flex-1 px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] resize-none transition-all"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-5 py-2 bg-[#4A3728] text-white text-sm font-medium rounded-btn hover:bg-[#3A2A1E] disabled:opacity-40 transition-all"
                    >
                      {submittingComment ? '提交中...' : '发表评论'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-[#F5F0E8] rounded-btn text-center">
                  <Link to="/login" className="text-[#8B7355] hover:text-[#4A3728] font-medium transition-colors">
                    登录后参与评论
                  </Link>
                </div>
              )}

              {commentsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A3728]"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">暂无评论，来发表第一条评论吧</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => {
                    const commentId = comment._id || comment.id;
                    const commentUser = comment.user || comment.author;
                    const isCommentOwner = user && commentUser && (
                      user.id === (commentUser._id || commentUser) ||
                      user._id === (commentUser._id || commentUser)
                    );
                    return (
                      <div key={commentId} className="bg-[#F5F0E8] rounded-btn p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <img
                              src={commentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${commentUser?.nickname || 'user'}`}
                              alt={commentUser?.nickname}
                              className="w-8 h-8 rounded-full mr-2"
                            />
                            <div>
                              <p className="text-sm font-medium text-[#4A3728]">
                                {commentUser?.nickname || '匿名用户'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(comment.createdAt)}
                              </p>
                            </div>
                          </div>
                          {(isCommentOwner || isOwner) && (
                            <button
                              onClick={() => handleDeleteComment(commentId)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;