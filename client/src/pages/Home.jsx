import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import NewsCorner from '../components/NewsCorner';

// 示例内容数据
const mockContent = [
  {
    id: 1,
    type: 'creation',
    title: '我的个人网站 2024 全新改版',
    description: '使用 Next.js + Tailwind 构建，干净现代的设计展示我的作品。',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
    author: {
      nickname: 'helen.dev',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=helen'
    },
    likes: 45,
    comments: 8
  },
  {
    id: 2,
    type: 'idea',
    title: '如果我们能把回忆变成可分享的文件呢？',
    description: '洗澡时冒出的想法，不只是照片，还有感觉、想法、声音和瞬间。',
    image: null,
    author: {
      nickname: 'raymond',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=raymond'
    },
    likes: 78,
    comments: 12
  },
  {
    id: 3,
    type: 'stuff',
    title: '富士拍立得 Mini 8 交换',
    description: '成色不错，想交换书或者文具！',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop',
    author: {
      nickname: 'sarah.k',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=sarah'
    },
    likes: 12,
    comments: 3
  },
  {
    id: 4,
    type: 'creation',
    title: '研究报告：城市绿地空间分析',
    description: '基于五年调查数据的城市绿地空间数据可视化分析。',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
    author: {
      nickname: 'researcher',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=researcher'
    },
    likes: 36,
    comments: 5
  },
  {
    id: 5,
    type: 'idea',
    title: '一个没有压力的阅读社区',
    description: '一个帮助人们收集和分享读书笔记的网站，不需要"完成"任何东西。',
    image: null,
    author: {
      nickname: 'celine',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=celine'
    },
    likes: 21,
    comments: 4
  }
];

