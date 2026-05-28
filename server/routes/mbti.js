const express = require('express');
const router = express.Router();
const MBTIQuestion = require('../models/MBTIQuestion');

router.get('/questions', async (req, res) => {
  try {
    const mode = req.query.mode || 'express';

    let query = {};
    if (mode === 'express') {
      query.version = { $in: ['express', 'both'] };
    } else {
      query.version = { $in: ['professional', 'both'] };
    }

    const scene = req.query.scene;
    if (scene) {
      query.scene = scene;
    }

    const questions = await MBTIQuestion.find(query).sort({ order: 1, _id: 1 }).lean();

    if (questions.length === 0) {
      return res.status(404).json({ message: '题库尚未初始化，请联系管理员' });
    }

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

module.exports = router;
