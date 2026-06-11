"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, Check, X, Maximize2 } from "lucide-react";
import { toast } from "sonner";

interface ImageCropperProps {
  imageUrl: string;
  onComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({ imageUrl, onComplete, onCancel }: ImageCropperProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    handle: string | null;
    startX: number;
    startY: number;
    startCrop: CropState;
  }>({
    isDragging: false,
    handle: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 0, y: 0, width: 0, height: 0 },
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    setImageDimensions({ width: rect.width, height: rect.height });
    setImageLoaded(true);

    // 初始裁剪框：留出 15% 的边距
    const padding = 0.15;
    const initialCrop: CropState = {
      x: Math.round(rect.width * padding),
      y: Math.round(rect.height * padding),
      width: Math.round(rect.width * (1 - padding * 2)),
      height: Math.round(rect.height * (1 - padding * 2)),
    };
    setCrop(initialCrop);
  };

  const startDrag = useCallback((e: React.MouseEvent, handle: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      isDragging: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    });
  }, [crop]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const { width: imgWidth, height: imgHeight } = imageDimensions;
    const { startCrop, handle } = dragState;
    const minSize = 50;

    let newCrop: CropState = { ...startCrop };

    if (!handle || handle === 'move') {
      // 移动整个裁剪框
      newCrop.x = Math.max(0, Math.min(imgWidth - newCrop.width, startCrop.x + dx));
      newCrop.y = Math.max(0, Math.min(imgHeight - newCrop.height, startCrop.y + dy));
    } else {
      // 根据手柄调整裁剪框大小
      switch (handle) {
        case 'nw':
          // 左上角：同时调整 x, y, width, height
          const newNW_X = Math.max(0, startCrop.x + dx);
          const newNW_Y = Math.max(0, startCrop.y + dy);
          newCrop.x = newNW_X;
          newCrop.y = newNW_Y;
          newCrop.width = Math.max(minSize, startCrop.width - dx);
          newCrop.height = Math.max(minSize, startCrop.height - dy);
          break;

        case 'ne':
          // 右上角：调整 y, width, height
          const newNE_Y = Math.max(0, startCrop.y + dy);
          newCrop.y = newNE_Y;
          newCrop.width = Math.max(minSize, startCrop.width + dx);
          newCrop.height = Math.max(minSize, startCrop.height - dy);
          break;

        case 'sw':
          // 左下角：调整 x, width, height
          const newSW_X = Math.max(0, startCrop.x + dx);
          newCrop.x = newSW_X;
          newCrop.width = Math.max(minSize, startCrop.width - dx);
          newCrop.height = Math.max(minSize, startCrop.height + dy);
          break;

        case 'se':
          // 右下角：调整 width, height
          newCrop.width = Math.max(minSize, startCrop.width + dx);
          newCrop.height = Math.max(minSize, startCrop.height + dy);
          break;

        case 'n':
          // 上边：调整 y, height
          const newN_Y = Math.max(0, startCrop.y + dy);
          newCrop.y = newN_Y;
          newCrop.height = Math.max(minSize, startCrop.height - dy);
          break;

        case 's':
          // 下边：调整 height
          newCrop.height = Math.max(minSize, startCrop.height + dy);
          break;

        case 'w':
          // 左边：调整 x, width
          const newW_X = Math.max(0, startCrop.x + dx);
          newCrop.x = newW_X;
          newCrop.width = Math.max(minSize, startCrop.width - dx);
          break;

        case 'e':
          // 右边：调整 width
          newCrop.width = Math.max(minSize, startCrop.width + dx);
          break;
      }

      // 确保裁剪框不超出图片边界
      newCrop.x = Math.max(0, Math.min(imgWidth - minSize, newCrop.x));
      newCrop.y = Math.max(0, Math.min(imgHeight - minSize, newCrop.y));
      newCrop.width = Math.min(imgWidth - newCrop.x, newCrop.width);
      newCrop.height = Math.min(imgHeight - newCrop.y, newCrop.height);
    }

    setCrop(newCrop);
  }, [dragState, imageDimensions]);

  const endDrag = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      handle: null,
    }));
  }, []);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', endDrag);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', endDrag);
      };
    }
  }, [dragState.isDragging, handleMouseMove, endDrag]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetCrop = () => {
    if (!imageDimensions.width || !imageDimensions.height) return;
    const padding = 0.15;
    const initialCrop: CropState = {
      x: Math.round(imageDimensions.width * padding),
      y: Math.round(imageDimensions.height * padding),
      width: Math.round(imageDimensions.width * (1 - padding * 2)),
      height: Math.round(imageDimensions.height * (1 - padding * 2)),
    };
    setCrop(initialCrop);
  };

  const handleConfirm = async () => {
    if (!imageRef.current || crop.width < 10 || crop.height < 10) {
      toast.error("请先选择合适的裁剪区域");
      return;
    }

    const image = imageRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("创建画布失败");
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // 设置画布尺寸为裁剪区域的大小
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // 处理旋转
    if (rotation !== 0) {
      const rotatedCanvas = document.createElement("canvas");
      const rotatedCtx = rotatedCanvas.getContext("2d");
      if (!rotatedCtx) return;

      // 根据旋转角度调整画布尺寸
      if (rotation === 90 || rotation === 270) {
        rotatedCanvas.width = cropHeight;
        rotatedCanvas.height = cropWidth;
      } else {
        rotatedCanvas.width = cropWidth;
        rotatedCanvas.height = cropHeight;
      }

      rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
      rotatedCtx.rotate((rotation * Math.PI) / 180);
      rotatedCtx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        -cropWidth / 2,
        -cropHeight / 2,
        cropWidth,
        cropHeight
      );

      ctx.drawImage(rotatedCanvas, 0, 0);
    } else {
      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    }

    // 转换为 Blob
    canvas.toBlob((blob) => {
      if (blob) {
        onComplete(blob);
      } else {
        toast.error("裁剪失败");
      }
    }, "image/png");
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
        <div
          ref={containerRef}
          className="relative flex justify-center overflow-auto max-h-[500px] select-none"
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center",
            }}
          >
            <img
              ref={imageRef}
              alt="Crop me"
              src={imageUrl}
              onLoad={handleImageLoad}
              className="max-w-full"
              draggable={false}
            />

            {imageLoaded && (
              <>
                {/* 裁剪框 */}
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/10"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.width,
                    height: crop.height,
                    cursor: dragState.isDragging && !dragState.handle ? 'grabbing' : 'grab',
                  }}
                  onMouseDown={(e) => startDrag(e, 'move')}
                >
                  {/* 8 个调整手柄 */}
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -top-2 -left-2 cursor-nwse-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 'nw')}
                  />
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -top-2 -right-2 cursor-nesw-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 'ne')}
                  />
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -bottom-2 -left-2 cursor-nesw-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 'sw')}
                  />
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -bottom-2 -right-2 cursor-nwse-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 'se')}
                  />
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -top-2 left-1/2 -translate-x-1/2 cursor-ns-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 'n')}
                  />
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -bottom-2 left-1/2 -translate-x-1/2 cursor-ns-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 's')}
                  />
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -left-2 top-1/2 -translate-y-1/2 cursor-ew-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 'w')}
                  />
                  <div
                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -right-2 top-1/2 -translate-y-1/2 cursor-ew-resize hover:bg-blue-500 hover:border-white transition-colors z-10"
                    onMouseDown={(e) => startDrag(e, 'e')}
                  />

                  {/* 三分线 */}
                  <div className="absolute top-1/3 left-0 right-0 border-t border-blue-400/30" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-blue-400/30" />
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-blue-400/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-blue-400/30" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center items-center">
        <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={scale <= 0.5}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={scale >= 3}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleRotate}>
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleResetCrop}>
          <Maximize2 className="w-4 h-4" />
        </Button>
        <div className="border-l border-slate-300 dark:border-slate-700 mx-2 h-6" />
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button onClick={handleConfirm} className="gap-2">
          <Check className="w-4 h-4" />
          确认裁剪
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>提示：拖动四角手柄调整大小，拖动裁剪框移动位置</p>
        <p className="text-xs">
          裁剪尺寸: {Math.round(crop.width)} × {Math.round(crop.height)} px
          {dragState.handle && ` | 正在调整: ${dragState.handle === 'move' ? '移动' : dragState.handle.toUpperCase()}`}
        </p>
      </div>
    </div>
  );
}
