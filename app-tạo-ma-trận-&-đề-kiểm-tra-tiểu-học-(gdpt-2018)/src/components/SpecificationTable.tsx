/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompleteExamPackage, SpecificationItem } from '../types/exam';

interface SpecificationTableProps {
  examPkg: CompleteExamPackage;
}

export const SpecificationTable: React.FC<SpecificationTableProps> = ({ examPkg }) => {
  const { specification, grade, subject, semester } = examPkg;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-xl font-bold uppercase text-slate-800 tracking-wide">
          BẢNG ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ {semester.toUpperCase()}
        </h2>
        <p className="text-sm text-slate-600 italic mt-1 font-serif">
          Môn: {subject} - Lớp {grade} | Khung chuẩn Đánh giá năng lực học sinh tiểu học (Thông tư 27/2020/TT-BGDĐT)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-slate-900 text-[12.5px] print:text-[11px] font-serif print:border-black">
          <thead>
            <tr className="bg-slate-100 font-bold text-center print:bg-slate-100">
              <th className="border border-slate-900 px-2 py-2 w-10 print:border-black">STT</th>
              <th className="border border-slate-900 px-3 py-2 w-48 text-left print:border-black">Mạch kiến thức / Chủ đề</th>
              <th className="border border-slate-900 px-3 py-2 text-left print:border-black">Yêu cầu cần đạt (Mô tả chi tiết năng lực)</th>
              <th className="border border-slate-900 px-2 py-2 w-16 print:border-black">Mức độ</th>
              <th className="border border-slate-900 px-2 py-2 w-16 print:border-black">Câu số</th>
              <th className="border border-slate-900 px-2 py-2 w-36 print:border-black">Hình thức câu</th>
              <th className="border border-slate-900 px-2 py-2 w-16 print:border-black">Điểm</th>
            </tr>
          </thead>
          <tbody>
            {(specification || []).map((spec, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="border border-slate-900 px-2 py-2.5 text-center print:border-black font-medium">
                  {spec.order || idx + 1}
                </td>
                <td className="border border-slate-900 px-3 py-2.5 print:border-black font-semibold text-slate-800">
                  {spec.topic}
                </td>
                <td className="border border-slate-900 px-3 py-2.5 print:border-black text-justify leading-relaxed">
                  {spec.competency}
                </td>
                <td className="border border-slate-900 px-2 py-2.5 text-center print:border-black">
                  <span
                    className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                      spec.level === 'M1'
                        ? 'bg-blue-100 text-blue-800'
                        : spec.level === 'M2'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {spec.level}
                  </span>
                </td>
                <td className="border border-slate-900 px-2 py-2.5 text-center print:border-black font-bold">
                  Câu {spec.questionNumber}
                </td>
                <td className="border border-slate-900 px-2 py-2.5 text-center print:border-black text-slate-700">
                  {spec.questionType}
                </td>
                <td className="border border-slate-900 px-2 py-2.5 text-center print:border-black font-bold">
                  {Number(spec.score).toFixed(1).replace('.', ',')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 print:hidden font-sans">
        <span className="font-semibold text-slate-800">Lưu ý chuyên môn:</span> Theo quy chuẩn ra đề tiểu học, mỗi câu hỏi trong đề ứng với một đặc tả riêng biệt, phản ánh đúng một yêu cầu cần đạt trong chương trình môn học.
      </div>
    </div>
  );
};
