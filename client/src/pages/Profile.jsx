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
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ items: 0, resources: 0, followers: 0, following: 0, posts: 0 });
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

      const [itemsRes, resourcesRes, statsRes, postsRes] = await Promise.all([
        axios.get(`/api/users/${profileId}/items`),
        axios.get(`/api/users/${profileId}/resources`),
        axios.get(`/api/users/${profileId}/stats`),
        axios.get(`/api/posts/user/${profileId}`)
      ]);
      setUserItems(itemsRes.data);
      setUserResources(resourcesRes.data);
      setUserPosts(postsRes.data.posts);
      setStats({ ...statsRes.data, posts: postsRes.data.total });

      if (currentUser && !isOwnProfile) {
        const currentUserData = await axios.get(`/api/users/${currentUser.id}`);
        setIsFollowing(currentUserData.data.following?.includes(profileId));
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
      const res = await axios.put('/api/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
      const res = await axios.post('/api/users/background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
      const res = await axios.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
    if (!confirm('确定删除这条动态吗？')) return;
    try {
      await axios.delete(`/api/posts/${postId}`);
      setUserPosts(prev => prev.filter(post => post._id !== postId));
      setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
    } catch (error) {
      alert('删除失败');
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
    <div className="min-h-screen bg-gray-50 fade-in">
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-primary-500 to-secondary-500">
        {profileUser.background && (
          <img
            src={profileUser.background}
            alt="背景"
            className="w-full h-full object-cover"
          />
        )}
        {isOwnProfile && (
          <label className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 text-white text-sm rounded-lg cursor-pointer hover:bg-black/70 transition">
            更换背景
            <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundChange} />
          </label>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <img
                  src={profileUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.nickname}`}
                  alt={profileUser.nickname}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200"
                />
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 shadow-lg">
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
                    <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary-600 hover:underline">
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
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        >
                          系统设置
                        </Link>
                        <Link
                          to="/admin/users"
                          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        >
                          用户管理
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      编辑资料
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg transition ${
                      isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
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
                    <span key={index} className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm">
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
            <div className="border-t bg-gray-50 p-4">
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
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <label className="flex items-center text-sm text-gray-500 cursor-pointer hover:text-primary-600 transition">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      上传图片
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setPostImage(e.target.files[0])} />
                    </label>
                    <button
                      onClick={handlePostSubmit}
                      disabled={!postContent.trim() && !postImage}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                动态 ({stats.posts})
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'items'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                物品 ({stats.items})
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === 'resources'
                    ? 'text-secondary-600 border-b-2 border-secondary-600 bg-secondary-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                资源 ({stats.resources})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'posts' ? (
              userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-gray-50 rounded-xl p-4"
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
                              <span className="text-xs text-gray-400">· {new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            {isOwnProfile && (
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="text-gray-400 hover:text-red-500 transition"
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
                            <button className="hover:text-primary-600 transition">
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
                    <p className="text-gray-400 text-sm mt-1">分享你的第一个动态吧！</p>
                  )}
                </div>
              )
            ) : activeTab === 'items' ? (
              userItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userItems.map((item) => (
                    <Link key={item._id} to={`/items/${item._id}`} className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition">
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
            ) : userResources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userResources.map((resource) => (
                  <Link key={resource._id} to={`/resources/${resource._id}`} className="group bg-gray-50 rounded-xl p-4 hover:shadow-lg transition">
                    <h3 className="font-medium text-gray-800 truncate group-hover:text-primary-600">{resource.title}</h3>
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
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">编辑个人资料</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="介绍一下自己吧..."
                />
                <p className="text-xs text-gray-400 mt-1">{editForm.bio.length}/500</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所在地区</label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">技能标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm">
                      {skill}
                      <button onClick={() => handleRemoveSkill(skill)} className="ml-2 text-primary-400 hover:text-primary-600">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="添加技能标签"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="GitHub 链接"
                  />
                  <input
                    type="text"
                    name="social.weibo"
                    value={editForm.socialLinks.weibo}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="微博链接"
                  />
                  <input
                    type="text"
                    name="social.bilibili"
                    value={editForm.socialLinks.bilibili}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="B站链接"
                  />
                  <input
                    type="text"
                    name="social.zhihu"
                    value={editForm.socialLinks.zhihu}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="微信号"
                  />
                  <input
                    type="tel"
                    name="contactPhone"
                    value={editForm.contactPhone}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="电话"
                  />
                  <input
                    type="email"
                    name="contactEmail"
                    value={editForm.contactEmail}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="邮箱"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                保存更改
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
