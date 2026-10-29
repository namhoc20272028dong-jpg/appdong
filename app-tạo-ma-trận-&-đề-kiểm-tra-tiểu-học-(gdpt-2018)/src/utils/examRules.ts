/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompleteExamPackage, ExamQuestion, RuleAuditItem, QuestionType, CognitiveLevel } from '../types/exam';

// Rank order for sorting questions according to user guidelines
export function getQuestionSortWeight(q: ExamQuestion): number {
  const isTN = q.type !== 'essay' && q.type !== 'practice';

  if (isTN) {
    // Trắc nghiệm: M1 before M2
    // Inside M1: NLC (1) -> ĐS (2) -> NC (3) -> ĐK (4)
    // Inside M2: NLC (5) -> ĐS (6) -> NC (7) -> ĐK (8)
    const baseLevel = q.level === 'M1' ? 100 : 200;
    let typeOffset = 10;
    if (q.type === 'multiple_choice') typeOffset = 10;
    else if (q.type === 'true_false') typeOffset = 20;
    else if (q.type === 'matching') typeOffset = 30;
    else if (q.type === 'fill_in_the_blank') typeOffset = 40;
    return baseLevel + typeOffset;
  } else {
    // Tự luận & Thực hành: M1 -> M2 -> M3 (HS tư duy từ dễ đến khó)
    if (q.level === 'M1') return 500;
    if (q.level === 'M2') return 600;
    return 700; // M3 Vận dụng
  }
}

/**
 * Automatically sorts questions according to the official GDPT 2018 primary school guideline:
 * 1. Trắc nghiệm (M1: NLC -> ĐS -> NC -> ĐK -> M2: NLC -> ĐS -> NC -> ĐK)
 * 2. Tự luận (M1 -> M2 -> M3)
 * Then re-numbers from Câu 1 to Câu N consecutively.
 */
export function autoSortQuestions(questions: ExamQuestion[]): ExamQuestion[] {
  const sorted = [...questions].sort((a, b) => {
    const weightA = getQuestionSortWeight(a);
    const weightB = getQuestionSortWeight(b);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return 0;
  });

  // Renumber from 1 to N
  return sorted.map((q, idx) => ({
    ...q,
    questionNumber: idx + 1,
  }));
}

/**
 * Validates the complete exam package against all regulations
 */
