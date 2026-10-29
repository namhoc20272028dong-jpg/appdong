/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompleteExamPackage, MatrixRow } from '../types/exam';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface MatrixTableProps {
  examPkg: CompleteExamPackage;
  onUpdateMatrixRow?: (index: number, updatedRow: MatrixRow) => void;
}

export const MatrixTable: React.FC<MatrixTableProps> = ({ examPkg }) => {
  const { matrix, grade, subject, semester } = examPkg;
  const rows = matrix?.rows || [];
  const summary = matrix?.summary;

  // Calculate live question totals from examPkg.questions
  const questions = examPkg.questions || [];
  const tnQuestions = questions.filter((q) => q.type !== 'essay' && q.type !== 'practice');
  const tlQuestions = questions.filter((q) => q.type === 'essay' || q.type === 'practice');

  const m1Questions = questions.filter((q) => q.level === 'M1');
  const m2Questions = questions.filter((q) => q.level === 'M2');
  const m3Questions = questions.filter((q) => q.level === 'M3');

  const totalScore = questions.reduce((s, q) => s + (Number(q.score) || 0), 0);
  const tnScore = tnQuestions.reduce((s, q) => s + (Number(q.score) || 0), 0);
  const tlScore = totalScore - tnScore;

  const m1Score = m1Questions.reduce((s, q) => s + (Number(q.score) || 0), 0);
  const m2Score = m2Questions.reduce((s, q) => s + (Number(q.score) || 0), 0);
  const m3Score = m3Questions.reduce((s, q) => s + (Number(q.score) || 0), 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* Title & Metadata */}
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-xl font-bold uppercase text-slate-800 tracking-wide">
          BẢNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ {semester.toUpperCase()}
        </h2>
        <p className="text-sm text-slate-600 italic mt-1 font-serif">
          Môn: {subject} - Lớp {grade} | Thời gian làm bài: {examPkg.header.duration || '40 phút'} | Chương trình GDPT 2018
        </p>
      </div>

      {/* Metric summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 print:hidden">
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
          <div className="text-xs text-blue-700 font-semibold uppercase">Mức 1 (Biết)</div>
          <div className="text-lg font-bold text-blue-900 mt-0.5">
            {m1Questions.length} câu • {m1Score.toFixed(1).replace('.', ',')} đ
          </div>
          <div className="text-[11px] text-blue-600">
            {totalScore > 0 ? ((m1Score / totalScore) * 100).toFixed(0) : 0}% (Chuẩn ~50%)
          </div>
        </div>

        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-center">
          <div className="text-xs text-emerald-700 font-semibold uppercase">Mức 2 (Hiểu)</div>
          <div className="text-lg font-bold text-emerald-900 mt-0.5">
            {m2Questions.length} câu • {m2Score.toFixed(1).replace('.', ',')} đ
          </div>
          <div className="text-[11px] text-emerald-600">
            {totalScore > 0 ? ((m2Score / totalScore) * 100).toFixed(0) : 0}% (Chuẩn ~30%)
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-center">
          <div className="text-xs text-amber-700 font-semibold uppercase">Mức 3 (Vận dụng)</div>
          <div className="text-lg font-bold text-amber-900 mt-0.5">
            {m3Questions.length} câu • {m3Score.toFixed(1).replace('.', ',')} đ
          </div>
          <div className="text-[11px] text-amber-600">
            {totalScore > 0 ? ((m3Score / totalScore) * 100).toFixed(0) : 0}% (Chuẩn ~20%)
          </div>
        </div>

        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-center">
          <div className="text-xs text-purple-700 font-semibold uppercase">Tỉ lệ TN / TL</div>
          <div className="text-lg font-bold text-purple-900 mt-0.5">
            {tnScore.toFixed(1).replace('.', ',')}đ / {tlScore.toFixed(1).replace('.', ',')}đ
          </div>
          <div className="text-[11px] text-purple-600">
            {totalScore > 0 ? ((tnScore / totalScore) * 100).toFixed(0) : 0}% TN -{' '}
            {totalScore > 0 ? ((tlScore / totalScore) * 100).toFixed(0) : 0}% TL
          </div>
        </div>
      </div>

      {/* MOET Standard Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-900 text-[12.5px] print:text-[11px] text-center font-serif print:border-black">
          <thead>
            <tr className="bg-slate-100 font-bold print:bg-slate-100">
              <th rowSpan={2} className="border border-slate-900 px-2 py-2 w-10 print:border-black">
                STT
              </th>
              <th rowSpan={2} className="border border-slate-900 px-3 py-2 text-left min-w-[200px] print:border-black">
                Mạch kiến thức / Chủ đề
              </th>
              <th colSpan={2} className="border border-slate-900 px-2 py-1 bg-blue-50/70 print:border-black">
                Mức 1 (Biết)
              </th>
              <th colSpan={2} className="border border-slate-900 px-2 py-1 bg-emerald-50/70 print:border-black">
                Mức 2 (Hiểu)
              </th>
              <th className="border border-slate-900 px-2 py-1 bg-amber-50/70 print:border-black">
                Mức 3 (Vận dụng)
              </th>
              <th colSpan={3} className="border border-slate-900 px-2 py-1 bg-slate-200/80 print:border-black">
                Tổng cộng
              </th>
            </tr>
            <tr className="bg-slate-50 font-semibold">
              <th className="border border-slate-900 px-2 py-1 w-12 print:border-black text-blue-900">TN</th>
              <th className="border border-slate-900 px-2 py-1 w-12 print:border-black text-blue-900">TL</th>
              <th className="border border-slate-900 px-2 py-1 w-12 print:border-black text-emerald-900">TN</th>
              <th className="border border-slate-900 px-2 py-1 w-12 print:border-black text-emerald-900">TL</th>
              <th className="border border-slate-900 px-2 py-1 w-16 print:border-black text-amber-900">TL (*)</th>
              <th className="border border-slate-900 px-2 py-1 w-14 print:border-black">Số câu</th>
              <th className="border border-slate-900 px-2 py-1 w-14 print:border-black">Số điểm</th>
              <th className="border border-slate-900 px-2 py-1 w-14 print:border-black">Tỉ lệ %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="border border-slate-900 px-2 py-2 print:border-black">{idx + 1}</td>
                <td className="border border-slate-900 px-3 py-2 text-left font-medium print:border-black">
                  {row.topic}
                </td>
                <td className="border border-slate-900 px-2 py-2 print:border-black">{row.m1_tn_count || '-'}</td>
                <td className="border border-slate-900 px-2 py-2 print:border-black">{row.m1_tl_count || '-'}</td>
                <td className="border border-slate-900 px-2 py-2 print:border-black">{row.m2_tn_count || '-'}</td>
                <td className="border border-slate-900 px-2 py-2 print:border-black">{row.m2_tl_count || '-'}</td>
                <td className="border border-slate-900 px-2 py-2 font-medium print:border-black">{row.m3_tl_count || '-'}</td>
                <td className="border border-slate-900 px-2 py-2 font-bold bg-slate-50/50 print:border-black">
                  {row.total_count}
                </td>
                <td className="border border-slate-900 px-2 py-2 font-bold bg-slate-50/50 print:border-black">
                  {Number(row.total_score).toFixed(1).replace('.', ',')}
                </td>
                <td className="border border-slate-900 px-2 py-2 font-medium print:border-black">
                  {row.percentage}%
                </td>
              </tr>
            ))}

            {/* Total Questions Row */}
            <tr className="bg-slate-100 font-bold print:border-black">
              <td colSpan={2} className="border border-slate-900 px-3 py-2 text-center print:border-black uppercase">
                TỔNG SỐ CÂU
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black">
                {rows.reduce((s, r) => s + (r.m1_tn_count || 0), 0)}
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black">
                {rows.reduce((s, r) => s + (r.m1_tl_count || 0), 0)}
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black">
                {rows.reduce((s, r) => s + (r.m2_tn_count || 0), 0)}
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black">
                {rows.reduce((s, r) => s + (r.m2_tl_count || 0), 0)}
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black">
                {rows.reduce((s, r) => s + (r.m3_tl_count || 0), 0)}
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black text-blue-900 text-sm">
                {summary?.grand_total_questions || questions.length}
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black text-blue-900 text-sm">
                {Number(summary?.grand_total_score || totalScore).toFixed(1).replace('.', ',')}
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black text-sm">100%</td>
            </tr>

            {/* Total Points Row */}
            <tr className="bg-slate-200/90 font-bold print:border-black">
              <td colSpan={2} className="border border-slate-900 px-3 py-2 text-center print:border-black uppercase">
                TỔNG SỐ ĐIỂM
              </td>
              <td colSpan={2} className="border border-slate-900 px-2 py-2 print:border-black">
                {Number(summary?.m1_score || m1Score).toFixed(1).replace('.', ',')} đ ({summary?.m1_pct || 20}%)
              </td>
              <td colSpan={2} className="border border-slate-900 px-2 py-2 print:border-black">
                {Number(summary?.m2_score || m2Score).toFixed(1).replace('.', ',')} đ ({summary?.m2_pct || 50}%)
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black">
                {Number(summary?.m3_score || m3Score).toFixed(1).replace('.', ',')} đ ({summary?.m3_pct || 30}%)
              </td>
              <td colSpan={2} className="border border-slate-900 px-2 py-2 print:border-black text-sm">
                10,0 điểm
              </td>
              <td className="border border-slate-900 px-2 py-2 print:border-black text-sm">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-500 italic print:text-black font-serif">
        (*) Ghi chú theo quy định GDPT 2018: Tuyệt đối không tạo câu hỏi trắc nghiệm ở Mức 3 (Vận dụng). Toàn bộ câu hỏi Mức 3 là hình thức Tự luận để đánh giá năng lực giải quyết vấn đề của học sinh.
      </div>
    </div>
  );
};
