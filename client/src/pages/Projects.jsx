import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const categories = [
  { value: '', label: '全部分类' },
  { value: '网站', label: '网站' },
  { value: 'App', label: 'App' },
  { value: '设计', label: '设计' },
  { value: '视频', label: '视频' },
  { value: '音乐', label: '音乐' },
  { value: '写作', label: '写作' },
  { value: '其他', label: '其他' },
];

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'grid');

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });

  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 12,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchProjects();
  }, [filters, pagination.page]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort
      };
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const res = await axios.get('/api/projects', { params });
      const data = res.data;
      setProjects(data.projects || data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / prev.limit) || 1
      }));
    } catch (error) {
      console.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set('page', '1');
      setSearchParams(params);
      setPagination(prev => ({ ...prev, page: 1 }));
      return newFilters;
    });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLike = async (projectId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await axios.post(`/api/projects/${projectId}/like`);
      setProjects(prev =>
        prev.map(p => p._id === projectId || p.id === projectId
          ? { ...p, isLiked: !p.isLiked, likes: res.data.likes ?? (p.isLiked ? p.likes - 1 : p.likes + 1) }
          : p
        )
      );
    } catch (error) {
      console.error('Failed to like project');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pt-20 fade-in" style={{ backgroundColor: '#F7F5F2' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="heading-xl">项目作品</h1>
            <Link
              to="/projects/create"
              className="btn-primary text-sm py-2"
            >
              发布作品
            </Link>
          </div>

          <div className="card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="apple-select"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="apple-select"
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
                    placeholder="搜索项目作品..."
                    className="apple-input pl-10"
                  />
                  <svg aria-hidden="true" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{pagination.total} 个项目</span>
            </div>
            <div className="flex items-center gap-1 bg-[#F0EDE8] rounded-full p-1">
              <button
                onClick={() => {
                  setViewMode('grid');
                  const params = new URLSearchParams(searchParams);
                  params.set('view', 'grid');
                  setSearchParams(params);
                }}
                className={`rounded-full p-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#222] shadow-sm'
                    : 'text-[#999] hover:text-[#555]'
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
                className={`rounded-full p-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-[#222] shadow-sm'
                    : 'text-[#999] hover:text-[#555]'
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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#555]"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <svg aria-hidden="true" className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">暂无项目作品</p>
            <p className="text-gray-400 text-sm mt-2">来发布第一个作品吧</p>
            <Link
              to="/projects/create"
              className="btn-primary text-sm py-2 inline-block mt-4"
            >
              发布作品
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map(project => (
              <Link
                key={project._id || project.id}
                to={`/projects/${project._id || project.id}`}
                className="card overflow-hidden group"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#F0EDE8] relative">
                  {project.cover ? (
                    <img
                      src={project.cover}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#B8A899]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  {(project.video || project.videoFileId) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-[#222] group-hover:text-[#555] transition-colors line-clamp-1 pr-2">
                      {project.title}
                    </h3>
                  </div>
                  {project.summary && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.summary}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {project.category && (
                        <span className="inline-block px-2 py-0.5 bg-[#F0EDE8] text-[#555] text-xs rounded-full">
                          {project.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <button
                        onClick={(e) => handleLike(project._id || project.id, e)}
                        className={`flex items-center space-x-1 transition-colors ${project.isLiked ? 'text-red-500' : 'hover:text-red-400'}`}
                      >
                        <svg className="w-4 h-4" fill={project.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{project.likes || 0}</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{project.commentCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  {project.completionDate && (
                    <p className="text-xs text-gray-400 mt-2">{formatDate(project.completionDate)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map(project => (
              <Link
                key={project._id || project.id}
                to={`/projects/${project._id || project.id}`}
                className="card overflow-hidden group flex"
              >
                <div className="w-48 h-36 flex-shrink-0 overflow-hidden bg-[#F0EDE8] relative">
                  {project.cover ? (
                    <img
                      src={project.cover}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#B8A899]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  {(project.video || project.videoFileId) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-[#222] group-hover:text-[#555] transition-colors text-lg">
                        {project.title}
                      </h3>
                      {project.category && (
                        <span className="inline-block px-2.5 py-0.5 bg-[#F0EDE8] text-[#555] text-xs rounded-full ml-2">
                          {project.category}
                        </span>
                      )}
                    </div>
                    {project.summary && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{project.summary}</p>
                    )}
                    {project.techTags && project.techTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {project.techTags.map((tag, i) => (
                          <span key={i} className="inline-block px-2 py-0.5 bg-[#F0EDE8] text-[#555] text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={(e) => handleLike(project._id || project.id, e)}
                        className={`flex items-center space-x-1 transition-colors ${project.isLiked ? 'text-red-500' : 'hover:text-red-400'}`}
                      >
                        <svg className="w-4 h-4" fill={project.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{project.likes || 0}</span>
                      </button>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{project.commentCount || 0}</span>
                      </div>
                    </div>
                    {project.completionDate && (
                      <span>{formatDate(project.completionDate)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 text-sm text-[#555] bg-white border border-[#EBE7E0] rounded-full hover:bg-[#F7F5F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm rounded-full transition-all ${
                  page === pagination.page
                    ? 'bg-[#222] text-white'
                    : 'text-[#555] bg-white border border-[#EBE7E0] hover:bg-[#F7F5F2]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 text-sm text-[#555] bg-white border border-[#EBE7E0] rounded-full hover:bg-[#F7F5F2] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;