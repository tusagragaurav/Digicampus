import React, { useState, useEffect } from 'react';
import { STUDENT_STATS, MOCK_RESULTS } from '../constants';
import { storage } from '../services/storage';
import { Course, User, UserRole, ClassSession, Assignment, ExamSession, FeeRecord, ExamSubmission, AssignmentSubmission, LiveClass, Notice } from '../types';
import { BookOpen, Clock, FileText, CheckCircle, Upload, Search, Filter, X, Award, Calendar, Video, Megaphone, QrCode, Mail, Phone, MapPin, Download, IndianRupee, Hash, Building, Users } from 'lucide-react';

interface StudentDashboardProps {
    currentUser: User;
    currentPage: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser, currentPage }) => {
    const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
    const [upcomingSessions, setUpcomingSessions] = useState<ClassSession[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
    const [exams, setExams] = useState<ExamSession[]>([]);
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);

    // Exam State
    const [activeExam, setActiveExam] = useState<ExamSession | null>(null);
    const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [examTimer, setExamTimer] = useState(0);

    // Assignment Upload State
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Attendance State
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [attendanceCode, setAttendanceCode] = useState('');

    useEffect(() => {
        const loadData = () => {
            const allCourses = storage.getEnrolledCourses(currentUser.id);
            setEnrolledCourses(allCourses);
            
            const myCourseIds = allCourses.map(c => c.id);
            
            const allSessions = storage.getSessions();
            setUpcomingSessions(allSessions.filter(s => myCourseIds.includes(s.courseId)));
            
            setAssignments(storage.getAssignments().filter(a => myCourseIds.includes(a.courseId)));
            setAssignmentSubmissions(storage.getAssignmentSubmissions().filter(s => s.studentId === currentUser.id));
            setExams(storage.getExams().filter(e => e.status !== 'CLOSED'));
            setFees(storage.getFees().filter(f => f.studentId === currentUser.id));
            setLiveClasses(storage.getActiveLiveClasses());
            setNotices(storage.getNotices(UserRole.STUDENT));
        };
        
        loadData();
        const handleUpdate = () => loadData();
        window.addEventListener('storage-update', handleUpdate);
        return () => window.removeEventListener('storage-update', handleUpdate);
    }, [currentUser.id]);

    // Exam Timer Logic
    useEffect(() => {
        let interval: any;
        if (activeExam && examTimer > 0) {
            interval = setInterval(() => {
                setExamTimer(prev => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);
        } else if (activeExam && examTimer === 0) {
            // Auto-submit when time runs out
            handleSubmitExam();
        }
        return () => clearInterval(interval);
    }, [activeExam, examTimer]);

    const handleStartExam = (exam: ExamSession) => {
        if (!exam.questions || exam.questions.length === 0) {
            alert("This exam has no questions configured yet.");
            return;
        }
        setActiveExam(exam);
        setExamTimer(exam.duration * 60);
        setCurrentQuestionIdx(0);
        setExamAnswers({});
    };

    const handleAnswerChange = (questionId: string, value: string) => {
        setExamAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmitExam = () => {
        if (!activeExam) return;
        
        const submission: ExamSubmission = {
            id: Date.now().toString(),
            examId: activeExam.id,
            examTitle: activeExam.subject,
            studentId: currentUser.id,
            studentName: currentUser.name,
            answers: examAnswers,
            submittedAt: new Date().toISOString(),
            status: 'SUBMITTED'
        };
        
        storage.submitExamAnswers(submission);
        setActiveExam(null);
        alert('Exam Submitted Successfully!');
    };

    const handleAssignmentUpload = () => {
        if (!selectedAssignment || !uploadFile) return;
        setIsUploading(true);
        
        setTimeout(() => {
            const submission: AssignmentSubmission = {
                id: Date.now().toString(),
                assignmentId: selectedAssignment.id,
                assignmentTitle: selectedAssignment.title,
                studentId: currentUser.id,
                studentName: currentUser.name,
                fileUrl: '#', // Mock URL
                submittedAt: new Date().toISOString(),
                status: 'SUBMITTED',
                fileData: '',
                fileType: uploadFile.type
            };
            
            storage.submitAssignment(submission);
            setIsUploading(false);
            setSelectedAssignment(null);
            setUploadFile(null);
            alert('Assignment Submitted!');
        }, 1000);
    };

    const handleJoinLiveClass = (liveClass: LiveClass) => {
        storage.markAttendance({
            id: Date.now().toString(),
            studentId: currentUser.id,
            studentName: currentUser.name,
            courseId: liveClass.courseId,
            courseName: liveClass.courseName,
            date: new Date().toISOString(),
            status: 'PRESENT',
            method: 'AUTO'
        });
        alert(`Joining ${liveClass.topic}... Attendance has been marked automatically.`);
    };

    const handleSubmitAttendanceCode = () => {
        if (!attendanceCode) return;
        
        const success = storage.validateAttendanceCode(attendanceCode.toUpperCase(), currentUser.id, currentUser.name);
        
        if (success) {
            alert('Attendance marked successfully!');
            setIsAttendanceModalOpen(false);
            setAttendanceCode('');
        } else {
            alert('Invalid or expired session code.');
        }
    };

    const handleDownloadReceipt = (fee: FeeRecord) => {
        try {
            const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Receipt #${fee.id}</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f9fafb; color: #111827; }
              .receipt-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
              .header { text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 30px; margin-bottom: 30px; }
              .school-name { font-size: 28px; font-weight: 800; color: #4f46e5; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
              .school-details { font-size: 14px; color: #6b7280; line-height: 1.5; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #111827; display: flex; justify-content: space-between; align-items: center; }
              .status-badge { background: #d1fae5; color: #065f46; padding: 6px 12px; border-radius: 9999px; font-size: 14px; text-transform: uppercase; font-weight: bold; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info-item { margin-bottom: 10px; }
              .label { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
              .value { font-size: 16px; font-weight: 500; }
              .amount-box { background: #f3f4f6; padding: 20px; border-radius: 12px; text-align: right; margin-top: 20px; }
              .total-label { font-size: 14px; font-weight: bold; color: #6b7280; text-transform: uppercase; }
              .total-value { font-size: 32px; font-weight: 800; color: #4f46e5; margin-top: 5px; }
              .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <div class="header">
                  <div class="school-name">DigiCampus Institute</div>
                  <div class="school-details">
                      42 Knowledge Avenue, Tech District, CA 90210<br/>
                      billing@digicampus.edu • (555) 012-3456<br/>
                      Tax/Reg ID: EDU-REG-2024-X
                  </div>
              </div>
      
              <div class="title">
                  <span>Payment Receipt</span>
                  <span class="status-badge">PAID</span>
              </div>
      
              <div class="info-grid">
                  <div>
                      <div class="info-item">
                          <div class="label">Receipt ID</div>
                          <div class="value">#${fee.id.toUpperCase().substring(0, 8)}</div>
                      </div>
                      <div class="info-item">
                          <div class="label">Date Issued</div>
                          <div class="value">${new Date().toLocaleDateString()}</div>
                      </div>
                      <div class="info-item">
                          <div class="label">Payment Date</div>
                          <div class="value">${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                      </div>
                  </div>
                  <div style="text-align: right;">
                      <div class="info-item">
                          <div class="label">Billed To</div>
                          <div class="value" style="font-size: 18px; font-weight: bold;">${fee.studentName}</div>
                      </div>
                      <div class="info-item">
                          <div class="label">Fee Description</div>
                          <div class="value">${fee.title}</div>
                      </div>
                      <div class="info-item">
                          <div class="label">Category</div>
                          <div class="value">${fee.type}</div>
                      </div>
                  </div>
              </div>
      
              <div class="amount-box">
                  <div class="total-label">Amount Paid</div>
                  <div class="total-value">₹${fee.amount.toLocaleString()}</div>
              </div>
      
              <div class="footer">
                  <p>Thank you for your timely payment. This receipt is computer generated.</p>
                  <p>Authorized Signature • Accounts Department</p>
              </div>
          </div>
          <script>
              window.onload = function() { window.print(); }
          </script>
      </body>
      </html>
            `;
      
            const blob = new Blob([receiptHtml], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Receipt_${fee.studentName.replace(/\s+/g, '_')}_${fee.id}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate receipt:", error);
        }
    };

    const handlePayFee = (fee: FeeRecord) => {
        if(window.confirm(`Proceed to pay ₹${fee.amount.toLocaleString()} for ${fee.title}?`)) {
            try {
                storage.payFee(fee.id);
                // Construct updated fee object to generate receipt immediately
                const updatedFee = { ...fee, status: 'PAID' as const, paidDate: new Date().toISOString() };
                handleDownloadReceipt(updatedFee);
                
                // Use setTimeout to ensure the UI updates and download starts before alert
                setTimeout(() => {
                    alert('Payment Successful! Receipt downloaded.');
                }, 500);
            } catch (error) {
                console.error("Payment failed:", error);
                alert("Payment processing failed. Please try again.");
            }
        }
    };

    // --- RENDER LOGIC ---

    // 1. ACTIVE EXAM VIEW (Overrides all navigation)
    if (activeExam && activeExam.questions) {
        const currentQuestion = activeExam.questions[currentQuestionIdx];
        const totalCount = activeExam.questions.length;
        const answeredCount = Object.keys(examAnswers).length;
        const progress = (answeredCount / totalCount) * 100;

        return (
            <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col animate-fade-in overflow-hidden">
               <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm z-10">
                   <div>
                       <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeExam.subject}</h2>
                       <p className="text-sm text-gray-500">Code: {activeExam.code}</p>
                   </div>
                   <div className="flex items-center gap-4">
                       <div className="flex items-center text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900">
                           <Clock className="w-5 h-5 mr-2" />
                           {Math.floor(examTimer / 60)}:{(examTimer % 60).toString().padStart(2, '0')}
                       </div>
                       <button onClick={handleSubmitExam} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
                           Submit Exam
                       </button>
                   </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                   {/* Question Nav */}
                   <div className="w-72 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto hidden md:block">
                       <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase text-xs tracking-wider">Question Navigation</h3>
                       <div className="grid grid-cols-4 gap-2">
                           {activeExam.questions.map((q, idx) => (
                               <button 
                                   key={q.id}
                                   onClick={() => setCurrentQuestionIdx(idx)}
                                   className={`aspect-square rounded-lg font-bold text-sm transition ${
                                       currentQuestionIdx === idx ? 'bg-indigo-600 text-white shadow-md' :
                                       examAnswers[q.id] ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' :
                                       'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                                   }`}
                               >
                                   {idx + 1}
                               </button>
                           ))}
                       </div>
                       <div className="mt-8">
                           <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                               <span>Progress</span>
                               <span>{Math.round(progress)}%</span>
                           </div>
                           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                               <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                           </div>
                       </div>
                   </div>

                   {/* Question Area */}
                   <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white dark:bg-slate-900">
                       <div className="max-w-3xl mx-auto">
                           <div className="mb-8">
                               <div className="flex items-center gap-3 mb-2">
                                   <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Question {currentQuestionIdx + 1}</span>
                                   <span className="text-gray-400 text-sm font-medium">/ {totalCount}</span>
                               </div>
                               <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{currentQuestion.text}</h2>
                               <div className="mt-4 inline-flex items-center text-xs font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                   Points: {currentQuestion.marks}
                               </div>
                           </div>

                           {currentQuestion.type === 'MCQ' ? (
                               <div className="space-y-4">
                                   {currentQuestion.options?.map((opt, idx) => (
                                       <label key={idx} className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all group ${
                                           examAnswers[currentQuestion.id] === opt 
                                           ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' 
                                           : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                                       }`}>
                                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${
                                               examAnswers[currentQuestion.id] === opt
                                               ? 'border-indigo-600 bg-indigo-600'
                                               : 'border-gray-300 group-hover:border-indigo-400'
                                           }`}>
                                               {examAnswers[currentQuestion.id] === opt && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                           </div>
                                           <input 
                                               type="radio" 
                                               name={currentQuestion.id} 
                                               className="hidden"
                                               checked={examAnswers[currentQuestion.id] === opt}
                                               onChange={() => handleAnswerChange(currentQuestion.id, opt)}
                                           />
                                           <span className={`font-medium text-lg ${examAnswers[currentQuestion.id] === opt ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>{opt}</span>
                                       </label>
                                   ))}
                               </div>
                           ) : (
                               <textarea 
                                   className="w-full h-64 p-5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-slate-800 focus:border-indigo-500 focus:ring-0 outline-none resize-none dark:text-white text-lg leading-relaxed transition-all"
                                   placeholder="Type your detailed answer here..."
                                   value={examAnswers[currentQuestion.id] || ''}
                                   onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                               />
                           )}

                           <div className="mt-10 flex justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                               <button 
                                   disabled={currentQuestionIdx === 0}
                                   onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                                   className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                               >
                                   Previous
                               </button>
                               {currentQuestionIdx < activeExam.questions.length - 1 ? (
                                   <button 
                                       onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                       className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                                   >
                                       Next Question
                                   </button>
                               ) : (
                                   <button 
                                       onClick={handleSubmitExam}
                                       className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-500/20"
                                   >
                                       Finish Exam
                                   </button>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
            </div>
        );
    }

    // 2. MAIN DASHBOARD CONTENT (Conditional Views)
    return (
        <div className="space-y-8 animate-fade-in relative">
            
            {/* VIEW: DASHBOARD OVERVIEW */}
            {currentPage === 'dashboard' && (
                <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-6 rounded-3xl gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Student Dashboard</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm">Welcome back, {currentUser.name}. Ready to learn?</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsAttendanceModalOpen(true)}
                            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center space-x-2 cursor-pointer z-10"
                        >
                            <QrCode className="w-5 h-5 text-indigo-500" />
                            <span>Mark Attendance</span>
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {STUDENT_STATS.map((stat, idx) => (
                            <div key={idx} className="glass-panel p-5 md:p-6 rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                                    {stat.icon === 'Award' && <Award className="w-16 h-16 dark:text-white" />}
                                    {stat.icon === 'Clock' && <Clock className="w-16 h-16 dark:text-white" />}
                                    {stat.icon === 'FileText' && <FileText className="w-16 h-16 dark:text-white" />}
                                    {stat.icon === 'BookOpen' && <BookOpen className="w-16 h-16 dark:text-white" />}
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</h3>
                                <p className={`text-[10px] md:text-xs mt-2 font-bold px-2 py-1 inline-block rounded-lg ${stat.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                                    {stat.change} <span className="text-gray-500 dark:text-gray-400 font-medium ml-1">vs last term</span>
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Section */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Live Classes Banner */}
                            {liveClasses.length > 0 && (
                                <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                            </span>
                                            <span className="font-bold text-xs uppercase tracking-wider">Live Now</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-1">{liveClasses[0].topic}</h3>
                                        <p className="text-red-100 mb-4 text-sm">{liveClasses[0].courseName} • {liveClasses[0].instructorName}</p>
                                        <button 
                                            type="button"
                                            onClick={() => handleJoinLiveClass(liveClasses[0])}
                                            className="bg-white text-red-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transform duration-200"
                                        >
                                            <Video className="w-4 h-4" /> Join Class
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Pending Assignments */}
                            <div className="glass-panel p-6 md:p-8 rounded-3xl">
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-6 flex items-center">
                                    <FileText className="w-5 h-5 mr-3 text-indigo-500"/> Assignments
                                </h3>
                                <div className="space-y-4">
                                    {assignments.slice(0, 3).map(assign => {
                                        const submitted = submissions.find(s => s.assignmentId === assign.id);
                                        return (
                                            <div key={assign.id} className="p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 rounded-2xl transition group flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{assign.title}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{assign.courseName} • Due: {new Date(assign.dueDate).toLocaleDateString()}</p>
                                                </div>
                                                {submitted ? (
                                                    <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg text-xs font-bold">
                                                        <CheckCircle className="w-4 h-4 mr-1.5" />
                                                        {submitted.status === 'GRADED' ? `Graded: ${submitted.grade}` : 'Submitted'}
                                                    </div>
                                                ) : (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setSelectedAssignment(assign)}
                                                        className="px-4 py-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition flex items-center cursor-pointer"
                                                    >
                                                        <Upload className="w-4 h-4 mr-1.5" /> Upload
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {assignments.length === 0 && <p className="text-gray-400 text-center py-4">No pending assignments.</p>}
                                </div>
                            </div>

                            {/* Exams List */}
                            <div className="glass-panel p-6 md:p-8 rounded-3xl">
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-6 flex items-center">
                                    <Clock className="w-5 h-5 mr-3 text-pink-500"/> Active Exams
                                </h3>
                                <div className="space-y-4">
                                    {exams.slice(0, 3).map(exam => (
                                        <div key={exam.id} className="p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex justify-between items-center hover:shadow-md transition">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">{exam.subject}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{exam.duration} mins</span>
                                                    <span className="text-xs text-gray-500">{new Date(exam.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleStartExam(exam)}
                                                className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-500/20 cursor-pointer"
                                            >
                                                Start Exam
                                            </button>
                                        </div>
                                    ))}
                                    {exams.length === 0 && <p className="text-gray-400 text-center py-4">No active exams.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Section */}
                        <div className="space-y-6">
                            {/* Notices */}
                            <div className="glass-panel p-6 rounded-3xl">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center">
                                    <Megaphone className="w-5 h-5 mr-2 text-orange-500" /> Notices
                                </h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {notices.length === 0 && <p className="text-gray-400 text-sm">No notices.</p>}
                                    {notices.map(notice => (
                                        <div key={notice.id} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${notice.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{notice.priority}</span>
                                                <span className="text-[10px] text-gray-400">{notice.date}</span>
                                            </div>
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">{notice.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notice.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upcoming Classes */}
                            <div className="glass-panel p-6 rounded-3xl">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-indigo-500" /> Schedule
                                </h3>
                                <div className="space-y-3">
                                    {upcomingSessions.length === 0 && <p className="text-gray-400 text-sm">No classes today.</p>}
                                    {upcomingSessions.slice(0, 4).map(session => (
                                        <div key={session.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 leading-tight">
                                                <span>{session.time.split(' ')[0]}</span>
                                                <span className="text-[8px] uppercase">{session.time.split(' ')[1]}</span>
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{session.topic}</h4>
                                                <p className="text-xs text-gray-500 truncate">{session.courseName} • {session.room}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* VIEW: COURSES */}
            {currentPage === 'courses' && (
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h2>
                            <p className="text-gray-500 dark:text-gray-400">Enrolled subjects and progress</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map(course => (
                            <div key={course.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${course.color}`}>{course.code}</span>
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-400">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{course.title}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full ${course.color}`} style={{ width: `${course.progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <span className="text-xs text-gray-500 font-bold">{course.instructor}</span>
                                    <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW: ASSIGNMENTS */}
            {currentPage === 'assignments' && (
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h2>
                            <p className="text-gray-500 dark:text-gray-400">Track and submit your tasks</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {assignments.map(assign => {
                            const submitted = submissions.find(s => s.assignmentId === assign.id);
                            return (
                                <div key={assign.id} className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{assign.title}</h4>
                                            <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">{assign.courseName}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{assign.description}</p>
                                        <p className="text-xs text-gray-400 font-bold flex items-center">
                                            <Clock className="w-3 h-3 mr-1"/> Due: {new Date(assign.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {submitted ? (
                                        <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl text-sm font-bold">
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            {submitted.status === 'GRADED' ? `Graded: ${submitted.grade}` : 'Submitted'}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setSelectedAssignment(assign)}
                                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition flex items-center shadow-lg shadow-indigo-500/20"
                                        >
                                            <Upload className="w-4 h-4 mr-2" /> Upload Work
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW: EXAMS */}
            {currentPage === 'exams' && (
                <div className="space-y-8">
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exams & Results</h2>
                        <p className="text-gray-500 dark:text-gray-400">Scheduled tests and performance history</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Upcoming Exams */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Upcoming / Active</h3>
                            {exams.length === 0 ? <p className="text-gray-400">No upcoming exams.</p> : exams.map(exam => (
                                <div key={exam.id} className="p-5 bg-white dark:bg-slate-800 border-l-4 border-pink-500 rounded-xl shadow-sm hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{exam.subject}</h4>
                                        <span className="text-xs font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-1 rounded">{exam.code}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(exam.date).toLocaleDateString()}</span>
                                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {exam.time} ({exam.duration}m)</span>
                                    </div>
                                    <button 
                                        onClick={() => handleStartExam(exam)}
                                        className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-pink-500/20 cursor-pointer"
                                    >
                                        Start Exam
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Past Results */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Recent Results</h3>
                            {MOCK_RESULTS.map((res, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{res.subject}</h4>
                                        <p className="text-xs text-gray-500">{res.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-black text-indigo-600 dark:text-indigo-400">{res.score}%</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Score</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: FEES */}
            {currentPage === 'fees' && (
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fee Status</h2>
                        <p className="text-gray-500 dark:text-gray-400">Payment records and invoices</p>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {fees.map(fee => (
                                        <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{fee.title}</p>
                                                <span className="text-xs text-gray-500 uppercase">{fee.type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {new Date(fee.dueDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                ₹{fee.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    fee.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    fee.status === 'OVERDUE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                    {fee.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {fee.status === 'PAID' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-gray-400 text-xs font-bold flex items-center cursor-default">
                                                            <CheckCircle className="w-4 h-4 mr-1"/> Paid
                                                        </span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleDownloadReceipt(fee);
                                                            }}
                                                            className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline flex items-center"
                                                        >
                                                            <Download className="w-3 h-3 mr-1"/> Receipt
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handlePayFee(fee);
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition"
                                                    >
                                                        Pay Now
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {fees.length === 0 && <p className="text-center py-8 text-gray-500">No fee records found.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: PROFILE */}
            {currentPage === 'profile' && (
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-3xl">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h2>
                        <p className="text-gray-500 dark:text-gray-400">Personal and academic information</p>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <div className="px-8 pb-8">
                            <div className="relative -mt-16 mb-6">
                                <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-xl">
                                    <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-4xl font-bold text-gray-400 overflow-hidden">
                                        {currentUser.avatar || currentUser.name[0]}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
                                <p className="text-indigo-600 dark:text-indigo-400 font-bold">Student • ID: {currentUser.id}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Contact Information</h4>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="w-4 h-4 text-gray-400"/>
                                        <span className="text-gray-600 dark:text-gray-300">{currentUser.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="w-4 h-4 text-gray-400"/>
                                        <span className="text-gray-600 dark:text-gray-300">{currentUser.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="w-4 h-4 text-gray-400"/>
                                        <span className="text-gray-600 dark:text-gray-300">Campus Dorm A, Room 101</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Academic Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-indigo-500">
                                                <Calendar className="w-4 h-4"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Batch</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{currentUser.batch || '2025'}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-purple-500">
                                                <Users className="w-4 h-4"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Section</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{currentUser.section || 'A'}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-emerald-500">
                                                <Building className="w-4 h-4"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Department</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">{currentUser.department || 'General'}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-orange-500">
                                                <Hash className="w-4 h-4"/>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Roll No.</p>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">{currentUser.rollNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Modal */}
            {isAttendanceModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center border border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                            <QrCode className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mark Attendance</h3>
                        <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code provided by your teacher.</p>
                        
                        <input 
                            type="text" 
                            className="w-full text-center text-2xl font-bold tracking-widest py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none uppercase dark:text-white mb-6"
                            placeholder="XXXXXX"
                            maxLength={6}
                            value={attendanceCode}
                            onChange={(e) => setAttendanceCode(e.target.value)}
                        />
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmitAttendanceCode}
                                disabled={attendanceCode.length < 6}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Upload Modal */}
            {selectedAssignment && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submit Assignment</h3>
                            <button onClick={() => setSelectedAssignment(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-sm font-bold text-gray-500 uppercase">Assignment</p>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedAssignment.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">{selectedAssignment.description}</p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition-colors cursor-pointer bg-gray-50/50 dark:bg-slate-800/50 relative">
                            <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                id="file-upload"
                                onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                            />
                            {uploadFile ? (
                                <>
                                    <FileText className="w-10 h-10 text-indigo-500 mb-2" />
                                    <p className="font-bold text-gray-900 dark:text-white">{uploadFile.name}</p>
                                    <p className="text-xs text-gray-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                    <p className="font-bold text-gray-600 dark:text-gray-300">Click to upload file</p>
                                    <p className="text-xs text-gray-400">PDF, DOCX, or Images</p>
                                </>
                            )}
                        </div>

                        <button 
                            onClick={handleAssignmentUpload}
                            disabled={!uploadFile || isUploading}
                            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                        >
                            {isUploading ? 'Uploading...' : 'Submit Assignment'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
