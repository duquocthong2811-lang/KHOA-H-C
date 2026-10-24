import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Question, StudentSubmission, TopicConfig, CognitiveLevel, StudentSubmissionAnswer } from '../src/types';
import { INITIAL_QUESTIONS, TOPICS } from './seedQuestions';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  teacherConfig: {
    fullName: string;
    school: string;
    subject: string;
    passwordHash: string; // SHA-256
    salt: string;
    pin: string;
  };
  topics: TopicConfig[];
  questions: Question[];
  submissions: StudentSubmission[];
  activeExamSessions: {
    sessionId: string;
    topicId: string;
    studentName: string;
    className: string;
    schoolName: string;
    startedAt: string;
    durationMinutes: number;
    questionIds: string[];
    // Server-side mapping to grade precisely
    correctAnswerMap: Record<string, any>;
    questionsSnapshot: Question[];
  }[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure topics and questions have full seeds if empty
        if (!parsed.questions || parsed.questions.length === 0) {
          parsed.questions = [...INITIAL_QUESTIONS];
        }
        if (!parsed.topics || parsed.topics.length === 0) {
          parsed.topics = [...TOPICS];
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error loading database file, initializing fresh:', err);
    }

    const defaultSalt = 'duquocthong_lương_the_vinh_khoahoc5';
    const initialDb: DatabaseSchema = {
      teacherConfig: {
        fullName: 'Dư Quốc Thông',
        school: 'Trường Tiểu học Lương Thế Vinh',
        subject: 'Khoa học lớp 5',
        passwordHash: hashPassword('thongthaythong2025', defaultSalt),
        salt: defaultSalt,
        pin: '123456'
      },
      topics: [...TOPICS],
      questions: [...INITIAL_QUESTIONS],
      submissions: [],
      activeExamSessions: []
    };

    this.save(initialDb);
    return initialDb;
  }

  public save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const toWrite = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(toWrite, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // Teacher Auth
  public verifyTeacher(passwordOrPin: string): boolean {
    if (!passwordOrPin) return false;
    if (passwordOrPin.trim() === this.data.teacherConfig.pin) return true;
    const computed = hashPassword(passwordOrPin.trim(), this.data.teacherConfig.salt);
    return computed === this.data.teacherConfig.passwordHash;
  }

  public updateTeacherPin(newPin: string, newPassword?: string) {
    if (newPin && newPin.trim()) {
      this.data.teacherConfig.pin = newPin.trim();
    }
    if (newPassword && newPassword.trim()) {
      this.data.teacherConfig.passwordHash = hashPassword(newPassword.trim(), this.data.teacherConfig.salt);
    }
    this.save();
  }

  public getTeacherConfig() {
    return {
      fullName: this.data.teacherConfig.fullName,
      school: this.data.teacherConfig.school,
      subject: this.data.teacherConfig.subject,
      pin: this.data.teacherConfig.pin
    };
  }

  // Topics
  public getTopics(): TopicConfig[] {
    return this.data.topics;
  }

  public getTopicById(id: string): TopicConfig | undefined {
    return this.data.topics.find((t) => t.id === id);
  }

  public updateTopicConfig(topicId: string, durationMinutes: number, questionCount?: number) {
    const topic = this.data.topics.find((t) => t.id === topicId);
    if (topic) {
      if (durationMinutes > 0) topic.durationMinutes = durationMinutes;
      if (questionCount && questionCount > 0) topic.questionCount = questionCount;
      this.save();
    }
    return topic;
  }

  // Questions
  public getQuestions(filter?: { topicId?: string; level?: CognitiveLevel; approved?: boolean; search?: string }): Question[] {
    let list = [...this.data.questions];
    if (filter) {
      if (filter.topicId) {
        list = list.filter((q) => q.topicId === filter.topicId);
      }
      if (filter.level) {
        list = list.filter((q) => q.cognitiveLevel === filter.level);
      }
      if (filter.approved !== undefined) {
        list = list.filter((q) => q.approved === filter.approved);
      }
      if (filter.search) {
        const s = filter.search.toLowerCase();
        list = list.filter(
          (q) =>
            q.content.toLowerCase().includes(s) ||
            q.lesson?.toLowerCase().includes(s) ||
            q.source?.toLowerCase().includes(s)
        );
      }
    }
    return list;
  }

  public getQuestionById(id: string): Question | undefined {
    return this.data.questions.find((q) => q.id === id);
  }

  public addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Question {
    const newQ: Question = {
      ...question,
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    this.data.questions.unshift(newQ);
    this.save();
    return newQ;
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | null {
    const idx = this.data.questions.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    this.data.questions[idx] = { ...this.data.questions[idx], ...updates };
    this.save();
    return this.data.questions[idx];
  }

  public deleteQuestion(id: string): boolean {
    const prevLen = this.data.questions.length;
    this.data.questions = this.data.questions.filter((q) => q.id !== id);
    if (this.data.questions.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  public approveQuestion(id: string, approved: boolean = true): Question | null {
    return this.updateQuestion(id, { approved });
  }

  public bulkAddQuestions(questions: Omit<Question, 'id' | 'createdAt'>[]): Question[] {
    const added: Question[] = [];
    for (const q of questions) {
      const newQ: Question = {
        ...q,
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString()
      };
      this.data.questions.unshift(newQ);
      added.push(newQ);
    }
    this.save();
    return added;
  }

  // Generate Exam Engine
  public createExamSession(
    topicId: string,
    studentName: string,
    className: string,
    schoolName: string
  ): {
    sessionId: string;
    topic: TopicConfig;
    questionsForStudent: any[];
    startedAt: string;
    durationMinutes: number;
    totalQuestions: number;
  } {
    const topic = this.getTopicById(topicId);
    if (!topic) {
      throw new Error(`Chủ đề '${topicId}' không tồn tại trong hệ thống.`);
    }

    // Get all approved questions from source topics
    const candidateQuestions = this.data.questions.filter(
      (q) => q.approved && topic.sourceTopics.includes(q.topicId)
    );

    // Group by level
    const nbList = candidateQuestions.filter((q) => q.cognitiveLevel === 'nhan_biet');
    const knList = candidateQuestions.filter((q) => q.cognitiveLevel === 'ket_noi');
    const vdList = candidateQuestions.filter((q) => q.cognitiveLevel === 'van_dung');

    const totalCount = topic.questionCount; // 30 or 70
    // Required 50% - 30% - 20%
    const targetNb = Math.round(totalCount * 0.5); // 15 for 30; 35 for 70
    const targetKn = Math.round(totalCount * 0.3); // 9 for 30; 21 for 70
    const targetVd = totalCount - targetNb - targetKn; // 6 for 30; 14 for 70

    // Helper to pick randomly
    const pickRandom = (arr: Question[], count: number): Question[] => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      if (shuffled.length >= count) {
        return shuffled.slice(0, count);
      }
      // If not enough unique, cycle through available
      const result: Question[] = [];
      let i = 0;
      while (result.length < count && shuffled.length > 0) {
        result.push(shuffled[i % shuffled.length]);
        i++;
      }
      return result;
    };

    const pickedNb = pickRandom(nbList, targetNb);
    const pickedKn = pickRandom(knList, targetKn);
    const pickedVd = pickRandom(vdList, targetVd);

    const combinedQuestions = [...pickedNb, ...pickedKn, ...pickedVd].sort(() => Math.random() - 0.5);

    const sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const startedAt = new Date().toISOString();

    const correctAnswerMap: Record<string, any> = {};
    const questionsForStudent: any[] = [];
    const questionsSnapshot: Question[] = [];

    // Shuffle options & format questions for student view (do not expose correct answer!)
    combinedQuestions.forEach((q, idx) => {
      const qCopy = JSON.parse(JSON.stringify(q)) as Question;
      questionsSnapshot.push(qCopy);

      if (q.type === 'multiple_choice') {
        const originalOptions = q.options || [];
        const originalCorrectIdx = q.correctOptionIndex ?? 0;
        const correctText = originalOptions[originalCorrectIdx] || '';

        // Shuffle options
        const indexedOptions = originalOptions.map((opt, i) => ({ opt, originalIndex: i }));
        indexedOptions.sort(() => Math.random() - 0.5);

        const newOptions = indexedOptions.map((item) => item.opt);
        const newCorrectIdx = indexedOptions.findIndex((item) => item.opt === correctText);

        correctAnswerMap[q.id] = {
          type: 'multiple_choice',
          correctIndex: newCorrectIdx >= 0 ? newCorrectIdx : 0
        };

        questionsForStudent.push({
          id: q.id,
          number: idx + 1,
          topicId: q.topicId,
          content: q.content,
          type: q.type,
          cognitiveLevel: q.cognitiveLevel,
          options: newOptions,
          lesson: q.lesson,
          imageUrl: q.imageUrl
        });
      } else if (q.type === 'matching') {
        const pairs = q.matchingPairs || [];
        // Left items stay or shuffled, Right items shuffled
        const leftItems = pairs.map((p) => ({ id: p.id, text: p.left }));
        const rightItems = pairs.map((p) => p.right).sort(() => Math.random() - 0.5);

        correctAnswerMap[q.id] = {
          type: 'matching',
          pairs: pairs.reduce((acc, curr) => {
            acc[curr.id] = curr.right;
            return acc;
          }, {} as Record<string, string>)
        };

        questionsForStudent.push({
          id: q.id,
          number: idx + 1,
          topicId: q.topicId,
          content: q.content,
          type: q.type,
          cognitiveLevel: q.cognitiveLevel,
          matchingLeft: leftItems,
          matchingRight: rightItems,
          lesson: q.lesson,
          imageUrl: q.imageUrl
        });
      } else if (q.type === 'fill_in_the_blank') {
        const blankOpts = [...(q.blankOptions || [])].sort(() => Math.random() - 0.5);
        correctAnswerMap[q.id] = {
          type: 'fill_in_the_blank',
          correctAnswers: q.blankAnswers || []
        };

        questionsForStudent.push({
          id: q.id,
          number: idx + 1,
          topicId: q.topicId,
          content: q.content,
          type: q.type,
          cognitiveLevel: q.cognitiveLevel,
          blankTemplate: q.blankTemplate,
          blankOptions: blankOpts,
          lesson: q.lesson,
          imageUrl: q.imageUrl
        });
      } else if (q.type === 'ordering') {
        const originalItems = q.orderingItems || [];
        const correctOrder = q.correctOrder || originalItems.map((_, i) => i);
        // Correct order string array
        const correctSequence = correctOrder.map((idxVal) => originalItems[idxVal]);

        // Shuffle items for student
        const shuffledItems = [...originalItems].sort(() => Math.random() - 0.5);

        correctAnswerMap[q.id] = {
          type: 'ordering',
          correctSequence
        };

        questionsForStudent.push({
          id: q.id,
          number: idx + 1,
          topicId: q.topicId,
          content: q.content,
          type: q.type,
          cognitiveLevel: q.cognitiveLevel,
          orderingItems: shuffledItems,
          lesson: q.lesson,
          imageUrl: q.imageUrl
        });
      }
    });

    // Store active session in memory & DB
    const sessionRecord = {
      sessionId,
      topicId: topic.id,
      studentName: studentName.trim(),
      className: className.trim(),
      schoolName: schoolName.trim() || 'Trường Tiểu học Lương Thế Vinh',
      startedAt,
      durationMinutes: topic.durationMinutes,
      questionIds: combinedQuestions.map((q) => q.id),
      correctAnswerMap,
      questionsSnapshot
    };

    this.data.activeExamSessions.push(sessionRecord);
    // Keep only recent 500 active sessions
    if (this.data.activeExamSessions.length > 500) {
      this.data.activeExamSessions.shift();
    }
    this.save();

    return {
      sessionId,
      topic,
      questionsForStudent,
      startedAt,
      durationMinutes: topic.durationMinutes,
      totalQuestions: combinedQuestions.length
    };
  }

  // Submit Exam & Auto-Grade
  public submitExam(
    sessionId: string,
    userAnswers: StudentSubmissionAnswer[],
    isAutoSubmitted: boolean = false
  ): StudentSubmission {
    const session = this.data.activeExamSessions.find((s) => s.sessionId === sessionId);
    if (!session) {
      throw new Error('Phiên làm bài không tồn tại hoặc đã hết hiệu lực.');
    }

    const topic = this.getTopicById(session.topicId);
    const submittedAt = new Date().toISOString();
    const startTime = new Date(session.startedAt).getTime();
    const endTime = new Date(submittedAt).getTime();
    const durationSeconds = Math.max(1, Math.floor((endTime - startTime) / 1000));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScoreSum = 0;

    const evaluatedAnswers: StudentSubmissionAnswer[] = [];

    // Map each question in snapshot
    session.questionsSnapshot.forEach((q) => {
      const uAns = userAnswers.find((a) => a.questionId === q.id);
      const correctMeta = session.correctAnswerMap[q.id];

      if (!uAns) {
        unansweredCount++;
        evaluatedAnswers.push({
          questionId: q.id,
          type: q.type,
          isCorrect: false,
          score: 0
        });
        return;
      }

      let isCorrect = false;
      let questionScore = 0;

      if (q.type === 'multiple_choice') {
        if (uAns.selectedOptionIndex === undefined || uAns.selectedOptionIndex === null) {
          unansweredCount++;
        } else if (uAns.selectedOptionIndex === correctMeta.correctIndex) {
          isCorrect = true;
          questionScore = 1;
          correctCount++;
        } else {
          wrongCount++;
        }
      } else if (q.type === 'matching') {
        const userPairs = uAns.userMatchingPairs || [];
        const requiredPairs = correctMeta.pairs as Record<string, string>;
        const totalPairs = Object.keys(requiredPairs).length;

        if (userPairs.length === 0) {
          unansweredCount++;
        } else {
          let matched = 0;
          userPairs.forEach((up) => {
            if (requiredPairs[up.leftId] === up.rightText) {
              matched++;
            }
          });
          questionScore = totalPairs > 0 ? matched / totalPairs : 0;
          if (matched === totalPairs && totalPairs > 0) {
            isCorrect = true;
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      } else if (q.type === 'fill_in_the_blank') {
        const userBlanks = uAns.userBlankAnswers || [];
        const correctBlanks = correctMeta.correctAnswers as string[];
        const totalBlanks = correctBlanks.length;

        if (userBlanks.length === 0 || userBlanks.every((b) => !b)) {
          unansweredCount++;
        } else {
          let matched = 0;
          correctBlanks.forEach((ans, i) => {
            if (userBlanks[i] && userBlanks[i].trim().toLowerCase() === ans.trim().toLowerCase()) {
              matched++;
            }
          });
          questionScore = totalBlanks > 0 ? matched / totalBlanks : 0;
          if (matched === totalBlanks && totalBlanks > 0) {
            isCorrect = true;
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      } else if (q.type === 'ordering') {
        const userOrderItems = uAns.userOrder || [];
        const correctSequence = correctMeta.correctSequence as string[];

        // Check user ordering
        if (!userOrderItems || userOrderItems.length === 0) {
          unansweredCount++;
        } else {
          // Compare strings
          const qItems = q.orderingItems || [];
          const userSequence = userOrderItems.map((idx) => qItems[idx]);
          const isAllMatch =
            userSequence.length === correctSequence.length &&
            userSequence.every((val, i) => val === correctSequence[i]);

          if (isAllMatch) {
            isCorrect = true;
            questionScore = 1;
            correctCount++;
          } else {
            wrongCount++;
          }
        }
      }

      totalScoreSum += questionScore;
      evaluatedAnswers.push({
        questionId: q.id,
        type: q.type,
        selectedOptionIndex: uAns.selectedOptionIndex,
        userMatchingPairs: uAns.userMatchingPairs,
        userBlankAnswers: uAns.userBlankAnswers,
        userOrder: uAns.userOrder,
        isCorrect,
        score: questionScore
      });
    });

    const totalQuestions = session.questionsSnapshot.length;
    // Calculate final score out of 10, rounded to 2 decimal places
    const rawScore = totalQuestions > 0 ? (totalScoreSum / totalQuestions) * 10 : 0;
    const finalScore = Math.round(rawScore * 100) / 100;

    const submission: StudentSubmission = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      topicId: session.topicId,
      topicTitle: topic?.title || session.topicId,
      studentName: session.studentName,
      className: session.className,
      schoolName: session.schoolName,
      startedAt: session.startedAt,
      submittedAt,
      isAutoSubmitted,
      status: isAutoSubmitted ? 'auto_submitted' : 'completed',
      totalQuestions,
      correctCount,
      wrongCount,
      unansweredCount,
      score: finalScore,
      durationSeconds,
      answers: evaluatedAnswers,
      questionsSnapshot: session.questionsSnapshot
    };

    this.data.submissions.unshift(submission);
    // Remove session
    this.data.activeExamSessions = this.data.activeExamSessions.filter((s) => s.sessionId !== sessionId);
    this.save();

    return submission;
  }

  // Submissions Queries
  public getSubmissions(filter?: {
    topicId?: string;
    className?: string;
    studentName?: string;
    schoolName?: string;
    status?: string;
  }): StudentSubmission[] {
    let list = [...this.data.submissions];
    if (filter) {
      if (filter.topicId) {
        list = list.filter((s) => s.topicId === filter.topicId);
      }
      if (filter.className) {
        list = list.filter((s) => s.className.toLowerCase() === filter.className!.toLowerCase());
      }
      if (filter.studentName) {
        const q = filter.studentName.toLowerCase();
        list = list.filter((s) => s.studentName.toLowerCase().includes(q));
      }
      if (filter.schoolName) {
        const sc = filter.schoolName.toLowerCase();
        list = list.filter((s) => s.schoolName.toLowerCase().includes(sc));
      }
      if (filter.status) {
        list = list.filter((s) => s.status === filter.status);
      }
    }
    // Default sort by score desc, then by duration ascending
    return list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.durationSeconds - b.durationSeconds;
    });
  }

  public getSubmissionById(id: string): StudentSubmission | undefined {
    return this.data.submissions.find((s) => s.id === id);
  }

  // Statistics for Dashboard
  public getStatistics(filter?: { topicId?: string; className?: string }) {
    let list = [...this.data.submissions];
    if (filter?.topicId) {
      list = list.filter((s) => s.topicId === filter.topicId);
    }
    if (filter?.className) {
      list = list.filter((s) => s.className.toLowerCase() === filter.className!.toLowerCase());
    }

    const totalAttempts = list.length;
    const uniqueStudents = new Set(list.map((s) => `${s.studentName}_${s.className}`)).size;
    const completedCount = list.filter((s) => s.status === 'completed').length;
    const autoSubmittedCount = list.filter((s) => s.status === 'auto_submitted').length;

    const scores = list.map((s) => s.score);
    const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    let totalCorrect = 0;
    let totalQuestions = 0;
    list.forEach((s) => {
      totalCorrect += s.correctCount;
      totalQuestions += s.totalQuestions;
    });
    const correctRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;

    // Distribution by score bracket: [0-5), [5-6.5), [6.5-8), [8-9), [9-10]
    const brackets = {
      poor: list.filter((s) => s.score < 5).length,
      average: list.filter((s) => s.score >= 5 && s.score < 6.5).length,
      good: list.filter((s) => s.score >= 6.5 && s.score < 8).length,
      veryGood: list.filter((s) => s.score >= 8 && s.score < 9).length,
      excellent: list.filter((s) => s.score >= 9).length
    };

    // Attempts by topic
    const topicCounts: Record<string, { title: string; count: number; avgScore: number }> = {};
    this.data.topics.forEach((t) => {
      const topicSubs = list.filter((s) => s.topicId === t.id);
      const tScores = topicSubs.map((s) => s.score);
      const tAvg = tScores.length > 0 ? Math.round((tScores.reduce((a, b) => a + b, 0) / tScores.length) * 10) / 10 : 0;
      topicCounts[t.id] = {
        title: t.shortTitle,
        count: topicSubs.length,
        avgScore: tAvg
      };
    });

    // Cognitive Level Analysis across all submissions
    let nbTotal = 0;
    let nbCorrect = 0;
    let knTotal = 0;
    let knCorrect = 0;
    let vdTotal = 0;
    let vdCorrect = 0;

    list.forEach((s) => {
      if (s.questionsSnapshot && s.answers) {
        s.questionsSnapshot.forEach((q) => {
          const a = s.answers.find((ans) => ans.questionId === q.id);
          if (q.cognitiveLevel === 'nhan_biet') {
            nbTotal++;
            if (a?.isCorrect) nbCorrect++;
          } else if (q.cognitiveLevel === 'ket_noi') {
            knTotal++;
            if (a?.isCorrect) knCorrect++;
          } else if (q.cognitiveLevel === 'van_dung') {
            vdTotal++;
            if (a?.isCorrect) vdCorrect++;
          }
        });
      }
    });

    return {
      totalAttempts,
      uniqueStudents,
      completedCount,
      autoSubmittedCount,
      completionRate: totalAttempts > 0 ? Math.round((completedCount / totalAttempts) * 1000) / 10 : 100,
      avgScore,
      maxScore,
      minScore,
      correctRate,
      brackets,
      topicCounts,
      cognitiveLevels: {
        nhan_biet: { total: nbTotal, correct: nbCorrect, percent: nbTotal > 0 ? Math.round((nbCorrect / nbTotal) * 100) : 0 },
        ket_noi: { total: knTotal, correct: knCorrect, percent: knTotal > 0 ? Math.round((knCorrect / knTotal) * 100) : 0 },
        van_dung: { total: vdTotal, correct: vdCorrect, percent: vdTotal > 0 ? Math.round((vdCorrect / vdTotal) * 100) : 0 }
      }
    };
  }

  // Backup & Restore
  public exportData(): DatabaseSchema {
    return this.data;
  }

  public importData(imported: Partial<DatabaseSchema>) {
    if (imported.questions) this.data.questions = imported.questions;
    if (imported.topics) this.data.topics = imported.topics;
    if (imported.submissions) this.data.submissions = imported.submissions;
    if (imported.teacherConfig) this.data.teacherConfig = { ...this.data.teacherConfig, ...imported.teacherConfig };
    this.save();
    return true;
  }
}

export const db = new Database();
