import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  Share2
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface StudentExamResultProps {
  result: StudentSubmission;
  onRetake: () => void;
  onGoHome: () => void;
}

export const StudentExamResult: React.FC<StudentExamResultProps> = ({
  result,
  onRetake,
  onGoHome
}) => {
  useEffect(() => {
    // Trigger celebratory confetti if score >= 8
    if (result.score >= 8) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [result.score]);

  const mins = Math.floor(result.durationSeconds / 60);
  const secs = result.durationSeconds % 60;
  const timeFormatted = `${mins} phút ${secs} giây`;
  const accuracy = Math.round((result.correctCount / result.totalQuestions) * 100);

  // Motivational message from Thầy Dư Quốc Thông
  const teacherMessage =
    result.score >= 9
      ? 'Xuất sắc tuyệt vời! Thầy Thông rất tự hào về em. Em đã nắm rất vững kiến thức Khoa học lớp 5 và vận dụng giải quyết tình huống rất thông minh!'
      : result.score >= 8
      ? 'Giỏi lắm! Em có nền tảng kiến thức rất tốt. Hãy tiếp tục phát huy ở các bài học tiếp theo nhé!'
      : result.score >= 6.5
      ? 'Khá tốt! Em đã làm đúng phần lớn câu hỏi. Hãy xem kĩ các câu chưa đúng bên dưới để củng cố thêm kiến thức nhé!'
      : result.score >= 5
      ? 'Cố gắng lên em! Em đã đạt mức điểm trung bình. Thầy khuyên em nên đọc lại các bài học trong SGK và làm thêm lượt mới để tiến bộ hơn!'
      : 'Đừng nản lòng em nhé! Hãy xem kĩ phần giải thích chi tiết của từng câu bên dưới, ghi nhớ kiến thức và thử sức làm lại một lượt nữa cùng Thầy nhé!';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-['Nunito',sans-serif]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Result Card Hero */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-xl overflow-hidden relative">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
              <span>Kết quả kiểm tra Khoa học 5</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              KẾT QUẢ BÀI LÀM
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-bold">
              {result.studentName} • Lớp {result.className} • {result.schoolName}
            </p>
            <p className="text-xs text-indigo-700 font-extrabold">
              {result.topicTitle}
            </p>

            {/* Score Big Badge */}
            <div className="py-4">
              <div
                className={`inline-flex flex-col items-center justify-center w-36 h-36 md:w-44 md:h-44 rounded-full border-4 shadow-xl transition transform hover:scale-105 ${
                  result.score >= 9
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300 text-white'
                    : result.score >= 8
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 border-blue-300 text-white'
                    : result.score >= 6.5
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 border-indigo-200 text-white'
                    : result.score >= 5
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-400 border-amber-200 text-white'
                    : 'bg-gradient-to-tr from-rose-500 to-red-600 border-rose-300 text-white'
                }`}
              >
                <span className="text-4xl md:text-5xl font-black tracking-tight">
                  {result.score}
                </span>
                <span className="text-xs uppercase font-extrabold tracking-widest opacity-80 mt-1">
                  Thang điểm 10
                </span>
              </div>
            </div>

            {/* Teacher Feedback Quote */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 max-w-2xl mx-auto text-left flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow">
                🦉
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 mb-0.5">
                  Lời nhắn từ Thầy Dư Quốc Thông:
                </p>
                <p className="text-xs text-blue-800 leading-relaxed font-semibold">
                  "{teacherMessage}"
                </p>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs font-bold">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block mb-1">Số câu đúng</span>
                <span className="text-emerald-600 text-lg font-black">
                  {result.correctCount} / {result.totalQuestions} câu
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block mb-1">Số câu sai</span>
                <span className="text-rose-500 text-lg font-black">
                  {result.wrongCount} câu
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block mb-1">Chưa trả lời</span>
                <span className="text-slate-600 text-lg font-black">
                  {result.unansweredCount} câu
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 block mb-1">Thời gian làm bài</span>
                <span className="text-indigo-600 text-sm font-black">
                  {timeFormatted}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handlePrint}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>In kết quả / Lưu PDF</span>
              </button>

              <button
                onClick={onRetake}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại lượt mới (Trộn câu mới)</span>
              </button>

              <button
                onClick={onGoHome}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
              >
                <span>Về trang chủ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Questions Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg text-slate-800">
              Chi Tiết Từng Câu Hỏi & Lời Giải Thích
            </h2>
            <span className="text-xs text-slate-500 font-semibold">
              Tổng số {result.totalQuestions} câu
            </span>
          </div>

          <div className="space-y-4">
            {(result.questionsSnapshot || []).map((q, idx) => {
              const studentAns = result.answers.find((a) => a.questionId === q.id);
              const isCorrect = studentAns?.isCorrect;
              const isUnanswered =
                studentAns?.selectedOptionIndex === undefined &&
                !studentAns?.userBlankAnswers?.length &&
                !studentAns?.userMatchingPairs?.length &&
                !studentAns?.userOrder?.length;

              return (
                <div
                  key={q.id || idx}
                  className={`bg-white rounded-3xl p-5 border-2 transition shadow-xs ${
                    isCorrect
                      ? 'border-emerald-200'
                      : isUnanswered
                      ? 'border-slate-200'
                      : 'border-rose-200'
                  }`}
                >
                  {/* Question top tag */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          q.cognitiveLevel === 'nhan_biet'
                            ? 'bg-blue-100 text-blue-700'
                            : q.cognitiveLevel === 'ket_noi'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {q.cognitiveLevel === 'nhan_biet'
                          ? 'Nhận biết'
                          : q.cognitiveLevel === 'ket_noi'
                          ? 'Kết nối'
                          : 'Vận dụng'}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : isUnanswered
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? '✓ Đúng' : isUnanswered ? '○ Chưa trả lời' : '✗ Sai'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm md:text-base text-slate-800 mb-3">
                    {q.content}
                  </h3>

                  {/* Multiple Choice Review */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2 mb-3 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isStudentChoice = studentAns?.selectedOptionIndex === oIdx;
                        const isCorrectChoice = oIdx === q.correctOptionIndex;

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-2xl border flex items-center justify-between ${
                              isCorrectChoice
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                                : isStudentChoice
                                ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="font-black">{['A', 'B', 'C'][oIdx]}.</span>
                              <span>{opt}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              {isStudentChoice && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md">
                                  Lựa chọn của em
                                </span>
                              )}
                              {isCorrectChoice && (
                                <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-md">
                                  Đáp án đúng chuẩn
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Matching Review */}
                  {q.type === 'matching' && q.matchingPairs && (
                    <div className="bg-slate-50 p-3 rounded-2xl mb-3 text-xs space-y-1">
                      <p className="font-bold text-slate-700 mb-1">Đáp án ghép nối chuẩn:</p>
                      {q.matchingPairs.map((p, pIdx) => (
                        <div key={pIdx} className="flex items-center space-x-2 text-slate-700">
                          <span className="font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {p.left}
                          </span>
                          <span>➔</span>
                          <span className="font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                            {p.right}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fill in blank Review */}
                  {q.type === 'fill_in_the_blank' && (
                    <div className="bg-slate-50 p-3 rounded-2xl mb-3 text-xs space-y-1">
                      <p className="font-medium text-slate-700 italic">{q.blankTemplate}</p>
                      <p className="text-[11px] text-slate-500">
                        Đáp án đúng: <strong className="text-emerald-700">{q.blankAnswers?.join(', ')}</strong> • Em điền: {studentAns?.userBlankAnswers?.join(', ') || 'Chưa điền'}
                      </p>
                    </div>
                  )}

                  {/* Scientific Explanation */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs text-slate-700 space-y-1">
                    <p className="font-black text-amber-900 flex items-center space-x-1">
                      <span>💡 Lời giải thích khoa học:</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
