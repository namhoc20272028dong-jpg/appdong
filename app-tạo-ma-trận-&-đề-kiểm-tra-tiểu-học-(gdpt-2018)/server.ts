import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility as per standard instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.post('/api/exam/generate', async (req: Request, res: Response) => {
  try {
    const {
      grade = 3,
      subject = 'Toán',
      semester = 'Cuối Học kì I',
      curriculum = 'Kết nối tri thức',
      examDuration = 40,
      topicFocus = '',
      totalQuestions = 10,
      multipleChoiceRatio = 70, // 70% or 60%
      schoolName = 'Trường Tiểu học Chu Văn An',
      district = 'Phòng GD&ĐT Quận Ba Đình',
    } = req.body;

    const isLowerGrade = grade <= 3;
    const numChoices = isLowerGrade ? 3 : 4;
    const choicesLetters = isLowerGrade ? 'A, B, C' : 'A, B, C, D';

    const prompt = `
Bạn là chuyên gia giáo dục tiểu học hàng đầu Việt Nam, am hiểu sâu sắc Chương trình Giáo dục phổ thông 2018 (GDPT 2018) và Thông tư 27/2020/TT-BGDĐT quy định về đánh giá học sinh tiểu học.
Hãy xây dựng trọn bộ hồ sơ đề kiểm tra định kì gồm 4 phần:
1. BẢNG MA TRẬN ĐỀ KIỂM TRA
2. BẢNG ĐẶC TẢ MA TRẬN ĐỀ KIỂM TRA
3. ĐỀ KIỂM TRA CHÍNH THỨC
4. HƯỚNG DẪN CHẤM VÀ ĐÁP ÁN

THÔNG TIN ĐỀ KIỂM TRA CẦN TẠO:
- Môn học: ${subject}
- Khối lớp: Lớp ${grade}
- Kỳ kiểm tra: ${semester}
- Bộ sách giáo khoa tham chiếu: ${curriculum}
- Thời gian làm bài: ${examDuration} phút
- Tổng số câu hỏi: ĐÚNG ${totalQuestions} CÂU (từ Câu 1 đến Câu ${totalQuestions})
- Tỉ lệ phân bổ: Trắc nghiệm khách quan ${multipleChoiceRatio}%, Tự luận ${100 - multipleChoiceRatio}% (hoặc theo đặc thù môn).
- Thang điểm tổng: 10 điểm.
- Định hướng chủ đề trọng tâm nếu có: ${topicFocus || 'Bao quát toàn diện chương trình của kỳ kiểm tra theo GDPT 2018'}.

CÁC NGUYÊN TẮC BẮT BUỘC (TUYỆT ĐỐI TUÂN THỦ):
1. CẤU TRÚC ĐỀ KIỂM TRA:
- Thứ tự câu: Đánh số liên tục từ Câu 1 đến Câu ${totalQuestions} hết đề kiểm tra.
- TUYỆT ĐỐI KHÔNG GHI tiêu đề "Phần trắc nghiệm", "Phần tự luận", "I. Trắc nghiệm", "II. Tự luận" trong đề kiểm tra! Đề chỉ ghi Câu 1, Câu 2,... nối tiếp nhau.
- Thứ tự câu hỏi bắt buộc sắp xếp từ TRẮC NGHIỆM đến TỰ LUẬN:
  * Trắc nghiệm: Mức 1 (M1) xếp trước -> Mức 2 (M2) xếp sau. Cụ thể:
    + M1 Nhiều lựa chọn -> M1 Đúng sai -> M1 Nối cột -> M1 Điền khuyết
    + M2 Nhiều lựa chọn -> M2 Đúng sai -> M2 Nối cột -> M2 Điền khuyết
  * Tự luận: Lần lượt từ Mức 1 (Biết) -> Mức 2 (Hiểu) -> Mức 3 (Vận dụng) để học sinh tư duy từ dễ đến khó.
- TUYỆT ĐỐI KHÔNG TẠO CÂU TRẮC NGHIỆM Ở MỨC VẬN DỤNG (Mức 3). Mức 3 chỉ dành cho tự luận!
- Không ghép câu thuộc 2 chủ đề/bài học/mạch kiến thức khác nhau vào 1 câu.
- Một chủ đề/bài có nhiều câu hỏi: Mỗi câu hỏi phải có một mục đặc tả riêng biệt.

2. CÁCH TRÌNH BÀY ĐỀ KIỂM TRA:
- Câu số (chữ đậm), điểm (chữ nghiêng không đậm) liền câu số, câu hỏi (chữ không đậm).
  Ví dụ: Câu 1 (0,5 điểm): Khoanh vào chữ cái trước câu trả lời đúng:...
- Trắc nghiệm nhiều lựa chọn:
  * Lớp 1, 2, 3: GỒM ĐÚNG 3 PHƯƠNG ÁN (${choicesLetters})
  * Lớp 4, 5: GỒM ĐÚNG 4 PHƯƠNG ÁN (A, B, C, D)
- Điểm trắc nghiệm:
  * TN nhiều lựa chọn: 0,5 điểm/câu
  * TN đúng sai, nối cột, điền khuyết: 0,25 điểm/ý (ví dụ 1 câu đúng sai 4 ý = 1,0đ; hoặc 0,25đ mỗi ý)
- Điểm tự luận:
  * Mức 1 (Biết): 0,5 điểm/câu/ý
  * Mức 2 (Hiểu): 1,0 điểm/câu/ý
  * Mức 3 (Vận dụng): Từ 1,0 đến 2,0 điểm/câu/ý
- Đối với môn Toán:
  * Đảm bảo đủ các mạch kiến thức chuẩn (Số và phép tính; Hình học và đo lường; Một số yếu tố thống kê và xác suất; Thực hành trải nghiệm).
  * Nếu có bài hình học/đo lường, có thể cấu hình vẽ hình trên lưới ô vuông tiểu học.
- Đối với môn Tiếng Việt:
  * Đọc hiểu gồm đoạn văn bản ngoài SGK chuẩn số chữ: Lớp 1 (90-130 chữ), Lớp 2 (180-200 chữ), Lớp 3 (200-250 chữ), Lớp 4 (280-330 chữ), Lớp 5 (300-350 chữ).
  * Kèm theo phần chính tả nghe-viết và đề bài Tập làm văn/Viết đoạn văn theo chuẩn lớp.
- Đối với môn Tin học:
  * Lớp 3: Trắc nghiệm 6 - Tự luận 4
  * Lớp 4: Trắc nghiệm 6 - Tự luận 4 (Tự luận 2, Thực hành 2)
  * Lớp 5: Trắc nghiệm 5 - Tự luận 5 (Tự luận 2-3, Thực hành 2-3)

HÃY TRẢ VỀ DỮ LIỆU DƯỚI DẠNG JSON CHUẨN (KHÔNG CHỨA BẤT KỲ VĂN BẢN NGOÀI JSON) theo cấu trúc sau:
{
  "matrix": {
    "rows": [
      {
        "topic": "Số và phép tính",
        "m1_tn_count": 2,
        "m1_tn_score": 1.0,
        "m1_tl_count": 0,
        "m1_tl_score": 0.0,
        "m2_tn_count": 2,
        "m2_tn_score": 1.0,
        "m2_tl_count": 1,
        "m2_tl_score": 1.0,
        "m3_tl_count": 1,
        "m3_tl_score": 1.5,
        "total_count": 6,
        "total_score": 4.5,
        "percentage": 45
      }
    ],
    "summary": {
      "m1_count": 4, "m1_score": 2.5, "m1_pct": 25,
      "m2_count": 4, "m2_score": 4.5, "m2_pct": 45,
      "m3_count": 2, "m3_score": 3.0, "m3_pct": 30,
      "tn_count": 6, "tn_score": 3.5, "tn_pct": 35,
      "tl_count": 4, "tl_score": 6.5, "tl_pct": 65,
      "grand_total_questions": 10,
      "grand_total_score": 10.0
    }
  },
  "specification": [
    {
      "order": 1,
      "topic": "Số và phép tính",
      "competency": "Nhận biết cấu tạo số có 4 chữ số, đọc và viết số trong phạm vi...",
      "level": "M1",
      "questionNumber": 1,
      "questionType": "TN nhiều lựa chọn",
      "score": 0.5
    }
  ],
  "exam": {
    "header": {
      "department": "${district}",
      "school": "${schoolName}",
      "title": "BÀI KIỂM TRA ĐỊNH KỲ ${semester.toUpperCase()}",
      "schoolYear": "NĂM HỌC 2026 - 2027",
      "subject": "${subject.toUpperCase()} - LỚP ${grade}",
      "duration": "${examDuration} phút"
    },
    "readingPassage": {
      "title": "Tên bài đọc (chỉ dùng cho Tiếng Việt)",
      "author": "Tác giả",
      "wordCount": 210,
      "genre": "Truyện ngắn / Miêu tả / Thơ",
      "content": "Nội dung văn bản ngoài sách giáo khoa..."
    },
    "writingSection": {
      "dictation": "Nội dung bài nghe - viết chính tả (nếu là môn Tiếng Việt)",
      "compositionPrompt": "Đề bài viết đoạn văn / bài văn (nếu là môn Tiếng Việt)"
    },
    "questions": [
      {
        "id": "q1",
        "questionNumber": 1,
        "level": "M1",
        "levelName": "Mức 1 (Biết)",
        "type": "multiple_choice",
        "typeName": "TN nhiều lựa chọn",
        "topic": "Số và phép tính",
        "score": 0.5,
        "content": "Số lớn nhất có bốn chữ số khác nhau là:",
        "options": [
          { "key": "A", "text": "9876" },
          { "key": "B", "text": "9999" },
          { "key": "C", "text": "9867" }
        ],
        "hasMathGrid": false,
        "mathGridConfig": null,
        "matchingPairs": null,
        "trueFalseItems": null,
        "fillInTheBlankText": null
      }
    ]
  },
  "gradingGuide": {
    "multipleChoice": [
      { "questionNumber": 1, "answer": "A", "score": 0.5, "note": "Chọn đúng được 0,5 điểm" }
    ],
    "essay": [
      {
        "questionNumber": 8,
        "topic": "Số và phép tính",
        "level": "M2",
        "score": 1.0,
        "steps": [
          { "description": "Đặt tính và tính đúng phép tính thứ nhất", "stepScore": 0.5 },
          { "description": "Đặt tính và tính đúng phép tính thứ hai", "stepScore": 0.5 }
        ],
        "generalNote": "Học sinh giải cách khác đúng vẫn cho điểm tối đa."
      }
    ],
    "readingListeningScore": "Hướng dẫn chấm phần đọc thành tiếng: Đọc đúng tốc độ, ngắt nghỉ đúng dấu câu (x điểm)...",
    "writingScore": "Hướng dẫn chấm chính tả và bài viết đoạn văn..."
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Clean potential backticks or markdown
      const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
      data = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error generating exam:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi tạo đề kiểm tra bằng AI',
    });
  }
});

app.post('/api/exam/regenerate-question', async (req: Request, res: Response) => {
  try {
    const { grade, subject, targetQuestion, topic, level, type, score } = req.body;
    const isLowerGrade = (grade || 3) <= 3;
    const numChoices = isLowerGrade ? 3 : 4;

    const prompt = `
Bạn là giáo viên tiểu học chuyên gia ra đề. Hãy tạo lại MỘT CÂU HỎI MỚI thay thế cho câu hỏi sau trong đề kiểm tra môn ${subject} Lớp ${grade}:
- Mạch kiến thức: ${topic || 'Theo chương trình'}
- Mức độ: ${level} (${level === 'M1' ? 'Mức 1 - Biết' : level === 'M2' ? 'Mức 2 - Hiểu' : 'Mức 3 - Vận dụng'})
- Dạng câu: ${type}
- Điểm số: ${score} điểm
- Câu cũ tham khảo: "${targetQuestion?.content || ''}"

YÊU CẦU:
1. Đảm bảo đúng chuẩn GDPT 2018 và Thông tư 27.
2. Nếu là trắc nghiệm nhiều lựa chọn:
   * Lớp 1, 2, 3: ĐÚNG ${numChoices} phương án (A, B, C)
   * Lớp 4, 5: ĐÚNG 4 phương án (A, B, C, D)
3. KHÔNG TẠO TRẮC NGHIỆM Ở MỨC 3 (M3 bắt buộc là Tự luận).
4. Phù hợp tâm lý lứa tuổi tiểu học, lời văn trong sáng, dễ hiểu.

Trả về JSON chuẩn:
{
  "question": {
    "level": "${level}",
    "levelName": "${level === 'M1' ? 'Mức 1 (Biết)' : level === 'M2' ? 'Mức 2 (Hiểu)' : 'Mức 3 (Vận dụng)'}",
    "type": "${type}",
    "typeName": "${type}",
    "topic": "${topic}",
    "score": ${score},
    "content": "Nội dung câu hỏi mới...",
    "options": [
      { "key": "A", "text": "..." },
      { "key": "B", "text": "..." },
      { "key": "C", "text": "..." }
    ],
    "matchingPairs": null,
    "trueFalseItems": null,
    "fillInTheBlankText": null,
    "hasMathGrid": false,
    "mathGridConfig": null
  },
  "answer": {
    "answer": "A",
    "explanation": "Lời giải chi tiết hoặc đáp án...",
    "steps": [
      { "description": "Bước giải...", "stepScore": ${score} }
    ]
  }
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const responseText = response.text || '{}';
    const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleaned);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error regenerating question:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lỗi khi tạo lại câu hỏi',
    });
  }
});

// Vite Middleware for development OR static serving for production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`EduTestPrimary Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
