import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Icon from '../components/Icon';

const categories = [
  { value: '经验分享', label: '经验分享', icon: 'lightbulb' },
  { value: '教程', label: '教程', icon: 'book-open' },
  { value: '随笔', label: '随笔', icon: 'pen-tool' },
  { value: '书评影评', label: '书评影评', icon: 'film' },
  { value: '技术文章', label: '技术文章', icon: 'code' },
  { value: '其他', label: '其他', icon: 'file' }
];

const defaultMeta = {
  '经验分享': { scenario: '', problem: '', solution: '', lesson: '' },
  '教程': { difficulty: '', prerequisites: '', tools: '', duration: '' },
  '随笔': { mood: '', location: '', inspiration: '' },
  '书评影评': { workTitle: '', creator: '', rating: '', recommend: '' },
  '技术文章': { techStack: '', difficulty: '', version: '' },
  '其他': {}
};

const difficultyOptions = ['入门', '初级', '中级', '高级'];
const moodOptions = ['平静', '愉悦', '感慨', '忧伤', '热血', '其他'];
const ratingOptions = ['⭐ 1星', '⭐⭐ 2星', '⭐⭐⭐ 3星', '⭐⭐⭐⭐ 4星', '⭐⭐⭐⭐⭐ 5星'];
const recommendOptions = ['强烈推荐', '推荐', '一般', '不推荐'];

function CreateArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    summary: '',
    content: '',
    tags: ''
  });
  const [meta, setMeta] = useState({});
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [existingCover, setExistingCover] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await axios.get(`/api/articles/${id}`);
      const article = res.data;
      setFormData({
        title: article.title || '',
        category: article.category || '',
        summary: article.summary || '',
        content: article.content || '',
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '')
      });
      if (article.meta && Object.keys(article.meta).length > 0) {
        setMeta(article.meta);
      }
      if (article.cover) {
        setExistingCover(article.cover);
      }
    } catch (error) {
      console.error('Failed to fetch article');
      navigate('/articles');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setMeta({ ...meta, [name]: value });
  };

  const handleCategorySelect = (category) => {
    setFormData({ ...formData, category });
    setMeta({ ...defaultMeta[category] });
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    if (existingCover) {
      setExistingCover('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('请输入文章标题');
      return;
    }
    if (!formData.category) {
      setError('请选择文章分类');
      return;
    }
    if (!formData.content.trim()) {
      setError('请输入文章内容');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('summary', formData.summary);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('meta', JSON.stringify(meta));

      const tagsArray = formData.tags
        .split(/[,，]/)
        .map(t => t.trim())
        .filter(t => t);
      formDataToSend.append('tags', JSON.stringify(tagsArray));

      if (coverFile) {
        formDataToSend.append('cover', coverFile);
      }

      if (isEdit) {
        await axios.put(`/api/articles/${id}`, formDataToSend);
      } else {
        await axios.post('/api/articles', formDataToSend);
      }

      navigate('/articles');
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = categories.find(c => c.value === formData.category);

  const renderMetaFields = () => {
    if (!formData.category || formData.category === '其他') return null;

    const labelClass = 'block text-sm font-medium text-gray-700 mb-2';
    const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all';
    const textareaClass = 'w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all resize-none';
    const selectClass = 'w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all';

    switch (formData.category) {
      case '经验分享':
        return (
          <div className="space-y-4 bg-[#FAFAF7] rounded-card border border-[#E8E0D5] p-5">
            <p className="text-sm font-semibold text-[#4A3728] mb-2 flex items-center gap-1"><Icon name="lightbulb" className="w-4 h-4" /> 经验详情</p>
            <div>
              <label className={labelClass}>应用场景 / 领域</label>
              <input type="text" name="scenario" value={meta.scenario || ''} onChange={handleMetaChange} className={inputClass} placeholder="例如：前端开发、团队管理、自由职业..." />
            </div>
            <div>
              <label className={labelClass}>遇到的问题</label>
              <textarea name="problem" value={meta.problem || ''} onChange={handleMetaChange} rows={3} className={textareaClass} placeholder="描述你当时遇到了什么困难或挑战..." />
            </div>
            <div>
              <label className={labelClass}>解决方案</label>
              <textarea name="solution" value={meta.solution || ''} onChange={handleMetaChange} rows={4} className={textareaClass} placeholder="你是如何一步步解决这个问题的..." />
            </div>
            <div>
              <label className={labelClass}>经验教训</label>
              <textarea name="lesson" value={meta.lesson || ''} onChange={handleMetaChange} rows={3} className={textareaClass} placeholder="从这个经历中学到了什么，有什么想对后来者说的..." />
            </div>
          </div>
        );

      case '教程':
        return (
          <div className="space-y-4 bg-[#FAFAF7] rounded-card border border-[#E8E0D5] p-5">
            <p className="text-sm font-semibold text-[#4A3728] mb-2">📚 教程信息</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>难度等级</label>
                <select name="difficulty" value={meta.difficulty || ''} onChange={handleMetaChange} className={selectClass}>
                  <option value="">请选择难度</option>
                  {difficultyOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>预计耗时</label>
                <input type="text" name="duration" value={meta.duration || ''} onChange={handleMetaChange} className={inputClass} placeholder="例如：约2小时" />
              </div>
            </div>
            <div>
              <label className={labelClass}>前置知识</label>
              <input type="text" name="prerequisites" value={meta.prerequisites || ''} onChange={handleMetaChange} className={inputClass} placeholder="例如：需要了解 HTML/CSS 基础..." />
            </div>
            <div>
              <label className={labelClass}>所需工具</label>
              <input type="text" name="tools" value={meta.tools || ''} onChange={handleMetaChange} className={inputClass} placeholder="例如：VS Code, Node.js 18+, Postman..." />
            </div>
          </div>
        );

      case '随笔':
        return (
          <div className="space-y-4 bg-[#FAFAF7] rounded-card border border-[#E8E0D5] p-5">
            <p className="text-sm font-semibold text-[#4A3728] mb-2">✍️ 随笔心情</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>当下心境</label>
                <select name="mood" value={meta.mood || ''} onChange={handleMetaChange} className={selectClass}>
                  <option value="">选择心境...</option>
                  {moodOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>写作地点</label>
                <input type="text" name="location" value={meta.location || ''} onChange={handleMetaChange} className={inputClass} placeholder="例如：咖啡馆、家中阳台..." />
              </div>
            </div>
            <div>
              <label className={labelClass}>灵感来源</label>
              <input type="text" name="inspiration" value={meta.inspiration || ''} onChange={handleMetaChange} className={inputClass} placeholder="是什么触发了你想写下这些文字..." />
            </div>
          </div>
        );

      case '书评影评':
        return (
          <div className="space-y-4 bg-[#FAFAF7] rounded-card border border-[#E8E0D5] p-5">
            <p className="text-sm font-semibold text-[#4A3728] mb-2">🎬 作品信息</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>作品名称</label>
                <input type="text" name="workTitle" value={meta.workTitle || ''} onChange={handleMetaChange} className={inputClass} placeholder="书名或电影名..." />
              </div>
              <div>
                <label className={labelClass}>作者 / 导演</label>
                <input type="text" name="creator" value={meta.creator || ''} onChange={handleMetaChange} className={inputClass} placeholder="作者或导演名字..." />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>评分</label>
                <select name="rating" value={meta.rating || ''} onChange={handleMetaChange} className={selectClass}>
                  <option value="">未评分</option>
                  {ratingOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>推荐指数</label>
                <select name="recommend" value={meta.recommend || ''} onChange={handleMetaChange} className={selectClass}>
                  <option value="">选择推荐程度...</option>
                  {recommendOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        );

      case '技术文章':
        return (
          <div className="space-y-4 bg-[#FAFAF7] rounded-card border border-[#E8E0D5] p-5">
            <p className="text-sm font-semibold text-[#4A3728] mb-2">💻 技术信息</p>
            <div>
              <label className={labelClass}>技术栈 / 主题</label>
              <input type="text" name="techStack" value={meta.techStack || ''} onChange={handleMetaChange} className={inputClass} placeholder="例如：React 18, Node.js, Docker..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>难度等级</label>
                <select name="difficulty" value={meta.difficulty || ''} onChange={handleMetaChange} className={selectClass}>
                  <option value="">请选择难度</option>
                  {difficultyOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>适用版本</label>
                <input type="text" name="version" value={meta.version || ''} onChange={handleMetaChange} className={inputClass} placeholder="例如：React 18+, Node 20+" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-[#F5F0E8] fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="heading-xl mb-6">
          {isEdit ? '编辑文章' : (currentCategory ? `发布${currentCategory.label}` : '发布文章')}
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-card text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              文章分类 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(ct => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => handleCategorySelect(ct.value)}
                  className={`p-3 rounded-card border-2 text-center transition-all active:scale-95 ${
                    formData.category === ct.value
                      ? 'border-[#4A3728] bg-[#F5F0E8] text-[#4A3728]'
                      : 'border-gray-200 hover:border-[#C8BAAA] text-gray-500'
                  }`}
                >
                  <div className="flex justify-center mb-1"><Icon name={ct.icon} className="w-6 h-6" /></div>
                  <div className="text-sm font-medium">{ct.label}</div>
                </button>
              ))}
            </div>
          </div>

          {renderMetaFields()}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文章标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="给你的文章起个吸引人的标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图片 <span className="text-xs text-[#B8A899] font-normal">（选填）</span>
            </label>
            <div className="border-2 border-dashed border-[#E8E0D5] rounded-card p-6 text-center hover:border-[#C8BAAA] transition">
              {coverPreview || existingCover ? (
                <div className="relative inline-block">
                  <img
                    src={coverPreview || existingCover}
                    alt="封面预览"
                    className="w-full max-h-48 rounded-card object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeCover}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-[#C8BAAA]" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center mt-3">
                    <label htmlFor="cover-upload" className="relative cursor-pointer bg-white rounded-btn font-medium text-[#8B7355] hover:text-[#4A3728] transition">
                      <span>点击上传封面图</span>
                      <input id="cover-upload" name="cover" type="file" className="sr-only" accept="image/*" onChange={handleCoverChange} />
                    </label>
                  </div>
                  <p className="text-xs text-[#B8A899] mt-1">PNG, JPG, WebP 最大5MB</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文章摘要 <span className="text-xs text-[#B8A899] font-normal">（选填，留空将自动截取正文前100字）</span>
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all resize-none"
              placeholder="简短的摘要，吸引读者点击..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              正文内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={16}
              className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all resize-y min-h-[300px]"
              placeholder="在这里写下你的文章内容..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签 <span className="text-xs text-[#B8A899] font-normal">（用逗号分隔，选填）</span>
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="React, 前端开发, 学习笔记"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#4A3728] text-white font-semibold rounded-btn hover:bg-[#3A2A1E] active:scale-95 transition disabled:opacity-50"
            >
              {loading ? '提交中...' : isEdit ? '保存修改' : '发布文章'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 bg-[#F5F0E8] text-[#4A3728] font-semibold rounded-btn hover:bg-[#E8E0D5] border border-[#E8E0D5] active:scale-95 transition"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateArticle;
