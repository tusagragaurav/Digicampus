
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, FeeRecord, UserRole, Notice } from '../types';
import { IndianRupee, CheckCircle, Clock, AlertCircle, Search, Plus, X, Filter, Download, GraduationCap, BookOpen, Zap, FileText, History, ExternalLink, Bell, Send, FileCog, Save, Building, Mail, BellRing, Megaphone } from 'lucide-react';

interface AccountantDashboardProps {
    currentUser: User;
    currentPage: string;
}

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ currentUser, currentPage }) => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Feedback State
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // History View State
  const [historyStudent, setHistoryStudent] = useState<{ id: string, name: string } | null>(null);
  
  // New Fee Form
  const [newFee, setNewFee] = useState({ studentId: '', title: '', amount: '', dueDate: '', type: 'TUITION', sendEmail: true });

  // Invoice Template Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
      schoolName: 'DigiCampus Institute',
      address: '42 Knowledge Avenue, Tech District, CA 90210',
      contact: 'billing@digicampus.edu • (555) 012-3456',
      taxId: 'EDU-REG-2024-X',
      footerNote: 'Thank you for your timely payment. This receipt is computer generated.'
  });

  const fetchData = () => {
    setFees(storage.getFees());
    setStudents(storage.getUsers().filter(u => u.role === UserRole.STUDENT));
    setNotices(storage.getNotices(UserRole.ACCOUNTANT));
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const handleCreateInvoice = () => {
      // 1. Basic Validation
      if (!newFee.studentId || !newFee.title || !newFee.amount || !newFee.dueDate) {
          setToastMessage('Please fill in all required fields.');
          setIsToastOpen(true);
          setTimeout(() => setIsToastOpen(false), 3000);
          return;
      }

      const student = students.find(s => s.id === newFee.studentId);
      if (!student) return;

      // 2. Amount Validation
      const amountValue = parseFloat(newFee.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
          setToastMessage('Please enter a valid positive amount.');
          setIsToastOpen(true);
          setTimeout(() => setIsToastOpen(false), 3000);
          return;
      }

      // 3. Create Record
      const fee: FeeRecord = {
          id: Date.now().toString(),
          studentId: newFee.studentId,
          studentName: student.name,
          title: newFee.title,
          amount: amountValue,
          dueDate: newFee.dueDate,
          status: 'PENDING',
          type: newFee.type as any
      };

      storage.addFee(fee);
      
      // 4. Send System Notification
      storage.sendNotification({
          targetRole: UserRole.STUDENT,
          targetUserId: newFee.studentId,
          title: `New Invoice: ${newFee.title}`,
          message: `A new fee of ₹${fee.amount.toLocaleString()} has been added to your account. Due date: ${new Date(newFee.dueDate).toLocaleDateString()}`,
          type: 'WARNING',
          sender: 'Accounts Department'
      });

      // 5. Simulate Email Notification
      if (newFee.sendEmail) {
          console.log(`[EMAIL SENT] To: ${student.email} | Subject: New Invoice ${fee.id} | Amount: ${fee.amount}`);
      }

      // 6. Reset & Close
      setIsInvoiceModalOpen(false);
      setNewFee({ studentId: '', title: '', amount: '', dueDate: '', type: 'TUITION', sendEmail: true });
      
      setToastMessage(newFee.sendEmail ? 'Invoice created & email notification sent.' : 'Invoice created successfully.');
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
  };

  const handleSendReminders = () => {
      let reminderCount = 0;
      const today = new Date();
      
      fees.forEach(fee => {
          if (fee.status === 'PAID') return;
          
          const dueDate = new Date(fee.dueDate);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          // Send if overdue or due within 3 days
          if (diffDays <= 3) {
              const student = students.find(s => s.id === fee.studentId);
              if (student) {
                  // Simulate Email Sending
                  console.log(`[EMAIL SYSTEM] Sending payment reminder to ${student.email} for fee "${fee.title}" (Due: ${fee.dueDate})`);
                  
                  // Send System Notification
                  storage.sendNotification({
                      targetRole: UserRole.STUDENT,
                      targetUserId: fee.studentId,
                      title: `Payment Reminder: ${fee.title}`,
                      message: `Reminder: Your payment of ₹${fee.amount.toLocaleString()} is ${diffDays < 0 ? 'overdue' : 'due soon'}. Please pay immediately.`,
                      type: 'ALERT',
                      sender: 'Accounts Department'
                  });
                  
                  reminderCount++;
              }
          }
      });

      if (reminderCount > 0) {
          setToastMessage(`Sent ${reminderCount} payment reminders successfully.`);
      } else {
          setToastMessage('No pending fees require reminders at this time.');
      }
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
  };

  const handleRemindOverdue = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today
      
      let count = 0;
      
      fees.forEach(fee => {
          if (fee.status === 'PAID') return;
          
          const dueDate = new Date(fee.dueDate);
          // Check if strictly past due date
          if (dueDate < today) {
               const student = students.find(s => s.id === fee.studentId);
               if (student) {
                   storage.sendNotification({
                        targetRole: UserRole.STUDENT,
                        targetUserId: fee.studentId,
                        title: `OVERDUE: ${fee.title}`,
                        message: `URGENT: Your payment of ₹${fee.amount.toLocaleString()} was due on ${new Date(fee.dueDate).toLocaleDateString()}. Please make payment immediately.`,
                        type: 'ALERT',
                        sender: 'Accounts Department'
                    });
                    console.log(`[EMAIL SYSTEM] Overdue Urgent Reminder sent to ${student.email}`);
                    count++;
               }
          }
      });

      if (count > 0) {
          setToastMessage(`Sent urgent overdue reminders to ${count} students.`);
      } else {
          setToastMessage('No overdue fees found.');
      }
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
  };

  const handleDownloadReceipt = (fee: FeeRecord) => {
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
            <div class="school-name">${invoiceSettings.schoolName}</div>
            <div class="school-details">
                ${invoiceSettings.address}<br/>
                ${invoiceSettings.contact}<br/>
                Tax/Reg ID: ${invoiceSettings.taxId}
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
                    <div class="value">${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : 'N/A'}</div>
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
            <p>${invoiceSettings.footerNote}</p>
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

      setToastMessage('Receipt generated and downloaded.');
      setIsToastOpen(true);
      setTimeout(() => setIsToastOpen(false), 3000);
  };

  const handleMarkAsPaid = (fee: FeeRecord) => {
      if (confirm(`Are you sure you want to mark "${fee.title}" as PAID? This will generate and download a receipt.`)) {
          storage.payFee(fee.id);
          
          // Fetch the updated fee to get the correct paidDate
          const updatedFee = storage.getFees().find(f => f.id === fee.id);
          if (updatedFee) {
              handleDownloadReceipt(updatedFee);
          }
          
          setToastMessage('Fee marked as PAID. Receipt downloaded.');
          setIsToastOpen(true);
          setTimeout(() => setIsToastOpen(false), 3000);
      }
  };

  // Stats Calculation
  const totalCollected = fees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = fees.filter(f => f.status === 'PENDING').reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = fees.filter(f => f.status === 'OVERDUE' || (f.status === 'PENDING' && new Date(f.dueDate) < new Date())).reduce((sum, f) => sum + f.amount, 0);

  const filteredFees = fees.filter(f => 
      f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentHistory = () => {
      if (!historyStudent) return [];
      return fees.filter(f => f.studentId === historyStudent.id).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between glass-panel p-6 rounded-3xl gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Financial Overview</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage student fees, invoices, and payments.</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <button onClick={() => setIsTemplateModalOpen(true)} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center space-x-2 shadow-sm text-sm">
                    <FileCog className="w-5 h-5 text-indigo-500" />
                    <span className="hidden md:inline">Invoice Settings</span>
                </button>
                <button onClick={handleSendReminders} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition flex items-center space-x-2 shadow-sm text-sm">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <span className="hidden md:inline">Reminders</span>
                </button>
                <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition flex items-center space-x-2 btn-3d text-sm w-full md:w-auto justify-center">
                    <Plus className="w-5 h-5" />
                    <span>Create Invoice</span>
                </button>
            </div>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border-b-4 border-emerald-500/50 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Collected</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">₹{totalCollected.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-b-4 border-yellow-500/50 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Dues</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">₹{totalPending.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-6 h-6" />
                </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-b-4 border-red-500/50 flex flex-col justify-between group relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overdue</p>
                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">₹{totalOverdue.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                </div>
                <button 
                    onClick={handleRemindOverdue}
                    className="mt-2 w-full py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200"
                >
                    <BellRing className="w-3 h-3" /> Remind All Overdue
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fee Table (Left) */}
            <div className="lg:col-span-2 glass-panel p-8 rounded-3xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white">Fee Records</h3>
                    <div className="flex w-full md:w-auto space-x-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Search by student or fee title..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-gray-200"
                            />
                        </div>
                        <button className="p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition text-gray-500">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                                <th className="pb-4 pl-2 text-xs font-bold text-gray-400 uppercase">Student</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase">Amount</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                <th className="pb-4 text-xs font-bold text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredFees.map(fee => {
                                const isLate = fee.status !== 'PAID' && new Date(fee.dueDate) < new Date();
                                return (
                                <tr key={fee.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="py-4 pl-2 font-bold text-gray-800 dark:text-white">
                                        <div className="flex flex-col">
                                            <span>{fee.studentName}</span>
                                            <span className="text-xs text-gray-500 font-normal">{fee.title}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 font-bold text-gray-900 dark:text-white">₹{fee.amount.toLocaleString()}</td>
                                    <td className="py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wide gap-1 border
                                            ${fee.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 
                                              isLate ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 
                                              'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'}`}>
                                            {fee.status === 'PENDING' && isLate ? 'OVERDUE' : fee.status}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-400 text-xs">
                                        {fee.paidDate ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownloadReceipt(fee);
                                                }}
                                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                                            >
                                                Receipt
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkAsPaid(fee);
                                                }}
                                                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {filteredFees.length === 0 && <p className="text-center text-gray-500 py-8">No records found.</p>}
                </div>
            </div>

            {/* Notice Board (Right) */}
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-panel p-6 rounded-3xl">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center">
                            <Megaphone className="w-5 h-5 mr-2 text-orange-500" /> Notice Board
                         </h3>
                     </div>
                     <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                         {notices.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No announcements.</p>}
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
                                 <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{notice.message}</p>
                                 <div className="mt-2 text-[10px] font-bold text-gray-400">By {notice.author}</div>
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
        </div>

        {/* ... (Rest of the modals remain the same) ... */}
        {/* Student History Modal */}
        {historyStudent && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl animate-fade-in flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <History className="w-5 h-5 mr-2 text-indigo-500" />
                                Payment History
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Complete fee record for <span className="font-bold text-gray-800 dark:text-white">{historyStudent.name}</span></p>
                        </div>
                        <button onClick={() => setHistoryStudent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800/30">
                        <div className="space-y-4">
                            {getStudentHistory().length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No payment history found for this student.</div>
                            ) : (
                                getStudentHistory().map(fee => (
                                    <div key={fee.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl ${
                                                fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                fee.status === 'OVERDUE' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                <IndianRupee className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{fee.title}</h4>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">{fee.type}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" /> Due: {new Date(fee.dueDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-3 sm:pt-0">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-400 uppercase">Amount</p>
                                                <p className="text-xl font-extrabold text-gray-900 dark:text-white">₹{fee.amount.toLocaleString()}</p>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 border
                                                    ${fee.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 
                                                      fee.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 
                                                      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'}`}>
                                                    {fee.status === 'PAID' ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" /> Paid {fee.paidDate && `on ${new Date(fee.paidDate).toLocaleDateString()}`}
                                                        </>
                                                    ) : fee.status === 'OVERDUE' ? (
                                                        <>
                                                            <AlertCircle className="w-4 h-4" /> Overdue
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="w-4 h-4" /> Pending
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {fee.status === 'PAID' && (
                                                    <button 
                                                        onClick={() => handleDownloadReceipt(fee)}
                                                        className="text-[10px] flex items-center text-indigo-500 dark:text-indigo-400 font-bold hover:underline"
                                                    >
                                                        <Download className="w-3 h-3 mr-1" /> Download Receipt
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Showing {getStudentHistory().length} records
                        </div>
                        <div className="flex gap-4 text-right">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Paid</p>
                                <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{getStudentHistory().filter(f => f.status === 'PAID').reduce((acc, f) => acc + f.amount, 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Total Due</p>
                                <p className="font-bold text-red-600 dark:text-red-400">₹{getStudentHistory().filter(f => f.status !== 'PAID').reduce((acc, f) => acc + f.amount, 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Create Invoice Modal */}
        {isInvoiceModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <IndianRupee className="w-5 h-5 mr-2 text-emerald-500" />
                            Create New Invoice
                        </h3>
                        <button onClick={() => setIsInvoiceModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Student</label>
                            <select 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                value={newFee.studentId}
                                onChange={(e) => setNewFee({...newFee, studentId: e.target.value})}
                            >
                                <option value="">-- Select Student --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fee Title</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                placeholder="e.g. Spring Tuition 2024"
                                value={newFee.title}
                                onChange={(e) => setNewFee({...newFee, title: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                    placeholder="0.00"
                                    value={newFee.amount}
                                    onChange={(e) => setNewFee({...newFee, amount: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                    value={newFee.dueDate}
                                    onChange={(e) => setNewFee({...newFee, dueDate: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select 
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition dark:text-white"
                                value={newFee.type}
                                onChange={(e) => setNewFee({...newFee, type: e.target.value})}
                            >
                                <option value="TUITION">Tuition</option>
                                <option value="LIBRARY">Library</option>
                                <option value="LAB">Lab Fee</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                            <button 
                                onClick={() => setNewFee({...newFee, sendEmail: !newFee.sendEmail})}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newFee.sendEmail ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}
                            >
                                {newFee.sendEmail && <CheckCircle className="w-4 h-4 text-white" />}
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center cursor-pointer" onClick={() => setNewFee({...newFee, sendEmail: !newFee.sendEmail})}>
                                <Mail className="w-4 h-4 mr-1.5" /> Send invoice via email
                            </span>
                        </div>
                        
                        <button 
                            onClick={handleCreateInvoice}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-4 btn-3d shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-5 h-5"/>
                            <span>Issue Invoice</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Invoice Template Settings Modal */}
        {isTemplateModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <FileCog className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invoice Settings</h3>
                                <p className="text-xs text-gray-500">Customize your receipt template</p>
                            </div>
                        </div>
                        <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition"><X className="w-5 h-5 dark:text-gray-400"/></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">School / Organization Name</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    value={invoiceSettings.schoolName}
                                    onChange={(e) => setInvoiceSettings({...invoiceSettings, schoolName: e.target.value})}
                                    placeholder="e.g. DigiCampus Institute"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Address Line</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                value={invoiceSettings.address}
                                onChange={(e) => setInvoiceSettings({...invoiceSettings, address: e.target.value})}
                                placeholder="Street Address, City, Zip"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Contact Info</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    value={invoiceSettings.contact}
                                    onChange={(e) => setInvoiceSettings({...invoiceSettings, contact: e.target.value})}
                                    placeholder="Phone or Email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tax ID / Reg No</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white"
                                    value={invoiceSettings.taxId}
                                    onChange={(e) => setInvoiceSettings({...invoiceSettings, taxId: e.target.value})}
                                    placeholder="Tax ID"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Footer Note</label>
                            <textarea 
                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white resize-none h-24"
                                value={invoiceSettings.footerNote}
                                onChange={(e) => setInvoiceSettings({...invoiceSettings, footerNote: e.target.value})}
                                placeholder="Thank you message..."
                            />
                        </div>
                        
                        <button 
                            onClick={() => {
                                setIsTemplateModalOpen(false);
                                setToastMessage('Invoice template settings saved.');
                                setIsToastOpen(true);
                                setTimeout(() => setIsToastOpen(false), 3000);
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 mt-2 btn-3d"
                        >
                            <Save className="w-5 h-5"/>
                            <span>Save Settings</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Toast Notification */}
        {isToastOpen && (
            <div className="fixed bottom-8 right-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-fadeIn z-50">
                <Send className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
                <div>
                    <p className="font-bold text-sm">System Notification</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{toastMessage}</p>
                </div>
            </div>
        )}
    </div>
  );
};
