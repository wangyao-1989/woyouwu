const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const MBTIQuestion = require('../models/MBTIQuestion');
const { auth } = require('../middleware/auth');
const Settings = require('../models/Settings');

const AVATAR_PROMPTS = {
  INTJ: 'Anime portrait of a mastermind strategist, sharp intelligent eyes, dark academia library background with chess pieces and blueprints, wearing dark tailored outfit, cool indigo and deep navy color scheme, clean minimalist illustration style, confident composed expression, square portrait',
  INTP: 'Anime portrait of a brilliant logician, curious eyes behind round glasses, cosmic purple background with floating mathematical formulas and glowing particles, messy hair, violet and lavender tones, intellectual whimsical illustration style, square portrait',
  ENTJ: 'Anime portrait of a charismatic commander, confident powerful stance, golden crown-like radiant aura, wearing sharp formal attire, warm amber and gold tones, regal commanding presence, bold clean illustration style, square portrait',
  ENTP: 'Anime portrait of a witty debater, playful clever smirk, lightbulb ideas exploding around head, orange and warm coral tones, dynamic energetic pose, creative sparks flying, bold expressive illustration style, square portrait',
  INFJ: 'Anime portrait of a gentle mystic advocate, serene knowing eyes, soft botanical background with sage green leaves and ethereal light rays, flowing hair, mystical peaceful atmosphere, watercolor-inspired soft illustration style, square portrait',
  INFP: 'Anime portrait of a dreamy idealist mediator, soft poetic expression, pink and rose background with floating butterflies and wildflowers, whimsical romantic atmosphere, watercolor and pastel illustration style, gentle soulful eyes, square portrait',
  ENFJ: 'Anime portrait of a radiant protagonist, warm inspiring smile, golden rose light emanating from behind, charismatic leader aura, red and rose gold tones, surrounded by people silhouettes, inspiring warm illustration style, square portrait',
  ENFP: 'Anime portrait of a free-spirited campaigner, vibrant joyful expression, colorful paint splashes and rainbow confetti, messy creative hair, orange coral and bright pink tones, artistic energetic illustration style, spontaneous happy vibe, square portrait',
  ISTJ: 'Anime portrait of a reliable guardian, calm steady gaze, organized geometric background of files and clocks, slate grey and steel blue tones, neat professional appearance, structured clean illustration style, dependable composed expression, square portrait',
  ISFJ: 'Anime portrait of a gentle protector, warm nurturing smile, soft cozy background with shield motif and warm light, pale green and cream tones, caring comforting atmosphere, soft tender illustration style, square portrait',
  ESTJ: 'Anime portrait of an efficient executive, authoritative composed expression, organized office background with charts and plans, sky blue and navy tones, crisp professional appearance, structured bold illustration style, square portrait',
  ESFJ: 'Anime portrait of a warm social consul, friendly inviting smile, social gathering background with warm teal and mint tones, approachable caring demeanor, community harmony atmosphere, warm inviting illustration style, square portrait',
  ISTP: 'Anime portrait of a cool master tinkerer, calm focused expression, workshop background with mechanical tools and gears, violet steel and grey tones, practical hands-on attitude, sleek edgy illustration style, square portrait',
  ISFP: 'Anime portrait of a gentle artistic soul, dreamy creative expression, floral and nature background with soft petals, magenta rose and pink tones, aesthetic beauty atmosphere, soft artistic watercolor illustration style, square portrait',
  ESTP: 'Anime portrait of a bold thrill-seeker, dynamic action pose, rocket launch and speed lines in background, yellow gold and amber tones, adventurous daring energy, bold explosive illustration style, square portrait',
  ESFP: 'Anime portrait of a vibrant stage performer, sparkling excited eyes, stage spotlight and confetti background, rose crimson and gold tones, theatrical energetic atmosphere, glamorous lively illustration style, square portrait',
};

const API_BASE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

