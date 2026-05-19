import { Link } from 'react-router-dom';

export function getTypeStyle(type) {
  switch (type) {
    case 'creation':
      return { bg: 'bg-creation-bg', text: 'text-creation-text', label: 'CREATION', borderColor: '#2d6fa3' };
    case 'idea':
      return { bg: 'bg-idea-bg', text: 'text-idea-text', label: 'IDEA', borderColor: '#3d7a40' };
    case 'stuff':
      return { bg: 'bg-stuff-bg', text: 'text-stuff-text', label: 'STUFF', borderColor: '#704a80' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'ITEM', borderColor: '#8b7355' };
  }
}

function ContentCard({ item, viewMode = 'grid' }) {
  const typeStyle = getTypeStyle(item.type);
  const defaultAvatar = item.author 
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${item.author?.nickname || 'user'}`
    : 'https://api.dicebear.com/7.x/initials/svg?seed=user';

  const getDefaultEmoji = () => {
    switch (item.type) {
      case 'idea': return '💡';
      case 'creation': return '🎨';
      case 'stuff': return '📦';
      default: return '✨';
    }
  };

  if (viewMode === 'list') {
    return (
      <Link
        to={`/items/${item.id}`}
        className="bg-white rounded-[20px_20px_25px_25px] p-5 group block transition-all hover:-translate-y-1"
        style={{ 
          border: `3px solid #2d2d2d`,
          boxShadow: '3px 4px 0px rgba(45,45,45,0.8), 6px 8px 0px rgba(45,45,45,0.1)'
        }}
      >
        <div className="flex gap-5">
          {item.image ? (
            <div className="w-32 h-24 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '2px solid #2d2d2d' }}>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div 
              className="w-32 h-24 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, #f5f3ed 0%, #e8e4d9 100%)',
                border: '2px solid #2d2d2d',
                boxShadow: '2px 2px 0px rgba(45,45,45,0.8)'
              }}
            >
              <div className="text-3xl wobble">{getDefaultEmoji()}</div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span 
              className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-2 ${typeStyle.bg} ${typeStyle.text}`}
              style={{ 
                border: `2px solid ${typeStyle.borderColor}`,
                boxShadow: '1px 2px 0px rgba(45,45,45,0.5)'
              }}
            >
              {typeStyle.label}
            </span>
            <h3 className="text-lg font-bold text-[#2d2d2d] mb-1 wowoo-heading">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-[#5a5a5a] line-clamp-2 mb-3">
                {item.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <img
                  src={item.author?.avatar || defaultAvatar}
                  alt={item.author?.nickname || 'user'}
                  className="w-7 h-7 rounded-full bg-[#f5f3ed]"
                  style={{ border: '2px solid #2d2d2d', boxShadow: '1px 1px 0px rgba(45,45,45,0.8)' }}
                />
                <span className="text-sm text-[#5a5a5a]">{item.author?.nickname || 'Anonymous'}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-[#8b7355]">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                  {item.likes || 0}
                </span>
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
      className="bg-white rounded-[20px_20px_25px_25px] overflow-hidden group block transition-all hover:-translate-y-2"
      style={{ 
        border: `3px solid #2d2d2d`,
        boxShadow: '3px 4px 0px rgba(45,45,45,0.8), 6px 8px 0px rgba(45,45,45,0.1)'
      }}
    >
      {item.image ? (
        <div className="aspect-video overflow-hidden" style={{ borderBottom: '3px solid #2d2d2d' }}>
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div 
          className="aspect-video flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #f5f3ed 0%, #e8e4d9 100%)',
            borderBottom: '3px solid #2d2d2d'
          }}
        >
          <div className="text-5xl bounce-hand">{getDefaultEmoji()}</div>
        </div>
      )}
      <div className="p-5">
        <span 
          className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${typeStyle.bg} ${typeStyle.text}`}
          style={{ 
            border: `2px solid ${typeStyle.borderColor}`,
            boxShadow: '1px 2px 0px rgba(45,45,45,0.5)'
          }}
        >
          {typeStyle.label}
        </span>
        <h3 className="text-lg font-bold text-[#2d2d2d] mb-2 leading-snug wowoo-heading">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-[#5a5a5a] line-clamp-2 mb-4">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={item.author?.avatar || defaultAvatar}
              alt={item.author?.nickname || 'user'}
              className="w-7 h-7 rounded-full bg-[#f5f3ed]"
              style={{ border: '2px solid #2d2d2d', boxShadow: '1px 1px 0px rgba(45,45,45,0.8)' }}
            />
            <span className="text-sm text-[#5a5a5a]">{item.author?.nickname || 'Anonymous'}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-[#8b7355]">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              {item.likes || 0}
            </span>
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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