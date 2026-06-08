'use client';

import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Project {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface AnalyzedResume {
  name: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  avatar?: string;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: string[];
}

interface ResumeImageExportProps {
  data: AnalyzedResume;
  fileName?: string;
}

export function ResumeImageExport({ data, fileName = '简历' }: ResumeImageExportProps) {
  const handleExportImage = async () => {
    const resumeElement = document.getElementById('resume-preview');

    if (!resumeElement) {
      alert('找不到简历元素');
      return;
    }

    // 显示加载提示
    const toast = document.createElement('div');
    toast.id = 'image-export-toast';
    toast.textContent = '正在生成图片...';
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 16px 32px;
      border-radius: 8px;
      z-index: 100000;
      font-size: 16px;
    `;
    document.body.appendChild(toast);

    // 移除提示框的函数
    const removeToast = () => {
      const existingToast = document.getElementById('image-export-toast');
      if (existingToast && existingToast.parentNode) {
        existingToast.parentNode.removeChild(existingToast);
      }
    };

    try {
      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 300));

      // 设置超时处理（30秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('生成图片超时，请重试')), 30000);
      });

      // 配置 html2canvas
      const canvasPromise = html2canvas(resumeElement, {
        scale: 2, // 高清输出
        useCORS: true, // 支持跨域图片
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        // 处理复杂的 CSS
        foreignObjectRendering: false,
        // 避免裁剪
        ignoreElements: (element) => {
          // 忽略某些可能有问题的元素
          return element.classList?.contains('no-print');
        },
        // 设置尺寸
        width: resumeElement.scrollWidth,
        height: resumeElement.scrollHeight,
        windowWidth: resumeElement.scrollWidth,
        windowHeight: resumeElement.scrollHeight,
      });

      // 等待生成或超时
      const canvas = await Promise.race([canvasPromise, timeoutPromise]) as HTMLCanvasElement;

      // 移除加载提示
      removeToast();

      // 检查 canvas 是否有效
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('生成的图片无效');
      }

      // 转换为图片并下载
      const image = canvas.toDataURL('image/png', 1.0);

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = image;
      link.click();

    } catch (error) {
      console.error('导出图片失败:', error);
      removeToast();

      // 显示错误提示
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`导出图片失败：${errorMessage}\n\n建议尝试使用 PDF 或 Word 导出功能。`);
    }
  };

  return (
    <div className="flex justify-center gap-3">
      <Button onClick={handleExportImage} size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
        <ImageIcon className="w-5 h-5" />
        导出图片
      </Button>
    </div>
  );
}
