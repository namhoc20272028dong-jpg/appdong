/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExamHeader } from '../types/exam';
import { Edit3, Check } from 'lucide-react';

interface ExamHeaderViewProps {
  header: ExamHeader;
  subject: string;
  grade: number;
  examCode?: string;
  onUpdateHeader?: (newHeader: ExamHeader) => void;
  readOnly?: boolean;
}

export const ExamHeaderView: React.FC<ExamHeaderViewProps> = ({
  header,
  subject,
  grade,
  examCode,
  onUpdateHeader,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ExamHeader>({ ...header });

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdateHeader) {
      onUpdateHeader(formData);
    }
  };

  return (
    <div className="relative font-serif text-slate-900 border-b-2 border-slate-900 pb-5 mb-6 print:border-black">
      {!readOnly && (
        <div className="absolute right-0 -top-8 print:hidden flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="px-2.5 py-1 text-xs font-sans font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1 shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" /> Lưu tiêu đề
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2.5 py-1 text-xs font-sans font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 border border-slate-300 transition"
              title="Chỉnh sửa thông tin trường, phòng GD&ĐT, thời gian..."
            >
              <Edit3 className="w-3.5 h-3.5" /> Đổi thông tin trường
            </button>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200 mb-4 font-sans text-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cơ quan / Phòng GD&ĐT:</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên trường Tiểu học:</label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề bài kiểm tra:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học:</label>
              <input
                type="text"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian làm bài:</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Official MOET Administrative Layout */}
      <div className="grid grid-cols-12 gap-2 text-center items-start mb-4">
        {/* Left column */}
        <div className="col-span-5 text-center leading-snug">
          <div className="text-[13px] uppercase font-normal tracking-wide">
            {header.department || 'PHÒNG GIÁO DỤC VÀ ĐÀO TẠO'}
          </div>
          <div className="text-[14px] uppercase font-bold tracking-wide mt-0.5">
            {header.school || 'TRƯỜNG TIỂU HỌC CHU VĂN AN'}
          </div>
          <div className="w-24 h-[1px] bg-slate-900 mx-auto mt-1.5"></div>
          {examCode && (
            <div className="mt-2 text-xs font-sans font-semibold text-slate-600 print:text-black">
              Mã đề: <span className="font-bold text-slate-900">{examCode}</span>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-7 text-center leading-snug">
          <div className="text-[14px] uppercase font-bold tracking-wide">
            {header.title || 'BÀI KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I'}
          </div>
          <div className="text-[13px] font-bold mt-0.5">
            {header.schoolYear || 'NĂM HỌC 2026 - 2027'}
          </div>
          <div className="text-[15px] font-bold text-blue-900 print:text-black uppercase mt-1">
            MÔN: {subject.toUpperCase()} - LỚP {grade}
          </div>
          <div className="text-[12px] italic text-slate-700 print:text-black mt-0.5">
            (Thời gian làm bài: {header.duration || '40 phút'} - Không kể thời gian phát đề)
          </div>
        </div>
      </div>

      {/* Student info & Score box table */}
      <table className="w-full border-collapse border border-slate-900 text-[13px] print:border-black">
        <tbody>
          <tr>
            <td colSpan={2} className="border border-slate-900 px-3 py-2 print:border-black">
              <span className="font-semibold">Họ và tên học sinh:</span> ........................................................................................
              <span className="font-semibold ml-4">Lớp:</span> {grade}...
            </td>
          </tr>
          <tr className="h-20">
            <td className="w-1/4 border border-slate-900 text-center align-top p-2 print:border-black">
              <div className="font-bold text-[14px]">ĐIỂM</div>
              <div className="text-[11px] text-slate-500 print:text-black mt-1">(Bằng số / Bằng chữ)</div>
            </td>
            <td className="w-3/4 border border-slate-900 align-top p-2.5 print:border-black">
              <div className="font-bold text-[13px] mb-1">LỜI NHẬN XÉT CỦA GIÁO VIÊN:</div>
              <div className="border-b border-dotted border-slate-400 h-5"></div>
              <div className="border-b border-dotted border-slate-400 h-5"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
