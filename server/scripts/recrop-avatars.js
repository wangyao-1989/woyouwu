const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MBTI_TYPES = [
  ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  ['ISTP', 'ISFP', 'ESTP', 'ESFP']
];

async function recropAvatars() {
  try {
    const avatarPath = path.resolve(__dirname, '../uploads/mbti-avatars.jpg');
    console.log('Looking for avatar at:', avatarPath);
    
    if (!fs.existsSync(avatarPath)) {
      console.error('No avatar uploaded yet');
      return;
    }

    const uploadsDir = path.resolve(__dirname, '../uploads');
    const mbtiAvatarsDir = path.resolve(uploadsDir, 'mbti-avatars');
    
    console.log('Output directory:', mbtiAvatarsDir);
    
    if (!fs.existsSync(mbtiAvatarsDir)) {
      fs.mkdirSync(mbtiAvatarsDir, { recursive: true });
    }

    const image = await sharp(avatarPath);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    console.log(`Processing image: ${width}x${height}`);
    
    const raw = await image.raw().toBuffer();
    const channels = metadata.channels || 3;
    
    const findSeparatorLines = (size, isHorizontal) => {
      const lines = [];
      const lineLength = isHorizontal ? width : height;
      
      for (let i = Math.floor(size * 0.05); i < Math.floor(size * 0.95); i++) {
        let whitePixels = 0;
        const startIdx = isHorizontal ? i * width * channels : i * channels;
        
        for (let j = 0; j < lineLength; j++) {
          const idx = startIdx + j * (isHorizontal ? channels : width * channels);
          const r = raw[idx];
          const g = raw[idx + 1];
          const b = raw[idx + 2];
          if (r > 245 && g > 245 && b > 245) {
            whitePixels++;
          }
        }
        
        if (whitePixels > lineLength * 0.7) {
          if (lines.length === 0 || i - lines[lines.length - 1] > 10) {
            lines.push(i);
          }
        }
      }
      
      return lines;
    };
    
    const hLines = findSeparatorLines(height, true);
    const vLines = findSeparatorLines(width, false);
    
    console.log('Detected horizontal lines:', hLines);
    console.log('Detected vertical lines:', vLines);
    
    const getTileBounds = (row, col) => {
      const hBoundaries = [0, ...hLines, height];
      const vBoundaries = [0, ...vLines, width];
      
      let top = hBoundaries[row] || row * Math.floor(height / 4);
      let bottom = hBoundaries[row + 1] || (row + 1) * Math.floor(height / 4);
      let left = vBoundaries[col] || col * Math.floor(width / 4);
      let right = vBoundaries[col + 1] || (col + 1) * Math.floor(width / 4);
      
      const cellWidth = right - left;
      const cellHeight = bottom - top;
      const margin = Math.floor(Math.min(cellWidth, cellHeight) * 0.10); // 更大的边距，确保去掉边框
      return {
        left: left + margin,
        top: top + margin,
        width: cellWidth - margin * 2,
        height: cellHeight - margin * 2
      };
    };
    
    const isWhitePixel = (r, g, b) => r > 245 && g > 245 && b > 245;
    
    const findContentBounds = (rawTile, tileWidth, tileHeight) => {
      const ch = 3;
      const edgeWidth = Math.floor(Math.min(tileWidth, tileHeight) * 0.12); // 检查边缘区域
      
      // 检查顶部边缘
      let topCut = 0;
      for (let y = 0; y < Math.min(edgeWidth, tileHeight - 1); y++) {
        let whiteCount = 0;
        for (let x = 0; x < tileWidth; x++) {
          const idx = y * tileWidth * ch + x * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileWidth * 0.7) break; // 如果这一行70%以上不是白色，说明到了内容区域
        topCut = y + 1;
      }
      
      // 检查底部边缘
      let bottomCut = 0;
      for (let y = 0; y < Math.min(edgeWidth, tileHeight - 1); y++) {
        const row = tileHeight - 1 - y;
        let whiteCount = 0;
        for (let x = 0; x < tileWidth; x++) {
          const idx = row * tileWidth * ch + x * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileWidth * 0.7) break;
        bottomCut = y + 1;
      }
      
      // 检查左边缘
      let leftCut = 0;
      for (let x = 0; x < Math.min(edgeWidth, tileWidth - 1); x++) {
        let whiteCount = 0;
        for (let y = 0; y < tileHeight; y++) {
          const idx = y * tileWidth * ch + x * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileHeight * 0.7) break;
        leftCut = x + 1;
      }
      
      // 检查右边缘
      let rightCut = 0;
      for (let x = 0; x < Math.min(edgeWidth, tileWidth - 1); x++) {
        const col = tileWidth - 1 - x;
        let whiteCount = 0;
        for (let y = 0; y < tileHeight; y++) {
          const idx = y * tileWidth * ch + col * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileHeight * 0.7) break;
        rightCut = x + 1;
      }
      
      const resultWidth = tileWidth - leftCut - rightCut;
      const resultHeight = tileHeight - topCut - bottomCut;
      
      // 至少保留一些空间
      if (resultWidth < tileWidth * 0.5 || resultHeight < tileHeight * 0.5) {
        return null;
      }
      
      return {
        left: leftCut,
        top: topCut,
        width: resultWidth,
        height: resultHeight
      };
    };
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const mbtiType = MBTI_TYPES[row][col];
        const tilePath = path.resolve(mbtiAvatarsDir, `${mbtiType.toLowerCase()}.png`);
        
        if (fs.existsSync(tilePath)) {
          fs.unlinkSync(tilePath);
        }
        
        const bounds = getTileBounds(row, col);
        
        console.log(`Processing ${mbtiType}:`, bounds);
        
        // 直接裁剪后调整大小，不做额外内容检测
        await image.clone()
          .extract(bounds)
          .resize(200, 200, {
            fit: 'contain',
            background: { r: 240, g: 232, b: 221, alpha: 1 }
          })
          .png()
          .toFile(tilePath);
      }
    }
    
    console.log('Successfully recropped all avatars!');
  } catch (error) {
    console.error('Error recropping avatars:', error);
  }
}

recropAvatars();
