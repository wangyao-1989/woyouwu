import { useState, useEffect, useRef } from 'react';

// ===== 配色方案定义 =====
const colorSchemes = [
  {
    id: 'business-blue', name: '经典商务蓝',
    leftColumn: { backgroundColor: '#2C3E50', backgroundColorGradient: 'linear-gradient(135deg, #2C3E50 0%, #1F2B38 100%)', textColor: '#ECF0F1', nameColor: '#FFFFFF', contactBgColor: 'rgba(255,255,255,0.1)', contactTextColor: '#BDC3C7', summaryBgColor: 'rgba(255,255,255,0.05)', summaryTextColor: '#BDC3C7', accentColor: '#3498DB', accentGradient: 'linear-gradient(90deg, #3498DB 0%, #2980B9 100%)' },
    middleColumn: { backgroundColor: '#FFFFFF', sectionTitleBgColor: '#2C3E50', sectionTitleTextColor: '#FFFFFF', titleTextColor: '#2C3E50', subtitleTextColor: '#3498DB', dateTextColor: '#7F8C8D', descriptionTextColor: '#34495E', descriptionBgColor: '#F8F9FA', accentDotColor: '#3498DB', accentBorderColor: '#3498DB' },
    rightColumn: { backgroundColor: '#F8F9FA', sectionTitleBgColor: '#2C3E50', sectionTitleTextColor: '#FFFFFF', skillCardBgColor: '#FFFFFF', skillCardBorderColor: '#3498DB', skillCardTextColor: '#2C3E50' },
  },
  {
    id: 'morandi-green', name: '莫兰迪绿',
    leftColumn: { backgroundColor: '#9AA6A2', backgroundColorGradient: 'linear-gradient(135deg, #9AA6A2 0%, #B7C4B1 100%)', textColor: '#FFFFFF', nameColor: '#FFFFFF', contactBgColor: 'rgba(255,255,255,0.15)', contactTextColor: '#E8E8E8', summaryBgColor: 'rgba(255,255,255,0.1)', summaryTextColor: '#E8E8E8', accentColor: '#7F8C8D', accentGradient: 'linear-gradient(90deg, #7F8C8D 0%, #95A5A6 100%)' },
    middleColumn: { backgroundColor: '#FFFFFF', sectionTitleBgColor: '#9AA6A2', sectionTitleTextColor: '#FFFFFF', titleTextColor: '#4A4A4A', subtitleTextColor: '#6B7B7B', dateTextColor: '#7F8C8D', descriptionTextColor: '#4A4A4A', descriptionBgColor: '#F5F5F5', accentDotColor: '#9AA6A2', accentBorderColor: '#9AA6A2' },
    rightColumn: { backgroundColor: '#FAFAFA', sectionTitleBgColor: '#9AA6A2', sectionTitleTextColor: '#FFFFFF', skillCardBgColor: '#FFFFFF', skillCardBorderColor: '#9AA6A2', skillCardTextColor: '#4A4A4A' },
  },
  {
    id: 'earth-tone', name: '高级大地色',
    leftColumn: { backgroundColor: '#C7B198', backgroundColorGradient: 'linear-gradient(135deg, #C7B198 0%, #DFD3C3 100%)', textColor: '#4A4A4A', nameColor: '#2C2C2C', contactBgColor: 'rgba(255,255,255,0.3)', contactTextColor: '#5A5A5A', summaryBgColor: 'rgba(255,255,255,0.2)', summaryTextColor: '#5A5A5A', accentColor: '#6B4F4F', accentGradient: 'linear-gradient(90deg, #6B4F4F 0%, #8B6F6F 100%)' },
    middleColumn: { backgroundColor: '#FEFEFE', sectionTitleBgColor: '#6B4F4F', sectionTitleTextColor: '#FFFFFF', titleTextColor: '#2C2C2C', subtitleTextColor: '#8B6F6F', dateTextColor: '#7F7F7F', descriptionTextColor: '#4A4A4A', descriptionBgColor: '#FDFDFD', accentDotColor: '#C7B198', accentBorderColor: '#C7B198' },
    rightColumn: { backgroundColor: '#FAF8F5', sectionTitleBgColor: '#6B4F4F', sectionTitleTextColor: '#FFFFFF', skillCardBgColor: '#FFFFFF', skillCardBorderColor: '#C7B198', skillCardTextColor: '#2C2C2C' },
  },
  {
    id: 'burgundy-red', name: '深邃酒红',
    leftColumn: { backgroundColor: '#6D3B3B', backgroundColorGradient: 'linear-gradient(135deg, #6D3B3B 0%, #8B5A5A 100%)', textColor: '#F5E6D3', nameColor: '#FFFFFF', contactBgColor: 'rgba(245,230,211,0.15)', contactTextColor: '#E8D5C4', summaryBgColor: 'rgba(245,230,211,0.1)', summaryTextColor: '#E8D5C4', accentColor: '#D4AF37', accentGradient: 'linear-gradient(90deg, #D4AF37 0%, #E5C158 100%)' },
    middleColumn: { backgroundColor: '#FFFFFF', sectionTitleBgColor: '#6D3B3B', sectionTitleTextColor: '#FFFFFF', titleTextColor: '#2C2C2C', subtitleTextColor: '#8B5A5A', dateTextColor: '#7F7F7F', descriptionTextColor: '#4A4A4A', descriptionBgColor: '#FDFCFA', accentDotColor: '#D4AF37', accentBorderColor: '#6D3B3B' },
    rightColumn: { backgroundColor: '#F8F6F2', sectionTitleBgColor: '#6D3B3B', sectionTitleTextColor: '#FFFFFF', skillCardBgColor: '#FFFFFF', skillCardBorderColor: '#6D3B3B', skillCardTextColor: '#2C2C2C' },
  },
  {
    id: 'monochrome', name: '极简黑白灰',
    leftColumn: { backgroundColor: '#000000', backgroundColorGradient: 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)', textColor: '#FFFFFF', nameColor: '#FFFFFF', contactBgColor: 'rgba(255,255,255,0.1)', contactTextColor: '#CCCCCC', summaryBgColor: 'rgba(255,255,255,0.05)', summaryTextColor: '#CCCCCC', accentColor: '#555555', accentGradient: 'linear-gradient(90deg, #555555 0%, #777777 100%)' },
    middleColumn: { backgroundColor: '#FFFFFF', sectionTitleBgColor: '#000000', sectionTitleTextColor: '#FFFFFF', titleTextColor: '#000000', subtitleTextColor: '#333333', dateTextColor: '#AAAAAA', descriptionTextColor: '#333333', descriptionBgColor: '#FAFAFA', accentDotColor: '#000000', accentBorderColor: '#000000' },
    rightColumn: { backgroundColor: '#F5F5F5', sectionTitleBgColor: '#000000', sectionTitleTextColor: '#FFFFFF', skillCardBgColor: '#FFFFFF', skillCardBorderColor: '#000000', skillCardTextColor: '#000000' },
  },
];

const defaultScheme = colorSchemes[0];

