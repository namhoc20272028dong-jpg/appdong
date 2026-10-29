/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MathGridConfig } from '../types/exam';

interface MathGridProps {
  config?: MathGridConfig | null;
  className?: string;
  cellSize?: number;
}

export const MathGrid: React.FC<MathGridProps> = ({
  config,
  className = '',
  cellSize = 24,
}) => {
  const rows = config?.rows || 5;
  const cols = config?.cols || 8;
  const width = cols * cellSize;
  const height = rows * cellSize;

  const shapeType = config?.shapeType || 'rectangle';
  const widthUnits = config?.dimensions?.widthUnits || 5;
  const heightUnits = config?.dimensions?.heightUnits || 3;

  return (
    <div className={`my-3 p-3 bg-white border border-slate-300 rounded-lg inline-block print:border-slate-800 ${className}`}>
      {config?.label && (
        <div className="text-xs font-semibold text-slate-600 mb-1.5 text-center print:text-black">
          {config.label}
        </div>
      )}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="bg-[#fcfdfa] select-none"
      >
        <defs>
          {/* Sub-grid pattern resembling Vietnamese primary school notebook (vở ô li 5x5) */}
          <pattern id="smallGrid" width={cellSize / 2} height={cellSize / 2} patternUnits="userSpaceOnUse">
            <path d={`M ${cellSize / 2} 0 L 0 0 0 ${cellSize / 2}`} fill="none" stroke="#e0f2fe" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
            <rect width={cellSize} height={cellSize} fill="url(#smallGrid)" />
            <path d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`} fill="none" stroke="#93c5fd" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Base Grid */}
        <rect width={width} height={height} fill="url(#grid)" stroke="#60a5fa" strokeWidth="1.5" />

        {/* Shaded cells if any */}
        {config?.shadedCells?.map((sc, i) => (
          <rect
            key={i}
            x={sc.c * cellSize}
            y={sc.r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#93c5fd"
            opacity={0.45}
            stroke="#3b82f6"
            strokeWidth={1}
          />
        ))}

        {/* Render geometric shape samples for student reference / task */}
        {shapeType === 'rectangle' && (
          <g>
            <rect
              x={cellSize}
              y={cellSize}
              width={widthUnits * cellSize}
              height={heightUnits * cellSize}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#1e3a8a"
              strokeWidth="2"
              strokeDasharray="4,2"
            />
            {/* Vertex points */}
            <circle cx={cellSize} cy={cellSize} r="3" fill="#1e3a8a" />
            <text x={cellSize - 10} y={cellSize - 5} fontSize="11" fontWeight="bold" fill="#1e3a8a">A</text>

            <circle cx={cellSize + widthUnits * cellSize} cy={cellSize} r="3" fill="#1e3a8a" />
            <text x={cellSize + widthUnits * cellSize + 4} y={cellSize - 5} fontSize="11" fontWeight="bold" fill="#1e3a8a">B</text>

            <circle cx={cellSize + widthUnits * cellSize} cy={cellSize + heightUnits * cellSize} r="3" fill="#1e3a8a" />
            <text x={cellSize + widthUnits * cellSize + 4} y={cellSize + heightUnits * cellSize + 12} fontSize="11" fontWeight="bold" fill="#1e3a8a">C</text>

            <circle cx={cellSize} cy={cellSize + heightUnits * cellSize} r="3" fill="#1e3a8a" />
            <text x={cellSize - 12} y={cellSize + heightUnits * cellSize + 12} fontSize="11" fontWeight="bold" fill="#1e3a8a">D</text>

            <text x={cellSize + (widthUnits * cellSize) / 2 - 12} y={cellSize - 5} fontSize="10" fill="#475569">
              {widthUnits} ô
            </text>
            <text x={cellSize + widthUnits * cellSize + 6} y={cellSize + (heightUnits * cellSize) / 2 + 3} fontSize="10" fill="#475569">
              {heightUnits} ô
            </text>
          </g>
        )}

        {shapeType === 'segment' && (
          <g>
            <line
              x1={cellSize}
              y1={cellSize * 2}
              x2={cellSize + widthUnits * cellSize}
              y2={cellSize * 2}
              stroke="#1e3a8a"
              strokeWidth="2.5"
            />
            <circle cx={cellSize} cy={cellSize * 2} r="3.5" fill="#1e3a8a" />
            <text x={cellSize - 10} y={cellSize * 2 - 5} fontSize="11" fontWeight="bold" fill="#1e3a8a">A</text>

            <circle cx={cellSize + widthUnits * cellSize} cy={cellSize * 2} r="3.5" fill="#1e3a8a" />
            <text x={cellSize + widthUnits * cellSize + 4} y={cellSize * 2 - 5} fontSize="11" fontWeight="bold" fill="#1e3a8a">B</text>

            <text x={cellSize + (widthUnits * cellSize) / 2 - 12} y={cellSize * 2 - 6} fontSize="10" fill="#475569">
              {widthUnits} ô
            </text>
          </g>
        )}
      </svg>
      <div className="text-[11px] text-slate-500 mt-1 italic text-center print:text-black">
        (Mỗi cạnh của ô vuông nhỏ tương ứng với 1 cm)
      </div>
    </div>
  );
};
