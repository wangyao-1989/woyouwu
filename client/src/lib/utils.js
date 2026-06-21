// 合并 class 名的工具函数
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
