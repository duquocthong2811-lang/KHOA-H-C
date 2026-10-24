import React, { useState, useEffect } from 'react';
import { fetchTopics, startExamApi, getSubmissionResultApi } from './utils/api';
import { TopicConfig, StudentSubmission } from './types';
import { TeacherLayout, TeacherTab } from './components/TeacherLayout';
import { TeacherDashboard } from './components/TeacherDashboard';
import { QuestionBank } from './components/QuestionBank';
import { TopicManagement } from './components/TopicManagement';
import { QrCodeHub } from './components/QrCodeHub';
import { StudentList } from './components/StudentList';
import { ReportsExport } from './components/ReportsExport';
import { AppSettings } from './components/AppSettings';
import { StudentExamEntry } from './components/StudentExamEntry';
import { StudentExamRoom } from './components/StudentExamRoom';
import { StudentExamResult } from './components/StudentExamResult';
import { TeacherLoginModal } from './components/TeacherLoginModal';

export default function App() {
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('chud_1');
  const [view, setView] = useState<'student_entry' | 'student_exam' | 'student_result' | 'teacher_portal'>('student_entry');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('dashboard');

  // Teacher Auth State
  const [teacherToken, setTeacherToken] = useState<string | null>(() => {
    return sessionStorage.getItem('thaythong_teacher_token');
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Active Exam Session & Result
  const [examSession, setExamSession] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<{
    studentName: string;
    className: string;
    schoolName: string;
  }>({
    studentName: '',
    className: '5/1',
    schoolName: 'Trường Tiểu học Lương Thế Vinh'
  });
  const [examResult, setExamResult] = useState<StudentSubmission | null>(null);

  // Initial URL parsing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topicParam = params.get('topic');
    const viewParam = params.get('view');
    const resultParam = params.get('result');

    if (topicParam) {
      setSelectedTopicId(topicParam);
    }

    if (viewParam === 'teacher') {
      if (sessionStorage.getItem('thaythong_teacher_token')) {
        setView('teacher_portal');
      } else {
        setIsLoginModalOpen(true);
      }
    }

    if (resultParam) {
      getSubmissionResultApi(resultParam)
        .then((res) => {
          setExamResult(res);
          setView('student_result');
        })
        .catch((e) => console.warn('Could not load result from URL param', e));
    }

    // Load topics
    fetchTopics()
      .then((tList) => {
        setTopics(tList);
        if (topicParam && tList.some((t) => t.id === topicParam)) {
          setSelectedTopicId(topicParam);
        } else if (tList.length > 0 && !topicParam) {
          setSelectedTopicId(tList[0].id);
        }
      })
      .catch((err) => console.error('Failed to load initial topics:', err));
  }, []);

  // Handle Teacher Login Success
  const handleLoginSuccess = (token: string, _teacher: any) => {
    setTeacherToken(token);
    sessionStorage.setItem('thaythong_teacher_token', token);
    setView('teacher_portal');
  };

  const handleTeacherLogout = () => {
    setTeacherToken(null);
    sessionStorage.removeItem('thaythong_teacher_token');
    setView('student_entry');
  };

  // Start Student Exam
  const handleStartExam = async (info: {
    studentName: string;
    className: string;
    schoolName: string;
    topicId: string;
  }) => {
    try {
      setStudentInfo(info);
      const session = await startExamApi(info);
      setExamSession(session);
      setView('student_exam');
    } catch (err: any) {
      alert(err.message || 'Không thể khởi tạo bài thi lúc này.');
    }
  };

  // Student Finishes Exam
  const handleExamFinish = (result: StudentSubmission) => {
    setExamResult(result);
    setView('student_result');
  };

  // Retake exam with same topic
  const handleRetakeExam = () => {
    if (examResult) {
      setSelectedTopicId(examResult.topicId);
    }
    setView('student_entry');
  };

  // ================= RENDER VIEWS =================

  // 1. Student Exam Room
  if (view === 'student_exam' && examSession) {
    return (
      <StudentExamRoom
        sessionData={examSession}
        studentInfo={studentInfo}
        onFinish={handleExamFinish}
      />
    );
  }

  // 2. Student Result Screen
  if (view === 'student_result' && examResult) {
    return (
      <StudentExamResult
        result={examResult}
        onRetake={handleRetakeExam}
        onGoHome={() => setView('student_entry')}
      />
    );
  }

  // 3. Teacher Portal
  if (view === 'teacher_portal') {
    return (
      <TeacherLayout
        currentTab={teacherTab}
        onSelectTab={(tab) => setTeacherTab(tab)}
        onLogout={handleTeacherLogout}
        onOpenStudentView={() => setView('student_entry')}
      >
        {teacherTab === 'dashboard' && (
          <TeacherDashboard onNavigateTab={(tab) => setTeacherTab(tab)} />
        )}
        {teacherTab === 'questions' && <QuestionBank />}
        {teacherTab === 'topics' && (
          <TopicManagement
            onNavigateToQr={(topicId) => {
              if (topicId) setSelectedTopicId(topicId);
              setTeacherTab('qrcodes');
            }}
            onNavigateToStudentView={(topicId) => {
              if (topicId) setSelectedTopicId(topicId);
              setView('student_entry');
            }}
          />
        )}
        {teacherTab === 'qrcodes' && (
          <QrCodeHub
            selectedTopicId={selectedTopicId}
            onOpenStudentQuiz={(topicId) => {
              setSelectedTopicId(topicId);
              setView('student_entry');
            }}
          />
        )}
        {teacherTab === 'students' && <StudentList />}
        {teacherTab === 'statistics' && (
          <TeacherDashboard onNavigateTab={(tab) => setTeacherTab(tab)} />
        )}
        {teacherTab === 'reports' && <ReportsExport />}
        {teacherTab === 'settings' && <AppSettings />}
      </TeacherLayout>
    );
  }

  // 4. Default: Student Exam Entry Screen
  return (
    <>
      <StudentExamEntry
        topics={topics}
        selectedTopicId={selectedTopicId}
        onSelectTopic={(id) => setSelectedTopicId(id)}
        onStartExam={handleStartExam}
        onOpenTeacherLogin={() => {
          if (teacherToken) {
            setView('teacher_portal');
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      />

      <TeacherLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
