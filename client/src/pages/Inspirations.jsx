import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const categories = [
  { value: '', label: '所有分类' },
  { value: '产品想法', label: '产品想法' },
  { value: '设计灵感', label: '设计灵感' },
  { value: '技术方案', label: '技术方案' },
  { value: '商业模式', label: '商业模式' },
  { value: '其他', label: '其他' },
];

const statuses = [
  { value: '', label: '所有状态' },
  { value: '纯想法', label: '纯想法' },
  { value: '探索中', label: '探索中' },
  { value: '已落地', label: '已落地' },
];

const sortOptions = [
  { value: '-createdAt', label: '最新优先' },
  { value: 'createdAt', label: '最早优先' },
  { value: '-likesCount', label: '最多点赞' },
];

function Inspirations() {
  const [inspirations, setInspirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchInspirations();
  }, [filters]);

  const fetchInspirations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      params.page = filters.page;
      params.limit = 12;

      const res = await axios.get('/api/inspirations', { params });
      setInspirations(res.data.inspirations || res.data);
      setPagination({
        page: res.data.page || 1,
        pages: res.data.pages || 1,
        total: res.data.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch inspirations');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value, page: key === 'page' ? value : 1 };
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
      setSearchParams(params);
      return newFilters;
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case '纯想法':
        return 'bg-purple-100 text-purple-700';
      case '探索中':
        return 'bg-amber-100 text-amber-700';
      case '已落地':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case '产品想法': return '🚀';
      case '设计灵感': return '🎨';
      case '技术方案': return '⚙️';
      case '商业模式': return '📊';
      case '其他': return '📌';
      default: return '💡';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="heading-xl">灵感碎片</h1>
            <Link
              to="/inspirations/create"
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>记录灵感</span>
            </Link>
          </div>

          <div className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                >
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                >
                  {sortOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    autoComplete="off"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="搜索灵感..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                  />
                  <svg aria-hidden="true" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-[#8B7355]">共 {pagination.total} 条灵感</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
          </div>
        ) : inspirations.length === 0 ? (
          <div className="text-center py-16">
            <svg aria-hidden="true" className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">还没有灵感碎片</p>
            <p className="text-gray-400 text-sm mt-2">记录你的第一个灵感吧</p>
            <Link
              to="/inspirations/create"
              className="btn-primary mt-6 inline-flex items-center"
            >
              记录灵感
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inspirations.map(inspiration => (
                <div
                  key={inspiration._id}
                  onClick={() => navigate(`/inspirations/${inspiration._id}`)}
                  className="card p-6 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{getCategoryIcon(inspiration.category)}</span>
                    <span className={`tag-capsule ${getStatusStyle(inspiration.status)}`}>
                      {inspiration.status}
                    </span>
                  </div>

                  <h3 className="heading-sm mb-2 group-hover:text-[#6B5342] transition-colors line-clamp-1">
                    {inspiration.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {inspiration.description}
                  </p>

                  {inspiration.tags && inspiration.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {inspiration.tags.slice(0, 4).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-[#F5F0E8] text-[#8B7355] rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {inspiration.tags.length > 4 && (
                        <span className="px-2 py-0.5 text-[#B8A899] text-xs">
                          +{inspiration.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[#F5F0E8]">
                    <div className="flex items-center space-x-1 text-sm text-[#8B7355]">
                      <span className="px-2 py-0.5 bg-[#F5F0E8] rounded-full text-xs">
                        {inspiration.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-[#B8A899]">
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {inspiration.likesCount || inspiration.likes?.length || 0}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {inspiration.commentsCount || inspiration.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center mt-10 space-x-2">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="px-4 py-2 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] hover:border-[#C8BAAA] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  上一页
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handleFilterChange('page', page)}
                    className={`px-3.5 py-2 rounded-btn text-sm transition-all ${
                      page === pagination.page
                        ? 'bg-[#4A3728] text-white'
                        : 'bg-white border border-[#E8E0D5] text-[#4A3728] hover:border-[#C8BAAA]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={filters.page >= pagination.pages}
                  className="px-4 py-2 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] hover:border-[#C8BAAA] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Inspirations;