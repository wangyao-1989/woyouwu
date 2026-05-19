import { Link } from 'react-router-dom';

export function getTypeStyle(type) {
  switch (type) {
    case 'creation':
      return { bg: 'bg-creation-bg', text: 'text-creation-text', label: 'CREATION' };
    case 'idea':
      return { bg: 'bg-idea-bg', text: 'text-idea-text', label: 'IDEA' };
    case 'stuff':
      return { bg: 'bg-stuff-bg', text: 'text-stuff-text', label: 'STUFF' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'ITEM' };
  }
}

function ContentCard({ item, viewMode = 'grid' }) {
  const typeStyle = getTypeStyle(item.type);
  const defaultAvatar = item.author 
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${item.author?.nickname || 'user'}`
    : 'https://api.dicebear.com/7.x/initials/svg?seed=user';

  const getDefaultEmoji = () => {
    switch (item.type) {
      case 'idea': return '💭';
      case 'creation': return '🎨';
      case 'stuff': return '📦';
      default: return '✨';
    }
  };

  if (viewMode === 'list') {
    return (
      <Link
        to={`/items/${item.id}`}
        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-wowoo hover:shadow-wowoo-lg scale-hover group block"
      >
        <div className="flex gap-5">
          {item.image ? (
            <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-32 h-24 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
              <div className="text-3xl">{getDefaultEmoji()}</div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-2 ${typeStyle.bg} ${typeStyle.text}`}>
              {typeStyle.label}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {item.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={item.author?.avatar || defaultAvatar}
                  alt={item.author?.nickname || 'user'}
                  className="w-6 h-6 rounded-full bg-gray-200"
                />
                <span className="text-sm text-gray-500">{item.author?.nickname || 'Anonymous'}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {item.likes || 0}
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {item.comments || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/items/${item.id}`}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-wowoo hover:shadow-wowoo-lg scale-hover group block"
    >
      {item.image ? (
        <div className="aspect-video overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-4xl">{getDefaultEmoji()}</div>
        </div>
      )}
      <div className="p-5">
        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${typeStyle.bg} ${typeStyle.text}`}>
          {typeStyle.label}
        </span>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={item.author?.avatar || defaultAvatar}
              alt={item.author?.nickname || 'user'}
              className="w-6 h-6 rounded-full bg-gray-200"
            />
            <span className="text-sm text-gray-500">{item.author?.nickname || 'Anonymous'}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {item.likes || 0}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {item.comments || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ContentCard;
