import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TextToImage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 单图模式
  const [singleImage, setSingleImage] = useState(null);

  // 文章 AI 分析模式
  const [analyzing, setAnalyzing] = useState(false);
  const [shotList, setShotList] = useState(null);
  const [shotsEnabled, setShotsEnabled] = useState({});

  // 批量生图
  const [batchId, setBatchId] = useState(null);
  const [batchTasks, setBatchTasks] = useState([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchDone, setBatchDone] = useState(0);

  // 历史记录
  const [history, setHistory] = useState([]);

  // 模式: 'manual' 手动多段生图, 'ai' AI 分析生图
  const mode = shotList ? 'ai' : 'manual';

  const getParagraphs = (text) => {
    return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  };

  // ====== 手动模式生图 ======
  const handleManualGenerate = async () => {
    const text = prompt.trim();
    if (!text) {
      setError('请输入描述文字');
      return;
    }

    const paragraphs = getParagraphs(text);

    // 单段 → 单图
    if (paragraphs.length <= 1) {
      setLoading(true);
      setError('');
      setSingleImage(null);
      setBatchId(null);
      try {
        const res = await axios.post('/api/text-to-image/submit', { prompt: text });
        await pollSingleResult(res.data.taskId);
      } catch (err) {
        setError(err.response?.data?.error || err.message || '提交失败');
        setLoading(false);
      }
      return;
    }

    // 多段 → 批量
    setLoading(true);
    setError('');
    setSingleImage(null);
    setBatchId(null);
    setBatchTasks(paragraphs.map(p => ({ prompt: p, status: 'processing', image: null, error: null })));
    setBatchTotal(paragraphs.length);
    setBatchDone(0);

    try {
      const res = await axios.post('/api/text-to-image/batch-submit', { prompts: paragraphs });
      setBatchId(res.data.batchId);
      pollBatchStatus(res.data.batchId);
    } catch (err) {
      setError(err.response?.data?.error || err.message || '批量提交失败');
      setLoading(false);
    }
  };

  // ====== AI 分析文章 ======
  const handleAnalyzeArticle = async () => {
    const text = prompt.trim();
    if (!text) {
      setError('请粘贴文章内容');
      return;
    }
    setAnalyzing(true);
    setError('');
    setShotList(null);
    setShotsEnabled({});
    setSingleImage(null);
    setBatchId(null);
    setBatchTasks([]);

    try {
      const res = await axios.post('/api/text-to-image/analyze-article', { article: text });
      const { shots, analysis } = res.data;
      setShotList({ analysis, shots });
      // 默认全部勾选
      const enabled = {};
      shots.forEach(s => { enabled[s.id] = true; });
      setShotsEnabled(enabled);
    } catch (err) {
      setError(err.response?.data?.error || err.message || '文章分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  // ====== AI 配图 → 批量生图 ======
  const handleAIGenerate = async () => {
    if (!shotList) return;
    const selectedPrompts = shotList.shots
      .filter(s => shotsEnabled[s.id])
      .map(s => s.prompt)
      .filter(Boolean);

    if (selectedPrompts.length === 0) {
      setError('请至少选择一张配图');
      return;
    }

    setLoading(true);
    setError('');
    setBatchId(null);
    setBatchTasks(selectedPrompts.map(p => ({ prompt: p.substring(0, 80), status: 'processing', image: null, error: null })));
    setBatchTotal(selectedPrompts.length);
    setBatchDone(0);

    try {
      const res = await axios.post('/api/text-to-image/batch-submit', { prompts: selectedPrompts });
      setBatchId(res.data.batchId);
      pollBatchStatus(res.data.batchId);
    } catch (err) {
      setError(err.response?.data?.error || err.message || '批量提交失败');
      setLoading(false);
    }
  };

  // ====== 轮询 ======
  const pollSingleResult = async (taskId) => {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await axios.get(`/api/text-to-image/status/${taskId}`);
        if (res.data.status === 'succeeded') {
          setSingleImage(res.data.image);
          setHistory(prev => [{ prompt: prompt.trim(), image: res.data.image }, ...prev].slice(0, 20));
          setLoading(false);
          return;
        }
        if (res.data.status === 'failed') {
          setError(res.data.error || '生成失败');
          setLoading(false);
          return;
        }
      } catch { /* retry */ }
    }
    setError('生成超时，请稍后重试');
    setLoading(false);
  };

  const pollBatchStatus = async (bid) => {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await axios.get(`/api/text-to-image/batch-status/${bid}`);
        const { tasks, allDone, done } = res.data;
        setBatchTasks(tasks);
        setBatchDone(done);
        if (allDone) {
          setLoading(false);
          const newItems = tasks.filter(t => t.status === 'succeeded' && t.image)
            .map(t => ({ prompt: t.prompt.substring(0, 60), image: t.image }));
          if (newItems.length > 0) {
            setHistory(prev => [...newItems, ...prev].slice(0, 20));
          }
          return;
        }
      } catch { /* retry */ }
    }
    setError('部分图片生成超时');
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleManualGenerate();
    }
  };

  // 从文字中截取简短文件名
  const shortName = (text, maxLen = 20) => {
    return text
      .replace(/[\\/:*?"<>|]/g, '')      // 去掉非法字符
      .replace(/\s+/g, '-')              // 空格转连字符
      .substring(0, maxLen)
      .replace(/-+$/, '')                 // 去掉尾部连字符
      || 'image';
  };

  const handleDownload = async (imageUrl, name = '') => {
    if (!imageUrl) return;
    const filename = name
      ? `${name}.png`
      : `ai-art-${Date.now()}.png`;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { window.open(imageUrl, '_blank'); return; }
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');
    } catch {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.click();
    }
  };

  // 全部下载（批量任务）
  const handleDownloadAll = async () => {
    for (let i = 0; i < batchTasks.length; i++) {
      const task = batchTasks[i];
      if (task.status === 'succeeded' && task.image) {
        const name = `${String(i + 1).padStart(2, '0')}-${shortName(task.prompt)}`;
        await handleDownload(task.image, name);
        // 间隔一点时间避免浏览器拦截多弹窗
        await new Promise(r => setTimeout(r, 300));
      }
    }
  };

  // 下载单图（带 prompt 命名）
  const handleDownloadSingle = (image, prompt) => {
    handleDownload(image, shortName(prompt));
  };

  const handleNew = () => {
    setPrompt('');
    setSingleImage(null);
    setError('');
    setBatchId(null);
    setBatchTasks([]);
    setShotList(null);
    setShotsEnabled({});
  };

  const toggleShot = (id) => {
    setShotsEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const paragraphs = mode === 'manual' ? getParagraphs(prompt.trim()) : [];

  // ====== 渲染 ======
  return (
    <div className="min-h-screen bg-[#F5F0E8] pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow text-gray-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">文生图</h1>
            <p className="text-sm text-gray-500">
              {mode === 'ai'
                ? 'AI 分析文章后按配图规划批量生成'
                : '一句话生成单张图，多段文章自动生成多张配图'}
            </p>
          </div>
          {shotList && (
            <button
              onClick={handleNew}
              className="ml-auto px-4 py-2 text-sm bg-white rounded-xl shadow-sm hover:shadow-md text-gray-600 transition-all"
            >
              新建
            </button>
          )}
        </div>

        {/* 输入区（无 AI 分析结果时显示） */}
        {!shotList && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`输入描述文字生成图片\n\n支持两种模式：\n1. 一句话/多段文字 → 手动生图\n2. 粘贴完整文章 → 点击 AI 分析，自动规划配图（需配置 DeepSeek API）`}
              className="w-full h-44 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent text-gray-700 placeholder-gray-400"
              maxLength={10000}
              disabled={loading || analyzing}
            />
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{prompt.length}/10000</span>
                {paragraphs.length > 1 && !loading && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    检测到 {paragraphs.length} 段
                  </span>
                )}
                {loading && batchTotal > 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    生成中 {batchDone}/{batchTotal}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {/* AI 分析按钮 */}
                <button
                  onClick={handleAnalyzeArticle}
                  disabled={analyzing || loading || !prompt.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      AI 分析中...
                    </span>
                  ) : 'AI 分析配图'}
                </button>
                {/* 手动生成按钮 */}
                <button
                  onClick={handleManualGenerate}
                  disabled={loading || analyzing || !prompt.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {batchTotal > 0 ? `生成中 ${batchDone}/${batchTotal}` : '生成中...'}
                    </span>
                  ) : (
                    paragraphs.length > 1 ? `手动生成 ${paragraphs.length} 张` : '手动生成'
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}
          </div>
        )}

        {/* ====== AI 配图规划（shot list） ====== */}
        {shotList && !batchTasks.length && (
          <div className="space-y-4 mb-6">
            {/* 分析总结 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">AI 配图规划</h3>
                  {shotList.analysis && (
                    <p className="text-sm text-gray-500 mt-1">{shotList.analysis}</p>
                  )}
                </div>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {Object.values(shotsEnabled).filter(Boolean).length}/{shotList.shots.length} 张已选
                </span>
              </div>

              {/* Shot 列表 */}
              <div className="space-y-3">
                {shotList.shots.map((shot) => (
                  <div
                    key={shot.id}
                    className={`rounded-xl border-2 transition-all p-4 cursor-pointer ${
                      shotsEnabled[shot.id]
                        ? 'border-indigo-300 bg-indigo-50/30'
                        : 'border-gray-200 bg-gray-50/50 opacity-60'
                    }`}
                    onClick={() => toggleShot(shot.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        shotsEnabled[shot.id]
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {shotsEnabled[shot.id] && <span className="text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800 text-sm">
                            {shot.id}. {shot.theme}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">
                            {shot.structureType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{shot.coreIdea}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {shot.elements?.map((el, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">{el}</span>
                          ))}
                        </div>
                        {shot.guoguoAction && (
                          <p className="text-xs text-violet-500 mt-1">
                            🎀 {shot.guoguoAction}
                          </p>
                        )}
                        {shot.labels?.length > 0 && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            标注：{shot.labels.join(' / ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleNew}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  取消，重新输入
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={loading || Object.values(shotsEnabled).filter(Boolean).length === 0}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {loading ? '生成中...' : `生成 ${Object.values(shotsEnabled).filter(Boolean).length} 张配图`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== 批量生图结果 ====== */}
        {batchTasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">生成结果</h3>
              {batchDone === batchTotal && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadAll}
                    className="px-4 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                  >
                    全部下载
                  </button>
                  <button
                    onClick={() => {
                      setBatchTasks([]);
                      setBatchId(null);
                      setShotList(null);
                    }}
                    className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  >
                    重新生成
                  </button>
                </div>
              )}
              {batchTotal > 0 && (
                <span className="text-xs text-gray-400">{batchDone}/{batchTotal}</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {batchTasks.map((task, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                  <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center relative">
                    {task.status === 'waiting' && (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                        <span className="text-xs">排队中...</span>
                      </div>
                    )}
                    {task.status === 'processing' && (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs">生成中...</span>
                      </div>
                    )}
                    {task.status === 'failed' && (
                      <div className="text-red-400 text-xs px-4 text-center">{task.error || '生成失败'}</div>
                    )}
                    {task.status === 'succeeded' && task.image && (
                      <img src={task.image} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 line-clamp-2">{task.prompt}</p>
                    {task.status === 'succeeded' && task.image && (
                      <button
                        onClick={() => handleDownload(task.image, shortName(task.prompt))}
                        className="mt-2 text-xs text-amber-600 hover:text-amber-700"
                      >
                        下载
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== 单图结果 ====== */}
        {singleImage && mode === 'manual' && !batchTasks.length && !shotList && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">生成结果</h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownloadSingle(singleImage, prompt)} className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">下载图片</button>
                <button onClick={handleNew} className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">重新生成</button>
              </div>
            </div>
            <div className="flex justify-center bg-gray-50 rounded-xl p-4">
              <img src={singleImage} alt={prompt} className="max-w-full h-auto rounded-lg shadow-sm" style={{ maxHeight: '60vh' }} />
            </div>
            <p className="mt-3 text-sm text-gray-400 italic">"{prompt}"</p>
          </div>
        )}

        {/* ====== 历史记录 ====== */}
        {history.length > 0 && !batchTasks.length && !shotList && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">历史记录</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.prompt);
                    setSingleImage(item.image);
                    setError('');
                    setBatchId(null);
                    setBatchTasks([]);
                    setShotList(null);
                  }}
                  className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100 hover:ring-2 hover:ring-amber-400 transition-all"
                >
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2">
                    <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2 text-left">
                      {item.prompt}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====== 使用提示 ====== */}
        {!singleImage && !batchTasks.length && !shotList && history.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">使用提示</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• <strong>一句话生图</strong>：输入描述，点击生成</li>
              <li>• <strong>多段文章手动生图</strong>：用空行分隔各段，每段生成一张图</li>
              <li>• <strong>AI 文章配图</strong>：粘贴完整文章 → 点击"AI 分析配图" → 自动规划 4-8 张王果果配图 → 确认后批量生成</li>
              <li>• 需要先在后台配置 <strong>DeepSeek API Key</strong> 才能使用 AI 分析功能</li>
              <li>• 按 Ctrl+Enter 快速生成</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
