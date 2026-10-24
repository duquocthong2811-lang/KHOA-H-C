import { Question, StudentSubmission, TopicConfig, StudentSubmissionAnswer } from '../types';

export const API_BASE = '/api';

export async function fetchTeacherConfig() {
  const res = await fetch(`${API_BASE}/teacher/config`);
  if (!res.ok) throw new Error('Không thể tải cấu hình giáo viên');
  return res.json();
}

export async function teacherLogin(password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Đăng nhập không thành công');
  return data;
}

export async function updateTeacherSecurity(pin: string, password?: string) {
  const res = await fetch(`${API_BASE}/teacher/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể cập nhật mã PIN');
  return data;
}

export async function fetchTopics(): Promise<TopicConfig[]> {
  const res = await fetch(`${API_BASE}/topics`);
  if (!res.ok) throw new Error('Không thể tải danh sách chủ đề');
  return res.json();
}

export async function updateTopic(id: string, durationMinutes: number, questionCount?: number) {
  const res = await fetch(`${API_BASE}/topics/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ durationMinutes, questionCount })
  });
  if (!res.ok) throw new Error('Không thể cập nhật chủ đề');
  return res.json();
}

export async function fetchQuestions(filter?: {
  topicId?: string;
  level?: string;
  approved?: boolean;
  search?: string;
}): Promise<Question[]> {
  const params = new URLSearchParams();
  if (filter?.topicId) params.append('topicId', filter.topicId);
  if (filter?.level) params.append('level', filter.level);
  if (filter?.approved !== undefined) params.append('approved', String(filter.approved));
  if (filter?.search) params.append('search', filter.search);

  const res = await fetch(`${API_BASE}/questions?${params.toString()}`);
  if (!res.ok) throw new Error('Không thể tải danh sách câu hỏi');
  return res.json();
}

export async function createQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question)
  });
  if (!res.ok) throw new Error('Không thể tạo câu hỏi');
  return res.json();
}

export async function updateQuestionApi(id: string, updates: Partial<Question>): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Không thể cập nhật câu hỏi');
  return res.json();
}

export async function deleteQuestionApi(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/questions/${id}`, {
    method: 'DELETE'
  });
  return res.ok;
}

export async function toggleApproveQuestion(id: string, approved: boolean): Promise<Question> {
  const res = await fetch(`${API_BASE}/questions/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved })
  });
  if (!res.ok) throw new Error('Không thể cập nhật duyệt câu hỏi');
  return res.json();
}

export async function bulkSaveQuestions(questions: Omit<Question, 'id' | 'createdAt'>[]) {
  const res = await fetch(`${API_BASE}/questions/bulk-save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions })
  });
  if (!res.ok) throw new Error('Không thể lưu danh sách câu hỏi');
  return res.json();
}

export async function generateAiQuestions(params: {
  topicId: string;
  topicTitle: string;
  lessonName?: string;
  sourceText?: string;
  cognitiveLevel?: string;
  questionType?: string;
  count: number;
}) {
  const res = await fetch(`${API_BASE}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Lỗi khi gọi Trợ lí AI biên soạn câu hỏi');
  return res.json();
}

// Exam
export async function startExamApi(payload: {
  topicId: string;
  studentName: string;
  className: string;
  schoolName: string;
}) {
  const res = await fetch(`${API_BASE}/exam/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể bắt đầu làm bài');
  return data;
}

export async function submitExamApi(payload: {
  sessionId: string;
  answers: StudentSubmissionAnswer[];
  isAutoSubmitted: boolean;
}): Promise<StudentSubmission> {
  const res = await fetch(`${API_BASE}/exam/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể nộp bài');
  return data;
}

export async function getSubmissionResultApi(id: string): Promise<StudentSubmission> {
  const res = await fetch(`${API_BASE}/exam/result/${id}`);
  if (!res.ok) throw new Error('Không tìm thấy kết quả làm bài');
  return res.json();
}

export async function fetchSubmissions(filter?: {
  topicId?: string;
  className?: string;
  studentName?: string;
  status?: string;
}): Promise<StudentSubmission[]> {
  const params = new URLSearchParams();
  if (filter?.topicId) params.append('topicId', filter.topicId);
  if (filter?.className) params.append('className', filter.className);
  if (filter?.studentName) params.append('studentName', filter.studentName);
  if (filter?.status) params.append('status', filter.status);

  const res = await fetch(`${API_BASE}/submissions?${params.toString()}`);
  if (!res.ok) throw new Error('Không thể tải danh sách học sinh');
  return res.json();
}

export async function fetchStatistics(filter?: { topicId?: string; className?: string }) {
  const params = new URLSearchParams();
  if (filter?.topicId) params.append('topicId', filter.topicId);
  if (filter?.className) params.append('className', filter.className);

  const res = await fetch(`${API_BASE}/statistics?${params.toString()}`);
  if (!res.ok) throw new Error('Không thể tải dữ liệu thống kê');
  return res.json();
}

export async function restoreDatabaseApi(data: any) {
  const res = await fetch(`${API_BASE}/database/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Lỗi phục hồi dữ liệu');
  return json;
}
