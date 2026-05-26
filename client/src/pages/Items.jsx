import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import ContentCard from '../components/ContentCard';

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
    setLoading(true);
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;
    if (filters.sort) params.sort = filters.sort;

    axios.get('/api/items', { params })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
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

  const sortOptions = [
    { value: '-createdAt', label: '最新' },
    { value: 'createdAt', label: '最早' },
    { value: '-likes', label: '最多赞' },
    { value: '-comments', label: '最多评论' },
  ];

  const typeFilters = [
    { value: '', label: '全部' },
    { value: 'achievement', label: '个人成果' },
    { value: 'idea', label: '灵感碎片' },
    { value: 'project', label: '项目/作品' },
    { value: 'article', label: '文章/故事' },
    { value: 'stuff', label: '闲置交换' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-[#4A3728]">闲置交换</h1>
          <Link
            to="/items/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4A3728] text-white rounded-btn text-sm font-medium hover:bg-[#3A2A1E] transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            发布物品
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {typeFilters.map(f => (
            <button
              key={f.value}
              onClick={() => handleFilterChange('type', f.value)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                filters.type === f.value
                  ? 'bg-[#4A3728] text-white'
                  : 'bg-white text-[#8B7355] border border-[#E8E0D5] hover:border-[#8B7355]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 border border-[#E8E0D5] rounded-lg text-sm text-[#4A3728] bg-white"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1 bg-white rounded-btn p-1 border border-[#E8E0D5]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-[#F5F0E8] text-[#4A3728]' : 'text-[#8B7355]'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-[#F5F0E8] text-[#4A3728]' : 'text-[#8B7355]'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 mb-4">暂无物品</p>
            <Link
              to="/items/create"
              className="px-6 py-2.5 bg-[#4A3728] text-white rounded-btn text-sm hover:bg-[#3A2A1E] transition"
            >
              发布第一个物品
            </Link>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                  <ContentCard key={item._id} item={item} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map(item => (
                  <ContentCard key={item._id} item={item} viewMode="list" />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Items;