export function auditExamRegulations(examPkg: CompleteExamPackage): RuleAuditItem[] {
  const audits: RuleAuditItem[] = [];
  const questions = examPkg.questions || [];
  const grade = examPkg.grade;
  const isLowerGrade = grade <= 3;
  const expectedChoices = isLowerGrade ? 3 : 4;

  // Rule 1: Tổng số câu hỏi là 10 câu
  audits.push({
    ruleId: 'total_questions',
    title: 'Tổng số câu hỏi chuẩn (10 câu)',
    description: 'Quy định chuẩn toàn cấp tiểu học từ lớp 1 đến lớp 5 là 10 câu hỏi.',
    passed: questions.length === 10,
    severity: questions.length === 10 ? 'info' : 'warning',
    details: `Hiện tại đề có ${questions.length} câu (Chuẩn: 10 câu).`,
  });

  // Rule 2: Đánh số thứ tự liên tục từ Câu 1 đến câu cuối
  const isSequential = questions.every((q, idx) => q.questionNumber === idx + 1);
  audits.push({
    ruleId: 'sequential_numbering',
    title: 'Đánh số liên tục từ Câu 1 đến hết đề',
    description: 'Thứ tự câu đánh số liên tục Câu 1, Câu 2... không ngắt quãng.',
    passed: isSequential,
    severity: isSequential ? 'info' : 'error',
    details: isSequential
      ? 'Đã đánh số liên tục 1 đến ' + questions.length
      : 'Thứ tự đánh số câu chưa liên tục hoặc bị gián đoạn.',
  });

  // Rule 3: KHÔNG có trắc nghiệm ở Mức 3 (Vận dụng)
  const hasTnLevel3 = questions.some(
    (q) => q.level === 'M3' && q.type !== 'essay' && q.type !== 'practice'
  );
  audits.push({
    ruleId: 'no_m3_multiple_choice',
    title: 'Không tạo câu trắc nghiệm ở Mức 3 (Vận dụng)',
    description: 'Mức 3 Vận dụng bắt buộc phải là câu Tự luận để đánh giá năng lực tư duy.',
    passed: !hasTnLevel3,
    severity: !hasTnLevel3 ? 'info' : 'error',
    details: hasTnLevel3
      ? 'Phát hiện có câu hỏi trắc nghiệm được xếp ở Mức 3 (Vận dụng) - cần chuyển sang Tự luận.'
      : 'Đạt: Tất cả câu trắc nghiệm đều ở Mức 1 (Biết) hoặc Mức 2 (Hiểu).',
  });

  // Rule 4: Trắc nghiệm xếp trước, Tự luận xếp sau
  let seenEssay = false;
  let tnAfterEssay = false;
  for (const q of questions) {
    if (q.type === 'essay' || q.type === 'practice') {
      seenEssay = true;
    } else if (seenEssay) {
      tnAfterEssay = true;
      break;
    }
  }
  audits.push({
    ruleId: 'tn_before_essay',
    title: 'Sắp xếp Trắc nghiệm trước – Tự luận sau',
    description: 'Đề kiểm tra bắt buộc xếp toàn bộ câu trắc nghiệm trước, sau đó mới đến các câu tự luận.',
    passed: !tnAfterEssay,
    severity: !tnAfterEssay ? 'info' : 'error',
    details: tnAfterEssay
      ? 'Có câu trắc nghiệm nằm sau câu tự luận. Cần dùng chức năng "Sắp xếp chuẩn GDPT 2018".'
      : 'Đạt: Trắc nghiệm xếp trước, Tự luận xếp sau.',
  });

  // Rule 5: Thứ tự Trắc nghiệm: M1 trước, M2 sau; theo thứ tự NLC -> ĐS -> NC -> ĐK
  let tnOrderingValid = true;
  let essayOrderingValid = true;
  let lastTnWeight = -1;
  let lastEssayLevel = 0;

  for (const q of questions) {
    const isTN = q.type !== 'essay' && q.type !== 'practice';
    if (isTN) {
      const weight = getQuestionSortWeight(q);
      if (weight < lastTnWeight) {
        tnOrderingValid = false;
      }
      lastTnWeight = weight;
    } else {
      const levelNum = q.level === 'M1' ? 1 : q.level === 'M2' ? 2 : 3;
      if (levelNum < lastEssayLevel) {
        essayOrderingValid = false;
      }
      lastEssayLevel = levelNum;
    }
  }

  audits.push({
    ruleId: 'tn_sub_ordering',
    title: 'Thứ tự Trắc nghiệm: M1 xếp trước – M2 xếp sau (NLC -> ĐS -> NC -> ĐK)',
    description: 'Trắc nghiệm M1 (NLC -> ĐS -> NC -> ĐK) rồi mới đến M2 (NLC -> ĐS -> NC -> ĐK).',
    passed: tnOrderingValid,
    severity: tnOrderingValid ? 'info' : 'warning',
    details: tnOrderingValid
      ? 'Đạt: Thứ tự các câu trắc nghiệm chuẩn theo từng thể loại và mức độ.'
      : 'Thứ tự các thể loại trắc nghiệm chưa tối ưu theo quy chuẩn M1 trước M2 sau.',
  });

  audits.push({
    ruleId: 'essay_sub_ordering',
    title: 'Thứ tự Tự luận: Từ Mức 1 -> Mức 2 -> Mức 3',
    description: 'Tự luận tăng dần từ dễ đến khó (Biết -> Hiểu -> Vận dụng) giúp học sinh tư duy liền mạch.',
    passed: essayOrderingValid,
    severity: essayOrderingValid ? 'info' : 'warning',
    details: essayOrderingValid
      ? 'Đạt: Tự luận sắp xếp đúng từ dễ đến khó.'
      : 'Thứ tự tự luận chưa sắp xếp tăng dần mức độ.',
  });

  // Rule 6: Số lượng phương án lựa chọn: Lớp 1, 2, 3 có 3 lựa chọn (A, B, C); Lớp 4, 5 có 4 lựa chọn (A, B, C, D)
  const invalidChoices = questions.filter((q) => {
    if (q.type === 'multiple_choice' && q.options) {
      return q.options.length !== expectedChoices;
    }
    return false;
  });
  audits.push({
    ruleId: 'choices_count',
    title: `Số phương án trắc nghiệm: Lớp ${grade} cần ${expectedChoices} phương án (${expectedChoices === 3 ? 'A, B, C' : 'A, B, C, D'})`,
    description: 'Theo quy định Bộ GD&ĐT: Lớp 1, 2, 3 gồm 3 phương án; Lớp 4, 5 gồm 4 phương án.',
    passed: invalidChoices.length === 0,
    severity: invalidChoices.length === 0 ? 'info' : 'warning',
    details:
      invalidChoices.length === 0
        ? `Đạt: Tất cả câu trắc nghiệm nhiều lựa chọn đều có đúng ${expectedChoices} phương án.`
        : `Có ${invalidChoices.length} câu chưa đúng số lượng ${expectedChoices} phương án.`,
  });

  // Rule 7: Tổng điểm chuẩn 10 điểm
  const totalScore = questions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);
  const isTenPoints = Math.abs(totalScore - 10) < 0.05;
  audits.push({
    ruleId: 'total_score',
    title: 'Thang điểm tổng của đề (10,0 điểm)',
    description: 'Tổng điểm toàn bộ đề kiểm tra định kì phải bằng chính xác 10 điểm.',
    passed: isTenPoints,
    severity: isTenPoints ? 'info' : 'error',
    details: `Tổng điểm hiện tại: ${totalScore.toFixed(2)} / 10,0 điểm.`,
  });

  // Rule 8: Môn Toán tỉ lệ TN 70% (7đ) - TL 30% (3đ) hoặc theo quy định
  if (examPkg.subject === 'Toán') {
    const tnScore = questions
      .filter((q) => q.type !== 'essay' && q.type !== 'practice')
      .reduce((sum, q) => sum + (Number(q.score) || 0), 0);
    const tlScore = totalScore - tnScore;
    audits.push({
      ruleId: 'math_ratio',
      title: 'Môn Toán: Tỉ lệ Trắc nghiệm 70% – Tự luận 30%',
      description: 'Lưu ý từ Bộ GD&ĐT: Môn Toán đề 10 câu ưu tiên Trắc nghiệm 70% (7 điểm), Tự luận 30% (3 điểm).',
      passed: Math.abs(tnScore - 7) <= 1.0,
      severity: 'info',
      details: `Điểm Trắc nghiệm: ${tnScore.toFixed(1)}đ (${((tnScore / 10) * 100).toFixed(0)}%) - Tự luận: ${tlScore.toFixed(1)}đ (${((tlScore / 10) * 100).toFixed(0)}%).`,
    });
  }

  // Rule 9: Môn Tin học
  if (examPkg.subject === 'Tin học') {
    const tnCount = questions.filter((q) => q.type !== 'essay' && q.type !== 'practice').length;
    const tlCount = questions.length - tnCount;
    let expectedTn = 6;
    if (grade === 5) expectedTn = 5;
    audits.push({
      ruleId: 'informatics_distribution',
      title: `Môn Tin học Lớp ${grade}: Chuẩn ${expectedTn} Trắc nghiệm - ${10 - expectedTn} Tự luận/Thực hành`,
      description: 'Quy chuẩn: Lớp 3, 4: TN 6 - TL 4; Lớp 5: TN 5 - TL 5.',
      passed: tnCount === expectedTn,
      severity: tnCount === expectedTn ? 'info' : 'warning',
      details: `Đề hiện tại có: ${tnCount} câu Trắc nghiệm, ${tlCount} câu Tự luận/Thực hành.`,
    });
  }

  return audits;
}

