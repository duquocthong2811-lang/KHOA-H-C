import { GoogleGenAI, Type } from '@google/genai';
import { Question, CognitiveLevel, QuestionType } from '../src/types';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

export interface GenerateQuestionsRequest {
  topicId: string;
  topicTitle: string;
  lessonName?: string;
  sourceText?: string;
  cognitiveLevel?: CognitiveLevel | 'mixed';
  questionType?: QuestionType | 'mixed';
  count: number;
}

export async function generateScienceQuestions(
  req: GenerateQuestionsRequest
): Promise<{ questions: Omit<Question, 'id' | 'createdAt'>[]; notice?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      questions: [],
      notice: 'Hệ thống chưa tìm thấy GEMINI_API_KEY trong môi trường. Vui lòng kiểm tra cài đặt.'
    };
  }

  const prompt = `
Bạn là Trợ lí AI chuyên môn Khoa học lớp 5 của Thầy Dư Quốc Thông (Trường Tiểu học Lương Thế Vinh), hỗ trợ biên soạn ngân hàng câu hỏi chuẩn chương trình GDPT 2018.

THÔNG TIN YÊU CẦU:
- Chủ đề: ${req.topicTitle} (Mã: ${req.topicId})
- Bài học: ${req.lessonName || 'Toàn bài học trong chủ đề'}
- Số lượng câu hỏi cần tạo: ${req.count}
- Yêu cầu Mức độ nhận thức: ${req.cognitiveLevel || 'Hỗn hợp: 50% Nhận biết, 30% Kết nối, 20% Vận dụng'}
- Yêu cầu Dạng câu hỏi: ${req.questionType || 'Đa dạng 4 dạng: Trắc nghiệm (3 đáp án A, B, C), Nối cột, Điền từ, Sắp xếp thứ tự'}

${
  req.sourceText
    ? `TÀI LIỆU NGUỒN TỪ SGK/SGV ĐÍNH KÈM:
"""
${req.sourceText}
"""
(Hãy dựa sát vào tài liệu trên để biên soạn. Nếu tài liệu không đủ dữ liệu khoa học, hãy ghi rõ nguồn tham khảo SGK Khoa học 5 hiện hành).`
    : 'Hãy dựa vào chuẩn kiến thức SGK Khoa học lớp 5 (bộ sách Kết nối tri thức / Chân trời sáng tạo / Cánh diều).'
}

QUY TẮC BẮT BUỘC KHI BIÊN SOẠN CÂU HỎI:
1. Đối với dạng trắc nghiệm (multiple_choice): CHỈ ĐƯỢC CÓ ĐÚNG 3 PHƯƠNG ÁN LỰA CHỌN (A, B, C). Phương án nhiễu phải hợp lí nhưng sai rõ ràng, đáp án đúng duy nhất, chính xác 100% về mặt khoa học.
2. Đối với dạng ghép nối (matching): Tạo 3 cặp nối liên quan mật thiết (id, left, right).
3. Đối với dạng điền từ (fill_in_the_blank): Có câu chứa {1}, {2}; danh sách từ cho sẵn 4-5 từ (blankOptions); và mảng đáp án đúng (blankAnswers).
4. Đối với dạng sắp xếp (ordering): Danh sách các bước (orderingItems), và thứ tự chỉ số đúng [0, 1, 2...].
5. Phân loại chuẩn 3 mức độ nhận thức:
   - "nhan_biet": Nhớ, nhận diện, nêu tên kiến thức cơ bản.
   - "ket_noi": Giải thích nguyên nhân, so sánh, kết nối kiến thức trong tình huống quen thuộc.
   - "van_dung": Áp dụng kiến thức để giải quyết tình huống thực tế đời sống, bảo vệ sức khỏe, môi trường của học sinh lớp 5.
6. Lời giải thích (explanation) phải ngắn gọn, dễ hiểu, chuẩn khoa học cho học sinh tiểu học.
7. Đặt approved = false để Thầy Dư Quốc Thông kiểm duyệt trước khi đưa vào đề thi chính thức.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Bạn là chuyên gia sư phạm Khoa học tiểu học tại Việt Nam. Bạn luôn xuất bản định dạng JSON chính xác theo cấu trúc yêu cầu, ngôn ngữ tiếng Việt trong sáng, chuẩn mực sư phạm.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topicId: { type: Type.STRING },
              lesson: { type: Type.STRING },
              content: { type: Type.STRING },
              type: {
                type: Type.STRING,
                enum: ['multiple_choice', 'matching', 'fill_in_the_blank', 'ordering']
              },
              cognitiveLevel: {
                type: Type.STRING,
                enum: ['nhan_biet', 'ket_noi', 'van_dung']
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 phương án cho câu trắc nghiệm'
              },
              correctOptionIndex: {
                type: Type.INTEGER,
                description: '0, 1 hoặc 2'
              },
              matchingPairs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    left: { type: Type.STRING },
                    right: { type: Type.STRING }
                  },
                  required: ['id', 'left', 'right']
                }
              },
              blankTemplate: { type: Type.STRING },
              blankOptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              blankAnswers: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              orderingItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctOrder: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              },
              explanation: { type: Type.STRING },
              source: { type: Type.STRING }
            },
            required: ['topicId', 'content', 'type', 'cognitiveLevel', 'explanation']
          }
        }
      }
    });

    const text = response.text?.trim() || '[]';
    const parsed = JSON.parse(text);

    const questions: Omit<Question, 'id' | 'createdAt'>[] = parsed.map((item: any) => ({
      topicId: req.topicId,
      lesson: item.lesson || req.lessonName || 'Khoa học lớp 5',
      content: item.content,
      type: item.type || 'multiple_choice',
      cognitiveLevel: item.cognitiveLevel || 'nhan_biet',
      options: item.options && item.options.length >= 3 ? item.options.slice(0, 3) : item.options,
      correctOptionIndex: item.correctOptionIndex ?? 0,
      matchingPairs: item.matchingPairs,
      blankTemplate: item.blankTemplate,
      blankOptions: item.blankOptions,
      blankAnswers: item.blankAnswers,
      orderingItems: item.orderingItems,
      correctOrder: item.correctOrder,
      explanation: item.explanation || 'Kiến thức chuẩn SGK Khoa học 5.',
      source: item.source || 'Trợ lí AI biên soạn từ SGK Khoa học 5',
      approved: false,
      isAiGenerated: true
    }));

    return { questions };
  } catch (error: any) {
    console.error('Gemini question generation error:', error);
    return {
      questions: [],
      notice: 'Lỗi khi kết nối Trợ lí AI: ' + (error.message || 'Không thể tạo câu hỏi lúc này.')
    };
  }
}
