const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const InviteCode = require('../models/InviteCode');
const { auth } = require('../middleware/auth');

const router = express.Router();

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
}

router.post('/generate', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const totalGenerated = await InviteCode.countDocuments({ creator: userId });
    const totalUsed = await InviteCode.countDocuments({ creator: userId, status: 'used' });
    const maxAllowed = 5 + totalUsed;

    if (totalGenerated >= maxAllowed) {
      const remaining = maxAllowed - totalGenerated;
      return res.status(400).json({
        message: '已达到生成上限（5个），请等待已有邀请码被使用后可继续生成'
      });
    }

    let code;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 20) {
      code = generateCode();
      exists = await InviteCode.findOne({ code });
      attempts++;
    }

    if (exists) {
      return res.status(500).json({ message: '生成邀请码失败，请重试' });
    }

    const inviteCode = new InviteCode({
      code,
      creator: userId,
      status: 'active'
    });

    await inviteCode.save();

    res.status(201).json({
      message: '邀请码生成成功',
      code: inviteCode
    });
  } catch (error) {
    console.error('Generate invite code error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/my-codes', auth, async (req, res) => {
  try {
    const codes = await InviteCode.find({ creator: req.user._id })
      .populate('usedBy', 'username nickname avatar createdAt')
      .sort({ createdAt: -1 });

    const result = codes.map(c => ({
      id: c._id,
      code: c.code,
      status: c.status,
      createdAt: c.createdAt,
      usedAt: c.usedAt,
      usedBy: c.usedBy ? {
        id: c.usedBy._id,
        username: c.usedBy.username,
        nickname: c.usedBy.nickname,
        avatar: c.usedBy.avatar,
        createdAt: c.usedBy.createdAt
      } : null
    }));

    res.json(result);
  } catch (error) {
    console.error('Get my codes error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:codeId/revoke', auth, async (req, res) => {
  try {
    const inviteCode = await InviteCode.findById(req.params.codeId);

    if (!inviteCode) {
      return res.status(404).json({ message: '邀请码不存在' });
    }

    if (inviteCode.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权操作此邀请码' });
    }

    if (inviteCode.status !== 'active') {
      return res.status(400).json({ message: '该邀请码已失效，无需重复作废' });
    }

    inviteCode.status = 'revoked';
    await inviteCode.save();

    res.json({ message: '邀请码已作废', code: inviteCode });
  } catch (error) {
    console.error('Revoke invite code error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/my-invites', auth, async (req, res) => {
  try {
    const invitedUsers = await User.find({ invitedBy: req.user._id })
      .select('username nickname avatar createdAt')
      .sort({ createdAt: -1 });

    res.json(invitedUsers);
  } catch (error) {
    console.error('Get my invites error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
