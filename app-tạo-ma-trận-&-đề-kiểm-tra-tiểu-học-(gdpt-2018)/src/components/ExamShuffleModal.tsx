/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CompleteExamPackage, ExamQuestion, ChoiceOption } from '../types/exam';
import { Shuffle, X, Check, Copy } from 'lucide-react';

interface ExamShuffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  examPkg: CompleteExamPackage;
  onApplyVariant: (variant: CompleteExamPackage) => void;
}

export const ExamShuffleModal: React.FC<ExamShuffleModalProps> = ({
  isOpen,
  onClose,
  examPkg,
  onApplyVariant,
}) => {
  const [targetCode, setTargetCode] = useState('102');
  const [shuffleOptions, setShuffleOptions] = useState(true);

  if (!isOpen) return null;

  const handleGenerateVariant = () => {
    // Permute options A, B, C, D of multiple choice questions while preserving pedagogical question order
    const updatedQuestions = examPkg.questions.map((q) => {
      if (q.type === 'multiple_choice' && q.options && q.options.length > 1 && shuffleOptions) {
        // Clone and shuffle options array
        const textList = q.options.map((o) => o.text);
        // Deterministic shuffle based on targetCode
        const shuffledTexts = [...textList].sort(() => 0.5 - Math.random());
        const newOptions: ChoiceOption[] = q.options.map((opt, i) => ({
          key: opt.key,
          text: shuffledTexts[i],
        }));
        return {
          ...q,
          options: newOptions,
        };
      }
      return q;
    });

    const newPkg: CompleteExamPackage = {
      ...examPkg,
      id: `variant-${targetCode}-${Date.now()}`,
      examCode: targetCode,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
    };

    onApplyVariant(newPkg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans text-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Tạo Mã Đề Mới (Trộn Đề)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mã đề thi:</label>
            <div className="grid grid-cols-4 gap-2">
              {['101', '102', '103', '104'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setTargetCode(code)}
                  className={`py-2 text-center rounded-lg border font-bold text-xs transition ${
                    targetCode === code
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Mã {code}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="text-xs font-medium text-slate-800">
                Xáo trộn thứ tự các phương án (A, B, C, D)
              </span>
            </label>
            <p className="text-[11px] text-slate-500 pl-6">
              Vẫn giữ nguyên thứ tự sư phạm chuẩn GDPT 2018 (Trắc nghiệm M1 &rarr; M2, Tự luận M1 &rarr; M2 &rarr; M3).
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleGenerateVariant}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Tạo Mã Đề {targetCode}
          </button>
        </div>
      </div>
    </div>
  );
};
