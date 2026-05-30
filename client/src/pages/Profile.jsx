import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AvatarCropper from '../components/AvatarCropper';

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const avatarInputRef = useRef(null);
  const [profileUser, setProfileUser] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [userResources, setUserResources] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [userArticles, setUserArticles] = useState([]);
  const [userInspirations, setUserInspirations] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ items: 0, resources: 0, projects: 0, articles: 0, inspirations: 0, followers: 0, following: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    location: '',
    website: '',
    contactWechat: '',
    contactPhone: '',
    contactEmail: '',
    skills: [],
    socialLinks: {
      weibo: '',
      github: '',
      twitter: '',
      bilibili: '',
      zhihu: '',
      qq: ''
    }
  });
  const [newSkill, setNewSkill] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [cropImage, setCropImage] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [inviteSubTab, setInviteSubTab] = useState('codes');
  const [generatingCode, setGeneratingCode] = useState(false);

  const isOwnProfile = !id || id === currentUser?.id;
  const profileId = id || currentUser?.id;

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const userRes = await axios.get(`/api/users/${profileId}`);
      setProfileUser(userRes.data);
      setEditForm({
        nickname: userRes.data.nickname,
        bio: userRes.data.bio || '',
        location: userRes.data.location || '',
        website: userRes.data.website || '',
        contactWechat: userRes.data.contactWechat || '',
        contactPhone: userRes.data.contactPhone || '',
        contactEmail: userRes.data.contactEmail || '',
        skills: userRes.data.skills || [],
        socialLinks: userRes.data.socialLinks || {
          weibo: '',
          github: '',
          twitter: '',
          bilibili: '',
          zhihu: '',
          qq: ''
        }
      });

      const [itemsRes, resourcesRes, projectsRes, articlesRes, inspirationsRes, statsRes, postsRes] = await Promise.all([
        axios.get(`/api/users/${profileId}/items`),
        axios.get(`/api/users/${profileId}/resources`),
        axios.get(`/api/users/${profileId}/projects`),
        axios.get(`/api/users/${profileId}/articles`),
        axios.get(`/api/users/${profileId}/inspirations`),
        axios.get(`/api/users/${profileId}/stats`),
        axios.get(`/api/posts/user/${profileId}`)
      ]);
      setUserItems(itemsRes.data);
      setUserResources(resourcesRes.data);
      setUserProjects(projectsRes.data);
      setUserArticles(articlesRes.data);
      setUserInspirations(inspirationsRes.data);
      setUserPosts(postsRes.data.posts || postsRes.data);
      setStats({
        ...statsRes.data,
        posts: postsRes.data.total || postsRes.data.length,
        projects: projectsRes.data.length,
        articles: articlesRes.data.length,
        inspirations: inspirationsRes.data.length
      });

      if (currentUser && !isOwnProfile) {
        const currentUserData = await axios.get(`/api/users/${currentUser.id}`);
        setIsFollowing(currentUserData.data.following?.includes(profileId));
      }

      if (isOwnProfile) {
        fetchInviteData();
      }
    } catch (error) {
      console.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setEditForm(prev => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [socialKey]: value }
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
      setCropImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCrop = async (blob) => {
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.jpg');

    try {
      const res = await axios.put('/api/users/profile', formData);
      updateUser(res.data.user);
      setProfileUser(res.data.user);
      setCropImage(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    } catch (error) {
      alert('头像上传失败');
      setCropImage(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleAvatarCancel = () => {
    setCropImage(null);
    setAvatarPreview(null);
  };

  const handleBackgroundChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('background', file);

    try {
      const res = await axios.post('/api/users/background', formData);
      setProfileUser(res.data.user);
    } catch (error) {
      alert('背景图上传失败');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put('/api/users/profile', {
        ...editForm,
        socialLinks: JSON.stringify(editForm.socialLinks),
        skills: JSON.stringify(editForm.skills)
      });
      updateUser(res.data.user);
      setProfileUser(res.data.user);
      setIsEditing(false);
    } catch (error) {
      alert('保存失败');
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('请填写所有字段');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('新密码至少需要6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    try {
      await axios.put('/api/users/me/password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess('密码修改成功');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (error) {
      setPasswordError(error.response?.data?.message || '修改失败');
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(`/api/users/${profileId}/follow`);
      setIsFollowing(res.data.isFollowing);
      fetchProfile();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() && !postImage) {
      alert('请输入内容或上传图片');
      return;
    }

    const formData = new FormData();
    formData.append('content', postContent);
    if (postImage) {
      formData.append('image', postImage);
    }

    try {
      const res = await axios.post('/api/posts', formData);
      setUserPosts([res.data.post, ...userPosts]);
      setPostContent('');
      setPostImage(null);
      setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
    } catch (error) {
      alert('发布失败');
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`/api/posts/${postId}/like`);
      setUserPosts(prev => prev.map(post => 
        post._id === postId ? res.data.post : post
      ));
      if (res.data.isLiked) {
        setLikedPosts(prev => [...prev, postId]);
      } else {
        setLikedPosts(prev => prev.filter(id => id !== postId));
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('确定要删除这条动态吗？')) return;
    try {
      await axios.delete(`/api/posts/${postId}`);
      setUserPosts(prev => prev.filter(p => p._id !== postId));
      setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm('确定要删除这个项目吗？')) return;
    try {
      await axios.delete(`/api/projects/${projectId}`);
      setUserProjects(prev => prev.filter(p => p._id !== projectId));
      setStats(prev => ({ ...prev, projects: prev.projects - 1 }));
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      await axios.delete(`/api/articles/${articleId}`);
      setUserArticles(prev => prev.filter(p => p._id !== articleId));
      setStats(prev => ({ ...prev, articles: prev.articles - 1 }));
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleDeleteInspiration = async (inspirationId) => {
    if (!confirm('确定要删除这个灵感吗？')) return;
    try {
      await axios.delete(`/api/inspirations/${inspirationId}`);
      setUserInspirations(prev => prev.filter(p => p._id !== inspirationId));
      setStats(prev => ({ ...prev, inspirations: prev.inspirations - 1 }));
    } catch (error) {
      alert('删除失败');
    }
  };

  const fetchInviteData = async () => {
    try {
      const [codesRes, invitesRes] = await Promise.all([
        axios.get('/api/invite/my-codes'),
        axios.get('/api/invite/my-invites')
      ]);
      setInviteCodes(codesRes.data);
      setInvitedUsers(invitesRes.data);
    } catch (error) {
      console.error('Failed to fetch invite data');
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await axios.post('/api/invite/generate');
      setInviteCodes([res.data.code, ...inviteCodes]);
    } catch (error) {
      alert(error.response?.data?.message || '生成失败');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRevokeCode = async (codeId) => {
    if (!confirm('确定要作废这个邀请码吗？')) return;
    try {
      await axios.post(`/api/invite/${codeId}/revoke`);
      setInviteCodes(prev => prev.map(c =>
        c.id === codeId ? { ...c, status: 'revoked' } : c
      ));
    } catch (error) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '可借用':
        return 'bg-green-100 text-green-800';
      case '已借出':
        return 'bg-red-100 text-red-800';
      case '维修中':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-[#F0E8DD] text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-900"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">用户不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in ">
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-warm-900 to-[#8B7355]">
        {profileUser.background && (
          <img
            src={profileUser.background}
            alt="背景"
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 text-white text-sm rounded-btn cursor-pointer hover:bg-black/70 transition">
            更换背景
            <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundChange} />
          </label>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <img
                  src={profileUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.nickname}`}
                  alt={profileUser.nickname}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200"
                />
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-warm-900 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-warm-700 shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-800">{profileUser.nickname}</h1>
                <p className="text-gray-500">@{profileUser.username}</p>
                {profileUser.bio && (
                  <p className="text-gray-600 mt-2 max-w-lg">{profileUser.bio}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {profileUser.location && (
                    <span className="inline-flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profileUser.location}
                    </span>
                  )}
                  {profileUser.website && (
                    <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-warm-900 hover:underline">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      个人网站
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {isOwnProfile ? (
                  <>
                    {currentUser?.role === 'admin' && (
                      <>
                        <Link
                          to="/admin/settings"
                          className="rounded-btn px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 transition"
                        >
                          系统设置
                        </Link>
                        <Link
                          to="/admin/users"
                          className="rounded-btn px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 transition"
                        >
                          用户管理
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-btn px-6 py-2 bg-warm-900 text-white hover:bg-warm-700 transition shadow-sketch"
                    >
                      编辑资料
                    </button>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="rounded-btn px-6 py-2 bg-[#F5F0E8] text-[#4A3728] border border-[#C8BAAA] hover:bg-[#E8DCD0] transition"
                    >
                      修改密码
                    </button>
                    <Link
                      to="/profile/edit"
                      className="rounded-btn px-6 py-2 bg-[#F5F0E8] text-[#4A3728] border border-[#C8BAAA] hover:bg-[#E8DCD0] transition"
                    >
                      简历编辑
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`rounded-btn px-6 py-2 transition ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-warm-900 text-white hover:bg-warm-700 shadow-sketch'
                    }`}
                  >
                    {isFollowing ? '已关注' : '关注'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center sm:justify-start gap-8 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.posts}</p>
                <p className="text-sm text-gray-500">动态</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.projects}</p>
                <p className="text-sm text-gray-500">项目</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.articles}</p>
                <p className="text-sm text-gray-500">文章</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.inspirations}</p>
                <p className="text-sm text-gray-500">灵感</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.items}</p>
                <p className="text-sm text-gray-500">物品</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.resources}</p>
                <p className="text-sm text-gray-500">资源</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.followers}</p>
                <p className="text-sm text-gray-500">粉丝</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.following}</p>
                <p className="text-sm text-gray-500">关注</p>
              </div>
            </div>

            {profileUser.skills && profileUser.skills.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">技能标签</h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-[#F5F0E8] text-warm-900 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(profileUser.socialLinks?.github || profileUser.socialLinks?.weibo || profileUser.socialLinks?.bilibili || profileUser.socialLinks?.zhihu) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">社交链接</h3>
                <div className="flex flex-wrap gap-3">
                  {profileUser.socialLinks?.github && (
                    <a href={profileUser.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                    </a>
                  )}
                  {profileUser.socialLinks?.weibo && (
                    <a href={profileUser.socialLinks.weibo} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zm8.683-13.063c-.636-.197-1.073-.332-1.073-.332.104-.416.209-.832.313-1.248.313-1.248-.209-2.08-1.457-2.08-.624 0-1.248.208-1.872.624l-.624.416c-.416-.416-1.04-.624-1.872-.624-1.456 0-2.912 1.04-3.328 2.496-.416 1.456.208 2.912 1.664 3.328 0 0 .416.104.832.208-.104.416-.208.832-.312 1.248-.312 1.248.208 2.08 1.456 2.08.624 0 1.248-.208 1.872-.624l.624-.416c.416.416 1.04.624 1.872.624 1.456 0 2.912-1.04 3.328-2.496.416-1.456-.208-2.912-1.664-3.328l.625-.416c.416-.416 1.04-.624 1.664-.624 1.248 0 1.77.832 1.456 2.08-.104.416-.208.832-.312 1.248 0 0 .437.135 1.073.332.636.197 1.073.332 1.073.332.104-.416.209-.832.313-1.248.313-1.248-.209-2.08-1.457-2.08-.624 0-1.248.208-1.872.624l-.624.416c-.416-.416-1.04-.624-1.872-.624-1.456 0-2.912 1.04-3.328 2.496-.416 1.456.208 2.912 1.664 3.328 0 0 .416.104.832.208-.104.416-.208.832-.312 1.248-.312 1.248.208 2.08 1.456 2.08.624 0 1.248-.208 1.872-.624l.624-.416c.416.416 1.04.624 1.872.624 1.456 0 2.912-1.04 3.328-2.496.416-1.456-.208-2.912-1.664-3.328z"/></svg>
                      微博
                    </a>
                  )}
                  {profileUser.socialLinks?.bilibili && (
                    <a href={profileUser.socialLinks.bilibili} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>
                      B站
                    </a>
                  )}
                  {profileUser.socialLinks?.zhihu && (
                    <a href={profileUser.socialLinks.zhihu} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.145.477 1.248-.006.387-.004.678-.004.678H7.58c-.243.927-.545 1.8-.9 2.611l.003-.003h3.885l.003 3.34-2.088.003.003 1.965 2.085-.003v.003l-.003 3.34h2.088l.003-3.34h2.085l.003-1.965-2.088.003-.003-3.34h3.885l.003.003c-.355-.811-.657-1.684-.9-2.611h-4.485c-.006 0-.004-.291-.004-.678.032-.103-.068-1.254.477-1.248h4.587c-.18-.676-.409-1.38-.68-2.11z"/></svg>
                      知乎
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {isOwnProfile && (
            <div className="border-t bg-[#F5F0E8] p-4">
              <div className="flex gap-4">
                <img
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.nickname}`}
                  alt=""
                  className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="分享你的想法..."
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900 resize-none"
                    rows={3}
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <label className="flex items-center text-sm text-gray-500 cursor-pointer hover:text-warm-900 transition">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      上传图片
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setPostImage(e.target.files[0])} />
                    </label>
                    <button
                      onClick={handlePostSubmit}
                      disabled={!postContent.trim() && !postImage}
                      className="rounded-btn px-6 py-2 bg-warm-900 text-white hover:bg-warm-700 transition shadow-sketch disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      发布动态
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t">
            <div className="flex">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'posts'
                    ? 'text-warm-900 border-b-2 border-warm-900 bg-[#F5F0E8]/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#F5F0E8]'
                }`}
              >
                动态 ({stats.posts})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'projects'
                    ? 'text-warm-900 border-b-2 border-warm-900 bg-[#F5F0E8]/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#F5F0E8]'
                }`}
              >
                项目 ({stats.projects})
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'articles'
                    ? 'text-warm-900 border-b-2 border-warm-900 bg-[#F5F0E8]/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#F5F0E8]'
                }`}
              >
                文章 ({stats.articles})
              </button>
              <button
                onClick={() => setActiveTab('inspirations')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'inspirations'
                    ? 'text-warm-900 border-b-2 border-warm-900 bg-[#F5F0E8]/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#F5F0E8]'
                }`}
              >
                灵感 ({stats.inspirations})
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'items'
                    ? 'text-warm-900 border-b-2 border-warm-900 bg-[#F5F0E8]/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#F5F0E8]'
                }`}
              >
                物品 ({stats.items})
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'resources'
                    ? 'text-secondary-600 border-b-2 border-secondary-600 bg-secondary-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#F5F0E8]'
                }`}
              >
                资源 ({stats.resources})
              </button>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('invite')}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === 'invite'
                      ? 'text-warm-900 border-b-2 border-warm-900 bg-[#F5F0E8]/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-[#F5F0E8]'
                  }`}
                >
                  邀请 ({inviteCodes.length})
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'posts' ? (
              userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-[#F5F0E8] rounded-xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={post.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author?.nickname}`}
                          alt={post.author?.nickname}
                          className="w-10 h-10 rounded-full bg-gray-200"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{post.author?.nickname}</span>
                              <span className="text-xs text-[#B8A899]">· {new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            {isOwnProfile && (
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="text-[#B8A899] hover:text-red-500 transition"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-700 leading-relaxed mt-2">{post.content}</p>
                          {post.image && (
                            <img src={post.image} alt="" className="mt-4 max-w-full rounded-lg" />
                          )}
                          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                            <button className="hover:text-warm-900 transition">
                              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {post.comments?.length || 0}
                            </button>
                            <button
                              onClick={() => handleLike(post._id)}
                              className={`transition ${likedPosts.includes(post._id) ? 'text-red-600' : 'hover:text-red-600'}`}
                            >
                              <svg className="w-5 h-5 inline mr-1" fill={likedPosts.includes(post._id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {post.likes?.length || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">暂无动态</p>
                  {isOwnProfile && (
                    <p className="text-[#B8A899] text-sm mt-1">分享你的第一个动态吧！</p>
                  )}
                </div>
              )
            ) : activeTab === 'projects' ? (
              userProjects.length > 0 ? (
                <div className="space-y-3">
                  {userProjects.map((project) => (
                    <div key={project._id} className="bg-[#F5F0E8] rounded-xl p-4 flex items-center gap-4">
                      {project.cover && (
                        <img src={project.cover} alt={project.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/projects/${project._id}`} className="font-medium text-gray-800 hover:text-[#4A3728] transition truncate block">
                          {project.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">{project.category} · {new Date(project.createdAt).toLocaleDateString()}</p>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Link to={`/projects/edit/${project._id}`} className="p-2 text-[#8B7355] hover:text-[#4A3728] hover:bg-[#E8DCD0] rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button onClick={() => handleDeleteProject(project._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无项目作品</p>
                </div>
              )
            ) : activeTab === 'articles' ? (
              userArticles.length > 0 ? (
                <div className="space-y-3">
                  {userArticles.map((article) => (
                    <div key={article._id} className="bg-[#F5F0E8] rounded-xl p-4 flex items-center gap-4">
                      {article.cover && (
                        <img src={article.cover} alt={article.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <Link to={`/articles/${article._id}`} className="font-medium text-gray-800 hover:text-[#4A3728] transition truncate block">
                          {article.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">{article.category} · {new Date(article.createdAt).toLocaleDateString()}</p>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Link to={`/articles/edit/${article._id}`} className="p-2 text-[#8B7355] hover:text-[#4A3728] hover:bg-[#E8DCD0] rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button onClick={() => handleDeleteArticle(article._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无文章故事</p>
                </div>
              )
            ) : activeTab === 'inspirations' ? (
              userInspirations.length > 0 ? (
                <div className="space-y-3">
                  {userInspirations.map((insp) => (
                    <div key={insp._id} className="bg-[#F5F0E8] rounded-xl p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <Link to={`/inspirations/${insp._id}`} className="font-medium text-gray-800 hover:text-[#4A3728] transition truncate block">
                          {insp.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {insp.category} · {insp.status} · {new Date(insp.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Link to={`/inspirations/edit/${insp._id}`} className="p-2 text-[#8B7355] hover:text-[#4A3728] hover:bg-[#E8DCD0] rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button onClick={() => handleDeleteInspiration(insp._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">暂无灵感碎片</p>
                </div>
              )
            ) : activeTab === 'items' ? (
              userItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userItems.map((item) => (
                    <Link key={item._id} to={`/items/${item._id}`} className="group bg-[#F5F0E8] rounded-xl overflow-hidden hover:shadow-lg transition">
                      <div className="relative">
                        <img
                          src={item.images[0] || 'https://via.placeholder.com/300x200'}
                          alt={item.name}
                          className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
                        />
                        <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-gray-500">暂无发布的物品</p>
                </div>
              )
            ) : activeTab === 'invite' ? (
              <div>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setInviteSubTab('codes')}
                    className={`px-4 py-2 rounded-btn font-medium transition ${
                      inviteSubTab === 'codes'
                        ? 'bg-warm-900 text-white'
                        : 'bg-[#F5F0E8] text-[#4A3728] hover:bg-[#E8DCD0]'
                    }`}
                  >
                    我的邀请码
                  </button>
                  <button
                    onClick={() => setInviteSubTab('invites')}
                    className={`px-4 py-2 rounded-btn font-medium transition ${
                      inviteSubTab === 'invites'
                        ? 'bg-warm-900 text-white'
                        : 'bg-[#F5F0E8] text-[#4A3728] hover:bg-[#E8DCD0]'
                    }`}
                  >
                    邀请关系
                  </button>
                </div>

                {inviteSubTab === 'codes' ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-[#8B7355]">
                        已生成 {inviteCodes.length} 个邀请码，可用 {inviteCodes.filter(c => c.status === 'active').length} 个，
                        已使用 {inviteCodes.filter(c => c.status === 'used').length} 个
                        {(() => {
                          const used = inviteCodes.filter(c => c.status === 'used').length;
                          const total = inviteCodes.length;
                          const max = 5 + used;
                          return total >= max
                            ? '（已达上限，需邀请码被使用后可继续生成）'
                            : `（还可生成 ${max - total} 个）`;
                        })()}
                      </p>
                      <button
                        onClick={handleGenerateCode}
                        disabled={(() => {
                          if (generatingCode) return true;
                          const used = inviteCodes.filter(c => c.status === 'used').length;
                          return inviteCodes.length >= 5 + used;
                        })()}
                        className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingCode ? '生成中...' : '生成邀请码'}
                      </button>
                    </div>

                    {inviteCodes.length > 0 ? (
                      <div className="space-y-3">
                        {inviteCodes.map((code) => (
                          <div
                            key={code.id}
                            className="bg-[#F5F0E8] rounded-xl p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <span className="font-mono text-lg font-bold text-[#4A3728] tracking-widest">
                                {code.code}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  code.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : code.status === 'used'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {code.status === 'active' ? '可用' : code.status === 'used' ? '已使用' : '已作废'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-[#B8A899]">
                                {new Date(code.createdAt).toLocaleDateString()}
                              </span>
                              {code.status === 'used' && code.usedBy && (
                                <span className="text-xs text-[#8B7355]">
                                  使用者: {code.usedBy.nickname}
                                </span>
                              )}
                              {code.status === 'active' && (
                                <button
                                  onClick={() => handleRevokeCode(code.id)}
                                  className="text-sm text-red-500 hover:text-red-700 transition"
                                >
                                  作废
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <p className="text-gray-500">暂无邀请码</p>
                        <p className="text-[#B8A899] text-sm mt-1">点击上方按钮生成邀请码</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {invitedUsers.length > 0 ? (
                      <div className="space-y-3">
                        {invitedUsers.map((user) => (
                          <div
                            key={user.id}
                            className="bg-[#F5F0E8] rounded-xl p-4 flex items-center gap-4"
                          >
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                              alt={user.nickname}
                              className="w-10 h-10 rounded-full bg-gray-200"
                            />
                            <div className="flex-1">
                              <Link
                                to={`/profile/${user.id}`}
                                className="font-medium text-gray-800 hover:text-[#4A3728] transition"
                              >
                                {user.nickname}
                              </Link>
                              <p className="text-xs text-[#B8A899]">
                                @{user.username} · 注册于 {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500">暂无通过你邀请注册的用户</p>
                        <p className="text-[#B8A899] text-sm mt-1">分享邀请码给朋友即可看到邀请关系</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : userResources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userResources.map((resource) => (
                  <Link key={resource._id} to={`/resources/${resource._id}`} className="group bg-[#F5F0E8] rounded-xl p-4 hover:shadow-lg transition">
                    <h3 className="font-medium text-gray-800 truncate group-hover:text-warm-900">{resource.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{resource.type}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {resource.tags?.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 bg-secondary-50 text-secondary-600 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">暂无发布的资源</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">编辑个人资料</h3>
              <button onClick={() => setIsEditing(false)} className="text-[#B8A899] hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称 *</label>
                <input
                  type="text"
                  name="nickname"
                  value={editForm.nickname}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900 resize-none"
                  placeholder="介绍一下自己吧..."
                />
                <p className="text-xs text-[#B8A899] mt-1">{editForm.bio.length}/500</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所在地区</label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="如：北京"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">个人网站</label>
                  <input
                    type="url"
                    name="website"
                    value={editForm.website}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">技能标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-[#F5F0E8] text-warm-900 rounded-full text-sm">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="ml-2 text-[#C8BAAA] hover:text-warm-900">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="添加技能标签"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="rounded-btn px-4 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200"
                  >
                    添加
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">社交链接</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="social.github"
                    value={editForm.socialLinks.github}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="GitHub 链接"
                  />
                  <input
                    type="text"
                    name="social.weibo"
                    value={editForm.socialLinks.weibo}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="微博链接"
                  />
                  <input
                    type="text"
                    name="social.bilibili"
                    value={editForm.socialLinks.bilibili}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="B站链接"
                  />
                  <input
                    type="text"
                    name="social.zhihu"
                    value={editForm.socialLinks.zhihu}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="知乎链接"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">联系方式</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    name="contactWechat"
                    value={editForm.contactWechat}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="微信号"
                  />
                  <input
                    type="tel"
                    name="contactPhone"
                    value={editForm.contactPhone}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="电话"
                  />
                  <input
                    type="email"
                    name="contactEmail"
                    value={editForm.contactEmail}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                    placeholder="邮箱"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-btn px-6 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="rounded-btn px-6 py-2 bg-warm-900 text-white hover:bg-warm-700 shadow-sketch"
              >
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">修改密码</h3>
              <button onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="text-[#B8A899] hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {passwordSuccess && (
              <div className="mb-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                  placeholder="输入当前密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                  placeholder="输入新密码（至少6位）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border-2 border-gray-200 sketch-border-sm focus:outline-none focus:ring-2 focus:ring-warm-900"
                  placeholder="再次输入新密码"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(''); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                className="rounded-btn px-6 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                className="rounded-btn px-6 py-2 bg-warm-900 text-white hover:bg-warm-700 shadow-sketch"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {cropImage && (
        <AvatarCropper
          image={cropImage}
          onCancel={handleAvatarCancel}
          onCrop={handleAvatarCrop}
        />
      )}
    </div>
  );
}

export default Profile;
