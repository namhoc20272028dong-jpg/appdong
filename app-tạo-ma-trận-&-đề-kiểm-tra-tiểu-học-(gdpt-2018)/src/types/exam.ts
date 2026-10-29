/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GradeLevel = 1 | 2 | 3 | 4 | 5;

export type SubjectName =
  | 'Toán'
  | 'Tiếng Việt'
  | 'Tin học'
  | 'Khoa học'
  | 'Lịch sử và Địa lí'
  | 'Công nghệ'
  | 'Tự nhiên và Xã hội'
  | 'Đạo đức';

export type SemesterPeriod =
  | 'Giữa Học kì I'
  | 'Cuối Học kì I'
  | 'Giữa Học kì II'
  | 'Cuối Năm học';

export type CognitiveLevel = 'M1' | 'M2' | 'M3';

export type QuestionType =
  | 'multiple_choice'    // TN nhiều lựa chọn
  | 'true_false'          // TN đúng sai
  | 'matching'            // TN nối cột
  | 'fill_in_the_blank'   // TN điền khuyết
  | 'essay'               // Tự luận
  | 'practice';           // Thực hành (Tin học)

export interface MathGridConfig {
  rows: number;
  cols: number;
  showPoints?: boolean;
  shapeType?: 'rectangle' | 'square' | 'triangle' | 'segment' | 'shaded_area' | 'grid_count';
  label?: string;
  points?: { x: number; y: number; label?: string }[];
  shadedCells?: { r: number; c: number }[];
  dimensions?: { widthUnits: number; heightUnits: number };
}

export interface ChoiceOption {
  key: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface MatchingPair {
  leftKey: string;
  leftText: string;
  rightKey: string;
  rightText: string;
}

export interface TrueFalseItem {
  key: string;
  statement: string;
  isCorrect?: boolean;
}

export interface QuestionStepRubric {
  description: string;
  stepScore: number;
}

export interface ExamQuestion {
  id: string;
  questionNumber: number; // 1 to 10
  level: CognitiveLevel; // 'M1' | 'M2' | 'M3'
  levelName: string; // 'Mức 1 (Biết)' | 'Mức 2 (Hiểu)' | 'Mức 3 (Vận dụng)'
  type: QuestionType;
  typeName: string; // 'TN nhiều lựa chọn' | 'TN đúng sai' | 'TN nối cột' | 'TN điền khuyết' | 'Tự luận' | 'Thực hành'
  topic: string; // e.g. 'Số và phép tính', 'Hình học và đo lường'
  score: number; // e.g. 0.5, 1.0, 1.5, 2.0
  content: string; // Câu hỏi không đậm, liền sau điểm nghiêng
  options?: ChoiceOption[]; // 3 options for grade 1-3, 4 for grade 4-5
  matchingPairs?: MatchingPair[];
  trueFalseItems?: TrueFalseItem[];
  fillInTheBlankText?: string;
  hasMathGrid?: boolean;
  mathGridConfig?: MathGridConfig | null;
  practiceInstructions?: string; // For Tin học
}

export interface ReadingPassage {
  title: string;
  author: string;
  wordCount: number;
  genre: string;
  content: string;
}

export interface WritingSection {
  dictation?: string; // Đoạn chính tả nghe - viết
  compositionPrompt?: string; // Đề bài viết đoạn văn / bài văn
  compositionRequirement?: string;
}

export interface ExamHeader {
  department: string;
  school: string;
  title: string;
  schoolYear: string;
  subject: string;
  duration: string;
  classGrade?: string;
}

export interface MatrixRow {
  topic: string;
  m1_tn_count: number;
  m1_tn_score: number;
  m1_tl_count: number;
  m1_tl_score: number;
  m2_tn_count: number;
  m2_tn_score: number;
  m2_tl_count: number;
  m2_tl_score: number;
  m3_tl_count: number;
  m3_tl_score: number;
  total_count: number;
  total_score: number;
  percentage: number;
}

export interface MatrixSummary {
  m1_count: number;
  m1_score: number;
  m1_pct: number;
  m2_count: number;
  m2_score: number;
  m2_pct: number;
  m3_count: number;
  m3_score: number;
  m3_pct: number;
  tn_count: number;
  tn_score: number;
  tn_pct: number;
  tl_count: number;
  tl_score: number;
  tl_pct: number;
  grand_total_questions: number;
  grand_total_score: number;
}

export interface ExamMatrix {
  rows: MatrixRow[];
  summary: MatrixSummary;
}

export interface SpecificationItem {
  order: number;
  topic: string;
  subtopic?: string;
  competency: string; // Yêu cầu cần đạt
  level: CognitiveLevel;
  questionNumber: number;
  questionType: string;
  score: number;
}

export interface MultipleChoiceAnswer {
  questionNumber: number;
  answer: string;
  score: number;
  note?: string;
}

export interface EssayAnswerGuide {
  questionNumber: number;
  topic: string;
  level: CognitiveLevel;
  score: number;
  answerText?: string;
  steps: QuestionStepRubric[];
  generalNote?: string;
}

export interface ExamGradingGuide {
  multipleChoice: MultipleChoiceAnswer[];
  essay: EssayAnswerGuide[];
  readingListeningScore?: string;
  writingScore?: string;
}

export interface CompleteExamPackage {
  id: string;
  grade: GradeLevel;
  subject: SubjectName;
  semester: SemesterPeriod;
  curriculum: string;
  examCode?: string; // Mã đề: 101, 102
  totalQuestions: number; // 10
  header: ExamHeader;
  matrix: ExamMatrix;
  specification: SpecificationItem[];
  questions: ExamQuestion[];
  readingPassage?: ReadingPassage | null;
  writingSection?: WritingSection | null;
  gradingGuide: ExamGradingGuide;
  createdAt: string;
  updatedAt: string;
}

export interface RuleAuditItem {
  ruleId: string;
  title: string;
  description: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  details?: string;
}
