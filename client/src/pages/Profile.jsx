import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [userResources, setUserResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    contactWechat: '',
    contactPhone: '',
    contactEmail: ''
  });

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
        contactWechat: userRes.data.contactWechat || '',
        contactPhone: userRes.data.contactPhone || '',
        contactEmail: userRes.data.contactEmail || ''
      });

      const [itemsRes, resourcesRes] = await Promise.all([
        axios.get(`/api/items?owner=${profileId}`),
        axios.get(`/api/users/${profileId}/resources`)
      ]);
      setUserItems(itemsRes.data);
      setUserResources(resourcesRes.data);
    } catch (error) {
      console.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await axios.put('/api/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(res.data.user);
      setProfileUser(res.data.user);
    } catch (error) {
      alert('头像上传失败');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await axios.put('/api/users/profile', editForm);
      updateUser(res.data.user);
      setProfileUser(res.data.user);
      setIsEditing(false);
    } catch (error) {
      alert('保存失败');
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <img
              src={profileUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.nickname}`}
              alt={profileUser.nickname}
              className="w-24 h-24 rounded-full bg-gray-200"
            />
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                  <input
                    type="text"
                    name="nickname"
                    value={editForm.nickname}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">微信</label>
                  <input
                    type="text"
                    name="contactWechat"
                    value={editForm.contactWechat}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="选填"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={editForm.contactPhone}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="选填"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={editForm.contactEmail}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="选填"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{profileUser.nickname}</h1>
                <p className="text-gray-500 mb-3">@{profileUser.username}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  {(profileUser.contactWechat || profileUser.contactPhone || profileUser.contactEmail) && (
                    <>
                      {profileUser.contactWechat && <span className="text-gray-600">微信：{profileUser.contactWechat}</span>}
                      {profileUser.contactPhone && <span className="text-gray-600">电话：{profileUser.contactPhone}</span>}
                      {profileUser.contactEmail && <span className="text-gray-600">邮箱：{profileUser.contactEmail}</span>}
                    </>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    编辑资料
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex space-x-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">{userItems.length}</p>
              <p className="text-sm text-gray-500">物品</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{userResources.length}</p>
              <p className="text-sm text-gray-500">资源</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'items'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              发布的物品
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'resources'
                  ? 'text-secondary-600 border-b-2 border-secondary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              发布的资源
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'items' ? (
            userItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userItems.map((item) => (
                  <Link key={item._id} to={`/items/${item._id}`} className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition">
                    <img
                      src={item.images[0] ? `http://localhost:5000${item.images[0]}` : 'https://via.placeholder.com/200'}
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">暂无发布的物品</p>
            )
          ) : userResources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userResources.map((resource) => (
                <Link key={resource._id} to={`/resources/${resource._id}`} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                  <h3 className="font-medium text-gray-800 mb-1 truncate">{resource.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{resource.type}</p>
                  <div className="flex flex-wrap gap-1">
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
            <p className="text-center text-gray-500 py-8">暂无发布的资源</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;