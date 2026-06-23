// 五子棋 AI - 基于位置评分
function getGomokuAIMove(board, aiPlayer) {
  const opponent = aiPlayer === 0 ? 1 : 0;
  let bestScore = -Infinity;
  let bestMove = null;

  // 获取所有空位
  const emptyCells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] === null) {
        // 只考虑周围有棋子的位置
        if (hasNeighbor(board, r, c, 2)) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }
  }

  // 如果棋盘为空或只有一个棋子，中心附近下
  if (emptyCells.length <= 1 || countPieces(board) <= 1) {
    return { row: 7, col: 7 };
  }

  for (const cell of emptyCells) {
    const score = evaluatePosition(board, cell.row, cell.col, aiPlayer, opponent);
    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }

  return bestMove || { row: 7, col: 7 };
}

function hasNeighbor(board, row, col, distance) {
  for (let r = Math.max(0, row - distance); r <= Math.min(14, row + distance); r++) {
    for (let c = Math.max(0, col - distance); c <= Math.min(14, col + distance); c++) {
      if (board[r][c] !== null) return true;
    }
  }
  return false;
}

function countPieces(board) {
  let count = 0;
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (board[r][c] !== null) count++;
    }
  }
  return count;
}

function evaluatePosition(board, row, col, aiPlayer, opponent) {
  let aiScore = 0;
  let oppScore = 0;
  const directions = [[1,0],[0,1],[1,1],[1,-1]];

  for (const [dx, dy] of directions) {
    const aiPattern = countDirectionalPattern(board, row, col, dx, dy, aiPlayer);
    const oppPattern = countDirectionalPattern(board, row, col, dx, dy, opponent);
    aiScore += scorePattern(aiPattern);
    oppScore += scorePattern(oppPattern);
  }

  // 进攻分+防守分
  return aiScore * 1.1 + oppScore;
}

function countDirectionalPattern(board, row, col, dx, dy, player) {
  let count = 1;
  let openEnds = 0;

  // 正方向
  let r = row + dx, c = col + dy;
  while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
    count++;
    r += dx;
    c += dy;
  }
  if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === null) openEnds++;

  // 反方向
  r = row - dx;
  c = col - dy;
  while (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === player) {
    count++;
    r -= dx;
    c -= dy;
  }
  if (r >= 0 && r < 15 && c >= 0 && c < 15 && board[r][c] === null) openEnds++;

  return { count, openEnds };
}

function scorePattern({ count, openEnds }) {
  if (count >= 5) return 100000;
  if (count === 4) {
    if (openEnds === 2) return 10000;
    if (openEnds === 1) return 1000;
  }
  if (count === 3) {
    if (openEnds === 2) return 1000;
    if (openEnds === 1) return 100;
  }
  if (count === 2) {
    if (openEnds === 2) return 100;
    if (openEnds === 1) return 10;
  }
  if (count === 1) {
    if (openEnds === 2) return 10;
    if (openEnds === 1) return 1;
  }
  return 0;
}

// 在线 AI 模式（服务器端调用）
function getOnlineAIMove(gameState) {
  const currentPlayer = gameState.currentPlayer;
  return getGomokuAIMove(gameState.board, currentPlayer);
}

module.exports = { getGomokuAIMove, getOnlineAIMove };
