import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function UserResume() {
  const { userId } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchResume();
    }
  }, [userId]);

  const fetchResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/users/${userId}/resume`);
      setResume(res.data);
    } catch (err) {
      if (err.response) {
        setError({ status: err.response.status, message: err.response.data?.message });
      } else {
        setError({ status: 0, message: '网络错误，请稍后重试' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#4A3728' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
            <svg className="w-10 h-10" style={{ color: error.status === 403 ? '#8B7355' : '#B8A899' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {error.status === 403 ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0-8v4m0 8a9 9 0 110-18 9 9 0 010 18z" />
              ) : error.status === 404 ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#4A3728' }}>
            {error.status === 403 ? '简历未公开' : error.status === 404 ? '用户不存在' : '加载失败'}
          </h1>
          <p className="mb-6" style={{ color: '#8B7355' }}>
            {error.status === 403
              ? '该用户未公开简历'
              : error.status === 404
                ? '用户不存在'
                : error.message}
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-2 rounded-btn text-white transition shadow-sketch"
            style={{ backgroundColor: '#4A3728' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#3D2E21'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4A3728'}
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (!resume) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 bg-[#F5F0E8] fade-in">
      <div
        className="relative py-16"
        style={{
          background: 'linear-gradient(135deg, #4A3728 0%, #6B5A4E 50%, #8B7355 100%)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={resume.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${resume.nickname}`}
              alt={resume.nickname}
              className="w-28 h-28 rounded-full border-4 border-white/30 shadow-xl bg-gray-200 object-cover"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">{resume.nickname}</h1>
              {resume.realName && (
                <p className="text-lg text-white/80 mt-1">{resume.realName}</p>
              )}
              {resume.location && (
                <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-white/60 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {resume.location}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-card border-2 border-gray-200 shadow-card p-6 lg:p-8 space-y-8">

          {resume.bio && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#4A3728' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                关于我
              </h2>
              <p className="text-gray-700 leading-relaxed">{resume.bio}</p>
            </section>
          )}

          {resume.skills && resume.skills.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#4A3728' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                技能
              </h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border"
                    style={{
                      backgroundColor: '#F5F0E8',
                      color: '#4A3728',
                      borderColor: '#D4C5B2'
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {resume.interests && resume.interests.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#4A3728' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                兴趣
              </h2>
              <div className="flex flex-wrap gap-2">
                {resume.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border"
                    style={{
                      backgroundColor: '#FDF6F0',
                      color: '#8B7355',
                      borderColor: '#E8D5C4'
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </section>
          )}

          {resume.experience && resume.experience.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#4A3728' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                经历
              </h2>
              <div className="relative pl-6" style={{ borderLeft: `2px solid #D4C5B2` }}>
                {resume.experience.map((exp, index) => (
                  <div key={index} className="relative pb-6 last:pb-0">
                    <div
                      className="absolute w-3 h-3 rounded-full -left-[19px] top-1.5 border-2"
                      style={{ backgroundColor: '#F5F0E8', borderColor: '#4A3728' }}
                    ></div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <h3 className="font-semibold text-gray-800">{exp.position || exp.organization}</h3>
                      {exp.period && (
                        <span className="text-sm" style={{ color: '#8B7355' }}>
                          {exp.period}
                        </span>
                      )}
                    </div>
                    {exp.organization && (
                      <p className="text-sm mb-1" style={{ color: '#8B7355' }}>
                        {exp.organization}
                        {exp.position && exp.organization !== exp.position && (
                          <span className="text-gray-400"> · {exp.position}</span>
                        )}
                      </p>
                    )}
                    {!exp.organization && exp.position && (
                      <p className="text-sm mb-1" style={{ color: '#8B7355' }}>
                        {exp.position}
                      </p>
                    )}
                    {exp.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {resume.education && resume.education.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#4A3728' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                教育经历
              </h2>
              <div className="space-y-4">
                {resume.education.map((edu, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl" style={{ backgroundColor: '#F8F5F0' }}>
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5B7DAF' }}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{edu.school}</h3>
                      <p className="text-sm mt-0.5" style={{ color: '#8B7355' }}>
                        {edu.major}{edu.degree ? ` · ${edu.degree}` : ''}
                      </p>
                      {edu.period && (
                        <p className="text-xs mt-1 text-gray-400">{edu.period}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resume.socialLinks && Object.values(resume.socialLinks).some(v => v) && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#4A3728' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                社交链接
              </h2>
              <div className="flex flex-wrap gap-3">
                {resume.socialLinks.github && (
                  <a
                    href={resume.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-btn text-white text-sm transition"
                    style={{ backgroundColor: '#333' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#222'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                  </a>
                )}
                {resume.socialLinks.weibo && (
                  <a
                    href={resume.socialLinks.weibo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-btn text-white text-sm transition"
                    style={{ backgroundColor: '#E6162D' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#C41227'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#E6162D'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zm8.683-13.063c-.636-.197-1.073-.332-1.073-.332.104-.416.209-.832.313-1.248.313-1.248-.209-2.08-1.457-2.08-.624 0-1.248.208-1.872.624l-.624.416c-.416-.416-1.04-.624-1.872-.624-1.456 0-2.912 1.04-3.328 2.496-.416 1.456.208 2.912 1.664 3.328 0 0 .416.104.832.208-.104.416-.208.832-.312 1.248-.312 1.248.208 2.08 1.456 2.08.624 0 1.248-.208 1.872-.624l.624-.416c.416.416 1.04.624 1.872.624 1.456 0 2.912-1.04 3.328-2.496.416-1.456-.208-2.912-1.664-3.328l.625-.416c.416-.416 1.04-.624 1.664-.624 1.248 0 1.77.832 1.456 2.08-.104.416-.208.832-.312 1.248 0 0 .437.135 1.073.332.636.197 1.073.332 1.073.332.104-.416.209-.832.313-1.248.313-1.248-.209-2.08-1.457-2.08-.624 0-1.248.208-1.872.624l-.624.416c-.416-.416-1.04-.624-1.872-.624-1.456 0-2.912 1.04-3.328 2.496-.416 1.456.208 2.912 1.664 3.328 0 0 .416.104.832.208-.104.416-.208.832-.312 1.248-.312 1.248.208 2.08 1.456 2.08.624 0 1.248-.208 1.872-.624l.624-.416c.416.416 1.04.624 1.872.624 1.456 0 2.912-1.04 3.328-2.496.416-1.456-.208-2.912-1.664-3.328z"/></svg>
                    微博
                  </a>
                )}
                {resume.socialLinks.bilibili && (
                  <a
                    href={resume.socialLinks.bilibili}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-btn text-white text-sm transition"
                    style={{ backgroundColor: '#FB7299' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#E66088'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#FB7299'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>
                    B站
                  </a>
                )}
                {resume.socialLinks.zhihu && (
                  <a
                    href={resume.socialLinks.zhihu}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-btn text-white text-sm transition"
                    style={{ backgroundColor: '#0066FF' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0055DD'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#0066FF'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.145.477 1.248-.006.387-.004.678-.004.678H7.58c-.243.927-.545 1.8-.9 2.611l.003-.003h3.885l.003 3.34-2.088.003.003 1.965 2.085-.003v.003l-.003 3.34h2.088l.003-3.34h2.085l.003-1.965-2.088.003-.003-3.34h3.885l.003.003c-.355-.811-.657-1.684-.9-2.611h-4.485c-.006 0-.004-.291-.004-.678.032-.103-.068-1.254.477-1.248h4.587c-.18-.676-.409-1.38-.68-2.11z"/></svg>
                    知乎
                  </a>
                )}
                {resume.socialLinks.twitter && (
                  <a
                    href={resume.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-btn text-white text-sm transition"
                    style={{ backgroundColor: '#1DA1F2' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0D8BD9'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#1DA1F2'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    Twitter
                  </a>
                )}
                {resume.socialLinks.qq && (
                  <a
                    href={resume.socialLinks.qq}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-btn text-white text-sm transition"
                    style={{ backgroundColor: '#12B7F5' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0E9ED6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#12B7F5'}
                  >
                    QQ
                  </a>
                )}
              </div>
            </section>
          )}

          {resume.contactEmail && (
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#4A3728' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                联系邮箱
              </h2>
              <a
                href={`mailto:${resume.contactEmail}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-btn border text-sm transition"
                style={{ color: '#4A3728', borderColor: '#D4C5B2', backgroundColor: '#F5F0E8' }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#EBE3D9';
                  e.target.style.borderColor = '#8B7355';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#F5F0E8';
                  e.target.style.borderColor = '#D4C5B2';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {resume.contactEmail}
              </a>
            </section>
          )}

        </div>

        <div className="text-center py-8">
          <Link
            to={`/profile/${userId}`}
            className="inline-flex items-center gap-1 text-sm transition"
            style={{ color: '#8B7355' }}
            onMouseEnter={(e) => e.target.style.color = '#4A3728'}
            onMouseLeave={(e) => e.target.style.color = '#8B7355'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            查看完整个人主页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UserResume;