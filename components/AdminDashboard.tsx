import React, { useState, useEffect } from 'react';
import { ADMIN_STATS } from '../constants';
import { storage } from '../services/storage';
import { apiService } from '../services/api';
import { User, UserRole, Notice, FeeRecord, Course } from '../types';
import { Shield, Server, Activity, Users, AlertTriangle, Plus, Trash2, X, Check, Search, Megaphone, Radio, IndianRupee, ArrowUpRight, Bell, ToggleLeft, ToggleRight, LayoutDashboard, CreditCard, BookOpen, FileText, Download, BarChart3 } from 'lucide-react';

interface AdminDashboardProps {
    currentUser: User;
    currentPage: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, currentPage }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  
  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // New User Form State
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: UserRole.STUDENT });
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // New Notice Form State
  const [newNotice, setNewNotice] = useState({ title: '', message: '', priority: 'MEDIUM', targetAudience: 'ALL' });

  // New Course Form State
  const [newCourse, setNewCourse] = useState({ title: '', code: '', description: '', instructorId: '' });

  const fetchData = async () => {
    try {
      // Load users from API (database)
      const dbUsers = await apiService.getUsers();
      setUsers(dbUsers);

      // Also load from localStorage for backward compatibility
      const localUsers = storage.getUsers();
      // Merge database users with local users if needed
      if (dbUsers.length === 0 && localUsers.length > 0) {
        // If no users in DB but exist in localStorage, migrate them
        console.log('Migrating users from localStorage to database...');
        for (const user of localUsers) {
          try {
            await apiService.createUser({
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
              firebaseUid: `migrated_${user.id}`
            });
          } catch (error) {
            console.error('Failed to migrate user:', user.email, error);
          }
        }
        // Reload after migration
        const migratedUsers = await apiService.getUsers();
        setUsers(migratedUsers);
      }
    } catch (error) {
      console.error('Failed to load users from database, falling back to localStorage:', error);
      // Fallback to localStorage if API fails
      setUsers(storage.getUsers());
    }

    setCourses(storage.getAllCourses());
    setNotices(storage.getNotices(UserRole.ADMIN)); // Admin gets ALL notices
    setFees(storage.getFees());
    setNotificationsEnabled(storage.getSettings().notificationsEnabled);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const handleToggleNotifications = () => {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      storage.updateSettings({ notificationsEnabled: newState });
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;

    try {
      // Create user in database via API
      const createdUser = await apiService.createUser({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        firebaseUid: `admin_created_${Date.now()}` // Generate a temporary Firebase UID
      });

      // Also add to localStorage for backward compatibility
      const localUser = {
        id: createdUser._id || createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        avatar: createdUser.role[0]
      };
      storage.addUser(localUser);

      // Handle course enrollments/assignments
      if (selectedCourses.length > 0) {
        if (newUser.role === UserRole.STUDENT) {
          // Enroll student in selected courses
          selectedCourses.forEach(courseId => {
            storage.enrollStudent(localUser.id, courseId);
          });
        } else if (newUser.role === UserRole.TEACHER) {
          // Update course instructor assignments
          selectedCourses.forEach(courseId => {
            const course = courses.find(c => c.id === courseId);
            if (course) {
              course.instructorId = localUser.id;
              course.instructor = localUser.name;
              localStorage.setItem('lms_courses', JSON.stringify(courses));
            }
          });
          window.dispatchEvent(new Event('storage-update'));
        }
      }

      // Refresh data to show the new user
      await fetchData();

      setIsAddUserModalOpen(false);
      setNewUser({ name: '', email: '', phone: '', role: UserRole.STUDENT });
      setSelectedCourses([]);

      alert('User created successfully and saved to database!');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please check the console for details.');
    }
  };

  const handleAddCourse = () => {
      if (!newCourse.title || !newCourse.code || !newCourse.instructorId) return;

      const instructor = users.find(u => u.id === newCourse.instructorId);
      
      const course: Course = {
          id: Date.now().toString(),
          title: newCourse.title,
          code: newCourse.code,
          description: newCourse.description,
          instructor: instructor?.name || 'Unknown',
          instructorId: newCourse.instructorId,
          progress: 0,
          students: 0,
          nextClass: 'TBA',
          color: 'bg-indigo-500', // Default color
          syllabus: [],
          prerequisites: []
      };

      storage.addCourse(course);
      setIsAddCourseModalOpen(false);
      setNewCourse({ title: '', code: '', description: '', instructorId: '' });
  };

  const handleDeleteCourse = (id: string) => {
      if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
          storage.deleteCourse(id);
      }
  };

  const handlePostNotice = () => {
      if (!newNotice.title || !newNotice.message) return;

      const notice: Notice = {
          id: Date.now().toString(),
          title: newNotice.title,
          message: newNotice.message,
          priority: newNotice.priority as 'HIGH' | 'MEDIUM' | 'LOW',
          targetAudience: newNotice.targetAudience as 'ALL' | 'STUDENT' | 'TEACHER',
          author: 'Admin System',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })
      };

      // Log the notice creation (frontend logging)
      console.log(`Notice posted: ${newNotice.title} for ${newNotice.targetAudience}`);

      storage.addNotice(notice);
      
      // Dispatch Push Notification
      storage.sendNotification({
          targetRole: newNotice.targetAudience as any,
          title: `New Announcement: ${newNotice.title}`,
          message: newNotice.message,
          type: newNotice.priority === 'HIGH' ? 'ALERT' : 'INFO',
          sender: 'Admin System'
      });

      setIsNoticeModalOpen(false);
      setNewNotice({ title: '', message: '', priority: 'MEDIUM', targetAudience: 'ALL' });
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user? This will permanently remove them from the database.')) {
        try {
            await apiService.deleteUser(id);
            storage.deleteUser(id);
            // Refresh data to reflect the deletion
            await fetchData();
            alert('User deleted successfully from database!');
        } catch (error) {
            console.error('Failed to delete user from database:', error);
            alert('Failed to delete user from database. Please try again.');
        }
    }
  };

  const exportData = (type: 'STUDENTS' | 'COURSES' | 'FEES') => {
      let data: any[] = [];
      let filename = '';

      if (type === 'STUDENTS') {
          data = users.filter(u => u.role === UserRole.STUDENT).map(u => ({
              ID: u.id, Name: u.name, Email: u.email, Phone: u.phone, Batch: u.batch
          }));
          filename = 'students_list.csv';
      } else if (type === 'COURSES') {
          data = courses.map(c => ({
              ID: c.id, Code: c.code, Title: c.title, Instructor: c.instructor, Students: c.students
          }));
          filename = 'courses_list.csv';
      } else if (type === 'FEES') {
          data = fees.map(f => ({
              ID: f.id, Student: f.studentName, Title: f.title, Amount: f.amount, Status: f.status, PaidDate: f.paidDate
          }));
          filename = 'financial_report.csv';
      }

      if (data.length === 0) {
          alert('No data to export.');
          return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
      const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Financial Stats for Admin
  const recentPayments = fees.filter(f => f.status === 'PAID').sort((a, b) => new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime()).slice(0, 3);
  const totalRevenue = fees.filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0);

  // VIEW: USERS MANAGEMENT
  if (currentPage === 'users') {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                          <Users className="w-6 h-6 mr-2 text-indigo-500" /> User Management
                      </h3>
                      <p className="text-sm text-gray-500">Manage student, teacher and staff accounts</p>
                  </div>
                  <button 
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center space-x-2 btn-3d shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Add User</span>
                    </button>
              </div>

              <div className="glass-panel p-5 md:p-8 rounded-3xl">
                  <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-gray-200"
                        />
                  </div>
                  <div className="space-y-3">
                      {filteredUsers.length === 0 && <p className="text-center text-gray-500 py-4">No users found.</p>}
                      {filteredUsers.map(user => (
                          <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md rounded-2xl transition group gap-4">
                              <div className="flex items-center space-x-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors shrink-0
                                    ${user.role === UserRole.ADMIN ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : user.role === UserRole.TEACHER ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : user.role === UserRole.ACCOUNTANT ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                    {user.avatar}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                                      {user.phone && <p className="text-[10px] text-gray-400 dark:text-gray-500">{user.phone}</p>}
                                  </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto">
                                 <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wide
                                    ${user.role === UserRole.ADMIN ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' : user.role === UserRole.TEACHER ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300' : user.role === UserRole.ACCOUNTANT ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'}`}>
                                    {user.role}
                                 </span>
                                 <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              
              {/* Add User Modal */}
              {isAddUserModalOpen && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New User</h3>
                              <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                          </div>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    placeholder="e.g. John Doe"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                  <input 
                                    type="email" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    placeholder="e.g. john@university.edu"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                  <input 
                                    type="tel" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    placeholder="e.g. +1 555-0199"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                                  />
                              </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                          <select
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                            value={newUser.role}
                            onChange={(e) => {
                              setNewUser({...newUser, role: e.target.value as UserRole});
                              setSelectedCourses([]); // Reset course selection when role changes
                            }}
                          >
                              <option value={UserRole.STUDENT}>Student</option>
                              <option value={UserRole.TEACHER}>Teacher</option>
                              <option value={UserRole.ADMIN}>Admin</option>
                              <option value={UserRole.ACCOUNTANT}>Accountant</option>
                          </select>
                      </div>

                      {(newUser.role === UserRole.STUDENT || newUser.role === UserRole.TEACHER) && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                            {newUser.role === UserRole.STUDENT ? 'Enroll in Courses' : 'Assign Courses to Teach'}
                          </label>
                          <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 p-2">
                            {courses.map(course => (
                              <label key={course.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(course.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCourses([...selectedCourses, course.id]);
                                    } else {
                                      setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-900 dark:text-white font-medium">
                                  {course.code} - {course.title}
                                </span>
                              </label>
                            ))}
                          </div>
                          {courses.length === 0 && (
                            <p className="text-sm text-gray-500 italic p-2">No courses available. Create courses first.</p>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleAddUser}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-4 btn-3d"
                      >
                          <Check className="w-5 h-5"/>
                          <span>Create User</span>
                      </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // VIEW: COURSES MANAGEMENT
  if (currentPage === 'courses') {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                          <BookOpen className="w-6 h-6 mr-2 text-indigo-500" /> Course Management
                      </h3>
                      <p className="text-sm text-gray-500">Create courses and assign teachers</p>
                  </div>
                  <button 
                        onClick={() => setIsAddCourseModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center space-x-2 btn-3d shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Create Course</span>
                    </button>
              </div>

              <div className="glass-panel p-5 md:p-8 rounded-3xl">
                  <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Search courses..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-gray-200"
                        />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredCourses.length === 0 && <p className="col-span-full text-center text-gray-500 py-4">No courses found.</p>}
                      {filteredCourses.map(course => (
                          <div key={course.id} className="p-5 bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md rounded-2xl transition group flex flex-col justify-between">
                              <div>
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{course.code}</span>
                                      <button onClick={() => handleDeleteCourse(course.id)} className="text-gray-400 hover:text-red-500 transition">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{course.title}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{course.description || 'No description'}</p>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                                      <Users className="w-3 h-3 mr-1" />
                                      {course.students} Enrolled
                                  </div>
                                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                      Instr: {course.instructor}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Add Course Modal */}
              {isAddCourseModalOpen && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Course</h3>
                              <button onClick={() => setIsAddCourseModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                          </div>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Course Title</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    placeholder="e.g. Advanced Calculus"
                                    value={newCourse.title}
                                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Course Code</label>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    placeholder="e.g. MAT-202"
                                    value={newCourse.code}
                                    onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Assign Teacher</label>
                                  <select 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    value={newCourse.instructorId}
                                    onChange={(e) => setNewCourse({...newCourse, instructorId: e.target.value})}
                                  >
                                      <option value="">-- Select Instructor --</option>
                                      {users.filter(u => u.role === UserRole.TEACHER).map(t => (
                                          <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                  <textarea 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white h-24 resize-none"
                                    placeholder="Brief course overview..."
                                    value={newCourse.description}
                                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                                  />
                              </div>
                              <button 
                                onClick={handleAddCourse}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-4 btn-3d"
                              >
                                  <Plus className="w-5 h-5"/>
                                  <span>Add Course</span>
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // VIEW: REPORTS
  if (currentPage === 'reports') {
      return (
          <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                          <BarChart3 className="w-6 h-6 mr-2 text-indigo-500" /> System Reports
                      </h3>
                      <p className="text-sm text-gray-500">View analytics and export data</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><Users className="w-6 h-6"/></div>
                      <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Total Students</p>
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.role === UserRole.STUDENT).length}</h4>
                      </div>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400"><BookOpen className="w-6 h-6"/></div>
                      <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Total Courses</p>
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</h4>
                      </div>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400"><Users className="w-6 h-6"/></div>
                      <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Total Teachers</p>
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.role === UserRole.TEACHER).length}</h4>
                      </div>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400"><IndianRupee className="w-6 h-6"/></div>
                      <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Total Revenue</p>
                          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString()}</h4>
                      </div>
                  </div>
              </div>

              <div className="glass-panel p-8 rounded-3xl">
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Data Exports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center text-center bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition">
                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                              <Users className="w-6 h-6" />
                          </div>
                          <h5 className="font-bold text-gray-900 dark:text-white mb-1">Student Data</h5>
                          <p className="text-xs text-gray-500 mb-4">Export list of all students with contact info.</p>
                          <button onClick={() => exportData('STUDENTS')} className="w-full py-2 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center justify-center gap-2">
                              <Download className="w-4 h-4"/> Export CSV
                          </button>
                      </div>

                      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center text-center bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition">
                          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                              <BookOpen className="w-6 h-6" />
                          </div>
                          <h5 className="font-bold text-gray-900 dark:text-white mb-1">Course Data</h5>
                          <p className="text-xs text-gray-500 mb-4">Export course details and enrollment stats.</p>
                          <button onClick={() => exportData('COURSES')} className="w-full py-2 border border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition flex items-center justify-center gap-2">
                              <Download className="w-4 h-4"/> Export CSV
                          </button>
                      </div>

                      <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center text-center bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition">
                          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                              <IndianRupee className="w-6 h-6" />
                          </div>
                          <h5 className="font-bold text-gray-900 dark:text-white mb-1">Financial Data</h5>
                          <p className="text-xs text-gray-500 mb-4">Export all fee records and payment status.</p>
                          <button onClick={() => exportData('FEES')} className="w-full py-2 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition flex items-center justify-center gap-2">
                              <Download className="w-4 h-4"/> Export CSV
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // DEFAULT VIEW (DASHBOARD)
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-5 md:p-6 rounded-3xl gap-4">
         <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">System Administration</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm">Manage users, permissions, and system health.</p>
         </div>
         <div className="flex space-x-3">
             <button onClick={() => setIsNoticeModalOpen(true)} className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 transition flex items-center justify-center space-x-2 btn-3d">
                 <Megaphone className="w-5 h-5" />
                 <span>Broadcast</span>
             </button>
         </div>
      </div>

       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {ADMIN_STATS.map((stat, idx) => (
          <div key={idx} className="glass-panel p-5 md:p-6 rounded-3xl relative overflow-hidden group hover:shadow-xl transition-all duration-300">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                <Activity className="w-16 h-16 md:w-20 md:h-20 dark:text-white" />
             </div>
             <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">{stat.label}</p>
             <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</h3>
             <p className={`text-[10px] md:text-xs mt-2 font-bold px-2 py-1 inline-block rounded-lg ${stat.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                 {stat.change} <span className="text-gray-500 dark:text-gray-400 font-medium ml-1">vs last month</span>
             </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management Quick View */}
          <div className="lg:col-span-2 glass-panel p-5 md:p-8 rounded-3xl">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white">Recent Users</h3>
                <div className="flex w-full md:w-auto space-x-3">
                    <button 
                        onClick={() => setIsAddUserModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition flex items-center space-x-2 btn-3d shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Add User</span>
                    </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredUsers.slice(0, 5).map(user => (
                      <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md rounded-2xl transition group gap-4">
                          <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors shrink-0
                                ${user.role === UserRole.ADMIN ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : user.role === UserRole.TEACHER ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : user.role === UserRole.ACCOUNTANT ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {user.avatar}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                              </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto">
                             <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wide
                                ${user.role === UserRole.ADMIN ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' : user.role === UserRole.TEACHER ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300' : user.role === UserRole.ACCOUNTANT ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300'}`}>
                                {user.role}
                             </span>
                             <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition">
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* System Settings & Logs */}
           <div className="space-y-6">
                
                {/* Control Panel */}
                <div className="glass-panel p-6 rounded-3xl h-fit border-t-4 border-indigo-500">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-indigo-500"/>
                            Controls
                         </h3>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white">Push Notifications</p>
                                <p className="text-xs text-gray-500">System-wide alerts</p>
                            </div>
                        </div>
                        <button onClick={handleToggleNotifications} className={`text-2xl transition-colors ${notificationsEnabled ? 'text-green-500' : 'text-gray-400'}`}>
                            {notificationsEnabled ? <ToggleRight className="w-10 h-10"/> : <ToggleLeft className="w-10 h-10"/>}
                        </button>
                    </div>
                </div>

                {/* Notice Board */}
                <div className="glass-panel p-6 rounded-3xl h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center">
                            <Megaphone className="w-5 h-5 mr-2 text-orange-500" />
                            Active Notices
                        </h3>
                    </div>
                     <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                         {notices.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No active announcements.</p>}
                         {notices.map(notice => (
                             <div key={notice.id} className={`p-4 rounded-xl border ${
                                 notice.priority === 'HIGH' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 
                                 notice.priority === 'MEDIUM' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' : 
                                 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                             }`}>
                                 <div className="flex justify-between items-start mb-1">
                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                         notice.priority === 'HIGH' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 
                                         notice.priority === 'MEDIUM' ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' : 
                                         'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
                                     }`}>{notice.priority}</span>
                                     <span className="text-[10px] text-gray-400">{notice.date}</span>
                                 </div>
                                 <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{notice.title}</h4>
                                 <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{notice.message}</p>
                             </div>
                         ))}
                     </div>
                </div>

                {/* Financial Summary */}
                <div className="glass-panel p-6 rounded-3xl h-fit border-t-4 border-emerald-500">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center">
                            <IndianRupee className="w-5 h-5 mr-2 text-emerald-500"/>
                            Finance Check
                         </h3>
                    </div>
                    <div className="mb-4">
                        <p className="text-xs text-gray-400 font-bold uppercase">Revenue YTD</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-2">Recent Transactions</p>
                        <div className="space-y-2">
                            {recentPayments.length === 0 ? <p className="text-sm text-gray-400">No recent payments.</p> : recentPayments.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{p.studentName}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">+₹{p.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
           </div>
      </div>

       {/* Add User Modal */}
       {isAddUserModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New User</h3>
                      <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                            placeholder="e.g. John Doe"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                          <input 
                            type="email" 
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                            placeholder="e.g. john@university.edu"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                          <input 
                            type="tel" 
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                            placeholder="e.g. +1 555-0199"
                            value={newUser.phone}
                            onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                          <select
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                            value={newUser.role}
                            onChange={(e) => {
                              setNewUser({...newUser, role: e.target.value as UserRole});
                              setSelectedCourses([]); // Reset course selection when role changes
                            }}
                          >
                              <option value={UserRole.STUDENT}>Student</option>
                              <option value={UserRole.TEACHER}>Teacher</option>
                              <option value={UserRole.ADMIN}>Admin</option>
                              <option value={UserRole.ACCOUNTANT}>Accountant</option>
                          </select>
                      </div>

                      {(newUser.role === UserRole.STUDENT || newUser.role === UserRole.TEACHER) && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                            {newUser.role === UserRole.STUDENT ? 'Enroll in Courses' : 'Assign Courses to Teach'}
                          </label>
                          <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 p-2">
                            {courses.map(course => (
                              <label key={course.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(course.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCourses([...selectedCourses, course.id]);
                                    } else {
                                      setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-900 dark:text-white font-medium">
                                  {course.code} - {course.title}
                                </span>
                              </label>
                            ))}
                          </div>
                          {courses.length === 0 && (
                            <p className="text-sm text-gray-500 italic p-2">No courses available. Create courses first.</p>
                          )}
                        </div>
                      )}
                      <button 
                        onClick={handleAddUser}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-4 btn-3d"
                      >
                          <Check className="w-5 h-5"/>
                          <span>Create User</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Broadcast Notice Modal */}
      {isNoticeModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                          <Radio className="w-5 h-5 mr-2 text-orange-500" />
                          Broadcast System
                      </h3>
                      <button onClick={() => setIsNoticeModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Notice Title</label>
                          <input 
                            type="text" 
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                            placeholder="e.g. Emergency Maintenance"
                            value={newNotice.title}
                            onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                          <textarea 
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white resize-none h-32"
                            placeholder="Enter the full details of the announcement..."
                            value={newNotice.message}
                            onChange={(e) => setNewNotice({...newNotice, message: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                value={newNotice.priority}
                                onChange={(e) => setNewNotice({...newNotice, priority: e.target.value})}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High (Popup Alert)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                            <select 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-orange-500 outline-none transition dark:text-white"
                                value={newNotice.targetAudience}
                                onChange={(e) => setNewNotice({...newNotice, targetAudience: e.target.value})}
                            >
                                <option value="ALL">Everyone</option>
                                <option value="STUDENT">Students Only</option>
                                <option value="TEACHER">Teachers Only</option>
                            </select>
                          </div>
                      </div>
                      <button 
                        onClick={handlePostNotice}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-4 btn-3d"
                      >
                          <Megaphone className="w-5 h-5"/>
                          <span>Broadcast Now</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};