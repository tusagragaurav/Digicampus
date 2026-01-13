import React, { useState, useEffect, useRef } from 'react';
import { TEACHER_STATS } from '../constants';
import { storage } from '../services/storage';
import { User, UserRole, Course, Assignment, AssignmentSubmission, ClassSession, Question, AttendanceRecord, LiveClass } from '../types';
import { FileText, Plus, X, FileCheck, Download, CheckCircle, Calendar, Users, PenTool, Megaphone, Trash2, Mail, Phone, Award, Video, BookOpen, QrCode, CheckSquare, RefreshCw, Clock, UploadCloud, FileSpreadsheet, Radio } from 'lucide-react';
import { JitsiMeet } from './JitsiMeet';

interface TeacherDashboardProps {
  currentUser: User;
  currentPage: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentUser, currentPage }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [stats] = useState(TEACHER_STATS);

  // Modals & Active States
  const [activeModal, setActiveModal] = useState<'ASSIGNMENT' | 'EXAM' | 'NOTICE' | 'CLASS' | 'ATTENDANCE' | 'LIVE' | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // Form States
  const [newAssignment, setNewAssignment] = useState({ courseId: '', title: '', description: '', dueDate: '' });
  const [newExam, setNewExam] = useState({ subject: '', code: '', date: '', time: '', duration: '', venue: 'Online' });
  const [newNotice, setNewNotice] = useState({ title: '', message: '', priority: 'MEDIUM' });
  const [newClass, setNewClass] = useState({ courseId: '', topic: '', date: '', time: '', duration: '60', room: 'Online' });
  const [newLiveClass, setNewLiveClass] = useState({ courseId: '', topic: '' });

  // Question Builder State
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<{text: string, type: 'MCQ' | 'TEXT', marks: string, options: string[], correctAnswer: number}>({
      text: '', type: 'MCQ', marks: '5', options: ['', '', '', ''], correctAnswer: 0
  });

  // Attendance State
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendanceMode, setAttendanceMode] = useState<'MANUAL' | 'QR' | 'UPLOAD'>('MANUAL');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAttendanceList, setManualAttendanceList] = useState<{student: User, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'}[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeTimer, setCodeTimer] = useState(0);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);

  // Live Class State
  const [activeLiveSession, setActiveLiveSession] = useState<LiveClass | null>(null);
  const [isLiveRoomOpen, setIsLiveRoomOpen] = useState(false);
  const [liveTimer, setLiveTimer] = useState(0);
  
  // Live Room Media State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);

  const myCourses = courses.filter(c => c.instructor === currentUser.name || c.instructorId === currentUser.id || true); 

  useEffect(() => {
    const loadData = () => {
       // In a real app, filter by instructor ID. Here we mock it.
       const allCourses = storage.getAllCourses();
       setCourses(allCourses); 
       
       setAssignments(storage.getAssignments());
       setSubmissions(storage.getAssignmentSubmissions());
       setSessions(storage.getSessions());

       // Check if I have an active live class
       const liveClasses = storage.getActiveLiveClasses();
       const myLive = liveClasses.find(c => c.instructorName === currentUser.name);
       if (myLive) {
           setActiveLiveSession(myLive);
           // Calculate elapsed time
           const elapsed = Math.floor((Date.now() - new Date(myLive.startTime).getTime()) / 1000);
           setLiveTimer(elapsed > 0 ? elapsed : 0);
       } else {
           setActiveLiveSession(null);
       }
    };
    loadData();
    window.addEventListener('storage-update', loadData);
    return () => window.removeEventListener('storage-update', loadData);
  }, [currentUser]);

  // Live Class Timer
  useEffect(() => {
      let interval: any;
      if (activeLiveSession) {
          interval = setInterval(() => {
              setLiveTimer(prev => prev + 1);
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [activeLiveSession]);

  // Media Stream Logic for Live Room
  useEffect(() => {
      let currentStream: MediaStream | null = null;

      const stopMedia = () => {
          if (currentStream) {
              currentStream.getTracks().forEach(track => track.stop());
          }
          if (videoRef.current) {
              videoRef.current.srcObject = null;
          }
      };

      const startMedia = async () => {
          // Cleanup previous stream before starting new one
          stopMedia();

          if (!isLiveRoomOpen) return;

          try {
              let videoStream: MediaStream | null = null;
              let audioStream: MediaStream | null = null;

              // 1. Determine Video Source
              if (isScreenSharing) {
                  try {
                      videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                      // Detect if user stops sharing via browser UI
                      videoStream.getVideoTracks()[0].onended = () => {
                          setIsScreenSharing(false);
                      };
                  } catch (e) {
                      console.error("Screen share cancelled", e);
                      setIsScreenSharing(false);
                      return; // Exit to let the state update trigger re-render
                  }
              } else if (!isVideoOff) {
                  try {
                      videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                  } catch (e) {
                      console.error("Camera error", e);
                  }
              }

              // 2. Always get Audio Source (Microphone)
              try {
                  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              } catch (e) {
                  console.error("Microphone error", e);
              }

              // 3. Combine Tracks
              const tracks = [
                  ...(videoStream ? videoStream.getVideoTracks() : []),
                  ...(audioStream ? audioStream.getAudioTracks() : [])
              ];

              if (tracks.length > 0) {
                  currentStream = new MediaStream(tracks);
                  
                  if (videoRef.current) {
                      videoRef.current.srcObject = currentStream;
                  }

                  // Sync Mute State
                  if (audioStream) {
                      audioStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
                  }
              }

          } catch (err) {
              console.error("Error setting up media:", err);
          }
      };

      startMedia();

      return () => {
          stopMedia();
      };
  }, [isLiveRoomOpen, isVideoOff, isScreenSharing]);

  // Toggle Audio Track without restarting stream
  useEffect(() => {
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      }
  }, [isMuted]);

  // Attendance Effects
  useEffect(() => {
      // Auto-select first course when modal opens if none selected
      if (activeModal === 'ATTENDANCE' && !attendanceCourseId && myCourses.length > 0) {
          setAttendanceCourseId(myCourses[0].id);
      }
  }, [activeModal, myCourses]);

  useEffect(() => {
      if (attendanceCourseId && activeModal === 'ATTENDANCE') {
          const students = storage.getEnrolledStudents(attendanceCourseId);
          // Fetch existing records for this date
          const existing = storage.getAttendance(attendanceCourseId).filter(r => r.date.startsWith(attendanceDate));
          
          const list = students.map(s => {
              const rec = existing.find(r => r.studentId === s.id);
              return {
                  student: s,
                  status: (rec ? rec.status : 'ABSENT') as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
              };
          });
          setManualAttendanceList(list);
      }
  }, [attendanceCourseId, attendanceDate, activeModal]);

  useEffect(() => {
      let interval: any;
      if (codeTimer > 0) {
          interval = setInterval(() => setCodeTimer(t => t - 1), 1000);
      }
      return () => clearInterval(interval);
  }, [codeTimer]);

  const handleGradeSubmission = () => {
      if (!selectedSubmission) return;
      storage.gradeAssignmentSubmission(selectedSubmission.id, grade, feedback);
      setSelectedSubmission(null);
      setGrade('');
      setFeedback('');
  };

  const handleDownloadWork = (sub: AssignmentSubmission) => {
      alert(`Downloading ${sub.fileUrl || 'file'}...`);
  };

  // --- Quick Action Handlers ---

  const handleStartLiveClass = () => {
      if (!newLiveClass.courseId || !newLiveClass.topic) return;
      const course = courses.find(c => c.id === newLiveClass.courseId);

      const liveSession: LiveClass = {
          id: Date.now().toString(),
          courseId: newLiveClass.courseId,
          courseName: course?.title || 'Unknown Course',
          topic: newLiveClass.topic,
          instructorName: currentUser.name,
          startTime: new Date().toISOString(),
          viewers: 0,
          status: 'LIVE'
      };

      storage.startLiveClass(liveSession);
      setActiveLiveSession(liveSession);
      setLiveTimer(0);
      setIsLiveRoomOpen(true); // Open the room immediately
      setActiveModal(null);
      setNewLiveClass({ courseId: '', topic: '' });
      
      // Notify students
      storage.sendNotification({
          targetRole: UserRole.STUDENT,
          title: `🔴 LIVE NOW: ${liveSession.topic}`,
          message: `${currentUser.name} has started a live class for ${course?.title}. Join now!`,
          type: 'ALERT',
          sender: currentUser.name
      });
  };

  const handleEndLiveClass = () => {
      if (!activeLiveSession) return;
      
      // Using window.confirm to be explicit
      if (window.confirm("Are you sure you want to end the live class?")) {
          // 1. Update Storage
          storage.endLiveClass(activeLiveSession.id);
          
          // 2. Update Local State to close UI immediately
          setIsLiveRoomOpen(false);
          setActiveLiveSession(null);
          setLiveTimer(0);
          
          // Note: Media stream cleanup is handled by the useEffect dependent on isLiveRoomOpen
      }
  };

  const handleCreateAssignment = () => {
      if (!newAssignment.courseId || !newAssignment.title || !newAssignment.dueDate) return;
      const course = courses.find(c => c.id === newAssignment.courseId);
      
      storage.addAssignment({
          id: Date.now().toString(),
          courseId: newAssignment.courseId,
          courseName: course?.title || 'Unknown Course',
          title: newAssignment.title,
          description: newAssignment.description,
          dueDate: newAssignment.dueDate
      });

      storage.sendNotification({
          targetRole: UserRole.STUDENT,
          title: `New Assignment: ${newAssignment.title}`,
          message: `Posted in ${course?.title}. Due by ${new Date(newAssignment.dueDate).toLocaleDateString()}`,
          type: 'INFO',
          sender: currentUser.name
      });

      setActiveModal(null);
      setNewAssignment({ courseId: '', title: '', description: '', dueDate: '' });
      alert('Assignment created successfully!');
  };

  const handleAddQuestion = () => {
      if(!newQuestion.text) return;
      const q: Question = {
          id: Date.now().toString() + Math.random(),
          text: newQuestion.text,
          type: newQuestion.type,
          marks: parseInt(newQuestion.marks) || 0,
          options: newQuestion.type === 'MCQ' ? newQuestion.options.filter(o => o.trim() !== '') : undefined,
          correctAnswer: newQuestion.type === 'MCQ' ? newQuestion.correctAnswer : undefined
      };
      setExamQuestions([...examQuestions, q]);
      setNewQuestion({ text: '', type: 'MCQ', marks: '5', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const removeQuestion = (id: string) => {
      setExamQuestions(examQuestions.filter(q => q.id !== id));
  };

  const handleCreateExam = () => {
      if (!newExam.subject || !newExam.date || !newExam.duration) return;
      
      storage.createExam({
          id: Date.now().toString(),
          subject: newExam.subject,
          code: newExam.code,
          date: newExam.date,
          time: newExam.time,
          duration: parseInt(newExam.duration),
          venue: newExam.venue,
          status: 'OPEN',
          fee: 0,
          questions: examQuestions
      });

      storage.sendNotification({
          targetRole: UserRole.STUDENT,
          title: `New Exam Scheduled: ${newExam.subject}`,
          message: `Date: ${new Date(newExam.date).toLocaleDateString()} at ${newExam.time}`,
          type: 'ALERT',
          sender: currentUser.name
      });

      setActiveModal(null);
      setNewExam({ subject: '', code: '', date: '', time: '', duration: '', venue: 'Online' });
      setExamQuestions([]);
      alert('Exam scheduled successfully!');
  };

  const handlePostNotice = () => {
      if (!newNotice.title || !newNotice.message) return;
      
      storage.addNotice({
          id: Date.now().toString(),
          title: newNotice.title,
          message: newNotice.message,
          priority: newNotice.priority as any,
          targetAudience: 'STUDENT',
          author: currentUser.name,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
      });

      storage.sendNotification({
          targetRole: UserRole.STUDENT,
          title: `Announcement: ${newNotice.title}`,
          message: newNotice.message,
          type: 'INFO',
          sender: currentUser.name
      });

      setActiveModal(null);
      setNewNotice({ title: '', message: '', priority: 'MEDIUM' });
      alert('Notice posted successfully!');
  };

  const handleScheduleClass = () => {
      if (!newClass.courseId || !newClass.topic || !newClass.date) return;
      const course = courses.find(c => c.id === newClass.courseId);

      storage.addSession({
          id: Date.now().toString(),
          courseId: newClass.courseId,
          courseName: course?.title || 'Unknown',
          date: newClass.date,
          time: newClass.time,
          duration: newClass.duration + ' mins',
          topic: newClass.topic,
          room: newClass.room
      });

      setActiveModal(null);
      setNewClass({ courseId: '', topic: '', date: '', time: '', duration: '60', room: 'Online' });
      alert('Class scheduled successfully!');
  };

  const handleAttendanceChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
      setManualAttendanceList(prev => prev.map(item => item.student.id === studentId ? { ...item, status } : item));
  };

  const saveManualAttendance = () => {
      const course = courses.find(c => c.id === attendanceCourseId);
      manualAttendanceList.forEach(item => {
          storage.markAttendance({
              id: Date.now().toString() + Math.random(),
              studentId: item.student.id,
              studentName: item.student.name,
              courseId: attendanceCourseId,
              courseName: course?.title || 'Unknown',
              date: attendanceDate,
              status: item.status,
              method: 'MANUAL'
          });
      });
      alert('Attendance records updated.');
      setActiveModal(null);
  };

  const generateAttendanceCode = () => {
      if (!attendanceCourseId) return;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const course = courses.find(c => c.id === attendanceCourseId);
      
      setGeneratedCode(code);
      setCodeTimer(300);

      storage.createAttendanceSession({
          code,
          courseId: attendanceCourseId,
          courseName: course?.title || 'Unknown',
          expiresAt: Date.now() + (5 * 60 * 1000)
      });
  };

  const handleFileUpload = () => {
      if (!attendanceFile || !attendanceCourseId) return;
      
      const course = courses.find(c => c.id === attendanceCourseId);
      const students = storage.getEnrolledStudents(attendanceCourseId);
      
      students.forEach(s => {
          storage.markAttendance({
              id: Date.now().toString() + Math.random(),
              studentId: s.id,
              studentName: s.name,
              courseId: attendanceCourseId,
              courseName: course?.title || 'Unknown',
              date: attendanceDate,
              status: 'PRESENT',
              method: 'MANUAL'
          });
      });

      alert(`Successfully processed ${attendanceFile.name}. Marked ${students.length} students as Present.`);
      setAttendanceFile(null);
      setActiveModal(null);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const notices = storage.getNotices(currentUser.role);

  const pendingSubmissions = submissions.filter(s => s.status === 'SUBMITTED');

  // --- RENDER HELPERS ---

  const renderLiveRoom = () => {
      if (!activeLiveSession) return null;

      return (
          <JitsiMeet
              roomName={activeLiveSession.id}
              displayName={currentUser.name}
              userId={currentUser.id}
              isHost={true}
              onMeetingEnd={handleEndLiveClass}
              onParticipantJoined={(participant) => {
                  // Update viewers count
                  setActiveLiveSession(prev => prev ? { ...prev, viewers: prev.viewers + 1 } : null);
              }}
              onParticipantLeft={(participant) => {
                  // Update viewers count
                  setActiveLiveSession(prev => prev ? { ...prev, viewers: Math.max(0, prev.viewers - 1) } : null);
              }}
          />
      );
  };

  // --- MAIN RENDER ---
  return (
    <>
      {isLiveRoomOpen && renderLiveRoom()}

      {/* Show regular dashboard underneath (hidden via overlay if live) */}
      <div className={isLiveRoomOpen ? 'hidden' : 'block'}>
          {currentPage === 'classes' && (
            <div className="space-y-6 animate-fade-in">
                <div className="glass-panel p-6 rounded-3xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Classes</h2>
                        <p className="text-gray-500 dark:text-gray-400">Manage your course curriculum and sessions</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="button"
                            onClick={() => setActiveModal('ATTENDANCE')} 
                            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer"
                        >
                            <CheckSquare className="w-4 h-4" /> Attendance
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveModal('CLASS')} 
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition flex items-center gap-2 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Schedule Class
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myCourses.map(course => (
                        <div key={course.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${course.color}`}>{course.code}</span>
                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-400">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{course.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{course.students} Students</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{course.nextClass}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition">
                                    Syllabus
                                </button>
                                <button className="flex-1 py-2 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                                    Resources
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {currentPage === 'students' && (
            <div className="space-y-6 animate-fade-in">
                <div className="glass-panel p-6 rounded-3xl">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Students</h2>
                    <p className="text-gray-500 dark:text-gray-400">View performance and details of all enrolled students</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Courses</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {(() => {
                                    const studentSet = new Map<string, any>();
                                    myCourses.forEach(c => {
                                        const enrolled = storage.getEnrolledStudents(c.id);
                                        enrolled.forEach(s => {
                                            if (!studentSet.has(s.id)) {
                                                studentSet.set(s.id, { ...s, courses: [c.code] });
                                            } else {
                                                const existing = studentSet.get(s.id);
                                                if (!existing.courses.includes(c.code)) {
                                                    existing.courses.push(c.code);
                                                }
                                            }
                                        });
                                    });
                                    const myStudents = Array.from(studentSet.values());
                                    
                                    return myStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {student.avatar || student.name[0]}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{student.name}</div>
                                                    <div className="text-xs text-gray-500">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {student.courses.map((code: string) => (
                                                    <span key={code} className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                                                        {code}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {student.batch || '2024'} - {student.section || 'A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5 max-w-[100px] mb-1">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-green-600">85% Avg</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold text-xs">View Profile</button>
                                        </td>
                                    </tr>
                                ))})()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {currentPage === 'profile' && (
            <div className="space-y-6 animate-fade-in">
                <div className="glass-panel p-6 rounded-3xl">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Teacher Profile</h2>
                    <p className="text-gray-500 dark:text-gray-400">Your professional details and settings</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-pink-500 to-rose-500"></div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6 flex justify-between items-end">
                            <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-xl">
                                <div className="w-full h-full rounded-xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-4xl font-bold text-gray-400 overflow-hidden">
                                    {currentUser.avatar && currentUser.avatar.length > 5 ? (
                                        <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover"/>
                                    ) : (
                                        currentUser.avatar || currentUser.name[0]
                                    )}
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                                Edit Profile
                            </button>
                        </div>
                        
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{currentUser.name}</h2>
                            <p className="text-pink-600 dark:text-pink-400 font-bold">{currentUser.role} • ID: {currentUser.id}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="p-5 bg-gray-50 dark:bg-slate-700/30 rounded-2xl flex items-start gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-gray-400 shadow-sm">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email Address</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{currentUser.email}</p>
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 dark:bg-slate-700/30 rounded-2xl flex items-start gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-gray-400 shadow-sm">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{currentUser.phone || '+1 (555) 000-0000'}</p>
                                </div>
                            </div>
                            <div className="p-5 bg-gray-50 dark:bg-slate-700/30 rounded-2xl flex items-start gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-gray-400 shadow-sm">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Specialization</p>
                                    <p className="font-medium text-gray-900 dark:text-white">Computer Science, AI</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Teaching Subjects</h3>
                            <div className="flex flex-wrap gap-2">
                                {currentUser.subjects?.map(sub => (
                                    <span key={sub} className="px-4 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 rounded-xl font-bold text-sm border border-pink-100 dark:border-pink-800">
                                        {sub}
                                    </span>
                                )) || <span className="text-gray-400 italic">No subjects listed</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {currentPage === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-6 rounded-3xl gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Teacher Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm">Overview of your classes and student performance.</p>
                    </div>
                    <div className="flex gap-3">
                        {activeLiveSession ? (
                            <button 
                                onClick={() => setIsLiveRoomOpen(true)}
                                className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 px-6 py-3 rounded-2xl font-bold flex items-center space-x-3 shadow-inner hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                            >
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="uppercase tracking-wider text-xs">Resume Live Class ({formatTime(liveTimer)})</span>
                            </button>
                        ) : (
                            <button 
                                onClick={() => setActiveModal('LIVE')}
                                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-500/30 hover:-translate-y-0.5 transition flex items-center space-x-2 btn-3d"
                            >
                                <Radio className="w-5 h-5" />
                                <span>Go Live</span>
                            </button>
                        )}
                        <button 
                            onClick={() => setActiveModal('ASSIGNMENT')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 transition flex items-center space-x-2 btn-3d"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Assignment</span>
                        </button>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => setActiveModal('ASSIGNMENT')} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-violet-500 dark:hover:border-violet-500 transition-all group text-left">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Assignment</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create new task</p>
                    </button>

                    <button onClick={() => setActiveModal('EXAM')} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-pink-500 dark:hover:border-pink-500 transition-all group text-left">
                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-3 group-hover:scale-110 transition-transform">
                            <PenTool className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Exam</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Schedule test</p>
                    </button>

                    <button onClick={() => setActiveModal('NOTICE')} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-orange-500 dark:hover:border-orange-500 transition-all group text-left">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3 group-hover:scale-110 transition-transform">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Notice</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Announce info</p>
                    </button>

                    <button onClick={() => setActiveModal('CLASS')} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group text-left">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                            <Video className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">Class</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Schedule session</p>
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="glass-panel p-5 md:p-6 rounded-3xl hover:shadow-xl transition-all duration-300 group border-b-4 border-indigo-500/20 hover:border-indigo-500">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-bold uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <div className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stat.value}</div>
                            <div className={`text-[10px] md:text-xs mt-2 font-bold px-2 py-1 inline-block rounded-lg ${stat.trend === 'up' ? 'bg-green-100 text-green-700' : stat.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                {stat.change} {stat.trend === 'neutral' ? '' : 'vs last month'}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center">
                                <FileCheck className="w-5 h-5 mr-3 text-indigo-500"/>
                                Pending Reviews
                            </h3>
                        </div>
                        
                        <div className="space-y-4">
                            {pendingSubmissions.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">No pending submissions to review.</p>
                            ) : (
                                pendingSubmissions.map(sub => (
                                    <div key={sub.id} className="p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{sub.assignmentTitle}</h4>
                                                <p className="text-sm text-gray-500">Student: <span className="font-bold text-indigo-600 dark:text-indigo-400">{sub.studentName}</span></p>
                                            </div>
                                            <span className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">Needs Grading</span>
                                        </div>
                                        
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadWork(sub);
                                                    }}
                                                    className="p-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                                                    title="Download File"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedSubmission(sub)}
                                                    className="px-4 py-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-50 dark:hover:text-white transition"
                                                >
                                                    Grade Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-3xl">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-indigo-500"/> 
                                Upcoming Classes
                            </h3>
                            <div className="space-y-4">
                                {sessions.slice(0,3).map(session => (
                                    <div key={session.id} className="flex items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                                            {session.time.split(' ')[0]}
                                        </div>
                                        <div className="ml-3 overflow-hidden">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{session.topic}</h4>
                                            <p className="text-xs text-gray-500 truncate">{session.courseName}</p>
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && <p className="text-sm text-gray-400">No upcoming classes.</p>}
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-emerald-500"/>
                                Course Enrollments
                            </h3>
                            <div className="space-y-3">
                                {courses.map(course => (
                                    <div key={course.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition">
                                        <span className="text-gray-600 dark:text-gray-300 font-medium">{course.code}</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{course.students} Students</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-3xl">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 flex items-center">
                                <Megaphone className="w-5 h-5 mr-2 text-orange-500"/>
                                Notice Board
                            </h3>
                            <div className="space-y-4">
                                {notices.length === 0 ? (
                                    <p className="text-sm text-gray-400">No notices available.</p>
                                ) : (
                                    notices.map(notice => (
                                        <div key={notice.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{notice.title}</h4>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${notice.priority === 'HIGH' ? 'bg-red-100 text-red-700' : notice.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {notice.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notice.message}</p>
                                            <p className="text-xs text-gray-400">By {notice.author} • {notice.date}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
      </div>

        {/* Grading Modal */}
        {selectedSubmission && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Grade Submission</h3>
                        <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assignment</p>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{selectedSubmission.assignmentTitle}</h4>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-1">{selectedSubmission.studentName}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Grade / Score</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                placeholder="e.g. A, 95/100"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Feedback</label>
                            <textarea 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white resize-none h-32"
                                placeholder="Provide constructive feedback..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                        
                        <button 
                            onClick={handleGradeSubmission}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-4 btn-3d"
                        >
                            <CheckCircle className="w-5 h-5"/>
                            <span>Submit Grade</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Start Live Class Modal */}
        {activeModal === 'LIVE' && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Radio className="w-6 h-6 mr-2 text-red-500" /> Go Live
                        </h3>
                        <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Course</label>
                            <select 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition dark:text-white"
                                value={newLiveClass.courseId}
                                onChange={(e) => setNewLiveClass({...newLiveClass, courseId: e.target.value})}
                            >
                                <option value="">-- Select Course --</option>
                                {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Session Topic</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition dark:text-white"
                                placeholder="e.g. Q&A Session"
                                value={newLiveClass.topic}
                                onChange={(e) => setNewLiveClass({...newLiveClass, topic: e.target.value})}
                            />
                        </div>
                        <button 
                            onClick={handleStartLiveClass}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-4 btn-3d shadow-lg shadow-red-500/20"
                        >
                            <Radio className="w-5 h-5" />
                            <span>Start Streaming</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Attendance Modal */}
        {activeModal === 'ATTENDANCE' && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mark Attendance</h3>
                        <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>

                    {/* Course & Mode Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Course</label>
                            <select 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-slate-800 focus:outline-none dark:text-white"
                                value={attendanceCourseId}
                                onChange={(e) => setAttendanceCourseId(e.target.value)}
                            >
                                <option value="">Select Course</option>
                                {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-slate-800 focus:outline-none dark:text-white"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {attendanceCourseId ? (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-4 shrink-0">
                                <button 
                                    onClick={() => setAttendanceMode('MANUAL')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${attendanceMode === 'MANUAL' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Manual Marking
                                </button>
                                <button 
                                    onClick={() => setAttendanceMode('QR')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${attendanceMode === 'QR' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    QR Code / Auto
                                </button>
                                <button 
                                    onClick={() => setAttendanceMode('UPLOAD')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${attendanceMode === 'UPLOAD' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Upload Sheet
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {attendanceMode === 'MANUAL' ? (
                                    <div className="space-y-2">
                                        {manualAttendanceList.length === 0 ? (
                                            <p className="text-center text-gray-400 py-8">No students found.</p>
                                        ) : (
                                            manualAttendanceList.map((item) => (
                                                <div key={item.student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                                            {item.student.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{item.student.name}</p>
                                                            <p className="text-xs text-gray-500">{item.student.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => handleAttendanceChange(item.student.id, 'PRESENT')}
                                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${item.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                                                        >
                                                            P
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAttendanceChange(item.student.id, 'ABSENT')}
                                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${item.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                                                        >
                                                            A
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAttendanceChange(item.student.id, 'LATE')}
                                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${item.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                                                        >
                                                            L
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : attendanceMode === 'QR' ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        {!generatedCode ? (
                                            <>
                                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                                                    <QrCode className="w-8 h-8" />
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 font-medium mb-4">Generate a 6-digit numeric session code for students to enter.</p>
                                                <button 
                                                    onClick={generateAttendanceCode}
                                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30"
                                                >
                                                    Generate Code
                                                </button>
                                            </>
                                        ) : (
                                            <div className="animate-fade-in">
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Session Code</p>
                                                <div className="text-5xl font-black text-gray-900 dark:text-white tracking-widest mb-4 bg-gray-100 dark:bg-slate-800 px-8 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-mono">
                                                    {generatedCode}
                                                </div>
                                                <p className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-2">
                                                    <Clock className="w-4 h-4" /> Expires in {Math.floor(codeTimer / 60)}:{(codeTimer % 60).toString().padStart(2, '0')}
                                                </p>
                                                <button 
                                                    onClick={generateAttendanceCode}
                                                    className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCw className="w-4 h-4" /> Regenerate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                        <div className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors bg-gray-50/50 dark:bg-slate-800/50 relative">
                                            <input 
                                                type="file" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => setAttendanceFile(e.target.files ? e.target.files[0] : null)}
                                                accept=".csv,.xlsx"
                                            />
                                            {attendanceFile ? (
                                                <div className="flex flex-col items-center">
                                                    <FileSpreadsheet className="w-12 h-12 text-green-600 mb-3" />
                                                    <p className="font-bold text-gray-900 dark:text-white">{attendanceFile.name}</p>
                                                    <p className="text-xs text-gray-500">{(attendanceFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                                                    <p className="font-bold text-gray-600 dark:text-gray-300">Click to upload Attendance Sheet</p>
                                                    <p className="text-xs text-gray-400 mt-1">CSV or Excel format</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-6 flex flex-col gap-3 w-full">
                                            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center justify-center gap-2">
                                                <Download className="w-4 h-4" /> Download Template CSV
                                            </button>
                                            <button 
                                                disabled={!attendanceFile}
                                                onClick={handleFileUpload}
                                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-500/30 w-full"
                                            >
                                                Process Upload
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {attendanceMode === 'MANUAL' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button 
                                        onClick={saveManualAttendance}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20"
                                    >
                                        Save Attendance
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 italic">
                            Select a course to proceed.
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Create Assignment Modal */}
        {activeModal === 'ASSIGNMENT' && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Assignment</h3>
                        <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Course</label>
                            <select 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                value={newAssignment.courseId}
                                onChange={(e) => setNewAssignment({...newAssignment, courseId: e.target.value})}
                            >
                                <option value="">-- Select Course --</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="Assignment Title" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                            <input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                value={newAssignment.dueDate} onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white h-24 resize-none"
                                value={newAssignment.description} onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})} placeholder="Instructions..." />
                        </div>
                        <button onClick={handleCreateAssignment} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition mt-2 btn-3d">Create Assignment</button>
                    </div>
                </div>
            </div>
        )}

        {/* Create Exam Modal (Updated with Questions) */}
        {activeModal === 'EXAM' && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Schedule New Exam</h3>
                        <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
                        {/* Exam Details Section */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Exam Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                    <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition dark:text-white"
                                        value={newExam.subject} onChange={(e) => setNewExam({...newExam, subject: e.target.value})} placeholder="e.g. Math Final" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Code</label>
                                    <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition dark:text-white"
                                        value={newExam.code} onChange={(e) => setNewExam({...newExam, code: e.target.value})} placeholder="e.g. MAT-101" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                    <input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition dark:text-white"
                                        value={newExam.date} onChange={(e) => setNewExam({...newExam, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                    <input type="time" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition dark:text-white"
                                        value={newExam.time} onChange={(e) => setNewExam({...newExam, time: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Duration (min)</label>
                                    <input type="number" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition dark:text-white"
                                        value={newExam.duration} onChange={(e) => setNewExam({...newExam, duration: e.target.value})} placeholder="60" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Venue</label>
                                    <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-pink-500 outline-none transition dark:text-white"
                                        value={newExam.venue} onChange={(e) => setNewExam({...newExam, venue: e.target.value})} placeholder="Online" />
                                </div>
                            </div>
                        </div>

                        {/* Question Builder Section */}
                        <div className="space-y-4">
                             <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300">Add Questions</h4>
                                <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg font-bold">{examQuestions.length} Added</span>
                             </div>

                             <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                 <div className="mb-3">
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question Text</label>
                                     <textarea 
                                         className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm dark:text-white"
                                         rows={2}
                                         value={newQuestion.text}
                                         onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                                         placeholder="Enter question here..."
                                     />
                                 </div>
                                 <div className="grid grid-cols-2 gap-3 mb-3">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                         <select 
                                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm dark:text-white"
                                            value={newQuestion.type}
                                            onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value as 'MCQ' | 'TEXT'})}
                                         >
                                             <option value="MCQ">Multiple Choice</option>
                                             <option value="TEXT">Text Answer</option>
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marks</label>
                                         <input 
                                             type="number"
                                             className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none text-sm dark:text-white"
                                             value={newQuestion.marks}
                                             onChange={(e) => setNewQuestion({...newQuestion, marks: e.target.value})}
                                         />
                                     </div>
                                 </div>
                                 
                                 {newQuestion.type === 'MCQ' && (
                                     <div className="mb-3">
                                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Options (Select correct answer)</label>
                                         <div className="grid grid-cols-1 gap-2">
                                             {newQuestion.options.map((opt, idx) => (
                                                 <div key={idx} className="flex items-center gap-2">
                                                     <input 
                                                        type="radio" 
                                                        name="correctOption"
                                                        checked={newQuestion.correctAnswer === idx}
                                                        onChange={() => setNewQuestion({...newQuestion, correctAnswer: idx})}
                                                        className="w-4 h-4 text-pink-600 focus:ring-pink-500 cursor-pointer"
                                                        title="Mark as correct answer"
                                                     />
                                                     <input 
                                                         type="text"
                                                         className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-pink-500 outline-none text-sm dark:text-white"
                                                         placeholder={`Option ${idx + 1}`}
                                                         value={opt}
                                                         onChange={(e) => {
                                                             const newOpts = [...newQuestion.options];
                                                             newOpts[idx] = e.target.value;
                                                             setNewQuestion({...newQuestion, options: newOpts});
                                                         }}
                                                     />
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                                 <button onClick={handleAddQuestion} className="w-full py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold rounded-lg text-sm transition">
                                     Add Question
                                 </button>
                             </div>

                             {/* Questions List */}
                             {examQuestions.length > 0 && (
                                 <div className="space-y-2">
                                     {examQuestions.map((q, i) => (
                                         <div key={q.id} className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-xl flex justify-between items-start group">
                                             <div className="flex-1">
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <span className="text-xs font-bold bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded">Q{i+1}</span>
                                                     <span className="text-xs font-bold text-gray-400 uppercase">{q.type} • {q.marks} Marks</span>
                                                 </div>
                                                 <p className="text-sm font-medium text-gray-900 dark:text-white">{q.text}</p>
                                                 {q.type === 'MCQ' && q.options && (
                                                     <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                                                         {q.options.map((opt, idx) => (
                                                             <div key={idx} className={idx === q.correctAnswer ? 'text-green-600 font-bold' : ''}>
                                                                 {idx === q.correctAnswer && '✓ '}{opt}
                                                             </div>
                                                         ))}
                                                     </div>
                                                 )}
                                             </div>
                                             <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-0 group-hover:opacity-100">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-2 shrink-0">
                        <button onClick={handleCreateExam} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3.5 rounded-xl transition btn-3d shadow-lg shadow-pink-500/20">
                            {examQuestions.length > 0 ? `Schedule Exam with ${examQuestions.length} Questions` : 'Schedule Exam'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Announce Notice Modal */}
        {activeModal === 'NOTICE' && (
             <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                 <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white">Post Notice</h3>
                         <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                     </div>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                             <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                 value={newNotice.title} onChange={(e) => setNewNotice({...newNotice, title: e.target.value})} placeholder="Notice Title" />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                             <textarea className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white h-24 resize-none"
                                 value={newNotice.message} onChange={(e) => setNewNotice({...newNotice, message: e.target.value})} placeholder="Announcement details..." />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                             <select className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                 value={newNotice.priority} onChange={(e) => setNewNotice({...newNotice, priority: e.target.value})} >
                                 <option value="LOW">Low</option>
                                 <option value="MEDIUM">Medium</option>
                                 <option value="HIGH">High</option>
                             </select>
                         </div>
                         <button onClick={handlePostNotice} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition mt-2 btn-3d">Post Notice</button>
                     </div>
                 </div>
             </div>
        )}

        {/* Schedule Class Modal */}
        {activeModal === 'CLASS' && (
             <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                 <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white">Schedule Class</h3>
                         <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                     </div>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Course</label>
                             <select className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                 value={newClass.courseId} onChange={(e) => setNewClass({...newClass, courseId: e.target.value})} >
                                 <option value="">-- Select Course --</option>
                                 {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                             <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                 value={newClass.topic} onChange={(e) => setNewClass({...newClass, topic: e.target.value})} placeholder="Lecture Topic" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                 <input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                     value={newClass.date} onChange={(e) => setNewClass({...newClass, date: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                 <input type="time" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                     value={newClass.time} onChange={(e) => setNewClass({...newClass, time: e.target.value})} />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Duration (min)</label>
                                 <input type="number" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                     value={newClass.duration} onChange={(e) => setNewClass({...newClass, duration: e.target.value})} placeholder="60" />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Room/Link</label>
                                 <input type="text" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                     value={newClass.room} onChange={(e) => setNewClass({...newClass, room: e.target.value})} placeholder="Online" />
                             </div>
                         </div>
                         <button onClick={handleScheduleClass} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition mt-2 btn-3d">Schedule Class</button>
                     </div>
                 </div>
             </div>
        )}
    </>
  );
};