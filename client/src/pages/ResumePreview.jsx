import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ResumePreview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const res = await axios.get('/api/users/me/resume');
      setResume(res.data);
    } catch (error) {
      console.error('Failed to fetch resume');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F4]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#4A3728] border-t-transparent"></div>
          <p className="text-[#B8A899] text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF8F4] gap-4">
        <p className="text-[#8B7355]">简历数据加载失败</p>
        <button
          onClick={() => navigate('/profile')}
          className="px-6 py-2.5 bg-[#4A3728] text-white rounded-lg hover:bg-[#3A2A1E] transition"
        >
          返回个人中心
        </button>
      </div>
    );
  }

  const avatarSrc = resume.avatar || user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.nickname || 'user'}`;

  return (
    <div className="min-h-screen pt-20 bg-[#FBF8F4]">
      <div className="relative bg-gradient-to-br from-[#3A2A1E] via-[#4A3728] to-[#6B5A4E] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px, 60px 60px'
        }} />
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-16 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl mb-6 flex-shrink-0">
              <img
                src={avatarSrc}
                alt={user?.nickname}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.nickname || 'user'}`; }}
              />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {resume.realName || user?.nickname}
            </h1>
            {resume.realName && (
              <p className="text-lg text-white/60 mt-2 font-light">@{user?.username}</p>
            )}
            
            {resume.bio && (
              <p className="text-lg text-white/80 mt-5 max-w-xl leading-relaxed font-light italic">
                &ldquo;{resume.bio}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              {resume.location && (
                <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {resume.location}
                </span>
              )}
              {resume.contactEmail && (
                <a href={`mailto:${resume.contactEmail}`} className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white/90 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {resume.contactEmail}
                </a>
              )}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${resume.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/40'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${resume.isPublic ? 'bg-green-400' : 'bg-white/30'}`}></span>
                {resume.isPublic ? '已公开' : '未公开'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            {resume.skills && resume.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EBE5] p-6">
                <h3 className="text-xs font-semibold text-[#B8A899] uppercase tracking-widest mb-4">技能</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1.5 bg-[#4A3728] text-white text-sm rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resume.interests && resume.interests.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EBE5] p-6">
                <h3 className="text-xs font-semibold text-[#B8A899] uppercase tracking-widest mb-4">兴趣</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.interests.map((interest, index) => (
                    <span key={index} className="px-3 py-1.5 bg-[#FDF6F0] text-[#8B7355] border border-[#F0E0D0] text-sm rounded-lg">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(resume.socialLinks?.github || resume.socialLinks?.wechat) && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EBE5] p-6">
                <h3 className="text-xs font-semibold text-[#B8A899] uppercase tracking-widest mb-4">社交链接</h3>
                <div className="space-y-2.5">
                  {resume.socialLinks?.github && (
                    <a
                      href={resume.socialLinks.github.startsWith('http') ? resume.socialLinks.github : `https://github.com/${resume.socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition group"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">GitHub</span>
                    </a>
                  )}
                  {resume.socialLinks?.wechat && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/></svg>
                      <span className="text-sm text-green-700 font-medium">{resume.socialLinks.wechat}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            {resume.experience && resume.experience.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EBE5] p-6 sm:p-8">
                <h2 className="text-lg font-bold text-[#4A3728] mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#4A3728] rounded-full"></span>
                  经历
                </h2>
                <div className="space-y-8">
                  {resume.experience.map((exp, index) => (
                    <div key={index} className="relative pl-8">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-[#E8E0D5]"></div>
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#4A3728] ring-4 ring-[#F5F0E8]"></div>
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-[#4A3728]">{exp.organization}</h3>
                        {exp.position && (
                          <p className="text-sm text-[#6B5A4E] font-medium">{exp.position}</p>
                        )}
                        {exp.period && (
                          <p className="text-sm text-[#B8A899]">{exp.period}</p>
                        )}
                        {exp.description && (
                          <p className="text-sm text-[#8B7355] leading-relaxed mt-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resume.education && resume.education.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EBE5] p-6 sm:p-8">
                <h2 className="text-lg font-bold text-[#4A3728] mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#5B7DAF] rounded-full"></span>
                  教育经历
                </h2>
                <div className="space-y-6">
                  {resume.education.map((edu, index) => (
                    <div key={index} className="relative pl-8">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-[#C8D4E0]"></div>
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#5B7DAF] ring-4 ring-[#F5F0E8]"></div>
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-[#4A3728]">{edu.school}</h3>
                        <p className="text-sm text-[#6B5A4E] font-medium">
                          {edu.major}{edu.degree ? ` · ${edu.degree}` : ''}
                        </p>
                        {edu.period && (
                          <p className="text-sm text-[#B8A899]">{edu.period}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!resume.experience || resume.experience.length === 0) && !resume.education?.length && !resume.skills?.length && !resume.interests?.length && !resume.socialLinks?.github && !resume.socialLinks?.wechat && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#F0EBE5] p-12 text-center">
                <p className="text-[#B8A899] text-lg mb-2">简历内容还不完整</p>
                <p className="text-[#B8A899] text-sm">前往编辑页完善你的个人简历</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-10">
          <button
            onClick={() => navigate('/profile/edit')}
            className="px-8 py-3 bg-[#4A3728] text-white text-sm font-medium rounded-xl hover:bg-[#3A2A1E] transition shadow-sm"
          >
            编辑简历
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="px-8 py-3 border-2 border-[#C8BAAA] text-[#8B7355] text-sm font-medium rounded-xl hover:border-[#4A3728] hover:text-[#4A3728] transition"
          >
            返回个人中心
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumePreview;