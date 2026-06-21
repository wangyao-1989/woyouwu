import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const TYPE_NAMES = {
  webpage: '网页',
  code: '代码',
  design: '设计',
  other: '其他'
};

const TYPE_COLORS = {
  webpage: 'bg-blue-100 text-blue-700',
  code: 'bg-green-100 text-green-700',
  design: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700'
};

function AdminReferences() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 新建/编辑弹窗
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    type: 'webpage',
    sourceUrl: '',
    tags: '',
    content: '',
    note: ''
  });
  const [saving, setSaving] = useState(false);

  // 展开查看详情
  const [expandedId, setExpandedId] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;

      const res = await axios.get('/api/admin/references', { params });
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setMsg({ text: '加载失败: ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 搜索防抖
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  // 打开新建弹窗
  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', type: 'webpage', sourceUrl: '', tags: '', content: '', note: '' });
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      type: item.type,
      sourceUrl: item.sourceUrl || '',
      tags: (item.tags || []).join(', '),
      content: item.content,
      note: item.note || ''
    });
    setShowModal(true);
  };

  // 保存
  const handleSave = async () => {
    if (!form.title.trim()) {
      setMsg({ text: '标题不能为空', type: 'error' });
      return;
    }
    if (!form.content.trim()) {
      setMsg({ text: '内容不能为空', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        sourceUrl: form.sourceUrl.trim(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        content: form.content,
        note: form.note.trim()
      };

      if (editingId) {
        const res = await axios.put(`/api/admin/references/${editingId}`, payload);
        setMsg({ text: res.data.message, type: 'success' });
      } else {
        const res = await axios.post('/api/admin/references', payload);
        setMsg({ text: res.data.message, type: 'success' });
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      setMsg({ text: '保存失败: ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 删除
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条参考内容吗？')) return;
    try {
      await axios.delete(`/api/admin/references/${id}`);
      setMsg({ text: '已删除', type: 'success' });
      fetchItems();
    } catch (err) {
      setMsg({ text: '删除失败: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  // 截取内容预览
  const previewContent = (content, maxLen = 200) => {
    const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
  };

  return (
    <div className="min-h-screen pt-20 bg-[#F5F0E8]">
      <div className="max-w-5xl mx-auto px-4 pb-8">
        {/* 页头 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">参考内容库</h1>
            <p className="text-gray-600 mt-2">保存网页、代码、设计等参考内容，方便日后查找和借鉴</p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-btn px-5 py-2.5 bg-warm-900 text-white font-medium hover:bg-warm-700 transition-colors shadow-sketch"
          >
            + 新建参考
          </button>
        </div>

        {/* 消息提示 */}
        {msg.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {msg.text}
            <button onClick={() => setMsg({ text: '', type: '' })} className="ml-3 underline">关闭</button>
          </div>
        )}

        {/* 搜索栏 */}
        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-4 mb-6">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索参考内容（标题、正文、标签...）"
              className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm"
            />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm bg-white"
            >
              <option value="">全部类型</option>
              <option value="webpage">网页</option>
              <option value="code">代码</option>
              <option value="design">设计</option>
              <option value="other">其他</option>
            </select>
            <button
              onClick={() => fetchItems()}
              className="rounded-btn px-4 py-2.5 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200 transition-colors text-sm"
            >
              刷新
            </button>
          </div>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search || typeFilter ? '没有找到匹配的参考内容' : '还没有参考内容，点击右上角"新建参考"开始'}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-3">共 {total} 条记录</div>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item._id} className="bg-white rounded-card border-2 border-gray-200 shadow-card overflow-hidden">
                  {/* 摘要行 */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-gray-800 truncate">{item.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLORS[item.type]}`}>
                            {TYPE_NAMES[item.type]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                          {previewContent(item.content)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {item.tags && item.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              {item.tags.map((tag, i) => (
                                <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded">#{tag}</span>
                              ))}
                            </span>
                          )}
                          {item.sourceUrl && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-500 hover:underline truncate max-w-[200px]"
                            >
                              来源
                            </a>
                          )}
                          <span>{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                          <span className={expandedId === item._id ? 'text-warm-900' : ''}>
                            {expandedId === item._id ? '收起 ▲' : '展开 ▼'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(item)}
                          className="text-xs px-3 py-1.5 rounded-btn bg-[#F0E8DD] text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-xs px-3 py-1.5 rounded-btn bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 展开的完整内容 */}
                  {expandedId === item._id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500 font-medium">完整内容：</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.content);
                            setMsg({ text: '已复制到剪贴板', type: 'success' });
                          }}
                          className="text-xs px-3 py-1 rounded-btn bg-[#F0E8DD] text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          复制内容
                        </button>
                      </div>
                      {item.note && (
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
                          备注：{item.note}
                        </div>
                      )}
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-sans leading-relaxed max-h-[500px] overflow-y-auto bg-white p-4 rounded-lg border border-gray-200">
                        {item.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-btn px-4 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-500 px-4">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-btn px-4 py-2 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}

        {/* 返回 */}
        <div className="mt-6">
          <Link to="/profile" className="text-warm-900 hover:text-warm-700 text-sm">
            ← 返回个人资料
          </Link>
        </div>
      </div>

      {/* 新建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-card border-2 border-gray-200 shadow-card w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-5">
                {editingId ? '编辑参考内容' : '新建参考内容'}
              </h2>

              {/* 标题 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="给这个参考内容起个名字"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm"
                />
              </div>

              {/* 类型 + 来源 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm bg-white"
                  >
                    <option value="webpage">网页</option>
                    <option value="code">代码</option>
                    <option value="design">设计</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">来源网址</label>
                  <input
                    type="url"
                    value={form.sourceUrl}
                    onChange={(e) => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm"
                  />
                </div>
              </div>

              {/* 标签 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="例如：导航栏, 动画, 玻璃效果"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm"
                />
              </div>

              {/* 内容 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参考内容 * <span className="text-gray-400 font-normal">（直接粘贴网页源码、CSS、设计描述等）</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="把你想借鉴的内容粘贴到这里..."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm font-mono resize-y"
                />
              </div>

              {/* 备注 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="想借鉴哪部分？有什么想法？（可选）"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-900 focus:border-warm-900 outline-none text-sm resize-y"
                />
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-btn px-5 py-2.5 bg-[#F0E8DD] text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-btn px-5 py-2.5 bg-warm-900 text-white font-medium hover:bg-warm-700 transition-colors shadow-sketch disabled:opacity-50 text-sm"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReferences;
