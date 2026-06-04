import { useRef, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

/**
 * 西瓜播放器 (xgplayer) 视频播放组件
 *
 * Props:
 *   fileId - VOD 媒资 fileId（优先使用，会通过后端 API 获取播放地址）
 *   playUrl - 直接播放地址（如果没有 fileId 则使用此地址）
 *   coverUrl - 封面图 URL
 *   autoplay - 是否自动播放，默认 false
 *   width - 宽度
 *   height - 高度
 *   className - 额外的 CSS class
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvedUrl, setResolvedUrl] = useState(directPlayUrl || '');
  const [resolvedCover, setResolvedCover] = useState(coverUrl || '');

  // 通过 fileId 获取播放地址
  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchPlayUrl = async () => {
      try {
        const res = await axios.get(`/api/vod/play-url/${fileId}`);
        if (cancelled) return;

        if (res.data.code === 0 && res.data.data) {
          setResolvedUrl(res.data.data.playUrl);
          if (res.data.data.coverUrl && !coverUrl) {
            setResolvedCover(res.data.data.coverUrl);
          }
        } else {
          setError(res.data.message || '获取播放地址失败');
        }
      } catch (err) {
        if (!cancelled) {
          setError('获取播放地址失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPlayUrl();
    return () => { cancelled = true; };
  }, [fileId, coverUrl]);

  // 初始化播放器
  useEffect(() => {
    if (loading || !resolvedUrl) return;
    if (!containerRef.current) return;

    const initPlayer = async () => {
      try {
        // 动态导入 xgplayer
        const PlayerModule = await import('xgplayer');
        const Player = PlayerModule.default;

        // 确保之前播放器已销毁
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        const player = new Player({
          id: containerRef.current.id || 'xgplayer-container',
          el: containerRef.current,
          url: resolvedUrl,
          poster: resolvedCover || '',
          autoplay,
          playsinline: true,
          width: width || '100%',
          height: height || '100%',
          controls: true,
          // 倍速播放选项
          playbackRate: [0.5, 0.75, 1, 1.25, 1.5, 2],
          // 允许右键菜单
          contextMenu: {
            enabled: true,
          },
          // 视频旋转/镜像等
          videoConfig: {
            crossOrigin: 'anonymous',
          },
          // 键盘控制
          keyShortcut: 'on',
          // 设置默认音量
          volume: 0.7,
          // 进度条预览
          thumbnail: null,
        });

        playerRef.current = player;

        player.on('error', (err) => {
          console.error('Video player error:', err);
          setError('视频播放失败，请稍后重试');
        });

        player.on('ended', () => {
          // 播放结束
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
  }, [resolvedUrl, resolvedCover, autoplay, loading, width, height]);

  // 加载中
  if (loading) {
    return (
      <div className={`relative bg-black rounded-xl overflow-hidden ${className}`}
        style={{ aspectRatio: '16/9', width: width || '100%' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white" />
        </div>
      </div>
    );
  }

  // 错误状态
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

  // 无播放地址
  if (!resolvedUrl) {
    return (
      <div className={`relative bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center ${className}`}
        style={{ aspectRatio: '16/9', width: width || '100%' }}
      >
        <p className="text-gray-400 text-sm">暂无视频</p>
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
