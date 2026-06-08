'use client';

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

interface ResumePDFRendererProps {
  data: AnalyzedResume;
  colorScheme: ColorScheme;
}

export function ResumePDFRenderer({ data, colorScheme }: ResumePDFRendererProps) {
  const c = colorScheme || {
    leftColumn: {
      backgroundColor: '#2C3E50',
      backgroundColorGradient: 'linear-gradient(135deg, #2C3E50 0%, #1F2B38 100%)',
      textColor: '#ECF0F1',
      nameColor: '#FFFFFF',
      contactBgColor: 'rgba(255, 255, 255, 0.1)',
      contactTextColor: '#BDC3C7',
      summaryBgColor: 'rgba(255, 255, 255, 0.05)',
      summaryTextColor: '#BDC3C7',
      accentColor: '#3498DB',
      accentGradient: 'linear-gradient(90deg, #3498DB 0%, #2980B9 100%)',
    },
    middleColumn: {
      backgroundColor: '#FFFFFF',
      sectionTitleBgColor: '#2C3E50',
      sectionTitleTextColor: '#FFFFFF',
      titleTextColor: '#2C3E50',
      subtitleTextColor: '#3498DB',
      dateTextColor: '#7F8C8D',
      descriptionTextColor: '#34495E',
      descriptionBgColor: '#F8F9FA',
      accentDotColor: '#3498DB',
      accentBorderColor: '#3498DB',
    },
    rightColumn: {
      backgroundColor: '#F8F9FA',
      sectionTitleBgColor: '#2C3E50',
      sectionTitleTextColor: '#FFFFFF',
      skillCardBgColor: '#FFFFFF',
      skillCardBorderColor: '#3498DB',
      skillCardTextColor: '#2C3E50',
    },
  };

  const containerStyle = {
    width: '1000px',
    fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    gap: '0',
  };

  const leftColumnStyle = {
    width: '280px',
    backgroundColor: c.leftColumn.backgroundColor,
    backgroundImage: c.leftColumn.backgroundColorGradient,
    color: c.leftColumn.textColor,
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
    minHeight: '100%',
  };

  const middleColumnStyle = {
    flex: 1,
    backgroundColor: c.middleColumn.backgroundColor,
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '40px',
  };

  const rightColumnStyle = {
    width: '250px',
    backgroundColor: c.rightColumn.backgroundColor,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  };

  const sectionTitleStyle = {
    backgroundColor: c.middleColumn.sectionTitleBgColor,
    color: c.middleColumn.sectionTitleTextColor,
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '24px',
  };

  const sectionTitleRightStyle = {
    backgroundColor: c.rightColumn.sectionTitleBgColor,
    color: c.rightColumn.sectionTitleTextColor,
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
  };

  const itemContainerStyle = {
    paddingLeft: '24px',
    borderLeft: `2px solid ${c.middleColumn.accentBorderColor}`,
    position: 'relative' as const,
    marginBottom: '24px',
  };

  const dotStyle = {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: c.middleColumn.accentDotColor,
    position: 'absolute' as const,
    left: '-8px',
    top: '0',
  };

  const skillCardStyle = {
    backgroundColor: c.rightColumn.skillCardBgColor,
    border: `2px solid ${c.rightColumn.skillCardBorderColor}`,
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: c.rightColumn.skillCardTextColor,
    marginBottom: '12px',
  };

  const contactItemStyle = {
    fontSize: '14px',
    padding: '8px',
    backgroundColor: c.leftColumn.contactBgColor,
    borderRadius: '8px',
    marginBottom: '8px',
    color: c.leftColumn.contactTextColor,
  };

  const summaryStyle = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: c.leftColumn.summaryTextColor,
    padding: '16px',
    backgroundColor: c.leftColumn.summaryBgColor,
    borderRadius: '8px',
    border: `1px solid ${c.leftColumn.contactBgColor}`,
    minHeight: '120px',
  };

  const descriptionStyle = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: c.middleColumn.descriptionTextColor,
    padding: '12px',
    backgroundColor: c.middleColumn.descriptionBgColor,
    borderRadius: '8px',
    minHeight: '60px',
  };

  return (
    <div style={containerStyle}>
      {/* 左栏 */}
      <div style={leftColumnStyle}>
        {data.avatar && (
          <div style={{ width: '192px', height: '192px', margin: '0 auto', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255, 255, 255, 0.3)' }}>
            <img
              src={data.avatar}
              alt="头像"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '2px', color: c.leftColumn.nameColor }}>
            {data.name || '姓名'}
          </div>
          <div style={{ height: '4px', width: '64px', background: c.leftColumn.accentGradient || c.leftColumn.accentColor, margin: '8px auto' }}></div>
        </div>

        <div style={{ borderTop: `1px solid ${c.leftColumn.contactBgColor}`, paddingTop: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: c.leftColumn.accentColor, marginBottom: '8px' }}>联系方式</div>
          {data.email && <div style={contactItemStyle}>{data.email}</div>}
          {data.phone && <div style={contactItemStyle}>{data.phone}</div>}
          {data.address && <div style={contactItemStyle}>{data.address}</div>}
        </div>

        {data.summary && (
          <div style={summaryStyle}>
            {data.summary}
          </div>
        )}
      </div>

      {/* 中栏 */}
      <div style={middleColumnStyle}>
        {data.workExperience && data.workExperience.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>工作经历</div>
            {data.workExperience.map((exp, index) => (
              <div key={index} style={itemContainerStyle}>
                <div style={dotStyle}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: c.middleColumn.titleTextColor }}>
                    {exp.company}
                  </div>
                  <div style={{ fontSize: '14px', color: c.middleColumn.dateTextColor, fontStyle: 'italic' }}>
                    {exp.startDate} - {exp.endDate}
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: c.middleColumn.subtitleTextColor, marginBottom: '12px' }}>
                  {exp.position}
                </div>
                <div style={descriptionStyle}>
                  {exp.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {data.education && data.education.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>教育背景</div>
            {data.education.map((edu, index) => (
              <div key={index} style={itemContainerStyle}>
                <div style={dotStyle}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: c.middleColumn.titleTextColor }}>
                    {edu.school}
                  </div>
                  <div style={{ fontSize: '14px', color: c.middleColumn.dateTextColor, fontStyle: 'italic' }}>
                    {edu.startDate} - {edu.endDate}
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: c.middleColumn.subtitleTextColor, marginBottom: '12px' }}>
                  {edu.major} - {edu.degree}
                </div>
                <div style={descriptionStyle}>
                  {edu.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {data.projects && data.projects.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>项目经历</div>
            {data.projects.map((project, index) => (
              <div key={index} style={itemContainerStyle}>
                <div style={dotStyle}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: c.middleColumn.titleTextColor }}>
                    {project.name}
                  </div>
                  <div style={{ fontSize: '14px', color: c.middleColumn.dateTextColor, fontStyle: 'italic' }}>
                    {project.startDate} - {project.endDate}
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: c.middleColumn.subtitleTextColor, marginBottom: '12px' }}>
                  {project.role}
                </div>
                <div style={descriptionStyle}>
                  {project.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右栏 */}
      <div style={rightColumnStyle}>
        {data.skills && data.skills.length > 0 && (
          <div>
            <div style={sectionTitleRightStyle}>专业技能</div>
            {data.skills.map((skill, index) => (
              <div key={index} style={skillCardStyle}>
                {skill}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
