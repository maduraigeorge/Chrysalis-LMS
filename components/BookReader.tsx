import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minus, 
  Plus, 
  Highlighter, 
  PenTool, 
  Search, 
  MoreVertical,
  PlayCircle,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  FolderOpen,
  Download
} from 'lucide-react';
import { ModuleData } from '../types';

interface BookReaderProps {
  book: ModuleData;
  onClose: () => void;
}

// Mock Resources Data for the sidebar
const MOCK_RESOURCES = [
  { id: 1, title: 'Concept Video: Gravity', type: 'video', duration: '5:20' },
  { id: 2, title: 'Lab Safety Guide', type: 'pdf', size: '1.2 MB' },
  { id: 3, title: 'Interactive Simulation', type: 'link', source: 'PhET' },
  { id: 4, title: 'Diagram: Solar System', type: 'image', size: '2.4 MB' },
  { id: 5, title: 'Chapter Summary', type: 'pdf', size: '0.8 MB' },
  { id: 6, title: 'Expert Talk', type: 'video', duration: '12:15' },
];

export const BookReader: React.FC<BookReaderProps> = ({ book, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(42); // Mock total pages
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="w-5 h-5 text-rose-500" />;
      case 'pdf': return <FileText className="w-5 h-5 text-orange-500" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-blue-500" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100 overflow-hidden animate-in fade-in duration-300">
      
      {/* Internal Reader Header (Navigation & Title) */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            title="Close Book"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{book.title}</h2>
            <span className="text-xs text-slate-500 font-medium">{book.description}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors hidden sm:block ${sidebarOpen ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
            title="Toggle Resources"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hidden sm:block">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar - Resources Panel */}
        <div 
          className={`
            bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-300 ease-in-out absolute sm:relative z-10 h-full shadow-xl sm:shadow-none
            ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full sm:w-0 sm:translate-x-0 opacity-0 sm:opacity-100'}
          `}
        >
          <div className="h-full flex flex-col w-80">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-700">Resources</h3>
              <button onClick={() => setSidebarOpen(false)} className="sm:hidden p-1">
                 <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {MOCK_RESOURCES.map((res) => (
                <div key={res.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                  <div className="mt-0.5">{getResourceIcon(res.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 leading-snug group-hover:text-indigo-700 transition-colors">
                      {res.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {res.type}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {res.duration || res.size || res.source}
                      </span>
                    </div>
                  </div>
                  <button className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 relative flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
           {/* Mock Page Content */}
           <div 
             className="bg-white shadow-2xl rounded-sm w-full max-w-3xl aspect-[3/4] sm:aspect-[4/3] md:aspect-[3/4] lg:aspect-[1.414/1] relative flex flex-col transition-transform duration-200 origin-center"
             style={{ transform: `scale(${zoomLevel / 100})` }}
           >
              {/* Page Header */}
              <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 text-slate-300 font-serif text-xs">
                 <span>Chapter 1: The Basics</span>
                 <span>Page {currentPage}</span>
              </div>

              {/* Page Body */}
              <div className="flex-1 p-8 sm:p-12 md:p-16">
                 <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-800 mb-6">Introduction to {book.title}</h1>
                 <p className="font-serif text-lg leading-loose text-slate-600 mb-4 first-letter:text-5xl first-letter:font-bold first-letter:text-indigo-600 first-letter:mr-2 first-letter:float-left">
                    Welcome to this comprehensive guide on {book.title}. This section covers the fundamental concepts that will serve as the building blocks for your learning journey.
                 </p>
                 <p className="font-serif text-lg leading-loose text-slate-600 mb-6">
                    As we explore these topics, remember that understanding the core principles is essential. We have provided various resources in the sidebar to help visualize these concepts.
                 </p>
                 
                 <div className="my-8 p-6 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl">
                    <h4 className="font-bold text-indigo-900 mb-2">Key Takeaway</h4>
                    <p className="text-indigo-700 font-medium">
                       Always refer to the supplementary videos for a practical demonstration of these theories.
                    </p>
                 </div>

                 <p className="font-serif text-lg leading-loose text-slate-600">
                    Turn the page to begin the first lesson.
                 </p>
              </div>

              {/* Page Footer */}
              <div className="h-12 border-t border-slate-100 flex items-center justify-center text-slate-300 font-serif text-xs">
                 {book.description} • {book.tags?.join(', ')}
              </div>
           </div>
        </div>

      </div>

      {/* Bottom Toolbar */}
      <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-between px-4 sm:px-8 z-20 flex-shrink-0">
         <div className="flex items-center gap-2 w-1/3">
            <button 
               className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
               onClick={() => setZoomLevel(z => Math.max(50, z - 10))}
            >
               <Minus className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-slate-600 w-12 text-center">{zoomLevel}%</span>
            <button 
               className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
               onClick={() => setZoomLevel(z => Math.min(150, z + 10))}
            >
               <Plus className="w-5 h-5" />
            </button>
         </div>

         <div className="flex items-center gap-4 w-1/3 justify-center">
            <button 
               onClick={handlePrevPage}
               disabled={currentPage === 1}
               className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:hover:bg-indigo-50 rounded-full transition-colors"
            >
               <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
               {currentPage} / {totalPages}
            </span>
            <button 
               onClick={handleNextPage}
               disabled={currentPage === totalPages}
               className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:hover:bg-indigo-50 rounded-full transition-colors"
            >
               <ChevronRight className="w-6 h-6" />
            </button>
         </div>

         <div className="flex items-center gap-2 w-1/3 justify-end">
            <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors hidden sm:block">
               <Highlighter className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors hidden sm:block">
               <PenTool className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
               <Maximize className="w-5 h-5" />
            </button>
         </div>
      </div>

    </div>
  );
};