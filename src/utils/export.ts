import * as XLSX from 'xlsx';
import { StudentSubmission, Question } from '../types';

export function exportSubmissionsToExcel(submissions: StudentSubmission[], filename = 'Danh_Sach_Ket_Qua_Hoc_Sinh.xlsx') {
  const data = submissions.map((sub, idx) => {
    const mins = Math.floor(sub.durationSeconds / 60);
    const secs = sub.durationSeconds % 60;
    const timeFormatted = `${mins}p ${secs < 10 ? '0' : ''}${secs}s`;

    return {
      'STT': idx + 1,
      'Họ và tên': sub.studentName,
      'Lớp': sub.className,
      'Trường': sub.schoolName,
      'Chủ đề kiểm tra': sub.topicTitle,
      'Điểm (Thang 10)': sub.score,
      'Số câu đúng': sub.correctCount,
      'Số câu sai': sub.wrongCount,
      'Chưa trả lời': sub.unansweredCount,
      'Tổng số câu': sub.totalQuestions,
      'Thời gian làm bài': timeFormatted,
      'Trạng thái': sub.status === 'completed' ? 'Đã nộp bài' : sub.status === 'auto_submitted' ? 'Hết giờ tự động nộp' : 'Đang làm',
      'Thời điểm nộp': new Date(sub.submittedAt).toLocaleString('vi-VN')
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết Quả Học Sinh');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Họ tên
    { wch: 10 }, // Lớp
    { wch: 30 }, // Trường
    { wch: 28 }, // Chủ đề
    { wch: 15 }, // Điểm
    { wch: 12 }, // Đúng
    { wch: 12 }, // Sai
    { wch: 14 }, // Chưa TL
    { wch: 12 }, // Tổng
    { wch: 18 }, // Thời gian
    { wch: 20 }, // Trạng thái
    { wch: 22 }  // Thời điểm nộp
  ];

  XLSX.writeFile(workbook, filename);
}

export function exportSubmissionsToCsv(submissions: StudentSubmission[], filename = 'Danh_Sach_Ket_Qua_Hoc_Sinh.csv') {
  const headers = [
    'STT',
    'Họ và tên',
    'Lớp',
    'Trường',
    'Chủ đề',
    'Điểm',
    'Số câu đúng',
    'Số câu sai',
    'Chưa trả lời',
    'Thời gian làm bài',
    'Trạng thái',
    'Thời điểm nộp'
  ];

  const rows = submissions.map((sub, idx) => {
    const mins = Math.floor(sub.durationSeconds / 60);
    const secs = sub.durationSeconds % 60;
    const timeFormatted = `${mins}p${secs < 10 ? '0' : ''}${secs}s`;
    const statusText = sub.status === 'completed' ? 'Đã nộp bài' : 'Hết giờ tự nộp';

    return [
      idx + 1,
      `"${sub.studentName.replace(/"/g, '""')}"`,
      `"${sub.className}"`,
      `"${sub.schoolName.replace(/"/g, '""')}"`,
      `"${sub.topicTitle.replace(/"/g, '""')}"`,
      sub.score,
      sub.correctCount,
      sub.wrongCount,
      sub.unansweredCount,
      `"${timeFormatted}"`,
      `"${statusText}"`,
      `"${new Date(sub.submittedAt).toLocaleString('vi-VN')}"`
    ].join(',');
  });

  // Add UTF-8 BOM so Excel opens Vietnamese characters cleanly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportQuestionBankToExcel(questions: Question[], filename = 'Ngan_Hang_Cau_Hoi_Khoa_Hoc_5.xlsx') {
  const data = questions.map((q, idx) => {
    const levelText =
      q.cognitiveLevel === 'nhan_biet' ? 'Nhận biết (50%)' :
      q.cognitiveLevel === 'ket_noi' ? 'Kết nối (30%)' : 'Vận dụng (20%)';

    const typeText =
      q.type === 'multiple_choice' ? 'Trắc nghiệm 3 lựa chọn' :
      q.type === 'matching' ? 'Nối cột' :
      q.type === 'fill_in_the_blank' ? 'Điền từ khuyết' : 'Sắp xếp thứ tự';

    let answerDetails = '';
    if (q.type === 'multiple_choice' && q.options) {
      const correctIdx = q.correctOptionIndex ?? 0;
      answerDetails = `Đáp án: ${['A', 'B', 'C'][correctIdx]} (${q.options[correctIdx]})`;
    } else if (q.type === 'matching' && q.matchingPairs) {
      answerDetails = q.matchingPairs.map((p) => `${p.left} -> ${p.right}`).join('; ');
    } else if (q.type === 'fill_in_the_blank' && q.blankAnswers) {
      answerDetails = q.blankAnswers.join(', ');
    } else if (q.type === 'ordering' && q.orderingItems) {
      answerDetails = q.orderingItems.join(' -> ');
    }

    return {
      'STT': idx + 1,
      'Chủ đề': q.topicId,
      'Bài học': q.lesson || '',
      'Dạng câu hỏi': typeText,
      'Mức độ': levelText,
      'Nội dung câu hỏi': q.content,
      'Phương án / Chi tiết': answerDetails,
      'Giải thích đáp án': q.explanation,
      'Nguồn tham khảo': q.source || '',
      'Trạng thái': q.approved ? 'Đã duyệt' : 'Chờ duyệt / Nháp'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ngân Hàng Câu Hỏi');
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 45 },
    { wch: 35 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 }
  ];

  XLSX.writeFile(workbook, filename);
}
