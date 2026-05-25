import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import ContentCard from '../components/ContentCard';

const mockItems = [
  {
    id: 1,
    type: 'project',
    title: '我的个人网站2024全新改版',
    description: '使用Next.js + Tailwind构建，干净现代的作品集展示我的作品。',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
    category: '网页设计',
    location: '上海',
    status: 'available',
    author: { nickname: 'helen.dev', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=helen' },
    likes: 45,
    comments: 8,
    createdAt: new Date()
  },
  {
    id: 2,
    type: 'idea',
    title: '如果我们能把回忆变成可分享的文件呢？',
    description: '洗澡时的一个想法。不只是照片，还有感觉、想法、声音和瞬间。',
    image: null,
    category: '创意',
    location: '远程',
    status: 'available',
    author: { nickname: 'raymond', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=raymond' },
    likes: 78,
    comments: 12,
    createdAt: new Date()
  },
  {
    id: 3,
    type: 'stuff',
    title: '富士拍立得Mini8交换',
    description: '成色不错。寻求书籍或文具交换！',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop',
    category: '电子产品',
    location: '北京',
    status: 'available',
    author: { nickname: 'sarah.k', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=sarah' },
    likes: 12,
    comments: 3,
    createdAt: new Date()
  },
  {
    id: 4,
    type: 'project',
    title: '研究摘要：城市绿地空间',
    description: '基于五年调查数据的城市绿地空间数据分析。',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
    category: '研究',
    location: '伦敦',
    status: 'available',
    author: { nickname: 'researcher', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=researcher' },
    likes: 36,
    comments: 5,
    createdAt: new Date()
  },
  {
    id: 5,
    type: 'idea',
    title: '一个没有压力的阅读社区',
    description: '帮助人们收集和分享读书笔记的网页，不需要"完成"任何事情。',
    image: null,
    category: '社区',
    location: '东京',
    status: 'available',
    author: { nickname: 'celine', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=celine' },
    likes: 21,
    comments: 4,
    createdAt: new Date()
  }
];

function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'grid');

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });

  useEffect(() => {
    // Mock API call
    setLoading(true);
    setTimeout(() => {
      let filtered = [...mockItems];
      
      if (filters.search) {
        filtered = filtered.filter(item => 
          item.title.includes(filters.search) ||
          item.description.includes(filters.search)
        );
      }
      
      if (filters.category) {
        filtered = filtered.filter(item => item.category === filters.category);
      }
      
      if (filters.type) {
        filtered = filtered.filter(item => item.type === filters.type);
      }
      
      setItems(filtered);
      setLoading(false);
    }, 500);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      setSearchParams(params);
      return newFilters;
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-xl mb-6">探索创作</h1>
          
          {/* Filter Controls */}
          <div className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                >
                  <option value="">所有类型</option>
                  <option value="achievement">个人成果</option>
                  <option value="idea">灵感碎片</option>
                  <option value="project">项目/作品</option>
                  <option value="article">文章/故事</option>
                  <option value="stuff">闲置交换</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                >
                  <option value="">所有分类</option>
                  <option value="网页设计">网页设计</option>
                  <option value="创意">创意</option>
                  <option value="电子产品">电子产品</option>
                  <option value="研究">研究</option>
                  <option value="社区">社区</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                >
                  <option value="-createdAt">最新优先</option>
                  <option value="createdAt">最早优先</option>
                  <option value="likes">最多点赞</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    autoComplete="off"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="搜索物品、灵感、创作..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                  />
                  <svg aria-hidden="true" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{items.length} 个结果</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#F5F0E8] rounded-btn p-1">
              <button
                onClick={() => {
                  setViewMode('grid');
                  const params = new URLSearchParams(searchParams);
                  params.set('view', 'grid');
                  setSearchParams(params);
                }}
                className={`rounded-btn p-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#4A3728] shadow-sm'
                    : 'text-[#B8A899] hover:text-[#4A3728]'
                }`}
                aria-label="网格视图"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  const params = new URLSearchParams(searchParams);
                  params.set('view', 'list');
                  setSearchParams(params);
                }}
                className={`rounded-btn p-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#4A3728] shadow-sm'
                    : 'text-[#B8A899] hover:text-[#4A3728]'
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

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <svg aria-hidden="true" className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">没有找到内容</p>
            <p className="text-gray-400 text-sm mt-2">尝试调整筛选条件</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(item => (
                <ContentCard key={item.id} item={item} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <ContentCard key={item.id} item={item} viewMode="list" />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Items;
