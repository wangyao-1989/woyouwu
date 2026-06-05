import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

// VOD 上传 SDK - 动态加载以减小包体积
let TcVod = null;

/**
 * 视频上传组件
 * 使用腾讯云 VOD 上传 SDK 上传视频文件
 * 
 * Props:
 *   onUploadSuccess({ fileId, videoUrl, coverUrl }) - 上传成功回调
 *   onUploadError(error) - 上传失败回调
 *   onUploadStart() - 上传开始回调
 *   existingVideo - 已有的视频信息 { fileId, videoUrl }
 *   accept - 允许的文件类型，默认 video/*
 */
function VideoUploader({
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  existingVideo,
  accept = 'video/*',
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState(existingVideo || null);
  const [error, setError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef(null);
  const uploaderRef = useRef(null);

  // 加载 VOD 上传 SDK
  const loadVodSdk = useCallback(async () => {
    if (TcVod) return TcVod;
    try {
      const module = await import('vod-js-sdk-v6');
      TcVod = module.default;
      return TcVod;
    } catch (err) {
      // 如果 npm 包加载失败，从 CDN 加载
      console.warn('Failed to load vod-js-sdk-v6 from npm, trying CDN');
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn-go.cn/vod-js-sdk-v6/latest/vod-js-sdk-v6.min.js';
        script.onload = () => {
          TcVod = window.TcVod;
          resolve(TcVod);
        };
        script.onerror = () => reject(new Error('视频上传SDK加载失败'));
        document.head.appendChild(script);
      });
    }
  }, []);

  // 获取上传签名
  const getUploadSignature = useCallback(async () => {
    const res = await axios.get('/api/vod/upload-signature');
    if (res.data.code !== 0) {
      throw new Error(res.data.message || '获取上传签名失败');
    }
    return res.data.data.signature;
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（VOD 限制最大 60GB，这里限制 2GB 更合理）
    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError('视频文件不能超过 2GB');
      return;
    }

    // 检查文件类型
    if (!file.type.startsWith('video/')) {
      setError('请选择视频文件');
      return;
    }

    setError('');
    setSelectedFileName(file.name);
    setProgress(0);
    setUploading(true);
    onUploadStart?.();

    try {
      const VOD = await loadVodSdk();

      // 获取上传签名
      const signature = await getUploadSignature();

      // 创建 VOD 实例
      const vodInstance = new VOD({
        getSignature: () => Promise.resolve(signature),
      });

      // 初始化上传器（内部自动调用 .start()）
      const uploader = vodInstance.upload({
        videoFile: file,
      });

      uploaderRef.current = uploader;

      // 监听上传进度（SDK 使用 EventEmitter 模式）
      uploader.on('video_progress', (data) => {
        const percent = data.percent ? Math.round(data.percent * 100) : 0;
        setProgress(percent);
      });

      // 等待上传完成（使用 done() promise 而非回调参数）
      const result = await uploader.done();

      setUploading(false);

      const fileId = result.fileId || '';
      const videoUrl = result.video?.url || '';
      const coverUrl = result.cover?.url || '';

      if (!fileId) {
        const errMsg = '上传完成但未获取到 fileId';
        setError(errMsg);
        onUploadError?.(new Error(errMsg));
        return;
      }

      const info = { fileId, videoUrl, coverUrl, fileName: file.name };
      setVideoInfo(info);
      setProgress(100);
      onUploadSuccess?.(info);
    } catch (err) {
      setUploading(false);
      // 如果是用户取消，不显示错误
      if (err?.message === 'canceled' || err?.code === 'cos_canceled') {
        return;
      }
      const errMsg = err?.message || err?.toString() || '上传失败';
      setError(errMsg);
      onUploadError?.(new Error(errMsg));
    }
  }, [loadVodSdk, getUploadSignature, onUploadStart, onUploadSuccess, onUploadError]);

  // 取消上传
  const handleCancel = useCallback(() => {
    if (uploaderRef.current) {
      uploaderRef.current.cancel();
      uploaderRef.current = null;
    }
    setUploading(false);
    setProgress(0);
    setSelectedFileName('');
  }, []);

  // 移除已上传的视频
  const handleRemove = useCallback(() => {
    setVideoInfo(null);
    setSelectedFileName('');
    setProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // 通知父组件视频已移除
    onUploadSuccess?.(null);
  }, [onUploadSuccess]);

  // 重置组件
  const reset = useCallback(() => {
    setVideoInfo(null);
    setSelectedFileName('');
    setProgress(0);
    setError('');
    setUploading(false);
    uploaderRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 对外暴露方法
  if (typeof window !== 'undefined') {
    window.__videoUploaderRef = { reset, videoInfo };
  }

  return (
    <div className="video-uploader">
      {/* 已上传视频信息 */}
      {videoInfo && !uploading ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">视频已上传</p>
                <p className="text-xs text-green-600 mt-0.5 truncate max-w-[200px]">
                  {videoInfo.fileName || '视频文件'}
                </p>
                {videoInfo.fileId && (
                  <p className="text-xs text-green-500 mt-0.5 font-mono">
                    File ID: {videoInfo.fileId}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-green-600 hover:text-red-500 transition-colors p-1"
              title="移除视频"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : uploading ? (
        /* 上传中 */
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm font-medium text-blue-700">
                正在上传视频...
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-blue-500 mt-2 truncate">{selectedFileName}</p>
          <button
            type="button"
            onClick={handleCancel}
            className="mt-2 text-xs text-blue-600 hover:text-red-500 transition-colors"
          >
            取消上传
          </button>
        </div>
      ) : (
        /* 选择文件 */
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <svg
            className="w-10 h-10 mx-auto text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-600 mb-1">点击选择视频文件</p>
          <p className="text-xs text-gray-400">
            支持 MP4, MOV, AVI, FLV 等格式，最大 2GB
          </p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

export default VideoUploader;