/**
 * Generates official formatted Word document (.doc) with XML Word markup
 * Opens natively in Microsoft Word and Google Docs with full formatting,
 * Times New Roman 13pt/14pt, standard page margins, tables, bold/italic questions, and indentations.
 */
export function exportToWordHtmlDoc(examPkg: CompleteExamPackage, type: 'all' | 'exam' | 'matrix' | 'specification' | 'grading'): Blob {
  const { header, questions, matrix, specification, gradingGuide, readingPassage, writingSection, grade, subject } = examPkg;

  let bodyContent = '';

  const renderHeaderHtml = () => `
    <table style="width: 100%; border: none; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
      <tr>
        <td style="width: 45%; text-align: center; vertical-align: top; border: none; font-size: 13pt;">
          <div style="font-weight: normal; text-transform: uppercase;">${header.department || 'PHÒNG GD&ĐT QUẬN/HUYỆN'}</div>
          <div style="font-weight: bold; text-transform: uppercase;">${header.school || 'TRƯỜNG TIỂU HỌC CHU VĂN AN'}</div>
          <div style="width: 120px; border-bottom: 1px solid black; margin: 4px auto 0 auto;"></div>
        </td>
        <td style="width: 55%; text-align: center; vertical-align: top; border: none; font-size: 13pt;">
          <div style="font-weight: bold; text-transform: uppercase;">${header.title || 'BÀI KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I'}</div>
          <div style="font-weight: bold; margin-top: 2px;">${header.schoolYear || 'NĂM HỌC 2026 - 2027'}</div>
          <div style="font-weight: bold; font-size: 14pt; color: #1a365d; margin-top: 4px;">MÔN: ${subject.toUpperCase()} - LỚP ${grade}</div>
          <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Thời gian làm bài: ${header.duration || '40 phút'})</div>
        </td>
      </tr>
    </table>

    <table style="width: 100%; border: 1px solid black; border-collapse: collapse; margin-bottom: 20px; font-family: 'Times New Roman', serif; font-size: 13pt;">
      <tr>
        <td colspan="2" style="border: 1px solid black; padding: 6px 12px;">
          Họ và tên học sinh: ....................................................................................... Lớp: ${grade}...
        </td>
      </tr>
      <tr style="height: 75px;">
        <td style="width: 25%; border: 1px solid black; text-align: center; vertical-align: top; padding: 6px;">
          <b>ĐIỂM</b><br/><br/>
          <span style="font-size: 11pt; color: #666;">(Bằng số / Bằng chữ)</span>
        </td>
        <td style="width: 75%; border: 1px solid black; vertical-align: top; padding: 6px 12px;">
          <b>LỜI NHẬN XÉT CỦA GIÁO VIÊN:</b><br/>
          <div style="border-bottom: 1px dotted #888; height: 22px;"></div>
          <div style="border-bottom: 1px dotted #888; height: 22px;"></div>
        </td>
      </tr>
    </table>
  `;

  // Render Exam Questions
  const renderExamHtml = () => {
    let html = renderHeaderHtml();

    // Reading passage if Tiếng Việt
    if (readingPassage && readingPassage.content) {
      html += `
        <div style="margin-bottom: 18px; padding: 12px; border: 1px solid #ccc; background-color: #fcfcfc; font-family: 'Times New Roman', serif;">
          <div style="text-align: center; font-weight: bold; font-size: 14pt; text-transform: uppercase;">${readingPassage.title}</div>
          <div style="text-align: center; font-style: italic; font-size: 11pt; color: #555; margin-bottom: 10px;">(${readingPassage.genre || 'Văn bản đọc'} - Khoảng ${readingPassage.wordCount} chữ - Tác giả: ${readingPassage.author || 'Sưu tầm'})</div>
          <div style="text-align: justify; line-height: 1.5; font-size: 13pt; text-indent: 1.5cm;">
            ${readingPassage.content.split('\n').filter(p => p.trim()).map(p => `<p style="margin: 6px 0;">${p}</p>`).join('')}
          </div>
        </div>
      `;
    }

    // Questions list: strictly NO section header, continuous Câu 1..10
    html += `<div style="font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5;">`;
    questions.forEach((q) => {
      const scoreFormatted = Number(q.score).toFixed(1).replace('.', ',');
      html += `
        <div style="margin-bottom: 16px;">
          <p style="margin: 4px 0; text-align: justify;">
            <b>Câu ${q.questionNumber} </b><i>(${scoreFormatted} điểm):</i> ${q.content}
          </p>
      `;

      // Render options with 1cm indent
      if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
        html += `<div style="margin-left: 1cm; margin-top: 4px;">`;
        q.options.forEach((opt) => {
          html += `<div style="margin: 3px 0;"><b>${opt.key}.</b> ${opt.text}</div>`;
        });
        html += `</div>`;
      }

      // Render true/false items
      if (q.type === 'true_false' && q.trueFalseItems && q.trueFalseItems.length > 0) {
        html += `<div style="margin-left: 1cm; margin-top: 4px;">`;
        html += `<table style="width: 90%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 4px; text-align: left;">Ý kiến / Nhận định</th>
            <th style="border: 1px solid #000; padding: 4px; width: 60px; text-align: center;">Đúng</th>
            <th style="border: 1px solid #000; padding: 4px; width: 60px; text-align: center;">Sai</th>
          </tr>
          ${q.trueFalseItems.map(item => `
            <tr>
              <td style="border: 1px solid #000; padding: 4px;">${item.key}. ${item.statement}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
            </tr>
          `).join('')}
        </table>`;
        html += `</div>`;
      }

      // Render matching pairs
      if (q.type === 'matching' && q.matchingPairs && q.matchingPairs.length > 0) {
        html += `<div style="margin-left: 1cm; margin-top: 4px;">`;
        html += `<table style="width: 90%; border-collapse: collapse; border: none; font-size: 12pt;">
          <tr>
            <td style="width: 45%; vertical-align: top; border: none;">
              <b>Cột A:</b><br/>
              ${q.matchingPairs.map(p => `<div>${p.leftKey}. ${p.leftText}</div>`).join('')}
            </td>
            <td style="width: 10%; border: none; text-align: center;"> nối với </td>
            <td style="width: 45%; vertical-align: top; border: none;">
              <b>Cột B:</b><br/>
              ${q.matchingPairs.map(p => `<div>${p.rightKey}. ${p.rightText}</div>`).join('')}
            </td>
          </tr>
        </table>`;
        html += `</div>`;
      }

      // Render fill-in-the-blank
      if (q.type === 'fill_in_the_blank' && q.fillInTheBlankText) {
        html += `<div style="margin-left: 1cm; margin-top: 4px; font-style: italic;">
          "${q.fillInTheBlankText}"
        </div>`;
      }

      // Render math grid placeholder if applicable
      if (q.hasMathGrid) {
        html += `<div style="margin-left: 1cm; margin-top: 8px; border: 1px dashed #888; padding: 12px; text-align: center; color: #555; background: #fafafa;">
          [Lưới ô vuông toán học dành cho học sinh vẽ hình / thực hiện phép tính]
        </div>`;
      }

      // Blank lines for essay answers
      if (q.type === 'essay' || q.type === 'practice') {
        const linesCount = q.score >= 1.5 ? 6 : 4;
        html += `<div style="margin-top: 8px; margin-left: 0.5cm;">`;
        html += `<div style="font-style: italic; color: #555; font-size: 11pt; margin-bottom: 4px;">Bài làm:</div>`;
        for (let i = 0; i < linesCount; i++) {
          html += `<div style="border-bottom: 1px dotted #aaa; height: 24px; margin-bottom: 2px;"></div>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
    });

    // Writing section (Tiếng Việt)
    if (writingSection && (writingSection.dictation || writingSection.compositionPrompt)) {
      html += `
        <div style="page-break-before: always; margin-top: 24px;">
          <h3 style="text-align: center; text-transform: uppercase; font-size: 14pt;">BÀI KIỂM TRA VIẾT (MÔN TIẾNG VIỆT)</h3>
          ${writingSection.dictation ? `
            <div style="margin-bottom: 16px;">
              <b>1. Chính tả (Nghe - viết):</b>
              <p style="text-align: justify; text-indent: 1.5cm; margin-top: 6px;">${writingSection.dictation}</p>
            </div>
          ` : ''}
          ${writingSection.compositionPrompt ? `
            <div style="margin-bottom: 16px;">
              <b>2. Viết đoạn văn / Bài văn:</b>
              <p style="margin-top: 6px;"><b>Đề bài:</b> ${writingSection.compositionPrompt}</p>
              <div style="margin-top: 12px;">
                ${Array.from({ length: 12 }).map(() => '<div style="border-bottom: 1px dotted #aaa; height: 24px;"></div>').join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    html += `</div>`;
    return html;
  };

  // Render Matrix Table
  const renderMatrixHtml = () => `
    <div style="font-family: 'Times New Roman', serif; font-size: 12pt; page-break-before: always;">
      <h2 style="text-align: center; font-size: 15pt; text-transform: uppercase; margin-bottom: 4px;">
        MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ ${examPkg.semester.toUpperCase()}
      </h2>
      <div style="text-align: center; font-style: italic; margin-bottom: 16px;">
        Môn: ${subject} - Lớp ${grade} | Thời gian: ${header.duration || '40 phút'} | Năm học: ${header.schoolYear}
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid black; text-align: center; font-size: 11pt;">
        <thead>
          <tr style="background-color: #e2e8f0; font-weight: bold;">
            <th rowspan="2" style="border: 1px solid black; padding: 6px; width: 40px;">STT</th>
            <th rowspan="2" style="border: 1px solid black; padding: 6px; width: 220px; text-align: left;">Mạch kiến thức / Chủ đề</th>
            <th colspan="2" style="border: 1px solid black; padding: 4px;">Mức 1 (Biết)</th>
            <th colspan="2" style="border: 1px solid black; padding: 4px;">Mức 2 (Hiểu)</th>
            <th style="border: 1px solid black; padding: 4px;">Mức 3 (Vận dụng)</th>
            <th colspan="3" style="border: 1px solid black; padding: 4px;">Tổng cộng</th>
          </tr>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th style="border: 1px solid black; padding: 4px; width: 45px;">TN</th>
            <th style="border: 1px solid black; padding: 4px; width: 45px;">TL</th>
            <th style="border: 1px solid black; padding: 4px; width: 45px;">TN</th>
            <th style="border: 1px solid black; padding: 4px; width: 45px;">TL</th>
            <th style="border: 1px solid black; padding: 4px; width: 55px;">TL</th>
            <th style="border: 1px solid black; padding: 4px; width: 55px;">Số câu</th>
            <th style="border: 1px solid black; padding: 4px; width: 55px;">Số điểm</th>
            <th style="border: 1px solid black; padding: 4px; width: 55px;">Tỉ lệ %</th>
          </tr>
        </thead>
        <tbody>
          ${(matrix.rows || []).map((row, idx) => `
            <tr>
              <td style="border: 1px solid black; padding: 5px;">${idx + 1}</td>
              <td style="border: 1px solid black; padding: 5px; text-align: left; font-weight: 500;">${row.topic}</td>
              <td style="border: 1px solid black; padding: 5px;">${row.m1_tn_count || '-'}</td>
              <td style="border: 1px solid black; padding: 5px;">${row.m1_tl_count || '-'}</td>
              <td style="border: 1px solid black; padding: 5px;">${row.m2_tn_count || '-'}</td>
              <td style="border: 1px solid black; padding: 5px;">${row.m2_tl_count || '-'}</td>
              <td style="border: 1px solid black; padding: 5px;">${row.m3_tl_count || '-'}</td>
              <td style="border: 1px solid black; padding: 5px; font-weight: bold;">${row.total_count}</td>
              <td style="border: 1px solid black; padding: 5px; font-weight: bold;">${Number(row.total_score).toFixed(1).replace('.', ',')}</td>
              <td style="border: 1px solid black; padding: 5px;">${row.percentage}%</td>
            </tr>
          `).join('')}
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="2" style="border: 1px solid black; padding: 6px; text-align: center;">TỔNG SỐ CÂU</td>
            <td style="border: 1px solid black; padding: 6px;">${matrix.rows.reduce((s, r) => s + (r.m1_tn_count || 0), 0)}</td>
            <td style="border: 1px solid black; padding: 6px;">${matrix.rows.reduce((s, r) => s + (r.m1_tl_count || 0), 0)}</td>
            <td style="border: 1px solid black; padding: 6px;">${matrix.rows.reduce((s, r) => s + (r.m2_tn_count || 0), 0)}</td>
            <td style="border: 1px solid black; padding: 6px;">${matrix.rows.reduce((s, r) => s + (r.m2_tl_count || 0), 0)}</td>
            <td style="border: 1px solid black; padding: 6px;">${matrix.rows.reduce((s, r) => s + (r.m3_tl_count || 0), 0)}</td>
            <td style="border: 1px solid black; padding: 6px;">${matrix.summary.grand_total_questions}</td>
            <td style="border: 1px solid black; padding: 6px;">${matrix.summary.grand_total_score}</td>
            <td style="border: 1px solid black; padding: 6px;">100%</td>
          </tr>
          <tr style="background-color: #edf2f7; font-weight: bold;">
            <td colspan="2" style="border: 1px solid black; padding: 6px; text-align: center;">TỔNG SỐ ĐIỂM</td>
            <td colspan="2" style="border: 1px solid black; padding: 6px;">${Number(matrix.summary.m1_score).toFixed(1).replace('.', ',')} đ (${matrix.summary.m1_pct}%)</td>
            <td colspan="2" style="border: 1px solid black; padding: 6px;">${Number(matrix.summary.m2_score).toFixed(1).replace('.', ',')} đ (${matrix.summary.m2_pct}%)</td>
            <td style="border: 1px solid black; padding: 6px;">${Number(matrix.summary.m3_score).toFixed(1).replace('.', ',')} đ (${matrix.summary.m3_pct}%)</td>
            <td colspan="2" style="border: 1px solid black; padding: 6px;">10,0 điểm</td>
            <td style="border: 1px solid black; padding: 6px;">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  // Render Specifications Table
  const renderSpecHtml = () => `
    <div style="font-family: 'Times New Roman', serif; font-size: 12pt; page-break-before: always;">
      <h2 style="text-align: center; font-size: 15pt; text-transform: uppercase; margin-bottom: 4px;">
        BẢNG ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ
      </h2>
      <div style="text-align: center; font-style: italic; margin-bottom: 16px;">
        Môn: ${subject} - Lớp ${grade} | Thông tư 27/2020/TT-BGDĐT
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 11pt;">
        <thead>
          <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center;">
            <th style="border: 1px solid black; padding: 6px; width: 40px;">STT</th>
            <th style="border: 1px solid black; padding: 6px; width: 140px;">Mạch kiến thức</th>
            <th style="border: 1px solid black; padding: 6px;">Yêu cầu cần đạt</th>
            <th style="border: 1px solid black; padding: 6px; width: 65px;">Mức độ</th>
            <th style="border: 1px solid black; padding: 6px; width: 60px;">Câu số</th>
            <th style="border: 1px solid black; padding: 6px; width: 120px;">Hình thức câu</th>
            <th style="border: 1px solid black; padding: 6px; width: 55px;">Điểm</th>
          </tr>
        </thead>
        <tbody>
          ${(specification || []).map((spec, idx) => `
            <tr>
              <td style="border: 1px solid black; padding: 5px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid black; padding: 5px; font-weight: 500;">${spec.topic}</td>
              <td style="border: 1px solid black; padding: 5px; text-align: justify;">${spec.competency}</td>
              <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">${spec.level}</td>
              <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">Câu ${spec.questionNumber}</td>
              <td style="border: 1px solid black; padding: 5px; text-align: center;">${spec.questionType}</td>
              <td style="border: 1px solid black; padding: 5px; text-align: center; font-weight: bold;">${Number(spec.score).toFixed(1).replace('.', ',')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Render Grading Guide
  const renderGradingHtml = () => `
    <div style="font-family: 'Times New Roman', serif; font-size: 12pt; page-break-before: always;">
      <h2 style="text-align: center; font-size: 15pt; text-transform: uppercase; margin-bottom: 4px;">
        HƯỚNG DẪN CHẤM VÀ ĐÁP ÁN ĐỀ KIỂM TRA ĐỊNH KỲ
      </h2>
      <div style="text-align: center; font-style: italic; margin-bottom: 16px;">
        Môn: ${subject} - Lớp ${grade}
      </div>

      <h3 style="font-size: 13pt; margin-bottom: 8px;">1. Bảng đáp án Trắc nghiệm:</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid black; text-align: center; margin-bottom: 16px; font-size: 11pt;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th style="border: 1px solid black; padding: 6px; width: 80px;">Câu số</th>
            <th style="border: 1px solid black; padding: 6px; width: 120px;">Đáp án đúng</th>
            <th style="border: 1px solid black; padding: 6px; width: 90px;">Điểm số</th>
            <th style="border: 1px solid black; padding: 6px; text-align: left;">Ghi chú / Hướng dẫn chấm</th>
          </tr>
        </thead>
        <tbody>
          ${(gradingGuide.multipleChoice || []).map((mc) => `
            <tr>
              <td style="border: 1px solid black; padding: 6px; font-weight: bold;">Câu ${mc.questionNumber}</td>
              <td style="border: 1px solid black; padding: 6px; font-weight: bold; color: #b91c1c;">${mc.answer}</td>
              <td style="border: 1px solid black; padding: 6px;">${Number(mc.score).toFixed(1).replace('.', ',')} đ</td>
              <td style="border: 1px solid black; padding: 6px; text-align: left;">${mc.note || 'Chọn đúng phương án được điểm tối đa'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 style="font-size: 13pt; margin-bottom: 8px;">2. Hướng dẫn chấm Tự luận & Biểu điểm chi tiết:</h3>
      ${(gradingGuide.essay || []).map((essay) => `
        <div style="margin-bottom: 16px; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">
          <div style="font-weight: bold; font-size: 12pt; margin-bottom: 4px;">
            Câu ${essay.questionNumber} (${Number(essay.score).toFixed(1).replace('.', ',')} điểm) - [${essay.level}] - ${essay.topic}
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #94a3b8; font-size: 11pt; margin-top: 6px;">
            <thead>
              <tr style="background-color: #e2e8f0;">
                <th style="border: 1px solid #94a3b8; padding: 4px; text-align: left;">Nội dung yêu cầu / Các bước giải</th>
                <th style="border: 1px solid #94a3b8; padding: 4px; width: 80px; text-align: center;">Điểm</th>
              </tr>
            </thead>
            <tbody>
              ${essay.steps.map(step => `
                <tr>
                  <td style="border: 1px solid #94a3b8; padding: 5px;">${step.description}</td>
                  <td style="border: 1px solid #94a3b8; padding: 5px; text-align: center; font-weight: bold;">${Number(step.stepScore).toFixed(2).replace('.', ',')} đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${essay.generalNote ? `<div style="font-style: italic; font-size: 11pt; color: #475569; margin-top: 4px;">* Lưu ý: ${essay.generalNote}</div>` : ''}
        </div>
      `).join('')}

      ${gradingGuide.readingListeningScore ? `
        <div style="margin-top: 14px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fef3c7;">
          <b>Hướng dẫn kiểm tra Đọc thành tiếng:</b>
          <p style="margin: 4px 0;">${gradingGuide.readingListeningScore}</p>
        </div>
      ` : ''}
      ${gradingGuide.writingScore ? `
        <div style="margin-top: 10px; padding: 8px 12px; background: #eff6ff; border: 1px solid #dbeafe;">
          <b>Hướng dẫn chấm bài Viết:</b>
          <p style="margin: 4px 0;">${gradingGuide.writingScore}</p>
        </div>
      ` : ''}
    </div>
  `;

  if (type === 'exam') bodyContent = renderExamHtml();
  else if (type === 'matrix') bodyContent = renderMatrixHtml();
  else if (type === 'specification') bodyContent = renderSpecHtml();
  else if (type === 'grading') bodyContent = renderGradingHtml();
  else {
    // All 4 sections combined
    bodyContent = `
      ${renderExamHtml()}
      ${renderMatrixHtml()}
      ${renderSpecHtml()}
      ${renderGradingHtml()}
    `;
  }

  const fullWordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${header.title} - ${subject} Lớp ${grade}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin: 2.0cm 2.0cm 2.0cm 2.5cm; /* Top, Right, Bottom, Left */
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            color: #000;
            line-height: 1.4;
          }
          table {
            border-collapse: collapse;
          }
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;

  return new Blob(['\ufeff' + fullWordHtml], {
    type: 'application/msword;charset=utf-8',
  });
}
