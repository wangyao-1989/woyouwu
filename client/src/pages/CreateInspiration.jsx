import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Icon from '../components/Icon';

const categories = [
  { value: '产品想法', label: '产品想法', icon: 'rocket' },
  { value: '设计灵感', label: '设计灵感', icon: 'palette' },
  { value: '技术方案', label: '技术方案', icon: 'settings' },
  { value: '商业模式', label: '商业模式', icon: 'bar-chart' },
  { value: '其他', label: '其他', icon: 'pin' },
];

const statuses = [
  { value: '纯想法', label: '纯想法', desc: '只是一个模糊的想法' },
  { value: '探索中', label: '探索中', desc: '正在调研和验证' },
  { value: '已落地', label: '已落地', desc: '已经付诸实践' },
];

function CreateInspiration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    category: '产品想法',
    description: '',
    detail: '',
    refLinks: '',
    tags: '',
    status: '纯想法',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchInspiration();
    }
  }, [id]);

  const fetchInspiration = async () => {
    try {
      const res = await axios.get(`/api/inspirations/${id}`);
      const inspiration = res.data;
      setFormData({
        title: inspiration.title || '',
        category: inspiration.category || '产品想法',
        description: inspiration.description || '',
        detail: inspiration.detail || '',
        refLinks: Array.isArray(inspiration.refLinks) ? inspiration.refLinks.join('\n') : inspiration.refLinks || '',
        tags: Array.isArray(inspiration.tags) ? inspiration.tags.join(' ') : inspiration.tags || '',
        status: inspiration.status || '纯想法',
      });
    } catch (error) {
      console.error('Failed to fetch inspiration');
      navigate('/inspirations');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('标题不能为空');
      return;
    }

    if (!formData.description.trim()) {
      setError('描述不能为空');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        detail: formData.detail.trim(),
        refLinks: formData.refLinks
          .split('\n')
          .map(link => link.trim())
          .filter(link => link.length > 0),
        tags: formData.tags
          .split(/\s+/)
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        status: formData.status,
      };

      if (isEdit) {
        await axios.put(`/api/inspirations/${id}`, payload);
      } else {
        await axios.post('/api/inspirations', payload);
      }

      navigate(isEdit ? `/inspirations/${id}` : '/inspirations');
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="heading-xl mb-2">
          {isEdit ? '编辑灵感' : '记录灵感'}
        </h1>
        <p className="text-[#8B7355] mb-8 text-sm">
          {isEdit ? '完善你的灵感碎片' : '捕捉一闪而过的创意火花'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card p-6 lg:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] text-[#4A3728] placeholder-[#B8A899] text-sm transition-all"
              placeholder="给你的灵感起个名字"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4A3728] mb-3">
                分类 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all active:scale-95 ${
                      formData.category === cat.value
                        ? 'border-[#4A3728] bg-[#F5F0E8] text-[#4A3728]'
                        : 'border-[#E8E0D5] hover:border-[#C8BAAA] text-[#8B7355]'
                    }`}
                  >
                    <div className="flex justify-center mb-0.5"><Icon name={cat.icon} className="w-5 h-5" /></div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4A3728] mb-3">
                状态 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {statuses.map(st => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: st.value })}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      formData.status === st.value
                        ? 'border-[#4A3728] bg-[#F5F0E8] text-[#4A3728]'
                        : 'border-[#E8E0D5] hover:border-[#C8BAAA] text-[#8B7355]'
                    }`}
                  >
                    <div className="text-sm font-medium">{st.label}</div>
                    <div className="text-xs opacity-70">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-2">
              简短描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] text-[#4A3728] placeholder-[#B8A899] text-sm transition-all resize-none"
              placeholder="用一两句话描述你的灵感..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-2">
              详细内容
            </label>
            <textarea
              name="detail"
              value={formData.detail}
              onChange={handleChange}
              rows={8}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] text-[#4A3728] placeholder-[#B8A899] text-sm transition-all resize-none"
              placeholder="展开说说你的想法、背景、可行性等..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-2">
              参考链接
            </label>
            <textarea
              name="refLinks"
              value={formData.refLinks}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] text-[#4A3728] placeholder-[#B8A899] text-sm transition-all resize-none"
              placeholder="每行一个链接&#10;https://example.com&#10;https://another-link.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-2">
              标签
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] text-[#4A3728] placeholder-[#B8A899] text-sm transition-all"
              placeholder="用空格分隔多个标签，如：AI 用户体验 社交"
            />
            {formData.tags.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.tags
                  .split(/\s+/)
                  .filter(tag => tag.length > 0)
                  .map((tag, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-[#F5F0E8] text-[#8B7355] rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-4 border-t border-[#F5F0E8]">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#4A3728] text-white font-semibold rounded-btn hover:bg-[#3A2A1E] active:scale-95 transition disabled:opacity-50 text-sm"
            >
              {loading ? '提交中...' : isEdit ? '保存修改' : '发布灵感'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 bg-[#F5F0E8] text-[#4A3728] font-semibold rounded-btn hover:bg-[#E8E0D5] active:scale-95 transition text-sm border border-[#E8E0D5]"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateInspiration;