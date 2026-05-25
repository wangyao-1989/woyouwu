import { Link } from 'react-router-dom';

const tagStyles = {
  achievement: { bg: '#F5E6C8', color: '#7a5e2e', label: '个人成果' },
  idea:        { bg: '#E8DCF0', color: '#5c3d6e', label: '灵感碎片' },
  project:     { bg: '#D6EAF0', color: '#3a6d7a', label: '项目/作品' },
  article:     { bg: '#F8E0E0', color: '#8b5555', label: '文章/故事' },
  stuff:       { bg: '#E0F0E0', color: '#4a7a4a', label: '闲置交换' },
};

function ContentCard({ item, viewMode = 'grid' }) {
  const tag = tagStyles[item.type] || { bg: '#E8E0D5', color: '#8B7355', label: '项目' };

  const getDefaultEmoji = () => {
    switch (item.type) {
      case 'achievement': return '🏆';
      case 'idea':        return '💭';
      case 'project':     return '🎨';
      case 'article':     return '📝';
      case 'stuff':       return '📦';
      default:            return '📄';
    }
  };

  if (viewMode === 'list') {
    return (
      <Link
        to={`/items/${item.id}`}
        className="card-sketch flex gap-5 p-5"
      >
        {item.image ? (
          <div className="w-32 h-24 rounded-mini overflow-hidden flex-shrink-0">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-32 h-24 rounded-mini bg-gradient-to-br from-[#F5F0E8] to-[#F0E8DD] flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">{getDefaultEmoji()}</span>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={item.author.avatar}
                alt={item.author.nickname}
                className="w-6 h-6 rounded-full bg-[#E8E0D5]"
              />
              <span className="text-[12px] text-[#B8A899]">{item.author.nickname}</span>
            </div>
            <div className="flex items-center space-x-4 text-[12px] text-[#B8A899]">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {item.likes}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
      className="card-sketch overflow-hidden flex flex-col"
    >
      <div className="h-1.5" style={{ backgroundColor: tag.bg }} />

      {item.image ? (
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-[#F5F0E8] to-[#F0E8DD]">
          <span className="text-4xl opacity-80">{getDefaultEmoji()}</span>
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <span
          className="tag-capsule mb-2.5 self-start"
          style={{ backgroundColor: tag.bg, color: tag.color }}
        >
          {tag.label}
        </span>

        <h3 className="text-[15px] font-medium text-[#4A3728] leading-snug mb-1.5 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-[13px] text-[#8B7355] leading-relaxed mb-3 line-clamp-2">
          {item.description}
        </p>

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
          <div className="flex items-center gap-3 text-[12px] text-[#B8A899]">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {item.likes}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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