'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Check, X, Camera } from 'lucide-react';
import { ColorScheme, defaultColorScheme } from '@/lib/color-schemes';

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

interface ResumePreviewProps {
  data: AnalyzedResume;
  onChange: (data: AnalyzedResume) => void;
  id: string;
  isEditMode?: boolean;
  colorScheme?: ColorScheme;
}

export function ResumePreview({
  data,
  onChange,
  id,
  isEditMode = false,
  colorScheme
}: ResumePreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [sectionTitles, setSectionTitles] = useState({
    contact: 'CONTACT INFORMATION',
    about: 'PROFESSIONAL SUMMARY',
    work: 'PROFESSIONAL EXPERIENCE',
    education: 'EDUCATION',
    projects: 'PROJECT EXPERIENCE',
    skills: 'TECHNICAL SKILLS',
    languagesAndCertifications: 'LANGUAGES & CERTIFICATIONS',
    languageSubTitle: 'LANGUAGES',
    certificationSubTitle: 'CERTIFICATIONS',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEnglishResume = sectionTitles.skills?.toUpperCase().includes('SKILL') || 
                         sectionTitles.work?.toUpperCase().includes('WORK') ||
                         sectionTitles.education?.toUpperCase().includes('EDUCATION');

  // 标准化标题：只将标题转换为大写，保留用户的原始编辑
  const normalizeTitle = (title: string, type: string): string => {
    const upperTitle = title.toUpperCase().trim();
    
    // 只转换为大写，保留用户的原始编辑内容
    return upperTitle;
  };

  // 只在组件初始化时从data中读取sectionTitles，避免频繁更新导致刷新
  useEffect(() => {
    if (data.sectionTitles) {
      setSectionTitles({
        ...sectionTitles,
        ...Object.fromEntries(
          Object.entries(data.sectionTitles).map(([key, value]) => [
            key,
            typeof value === 'string' ? normalizeTitle(value, key) : value
          ])
        ),
      });
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次


  const handleEdit = (field: string, currentValue: string) => {
    // 修复：contactTitle 应该从 sectionTitles 中获取当前值
    if (field === 'contactTitle') {
      setEditingField(field);
      setTempValue(sectionTitles.contact);
      return;
    }
    
    // 对于章节标题，编辑时显示当前值（已经是uppercase）
    const isSectionTitle = field.startsWith('section') || 
                          field === 'languageSubTitle' || 
                          field === 'certificationSubTitle';
    
    setEditingField(field);
    setTempValue(isSectionTitle ? currentValue : currentValue);
  };

  const handleSave = (field: string) => {
    const updatedData = { ...data };

    // 确保 avatar 字段被保留（防止意外丢失）
    if (updatedData.avatar === undefined) {
      updatedData.avatar = data.avatar;
    }

    // 判断是否是章节标题字段
    const isSectionField = field === 'contactTitle' || 
                          field === 'languageSubTitle' || 
                          field === 'certificationSubTitle' ||
                          field.startsWith('section');
    
    // 如果是章节标题，标准化为专业格式
    const processedValue = isSectionField ? normalizeTitle(tempValue, 
      field === 'sectionAbout' ? 'about' :
      field === 'sectionWork' ? 'work' :
      field === 'sectionProjects' ? 'projects' :
      field === 'sectionSkills' ? 'skills' :
      field === 'sectionEducation' ? 'education' :
      field === 'sectionLanguagesAndCertifications' ? 'languagesAndCertifications' :
      field === 'languageSubTitle' ? 'languageSubTitle' :
      field === 'certificationSubTitle' ? 'certificationSubTitle' :
      'contact'
    ) : tempValue;

    // 批量更新sectionTitles（避免多次渲染）
    let newSectionTitles: any = null;

    // 处理章节标题（统一逻辑）
    if (field === 'contactTitle') {
      newSectionTitles = { ...sectionTitles, contact: processedValue };
    } else if (field === 'sectionAbout') {
      newSectionTitles = { ...sectionTitles, about: processedValue };
    } else if (field === 'sectionWork') {
      newSectionTitles = { ...sectionTitles, work: processedValue };
    } else if (field === 'sectionEducation') {
      newSectionTitles = { ...sectionTitles, education: processedValue };
    } else if (field === 'sectionProjects') {
      newSectionTitles = { ...sectionTitles, projects: processedValue };
    } else if (field === 'sectionSkills') {
      newSectionTitles = { ...sectionTitles, skills: processedValue };
    } else if (field === 'sectionLanguages' || field === 'sectionLanguagesAndCertifications') {
      newSectionTitles = { ...sectionTitles, languagesAndCertifications: tempValue };
    } else if (field === 'sectionCertifications') {
      newSectionTitles = { ...sectionTitles, languagesAndCertifications: tempValue };
    } else if (field === 'languageSubTitle') {
      newSectionTitles = { ...sectionTitles, languageSubTitle: tempValue };
    } else if (field === 'certificationSubTitle') {
      newSectionTitles = { ...sectionTitles, certificationSubTitle: tempValue };
    }

    // 如果是章节标题字段，更新sectionTitles
    if (newSectionTitles) {
      setSectionTitles(newSectionTitles);
      updatedData.sectionTitles = newSectionTitles;
    } else {
      // 处理普通字段
      if (field.startsWith('workExperience.')) {
        const [_, index, key] = field.split('.');
        const idx = parseInt(index);
        updatedData.workExperience[idx] = {
          ...updatedData.workExperience[idx],
          [key]: tempValue,
        };
      } else if (field.startsWith('education.')) {
        const [_, index, key] = field.split('.');
        const idx = parseInt(index);
        updatedData.education[idx] = {
          ...updatedData.education[idx],
          [key]: tempValue,
        };
      } else if (field.startsWith('projects.')) {
        const [_, index, key] = field.split('.');
        const idx = parseInt(index);
        updatedData.projects[idx] = {
          ...updatedData.projects[idx],
          [key]: tempValue,
        };
      } else if (field.startsWith('skills.')) {
        const [_, index] = field.split('.');
        const idx = parseInt(index);
        updatedData.skills[idx] = tempValue;
      } else {
        (updatedData as any)[field] = tempValue;
      }

      // 保留sectionTitles
      if (data.sectionTitles) {
        updatedData.sectionTitles = { ...data.sectionTitles };
      }
    }

    // 统一清空编辑状态和临时值
    setEditingField(null);
    setTempValue('');
    
    // 最后调用onChange（避免中间渲染）
    onChange(updatedData);
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleSkillsChange = (index: number, value: string) => {
    const updatedSkills = [...data.skills];
    updatedSkills[index] = value;
    onChange({ ...data, skills: updatedSkills, avatar: data.avatar });
  };

  const handleLanguageChange = (index: number, field: 'name' | 'level', value: string) => {
    const updatedLanguages = [...(data.languages || [])];
    updatedLanguages[index] = {
      ...updatedLanguages[index],
      [field]: value,
    };
    onChange({ ...data, languages: updatedLanguages, avatar: data.avatar });
  };

  const handleDeleteLanguage = (index: number) => {
    const updatedLanguages = [...(data.languages || [])];
    updatedLanguages.splice(index, 1);
    onChange({ ...data, languages: updatedLanguages, avatar: data.avatar });
  };

  const handleCertificationChange = (index: number, field: 'name' | 'issuer' | 'date', value: string) => {
    const updatedCertifications = [...(data.certifications || [])];
    updatedCertifications[index] = {
      ...updatedCertifications[index],
      [field]: value,
    };
    onChange({ ...data, certifications: updatedCertifications, avatar: data.avatar });
  };

  const handleDeleteCertification = (index: number) => {
    const updatedCertifications = [...(data.certifications || [])];
    updatedCertifications.splice(index, 1);
    onChange({ ...data, certifications: updatedCertifications, avatar: data.avatar });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（限制为 10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('图片大小不能超过 10MB，请选择更小的图片。');
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
            alert('无法处理图片');
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
            
            console.log(`🖼️ 预览头像压缩尝试 ${attempt + 1}: 质量 ${(quality * 100).toFixed(0)}%, 大小 ${(compressedSize / 1024).toFixed(2)}KB`);
            
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
            onChange({ ...data, avatar: compressedDataUrl });
            console.log('✅ 预览头像已压缩并保存');
          };
          
          // 从质量 0.8 开始压缩
          tryCompress(0.8);
        };
        
        img.onerror = () => {
          alert('无法加载图片');
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    if (isEditMode) {
      fileInputRef.current?.click();
    }
  };

  const renderField = (
    field: string,
    value: string,
    component: 'input' | 'textarea' = 'input',
    className: string = '',
    placeholder: string = ''
  ) => {
    const isCurrentField = editingField === field;

    if (isCurrentField && isEditMode) {
      return (
        <div className="flex items-center gap-2">
          {component === 'textarea' ? (
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className={className}
              placeholder={placeholder}
              rows={3}
              autoFocus
            />
          ) : (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className={className}
              placeholder={placeholder}
              autoFocus
            />
          )}
          <Button size="sm" onClick={() => handleSave(field)} className="bg-green-600 hover:bg-green-700">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    // 为联系方式标题添加特殊 class，方便导出时读取
    const isContactTitle = field === 'contactTitle';
    const wrapperClassName = `${className} ${isEditMode && !isCurrentField ? 'group relative cursor-pointer hover:bg-blue-50/50 transition-colors rounded' : ''} ${isContactTitle ? 'resume-section-title-contact' : ''}`;

    return (
      <div
        className={wrapperClassName}
        onClick={() => isEditMode && handleEdit(field, value)}
      >
        {isEditMode && !isCurrentField && (
          <span className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Edit2 className="w-3 h-3 text-blue-600" />
          </span>
        )}
        {value || placeholder}
      </div>
    );
  };

  const renderSectionTitle = (field: string, titleKey: keyof typeof sectionTitles) => {
    const title = sectionTitles[titleKey];
    if (isEditMode) {
      return renderField(field, title, 'input', 'text-xl font-bold text-white px-4 py-2 rounded', '点击编辑标题');
    }
    // 非编辑模式：返回一个带有特殊 class 的 span，方便导出时读取
    return <span className={`resume-section-title-${titleKey}`}>{title}</span>;
  };

  const renderSubTitle = (field: string, titleKey: 'languageSubTitle' | 'certificationSubTitle') => {
    const title = sectionTitles[titleKey];
    if (isEditMode) {
      return renderField(field, title, 'input', 'text-sm font-semibold hover:bg-blue-50/50 transition-colors rounded cursor-pointer py-1', '点击编辑标题');
    }
    // 非编辑模式：返回一个带有特殊 class 的 span，方便导出时读取
    return <span className={`resume-section-title-${titleKey}`}>{title}</span>;
  };

  const c = colorScheme || defaultColorScheme;

  return (
    <div id={id} className="min-w-[1000px] mx-auto shadow-2xl" style={{ width: '1000px', overflow: 'visible', minHeight: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <div className="grid grid-cols-[280px_1fr_250px] gap-0" style={{ width: '100%', height: 'auto' }}>
        {/* 左栏 */}
        <div 
          style={{ 
            backgroundColor: c?.leftColumn.backgroundColor,
            backgroundImage: c?.leftColumn.backgroundColorGradient,
            color: c?.leftColumn.textColor,
            padding: '20px 32px 32px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            minHeight: '100%',
          }}
        >
          {data.avatar && (
            <div 
              className={`w-48 h-48 mx-auto rounded-full overflow-hidden border-4 shadow-2xl cursor-pointer relative group ${isEditMode ? 'border-white/50 hover:border-white' : 'border-white/30'}`}
              onClick={handleImageClick}
            >
              <img
                src={data.avatar}
                alt="头像"
                className="w-full h-full object-cover"
              />
              {isEditMode && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8" />
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            {renderField(
              'name',
              data.name || '姓名',
              'input',
              'text-4xl font-bold mb-2 tracking-wider border-none text-center',
              '点击编辑姓名'
            )}
            <div 
              style={{ 
                height: '4px', 
                width: '64px', 
                background: c?.leftColumn.accentGradient || c?.leftColumn.accentColor, 
                margin: '8px auto' 
              }} 
            />
          </div>

          <div style={{ borderTop: `1px solid ${c?.leftColumn.contactBgColor}`, paddingTop: '24px' }}>
            {renderField(
              'contactTitle',
              sectionTitles.contact,
              'input',
              'text-sm font-bold border-none p-0 mb-2',
              '点击编辑标题'
            )}
            {renderField(
              'email',
              data.email || '',
              'input',
              'text-sm border-none p-2',
              '点击编辑邮箱'
            )}
            {renderField(
              'phone',
              data.phone || '',
              'input',
              'text-sm border-none p-2',
              '点击编辑电话'
            )}
            {renderField(
              'address',
              data.address || '',
              'input',
              'text-sm border-none p-2',
              '点击编辑地址'
            )}
          </div>

          {/* 个人简介标题 */}
          {renderSectionTitle('sectionAbout', 'about')}

          {renderField(
            'summary',
            data.summary,
            'textarea',
            'text-sm leading-relaxed min-h-[120px] p-4 rounded border',
            '点击编辑个人简介'
          )}
        </div>

        {/* 中栏 */}
        <div 
          style={{ 
            backgroundColor: c?.middleColumn.backgroundColor,
            padding: '20px 32px 32px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          {data.workExperience && data.workExperience.length > 0 && (
            <div>
              <div 
                style={{ 
                  backgroundColor: c?.middleColumn.sectionTitleBgColor,
                  color: c?.middleColumn.sectionTitleTextColor,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}
              >
                {renderSectionTitle('sectionWork', 'work')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {data.workExperience.map((exp, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      paddingLeft: '24px',
                      borderLeft: `2px solid ${c?.middleColumn.accentBorderColor}`,
                      position: 'relative',
                      marginBottom: '24px',
                    }}
                  >
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        backgroundColor: c?.middleColumn.accentDotColor, 
                        position: 'absolute',
                        left: '-8px',
                        top: '0',
                      }} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      {renderField(
                        `workExperience.${index}.company`,
                        exp.company,
                        'input',
                        'text-xl font-bold border-none p-0 hover:bg-gray-50 rounded transition-colors',
                        '公司名称'
                      )}
                      {renderField(
                        `workExperience.${index}.endDate`,
                        `${exp.startDate} - ${exp.endDate}`,
                        'input',
                        'text-sm italic border-none p-0 hover:bg-gray-50 rounded transition-colors',
                        '时间'
                      )}
                    </div>
                    {renderField(
                      `workExperience.${index}.position`,
                      exp.position,
                      'input',
                      'text-lg font-semibold mb-3 border-none p-0 hover:bg-gray-50 rounded transition-colors',
                      '职位'
                    )}
                    {renderField(
                      `workExperience.${index}.description`,
                      exp.description,
                      'textarea',
                      'text-sm leading-relaxed min-h-[60px] p-3 rounded-lg hover:bg-gray-100 transition-colors border',
                      '工作描述'
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.projects && data.projects.length > 0 && (
            <div>
              <div 
                style={{ 
                  backgroundColor: c?.middleColumn.sectionTitleBgColor,
                  color: c?.middleColumn.sectionTitleTextColor,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}
              >
                {renderSectionTitle('sectionProjects', 'projects')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {data.projects.map((project, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      paddingLeft: '24px',
                      borderLeft: `2px solid ${c?.middleColumn.accentBorderColor}`,
                      position: 'relative',
                      marginBottom: '24px',
                    }}
                  >
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        backgroundColor: c?.middleColumn.accentDotColor, 
                        position: 'absolute',
                        left: '-8px',
                        top: '0',
                      }} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      {renderField(
                        `projects.${index}.name`,
                        project.name,
                        'input',
                        'text-xl font-bold border-none p-0 hover:bg-gray-50 rounded transition-colors',
                        '项目名称'
                      )}
                      {renderField(
                        `projects.${index}.endDate`,
                        `${project.startDate} - ${project.endDate}`,
                        'input',
                        'text-sm italic border-none p-0 hover:bg-gray-50 rounded transition-colors',
                        '时间'
                      )}
                    </div>
                    {renderField(
                      `projects.${index}.role`,
                      project.role,
                      'input',
                      'text-lg font-semibold mb-3 border-none p-0 hover:bg-gray-50 rounded transition-colors',
                      '角色'
                    )}
                    {renderField(
                      `projects.${index}.description`,
                      project.description,
                      'textarea',
                      'text-sm leading-relaxed min-h-[60px] p-3 rounded-lg hover:bg-gray-100 transition-colors border',
                      '项目描述'
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.education && data.education.length > 0 && (
            <div>
              <div 
                style={{ 
                  backgroundColor: c?.middleColumn.sectionTitleBgColor,
                  color: c?.middleColumn.sectionTitleTextColor,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}
              >
                {renderSectionTitle('sectionEducation', 'education')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {data.education.map((edu, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      paddingLeft: '24px',
                      borderLeft: `2px solid ${c?.middleColumn.accentBorderColor}`,
                      position: 'relative',
                      marginBottom: '24px',
                    }}
                  >
                    <div 
                      style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        backgroundColor: c?.middleColumn.accentDotColor, 
                        position: 'absolute',
                        left: '-8px',
                        top: '0',
                      }} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                      {renderField(
                        `education.${index}.school`,
                        edu.school,
                        'input',
                        'text-xl font-bold border-none p-0 hover:bg-gray-50 rounded transition-colors',
                        '学校名称'
                      )}
                      {renderField(
                        `education.${index}.endDate`,
                        `${edu.startDate} - ${edu.endDate}`,
                        'input',
                        'text-sm italic border-none p-0 hover:bg-gray-50 rounded transition-colors',
                        '时间'
                      )}
                    </div>
                    {renderField(
                      `education.${index}.major`,
                      `${edu.major} - ${edu.degree}`,
                      'input',
                      'text-lg font-semibold mb-3 border-none p-0 hover:bg-gray-50 rounded transition-colors',
                      '专业'
                    )}
                    {renderField(
                      `education.${index}.description`,
                      edu.description,
                      'textarea',
                      'text-sm leading-relaxed min-h-[60px] p-3 rounded-lg hover:bg-gray-100 transition-colors border',
                      '教育描述'
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏 */}
        <div 
          style={{ 
            backgroundColor: c?.rightColumn.backgroundColor,
            padding: '16px 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {data.skills && data.skills.length > 0 && (
            <div>
              <div 
                style={{ 
                  backgroundColor: c?.rightColumn.sectionTitleBgColor,
                  color: c?.rightColumn.sectionTitleTextColor,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}
              >
                {renderSectionTitle('sectionSkills', 'skills')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.skills.map((skill, index) => (
                  <div 
                    key={index}
                    className="group relative"
                  >
                    {isEditMode ? (
                      <Input
                        value={skill}
                        onChange={(e) => handleSkillsChange(index, e.target.value)}
                        style={{
                          backgroundColor: c?.rightColumn.skillCardBgColor,
                          border: `2px solid ${c?.rightColumn.skillCardBorderColor}`,
                          borderRadius: '8px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}
                      />
                    ) : (
                      <div 
                        style={{
                          backgroundColor: c?.rightColumn.skillCardBgColor,
                          border: `2px solid ${c?.rightColumn.skillCardBorderColor}`,
                          borderRadius: '8px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: c?.rightColumn.skillCardTextColor,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        {skill}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
