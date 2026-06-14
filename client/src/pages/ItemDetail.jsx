import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    expectedReturnDate: '',
    pickupMethod: 'self_pickup',
    message: '',
    contactInfo: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const borrowFormRef = useRef(null);

  const openBorrowForm = () => {
    setShowBorrowForm(true);
    setTimeout(() => {
      borrowFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

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
    
    if (!borrowForm.expectedReturnDate) {
      alert('请选择预计归还时间');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/items/${id}/borrow`, borrowForm);
      
      // 重新获取完整的物品数据
      const { data } = await axios.get(`/api/items/${id}`);
      setItem(data);
      
      setShowBorrowForm(false);
      setBorrowForm({
        expectedReturnDate: '',
        pickupMethod: 'self_pickup',
        message: '',
        contactInfo: ''
      });
      alert('借用申请已发送！');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || '借用请求失败');
    } finally {
      setSubmitting(false);
    }
  };

  const refreshItem = async () => {
    const { data } = await axios.get(`/api/items/${id}`);
    setItem(data);
  };

  const handleApprove = async (borrowRecord, messageId) => {
    try {
      await axios.post(`/api/items/${id}/approve/${messageId}`, {
        borrowerId: borrowRecord.borrower?._id || borrowRecord.borrower,
        expectedReturnDate: borrowRecord.expectedReturnDate
      });
      await refreshItem();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async (messageId) => {
    try {
      await axios.post(`/api/items/${id}/reject/${messageId}`);
      await refreshItem();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || '操作失败');
    }
  };

  const handleReturn = async (borrowId) => {
    try {
      await axios.post(`/api/items/${id}/return/${borrowId}`);
      await refreshItem();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || '操作失败');
    }
  };

  const handleShip = async (borrowId) => {
    try {
      await axios.post(`/api/items/${id}/ship/${borrowId}`);
      await refreshItem();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || '操作失败');
    }
  };

  const handlePickup = async (borrowId) => {
    try {
      await axios.post(`/api/items/${id}/pickup/${borrowId}`);
      await refreshItem();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || '操作失败');
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

  const hasApprovedBorrow = user && item.borrowHistory && item.borrowHistory.some(
    b => b.status === 'approved' && (
      (b.borrower?._id || b.borrower) === (user._id || user.id)
    )
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
    <div className="min-h-screen pt-20 bg-[#F5F0E8] fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="cube" className="w-12 h-12 text-[#B8A899]" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3 self-start"
              style={{ backgroundColor: tagStyle.bg, color: tagStyle.color }}
            >
              {item.type === 'stuff' ? (
                <Icon name="cube" className="w-3 h-3" />
              ) : (
                <Icon name="file" className="w-3 h-3" />
              )}{' '}
              {getStatusLabel(item.status)}
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
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    查看 <Icon name="link" className="w-3.5 h-3.5" />
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

            {(item.owner?.contactWechat || item.owner?.contactPhone || item.owner?.contactEmail || item.contactWechat || item.contactPhone || item.contactEmail) && (isOwner || hasApprovedBorrow) && (
              <div className="mb-6 p-4 bg-[#FFF9F0] rounded-card border border-[#E8D4B8]">
                <h3 className="text-sm font-semibold text-[#4A3728] mb-3">联系方式</h3>
                <div className="space-y-2 text-sm">
                  {(item.owner?.contactWechat || item.contactWechat) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#B8A899]">微信:</span>
                      <span className="text-[#4A3728]">{item.owner?.contactWechat || item.contactWechat}</span>
                    </div>
                  )}
                  {(item.owner?.contactPhone || item.contactPhone) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#B8A899]">电话:</span>
                      <a href={`tel:${item.owner?.contactPhone || item.contactPhone}`} className="text-blue-600 hover:underline">
                        {item.owner?.contactPhone || item.contactPhone}
                      </a>
                    </div>
                  )}
                  {(item.owner?.contactEmail || item.contactEmail) && (
                    <div className="flex items-center gap-2">
                      <span className="text-[#B8A899]">邮箱:</span>
                      <a href={`mailto:${item.owner?.contactEmail || item.contactEmail}`} className="text-blue-600 hover:underline">
                        {item.owner?.contactEmail || item.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!isOwner && !hasApprovedBorrow && (item.owner?.contactWechat || item.owner?.contactPhone || item.owner?.contactEmail || item.contactWechat || item.contactPhone || item.contactEmail) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-card border border-gray-200 text-center">
                <div className="flex justify-center mb-1"><Icon name="lock" className="w-5 h-5 text-gray-400" /></div>
                <p className="text-sm text-gray-500">申请通过后将显示发布者联系方式</p>
              </div>
            )}

            {/* 调试信息 - 可以在正式版本中删除 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p>调试信息:</p>
                <p>用户: {user ? user.nickname : '未登录'} ({user ? user._id : '-'})</p>
                <p>物品状态: {item.status}</p>
                <p>是否拥有者: {isOwner ? '是' : '否'}</p>
              </div>
            )}

            {/* 交互区域 */}
            <div className="space-y-3">
              {isOwner ? (
                <>
                  {/* 物品拥有者视图 */}
                  {item.borrowHistory && item.borrowHistory.some(b => b.status === 'pending') && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-800 mb-3">📦 待处理的借用申请</h3>
                      <div className="space-y-2">
                        {item.borrowHistory.filter(b => b.status === 'pending').map((borrow, i) => (
                          <div key={borrow._id || i} className="p-3 bg-white rounded-lg text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-[#4A3728]">{borrow.borrowerName || '用户'}</span>
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">等待审批</span>
                            </div>
                            <div className="text-xs text-[#8B7355] space-y-1 mb-3">
                              <p>预计归还: {borrow.expectedReturnDate ? new Date(borrow.expectedReturnDate).toLocaleDateString() : '未指定'}</p>
                              <p>取用方式: {borrow.pickupMethod === 'delivery' || borrow.pickupMethod === '邮寄' ? '邮寄' : '自取'}</p>
                              {borrow.message && <p>留言: {borrow.message}</p>}
                              {borrow.contactInfo && isOwner && <p>联系方式: {borrow.contactInfo}</p>}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(borrow, borrow.messageId)}
                                className="flex-1 py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600 active:scale-95 transition"
                              >
                                <span className="flex items-center justify-center gap-1"><Icon name="check" className="w-4 h-4" /> 通过</span>
                              </button>
                              <button
                                onClick={() => handleReject(borrow.messageId)}
                                className="flex-1 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600 active:scale-95 transition"
                              >
                                <span className="flex items-center justify-center gap-1"><Icon name="x" className="w-4 h-4" /> 拒绝</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {item.borrowHistory && item.borrowHistory.some(b => b.status === 'approved') && (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-green-800 mb-3">✅ 已通过的借用</h3>
                      <div className="space-y-2">
                        {item.borrowHistory.filter(b => b.status === 'approved').map((borrow, i) => (
                          <div key={borrow._id || i} className="p-3 bg-white rounded-lg text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-[#4A3728]">{borrow.borrowerName || '用户'}</span>
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">已通过</span>
                            </div>
                            <div className="text-xs text-[#8B7355] mb-3">
                              <p>取用方式: {borrow.pickupMethod === 'delivery' || borrow.pickupMethod === '邮寄' ? '邮寄' : '自取'}</p>
                            </div>
                            <button
                              onClick={() => borrow.pickupMethod === 'delivery' || borrow.pickupMethod === '邮寄' ? handleShip(borrow._id) : handlePickup(borrow._id)}
                              className={`w-full py-2 ${borrow.pickupMethod === 'delivery' || borrow.pickupMethod === '邮寄' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white font-medium rounded active:scale-95 transition`}
                            >
                              <span className="flex items-center justify-center gap-1.5">
                                {borrow.pickupMethod === 'delivery' || borrow.pickupMethod === '邮寄' ? (
                                  <><Icon name="mail" className="w-4 h-4" /> 确认发货</>
                                ) : (
                                  <><Icon name="hand" className="w-4 h-4" /> 确认对方已取货</>
                                )}
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Link
                    to={`/items/edit/${item._id}`}
                    className="block w-full py-3 bg-warm-600 text-white font-semibold rounded-lg hover:bg-warm-900 active:scale-95 transition text-center"
                  >
                    编辑物品
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="w-full py-3 bg-red-50 text-red-500 font-semibold rounded-lg hover:bg-red-100 active:scale-95 transition"
                  >
                    删除物品
                  </button>
                </>
              ) : (
                <>
                  {/* 非拥有者视图（借用人） */}
                  {!user && (
                    <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600 mb-3">登录后可以申请借用此物品</p>
                      <Link
                        to="/login"
                        className="inline-block px-6 py-2 bg-[#4A3728] text-white font-medium rounded-lg hover:bg-[#3A2A1E] active:scale-95 transition"
                      >
                        登录 / 注册
                      </Link>
                    </div>
 )}
                  
                  {(item.status === 'available' || item.status === '可借用') && user && (
                    !showBorrowForm ? (
                      <button
                        onClick={openBorrowForm}
                        className="w-full py-3 bg-[#4A3728] text-white font-semibold rounded-lg hover:bg-[#3A2A1E] active:scale-95 transition"
                      >
                        申请借用
                      </button>
                    ) : (
                      <div ref={borrowFormRef} className="space-y-4 p-4 bg-white rounded-card border border-[#E8E0D5]">
                        <h3 className="text-base font-semibold text-[#4A3728]">借用申请</h3>
                        
                        <div>
                          <label className="block text-sm text-[#8B7355] mb-2">预计归还时间 *</label>
                          <input
                            type="date"
                            value={borrowForm.expectedReturnDate}
                            onChange={(e) => setBorrowForm({...borrowForm, expectedReturnDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-[#E8E0D5] rounded-lg focus:ring-2 focus:ring-[#4A3728] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-[#8B7355] mb-2">取用方式</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="pickupMethod"
                                value="self_pickup"
                                checked={borrowForm.pickupMethod === 'self_pickup'}
                                onChange={(e) => setBorrowForm({...borrowForm, pickupMethod: e.target.value})}
                                className="w-4 h-4 text-[#4A3728]"
                              />
                              <span className="text-sm text-[#4A3728]">自取</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="pickupMethod"
                                value="delivery"
                                checked={borrowForm.pickupMethod === 'delivery'}
                                onChange={(e) => setBorrowForm({...borrowForm, pickupMethod: e.target.value})}
                                className="w-4 h-4 text-[#4A3728]"
                              />
                              <span className="text-sm text-[#4A3728]">邮寄</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-[#8B7355] mb-2">留言（可选）</label>
                          <textarea
                            value={borrowForm.message}
                            onChange={(e) => setBorrowForm({...borrowForm, message: e.target.value})}
                            placeholder="告诉物品主人你想借用原因..."
                            rows={3}
                            maxLength={500}
                            className="w-full px-3 py-2 border border-[#E8E0D5] rounded-lg focus:ring-2 focus:ring-[#4A3728] focus:border-transparent resize-none"
                          />
                          <p className="text-xs text-[#B8A899] mt-1">{borrowForm.message.length}/500</p>
                        </div>

                        <div>
                          <label className="block text-sm text-[#8B7355] mb-2">您的联系方式（可选）</label>
                          <input
                            type="text"
                            value={borrowForm.contactInfo}
                            onChange={(e) => setBorrowForm({...borrowForm, contactInfo: e.target.value})}
                            placeholder="微信号或手机号"
                            className="w-full px-3 py-2 border border-[#E8E0D5] rounded-lg focus:ring-2 focus:ring-[#4A3728] focus:border-transparent"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleBorrow}
                            disabled={submitting}
                            className="flex-1 py-2 bg-[#4A3728] text-white font-semibold rounded-lg hover:bg-[#3A2A1E] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? '提交中...' : '提交申请'}
                          </button>
                          <button
                            onClick={() => {
                              setShowBorrowForm(false);
                              setBorrowForm({
                                expectedReturnDate: '',
                                pickupMethod: 'self_pickup',
                                message: '',
                                contactInfo: ''
                              });
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 active:scale-95 transition"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )
                  )}

                  {(item.status !== 'available' && item.status !== '可借用') && user && (
                    <div className="w-full py-3 bg-gray-100 text-gray-500 font-semibold rounded-lg text-center">
                      {getStatusLabel(item.status)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {item.borrowHistory && item.borrowHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-card border border-[#E8E0D5] shadow-card p-6">
            <h2 className="text-lg font-semibold text-[#4A3728] mb-4">借用记录</h2>
            <div className="space-y-3">
              {item.borrowHistory.map((borrow, i) => (
                <div key={borrow._id || i} className="flex items-center justify-between p-3 bg-[#F5F0E8] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={borrow.borrower?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${borrow.borrower?.nickname || borrow.borrowerName || 'user'}`}
                        alt={borrow.borrower?.nickname || borrow.borrowerName || '用户'}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-[#4A3728]">{borrow.borrower?.nickname || borrow.borrowerName || '用户'}</p>
                        <p className="text-xs text-[#B8A899]">
                          {borrow.status === 'pending' ? '等待审批' : borrow.status === 'approved' ? '已通过' : borrow.status === 'shipped' ? '已发货' : borrow.status === 'picked_up' ? '已取货' : borrow.status === 'returned' ? '已归还' : borrow.status === 'rejected' ? '已拒绝' : borrow.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-[#8B7355] space-y-1">
                      <p>预计归还: {borrow.expectedReturnDate ? new Date(borrow.expectedReturnDate).toLocaleDateString() : '未指定'}</p>
                      <p>取用方式: {borrow.pickupMethod === 'delivery' || borrow.pickupMethod === '邮寄' ? '邮寄' : '自取'}</p>
                      {borrow.message && <p>留言: {borrow.message}</p>}
                      {borrow.contactInfo && isOwner && <p>联系方式: {borrow.contactInfo}</p>}
                    </div>
                  </div>
                  {isOwner && borrow.status === 'pending' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(borrow, borrow.messageId)}
                        className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 active:scale-95 transition whitespace-nowrap"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(borrow.messageId)}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-500 rounded-lg hover:bg-red-200 active:scale-95 transition whitespace-nowrap"
                      >
                        拒绝
                      </button>
                    </div>
                  )}
                  {borrow.status === 'approved' && isOwner && (
                    <div className="flex flex-col gap-2 ml-4">
                      {borrow.pickupMethod === 'delivery' || borrow.pickupMethod === '邮寄' ? (
                        <button
                          onClick={() => handleShip(borrow._id)}
                          className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 active:scale-95 transition whitespace-nowrap"
                        >
                          确认发货
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePickup(borrow._id)}
                          className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 active:scale-95 transition whitespace-nowrap"
                        >
                          确认取货
                        </button>
                      )}
                    </div>
                  )}
                  {(borrow.status === 'approved' || borrow.status === 'shipped' || borrow.status === 'picked_up') && isOwner && (
                    <button
                      onClick={() => handleReturn(borrow._id)}
                      className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 active:scale-95 transition whitespace-nowrap ml-4"
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
