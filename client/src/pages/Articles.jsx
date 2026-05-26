import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const categories = ['经验分享', '教程', '随笔', '书评影评', '技术文章', '其他'];

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentTag = searchParams.get('tag') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || '-createdAt';

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentCategory) params.append('category', currentCategory);
    if (currentTag) params.append('tag', currentTag);
    if (currentSearch) params.append('search', currentSearch);
    if (currentSort) params.append('sort', currentSort);
    params.append('limit', '50');

    axios.get(`/api/articles?${params}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.articles || []);
        setArticles(data);
        setLoading(false);
      })
      .catch(() => { setArticles([]); setLoading(false); });
  }, [currentCategory, currentTag, currentSearch, currentSort]);

  const categoryColors = {
    '经验分享': { bg: '#F5E6C8', color: '#7a5e2e' },
    '教程':     { bg: '#D6EAF0', color: '#3a6d7a' },
    '随笔':     { bg: '#F8E0E0', color: '#8b5555' },
    '书评影评':  { bg: '#E0F0E0', color: '#4a7a4a' },
    '技术文章':  { bg: '#E8DCF0', color: '#5c3d6e' },
    '其他':     { bg: '#E8E0D5', color: '#8B7355' },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#4A3728]">文章故事</h1>
            <p className="text-sm text-[#8B7355] mt-1">分享你的故事，记录你的思考</p>
          </div>
          <Link
            to="/articles/create"
            className="px-5 py-2.5 bg-[#4A3728] text-white rounded-btn text-sm font-medium hover:bg-[#3A2A1E] transition flex items-center gap-2"
          >
            <span className="text-lg">✏️</span> 写文章
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-4 sticky top-20">
              <h3 className="text-sm font-semibold text-[#4A3728] mb-3">分类</h3>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    !currentCategory ? 'bg-[#F5F0E8] text-[#4A3728] font-medium' : 'text-[#8B7355] hover:bg-[#FDFBF7]'
                  }`}
                >
                  全部
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => updateParam('category', cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                      currentCategory === cat ? 'bg-[#F5F0E8] text-[#4A3728] font-medium' : 'text-[#8B7355] hover:bg-[#FDFBF7]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[cat]?.bg || '#E8E0D5' }}></span>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4A3728]"></div>
                </div>
              ) : articles.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500">暂无文章</p>
                </div>
              ) : (
                articles.map(article => (
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
                        <span className="text-4xl opacity-60">📝</span>
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs"
                          style={{
                            backgroundColor: categoryColors[article.category]?.bg || '#E8E0D5',
                            color: categoryColors[article.category]?.color || '#8B7355'
                          }}
                        >
                          {article.category || '其他'}
                        </span>
                        {article.tags && article.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-xs text-[#8B7355] bg-[#F5F0E8] px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-[15px] font-medium text-[#4A3728] leading-snug mb-1.5 group-hover:text-[#8B7355] transition line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-[13px] text-[#8B7355] leading-relaxed mb-3 line-clamp-2">
                        {article.summary}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#E8E0D5]">
                        <div className="flex items-center gap-2">
                          <img
                            src={article.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${article.owner?.nickname || article.owner?.username || article.ownerName || 'user'}`}
                            alt={article.owner?.nickname || article.ownerName || '作者'}
                            className="w-6 h-6 rounded-full bg-[#E8E0D5]"
                          />
                          <span className="text-[12px] text-[#B8A899] truncate max-w-[70px]">
                            {article.owner?.nickname || article.ownerName || '匿名'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-[#B8A899]">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {article.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {article.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Articles;
