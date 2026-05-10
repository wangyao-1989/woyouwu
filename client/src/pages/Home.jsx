import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Home() {
  const [recentItems, setRecentItems] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, resourcesRes] = await Promise.all([
        axios.get('/api/items?sort=-createdAt'),
        axios.get('/api/resources?sort=-createdAt')
      ]);
      setRecentItems(itemsRes.data.slice(0, 6));
      setRecentResources(resourcesRes.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
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

  const getTypeIcon = (type) => {
    switch (type) {
      case '网址':
        return '🌐';
      case 'APP':
        return '📱';
      case '文章':
        return '📝';
      default:
        return '📦';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            我有物，我又悟
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            社区物品与资源分享平台，让闲置物品流动起来
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/items" className="px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition">
              浏览物品
            </Link>
            <Link to="/resources" className="px-8 py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 transition">
              发现资源
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">最新物品</h2>
          <Link to="/items" className="text-primary-600 hover:text-primary-700 font-medium">
            查看全部 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item) => (
            <Link key={item._id} to={`/items/${item._id}`} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <img
                  src={item.images[0] ? `http://localhost:5000${item.images[0]}` : 'https://via.placeholder.com/300x200'}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{item.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {item.location || '未指定'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">最新资源</h2>
            <Link to="/resources" className="text-secondary-600 hover:text-secondary-700 font-medium">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentResources.map((resource) => (
              <Link key={resource._id} to={`/resources/${resource._id}`} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition group">
                <div className="flex items-start space-x-4">
                  <span className="text-4xl">{getTypeIcon(resource.type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-secondary-600 transition">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{resource.type}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {resource.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {resource.tags?.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <img
                        src={resource.uploader?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${resource.uploaderName}`}
                        alt={resource.uploaderName}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <span>{resource.uploaderName}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">如何使用</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">发布物品</h3>
            <p className="text-gray-600">上传你愿意分享的物品信息，让社区知道你有什么可以借出</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🤝</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">借用物品</h3>
            <p className="text-gray-600">找到你需要的物品，向物主发起借用申请，线下交接使用</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">分享资源</h3>
            <p className="text-gray-600">发现好的工具、APP或文章，分享给社区大家一起进步</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;