
import { Course, Note, StatCard, TestResult, UserRole, Notice, CalendarEvent, ExamSession } from './types';

export const MOCK_COURSES: Course[] = [
  { 
    id: '1', 
    title: 'Advanced Computer Vision', 
    code: 'CS-401', 
    instructor: 'Dr. Smith', 
    progress: 75, 
    students: 42, 
    nextClass: '10:00 AM Today', 
    color: 'bg-blue-500',
    description: 'A comprehensive study of advanced computer vision techniques, focusing on deep learning architectures, object detection systems, and real-time image processing applications.',
    syllabus: ['Convolutional Neural Networks', 'Object Detection (YOLO, R-CNN)', 'Semantic & Instance Segmentation', 'Generative Adversarial Networks (GANs)', '3D Computer Vision'],
    instructorBio: 'Dr. Smith is a pioneer in computer vision with over 20 years of academic and industry experience. He leads the University AI Research Lab and has published over 50 papers in top-tier conferences.',
    prerequisites: ['Linear Algebra', 'Probability Theory', 'Python Proficiency']
  },
  { 
    id: '2', 
    title: 'Data Structures & Algo', 
    code: 'CS-202', 
    instructor: 'Prof. Johnson', 
    progress: 45, 
    students: 120, 
    nextClass: '2:00 PM Tomorrow', 
    color: 'bg-emerald-500',
    description: 'Fundamental concepts of data structures and algorithms, emphasizing efficiency, complexity analysis, and practical implementation in modern software development.',
    syllabus: ['Arrays, Linked Lists, Stacks, Queues', 'Trees and Graphs', 'Hashing and Heaps', 'Sorting and Searching Algorithms', 'Dynamic Programming'],
    instructorBio: 'Prof. Johnson is passionate about algorithmic efficiency and competitive programming. He coaches the university ICPC team and is the author of "Algorithms Unleashed".',
    prerequisites: ['Intro to Programming (CS-101)', 'Discrete Mathematics']
  },
  { 
    id: '3', 
    title: 'Artificial Intelligence', 
    code: 'CS-350', 
    instructor: 'Dr. Lee', 
    progress: 90, 
    students: 35, 
    nextClass: '11:30 AM Today', 
    color: 'bg-purple-500',
    description: 'Exploration of AI principles including search strategies, knowledge representation, logic, probabilistic reasoning, and an introduction to machine learning paradigms.',
    syllabus: ['Search Algorithms (A*, Minimax)', 'Knowledge Representation', 'Probabilistic Reasoning', 'Reinforcement Learning', 'Ethics in AI'],
    instructorBio: 'Dr. Lee specializes in cognitive systems and ethical AI. Her research focuses on human-AI interaction and ensuring fairness in machine learning models.',
    prerequisites: ['Data Structures', 'Statistics']
  },
  { 
    id: '4', 
    title: 'Web Systems Arch', 
    code: 'CS-310', 
    instructor: 'Prof. Davis', 
    progress: 30, 
    students: 60, 
    nextClass: '09:00 AM Wed', 
    color: 'bg-orange-500',
    description: 'Design and implementation of scalable web systems, covering client-server architecture, RESTful APIs, microservices, and modern frontend frameworks.',
    syllabus: ['HTTP & Web Protocols', 'REST & GraphQL APIs', 'Microservices Architecture', 'Containerization (Docker)', 'Cloud Deployment Strategies'],
    instructorBio: 'Prof. Davis brings 15 years of Silicon Valley experience building scalable distributed systems for major tech companies before joining academia.',
    prerequisites: ['Operating Systems', 'Computer Networks']
  },
];

export const MOCK_NOTES: Note[] = [
  { id: '1', title: 'Neural Networks Basics', course: 'Artificial Intelligence', date: '2023-10-25', type: 'PDF' },
  { id: '2', title: 'React Hooks Patterns', course: 'Web Systems Arch', date: '2023-10-24', type: 'DOCX' },
  { id: '3', title: 'Binary Trees Lecture', course: 'Data Structures & Algo', date: '2023-10-22', type: 'PDF' },
];

export const MOCK_RESULTS: TestResult[] = [
  { id: '1', subject: 'Artificial Intelligence', score: 92, total: 100, date: 'Oct 20' },
  { id: '2', subject: 'Data Structures', score: 78, total: 100, date: 'Oct 15' },
  { id: '3', subject: 'Web Architecture', score: 85, total: 100, date: 'Oct 10' },
];

export const STUDENT_STATS: StatCard[] = [
  { label: 'Overall GPA', value: '3.8', change: '+0.2', trend: 'up', icon: 'Award' },
  { label: 'Attendance', value: '92%', change: '-1.5%', trend: 'down', icon: 'Clock' },
  { label: 'Assignments', value: '12/15', change: 'On Track', trend: 'neutral', icon: 'FileText' },
  { label: 'Total Credits', value: '85', change: '+15', trend: 'up', icon: 'BookOpen' },
];

