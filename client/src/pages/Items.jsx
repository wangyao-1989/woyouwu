import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import ContentCard from '../components/ContentCard';

const mockItems = [
  {
    id: 1,
    type: 'creation',
    title: 'My Portfolio Website 2024 Redesign',
    description: 'Built with Next.js + Tailwind. A clean and modern portfolio to showcase my work.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
    category: 'Web Design',
    location: 'San Francisco',
    status: 'available',
    author: { nickname: 'helen.dev', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=helen' },
    likes: 45,
    comments: 8,
    createdAt: new Date()
  },
  {
    id: 2,
    type: 'idea',
    title: 'What if we turn memories into shareable files?',
    description: 'A thought that popped up in the shower. Not just photos, but feelings, thoughts, sounds, and moments.',
    image: null,
    category: 'Concept',
    location: 'Remote',
    status: 'available',
    author: { nickname: 'raymond', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=raymond' },
    likes: 78,
    comments: 12,
    createdAt: new Date()
  },
  {
    id: 3,
    type: 'stuff',
    title: 'Fujifilm Mini 8 for Trade',
    description: 'Good condition. Looking for books or stationary in exchange!',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop',
    category: 'Electronics',
    location: 'New York',
    status: 'available',
    author: { nickname: 'sarah.k', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=sarah' },
    likes: 12,
    comments: 3,
    createdAt: new Date()
  },
  {
    id: 4,
    type: 'creation',
    title: 'Research Summary: Urban Green Space',
    description: 'Data analysis of urban green spaces based on five-year survey data.',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
    category: 'Research',
    location: 'London',
    status: 'available',
    author: { nickname: 'researcher', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=researcher' },
    likes: 36,
    comments: 5,
    createdAt: new Date()
  },
  {
    id: 5,
    type: 'idea',
    title: 'A reading community without pressure',
    description: 'A web page to help people collect and share reading notes, no need to "finish" anything.',
    image: null,
    category: 'Community',
    location: 'Tokyo',
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
  const [viewMode, setViewMode] = useState('grid');

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
          item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.description.toLowerCase().includes(filters.search.toLowerCase())
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
    <div className="min-h-screen bg-white fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 wowoo-heading">Explore Creations</h1>
          
          {/* Filter Controls */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-wowoo mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                >
                  <option value="">All Types</option>
                  <option value="creation">Creation</option>
                  <option value="idea">Idea</option>
                  <option value="stuff">Stuff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                >
                  <option value="">All Categories</option>
                  <option value="Web Design">Web Design</option>
                  <option value="Concept">Concept</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Research">Research</option>
                  <option value="Community">Community</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="createdAt">Oldest First</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search items, ideas, creations..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{items.length} items</span>
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

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">No items found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
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
