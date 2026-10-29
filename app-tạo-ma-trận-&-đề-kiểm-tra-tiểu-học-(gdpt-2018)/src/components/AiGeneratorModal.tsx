/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GradeLevel, SubjectName, SemesterPeriod, CompleteExamPackage } from '../types/exam';
import { Sparkles, X, Check, Loader2, BookOpen, School, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamGenerated: (exam: CompleteExamPackage) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onExamGenerated,
}) => {
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [subject, setSubject] = useState<SubjectName>('Toán');
  const [semester, setSemester] = useState<SemesterPeriod>('Cuối Học kì I');
  const [curriculum, setCurriculum] = useState('Kết nối tri thức với cuộc sống');
  const [examDuration, setExamDuration] = useState(40);
  const [multipleChoiceRatio, setMultipleChoiceRatio] = useState(70);
  const [topicFocus, setTopicFocus] = useState('');
  const [schoolName, setSchoolName] = useState('Trường Tiểu học Chu Văn An');
  const [district, setDistrict] = useState('Phòng GD&ĐT Quận Ba Đình');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Available subjects per grade
  const getSubjectsForGrade = (g: GradeLevel): SubjectName[] => {
    if (g <= 2) return ['Toán', 'Tiếng Việt', 'Tự nhiên và Xã hội', 'Đạo đức'];
    if (g === 3) return ['Toán', 'Tiếng Việt', 'Tin học', 'Công nghệ', 'Tự nhiên và Xã hội', 'Đạo đức'];
    return ['Toán', 'Tiếng Việt', 'Tin học', 'Khoa học', 'Lịch sử và Địa lí', 'Công nghệ', 'Đạo đức'];
  };

  const availableSubjects = getSubjectsForGrade(grade);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          subject,
          semester,
          curriculum,
          examDuration,
          totalQuestions: 10,
          multipleChoiceRatio,
          topicFocus,
          schoolName,
          district,
        }),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Không thể tạo đề kiểm tra');
      }

      const generated = resData.data;

      // Construct CompleteExamPackage
      const newPackage: CompleteExamPackage = {
        id: `ai-exam-${Date.now()}`,
        grade,
        subject,
        semester,
        curriculum,
        examCode: '101',
        totalQuestions: 10,
        header: {
          department: district,
          school: schoolName,
          title: `BÀI KIỂM TRA ĐỊNH KỲ ${semester.toUpperCase()}`,
          schoolYear: 'NĂM HỌC 2026 - 2027',
          subject: `${subject.toUpperCase()} - LỚP ${grade}`,
          duration: `${examDuration} phút`,
        },
        matrix: generated.matrix,
        specification: generated.specification,
        questions: (generated.exam?.questions || []).map((q: any, idx: number) => ({
          ...q,
          questionNumber: idx + 1,
        })),
        readingPassage: generated.exam?.readingPassage || null,
        writingSection: generated.exam?.writingSection || null,
        gradingGuide: generated.gradingGuide,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}

      onExamGenerated(newPackage);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã có lỗi xảy ra trong quá trình khởi tạo đề kiểm tra bằng AI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Tạo đề kiểm tra mới bằng Trợ lý AI</h3>
              <p className="text-xs text-blue-100">
                Tự động xây dựng trọn bộ Ma trận, Đặc tả, Đề 10 câu & Đáp án chuẩn GDPT 2018
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm font-sans">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs leading-relaxed">
              <b>Lỗi:</b> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grade Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp:</label>
              <select
                value={grade}
                onChange={(e) => {
                  const newGrade = Number(e.target.value) as GradeLevel;
                  setGrade(newGrade);
                  const validSubs = getSubjectsForGrade(newGrade);
                  if (!validSubs.includes(subject)) {
                    setSubject(validSubs[0]);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium"
              >
                <option value={1}>Lớp 1 (3 phương án A, B, C)</option>
                <option value={2}>Lớp 2 (3 phương án A, B, C)</option>
                <option value={3}>Lớp 3 (3 phương án A, B, C)</option>
                <option value={4}>Lớp 4 (4 phương án A, B, C, D)</option>
                <option value={5}>Lớp 5 (4 phương án A, B, C, D)</option>
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectName)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Semester */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kỳ kiểm tra:</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as SemesterPeriod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
              >
                <option value="Giữa Học kì I">Giữa Học kì I</option>
                <option value="Cuối Học kì I">Cuối Học kì I</option>
                <option value="Giữa Học kì II">Giữa Học kì II</option>
                <option value="Cuối Năm học">Cuối Năm học (Cuối Học kì II)</option>
              </select>
            </div>

            {/* Curriculum */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bộ sách giáo khoa:</label>
              <select
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
              >
                <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
                <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                <option value="Cánh diều">Cánh diều</option>
                <option value="Chung toàn diện GDPT 2018">Chung toàn diện GDPT 2018</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Multiple Choice Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tỉ lệ Trắc nghiệm / Tự luận:
              </label>
              <select
                value={multipleChoiceRatio}
                onChange={(e) => setMultipleChoiceRatio(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
              >
                <option value={70}>Trắc nghiệm 70% (7 điểm) - Tự luận 30% (3 điểm) (Môn Toán chuẩn)</option>
                <option value={60}>Trắc nghiệm 60% (6 điểm) - Tự luận 40% (4 điểm)</option>
                <option value={50}>Trắc nghiệm 50% (5 điểm) - Tự luận 50% (5 điểm)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian làm bài:</label>
              <input
                type="number"
                value={examDuration}
                onChange={(e) => setExamDuration(Number(e.target.value))}
                min={20}
                max={90}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* School and District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng Giáo dục & Đào tạo:</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trường Tiểu học:</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white text-xs"
              />
            </div>
          </div>

          {/* Topic Focus */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chủ đề trọng tâm hoặc yêu cầu sư phạm riêng biệt (Tùy chọn):
            </label>
            <textarea
              rows={2}
              value={topicFocus}
              onChange={(e) => setTopicFocus(e.target.value)}
              placeholder="Ví dụ: Tập trung vào phép nhân chia phạm vi 1000, có câu vẽ hình chữ nhật trên lưới ô vuông; hoặc bài đọc về tình cảm gia đình..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white text-xs placeholder:text-slate-400"
            />
          </div>

          {/* Strict Pedagogical Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-blue-700" />
              Hệ thống tự động áp dụng 100% quy chuẩn Bộ GD&ĐT:
            </div>
            <ul className="list-disc list-inside text-blue-800 text-[11.5px] space-y-0.5 pl-1">
              <li>Đề gồm 10 câu liên tục (Câu 1 đến Câu 10), không phân đề mục Trắc nghiệm/Tự luận.</li>
              <li>Trắc nghiệm xếp trước (M1 trước, M2 sau), Tự luận xếp sau (M1 &rarr; M2 &rarr; M3).</li>
              <li>Tuyệt đối không có trắc nghiệm ở Mức 3 (Vận dụng).</li>
              <li>Lớp 1, 2, 3 có 3 lựa chọn (A, B, C); Lớp 4, 5 có 4 lựa chọn (A, B, C, D).</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang soạn thảo đề & ma trận chuẩn GDPT 2018...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Khởi tạo hồ sơ kiểm tra
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
