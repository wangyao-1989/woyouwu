import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const categories = [
  { value: '', label: '请选择分类' },
  { value: '网站', label: '网站' },
  { value: 'App', label: 'App' },
  { value: '设计', label: '设计' },
  { value: '视频', label: '视频' },
  { value: '音乐', label: '音乐' },
  { value: '写作', label: '写作' },
  { value: '其他', label: '其他' },
];

function CreateProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    summary: '',
    content: '',
    link: '',
    video: '',
    videoSource: '原创',
    videoSourceLink: '',
    techTags: '',
    completionDate: '',
    collaborators: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [existingCover, setExistingCover] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`/api/projects/${id}`);
      const project = res.data;
      setFormData({
        title: project.title || '',
        category: project.category || '',
        summary: project.summary || '',
        content: project.content || '',
        link: project.link || '',
        video: project.video || '',
        videoSource: project.videoSource || '原创',
        videoSourceLink: project.videoSourceLink || '',
        techTags: Array.isArray(project.techTags) ? project.techTags.join(', ') : (project.techTags || ''),
        completionDate: project.completionDate ? project.completionDate.slice(0, 10) : '',
        collaborators: Array.isArray(project.collaborators) ? project.collaborators.join(', ') : (project.collaborators || '')
      });
      if (project.cover) {
        setExistingCover(project.cover);
      }
    } catch (error) {
      console.error('Failed to fetch project');
      navigate('/projects');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverFile(file);
    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setExistingCover('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('请输入项目标题');
      return;
    }
    if (!formData.category) {
      setError('请选择项目分类');
      return;
    }
    if (!formData.summary.trim()) {
      setError('请输入项目简介');
      return;
    }
    if (!formData.content.trim()) {
      setError('请输入详细内容');
      return;
    }
    if (formData.video.trim() && formData.videoSource === '转载' && !formData.videoSourceLink.trim()) {
      setError('转载视频请注明原始来源链接，尊重知识产权');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('summary', formData.summary.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('link', formData.link.trim());
      formDataToSend.append('video', formData.video.trim());
      formDataToSend.append('videoSource', formData.videoSource);
      formDataToSend.append('videoSourceLink', formData.videoSourceLink.trim());

      const techTags = formData.techTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
      formDataToSend.append('techTags', JSON.stringify(techTags));

      if (formData.completionDate) {
        formDataToSend.append('completionDate', formData.completionDate);
      }

      const collaborators = formData.collaborators
        .split(',')
        .map(c => c.trim())
        .filter(c => c);
      formDataToSend.append('collaborators', JSON.stringify(collaborators));

      if (coverFile) {
        formDataToSend.append('cover', coverFile);
      }

      if (isEdit) {
        await axios.put(`/api/projects/${id}`, formDataToSend);
      } else {
        await axios.post('/api/projects', formDataToSend);
      }

      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#F5F0E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-[#4A3728] mb-6">
          {isEdit ? '编辑项目' : '发布项目作品'}
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-btn text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-6 lg:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="给你的项目起个名字"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图 <span className="text-xs text-[#B8A899] font-normal">（选填）</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[#E8E0D5] rounded-btn hover:border-[#C8BAAA] transition-all">
              <div className="space-y-1 text-center">
                {(coverPreview || existingCover) ? (
                  <div className="relative inline-block">
                    <img
                      src={coverPreview || existingCover}
                      alt="封面预览"
                      className="max-h-48 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-[#B8A899]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="cover-upload" className="relative cursor-pointer rounded-md font-medium text-[#8B7355] hover:text-[#4A3728] focus-within:outline-none transition-colors">
                        <span>上传封面图片</span>
                        <input
                          ref={fileInputRef}
                          id="cover-upload"
                          name="cover"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleCoverChange}
                        />
                      </label>
                      <p className="pl-1">或拖拽到此处</p>
                    </div>
                    <p className="text-xs text-[#B8A899]">PNG, JPG, WebP 最大5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类 <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目简介 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] resize-none transition-all"
              placeholder="用一两句话简要介绍你的项目..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={8}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] resize-none transition-all"
              placeholder="详细描述你的项目背景、目标、成果等..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目链接
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              演示视频链接 <span className="text-xs text-[#B8A899] font-normal">（选填）</span>
            </label>
            <input
              type="url"
              name="video"
              value={formData.video}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="视频直链，如 https://example.com/demo.mp4"
            />
          </div>

          {formData.video.trim() && (
            <div className="space-y-3 bg-[#FAFAF7] rounded-card border border-[#E8E0D5] p-5">
              <p className="text-sm font-semibold text-[#4A3728]">🎬 视频来源声明</p>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-btn border-2 cursor-pointer transition-all text-sm ${
                  formData.videoSource === '原创' ? 'border-[#4A3728] bg-[#F5F0E8] text-[#4A3728]' : 'border-gray-200 text-gray-500'
                }`}>
                  <input
                    type="radio"
                    name="videoSource"
                    value="原创"
                    checked={formData.videoSource === '原创'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  ✨ 原创作品
                </label>
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-btn border-2 cursor-pointer transition-all text-sm ${
                  formData.videoSource === '转载' ? 'border-[#4A3728] bg-[#F5F0E8] text-[#4A3728]' : 'border-gray-200 text-gray-500'
                }`}>
                  <input
                    type="radio"
                    name="videoSource"
                    value="转载"
                    checked={formData.videoSource === '转载'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  🔗 转载分享
                </label>
              </div>
              {formData.videoSource === '转载' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    原始来源链接 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    name="videoSourceLink"
                    value={formData.videoSourceLink}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                    placeholder="请注明原作者出处链接，尊重知识产权"
                  />
                  <p className="text-xs text-[#B8A899] mt-1">转载他人作品请务必注明来源，尊重知识产权</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                技术标签
              </label>
              <input
                type="text"
                name="techTags"
                value={formData.techTags}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
                placeholder="React, Node.js, Figma...（逗号分隔）"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                完成日期
              </label>
              <input
                type="date"
                name="completionDate"
                value={formData.completionDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              协作者
            </label>
            <input
              type="text"
              name="collaborators"
              value={formData.collaborators}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="张三, 李四...（逗号分隔）"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#4A3728] text-white font-medium rounded-btn hover:bg-[#3A2A1E] transition-all disabled:opacity-50"
            >
              {loading ? '提交中...' : isEdit ? '保存修改' : '发布项目'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 bg-white text-[#4A3728] font-medium rounded-btn border border-[#E8E0D5] hover:bg-[#F5F0E8] transition-all"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProject;