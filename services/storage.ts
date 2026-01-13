import { 
  User, Course, Note, Notice, CalendarEvent, ExamSession, 
  ExamSubmission, Assignment, AssignmentSubmission, FeeRecord, ClassSession, 
  LiveClass, AppNotification, SystemSettings, UserRole, Question, AttendanceRecord, AttendanceSession 
} from '../types';
import { 
  MOCK_COURSES, MOCK_NOTES, MOCK_NOTICES, 
  MOCK_EVENTS, MOCK_EXAMS 
} from '../constants';

const KEYS = {
  USERS: 'lms_users',
  COURSES: 'lms_courses',
  SESSIONS: 'lms_sessions',
  ASSIGNMENTS: 'lms_assignments',
  SUBMISSIONS: 'lms_submissions',
  EXAMS: 'lms_exams',
  EXAM_SUBMISSIONS: 'lms_exam_submissions',
  FEES: 'lms_fees',
  NOTICES: 'lms_notices',
  NOTES: 'lms_notes',
  EVENTS: 'lms_events',
  SETTINGS: 'lms_settings',
  NOTIFICATIONS: 'lms_notifications',
  LIVE_CLASSES: 'lms_live_classes',
  ATTENDANCE: 'lms_attendance',
  ATTENDANCE_SESSIONS: 'lms_attendance_sessions'
};

const DEFAULT_USERS: User[] = [
    { 
      id: '1', 
      name: 'Tusagra Gaurav', 
      email: 'tusagra@edu.com', 
      role: UserRole.STUDENT, 
      batch: '2025', 
      section: 'B', 
      department: 'Computer Science',
      rollNumber: '221003003171',
      phone: '+1 (555) 123-4567'
      
    },
    {
        id: '2', 
      name: 'Amritanshu', 
      email: 'amrit@edu.com', 
      role: UserRole.STUDENT, 
      batch: '2025', 
      section: 'B', 
      department: 'Computer Science',
      rollNumber: '221003003218',
      phone: '+1 (555) 123-4567'
    },


    { id: '2', name: 'Dr. Arpita Dutta', email: 'arpita@edu.com', role: UserRole.TEACHER, subjects: ['Computer Vision', 'AI'] },
    { id: '3', name: 'Admin User', email: 'admin@edu.com', role: UserRole.ADMIN },
    { id: '4', name: 'Accountant', email: 'finance@edu.com', role: UserRole.ACCOUNTANT },
];

