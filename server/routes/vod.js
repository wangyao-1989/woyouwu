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
 * POST /api/vod/upload-signature
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

    const client = getVodClient();

    // 生成上传签名，有效期 1 小时
    const currentTime = Math.floor(Date.now() / 1000);
    const expireTime = currentTime + 3600;

    const params = {
      CurrentTimeStamp: currentTime,
      ExpireTime: expireTime,
      Procedure: '',
      SubAppId: process.env.VOD_SUB_APP_ID ? parseInt(process.env.VOD_SUB_APP_ID) : undefined,
    };

    const response = await client.CreateUploadSignature(params);

    res.json({
      code: 0,
      data: {
        signature: response.Signature,
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
    const baseUrl = mediaInfo.MediaBasicInfo?.MediaUrl || '';

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
        name: mediaInfo.MediaBasicInfo?.Name || '',
        coverUrl: mediaInfo.MediaBasicInfo?.CoverUrl || '',
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
 * 腾讯云 Key 防盗链签名算法：
 * sign = md5(key + path + timestamp)
 */
function signVodUrl(url, key) {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname; // e.g. /xxx/xxx.mp4

    // 签名有效期设为 2 小时
    const timestamp = Math.floor(Date.now() / 1000) + 7200;

    // 签名：md5(key + path + timestamp)
    const signStr = key + path + timestamp;
    const sign = crypto.createHash('md5').update(signStr).digest('hex');

    urlObj.searchParams.set('sign', sign);
    urlObj.searchParams.set('t', timestamp.toString());

    return urlObj.toString();
  } catch {
    return url;
  }
}

module.exports = router;
