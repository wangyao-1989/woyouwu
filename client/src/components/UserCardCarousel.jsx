import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

function UserCardCarousel({ users, className }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitX, setExitX] = useState(0);

  if (!users || users.length === 0) return null;

  const goTo = (index) => {
    setCurrentIndex(((index % users.length) + users.length) % users.length);
  };

  const goNext = () => goTo(currentIndex + 1);
  const goPrev = () => goTo(currentIndex - 1);

  const handleDragEnd = (event, info) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % users.length);
        setExitX(0);
      }, 200);
    }
  };

  return (
    <div className={cn('w-full flex items-center justify-center', className)}>
      <div className="relative w-80 h-96">
        {users.map((user, index) => {
          const isCurrentCard = index === currentIndex;
          const isPrevCard = index === (currentIndex + 1) % users.length;
          const isNextCard = index === (currentIndex + 2) % users.length;

          if (!isCurrentCard && !isPrevCard && !isNextCard) return null;

          return (
            <motion.div
              key={user._id}
              className={cn(
                'absolute w-full h-full rounded-2xl overflow-hidden',
                'cursor-grab active:cursor-grabbing',
                'bg-white shadow-xl',
                isCurrentCard ? '' : 'pointer-events-none'
              )}
              style={{ zIndex: isCurrentCard ? 3 : isPrevCard ? 2 : 1 }}
              drag={isCurrentCard ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={isCurrentCard ? handleDragEnd : undefined}
              initial={{
                scale: 0.95,
                opacity: 0,
                y: isCurrentCard ? 0 : isPrevCard ? 12 : 24,
                rotate: isCurrentCard ? 0 : isPrevCard ? -2 : -4,
              }}
              animate={{
                scale: isCurrentCard ? 1 : 0.95,
                opacity: isCurrentCard ? 1 : isPrevCard ? 0.5 : 0.2,
                x: isCurrentCard ? exitX : 0,
                y: isCurrentCard ? 0 : isPrevCard ? 12 : 24,
                rotate: isCurrentCard ? exitX / 20 : isPrevCard ? -2 : -4,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* 箭头 */}
              {isCurrentCard && (
                <>
                  <button
                    onClick={(e) => { e.preventDefault(); goPrev(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow text-gray-500 hover:text-gray-800 transition"
                  >
                    &#8592;
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); goNext(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow text-gray-500 hover:text-gray-800 transition"
                  >
                    &#8594;
                  </button>
                </>
              )}

              <Link to={`/profile/${user._id}`} className="block h-full p-6">
                {/* 背景渐变色条 */}
                <div className="h-16 bg-gradient-to-r from-[#C47A5A] to-[#D4A853] rounded-t-xl -mx-6 -mt-6 mb-0">
                  {user.background && (
                    <img src={user.background} alt="" className="w-full h-full object-cover rounded-t-xl" />
                  )}
                </div>

                {/* 头像 */}
                <div className="flex justify-center -mt-10 mb-3">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                    alt={user.nickname}
                    className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-gray-200 object-cover"
                  />
                </div>

                {/* 名字 + 用户名 */}
                <div className="text-center mb-2">
                  <h3 className="font-semibold text-gray-800 text-lg truncate px-4">{user.nickname}</h3>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                </div>

                {/* 简介 */}
                {user.bio && (
                  <p className="text-center text-sm text-gray-500 line-clamp-2 mb-2 px-2">{user.bio}</p>
                )}

                {/* 地区 */}
                {user.location && (
                  <div className="flex justify-center mb-2">
                    <span className="text-xs text-gray-400 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {user.location}
                    </span>
                  </div>
                )}

                {/* 技能标签 */}
                {user.skills && user.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {user.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#F7F5F2] text-[#8B7355] text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {user.skills.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-xs rounded-full">
                        +{user.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}

        {/* 底部圆点 */}
        {users.length > 1 && (
          <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2">
            {users.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-[#8B7355] w-4'
                    : 'bg-gray-300 hover:bg-gray-400'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCardCarousel;
