'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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

interface Resume {
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

interface ResumeWordExportProps {
  resume: Resume;
}

export function ResumeWordExport({ resume }: ResumeWordExportProps) {
  const exportToWord = () => {
    // 创建HTML内容 - 三栏布局
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${resume.name || '简历'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: "Microsoft YaHei", Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
          }

          .resume {
            background: white;
            max-width: 1000px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 280px 1fr 250px;
            gap: 30px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }

          /* 左栏样式 */
          .left-column {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          .avatar-container {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            overflow: hidden;
            margin: 0 auto;
            border: 4px solid #e8f4fc;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .avatar-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .name {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a8a;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 10px;
          }

          .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-size: 13px;
            color: #64748b;
          }

          .contact-item strong {
            color: #1e3a8a;
            min-width: 40px;
          }

          .summary {
            font-size: 13px;
            line-height: 1.8;
            color: #475569;
            text-align: justify;
          }

          /* 中栏样式 */
          .middle-column {
            display: flex;
            flex-direction: column;
            gap: 30px;
          }

          /* 右栏样式 */
          .right-column {
            display: flex;
            flex-direction: column;
            gap: 25px;
          }

          /* 板块标题 */
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            padding-bottom: 8px;
            border-bottom: 3px solid #3b82f6;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          /* 项目样式 */
          .item {
            margin-bottom: 20px;
            padding-left: 15px;
            border-left: 3px solid #3b82f6;
          }

          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 5px;
          }

          .item-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a8a;
          }

          .item-date {
            font-size: 13px;
            color: #64748b;
            font-style: italic;
          }

          .item-subtitle {
            font-size: 14px;
            color: #3b82f6;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .item-desc {
            font-size: 13px;
            line-height: 1.7;
            color: #475569;
            white-space: pre-wrap;
          }

          /* 技能标签 */
          .skills-container {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .skill-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .skill-tag {
            background: linear-gradient(135deg, #e8f4fc 0%, #dbeafe 100%);
            color: #1e3a8a;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid #bfdbfe;
            display: inline-block;
          }

          /* 装饰元素 */
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e8f4fc, transparent);
            margin: 10px 0;
          }

          /* 打印样式 */
          @media print {
            body {
              background: white;
              padding: 0;
            }

            .resume {
              box-shadow: none;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="resume">
          <!-- 左栏 -->
          <div class="left-column">
            ${resume.avatar ? `
              <div class="avatar-container">
                <img src="${resume.avatar}" alt="头像">
              </div>
            ` : ''}

            <div class="name">${resume.name || '姓名'}</div>

            <div class="contact-info">
              ${resume.email ? `
                <div class="contact-item">
                  <strong>邮箱</strong>
                  <span>${resume.email}</span>
                </div>
              ` : ''}
              ${resume.phone ? `
                <div class="contact-item">
                  <strong>电话</strong>
                  <span>${resume.phone}</span>
                </div>
              ` : ''}
              ${resume.address ? `
                <div class="contact-item">
                  <strong>地址</strong>
                  <span>${resume.address}</span>
                </div>
              ` : ''}
            </div>

            ${resume.summary ? `
              <div class="summary">${resume.summary}</div>
            ` : ''}
          </div>

          <!-- 中栏 -->
          <div class="middle-column">
            ${resume.workExperience && resume.workExperience.length > 0 ? `
              <div>
                <div class="section-title">工作经历</div>
                ${resume.workExperience.map(exp => `
                  <div class="item">
                    <div class="item-header">
                      <div class="item-title">${exp.company}</div>
                      <div class="item-date">${exp.startDate} - ${exp.endDate}</div>
                    </div>
                    <div class="item-subtitle">${exp.position}</div>
                    ${exp.description ? `<div class="item-desc">${exp.description}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${resume.education && resume.education.length > 0 ? `
              <div>
                <div class="section-title">教育背景</div>
                ${resume.education.map(edu => `
                  <div class="item">
                    <div class="item-header">
                      <div class="item-title">${edu.school}</div>
                      <div class="item-date">${edu.endDate}</div>
                    </div>
                    <div class="item-subtitle">${edu.major} - ${edu.degree}</div>
                    ${edu.description ? `<div class="item-desc">${edu.description}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${resume.projects && resume.projects.length > 0 ? `
              <div>
                <div class="section-title">项目经历</div>
                ${resume.projects.map(proj => `
                  <div class="item">
                    <div class="item-header">
                      <div class="item-title">${proj.name}</div>
                      <div class="item-date">${proj.startDate} - ${proj.endDate}</div>
                    </div>
                    <div class="item-subtitle">${proj.role}</div>
                    ${proj.description ? `<div class="item-desc">${proj.description}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- 右栏 -->
          <div class="right-column">
            ${resume.skills && resume.skills.length > 0 ? `
              <div>
                <div class="section-title">专业技能</div>
                <div class="skills-container">
                  <div class="skill-group">
                    ${resume.skills.slice(0, Math.ceil(resume.skills.length / 2)).map(skill => `
                      <span class="skill-tag">${skill}</span>
                    `).join('')}
                  </div>
                  <div class="skill-group">
                    ${resume.skills.slice(Math.ceil(resume.skills.length / 2)).map(skill => `
                      <span class="skill-tag">${skill}</span>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    // 创建Blob对象
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resume.name || '简历'}.doc`;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex justify-center">
      <Button onClick={exportToWord} size="lg" className="gap-2">
        <Download className="w-5 h-5" />
        导出 Word 文档
      </Button>
    </div>
  );
}
