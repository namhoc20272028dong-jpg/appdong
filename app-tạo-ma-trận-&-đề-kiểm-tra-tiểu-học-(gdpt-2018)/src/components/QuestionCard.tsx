/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExamQuestion } from '../types/exam';
import { MathGrid } from './MathGrid';
import { Edit2, Sparkles, ArrowUp, ArrowDown, Trash2, CheckCircle2 } from 'lucide-react';

interface QuestionCardProps {
  question: ExamQuestion;
  grade: number;
  totalQuestions: number;
  onEdit?: (question: ExamQuestion) => void;
  onRegenerateAi?: (question: ExamQuestion) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  showTeacherBadges?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  grade,
  totalQuestions,
  onEdit,
  onRegenerateAi,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
  showTeacherBadges = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Formatted score e.g. "0,5" or "1,0"
  const formattedScore = Number(question.score || 0).toFixed(1).replace('.', ',');

  // Level badge styling
  const levelBadgeClass =
    question.level === 'M1'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : question.level === 'M2'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative font-serif text-[13.5pt] leading-[1.6] text-slate-900 my-4 p-3 rounded-lg hover:bg-slate-50/70 border border-transparent hover:border-slate-200 transition print:m-0 print:p-0 print:border-none print:hover:bg-transparent"
    >
      {/* Teacher Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between gap-2 mb-1.5 print:hidden">
        {showTeacherBadges ? (
          <div className="flex items-center gap-1.5 font-sans text-xs">
            <span
              className={`px-2 py-0.5 rounded-full border font-semibold text-[11px] ${levelBadgeClass}`}
            >
              {question.level === 'M1' ? 'Mức 1 (Biết)' : question.level === 'M2' ? 'Mức 2 (Hiểu)' : 'Mức 3 (Vận dụng)'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
              {question.typeName}
            </span>
            <span className="text-slate-400 text-xs truncate max-w-xs" title={question.topic}>
              • {question.topic}
            </span>
          </div>
        ) : <div />}

        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-sans ${isHovered ? 'opacity-100' : ''}`}>
          {onMoveUp && !isFirst && (
            <button
              onClick={onMoveUp}
              title="Đưa câu hỏi lên trên"
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && !isLast && (
            <button
              onClick={onMoveDown}
              title="Đưa câu hỏi xuống dưới"
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 rounded"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
          {onRegenerateAi && (
            <button
              onClick={() => onRegenerateAi(question)}
              title="Dùng AI đổi câu hỏi khác cùng mức độ và dạng câu"
              className="px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded flex items-center gap-1 bg-white font-medium shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Đổi câu khác
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(question)}
              title="Chỉnh sửa nội dung câu hỏi"
              className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1 bg-white font-medium shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              Sửa
            </button>
          )}
          {onDelete && totalQuestions > 1 && (
            <button
              onClick={onDelete}
              title="Xóa câu hỏi này"
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Question Line: Strictly adhering to prompt formatting specifications */}
      {/* "Câu số (chữ đậm), điểm (chữ nghiêng và không đậm) liền câu số, câu hỏi (Chữ không đậm)" */}
      <div className="text-justify leading-relaxed">
        <span className="font-bold">Câu {question.questionNumber} </span>
        <span className="font-normal italic">({formattedScore} điểm): </span>
        <span className="font-normal">{question.content}</span>
      </div>

      {/* Multiple Choice Options (Indented 1 tab / 1cm = 28px - 32px) */}
      {question.type === 'multiple_choice' && question.options && question.options.length > 0 && (
        <div className="mt-2 pl-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 print:grid-cols-3">
          {question.options.map((opt) => (
            <div key={opt.key} className="flex items-start gap-1.5 leading-snug">
              <span className="font-bold">{opt.key}.</span>
              <span>{opt.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* True / False Table: Formatted neatly for students to check Đ or S */}
      {question.type === 'true_false' && question.trueFalseItems && question.trueFalseItems.length > 0 && (
        <div className="mt-3 pl-8">
          <table className="w-full max-w-2xl border-collapse border border-slate-800 text-[12.5pt] print:border-black">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100">
                <th className="border border-slate-800 px-3 py-1.5 text-left font-semibold">Ý kiến / Nhận định</th>
                <th className="border border-slate-800 px-2 py-1.5 w-16 text-center font-semibold">Đúng</th>
                <th className="border border-slate-800 px-2 py-1.5 w-16 text-center font-semibold">Sai</th>
              </tr>
            </thead>
            <tbody>
              {question.trueFalseItems.map((item) => (
                <tr key={item.key}>
                  <td className="border border-slate-800 px-3 py-1.5">
                    <span className="font-bold mr-1">{item.key})</span> {item.statement}
                  </td>
                  <td className="border border-slate-800 text-center font-bold text-slate-300"></td>
                  <td className="border border-slate-800 text-center font-bold text-slate-300"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matching Question Table: Column A matching with Column B */}
      {question.type === 'matching' && question.matchingPairs && question.matchingPairs.length > 0 && (
        <div className="mt-3 pl-8">
          <div className="grid grid-cols-2 gap-4 max-w-2xl p-3 bg-slate-50/70 rounded-lg border border-slate-200 print:border-none print:bg-transparent">
            <div>
              <div className="font-bold text-xs uppercase text-slate-600 mb-1.5 font-sans print:text-black">Cột A:</div>
              <div className="space-y-2">
                {question.matchingPairs.map((p) => (
                  <div key={p.leftKey} className="flex items-start gap-1 text-[12.5pt]">
                    <span className="font-bold">{p.leftKey}.</span>
                    <span>{p.leftText}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-bold text-xs uppercase text-slate-600 mb-1.5 font-sans print:text-black">Cột B:</div>
              <div className="space-y-2">
                {question.matchingPairs.map((p) => (
                  <div key={p.rightKey} className="flex items-start gap-1 text-[12.5pt]">
                    <span className="font-bold">{p.rightKey}.</span>
                    <span>{p.rightText}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fill In The Blank Sentence */}
      {question.type === 'fill_in_the_blank' && question.fillInTheBlankText && (
        <div className="mt-2 pl-8 font-normal italic text-slate-800 bg-slate-50/60 p-2.5 rounded border border-slate-200 print:border-none print:bg-transparent">
          {question.fillInTheBlankText}
        </div>
      )}

      {/* Math Grid for geometry questions (Grid notebook 5x5 / 6x8) */}
      {question.hasMathGrid && (
        <div className="pl-8">
          <MathGrid config={question.mathGridConfig} />
        </div>
      )}

      {/* Practice Instructions for Informatics */}
      {question.type === 'practice' && question.practiceInstructions && (
        <div className="mt-2.5 pl-8 p-3 bg-blue-50/60 border border-blue-200 rounded font-sans text-xs text-slate-800 print:border-slate-400">
          <div className="font-bold uppercase text-blue-900 mb-1">Hướng dẫn thực hành trên máy tính:</div>
          <div className="whitespace-pre-line font-mono text-[12px]">{question.practiceInstructions}</div>
        </div>
      )}

      {/* Blank dotted lines for student written work in Essay / Constructed Response */}
      {(question.type === 'essay' || question.type === 'practice') && (
        <div className="mt-3 pl-4">
          <div className="text-[11pt] italic text-slate-500 font-sans mb-1 print:text-black">Bài làm:</div>
          <div className="space-y-4 pt-1">
            {Array.from({ length: question.score >= 1.5 ? 5 : 3 }).map((_, idx) => (
              <div key={idx} className="border-b border-dotted border-slate-400 h-2"></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
