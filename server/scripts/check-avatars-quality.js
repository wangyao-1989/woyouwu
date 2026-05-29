const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

async function checkBorder(raw, width, height, channels) {
  const borderSize = 4;
  let topWhite = 0, bottomWhite = 0, leftWhite = 0, rightWhite = 0;
  let totalTop = width * borderSize, totalBottom = width * borderSize;
  let totalLeft = height * borderSize, totalRight = height * borderSize;
  
  for (let y = 0; y < borderSize; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width * channels + x * channels;
      if (raw[idx] > 245 && raw[idx + 1] > 245 && raw[idx + 2] > 245) topWhite++;
    }
  }
  
  for (let y = height - borderSize; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width * channels + x * channels;
      if (raw[idx] > 245 && raw[idx + 1] > 245 && raw[idx + 2] > 245) bottomWhite++;
    }
  }
  
  for (let x = 0; x < borderSize; x++) {
    for (let y = 0; y < height; y++) {
      const idx = y * width * channels + x * channels;
      if (raw[idx] > 245 && raw[idx + 1] > 245 && raw[idx + 2] > 245) leftWhite++;
    }
  }
  
  for (let x = width - borderSize; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const idx = y * width * channels + x * channels;
      if (raw[idx] > 245 && raw[idx + 1] > 245 && raw[idx + 2] > 245) rightWhite++;
    }
  }
  
  return {
    top: (topWhite / totalTop * 100).toFixed(1),
    bottom: (bottomWhite / totalBottom * 100).toFixed(1),
    left: (leftWhite / totalLeft * 100).toFixed(1),
    right: (rightWhite / totalRight * 100).toFixed(1)
  };
}

async function checkCorner(raw, width, height, channels, cornerX, cornerY) {
  const area = 20;
  let white = 0, total = 0;
  const startX = cornerX === 'right' ? width - area : 0;
  const startY = cornerY === 'top' ? 0 : height - area;
  
  for (let y = startY; y < startY + area && y < height; y++) {
    for (let x = startX; x < startX + area && x < width; x++) {
      const idx = y * width * channels + x * channels;
      if (raw[idx] > 245 && raw[idx + 1] > 245 && raw[idx + 2] > 245) white++;
      total++;
    }
  }
  
  return (white / total * 100).toFixed(1);
}

async function main() {
  const dir = path.resolve(__dirname, '../uploads/mbti-avatars');
  const results = [];
  
  for (const type of MBTI_TYPES) {
    const filePath = path.join(dir, `${type.toLowerCase()}.png`);
    if (!fs.existsSync(filePath)) {
      console.log(`${type}: FILE NOT FOUND`);
      continue;
    }
    
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const { width, height, channels } = metadata;
    const raw = await image.raw().toBuffer();
    
    const borders = await checkBorder(raw, width, height, channels);
    const topRight = await checkCorner(raw, width, height, channels, 'right', 'top');
    
    const hasBorder = parseFloat(borders.top) < 60 || parseFloat(borders.bottom) < 60 || 
                      parseFloat(borders.left) < 60 || parseFloat(borders.right) < 60;
    const hasCornerIssue = parseFloat(topRight) < 70;
    
    results.push({
      type,
      width, height,
      borders,
      topRightCorner: topRight + '%',
      hasBorder,
      hasCornerIssue
    });
  }
  
  console.log('\n========== 头像质量检查报告 ==========\n');
  
  const hasBorderList = results.filter(r => r.hasBorder);
  const hasCornerList = results.filter(r => r.hasCornerIssue);
  const cleanList = results.filter(r => !r.hasBorder && !r.hasCornerIssue);
  
  if (hasBorderList.length > 0) {
    console.log(`⚠️  以下头像仍有边框残留 (边缘白色占比 < 60%):`);
    hasBorderList.forEach(r => {
      console.log(`   ${r.type}: 上${r.borders.top}% 下${r.borders.bottom}% 左${r.borders.left}% 右${r.borders.right}%`);
    });
  } else {
    console.log('✅ 所有头像边框已清除 (四边白色占比均 ≥ 60%)');
  }
  
  console.log('');
  
  if (hasCornerList.length > 0) {
    console.log(`⚠️  以下头像右上角白色占比 < 70% (可能有元素残留):`);
    hasCornerList.forEach(r => {
      console.log(`   ${r.type}: 右上角${r.topRightCorner}`);
    });
  } else {
    console.log('✅ 所有头像右上角纯净 (白色占比 ≥ 70%)');
  }
  
  console.log('');
  console.log(`总计: ${results.length} 个头像`);
  console.log(`完全干净: ${cleanList.length} 个`);
  console.log(`有边框: ${hasBorderList.length} 个`);
  console.log(`右上角有残留: ${hasCornerList.length} 个`);
  console.log('');
  
  results.forEach(r => {
    const status = (!r.hasBorder && !r.hasCornerIssue) ? '✅' : '❌';
    console.log(`${status} ${r.type}  ${r.width}x${r.height}  上:${r.borders.top}% 下:${r.borders.bottom}% 左:${r.borders.left}% 右:${r.borders.right}%  右上角:${r.topRightCorner}`);
  });
}

main().catch(console.error);
