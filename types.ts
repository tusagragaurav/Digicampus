export enum UserRole {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin',
  ACCOUNTANT = 'Accountant',
}

export interface User {
  id: string;
  _id?: string; // MongoDB ObjectId
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  // Profile specific fields
  batch?: string;
  section?: string;
  subjects?: string[];
  department?: string;
  rollNumber?: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  instructor: string;
  instructorId?: string;
  progress: number;
  students: number;
  nextClass: string;
  color: string;
  description?: string;
  syllabus?: string[];
  instructorBio?: string;
  prerequisites?: string[];
}

export interface Note {
  id: string;
  title: string;
  course: string;
  date: string;
  type: 'PDF' | 'DOCX' | 'AI-GEN';
  content?: string;
  summary?: string;
}

export interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface TestResult {
  id: string;
  subject: string;
  score: number;
  total: number;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  targetAudience: 'ALL' | 'STUDENT' | 'TEACHER';
  author: string;
  date: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'EXAM' | 'DEADLINE' | 'HOLIDAY' | 'EVENT';
  description?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'TEXT';
  options?: string[];
  marks: number;
  correctAnswer?: number; // Index of the correct option for MCQs
}

export interface ExamSession {
  id: string;
  subject: string;
  code: string;
  date: string;
  time: string;
  duration: number;
  venue: string;
  status: 'OPEN' | 'ENROLLED' | 'CLOSED';
  fee: number;
  questions?: Question[];
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>;
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED';
  score?: number;
  feedback?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  fileUrl: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED';
  grade?: string;
  feedback?: string;
  fileData?: string;
  fileType?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  type: 'TUITION' | 'LIBRARY' | 'LAB' | 'OTHER';
  paidDate?: string;
}

export interface ClassSession {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
  time: string;
  duration: string;
  topic: string;
  room: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface TeacherMessage {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId?: string;
  assignmentTitle?: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  reply?: string;
  replyTimestamp?: string;
}

export interface LiveClass {
  id: string;
  courseId: string;
  courseName: string;
  topic: string;
  instructorName: string;
  startTime: string;
  viewers: number;
  status: 'LIVE' | 'ENDED';
}

export interface AppNotification {
  id: string;
  targetRole: UserRole | 'ALL';
  targetUserId?: string; 
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  timestamp: string;
  isRead: boolean;
  sender: string;
}

export interface SystemSettings {
  notificationsEnabled: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  date: string; // ISO Date String
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  method: 'MANUAL' | 'AUTO' | 'QR';
}

export interface AttendanceSession {
  code: string;
  courseId: string;
  courseName: string;
  expiresAt: number; // Timestamp
}