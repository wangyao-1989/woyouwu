import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Icon from '../components/Icon';
import VideoUploader from '../components/VideoUploader';

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
  const [videoFileId, setVideoFileId] = useState('');
  const [videoPlayUrl, setVideoPlayUrl] = useState('');
  const [videoCoverUrl, setVideoCoverUrl] = useState('');
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
      if (project.videoFileId) {
        setVideoFileId(project.videoFileId);
        setVideoPlayUrl(project.video || '');
        setVideoCoverUrl(project.videoCoverUrl || '');
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

  const handleVideoUploadSuccess = (info) => {
    if (info === null) {
      // 视频被移除
      setVideoFileId('');
      setVideoPlayUrl('');
      setVideoCoverUrl('');
      setFormData(prev => ({ ...prev, video: '' }));
    } else {
      setVideoFileId(info.fileId);
      setVideoPlayUrl(info.videoUrl);
      setVideoCoverUrl(info.coverUrl);
      setFormData(prev => ({ ...prev, video: info.videoUrl }));
    }
  };

  const handleVideoUploadError = (err) => {
    setError(`视频上传失败: ${err?.message || '未知错误'}`);
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
      formDataToSend.append('videoFileId', videoFileId);
      formDataToSend.append('videoCoverUrl', videoCoverUrl);
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
      <div className="min-h-[80vh] flex items-center justify-center" style={{ backgroundColor: '#F7F5F2' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#555]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 fade-in" style={{ backgroundColor: '#F7F5F2' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="heading-xl mb-8">
          {isEdit ? '编辑项目' : '发布项目作品'}
        </h1>

        {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="apple-input"
              placeholder="给你的项目起个名字"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图 <span className="text-xs text-[#999] font-normal">（选填）</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 bg-[#F0F0F5] rounded-[10px] hover:bg-[#E8E8EE] transition-colors cursor-pointer">
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
                    <svg className="mx-auto h-10 w-10 text-[#B0B0B8]" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex text-sm justify-center">
                      <label htmlFor="cover-upload" className="relative cursor-pointer text-[#555] hover:text-[#222] transition-colors">
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
                    </div>
                    <p className="text-xs text-[#B0B0B8]">PNG, JPG, WebP 最大5MB</p>
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
              className="apple-select"
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
              className="apple-textarea"
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
              className="apple-textarea"
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
              className="apple-input"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              演示视频 <span className="text-xs text-[#999] font-normal">（选填，上传到腾讯云点播）</span>
            </label>
            <VideoUploader
              onUploadSuccess={handleVideoUploadSuccess}
              onUploadError={handleVideoUploadError}
              existingVideo={videoFileId ? { fileId: videoFileId, videoUrl: videoPlayUrl } : null}
            />
            <p className="text-xs text-gray-400 mt-1">
              上传视频将使用腾讯云点播服务进行转码和分发
            </p>
          </div>

          {/* 视频链接（兼容过去的直接链接方式） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              或粘贴视频直链 <span className="text-xs text-[#999] font-normal">（与上传二选一）</span>
            </label>
            <input
              type="url"
              name="video"
              value={formData.video}
              onChange={handleChange}
              className="apple-input"
              placeholder="视频直链，如 https://example.com/demo.mp4"
              disabled={!!videoFileId}
            />
          </div>

          {(formData.video.trim() || videoFileId) && (
            <div className="space-y-3 bg-[#F7F5F2] rounded-2xl border border-[#EBE7E0] p-5">
              <p className="text-sm font-semibold text-[#222]">视频来源声明</p>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                  formData.videoSource === '原创' ? 'border-[#222] bg-[#F7F5F2] text-[#222]' : 'border-[#EBE7E0] text-[#999]'
                }`}>
                  <input
                    type="radio"
                    name="videoSource"
                    value="原创"
                    checked={formData.videoSource === '原创'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-1"><Icon name="sparkles" className="w-4 h-4" /> 原创作品</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                  formData.videoSource === '转载' ? 'border-[#222] bg-[#F7F5F2] text-[#222]' : 'border-[#EBE7E0] text-[#999]'
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
                    className="apple-input"
                    placeholder="请注明原作者出处链接，尊重知识产权"
                  />
                  <p className="text-xs text-[#999] mt-1">转载他人作品请务必注明来源，尊重知识产权</p>
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
                className="apple-input"
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
                className="apple-input"
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
              className="apple-input"
                placeholder="张三, 李四...（逗号分隔）"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-3"
            >
              {loading ? '提交中...' : isEdit ? '保存修改' : '发布项目'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 btn-outline py-3"
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