function Home() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
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
    if (videos.length <= 1) return;
    videoIntervalRef.current = setInterval(() => {
      setCurrentVideoIndex(prev => (prev + 1) % videos.length);
    }, 8000);
    return () => clearInterval(videoIntervalRef.current);
  }, [videos]);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'creation':
        return { bg: 'bg-teal-50', text: 'text-teal-700', label: '创作' };
      case 'idea':
        return { bg: 'bg-amber-50', text: 'text-amber-700', label: '灵感' };
      case 'stuff':
        return { bg: 'bg-clay-50', text: 'text-clay-700', label: '好物' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', label: '项目' };
    }
  };

  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'all': return '全部';
      case 'creation': return '创作';
      case 'idea': return '灵感';
      case 'stuff': return '好物';
      default: return filter;
    }
  };

  const filteredContent = activeFilter === 'all' 
    ? mockContent 
    : mockContent.filter(item => item.type === activeFilter);

  return (
    <div className="min-h-screen bg-paper fade-in">
      {/* 主视觉区域 */}
      <section className="relative py-16 px-4 gradient-hero">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 wowoo-heading leading-tight">
                打开一盒<br />
                <span className="text-gray-700">灵感惊喜。</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto lg:mx-0">
                来自真实用户的随机发现，每次访问都有新惊喜。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/items/create"
                  className="px-8 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-all shadow-wowoo hover:shadow-wowoo-lg scale-hover"
                >
                  我要发布 ✨
                </Link>
                <button 
                  onClick={() => setActiveFilter('all')}
                  className="px-8 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all scale-hover"
                >
                  刷新内容 ↻
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end">
              {videos.length > 0 ? (
                <div className="w-full max-w-xs">
                  <div className="bg-white rounded-2xl card-ring overflow-hidden">
                    <div className="aspect-square bg-black relative">
                      {videos.map((v, i) => (
                        <video
                          key={v._id}
                          src={v.video}
                          muted
                          loop
                          playsInline
                          autoPlay
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentVideoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        />
                      ))}
                    </div>
                    <div className="p-4">
                      <Link
                        to={`/projects/${videos[currentVideoIndex]?._id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-500 transition line-clamp-2"
                      >
                        {videos[currentVideoIndex]?.title || '项目作品'}
                      </Link>
                      {videos[currentVideoIndex]?.owner && (
                        <p className="text-xs text-gray-500 mt-1">
                          {videos[currentVideoIndex].owner.nickname || videos[currentVideoIndex].owner.username}
                        </p>
                      )}
                      {(() => {
                        const v = videos[currentVideoIndex];
                        if (!v || !v.video) return null;
                        if (v.videoSource === '转载') {
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                🔗 转载
                              </span>
                              {v.videoSourceLink && (
                                <a
                                  href={v.videoSourceLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-[10px] text-gray-400 hover:text-amber-600 mt-1 truncate"
                                >
                                  来源：{v.videoSourceLink}
                                </a>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              ✨ 原创
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    {videos.length > 1 && (
                      <div className="flex justify-center gap-1.5 pb-3">
                        {videos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setCurrentVideoIndex(i);
                              if (videoIntervalRef.current) {
                                clearInterval(videoIntervalRef.current);
                                videoIntervalRef.current = setInterval(() => {
                                  setCurrentVideoIndex(prev => (prev + 1) % videos.length);
                                }, 8000);
                              }
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${i === currentVideoIndex ? 'bg-primary-500 w-5' : 'bg-gray-300 hover:bg-gray-400'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute -top-6 -left-6 w-8 h-8 bg-yellow-300 rounded-full opacity-60"></div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink-200 rounded-full opacity-60"></div>
                  <div className="bg-gradient-to-br from-amber-50 via-paper to-teal-50 p-8 rounded-3xl border border-gray-200 shadow-wowoo">
                    <svg aria-hidden="true" viewBox="0 0 300 250" className="w-full h-auto">
                      <rect x="50" y="120" width="200" height="80" fill="#f6b26b" rx="8" />
                      <rect x="50" y="100" width="200" height="30" fill="#e89f4a" rx="8" />
                      <rect x="130" y="85" width="40" height="25" fill="#d48a3c" rx="4" />
                      <circle cx="100" cy="70" r="20" fill="#dae8fc" />
                      <circle cx="200" cy="60" r="15" fill="#d5e8d4" />
                      <rect x="220" y="30" width="35" height="28" fill="#e1d5e7" rx="4" />
                      <text x="85" y="68" fontSize="16">📷</text>
                      <text x="188" y="58" fontSize="12">🌱</text>
                      <text x="225" y="28" fontSize="14">📝</text>
                      <text x="135" y="55" fontSize="14">✨</text>
                      <text x="170" y="45" fontSize="12">✨</text>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 资讯好望角 */}
      <NewsCorner />

      {/* 筛选和视图控制 */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              {['all', 'creation', 'idea', 'stuff'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeFilter === filter
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {getFilterLabel(filter)}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="网格视图"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="列表视图"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                return (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="bg-white rounded-2xl card-ring hover:card-ring-hover overflow-hidden transition-all duration-300 scale-hover group"
                  >
                    {item.image ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
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
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={item.author.avatar}
                            alt={item.author.nickname}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full bg-gray-200"
                          />
                          <span className="text-sm text-gray-500">{item.author.nickname}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {item.likes}
                          </span>
                          <span className="flex items-center">
                            <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {item.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                return (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="bg-white rounded-2xl card-ring hover:card-ring-hover p-5 transition-all duration-300 scale-hover group"
                  >
                    <div className="flex gap-5">
                      {item.image ? (
                        <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
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
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={item.author.avatar}
                              alt={item.author.nickname}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full bg-gray-200"
                            />
                            <span className="text-sm text-gray-500">{item.author.nickname}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {item.likes}
                            </span>
                            <span className="flex items-center">
                              <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {item.comments}
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

      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">&copy; 2026 我有物. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition flex items-center">
                <svg aria-hidden="true" className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                鲁ICP备2026026388号
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