export const TEACHER_STATS: StatCard[] = [
  { label: 'Total Students', value: '257', change: '+12', trend: 'up', icon: 'Users' },
  { label: 'Avg Attendance', value: '88%', change: '+2.4%', trend: 'up', icon: 'Clock' },
  { label: 'Pending Reviews', value: '45', change: '-5', trend: 'down', icon: 'FileCheck' },
  { label: 'Class Performance', value: 'B+', change: 'Stable', trend: 'neutral', icon: 'TrendingUp' },
];

export const ADMIN_STATS: StatCard[] = [
  { label: 'Active Users', value: '2,405', change: '+120', trend: 'up', icon: 'Users' },
  { label: 'System Health', value: '99.9%', change: 'Normal', trend: 'neutral', icon: 'Activity' },
  { label: 'AI API Usage', value: '45k', change: '+15%', trend: 'up', icon: 'Cpu' },
  { label: 'Total Revenue', value: '₹124k', change: '+8%', trend: 'up', icon: 'IndianRupee' },
];

export const CHART_DATA_PERFORMANCE = [
  { name: 'Mon', score: 65, attendance: 90 },
  { name: 'Tue', score: 75, attendance: 85 },
  { name: 'Wed', score: 82, attendance: 92 },
  { name: 'Thu', score: 78, attendance: 88 },
  { name: 'Fri', score: 88, attendance: 95 },
  { name: 'Sat', score: 95, attendance: 80 },
  { name: 'Sun', score: 85, attendance: 85 },
];

export const MOCK_NOTICES: Notice[] = [
    { id: '1', title: 'System Maintenance', message: 'The LMS will be down for maintenance on Saturday from 2 AM to 4 AM.', date: 'Today, 9:00 AM', priority: 'MEDIUM', author: 'IT Support', targetAudience: 'ALL' },
    { id: '2', title: 'Campus Hackathon 2024', message: 'Registration for the annual hackathon closes this Friday. Win prizes up to $5000!', date: 'Yesterday', priority: 'LOW', author: 'Student Council', targetAudience: 'STUDENT' },
    { id: '3', title: 'Mid-Term Schedule', message: 'The final schedule for Mid-Term examinations has been released. Check your portal.', date: 'Oct 25', priority: 'HIGH', author: 'Dean of Sciences', targetAudience: 'ALL' },
    { id: '4', title: 'Faculty Meeting', message: 'Monthly faculty meeting regarding curriculum updates.', date: 'Oct 28', priority: 'MEDIUM', author: 'Principal', targetAudience: 'TEACHER' }
];

export const MOCK_EVENTS: CalendarEvent[] = [
    { id: '1', title: 'CS-401 Midterm', date: '2023-11-15', type: 'EXAM', description: 'Written exam in Hall B' },
    { id: '2', title: 'Project Submission', date: '2023-11-20', type: 'DEADLINE', description: 'Final Year Project Phase 1' },
    { id: '3', title: 'Thanksgiving Break', date: '2023-11-23', type: 'HOLIDAY', description: 'Campus Closed' },
    { id: '4', title: 'AI Guest Lecture', date: '2023-11-10', type: 'EVENT', description: 'Dr. Hinton speaking at Auditorium' }
];

export const MOCK_EXAMS: ExamSession[] = [
    { 
        id: '1', 
        subject: 'Advanced Computer Vision Final', 
        code: 'CS-401', 
        date: '2023-12-15', 
        time: '10:00 AM', 
        duration: 120, 
        venue: 'Hall B', 
        status: 'OPEN', 
        fee: 500 
    },
    { 
        id: '2', 
        subject: 'AI Ethics Quiz', 
        code: 'CS-350', 
        date: '2023-11-20', 
        time: '09:00 AM', 
        duration: 45, 
        venue: 'Online', 
        status: 'ENROLLED', 
        fee: 0,
        questions: [
            { id: 'q1', text: 'What is a primary ethical concern in AI?', type: 'MCQ', options: ['Speed', 'Bias', 'Cost', 'Size'], marks: 10 },
            { id: 'q2', text: 'Explain the concept of Explainable AI (XAI).', type: 'TEXT', marks: 20 },
            { id: 'q3', text: 'Which law deals with data privacy in Europe?', type: 'MCQ', options: ['HIPAA', 'GDPR', 'FERPA', 'COPPA'], marks: 10 }
        ]
    },
    { 
        id: '3', 
        subject: 'Web Architecture Midterm', 
        code: 'CS-310', 
        date: '2023-11-25', 
        time: '02:00 PM', 
        duration: 90, 
        venue: 'Online', 
        status: 'OPEN', 
        fee: 0,
        questions: [
             { id: 'q1', text: 'Which status code indicates a successful request?', type: 'MCQ', options: ['200', '404', '500', '301'], marks: 5 },
             { id: 'q2', text: 'Define RESTful API.', type: 'TEXT', marks: 15 }
        ]
    },
    { 
        id: '4', 
        subject: 'Data Structures Lab Exam', 
        code: 'CS-202', 
        date: '2023-12-05', 
        time: '11:00 AM', 
        duration: 180, 
        venue: 'Lab 1', 
        status: 'CLOSED', 
        fee: 200 
    }
];
