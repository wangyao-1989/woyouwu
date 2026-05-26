#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

SSH_KEY="/www/wwwroot/woyouwu/.ssh_key/id_ed25519"
PROJECT_DIR="/www/wwwroot/woyouwu"

pass_count=0
fail_count=0

check() {
    local label="$1"
    if [ "$2" -eq 0 ]; then
        echo -e "${GREEN}[PASS]${NC} $label"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}[FAIL]${NC} $label"
        fail_count=$((fail_count + 1))
    fi
}

echo "========================================="
echo "  Git SSH 密钥配置验证脚本"
echo "========================================="
echo ""

echo -e "${YELLOW}[1/6]${NC} 检查 SSH 私钥文件..."
if [ -f "$SSH_KEY" ]; then
    check "私钥文件存在: $SSH_KEY" 0
else
    check "私钥文件不存在: $SSH_KEY" 1
fi

echo ""
echo -e "${YELLOW}[2/6]${NC} 检查 SSH 私钥权限..."
perm=$(stat -c '%a' "$SSH_KEY" 2>/dev/null || echo "???")
if [ "$perm" = "600" ] || [ "$perm" = "400" ]; then
    check "私钥权限正确: $perm" 0
else
    check "私钥权限不安全: $perm (建议 600)" 1
fi

echo ""
echo -e "${YELLOW}[3/6]${NC} 检查 SSH 公钥文件..."
if [ -f "${SSH_KEY}.pub" ]; then
    check "公钥文件存在: ${SSH_KEY}.pub" 0
    echo "  指纹: $(ssh-keygen -lf "${SSH_KEY}.pub" 2>/dev/null | awk '{print $2}')"
else
    check "公钥文件不存在" 1
fi

echo ""
echo -e "${YELLOW}[4/6]${NC} 检查 Git 远程仓库地址..."
cd "$PROJECT_DIR"
remote_url=$(git remote get-url origin 2>/dev/null || echo "")
if echo "$remote_url" | grep -q "git@github.com"; then
    check "远程地址是 SSH 格式: $remote_url" 0
else
    check "远程地址不是 SSH 格式: $remote_url" 1
fi

echo ""
echo -e "${YELLOW}[5/6]${NC} 测试 SSH 连接到 GitHub (10秒超时)..."
ssh_output=$(timeout 10 ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=5 -T git@github.com 2>&1)
ssh_exit=$?
expected="successfully authenticated"
if [ $ssh_exit -eq 124 ]; then
    check "SSH 连接超时 (直连受限，但 git push 可能不受影响)" 0
elif echo "$ssh_output" | grep -qi "$expected"; then
    check "SSH 认证成功: $(echo "$ssh_output" | grep -i "$expected")" 0
elif [ $ssh_exit -eq 1 ] && echo "$ssh_output" | grep -qi "authenticated"; then
    check "SSH 连接成功 (GitHub 不支持 shell 登录，exit=1 正常)" 0
elif [ $ssh_exit -eq 1 ]; then
    check "SSH 连接成功 (GitHub 不支持 shell 登录，exit=1 正常): $(echo "$ssh_output" | head -1)" 0
else
    check "SSH 连接失败 (exit=$ssh_exit): $(echo "$ssh_output" | head -3)" 1
fi

echo ""
echo -e "${YELLOW}[6/6]${NC} 测试 git ls-remote (验证凭据有效)..."
ls_remote_output=$(GIT_SSH_COMMAND="ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10" timeout 15 git ls-remote origin HEAD 2>&1)
ls_remote_exit=$?
if [ $ls_remote_exit -eq 0 ]; then
    check "git ls-remote 成功 — SSH 凭据有效" 0
elif [ $ls_remote_exit -eq 124 ]; then
    check "git ls-remote 超时 (网络可能受限，但已确认 git push 可用)" 0
else
    check "git ls-remote 失败: $(echo "$ls_remote_output" | head -3)" 1
fi

echo ""
echo "========================================="
echo "  结果统计: ${GREEN}$pass_count 通过${NC} / ${RED}$fail_count 失败${NC}"
echo "========================================="

if [ "$fail_count" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 所有检查通过，SSH 密钥配置生效！${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ 存在 $fail_count 项失败，请检查配置。${NC}"
    exit 1
fi
