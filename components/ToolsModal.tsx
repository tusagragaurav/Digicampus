
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { storage } from '../services/storage';
import { Note } from '../types';
import { X, FileText, Calendar, HelpCircle, Loader2, Copy, Check, Save, UploadCloud, File as FileIcon, Trash, Sparkles, AlertCircle } from 'lucide-react';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ToolType = 'SUMMARIZE' | 'DATES' | 'QUIZ';

export const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('SUMMARIZE');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for external open requests to switch tools
  useEffect(() => {
    const handleOpenTool = (e: any) => {
        if (e.detail?.tool) {
            setActiveTool(e.detail.tool);
            // Reset state when opening fresh
            setResult(null);
            setInputText('');
            setSelectedFile(null);
        }
    };
    window.addEventListener('open-tools-modal', handleOpenTool);
    return () => window.removeEventListener('open-tools-modal', handleOpenTool);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
          setInputText(''); // Clear text if file selected
      }
  };

  const clearFile = () => {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!inputText.trim() && !selectedFile) return;
    setIsProcessing(true);
    setResult(null);
    setSaved(false);

    try {
      const content = selectedFile || inputText;
      let output = '';

      if (activeTool === 'SUMMARIZE') {
        output = await geminiService.summarizeContent(content);
      } else if (activeTool === 'DATES') {
        output = await geminiService.extractDates(content);
      } else if (activeTool === 'QUIZ') {
        output = await geminiService.generateQuiz(content);
      }
      setResult(output);
    } catch (e) {
      console.error(e);
      setResult('An error occurred during processing. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    
    const titleBase = selectedFile ? selectedFile.name : 'Text Content';
    
    const newNote: Note = {
        id: Date.now().toString(),
        title: activeTool === 'SUMMARIZE' ? `Summary: ${titleBase}` : activeTool === 'QUIZ' ? `Quiz: ${titleBase}` : `Dates: ${titleBase}`,
        course: 'General', 
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: selectedFile ? (selectedFile.name.endsWith('.pdf') ? 'PDF' : 'DOCX') : 'AI-GEN',
        content: selectedFile ? `File: ${selectedFile.name}` : inputText,
        summary: result
    };
    
    storage.addNote(newNote);
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
        // Reset state
        setResult(null);
        setSelectedFile(null);
        setInputText('');
    }, 1500);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderResultContent = () => {
      if (!result) return null;

      // JSON Parsing for DATES
      if (activeTool === 'DATES') {
          try {
              const data = JSON.parse(result);
              if (Array.isArray(data) && data.length > 0) {
                  return (
                      <div className="space-y-3">
                          {data.map((item: any, i: number) => (
                              <div key={i} className="flex flex-col sm:flex-row sm:items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm gap-3">
                                  <div className="flex items-center flex-1 gap-4">
                                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800/50">
                                          <Calendar className="w-5 h-5 mb-0.5" />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">{item.event}</h4>
                                          <p className="text-xs text-gray-500 font-medium">{item.date}</p>
                                      </div>
                                  </div>
                                  <div className="ml-16 sm:ml-0">
                                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-lg tracking-wide ${
                                          item.importance?.toLowerCase() === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                          item.importance?.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                      }`}>
                                          {item.importance} Priority
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  );
              } else if (Array.isArray(data) && data.length === 0) {
                  return (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                          <AlertCircle className="w-10 h-10 mb-2 opacity-50"/>
                          <p>No dates found in the content.</p>
                      </div>
                  )
              }
          } catch (e) {
              // If JSON parse fails, fall through to text render
          }
      }

      // JSON Parsing for QUIZ
      if (activeTool === 'QUIZ') {
          try {
              const data = JSON.parse(result);
              if (Array.isArray(data)) {
                  return (
                      <div className="space-y-6">
                          {data.map((q: any, i: number) => (
                              <div key={i} className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                  <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-start gap-2">
                                      <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded text-xs mt-0.5">Q{i+1}</span>
                                      {q.question}
                                  </h4>
                                  <div className="space-y-2 pl-2">
                                      {q.options.map((opt: string, optIdx: number) => (
                                          <div key={optIdx} className={`text-sm px-3 py-2 rounded-lg border ${
                                              optIdx === q.answer 
                                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-bold' 
                                              : 'border-transparent text-gray-600 dark:text-gray-400'
                                          }`}>
                                              {String.fromCharCode(65 + optIdx)}. {opt}
                                              {optIdx === q.answer && <Check className="w-4 h-4 inline ml-2"/>}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  );
              }
          } catch (e) {
              // Fall through
          }
      }

      // Default Text Render (Summarizer or Fallback)
      return (
        <div className="w-full min-h-[150px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap shadow-sm font-medium">
            {result}
        </div>
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card dark:bg-slate-900 w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] rounded-2xl md:rounded-[2rem] border border-white/50 dark:border-gray-700 animate-fadeIn">
        
        {/* Sidebar */}
        <div className="w-full md:w-72 bg-gray-50/50 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-4 md:p-6 flex flex-row md:flex-col overflow-x-auto md:overflow-visible space-x-3 md:space-x-0 md:space-y-3 shrink-0">
            <h2 className="hidden md:block text-xl font-extrabold text-gray-800 dark:text-white mb-6 pl-2">AI Studio</h2>
            
            <button
              onClick={() => { setActiveTool('SUMMARIZE'); setResult(null); }}
              className={`flex-shrink-0 flex items-center space-x-2 md:space-x-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-200 font-bold text-sm ${activeTool === 'SUMMARIZE' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-gray-200/50 dark:shadow-none border border-white dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <FileText className="w-4 h-4 md:w-5 md:h-5" />
              <span>Summarizer</span>
            </button>
            <button
              onClick={() => { setActiveTool('DATES'); setResult(null); }}
              className={`flex-shrink-0 flex items-center space-x-2 md:space-x-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-200 font-bold text-sm ${activeTool === 'DATES' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-gray-200/50 dark:shadow-none border border-white dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              <span>Dates</span>
            </button>
            <button
              onClick={() => { setActiveTool('QUIZ'); setResult(null); }}
              className={`flex-shrink-0 flex items-center space-x-2 md:space-x-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl transition-all duration-200 font-bold text-sm ${activeTool === 'QUIZ' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-gray-200/50 dark:shadow-none border border-white dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
              <span>Quiz</span>
            </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white/40 dark:bg-slate-900/40 relative min-h-0">
             <div className="p-4 md:p-6 border-b border-gray-200/50 dark:border-gray-700 flex justify-between items-center bg-white/40 dark:bg-slate-900/40">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {activeTool === 'SUMMARIZE' ? 'Lecture Summarizer' : activeTool === 'DATES' ? 'Important Deadlines' : 'Test Generator'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Powered by Gemini 2.5</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-200/50 dark:hover:bg-slate-700 rounded-full transition">
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Input Content</label>
                    
                    {/* File Upload Area */}
                    {!selectedFile ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all group bg-white/50 dark:bg-slate-800/50"
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept=".pdf,.txt,.md,.csv,.docx,.ppt,.pptx"
                                onChange={handleFileChange}
                            />
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform text-indigo-500">
                                <UploadCloud className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <p className="font-bold text-gray-600 dark:text-gray-300 text-center">Click to upload Document</p>
                            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPT or Text files</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <FileIcon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-white text-sm truncate max-w-[150px] md:max-w-xs">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button onClick={clearFile} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition">
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Or Separator */}
                    <div className="flex items-center space-x-4">
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase">OR PASTE TEXT</span>
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1"></div>
                    </div>

                    <textarea 
                        className="w-full h-24 md:h-32 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm font-medium bg-white/80 dark:bg-slate-800/80 shadow-inner dark:text-gray-200 dark:placeholder-gray-500"
                        placeholder="Paste lecture notes or text content here..."
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            if (e.target.value) clearFile();
                        }}
                        disabled={!!selectedFile}
                    />
                </div>

                <div className="flex space-x-4">
                    <button 
                        onClick={handleProcess}
                        disabled={isProcessing || (!inputText && !selectedFile)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 btn-3d"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                        <span>{activeTool === 'SUMMARIZE' ? 'Analyze' : activeTool === 'DATES' ? 'Extract' : 'Generate'}</span>
                    </button>
                </div>

                {result && (
                    <div className="space-y-2 animate-fadeIn pt-4 border-t border-gray-200/50 dark:border-gray-700">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">AI Output</label>
                            <div className="flex space-x-2">
                                <button onClick={copyToClipboard} className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 rounded-lg transition">
                                    {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>}
                                    <span>{copied ? 'Copied' : 'Copy'}</span>
                                </button>
                                <button onClick={handleSave} className="text-xs font-bold text-white flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition shadow-md shadow-indigo-200 dark:shadow-none">
                                    {saved ? <Check className="w-3 h-3"/> : <Save className="w-3 h-3"/>}
                                    <span>{saved ? 'Saved' : 'Save'}</span>
                                </button>
                            </div>
                        </div>
                        {renderResultContent()}
                    </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};
