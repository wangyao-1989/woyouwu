import { useState, useRef, useEffect, useCallback } from 'react';

function AvatarCropper({ image, onCancel, onCrop }) {
  const previewCanvasRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const CONTAINER_SIZE = 320;
  const CIRCLE_SIZE = 240;
  const OUTPUT_SIZE = 400;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setImageLoaded(true);
    };
    img.src = image;
  }, [image]);

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    canvas.width = CONTAINER_SIZE;
    canvas.height = CONTAINER_SIZE;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      CONTAINER_SIZE / 2,
      CONTAINER_SIZE / 2,
      CIRCLE_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();

    const imgAspect = imageObj.width / imageObj.height;
    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > 1) {
      drawHeight = CIRCLE_SIZE * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = CIRCLE_SIZE * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    drawX = (CONTAINER_SIZE - drawWidth) / 2 + position.x;
    drawY = (CONTAINER_SIZE - drawHeight) / 2 + position.y;

    ctx.drawImage(imageObj, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      CONTAINER_SIZE / 2,
      CONTAINER_SIZE / 2,
      CIRCLE_SIZE / 2,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }, [imageObj, position, zoom]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleCrop = useCallback(() => {
    if (!imageObj || !previewCanvasRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const imgAspect = imageObj.width / imageObj.height;
    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > 1) {
      drawHeight = OUTPUT_SIZE * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = OUTPUT_SIZE * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    drawX = (OUTPUT_SIZE - drawWidth) / 2 + position.x * (OUTPUT_SIZE / CONTAINER_SIZE);
    drawY = (OUTPUT_SIZE - drawHeight) / 2 + position.y * (OUTPUT_SIZE / CONTAINER_SIZE);

    ctx.drawImage(imageObj, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      } else {
        alert('头像裁剪失败，请重试');
      }
    }, 'image/jpeg', 0.92);
  }, [imageObj, position, zoom, onCrop]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - CONTAINER_SIZE / 2;
    const y = e.clientY - rect.top - CONTAINER_SIZE / 2;

    setPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  };

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">正在加载图片...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">裁剪头像</h3>
            <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-4">
            <canvas
              ref={previewCanvasRef}
              className="rounded-full cursor-move select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <p className="text-sm text-gray-500 text-center mb-4">
            💡 拖动图片调整位置，滑块调整缩放
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              缩放: {Math.round(zoom * 100)}%
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              
              <button
                onClick={() => setZoom(prev => Math.min(2, prev + 0.2))}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>缩小</span>
              <span>放大</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              重置
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:opacity-90 transition-opacity font-medium shadow-lg shadow-primary-600/30"
            >
              确认裁剪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropper;
