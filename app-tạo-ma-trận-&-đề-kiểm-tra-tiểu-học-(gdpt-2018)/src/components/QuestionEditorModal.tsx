/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExamQuestion, CognitiveLevel, QuestionType } from '../types/exam';
import { X, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: ExamQuestion | null;
  grade: number;
  onSaveQuestion: (updatedQuestion: ExamQuestion) => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  question,
  grade,
  onSaveQuestion,
}) => {
  if (!isOpen || !question) return null;

  const [formData, setFormData] = useState<ExamQuestion>({
    ...question,
    options: question.options ? [...question.options] : [],
  });

  const isLowerGrade = grade <= 3;
  const expectedChoices = isLowerGrade ? 3 : 4;

  const handleLevelChange = (newLevel: CognitiveLevel) => {
    // If user switches to M3 and current type is multiple choice, inform or change type
    let newType = formData.type;
    let newTypeName = formData.typeName;
    if (newLevel === 'M3' && formData.type !== 'essay' && formData.type !== 'practice') {
      newType = 'essay';
      newTypeName = 'Tự luận';
    }

    setFormData({
      ...formData,
      level: newLevel,
      levelName: newLevel === 'M1' ? 'Mức 1 (Biết)' : newLevel === 'M2' ? 'Mức 2 (Hiểu)' : 'Mức 3 (Vận dụng)',
      type: newType,
      typeName: newTypeName,
    });
  };

  const handleTypeChange = (newType: QuestionType) => {
    let typeName = 'TN nhiều lựa chọn';
    if (newType === 'true_false') typeName = 'TN đúng sai';
    else if (newType === 'matching') typeName = 'TN nối cột';
    else if (newType === 'fill_in_the_blank') typeName = 'TN điền khuyết';
    else if (newType === 'essay') typeName = 'Tự luận';
    else if (newType === 'practice') typeName = 'Thực hành';

    // If new type is TN, level cannot be M3
    let newLevel = formData.level;
    let newLevelName = formData.levelName;
    if (newType !== 'essay' && newType !== 'practice' && newLevel === 'M3') {
      newLevel = 'M2';
      newLevelName = 'Mức 2 (Hiểu)';
    }

    // Default options if switching to multiple_choice
    let options = formData.options;
    if (newType === 'multiple_choice' && (!options || options.length === 0)) {
      options = isLowerGrade
        ? [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }]
        : [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }];
    }

    setFormData({
      ...formData,
      type: newType,
      typeName,
      level: newLevel,
      levelName: newLevelName,
      options,
    });
  };

  const handleOptionChange = (idx: number, newText: string) => {
    const updated = [...(formData.options || [])];
    if (updated[idx]) {
      updated[idx].text = newText;
      setFormData({ ...formData, options: updated });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveQuestion(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans text-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Chỉnh sửa Câu {formData.questionNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Điều chỉnh nội dung, mức độ, dạng câu và thang điểm
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Level & Type Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ nhận thức:</label>
              <select
                value={formData.level}
                onChange={(e) => handleLevelChange(e.target.value as CognitiveLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="M1">Mức 1 (Biết)</option>
                <option value="M2">Mức 2 (Hiểu)</option>
                <option value="M3">Mức 3 (Vận dụng - Tự luận)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hình thức câu:</label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="multiple_choice" disabled={formData.level === 'M3'}>
                  TN nhiều lựa chọn {formData.level === 'M3' ? '(Không áp dụng M3)' : ''}
                </option>
                <option value="true_false" disabled={formData.level === 'M3'}>
                  TN đúng sai
                </option>
                <option value="matching" disabled={formData.level === 'M3'}>
                  TN nối cột
                </option>
                <option value="fill_in_the_blank" disabled={formData.level === 'M3'}>
                  TN điền khuyết
                </option>
                <option value="essay">Tự luận</option>
                <option value="practice">Thực hành (Tin học)</option>
              </select>
            </div>
          </div>

          {/* Topic & Score Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mạch kiến thức / Chủ đề:</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm số của câu:</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="5.0"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>

          {/* Question Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nội dung câu hỏi (Chữ không đậm):
            </label>
            <textarea
              rows={3}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-serif text-[13.5pt]"
            />
          </div>

          {/* Multiple choice options editor */}
          {formData.type === 'multiple_choice' && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700">
                Các phương án lựa chọn ({expectedChoices} phương án cho Lớp {grade}):
              </label>
              <div className="space-y-2">
                {(formData.options || []).map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded bg-slate-100 border border-slate-300 font-bold flex items-center justify-center text-xs">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Nội dung phương án ${opt.key}...`}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Math Grid Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-800">Hiển thị lưới ô vuông (Toán học)</div>
              <div className="text-[11px] text-slate-500">Mô phỏng vở ô li tiểu học cho bài vẽ hình, đo đạc</div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(formData.hasMathGrid)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hasMathGrid: e.target.checked,
                  mathGridConfig: e.target.checked
                    ? { rows: 6, cols: 8, shapeType: 'rectangle', dimensions: { widthUnits: 5, heightUnits: 3 } }
                    : null,
                })
              }
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