// ===== 布局模板定义 =====
const layouts = [
  { id: 'three-column', name: '经典三栏', description: '左信息 + 中经历 + 右技能', icon: '▦', category: '通用' },
  { id: 'two-column', name: '现代双栏', description: '左侧信息栏 + 右侧内容', icon: '▤', category: '通用' },
  { id: 'single-column', name: '简约单栏', description: '顶部信息 + 下方纵向排列', icon: '▯', category: '通用' },
  { id: 'minimal', name: '极简风格', description: '留白与线条的极致美学', icon: '▭', category: '通用' },
  { id: 'ats', name: 'ATS 优化版', description: '通过机器筛选，黑白单栏无装饰', icon: '◻', category: '专业' },
  { id: 'mckinsey', name: '麦肯锡风格', description: '数据驱动，每条经历带量化成果', icon: '∑', category: '专业' },
  { id: 'timeline', name: '时间线履历', description: '职业发展路径一目了然', icon: '↕', category: '专业' },
  { id: 'skills-first', name: '技能导向型', description: '核心能力前置，适合技术岗', icon: '⚙', category: '专业' },
  { id: 'executive', name: '高管精简版', description: '一句摘要 + 关键成就，C-level 风格', icon: '★', category: '专业' },
  { id: 'creative', name: '创意设计风', description: '非对称版式，适合设计/市场岗', icon: '◇', category: '专业' },
];

const defaultLayout = 'three-column';

