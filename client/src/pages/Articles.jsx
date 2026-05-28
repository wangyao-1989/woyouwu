import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const categories = ['经验分享', '教程', '随笔', '书评影评', '技术文章', '其他'];

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt',
    page: parseInt(searchParams.get('page')) || 1
  });

  useEffect(() => {
    fetchArticles();
  }, [filters]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.search) params.append('search', filters.search);
      params.append('sort', filters.sort);
      params.append('page', filters.page);
      params.append('limit', '12');

      const res = await axios.get(`/api/articles?${params.toString()}`);
      setArticles(res.data.articles || res.data);
      setPagination({
        page: res.data.page || 1,
        pages: res.data.pages || 1,
        total: res.data.total || (res.data.articles || res.data).length
      });
    } catch (error) {
      console.error('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      if (key !== 'page') {
        newFilters.page = 1;
      }
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      setSearchParams(params);
      return newFilters;
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      '经验分享': 'bg-blue-100 text-blue-800',
      '教程': 'bg-green-100 text-green-800',
      '随笔': 'bg-purple-100 text-purple-800',
      '书评影评': 'bg-yellow-100 text-yellow-800',
      '技术文章': 'bg-red-100 text-red-800',
      '其他': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="heading-xl">文章故事</h1>
            <Link
              to="/articles/create"
              className="px-5 py-2.5 bg-[#4A3728] text-white rounded-btn text-sm font-medium hover:bg-[#3A2A1E] transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>发布文章</span>
            </Link>
          </div>

          <div className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                >
                  <option value="">所有分类</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <input
                  type="text"
                  value={filters.tag}
                  onChange={(e) => handleFilterChange('tag', e.target.value)}
                  placeholder="输入标签筛选..."
                  className="w-full px-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                />
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
                  <option value="-likes">最多点赞</option>
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
                    placeholder="搜索文章标题、摘要..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                  />
                  <svg aria-hidden="true" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange('category', filters.category === cat ? '' : cat)}
                  className={`px-3 py-1 text-sm rounded-full transition ${
                    filters.category === cat
                      ? 'bg-[#4A3728] text-white'
                      : 'bg-[#F5F0E8] text-[#8B7355] hover:bg-[#E8E0D5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">共 {pagination.total} 篇文章</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <svg aria-hidden="true" className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">还没有文章</p>
            <p className="text-gray-400 text-sm mt-2">成为第一个分享故事的人吧</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <Link
                  key={article._id}
                  to={`/articles/${article._id}`}
                  className="bg-white rounded-card border border-[#E8E0D5] shadow-card overflow-hidden flex flex-col hover:shadow-lg transition group"
                >
                  {article.cover ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.cover}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-[#F5F0E8] to-[#E8E0D5] flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#C8BAAA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#4A3728] mb-2 group-hover:text-[#8B7355] transition line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {article.summary}
                    </p>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {article.tags.slice(0, 4).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#F5F0E8] text-[#8B7355] text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#E8E0D5]">
                      <div className="flex items-center space-x-1">
                        <img
                          src={article.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${article.owner?.nickname || 'user'}`}
                          alt={article.owner?.nickname}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-xs text-gray-500">{article.owner?.nickname || '匿名'}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{article.likes ? (Array.isArray(article.likes) ? article.likes.length : article.likes) : 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{article.comments ? (Array.isArray(article.comments) ? article.comments.length : article.comments) : 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-10">
                <button
                  onClick={() => handleFilterChange('page', pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm rounded-btn border border-[#E8E0D5] text-[#4A3728] hover:bg-[#F5F0E8] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  上一页
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => handleFilterChange('page', p)}
                    className={`w-9 h-9 text-sm rounded-full transition ${
                      pagination.page === p
                        ? 'bg-[#4A3728] text-white'
                        : 'border border-[#E8E0D5] text-[#4A3728] hover:bg-[#F5F0E8]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => handleFilterChange('page', pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 text-sm rounded-btn border border-[#E8E0D5] text-[#4A3728] hover:bg-[#F5F0E8] disabled:opacity-40 disabled:cursor-not-allowed transition"
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

export default Articles;