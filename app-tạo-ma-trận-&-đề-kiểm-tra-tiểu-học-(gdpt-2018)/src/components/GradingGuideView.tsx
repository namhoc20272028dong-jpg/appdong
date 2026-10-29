/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompleteExamPackage } from '../types/exam';

interface GradingGuideViewProps {
  examPkg: CompleteExamPackage;
}

export const GradingGuideView: React.FC<GradingGuideViewProps> = ({ examPkg }) => {
  const { gradingGuide, grade, subject, semester, header } = examPkg;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-xl font-bold uppercase text-slate-800 tracking-wide">
          HƯỚNG DẪN CHẤM VÀ ĐÁP ÁN BÀI KIỂM TRA ĐỊNH KỲ
        </h2>
        <p className="text-sm text-slate-600 italic mt-1 font-serif">
          Môn: {subject} - Lớp {grade} | Kỳ kiểm tra: {semester} | Thang điểm: 10 điểm
        </p>
      </div>

      {/* 1. Multiple Choice Key */}
      <div className="mb-8">
        <h3 className="text-base font-bold text-slate-900 uppercase font-serif mb-3 pb-1 border-b border-slate-300">
          I. ĐÁP ÁN VÀ BIỂU ĐIỂM TRẮC NGHIỆM
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-900 text-[13px] print:text-[11px] font-serif print:border-black text-center">
            <thead>
              <tr className="bg-slate-100 font-bold print:bg-slate-100">
                <th className="border border-slate-900 px-3 py-2 w-20 print:border-black">Câu số</th>
                <th className="border border-slate-900 px-3 py-2 w-40 print:border-black">Đáp án đúng</th>
                <th className="border border-slate-900 px-3 py-2 w-28 print:border-black">Điểm</th>
                <th className="border border-slate-900 px-4 py-2 text-left print:border-black">Hướng dẫn chấm cụ thể</th>
              </tr>
            </thead>
            <tbody>
              {(gradingGuide.multipleChoice || []).map((mc) => (
                <tr key={mc.questionNumber} className="hover:bg-slate-50 transition">
                  <td className="border border-slate-900 px-3 py-2 font-bold print:border-black">
                    Câu {mc.questionNumber}
                  </td>
                  <td className="border border-slate-900 px-3 py-2 font-bold text-red-700 print:text-black print:border-black">
                    {mc.answer}
                  </td>
                  <td className="border border-slate-900 px-3 py-2 font-semibold print:border-black">
                    {Number(mc.score).toFixed(1).replace('.', ',')} đ
                  </td>
                  <td className="border border-slate-900 px-4 py-2 text-left print:border-black">
                    {mc.note || 'Khoanh hoặc chọn đúng phương án được điểm tối đa'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Essay & Practice Rubrics */}
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900 uppercase font-serif mb-3 pb-1 border-b border-slate-300">
          II. HƯỚNG DẪN CHẤM TỰ LUẬN & THỰC HÀNH CHI TIẾT
        </h3>

        <div className="space-y-4 font-serif">
          {(gradingGuide.essay || []).map((essay) => (
            <div
              key={essay.questionNumber}
              className="p-4 rounded-lg border border-slate-300 bg-slate-50/50 print:border-black print:bg-transparent"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-200 print:border-slate-400">
                <div className="font-bold text-[14px] text-slate-900">
                  Câu {essay.questionNumber} ({Number(essay.score).toFixed(1).replace('.', ',')} điểm) - [{essay.level}] - {essay.topic}
                </div>
                <span className="text-xs font-sans px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold print:border print:border-black">
                  Tự luận {essay.level}
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-[12.5px] print:text-[11px] mb-2">
                <thead>
                  <tr className="bg-slate-200/80 font-bold">
                    <th className="border border-slate-400 px-3 py-1.5 text-left">Yêu cầu nội dung / Các bước thực hiện</th>
                    <th className="border border-slate-400 px-3 py-1.5 w-24 text-center">Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {essay.steps.map((step, sIdx) => (
                    <tr key={sIdx} className="bg-white">
                      <td className="border border-slate-400 px-3 py-2 text-justify">{step.description}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center font-bold text-blue-900 print:text-black">
                        {Number(step.stepScore).toFixed(2).replace('.', ',')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {essay.generalNote && (
                <div className="text-xs text-slate-600 italic mt-1 print:text-black">
                  * Ghi chú của tổ chuyên môn: {essay.generalNote}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Special rubrics for Tiếng Việt */}
      {gradingGuide.readingListeningScore && (
        <div className="mt-6 p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-sm text-slate-800 font-serif">
          <div className="font-bold text-amber-900 mb-1 font-sans text-xs uppercase tracking-wide">
            Hướng dẫn kiểm tra Đọc thành tiếng (Môn Tiếng Việt):
          </div>
          <p className="leading-relaxed">{gradingGuide.readingListeningScore}</p>
        </div>
      )}

      {gradingGuide.writingScore && (
        <div className="mt-4 p-4 bg-blue-50/80 border border-blue-200 rounded-lg text-sm text-slate-800 font-serif">
          <div className="font-bold text-blue-900 mb-1 font-sans text-xs uppercase tracking-wide">
            Hướng dẫn chấm bài Viết (Chính tả & Đoạn văn / Bài văn):
          </div>
          <p className="leading-relaxed">{gradingGuide.writingScore}</p>
        </div>
      )}
    </div>
  );
};