const EXAMPLE_TEXT = `张三
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

// ===== 图标组件 =====
const Icon = ({ name, size = 20 }) => {
  const s = { width: size, height: size, display: 'inline-block', verticalAlign: 'middle' };
  const icons = {
    sparkles: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/><path d="M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7z"/></svg>,
    briefcase: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
    download: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    upload: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    x: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    edit: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    check: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    camera: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    palette: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
    loader: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>,
    user: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    printer: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H4a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
    file: <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
  };
  return icons[name] || null;
};

// ===== 样式常量 =====
const styles = {
  page: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
  header: { textAlign: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, color: '#2d2d2d', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888' },
  tabBar: { display: 'flex', gap: 0, marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid #e0d8cc' },
  tab: (active) => ({ flex: 1, padding: '12px 24px', textAlign: 'center', cursor: 'pointer', border: 'none', fontSize: 14, fontWeight: active ? 600 : 400, background: active ? '#f0a36b' : '#fff', color: active ? '#fff' : '#666', transition: 'all 0.2s' }),
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e8e0d5', overflow: 'hidden' },
  cardHeader: { padding: '16px 20px', borderBottom: '1px solid #f0e8dc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#2d2d2d', display: 'flex', alignItems: 'center', gap: 8 },
  cardBody: { padding: 20 },
  textarea: { width: '100%', minHeight: 320, padding: 14, border: '1px solid #e0d8cc', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', outline: 'none', background: '#fefdf9' },
  btn: (variant = 'primary', size = 'md') => ({
    padding: size === 'lg' ? '12px 24px' : size === 'sm' ? '6px 12px' : '8px 16px',
    borderRadius: 8, cursor: 'pointer', fontSize: size === 'lg' ? 15 : size === 'sm' ? 12 : 14,
    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
    background: variant === 'primary' ? '#f0a36b' : variant === 'danger' ? '#e74c3c' : '#fff',
    color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#fff' : '#555',
    border: variant === 'outline' ? '1px solid #d0c8b8' : 'none', transition: 'all 0.2s',
  }),
  input: { width: '100%', padding: '10px 14px', border: '1px solid #e0d8cc', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fefdf9' },
  label: { fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 },
  errorBox: { padding: 12, borderRadius: 8, background: '#fef0f0', border: '1px solid #fcc', color: '#c0392b', fontSize: 13 },
  selectBtn: (active) => ({ padding: '10px 16px', borderRadius: 8, cursor: 'pointer', border: active ? '2px solid #f0a36b' : '1px solid #e0d8cc', background: active ? '#fef6ef' : '#fff', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#c06a2a' : '#666', transition: 'all 0.2s' }),
};

// ===== 通用编辑渲染工具函数 =====
function renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, onChange, type = 'input', extraStyle = {}, placeholder = '' }) {
  const isEditing = editingField === field;
  if (isEditing && isEditMode) {
    const inputStyle = { ...styles.input, fontSize: 13, padding: '6px 10px', ...(type === 'textarea' ? { minHeight: 60, resize: 'vertical' } : {}) };
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        {type === 'textarea' ? (
          <textarea value={tempValue} onChange={e => setTempValue(e.target.value)} style={inputStyle} rows={3} autoFocus />
        ) : (
          <input value={tempValue} onChange={e => setTempValue(e.target.value)} style={inputStyle} autoFocus />
        )}
        <button onClick={() => onSave(field)} style={{ ...styles.btn('primary', 'sm'), padding: '4px 8px' }}><Icon name="check" size={14} /></button>
        <button onClick={() => { setEditingField(null); setTempValue(''); }} style={{ ...styles.btn('outline', 'sm'), padding: '4px 8px' }}><Icon name="x" size={14} /></button>
      </div>
    );
  }
  return (
    <div onClick={() => isEditMode && setEditingField(field) && setTempValue(value)} style={{ cursor: isEditMode ? 'pointer' : 'default', ...extraStyle }} title={isEditMode ? '点击编辑' : ''}>
      {value || null}
      {isEditMode && <span style={{ marginLeft: 4, opacity: 0.3 }}><Icon name="edit" size={10} /></span>}
    </div>
  );
}

function EditableTitle({ title, onEdit }) {
  return <span onClick={onEdit} style={{ cursor: 'pointer' }} title="点击编辑标题">{title} <span style={{ opacity: 0.5 }}><Icon name="edit" size={10} /></span></span>;
}

// ===== 简历预览 — 经典三栏 =====
function ThreeColumnPreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const fileInputRef = useRef(null);
  const sectionTitles = data.sectionTitles || {};

  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const rt = (field, titleKey) => isEditMode ? <EditableTitle title={sectionTitles[titleKey] || titleKey} onEdit={() => { setEditingField(field); setTempValue(sectionTitles[titleKey] || ''); }} /> : (sectionTitles[titleKey] || titleKey);

  return (
    <div style={{ minWidth: 960, fontSize: 13, background: '#fff' }}>
      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const maxW = 800; let w = img.width, h = img.height; if (w > maxW) { h = (h * maxW) / w; w = maxW; } canvas.width = w; canvas.height = h; ctx.drawImage(img, 0, 0, w, h); onSave('avatar', canvas.toDataURL('image/jpeg', 0.7)); }; img.src = evt.target.result; }; reader.readAsDataURL(file);
      }} />
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 220px', gap: 0 }}>
        <div style={{ background: c.leftColumn.backgroundColor, color: c.leftColumn.textColor, padding: '20px 28px 28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {data.avatar && <div onClick={() => isEditMode && fileInputRef.current?.click()} style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)', margin: '0 auto', cursor: isEditMode ? 'pointer' : 'default' }}><img src={data.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div style={{ textAlign: 'center' }}>
            {rf('name', data.name || '', 'input', { fontSize: 24, fontWeight: 700, textAlign: 'center', color: c.leftColumn.nameColor, marginBottom: 8 }, '姓名')}
            <div style={{ height: 3, width: 48, background: c.leftColumn.accentColor, margin: '8px auto' }} />
          </div>
          <div style={{ borderTop: `1px solid ${c.leftColumn.contactBgColor}`, paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, opacity: 0.8 }}>{rt('contactTitle', 'contact')}</div>
            {rf('email', data.email || '', 'input', { fontSize: 12, padding: '4px 0', color: c.leftColumn.contactTextColor }, '邮箱')}
            {rf('phone', data.phone || '', 'input', { fontSize: 12, padding: '4px 0', color: c.leftColumn.contactTextColor }, '电话')}
            {rf('address', data.address || '', 'input', { fontSize: 12, padding: '4px 0', color: c.leftColumn.contactTextColor }, '地址')}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, opacity: 0.8 }}>{rt('sectionAbout', 'about')}</div>
            {rf('summary', data.summary, 'textarea', { fontSize: 12, lineHeight: 1.6, color: c.leftColumn.summaryTextColor, background: c.leftColumn.summaryBgColor, padding: 10, borderRadius: 6 }, '个人简介')}
          </div>
        </div>
        <div style={{ background: c.middleColumn.backgroundColor, padding: '20px 28px 28px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'work', titleKey: 'work', items: data.workExperience, fieldPrefix: 'workExperience', fieldKeys: ['company', 'position', 'description'] })}
          {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'projects', titleKey: 'projects', items: data.projects, fieldPrefix: 'projects', fieldKeys: ['name', 'role', 'description'] })}
          {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'education', titleKey: 'education', items: data.education, fieldPrefix: 'education', fieldKeys: ['school', 'major', 'description'] })}
        </div>
        <div style={{ background: c.rightColumn.backgroundColor, padding: '16px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.skills?.length > 0 && (
            <div>
              <div style={{ background: c.rightColumn.sectionTitleBgColor, color: c.rightColumn.sectionTitleTextColor, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{rt('sectionSkills', 'skills')}</div>
              {data.skills.map((skill, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {isEditMode ? (
                    <input value={skill} onChange={e => { const s = [...data.skills]; s[i] = e.target.value; onSave('skills', null, s); }} style={{ width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 6, border: `2px solid ${c.rightColumn.skillCardBorderColor}`, background: c.rightColumn.skillCardBgColor, color: c.rightColumn.skillCardTextColor }} />
                  ) : (
                    <div style={{ padding: '8px 10px', fontSize: 11, borderRadius: 6, fontWeight: 500, border: `2px solid ${c.rightColumn.skillCardBorderColor}`, background: c.rightColumn.skillCardBgColor, color: c.rightColumn.skillCardTextColor }}>{skill}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 简历预览 — 现代双栏 =====
function TwoColumnPreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const rt = (field, titleKey) => isEditMode ? <EditableTitle title={sectionTitles[titleKey] || titleKey} onEdit={() => { setEditingField(field); setTempValue(sectionTitles[titleKey] || ''); }} /> : (sectionTitles[titleKey] || titleKey);

  return (
    <div style={{ minWidth: 900, fontSize: 13, background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 0 }}>
        {/* 左栏 */}
        <div style={{ background: c.leftColumn.backgroundColor, color: c.leftColumn.textColor, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.avatar && <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', margin: '0 auto' }}><img src={data.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div style={{ borderTop: `1px solid ${c.leftColumn.contactBgColor}`, paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, opacity: 0.8 }}>{rt('contactTitle', 'contact')}</div>
            {rf('email', data.email || '', 'input', { fontSize: 11, padding: '3px 0', color: c.leftColumn.contactTextColor }, '邮箱')}
            {rf('phone', data.phone || '', 'input', { fontSize: 11, padding: '3px 0', color: c.leftColumn.contactTextColor }, '电话')}
            {rf('address', data.address || '', 'input', { fontSize: 11, padding: '3px 0', color: c.leftColumn.contactTextColor }, '地址')}
          </div>
          {data.skills?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, opacity: 0.8 }}>{rt('sectionSkills', 'skills')}</div>
              {data.skills.map((skill, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {isEditMode ? (
                    <input value={skill} onChange={e => { const s = [...data.skills]; s[i] = e.target.value; onSave('skills', null, s); }} style={{ width: '100%', padding: '6px 8px', fontSize: 11, borderRadius: 4, border: `1px solid rgba(255,255,255,0.3)`, background: 'rgba(255,255,255,0.1)', color: c.leftColumn.textColor }} />
                  ) : (
                    <div style={{ fontSize: 11, padding: '4px 0', opacity: 0.8 }}>{skill}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* 右栏 */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            {rf('name', data.name || '', 'input', { fontSize: 32, fontWeight: 700, color: c.middleColumn.titleTextColor, marginBottom: 4 }, '姓名')}
            {rf('summary', data.summary, 'textarea', { fontSize: 13, lineHeight: 1.7, color: '#666' }, '个人简介')}
          </div>
          {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'work', titleKey: 'work', items: data.workExperience, fieldPrefix: 'workExperience', fieldKeys: ['company', 'position', 'description'] })}
          {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'projects', titleKey: 'projects', items: data.projects, fieldPrefix: 'projects', fieldKeys: ['name', 'role', 'description'] })}
          {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'education', titleKey: 'education', items: data.education, fieldPrefix: 'education', fieldKeys: ['school', 'major', 'description'] })}
        </div>
      </div>
    </div>
  );
}

// ===== 简历预览 — 简约单栏 =====
function SingleColumnPreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const rt = (field, titleKey) => isEditMode ? <EditableTitle title={sectionTitles[titleKey] || titleKey} onEdit={() => { setEditingField(field); setTempValue(sectionTitles[titleKey] || ''); }} /> : (sectionTitles[titleKey] || titleKey);

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', fontSize: 13, background: '#fff' }}>
      {/* 头部 */}
      <div style={{ background: c.leftColumn.backgroundColor, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        {data.avatar && <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0 }}><img src={data.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
        <div style={{ flex: 1 }}>
          {rf('name', data.name || '', 'input', { fontSize: 26, fontWeight: 700, color: c.leftColumn.nameColor, marginBottom: 6 }, '姓名')}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: c.leftColumn.contactTextColor }}>
            {rf('email', data.email || '', 'input', { fontSize: 12, color: c.leftColumn.contactTextColor }, '邮箱')}
            {rf('phone', data.phone || '', 'input', { fontSize: 12, color: c.leftColumn.contactTextColor }, '电话')}
            {rf('address', data.address || '', 'input', { fontSize: 12, color: c.leftColumn.contactTextColor }, '地址')}
          </div>
        </div>
      </div>
      {/* 主体 */}
      <div style={{ padding: '24px 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {data.summary && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.middleColumn.sectionTitleBgColor, marginBottom: 8, paddingBottom: 4, borderBottom: `2px solid ${c.middleColumn.accentBorderColor}` }}>{rt('sectionAbout', 'about')}</div>
            {rf('summary', data.summary, 'textarea', { fontSize: 13, lineHeight: 1.7, color: '#555' }, '个人简介')}
          </div>
        )}
        {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'work', titleKey: 'work', items: data.workExperience, fieldPrefix: 'workExperience', fieldKeys: ['company', 'position', 'description'] })}
        {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'projects', titleKey: 'projects', items: data.projects, fieldPrefix: 'projects', fieldKeys: ['name', 'role', 'description'] })}
        {renderTimelineSection({ data, isEditMode, c: c.middleColumn, sectionTitles, rt, rf, sectionKey: 'education', titleKey: 'education', items: data.education, fieldPrefix: 'education', fieldKeys: ['school', 'major', 'description'] })}
        {data.skills?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.middleColumn.sectionTitleBgColor, marginBottom: 8, paddingBottom: 4, borderBottom: `2px solid ${c.middleColumn.accentBorderColor}` }}>{rt('sectionSkills', 'skills')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {data.skills.map((skill, i) => (
                <div key={i} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 20, border: `1px solid ${c.middleColumn.accentBorderColor}`, color: c.middleColumn.titleTextColor, background: c.rightColumn.backgroundColor }}>
                  {isEditMode ? <input value={skill} onChange={e => { const s = [...data.skills]; s[i] = e.target.value; onSave('skills', null, s); }} style={{ border: 'none', background: 'transparent', fontSize: 12, outline: 'none', width: 'auto' }} /> : skill}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 简历预览 — 极简风格 =====
function MinimalPreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const accent = c.leftColumn.accentColor || '#3498DB';
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const rt = (field, titleKey) => isEditMode ? <EditableTitle title={sectionTitles[titleKey] || titleKey} onEdit={() => { setEditingField(field); setTempValue(sectionTitles[titleKey] || ''); }} /> : (sectionTitles[titleKey] || titleKey);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', fontSize: 13, background: '#fff', padding: '36px 40px' }}>
      {/* 顶部 */}
      <div style={{ marginBottom: 28 }}>
        {rf('name', data.name || '', 'input', { fontSize: 34, fontWeight: 300, color: '#1a1a1a', letterSpacing: 4, marginBottom: 12 }, '姓名')}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#888' }}>
          {rf('email', data.email || '', 'input', { fontSize: 12, color: '#888' }, '邮箱')}
          <span style={{ color: '#ddd' }}>|</span>
          {rf('phone', data.phone || '', 'input', { fontSize: 12, color: '#888' }, '电话')}
          {data.address && <><span style={{ color: '#ddd' }}>|</span>{rf('address', data.address || '', 'input', { fontSize: 12, color: '#888' }, '地址')}</>}
        </div>
      </div>

      {data.summary && (
        <div style={{ marginBottom: 28, padding: '16px 0', borderTop: `1px solid #eee`, borderBottom: `1px solid #eee` }}>
          {rf('summary', data.summary, 'textarea', { fontSize: 12, lineHeight: 1.8, color: '#666', fontStyle: 'italic' }, '个人简介')}
        </div>
      )}

      {data.workExperience?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: accent, marginBottom: 16, textTransform: 'uppercase' }}>{rt('sectionWork', 'work')}</div>
          {data.workExperience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                {rf(`workExperience.${i}.company`, exp.company, 'input', { fontSize: 14, fontWeight: 600, color: '#1a1a1a' }, '公司')}
                {rf(`workExperience.${i}.endDate`, `${exp.startDate} - ${exp.endDate}`, 'input', { fontSize: 11, color: '#bbb' }, '时间')}
              </div>
              {rf(`workExperience.${i}.position`, exp.position, 'input', { fontSize: 12, color: accent, marginBottom: 6 }, '职位')}
              {rf(`workExperience.${i}.description`, exp.description, 'textarea', { fontSize: 12, lineHeight: 1.7, color: '#555' }, '描述')}
            </div>
          ))}
        </div>
      )}

      {data.projects?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: accent, marginBottom: 16, textTransform: 'uppercase' }}>{rt('sectionProjects', 'projects')}</div>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                {rf(`projects.${i}.name`, proj.name, 'input', { fontSize: 14, fontWeight: 600, color: '#1a1a1a' }, '项目')}
                {rf(`projects.${i}.endDate`, `${proj.startDate} - ${proj.endDate}`, 'input', { fontSize: 11, color: '#bbb' }, '时间')}
              </div>
              {rf(`projects.${i}.role`, proj.role, 'input', { fontSize: 12, color: accent, marginBottom: 6 }, '角色')}
              {rf(`projects.${i}.description`, proj.description, 'textarea', { fontSize: 12, lineHeight: 1.7, color: '#555' }, '描述')}
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: accent, marginBottom: 16, textTransform: 'uppercase' }}>{rt('sectionEducation', 'education')}</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                {rf(`education.${i}.school`, edu.school, 'input', { fontSize: 14, fontWeight: 600, color: '#1a1a1a' }, '学校')}
                {rf(`education.${i}.endDate`, `${edu.startDate} - ${edu.endDate}`, 'input', { fontSize: 11, color: '#bbb' }, '时间')}
              </div>
              {rf(`education.${i}.major`, `${edu.major} - ${edu.degree}`, 'input', { fontSize: 12, color: accent, marginBottom: 4 }, '专业/学历')}
              {rf(`education.${i}.description`, edu.description, 'textarea', { fontSize: 12, lineHeight: 1.7, color: '#555' }, '描述')}
            </div>
          ))}
        </div>
      )}

      {data.skills?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: accent, marginBottom: 12, textTransform: 'uppercase' }}>{rt('sectionSkills', 'skills')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.skills.map((skill, i) => (
              <span key={i} style={{ fontSize: 11, color: '#777', padding: '2px 8px', borderBottom: `1px solid ${accent}` }}>
                {isEditMode ? <input value={skill} onChange={e => { const s = [...data.skills]; s[i] = e.target.value; onSave('skills', null, s); }} style={{ border: 'none', background: 'transparent', fontSize: 11, outline: 'none', width: 'auto', color: '#777' }} /> : skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 通用时间线区块渲染 =====
function renderTimelineSection({ data, isEditMode, c, sectionTitles, rt, rf, sectionKey, titleKey, items, fieldPrefix, fieldKeys }) {
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ background: c.sectionTitleBgColor, color: c.sectionTitleTextColor, padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
        {rt(sectionKey, titleKey)}
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ paddingLeft: 18, borderLeft: `2px solid ${c.accentBorderColor}`, position: 'relative', marginBottom: 20 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.accentDotColor, position: 'absolute', left: -6, top: 2 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            {rf(`${fieldPrefix}.${i}.${fieldKeys[0]}`, item[fieldKeys[0]], 'input', { fontSize: 15, fontWeight: 700, color: c.titleTextColor }, fieldKeys[0])}
            {rf(`${fieldPrefix}.${i}.endDate`, `${item.startDate} - ${item.endDate}`, 'input', { fontSize: 11, color: c.dateTextColor, fontStyle: 'italic' }, '时间')}
          </div>
          {rf(`${fieldPrefix}.${i}.${fieldKeys[1]}`, item[fieldKeys[1]], 'input', { fontSize: 13, color: c.subtitleTextColor, fontWeight: 600, marginBottom: 6 }, fieldKeys[1])}
          {rf(`${fieldPrefix}.${i}.${fieldKeys[2]}`, item[fieldKeys[2]], 'textarea', { fontSize: 12, lineHeight: 1.6, color: c.descriptionTextColor, background: c.descriptionBgColor, padding: 8, borderRadius: 6 }, '描述')}
        </div>
      ))}
    </div>
  );
}

