import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Copy,
  Download,
  AlertCircle,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  fetchQuestions,
  fetchTopics,
  createQuestion,
  updateQuestionApi,
  deleteQuestionApi,
  toggleApproveQuestion
} from '../utils/api';
import { exportQuestionBankToExcel } from '../utils/export';
import { Question, TopicConfig, CognitiveLevel, QuestionType } from '../types';
import { AiQuestionModal } from './AiQuestionModal';

export const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterApproved, setFilterApproved] = useState<string>(''); // '', 'true', 'false'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const [qList, tList] = await Promise.all([
        fetchQuestions({
          topicId: filterTopic || undefined,
          level: filterLevel || undefined,
          approved: filterApproved === '' ? undefined : filterApproved === 'true',
          search: searchQuery || undefined
        }),
        fetchTopics()
      ]);
      setQuestions(qList);
      setTopics(tList);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [filterTopic, filterLevel, filterApproved, searchQuery]);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (confirm('Thầy có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) {
      await deleteQuestionApi(id);
      loadQuestions();
    }
  };

  // Handle Duplicate
  const handleDuplicate = async (q: Question) => {
    const { id, createdAt, ...rest } = q;
    await createQuestion({
      ...rest,
      content: `${rest.content} (Bản sao)`,
      approved: false
    });
    loadQuestions();
  };

  // Handle Approve Toggle
  const handleToggleApprove = async (q: Question) => {
    await toggleApproveQuestion(q.id, !q.approved);
    loadQuestions();
  };

  // Open Form for New / Edit
  const handleOpenForm = (q?: Question) => {
    if (q) {
      setEditingQuestion(JSON.parse(JSON.stringify(q)));
    } else {
      setEditingQuestion({
        topicId: filterTopic || 'chud_1',
        lesson: 'Bài 1: Khoa học lớp 5',
        type: 'multiple_choice',
        cognitiveLevel: 'nhan_biet',
        content: '',
        options: ['', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        source: 'SGK Khoa học 5',
        approved: true
      });
    }
    setEditModalOpen(true);
  };

  // Save Form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.content?.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    try {
      if (editingQuestion.id) {
        await updateQuestionApi(editingQuestion.id, editingQuestion);
      } else {
        await createQuestion(editingQuestion as Omit<Question, 'id' | 'createdAt'>);
      }
      setEditModalOpen(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (err: any) {
      alert('Lỗi lưu câu hỏi: ' + err.message);
    }
  };

  // Filtered by type locally if set
  const displayedQuestions = filterType
    ? questions.filter((q) => q.type === filterType)
    : questions;

  const totalCount = displayedQuestions.length;
  const approvedCount = displayedQuestions.filter((q) => q.approved).length;
  const draftCount = totalCount - approvedCount;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            Ngân Hàng Câu Hỏi Thông Minh
          </h2>
          <p className="text-xs text-slate-500">
            Quản lí, phân loại chuẩn 3 mức độ nhận thức (50% - 30% - 20%) và trợ lí AI biên soạn tự động
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportQuestionBankToExcel(questions)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => setAiModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Trợ lí AI biên soạn câu hỏi</span>
          </button>

          <button
            onClick={() => handleOpenForm()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            {totalCount}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tổng câu hỏi</p>
            <p className="text-[11px] text-slate-400">Trong bộ lọc hiện tại</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            {approvedCount}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Đã kiểm duyệt</p>
            <p className="text-[11px] text-emerald-600 font-semibold">Được đưa vào đề thi</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            {draftCount}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Chờ duyệt / Nháp</p>
            <p className="text-[11px] text-amber-600 font-semibold">Chưa đưa vào đề</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
            5:3:2
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Chuẩn tỉ lệ đề</p>
            <p className="text-[11px] text-slate-400">50% NB - 30% KN - 20% VD</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung câu hỏi, bài học, nguồn..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Topic */}
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
          >
            <option value="">Tất cả chủ đề</option>
            <option value="chud_1">Chủ đề 1: Chất</option>
            <option value="chud_2">Chủ đề 2: Năng lượng</option>
            <option value="chud_3">Chủ đề 3: Thực vật và động vật</option>
            <option value="chud_4">Chủ đề 4: Vi khuẩn</option>
            <option value="chud_5">Chủ đề 5: Con người và Sức khỏe</option>
            <option value="chud_6">Chủ đề 6: Sinh vật và môi trường</option>
          </select>

          {/* Level */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
          >
            <option value="">Tất cả mức độ</option>
            <option value="nhan_biet">Nhận biết (50%)</option>
            <option value="ket_noi">Kết nối (30%)</option>
            <option value="van_dung">Vận dụng (20%)</option>
          </select>

          {/* Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
          >
            <option value="">Tất cả 4 dạng câu</option>
            <option value="multiple_choice">Trắc nghiệm 3 đáp án (A,B,C)</option>
            <option value="matching">Nối hai cột</option>
            <option value="fill_in_the_blank">Điền từ chỗ trống</option>
            <option value="ordering">Sắp xếp thứ tự</option>
          </select>

          {/* Approved */}
          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã duyệt (Chính thức)</option>
            <option value="false">Chờ duyệt / Nháp</option>
          </select>

          {(filterTopic || filterLevel || filterType || filterApproved || searchQuery) && (
            <button
              onClick={() => {
                setFilterTopic('');
                setFilterLevel('');
                setFilterType('');
                setFilterApproved('');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Question List Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
        </div>
      ) : displayedQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <p className="text-4xl mb-3">🔍</p>
          <h3 className="font-extrabold text-slate-700 text-base">Không tìm thấy câu hỏi phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1">
            Thầy có thể thử xóa bộ lọc hoặc bấm "Trợ lí AI biên soạn" để tạo thêm câu hỏi mới.
          </p>
          <button
            onClick={() => setAiModalOpen(true)}
            className="mt-4 bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tạo câu hỏi bằng AI ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedQuestions.map((q, idx) => {
            const levelLabel =
              q.cognitiveLevel === 'nhan_biet'
                ? { text: 'Nhận biết (50%)', color: 'bg-blue-100 text-blue-700 border-blue-200' }
                : q.cognitiveLevel === 'ket_noi'
                ? { text: 'Kết nối (30%)', color: 'bg-amber-100 text-amber-800 border-amber-200' }
                : { text: 'Vận dụng (20%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

            const typeLabel =
              q.type === 'multiple_choice'
                ? 'Trắc nghiệm A,B,C'
                : q.type === 'matching'
                ? 'Ghép nối'
                : q.type === 'fill_in_the_blank'
                ? 'Điền từ'
                : 'Sắp xếp thứ tự';

            return (
              <div
                key={q.id}
                className={`bg-white rounded-3xl p-5 border transition-all duration-200 hover:shadow-md ${
                  q.approved ? 'border-slate-200/90' : 'border-amber-300 bg-amber-50/10'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-slate-400">#{idx + 1}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${levelLabel.color}`}
                    >
                      {levelLabel.text}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {typeLabel}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {q.topicId}
                    </span>
                    {q.isAiGenerated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>AI biên soạn</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Approve status pill & button */}
                    <button
                      onClick={() => handleToggleApprove(q)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 transition ${
                        q.approved
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={q.approved ? 'Nhấn để chuyển sang Nháp' : 'Nhấn để duyệt chính thức'}
                    >
                      {q.approved ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã duyệt</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Chờ duyệt (Nháp)</span>
                        </>
                      )}
                    </button>

                    {/* Actions */}
                    <button
                      onClick={() => handleDuplicate(q)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Nhân bản (Sao chép câu)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenForm(q)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-extrabold text-sm md:text-base text-slate-800 leading-snug mb-3">
                  {q.content}
                </h3>

                {/* Question Type Details */}
                {q.type === 'multiple_choice' && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-3">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctOptionIndex;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {['A', 'B', 'C'][oIdx]}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'matching' && q.matchingPairs && (
                  <div className="bg-slate-50 p-3 rounded-2xl mb-3 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-600 mb-1">Các cặp nối chuẩn:</p>
                    {q.matchingPairs.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center space-x-2 text-slate-700">
                        <span className="font-semibold bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                          {p.left}
                        </span>
                        <span className="text-blue-500 font-bold">➔</span>
                        <span className="font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg">
                          {p.right}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'fill_in_the_blank' && (
                  <div className="bg-slate-50 p-3 rounded-2xl mb-3 text-xs space-y-1">
                    <p className="font-medium text-slate-700 italic">{q.blankTemplate}</p>
                    <p className="text-[11px] text-slate-500">
                      Đáp án đúng: <strong className="text-emerald-700">{q.blankAnswers?.join(', ')}</strong> • Từ cho sẵn: {q.blankOptions?.join(', ')}
                    </p>
                  </div>
                )}

                {q.type === 'ordering' && q.orderingItems && (
                  <div className="bg-slate-50 p-3 rounded-2xl mb-3 text-xs space-y-1">
                    <p className="font-bold text-slate-600 mb-1">Thứ tự các bước chuẩn:</p>
                    {q.orderingItems.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center space-x-2 text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {iIdx + 1}
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation & Source info */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-amber-800">💡 Giải thích:</span>
                    <span>{q.explanation}</span>
                  </div>
                  {q.source && (
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      Nguồn: {q.source}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Modal */}
      <AiQuestionModal
        topics={topics}
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSuccess={() => loadQuestions()}
      />

      {/* Manual Add / Edit Modal */}
      {editModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm md:text-base">
                {editingQuestion.id ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới Thủ Công'}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề:</label>
                  <select
                    value={editingQuestion.topicId}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, topicId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  >
                    <option value="chud_1">Chủ đề 1: Chất</option>
                    <option value="chud_2">Chủ đề 2: Năng lượng</option>
                    <option value="chud_3">Chủ đề 3: Thực vật và động vật</option>
                    <option value="chud_4">Chủ đề 4: Vi khuẩn</option>
                    <option value="chud_5">Chủ đề 5: Con người và Sức khỏe</option>
                    <option value="chud_6">Chủ đề 6: Sinh vật và môi trường</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bài học:</label>
                  <input
                    type="text"
                    value={editingQuestion.lesson || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, lesson: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                    placeholder="VD: Bài 3: Sự biến đổi hóa học..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ nhận thức:</label>
                  <select
                    value={editingQuestion.cognitiveLevel}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        cognitiveLevel: e.target.value as CognitiveLevel
                      })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="nhan_biet">Nhận biết (50% cơ cấu)</option>
                    <option value="ket_noi">Kết nối (30% cơ cấu)</option>
                    <option value="van_dung">Vận dụng (20% cơ cấu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dạng câu hỏi:</label>
                  <select
                    value={editingQuestion.type}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        type: e.target.value as QuestionType
                      })
                    }
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="multiple_choice">Trắc nghiệm 3 đáp án (A, B, C)</option>
                    <option value="matching">Ghép nối 2 cột</option>
                    <option value="fill_in_the_blank">Điền từ vào chỗ trống</option>
                    <option value="ordering">Sắp xếp thứ tự</option>
                  </select>
                </div>
              </div>

              {/* Question Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung câu hỏi:</label>
                <textarea
                  rows={3}
                  value={editingQuestion.content || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
                  required
                />
              </div>

              {/* Multiple Choice Fields (Strictly 3 options A, B, C) */}
              {editingQuestion.type === 'multiple_choice' && (
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700">
                    3 Phương án lựa chọn (Chọn nút tròn bên cạnh đáp án đúng):
                  </label>
                  {['A', 'B', 'C'].map((label, optIndex) => {
                    const currentOpts = editingQuestion.options || ['', '', ''];
                    return (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={editingQuestion.correctOptionIndex === optIndex}
                          onChange={() =>
                            setEditingQuestion({ ...editingQuestion, correctOptionIndex: optIndex })
                          }
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-bold text-xs w-5 text-slate-600">{label}.</span>
                        <input
                          type="text"
                          value={currentOpts[optIndex] || ''}
                          onChange={(e) => {
                            const newOpts = [...currentOpts];
                            newOpts[optIndex] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                          placeholder={`Nội dung phương án ${label}`}
                          className="flex-1 text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Matching pairs */}
              {editingQuestion.type === 'matching' && (
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <label className="block text-xs font-bold text-slate-700">
                    Các cặp ghép nối (Cột Trái ➔ Cột Phải):
                  </label>
                  {[0, 1, 2].map((pIdx) => {
                    const pairs = editingQuestion.matchingPairs || [
                      { id: 'p1', left: '', right: '' },
                      { id: 'p2', left: '', right: '' },
                      { id: 'p3', left: '', right: '' }
                    ];
                    return (
                      <div key={pIdx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={pairs[pIdx]?.left || ''}
                          onChange={(e) => {
                            const newPairs = [...pairs];
                            newPairs[pIdx] = {
                              id: `p${pIdx + 1}`,
                              left: e.target.value,
                              right: newPairs[pIdx]?.right || ''
                            };
                            setEditingQuestion({ ...editingQuestion, matchingPairs: newPairs });
                          }}
                          placeholder={`Cột Trái ${pIdx + 1}`}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          required
                        />
                        <span>➔</span>
                        <input
                          type="text"
                          value={pairs[pIdx]?.right || ''}
                          onChange={(e) => {
                            const newPairs = [...pairs];
                            newPairs[pIdx] = {
                              id: `p${pIdx + 1}`,
                              left: newPairs[pIdx]?.left || '',
                              right: e.target.value
                            };
                            setEditingQuestion({ ...editingQuestion, matchingPairs: newPairs });
                          }}
                          placeholder={`Cột Phải ${pIdx + 1}`}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fill in blank */}
              {editingQuestion.type === 'fill_in_the_blank' && (
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đoạn văn có vị trí trống {'{1}'}, {'{2}'}:
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.blankTemplate || ''}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, blankTemplate: e.target.value })
                      }
                      placeholder="VD: Nước tồn tại ở 3 thể: thể {1}, thể {2} và thể {3}."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đáp án đúng (ngăn cách bằng dấu phẩy):
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.blankAnswers?.join(', ') || ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          blankAnswers: e.target.value.split(',').map((s) => s.trim())
                        })
                      }
                      placeholder="VD: rắn, lỏng, khí"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Từ cho sẵn để kéo thả (ngăn cách bằng dấu phẩy):
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.blankOptions?.join(', ') || ''}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          blankOptions: e.target.value.split(',').map((s) => s.trim())
                        })
                      }
                      placeholder="VD: rắn, lỏng, khí, nhiệt độ, đá"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Ordering */}
              {editingQuestion.type === 'ordering' && (
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <label className="block text-xs font-bold text-slate-700">
                    Các bước cần sắp xếp theo đúng thứ tự chuẩn (từ trên xuống dưới):
                  </label>
                  {[0, 1, 2].map((stepIdx) => {
                    const items = editingQuestion.orderingItems || ['', '', ''];
                    return (
                      <div key={stepIdx} className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {stepIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={items[stepIdx] || ''}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[stepIdx] = e.target.value;
                            setEditingQuestion({
                              ...editingQuestion,
                              orderingItems: newItems,
                              correctOrder: newItems.map((_, i) => i)
                            });
                          }}
                          placeholder={`Bước ${stepIdx + 1}`}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                          required
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation & Source */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giải thích ngắn gọn vì sao đáp án đúng:
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Giải thích khoa học dễ hiểu cho học sinh lớp 5..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nguồn tham khảo:
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.source || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, source: e.target.value })}
                    placeholder="VD: SGK Khoa học 5, tr. 14"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="approvedCheckbox"
                    checked={editingQuestion.approved ?? true}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, approved: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label htmlFor="approvedCheckbox" className="text-xs font-bold text-slate-700">
                    Duyệt câu hỏi này vào đề thi ngay
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  {editingQuestion.id ? 'Lưu thay đổi' : 'Thêm vào ngân hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
