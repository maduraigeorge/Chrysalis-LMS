
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  FileText, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid,
  PenTool,
  FolderOpen,
  Inbox,
  Search,
  Eraser,
  Trash2,
  Highlighter,
  ExternalLink,
  Download,
  Plus,
  Upload,
  EyeOff,
  Edit2,
  Type as TypeIcon,
  Shuffle,
  GripVertical,
  CheckSquare,
  Check,
  Music,
  Code,
  Table,
  FileDown,
  FileUp,
  Save,
} from 'lucide-react';
import { ModuleData, UserRole, BreadcrumbItem } from '../types';
import { dbService, AnnotationData } from '../services/db';
import { Breadcrumbs } from './Breadcrumbs';

// Declare PDF.js global
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// --- Helper: PDF Thumbnail ---
interface PdfThumbnailProps {
  pdfDoc: any;
  pageNum: number;
  isActive: boolean;
  onClick: () => void;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ pdfDoc, pageNum, isActive, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    if (pdfDoc) {
      pdfDoc.getPage(pageNum).then((page: any) => {
        const viewport = page.getViewport({ scale: 0.2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#FFFFFF";
        context.fillRect(0,0, canvas.width, canvas.height);
        
        page.render(renderContext);
      });
    } else {
        canvas.width = 100;
        canvas.height = 140;
        context.fillStyle = "#ffffff";
        context.fillRect(0,0,100,140);
        context.fillStyle = "#e2e8f0";
        context.fillRect(10,10,80,10);
        context.fillRect(10,30,80,10);
        context.fillRect(10,50,60,10);
    }
  }, [pdfDoc, pageNum]);

