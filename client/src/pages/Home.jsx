import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Mock data for content showcase
const mockContent = [
  {
    id: 1,
    type: 'creation',
    title: '我的作品集网站 2024 重新设计',
    description: '使用 Next.js + Tailwind 构建。一个干净现代的作品集来展示我的作品。',
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
    title: '如果我们能把记忆变成可分享的文件？',
    description: '洗澡时冒出来的想法。不只是照片，还有感受、想法、声音和时刻。',
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
    title: '富士迷你 8 相机交换',
    description: '状况良好。想用它换书或文具！',
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
    title: '研究总结：城市绿地',
    description: '基于五年调查数据的城市绿地数据分析。',
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
    title: '没有压力的阅读社区',
    description: '一个帮助人们收集和分享阅读笔记的网页，不需要"读完"任何东西。',
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    // 如果用户已登录，可以重定向到个人页面，但这里我们保持首页作为探索页面
  }, []);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'creation':
        return { bg: 'bg-creation-bg', text: 'text-creation-text', label: '创作' };
      case 'idea':
        return { bg: 'bg-idea-bg', text: 'text-idea-text', label: '想法' };
      case 'stuff':
        return { bg: 'bg-stuff-bg', text: 'text-stuff-text', label: '物品' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', label: '项目' };
    }
  };

  const filteredContent = activeFilter === 'all' 
    ? mockContent 
    : mockContent.filter(item => item.type === activeFilter);

  return (
    <div className="min-h-screen bg-white fade-in">
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 wowoo-heading leading-tight">
                打开一个灵感<br />
                <span className="text-gray-700">的盒子。</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto lg:mx-0">
                来自真实用户的随机发现。每次访问，都是一个新惊喜。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/items/create')}
                  className="px-8 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 transition-all shadow-wowoo hover:shadow-wowoo-lg scale-hover"
                >
                  手气不错 ✨
                </button>
                <button 
                  onClick={() => setActiveFilter('all')}
                  className="px-8 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all scale-hover"
                >
                  换一批 ↻
                </button>
              </div>
            </div>
            <div className="flex-1">
              {/* Decorative Illustration Area */}
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-8 h-8 bg-yellow-300 rounded-full opacity-60"></div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink-200 rounded-full opacity-60"></div>
                <div className="bg-gradient-to-br from-primary-50 via-white to-idea-bg p-8 rounded-3xl border border-gray-100 shadow-wowoo">
                  <svg viewBox="0 0 300 250" className="w-full h-auto">
                    {/* Box illustration */}
                    <rect x="50" y="120" width="200" height="80" fill="#f6b26b" rx="8" />
                    <rect x="50" y="100" width="200" height="30" fill="#e89f4a" rx="8" />
                    <rect x="130" y="85" width="40" height="25" fill="#d48a3c" rx="4" />
                    
                    {/* Flying items */}
                    <circle cx="100" cy="70" r="20" fill="#dae8fc" />
                    <circle cx="200" cy="60" r="15" fill="#d5e8d4" />
                    <rect x="220" y="30" width="35" height="28" fill="#e1d5e7" rx="4" />
                    
                    {/* Decorative sparkles */}
                    <text x="85" y="68" fontSize="16">📷</text>
                    <text x="188" y="58" fontSize="12">🌱</text>
                    <text x="225" y="28" fontSize="14">📝</text>
                    <text x="135" y="55" fontSize="14">✨</text>
                    <text x="170" y="45" fontSize="12">✨</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and View Controls */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'creation', label: '创作' },
                { value: 'idea', label: '想法' },
                { value: 'stuff', label: '物品' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeFilter === filter.value
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
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
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
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
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-wowoo hover:shadow-wowoo-lg scale-hover group"
                  >
                    {item.image ? (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
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
                            className="w-6 h-6 rounded-full bg-gray-200"
                          />
                          <span className="text-sm text-gray-500">{item.author.nickname}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {item.likes}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-wowoo hover:shadow-wowoo-lg scale-hover group"
                  >
                    <div className="flex gap-5">
                      {item.image ? (
                        <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
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
                              className="w-6 h-6 rounded-full bg-gray-200"
                            />
                            <span className="text-sm text-gray-500">{item.author.nickname}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {item.likes}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
}

export default Home;
