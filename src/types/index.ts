export type CognitiveLevel = 'nhan_biet' | 'ket_noi' | 'van_dung';

export type QuestionType = 'multiple_choice' | 'matching' | 'fill_in_the_blank' | 'ordering';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  topicId: string; // 'chud_1' | 'chud_2' | 'chud_3' | 'chud_4' | 'chud_5' | 'chud_6'
  lesson?: string;
  content: string;
  type: QuestionType;
  cognitiveLevel: CognitiveLevel; // Nhận biết (50%), Kết nối (30%), Vận dụng (20%)
  
  // Trắc nghiệm (3 lựa chọn A, B, C)
  options?: string[];
  correctOptionIndex?: number; // 0, 1, 2
  
  // Ghép nối (2 cột)
  matchingPairs?: MatchingPair[];
  
  // Điền từ kéo thả
  blankTemplate?: string; // Ví dụ: "Năng lượng Mặt Trời được sử dụng để {1} và {2}."
  blankOptions?: string[]; // Danh sách từ cho sẵn
  blankAnswers?: string[]; // Đáp án đúng cho từng vị trí
  
  // Sắp xếp thứ tự
  orderingItems?: string[]; // Danh sách các bước
  correctOrder?: number[]; // Mảng chỉ số thứ tự đúng, vd [2, 0, 1] hoặc mảng string đúng
  
  explanation: string;
  source?: string;
  imageUrl?: string;
  approved: boolean; // Giáo viên đã duyệt hay chưa
  createdAt: string;
  isAiGenerated?: boolean;
}

export interface TopicConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  questionCount: number; // 30 hoặc 70
  durationMinutes: number; // Mặc định 30 phút
  sourceTopics: string[]; // Các chủ đề thành phần cấu thành đề
  order: number;
}

export interface StudentSubmissionAnswer {
  questionId: string;
  type: QuestionType;
  selectedOptionIndex?: number;
  userMatchingPairs?: { leftId: string; rightText: string }[];
  userBlankAnswers?: string[];
  userOrder?: number[];
  isCorrect?: boolean;
  score?: number; // Điểm thành phần
}

export interface StudentSubmission {
  id: string;
  topicId: string;
  topicTitle: string;
  studentName: string;
  className: string;
  schoolName: string;
  startedAt: string;
  submittedAt: string;
  isAutoSubmitted: boolean; // Tự động nộp khi hết giờ
  status: 'completed' | 'in_progress' | 'auto_submitted';
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number; // Thang điểm 10 (làm tròn 2 chữ số thập phân)
  durationSeconds: number;
  answers: StudentSubmissionAnswer[];
  questionsSnapshot?: Question[]; // Snapshot câu hỏi lúc thi để xem lại chính xác
}

export interface TeacherUser {
  id: string;
  username: string;
  fullName: string;
  school: string;
  role: 'teacher' | 'admin';
}