router.get('/questions', async (req, res) => {
  try {
    const mode = req.query.mode || 'quick';

    let query = {};
    if (mode === 'quick') {
      query.version = { $in: ['express', 'both'] };
    } else {
      query.version = { $in: ['professional', 'both'] };
    }

    const scene = req.query.scene;
    if (scene) {
      query.scene = scene;
    }

    const allQuestions = await MBTIQuestion.find(query).sort({ order: 1, _id: 1 }).lean();

    if (allQuestions.length === 0) {
      return res.status(404).json({ message: '题库尚未初始化，请联系管理员' });
    }

    const dims = ['EI', 'SN', 'TF', 'JP'];
    const perDim = mode === 'quick' ? 5 : 15;

    const grouped = {};
    dims.forEach(d => { grouped[d] = []; });
    allQuestions.forEach(q => {
      if (grouped[q.dimension]) grouped[q.dimension].push(q);
    });

    const selected = [];
    dims.forEach(d => {
      const pool = shuffleArray(grouped[d]);
      const taken = pool.slice(0, perDim);
      selected.push(...taken);
    });

    const questions = shuffleArray(selected);

    const safeQuestions = questions.map(q => ({
      _id: q._id,
      text: q.text,
      poleA: q.poleA,
      poleB: q.poleB,
      dimension: q.dimension,
      traitA: q.traitA,
      scene: q.scene,
      order: q.order,
    }));

    res.json({ questions: safeQuestions });
  } catch (error) {
    console.error('获取MBTI题库失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/questions/count', async (req, res) => {
  try {
    const counts = await MBTIQuestion.aggregate([
      {
        $group: {
          _id: { dimension: '$dimension', version: '$version' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.dimension': 1, '_id.version': 1 } },
    ]);

    res.json({ counts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/generate-avatar', async (req, res) => {
  try {
    const { mbti, zodiac, sex } = req.body;

    const isEnabled = await Settings.isApiEnabled('mbtiAvatar');
    if (!isEnabled) {
      return res.status(503).json({ message: '头像生成功能已暂停使用，请联系管理员' });
    }

    if (!mbti || !AVATAR_PROMPTS[mbti]) {
      return res.status(400).json({ message: '无效的 MBTI 类型' });
    }

    let prompt = AVATAR_PROMPTS[mbti];

    if (sex === 'male') {
      prompt = prompt.replace(/^Anime portrait of/, 'Anime portrait of a male');
    } else if (sex === 'female') {
      prompt = prompt.replace(/^Anime portrait of/, 'Anime portrait of a female');
    }

    if (zodiac) {
      const zodiacMap = {
        aries: 'hints of fire element and ram symbolism, bold energetic aura',
        taurus: 'hints of earth element and bull symbolism, grounded serene aura',
        gemini: 'hints of air element and twin duality, quick-witted breeze aura',
        cancer: 'hints of water element and moon crab symbolism, gentle nurturing aura',
        leo: 'hints of fire element and lion symbolism, radiant sun-like aura',
        virgo: 'hints of earth element and maiden symbolism, meticulous refined aura',
        libra: 'hints of air element and scales symbolism, balanced elegant aura',
        scorpio: 'hints of water element and scorpion symbolism, intense mysterious aura',
        sagittarius: 'hints of fire element and archer centaur symbolism, adventurous free aura',
        capricorn: 'hints of earth element and sea-goat symbolism, ambitious determined aura',
        aquarius: 'hints of air element and water-bearer symbolism, innovative electric aura',
        pisces: 'hints of water element and two fish symbolism, dreamy mystical aura',
      };
      if (zodiacMap[zodiac]) {
        prompt += ', ' + zodiacMap[zodiac];
      }
    }

    console.log('生成头像:', mbti, zodiac || '');

    const response = await axios.get(API_BASE, {
      params: { prompt, image_size: 'square_hd' },
      responseType: 'arraybuffer',
      timeout: 60000,
    });

    if (response.status !== 200 || !response.data || response.data.length < 100) {
      console.error('头像API返回异常:', response.status, response.data?.length);
      return res.status(500).json({ message: '头像生成失败，请稍后再试' });
    }

    const uploadDir = path.join(__dirname, '../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `mbti-avatar-${uuidv4()}.jpg`;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, response.data);

    const avatarUrl = `/uploads/${filename}`;
    console.log('头像已保存:', filename);
    res.json({ avatarUrl });
  } catch (error) {
    console.error('生成头像失败:', error.message);
    res.status(500).json({ message: '头像生成失败，请稍后再试' });
  }
});

module.exports = router;