// ===== 简历预览 — 轻量专业版（原ATS优化版） =====
function ATSPreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const c = colorScheme || defaultScheme;
  const accent = c.leftColumn.accentColor || '#2C3E50';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', background: '#fff', padding: '36px 40px', fontFamily: '"Segoe UI", Calibri, sans-serif', color: '#1a1a1a' }}>
      {/* 头部 — 精致排版 */}
      <div style={{ textAlign: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid ${accent}` }}>
        {rf('name', data.name || '', 'input', { fontSize: 28, fontWeight: 700, color: accent, letterSpacing: 1, marginBottom: 8 })}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', fontSize: 11, color: '#666' }}>
          {rf('email', data.email || '', 'input', { fontSize: 11, color: '#666' })}
          {data.phone && <><span style={{ color: accent, fontWeight: 700 }}>·</span>{rf('phone', data.phone, 'input', { fontSize: 11, color: '#666' })}</>}
          {data.address && <><span style={{ color: accent, fontWeight: 700 }}>·</span>{rf('address', data.address, 'input', { fontSize: 11, color: '#666' })}</>}
        </div>
      </div>

      {data.summary && (
        <div style={{ marginBottom: 24, padding: '14px 18px', background: '#fafafa', borderRadius: 6, borderLeft: `3px solid ${accent}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: accent, marginBottom: 6 }}>{sectionTitles.about || 'Summary'}</div>
          {rf('summary', data.summary, 'textarea', { fontSize: 12, lineHeight: 1.7, color: '#444' })}
        </div>
      )}

      {data.workExperience?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 6, marginBottom: 14 }}>{sectionTitles.work || 'Experience'}</div>
          {data.workExperience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 18, display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10 }}>
              <div style={{ fontSize: 10, color: '#999', fontWeight: 600, paddingTop: 1 }}>
                {rf(`workExperience.${i}.endDate`, `${exp.startDate} – ${exp.endDate}`, 'input', { fontSize: 10, color: '#999', fontWeight: 600 })}
              </div>
              <div>
                {rf(`workExperience.${i}.company`, exp.company, 'input', { fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 1 })}
                {rf(`workExperience.${i}.position`, exp.position, 'input', { fontSize: 12, color: accent, fontWeight: 600, marginBottom: 5 })}
                {rf(`workExperience.${i}.description`, exp.description, 'textarea', { fontSize: 12, lineHeight: 1.6, color: '#555' })}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 6, marginBottom: 14 }}>{sectionTitles.education || 'Education'}</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 8, display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10 }}>
              <div style={{ fontSize: 10, color: '#999', fontWeight: 600, paddingTop: 1 }}>{edu.startDate} – {edu.endDate}</div>
              <div>
                {rf(`education.${i}.school`, edu.school, 'input', { fontSize: 13, fontWeight: 700 })}
                {rf(`education.${i}.major`, `${edu.major} · ${edu.degree}`, 'input', { fontSize: 12, color: '#666', marginBottom: 2 })}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.skills?.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 6, marginBottom: 10 }}>{sectionTitles.skills || 'Skills'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {data.skills.map((skill, i) => (
              <span key={i} style={{ fontSize: 11, color: '#555', padding: '3px 10px', borderRadius: 3, background: `${accent}0A`, border: `1px solid ${accent}20` }}>
                {isEditMode ? <input value={skill} onChange={e => { const s = [...data.skills]; s[i] = e.target.value; onSave('skills', null, s); }} style={{ border: 'none', background: 'transparent', fontSize: 11, color: '#555', outline: 'none', width: 'auto' }} /> : skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 简历预览 — 麦肯锡风格 =====
function McKinseyPreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const accent = c.leftColumn.accentColor || '#1B4F72';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', background: '#fff', padding: '44px 52px', fontFamily: '"Garamond", Georgia, "Times New Roman", serif', color: '#1a1a1a' }}>
      {/* 头部 — 庄严衬线体 */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {rf('name', data.name || '', 'input', { fontSize: 30, fontWeight: 700, color: '#111', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Georgia, serif' })}
        <div style={{ width: 60, height: 3, background: accent, margin: '0 auto 12px' }} />
        <div style={{ fontSize: 11, color: '#777', fontFamily: 'Arial, sans-serif', display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.address && <span>{data.address}</span>}
        </div>
      </div>

      {data.summary && (
        <div style={{ marginBottom: 30 }}>
          {rf('summary', data.summary, 'textarea', { fontSize: 13, lineHeight: 1.8, color: '#555', fontStyle: 'italic', textAlign: 'justify', borderLeft: `3px solid ${accent}50`, paddingLeft: 14 })}
        </div>
      )}

      {data.workExperience?.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, borderBottom: `2px solid ${accent}60`, paddingBottom: 6, marginBottom: 18 }}>{sectionTitles.work || 'Professional Experience'}</div>
          {data.workExperience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 24, paddingLeft: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{exp.company}</span>
                <span style={{ fontSize: 10, color: accent, fontWeight: 600, fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>{exp.startDate} – {exp.endDate}</span>
              </div>
              <div style={{ fontSize: 12, color: accent, fontWeight: 600, fontStyle: 'italic', marginBottom: 8 }}>{exp.position}</div>
              <div style={{ paddingLeft: 2 }}>
                {(Array.isArray(exp.description) ? exp.description : [exp.description]).map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 12, lineHeight: 1.6, color: '#444' }}>
                    <span style={{ color: accent, flexShrink: 0, fontWeight: 700, fontSize: 14 }}>&#9656;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, borderBottom: `2px solid ${accent}60`, paddingBottom: 6, marginBottom: 14 }}>{sectionTitles.education || 'Education'}</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{edu.school}</span>
                <span style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>{edu.major} · {edu.degree}</span>
              </div>
              <span style={{ fontSize: 10, color: '#999', fontFamily: 'Arial, sans-serif' }}>{edu.startDate} – {edu.endDate}</span>
            </div>
          ))}
        </div>
      )}

      {data.skills?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, borderBottom: `2px solid ${accent}60`, paddingBottom: 6, marginBottom: 10 }}>{sectionTitles.skills || 'Skills & Expertise'}</div>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'Arial, sans-serif', display: 'flex', flexWrap: 'wrap', gap: 4 }}>{data.skills.join('  \u00B7  ')}</div>
        </div>
      )}
    </div>
  );
}

// ===== 简历预览 — 时间线履历 =====
function TimelinePreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const accent = c.leftColumn.accentColor || '#3498DB';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', background: '#fff', padding: 0 }}>
      {/* 头部横幅 */}
      <div style={{ background: c.leftColumn.backgroundColor, padding: '24px 32px', color: c.leftColumn.textColor }}>
        {rf('name', data.name || '', 'input', { fontSize: 28, fontWeight: 700, color: c.leftColumn.nameColor, marginBottom: 4 }, '姓名')}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: c.leftColumn.contactTextColor }}>
          {rf('email', data.email || '', 'input', { fontSize: 11, color: c.leftColumn.contactTextColor }, '邮箱')}
          {data.phone && <><span>|</span>{rf('phone', data.phone, 'input', { fontSize: 11, color: c.leftColumn.contactTextColor }, '电话')}</>}
          {data.address && <><span>|</span>{rf('address', data.address, 'input', { fontSize: 11, color: c.leftColumn.contactTextColor }, '地址')}</>}
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {data.summary && (
          <div style={{ background: '#fafafa', padding: 14, borderRadius: 6, marginBottom: 24, fontSize: 12, lineHeight: 1.6, color: '#555', borderLeft: `3px solid ${accent}` }}>
            {rf('summary', data.summary, 'textarea', {}, '个人简介')}
          </div>
        )}

        {/* 时间线核心 */}
        <div style={{ position: 'relative', paddingLeft: 30 }}>
          <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, ${accent} 0%, ${accent}22 100%)` }} />
          {data.workExperience?.map((exp, i) => (
            <div key={`w-${i}`} style={{ position: 'relative', marginBottom: 22 }}>
              <div style={{ position: 'absolute', left: -26, top: 4, width: 12, height: 12, borderRadius: '50%', background: accent, border: '2px solid #fff', boxShadow: `0 0 0 1px ${accent}` }} />
              <div style={{ fontSize: 11, color: accent, fontWeight: 700, marginBottom: 2 }}>{rf(`workExperience.${i}.endDate`, `${exp.startDate} – ${exp.endDate}`, 'input', { fontSize: 11, color: accent, fontWeight: 700 }, '时间')}</div>
              {rf(`workExperience.${i}.company`, exp.company, 'input', { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }, '公司')}
              {rf(`workExperience.${i}.position`, exp.position, 'input', { fontSize: 12, color: '#555', marginBottom: 4 }, '职位')}
              {rf(`workExperience.${i}.description`, exp.description, 'textarea', { fontSize: 12, lineHeight: 1.5, color: '#666' }, '描述')}
            </div>
          ))}
        </div>

        {data.education?.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 12, letterSpacing: 1 }}>{sectionTitles.education || '教育背景'}</div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                {rf(`education.${i}.school`, edu.school, 'input', { fontSize: 13, fontWeight: 600 }, '学校')}
                <span style={{ fontSize: 11, color: '#999' }}> {edu.startDate} – {edu.endDate}</span>
                {rf(`education.${i}.major`, `  ${edu.major} · ${edu.degree}`, 'input', { fontSize: 12, color: '#666' }, '专业/学历')}
              </div>
            ))}
          </div>
        )}

        {data.skills?.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 10, letterSpacing: 1 }}>{sectionTitles.skills || '专业技能'}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.skills.map((skill, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 12, background: `${accent}15`, color: accent, fontSize: 11, fontWeight: 500 }}>
                  {isEditMode ? <input value={skill} onChange={e => { const s = [...data.skills]; s[i] = e.target.value; onSave('skills', null, s); }} style={{ border: 'none', background: 'transparent', fontSize: 11, color: accent, outline: 'none', width: 'auto' }} /> : skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 简历预览 — 技能导向型 =====
function SkillsFirstPreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const accent = c.leftColumn.accentColor || '#3498DB';

  const skillLevels = ['Expert', 'Advanced', 'Expert', 'Advanced', 'Proficient', 'Expert', 'Advanced'];
  const barColors = ['#27AE60', accent, '#E74C3C', '#F39C12', '#8E44AD', '#1ABC9C', accent];

  return (
    <div style={{ maxWidth: 750, margin: '0 auto', background: '#fff' }}>
      {/* 头部 — 深色渐变横幅 */}
      <div style={{ background: `linear-gradient(135deg, #1a1a2e 0%, ${accent}DD 100%)`, padding: '32px 36px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {data.avatar && <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}><img src={data.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div>
            {rf('name', data.name || '', 'input', { fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: 0.5 })}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, opacity: 0.9, fontFamily: 'monospace' }}>
              {data.email && <span>{data.email}</span>}
              {data.phone && <span>{data.phone}</span>}
              {data.address && <span>{data.address}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 36px' }}>
        {/* 技能 — 带进度条的核心能力 */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 16 }}>{sectionTitles.skills || 'Core Competencies'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {data.skills.map((skill, i) => {
                const level = skillLevels[i % skillLevels.length];
                const barColor = barColors[i % barColors.length];
                const pct = level === 'Expert' ? '92%' : level === 'Advanced' ? '78%' : '65%';
                return (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#fafbfc', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
                        {isEditMode ? <input value={skill} onChange={e => { const s = [...data.skills]; s[i] = e.target.value; onSave('skills', null, s); }} style={{ border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, color: '#333', outline: 'none', width: 'auto' }} /> : skill}
                      </span>
                      <span style={{ fontSize: 10, color: barColor, fontWeight: 600 }}>{level}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#eee', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct, borderRadius: 2, background: barColor, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.summary && (
          <div style={{ marginBottom: 28, padding: 14, background: '#fafafa', borderRadius: 8, borderLeft: `3px solid ${accent}` }}>
            {rf('summary', data.summary, 'textarea', { fontSize: 12, lineHeight: 1.7, color: '#666', fontStyle: 'italic' })}
          </div>
        )}

        {data.workExperience?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 16 }}>{sectionTitles.work || 'Professional Experience'}</div>
            {data.workExperience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 8, border: '1px solid #eee', transition: 'box-shadow 0.2s', cursor: 'default', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${accent} 0%, transparent 100%)` }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{exp.company}</div>
                    <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginBottom: 6 }}>{exp.position}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#999', fontWeight: 600, background: '#f5f5f5', padding: '2px 8px', borderRadius: 10 }}>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: '#555' }}>{exp.description}</div>
              </div>
            ))}
          </div>
        )}

        {data.projects?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 14 }}>{sectionTitles.projects || 'Key Projects'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {data.projects.map((proj, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, background: `${accent}08`, border: `1px solid ${accent}20` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{proj.name}</div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>{proj.startDate} – {proj.endDate}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.5, color: '#666' }}>{proj.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 14 }}>{sectionTitles.education || 'Education'}</div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{edu.school}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{edu.major} · {edu.degree}</div>
                </div>
                <span style={{ fontSize: 10, color: '#aaa' }}>{edu.startDate} – {edu.endDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 简历预览 — 高管精简版 =====
function ExecutivePreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const accent = c.leftColumn.accentColor || '#2C3E50';

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', padding: '48px 52px', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
      {/* 头部 — 大字姓名 + 极简线条 */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        {rf('name', data.name || '', 'input', { fontSize: 36, fontWeight: 200, color: '#1a1a1a', letterSpacing: 6, marginBottom: 14, textTransform: 'uppercase' })}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 30, height: 1, background: '#ccc' }} />
          <div style={{ width: 6, height: 6, background: accent, borderRadius: '50%' }} />
          <div style={{ width: 30, height: 1, background: '#ccc' }} />
        </div>
        <div style={{ fontSize: 12, color: '#999', fontWeight: 300, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.address && <span>{data.address}</span>}
        </div>
      </div>

      {/* 摘要 — 一句职业宣言 */}
      {data.summary && (
        <div style={{ marginBottom: 40, textAlign: 'center', padding: '0 20px' }}>
          {rf('summary', data.summary, 'textarea', { fontSize: 15, lineHeight: 1.8, color: '#555', fontWeight: 300, fontStyle: 'italic' })}
        </div>
      )}

      {/* 经历 — 左侧年份 + 右侧内容 */}
      {data.workExperience?.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: accent, marginBottom: 22 }}>{sectionTitles.work || 'Experience'}</div>
          {data.workExperience.map((exp, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16, marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: accent, fontWeight: 600, paddingTop: 2, borderRight: `1px solid ${accent}30`, paddingRight: 14, textAlign: 'right' }}>{exp.startDate}<br/>{exp.endDate}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>{exp.company}</div>
                <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginBottom: 10 }}>{exp.position}</div>
                <div style={{ fontSize: 12, lineHeight: 1.7, color: '#666' }}>
                  {(Array.isArray(exp.description) ? exp.description : [exp.description]).map((item, j) => (
                    <div key={j} style={{ marginBottom: 6, display: 'flex', gap: 8 }}>
                      <span style={{ color: accent, flexShrink: 0 }}>—</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.education?.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: accent, marginBottom: 18 }}>{sectionTitles.education || 'Education'}</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: accent, fontWeight: 600, paddingTop: 2, borderRight: `1px solid ${accent}30`, paddingRight: 14, textAlign: 'right' }}>{edu.startDate}<br/>{edu.endDate}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{edu.school}</div>
                <div style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>{edu.major} · {edu.degree}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.skills?.length > 0 && (
        <div style={{ paddingTop: 20, borderTop: '1px solid #eee' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: accent, marginBottom: 14 }}>{sectionTitles.skills || 'Expertise'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {data.skills.map((skill, i) => (
              <span key={i} style={{ fontSize: 12, color: '#555', fontWeight: 300, padding: '4px 0', borderBottom: `1px solid ${accent}40` }}>{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 简历预览 — 创意设计风 =====
// ===== 简历预览 — 创意设计风 =====
function CreativePreview({ data, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave }) {
  const c = colorScheme || defaultScheme;
  const sectionTitles = data.sectionTitles || {};
  const rf = (field, value, type, style, placeholder) => renderEditable({ field, value, isEditMode, editingField, setEditingField, setTempValue, onSave, type, extraStyle: style, placeholder });
  const accent = c.leftColumn.accentColor || '#E74C3C';

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', background: '#fff', overflow: 'hidden', borderRadius: 4 }}>
      {/* 对角线切割头部 */}
      <div style={{ position: 'relative', background: `linear-gradient(135deg, ${accent} 0%, ${accent}DD 100%)`, padding: '36px 40px 50px', color: '#fff', clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {data.avatar && (
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.4)', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <img src={data.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div>
            {rf('name', data.name || '', 'input', { fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: -0.5 })}
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {data.email && <span>{data.email}</span>}
              {data.phone && <span>{data.phone}</span>}
              {data.address && <span>{data.address}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 40px 32px' }}>
        {data.summary && (
          <div style={{ marginBottom: 28, padding: '16px 20px', background: '#fafafa', borderRadius: 8, border: `1px solid ${accent}20`, textAlign: 'center' }}>
            {rf('summary', data.summary, 'textarea', { fontSize: 14, lineHeight: 1.8, color: '#555', fontStyle: 'italic', fontWeight: 300 })}
          </div>
        )}

        {/* 技能 — 彩色标签云 */}
        {data.skills?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent, marginBottom: 14, textAlign: 'center' }}>{sectionTitles.skills || 'Skills'}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              {data.skills.map((skill, i) => {
                const tagColors = [accent, '#27AE60', '#8E44AD', '#F39C12', '#1ABC9C', '#E74C3C', '#3498DB'];
                const tagColor = tagColors[i % tagColors.length];
                const sizes = [13, 12, 14, 11, 13, 12, 14, 12];
                const size = sizes[i % sizes.length];
                return (
                  <span key={i} style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, border: `1.5px solid ${tagColor}`, color: tagColor, fontSize: size, fontWeight: 600, background: '#fff', cursor: 'default' }}>{skill}</span>
                );
              })}
            </div>
          </div>
        )}

        {/* 经历 — 卡片 + 倾斜设计元素 */}
        {data.workExperience?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 4, height: 20, background: accent, transform: 'skewX(-15deg)', borderRadius: 2 }} />
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent }}>{sectionTitles.work || 'Experience'}</div>
            </div>
            {data.workExperience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 16, padding: '16px 20px', borderRadius: 10, border: '1px solid #eee', background: '#fafcfd', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: '#ccc', fontWeight: 600, fontFamily: 'monospace' }}>{i + 1}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{exp.company}</div>
                    <div style={{ fontSize: 12, color: accent, fontWeight: 600 }}>{exp.position}</div>
                  </div>
                  <span style={{ fontSize: 10, color: '#999', background: '#f5f5f5', padding: '2px 10px', borderRadius: 10 }}>{exp.startDate} – {exp.endDate}</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: '#666', marginTop: 8 }}>
                  {(Array.isArray(exp.description) ? exp.description : [exp.description]).map((item, j) => (
                    <div key={j} style={{ marginBottom: 4, paddingLeft: 14, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: accent, fontWeight: 700 }}>+</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {data.education?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 4, height: 20, background: accent, transform: 'skewX(-15deg)', borderRadius: 2 }} />
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: accent }}>{sectionTitles.education || 'Education'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {data.education.map((edu, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid #eee', background: '#fafcfd' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{edu.school}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{edu.major} · {edu.degree}</div>
                  <div style={{ fontSize: 10, color: accent, fontWeight: 600, marginTop: 4 }}>{edu.startDate} – {edu.endDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 主页面组件 =====
export default function ResumeBuilder() {
  const [inputText, setInputText] = useState('');
  const [analyzedData, setAnalyzedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [colorScheme, setColorScheme] = useState(defaultScheme);
  const [layoutId, setLayoutId] = useState(defaultLayout);
  const [activeTab, setActiveTab] = useState('input');
  const [language, setLanguage] = useState('zh');
  const [uploadFileName, setUploadFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const fileInputRef = useRef(null);

  // localStorage 恢复
  useEffect(() => {
    try {
      const saved = localStorage.getItem('resumeBuilderData');
      const savedAvatar = localStorage.getItem('resumeBuilderAvatar');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) setAnalyzedData(parsed);
      }
      if (savedAvatar) setAvatar(savedAvatar);
    } catch (e) { /* ignore */ }
  }, []);

  // localStorage 保存
  useEffect(() => {
    if (analyzedData) {
      try {
        const { avatar: _, ...rest } = analyzedData;
        localStorage.setItem('resumeBuilderData', JSON.stringify(rest));
      } catch (e) { /* ignore */ }
    }
  }, [analyzedData]);

  useEffect(() => {
    if (avatar) {
      try { localStorage.setItem('resumeBuilderAvatar', avatar); } catch (e) { /* ignore */ }
    }
  }, [avatar]);

  const handleLanguageChange = (lang) => {
    if (analyzedData) {
      if (!window.confirm(lang === 'zh' ? '切换到中文简历需要重新生成，是否继续？' : 'Switching to English resume requires regeneration. Continue?')) return;
      setAnalyzedData(null);
      setError(null); setActiveTab('input');
      localStorage.removeItem('resumeBuilderData');
      // 照片保留，不删除
    }
    setLanguage(lang);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('请上传图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('图片不超过 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxW = 800;
        let w = img.width, h = img.height;
        if (w > maxW) { h = (h * maxW) / w; w = maxW; }
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        setAvatar(canvas.toDataURL('image/jpeg', 0.7));
        setError(null);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('文件不超过 10MB'); return; }

    setUploading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/resume/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '文件处理失败');
      }
      const data = await res.json();
      setInputText(data.text);
      setUploadFileName(data.fileName || file.name);
    } catch (err) {
      setError(err.message || '文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const analyzeResume = async () => {
    if (!inputText.trim()) { setError('请输入简历内容'); return; }
    setIsAnalyzing(true); setError(null);
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: inputText, language }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '分析失败');
      }
      const data_ = await res.json();
      if (data_.error) { setError(data_.error); }
      else {
        setAnalyzedData({ ...data_, avatar: avatar || data_.avatar || null });
        setActiveTab('preview');
      }
    } catch (err) {
      setError(err.message || '未知错误');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditSave = (field, valueOverride) => {
    if (field === 'avatar') {
      setAnalyzedData(prev => ({ ...prev, avatar: valueOverride }));
      setEditingField(null); setTempValue('');
      return;
    }
    if (field === 'skills') {
      setAnalyzedData(prev => ({ ...prev, skills: valueOverride }));
      setEditingField(null); setTempValue('');
      return;
    }

    const updated = { ...analyzedData };
    const sectionTitleFields = {
      contactTitle: 'contact', sectionAbout: 'about', sectionWork: 'work',
      sectionEducation: 'education', sectionProjects: 'projects',
      sectionSkills: 'skills', sectionLangCert: 'languagesAndCertifications',
    };

    if (sectionTitleFields[field]) {
      updated.sectionTitles = { ...(updated.sectionTitles || {}), [sectionTitleFields[field]]: tempValue };
    } else if (field.startsWith('workExperience.')) {
      const [, idx, key] = field.split('.');
      updated.workExperience[+idx] = { ...updated.workExperience[+idx], [key]: tempValue };
    } else if (field.startsWith('education.')) {
      const [, idx, key] = field.split('.');
      updated.education[+idx] = { ...updated.education[+idx], [key]: tempValue };
    } else if (field.startsWith('projects.')) {
      const [, idx, key] = field.split('.');
      updated.projects[+idx] = { ...updated.projects[+idx], [key]: tempValue };
    } else {
      updated[field] = tempValue;
    }

    if (analyzedData.sectionTitles) updated.sectionTitles = { ...analyzedData.sectionTitles };
    setAnalyzedData(updated);
    setEditingField(null); setTempValue('');
  };

  const handlePrint = () => {
    const previewEl = document.getElementById('resume-preview-print');
    if (!previewEl) return;
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>简历</title>
      <style> * { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } } </style></head><body>${previewEl.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const renderPreview = () => {
    const props = { data: analyzedData, isEditMode, colorScheme, editingField, setEditingField, tempValue, setTempValue, onSave: handleEditSave };
    switch (layoutId) {
      case 'ats': return <ATSPreview {...props} />;
      case 'mckinsey': return <McKinseyPreview {...props} />;
      case 'timeline': return <TimelinePreview {...props} />;
      case 'skills-first': return <SkillsFirstPreview {...props} />;
      case 'executive': return <ExecutivePreview {...props} />;
      case 'creative': return <CreativePreview {...props} />;
      case 'two-column': return <TwoColumnPreview {...props} />;
      case 'single-column': return <SingleColumnPreview {...props} />;
      case 'minimal': return <MinimalPreview {...props} />;
      default: return <ThreeColumnPreview {...props} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.title}>AI 智能简历生成器</h1>
          <p style={styles.subtitle}>上传简历或输入文本，AI 自动分析、润色并排版</p>
        </div>

        <div style={styles.tabBar}>
          <button style={styles.tab(activeTab === 'input')} onClick={() => setActiveTab('input')}>输入简历</button>
          <button style={{ ...styles.tab(activeTab === 'preview'), opacity: analyzedData ? 1 : 0.5 }}
            onClick={() => analyzedData && setActiveTab('preview')} disabled={!analyzedData}>预览简历</button>
        </div>

        {activeTab === 'input' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}><Icon name="sparkles" size={18} /> 输入简历内容</div>
                <button onClick={() => setInputText(EXAMPLE_TEXT)} style={styles.btn('outline', 'sm')}>加载示例</button>
              </div>
              <div style={styles.cardBody}>
                <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
                  上传简历文件或粘贴文本内容。系统会自动识别个人信息、经历、技能，生成排版精美的简历。
                </p>

                {/* 文件上传区 */}
                <div style={{ border: '2px dashed #e0d8cc', borderRadius: 10, padding: 20, marginBottom: 16, textAlign: 'center' }}>
                  <input type="file" ref={fileInputRef} accept=".pdf,.txt,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                  {uploadFileName ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div style={{ padding: '6px 14px', background: '#e8f5e9', borderRadius: 8, fontSize: 13, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="check" size={16} />
                        <span>已识别：{uploadFileName}</span>
                      </div>
                      <button onClick={() => { setUploadFileName(null); fileInputRef.current.value = ''; }}
                        style={styles.btn('outline', 'sm')}><Icon name="x" size={14} /> 清除</button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                      {uploading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#999' }}>
                          <Icon name="loader" size={28} />
                          <span style={{ fontSize: 13 }}>正在解析文件...</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#999' }}>
                          <Icon name="file" size={28} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#666' }}>上传简历文件</span>
                          <span style={{ fontSize: 11 }}>支持 PDF、TXT、Word 格式，最大 10MB</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 照片上传 */}
                <div style={{ border: '2px dashed #e0d8cc', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={styles.label}>求职者照片（可选）</div>
                  {avatar ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e0d8cc' }}>
                        <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <button onClick={() => { setAvatar(null); localStorage.removeItem('resumeBuilderAvatar'); }}
                        style={styles.btn('outline', 'sm')}><Icon name="x" size={14} /> 移除照片</button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#999' }}>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      <Icon name="upload" size={28} />
                      <span style={{ fontSize: 13 }}>点击上传照片</span>
                      <span style={{ fontSize: 11 }}>支持 JPG、PNG，最大 10MB</span>
                    </label>
                  )}
                </div>

                {/* 语言选择 */}
                <div style={{ border: '1px solid #e0d8cc', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={styles.label}>简历语言</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => handleLanguageChange('zh')} style={styles.selectBtn(language === 'zh')}>中文简历</button>
                    <button onClick={() => handleLanguageChange('en')} style={styles.selectBtn(language === 'en')}>English Resume</button>
                  </div>
                </div>

                <textarea placeholder="请粘贴简历内容，或点击上方上传简历文件..." value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  style={styles.textarea} />

                {error && <div style={{ ...styles.errorBox, marginTop: 12 }}>{error}</div>}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={analyzeResume} disabled={isAnalyzing}
                    style={{ ...styles.btn('primary', 'lg'), flex: 1, justifyContent: 'center' }}>
                    {isAnalyzing ? (
                      <><Icon name="loader" size={18} /><span>正在分析...</span></>
                    ) : (
                      <><Icon name="sparkles" size={18} /> AI 生成简历</>
                    )}
                  </button>
                  <button onClick={() => { setInputText(''); setAnalyzedData(null); setAvatar(null); setUploadFileName(null); setError(null);
                    localStorage.removeItem('resumeBuilderData'); localStorage.removeItem('resumeBuilderAvatar');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }} style={styles.btn('outline', 'lg')}>清空</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && analyzedData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 布局选择 */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
                  模板布局
                </div>
              </div>
              <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['通用', '专业'].map(cat => (
                  <div key={cat}>
                    <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>{cat}风格</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {layouts.filter(l => l.category === cat).map(l => {
                        const sel = layoutId === l.id;
                        return (
                          <button key={l.id} onClick={() => setLayoutId(l.id)}
                            style={{ ...styles.selectBtn(sel), display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto', minWidth: 120 }}>
                            <span style={{ fontSize: 15 }}>{l.icon}</span>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{l.name}</div>
                              <div style={{ fontSize: 10, color: sel ? '#c06a2a' : '#aaa' }}>{l.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 配色选择器 — 横排 */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}><Icon name="palette" size={18} /> 配色方案</div>
                <span style={{ fontSize: 12, color: '#888' }}>根据行业和风格选择配色</span>
              </div>
              <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {colorSchemes.map(scheme => {
                  const sel = colorScheme.id === scheme.id;
                  return (
                    <button key={scheme.id} onClick={() => setColorScheme(scheme)}
                      style={{ ...styles.selectBtn(sel), display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', minWidth: 150 }}>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '3px 0 0 3px', background: scheme.leftColumn.backgroundColor }} />
                        <div style={{ width: 14, height: 14, background: scheme.middleColumn.backgroundColor }} />
                        <div style={{ width: 14, height: 14, borderRadius: '0 3px 3px 0', background: scheme.rightColumn.backgroundColor }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{scheme.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 简历预览区 — 全宽 */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}><Icon name="briefcase" size={18} /> 简历预览</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setIsEditMode(!isEditMode)}
                    style={styles.btn(isEditMode ? 'primary' : 'outline', 'sm')}>
                    <Icon name="edit" size={14} /> {isEditMode ? '退出编辑' : '开启编辑'}
                  </button>
                  <button onClick={handlePrint} style={styles.btn('outline', 'sm')}>
                    <Icon name="printer" size={14} /> 打印
                  </button>
                </div>
              </div>
              <div style={{ padding: 16, overflowX: 'auto' }}>
                <div id="resume-preview-print">
                  {renderPreview()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && !analyzedData && (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <Icon name="briefcase" size={48} style={{ opacity: 0.3 }} />
            <h3 style={{ marginTop: 16, fontSize: 16, color: '#888' }}>还没有简历数据</h3>
            <p style={{ fontSize: 13, marginTop: 8 }}>请先在"输入简历"页面生成简历</p>
            <button onClick={() => setActiveTab('input')} style={{ ...styles.btn('primary'), marginTop: 16 }}>
              前往输入页面
            </button>
          </div>
        )}
      </div>
    </div>
  );
}