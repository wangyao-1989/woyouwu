"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileImage, X, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ImageCropper from "./ImageCropper";

interface UploadSectionProps {
  onSuccess: () => void;
}

export default function UploadSection({ onSuccess }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedFile, setCroppedFile] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }

      setSelectedFile(file);

      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setShowCropper(true); // 显示裁剪界面
      };
      reader.readAsDataURL(file);

      setResult(null);
      setCroppedFile(null);
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    setCroppedFile(croppedImageBlob);
    setShowCropper(false);

    // 使用裁剪后的图片
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedImageBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    // 不取消文件选择，只是跳过裁剪
  };

  const handleSkipCrop = () => {
    setShowCropper(false);
    // 直接使用原始图片
  };

  const handleUpload = async () => {
    // 使用裁剪后的文件或原始文件
    const fileToUpload = croppedFile ? new File([croppedFile], selectedFile!.name, {
      type: croppedFile.type,
    }) : selectedFile;

    if (!fileToUpload) {
      toast.error("请先选择图片");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const response = await fetch("/api/ocr/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast.success(data.message || "识别成功");

        // 刷新持仓列表
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        setResult(data);
        toast.error(data.error || "识别失败");
      }
    } catch (error) {
      console.error("上传失败:", error);
      toast.error("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setShowCropper(false);
    setCroppedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 显示裁剪界面
  if (showCropper && preview) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>裁剪图片</CardTitle>
            <CardDescription>
              调整裁剪框，移除无关信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageCropper
              imageUrl={preview}
              onComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          </CardContent>
        </Card>
        <div className="text-center">
          <Button variant="ghost" onClick={handleSkipCrop}>
            跳过裁剪，使用原图
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            {preview ? (
              <div className="relative w-full max-w-md">
                <img
                  src={preview}
                  alt="预览"
                  className="w-full h-auto rounded-lg border"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2"
                  onClick={handleReset}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="w-full max-w-md h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  点击或拖拽上传持仓截图
                </p>
                <p className="text-xs text-slate-400 mt-1">支持 PNG, JPG, GIF 格式</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              onClick={(e) => e.stopPropagation()}
            />

            {selectedFile && !result && (
              <div className="flex items-center gap-2 text-sm">
                <FileImage className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600 dark:text-slate-300">
                  {selectedFile.name}
                </span>
                {croppedFile && (
                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    已裁剪
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {selectedFile && !result && (
                <>
                  <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                    {uploading ? "识别中..." : "开始识别"}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    取消
                  </Button>
                </>
              )}

              {!selectedFile && !result && (
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  选择图片
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.success ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-green-900 dark:text-green-100">
                  {result.message || result.error}
                </p>
                {result.stocks && result.stocks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {result.stocks.map((stock: any, idx: number) => {
                      const isMissingInfo = !stock.shares || stock.shares === 0 || !stock.costPrice || stock.costPrice === "0.00";

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${isMissingInfo ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{stock.stockName}</p>
                              <p className="text-sm text-slate-500">{stock.stockCode}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p>持仓: {stock.shares || 0} 股</p>
                              <p className="text-slate-500">成本: ¥{stock.costPrice || "0.00"}</p>
                            </div>
                          </div>
                          {isMissingInfo && (
                            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 p-2 rounded">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">持仓信息不完整</p>
                                <p>识别成功后可在列表中补充持仓数量和成本价</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {result.rawText && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400 max-h-40 overflow-y-auto">
                    <p className="font-medium mb-2">识别结果：</p>
                    {result.rawText}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleReset}>
                继续上传
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
