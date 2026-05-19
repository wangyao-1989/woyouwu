import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const mockContent = [
  {
    id: 1,
    type: 'creation',
    title: 'My Portfolio Website 2024 Redesign',
    description: 'Built with Next.js + Tailwind. A clean and modern portfolio to showcase my work.',
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
    title: 'What if we turn memories into shareable files?',
    description: 'A thought that popped up in the shower. Not just photos, but feelings, thoughts, sounds, and moments.',
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
    title: 'Fujifilm Mini 8 for Trade',
    description: 'Good condition. Looking for books or stationary in exchange!',
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
    title: 'Research Summary: Urban Green Space',
    description: 'Data analysis of urban green spaces based on five-year survey data.',
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
    title: 'A reading community without pressure',
    description: 'A web page to help people collect and share reading notes, no need to "finish" anything.',
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
  }, []);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'creation':
        return { bg: 'bg-creation-bg', text: 'text-creation-text', label: 'CREATION', borderColor: '#2d6fa3' };
      case 'idea':
        return { bg: 'bg-idea-bg', text: 'text-idea-text', label: 'IDEA', borderColor: '#3d7a40' };
      case 'stuff':
        return { bg: 'bg-stuff-bg', text: 'text-stuff-text', label: 'STUFF', borderColor: '#704a80' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'ITEM', borderColor: '#8b7355' };
    }
  };

  const filteredContent = activeFilter === 'all' 
    ? mockContent 
    : mockContent.filter(item => item.type === activeFilter);

  return (
    <div className="min-h-screen bg-[#fffef7] fade-in">
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block mb-4">
                <span 
                  className="px-4 py-2 bg-primary-100 text-[#2d2d2d] text-sm font-bold rounded-full"
                  style={{ border: '2px solid #2d2d2d', boxShadow: '1px 2px 0px rgba(45,45,45,0.5)' }}
                >
                  ✨ New discoveries daily
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-[#2d2d2d] mb-6 wowoo-heading leading-tight sketch-text">
                Open a box of<br />
                <span className="text-[#5a5a5a]">inspiration.</span>
              </h1>
              <p className="text-lg text-[#5a5a5a] mb-8 max-w-md mx-auto lg:mx-0">
                Random discoveries from real people. Every visit, a new surprise. Every feeling, a new lucky.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/items/create')}
                  className="px-8 py-3 bg-primary-400 text-[#2d2d2d] font-bold text-lg rounded-[16px_16px_20px_20px] hover:bg-primary-300 transition-all hand-button"
                  style={{ borderWidth: '3px' }}
                >
                  I'm Feeling Lucky ✨
                </button>
                <button 
                  onClick={() => setActiveFilter('all')}
                  className="px-8 py-3 bg-white text-[#2d2d2d] font-bold text-lg rounded-[16px_16px_20px_20px] hover:bg-gray-50 transition-all hand-button"
                  style={{ borderWidth: '3px' }}
                >
                  Shuffle ↻
                </button>
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="absolute -top-8 -left-8 text-3xl wobble">✦</div>
                <div className="absolute -bottom-6 -right-6 text-4xl bounce-hand">✧</div>
                <div className="absolute top-1/4 -right-10 text-2xl float-hand">⭐</div>
                <div 
                  className="bg-white p-8 rounded-[24px_24px_32px_32px]"
                  style={{ 
                    border: '3px solid #2d2d2d',
                    boxShadow: '4px 6px 0px rgba(45,45,45,0.8), 8px 12px 0px rgba(45,45,45,0.1)'
                  }}
                >
                  <svg viewBox="0 0 320 260" className="w-full h-auto">
                    <rect x="60" y="130" width="200" height="80" fill="#f6b26b" rx="12" stroke="#2d2d2d" strokeWidth="3" />
                    <rect x="60" y="110" width="200" height="35" fill="#e89f4a" rx="12" stroke="#2d2d2d" strokeWidth="3" />
                    <rect x="140" y="95" width="40" height="25" fill="#d48a3c" rx="6" stroke="#2d2d2d" strokeWidth="2" />
                    
                    <circle cx="95" cy="75" r="22" fill="#dae8fc" stroke="#2d2d2d" strokeWidth="2" />
                    <circle cx="210" cy="65" r="18" fill="#d5e8d4" stroke="#2d2d2d" strokeWidth="2" />
                    <rect x="230" y="35" width="40" height="32" fill="#e1d5e7" rx="6" stroke="#2d2d2d" strokeWidth="2" />
                    
                    <text x="88" y="78" fontSize="18">📷</text>
                    <text x="200" y="63" fontSize="14">🌱</text>
                    <text x="235" y="33" fontSize="16">📝</text>
                    <text x="145" y="60" fontSize="16" className="animate-bounce">✨</text>
                    <text x="175" y="48" fontSize="14" className="animate-pulse">✨</text>
                    <text x="115" y="45" fontSize="12" className="animate-spin">✦</text>
                    <text x="200" y="95" fontSize="12" className="animate-bounce">✧</text>
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
            <div className="flex items-center space-x-3">
              {['all', 'creation', 'idea', 'stuff'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-5 py-2.5 text-sm font-bold rounded-[12px_12px_16px_16px] transition-all hand-button`}
                  style={{ 
                    borderWidth: '2px',
                    backgroundColor: activeFilter === filter ? '#f6b26b' : '#ffffff',
                    color: activeFilter === filter ? '#2d2d2d' : '#5a5a5a'
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <div 
              className="flex items-center space-x-2 rounded-xl p-2"
              style={{ 
                background: '#f5f3ed',
                border: '2px solid #2d2d2d',
                boxShadow: '2px 2px 0px rgba(45,45,45,0.8)'
              }}
            >
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all`}
                style={{ 
                  backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                  color: viewMode === 'grid' ? '#2d2d2d' : '#8b7355',
                  border: viewMode === 'grid' ? '2px solid #2d2d2d' : '2px solid transparent',
                  boxShadow: viewMode === 'grid' ? '1px 1px 0px rgba(45,45,45,0.8)' : 'none'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all`}
                style={{ 
                  backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                  color: viewMode === 'list' ? '#2d2d2d' : '#8b7355',
                  border: viewMode === 'list' ? '2px solid #2d2d2d' : '2px solid transparent',
                  boxShadow: viewMode === 'list' ? '1px 1px 0px rgba(45,45,45,0.8)' : 'none'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
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
                    className="bg-white rounded-[20px_20px_25px_25px] overflow-hidden group block transition-all hover:-translate-y-2"
                    style={{ 
                      border: `3px solid #2d2d2d`,
                      boxShadow: '3px 4px 0px rgba(45,45,45,0.8), 6px 8px 0px rgba(45,45,45,0.1)'
                    }}
                  >
                    {item.image ? (
                      <div className="aspect-video overflow-hidden" style={{ borderBottom: '3px solid #2d2d2d' }}>
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div 
                        className="aspect-video flex items-center justify-center"
                        style={{ 
                          background: 'linear-gradient(135deg, #f5f3ed 0%, #e8e4d9 100%)',
                          borderBottom: '3px solid #2d2d2d'
                        }}
                      >
                        <div className="text-5xl bounce-hand">
                          {item.type === 'idea' ? '💡' : item.type === 'creation' ? '🎨' : '📦'}
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <span 
                        className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${typeStyle.bg} ${typeStyle.text}`}
                        style={{ 
                          border: `2px solid ${typeStyle.borderColor}`,
                          boxShadow: '1px 2px 0px rgba(45,45,45,0.5)'
                        }}
                      >
                        {typeStyle.label}
                      </span>
                      <h3 className="text-lg font-bold text-[#2d2d2d] mb-2 leading-snug wowoo-heading">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#5a5a5a] line-clamp-2 mb-4">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img
                            src={item.author.avatar}
                            alt={item.author.nickname}
                            className="w-7 h-7 rounded-full bg-[#f5f3ed]"
                            style={{ border: '2px solid #2d2d2d', boxShadow: '1px 1px 0px rgba(45,45,45,0.8)' }}
                          />
                          <span className="text-sm text-[#5a5a5a]">{item.author.nickname}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-[#8b7355]">
                          <span className="flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                            {item.likes}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
                    className="bg-white rounded-[20px_20px_25px_25px] p-5 group block transition-all hover:-translate-y-1"
                    style={{ 
                      border: `3px solid #2d2d2d`,
                      boxShadow: '3px 4px 0px rgba(45,45,45,0.8), 6px 8px 0px rgba(45,45,45,0.1)'
                    }}
                  >
                    <div className="flex gap-5">
                      {item.image ? (
                        <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid #2d2d2d' }}>
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-32 h-24 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ 
                            background: 'linear-gradient(135deg, #f5f3ed 0%, #e8e4d9 100%)',
                            border: '2px solid #2d2d2d',
                            boxShadow: '2px 2px 0px rgba(45,45,45,0.8)'
                          }}
                        >
                          <div className="text-3xl wobble">
                            {item.type === 'idea' ? '💡' : item.type === 'creation' ? '🎨' : '📦'}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span 
                          className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-2 ${typeStyle.bg} ${typeStyle.text}`}
                          style={{ 
                            border: `2px solid ${typeStyle.borderColor}`,
                            boxShadow: '1px 2px 0px rgba(45,45,45,0.5)'
                          }}
                        >
                          {typeStyle.label}
                        </span>
                        <h3 className="text-lg font-bold text-[#2d2d2d] mb-1 wowoo-heading">
                          {item.title}
                        </h3>
                        <p className="text-sm text-[#5a5a5a] line-clamp-2 mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <img
                              src={item.author.avatar}
                              alt={item.author.nickname}
                              className="w-7 h-7 rounded-full bg-[#f5f3ed]"
                              style={{ border: '2px solid #2d2d2d', boxShadow: '1px 1px 0px rgba(45,45,45,0.8)' }}
                            />
                            <span className="text-sm text-[#5a5a5a]">{item.author.nickname}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-[#8b7355]">
                            <span className="flex items-center">
                              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                              </svg>
                              {item.likes}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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