import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db';
import { generateScienceQuestions } from './server/ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ================= API ROUTES =================

// Auth
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password } = req.body;
  const isValid = db.verifyTeacher(password);
  if (isValid) {
    const config = db.getTeacherConfig();
    return res.json({
      success: true,
      token: 'teacher_session_' + Date.now(),
      teacher: config
    });
  }
  return res.status(401).json({ success: false, message: 'Mật khẩu hoặc mã PIN không chính xác.' });
});

app.get('/api/teacher/config', (_req: Request, res: Response) => {
  res.json(db.getTeacherConfig());
});

app.post('/api/teacher/config', (req: Request, res: Response) => {
  const { pin, password } = req.body;
  db.updateTeacherPin(pin, password);
  res.json({ success: true, message: 'Đã cập nhật thông tin bảo mật giáo viên.' });
});

// Topics
app.get('/api/topics', (_req: Request, res: Response) => {
  res.json(db.getTopics());
});

app.get('/api/topics/:id', (req: Request, res: Response) => {
  const topic = db.getTopicById(req.params.id);
  if (!topic) return res.status(404).json({ message: 'Không tìm thấy chủ đề.' });
  res.json(topic);
});

app.put('/api/topics/:id', (req: Request, res: Response) => {
  const { durationMinutes, questionCount } = req.body;
  const updated = db.updateTopicConfig(req.params.id, durationMinutes, questionCount);
  if (!updated) return res.status(404).json({ message: 'Không tìm thấy chủ đề.' });
  res.json(updated);
});

// Questions
app.get('/api/questions', (req: Request, res: Response) => {
  const { topicId, level, approved, search } = req.query;
  const filter: any = {};
  if (topicId) filter.topicId = String(topicId);
  if (level) filter.level = String(level);
  if (approved !== undefined) filter.approved = approved === 'true';
  if (search) filter.search = String(search);

  const list = db.getQuestions(filter);
  res.json(list);
});

app.get('/api/questions/:id', (req: Request, res: Response) => {
  const q = db.getQuestionById(req.params.id);
  if (!q) return res.status(404).json({ message: 'Không tìm thấy câu hỏi.' });
  res.json(q);
});

app.post('/api/questions', (req: Request, res: Response) => {
  try {
    const newQ = db.addQuestion(req.body);
    res.json(newQ);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/questions/:id', (req: Request, res: Response) => {
  const updated = db.updateQuestion(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Không tìm thấy câu hỏi.' });
  res.json(updated);
});

app.delete('/api/questions/:id', (req: Request, res: Response) => {
  const success = db.deleteQuestion(req.params.id);
  res.json({ success });
});

app.patch('/api/questions/:id/approve', (req: Request, res: Response) => {
  const { approved } = req.body;
  const updated = db.approveQuestion(req.params.id, approved !== false);
  if (!updated) return res.status(404).json({ message: 'Không tìm thấy câu hỏi.' });
  res.json(updated);
});

app.post('/api/questions/bulk-save', (req: Request, res: Response) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    return res.status(400).json({ message: 'Danh sách câu hỏi không hợp lệ.' });
  }
  const added = db.bulkAddQuestions(questions);
  res.json({ success: true, count: added.length, questions: added });
});

// AI Question Generator
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  const { topicId, topicTitle, lessonName, sourceText, cognitiveLevel, questionType, count } = req.body;
  const result = await generateScienceQuestions({
    topicId,
    topicTitle: topicTitle || topicId,
    lessonName,
    sourceText,
    cognitiveLevel,
    questionType,
    count: count ? parseInt(count, 10) : 5
  });
  res.json(result);
});

// Exam Engine
app.post('/api/exam/start', (req: Request, res: Response) => {
  try {
    const { topicId, studentName, className, schoolName } = req.body;
    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập Họ và tên của em.' });
    }
    if (!className || !className.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập Lớp của em.' });
    }

    const session = db.createExamSession(topicId, studentName, className, schoolName);
    res.json(session);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Lỗi khi khởi tạo đề kiểm tra.' });
  }
});

app.post('/api/exam/submit', (req: Request, res: Response) => {
  try {
    const { sessionId, answers, isAutoSubmitted } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'Mã phiên làm bài không hợp lệ.' });
    }
    const result = db.submitExam(sessionId, answers || [], !!isAutoSubmitted);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Lỗi khi nộp bài.' });
  }
});

app.get('/api/exam/result/:id', (req: Request, res: Response) => {
  const submission = db.getSubmissionById(req.params.id);
  if (!submission) {
    return res.status(404).json({ message: 'Không tìm thấy kết quả làm bài này.' });
  }
  res.json(submission);
});

// Submissions for Teacher
app.get('/api/submissions', (req: Request, res: Response) => {
  const { topicId, className, studentName, schoolName, status } = req.query;
  const filter: any = {};
  if (topicId) filter.topicId = String(topicId);
  if (className) filter.className = String(className);
  if (studentName) filter.studentName = String(studentName);
  if (schoolName) filter.schoolName = String(schoolName);
  if (status) filter.status = String(status);

  const list = db.getSubmissions(filter);
  res.json(list);
});

// Statistics
app.get('/api/statistics', (req: Request, res: Response) => {
  const { topicId, className } = req.query;
  const stats = db.getStatistics({
    topicId: topicId ? String(topicId) : undefined,
    className: className ? String(className) : undefined
  });
  res.json(stats);
});

// Database Export & Import
app.get('/api/database/export', (_req: Request, res: Response) => {
  const data = db.exportData();
  res.setHeader('Content-Disposition', 'attachment; filename="thaythong_khoahoc5_backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json(data);
});

app.post('/api/database/import', (req: Request, res: Response) => {
  try {
    const imported = req.body;
    db.importData(imported);
    res.json({ success: true, message: 'Đã phục hồi dữ liệu thành công.' });
  } catch (err: any) {
    res.status(400).json({ message: 'Lỗi phục hồi dữ liệu: ' + err.message });
  }
});

// Setup Vite in Dev or Static files in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server "Thông Thái Cùng Thầy Thông" đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

startServer();
