import { useState } from 'react';

const TOOLS = [
  { id: 'pdf2word', label: 'PDF 转 Word', icon: '📄', desc: '提取文字及格式，生成可编辑 Word', group: 'pdf' },
  { id: 'pdfmerge', label: 'PDF 合并', icon: '📎', desc: '多个 PDF 合并为一个', group: 'pdf' },
  { id: 'ocr2word', label: '图片转 Word', icon: '📷', desc: 'OCR 识别图片文字，生成 Word', group: 'image' },
  { id: 'removebg', label: 'AI 背景去除', icon: '✂️', desc: '智能去除图片背景，生成透明PNG', group: 'image' },
  { id: 'imgcompress', label: '图片压缩', icon: '🗜️', desc: '压缩图片体积，可调质量与尺寸', group: 'image' },
  { id: 'img2pdf', label: '图片转 PDF', icon: '🖼️', desc: '多张图片合成 PDF 文档', group: 'image' },
];

export default function DocumentConverter() {
  const [activeTool, setActiveTool] = useState('pdf2word');
  const [output, setOutput] = useState('');
  const [outputType, setOutputType] = useState('text');
  const [outputFilename, setOutputFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  const showResult = (content, type, filename) => {
    setOutput(content);
    setOutputType(type || 'text');
    setOutputFilename(filename || '');
    setError('');
    setLoading(false);
    setProgress(0);
    setProgressMsg('');
  };

  // ---- PDF to Word (backend LibreOffice, professional quality) ----
  const handlePdfToWord = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgressMsg('正在上传并转换 PDF...');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert/pdf-to-docx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || '服务器转换失败');
      }

      const blob = await response.blob();
      showResult(URL.createObjectURL(blob), 'download', file.name.replace('.pdf', '') + '.docx');
    } catch (err) {
      setError('PDF 转换失败: ' + err.message);
      setLoading(false);
    }
  };

  // ---- Image OCR to Word (PaddleOCR API, layout-preserving) ----
  const handleOcrToWord = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgress(10);
    setProgressMsg('正在上传图片...');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);
      setProgressMsg('正在调用 PaddleOCR 进行布局分析...');

      const response = await fetch('/api/convert/image-to-docx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || '服务器转换失败');
      }

      setProgress(90);
      setProgressMsg('正在生成 Word 文档...');

      const blob = await response.blob();
      showResult(URL.createObjectURL(blob), 'download', file.name.replace(/\.[^.]+$/, '') + '.docx');
    } catch (err) {
      setError('图片转 Word 失败: ' + err.message);
      setLoading(false);
    }
  };

  // ---- PDF Merge ----
  const [pdfMergeFiles, setPdfMergeFiles] = useState([]);

  const handlePdfMergeAdd = function(e) {
    var files = Array.from(e.target.files || []);
    setPdfMergeFiles(function(prev) { return prev.concat(files); });
    e.target.value = '';
  };

  const handlePdfMerge = async function() {
    if (pdfMergeFiles.length < 2) { setError('请至少添加 2 个 PDF 文件'); return; }
    setLoading(true);
    setError('');
    try {
      var PDFDocument = (await import('pdf-lib')).PDFDocument;
      var merged = await PDFDocument.create();
      for (var i = 0; i < pdfMergeFiles.length; i++) {
        setProgress(Math.round(((i + 1) / pdfMergeFiles.length) * 100));
        setProgressMsg('合并 ' + (i + 1) + '/' + pdfMergeFiles.length + '...');
        var buf = await pdfMergeFiles[i].arrayBuffer();
        var doc = await PDFDocument.load(buf);
        var pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(function(p) { merged.addPage(p); });
      }
      var mergedBytes = await merged.save();
      var blob = new Blob([mergedBytes], { type: 'application/pdf' });
      showResult(URL.createObjectURL(blob), 'download', 'merged.pdf');
    } catch (err) {
      setError('PDF 合并失败: ' + err.message);
      setLoading(false);
    }
  };

  // ---- Image Background Removal (rembg, local AI) ----
  const [removeBgResult, setRemoveBgResult] = useState(null);

  const handleRemoveBg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgressMsg('正在去除背景...');
    setError('');
    setRemoveBgResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/convert/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || '处理失败');
      }

      const blob = await response.blob();
      setRemoveBgResult(URL.createObjectURL(blob));
      showResult(URL.createObjectURL(blob), 'image', 'nobg.png');
    } catch (err) {
      setError('背景去除失败: ' + err.message);
      setLoading(false);
    }
  };

  // ---- Image Compress ----
  const [imgCompressSrc, setImgCompressSrc] = useState(null);
  const [imgCompressName, setImgCompressName] = useState('');
  const [imgCompressOrigSize, setImgCompressOrigSize] = useState(0);
  const [imgCompressQuality, setImgCompressQuality] = useState(0.7);
  const [imgCompressMaxW, setImgCompressMaxW] = useState(1920);
  const [imgCompressResult, setImgCompressResult] = useState(null);

  const handleImgCompressUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgCompressName(file.name.replace(/\.[^.]+$/, ''));
    setImgCompressOrigSize(file.size);
    setImgCompressResult(null);
    const reader = new FileReader();
    reader.onload = () => setImgCompressSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const doCompress = () => {
    if (!imgCompressSrc) return;
    setLoading(true);
    setProgressMsg('压缩中...');
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > imgCompressMaxW) { h = Math.round(h * imgCompressMaxW / w); w = imgCompressMaxW; }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        setImgCompressResult({ url: URL.createObjectURL(blob), size: blob.size, w, h });
        showResult(URL.createObjectURL(blob), 'image', imgCompressName + '_compressed.jpg');
      }, 'image/jpeg', imgCompressQuality);
    };
    img.src = imgCompressSrc;
  };

  // ---- Image to PDF ----
  const [img2pdfFiles, setImg2pdfFiles] = useState([]);

  const handleImg2pdfAdd = (e) => {
    const files = Array.from(e.target.files || []);
    setImg2pdfFiles((prev) => prev.concat(files));
    e.target.value = '';
  };

  const doImg2pdf = async () => {
    if (img2pdfFiles.length === 0) { setError('请先添加图片'); return; }
    setLoading(true);
    setProgressMsg('正在生成 PDF...');
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      for (let i = 0; i < img2pdfFiles.length; i++) {
        setProgress(Math.round(((i + 1) / img2pdfFiles.length) * 100));
        setProgressMsg(`处理 ${i + 1}/${img2pdfFiles.length}...`);
        const file = img2pdfFiles[i];
        const buf = await file.arrayBuffer();
        // Determine image type
        let img;
        if (file.type === 'image/png') {
          img = await doc.embedPng(buf);
        } else if (file.type === 'image/jpeg') {
          img = await doc.embedJpg(buf);
        } else {
          img = await doc.embedPng(buf);
        }
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      showResult(URL.createObjectURL(blob), 'download', 'images.pdf');
    } catch (err) {
      setError('图片转 PDF 失败: ' + err.message);
      setLoading(false);
    }
  };

  // ---- Output helpers ----
  const downloadOutput = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = outputFilename || 'output';
    a.click();
  };

  const copyOutput = () => {
    if (outputType === 'image' || outputType === 'download') {
      navigator.clipboard.writeText(output).then(() => alert('已复制'));
    } else {
      navigator.clipboard.writeText(output).then(() => alert('已复制'));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📄 文档转换工具</h1>
          <p className="text-gray-500">PDF/图片转 Word 通过后端专业引擎处理，其他转换在浏览器本地完成</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <span className="text-xs text-gray-400 self-center mr-1">PDF</span>
          {TOOLS.filter(t => t.group === 'pdf').map(function(tool) {
            return (
              <button
                key={tool.id}
                onClick={function() { setActiveTool(tool.id); setOutput(''); setError(''); }}
                className={'px-4 py-2 rounded-xl text-sm font-medium transition-all ' +
                  (activeTool === tool.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200')}
              >
                <span className="mr-1.5">{tool.icon}</span>
                {tool.label}
              </button>
            );
          })}
          <span className="w-full" />
          <span className="text-xs text-gray-400 self-center mr-1">图片</span>
          {TOOLS.filter(t => t.group === 'image').map(function(tool) {
            return (
              <button
                key={tool.id}
                onClick={function() { setActiveTool(tool.id); setOutput(''); setError(''); }}
                className={'px-4 py-2 rounded-xl text-sm font-medium transition-all ' +
                  (activeTool === tool.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200')}
              >
                <span className="mr-1.5">{tool.icon}</span>
                {tool.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {activeTool === 'pdf2word' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">PDF → Word</h2>
              <p className="text-sm text-gray-500">上传 PDF 文件，自动提取所有页面文字并生成 .docx 格式的 Word 文档。</p>
              <input type="file" accept=".pdf,application/pdf" onChange={handlePdfToWord}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
            </div>
          )}

          {activeTool === 'ocr2word' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">图片 → Word (PaddleOCR 版面还原)</h2>
              <p className="text-sm text-gray-500">上传图片（截图、扫描件等），通过 PaddleOCR-VL 云端引擎自动识别标题、段落、表格布局，生成保留排版的 .docx 文档。</p>
              <input type="file" accept="image/*" onChange={handleOcrToWord}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
              />
            </div>
          )}

          {activeTool === 'pdfmerge' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">PDF 合并</h2>
              <p className="text-sm text-gray-500">选择多个 PDF 文件，按添加顺序合并为一个 PDF。</p>
              <div className="flex gap-3 items-center">
                <input type="file" accept=".pdf,application/pdf" multiple onChange={handlePdfMergeAdd}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                />
              </div>
              {pdfMergeFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">已添加 {pdfMergeFiles.length} 个文件：</p>
                  <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                    {pdfMergeFiles.map(function(f, i) {
                      return (
                        <li key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-1">
                          <span>{i + 1}. {f.name}</span>
                          <button onClick={function() { setPdfMergeFiles(function(prev) { return prev.filter(function(_, j) { return j !== i; }); }); }} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </li>
                      );
                    })}
                  </ul>
                  <button onClick={handlePdfMerge} disabled={loading}
                    className="px-6 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50">
                    {loading ? '合并中...' : '开始合并'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTool === 'removebg' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">AI 背景去除</h2>
              <p className="text-sm text-gray-500">上传图片，通过 AI 自动去除背景，输出透明 PNG。支持人像、物品、动物等。</p>
              <input type="file" accept="image/*" onChange={handleRemoveBg}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200"
              />
              {removeBgResult && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">处理完成：</p>
                  <img src={removeBgResult} alt="去背景结果" className="max-h-64 rounded-xl border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)_50%/20px_20px]" />
                </div>
              )}
            </div>
          )}

          {activeTool === 'imgcompress' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">图片压缩</h2>
              <p className="text-sm text-gray-500">上传图片，调整质量和尺寸，输出压缩后的 JPEG。所有处理在浏览器本地完成，不上传服务器。</p>
              <input type="file" accept="image/*" onChange={handleImgCompressUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
              />
              {imgCompressSrc && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">质量 {imgCompressQuality.toFixed(1)}</label>
                      <input type="range" min="0.1" max="1" step="0.05" value={imgCompressQuality} onChange={(e) => setImgCompressQuality(+e.target.value)} className="w-32" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">最大宽度 {imgCompressMaxW}px</label>
                      <input type="range" min="200" max="3840" step="100" value={imgCompressMaxW} onChange={(e) => setImgCompressMaxW(+e.target.value)} className="w-32" />
                    </div>
                    <button onClick={doCompress} disabled={loading}
                      className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
                      {loading ? '压缩中...' : '开始压缩'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">原始: {(imgCompressOrigSize / 1024).toFixed(1)} KB</p>
                  {imgCompressResult && (
                    <div>
                      <p className="text-xs text-green-600">
                        压缩后: {(imgCompressResult.size / 1024).toFixed(1)} KB
                        （{imgCompressResult.w}x{imgCompressResult.h}）
                        {' '}减小了 {((1 - imgCompressResult.size / imgCompressOrigSize) * 100).toFixed(0)}%
                      </p>
                      <img src={imgCompressResult.url} alt="compressed" className="max-h-48 rounded-xl border mt-1" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTool === 'img2pdf' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">图片转 PDF</h2>
              <p className="text-sm text-gray-500">选择多张图片，每张作为一页合成 PDF。所有处理在浏览器本地完成。</p>
              <input type="file" accept="image/*" multiple onChange={handleImg2pdfAdd}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
              />
              {img2pdfFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">已添加 {img2pdfFiles.length} 张图片：</p>
                  <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                    {img2pdfFiles.map((f, i) => (
                      <li key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-1">
                        <span>{i + 1}. {f.name}</span>
                        <button onClick={() => setImg2pdfFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={doImg2pdf} disabled={loading}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 disabled:opacity-50">
                    {loading ? '生成中...' : '生成 PDF'}
                  </button>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{progressMsg}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: progress + '%' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}
        </div>

        {output && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-700">✅ 转换完成</h2>
              <div className="flex gap-2">
                <button onClick={copyOutput}
                  className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
                  📋 复制
                </button>
                <button onClick={downloadOutput}
                  className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">
                  📥 下载
                </button>
              </div>
            </div>
            {outputType === 'image' ? (
              <img src={output} alt="result" className="max-h-80 rounded-xl border" />
            ) : outputType === 'download' ? (
              <p className="text-sm text-gray-500">文件已就绪，点击上方下载按钮保存</p>
            ) : (
              <pre className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 overflow-auto max-h-80 whitespace-pre-wrap">{output}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
