'use client';

import { colorSchemes, ColorScheme } from '@/lib/color-schemes';
import { Check } from 'lucide-react';

interface ColorSchemeSelectorProps {
  selectedScheme: ColorScheme;
  onSchemeChange: (scheme: ColorScheme) => void;
}

export function ColorSchemeSelector({ selectedScheme, onSchemeChange }: ColorSchemeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">选择配色方案</h3>
        <p className="text-sm text-gray-600 mb-4">
          根据行业和个人风格选择最适合的配色，遵循 60-30-10 原则
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {colorSchemes.map((scheme) => {
          const isSelected = selectedScheme.id === scheme.id;
          return (
            <button
              key={scheme.id}
              onClick={() => onSchemeChange(scheme)}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <div className="flex items-start gap-4">
                {/* 颜色预览 */}
                <div className="flex gap-1 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-l-md"
                    style={{ backgroundColor: scheme.leftColumn.backgroundColor }}
                  />
                  <div
                    className="w-8 h-8"
                    style={{ backgroundColor: scheme.middleColumn.backgroundColor }}
                  />
                  <div
                    className="w-8 h-8 rounded-r-md"
                    style={{ backgroundColor: scheme.rightColumn.backgroundColor }}
                  />
                </div>

                {/* 方案信息 */}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{scheme.name}</h4>
                    {isSelected && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{scheme.description}</p>
                </div>
              </div>

              {/* 选中标记 */}
              {isSelected && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* 配色原则说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 配色黄金法则</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 60% 背景色（白色）</li>
          <li>• 30% 主色调（标题栏、侧边栏）</li>
          <li>• 10% 点缀色（突出重点）</li>
          <li>• 不超过 3 种颜色（黑白灰不计）</li>
        </ul>
      </div>
    </div>
  );
}
