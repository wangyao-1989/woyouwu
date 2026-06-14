import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    tag: searchParams.get('tag') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });

  const allTags = ['效率', '设计', '学习', '工作', '生活', '娱乐', '技术', '其他'];

  useEffect(() => {
    fetchResources();
  }, [filters]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.search) params.append('search', filters.search);
      params.append('sort', filters.sort);

      const res = await axios.get(`/api/resources?${params.toString()}`);
      setResources(res.data);
    } catch (error) {
      console.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleLike = async (resourceId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    try {
      const res = await axios.post(`/api/resources/${resourceId}/like`);
      setResources(resources.map(r => 
        r._id === resourceId 
          ? { ...r, likeCount: res.data.likeCount, isLiked: res.data.isLiked }
          : r
      ));
    } catch (error) {
      console.error('Failed to like');
    }
  };

  const handleFavorite = async (resourceId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    try {
      const res = await axios.post(`/api/resources/${resourceId}/favorite`);
      setResources(resources.map(r => 
        r._id === resourceId 
          ? { ...r, favoriteCount: res.data.favoriteCount, isFavorited: res.data.isFavorited }
          : r
      ));
    } catch (error) {
      console.error('Failed to favorite');
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

  const getTypeColor = (type) => {
    const colors = {
      '网址': 'bg-blue-100 text-blue-800',
      'APP': 'bg-green-100 text-green-800',
      '文章': 'bg-purple-100 text-purple-800',
      '其他': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">资源分享</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                <option value="">全部类型</option>
                <option value="网址">网址</option>
                <option value="APP">APP</option>
                <option value="文章">文章</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
              <select
                value={filters.tag}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                <option value="">全部标签</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                <option value="-createdAt">最新发布</option>
                <option value="createdAt">最早发布</option>
                <option value="-likeCount">最多点赞</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="搜索资源标题..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleFilterChange('tag', filters.tag === tag ? '' : tag)}
                className={`px-3 py-1 text-sm rounded-full transition ${
                  filters.tag === tag
                    ? 'bg-secondary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">暂无资源</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <Link key={resource._id} to={`/resources/${resource._id}`} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition group">
              <div className="flex items-start space-x-4 mb-4">
                <span className="text-4xl">{getTypeIcon(resource.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-secondary-600 transition">
                    {resource.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {resource.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags?.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-secondary-50 text-secondary-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center">
                  <img
                    src={resource.uploader?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${resource.uploaderName}`}
                    alt={resource.uploaderName}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-600">{resource.uploaderName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => handleLike(resource._id, e)}
                    className={`flex items-center space-x-1 ${resource.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <svg className="w-5 h-5" fill={resource.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm">{resource.likeCount}</span>
                  </button>
                  <button
                    onClick={(e) => handleFavorite(resource._id, e)}
                    className={`flex items-center space-x-1 ${resource.isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  >
                    <svg className="w-5 h-5" fill={resource.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-sm">{resource.favoriteCount}</span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Resources;