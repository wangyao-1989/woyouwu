const express = require('express');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 腾讯云 VOD SDK 客户端（延迟初始化）
let vodClient = null;
function getVodClient() {
  if (vodClient) return vodClient;
  const tencentcloud = require('tencentcloud-sdk-nodejs-vod');
  const VodClient = tencentcloud.vod.v20180717.Client;

  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_SECRET_ID || '',
      secretKey: process.env.TENCENT_SECRET_KEY || '',
    },
    region: process.env.VOD_REGION || 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'vod.tencentcloudapi.com',
      },
    },
  };

  vodClient = new VodClient(clientConfig);
  return vodClient;
}

/**
 * 生成 VOD 客户端上传签名
 * 算法参考：https://cloud.tencent.com/document/product/266/10638
 * 
 * 1. 拼接明文串 original: secretId=xxx&currentTimeStamp=xxx&expireTime=xxx&random=xxx
 * 2. 用 SecretKey 对 original 做 HMAC-SHA1 → signatureTmp (字节数组)
 * 3. 合并 signatureTmp + original 的 UTF-8 字节 → Base64 编码
 */
function generateUploadSignature(secretId, secretKey, currentTime, expireTime, extraParams) {
  // 1. 拼接明文串 (参数值需要 URL 编码)
  const params = {
    secretId: secretId,
    currentTimeStamp: currentTime,
    expireTime: expireTime,
    random: Math.floor(Math.random() * 4294967295), // 0 ~ 2^32-1
    ...extraParams,
  };

  // 过滤掉 undefined 的参数
  Object.keys(params).forEach(key => {
    if (params[key] === undefined || params[key] === '') {
      delete params[key];
    }
  });

  const original = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  // 2. HMAC-SHA1 签名
  const hmac = crypto.createHmac('sha1', secretKey);
  hmac.update(original, 'utf8');
  const signatureTmp = hmac.digest(); // Buffer

  // 3. 合并签名 + 原文 → Base64
  const originalBuffer = Buffer.from(original, 'utf8');
  const combined = Buffer.concat([signatureTmp, originalBuffer]);
  const signature = combined.toString('base64');

  return signature;
}

/**
 * GET /api/vod/upload-signature
 * 为前端上传视频提供一次性签名
 */
router.get('/upload-signature', auth, async (req, res) => {
  try {
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;

    if (!secretId || !secretKey) {
      return res.status(500).json({
        code: -1,
        message: 'VOD服务未配置，请联系管理员设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY',
      });
    }

    // 生成上传签名，有效期 1 小时
    const currentTime = Math.floor(Date.now() / 1000);
    const expireTime = currentTime + 3600;

    const extraParams = {};
    if (process.env.VOD_SUB_APP_ID) {
      extraParams.classId = 0;
    }

    const signature = generateUploadSignature(secretId, secretKey, currentTime, expireTime, extraParams);

    res.json({
      code: 0,
      data: {
        signature,
      },
    });
  } catch (error) {
    console.error('VOD upload signature error:', error.message);
    res.status(500).json({
      code: -1,
      message: '生成上传签名失败: ' + (error.message || '未知错误'),
    });
  }
});

/**
 * GET /api/vod/play-url/:fileId
 * 根据 fileId 获取带防盗链签名的播放地址
 */
router.get('/play-url/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const antiLeechKey = process.env.VOD_ANTI_LEECH_KEY;

    if (!fileId) {
      return res.status(400).json({ code: -1, message: '缺少 fileId' });
    }

    const client = getVodClient();

    // 查询媒资信息获取原始播放 URL
    const params = {
      FileIds: [fileId],
    };

    const response = await client.DescribeMediaInfos(params);

    if (!response.MediaInfoSet || response.MediaInfoSet.length === 0) {
      return res.status(404).json({ code: -1, message: '视频不存在' });
    }

    const mediaInfo = response.MediaInfoSet[0];
    const baseUrl = mediaInfo.BasicInfo?.MediaUrl || '';

    if (!baseUrl) {
      return res.status(404).json({ code: -1, message: '视频播放地址不存在' });
    }

    // 如果配置了 Key 防盗链，生成带签名的 URL
    let playUrl = baseUrl;
    if (antiLeechKey) {
      playUrl = signVodUrl(baseUrl, antiLeechKey);
    }

    res.json({
      code: 0,
      data: {
        fileId,
        playUrl,
        name: mediaInfo.BasicInfo?.Name || '',
        coverUrl: mediaInfo.BasicInfo?.CoverUrl || '',
        duration: mediaInfo.MetaData?.Duration || 0,
      },
    });
  } catch (error) {
    console.error('VOD play URL error:', error.message);
    res.status(500).json({
      code: -1,
      message: '获取播放地址失败: ' + (error.message || '未知错误'),
    });
  }
});

/**
 * 为 VOD 播放 URL 添加 Key 防盗链签名
 * 腾讯云 Key 防盗链签名算法（参考文档：https://cloud.tencent.com/document/product/266/14047）
 * 
 * sign = md5(KEY + Dir + t)
 * - Dir: 原始 URL 的 PATH 去掉文件名部分（如 /dir1/dir2/）
 * - t: Unix 时间戳的十六进制小写形式
 */
function signVodUrl(url, key) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname; // e.g. /dir1/dir2/myVideo.mp4

    // Dir = 去掉文件名的路径部分，如 /dir1/dir2/
    const dir = pathname.substring(0, pathname.lastIndexOf('/') + 1);

    // 签名有效期设为 2 小时，Unix时间戳 → 十六进制小写
    const timestamp = Math.floor(Date.now() / 1000) + 7200;
    const tHex = timestamp.toString(16);

    // 签名：md5(KEY + Dir + t)
    const signStr = key + dir + tHex;
    const sign = crypto.createHash('md5').update(signStr).digest('hex');

    urlObj.searchParams.set('t', tHex);
    urlObj.searchParams.set('sign', sign);

    return urlObj.toString();
  } catch {
    return url;
  }
}

module.exports = router;
