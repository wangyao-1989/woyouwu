const express = require('express');
const Item = require('../models/Item');
const User = require('../models/User');
const Message = require('../models/Message');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, category, status, location, search, sort = '-createdAt' } = req.query;
    
    const query = {};
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { remark: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = {};
    if (sort === '-createdAt') sortOption = { createdAt: -1 };
    else if (sort === 'createdAt') sortOption = { createdAt: 1 };
    else if (sort === 'status') sortOption = { status: 1 };

    const items = await Item.find(query)
      .populate('owner', 'username nickname avatar')
      .populate('borrower', 'username nickname')
      .sort(sortOption);

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail')
      .populate('borrower', 'username nickname')
      .populate('borrowHistory.borrower', 'username nickname avatar');

    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const { type, name, category, status, remark, location, link, condition, borrowStartDate, borrowEndDate } = req.body;

    if (!name) {
      return res.status(400).json({ message: '物品名称不能为空' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '至少需要上传一张图片' });
    }

    const images = req.files.map(file => `/uploads/${file.filename}`);

    const item = new Item({
      type: type || 'stuff',
      name,
      images,
      category,
      status,
      condition: condition || '',
      borrowStartDate: borrowStartDate || null,
      borrowEndDate: borrowEndDate || null,
      remark,
      location,
      link,
      owner: req.user._id,
      ownerName: req.user.nickname,
      contactWechat: req.user.contactWechat,
      contactPhone: req.user.contactPhone,
      contactEmail: req.user.contactEmail
    });

    await item.save();
    await item.populate('owner', 'username nickname avatar');

    res.status(201).json({ message: '发布成功', item });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, upload.array('images', 10), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限修改此物品' });
    }

    const updates = {};
    const allowedFields = ['type', 'name', 'category', 'status', 'remark', 'location', 'link', 'condition', 'borrowStartDate', 'borrowEndDate'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('owner', 'username nickname avatar');

    res.json({ message: '更新成功', item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限删除此物品' });
    }

    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/borrow', auth, async (req, res) => {
  try {
    const { expectedReturnDate, pickupMethod, message, contactInfo } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    if (item.status !== '可借用' && item.status !== 'available') {
      return res.status(400).json({ message: '该物品当前不可借用' });
    }

    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: '不能借用自己的物品' });
    }

    const pickupMethodText = pickupMethod === 'delivery' || pickupMethod === '邮寄' ? '邮寄' : '自取';
    const messageContent = message ? `\n留言：${message}` : '';
    const contactText = contactInfo ? `\n联系方式：${contactInfo}` : '';

    const message2 = new Message({
      recipient: item.owner,
      sender: req.user._id,
      senderName: req.user.nickname,
      senderAvatar: req.user.avatar,
      type: 'borrow_request',
      title: '借用申请',
      content: `${req.user.nickname} 想借用你的物品"${item.name}"，取用方式：${pickupMethodText}，预计 ${new Date(expectedReturnDate).toLocaleDateString()} 归还${messageContent}${contactText}`,
      relatedItem: item._id
    });

    await message2.save();

    const newBorrowRecord = {
      item: item._id,
      borrower: req.user._id,
      borrowerName: req.user.nickname,
      expectedReturnDate,
      pickupMethod: pickupMethod || 'self_pickup',
      message: message || '',
      contactInfo: contactInfo || '',
      status: 'pending',
      messageId: message2._id
    };

    item.borrowHistory.push(newBorrowRecord);
    await item.save();

    const updatedItem = await Item.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail')
      .populate('borrower', 'username nickname')
      .populate('borrowHistory.borrower', 'username nickname avatar');

    res.json({ message: '借用申请已发送', item: updatedItem });
  } catch (error) {
    console.error('Borrow error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/approve/:messageId', auth, async (req, res) => {
  try {
    const { borrowerId, expectedReturnDate } = req.body;
    const item = await Item.findById(req.params.id);
    const message = await Message.findById(req.params.messageId);

    if (!item || !message) {
      return res.status(404).json({ message: '物品或申请不存在' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作' });
    }

    const borrower = await User.findById(borrowerId);

    const pendingRecord = item.borrowHistory.find(
      h => h.status === 'pending' && h.borrower.toString() === borrowerId.toString()
    );

    if (pendingRecord) {
      pendingRecord.status = 'approved';
      pendingRecord.expectedReturnDate = expectedReturnDate;
    } else {
      item.borrowHistory.push({
        item: item._id,
        borrower: borrowerId,
        borrowerName: borrower.nickname,
        expectedReturnDate,
        pickupMethod: 'self_pickup',
        message: '',
        contactInfo: '',
        status: 'approved'
      });
    }

    item.status = '已借出';
    item.borrower = borrowerId;
    item.borrowerName = borrower.nickname;
    item.expectedReturnDate = expectedReturnDate;

    await item.save();

    message.status = 'approved';
    await message.save();

    const notifyMessage = new Message({
      recipient: borrowerId,
      sender: req.user._id,
      senderName: req.user.nickname,
      senderAvatar: req.user.avatar,
      type: 'borrow_approved',
      title: '借用申请已通过',
      content: `你的借用申请已通过！物品"${item.name}"预计 ${new Date(expectedReturnDate).toLocaleDateString()} 归还`,
      relatedItem: item._id
    });

    await notifyMessage.save();

    const updatedItem = await Item.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail')
      .populate('borrower', 'username nickname')
      .populate('borrowHistory.borrower', 'username nickname avatar');

    res.json({ message: '已同意借用', item: updatedItem });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/reject/:messageId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    const message = await Message.findById(req.params.messageId);

    if (!item || !message) {
      return res.status(404).json({ message: '物品或申请不存在' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作' });
    }

    const pendingRecord = item.borrowHistory.find(
      h => h.status === 'pending' && h.messageId?.toString() === req.params.messageId
    );

    if (pendingRecord) {
      pendingRecord.status = 'rejected';
    }

    message.status = 'rejected';
    await message.save();
    await item.save();

    const notifyMessage = new Message({
      recipient: message.sender,
      sender: req.user._id,
      senderName: req.user.nickname,
      senderAvatar: req.user.avatar,
      type: 'borrow_rejected',
      title: '借用申请被拒绝',
      content: `很抱歉，你的借用申请被拒绝了。物品"${item.name}"`,
      relatedItem: item._id
    });

    await notifyMessage.save();

    res.json({ message: '已拒绝借用申请' });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/return/:borrowId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作' });
    }

    const borrowerId = item.borrower;

    const borrowRecord = item.borrowHistory.find(
      h => h._id.toString() === req.params.borrowId
    );

    if (borrowRecord) {
      borrowRecord.actualReturnDate = new Date();
      borrowRecord.status = 'returned';
    }

    item.status = '可借用';
    item.borrower = null;
    item.borrowerName = null;
    item.expectedReturnDate = null;

    await item.save();

    if (borrowerId) {
      const notifyMessage = new Message({
        recipient: borrowerId,
        sender: req.user._id,
        senderName: req.user.nickname,
        senderAvatar: req.user.avatar,
        type: 'borrow_returned',
        title: '物品已归还',
        content: `你借用的物品"${item.name}"已归还，感谢使用！`,
        relatedItem: item._id
      });
      await notifyMessage.save();
    }

    const updatedItem = await Item.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail')
      .populate('borrower', 'username nickname')
      .populate('borrowHistory.borrower', 'username nickname avatar');

    res.json({ message: '物品已归还', item: updatedItem });
  } catch (error) {
    console.error('Return error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/ship/:borrowId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作' });
    }

    const borrowRecord = item.borrowHistory.find(
      h => h._id.toString() === req.params.borrowId && h.status === 'approved'
    );

    if (!borrowRecord) {
      return res.status(404).json({ message: '借用记录不存在或状态不正确' });
    }

    borrowRecord.status = 'shipped';
    borrowRecord.shippedAt = new Date();
    item.status = '已借出';

    await item.save();

    const notifyMessage = new Message({
      recipient: borrowRecord.borrower,
      sender: req.user._id,
      senderName: req.user.nickname,
      senderAvatar: req.user.avatar,
      type: 'borrow_shipped',
      title: '物品已发货',
      content: `你借用的物品"${item.name}"已发货，请留意查收！`,
      relatedItem: item._id
    });
    await notifyMessage.save();

    const updatedItem = await Item.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail')
      .populate('borrower', 'username nickname')
      .populate('borrowHistory.borrower', 'username nickname avatar');

    res.json({ message: '已确认发货', item: updatedItem });
  } catch (error) {
    console.error('Ship error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/pickup/:borrowId', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: '物品不存在' });
    }

    if (item.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限操作' });
    }

    const borrowRecord = item.borrowHistory.find(
      h => h._id.toString() === req.params.borrowId && h.status === 'approved'
    );

    if (!borrowRecord) {
      return res.status(404).json({ message: '借用记录不存在或状态不正确' });
    }

    borrowRecord.status = 'picked_up';
    borrowRecord.pickedUpAt = new Date();
    item.status = '已借出';

    await item.save();

    const notifyMessage = new Message({
      recipient: borrowRecord.borrower,
      sender: req.user._id,
      senderName: req.user.nickname,
      senderAvatar: req.user.avatar,
      type: 'borrow_picked_up',
      title: '物品已取货',
      content: `你借用的物品"${item.name}"已取货，感谢使用！`,
      relatedItem: item._id
    });
    await notifyMessage.save();

    const updatedItem = await Item.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail')
      .populate('borrower', 'username nickname')
      .populate('borrowHistory.borrower', 'username nickname avatar');

    res.json({ message: '已确认取货', item: updatedItem });
  } catch (error) {
    console.error('Pickup error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;