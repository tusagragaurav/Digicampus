
import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { storage } from '../services/storage';
import { ChatMessage, UserRole, User } from '../types';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const AISidebar: React.FC<AISidebarProps> = ({ isOpen, onClose, currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Hi! I am your AI Study Assistant. I can help with your course materials, check your schedule, or answer questions about your notes. What do you need?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateContext = () => {
    const courses = storage.getEnrolledCourses(currentUser.id);
    const notices = storage.getNotices(UserRole.STUDENT);
    const notes = storage.getNotes();
    
    // Get Schedule Data
    const enrolledCourseIds = courses.map(c => c.id);
    const sessions = storage.getSessions().filter(s => enrolledCourseIds.includes(s.courseId));
    const events = storage.getEvents();
    const assignments = storage.getAssignments().filter(a => enrolledCourseIds.includes(a.courseId));
    
    const courseList = courses.map(c => `${c.title} (${c.code}) - Instructor: ${c.instructor}`).join(', ');
    const noticeList = notices.map(n => `[${n.priority}] ${n.title}: ${n.message} (Date: ${n.date})`).join('\n');
    
    // Format Schedule for AI
    const scheduleList = sessions.length > 0 
        ? sessions.map(s => `Class: ${s.topic} (${s.courseName}) on ${s.date} at ${s.time} in ${s.room}`).join('\n')
        : "No upcoming classes scheduled.";
        
    const eventList = events.length > 0
        ? events.map(e => `Event: ${e.title} (${e.type}) on ${e.date}. ${e.description || ''}`).join('\n')
        : "No calendar events.";

    const assignmentList = assignments.length > 0
        ? assignments.map(a => `Assignment: ${a.title} for ${a.courseName} due ${a.dueDate}. ${a.description}`).join('\n')
        : "No pending assignments.";

    // Include user notes content for study assistance
    const studyMaterials = notes.map(n => `
      Document Title: ${n.title}
      Course: ${n.course}
      Content Summary: ${n.summary || n.content || 'No text content available'}
    `).join('\n---\n');

    return `
      You are an intelligent AI Study Assistant for a student named ${currentUser.name}.
      
      Current Context:
      - Enrolled Courses: ${courseList}.
      
      SCHEDULE & CLASSES:
      ${scheduleList}
      
      CALENDAR EVENTS & EXAMS:
      ${eventList}
      
      PENDING ASSIGNMENTS:
      ${assignmentList}
      
      RECENT NOTICES:
      ${noticeList}
      
      UPLOADED STUDY MATERIALS & NOTES:
      ${studyMaterials}
      
      Instructions: 
      1. You are here to help the student learn. Answer questions about their courses, schedule, and specifically their uploaded study materials.
      2. If the user asks about a topic found in the "UPLOADED STUDY MATERIALS", use the provided summary/content to explain it.
      3. If asked "What do I have today?" or "What's my schedule?", refer to the SCHEDULE, EVENTS, and ASSIGNMENTS sections.
      4. Be encouraging, concise, and academic in tone.
    `;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

      // Generate fresh context every time in case data changed
      const context = generateContext();

      const responseText = await geminiService.chat(input, history, context);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "I'm having trouble connecting right now. Please check your internet connection or try again later.",
          timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" onClick={onClose}></div>
      
      {/* Sidebar Panel */}
      <div className={`
        fixed z-[60] glass-card dark:bg-slate-900/90 flex flex-col shadow-2xl animate-fade-in overflow-hidden
        inset-0 rounded-none border-0
        md:inset-y-4 md:right-4 md:left-auto md:w-[450px] md:rounded-3xl md:border border-white/60 dark:border-white/10
      `}>
        {/* Header */}
        <div className="p-5 bg-white/40 dark:bg-slate-800/60 backdrop-blur-md border-b border-white/50 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
                <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="font-extrabold text-lg text-gray-800 dark:text-white">AI Study Buddy</h2>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                    Gemini Live
                </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 dark:hover:bg-slate-700 rounded-full transition text-gray-600 dark:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white/30 dark:bg-slate-900/30" ref={scrollRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-sm backdrop-blur-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-white/60 dark:border-gray-700 rounded-tl-none shadow-gray-200/50 dark:shadow-none'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="flex items-center space-x-1 mb-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini 2.5</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/80 dark:bg-slate-800/80 border border-white dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-2 backdrop-blur-md">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white/60 dark:bg-slate-800/80 backdrop-blur-md border-t border-white/50 dark:border-gray-700 safe-area-bottom">
          <div className="flex space-x-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your notes or schedule..."
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-inner text-sm font-medium dark:text-white dark:placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/30 btn-3d"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
