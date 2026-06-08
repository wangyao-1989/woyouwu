'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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

interface ResumePDFExportProps {
  data: AnalyzedResume;
  fileName?: string;
  colorScheme: ColorScheme;
}

export function ResumePDFExport({ data, fileName = '简历', colorScheme }: ResumePDFExportProps) {
  const createResumeDOM = (container: HTMLDivElement, c: ColorScheme) => {
    // 主容器
    const mainDiv = document.createElement('div');
    mainDiv.style.width = '1000px';
    mainDiv.style.fontFamily = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    mainDiv.style.display = 'flex';
    mainDiv.style.gap = '0';

    // 左栏
    const leftColumn = document.createElement('div');
    leftColumn.style.width = '280px';
    leftColumn.style.backgroundColor = c.leftColumn.backgroundColor;
    leftColumn.style.backgroundImage = c.leftColumn.backgroundColorGradient || '';
    leftColumn.style.color = c.leftColumn.textColor;
    leftColumn.style.padding = '32px';
    leftColumn.style.display = 'flex';
    leftColumn.style.flexDirection = 'column';
    leftColumn.style.gap = '32px';
    leftColumn.style.minHeight = '100%';

    // 头像
    if (data.avatar) {
      const avatarDiv = document.createElement('div');
      avatarDiv.style.width = '192px';
      avatarDiv.style.height = '192px';
      avatarDiv.style.margin = '0 auto';
      avatarDiv.style.borderRadius = '50%';
      avatarDiv.style.overflow = 'hidden';
      avatarDiv.style.border = '4px solid rgba(255, 255, 255, 0.3)';

      const img = document.createElement('img');
      img.src = data.avatar;
      img.alt = '头像';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';

      avatarDiv.appendChild(img);
      leftColumn.appendChild(avatarDiv);
    }

    // 姓名
    const nameDiv = document.createElement('div');
    nameDiv.style.textAlign = 'center';

    const nameText = document.createElement('div');
    nameText.style.fontSize = '36px';
    nameText.style.fontWeight = 'bold';
    nameText.style.marginBottom = '8px';
    nameText.style.letterSpacing = '2px';
    nameText.style.color = c.leftColumn.nameColor;
    nameText.textContent = data.name || '姓名';
    nameDiv.appendChild(nameText);

    const accentLine = document.createElement('div');
    accentLine.style.height = '4px';
    accentLine.style.width = '64px';
    accentLine.style.background = c.leftColumn.accentGradient || c.leftColumn.accentColor;
    accentLine.style.margin = '8px auto';
    nameDiv.appendChild(accentLine);

    leftColumn.appendChild(nameDiv);

    // 联系方式
    const contactDiv = document.createElement('div');
    contactDiv.style.borderTop = `1px solid ${c.leftColumn.contactBgColor}`;
    contactDiv.style.paddingTop = '24px';

    const contactTitle = document.createElement('div');
    contactTitle.style.fontSize = '14px';
    contactTitle.style.fontWeight = 'bold';
    contactTitle.style.color = c.leftColumn.accentColor;
    contactTitle.style.marginBottom = '8px';
    contactTitle.textContent = '联系方式';
    contactDiv.appendChild(contactTitle);

    if (data.email) {
      const emailDiv = document.createElement('div');
      emailDiv.style.fontSize = '14px';
      emailDiv.style.padding = '8px';
      emailDiv.style.backgroundColor = c.leftColumn.contactBgColor;
      emailDiv.style.borderRadius = '8px';
      emailDiv.style.marginBottom = '8px';
      emailDiv.style.color = c.leftColumn.contactTextColor;
      emailDiv.textContent = data.email;
      contactDiv.appendChild(emailDiv);
    }

    if (data.phone) {
      const phoneDiv = document.createElement('div');
      phoneDiv.style.fontSize = '14px';
      phoneDiv.style.padding = '8px';
      phoneDiv.style.backgroundColor = c.leftColumn.contactBgColor;
      phoneDiv.style.borderRadius = '8px';
      phoneDiv.style.marginBottom = '8px';
      phoneDiv.style.color = c.leftColumn.contactTextColor;
      phoneDiv.textContent = data.phone;
      contactDiv.appendChild(phoneDiv);
    }

    if (data.address) {
      const addressDiv = document.createElement('div');
      addressDiv.style.fontSize = '14px';
      addressDiv.style.padding = '8px';
      addressDiv.style.backgroundColor = c.leftColumn.contactBgColor;
      addressDiv.style.borderRadius = '8px';
      addressDiv.style.marginBottom = '8px';
      addressDiv.style.color = c.leftColumn.contactTextColor;
      addressDiv.textContent = data.address;
      contactDiv.appendChild(addressDiv);
    }

    leftColumn.appendChild(contactDiv);

    // 个人简介
    if (data.summary) {
      const summaryDiv = document.createElement('div');
      summaryDiv.style.fontSize = '14px';
      summaryDiv.style.lineHeight = '1.6';
      summaryDiv.style.color = c.leftColumn.summaryTextColor;
      summaryDiv.style.padding = '16px';
      summaryDiv.style.backgroundColor = c.leftColumn.summaryBgColor;
      summaryDiv.style.borderRadius = '8px';
      summaryDiv.style.border = `1px solid ${c.leftColumn.contactBgColor}`;
      summaryDiv.style.minHeight = '120px';
      summaryDiv.textContent = data.summary;
      leftColumn.appendChild(summaryDiv);
    }

    mainDiv.appendChild(leftColumn);

    // 中栏
    const middleColumn = document.createElement('div');
    middleColumn.style.flex = '1';
    middleColumn.style.backgroundColor = c.middleColumn.backgroundColor;
    middleColumn.style.padding = '32px';
    middleColumn.style.display = 'flex';
    middleColumn.style.flexDirection = 'column';
    middleColumn.style.gap = '40px';

    // 辅助函数：创建章节
    const createSection = (title: string, items: any[], renderFn: (item: any, index: number) => HTMLElement) => {
      const sectionDiv = document.createElement('div');

      const sectionTitle = document.createElement('div');
      sectionTitle.style.backgroundColor = c.middleColumn.sectionTitleBgColor;
      sectionTitle.style.color = c.middleColumn.sectionTitleTextColor;
      sectionTitle.style.padding = '12px 24px';
      sectionTitle.style.borderRadius = '8px';
      sectionTitle.style.marginBottom = '24px';
      sectionTitle.style.fontWeight = 'bold';
      sectionTitle.style.fontSize = '20px';
      sectionTitle.textContent = title;
      sectionDiv.appendChild(sectionTitle);

      const itemsContainer = document.createElement('div');
      itemsContainer.style.display = 'flex';
      itemsContainer.style.flexDirection = 'column';
      itemsContainer.style.gap = '24px';

      items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.paddingLeft = '24px';
        itemDiv.style.borderLeft = `2px solid ${c.middleColumn.accentBorderColor}`;
        itemDiv.style.position = 'relative';
        itemDiv.style.marginBottom = '24px';

        const dot = document.createElement('div');
        dot.style.width = '16px';
        dot.style.height = '16px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = c.middleColumn.accentDotColor;
        dot.style.position = 'absolute';
        dot.style.left = '-8px';
        dot.style.top = '0';
        itemDiv.appendChild(dot);

        const contentDiv = renderFn(item, index);
        itemDiv.appendChild(contentDiv);
        itemsContainer.appendChild(itemDiv);
      });

      sectionDiv.appendChild(itemsContainer);
      return sectionDiv;
    };

    // 工作经历
    if (data.workExperience && data.workExperience.length > 0) {
      const workSection = createSection('工作经历', data.workExperience, (exp) => {
        const contentDiv = document.createElement('div');

        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'baseline';
        headerDiv.style.marginBottom = '8px';

        const companyDiv = document.createElement('div');
        companyDiv.style.fontSize = '20px';
        companyDiv.style.fontWeight = 'bold';
        companyDiv.style.color = c.middleColumn.titleTextColor;
        companyDiv.textContent = exp.company;
        headerDiv.appendChild(companyDiv);

        const dateDiv = document.createElement('div');
        dateDiv.style.fontSize = '14px';
        dateDiv.style.color = c.middleColumn.dateTextColor;
        dateDiv.style.fontStyle = 'italic';
        dateDiv.textContent = `${exp.startDate} - ${exp.endDate}`;
        headerDiv.appendChild(dateDiv);

        contentDiv.appendChild(headerDiv);

        const positionDiv = document.createElement('div');
        positionDiv.style.fontSize = '18px';
        positionDiv.style.fontWeight = '600';
        positionDiv.style.color = c.middleColumn.subtitleTextColor;
        positionDiv.style.marginBottom = '12px';
        positionDiv.textContent = exp.position;
        contentDiv.appendChild(positionDiv);

        const descriptionDiv = document.createElement('div');
        descriptionDiv.style.fontSize = '14px';
        descriptionDiv.style.lineHeight = '1.6';
        descriptionDiv.style.color = c.middleColumn.descriptionTextColor;
        descriptionDiv.style.padding = '12px';
        descriptionDiv.style.backgroundColor = c.middleColumn.descriptionBgColor;
        descriptionDiv.style.borderRadius = '8px';
        descriptionDiv.style.minHeight = '60px';
        descriptionDiv.textContent = exp.description;
        contentDiv.appendChild(descriptionDiv);

        return contentDiv;
      });
      middleColumn.appendChild(workSection);
    }

    // 教育背景
    if (data.education && data.education.length > 0) {
      const educationSection = createSection('教育背景', data.education, (edu) => {
        const contentDiv = document.createElement('div');

        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'baseline';
        headerDiv.style.marginBottom = '8px';

        const schoolDiv = document.createElement('div');
        schoolDiv.style.fontSize = '20px';
        schoolDiv.style.fontWeight = 'bold';
        schoolDiv.style.color = c.middleColumn.titleTextColor;
        schoolDiv.textContent = edu.school;
        headerDiv.appendChild(schoolDiv);

        const dateDiv = document.createElement('div');
        dateDiv.style.fontSize = '14px';
        dateDiv.style.color = c.middleColumn.dateTextColor;
        dateDiv.style.fontStyle = 'italic';
        dateDiv.textContent = `${edu.startDate} - ${edu.endDate}`;
        headerDiv.appendChild(dateDiv);

        contentDiv.appendChild(headerDiv);

        const majorDiv = document.createElement('div');
        majorDiv.style.fontSize = '18px';
        majorDiv.style.fontWeight = '600';
        majorDiv.style.color = c.middleColumn.subtitleTextColor;
        majorDiv.style.marginBottom = '12px';
        majorDiv.textContent = `${edu.major} - ${edu.degree}`;
        contentDiv.appendChild(majorDiv);

        if (edu.description) {
          const descriptionDiv = document.createElement('div');
          descriptionDiv.style.fontSize = '14px';
          descriptionDiv.style.lineHeight = '1.6';
          descriptionDiv.style.color = c.middleColumn.descriptionTextColor;
          descriptionDiv.style.padding = '12px';
          descriptionDiv.style.backgroundColor = c.middleColumn.descriptionBgColor;
          descriptionDiv.style.borderRadius = '8px';
          descriptionDiv.style.minHeight = '60px';
          descriptionDiv.textContent = edu.description;
          contentDiv.appendChild(descriptionDiv);
        }

        return contentDiv;
      });
      middleColumn.appendChild(educationSection);
    }

    // 项目经历
    if (data.projects && data.projects.length > 0) {
      const projectSection = createSection('项目经历', data.projects, (project) => {
        const contentDiv = document.createElement('div');

        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'baseline';
        headerDiv.style.marginBottom = '8px';

        const nameDiv = document.createElement('div');
        nameDiv.style.fontSize = '20px';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = c.middleColumn.titleTextColor;
        nameDiv.textContent = project.name;
        headerDiv.appendChild(nameDiv);

        const dateDiv = document.createElement('div');
        dateDiv.style.fontSize = '14px';
        dateDiv.style.color = c.middleColumn.dateTextColor;
        dateDiv.style.fontStyle = 'italic';
        dateDiv.textContent = `${project.startDate} - ${project.endDate}`;
        headerDiv.appendChild(dateDiv);

        contentDiv.appendChild(headerDiv);

        const roleDiv = document.createElement('div');
        roleDiv.style.fontSize = '18px';
        roleDiv.style.fontWeight = '600';
        roleDiv.style.color = c.middleColumn.subtitleTextColor;
        roleDiv.style.marginBottom = '12px';
        roleDiv.textContent = project.role;
        contentDiv.appendChild(roleDiv);

        const descriptionDiv = document.createElement('div');
        descriptionDiv.style.fontSize = '14px';
        descriptionDiv.style.lineHeight = '1.6';
        descriptionDiv.style.color = c.middleColumn.descriptionTextColor;
        descriptionDiv.style.padding = '12px';
        descriptionDiv.style.backgroundColor = c.middleColumn.descriptionBgColor;
        descriptionDiv.style.borderRadius = '8px';
        descriptionDiv.style.minHeight = '60px';
        descriptionDiv.textContent = project.description;
        contentDiv.appendChild(descriptionDiv);

        return contentDiv;
      });
      middleColumn.appendChild(projectSection);
    }

    mainDiv.appendChild(middleColumn);

    // 右栏
    const rightColumn = document.createElement('div');
    rightColumn.style.width = '250px';
    rightColumn.style.backgroundColor = c.rightColumn.backgroundColor;
    rightColumn.style.padding = '24px';
    rightColumn.style.display = 'flex';
    rightColumn.style.flexDirection = 'column';
    rightColumn.style.gap = '24px';

    // 专业技能
    if (data.skills && data.skills.length > 0) {
      const skillsSection = document.createElement('div');

      const skillsTitle = document.createElement('div');
      skillsTitle.style.backgroundColor = c.rightColumn.sectionTitleBgColor;
      skillsTitle.style.color = c.rightColumn.sectionTitleTextColor;
      skillsTitle.style.padding = '8px 16px';
      skillsTitle.style.borderRadius = '8px';
      skillsTitle.style.fontSize = '18px';
      skillsTitle.style.fontWeight = 'bold';
      skillsTitle.style.marginBottom = '16px';
      skillsTitle.textContent = '专业技能';
      skillsSection.appendChild(skillsTitle);

      data.skills.forEach((skill) => {
        const skillDiv = document.createElement('div');
        skillDiv.style.backgroundColor = c.rightColumn.skillCardBgColor;
        skillDiv.style.border = `2px solid ${c.rightColumn.skillCardBorderColor}`;
        skillDiv.style.borderRadius = '8px';
        skillDiv.style.padding = '12px 16px';
        skillDiv.style.fontSize = '14px';
        skillDiv.style.fontWeight = '500';
        skillDiv.style.color = c.rightColumn.skillCardTextColor;
        skillDiv.style.marginBottom = '12px';
        skillDiv.textContent = skill;
        skillsSection.appendChild(skillDiv);
      });

      rightColumn.appendChild(skillsSection);
    }

    mainDiv.appendChild(rightColumn);

    container.appendChild(mainDiv);
  };

  const exportToPDF = async () => {
    let loadingMsg: HTMLDivElement | null = null;
    let container: HTMLDivElement | null = null;

    try {
      // 显示加载提示
      loadingMsg = document.createElement('div');
      loadingMsg.textContent = '正在生成PDF...';
      loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px 40px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 16px;
      `;
      document.body.appendChild(loadingMsg);

      // 创建一个隐藏的容器来渲染简历
      container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1000px';
      container.style.backgroundColor = '#ffffff';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);

      // 直接创建 DOM 元素
      const c = colorScheme || defaultColorScheme;
      createResumeDOM(container, c);

      // 等待 DOM 渲染完成
      await new Promise(resolve => setTimeout(resolve, 500));

      // 使用 html2canvas 截图
      const canvas = await html2canvas(container, {
        scale: 2, // 提高清晰度
        useCORS: true, // 允许跨域图片
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: false,
      });

      // 创建 PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert('PDF导出失败: ' + (error as Error).message);
    } finally {
      // 清理资源
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
      if (loadingMsg && document.body.contains(loadingMsg)) {
        document.body.removeChild(loadingMsg);
      }
    }
  };

  return (
    <div className="flex justify-center gap-3">
      <Button onClick={exportToPDF} size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
        <FileText className="w-5 h-5" />
        导出 PDF
      </Button>
    </div>
  );
}
