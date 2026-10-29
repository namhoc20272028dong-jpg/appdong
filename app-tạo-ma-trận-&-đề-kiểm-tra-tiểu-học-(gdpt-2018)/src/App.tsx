/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PRESET_EXAMS } from './data/presetExams';
import { CompleteExamPackage, ExamQuestion } from './types/exam';
import { autoSortQuestions, auditExamRegulations, exportToWordHtmlDoc } from './utils/examRules';
import { ExamHeaderView } from './components/ExamHeaderView';
import { QuestionCard } from './components/QuestionCard';
import { MatrixTable } from './components/MatrixTable';
import { SpecificationTable } from './components/SpecificationTable';
import { GradingGuideView } from './components/GradingGuideView';
import { AuditReportModal } from './components/AuditReportModal';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { QuestionEditorModal } from './components/QuestionEditorModal';
import { ExamShuffleModal } from './components/ExamShuffleModal';

import {
  FileText,
  Table,
  ListOrdered,
  CheckCircle,
  Sparkles,
  Download,
  Printer,
  ShieldCheck,
  Wand2,
  Shuffle,
  BookOpen,
  Plus,
  RefreshCw,
  FolderOpen,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Current active exam package (defaults to Math Grade 3 CK1 preset)
  const [currentExam, setCurrentExam] = useState<CompleteExamPackage>(PRESET_EXAMS[0]);

  // Active view tab: 'exam' | 'matrix' | 'specification' | 'grading' | 'presets'
  const [activeTab, setActiveTab] = useState<'exam' | 'matrix' | 'specification' | 'grading' | 'presets'>('exam');

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);

  // Download menu dropdown
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  // Status notification banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Rule audit summary
  const auditResults = auditExamRegulations(currentExam);
  const passedAudits = auditResults.filter((r) => r.passed).length;
  const isFullyCompliant = passedAudits === auditResults.length;

  // 1-Click Auto-Sort according to GDPT 2018
  const handleAutoSort = () => {
    const sortedQuestions = autoSortQuestions(currentExam.questions);

    // Update specifications order to match sorted questions
    const updatedSpecs = currentExam.specification.map((spec, idx) => ({
      ...spec,
      questionNumber: idx + 1,
    }));

    setCurrentExam({
      ...currentExam,
      questions: sortedQuestions,
      specification: updatedSpecs,
      updatedAt: new Date().toISOString(),
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    showNotification('Đã tự động sắp xếp chuẩn GDPT 2018: Trắc nghiệm (M1->M2) trước, Tự luận (M1->M2->M3) sau!');
  };

  // Question manipulation
  const handleUpdateQuestion = (updatedQ: ExamQuestion) => {
    const newQuestions = currentExam.questions.map((q) => (q.id === updatedQ.id ? updatedQ : q));
    setCurrentExam({
      ...currentExam,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    });
    showNotification(`Đã cập nhật nội dung Câu ${updatedQ.questionNumber}`);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentExam.questions.length) return;

    const list = [...currentExam.questions];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Renumber sequentially
    const renumbered = list.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));

    setCurrentExam({
      ...currentExam,
      questions: renumbered,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (currentExam.questions.length <= 1) return;
    const filtered = currentExam.questions.filter((_, idx) => idx !== index);
    const renumbered = filtered.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));

    setCurrentExam({
      ...currentExam,
      questions: renumbered,
      updatedAt: new Date().toISOString(),
    });
    showNotification('Đã xóa câu hỏi và đánh số lại các câu.');
  };

  const handleAddNewQuestion = () => {
    const newNum = currentExam.questions.length + 1;
    const isLower = currentExam.grade <= 3;
    const newQ: ExamQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: newNum,
      level: 'M2',
      levelName: 'Mức 2 (Hiểu)',
      type: 'multiple_choice',
      typeName: 'TN nhiều lựa chọn',
      topic: currentExam.subject === 'Toán' ? 'Số và phép tính' : 'Đọc hiểu văn bản',
      score: 0.5,
      content: 'Nhập nội dung câu hỏi mới tại đây...',
      options: isLower
        ? [{ key: 'A', text: 'Phương án A' }, { key: 'B', text: 'Phương án B' }, { key: 'C', text: 'Phương án C' }]
        : [
            { key: 'A', text: 'Phương án A' },
            { key: 'B', text: 'Phương án B' },
            { key: 'C', text: 'Phương án C' },
            { key: 'D', text: 'Phương án D' },
          ],
    };

    setCurrentExam({
      ...currentExam,
      questions: [...currentExam.questions, newQ],
      updatedAt: new Date().toISOString(),
    });
    setEditingQuestion(newQ);
  };

  // Regenerate single question using AI
  const handleRegenerateQuestionAi = async (q: ExamQuestion) => {
    showNotification(`Đang dùng AI tạo câu hỏi mới thay thế Câu ${q.questionNumber}...`);
    try {
      const res = await fetch('/api/exam/regenerate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: currentExam.grade,
          subject: currentExam.subject,
          targetQuestion: q,
          topic: q.topic,
          level: q.level,
          type: q.type,
          score: q.score,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      const newQ: ExamQuestion = {
        ...data.data.question,
        id: `q-ai-${Date.now()}`,
        questionNumber: q.questionNumber,
      };

      handleUpdateQuestion(newQ);
      showNotification(`Đã tạo câu hỏi mới thành công cho Câu ${q.questionNumber}!`);
    } catch (err: any) {
      console.error(err);
      showNotification('Không thể tạo lại câu hỏi bằng AI: ' + err.message);
    }
  };

  // Export to Word (.doc)
  const handleExportWord = (type: 'all' | 'exam' | 'matrix' | 'specification' | 'grading') => {
    setIsDownloadMenuOpen(false);
    const blob = exportToWordHtmlDoc(currentExam, type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const typeNames: Record<string, string> = {
      all: 'Tron_Bo_Ho_So_Kiem_Tra',
      exam: 'De_Kiem_Tra_Chinh_Thuc',
      matrix: 'Ma_Tran_De_Kiem_Tra',
      specification: 'Ban_Dac_Ta_Ma_Tran',
      grading: 'Huong_Dan_Cham_Dap_An',
    };
    a.download = `${typeNames[type]}_${currentExam.subject}_Lop${currentExam.grade}_${currentExam.examCode || '101'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Đã xuất file Word (.doc) chuẩn mẫu Bộ GD&ĐT thành công!');
  };

  // Browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 font-sans flex flex-col">
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-3 duration-200">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner & Header (Hidden when printing) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Logo & App Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm font-bold text-lg">
                TH
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                  APP TẠO ĐỀ MA TRẬN VÀ ĐỀ KIỂM TRA TIỂU HỌC
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">
                    GDPT 2018
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Chuyên gia ra đề, ma trận, bản đặc tả & hướng dẫn chấm (Thông tư 27/2020/TT-BGDĐT)
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Compliance Checker Badge */}
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  isFullyCompliant
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
                }`}
                title="Xem báo cáo thẩm định quy chuẩn GDPT 2018"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isFullyCompliant ? 'Đạt chuẩn 100%' : `${passedAudits}/10 tiêu chí`}</span>
              </button>

              {/* AI Generator Button */}
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Tạo đề mới bằng AI
              </button>

              {/* 1-Click Auto-Sort */}
              <button
                onClick={handleAutoSort}
                title="Sắp xếp tự động: Trắc nghiệm (M1->M2) trước, Tự luận (M1->M2->M3) sau"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Wand2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Sắp xếp chuẩn</span>
              </button>

              {/* Exam Shuffle Button */}
              <button
                onClick={() => setIsShuffleModalOpen(true)}
                title="Tạo các mã đề khác nhau (Mã 101, 102, 103...)"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Shuffle className="w-4 h-4 text-slate-600" />
                <span className="hidden md:inline">Trộn đề</span>
              </button>

              {/* Download Word Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất Word (.doc)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {isDownloadMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => handleExportWord('all')}
                      className="w-full text-left px-4 py-2 hover:bg-slate-100 font-semibold text-blue-900 flex items-center gap-2"
                    >
                      <Layers className="w-4 h-4 text-blue-600" />
                      Tải trọn bộ 4 phần (.doc)
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => handleExportWord('exam')}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Chỉ tải Đề kiểm tra
                    </button>
                    <button
                      onClick={() => handleExportWord('matrix')}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2"
                    >
                      <Table className="w-3.5 h-3.5 text-slate-500" />
                      Chỉ tải Ma trận đề
                    </button>
                    <button
                      onClick={() => handleExportWord('specification')}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2"
                    >
                      <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                      Chỉ tải Bản đặc tả ma trận
                    </button>
                    <button
                      onClick={() => handleExportWord('grading')}
                      className="w-full text-left px-4 py-1.5 hover:bg-slate-100 text-slate-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                      Chỉ tải Hướng dẫn chấm
                    </button>
                  </div>
                )}
              </div>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="In hoặc Lưu thành PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 sm:gap-2 mt-3 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('exam')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'exam'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              1. Đề kiểm tra chính thức ({currentExam.questions.length} câu)
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              2. Bảng Ma trận đề
            </button>

            <button
              onClick={() => setActiveTab('specification')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'specification'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              3. Bản đặc tả ma trận
            </button>

            <button
              onClick={() => setActiveTab('grading')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'grading'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              4. Hướng dẫn chấm & Đáp án
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                activeTab === 'presets'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Ngân hàng đề mẫu chuẩn (Lớp 1 - 5)
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Active Exam Overview Pill (Hidden in Print) */}
        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 print:hidden shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">
              Môn {currentExam.subject} - Lớp {currentExam.grade}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
              {currentExam.semester}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
              {currentExam.curriculum}
            </span>
            {currentExam.examCode && (
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                Mã đề: {currentExam.examCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              Tổng số câu: <b className="text-slate-900">{currentExam.questions.length} câu</b>
            </span>
            <span>
              Tổng điểm:{' '}
              <b className="text-slate-900">
                {currentExam.questions.reduce((s, q) => s + (Number(q.score) || 0), 0).toFixed(1).replace('.', ',')} đ
              </b>
            </span>
          </div>
        </div>

        {/* TAB 1: OFFICIAL EXAM SHEET */}
        {activeTab === 'exam' && (
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0">
            {/* Standard MOET Header */}
            <ExamHeaderView
              header={currentExam.header}
              subject={currentExam.subject}
              grade={currentExam.grade}
              examCode={currentExam.examCode}
              onUpdateHeader={(newH) => setCurrentExam({ ...currentExam, header: newH })}
            />

            {/* Reading Passage (if Tiếng Việt) */}
            {currentExam.readingPassage && currentExam.readingPassage.content && (
              <div className="my-6 p-4 sm:p-6 rounded-xl border border-slate-300 bg-slate-50/70 font-serif print:bg-transparent print:border-black">
                <div className="text-center font-bold text-[14pt] text-slate-900 uppercase">
                  {currentExam.readingPassage.title}
                </div>
                <div className="text-center italic text-xs text-slate-500 mb-3 font-sans print:text-black">
                  ({currentExam.readingPassage.genre || 'Văn bản đọc ngoài SGK'} - Khoảng {currentExam.readingPassage.wordCount} chữ - Tác giả: {currentExam.readingPassage.author || 'Sưu tầm'})
                </div>
                <div className="text-justify text-[13pt] leading-relaxed text-slate-800 space-y-2">
                  {currentExam.readingPassage.content.split('\n').filter((p) => p.trim()).map((p, idx) => (
                    <p key={idx} className="indent-8">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Questions List (STRICTLY NO SECTION HEADER!) */}
            <div className="divide-y divide-slate-100 print:divide-none">
              {currentExam.questions.map((q, idx) => (
                <QuestionCard
                  key={q.id || idx}
                  question={q}
                  grade={currentExam.grade}
                  totalQuestions={currentExam.questions.length}
                  isFirst={idx === 0}
                  isLast={idx === currentExam.questions.length - 1}
                  onEdit={(target) => setEditingQuestion(target)}
                  onRegenerateAi={(target) => handleRegenerateQuestionAi(target)}
                  onMoveUp={() => handleMoveQuestion(idx, 'up')}
                  onMoveDown={() => handleMoveQuestion(idx, 'down')}
                  onDelete={() => handleDeleteQuestion(idx)}
                />
              ))}
            </div>

            {/* Add Question Button (Print hidden) */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between print:hidden">
              <button
                onClick={handleAddNewQuestion}
                className="px-4 py-2 border border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                Thêm câu hỏi mới vào đề
              </button>

              <button
                onClick={handleAutoSort}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                Sắp xếp chuẩn quy chế (Trắc nghiệm M1-M2 trước, Tự luận M1-M3 sau)
              </button>
            </div>

            {/* Writing Section (Tiếng Việt) */}
            {currentExam.writingSection && (currentExam.writingSection.dictation || currentExam.writingSection.compositionPrompt) && (
              <div className="mt-10 pt-6 border-t-2 border-slate-900 font-serif print:page-break-before">
                <div className="text-center font-bold text-[14pt] text-slate-900 uppercase mb-4">
                  BÀI KIỂM TRA VIẾT (MÔN TIẾNG VIỆT)
                </div>

                {currentExam.writingSection.dictation && (
                  <div className="mb-6">
                    <div className="font-bold text-[13pt] text-slate-900 mb-1">
                      1. Chính tả (Nghe - viết):
                    </div>
                    <p className="text-justify text-[13pt] leading-relaxed indent-8 text-slate-800">
                      {currentExam.writingSection.dictation}
                    </p>
                  </div>
                )}

                {currentExam.writingSection.compositionPrompt && (
                  <div className="mb-4">
                    <div className="font-bold text-[13pt] text-slate-900 mb-1">
                      2. Viết đoạn văn / Bài văn:
                    </div>
                    <p className="text-[13pt] text-slate-800 mb-3">
                      <b>Đề bài:</b> {currentExam.writingSection.compositionPrompt}
                    </p>
                    <div className="space-y-4 pt-1">
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <div key={idx} className="border-b border-dotted border-slate-400 h-2"></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MATRIX TABLE */}
        {activeTab === 'matrix' && <MatrixTable examPkg={currentExam} />}

        {/* TAB 3: SPECIFICATIONS */}
        {activeTab === 'specification' && <SpecificationTable examPkg={currentExam} />}

        {/* TAB 4: GRADING GUIDE */}
        {activeTab === 'grading' && <GradingGuideView examPkg={currentExam} />}

        {/* TAB 5: PRESETS BANK */}
        {activeTab === 'presets' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                Ngân hàng đề kiểm tra mẫu chuẩn GDPT 2018 (Lớp 1 đến Lớp 5)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Các bộ đề được xây dựng bởi Chuyên gia sư phạm tiểu học, tích hợp đầy đủ 4 phần (Ma trận, Đặc tả, Đề 10 câu, Đáp án) chuẩn Thông tư 27.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_EXAMS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    setCurrentExam(preset);
                    setActiveTab('exam');
                    showNotification(`Đã mở bộ đề: ${preset.subject} - Lớp ${preset.grade}`);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
                    currentExam.id === preset.id
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Lớp {preset.grade} • {preset.subject}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5">{preset.header.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{preset.curriculum}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                      10 câu
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>Thời gian: {preset.header.duration}</span>
                    <span className="text-blue-600 hover:underline">Sử dụng bộ đề này →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-500 print:hidden font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            Hệ thống hỗ trợ Giáo viên Tiểu học tạo Ma trận và Đề kiểm tra định kỳ theo Chương trình GDPT 2018
          </div>
          <div className="flex items-center gap-3">
            <span>Thông tư 27/2020/TT-BGDĐT</span>
            <span>•</span>
            <span>Chuẩn 10 câu liên tục</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        examPkg={currentExam}
        onApplyAutoFix={handleAutoSort}
      />

      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onExamGenerated={(newExam) => {
          setCurrentExam(newExam);
          setActiveTab('exam');
          showNotification(`Đã tạo thành công bộ đề: ${newExam.subject} Lớp ${newExam.grade}`);
        }}
      />

      <QuestionEditorModal
        isOpen={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        question={editingQuestion}
        grade={currentExam.grade}
        onSaveQuestion={handleUpdateQuestion}
      />

      <ExamShuffleModal
        isOpen={isShuffleModalOpen}
        onClose={() => setIsShuffleModalOpen(false)}
        examPkg={currentExam}
        onApplyVariant={(variant) => {
          setCurrentExam(variant);
          showNotification(`Đã chuyển sang Mã đề ${variant.examCode}`);
        }}
      />
    </div>
  );
}
