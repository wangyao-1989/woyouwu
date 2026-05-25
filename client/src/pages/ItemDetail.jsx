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
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowDate, setBorrowDate] = useState('');
  const [borrowMessage, setBorrowMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await axios.get(`/api/items/${id}`);
      setItem(res.data);
    } catch (error) {
      console.error('Failed to fetch item');
      navigate('/items');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!borrowDate) {
      setBorrowMessage('请选择预计归还时间');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/items/${id}/borrow`, {
        expectedReturnDate: borrowDate
      });
      alert('借用申请已发送！');
      setShowBorrowModal(false);
      fetchItem();
    } catch (error) {
      setBorrowMessage(error.response?.data?.message || '申请失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (borrowerId, messageId, expectedReturnDate) => {
    try {
      await axios.post(`/api/items/${id}/approve/${messageId}`, {
        borrowerId,
        expectedReturnDate
      });
      alert('已同意借用');
      fetchItem();
    } catch (error) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleReject = async (messageId) => {
    try {
      await axios.post(`/api/items/${id}/reject/${messageId}`);
      alert('已拒绝');
      fetchItem();
    } catch (error) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleReturn = async () => {
    try {
      await axios.post(`/api/items/${id}/return`);
      alert('物品已归还');
      fetchItem();
    } catch (error) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '可借用':
        return 'bg-green-100 text-green-800';
      case '已借出':
        return 'bg-red-100 text-red-800';
      case '维修中':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      '数码电子': '📱',
      '家居生活': '🏠',
      '服饰配饰': '👗',
      '图书文具': '📖',
      '运动户外': '⚽',
      '母婴用品': '🍼',
      '美妆护肤': '💄',
      '食品饮料': '🍜',
      '工具器械': '🔧',
      '工具': '🔧',
      '衣物': '👕',
      '药物': '💊',
      '会员卡券': '💳',
      '会员卡': '💳',
      '其他': '📦'
    };
    return icons[category] || '📦';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">物品不存在</p>
      </div>
    );
  }

  const isOwner = user?.id === item.owner?._id || user?.id === item.owner;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <button onClick={() => navigate(-1)} className="mb-6 text-gray-600 hover:text-gray-800 flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
          <div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {item.images.map((img, index) => (
                <img
                  key={index}
                  src={`${img}`}
                  alt={`${item.name} ${index + 1}`}
                  className={`w-full h-24 object-cover rounded-lg cursor-pointer ${index === 0 ? 'col-span-4 h-64' : ''}`}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{item.name}</h1>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{item.category}</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>

            {item.remark && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-1">备注</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{item.remark}</p>
              </div>
            )}

            {(item.condition || item.borrowStartDate || item.borrowEndDate) && (
              <div className="flex flex-wrap gap-3 mb-6">
                {item.condition && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.condition}
                  </span>
                )}
                {(item.borrowStartDate || item.borrowEndDate) && (
                  <span className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    可借{item.borrowStartDate ? ` ${new Date(item.borrowStartDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}` : ''}{item.borrowStartDate && item.borrowEndDate ? ' ~' : ''}{item.borrowEndDate ? ` ${new Date(item.borrowEndDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}` : item.borrowStartDate ? ' 起' : ''}
                  </span>
                )}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-1">位置/存放点</h3>
              <p className="text-gray-600">{item.location || '未指定'}</p>
            </div>

            <div className="border-t pt-6 mb-6">
              <div className="flex items-center mb-4">
                <img
                  src={item.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.ownerName}`}
                  alt={item.ownerName}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-medium text-gray-800">{item.ownerName}</p>
                  <p className="text-sm text-gray-500">物品小主</p>
                </div>
              </div>

              {(item.contactWechat || item.contactPhone || item.contactEmail) && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">联系方式</h3>
                  {item.contactWechat && <p className="text-sm text-gray-600">微信：{item.contactWechat}</p>}
                  {item.contactPhone && <p className="text-sm text-gray-600">电话：{item.contactPhone}</p>}
                  {item.contactEmail && <p className="text-sm text-gray-600">邮箱：{item.contactEmail}</p>}
                </div>
              )}
            </div>

            {item.status === '已借出' && item.borrowerName && (
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <h3 className="text-sm font-medium text-red-700 mb-1">当前借用人</h3>
                <p className="text-red-600">{item.borrowerName}</p>
                {item.expectedReturnDate && (
                  <p className="text-sm text-red-500">预计归还：{new Date(item.expectedReturnDate).toLocaleDateString()}</p>
                )}
              </div>
            )}

            {!isOwner && user && item.status === '可借用' && (
              <button
                onClick={() => setShowBorrowModal(true)}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
              >
                申请借用
              </button>
            )}

            {!user && (
              <Link
                to="/login"
                className="block w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition text-center"
              >
                登录后可借用
              </Link>
            )}

            {isOwner && (
              <div className="space-y-3">
                <Link
                  to={`/items/edit/${item._id}`}
                  className="block w-full py-3 bg-secondary-600 text-white font-semibold rounded-lg hover:bg-secondary-700 transition text-center"
                >
                  编辑物品
                </Link>
                {item.status === '已借出' && (
                  <button
                    onClick={handleReturn}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                  >
                    确认归还
                  </button>
                )}
                {item.status === '可借用' && (
                  <button
                    onClick={async () => {
                      await axios.put(`/api/items/${item._id}`, { status: '维修中' });
                      fetchItem();
                    }}
                    className="w-full py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition"
                  >
                    设为维修中
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {item.borrowHistory && item.borrowHistory.length > 0 && (
          <div className="border-t px-6 lg:px-8 py-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">借用历史</h3>
            <div className="space-y-3">
              {item.borrowHistory.map((record, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{record.borrowerName}</p>
                      <p className="text-sm text-gray-500">
                        借出时间：{new Date(record.createdAt).toLocaleDateString()}
                      </p>
                      {record.expectedReturnDate && (
                        <p className="text-sm text-gray-500">
                          预计归还：{new Date(record.expectedReturnDate).toLocaleDateString()}
                        </p>
                      )}
                      {record.actualReturnDate && (
                        <p className="text-sm text-green-600">
                          已于 {new Date(record.actualReturnDate).toLocaleDateString()} 归还
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === 'approved' ? 'bg-green-100 text-green-800' :
                      record.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                      record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status === 'approved' ? '借用中' :
                       record.status === 'returned' ? '已归还' :
                       record.status === 'pending' ? '待审批' : '已拒绝'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showBorrowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">申请借用</h3>
            <p className="text-gray-600 mb-4">物品：{item.name}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预计归还时间
              </label>
              <input
                type="date"
                value={borrowDate}
                onChange={(e) => setBorrowDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {borrowMessage && (
              <p className="text-red-500 text-sm mb-4">{borrowMessage}</p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBorrow}
                disabled={submitting}
                className="flex-1 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交申请'}
              </button>
              <button
                onClick={() => {
                  setShowBorrowModal(false);
                  setBorrowMessage('');
                }}
                className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemDetail;