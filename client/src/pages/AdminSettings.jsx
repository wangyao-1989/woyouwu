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
    checkLogo();
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
      const res = await axios.post('/api/admin/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600 mt-2">管理网站的基本设置</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">网站Logo</h2>
          <p className="text-gray-600 mb-4">上传您的网站Logo，建议尺寸为200x200像素</p>
          
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">当前Logo：</p>
            <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              {currentLogo ? (
                <img src={currentLogo} alt="当前Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-gray-400 text-sm">暂无Logo</span>
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
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
              <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={preview} alt="预览" className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '上传中...' : '上传Logo'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">其他设置</h2>
          <p className="text-gray-600">更多系统设置功能开发中...</p>
        </div>

        <div className="mt-6">
          <Link to="/profile" className="text-primary-600 hover:text-primary-700">
            ← 返回个人资料
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
