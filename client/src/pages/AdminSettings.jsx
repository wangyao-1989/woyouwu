import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function AdminSettings() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const fileInputRef = useRef(null);
  
  const [selectedMBTIFile, setSelectedMBTIFile] = useState(null);
  const [mbtiPreview, setMBTIPreview] = useState(null);
  const [currentMBTIAvatar, setCurrentMBTIAvatar] = useState(null);
  const [uploadingMBTI, setUploadingMBTI] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const mbtiFileInputRef = useRef(null);

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
    
    const checkMBTIAvatar = async () => {
      try {
        const response = await axios.head('/api/admin/mbti-avatar');
        if (response.status === 200) {
          setCurrentMBTIAvatar(`/uploads/mbti-avatars.jpg?t=${Date.now()}`);
        }
      } catch (error) {
        setCurrentMBTIAvatar(null);
      }
    };
    
    checkLogo();
    checkMBTIAvatar();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('请选择要上传的图片');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData();
    formData.append('logo', selectedFile);

    try {
      const res = await axios.post('/api/admin/upload-logo', formData);

      setMessage(res.data.message || 'Logo上传成功！');
      setMessageType('success');
      setCurrentLogo(`/uploads/logo.png?t=${Date.now()}`);
      setSelectedFile(null);
      setPreview(null);
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

    try {
      const res = await axios.post('/api/admin/upload-mbti-avatar', formData);

      setMessage(res.data.message || 'MBTI头像上传成功！');
      setMessageType('success');
      setUploadSuccess(true);
      setCurrentMBTIAvatar(`/uploads/mbti-avatars.jpg?t=${Date.now()}`);
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

  return (
    <div className="min-h-screen bg-[#F5F0E8] ">
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
          <p className="text-gray-600 mb-4">上传您的网站Logo，建议尺寸为200x200像素</p>
          
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
                accept="image/*"
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
          <h2 className="text-xl font-semibold text-gray-800 mb-4">MBTI测试头像</h2>
          <p className="text-gray-600 mb-4">上传4×4网格的MBTI头像图片（16种类型）</p>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">当前头像：</p>
            <div className="w-32 h-32 bg-[#F0E8DD] rounded-xl flex items-center justify-center overflow-hidden">
              {currentMBTIAvatar ? (
                <img src={currentMBTIAvatar} alt="当前MBTI头像" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[#B8A899] text-sm">暂无头像</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">选择新头像：</p>
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
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">预览：</p>
              <div className="w-32 h-32 bg-[#F0E8DD] rounded-xl flex items-center justify-center overflow-hidden">
                <img src={mbtiPreview} alt="预览" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          <button
            onClick={handleMBTIUpload}
            disabled={!selectedMBTIFile || uploadingMBTI}
            className="rounded-btn px-6 py-3 bg-warm-900 text-white font-medium hover:bg-warm-700 transition-colors shadow-sketch disabled:opacity-50 disabled:cursor-not-allowed wobble"
          >
            {uploadingMBTI ? '上传中...' : '上传MBTI头像'}
          </button>

          {uploadSuccess && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">裁剪后的16个头像预览：</h3>
              <div className="grid grid-cols-4 gap-4">
                {['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].map((type) => (
                  <div key={type} className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-[#F0E8DD] rounded-xl flex items-center justify-center overflow-hidden">
                      <img 
                        src={`/api/admin/mbti-avatar/${type}?t=${Date.now()}`} 
                        alt={type} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="mt-2 text-sm font-medium text-gray-700">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">其他设置</h2>
          <p className="text-gray-600">更多系统设置功能开发中...</p>
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
