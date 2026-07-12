import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Icon from '../components/Icon';
import MapPicker from '../components/MapPicker';

const categories = [
  { value: '数码电子', label: '数码电子', icon: 'smartphone' },
  { value: '家居生活', label: '家居生活', icon: 'home' },
  { value: '服饰配饰', label: '服饰配饰', icon: 'shirt' },
  { value: '图书文具', label: '图书文具', icon: 'book' },
  { value: '运动户外', label: '运动户外', icon: 'activity' },
  { value: '母婴用品', label: '母婴用品', icon: 'baby' },
  { value: '美妆护肤', label: '美妆护肤', icon: 'sparkle' },
  { value: '食品饮料', label: '食品饮料', icon: 'coffee' },
  { value: '工具器械', label: '工具器械', icon: 'wrench' },
  { value: '会员卡券', label: '会员卡券', icon: 'creditcard' },
  { value: '其他', label: '其他', icon: 'cube' },
];

const statusOptions = [
  { value: '可借用', label: '可借用' },
  { value: '已借出', label: '已借出' },
  { value: '维修中', label: '维修中' },
  { value: '收回发布', label: '收回发布' },
];

const conditionOptions = [
  { value: '全新', label: '全新未使用' },
  { value: '几乎全新', label: '几乎全新' },
  { value: '轻微使用', label: '轻微使用痕迹' },
  { value: '正常使用', label: '正常使用痕迹' },
];

function CreateItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: '数码电子',
    condition: '',
    borrowStartDate: '',
    borrowEndDate: '',
    status: '可借用',
    description: '',
    location: '',
    coordinates: null,
    images: []
  });
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (isEdit) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await axios.get(`/api/items/${id}`);
      const item = res.data;

      // 自动平移可借用时段：如果起始日期已过期且物品未被借出，平移到今天
      let startDate = '';
      let endDate = '';
      if (item.borrowStartDate && item.borrowEndDate) {
        const oldStart = new Date(item.borrowStartDate);
        const oldEnd = new Date(item.borrowEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const notBorrowed = item.status === '可借用' || item.status === 'available' || item.status === '维修中' || item.status === '收回发布';

        if (oldStart < today && notBorrowed) {
          const diff = oldEnd.getTime() - oldStart.getTime();
          startDate = today.toISOString().split('T')[0];
          endDate = new Date(today.getTime() + diff).toISOString().split('T')[0];
        } else {
          startDate = oldStart.toISOString().split('T')[0];
          endDate = oldEnd.toISOString().split('T')[0];
        }
      } else {
        startDate = item.borrowStartDate ? new Date(item.borrowStartDate).toISOString().split('T')[0] : '';
        endDate = item.borrowEndDate ? new Date(item.borrowEndDate).toISOString().split('T')[0] : '';
      }

      setFormData({
        name: item.name || '',
        category: item.category || '数码电子',
        condition: item.condition || '',
        borrowStartDate: startDate,
        borrowEndDate: endDate,
        status: item.status || '可借用',
        description: item.remark || '',
        location: item.location || '',
        coordinates: item.coordinates || null
      });
      setExistingImages(item.images || []);
    } catch (error) {
      console.error('Failed to fetch item');
      navigate('/items');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setFormData({ ...formData, images: files });

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removePreview = (index) => {
    const newFiles = [...formData.images];
    newFiles.splice(index, 1);
    setFormData({ ...formData, images: newFiles });

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const removeExisting = (index) => {
    const newExisting = [...existingImages];
    newExisting.splice(index, 1);
    setExistingImages(newExisting);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('物品名称不能为空');
      return;
    }

    if (!formData.location.trim()) {
      setError('请填写存放位置');
      return;
    }

    if (!isEdit && formData.images.length === 0 && existingImages.length === 0) {
      setError('至少需要上传一张图片');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', 'stuff');
      formDataToSend.append('name', formData.name);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('borrowStartDate', formData.borrowStartDate);
      formDataToSend.append('borrowEndDate', formData.borrowEndDate);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('remark', formData.description);
      formDataToSend.append('location', formData.location);
      if (formData.coordinates && formData.coordinates.lat && formData.coordinates.lng) {
        formDataToSend.append('coordinates', JSON.stringify(formData.coordinates));
      }

      if (formData.images.length > 0) {
        formData.images.forEach(file => {
          formDataToSend.append('images', file);
        });
      }

      if (isEdit) {
        await axios.put(`/api/items/${id}`, formDataToSend);
      } else {
        await axios.post('/api/items', formDataToSend);
      }

      navigate('/items');
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-[#F5F0E8] fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h1 className="heading-xl mb-6">
          {isEdit ? '编辑物品' : '发布闲置物品'}
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-card text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-card border border-[#E8E0D5] shadow-card p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="给你的物品起个名字"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              物品类别 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map(ct => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: ct.value })}
                  className={`p-2.5 rounded-card border-2 text-center transition-all active:scale-95 ${
                    formData.category === ct.value
                      ? 'border-[#4A3728] bg-[#F5F0E8] text-[#4A3728]'
                      : 'border-gray-200 hover:border-[#C8BAAA] text-gray-500'
                  }`}
                >
                  <div className="flex justify-center mb-0.5"><Icon name={ct.icon} className="w-5 h-5" /></div>
                  <div className="text-xs font-medium">{ct.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新旧程度
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              >
                <option value="">请选择</option>
                {conditionOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前状态
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              >
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              可借用时段 <span className="text-xs text-[#B8A899] font-normal">（选填）</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                name="borrowStartDate"
                value={formData.borrowStartDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              />
              <span className="text-gray-400 text-sm flex-shrink-0">至</span>
              <input
                type="date"
                name="borrowEndDate"
                value={formData.borrowEndDate}
                onChange={handleChange}
                min={formData.borrowStartDate || new Date().toISOString().split('T')[0]}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] bg-white focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品图片 {!isEdit && <span className="text-red-500">*</span>}
              <span className="text-xs text-[#B8A899] font-normal ml-1">（最多10张，选第一张作为封面）</span>
            </label>
            <div className="border-2 border-dashed border-[#E8E0D5] rounded-card p-6 text-center hover:border-[#C8BAAA] transition">
              <svg className="mx-auto h-12 w-12 text-[#C8BAAA]" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600 justify-center mt-3">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-btn font-medium text-[#8B7355] hover:text-[#4A3728] transition">
                  <span>点击上传图片</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" multiple onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-[#B8A899] mt-1">PNG, JPG, GIF, WebP 最大5MB</p>
            </div>
          </div>

          {(previews.length > 0 || existingImages.length > 0) && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {existingImages.map((img, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={img}
                    alt={`已有图片 ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-card border border-[#E8E0D5]"
                  />
                  <button
                    type="button"
                    onClick={() => removeExisting(index)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#4A3728]/80 text-white text-[10px] rounded">封面</span>
                  )}
                </div>
              ))}
              {previews.map((preview, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={preview}
                    alt={`预览 ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-card border border-[#E8E0D5]"
                  />
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                  {existingImages.length === 0 && index === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#4A3728]/80 text-white text-[10px] rounded">封面</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              位置/存放点 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all mb-3"
              placeholder="例如：3号楼501室或公司储物柜A"
            />
            <p className="text-xs text-[#B8A899] mb-2">填写位置后自动识别并在地图上标记，支持模糊地址智能匹配</p>
            <MapPicker
              value={formData.coordinates}
              onChange={(coords) => setFormData({ ...formData, coordinates: coords })}
              locationText={formData.location}
              height="300px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品故事 <span className="text-xs text-[#B8A899] font-normal">（可选，点击模板快速填写）</span>
            </label>

            {/* 故事模板 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: '🕰️ 时光故事', text: '我这件物品买于____，它陪伴我度过了____时光，现在希望它能去____。' },
                { label: '🎁 礼物记忆', text: '这件物品是____送给我的，当时____。因为____，决定让它找到新的主人。' },
                { label: '📸 旅途见证', text: '它陪我去过____，见证了____，希望下一位主人也能带着它继续远行。' },
                { label: '✨ 简单说说', text: '关于这件物品，我想说：____' },
              ].map(tpl => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, description: tpl.text })}
                  className="px-3 py-1.5 bg-[#FDF8F5] border border-[#E8D5C8] rounded-full text-xs text-[#8B7355] hover:bg-[#F8EDE4] hover:border-[#c75151] hover:text-[#4A3728] transition-all"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all resize-none"
              placeholder="物品的成色细节、有效期、借用须知或任何你想补充的信息..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#4A3728] text-white font-semibold rounded-btn hover:bg-[#3A2A1E] active:scale-95 transition disabled:opacity-50"
            >
              {loading ? '提交中...' : isEdit ? '保存修改' : '发布物品'}
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

export default CreateItem;
