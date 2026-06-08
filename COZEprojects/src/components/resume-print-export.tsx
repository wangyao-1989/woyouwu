'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

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

interface ResumePrintExportProps {
  data: AnalyzedResume;
  fileName?: string;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatText(text: string): string {
  return escapeHtml(text)
    .split('\n')
    .map(line => `<p style="margin: 0 0 6px 0;">${line}</p>`)
    .join('');
}

// 判断简历语言
function getResumeLanguage(sectionTitles: any): 'zh' | 'en' {
  const titles = [
    sectionTitles?.skills?.toLowerCase() || '',
    sectionTitles?.work?.toLowerCase() || '',
    sectionTitles?.education?.toLowerCase() || '',
    sectionTitles?.projects?.toLowerCase() || '',
    sectionTitles?.languagesAndCertifications?.toLowerCase() || '',
    sectionTitles?.about?.toLowerCase() || '',
  ];
  
  // 检查是否包含英文关键词
  const englishKeywords = ['skill', 'experience', 'education', 'project', 'language', 'certification', 'summary', 'professional', 'work', 'contact', 'information'];
  const hasEnglishKeywords = titles.some(title => 
    englishKeywords.some(keyword => title.includes(keyword))
  );
  
  if (hasEnglishKeywords) {
    return 'en';
  }
  
  // 检查是否包含中文关键词
  const chineseKeywords = ['技能', '经历', '教育', '项目', '语言', '证书', '关于', '工作', '专业', '联系', '方式'];
  const hasChineseKeywords = titles.some(title => 
    chineseKeywords.some(keyword => title.includes(keyword))
  );
  
  if (hasChineseKeywords) {
    return 'zh';
  }
  
  // 默认返回英文
  return 'en';
}

// 标准化标题：只将标题转换为大写，保留用户的原始编辑
function normalizeTitle(title: string, type: string): string {
  const upperTitle = title.toUpperCase().trim();
  
  // 只转换为大写，保留用户的原始编辑内容
  return upperTitle;
}

export function ResumePrintExport({ data, fileName = '简历' }: ResumePrintExportProps) {
  const handlePrint = () => {
    console.log('====================================');
    console.log('🖨️ 开始PDF导出流程');
    console.log('====================================');
    console.log('📦 传入的data:', JSON.stringify(data, null, 2));
    
    // 清理数据：移除空的技能条目
    const cleanedData: AnalyzedResume = {
      ...data,
      skills: (data.skills || []).filter(skill => skill && skill.trim() !== ''),
      workExperience: (data.workExperience || []).filter(exp => exp && exp.company && exp.company.trim() !== ''),
      education: (data.education || []).filter(edu => edu && edu.school && edu.school.trim() !== ''),
      projects: (data.projects || []).filter(proj => proj && proj.name && proj.name.trim() !== ''),
      languages: (data.languages || []).filter(lang => lang && (lang.name?.trim() !== '' || lang.level?.trim() !== '')),
      certifications: (data.certifications || []).filter(cert => cert && (cert.name?.trim() !== '' || cert.issuer?.trim() !== '' || cert.date?.trim() !== '')),
    };

    console.log('1. 传入的 data:', data);
    console.log('1.1 清理后的 skills:', cleanedData.skills);
    console.log('1.2 清理后的 languages:', cleanedData.languages);
    console.log('1.3 清理后的 certifications:', cleanedData.certifications);
    console.log('2. 姓名:', cleanedData.name);
    console.log('3. 工作经历数量:', cleanedData.workExperience?.length);
    console.log('4. 技能:', cleanedData.skills);

    // 从 DOM 中读取最新的内容
    const resumeElement = document.getElementById('resume-preview');
    
    // 尝试从 DOM 中读取最新的数据和章节标题
    let latestData = cleanedData;
    let sectionTitles = {
      contact: '',
      about: '',
      work: '',
      education: '',
      projects: '',
      skills: '',
      languagesAndCertifications: '',
      languageSubTitle: '',
      certificationSubTitle: '',
    };
    
    console.log('34. 开始从DOM读取sectionTitles');
    
    if (resumeElement) {
      try {
        // 检查是否在编辑模式（通过查看是否存在input元素来判断）
        const isEditMode = resumeElement.querySelectorAll('input').length > 0;
        console.log('35. 是否在编辑模式:', isEditMode);

        if (isEditMode) {
          console.log('36. 检测到编辑模式，使用data中的sectionTitles');
          // 编辑模式下，直接使用data中的sectionTitles，不从DOM读取
          sectionTitles = {
            contact: (data as any).sectionTitles?.contact || '',
            about: (data as any).sectionTitles?.about || '',
            work: (data as any).sectionTitles?.work || '',
            education: (data as any).sectionTitles?.education || '',
            projects: (data as any).sectionTitles?.projects || '',
            skills: (data as any).sectionTitles?.skills || '',
            languagesAndCertifications: (data as any).sectionTitles?.languagesAndCertifications || '',
            languageSubTitle: (data as any).sectionTitles?.languageSubTitle || '',
            certificationSubTitle: (data as any).sectionTitles?.certificationSubTitle || '',
          };
        } else {
          console.log('36. 非编辑模式，从DOM读取sectionTitles');
          // 非编辑模式，从DOM读取
          const titleFromSpecialClass = {
            contact: '',
            about: '',
            work: '',
            education: '',
            projects: '',
            skills: '',
            languagesAndCertifications: '',
            languageSubTitle: '',
            certificationSubTitle: '',
          };

          const contactTitleEl = resumeElement.querySelector('.resume-section-title-contact');
          if (contactTitleEl) {
            titleFromSpecialClass.contact = contactTitleEl.textContent?.trim() || '';
          }

          const workTitleEl = resumeElement.querySelector('.resume-section-title-work');
          if (workTitleEl) {
            titleFromSpecialClass.work = workTitleEl.textContent?.trim() || '';
          }

          const educationTitleEl = resumeElement.querySelector('.resume-section-title-education');
          if (educationTitleEl) {
            titleFromSpecialClass.education = educationTitleEl.textContent?.trim() || '';
          }

          const projectsTitleEl = resumeElement.querySelector('.resume-section-title-projects');
          if (projectsTitleEl) {
            titleFromSpecialClass.projects = projectsTitleEl.textContent?.trim() || '';
          }

          const skillsTitleEl = resumeElement.querySelector('.resume-section-title-skills');
          if (skillsTitleEl) {
            titleFromSpecialClass.skills = skillsTitleEl.textContent?.trim() || '';
          }

          const languagesAndCertificationsTitleEl = resumeElement.querySelector('.resume-section-title-languagesAndCertifications');
          if (languagesAndCertificationsTitleEl) {
            titleFromSpecialClass.languagesAndCertifications = languagesAndCertificationsTitleEl.textContent?.trim() || '';
          }

          const aboutTitleEl = resumeElement.querySelector('.resume-section-title-about');
          if (aboutTitleEl) {
            titleFromSpecialClass.about = aboutTitleEl.textContent?.trim() || '';
          }

          const languageSubTitleEl = resumeElement.querySelector('.resume-section-title-languageSubTitle');
          if (languageSubTitleEl) {
            titleFromSpecialClass.languageSubTitle = languageSubTitleEl.textContent?.trim() || '';
          }

          const certificationSubTitleEl = resumeElement.querySelector('.resume-section-title-certificationSubTitle');
          if (certificationSubTitleEl) {
            titleFromSpecialClass.certificationSubTitle = certificationSubTitleEl.textContent?.trim() || '';
          }

          sectionTitles = titleFromSpecialClass;
        }

        console.log('25. 最终确定的章节标题:', sectionTitles);

        // 读取姓名
        const nameElement = resumeElement.querySelector('.text-4xl');
        if (nameElement) {
          console.log('5. DOM 中的姓名:', nameElement.textContent);
          latestData = { ...latestData, name: nameElement.textContent || '' };
        }

        // 读取技能（只在编辑模式下读取）
        if (isEditMode) {
          const skillContainers = resumeElement.querySelectorAll('.group.relative');
          const newSkills: string[] = [];
          
          skillContainers.forEach((container, index) => {
            const input = container.querySelector('input[type="text"]') as HTMLInputElement;
            if (input && input.value) {
              newSkills.push(input.value);
            }
          });

          if (newSkills.length > 0) {
            console.log('7. DOM 中的技能:', newSkills);
            latestData = { ...latestData, skills: newSkills };
          }
        }

      } catch (e) {
        console.error('读取 DOM 数据失败:', e);
      }
    }

    console.log('9. 最终使用的数据:', latestData);
    console.log('10. 最终使用的章节标题:', sectionTitles);

    // 判断简历语言
    const resumeLanguage = getResumeLanguage(sectionTitles);
    console.log('26. 判断简历语言为:', resumeLanguage);

    // 根据语言设置默认标题（仅在所有标题都为空时使用）
    // 这些标题参考了专业HR和简历写作标准，确保措辞正式
    const defaultTitles = resumeLanguage === 'en' ? {
      contact: 'CONTACT INFORMATION',
      about: 'PROFESSIONAL SUMMARY',
      work: 'PROFESSIONAL EXPERIENCE',
      education: 'EDUCATION',
      projects: 'PROJECT EXPERIENCE',
      skills: 'TECHNICAL SKILLS',
      languagesAndCertifications: 'LANGUAGES & CERTIFICATIONS',
      languageSubTitle: 'LANGUAGES',
      certificationSubTitle: 'CERTIFICATIONS',
    } : {
      contact: '联系方式',
      about: '关于我',
      work: '工作经历',
      education: '教育背景',
      projects: '项目经历',
      skills: '专业技能',
      languagesAndCertifications: '语言与证书',
      languageSubTitle: '语言能力',
      certificationSubTitle: '证书认证',
    };
    
    console.log('10.1 education标题原文:', sectionTitles.education);
    console.log('10.2 education标题normalize后:', normalizeTitle(sectionTitles.education || defaultTitles.education, 'education'));

    // 智能合并读取到的标题和默认标题，并标准化为专业格式
    const finalTitles = {
      contact: normalizeTitle(sectionTitles.contact || defaultTitles.contact, 'contact'),
      about: normalizeTitle(sectionTitles.about || defaultTitles.about, 'about'),
      work: normalizeTitle(sectionTitles.work || defaultTitles.work, 'work'),
      education: normalizeTitle(sectionTitles.education || defaultTitles.education, 'education'),
      projects: normalizeTitle(sectionTitles.projects || defaultTitles.projects, 'projects'),
      skills: normalizeTitle(sectionTitles.skills || defaultTitles.skills, 'skills'),
      languagesAndCertifications: normalizeTitle(sectionTitles.languagesAndCertifications || defaultTitles.languagesAndCertifications, 'languagesAndCertifications'),
      // 副标题：如果从DOM或data中读取到了，就使用；否则根据主标题智能推断
      languageSubTitle: normalizeTitle(sectionTitles.languageSubTitle || 
                         (data as any).sectionTitles?.languageSubTitle || 
                         defaultTitles.languageSubTitle, 'languageSubTitle'),
      certificationSubTitle: normalizeTitle(sectionTitles.certificationSubTitle || 
                              (data as any).sectionTitles?.certificationSubTitle || 
                              defaultTitles.certificationSubTitle, 'certificationSubTitle'),
    };

    // 检测哪些section需要合并
    // 规则：如果某个section标题包含多个关键字，就将对应的内容合并到一个section中
    const mergedSections: { [key: string]: boolean } = {};
    
    // 检查education标题是否包含certification或languages关键字
    const educationTitle = finalTitles.education.toUpperCase();
    const hasEducationAndCertifications = educationTitle.includes('CERTIFICATION') || 
                                          educationTitle.includes('&') ||
                                          educationTitle.includes('AND');
    const hasEducationAndLanguages = educationTitle.includes('LANGUAGES');
    const educationTitleEqualsLangCert = educationTitle === 'EDUCATION & CERTIFICATIONS' ||
                                         educationTitle === 'EDUCATION AND CERTIFICATIONS';
    
    if (hasEducationAndCertifications) {
      mergedSections['educationAndCertifications'] = true;
    }

    // 检查languagesAndCertifications是否应该显示
    // 只有当certifications未被合并到education，或者languages未合并到education时才显示
    const hasLanguages = latestData.languages && latestData.languages.some(lang => lang.name?.trim() !== '' || lang.level?.trim() !== '');
    const hasCertifications = latestData.certifications && latestData.certifications.some(cert => cert.name?.trim() !== '' || cert.issuer?.trim() !== '' || cert.date?.trim() !== '');
    const shouldShowLanguagesAndCertifications = 
      (hasLanguages && !hasEducationAndLanguages && !educationTitleEqualsLangCert) || 
      (!mergedSections['educationAndCertifications'] && hasCertifications && !educationTitleEqualsLangCert);

    // 检查skills标题是否包含language关键字
    const skillsTitle = finalTitles.skills.toUpperCase();
    const hasSkillsAndLanguages = skillsTitle.includes('LANGUAGE') || 
                                   skillsTitle.includes('LANGUAGES');
    
    if (hasSkillsAndLanguages) {
      mergedSections['skillsAndLanguages'] = true;
    }

    console.log('检测到的合并section:', mergedSections);

    // 生成 PDF HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(fileName)}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 1.5cm 1.5cm 1.5cm 1.5cm;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Microsoft YaHei", sans-serif;
              font-size: 13px;
              line-height: 1.5;
              color: #1a202c;
              background: white;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              h1, h2, h3 {
                page-break-after: avoid;
              }

              section, .experience-item, .education-item, .project-item {
                page-break-inside: avoid;
              }

              p {
                page-break-inside: avoid;
              }
            }

            .container {
              width: 100%;
              min-height: 257mm;
              margin: 0;
              padding: 0 15px;
              background: white;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 20px 0 15px 0;
              border-bottom: 2px solid #2c5282;
              margin-bottom: 15px;
            }

            .header-left {
              flex: 1;
            }

            .header-name {
              font-size: 28px;
              font-weight: 700;
              color: #1a365d;
              margin: 0 0 10px 0;
              letter-spacing: 1px;
            }

            .header-contact {
              font-size: 12px;
              color: #4a5568;
              margin: 0;
              display: flex;
              gap: 18px;
              flex-wrap: wrap;
            }

            .header-contact-item {
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .header-right {
              display: flex;
              align-items: center;
              margin-left: 15px;
            }

            .header-avatar {
              width: 84px;
              height: 84px;
              border-radius: 50%;
              object-fit: cover;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
              color: #1a365d;
              margin: 0 0 12px 0;
              letter-spacing: 1.5px;
            }

            .header-contact {
              font-size: 12px;
              color: #4a5568;
              margin: 0;
              display: flex;
              justify-content: center;
              gap: 30px;
              flex-wrap: wrap;
            }

            .header-contact-item {
              display: flex;
              align-items: center;
              gap: 6px;
            }

            .section {
              margin-bottom: 12px;
            }

            .section-title {
              font-size: 15px;
              font-weight: 700;
              color: #2c5282;
              margin: 0 0 8px 0;
              padding-bottom: 4px;
              border-bottom: 2px solid #e2e8f0;
              text-transform: uppercase;
              letter-spacing: 1.2px;
            }

            .summary {
              font-size: 13px;
              line-height: 1.6;
              color: #4a5568;
              text-align: justify;
              text-indent: 1.5em;
            }

            .item {
              margin-bottom: 10px;
            }

            .item-header {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              margin-bottom: 3px;
            }

            .item-title {
              font-size: 14px;
              font-weight: 700;
              margin: 0;
              color: #2d3748;
            }

            .item-date {
              font-size: 12px;
              color: #718096;
              font-style: italic;
            }

            .item-subtitle {
              font-size: 13px;
              font-weight: 600;
              color: #4a5568;
              margin-bottom: 3px;
            }

            .item-description {
              font-size: 13px;
              line-height: 1.6;
              color: #4a5568;
              text-align: justify;
              text-indent: 1.5em;
            }

            .skills {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }

            .skill-tag {
              background: #f7fafc;
              border: 1px solid #cbd5e0;
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: 500;
              color: #2d3748;
              display: inline-block;
              letter-spacing: 0.2px;
            }

            .language-item, .cert-item {
              margin-bottom: 6px;
              padding: 6px 8px;
              background: #f7fafc;
              border-left: 3px solid #4299e1;
            }

            .language-name {
              font-weight: 600;
              color: #2d3748;
              font-size: 13px;
            }

            .language-level {
              color: #718096;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- 顶部个人信息 - 左右布局 -->
            <div class="header">
              <div class="header-left">
                <h1 class="header-name">${escapeHtml(latestData.name || '姓名')}</h1>
                <p class="header-contact">
                  ${latestData.email ? `<span class="header-contact-item">📧 ${escapeHtml(latestData.email)}</span>` : ''}
                  ${latestData.phone ? `<span class="header-contact-item">📱 ${escapeHtml(latestData.phone)}</span>` : ''}
                  ${latestData.address ? `<span class="header-contact-item">📍 ${escapeHtml(latestData.address)}</span>` : ''}
                </p>
              </div>
              ${latestData.avatar ? `
                <div class="header-right">
                  <img src="${escapeHtml(latestData.avatar)}" alt="头像" class="header-avatar">
                </div>
              ` : ''}
            </div>

            <!-- 个人简介 -->
            ${latestData.summary ? `
              <div class="section">
                <h2 class="section-title">${escapeHtml(finalTitles.about)}</h2>
                <div class="summary">
                  ${formatText(latestData.summary)}
                </div>
              </div>
            ` : ''}

            <!-- 专业技能 -->
            ${latestData.skills && latestData.skills.length > 0 ? `
              <div class="section">
                <h2 class="section-title">${escapeHtml(finalTitles.skills)}</h2>
                <div class="item-description">
                  ${formatText(latestData.skills.join('\n'))}
                </div>
              </div>
            ` : ''}

            <!-- 工作经历 -->
            ${latestData.workExperience && latestData.workExperience.length > 0 ? `
              <div class="section">
                <h2 class="section-title">${escapeHtml(finalTitles.work)}</h2>
                ${latestData.workExperience.map((exp, index) => `
                  <div class="item experience-item">
                    <div class="item-header">
                      <h3 class="item-title">${escapeHtml(exp.company)}</h3>
                      <span class="item-date">${escapeHtml(exp.startDate)} - ${escapeHtml(exp.endDate)}</span>
                    </div>
                    <div class="item-subtitle">${escapeHtml(exp.position)}</div>
                    <div class="item-description">${formatText(exp.description)}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- 项目经历 -->
            ${latestData.projects && latestData.projects.length > 0 ? `
              <div class="section">
                <h2 class="section-title">${escapeHtml(finalTitles.projects)}</h2>
                ${latestData.projects.map((project, index) => `
                  <div class="item project-item">
                    <div class="item-header">
                      <h3 class="item-title">${escapeHtml(project.name)}</h3>
                      <span class="item-date">${escapeHtml(project.startDate)} - ${escapeHtml(project.endDate)}</span>
                    </div>
                    <div class="item-subtitle">${escapeHtml(project.role)}</div>
                    <div class="item-description">${formatText(project.description)}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- 教育背景 / 教育背景与证书 / 教育背景与语言与证书 -->
            ${(latestData.education && latestData.education.length > 0) || 
              (mergedSections['educationAndCertifications'] && latestData.certifications && latestData.certifications.some(cert => cert.name?.trim() !== '')) ||
              (hasEducationAndLanguages && latestData.languages && latestData.languages.some(lang => lang.name?.trim() !== '')) ? `
              <div class="section">
                <h2 class="section-title">${escapeHtml(finalTitles.education)}</h2>
                
                <!-- 教育经历 -->
                ${latestData.education && latestData.education.length > 0 ? latestData.education.map((edu, index) => `
                  <div class="item education-item">
                    <div class="item-description" style="text-indent: 0;">
                      ${formatText(`${edu.degree ? escapeHtml(edu.degree) + ' in ' : ''}${edu.major ? escapeHtml(edu.major) + ', ' : ''}${edu.school ? escapeHtml(edu.school) : ''}${edu.description ? '\n\n' + edu.description : ''}`)}
                    </div>
                  </div>
                `).join('') : ''}
              </div>
            ` : ''}

            <!-- 语言与证书（仅当需要显示时才渲染） -->
            ${shouldShowLanguagesAndCertifications ? `
              <div class="section">
                <h2 class="section-title">${escapeHtml(finalTitles.languagesAndCertifications)}</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                  ${hasLanguages && latestData.languages ? `
                    <div>
                      <h3 style="font-size: 14px; font-weight: 600; color: #4a5568; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.8px;">${escapeHtml(finalTitles.languageSubTitle)}</h3>
                      <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${latestData.languages.filter(lang => lang.name?.trim() !== '' || lang.level?.trim() !== '').map((lang, index) => `
                          <div class="language-item">
                            <span class="language-name">${escapeHtml(lang.name)}</span>
                            ${lang.level ? `<span class="language-level"> - ${escapeHtml(lang.level)}</span>` : ''}
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}

                  ${!mergedSections['educationAndCertifications'] && hasCertifications && latestData.certifications ? `
                    <div>
                      <h3 style="font-size: 14px; font-weight: 600; color: #4a5568; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.8px;">${escapeHtml(finalTitles.certificationSubTitle)}</h3>
                      <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${latestData.certifications.filter(cert => cert.name?.trim() !== '' || cert.issuer?.trim() !== '' || cert.date?.trim() !== '').map((cert, index) => `
                          <div class="cert-item">
                            <div style="font-weight: 600; color: #2d3748; margin-bottom: 2px;">${escapeHtml(cert.name)}</div>
                            ${cert.issuer ? `<div style="font-size: 12px; color: #718096; margin-bottom: 1px;">${escapeHtml(cert.issuer)}</div>` : ''}
                            ${cert.date ? `<div style="font-size: 12px; color: #a0aec0;">${escapeHtml(cert.date)}</div>` : ''}
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;

    // 调试：输出生成的HTML到console
    console.log('====================================');
    console.log('📄 生成的PDF HTML内容:');
    console.log('====================================');
    console.log(htmlContent);
    console.log('====================================');

    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // 等待内容加载后再打印
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <Button onClick={handlePrint} variant="outline" className="gap-2">
      <FileText className="w-4 h-4" />
      导出 PDF
    </Button>
  );
}