export const storage = {
  init: () => {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(KEYS.COURSES)) {
      localStorage.setItem(KEYS.COURSES, JSON.stringify(MOCK_COURSES));
    }
    if (!localStorage.getItem(KEYS.NOTICES)) {
      localStorage.setItem(KEYS.NOTICES, JSON.stringify(MOCK_NOTICES));
    }
    if (!localStorage.getItem(KEYS.NOTES)) {
      localStorage.setItem(KEYS.NOTES, JSON.stringify(MOCK_NOTES));
    }
    if (!localStorage.getItem(KEYS.EXAMS)) {
      localStorage.setItem(KEYS.EXAMS, JSON.stringify(MOCK_EXAMS));
    }
    if (!localStorage.getItem(KEYS.EVENTS)) {
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(MOCK_EVENTS));
    }
    if (!localStorage.getItem(KEYS.SESSIONS)) {
        // Mock some sessions
        const sessions: ClassSession[] = [
            { id: '1', courseId: '1', courseName: 'Advanced Computer Vision', date: new Date().toISOString(), time: '10:00 AM', duration: '60', topic: 'CNN Architectures', room: 'Hall A' },
            { id: '2', courseId: '3', courseName: 'Artificial Intelligence', date: new Date().toISOString(), time: '02:00 PM', duration: '90', topic: 'Search Algorithms', room: 'Lab 3' }
        ];
        localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    }
    if(!localStorage.getItem(KEYS.LIVE_CLASSES)) {
        const mockLive: LiveClass[] = [
             { id: '1', courseId: '1', courseName: 'Advanced Computer Vision', topic: 'YOLOv8 Walkthrough', instructorName: 'Dr. Smith', startTime: new Date().toISOString(), viewers: 45, status: 'LIVE' }
        ];
        localStorage.setItem(KEYS.LIVE_CLASSES, JSON.stringify(mockLive));
    }
    if(!localStorage.getItem(KEYS.SETTINGS)) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ notificationsEnabled: true }));
    }
    if(!localStorage.getItem(KEYS.ATTENDANCE)) {
        localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if(!localStorage.getItem(KEYS.ATTENDANCE_SESSIONS)) {
        localStorage.setItem(KEYS.ATTENDANCE_SESSIONS, JSON.stringify([]));
    }
  },

  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  addUser: (user: User) => {
      const users = storage.getUsers();
      localStorage.setItem(KEYS.USERS, JSON.stringify([...users, user]));
      window.dispatchEvent(new Event('storage-update'));
  },
  deleteUser: (id: string) => {
      const users = storage.getUsers().filter(u => u.id !== id);
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      window.dispatchEvent(new Event('storage-update'));
  },

  getAllCourses: (): Course[] => JSON.parse(localStorage.getItem(KEYS.COURSES) || '[]'),
  getEnrolledCourses: (studentId: string): Course[] => {
      // For demo, return all courses for student
      return storage.getAllCourses(); 
  },
  addCourse: (course: Course) => {
      const courses = storage.getAllCourses();
      localStorage.setItem(KEYS.COURSES, JSON.stringify([...courses, course]));
      window.dispatchEvent(new Event('storage-update'));
  },
  deleteCourse: (id: string) => {
      const courses = storage.getAllCourses().filter(c => c.id !== id);
      localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
      window.dispatchEvent(new Event('storage-update'));
  },

  getSessions: (): ClassSession[] => JSON.parse(localStorage.getItem(KEYS.SESSIONS) || '[]'),
  addSession: (session: ClassSession) => {
      const sessions = storage.getSessions();
      localStorage.setItem(KEYS.SESSIONS, JSON.stringify([...sessions, session]));
      window.dispatchEvent(new Event('storage-update'));
  },

  getAssignments: (): Assignment[] => JSON.parse(localStorage.getItem(KEYS.ASSIGNMENTS) || '[]'),
  addAssignment: (assignment: Assignment) => {
      const assigns = storage.getAssignments();
      localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify([...assigns, assignment]));
      window.dispatchEvent(new Event('storage-update'));
  },

  getAssignmentSubmissions: (): AssignmentSubmission[] => JSON.parse(localStorage.getItem(KEYS.SUBMISSIONS) || '[]'),
  submitAssignment: (sub: AssignmentSubmission) => {
      const subs = storage.getAssignmentSubmissions();
      localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify([...subs, sub]));
      window.dispatchEvent(new Event('storage-update'));
  },
  gradeAssignmentSubmission: (id: string, grade: string, feedback: string) => {
      const subs = storage.getAssignmentSubmissions().map(s => {
          if (s.id === id) {
              return { ...s, status: 'GRADED', grade, feedback } as AssignmentSubmission;
          }
          return s;
      });
      localStorage.setItem(KEYS.SUBMISSIONS, JSON.stringify(subs));
      window.dispatchEvent(new Event('storage-update'));
  },

  getExams: (): ExamSession[] => JSON.parse(localStorage.getItem(KEYS.EXAMS) || '[]'),
  createExam: (exam: ExamSession) => {
      const exams = storage.getExams();
      localStorage.setItem(KEYS.EXAMS, JSON.stringify([...exams, exam]));
      window.dispatchEvent(new Event('storage-update'));
  },
  submitExamAnswers: (submission: ExamSubmission) => {
      const exams = storage.getExams();
      const exam = exams.find(e => e.id === submission.examId);
      
      let calculatedScore = 0;
      let isFullyAutoGraded = true;

      if (exam && exam.questions) {
          exam.questions.forEach(q => {
              if (q.type === 'MCQ' && q.correctAnswer !== undefined && q.options) {
                  const studentAnswer = submission.answers[q.id];
                  if (studentAnswer === q.options[q.correctAnswer]) {
                      calculatedScore += q.marks;
                  }
              } else if (q.type === 'TEXT') {
                  isFullyAutoGraded = false;
              }
          });
      }

      const finalSubmission = {
          ...submission,
          score: calculatedScore,
          status: (isFullyAutoGraded ? 'GRADED' : 'SUBMITTED') as 'GRADED' | 'SUBMITTED'
      };

      const subs = JSON.parse(localStorage.getItem(KEYS.EXAM_SUBMISSIONS) || '[]');
      localStorage.setItem(KEYS.EXAM_SUBMISSIONS, JSON.stringify([...subs, finalSubmission]));
      window.dispatchEvent(new Event('storage-update'));
  },

  getFees: (): FeeRecord[] => JSON.parse(localStorage.getItem(KEYS.FEES) || '[]'),
  addFee: (fee: FeeRecord) => {
      const fees = storage.getFees();
      localStorage.setItem(KEYS.FEES, JSON.stringify([...fees, fee]));
      window.dispatchEvent(new Event('storage-update'));
  },
  payFee: (id: string) => {
      const fees = storage.getFees().map(f => {
          if (f.id === id) {
              return { ...f, status: 'PAID', paidDate: new Date().toISOString() } as FeeRecord;
          }
          return f;
      });
      localStorage.setItem(KEYS.FEES, JSON.stringify(fees));
      window.dispatchEvent(new Event('storage-update'));
  },

  getNotices: (role: UserRole): Notice[] => {
      const all = JSON.parse(localStorage.getItem(KEYS.NOTICES) || '[]') as Notice[];
      if (role === UserRole.ADMIN) return all;
      return all.filter(n => {
          if (n.targetAudience === 'ALL') return true;
          if (role === UserRole.STUDENT && n.targetAudience === 'STUDENT') return true;
          if (role === UserRole.TEACHER && n.targetAudience === 'TEACHER') return true;
          return false;
      });
  },
  addNotice: (notice: Notice) => {
      const notices = JSON.parse(localStorage.getItem(KEYS.NOTICES) || '[]');
      localStorage.setItem(KEYS.NOTICES, JSON.stringify([notice, ...notices]));
      window.dispatchEvent(new Event('storage-update'));
  },

  getNotes: (): Note[] => JSON.parse(localStorage.getItem(KEYS.NOTES) || '[]'),
  addNote: (note: Note) => {
      const notes = storage.getNotes();
      localStorage.setItem(KEYS.NOTES, JSON.stringify([...notes, note]));
      window.dispatchEvent(new Event('storage-update'));
  },

  getEvents: (): CalendarEvent[] => JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]'),
  
  getSettings: (): SystemSettings => JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{"notificationsEnabled": true}'),
  updateSettings: (settings: Partial<SystemSettings>) => {
      const current = storage.getSettings();
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...settings }));
  },

  sendNotification: (notification: Partial<AppNotification>) => {
      const notifs = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
      const newNotif = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          isRead: false,
          ...notification
      };
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([newNotif, ...notifs]));
  },

  getEnrolledStudents: (courseId: string): User[] => {
      // Get students enrolled in a specific course
      const enrollments = JSON.parse(localStorage.getItem('lms_enrollments') || '{}');
      const enrolledIds = enrollments[courseId] || [];
      return storage.getUsers().filter(u => enrolledIds.includes(u.id));
  },

  enrollStudent: (studentId: string, courseId: string) => {
      const enrollments = JSON.parse(localStorage.getItem('lms_enrollments') || '{}');
      if (!enrollments[courseId]) {
          enrollments[courseId] = [];
      }
      if (!enrollments[courseId].includes(studentId)) {
          enrollments[courseId].push(studentId);
      }
      localStorage.setItem('lms_enrollments', JSON.stringify(enrollments));

      // Update course student count
      const courses = storage.getAllCourses();
      const course = courses.find(c => c.id === courseId);
      if (course) {
          course.students = storage.getEnrolledStudents(courseId).length;
          localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
      }
      window.dispatchEvent(new Event('storage-update'));
  },

  unenrollStudent: (studentId: string, courseId: string) => {
      const enrollments = JSON.parse(localStorage.getItem('lms_enrollments') || '{}');
      if (enrollments[courseId]) {
          enrollments[courseId] = enrollments[courseId].filter((id: string) => id !== studentId);
      }
      localStorage.setItem('lms_enrollments', JSON.stringify(enrollments));

      // Update course student count
      const courses = storage.getAllCourses();
      const course = courses.find(c => c.id === courseId);
      if (course) {
          course.students = storage.getEnrolledStudents(courseId).length;
          localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
      }
      window.dispatchEvent(new Event('storage-update'));
  },

  getStudentEnrollments: (studentId: string): Course[] => {
      const enrollments = JSON.parse(localStorage.getItem('lms_enrollments') || '{}');
      const enrolledCourseIds: string[] = [];
      Object.keys(enrollments).forEach(courseId => {
          if (enrollments[courseId].includes(studentId)) {
              enrolledCourseIds.push(courseId);
          }
      });
      return storage.getAllCourses().filter(c => enrolledCourseIds.includes(c.id));
  },
  
  // --- LIVE CLASSES ---
  getActiveLiveClasses: (): LiveClass[] => {
     const all = JSON.parse(localStorage.getItem(KEYS.LIVE_CLASSES) || '[]') as LiveClass[];
     return all.filter(c => c.status === 'LIVE');
  },
  
  startLiveClass: (liveClass: LiveClass) => {
      const all = JSON.parse(localStorage.getItem(KEYS.LIVE_CLASSES) || '[]');
      localStorage.setItem(KEYS.LIVE_CLASSES, JSON.stringify([...all, liveClass]));
      window.dispatchEvent(new Event('storage-update'));
  },

  endLiveClass: (id: string) => {
      const all = JSON.parse(localStorage.getItem(KEYS.LIVE_CLASSES) || '[]');
      const updated = all.map((c: any) => c.id === id ? { ...c, status: 'ENDED' } : c);
      localStorage.setItem(KEYS.LIVE_CLASSES, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage-update'));
  },

  // --- ATTENDANCE ---
  getAttendance: (courseId?: string, studentId?: string): AttendanceRecord[] => {
      const all = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]') as AttendanceRecord[];
      return all.filter(r => 
          (!courseId || r.courseId === courseId) && 
          (!studentId || r.studentId === studentId)
      );
  },
  markAttendance: (record: AttendanceRecord) => {
      const all = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]') as AttendanceRecord[];
      // Check for existing record for the same day, student, and course
      const dateKey = new Date(record.date).toLocaleDateString();
      
      const existingIdx = all.findIndex(r => 
          r.studentId === record.studentId && 
          r.courseId === record.courseId && 
          new Date(r.date).toLocaleDateString() === dateKey
      );

      if (existingIdx >= 0) {
          all[existingIdx] = { ...all[existingIdx], ...record };
      } else {
          all.push(record);
      }
      
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(all));
      window.dispatchEvent(new Event('storage-update'));
  },
  createAttendanceSession: (session: AttendanceSession) => {
      const sessions = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE_SESSIONS) || '[]') as AttendanceSession[];
      // Remove expired sessions
      const now = Date.now();
      const valid = sessions.filter(s => s.expiresAt > now);
      
      localStorage.setItem(KEYS.ATTENDANCE_SESSIONS, JSON.stringify([...valid, session]));
      window.dispatchEvent(new Event('storage-update'));
  },
  validateAttendanceCode: (code: string, studentId: string, studentName: string): boolean => {
      const sessions = JSON.parse(localStorage.getItem(KEYS.ATTENDANCE_SESSIONS) || '[]') as AttendanceSession[];
      const session = sessions.find(s => s.code === code && s.expiresAt > Date.now());
      
      if (session) {
          storage.markAttendance({
              id: Date.now().toString(),
              studentId,
              studentName,
              courseId: session.courseId,
              courseName: session.courseName,
              date: new Date().toISOString(),
              status: 'PRESENT',
              method: 'QR'
          });
          return true;
      }
      return false;
  }
};