import { Link } from 'react-router-dom';
import Icon from './Icon';

const tagStyles = {
  achievement: { bg: '#F5E6C8', color: '#7a5e2e', label: '个人成果' },
  idea:        { bg: '#E8DCF0', color: '#5c3d6e', label: '灵感碎片' },
  project:     { bg: '#D6EAF0', color: '#3a6d7a', label: '项目/作品' },
  article:     { bg: '#F8E0E0', color: '#8b5555', label: '文章/故事' },
  stuff:       { bg: '#E0F0E0', color: '#4a7a4a', label: '闲置交换' },
};

function normalize(item) {
  return {
    id: item._id || item.id,
    type: item.type,
    title: item.name || item.title || '',
    image: (item.images && item.images[0]) || item.image || null,
    description: item.remark || item.description || '',
    category: item.category || '',
    location: item.location || '',
    distance: item.distance || null,
    status: item.status || '',
    author: item.owner
      ? { nickname: item.owner.nickname || item.owner.username || '', avatar: item.owner.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.owner.nickname || item.owner.username || 'user'}` }
      : item.author || { nickname: '', avatar: '' },
    likes: typeof item.likes === 'number' ? item.likes : (Array.isArray(item.likes) ? item.likes.length : 0),
    comments: typeof item.comments === 'number' ? item.comments : (Array.isArray(item.comments) ? item.comments.length : 0),
    createdAt: item.createdAt,
  };
}

function ContentCard({ item: rawItem, viewMode = 'grid' }) {
  const item = normalize(rawItem);
  const tag = tagStyles[item.type] || { bg: '#E8E0D5', color: '#8B7355', label: '项目' };

  const getDefaultIcon = () => {
    switch (item.type) {
      case 'achievement': return { name: 'trophy', label: '个人成果' };
      case 'idea':        return { name: 'lightbulb', label: '灵感碎片' };
      case 'project':     return { name: 'doc', label: '项目/作品' };
      case 'article':     return { name: 'file', label: '文章/故事' };
      case 'stuff':       return { name: 'cube', label: '闲置交换' };
      default:            return { name: 'doc', label: '项目' };
    }
  };

  if (viewMode === 'list') {
    return (
      <Link
        to={`/items/${item.id}`}
        className="bg-white rounded-card border border-[#E8E0D5] shadow-card flex gap-5 p-5 hover:shadow-lg transition"
      >
        {item.image ? (
          <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-[#F5F0E8] to-[#F0E8DD] flex items-center justify-center flex-shrink-0">
            <Icon name={getDefaultIcon().name} className="w-8 h-8 text-[#8B7355]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span
            className="tag-capsule mb-2"
            style={{ backgroundColor: tag.bg, color: tag.color }}
          >
            {tag.label}
          </span>
          <h3 className="text-[15px] font-medium text-[#4A3728] mb-1 leading-snug">
            {item.title}
          </h3>
          <p className="text-[13px] text-[#8B7355] line-clamp-2 mb-3">
            {item.description}
          </p>
          {item.distance != null && (
            <p className="text-[11px] text-[#6b8a9a] mb-2">
              📍 距您约 {item.distance} km
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={item.author.avatar}
                alt={item.author.nickname}
                className="w-6 h-6 rounded-full bg-[#E8E0D5]"
              />
              <span className="text-[12px] text-[#B8A899]">{item.author.nickname}</span>
            </div>
            <div className="flex items-center space-x-4 text-[12px]">
              <span className="flex items-center gap-1 text-[#c75151]">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {item.likes}
              </span>
              <span className="flex items-center gap-1 text-[#6b8a9a]">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {item.comments}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/items/${item.id}`}
      className="bg-white rounded-card border border-[#E8E0D5] shadow-card overflow-hidden flex flex-col hover:shadow-lg transition group"
    >
      {item.image ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-[#F5F0E8] to-[#F0E8DD]">
          <Icon name={getDefaultIcon().name} className="w-12 h-12 text-[#8B7355]" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        <span
          className="tag-capsule mb-2.5 self-start"
          style={{ backgroundColor: tag.bg, color: tag.color }}
        >
          {tag.label}
        </span>

        <h3 className="text-[15px] font-medium text-[#4A3728] leading-snug mb-1.5 group-hover:text-[#8B7355] transition line-clamp-2">
          {item.title}
        </h3>
        <p className="text-[13px] text-[#8B7355] leading-relaxed mb-1 line-clamp-2">
          {item.description}
        </p>

        {item.distance != null && (
          <p className="text-[11px] text-[#6b8a9a] mb-2">
            📍 距您约 {item.distance} km
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={item.author.avatar}
              alt={item.author.nickname}
              className="w-6 h-6 rounded-full bg-[#E8E0D5]"
            />
            <span className="text-[12px] text-[#B8A899] truncate max-w-[80px]">
              {item.author.nickname}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className="flex items-center gap-1 text-[#c75151]">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {item.likes}
            </span>
            <span className="flex items-center gap-1 text-[#6b8a9a]">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {item.comments}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ContentCard;
