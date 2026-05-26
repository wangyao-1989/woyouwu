import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItem = async () => {
    try {
      const { data } = await axios.get(`/api/items/${id}`);
      setItem(data);
    } catch (err) {
      console.error('获取物品详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItem(); }, [id]);

  const handleBorrow = async () => {
    if (!item) return;
    try {
      const { data } = await axios.post(`/api/items/${id}/borrow`);
      setItem(data.item || data);
    } catch (err) {
      alert(err.response?.data?.error || '借用请求失败');
    }
  };

  const handleApprove = async (borrowId) => {
    try {
      const { data } = await axios.post(`/api/items/${id}/approve/${borrowId}`);
      setItem(data.item || data);
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (borrowId) => {
    try {
      const { data } = await axios.post(`/api/items/${id}/reject/${borrowId}`);
      setItem(data.item || data);
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReturn = async (borrowId) => {
    try {
      const { data } = await axios.post(`/api/items/${id}/return/${borrowId}`);
      setItem(data.item || data);
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这个物品吗？此操作不可撤销。')) return;
    try {
      await axios.delete(`/api/items/${id}`);
      navigate('/items');
    } catch (err) {
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3728]"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <p className="text-gray-500">物品不存在</p>
      </div>
    );
  }

  const isOwner = user && item.owner && (
    (item.owner._id || item.owner) === (user._id || user.id)
  );

  const getStatusLabel = (status) => {
    const map = {
      available: '可借用',
      requested: '借用中',
      borrowed: '已借出',
      frozen: '已冻结'
    };
    return map[status] || status;
  };

  const getCategoryColor = (type) => {
    const map = {
      achievement: { bg: '#F5E6C8', color: '#7a5e2e' },
      idea: { bg: '#E8DCF0', color: '#5c3d6e' },
      project: { bg: '#D6EAF0', color: '#3a6d7a' },
      article: { bg: '#F8E0E0', color: '#8b5555' },
      stuff: { bg: '#E0F0E0', color: '#4a7a4a' },
    };
    return map[type] || { bg: '#E8E0D5', color: '#8B7355' };
  };

  const tagStyle = getCategoryColor(item.type);

  return (
    <div className="min-h-screen bg-[#F5F0E8] fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/items" className="inline-flex items-center text-sm text-[#8B7355] hover:text-[#4A3728] mb-6 transition">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回物品列表
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative">
            <div className="aspect-video bg-[#E8E0D5] rounded-card overflow-hidden">
              {item.images && item.images[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3 self-start"
              style={{ backgroundColor: tagStyle.bg, color: tagStyle.color }}
            >
              {item.type === 'stuff' ? '📦' : '📄'} {getStatusLabel(item.status)}
            </span>

            <h1 className="text-2xl font-bold text-[#4A3728] mb-4">{item.name}</h1>

            {item.remark && (
              <p className="text-[#8B7355] leading-relaxed mb-6">{item.remark}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {item.category && (
                <div>
                  <span className="text-xs text-[#B8A899]">分类</span>
                  <p className="text-sm text-[#4A3728] font-medium">{item.category}</p>
                </div>
              )}
              {item.condition && (
                <div>
                  <span className="text-xs text-[#B8A899]">成色</span>
                  <p className="text-sm text-[#4A3728] font-medium">{item.condition}</p>
                </div>
              )}
              {item.location && (
                <div>
                  <span className="text-xs text-[#B8A899]">位置</span>
                  <p className="text-sm text-[#4A3728] font-medium">{item.location}</p>
                </div>
              )}
              {item.link && (
                <div>
                  <span className="text-xs text-[#B8A899]">链接</span>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    查看 🔗
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-card border border-[#E8E0D5]">
              <img
                src={item.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.owner?.nickname || 'user'}`}
                alt={item.owner?.nickname || '拥有者'}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <Link to={`/profile/${item.owner?._id || item.owner}`} className="text-[#4A3728] font-medium hover:underline">
                  {item.owner?.nickname || item.ownerName || '未知'}
                </Link>
                <p className="text-xs text-[#B8A899]">物品拥有者</p>
              </div>
            </div>

            {isOwner ? (
              <div className="space-y-3">
                <Link
                  to={`/items/edit/${item._id}`}
                  className="block w-full py-3 bg-warm-600 text-white font-semibold rounded-lg hover:bg-warm-900 transition text-center"
                >
                  编辑物品
                </Link>
                <button
                  onClick={handleDelete}
                  className="w-full py-3 bg-red-50 text-red-500 font-semibold rounded-lg hover:bg-red-100 transition"
                >
                  删除物品
                </button>
              </div>
            ) : (
              item.status === 'available' && (
                <button
                  onClick={handleBorrow}
                  className="w-full py-3 bg-[#4A3728] text-white font-semibold rounded-btn hover:bg-[#3A2A1E] transition"
                >
                  申请借用
                </button>
              )
            )}
          </div>
        </div>

        {item.borrowHistory && item.borrowHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-card border border-[#E8E0D5] shadow-card p-6">
            <h2 className="text-lg font-semibold text-[#4A3728] mb-4">借用记录</h2>
            <div className="space-y-3">
              {item.borrowHistory.map((borrow, i) => (
                <div key={borrow._id || i} className="flex items-center justify-between p-3 bg-[#F5F0E8] rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={borrow.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${borrow.user?.nickname || borrow.userName || 'user'}`}
                      alt={borrow.user?.nickname || borrow.userName || '用户'}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#4A3728]">{borrow.user?.nickname || borrow.userName || '用户'}</p>
                      <p className="text-xs text-[#B8A899]">
                        {borrow.status === 'pending' ? '等待审批' : borrow.status === 'approved' ? '已通过' : borrow.status === 'returned' ? '已归还' : borrow.status}
                      </p>
                    </div>
                  </div>
                  {isOwner && borrow.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(borrow._id)}
                        className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(borrow._id)}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                  {borrow.status === 'approved' && (isOwner || user?._id === borrow.user?._id || user?.id === borrow.user?._id) && (
                    <button
                      onClick={() => handleReturn(borrow._id)}
                      className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      确认归还
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;
