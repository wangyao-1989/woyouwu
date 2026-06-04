import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';

const MBTI_NAMES = [
  'INTJ_建筑师', 'INTP_逻辑学家', 'ENTJ_指挥官', 'ENTP_辩论家',
  'INFJ_提倡者', 'INFP_调停者', 'ENFJ_主人公', 'ENFP_竞选者',
  'ISTJ_物流师', 'ISFJ_守卫者', 'ESTJ_执行官', 'ESFJ_执政官',
  'ISTP_鉴赏家', 'ISFP_探险家', 'ESTP_企业家', 'ESFP_娱乐者',
];

export default function ImageCropper() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState('');
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(4);
  const [croppedImages, setCroppedImages] = useState([]);
  const [statusText, setStatusText] = useState('');
  const [zipping, setZipping] = useState(false);
  const [smartCut, setSmartCut] = useState(false);
  const [separators, setSeparators] = useState({ h: [], v: [] });

  const sourceCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setCroppedImages([]);
        setStatusText('');
        setSeparators({ h: [], v: [] });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (!image || !sourceCanvasRef.current) return;
    const canvas = sourceCanvasRef.current;
    const ctx = canvas.getContext('2d');

    const maxWidth = Math.min(700, window.innerWidth - 80);
    const scale = Math.min(1, maxWidth / image.width);
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(1, canvas.width / 500);

    for (let i = 1; i < cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, canvas.height);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellH);
      ctx.lineTo(canvas.width, j * cellH);
      ctx.stroke();
    }

    if (smartCut && separators.h.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = Math.max(2, canvas.width / 250);

      for (let i = 0; i < separators.h.length; i++) {
        const y = (separators.h[i] / image.height) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      for (let i = 0; i < separators.v.length; i++) {
        const x = (separators.v[i] / image.width) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }
  }, [image, cols, rows, smartCut, separators]);

  const detectSeparators = useCallback(() => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const isWhite = (r, g, b) => r > 240 && g > 240 && b > 240;

    const hLines = [];
    const hThreshold = Math.floor(image.height * 0.05);
    for (let y = hThreshold; y < image.height - hThreshold; y++) {
      let whiteCount = 0;
      for (let x = 0; x < image.width; x++) {
        const idx = (y * image.width + x) * 4;
        if (isWhite(data[idx], data[idx + 1], data[idx + 2])) whiteCount++;
      }
      if (whiteCount > image.width * 0.7) {
        if (hLines.length === 0 || y - hLines[hLines.length - 1] > 10) {
          hLines.push(y);
        }
      }
    }

    const vLines = [];
    const vThreshold = Math.floor(image.width * 0.05);
    for (let x = vThreshold; x < image.width - vThreshold; x++) {
      let whiteCount = 0;
      for (let y = 0; y < image.height; y++) {
        const idx = (y * image.width + x) * 4;
        if (isWhite(data[idx], data[idx + 1], data[idx + 2])) whiteCount++;
      }
      if (whiteCount > image.height * 0.7) {
        if (vLines.length === 0 || x - vLines[vLines.length - 1] > 10) {
          vLines.push(x);
        }
      }
    }

    const groupLines = (lines) => {
      if (lines.length === 0) return [];
      const groups = [];
      let current = [lines[0]];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] - current[current.length - 1] < 20) {
          current.push(lines[i]);
        } else {
          groups.push(Math.round(current.reduce((a, b) => a + b) / current.length));
          current = [lines[i]];
        }
      }
      groups.push(Math.round(current.reduce((a, b) => a + b) / current.length));
      return groups;
    };

    const grouped = { h: groupLines(hLines), v: groupLines(vLines) };
    setSeparators(grouped);

    if (grouped.h.length > 0) setRows(grouped.h.length + 1);
    if (grouped.v.length > 0) setCols(grouped.v.length + 1);

    setStatusText('检测到 ' + (grouped.h.length + 1) + ' 行 x ' + (grouped.v.length + 1) + ' 列');
  }, [image]);

  const handleCrop = useCallback(() => {
    if (!image) {
      setStatusText('请先上传图片！');
      return;
    }

    const cellW = image.width / cols;
    const cellH = image.height / rows;
    const results = [];
    let index = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cvs = document.createElement('canvas');
        cvs.width = cellW;
        cvs.height = cellH;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(image, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH);

        const dataUrl = cvs.toDataURL('image/png');
        const name = (cols === 4 && rows === 4 && index < MBTI_NAMES.length)
          ? MBTI_NAMES[index] + '.png'
          : 'avatar_r' + (r + 1) + '_c' + (c + 1) + '.png';

        results.push({ name, dataUrl, base64: dataUrl.split(',')[1] });
        index++;
      }
    }

    setCroppedImages(results);
    setStatusText('成功切出 ' + index + ' 张！');
  }, [image, cols, rows]);

  const handleDownloadZip = useCallback(async () => {
    if (croppedImages.length === 0) return;
    setZipping(true);
    setStatusText('正在打包中...');

    const zip = new JSZip();
    croppedImages.forEach((img) => {
      zip.file(img.name, img.base64, { base64: true });
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = imageName
        ? imageName.replace(/\.[^.]+$/, '') + '_裁剪包.zip'
        : '图片裁剪包.zip';
      link.click();
      URL.revokeObjectURL(link.href);
      setStatusText('下载成功！');
    } catch (err) {
      setStatusText('打包失败，请重试。');
      console.error(err);
    } finally {
      setZipping(false);
    }
  }, [croppedImages, imageName]);

  const handleDownloadSingle = useCallback((img) => {
    const link = document.createElement('a');
    link.href = img.dataUrl;
    link.download = img.name;
    link.click();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F0E8] py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </button>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">网格图像裁剪工具</h1>
          <p className="text-gray-500 mt-1 text-sm">
            上传一张大图，自动按行列切割成独立小图，支持打包下载
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              参数设置
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                1. 上传图片
              </label>
              <div
                className="relative w-full h-11 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-sm text-gray-400 truncate px-3">
                  {imageName || '点击或拖拽上传图片'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smartCut}
                  onChange={(e) => {
                    setSmartCut(e.target.checked);
                    if (e.target.checked) detectSeparators();
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">智能识别分隔线</span>
              </label>
              {smartCut && (
                <button
                  onClick={detectSeparators}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  重新检测分隔线
                </button>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                水平切几列
              </label>
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                垂直切几行
              </label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>

            <div className="mb-4 flex gap-2 flex-wrap">
              {[[2, 2], [3, 3], [4, 4], [4, 5], [5, 5]].map(([r, c]) => (
                <button
                  key={r + 'x' + c}
                  onClick={() => { setRows(r); setCols(c); }}
                  className={(rows === r && cols === c
                    ? 'px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-700'
                    : 'px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200')}
                >
                  {r}×{c}
                </button>
              ))}
            </div>

            <button
              onClick={handleCrop}
              disabled={!image}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              一键全部裁剪
            </button>

            {croppedImages.length > 0 && (
              <button
                onClick={handleDownloadZip}
                disabled={zipping}
                className="w-full py-2.5 mt-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {zipping ? '打包中...' : '打包下载 ZIP (' + croppedImages.length + '张)'}
              </button>
            )}

            {statusText && (
              <p className="mt-3 text-sm font-medium text-indigo-600 text-center">
                {statusText}
              </p>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-semibold text-gray-800 mb-3">
                网格切分预览
              </h2>
              <div className="bg-gray-100 rounded-xl overflow-auto flex justify-center">
                {image ? (
                  <canvas ref={sourceCanvasRef} className="max-w-full h-auto" />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-gray-400 text-sm">
                    请先上传图片查看预览
                  </div>
                )}
              </div>
            </div>

            {croppedImages.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-800 mb-3">
                  裁剪结果（{croppedImages.length} 张）
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {croppedImages.map((img, i) => (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-lg p-1.5 bg-gray-50 text-center cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleDownloadSingle(img)}
                      title={'点击下载 ' + img.name}
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-auto rounded bg-white"
                      />
                      <span className="text-xs text-gray-400 mt-1 block truncate">
                        {img.name.replace('.png', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
