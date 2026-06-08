const express = require('express');
const router = express.Router();
const { getApiConfig } = require('../utils/apiConfig');
const Settings = require('../models/Settings');
const ApiUsage = require('../models/ApiUsage');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const pdfParse = require('pdf-parse');
const fs = require('fs');

const estimateTokens = (text) => {
  if (!text) return 0;
  let chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  let otherChars = text.length - chineseChars;
  return chineseChars + Math.ceil(otherChars / 4);
};

router.post('/analyze', async (req, res) => {
  try {
    const { resumeText, language = 'zh' } = req.body;

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({ message: '请至少输入20个字的简历内容' });
    }

    const isEnabled = await Settings.isApiEnabled('resumeParse');
    if (!isEnabled) {
      return res.status(503).json({ message: '简历生成功能已暂停使用，请联系管理员' });
    }

    const { endpoint, model, apiKey } = await getApiConfig('resumeParse');
    const finalKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    if (!finalKey) {
      return res.status(500).json({ message: 'AI 服务未配置 API Key' });
    }

    const languageSettings = language === 'en' ? {
      language: 'English',
      sectionTitles: {
        contact: 'Contact Info',
        about: 'About Me',
        work: 'Work Experience',
        education: 'Education',
        projects: 'Projects',
        skills: 'Professional Skills',
        languagesAndCertifications: 'Languages & Certifications',
      },
      promptLanguage: `CRITICAL LANGUAGE RULE — VIOLATION IS UNACCEPTABLE:
- You MUST output 100% English. NOT A SINGLE Chinese character is allowed anywhere in your response.
- If the input contains Chinese, you MUST translate it to natural, professional English.
- All names MUST be transliterated to English (e.g., 张三 → Zhang San, not 张三).
- All company names, job titles, skills, descriptions — EVERYTHING in English only.
- Double-check every field before output. If you see any Chinese character, replace it.`,
    } : {
      language: 'Chinese',
      sectionTitles: {
        contact: '联系方式',
        about: '关于我',
        work: '工作经历',
        education: '教育背景',
        projects: '项目经历',
        skills: '专业技能',
        languagesAndCertifications: '语言与证书',
      },
      promptLanguage: `重要语言规则 — 违反即不合格:
- 必须输出100%中文。回复中不允许出现任何一个英文字母或英文单词（邮箱、网址等必要技术术语除外）。
- 如果输入包含英文，必须翻译为自然专业的中文。
- 所有人名、公司名、职位、技能、描述——全部必须是中文。`,
    };

    const systemPrompt = `You are a world-class professional resume writer and career coach. Your job is to deeply understand a candidate's career story and produce a compelling, enriched resume — NOT just copy-paste the input.

## Step 1: Deep Understanding (DO THIS FIRST IN YOUR MIND)
- Read the entire input as a narrative. Understand the person's career trajectory, core strengths, achievements, and unique value.
- Identify implied skills and experiences that aren't explicitly stated but are clearly present.
- Recognize what industry / role this person is targeting.

## Step 2: Content Enrichment (THIS IS CRITICAL)
- **summary**: Write 3-5 compelling sentences that capture the candidate's professional identity, key strengths, and career highlights. Do NOT just repeat their job titles. Craft a narrative.
- **workExperience descriptions**: Expand brief bullets into professional achievement statements. Use action verbs. If the input says "managed a team", write "Led and mentored a cross-functional team of X, driving collaboration and delivering Y". Infer reasonable details from context.
- **education descriptions**: If a description is missing, write a brief note about relevant coursework, honors, or activities based on the major/school context.
- **project descriptions**: Expand projects with context about impact, technologies used, and outcomes.
- **skills**: Group related skills, add any clearly implied skills from the experience descriptions.

## Step 3: Content-Section Matching (VERIFY EACH ITEM)
- Double-check: Is every item in the correct section?
- Work experience items should NOT contain education info. Education should NOT contain work details.
- Projects should be standalone deliverables, not routine job duties.
- Skills should be specific competencies, not generic statements.
- Summary should be an overview, not a repeat of any single section.

## Step 4: Language Verification
${languageSettings.promptLanguage}

## Output Format
Return ONLY a raw JSON object (no markdown code blocks, no explanations). The JSON must be valid and parseable:

{
  "name": "Full name",
  "email": "email",
  "phone": "phone number",
  "address": "address",
  "summary": "Compelling professional summary, 3-5 sentences",
  "workExperience": [{
    "company": "Company name",
    "position": "Job title",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD or 'Present'",
    "description": "Enriched achievement-based description with action verbs and metrics"
  }],
  "education": [{
    "school": "School name",
    "major": "Major",
    "degree": "Bachelor's/Master's/PhD",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "description": "Relevant coursework, honors, activities"
  }],
  "projects": [{
    "name": "Project name",
    "role": "Role",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "description": "Project impact, technologies, outcomes"
  }],
  "skills": ["Category: skill1, skill2", "Category2: skill3, skill4"],
  "sectionTitles": {
    "contact": "${languageSettings.sectionTitles.contact}",
    "about": "${languageSettings.sectionTitles.about}",
    "work": "${languageSettings.sectionTitles.work}",
    "education": "${languageSettings.sectionTitles.education}",
    "projects": "${languageSettings.sectionTitles.projects}",
    "skills": "${languageSettings.sectionTitles.skills}",
    "languagesAndCertifications": "${languageSettings.sectionTitles.languagesAndCertifications}"
  }
}

## Final Verification Checklist (mentally verify before output):
1. Is ALL content in ${language === 'en' ? 'English (ZERO Chinese characters)?' : 'Chinese (ZERO English words except emails/URLs)?'}
2. Are work descriptions enriched with professional verbs and metrics?
3. Is every item in the correct section?
4. Is the summary a compelling narrative, not a copy-paste?
5. Are skills properly grouped and complete?
6. Is the JSON valid and parseable?
7. Are all Chinese names transliterated? ${language === 'en' ? '(e.g., 王小明 → Wang Xiaoming)' : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: resumeText },
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error('AI API returned ' + response.status);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    let parsedData;
    try {
      let cleanContent = rawContent.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      parsedData = JSON.parse(cleanContent);

      // 后处理：English 模式强制清除所有汉字
      if (language === 'en') {
        const stripChinese = (val) => {
          if (typeof val === 'string') {
            let cleaned = val.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '').trim();
            // 清理多余空白和标点残留
            cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/^[,.\s]+/, '').replace(/[,.\s]+$/, '');
            return cleaned;
          }
          if (Array.isArray(val)) return val.map(stripChinese).filter(v => v !== '');
          if (val && typeof val === 'object') {
            const result = {};
            for (const [k, v] of Object.entries(val)) {
              result[k] = stripChinese(v);
            }
            return result;
          }
          return val;
        };
        parsedData = stripChinese(parsedData);
        // 清除空数组/空对象
        if (parsedData.workExperience) parsedData.workExperience = parsedData.workExperience.filter(e => e.company || e.position);
        if (parsedData.education) parsedData.education = parsedData.education.filter(e => e.school);
        if (parsedData.projects) parsedData.projects = parsedData.projects.filter(e => e.name);
        if (parsedData.skills) parsedData.skills = parsedData.skills.filter(s => s && s.trim());

        // 字段内容校验：email 必须是合法邮箱格式，phone 必须是电话号码格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /[\d+\-() ]{7,}/;
        const looksLikeAddress = (val) => /[,/]|city|road|street|district|province|China|USA|America|England|UK|France|Germany|Japan|Korea/i.test(val);

        if (parsedData.email && !emailRegex.test(parsedData.email.trim())) {
          // 非邮箱内容移到 address
          parsedData.address = (parsedData.address ? parsedData.address + ', ' : '') + parsedData.email;
          parsedData.email = '';
        }

        if (parsedData.phone && !phoneRegex.test(parsedData.phone)) {
          if (looksLikeAddress(parsedData.phone)) {
            // 电话字段里是地址，移过去
            parsedData.address = (parsedData.address ? parsedData.address + ', ' : '') + parsedData.phone;
            parsedData.phone = '';
          }
        }

        // 如果 address 为 null/undefined 但有内容，保底
        if (!parsedData.address) parsedData.address = '';
      }

      // 智能合并：如果education标题包含CERTIFICATION或&或AND，合并certifications和languages到education
      if (parsedData.sectionTitles && parsedData.sectionTitles.education) {
        const eduTitle = parsedData.sectionTitles.education.toUpperCase();
        const shouldCombine = eduTitle.includes('CERTIFICATION') || eduTitle.includes('&') || eduTitle.includes('AND');

        if (shouldCombine) {
          if (parsedData.languages && parsedData.languages.length > 0) {
            const langDescs = parsedData.languages.map(l => `${l.name} - ${l.level}`).join('; ');
            if (Array.isArray(parsedData.education) && parsedData.education.length > 0) {
              parsedData.education[0].description = parsedData.education[0].description
                ? parsedData.education[0].description + '\n\nLanguages: ' + langDescs
                : 'Languages: ' + langDescs;
            }
            parsedData.languages = [];
          }
          if (parsedData.certifications && parsedData.certifications.length > 0) {
            const certDescs = parsedData.certifications.map(c => `${c.name}${c.issuer ? ' - ' + c.issuer : ''}${c.date ? ' - ' + c.date : ''}`).join('; ');
            if (Array.isArray(parsedData.education) && parsedData.education.length > 0) {
              parsedData.education[0].description = parsedData.education[0].description
                ? parsedData.education[0].description + '\n\nCertifications: ' + certDescs
                : 'Certifications: ' + certDescs;
            }
            parsedData.certifications = [];
          }
        }
      }
    } catch (parseError) {
      parsedData = {
        error: 'JSON解析失败',
        rawContent: rawContent,
      };
    }

    // 记录API使用
    const usage = data.usage || {};
    await ApiUsage.recordUsage({
      apiType: 'resumeParse',
      userId: null,
      promptTokens: usage.prompt_tokens || estimateTokens(systemPrompt + resumeText),
      completionTokens: usage.completion_tokens || estimateTokens(rawContent),
      totalTokens: usage.total_tokens,
      status: 'success',
      model,
    });

    res.json(parsedData);
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ message: '简历分析失败：' + (error.message || '未知错误') });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传简历文件' });
    }

    const { mimetype, originalname, buffer } = req.file;
    let extractedText = '';

    if (mimetype === 'application/pdf') {
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || '';
      } catch (e) {
        return res.status(400).json({ message: 'PDF解析失败，请确保文件未加密且可读取' });
      }
    } else if (mimetype === 'text/plain' || mimetype === 'application/octet-stream') {
      extractedText = buffer.toString('utf-8');
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               mimetype === 'application/msword') {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } catch (e) {
        return res.status(400).json({ message: 'Word文档解析失败，请尝试转为PDF或TXT格式上传' });
      }
    } else if (mimetype.startsWith('image/')) {
      return res.status(400).json({ message: '图片格式暂不支持，请将内容粘贴到文本框或转为PDF上传' });
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ message: '未能从文件中提取到有效的文本内容，请检查文件' });
    }

    res.json({ text: extractedText.trim(), fileName: originalname });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: '文件处理失败：' + (error.message || '未知错误') });
  }
});

module.exports = router;
