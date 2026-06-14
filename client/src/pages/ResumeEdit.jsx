import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ResumeEdit() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    realName: '',
    bio: '',
    skills: [],
    interests: [],
    experience: [],
    education: [],
    socialLinks: { github: '', wechat: '' },
    contactEmail: '',
    location: '',
    isPublic: false
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const res = await axios.get('/api/users/me/resume');
      const d = res.data;
      setFormData({
        realName: d.realName || '',
        bio: d.bio || '',
        skills: d.skills || [],
        interests: d.interests || [],
        experience: d.experience || [],
        education: d.education || [],
        socialLinks: d.socialLinks || { github: '', wechat: '' },
        contactEmail: d.contactEmail || '',
        location: d.location || '',
        isPublic: d.isPublic || false
      });
    } catch (err) {
      console.error('Failed to fetch resume');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !formData.interests.includes(trimmed)) {
      setFormData(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
    }
    setInterestInput('');
  };

  const removeInterest = (index) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleInterestKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInterest();
    }
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { period: '', organization: '', position: '', description: '' }]
    }));
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleExpChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', major: '', degree: '', period: '' }]
    }));
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleEduChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim() || aiInput.trim().length < 10) return;
    setAiLoading(true);
    try {
      const res = await axios.post('/api/ai/generate-resume', { description: aiInput });
      const aiData = res.data.resume;

      setFormData(prev => ({
        ...prev,
        realName: aiData.realName || prev.realName,
        bio: aiData.bio || prev.bio,
        skills: aiData.skills?.length ? aiData.skills : prev.skills,
        interests: aiData.interests?.length ? aiData.interests : prev.interests,
        experience: aiData.experience?.length ? aiData.experience : prev.experience,
        education: aiData.education?.length ? aiData.education : prev.education,
        socialLinks: {
          github: aiData.socialLinks?.github || prev.socialLinks.github,
          wechat: aiData.socialLinks?.wechat || prev.socialLinks.wechat
        },
        contactEmail: aiData.contactEmail || prev.contactEmail,
        location: aiData.location || prev.location
      }));

      setSuccessMsg('AI 内容已自动填充到表单，请检查并调整后保存');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('AI generate error:', err);
      alert(err.response?.data?.message || 'AI 生成失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 PDF、JPG、PNG、WebP 格式');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB');
      return;
    }

    setFileLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      const res = await axios.post('/api/ai/parse-resume-file', fdToSend);
      const aiData = res.data.resume;

      setFormData(prev => ({
        ...prev,
        realName: aiData.realName || prev.realName,
        bio: aiData.bio || prev.bio,
        skills: aiData.skills?.length ? aiData.skills : prev.skills,
        interests: aiData.interests?.length ? aiData.interests : prev.interests,
        experience: aiData.experience?.length ? aiData.experience : prev.experience,
        education: aiData.education?.length ? aiData.education : prev.education,
        socialLinks: {
          github: aiData.socialLinks?.github || prev.socialLinks.github,
          wechat: aiData.socialLinks?.wechat || prev.socialLinks.wechat
        },
        contactEmail: aiData.contactEmail || prev.contactEmail,
        location: aiData.location || prev.location
      }));

      setSuccessMsg('简历文件识别成功！内容已自动填充，请检查并调整后保存');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('File upload error:', err);
      alert(err.response?.data?.message || '文件解析失败，请重试');
    } finally {
      setFileLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.realName.trim()) {
      alert('请填写真实姓名');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        skills: JSON.stringify(formData.skills),
        interests: JSON.stringify(formData.interests),
        experience: JSON.stringify(formData.experience),
        education: JSON.stringify(formData.education),
        socialLinks: JSON.stringify(formData.socialLinks)
      };
      await axios.put('/api/users/me/resume', payload);
      setSuccessMsg('简历保存成功！');
      setTimeout(() => navigate('/profile/preview'), 800);
    } catch (err) {
      alert(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#4A3728] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-[#F5F0E8] pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#4A3728]">我的简历</h1>
            <p className="text-sm text-[#B8A899] mt-1">完善你的个人名片，或使用 AI 一键生成</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile/preview')}
              className="px-4 py-2 text-sm text-[#8B7355] hover:text-[#4A3728] border border-[#C8BAAA] rounded-lg transition"
            >
              预览简历
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[#4A3728] text-white text-sm font-medium rounded-lg hover:bg-[#3A2A1E] transition disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存简历'}
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <span>✓</span> {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🤖</span>
                <h2 className="text-lg font-semibold text-[#4A3728]">AI 智能生成</h2>
                <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full">Beta</span>
              </div>
              <p className="text-sm text-[#B8A899] mb-3">
                用一段话描述你自己，AI 将自动生成简历内容并填充到下方表单。
              </p>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                rows={4}
                placeholder="例如：我叫张三，是一名前端开发工程师，有5年工作经验。曾在字节跳动负责抖音Web版开发，擅长React和TypeScript。毕业于浙江大学计算机系，坐标杭州。平时喜欢摄影和跑步，GitHub账号是zhangsan。希望找志同道合的朋友一起做开源项目。"
                className="w-full px-4 py-3 border border-[#E8E0D5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 focus:border-[#4A3728] text-sm resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[#B8A899]">
                  {aiInput.length > 0 ? `已输入 ${aiInput.length} 字` : '建议输入 50-500 字效果最佳'}
                </span>
                <button
                  onClick={handleAiGenerate}
                  disabled={aiLoading || aiInput.trim().length < 10}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      AI 生成中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      一键生成
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-[#E8E0D5]">
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-[#D8CFC0] rounded-xl cursor-pointer hover:border-[#4A3728] hover:bg-[#FBF8F4] transition group">
                  {fileLoading ? (
                    <div className="flex items-center gap-2 text-sm text-[#8B7355]">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#4A3728] border-t-transparent" />
                      正在解析简历文件...
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#F5F0E8] flex items-center justify-center group-hover:bg-[#E8DCD0] transition">
                        <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-[#8B7355] group-hover:text-[#4A3728] font-medium">
                          上传现有简历文件
                        </p>
                        <p className="text-xs text-[#B8A899] mt-0.5">
                          支持 PDF、JPG、PNG、WebP，最大 10MB
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    disabled={fileLoading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <h2 className="text-lg font-semibold text-[#4A3728] mb-4">基本信息</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[#8B7355] mb-1.5">真实姓名 *</label>
                  <input
                    type="text"
                    name="realName"
                    value={formData.realName}
                    onChange={handleChange}
                    maxLength={20}
                    className="w-full px-3 py-2.5 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 focus:border-[#4A3728] text-sm"
                    placeholder="你的真实姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8B7355] mb-1.5">所在城市</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 focus:border-[#4A3728] text-sm"
                    placeholder="例如：杭州"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#8B7355] mb-1.5">
                  一句话介绍 <span className="text-[#B8A899] text-xs">({formData.bio.length}/60)</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength={60}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 focus:border-[#4A3728] text-sm resize-none"
                  placeholder="例：全栈工程师，8年Web经验，主导过千万DAU产品架构"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8B7355] mb-1.5">联系邮箱</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 focus:border-[#4A3728] text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <h2 className="text-lg font-semibold text-[#4A3728] mb-4">技能 & 兴趣</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-[#8B7355] mb-1.5">技能标签</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.skills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F5F0E8] text-[#4A3728] text-xs rounded-full">
                      {skill}
                      <button onClick={() => removeSkill(i)} className="hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    className="flex-1 px-3 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                    placeholder="输入技能，按回车添加"
                  />
                  <button onClick={addSkill} className="px-3 py-2 bg-[#F5F0E8] text-[#4A3728] text-sm rounded-lg hover:bg-[#E8DCD0]">添加</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8B7355] mb-1.5">兴趣标签</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.interests.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FDF6F0] text-[#8B7355] text-xs rounded-full border border-[#F0E0D0]">
                      {item}
                      <button onClick={() => removeInterest(i)} className="hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={handleInterestKeyDown}
                    className="flex-1 px-3 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                    placeholder="输入兴趣，按回车添加"
                  />
                  <button onClick={addInterest} className="px-3 py-2 bg-[#FDF6F0] text-[#8B7355] text-sm rounded-lg border border-[#F0E0D0] hover:bg-[#F8E8D8]">添加</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#4A3728]">经历</h2>
                <button onClick={addExperience} className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#4A3728] bg-[#F5F0E8] rounded-lg hover:bg-[#E8DCD0] transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加经历
                </button>
              </div>

              {formData.experience.length === 0 && (
                <p className="text-sm text-[#B8A899] text-center py-6">暂无经历，点击上方按钮添加</p>
              )}

              <div className="space-y-4">
                {formData.experience.map((exp, i) => (
                  <div key={i} className="relative p-4 border border-[#E8E0D5] rounded-xl">
                    <button
                      onClick={() => removeExperience(i)}
                      className="absolute top-3 right-3 p-1 text-[#B8A899] hover:text-red-500 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-[#B8A899] mb-1">时间段</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => handleExpChange(i, 'period', e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                          placeholder="2020-2023"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#B8A899] mb-1">机构/项目</label>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => handleExpChange(i, 'organization', e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                          placeholder="公司或项目名称"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#B8A899] mb-1">岗位/职位</label>
                        <input
                          type="text"
                          value={exp.position || ''}
                          onChange={(e) => handleExpChange(i, 'position', e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                          placeholder="前端工程师"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-[#B8A899] mb-1">描述</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleExpChange(i, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm resize-none"
                        placeholder="简要描述工作和成果"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#4A3728]">教育经历</h2>
                <button onClick={addEducation} className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#4A3728] bg-[#F5F0E8] rounded-lg hover:bg-[#E8DCD0] transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加教育
                </button>
              </div>

              {formData.education.length === 0 && (
                <p className="text-sm text-[#B8A899] text-center py-6">暂无教育经历，点击上方按钮添加</p>
              )}

              <div className="space-y-4">
                {formData.education.map((edu, i) => (
                  <div key={i} className="relative p-4 border border-[#E8E0D5] rounded-xl">
                    <button
                      onClick={() => removeEducation(i)}
                      className="absolute top-3 right-3 p-1 text-[#B8A899] hover:text-red-500 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#B8A899] mb-1">学校名称</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => handleEduChange(i, 'school', e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                          placeholder="浙江大学"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#B8A899] mb-1">学历</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleEduChange(i, 'degree', e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                          placeholder="本科 / 硕士 / 博士"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#B8A899] mb-1">专业</label>
                        <input
                          type="text"
                          value={edu.major}
                          onChange={(e) => handleEduChange(i, 'major', e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                          placeholder="计算机科学与技术"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#B8A899] mb-1">时间段</label>
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => handleEduChange(i, 'period', e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                          placeholder="2014-2018"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <h2 className="text-lg font-semibold text-[#4A3728] mb-4">社交链接</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-[#8B7355] mb-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                  </label>
                  <input
                    type="text"
                    name="github"
                    value={formData.socialLinks.github}
                    onChange={handleSocialChange}
                    className="w-full px-3 py-2.5 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                    placeholder="用户名或链接"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-[#8B7355] mb-1.5">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    微信
                  </label>
                  <input
                    type="text"
                    name="wechat"
                    value={formData.socialLinks.wechat}
                    onChange={handleSocialChange}
                    className="w-full px-3 py-2.5 border border-[#E8E0D5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A3728]/20 text-sm"
                    placeholder="微信号"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#4A3728]">公开简历</h2>
                  <p className="text-sm text-[#B8A899] mt-0.5">开启后，其他用户可以通过你的头像查看简历</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`relative w-12 h-7 rounded-full transition-colors ${formData.isPublic ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.isPublic ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`}
                    style={{ left: formData.isPublic ? 'calc(100% - 1.625rem)' : '2px' }}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden">
                <div className="bg-gradient-to-br from-[#4A3728] via-[#6B5A4E] to-[#8B7355] p-6 text-center relative">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }} />
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-3 border-white/30 mb-3">
                      <img
                        src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.nickname || 'user'}`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.nickname || 'user'}` }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-white">{formData.realName || currentUser?.nickname || '你的名字'}</h3>
                    <p className="text-white/70 text-sm mt-0.5">@{currentUser?.username}</p>
                    {formData.location && (
                      <p className="text-white/50 text-xs mt-1 flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {formData.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {formData.bio && (
                    <p className="text-sm text-[#4A3728] text-center italic px-2">"{formData.bio}"</p>
                  )}

                  {formData.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-[#B8A899] mb-2 font-medium">技能</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#4A3728] text-white text-xs rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.interests.length > 0 && (
                    <div>
                      <p className="text-xs text-[#B8A899] mb-2 font-medium">兴趣</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.interests.map((item, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#FDF6F0] text-[#8B7355] text-xs rounded-full border border-[#F0E0D0]">{item}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.experience.length > 0 && (
                    <div>
                      <p className="text-xs text-[#B8A899] mb-2 font-medium">经历</p>
                      <div className="space-y-3">
                        {formData.experience.map((exp, i) => (
                          <div key={i} className="relative pl-4 border-l-2 border-[#E8E0D5]">
                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-[#4A3728]" />
                            <p className="text-xs text-[#B8A899]">{exp.period}</p>
                            <p className="text-sm font-medium text-[#4A3728]">{exp.organization}</p>
                            {exp.position && <p className="text-xs text-[#6B5A4E]">{exp.position}</p>}
                            {exp.description && <p className="text-xs text-[#8B7355] mt-0.5">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.education.length > 0 && (
                    <div>
                      <p className="text-xs text-[#B8A899] mb-2 font-medium">教育</p>
                      <div className="space-y-2">
                        {formData.education.map((edu, i) => (
                          <div key={i} className="relative pl-4 border-l-2 border-[#C8D4E0]">
                            <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-[#5B7DAF]" />
                            <p className="text-xs text-[#B8A899]">{edu.period}</p>
                            <p className="text-sm font-medium text-[#4A3728]">{edu.school}</p>
                            <p className="text-xs text-[#6B5A4E]">{edu.major}{edu.degree ? ` · ${edu.degree}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(formData.socialLinks.github || formData.socialLinks.wechat || formData.contactEmail) && (
                    <div className="pt-3 border-t border-[#F0EBE5]">
                      <p className="text-xs text-[#B8A899] mb-2 font-medium">联系方式</p>
                      <div className="space-y-1.5">
                        {formData.contactEmail && (
                          <p className="text-xs text-[#8B7355] flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {formData.contactEmail}
                          </p>
                        )}
                        {formData.socialLinks.github && (
                          <p className="text-xs text-[#8B7355] flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            {formData.socialLinks.github}
                          </p>
                        )}
                        {formData.socialLinks.wechat && (
                          <p className="text-xs text-[#8B7355] flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            微信: {formData.socialLinks.wechat}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#F0EBE5]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#B8A899]">公开状态</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${formData.isPublic ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {formData.isPublic ? '已公开' : '未公开'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-[#B8A899] mt-3">
                右侧为简历预览卡片，编辑表单后实时更新
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2.5 text-sm text-[#8B7355] border border-[#C8BAAA] rounded-lg hover:bg-white transition"
          >
            返回个人中心
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-[#4A3728] text-white text-sm font-medium rounded-lg hover:bg-[#3A2A1E] transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存简历'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeEdit;