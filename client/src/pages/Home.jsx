import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import NewsCorner from '../components/NewsCorner';

function Home() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const videoIntervalRef = useRef(null);

  useEffect(() => {
    axios.get('/api/projects', { params: { hasVideo: 'true', limit: 20 } })
      .then(res => {
        if (res.data.projects && res.data.projects.length > 0) {
          setVideos(res.data.projects.filter(p => p.video && p.video.trim()));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setItemsLoading(true);
    setItemsError(null);
    axios.get('/api/items')
      .then(res => {
        console.log('[Home] API response type:', typeof res.data, 'isArray:', Array.isArray(res.data), 'raw:', res.data);
        const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
        console.log('[Home] items count:', data.length);
        setItems(data);
        setItemsLoading(false);
      })
      .catch(err => {
        console.error('[Home] Failed to fetch items:', err);
        setItemsError('加载物品失败：' + (err.message || '网络错误'));
        setItemsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (videos.length === 0) return;
    videoIntervalRef.current = setInterval(() => {
      setCurrentVideoIndex(prev => (prev + 1) % videos.length);
    }, 5000);
    return () => {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    };
  }, [videos]);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'creation':
        return { bg: 'bg-teal-50', text: 'text-teal-700', label: '创作' };
      case 'idea':
        return { bg: 'bg-amber-50', text: 'text-amber-700', label: '灵感' };
      case 'stuff':
        return { bg: 'bg-orange-50', text: 'text-orange-700', label: '好物' };
      case 'article':
        return { bg: 'bg-blue-50', text: 'text-blue-700', label: '文章' };
      case 'project':
        return { bg: 'bg-purple-50', text: 'text-purple-700', label: '项目' };
      case 'achievement':
        return { bg: 'bg-green-50', text: 'text-green-700', label: '成就' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', label: '项目' };
    }
  };

  const getFilterLabel = (filter) => {
    const filters = { all: '全部', stuff: '好物', achievement: '成果', idea: '灵感', project: '项目', article: '文章' };
    return filters[filter] || filter;
  };

  const filteredContent = activeFilter === 'all' 
    ? items 
    : items.filter(item => item.type === activeFilter);

  return (
    <div className="min-h-screen bg-cream-50 fade-in">
      {/* 主视觉区域 */}
      <section className="relative bg-gradient-hero pt-8 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-kai font-bold text-warm-900 mb-6 leading-tight tracking-wide">
                把闲置变成灵感，<br/>
                交换你的好物品
              </h1>
              <p className="text-lg text-warm-500 mb-8 leading-relaxed">
                一个充满创意与温暖的社区。发布闲置好物、展示个人作品、分享灵感碎片，发现生活中的无限可能。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/items/create"
                  className="px-8 py-3.5 bg-warm-900 text-white text-lg font-semibold rounded-btn hover:bg-warm-700 transition shadow-float hover:shadow-wowoo"
                >
                  发布好物 ✨
                </Link>
                <Link
                  to="/items"
                  className="px-8 py-3.5 bg-white text-warm-900 text-lg font-semibold rounded-btn border-2 border-warm-200 hover:border-warm-700 transition"
                >
                  探索发现
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-8 mt-8 text-sm text-warm-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-warm-600 rounded-full"></span>
                  安全可信
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-warm-600 rounded-full"></span>
                  创意无限
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-warm-600 rounded-full"></span>
                  真实社区
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-square max-w-sm mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-warm-100 via-cream-100 to-warm-100 rounded-[40%] animate-float blur-sm"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  {videos.length > 0 && (
                    <video
                      src={videos[currentVideoIndex].video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-auto object-cover rounded-2xl shadow-float"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 视频卡片区域 */}
      {videos.length > 0 && (
        <section className="px-4 -mt-6 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-warm-900">📽️ 社区视频</h2>
              <div className="flex gap-1">
                {videos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentVideoIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition ${i === currentVideoIndex ? 'bg-warm-700' : 'bg-warm-200'}`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {videos.map((project, i) => (
                <Link
                  key={project._id || project.id}
                  to={`/projects/${project._id || project.id}`}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${i === currentVideoIndex ? 'border-warm-700 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  onClick={() => setCurrentVideoIndex(i)}
                >
                  <video
                    src={project.video}
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-white text-xs font-medium truncate block">{project.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 筛选器 */}
      <section className="px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['all', 'stuff', 'achievement', 'idea', 'project', 'article'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-btn text-sm font-medium transition ${activeFilter === filter ? 'bg-warm-900 text-white' : 'bg-white text-warm-500 hover:bg-warm-100'}`}
                >
                  {getFilterLabel(filter)}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-white rounded-btn p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-warm-100 text-warm-700' : 'text-warm-400'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-warm-100 text-warm-700' : 'text-warm-400'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 内容网格 */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {itemsLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-500">正在加载物品...</p>
            </div>
          ) : itemsError ? (
            <div className="text-center py-16">
              <p className="text-red-500 mb-2">{itemsError}</p>
              <button
                onClick={() => { setItemsLoading(true); setItemsError(null); axios.get('/api/items').then(r => { setItems(Array.isArray(r.data) ? r.data : (r.data.items || [])); setItemsLoading(false); }).catch(e => { setItemsError('重试失败'); setItemsLoading(false); }); }}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
              >
                点击重试
              </button>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-2">还没有人发布物品，来做第一个吧！</p>
              <Link to="/items/create" className="text-primary-500 hover:underline">立即发布 ✨</Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                return (
                  <Link
                    key={item._id}
                    to={`/items/${item._id}`}
                    className="bg-white rounded-2xl card-ring hover:card-ring-hover overflow-hidden transition-all duration-300 scale-hover group"
                  >
                    {item.images && item.images[0] ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          width={640}
                          height={360}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <div className="text-4xl">
                          {item.type === 'idea' ? '💭' : item.type === 'creation' ? '🎨' : '📦'}
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.label}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {item.remark}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={item.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.owner?.nickname}`}
                            alt={item.owner?.nickname}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full bg-gray-200"
                          />
                          <span className="text-sm text-gray-500">{item.owner?.nickname || item.owner?.username}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {item.likes?.length || 0}
                          </span>
                          <span className="flex items-center">
                            <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {item.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredContent.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                return (
                  <Link
                    key={item._id}
                    to={`/items/${item._id}`}
                    className="bg-white rounded-2xl card-ring hover:card-ring-hover p-5 transition-all duration-300 scale-hover group"
                  >
                    <div className="flex gap-5">
                      {item.images && item.images[0] ? (
                        <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            width={128}
                            height={96}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
                          <div className="text-3xl">
                            {item.type === 'idea' ? '💭' : item.type === 'creation' ? '🎨' : '📦'}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${typeStyle.bg} ${typeStyle.text}`}>
                          {typeStyle.label}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {item.remark}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={item.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.owner?.nickname}`}
                              alt={item.owner?.nickname}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full bg-gray-200"
                            />
                            <span className="text-sm text-gray-500">{item.owner?.nickname || item.owner?.username}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {item.likes?.length || 0}
                            </span>
                            <span className="flex items-center">
                              <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {item.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 资讯角落 */}
      <NewsCorner />
    </div>
  );
}

export default Home;
