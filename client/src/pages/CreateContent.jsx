import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateContent() {
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('available');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!type) {
      alert('请选择内容类型');
      return;
    }

    if (!content.trim()) {
      alert('请输入内容');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', type);
      if (title) formData.append('title', title);
      formData.append('content', content);
      if (link) formData.append('link', link);
      if (category) formData.append('category', category);
      if (status) formData.append('status', status);
      formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t)));

      images.forEach(image => {
        formData.append('images', image);
      });

      const res = await axios.post('/api/contents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('发布成功！');
      navigate('/');
    } catch (error) {
      console.error('Failed to create content:', error);
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🎨 发布内容
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                选择内容类型 *
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setType('achievement')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === 'achievement'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-2">✨</div>
                  <div className="font-medium">个人成果</div>
                  <div className="text-xs text-gray-500 mt-1">网页/文章/项目</div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('inspiration')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === 'inspiration'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-3xl mb-2">💡</div>
                  <div className="font-medium">瞬间灵感</div>
                  <div className="text-xs text-gray-500 mt-1">想法/创意/灵感</div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('item')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === 'item'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-3xl mb-2">🎁</div>
                  <div className="font-medium">闲置物品</div>
                  <div className="text-xs text-gray-500 mt-1">赠送/交换/借用</div>
                </button>
              </div>
            </div>

            {type === 'achievement' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作品标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="给你的作品起个名字"
                />
              </div>
            )}

            {type === 'item' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物品名称
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="物品名称"
                />
              </div>
            )}

            {type === 'inspiration' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  灵感内容 *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={4}
                  placeholder="记录下你的灵感..."
                />
              </div>
            )}

            {(type === 'achievement' || type === 'item') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细描述 *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={6}
                  placeholder={
                    type === 'achievement' 
                      ? "介绍你的作品..." 
                      : "描述你的物品..."
                  }
                />
              </div>
            )}

            {type === 'achievement' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  链接地址
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
              </div>
            )}

            {type === 'item' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  物品状态
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="available">🟢 可用/可赠送</option>
                  <option value="given">🔵 已送出</option>
                  <option value="exchanged">🟡 交换中</option>
                  <option value="borrowed">🔴 已借出</option>
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签（用逗号分隔）
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="前端, React, 项目"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传图片
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">点击上传图片</p>
                  <p className="text-sm text-gray-400 mt-1">支持多张图片</p>
                </label>
              </div>

              {previewImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt="" className="w-full h-24 object-cover rounded-lg" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
            >
              {loading ? '发布中...' : '✨ 发布内容'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateContent;