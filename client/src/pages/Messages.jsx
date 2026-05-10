import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?isRead=${filter === 'unread' ? 'false' : 'true'}` : '';
      const res = await axios.get(`/api/messages${params}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await axios.put(`/api/messages/${messageId}/read`);
      setMessages(messages.map(m => 
        m._id === messageId ? { ...m, isRead: true } : m
      ));
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('/api/messages/read-all');
      setMessages(messages.map(m => ({ ...m, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await axios.delete(`/api/messages/${messageId}`);
      setMessages(messages.filter(m => m._id !== messageId));
    } catch (error) {
      console.error('Failed to delete message');
    }
  };

  const handleMessageClick = async (message) => {
    if (!message.isRead) {
      await handleMarkAsRead(message._id);
    }

    if (message.type.startsWith('borrow_') && message.relatedItem) {
      navigate(`/items/${message.relatedItem}`);
    } else if (message.type === 'resource_comment' && message.relatedResource) {
      navigate(`/resources/${message.relatedResource}`);
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'borrow_request':
        return '📦';
      case 'borrow_approved':
        return '✅';
      case 'borrow_rejected':
        return '❌';
      case 'borrow_returned':
        return '🔄';
      case 'resource_comment':
        return '💬';
      case 'comment_reply':
        return '💬';
      default:
        return '📨';
    }
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'borrow_request':
        return 'bg-blue-50 border-blue-200';
      case 'borrow_approved':
        return 'bg-green-50 border-green-200';
      case 'borrow_rejected':
        return 'bg-red-50 border-red-200';
      case 'borrow_returned':
        return 'bg-purple-50 border-purple-200';
      case 'resource_comment':
        return 'bg-secondary-50 border-secondary-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">消息通知</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700"
          >
            全部标为已读
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="flex border-b">
          {[
            { key: 'all', label: '全部' },
            { key: 'unread', label: '未读' },
            { key: 'read', label: '已读' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-6 py-4 font-medium ${
                filter === tab.key
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">暂无消息</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message._id}
              onClick={() => handleMessageClick(message)}
              className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition ${getMessageColor(message.type)} border ${
                !message.isRead ? 'border-l-4' : ''
              }`}
              style={{ borderLeftColor: !message.isRead ? '#ef4444' : undefined }}
            >
              <div className="flex items-start space-x-4">
                <span className="text-2xl">{getMessageIcon(message.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-medium ${!message.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                        {message.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(message._id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Messages;