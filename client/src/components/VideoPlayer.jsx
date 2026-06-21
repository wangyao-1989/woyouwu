import { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

/**
 * 视频播放组件（基于 xgplayer）
 *
 * Props:
 *   fileId     - 云点播 VOD 媒资 fileId（有则走「点击播放」模式，节省流量）
 *   playUrl    - 直接播放地址（本地/直链视频，立即加载）
 *   coverUrl   - 封面图 URL
 *   autoplay   - 是否自动播放，默认 false
 *   width      - 宽度
 *   height     - 高度
 *   className  - 额外的 CSS class
 */
function VideoPlayer({
  fileId,
  playUrl: directPlayUrl,
  coverUrl,
  autoplay = false,
  width,
  height,
  className = '',
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolvedUrl, setResolvedUrl] = useState(!fileId ? (directPlayUrl || '') : '');
  const [resolvedCover, setResolvedCover] = useState(coverUrl || '');

  // 云点播视频：需要用户主动点击才加载
  const isVodVideo = !!fileId;

  // ===== 云点播：点击播放 =====
  const handleVodClick = useCallback(async () => {
    if (!fileId || loading || resolvedUrl) return;
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`/api/vod/play-url/${fileId}`);
      if (res.data.code === 0 && res.data.data) {
        setResolvedUrl(res.data.data.playUrl);
        if (res.data.data.coverUrl && !coverUrl) {
          setResolvedCover(res.data.data.coverUrl);
        }
      } else {
        setError(res.data.message || '获取播放地址失败');
      }
    } catch (err) {
      setError('获取播放地址失败');
    } finally {
      setLoading(false);
    }
  }, [fileId, loading, resolvedUrl, coverUrl]);

  // ===== 初始化播放器 =====
  useEffect(() => {
    if (!resolvedUrl) return;
    if (!containerRef.current) return;

    const initPlayer = async () => {
      try {
        const XgPlayer = (await import('xgplayer')).default;

        // 确保之前播放器已销毁
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        const player = new XgPlayer({
          id: containerRef.current.id || 'xgplayer-container',
          el: containerRef.current,
          url: resolvedUrl,
          poster: resolvedCover || '',
          autoplay: isVodVideo ? true : autoplay,  // 云点播点击后自动播放
          playsinline: true,
          width: width || '100%',
          height: height || '100%',
          controls: true,
          playbackRate: [0.5, 0.75, 1, 1.25, 1.5, 2],
          videoConfig: {
            crossOrigin: 'anonymous',
          },
          keyShortcut: 'on',
          volume: 0.7,
          thumbnail: null,
        });

        playerRef.current = player;

        player.on('error', (err) => {
          console.error('Video player error:', err);
          setError('视频播放失败，请稍后重试');
        });
      } catch (err) {
        console.error('Failed to initialize player:', err);
        setError('播放器初始化失败');
        setLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // 忽略销毁错误
        }
        playerRef.current = null;
      }
    };
  }, [resolvedUrl, resolvedCover, isVodVideo, autoplay, width, height]);

  // ===== 无播放地址 =====
  if (!fileId && !directPlayUrl) {
    return (
      <div className={`relative bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center ${className}`}
        style={{ aspectRatio: '16/9', width: width || '100%' }}
      >
        <p className="text-gray-400 text-sm">暂无视频</p>
      </div>
    );
  }

  // ===== 云点播：展示封面 + 播放按钮（等待点击） =====
  if (isVodVideo && !resolvedUrl) {
    return (
      <div
        className={`relative bg-black rounded-xl overflow-hidden cursor-pointer group ${className}`}
        style={{ aspectRatio: '16/9', width: width || '100%' }}
        onClick={handleVodClick}
      >
        {/* 封面图 */}
        {resolvedCover ? (
          <img
            src={resolvedCover}
            alt="视频封面"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
        )}

        {/* 播放按钮遮罩 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          {loading ? (
            <div className="animate-spin rounded-full h-14 w-14 border-3 border-white/30 border-t-white" />
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-3">
                <svg className="w-7 h-7 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-white text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                点击播放视频
              </span>
            </>
          )}
        </div>

        {error && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-red-500/90 text-white text-sm text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ===== 错误状态 =====
  if (error) {
    return (
      <div className={`relative bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center ${className}`}
        style={{ aspectRatio: '16/9', width: width || '100%' }}
      >
        <div className="text-center p-6">
          <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const containerId = `xgplayer-${fileId || Math.random().toString(36).slice(2)}`;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-black ${className}`}
      style={{ aspectRatio: width && height ? 'auto' : '16/9', width: width || '100%' }}
    >
      <div
        ref={containerRef}
        id={containerId}
        className="w-full h-full"
      />
    </div>
  );
}

export default VideoPlayer;