  return (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer rounded-lg overflow-hidden border-2 transition-all relative group shadow-sm bg-white flex-shrink-0 mb-3
        ${isActive ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}
      `}
      style={{ minHeight: '100px' }}
    >
      <canvas ref={canvasRef} className="w-full h-auto block" />
      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[9px] font-bold text-white">
        {pageNum}
      </div>
    </div>
  );
};

// --- Helper: Resource PDF Renderer ---
const ResourcePdfViewer: React.FC<{ url: string }> = ({ url }) => {
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.pdfjsLib) {
      window.pdfjsLib.getDocument(url).promise.then((loadedPdf: any) => {
        setPdf(loadedPdf);
        setNumPages(loadedPdf.numPages);
      });
    }
  }, [url]);

  useEffect(() => {
    if (pdf && canvasRef.current) {
      pdf.getPage(page).then((p: any) => {
        const viewport = p.getViewport({ scale });
        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        p.render({ canvasContext: ctx, viewport }).promise.then(() => {});
      });
    }
  }, [pdf, page, scale]);

  return (
    <div className="flex flex-col items-center h-full w-full bg-slate-100 rounded-3xl overflow-hidden relative">
       <div className="flex-1 overflow-auto flex items-center justify-center p-4 w-full">
          {pdf ? <canvas ref={canvasRef} className="shadow-xl bg-white rounded-lg" /> : <div className="animate-pulse text-slate-400 font-bold">Loading PDF...</div>}
       </div>
       {/* Internal Controls for Resource PDF */}
       <div className="absolute bottom-4 bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full flex gap-4 items-center shadow-lg">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}><ChevronLeft className="w-4 h-4"/></button>
          <span className="text-xs font-bold">{page} / {numPages}</span>
          <button onClick={() => setPage(p => Math.min(numPages, p+1))} disabled={page>=numPages}><ChevronRight className="w-4 h-4"/></button>
          <div className="w-px h-4 bg-white/20"></div>
          <button onClick={() => setScale(s => Math.max(0.5, s-0.2))}><ZoomOut className="w-4 h-4"/></button>
          <button onClick={() => setScale(s => Math.min(2, s+0.2))}><ZoomIn className="w-4 h-4"/></button>
       </div>
    </div>
  );
}

interface BookViewerProps {
  book: ModuleData;
  userRole: UserRole;
  userId: string;
  onClose: () => void;
  breadcrumbItems: BreadcrumbItem[];
  onBreadcrumbNavigate: (index: number) => void;
}

// Annotation Types
interface Point { x: number; y: number; }
interface Stroke { type: 'pen' | 'highlighter' | 'eraser'; points: Point[]; color: string; width: number; }
interface TextAnnotation { type: 'text'; x: number; y: number; text: string; color: string; fontSize: number; }
type AnnotationAction = Stroke | TextAnnotation;

interface Resource {
  id: number;
  title: string;
  type: 'video' | 'pdf' | 'link' | 'image' | 'audio' | 'iframe' | 'doc';
  source?: string;
  duration?: string;
  size?: string;
  page: number;
  isHiddenForStudents?: boolean;
  isDownloadable?: boolean;
  createdBy: string;
}

const SEED_RESOURCES: Resource[] = [
  { id: 101, title: 'Intro Video: Key Concepts', type: 'video', source: 'https://www.w3schools.com/html/mov_bbb.mp4', page: 1, isHiddenForStudents: false, isDownloadable: true, createdBy: 'admin' },
  { id: 102, title: 'Chapter Overview', type: 'pdf', source: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', page: 1, isHiddenForStudents: false, isDownloadable: true, createdBy: 'admin' },
  { id: 201, title: 'Cell Structure Diagram', type: 'image', source: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=800', page: 2, isHiddenForStudents: false, isDownloadable: true, createdBy: 'admin' },
  { id: 202, title: 'Wikipedia Reference', type: 'link', source: 'https://en.wikipedia.org/wiki/Science', page: 2, isHiddenForStudents: false, isDownloadable: false, createdBy: 'admin' },
  { id: 301, title: 'Pronunciation Guide', type: 'audio', source: 'https://www.w3schools.com/html/horse.mp3', page: 3, isHiddenForStudents: false, isDownloadable: true, createdBy: 'admin' },
  { id: 401, title: 'Interactive Simulation', type: 'iframe', source: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html', page: 4, isHiddenForStudents: false, isDownloadable: false, createdBy: 'admin' },
  { id: 501, title: 'Practice Worksheet', type: 'pdf', source: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', page: 5, isHiddenForStudents: true, isDownloadable: true, createdBy: 'admin' }
];

export const BookViewer: React.FC<BookViewerProps> = ({ book, userRole, userId, onClose, breadcrumbItems, onBreadcrumbNavigate }) => {
  // --- Navigation & View State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [pageDimensions, setPageDimensions] = useState({ width: 800, height: 1131 });
  
  // --- PDF State ---
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  
  // --- Resources State ---
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [activeResource, setActiveResource] = useState<number | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [resourceSearchTerm, setResourceSearchTerm] = useState('');
  const [isSearchingResources, setIsSearchingResources] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isResSelectionMode, setIsResSelectionMode] = useState(false);
  const [selectedResIds, setSelectedResIds] = useState<Set<number>>(new Set());
  
  // --- Bulk Edit State ---
  const [isResGlobalEdit, setIsResGlobalEdit] = useState(false);
  const [pendingResChanges, setPendingResChanges] = useState<Resource[]>([]);

  // --- Add/Edit Resource State ---
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [resForm, setResForm] = useState<{
    title: string; category: 'link' | 'file'; type: Resource['type']; source: string; isHiddenForStudents: boolean; isDownloadable: boolean; fileName?: string; files?: FileList | null;
  }>({ title: '', category: 'link', type: 'link', source: '', isHiddenForStudents: false, isDownloadable: false, files: null });

  // --- Annotation State ---
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationData>({});
  const [currentTool, setCurrentTool] = useState<'pen' | 'highlighter' | 'eraser' | 'text'>('pen');
  const [strokeColor, setStrokeColor] = useState('#ef4444');
  const [isDrawing, setIsDrawing] = useState(false);
  const [pendingText, setPendingText] = useState<{ x: number, y: number } | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  
  // --- Pan State ---
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{x: number, y: number, scrollLeft: number, scrollTop: number} | null>(null);

  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const BASE_WIDTH = 800;

  // --- PDF Loading ---
  useEffect(() => {
    const isPdf = book.fileName?.match(/\.pdf$/i) || book.fileUrl?.startsWith('data:application/pdf') || book.fileUrl?.endsWith('.pdf');
    
    if (isPdf && book.fileUrl && window.pdfjsLib) {
      setPdfLoading(true);
      setPdfError(false);
      const loadingTask = window.pdfjsLib.getDocument(book.fileUrl);
      loadingTask.promise.then((loadedPdf: any) => {
        setPdfDoc(loadedPdf);
        setTotalPages(Math.max(5, loadedPdf.numPages));
        setPdfLoading(false);
      }, (reason: any) => {
        console.error("Error loading PDF: ", reason);
        setPdfLoading(false);
        setPdfError(true);
        setTotalPages(5); 
      });
    } else {
      setPdfDoc(null);
      setPdfError(false);
      setTotalPages(5);
    }
  }, [book.fileUrl, book.fileName]);

  // --- Render PDF Page ---
  useEffect(() => {
    if (!pdfCanvasRef.current) return;
    const canvas = pdfCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    if (pdfDoc) {
        pdfDoc.getPage(currentPage).then((page: any) => {
        // Fit to BASE_WIDTH for annotation consistency
        const viewportUnscaled = page.getViewport({ scale: 1 });
        const scale = BASE_WIDTH / viewportUnscaled.width;
        const viewport = page.getViewport({ scale });

        setPageDimensions({ width: BASE_WIDTH, height: viewport.height });

        canvas.width = BASE_WIDTH;
        canvas.height = viewport.height;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        page.render(renderContext);
        });
    } else {
        // Render Mock Page
        const MOCK_HEIGHT = 1131; // A4 default
        setPageDimensions({ width: BASE_WIDTH, height: MOCK_HEIGHT });

        canvas.width = BASE_WIDTH;
        canvas.height = MOCK_HEIGHT;
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [pdfDoc, currentPage, book.title]);


  // --- DB Loading Effects ---
  useEffect(() => {
    const loadResources = async () => {
      const savedResources = await dbService.getResources(book.id);
      if (savedResources && savedResources.length > 0) {
        setAllResources(savedResources);
      } else {
        setAllResources(SEED_RESOURCES);
      }
    };
    loadResources();
  }, [book.id, book.title]);

  useEffect(() => {
    const loadAnnotations = async () => {
      const savedAnnotations = await dbService.getAnnotations(book.id);
      if (savedAnnotations && Object.keys(savedAnnotations).length > 0) {
        setAnnotations(savedAnnotations);
      } else {
        // Only seed dummy annotations for Admin-created Mock books (no file uploaded)
        const isMockBook = book.createdBy === 'admin' && !book.fileUrl;
        
        if (isMockBook) {
            const dummy: AnnotationData = {};
            for(let i=1; i<=5; i++) {
                dummy[i] = [
                    { type: 'text', x: 100, y: 100 + (i*50), text: `Activity: Review Chapter ${i}`, color: '#3b82f6', fontSize: 24 },
                    { type: 'highlighter', points: [{x: 100, y: 140+(i*50)}, {x: 400, y: 140+(i*50)}], color: '#fcd34d', width: 20 }
                ];
            }
            setAnnotations(dummy);
        } else {
            setAnnotations({});
        }
      }
    };
    loadAnnotations();
  }, [book.id, book.createdBy, book.fileUrl]);

  useEffect(() => {
    if (allResources.length > 0) dbService.saveResources(book.id, allResources);
  }, [allResources, book.id]);

  useEffect(() => {
    if (Object.keys(annotations).length > 0) dbService.saveAnnotations(book.id, annotations);
  }, [annotations, book.id]);

  // Updated Fit Logic for Full Screen calculation
  // Only called explicitly, not on every resize, to avoid zoom fighting
  const handleFitToScreen = useCallback(() => {
     if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const padding = 0; 
        const availableW = clientWidth - padding;
        const availableH = clientHeight - padding;
        
        const scaleW = availableW / pageDimensions.width;
        const scaleH = availableH / pageDimensions.height; 
        
        setZoom(Math.floor(Math.min(scaleW, scaleH) * 100));
        setRotation(0);
     }
  }, [pageDimensions]);

  // Trigger fit only on load, file change, or sidebar toggle
  useEffect(() => {
    handleFitToScreen();
  }, [handleFitToScreen, pdfDoc, showResources, showThumbnails]);


  useEffect(() => {
    if (isResGlobalEdit) {
       setPendingResChanges(JSON.parse(JSON.stringify(allResources)));
    }
  }, [isResGlobalEdit, allResources]);

  const pageResources = allResources.filter(r => {
    const isOnPage = r.page === currentPage;
    if (!isOnPage) return false;
    if (userRole === UserRole.STUDENT && r.isHiddenForStudents) return false;
    if (resourceSearchTerm && !r.title.toLowerCase().includes(resourceSearchTerm.toLowerCase())) return false;
    return true;
  });
  
  const selectedResource = allResources.find(r => r.id === activeResource);
  const canEditResource = (resource: Resource) => (userRole === UserRole.ADMIN || (userRole === UserRole.TEACHER && resource.createdBy === userId));

  // --- Handlers: Pan & Scroll ---
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (isAnnotating) return;
    setIsPanning(true);
    if (containerRef.current) {
        panStart.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop
        };
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !panStart.current || !containerRef.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    containerRef.current.scrollLeft = panStart.current.scrollLeft - dx;
    containerRef.current.scrollTop = panStart.current.scrollTop - dy;
  };

  const handleContainerMouseUp = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  // --- Handlers: Canvas ---
  const getPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factor relative to the *displayed* size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Coordinates relative to the viewport
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pageAnnotations = annotations[currentPage] || [];
    pageAnnotations.forEach(item => {
      if (item.type === 'text') {
        ctx.font = `bold ${item.fontSize}px Nunito`;
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.x, item.y);
      } else {
        const stroke = item as Stroke;
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.lineWidth = stroke.width;
        if (stroke.type === 'eraser') ctx.globalCompositeOperation = 'destination-out';
        else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = stroke.type === 'highlighter' ? `${stroke.color}66` : stroke.color;
        }
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [currentPage, annotations, pageDimensions]);

  const startDrawing = (e: React.PointerEvent) => {
    if (!isAnnotating) return;
    if (currentTool === 'text') {
      const { x, y } = getPointerPos(e);
      setPendingText({ x, y });
      setTextInputValue('');
      return;
    }
    e.preventDefault();
    setIsDrawing(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    const { x, y } = getPointerPos(e);
    setAnnotations(prev => ({ ...prev, [currentPage]: [...(prev[currentPage] || []), { points: [{ x, y }], color: strokeColor, width: currentTool === 'highlighter' ? 20 : currentTool === 'eraser' ? 30 : 3, type: currentTool }] }));
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing || !isAnnotating) return;
    e.preventDefault();
    const { x, y } = getPointerPos(e);
    setAnnotations(prev => {
      const pageActions = [...(prev[currentPage] || [])];
      const last = pageActions[pageActions.length - 1];
      if (last.type !== 'text') {
        last.points.push({ x, y });
        return { ...prev, [currentPage]: pageActions };
      }
      return prev;
    });
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (isDrawing) {
      setIsDrawing(false);
      (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const handleTextComplete = () => {
    if (pendingText && textInputValue.trim()) {
      setAnnotations(prev => ({ 
        ...prev, 
        [currentPage]: [...(prev[currentPage] || []), { type: 'text', x: pendingText.x, y: pendingText.y, text: textInputValue, color: strokeColor, fontSize: 24 }] 
      }));
    }
    setPendingText(null);
    setTextInputValue('');
  };
  
  const renderResourceIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'video': return <Play className={`${iconClass} text-rose-500`} />;
      case 'pdf': return <FileText className={`${iconClass} text-orange-500`} />;
      case 'link': return <LinkIcon className={`${iconClass} text-blue-500`} />;
      case 'image': return <ImageIcon className={`${iconClass} text-emerald-500`} />;
      case 'audio': return <Music className={`${iconClass} text-purple-500`} />;
      case 'iframe': return <Code className={`${iconClass} text-slate-500`} />;
      default: return <FileText className={`${iconClass} text-slate-500`} />;
    }
  };

  const renderSelectedResourceContent = (res: Resource) => {
    const wrapperClass = "w-full h-full flex items-center justify-center overflow-hidden";
    const isDataUri = res.source?.startsWith('data:');
    
    switch (res.type) {
      case 'iframe': return <div className={wrapperClass}><iframe src={res.source} className="w-full h-full border-none bg-white rounded-3xl" title={res.title}></iframe></div>;
      case 'video': return <div className={wrapperClass}><video src={res.source} controls className="w-full h-full object-contain rounded-3xl shadow-2xl" /></div>;
      case 'image': return <div className={wrapperClass}><img src={res.source} alt="" className="w-full h-full object-contain rounded-3xl shadow-2xl" /></div>;
      case 'audio': return <div className={wrapperClass}><audio src={res.source} controls className="w-96" /></div>;
      case 'pdf':
        if (isDataUri) {
            return <div className={wrapperClass}><ResourcePdfViewer url={res.source!} /></div>;
        }
        return <div className={wrapperClass}><ResourcePdfViewer url={res.source!} /></div>;
      case 'doc':
         if (isDataUri) {
             return <div className="flex flex-col items-center justify-center h-full"><FileText className="w-20 h-20 text-slate-400"/><p className="mt-4 font-bold text-slate-500">Preview not available for uploaded docs.</p><a href={res.source} download={res.title} className="mt-2 text-indigo-600 underline">Download to view</a></div>;
         }
         return <div className={wrapperClass}><iframe src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(res.source || '')}`} className="w-full h-full border-none bg-white rounded-3xl" /></div>;
      default: return <div className={wrapperClass}><a href={res.source} target="_blank" className="text-indigo-400 font-bold underline flex items-center gap-2 hover:scale-105 transition-transform"><ExternalLink className="w-6 h-6" /> Open Link</a></div>;
    }
  };

  // --- Handlers: Drag & Drop (Resources) ---
  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add('opacity-50');
  };
  const handleDragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();
  };
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    const _dragItem = dragItem.current;
    const _dragOverItem = dragOverItem.current;
    if (_dragItem !== null && _dragOverItem !== null && _dragItem !== _dragOverItem) {
      const filtered = pageResources;
      const sourceRes = filtered[_dragItem];
      const targetRes = filtered[_dragOverItem];
      const sourceIdx = allResources.findIndex(r => r.id === sourceRes.id);
      const targetIdx = allResources.findIndex(r => r.id === targetRes.id);
      if (sourceIdx > -1 && targetIdx > -1) {
        const _resources = [...allResources];
        const [draggedContent] = _resources.splice(sourceIdx, 1);
        _resources.splice(targetIdx, 0, draggedContent);
        setAllResources(_resources);
      }
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          let type: Resource['type'] = 'link';
          if (file.type.includes('image')) type = 'image';
          else if (file.type.includes('pdf')) type = 'pdf';
          else type = 'doc';
          setResForm(prev => ({ ...prev, source: reader.result as string, fileName: file.name, title: prev.title || file.name, type: type, files: files }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleResourceSubmit = async () => {
    const newResources: Resource[] = [];
    if (resForm.category === 'file' && resForm.files && resForm.files.length > 0) {
      const filesArray: File[] = Array.from(resForm.files);
      for (const file of filesArray) {
        const source = await new Promise<string>((resolve) => {
           const reader = new FileReader();
           reader.onloadend = () => resolve(reader.result as string);
           reader.readAsDataURL(file);
        });
        let type: Resource['type'] = 'doc';
        if (file.type.includes('image')) type = 'image';
        else if (file.type.includes('pdf')) type = 'pdf';
        newResources.push({ id: Date.now() + Math.random(), title: file.name, type: type, source: source, page: currentPage, isHiddenForStudents: resForm.isHiddenForStudents, isDownloadable: resForm.isDownloadable, createdBy: userId });
      }
    } else {
      newResources.push({ id: editingResourceId || Date.now(), title: resForm.title, type: resForm.type, source: resForm.source, page: currentPage, isHiddenForStudents: resForm.isHiddenForStudents, isDownloadable: resForm.isDownloadable, createdBy: userId });
    }
    if (editingResourceId && newResources.length === 1) {
      setAllResources(prev => prev.map(r => r.id === editingResourceId ? { ...r, ...newResources[0] } : r));
    } else {
      setAllResources(prev => [...prev, ...newResources]);
    }
    closeResourceForm();
  };

  const openAddResource = () => { setEditingResourceId(null); setResForm({ title: '', category: 'link', type: 'link', source: '', isHiddenForStudents: false, isDownloadable: false, files: null }); setIsAddingResource(true); };
  const openEditResource = (res: Resource) => { setEditingResourceId(res.id); setResForm({ title: res.title, category: ['pdf', 'doc', 'image'].includes(res.type) ? 'file' : 'link', type: res.type, source: res.source || '', isHiddenForStudents: res.isHiddenForStudents || false, isDownloadable: res.isDownloadable || false, files: null }); setIsAddingResource(true); };
  const handleDeleteResource = (id: number) => { if (confirm('Delete this resource?')) { setAllResources(prev => prev.filter(r => r.id !== id)); if (activeResource === id) setActiveResource(null); } };
  const handleBulkDelete = () => { if (confirm(`Delete ${selectedResIds.size} resources?`)) { setAllResources(prev => prev.filter(r => !selectedResIds.has(r.id))); setSelectedResIds(new Set()); setIsResSelectionMode(false); } };
  const toggleResSelection = (id: number) => { const newSet = new Set(selectedResIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedResIds(newSet); };
  const closeResourceForm = () => { setIsAddingResource(false); setEditingResourceId(null); };
  const handleGlobalResSave = () => { setAllResources(pendingResChanges); setIsResGlobalEdit(false); };
  const handleExportResCSV = () => { /* Export logic */ };
  const handleImportResCSV = (e: React.ChangeEvent<HTMLInputElement>) => { /* Import logic */ };

  const NavBtn = ({ onClick, icon: Icon, title, active = false, disabled = false }: any) => (
    <button onClick={onClick} disabled={disabled} className={`p-3 md:p-3 p-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-transparent text-white hover:bg-white/10'}`} title={title}>
      <Icon className="w-5 h-5 md:w-5 md:h-5 w-4 h-4" strokeWidth={2.5} />
    </button>
  );

  const toggleControls = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, .no-toggle')) return;
    if (isPanning) return;
    setShowControls(prev => !prev);
  };

  const renderMainBookContent = () => {
    if (pdfDoc) return <canvas ref={pdfCanvasRef} className="absolute inset-0 w-full h-full object-contain bg-transparent" />;
    if (book.fileUrl || book.type === 'file') {
      const isImage = book.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || book.fileUrl?.startsWith('data:image');
      if (isImage) return <img src={book.fileUrl} className="absolute inset-0 w-full h-full object-contain select-none" alt="Book Content" />;
    }
    return (
        <div className="absolute inset-0 p-8 sm:p-12 flex flex-col text-slate-800 pointer-events-none">
            <div className="flex-1 border-4 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <h1 className="text-3xl font-black mb-4 text-indigo-900">{book.title}</h1>
                <p className="text-lg text-slate-400 font-bold">Page {currentPage}</p>
                {pdfLoading && <p className="text-sm text-indigo-500 mt-2 font-bold animate-pulse">Loading PDF...</p>}
                {!pdfLoading && !pdfDoc && <p className="text-sm text-slate-300 mt-2">No file content available.</p>}
            </div>
        </div>
    );
  };

  // Rotation Swapping logic
  const isRotated = rotation % 180 !== 0;
  const sizerWidth = isRotated ? pageDimensions.height * (zoom / 100) : pageDimensions.width * (zoom / 100);
  const sizerHeight = isRotated ? pageDimensions.width * (zoom / 100) : pageDimensions.height * (zoom / 100);

  return (
    <div ref={viewerRef} className="flex flex-col h-[calc(100dvh-5rem)] bg-transparent animate-fade-in relative">
      
      {/* Top Overlay */}
      <div className={`absolute top-0 left-0 right-0 z-50 p-4 flex flex-col md:flex-row items-start md:items-center justify-between pointer-events-none gap-2 transition-all duration-300 ${showControls || isAnnotating ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
         <div className="pointer-events-auto w-[calc(100%-90px)] md:w-auto overflow-x-auto pb-1 md:pb-0">
             <Breadcrumbs items={breadcrumbItems} onNavigate={onBreadcrumbNavigate} variant="light" />
         </div>
      </div>
      
      {/* Resources Button */}
      {!showResources && (
           <div className="absolute top-4 right-4 z-[60] pointer-events-auto">
               <button onClick={() => setShowResources(true)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-black text-xs md:text-sm uppercase tracking-wide shadow-lg border-2 transition-all bg-amber-400 text-amber-900 border-amber-300 hover:scale-105" title="Toggle Resources">
                  <FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Resources</span>
               </button>
           </div>
      )}

      <div className="flex-1 flex overflow-hidden relative" onMouseLeave={() => setShowControls(true)}>
        
        {/* Thumbnails Sidebar */}
        <div className={`bg-slate-100/90 backdrop-blur-md border-r border-slate-200 shadow-xl z-[60] flex flex-col pointer-events-auto transition-all duration-300 ease-in-out flex-shrink-0 h-full ${showThumbnails ? 'w-48 opacity-100' : 'w-0 opacity-0 overflow-hidden'} absolute sm:relative`} style={{ left: showThumbnails ? 0 : undefined }} onClick={(e) => e.stopPropagation()}>
             <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white/50">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Thumbnails</h3>
                <button onClick={() => setShowThumbnails(false)} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-4 h-4 text-slate-500" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <PdfThumbnail key={pageNum} pdfDoc={pdfDoc} pageNum={pageNum} isActive={currentPage === pageNum} onClick={() => { setCurrentPage(pageNum); setShowThumbnails(false); }} />
                ))}
             </div>
        </div>

        {/* Main View Container (Scrollable) */}
        <div ref={containerRef} className={`flex-1 w-full h-full overflow-auto overscroll-none touch-pan-y touch-pan-x bg-transparent flex relative ${isAnnotating ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'}`} onMouseDown={handleContainerMouseDown} onMouseMove={handleContainerMouseMove} onMouseUp={handleContainerMouseUp} onMouseLeave={handleContainerMouseUp} onClick={toggleControls}>
           
           {/* Center Sizer Div (Layout Size) */}
           <div className="relative m-auto flex-shrink-0" style={{ width: `${sizerWidth}px`, height: `${sizerHeight}px` }}>
               
               {/* Content Absolute Center (Visual Size) */}
               <div 
                 className="absolute top-1/2 left-1/2 shadow-2xl rounded-3xl overflow-hidden origin-center bg-transparent" 
                 style={{ 
                    width: `${pageDimensions.width}px`, 
                    height: `${pageDimensions.height}px`, 
                    transform: `translate(-50%, -50%) scale(${zoom / 100}) rotate(${rotation}deg)` 
                 }}
                 onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing}
               >
                  {renderMainBookContent()}
                  <canvas ref={canvasRef} width={pageDimensions.width} height={pageDimensions.height} className={`absolute inset-0 z-10 bg-transparent ${isAnnotating ? 'pointer-events-auto' : 'pointer-events-none'}`} />
                  {pendingText && (
                    <input autoFocus style={{ position: 'absolute', left: pendingText.x, top: pendingText.y, fontSize: '24px', color: strokeColor, background: 'transparent', border: 'none', outline: 'none', fontWeight: 'bold' }} value={textInputValue} onChange={e => setTextInputValue(e.target.value)} onBlur={handleTextComplete} onKeyDown={e => e.key === 'Enter' && handleTextComplete()} />
                  )}
               </div>
           </div>
        </div>
        
        {/* Nav Arrows */}
        <button onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-16 md:h-16 bg-white/60 hover:bg-white backdrop-blur-sm rounded-full shadow-2xl flex items-center justify-center text-indigo-600 border-2 border-white hover:scale-105 transition-all opacity-60 hover:opacity-100 group pointer-events-auto" disabled={currentPage === 1}>
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-16 md:h-16 bg-white/60 hover:bg-white backdrop-blur-sm rounded-full shadow-2xl flex items-center justify-center text-indigo-600 border-2 border-white hover:scale-105 transition-all opacity-60 hover:opacity-100 group pointer-events-auto" disabled={currentPage === totalPages}>
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" strokeWidth={3} />
        </button>

        {/* Resource Sidebar */}
        <div className={`bg-white/95 backdrop-blur-xl border-l border-white/20 shadow-2xl z-[70] flex flex-col pointer-events-auto transition-all duration-300 ease-in-out relative flex-shrink-0 ${showResources ? 'w-full sm:w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`} onClick={(e) => e.stopPropagation()}>
             <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
               <h3 className="font-black text-slate-800 text-sm">Resources</h3>
               <div className="flex items-center gap-1">
                 <button onClick={() => setIsSearchingResources(!isSearchingResources)} className={`p-1.5 rounded-lg transition-colors ${isSearchingResources ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'}`}><Search className="w-4 h-4" /></button>
                 {userRole === UserRole.ADMIN && <button onClick={() => { setIsResSelectionMode(!isResSelectionMode); setSelectedResIds(new Set()); }} className={`p-1.5 rounded-lg transition-colors ${isResSelectionMode ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'}`} title="Bulk Select"><CheckSquare className="w-4 h-4" /></button>}
                 {userRole === UserRole.ADMIN && <button onClick={() => setIsResGlobalEdit(true)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="Bulk Edit"><Table className="w-4 h-4" /></button>}
                 {userRole === UserRole.ADMIN && <button onClick={() => setIsReordering(!isReordering)} className={`p-1.5 rounded-lg transition-colors ${isReordering ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'}`} title="Reorder"><Shuffle className="w-4 h-4" /></button>}
                 <button onClick={() => setShowResources(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 bg-slate-50"><X className="w-4 h-4" /></button>
               </div>
             </div>
             {isSearchingResources && (<div className="p-2 border-b border-slate-100 animate-slide-up"><input autoFocus value={resourceSearchTerm} onChange={e => setResourceSearchTerm(e.target.value)} placeholder="Search resources..." className="w-full px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100" /></div>)}
             <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {pageResources.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-300"><Inbox className="w-12 h-12 mb-2" /><p className="font-bold">No resources found</p></div> : pageResources.map((res, idx) => (
                    <div key={res.id} draggable={isReordering} onDragStart={(e) => handleDragStart(e, idx)} onDragEnter={(e) => handleDragEnter(e, idx)} onDragEnd={handleDragEnd} onClick={() => { if(!isReordering && !isResSelectionMode) setActiveResource(res.id); else if(isResSelectionMode) toggleResSelection(res.id); }} className={`group flex items-start gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer relative ${activeResource === res.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-indigo-100 hover:shadow-md'} ${isResSelectionMode && selectedResIds.has(res.id) ? 'bg-indigo-50 border-indigo-500' : ''}`}>
                       {isResSelectionMode && <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${selectedResIds.has(res.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>{selectedResIds.has(res.id) && <Check className="w-3 h-3 text-white" strokeWidth={4} />}</div>}
                       {isReordering && <GripVertical className="w-5 h-5 text-slate-300 cursor-move mt-0.5" />}
                       <div className="mt-0.5">{renderResourceIcon(res.type)}</div>
                       <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-700 text-sm leading-tight group-hover:text-indigo-700 transition-colors">{res.title}</h4><div className="flex items-center gap-2 mt-1"><span className="text-[9px] uppercase font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{res.type}</span>{res.isHiddenForStudents && <EyeOff className="w-3 h-3 text-slate-400" />}{res.isDownloadable && <Download className="w-3 h-3 text-slate-400" />}</div></div>
                       {!isReordering && !isResSelectionMode && <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{canEditResource(res) && <><button onClick={(e) => { e.stopPropagation(); openEditResource(res); }} className="p-1.5 hover:bg-indigo-100 rounded-lg text-slate-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={(e) => { e.stopPropagation(); handleDeleteResource(res.id); }} className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></>}</div>}
                    </div>
                ))}
             </div>
             {userRole !== UserRole.STUDENT && <div className="p-4 border-t border-slate-100 bg-slate-50/50">{isResSelectionMode ? <button onClick={handleBulkDelete} className="w-full py-3 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all">Delete Selected ({selectedResIds.size})</button> : <button onClick={openAddResource} className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-wide hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Add Resource</button>}</div>}
        </div>
      </div>

      {/* Floating Controls (Absolute Center relative to Main Content Area) */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto w-[90%] md:w-auto ${(showControls || isAnnotating) && !isAnnotating ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
          <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl md:rounded-full shadow-2xl border border-white/10 flex items-center gap-1 overflow-x-auto">
             <div className="flex items-center gap-1 px-1 flex-shrink-0"><NavBtn onClick={() => setShowThumbnails(!showThumbnails)} icon={Grid} title="Page Thumbnails" active={showThumbnails} /><NavBtn onClick={() => setCurrentPage(p => Math.max(1, p - 1))} icon={ChevronLeft} title="Previous Page" disabled={currentPage === 1} /><NavBtn onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} icon={ChevronRight} title="Next Page" disabled={currentPage === totalPages} /></div>
             <div className="w-px h-6 md:h-8 bg-white/10 mx-1 flex-shrink-0"></div>
             <div className="flex items-center gap-1 px-1 flex-shrink-0"><NavBtn onClick={() => setZoom(z => Math.max(10, z - 10))} icon={ZoomOut} title="Zoom Out" /><NavBtn onClick={handleFitToScreen} icon={Minimize2} title="Fit to Screen" /><NavBtn onClick={() => setZoom(z => Math.min(1000, z + 10))} icon={ZoomIn} title="Zoom In" /></div>
             <div className="w-px h-6 md:h-8 bg-white/10 mx-1 flex-shrink-0"></div>
             <div className="flex items-center gap-1 px-1 flex-shrink-0"><NavBtn onClick={() => setRotation(r => (r + 90) % 360)} icon={RotateCw} title="Rotate Page" /><NavBtn onClick={() => setIsAnnotating(true)} icon={PenTool} title="Annotate" /></div>
          </div>
      </div>
      
      {/* Annotation Toolbar */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-auto w-[90%] md:w-auto ${isAnnotating ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
         <div className="bg-slate-900/90 backdrop-blur-md p-2 md:p-3 rounded-2xl md:rounded-full shadow-2xl border border-white/10 flex items-center gap-2 md:gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-full flex-shrink-0">
               <button onClick={() => setCurrentTool('pen')} className={`p-2 rounded-full transition-all ${currentTool === 'pen' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><PenTool className="w-4 h-4 md:w-5 md:h-5" /></button>
               <button onClick={() => setCurrentTool('highlighter')} className={`p-2 rounded-full transition-all ${currentTool === 'highlighter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><Highlighter className="w-4 h-4 md:w-5 md:h-5" /></button>
               <button onClick={() => setCurrentTool('text')} className={`p-2 rounded-full transition-all ${currentTool === 'text' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><TypeIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
               <button onClick={() => setCurrentTool('eraser')} className={`p-2 rounded-full transition-all ${currentTool === 'eraser' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><Eraser className="w-4 h-4 md:w-5 md:h-5" /></button>
            </div>
            <div className="w-px h-6 md:h-8 bg-white/10 flex-shrink-0"></div>
            <div className="flex items-center gap-2 flex-shrink-0">{['#000000', '#ef4444', '#22c55e', '#3b82f6', '#eab308'].map(c => <button key={c} onClick={() => setStrokeColor(c)} className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition-transform ${strokeColor === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c }} />)}</div>
            <div className="w-px h-6 md:h-8 bg-white/10 flex-shrink-0"></div>
            <div className="flex items-center gap-2 flex-shrink-0"><button onClick={() => setAnnotations(prev => ({ ...prev, [currentPage]: [] }))} className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-full" title="Clear Page"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button><button onClick={() => setIsAnnotating(false)} className="p-2 bg-white text-slate-900 rounded-full hover:bg-slate-200" title="Close"><X className="w-4 h-4 md:w-5 md:h-5" /></button></div>
         </div>
      </div>
      
      {/* Full Screen Resource Overlay */}
      {activeResource && selectedResource && (
        <div className="absolute inset-0 z-[80] bg-[#f0f9ff] flex flex-col animate-fade-in pointer-events-auto">
           <div className="py-2 px-4 md:px-6 border-b border-indigo-100 bg-white/50 flex items-center justify-between">
              <h3 className="text-slate-800 font-bold text-xs md:text-base flex items-center gap-3 truncate">{renderResourceIcon(selectedResource.type)} {selectedResource.title}</h3>
              <div className="flex items-center gap-4 flex-shrink-0">
                 {selectedResource.isDownloadable && <a href={selectedResource.source} download className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10px] md:text-xs transition-colors"><Download className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Download</span></a>}
                 <button onClick={() => setActiveResource(null)} className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
           </div>
           <div className="flex-1 overflow-hidden relative p-4 sm:p-8 flex items-center justify-center">
              {renderSelectedResourceContent(selectedResource)}
           </div>
        </div>
      )}
      
      {/* Add/Edit Resource Modal & Global Edit Table would go here ... (same as before) */}
      {isAddingResource && (
        <div className="absolute inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border-4 border-white/50 ring-4 ring-black/5 animate-slide-up overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-slate-800">{editingResourceId ? 'Edit Resource' : 'Add Resource'}</h3>
                  <button onClick={closeResourceForm}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               <div className="p-6 space-y-4">
                   <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wide">Title</label>
                      <input autoFocus value={resForm.title} onChange={e => setResForm({ ...resForm, title: e.target.value })} className="w-full mt-1 px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100" />
                   </div>
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setResForm({ ...resForm, category: 'link' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${resForm.category === 'link' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Link / Embed</button>
                      <button onClick={() => setResForm({ ...resForm, category: 'file' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${resForm.category === 'file' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>Upload File</button>
                   </div>
                   {resForm.category === 'link' ? (
                      <div className="space-y-4">
                         <div className="flex gap-2 overflow-x-auto pb-1">
                            {['link', 'video', 'audio', 'iframe'].map(t => (
                               <button key={t} onClick={() => setResForm({ ...resForm, type: t as any })} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border-2 ${resForm.type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>{t}</button>
                            ))}
                         </div>
                         <input value={resForm.source} onChange={e => setResForm({ ...resForm, source: e.target.value })} placeholder="https://..." className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-medium text-slate-600 focus:ring-2 focus:ring-indigo-100" />
                      </div>
                   ) : (
                      <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 relative cursor-pointer group">
                          <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <Upload className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xs font-bold text-slate-500">{resForm.files && resForm.files.length > 0 ? (resForm.files.length > 1 ? `${resForm.files.length} files` : resForm.fileName) : "Drop files here"}</p>
                      </div>
                   )}
                   <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={resForm.isHiddenForStudents} onChange={e => setResForm({ ...resForm, isHiddenForStudents: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500" />
                         <span className="text-xs font-bold text-slate-600">Hide from Students</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={resForm.isDownloadable} onChange={e => setResForm({ ...resForm, isDownloadable: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500" />
                         <span className="text-xs font-bold text-slate-600">Allow Download</span>
                      </label>
                   </div>
                   <button onClick={handleResourceSubmit} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
                      {editingResourceId ? 'Save Changes' : 'Add Resource'}
                   </button>
               </div>
           </div>
        </div>
      )}
      {/* Global Edit Table (Admin) */}
      {isResGlobalEdit && (
        <div className="absolute inset-0 z-[80] bg-white flex flex-col animate-fade-in pointer-events-auto">
           <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-800">Bulk Resource Editor</h3>
              <div className="flex gap-2">
                 <button onClick={handleExportResCSV} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2"><FileDown className="w-4 h-4"/> Export CSV</button>
                 <label className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 cursor-pointer"><FileUp className="w-4 h-4"/> Import CSV<input type="file" accept=".csv" onChange={handleImportResCSV} className="hidden" /></label>
                 <button onClick={handleGlobalResSave} className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600"><Save className="w-4 h-4 inline mr-1"/> Save All</button>
                 <button onClick={() => setIsResGlobalEdit(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
              </div>
           </div>
           <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="text-xs font-black text-slate-400 uppercase border-b border-slate-200">
                       <th className="p-3">Title</th><th className="p-3">Page</th><th className="p-3">Type</th><th className="p-3">Source/URL</th><th className="p-3 text-center">Hidden</th><th className="p-3 text-center">Download</th>
                    </tr>
                 </thead>
                 <tbody>
                    {pendingResChanges.map((r, i) => (
                       <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-2"><input value={r.title} onChange={e => { const n = [...pendingResChanges]; n[i].title = e.target.value; setPendingResChanges(n); }} className="w-full bg-slate-50 border-none rounded px-2 py-1 font-bold text-sm" /></td>
                          <td className="p-2"><input type="number" value={r.page} onChange={e => { const n = [...pendingResChanges]; n[i].page = parseInt(e.target.value); setPendingResChanges(n); }} className="w-16 bg-slate-50 border-none rounded px-2 py-1 font-bold text-sm" /></td>
                          <td className="p-2"><select value={r.type} onChange={e => { const n = [...pendingResChanges]; n[i].type = e.target.value as any; setPendingResChanges(n); }} className="bg-slate-50 border-none rounded px-2 py-1 text-xs font-bold">{['link','video','pdf','doc','image','audio','iframe'].map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                          <td className="p-2"><input value={r.source} onChange={e => { const n = [...pendingResChanges]; n[i].source = e.target.value; setPendingResChanges(n); }} className="w-full bg-slate-50 border-none rounded px-2 py-1 text-xs font-mono text-slate-500" /></td>
                          <td className="p-2 text-center"><input type="checkbox" checked={r.isHiddenForStudents} onChange={e => { const n = [...pendingResChanges]; n[i].isHiddenForStudents = e.target.checked; setPendingResChanges(n); }} /></td>
                          <td className="p-2 text-center"><input type="checkbox" checked={r.isDownloadable} onChange={e => { const n = [...pendingResChanges]; n[i].isDownloadable = e.target.checked; setPendingResChanges(n); }} /></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

    </div>
  );
};
