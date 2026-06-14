import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// API类型名称映射
const API_TYPE_NAMES = {
  aiChat: '宠物聊天',
  newsGeneration: '资讯生成',
  resumeParse: '简历解析',
  mbtiAvatar: 'MBTI头像生成'
};

function AdminSettings() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const fileInputRef = useRef(null);
  
  const [selectedMBTIType, setSelectedMBTIType] = useState('INTJ');
  const [mbtiSex, setMbtiSex] = useState('male'); // 'male' | 'female'
  const [selectedMBTIFile, setSelectedMBTIFile] = useState(null);
  const [mbtiPreview, setMbtiPreview] = useState(null);
  const [uploadingMBTI, setUploadingMBTI] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedType, setUploadedType] = useState('');
  const mbtiFileInputRef = useRef(null);
  const mbtiExtCache = useRef({}); // 缓存每个 type-sex 的有效扩展名

  const getMbtiUrl = (type, sex) => {
     const key = `${type}-${sex}`;
     const ext = mbtiExtCache.current[key] || 'png';
     return `/uploads/mbti-avatars/${type.toLowerCase()}-${sex}.${ext}`;
   };

  const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];

  const [externalApis, setExternalApis] = useState({
    aiChat: true,
    newsGeneration: true,
    resumeParse: true,
    mbtiAvatar: true,
    textToImage: true,
  });
  const [externalApiConfig, setExternalApiConfig] = useState({
    aiChat: { apiKey: '', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    newsGeneration: { apiKey: '', endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', model: 'doubao-seed-2-0-pro-260215' },
    resumeParse: { apiKey: '', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    textToImage: { apiKey: '', endpoint: 'https://tokenhub.tencentmaas.com/v1/api/image/submit', model: 'hy-image-v3.0' },
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const initialApisRef = useRef(null);
  const initialConfigRef = useRef(null);

  const hasChanges = (() => {
    if (!initialApisRef.current || !initialConfigRef.current) return false;
    if (JSON.stringify(externalApis) !== JSON.stringify(initialApisRef.current)) return true;
    if (JSON.stringify(externalApiConfig) !== JSON.stringify(initialConfigRef.current)) return true;
    return false;
  })();

  // API使用统计相关state
  const [apiUsageStats, setApiUsageStats] = useState([]);
  const [modelStats, setModelStats] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsDateRange, setStatsDateRange] = useState({
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    const checkLogo = async () => {
      try {
        const response = await axios.head('/api/admin/logo');
        if (response.status === 200) {
          setCurrentLogo(`/uploads/logo.png?t=${Date.now()}`);
        }
      } catch (error) {
        setCurrentLogo(null);
      }
    };
    
    const loadSettings = async () => {
      try {
        const res = await axios.get('/api/admin/settings');
        setExternalApis(res.data.settings.externalApis || {
          aiChat: true,
          newsGeneration: true,
          resumeParse: true,
          mbtiAvatar: true,
          textToImage: true,
        });
        setExternalApiConfig(res.data.settings.externalApiConfig || {
          aiChat: { apiKey: '', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
          newsGeneration: { apiKey: '', endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', model: 'doubao-seed-2-0-pro-260215' },
          resumeParse: { apiKey: '', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
          textToImage: { apiKey: '', endpoint: 'https://tokenhub.tencentmaas.com/v1/api/image/submit', model: 'hy-image-v3.0' },
        });

        initialApisRef.current = { ...res.data.settings.externalApis };
        initialConfigRef.current = JSON.parse(JSON.stringify(res.data.settings.externalApiConfig));
      } catch (error) {
        console.error('加载设置失败:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    
    checkLogo();
    loadSettings();
    loadStats();
  }, []);

  // 加载API使用统计
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const params = {};
      if (statsDateRange.startDate) params.startDate = statsDateRange.startDate;
      if (statsDateRange.endDate) params.endDate = statsDateRange.endDate;
      
      const res = await axios.get('/api/admin/api-usage/stats', { params });
      setApiUsageStats(res.data.stats);
      setModelStats(res.data.modelStats || []);
      setDailyStats(res.data.dailyStats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const isVideo = file.type.startsWith('video/');
      setIsVideoFile(isVideo);

      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        const url = URL.createObjectURL(file);
        video.onloadeddata = () => { video.currentTime = 0.5; };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          setPreview(canvas.toDataURL('image/jpeg', 0.9));
          URL.revokeObjectURL(url);
        };
        video.src = url;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('请选择要上传的图片或视频');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData();

    if (selectedFile.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      const videoUrl = URL.createObjectURL(selectedFile);

      try {
        await new Promise((resolve, reject) => {
          video.onloadeddata = () => { video.currentTime = 0.5; };
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error('视频加载失败'));
          video.src = videoUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        formData.append('logo', blob, 'logo.png');
        URL.revokeObjectURL(videoUrl);
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        setMessage('视频帧提取失败: ' + err.message);
        setMessageType('error');
        setUploading(false);
        return;
      }
    } else {
      formData.append('logo', selectedFile);
    }

    try {
      const res = await axios.post('/api/admin/upload-logo', formData);

      setMessage(res.data.message || 'Logo上传成功！');
      setMessageType('success');
      setCurrentLogo(`/uploads/logo.png?t=${Date.now()}`);
      setSelectedFile(null);
      setPreview(null);
      setIsVideoFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Logo上传失败');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const handleMBTIFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMBTIFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMBTIPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMBTIUpload = async () => {
    if (!selectedMBTIFile) {
      setMessage('请选择要上传的MBTI头像图片');
      setMessageType('error');
      return;
    }

    setUploadingMBTI(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData();
    formData.append('avatar', selectedMBTIFile);
    formData.append('mbti', selectedMBTIType);
    formData.append('sex', mbtiSex);

    try {
      const res = await axios.post('/api/admin/upload-mbti-avatar-single', formData);

      setMessage(res.data.message || 'MBTI头像上传成功！');
      setMessageType('success');
      setUploadSuccess(true);
      setUploadedType(selectedMBTIType);
      setSelectedMBTIFile(null);
      setMBTIPreview(null);
      if (mbtiFileInputRef.current) {
        mbtiFileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'MBTI头像上传失败');
      setMessageType('error');
    } finally {
      setUploadingMBTI(false);
    }
  };

  const handleApiToggle = (key) => {
    setExternalApis(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      const res = await axios.put('/api/admin/settings', {
        externalApis,
        externalApiConfig,
      });
      setMessage(res.data.message || '设置保存成功！');
      setMessageType('success');
      initialApisRef.current = { ...externalApis };
      initialConfigRef.current = JSON.parse(JSON.stringify(externalApiConfig));
    } catch (error) {
      setMessage(error.response?.data?.message || '设置保存失败');
      setMessageType('error');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-[#F5F0E8] ">
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 heading-md ">系统设置</h1>
          <p className="text-gray-600 mt-2">管理网站的基本设置</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 sketch-border-sm border-2 ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">网站Logo</h2>
          <p className="text-gray-600 mb-4">上传您的网站Logo，支持图片和视频（视频将自动提取首帧），建议尺寸为200x200像素</p>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">当前Logo：</p>
            <div className="w-32 h-32 bg-[#F0E8DD] rounded-xl flex items-center justify-center overflow-hidden">
              {currentLogo ? (
                <img src={currentLogo} alt="当前Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[#B8A899] text-sm">暂无Logo</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">选择新Logo：</p>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/mp4,video/webm,video/ogg"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-btn px-4 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200 transition-colors"
              >
                选择图片
              </button>
              {selectedFile && (
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
              )}
            </div>
          </div>

          {preview && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">预览：</p>
              <div className="w-32 h-32 bg-[#F0E8DD] rounded-xl flex items-center justify-center overflow-hidden">
                <img src={preview} alt="预览" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="rounded-btn px-6 py-3 bg-warm-900 text-white font-medium hover:bg-warm-700 transition-colors shadow-sketch disabled:opacity-50 disabled:cursor-not-allowed wobble"
          >
            {uploading ? '上传中...' : '上传Logo'}
          </button>
        </div>

        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">MBTI 性格头像</h2>
          <p className="text-gray-600 mb-4">选择 MBTI 类型，上传对应头像（200×200，自动裁剪）</p>
          
          {/* 类型选择器 */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">选择类型：</p>
            <div className="grid grid-cols-8 gap-1.5 mb-4">
              {MBTI_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => { setSelectedMBTIType(type); setUploadSuccess(false); setUploadedType(''); }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedMBTIType === type
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 性别选择 */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">头像性别：</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMbtiSex('male')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mbtiSex === 'male'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                👨 男生
              </button>
              <button
                onClick={() => setMbtiSex('female')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  mbtiSex === 'female'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                👩 女生
              </button>
            </div>
          </div>

          {/* 当前头像预览 */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {selectedMBTIType} 当前头像：
            </p>
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-20 h-20 bg-[#F0E8DD] rounded-xl flex items-center justify-center overflow-hidden border-2 ${mbtiSex === 'male' ? 'border-blue-400' : 'border-gray-100'}`}>
                  <img 
                    src={getMbtiUrl(selectedMBTIType, 'male')}
                    alt={`${selectedMBTIType}男`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const key = `${selectedMBTIType}-male`;
                      if (mbtiExtCache.current[key] !== 'gif') {
                        mbtiExtCache.current[key] = 'gif';
                        e.currentTarget.src = `/uploads/mbti-avatars/${selectedMBTIType.toLowerCase()}-male.gif`;
                      } else {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <span className="text-gray-400 text-[10px] hidden">无</span>
                </div>
                <span className="text-[10px] text-gray-400">男</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-20 h-20 bg-[#F0E8DD] rounded-xl flex items-center justify-center overflow-hidden border-2 ${mbtiSex === 'female' ? 'border-pink-400' : 'border-gray-100'}`}>
                  <img 
                    src={getMbtiUrl(selectedMBTIType, 'female')}
                    alt={`${selectedMBTIType}女`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const key = `${selectedMBTIType}-female`;
                      if (mbtiExtCache.current[key] !== 'gif') {
                        mbtiExtCache.current[key] = 'gif';
                        e.currentTarget.src = `/uploads/mbti-avatars/${selectedMBTIType.toLowerCase()}-female.gif`;
                      } else {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <span className="text-gray-400 text-[10px] hidden">无</span>
                </div>
                <span className="text-[10px] text-gray-400">女</span>
              </div>
            </div>
          </div>

          {/* 上传区域 */}
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={mbtiFileInputRef}
                accept="image/*"
                onChange={handleMBTIFileChange}
                className="hidden"
              />
              <button
                onClick={() => mbtiFileInputRef.current?.click()}
                className="rounded-btn px-4 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200 transition-colors"
              >
                选择图片
              </button>
              {selectedMBTIFile && (
                <span className="text-sm text-gray-600">{selectedMBTIFile.name}</span>
              )}
            </div>
          </div>

          {mbtiPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">新图片预览：</p>
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-100">
                <img src={mbtiPreview} alt="预览" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <button
            onClick={handleMBTIUpload}
            disabled={!selectedMBTIFile || uploadingMBTI}
            className="rounded-btn px-6 py-3 bg-warm-900 text-white font-medium hover:bg-warm-700 transition-colors shadow-sketch disabled:opacity-50 disabled:cursor-not-allowed wobble"
          >
            {uploadingMBTI ? '上传中...' : `上传 ${selectedMBTIType} ${mbtiSex === 'male' ? '男' : '女'} 头像`}
          </button>

          {/* 全部预览 */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">全部 16 种类型（{mbtiSex === 'male' ? '男' : '女'}）：</p>
            <div className="grid grid-cols-8 gap-2">
              {MBTI_TYPES.map((type) => (
                <div key={type} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 bg-[#F0E8DD] rounded-lg flex items-center justify-center overflow-hidden border-2 ${uploadedType === type ? 'border-green-500' : 'border-transparent'} ${selectedMBTIType === type ? 'ring-2 ring-gray-400' : ''}`}>
                    <img 
                      src={getMbtiUrl(type, mbtiSex)}
                      alt={`${type}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const key = `${type}-${mbtiSex}`;
                        if (mbtiExtCache.current[key] !== 'gif') {
                          mbtiExtCache.current[key] = 'gif';
                          e.currentTarget.src = `/uploads/mbti-avatars/${type.toLowerCase()}-${mbtiSex}.gif`;
                        } else {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.classList.add('bg-gray-100');
                        }
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">外部API功能开关</h2>
          <p className="text-gray-600 mb-6">控制网站各项外部API功能的开启与关闭</p>
          
          {loadingSettings ? (
            <div className="text-center py-4 text-gray-500">加载设置中...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">宠物聊天</h3>
                  <p className="text-sm text-gray-600">AI宠物聊天功能，使用外部AI服务</p>
                  {externalApiConfig.aiChat && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={externalApiConfig.aiChat.apiKey || ''}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, aiChat: { ...prev.aiChat, apiKey: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Key（留空使用全局Key）"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.aiChat.endpoint}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, aiChat: { ...prev.aiChat, endpoint: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Endpoint"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.aiChat.model}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, aiChat: { ...prev.aiChat, model: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="模型名称"
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={externalApis.aiChat}
                    onChange={() => handleApiToggle('aiChat')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-900"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">资讯生成</h3>
                  <p className="text-sm text-gray-600">AI新闻资讯生成功能</p>
                  {externalApiConfig.newsGeneration && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={externalApiConfig.newsGeneration.apiKey || ''}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, newsGeneration: { ...prev.newsGeneration, apiKey: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Key（留空使用全局Key）"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.newsGeneration.endpoint}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, newsGeneration: { ...prev.newsGeneration, endpoint: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Endpoint"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.newsGeneration.model}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, newsGeneration: { ...prev.newsGeneration, model: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="模型名称"
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={externalApis.newsGeneration}
                    onChange={() => handleApiToggle('newsGeneration')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-900"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">简历解析</h3>
                  <p className="text-sm text-gray-600">AI简历解析与生成功能</p>
                  {externalApiConfig.resumeParse && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={externalApiConfig.resumeParse.apiKey || ''}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, resumeParse: { ...prev.resumeParse, apiKey: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Key（留空使用全局Key）"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.resumeParse.endpoint}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, resumeParse: { ...prev.resumeParse, endpoint: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Endpoint"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.resumeParse.model}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, resumeParse: { ...prev.resumeParse, model: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="模型名称"
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={externalApis.resumeParse}
                    onChange={() => handleApiToggle('resumeParse')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-900"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">文生图</h3>
                  <p className="text-sm text-gray-600">AI文生图功能，根据文字描述生成图片</p>
                  {externalApiConfig.textToImage && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={externalApiConfig.textToImage.apiKey || ''}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, textToImage: { ...prev.textToImage, apiKey: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Key"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.textToImage.endpoint}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, textToImage: { ...prev.textToImage, endpoint: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="API Endpoint"
                      />
                      <input
                        type="text"
                        value={externalApiConfig.textToImage.model}
                        onChange={(e) => setExternalApiConfig(prev => ({ ...prev, textToImage: { ...prev.textToImage, model: e.target.value } }))}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono"
                        placeholder="模型名称（如 dall-e-3）"
                      />
                    </div>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={externalApis.textToImage}
                    onChange={() => handleApiToggle('textToImage')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-900"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-800">MBTI头像生成</h3>
                  <p className="text-sm text-gray-600">AI逐个生成16种MBTI头像</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={externalApis.mbtiAvatar}
                    onChange={() => handleApiToggle('mbtiAvatar')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-900"></div>
                </label>
              </div>
              
              <button
                onClick={handleSaveSettings}
                disabled={!hasChanges || loadingSettings}
                className="mt-6 rounded-btn px-6 py-3 bg-warm-900 text-white font-medium hover:bg-warm-700 transition-colors shadow-sketch disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {!hasChanges ? '未修改' : '保存设置'}
              </button>
            </div>
          )}
        </div>

        {/* API使用统计卡片 */}
        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">API Token使用统计</h2>
          
          {/* 日期范围选择 */}
          <div className="mb-6 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={statsDateRange.startDate || ''}
                onChange={(e) => setStatsDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={statsDateRange.endDate || ''}
                onChange={(e) => setStatsDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900"
              />
            </div>
            <button
              onClick={loadStats}
              className="rounded-btn px-4 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200 transition-colors"
            >
              刷新统计
            </button>
          </div>
          
          {loadingStats ? (
            <div className="text-center py-8 text-gray-500">加载统计数据中...</div>
          ) : apiUsageStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无API使用数据</div>
          ) : (
            <>
              {/* 总体统计 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {apiUsageStats.map((stat) => (
                  <div key={stat._id} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">{API_TYPE_NAMES[stat._id]}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">总调用次数: <span className="font-semibold">{stat.totalCalls}</span></p>
                      <p className="text-gray-600">成功次数: <span className="font-semibold text-green-600">{stat.successCalls}</span></p>
                      <p className="text-gray-600">失败次数: <span className="font-semibold text-red-600">{stat.failedCalls}</span></p>
                      <p className="text-gray-600">输入Token: <span className="font-semibold">{stat.totalPromptTokens?.toLocaleString()}</span></p>
                      <p className="text-gray-600">输出Token: <span className="font-semibold">{stat.totalCompletionTokens?.toLocaleString()}</span></p>
                      <p className="text-gray-600 text-warm-900 font-semibold border-t pt-2 mt-2">总Token: {stat.totalTokens?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 模型使用分布 */}
              {modelStats.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-medium text-gray-800 mb-4">模型使用分布</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-600">API类型</th>
                          <th className="text-left py-2 px-3 text-gray-600">模型</th>
                          <th className="text-left py-2 px-3 text-gray-600">调用次数</th>
                          <th className="text-left py-2 px-3 text-gray-600">总Token</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modelStats.map((stat, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3">{API_TYPE_NAMES[stat._id.apiType] || stat._id.apiType}</td>
                            <td className="py-2 px-3 font-mono text-xs">{stat._id.model}</td>
                            <td className="py-2 px-3">{stat.totalCalls}</td>
                            <td className="py-2 px-3">{stat.totalTokens?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* 每日趋势 */}
              {dailyStats.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-4">每日Token使用趋势</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-600">日期</th>
                          <th className="text-left py-2 px-3 text-gray-600">API类型</th>
                          <th className="text-left py-2 px-3 text-gray-600">调用次数</th>
                          <th className="text-left py-2 px-3 text-gray-600">总Token</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyStats.map((stat, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3">{stat._id.date}</td>
                            <td className="py-2 px-3">{API_TYPE_NAMES[stat._id.apiType]}</td>
                            <td className="py-2 px-3">{stat.totalCalls}</td>
                            <td className="py-2 px-3">{stat.totalTokens?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6">
          <Link to="/profile" className="text-warm-900 hover:text-warm-700">
            ← 返回个人资料
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
