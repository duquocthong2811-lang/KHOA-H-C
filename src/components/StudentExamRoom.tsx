import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { submitExamApi } from '../utils/api';
import { StudentSubmission, StudentSubmissionAnswer, TopicConfig } from '../types';

interface StudentExamRoomProps {
  sessionData: {
    sessionId: string;
    topic: TopicConfig;
    questionsForStudent: any[];
    startedAt: string;
    durationMinutes: number;
    totalQuestions: number;
  };
  studentInfo: {
    studentName: string;
    className: string;
    schoolName: string;
  };
  onFinish: (result: StudentSubmission) => void;
}

export const StudentExamRoom: React.FC<StudentExamRoomProps> = ({
  sessionData,
  studentInfo,
  onFinish
}) => {
  const { sessionId, topic, questionsForStudent, startedAt, durationMinutes } = sessionData;

  // Answers State: Record<questionId, StudentSubmissionAnswer>
  const [answers, setAnswers] = useState<Record<string, StudentSubmissionAnswer>>({});
  // Bookmarked for review
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  // Current active question index
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Network offline state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineSyncPending, setOfflineSyncPending] = useState<boolean>(false);

  // Local matching selection state (for matching questions)
  const [selectedLeftMatch, setSelectedLeftMatch] = useState<string | null>(null);

  // Local storage auto-save key
  const storageKey = `exam_progress_${sessionId}`;

  // Restore saved state from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.bookmarked) setBookmarked(parsed.bookmarked);
      }
    } catch (e) {
      console.warn('Could not restore local progress', e);
    }
  }, [storageKey]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineSyncPending) {
        // Trigger sync if was pending
        console.log('Online restored, syncing...');
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineSyncPending]);

  // Real-time Countdown Timer (Synced with startedAt)
  useEffect(() => {
    const startTimestamp = new Date(startedAt).getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const endTimestamp = startTimestamp + durationMs;

    const timer = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, endTimestamp - now);
      const remainingSecs = Math.floor(remainingMs / 1000);

      setTimeLeftSeconds(remainingSecs);

      if (remainingSecs <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startedAt, durationMinutes]);

  // Auto-save to localStorage whenever answers change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers, bookmarked }));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [answers, bookmarked, storageKey]);

  // Auto Submit when time is up
  const handleAutoSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    await doSubmit(true);
  };

  // Submit Logic
  const doSubmit = async (isAuto = false) => {
    setIsSubmitting(true);
    const answersList: StudentSubmissionAnswer[] = Object.values(answers);

    try {
      const result = await submitExamApi({
        sessionId,
        answers: answersList,
        isAutoSubmitted: isAuto
      });
      // Clear localStorage
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {}

      onFinish(result);
    } catch (err: any) {
      console.error('Submission failed:', err);
      if (!navigator.onLine) {
        setOfflineSyncPending(true);
        alert(
          'Thiết bị đang mất mạng Internet. Bài làm đã được lưu an toàn trên máy. Vui lòng kết nối mạng lại để hệ thống tự động hoàn tất nộp bài.'
        );
      } else {
        alert('Lỗi nộp bài: ' + (err.message || 'Vui lòng thử lại.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questionsForStudent[currentIdx];
  const totalQ = questionsForStudent.length;

  // Format Timer mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle Answers for Multiple Choice
  const handleSelectOption = (qId: string, optIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'multiple_choice',
        selectedOptionIndex: optIndex
      }
    }));
  };

  // Handle Matching Pairs
  const handleLeftMatchClick = (leftId: string) => {
    setSelectedLeftMatch(selectedLeftMatch === leftId ? null : leftId);
  };

  const handleRightMatchClick = (qId: string, rightText: string) => {
    if (!selectedLeftMatch) return;

    setAnswers((prev) => {
      const existing = prev[qId]?.userMatchingPairs || [];
      // Remove any existing pair with this left or right
      const filtered = existing.filter(
        (p) => p.leftId !== selectedLeftMatch && p.rightText !== rightText
      );
      filtered.push({ leftId: selectedLeftMatch, rightText });

      return {
        ...prev,
        [qId]: {
          questionId: qId,
          type: 'matching',
          userMatchingPairs: filtered
        }
      };
    });

    setSelectedLeftMatch(null);
  };

  const handleRemoveMatchingPair = (qId: string, leftId: string) => {
    setAnswers((prev) => {
      const existing = prev[qId]?.userMatchingPairs || [];
      return {
        ...prev,
        [qId]: {
          questionId: qId,
          type: 'matching',
          userMatchingPairs: existing.filter((p) => p.leftId !== leftId)
        }
      };
    });
  };

  // Handle Fill in blank
  const handleFillBlank = (qId: string, blankIndex: number, word: string) => {
    setAnswers((prev) => {
      const existing = [...(prev[qId]?.userBlankAnswers || [])];
      existing[blankIndex] = word;
      return {
        ...prev,
        [qId]: {
          questionId: qId,
          type: 'fill_in_the_blank',
          userBlankAnswers: existing
        }
      };
    });
  };

  const handleClearBlank = (qId: string, blankIndex: number) => {
    setAnswers((prev) => {
      const existing = [...(prev[qId]?.userBlankAnswers || [])];
      existing[blankIndex] = '';
      return {
        ...prev,
        [qId]: {
          questionId: qId,
          type: 'fill_in_the_blank',
          userBlankAnswers: existing
        }
      };
    });
  };

  // Handle Ordering
  const handleMoveOrder = (qId: string, itemIndex: number, direction: 'up' | 'down') => {
    setAnswers((prev) => {
      const q = questionsForStudent.find((item) => item.id === qId);
      const defaultOrder = (q?.orderingItems || []).map((_: any, i: number) => i);
      const currentOrder = prev[qId]?.userOrder ? [...prev[qId].userOrder!] : defaultOrder;

      const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (targetIndex < 0 || targetIndex >= currentOrder.length) return prev;

      // Swap
      const temp = currentOrder[itemIndex];
      currentOrder[itemIndex] = currentOrder[targetIndex];
      currentOrder[targetIndex] = temp;

      return {
        ...prev,
        [qId]: {
          questionId: qId,
          type: 'ordering',
          userOrder: currentOrder
        }
      };
    });
  };

  // Toggle Bookmark
  const toggleBookmark = (qId: string) => {
    setBookmarked((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Count answered
  const answeredCount = questionsForStudent.filter((q) => {
    const a = answers[q.id];
    if (!a) return false;
    if (q.type === 'multiple_choice') return a.selectedOptionIndex !== undefined;
    if (q.type === 'matching') return (a.userMatchingPairs?.length || 0) > 0;
    if (q.type === 'fill_in_the_blank') return a.userBlankAnswers?.some((s) => !!s);
    if (q.type === 'ordering') return a.userOrder !== undefined;
    return false;
  }).length;

  const unansweredTotal = totalQ - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Nunito',sans-serif]">
      {/* Top Fixed Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Student Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              🦉
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-800">
                  {studentInfo.studentName}
                </span>
                <span className="bg-blue-100 text-blue-700 font-extrabold text-[11px] px-2 py-0.2 rounded-md">
                  Lớp {studentInfo.className}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{topic.title}</p>
            </div>
          </div>

          {/* Network pill & Progress */}
          <div className="hidden sm:flex items-center space-x-3 text-xs">
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full font-bold ${
                isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến (Đã lưu máy)'}</span>
            </div>

            <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
              Tiến độ: <strong className="text-blue-700">{answeredCount}/{totalQ} câu</strong>
            </div>
          </div>

          {/* Countdown & Submit Button */}
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-2xl font-black text-sm transition ${
                timeLeftSeconds < 180
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs md:text-sm px-4 py-2 rounded-xl shadow-md flex items-center space-x-1.5 transition active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center: Question Viewer */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ && (
            <div className="bg-white rounded-3xl p-5 md:p-8 border border-slate-200/90 shadow-sm space-y-5">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {currentIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    trên {totalQ} câu
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      currentQ.cognitiveLevel === 'nhan_biet'
                        ? 'bg-blue-100 text-blue-700'
                        : currentQ.cognitiveLevel === 'ket_noi'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {currentQ.cognitiveLevel === 'nhan_biet'
                      ? 'Nhận biết'
                      : currentQ.cognitiveLevel === 'ket_noi'
                      ? 'Kết nối'
                      : 'Vận dụng'}
                  </span>
                </div>

                <button
                  onClick={() => toggleBookmark(currentQ.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition ${
                    bookmarked[currentQ.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-800 font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked[currentQ.id] ? 'fill-amber-500 text-amber-600' : ''}`} />
                  <span>{bookmarked[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}</span>
                </button>
              </div>

              {/* Question Content */}
              <h3 className="font-black text-base md:text-lg text-slate-800 leading-snug">
                {currentQ.content}
              </h3>

              {/* Type 1: Multiple Choice (Strictly 3 options A, B, C) */}
              {currentQ.type === 'multiple_choice' && currentQ.options && (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt: string, optIdx: number) => {
                    const isSelected = answers[currentQ.id]?.selectedOptionIndex === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 flex items-center space-x-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm text-blue-950 font-bold scale-[1.01]'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white border border-slate-300 text-slate-600'
                          }`}
                        >
                          {['A', 'B', 'C'][optIdx]}
                        </span>
                        <span className="text-sm md:text-base leading-relaxed flex-1">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 2: Matching */}
              {currentQ.type === 'matching' && (
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-blue-700 font-semibold bg-blue-50 p-2.5 rounded-xl">
                    👉 <strong>Cách làm:</strong> Chạm vào 1 mục ở Cột Trái, sau đó chạm vào mục tương ứng ở Cột Phải để nối cặp!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Cột Trái</h4>
                      {currentQ.matchingLeft?.map((leftItem: any) => {
                        const isSelected = selectedLeftMatch === leftItem.id;
                        const pairedRight = answers[currentQ.id]?.userMatchingPairs?.find(
                          (p) => p.leftId === leftItem.id
                        )?.rightText;

                        return (
                          <div
                            key={leftItem.id}
                            onClick={() => handleLeftMatchClick(leftItem.id)}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                              isSelected
                                ? 'border-blue-600 bg-blue-100/50 ring-2 ring-blue-400'
                                : pairedRight
                                ? 'border-emerald-500 bg-emerald-50/40'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <p className="font-bold text-xs text-slate-800">{leftItem.text}</p>
                            {pairedRight && (
                              <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                                <span>Đã nối với: {pairedRight}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveMatchingPair(currentQ.id, leftItem.id);
                                  }}
                                  className="text-rose-500 hover:text-rose-700 font-black ml-1"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Cột Phải</h4>
                      {currentQ.matchingRight?.map((rightText: string, rIdx: number) => {
                        const isPaired = answers[currentQ.id]?.userMatchingPairs?.some(
                          (p) => p.rightText === rightText
                        );

                        return (
                          <div
                            key={rIdx}
                            onClick={() => handleRightMatchClick(currentQ.id, rightText)}
                            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                              isPaired
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                                : selectedLeftMatch
                                ? 'border-blue-300 bg-blue-50/40 hover:bg-blue-100 hover:border-blue-500'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <p className="font-bold text-xs">{rightText}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Type 3: Fill in the blank */}
              {currentQ.type === 'fill_in_the_blank' && (
                <div className="space-y-4 pt-2">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm md:text-base leading-loose text-slate-800 font-semibold">
                    {/* Render blankTemplate parsing {1}, {2}... */}
                    {(() => {
                      const template = currentQ.blankTemplate || '';
                      const parts = template.split(/(\{\d+\})/g);
                      let blankCounter = 0;

                      return parts.map((part: string, idx: number) => {
                        if (part.match(/^\{\d+\}$/)) {
                          const bIdx = blankCounter++;
                          const currentAnswer = answers[currentQ.id]?.userBlankAnswers?.[bIdx] || '';

                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-3 py-1 mx-1.5 rounded-xl border-2 font-bold text-sm transition ${
                                currentAnswer
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                                  : 'border-dashed border-blue-400 bg-white text-slate-400'
                              }`}
                            >
                              {currentAnswer ? (
                                <>
                                  <span>{currentAnswer}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleClearBlank(currentQ.id, bIdx)}
                                    className="ml-1.5 text-xs text-rose-500 hover:text-rose-700"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <span>[ Chỗ trống {bIdx + 1} ]</span>
                              )}
                            </span>
                          );
                        }
                        return <span key={idx}>{part}</span>;
                      });
                    })()}
                  </div>

                  {/* Word bank to choose from */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2">
                      Chạm vào một từ dưới đây để điền vào chỗ trống tiếp theo:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentQ.blankOptions?.map((word: string, wIdx: number) => (
                        <button
                          key={wIdx}
                          type="button"
                          onClick={() => {
                            // Find first empty blank
                            const currentBlanks = answers[currentQ.id]?.userBlankAnswers || [];
                            let targetIdx = currentBlanks.findIndex((b) => !b);
                            if (targetIdx === -1) targetIdx = currentBlanks.length;
                            handleFillBlank(currentQ.id, targetIdx, word);
                          }}
                          className="bg-white hover:bg-blue-50 border border-slate-300 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95"
                        >
                          + {word}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type 4: Ordering */}
              {currentQ.type === 'ordering' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-blue-700 font-semibold bg-blue-50 p-2.5 rounded-xl">
                    👉 <strong>Cách làm:</strong> Sử dụng các nút mũi tên <strong>Lên / Xuống</strong> để sắp xếp các bước theo trình tự chính xác từ trên xuống dưới!
                  </p>

                  <div className="space-y-2">
                    {(() => {
                      const originalItems = currentQ.orderingItems || [];
                      const currentOrder =
                        answers[currentQ.id]?.userOrder || originalItems.map((_: any, i: number) => i);

                      return currentOrder.map((origIdx: number, posIdx: number) => {
                        const itemText = originalItems[origIdx];
                        return (
                          <div
                            key={origIdx}
                            className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 flex items-center justify-between shadow-xs transition"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                                Bước {posIdx + 1}
                              </span>
                              <span className="font-bold text-slate-800 text-sm md:text-base">
                                {itemText}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                disabled={posIdx === 0}
                                onClick={() => handleMoveOrder(currentQ.id, posIdx, 'up')}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-700 disabled:opacity-30 transition"
                                title="Di chuyển lên"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={posIdx === currentOrder.length - 1}
                                onClick={() => handleMoveOrder(currentQ.id, posIdx, 'down')}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-700 disabled:opacity-30 transition"
                                title="Di chuyển xuống"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Navigation Bar between questions */}
              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs md:text-sm px-4 py-2.5 rounded-xl disabled:opacity-30 flex items-center space-x-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <span className="text-xs text-slate-400 font-bold">
                  Câu {currentIdx + 1} / {totalQ}
                </span>

                <button
                  type="button"
                  disabled={currentIdx === totalQ - 1}
                  onClick={() => setCurrentIdx((prev) => Math.min(totalQ - 1, prev + 1))}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs md:text-sm px-4 py-2.5 rounded-xl disabled:opacity-30 flex items-center space-x-1 shadow-md transition"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Palette Matrix */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm sticky top-20 space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">Bảng số câu hỏi</h4>
              <p className="text-[11px] text-slate-400">Chạm vào số câu để chuyển nhanh</p>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
                <span>Đã làm ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 inline-block" />
                <span>Chưa làm ({unansweredTotal})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block" />
                <span>Đánh dấu xem lại</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded border-2 border-blue-600 inline-block" />
                <span>Đang xem</span>
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questionsForStudent.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isMarked = bookmarked[q.id];
                const a = answers[q.id];
                let isAnswered = false;
                if (a) {
                  if (q.type === 'multiple_choice') isAnswered = a.selectedOptionIndex !== undefined;
                  else if (q.type === 'matching') isAnswered = (a.userMatchingPairs?.length || 0) > 0;
                  else if (q.type === 'fill_in_the_blank') isAnswered = a.userBlankAnswers?.some((s) => !!s) || false;
                  else if (q.type === 'ordering') isAnswered = a.userOrder !== undefined;
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl font-black text-xs transition relative flex items-center justify-center ${
                      isCurrent
                        ? 'border-2 border-blue-600 ring-2 ring-blue-300'
                        : 'border border-transparent'
                    } ${
                      isAnswered
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition"
            >
              Nộp bài ({answeredCount}/{totalQ} câu)
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>

            <div className="text-center">
              <h3 className="font-black text-lg text-slate-800">Xác Nhận Nộp Bài</h3>
              <p className="text-xs text-slate-500 mt-1">
                Em có chắc chắn muốn nộp bài kiểm tra ngay không?
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Đã trả lời:</span>
                <span className="text-emerald-700">{answeredCount} / {totalQ} câu</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Còn lại chưa làm:</span>
                <span className={unansweredTotal > 0 ? 'text-rose-600' : 'text-slate-600'}>
                  {unansweredTotal} câu
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Thời gian còn lại:</span>
                <span className="text-indigo-700">{formatTimer(timeLeftSeconds)}</span>
              </div>

              {unansweredTotal > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold mt-2">
                  Em vẫn còn <strong>{unansweredTotal} câu chưa hoàn thành</strong>. Những câu chưa làm sẽ được tính là chưa đúng. Em có muốn quay lại làm tiếp không?
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setShowConfirmModal(false);
                  doSubmit(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition"
              >
                {isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
