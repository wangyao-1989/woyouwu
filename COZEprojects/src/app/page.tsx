'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Sparkles, User, Briefcase, GraduationCap, FolderOpen, Code, Loader2, Upload, X, Edit2, Palette } from 'lucide-react';
import { ResumeWordExport } from '@/components/resume-word-export';
import { ResumePrintExport } from '@/components/resume-print-export';
import { ResumePreview } from '@/components/resume-preview';
import { ColorSchemeSelector } from '@/components/color-scheme-selector';
import { colorSchemes, defaultColorScheme, ColorScheme } from '@/lib/color-schemes';

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

interface Language {
  name: string;
  level: string;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
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
  languages?: Language[];
  certifications?: Certification[];
  sectionTitles?: {
    contact: string;
    about: string;
    work: string;
    education: string;
    projects: string;
    skills: string;
    languagesAndCertifications: string;
    languageSubTitle: string;
    certificationSubTitle: string;
  };
}

export default function ResumeBuilder() {
  const [inputText, setInputText] = useState('');
  const [analyzedData, setAnalyzedData] = useState<AnalyzedResume | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme);
  const [activeTab, setActiveTab] = useState('input');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 从 localStorage 恢复数据
  useEffect(() => {
    const savedData = localStorage.getItem('resumeData');
    const savedAvatar = localStorage.getItem('resumeAvatar');
    
    console.log('🔄 开始从 localStorage 恢复数据');
    console.log('📦 savedData:', savedData ? '存在' : '不存在');
    console.log('📷 savedAvatar:', savedAvatar ? '存在 (' + (savedAvatar.length / 1024).toFixed(2) + 'KB)' : '不存在');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // 验证数据结构是否有效
        if (parsed && parsed.name) {
          setAnalyzedData(parsed);
          console.log('✅ 简历数据已恢复');
          
          // 恢复头像（优先级最高）
          if (savedAvatar) {
            setAvatar(savedAvatar);
            console.log('✅ 头像已恢复');
          } else {
            console.log('⚠️ localStorage 中没有头像');
          }
        } else {
          // 数据无效，清除
          console.error('❌ 保存的简历数据格式无效');
          localStorage.removeItem('resumeData');
          localStorage.removeItem('resumeAvatar');
        }
      } catch (e) {
        console.error('❌ 恢复简历数据失败:', e);
        // 数据损坏，清除
        localStorage.removeItem('resumeData');
        localStorage.removeItem('resumeAvatar');
      }
    }
  }, []);

  // 保存数据到 localStorage（不包含头像）
  useEffect(() => {
    if (analyzedData) {
      try {
        // 创建不包含头像的副本
        const { avatar: _, ...dataWithoutAvatar } = analyzedData;
        localStorage.setItem('resumeData', JSON.stringify(dataWithoutAvatar));
        console.log('✅ 简历数据已保存到 localStorage');
      } catch (e) {
        console.error('❌ 保存简历数据失败:', e);
      }
    }
  }, [analyzedData]);

  // 单独保存头像到 localStorage
  useEffect(() => {
    if (avatar) {
      try {
        localStorage.setItem('resumeAvatar', avatar);
        console.log('✅ 头像已保存到 localStorage，大小:', (avatar.length / 1024).toFixed(2), 'KB');
      } catch (e) {
        // 如果仍然超出限制，尝试删除 localStorage 中的头像
        console.error('❌ 保存头像失败（localStorage 已满）:', e);
        
        // 清除 localStorage 中的头像，但不影响页面显示
        localStorage.removeItem('resumeAvatar');
        
        // 设置错误提示（3秒后自动消失）
        setError('⚠️ 头像已显示但未保存到本地存储（图片太大，浏览器存储空间不足）');
        setTimeout(() => setError(null), 5000);
      }
    } else {
      // 只有明确删除头像时才移除 localStorage
      const savedAvatar = localStorage.getItem('resumeAvatar');
      if (savedAvatar && !avatar) {
        console.log('⚠️ avatar 为 null，但保留 localStorage 中的头像');
      }
    }
  }, [avatar]);

  // 语言改变时清除数据，提示用户重新生成
  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    if (analyzedData) {
      const confirmed = window.confirm(
        newLanguage === 'zh' 
          ? '切换到中文简历需要重新生成。是否继续？' 
          : 'Switching to English resume requires regeneration. Continue?'
      );
      if (confirmed) {
        setLanguage(newLanguage);
        setAnalyzedData(null);
        setAvatar(null);
        setError(null);
        setActiveTab('input');
        localStorage.removeItem('resumeData');
        localStorage.removeItem('resumeAvatar');
      }
    } else {
      setLanguage(newLanguage);
    }
  };

  // Tab 切换时的确认提示
  const handleTabChange = (value: string) => {
    if (value === 'input' && activeTab === 'preview' && isEditMode) {
      const confirmed = window.confirm('正在编辑简历，切换到输入页将丢失未保存的编辑。是否继续？');
      if (!confirmed) {
        return;
      }
    }
    setActiveTab(value);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件');
        return;
      }

      // 验证文件大小（最大 10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError('图片大小不能超过 10MB');
        return;
      }

      // 压缩图片以适应 localStorage 限制
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setError('无法处理图片');
            return;
          }

          // 计算压缩后的尺寸（最大宽度 800px）
          const maxWidth = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // 绘制并压缩图片
          ctx.drawImage(img, 0, 0, width, height);
          
          // 尝试不同的压缩质量
          const tryCompress = (quality: number, attempt: number = 0): void => {
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            const compressedSize = compressedDataUrl.length;
            
            console.log(`🖼️ 压缩尝试 ${attempt + 1}: 质量 ${(quality * 100).toFixed(0)}%, 大小 ${(compressedSize / 1024).toFixed(2)}KB`);
            
            // 检查压缩后的大小（目标：小于 2MB 以适应 localStorage）
            if (compressedSize > 2 * 1024 * 1024 && attempt < 5) {
              // 如果仍然太大，继续降低质量
              const newQuality = quality - 0.1;
              if (newQuality > 0.1) {
                setTimeout(() => tryCompress(newQuality, attempt + 1), 0);
                return;
              }
            }
            
            // 压缩完成，使用压缩后的图片
            setAvatar(compressedDataUrl);
            console.log('✅ 头像已压缩并保存');
            setError(null);
          };
          
          // 从质量 0.8 开始压缩
          tryCompress(0.8);
        };
        
        img.onerror = () => {
          setError('无法加载图片');
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    localStorage.removeItem('resumeAvatar');
  };

  const analyzeResume = async () => {
    if (!inputText.trim()) {
      setError('请输入简历内容');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          resumeText: inputText,
          language: language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '分析失败');
      }

      const data = await response.json();

      // 调试日志
      console.log('=== AI 返回的数据 ===');
      console.log('姓名:', data.name);
      console.log('技能数量:', data.skills?.length);
      console.log('语言能力:', data.languages);
      console.log('证书认证:', data.certifications);
      console.log('完整数据:', data);

      if (data.error) {
        setError(data.error);
        if (data.rawContent) {
          console.log('Raw LLM response:', data.rawContent);
        }
      } else {
        // 保留当前的头像，不要被覆盖
        setAnalyzedData({ 
          ...data, 
          avatar: data.avatar || avatar || (analyzedData?.avatar || null)
        });
        setActiveTab('preview'); // 自动切换到预览 Tab
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const verifyMerge = async () => {
    if (!analyzedData) {
      setError('请先生成简历数据');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setError(null);

    try {
      const response = await fetch('/api/verify-merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analyzedData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '验证失败');
      }

      const data = await response.json();
      setVerificationResult(data);

      // 调试日志
      console.log('=== 验证结果 ===');
      console.log('education标题:', data.educationTitle);
      console.log('是否包含certification关键词:', data.hasCertificationKeyword);
      console.log('certifications数组长度:', data.certificationsArrayLength);
      console.log('education中是否包含certifications:', data.educationContainsCertifications);
      console.log('是否正确合并:', data.isMerged);
      console.log('问题:', data.issues);
      console.log('建议:', data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExampleInput = () => {
    const example = `张三
邮箱：zhangsan@example.com
电话：138-0000-0000
地址：北京市朝阳区

个人简介：
5年互联网产品经理经验，专注于用户体验和产品创新。擅长需求分析、产品规划和团队协作，曾主导多个千万级用户产品的设计和上线。

工作经历：

高级产品经理 | ABC科技有限公司 | 2021-06 - 至今
负责公司核心SaaS产品的规划和迭代，带领8人产品团队完成3次重大版本升级
优化用户转化流程，转化率提升40%
建立产品数据分析体系，为决策提供数据支持

产品经理 | XYZ互联网公司 | 2019-03 - 2021-05
负责移动端APP的产品设计和迭代，用户数从100万增长到500万
主导用户体验优化项目，用户满意度提升35%

教育背景：

北京大学 | 软件工程 | 本科 | 2015-09 - 2019-06

项目经历：

智能推荐系统 | 产品负责人 | 2022-01 - 2022-12
主导AI驱动的产品推荐系统开发，提升用户使用时长30%

用户增长项目 | 产品经理 | 2020-06 - 2021-03
通过裂变营销和精细化运营，实现用户数3倍增长

专业技能：
产品规划、需求分析、用户体验设计、数据分析、敏捷开发、Axure、Figma、SQL`;

    setInputText(example);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI 智能简历生成器
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            输入简历文本，AI 自动分析并生成专业简历
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="input">输入简历</TabsTrigger>
            <TabsTrigger value="preview" disabled={!analyzedData}>
              预览简历
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      输入简历内容
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExampleInput}>
                      加载示例
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    请将您的简历内容粘贴到下方。系统会自动识别个人信息、工作经历、教育背景等内容并生成排版好的简历。
                  </p>

                  {/* 照片上传区域 */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      求职者照片（可选）
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      ⚠️ 照片会自动保存到浏览器本地存储
                    </p>
                    {avatar ? (
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                          <img
                            src={avatar}
                            alt="头像"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeAvatar}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          移除照片
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Label
                          htmlFor="avatar-upload"
                          className="flex flex-col items-center gap-2 cursor-pointer hover:text-blue-500 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            点击上传照片
                          </span>
                          <span className="text-xs text-gray-400">
                            支持 JPG、PNG 格式，最大 10MB
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            ✅ 图片会自动压缩并保存
                          </span>
                        </Label>
                      </div>
                    )}
                  </div>

                  {/* 语言选择 */}
                  <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      简历语言
                    </Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={language === 'zh' ? 'default' : 'outline'}
                        onClick={() => handleLanguageChange('zh')}
                        className="flex-1"
                      >
                        🇨🇳 中文简历
                      </Button>
                      <Button
                        type="button"
                        variant={language === 'en' ? 'default' : 'outline'}
                        onClick={() => handleLanguageChange('en')}
                        className="flex-1"
                      >
                        🇺🇸 English Resume
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {language === 'zh' ? '生成全中文简历，包含中文章节标题' : 'Generate full English resume with English section titles'}
                    </p>
                  </div>

                  <Textarea
                    placeholder="请粘贴您的简历内容...

示例格式：
张三
邮箱：zhangsan@example.com
电话：138-0000-0000

个人简介：
5年互联网产品经理经验...

工作经历：
高级产品经理 | ABC科技有限公司 | 2021-06 - 至今
负责产品规划和迭代..."

                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <Button
                      onClick={analyzeResume}
                      disabled={isAnalyzing}
                      size="lg"
                      className="flex-1"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          正在分析...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          AI 生成简历
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputText('');
                        setAnalyzedData(null);
                        setAvatar(null);
                        setError(null);
                        setActiveTab('input');
                        localStorage.removeItem('resumeData'); // 清除本地存储
                        localStorage.removeItem('resumeAvatar'); // 清除头像
                      }}
                      size="lg"
                    >
                      清空
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {analyzedData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 配色选择器 */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" />
                        配色方案
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ColorSchemeSelector
                        selectedScheme={colorScheme}
                        onSchemeChange={setColorScheme}
                      />
                    </CardContent>
                  </Card>

                  {/* 简历预览 */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        简历预览
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        {isEditMode ? '退出编辑' : '开启编辑'}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6 overflow-x-auto" data-printable="true">
                      <ResumePreview
                        id="resume-preview"
                        data={analyzedData}
                        onChange={setAnalyzedData}
                        isEditMode={isEditMode}
                        colorScheme={colorScheme}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center gap-4 flex-wrap">
                  <ResumePrintExport
                    data={analyzedData}
                    fileName={analyzedData.name || '简历'}
                  />
                  <ResumeWordExport resume={analyzedData as any} />
                  <Button
                    onClick={verifyMerge}
                    disabled={isVerifying}
                    variant="outline"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        验证中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        验证合并
                      </>
                    )}
                  </Button>
                </div>

                {/* 显示验证结果 */}
                {verificationResult && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-2 text-lg">AI 验证结果</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Education标题:</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {verificationResult.educationTitle || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">包含Certification关键词:</span>
                        <span className={`font-mono px-2 py-1 rounded ${verificationResult.hasCertificationKeyword ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {verificationResult.hasCertificationKeyword ? '✓ 是' : '✗ 否'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Certifications数组长度:</span>
                        <span className={`font-mono px-2 py-1 rounded ${verificationResult.certificationsArrayLength === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                          {verificationResult.certificationsArrayLength}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Education包含Certifications:</span>
                        <span className={`font-mono px-2 py-1 rounded ${verificationResult.educationContainsCertifications ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                          {verificationResult.educationContainsCertifications ? '✓ 是' : '✗ 否'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">是否正确合并:</span>
                        <span className={`font-mono px-2 py-1 rounded ${verificationResult.isMerged ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {verificationResult.isMerged ? '✓ 正确合并' : '✗ 未正确合并'}
                        </span>
                      </div>
                      {verificationResult.issues && verificationResult.issues.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium text-red-600 dark:text-red-400">问题:</span>
                          <ul className="list-disc list-inside mt-1 text-red-600 dark:text-red-400">
                            {verificationResult.issues.map((issue: string, index: number) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {verificationResult.recommendation && (
                        <div className="mt-2">
                          <span className="font-medium">建议:</span>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{verificationResult.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  还没有简历数据
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  请先在"输入简历"页面生成简历
                </p>
                <Button onClick={() => setActiveTab('input')}>
                  前往输入页面
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
