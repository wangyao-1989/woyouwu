import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-8 max-w-md w-full text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-lg font-semibold text-[#4A3728] mb-2">页面遇到了错误</h2>
            <p className="text-sm text-gray-500 mb-4">请尝试刷新页面，或返回首页</p>
            <p className="text-xs text-red-400 mb-4 bg-red-50 p-2 rounded-lg overflow-auto max-h-24">
              {this.state.error?.message || '未知错误'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#4A3728] text-white rounded-btn text-sm hover:bg-[#3A2A1E] transition"
              >
                刷新页面
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-[#F5F0E8] text-[#4A3728] rounded-btn text-sm hover:bg-[#E8DCD0] transition border border-[#E8E0D5]"
              >
                返回首页
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}