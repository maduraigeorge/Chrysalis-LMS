import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Breadcrumbs } from './components/Breadcrumbs';
import { GeminiAssistant } from './components/GeminiAssistant';
import { BookViewer } from './components/BookViewer';
import { User, UserRole, BreadcrumbItem, ModuleData } from './types';
import { Folder, FileText, ChevronRight, Star, Music, Calculator, FlaskConical, Clock, Award, Zap, Book, PenTool, Calendar, GraduationCap, Globe, Monitor, Palette, Sparkles, BookOpen, Notebook, Plus, Trash2, Edit2, X, Save, Tag, Search, ArrowUpDown, Lock, Wrench, LayoutGrid, List, ArrowDownAZ, Tags, Check, EyeOff, Image as ImageIcon, PaintBucket, Upload, Trophy, Target, CheckSquare, Layers, Table, FileDown, FileUp, MoreHorizontal, Type as TypeIcon } from 'lucide-react';
import { dbService } from './services/db';

const PREDEFINED_TAGS = ['2025-26', '2024-25', 'Thinkroom', 'Thinkers', 'Textbook', 'Workbook', 'Teacher Resource', 'Semester 1', 'Semester 2', 'Advanced', 'Remedial'];

const COLOR_OPTIONS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', ring: 'ring-indigo-300' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-300' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-300' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', ring: 'ring-rose-300' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', ring: 'ring-sky-300' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', ring: 'ring-purple-300' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', ring: 'ring-slate-300' },
];

const PROGRAM_TAGS = ['Thinkroom', 'Thinkers'];
const VERSION_TAGS = ['2025-26', '2024-25'];

// --- Realistic Data Generators ---

// Sample Public PDFs
const SAMPLE_PDFS = {
  studio: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', // Reliable Mozilla Sample
  companion: 'https://pdfobject.com/pdf/sample.pdf', // Reliable PDFObject Sample
  fhb: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' // Reliable W3C Sample
};

const generateBooks = (unitId: string, unitTitle: string): ModuleData[] => [
  { 
    id: `${unitId}-studio`, 
    title: 'Studio Book', 
    description: `Course Book for ${unitTitle}`, 
    type: 'file', 
    items: [], 
    tags: ['Textbook', 'Semester 1'], 
    createdBy: 'admin', 
    isHiddenForStudents: false, 
    color: 'sky', 
    fileUrl: SAMPLE_PDFS.studio,
    coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=300' // Open book
  },
  { 
    id: `${unitId}-companion`, 
    title: 'Companion Book', 
    description: `Workbook for ${unitTitle}`, 
    type: 'file', 
    items: [], 
    tags: ['Workbook', 'Semester 1'], 
    createdBy: 'admin', 
    isHiddenForStudents: false, 
    color: 'emerald', 
    fileUrl: SAMPLE_PDFS.companion,
    coverImage: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?auto=format&fit=crop&q=80&w=300' // Notebook
  },
  { 
    id: `${unitId}-fhb`, 
    title: 'FHB (Teacher Guide)', 
    description: 'Instructional Guide', 
    type: 'file', 
    items: [], 
    tags: ['Teacher Resource'], 
    createdBy: 'admin', 
    isHiddenForStudents: true, 
    color: 'purple', 
    fileUrl: SAMPLE_PDFS.fhb,
    coverImage: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&q=80&w=300' // Teacher planning
  }
];

const generateSubjects = (gradeId: string): ModuleData[] => [
  { 
    id: `${gradeId}-math`, 
    title: 'Mathematics', 
    description: 'Thinkroom 25-26', 
    type: 'folder', 
    tags: ['2025-26', 'Thinkroom'], 
    createdBy: 'admin', 
    color: 'indigo', 
    items: [] 
  },
  { 
    id: `${gradeId}-sci`, 
    title: 'Science', 
    description: 'Thinkroom 25-26', 
    type: 'folder', 
    tags: ['2025-26', 'Thinkroom'], 
    createdBy: 'admin', 
    color: 'emerald', 
    items: [] 
  },
  { 
    id: `${gradeId}-eng`, 
    title: 'English', 
    description: 'Thinkroom 25-26', 
    type: 'folder', 
    tags: ['2025-26', 'Thinkroom'], 
    createdBy: 'admin', 
    color: 'rose', 
    items: [] 
  },
  { 
    id: `${gradeId}-soc`, 
    title: 'Social Studies', 
    description: 'Thinkroom 25-26', 
    type: 'folder', 
    tags: ['2025-26', 'Thinkroom'], 
    createdBy: 'admin', 
    color: 'amber', 
    items: [] 
  },
  { 
    id: `${gradeId}-cs`, 
    title: 'Computer Science', 
    description: 'Thinkroom 25-26', 
    type: 'folder', 
    tags: ['2025-26', 'Thinkroom'], 
    createdBy: 'admin', 
    color: 'slate', 
    items: [] 
  },
  // Thinkers Program Variation
  { 
    id: `${gradeId}-math-thinkers`, 
    title: 'Mathematics', 
    description: 'Thinkers 25-26', 
    type: 'folder', 
    tags: ['2025-26', 'Thinkers'], 
    createdBy: 'admin', 
    color: 'indigo', 
    items: [] 
  },
];

// Detailed Grade 3 Science Curriculum
const getGrade3ScienceUnits = (): ModuleData[] => [
  { 
    id: 'g3-sci-u1', 
    title: 'Unit 1: Food We Eat', 
    description: 'Nutrition & Health', 
    type: 'folder', 
    tags: ['Biology'],
    createdBy: 'admin', 
    color: 'emerald',
    items: generateBooks('g3-sci-u1', 'Food We Eat') 
  },
  { 
    id: 'g3-sci-u2', 
    title: 'Unit 2: Plant Life', 
    description: 'Parts of a Plant', 
    type: 'folder', 
    tags: ['Botany'],
    createdBy: 'admin', 
    color: 'emerald',
    items: generateBooks('g3-sci-u2', 'Plant Life') 
  },
  { 
    id: 'g3-sci-u3', 
    title: 'Unit 3: Animal World', 
    description: 'Birds & Habitats', 
    type: 'folder', 
    tags: ['Zoology'],
    createdBy: 'admin', 
    color: 'sky',
    items: generateBooks('g3-sci-u3', 'Animal World') 
  },
  { 
    id: 'g3-sci-u4', 
    title: 'Unit 4: Human Body', 
    description: 'Organs & Systems', 
    type: 'folder', 
    tags: ['Anatomy'],
    createdBy: 'admin', 
    color: 'rose',
    items: generateBooks('g3-sci-u4', 'Human Body') 
  },
  { 
    id: 'g3-sci-u5', 
    title: 'Unit 5: Matter', 
    description: 'Solids, Liquids, Gases', 
    type: 'folder', 
    tags: ['Chemistry'],
    createdBy: 'admin', 
    color: 'purple',
    items: generateBooks('g3-sci-u5', 'Matter') 
  },
];

const getGrade3Subjects = (): ModuleData[] => {
  const subs = generateSubjects('g3');
  // Populate Thinkroom Science
  const sci = subs.find(s => s.title === 'Science' && s.tags?.includes('Thinkroom'));
  if(sci) {
    sci.items = getGrade3ScienceUnits();
  }
  return subs;
};

const INITIAL_LIBRARY_DATA: ModuleData[] = [
  { id: 'pp1', title: 'Grade PP1', description: 'Early Years', type: 'folder', createdBy: 'admin', color: 'rose', items: generateSubjects('pp1') },
  { id: 'pp2', title: 'Grade PP2', description: 'Kindergarten', type: 'folder', createdBy: 'admin', color: 'rose', items: generateSubjects('pp2') },
  { id: 'g1', title: 'Grade 1', description: 'Primary', type: 'folder', createdBy: 'admin', color: 'emerald', items: generateSubjects('g1') },
  { id: 'g2', title: 'Grade 2', description: 'Primary', type: 'folder', createdBy: 'admin', color: 'emerald', items: generateSubjects('g2') },
  { id: 'g3', title: 'Grade 3', description: 'Primary', type: 'folder', createdBy: 'admin', color: 'sky', items: getGrade3Subjects() },
  { id: 'g4', title: 'Grade 4', description: 'Primary', type: 'folder', createdBy: 'admin', color: 'sky', items: generateSubjects('g4') },
  { id: 'g5', title: 'Grade 5', description: 'Middle', type: 'folder', createdBy: 'admin', color: 'amber', items: generateSubjects('g5') },
  { id: 'g6', title: 'Grade 6', description: 'Middle', type: 'folder', createdBy: 'admin', color: 'amber', items: generateSubjects('g6') },
  { id: 'g7', title: 'Grade 7', description: 'Middle', type: 'folder', createdBy: 'admin', color: 'purple', items: generateSubjects('g7') },
  { id: 'g8', title: 'Grade 8', description: 'Secondary', type: 'folder', createdBy: 'admin', color: 'purple', items: generateSubjects('g8') },
  { id: 'g9', title: 'Grade 9', description: 'Secondary', type: 'folder', createdBy: 'admin', color: 'slate', items: generateSubjects('g9') },
  { id: 'g10', title: 'Grade 10', description: 'Secondary', type: 'folder', createdBy: 'admin', color: 'slate', items: generateSubjects('g10') },
];

const App: React.FC = () => {
  // State
  const [user, setUser] = useState<User>({ 
    id: 'u123', 
    name: 'Alex Johnson', 
    role: UserRole.STUDENT, 
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', 
    subscribedTags: ['Thinkroom', '2025-26'], 
    gradeId: 'g3' 
  });
  
  const [libraryData, setLibraryData] = useState<ModuleData[]>([]);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [currentPath, setCurrentPath] = useState<ModuleData[]>([]);
  const [activeBook, setActiveBook] = useState<ModuleData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'tag'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Bulk Select State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Global Edit State
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const [pendingGlobalChanges, setPendingGlobalChanges] = useState<ModuleData[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<ModuleData | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', description: '', type: 'folder' as 'folder' | 'file', 
    tags: [] as string[], isHiddenForStudents: false, 
    color: 'indigo', coverImage: '', fileUrl: '', fileName: '',
    files: null as FileList | null
  });
  const [customTagInput, setCustomTagInput] = useState('');

  // --- DB Init Effect ---
  useEffect(() => {
    const initDB = async () => {
      try {
        await dbService.init();
        const savedData = await dbService.getLibrary();
        if (savedData && savedData.length > 0) {
          setLibraryData(savedData);
        } else {
          setLibraryData(INITIAL_LIBRARY_DATA);
          await dbService.saveLibrary(INITIAL_LIBRARY_DATA);
        }
        setIsDbInitialized(true);
      } catch (error) {
        console.error("DB Init failed", error);
        setLibraryData(INITIAL_LIBRARY_DATA); 
      }
    };
    initDB();
  }, []);

  useEffect(() => {
    if (isDbInitialized && libraryData.length > 0) {
      dbService.saveLibrary(libraryData).catch(err => console.error("Auto-save failed", err));
    }
  }, [libraryData, isDbInitialized]);
  
  useEffect(() => {
    if (activeModule === 'library' && user.role === UserRole.STUDENT && user.gradeId && currentPath.length === 0 && libraryData.length > 0) {
      const grade = libraryData.find(i => i.id === user.gradeId);
      if (grade) {
        setCurrentPath([grade]);
      }
    }
  }, [activeModule, user, currentPath, libraryData]);

  // --- Helpers (Same as before) ---
  const findItemById = (data: ModuleData[], id: string): ModuleData | null => {
    for (const item of data) {
      if (item.id === id) return item;
      if (item.items && item.items.length > 0) {
        const found = findItemById(item.items, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateItemInTree = (data: ModuleData[], updatedItem: ModuleData): ModuleData[] => {
    return data.map(item => {
      if (item.id === updatedItem.id) return updatedItem;
      if (item.items.length > 0) {
        return { ...item, items: updateItemInTree(item.items, updatedItem) };
      }
      return item;
    });
  };

  const addItemToParent = (data: ModuleData[], parentId: string, newItem: ModuleData): ModuleData[] => {
    if (!parentId) return [...data, newItem]; 
    return data.map(item => {
      if (item.id === parentId) {
        return { ...item, items: [...item.items, newItem] };
      }
      if (item.items.length > 0) {
        return { ...item, items: addItemToParent(item.items, parentId, newItem) };
      }
      return item;
    });
  };

  const addItemsToParent = (data: ModuleData[], parentId: string, newItems: ModuleData[]): ModuleData[] => {
     if (!parentId) return [...data, ...newItems];
     return data.map(item => {
       if (item.id === parentId) {
         return { ...item, items: [...item.items, ...newItems] };
       }
       if (item.items.length > 0) {
         return { ...item, items: addItemsToParent(item.items, parentId, newItems) };
       }
       return item;
     });
  };

  const deleteItemFromTree = (data: ModuleData[], itemId: string): ModuleData[] => {
    return data.filter(item => item.id !== itemId).map(item => ({
      ...item,
      items: deleteItemFromTree(item.items, itemId)
    }));
  };

  const deleteItemsFromTree = (data: ModuleData[], itemIds: Set<string>): ModuleData[] => {
     return data.filter(item => !itemIds.has(item.id)).map(item => ({
       ...item,
       items: deleteItemsFromTree(item.items, itemIds)
     }));
  };

  const replaceChildrenOfParent = (data: ModuleData[], parentId: string, newChildren: ModuleData[]): ModuleData[] => {
     if (!parentId) return newChildren;
     return data.map(item => {
        if (item.id === parentId) return { ...item, items: newChildren };
        if (item.items.length > 0) return { ...item, items: replaceChildrenOfParent(item.items, parentId, newChildren) };
        return item;
     });
  };

  const checkVisibility = (item: ModuleData) => {
    if (user.role === UserRole.STUDENT && item.isHiddenForStudents) return false;
    if (item.createdBy === user.id) return true;
    if (user.role === UserRole.ADMIN) return true;
    if (item.tags && item.tags.length > 0) {
      const itemProgramTags = item.tags.filter(t => PROGRAM_TAGS.includes(t));
      const itemVersionTags = item.tags.filter(t => VERSION_TAGS.includes(t));
      if (itemProgramTags.length > 0) {
        const hasProgram = itemProgramTags.some(t => user.subscribedTags?.includes(t));
        if (!hasProgram) return false;
      }
      if (itemVersionTags.length > 0) {
        const hasVersion = itemVersionTags.some(t => user.subscribedTags?.includes(t));
        if (!hasVersion) return false;
      }
    }
    return true;
  };

  const canAddItem = () => {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.TEACHER) {
      return currentPath.length > 0;
    }
    return false;
  };

  const canEditOrDeleteItem = (item: ModuleData) => {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.TEACHER) {
      return item.createdBy === user.id;
    }
    return false;
  };

  const getVisibleTags = (tags?: string[]) => {
    if (!tags) return [];
    if (user.role === UserRole.ADMIN) return tags;
    return tags.filter(t => !PROGRAM_TAGS.includes(t) && !VERSION_TAGS.includes(t));
  };
  
  const getTagStyle = (tag: string) => {
    // Generate color based on tag string hash
    const colors = [
      'bg-red-100 text-red-700 border-red-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-teal-100 text-teal-700 border-teal-200',
      'bg-cyan-100 text-cyan-700 border-cyan-200',
      'bg-sky-100 text-sky-700 border-sky-200',
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-violet-100 text-violet-700 border-violet-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-rose-100 text-rose-700 border-rose-200',
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleRoleChange = (role: UserRole) => {
    const newUser = { ...user, role };
    if (role === UserRole.STUDENT) {
      newUser.name = 'Alex Johnson';
      newUser.id = 'u123';
      newUser.gradeId = 'g3';
      newUser.avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';
    } else if (role === UserRole.TEACHER) {
      newUser.name = 'Sarah Wilson';
      newUser.id = 't1';
      newUser.gradeId = undefined;
      newUser.avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah';
    } else {
      newUser.name = 'Administrator';
      newUser.id = 'admin';
      newUser.gradeId = undefined;
      newUser.avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin';
    }
    setUser(newUser);
  };

  const handleNavigate = (folder: ModuleData) => {
    setCurrentPath([...currentPath, folder]);
    setSearchTerm('');
    setIsSelectionMode(false);
    setSelectedItems(new Set());
    setIsGlobalEditMode(false);
  };

  const handleItemClick = (item: ModuleData) => {
    if (isGlobalEditMode) return;
    if (isSelectionMode) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) newSelected.delete(item.id);
      else newSelected.add(item.id);
      setSelectedItems(newSelected);
      return;
    }

    if (item.type === 'folder') {
      handleNavigate(item);
    } else {
      setActiveBook(item);
    }
  };

  const handleBreadcrumbNavigate = (idx: number) => {
    if (idx === 0 && user.role === UserRole.STUDENT && user.gradeId && libraryData.length > 0) {
      const grade = libraryData.find(i => i.id === user.gradeId);
      if (grade) {
        setCurrentPath([grade]);
        return;
      }
    }
    if (idx === 0) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, idx));
    }
    setIsGlobalEditMode(false);
  };

  const handleBookBreadcrumbNavigate = (idx: number) => {
    setActiveBook(null);
    handleBreadcrumbNavigate(idx);
  };

  const createSingleItem = (data: Partial<ModuleData>, file?: File): ModuleData => {
    return {
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      title: data.title || (file ? file.name : 'New Item'),
      description: data.description || '',
      type: data.type || 'folder',
      items: [],
      tags: data.tags || [],
      createdBy: user.id,
      isHiddenForStudents: data.isHiddenForStudents || false,
      color: data.color || 'indigo',
      coverImage: data.coverImage || '',
      fileUrl: data.fileUrl || '',
      fileName: data.fileName || ''
    };
  };

  const handleCreate = async () => {
    if (formData.type === 'file' && formData.files && formData.files.length > 0) {
      const newItems: ModuleData[] = [];
      const filesArray: File[] = Array.from(formData.files);

      for (const file of filesArray) {
         const fileUrl = await new Promise<string>((resolve) => {
           const reader = new FileReader();
           reader.onloadend = () => resolve(reader.result as string);
           reader.readAsDataURL(file);
         });
         newItems.push(createSingleItem({ ...formData, title: file.name, fileUrl: fileUrl, fileName: file.name }, file));
      }

      if (currentPath.length === 0) {
        setLibraryData([...libraryData, ...newItems]);
      } else {
        const parentId = currentPath[currentPath.length - 1].id;
        setLibraryData(addItemsToParent(libraryData, parentId, newItems));
      }

    } else {
      const newItem = createSingleItem(formData);
      if (currentPath.length === 0) {
        setLibraryData([...libraryData, newItem]);
      } else {
        const parentId = currentPath[currentPath.length - 1].id;
        setLibraryData(addItemToParent(libraryData, parentId, newItem));
      }
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = () => {
    if (!editingItem) return;
    if (!canEditOrDeleteItem(editingItem)) return;
    const updatedItem: ModuleData = {
      ...editingItem,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      tags: formData.tags,
      isHiddenForStudents: formData.isHiddenForStudents,
      color: formData.color,
      coverImage: formData.coverImage,
      fileUrl: formData.fileUrl,
      fileName: formData.fileName
    };
    setLibraryData(updateItemInTree(libraryData, updatedItem));
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (item: ModuleData) => {
    if (!canEditOrDeleteItem(item)) return;
    if (confirm(`Delete "${item.title}"?`)) {
      setLibraryData(deleteItemFromTree(libraryData, item.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedItems.size} items?`)) {
      setLibraryData(deleteItemsFromTree(libraryData, selectedItems));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') handleCreate();
    else handleEdit();
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', type: 'folder', tags: [], isHiddenForStudents: false, color: 'indigo', coverImage: '', fileUrl: '', fileName: '', files: null });
    setEditingItem(null);
    setCustomTagInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setFormData(prev => ({ ...prev, coverImage: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length > 1) {
        setFormData(prev => ({ ...prev, files: files, fileName: `${files.length} files selected` }));
      } else {
        const file = files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, fileUrl: reader.result as string, fileName: file.name, title: prev.title || file.name, files: files }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCustomTagAdd = () => {
    if (customTagInput.trim()) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, customTagInput.trim()] }));
      setCustomTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Type', 'Tags', 'Hidden', 'Color', 'CoverImage'];
    const rows = pendingGlobalChanges.map(i => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.description.replace(/"/g, '""')}"`,
      i.type,
      `"${(i.tags || []).join(';')}"`,
      i.isHiddenForStudents ? 'true' : 'false',
      i.color || '',
      i.coverImage || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'library_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      const newItems: ModuleData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!cols) continue;
        const clean = (s: string) => s ? s.replace(/^"|"$/g, '').replace(/""/g, '"') : '';
        const idStr = clean(cols[0]);
        const id = idStr && idStr.length > 0 ? idStr : Date.now().toString() + Math.random().toString().slice(2, 6);
        
        newItems.push({
           id: id,
           title: clean(cols[1]) || 'Untitled',
           description: clean(cols[2]) || '',
           type: (clean(cols[3]) as any) || 'folder',
           items: [], // CSV import cannot restore hierarchy easily without complex logic, assumes flat import to current folder or updates
           tags: clean(cols[4]).split(';').filter(Boolean),
           isHiddenForStudents: clean(cols[5]) === 'true',
           color: clean(cols[6]) || 'indigo',
           coverImage: clean(cols[7]),
           createdBy: user.id
        });
      }
      setPendingGlobalChanges(newItems);
    };
    reader.readAsText(file);
  };

  const handleGlobalCoverImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         const n = [...pendingGlobalChanges];
         n[idx].coverImage = reader.result as string;
         setPendingGlobalChanges(n);
       };
       reader.readAsDataURL(file);
     }
  };


  const handleGlobalSave = () => {
     if (currentPath.length === 0) {
        setLibraryData(pendingGlobalChanges);
     } else {
        const parentId = currentPath[currentPath.length - 1].id;
        setLibraryData(replaceChildrenOfParent(libraryData, parentId, pendingGlobalChanges));
     }
     setIsGlobalEditMode(false);
  };

  const currentViewData = useMemo(() => {
    let items: ModuleData[] = [];
    if (currentPath.length === 0) {
      items = libraryData;
    } else {
      const parent = findItemById(libraryData, currentPath[currentPath.length - 1].id);
      items = parent ? parent.items : [];
    }
    return items;
  }, [libraryData, currentPath]);

  // Init global edit
  useEffect(() => {
    if (isGlobalEditMode) {
       setPendingGlobalChanges(JSON.parse(JSON.stringify(currentViewData)));
    }
  }, [isGlobalEditMode, currentViewData]);


  const filteredViewData = useMemo(() => {
    let items = currentViewData.filter(checkVisibility);
    if (searchTerm) {
       items = items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    }
    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
    return items.sort((a, b) => {
      if (sortBy === 'tag') {
        const tagA = a.tags?.[0] || '';
        const tagB = b.tags?.[0] || '';
        if (tagA !== tagB) return sortOrder === 'asc' ? collator.compare(tagA, tagB) : collator.compare(tagB, tagA);
      }
      return sortOrder === 'asc' ? collator.compare(a.title, b.title) : collator.compare(b.title, a.title);
    });
  }, [currentViewData, searchTerm, sortBy, sortOrder, user]);


  const getIcon = (item: ModuleData) => {
    if (item.type === 'file') return FileText;
    if (item.title.includes('Grade')) return GraduationCap;
    return Folder;
  };

  const getColorStyles = (colorId?: string) => {
    return COLOR_OPTIONS.find(c => c.id === colorId) || COLOR_OPTIONS[6];
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: activeModule === 'library' ? 'Library' : 'Dashboard', id: 'root', clickable: true },
    ...currentPath.map((item, index) => ({
      label: item.title,
      id: item.id,
      clickable: index < currentPath.length 
    }))
  ];

  const bookBreadcrumbs: BreadcrumbItem[] = activeBook 
    ? [...breadcrumbItems, { label: activeBook.title, id: activeBook.id, clickable: false }]
    : [];

  return (
    <div className="flex flex-col h-[100dvh] bg-transparent font-sans text-slate-900 overflow-hidden">
      <div className="flex-shrink-0">
        <Header user={user} activeModule={activeModule} setActiveModule={setActiveModule} onRoleChange={handleRoleChange} />
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {/* Global Navigation Overlay */}
        {!activeBook && (
            <div className="absolute top-0 left-0 right-0 z-40 px-4 py-3 pointer-events-none grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Breadcrumbs */}
                <div className="pointer-events-auto flex items-center justify-start min-w-0">
                    <div className="p-1.5 flex flex-wrap w-full md:w-auto">
                        <Breadcrumbs items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} variant="light" />
                    </div>
                </div>
                
                {/* Right: Controls */}
                <div className="pointer-events-auto flex items-center justify-start md:justify-end gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {activeModule === 'library' && !isGlobalEditMode && (
                        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-white/50 flex items-center gap-2 flex-shrink-0">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2 w-4 h-4 text-slate-400" />
                                <input 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-32 md:w-48 pl-9 pr-3 py-1.5 bg-slate-50/80 text-sm font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl transition-all"
                                />
                            </div>
                            <div className="w-px h-5 bg-slate-200 mx-1"></div>

                            {/* Sort Controls */}
                            <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className={`p-1.5 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-indigo-600 hover:bg-slate-50`} title={sortOrder === 'asc' ? "Sort Ascending" : "Sort Descending"}>
                                {sortOrder === 'asc' ? <ArrowDownAZ className="w-5 h-5" /> : <ArrowUpDown className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setSortBy(prev => prev === 'title' ? 'tag' : 'title')} className={`p-1.5 rounded-xl transition-all active:scale-95 ${sortBy === 'tag' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`} title={sortBy === 'title' ? "Sort by Name" : "Sort by Tag"}>
                                {sortBy === 'title' ? <TypeIcon className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                            </button>

                            <div className="w-px h-5 bg-slate-200 mx-1"></div>

                            {/* View Controls */}
                            {user.role === UserRole.ADMIN && (
                                <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedItems(new Set()); }} className={`p-1.5 rounded-xl transition-all active:scale-95 ${isSelectionMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`} title="Bulk Select">
                                    <CheckSquare className="w-5 h-5" />
                                </button>
                            )}
                            {user.role === UserRole.ADMIN && (
                                <button onClick={() => setIsGlobalEditMode(true)} className="p-1.5 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-indigo-600 hover:bg-slate-50" title="Global Edit (Table View)">
                                    <Table className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-xl transition-all active:scale-95 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`} title="Grid View">
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-xl transition-all active:scale-95 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`} title="List View">
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    {isGlobalEditMode && (
                        <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2 animate-bounce-subtle pointer-events-auto max-w-full overflow-x-auto">
                             <div className="flex items-center gap-2 mr-2 border-r border-slate-100 pr-2">
                                <label className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer transition-colors text-indigo-600" title="Import CSV">
                                  <FileUp className="w-4 h-4" />
                                  <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                                </label>
                                <button onClick={handleExportCSV} className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-indigo-600" title="Export CSV"><FileDown className="w-4 h-4" /></button>
                             </div>
                             <span className="text-xs font-black uppercase text-indigo-600 px-2 tracking-wide hidden sm:inline">Bulk Editor</span>
                             <button onClick={() => setIsGlobalEditMode(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors whitespace-nowrap">Cancel</button>
                             <button onClick={handleGlobalSave} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-bold text-white shadow-md shadow-emerald-200 transition-colors whitespace-nowrap">Save All</button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeBook ? (
          <div className="h-full max-w-[1920px] mx-auto">
            <BookViewer 
              book={activeBook} 
              userRole={user.role} 
              userId={user.id}
              onClose={() => setActiveBook(null)}
              breadcrumbItems={bookBreadcrumbs}
              onBreadcrumbNavigate={handleBookBreadcrumbNavigate}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto pt-32 md:pt-24 custom-scrollbar">
            <div className="max-w-[1920px] mx-auto pb-12 px-4 sm:px-6">
              <main className="animate-fade-in">
                {activeModule === 'dashboard' ? (
                  /* Dashboard View */
                  <div className="max-w-5xl mx-auto space-y-8 mt-4">
                     {/* Welcome Banner */}
                     <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                           <h1 className="text-4xl font-black mb-3">Hi, {user.name.split(' ')[0]}! 👋</h1>
                           <p className="text-indigo-100 text-lg font-medium opacity-90">Ready to learn something new today?</p>
                           <button onClick={() => setActiveModule('library')} className="mt-8 px-8 py-3 bg-white text-indigo-600 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                              Go to Library <ChevronRight className="w-5 h-5" strokeWidth={3} />
                           </button>
                        </div>
                        <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-white rotate-6 hover:rotate-12 transition-transform duration-500 shadow-inner">
                           <Sparkles className="w-16 h-16" />
                        </div>
                     </div>
                     
                     {/* Quick Stats */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                           <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Clock className="w-6 h-6" strokeWidth={2.5} /></div>
                           <h3 className="text-xl font-extrabold text-slate-800">Recent</h3>
                           <p className="text-sm font-bold text-slate-400 mt-1">Continue Science Unit 3</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                           <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Trophy className="w-6 h-6" strokeWidth={2.5} /></div>
                           <h3 className="text-xl font-extrabold text-slate-800">Progress</h3>
                           <p className="text-sm font-bold text-slate-400 mt-1">2 Modules Completed</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                           <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Calendar className="w-6 h-6" strokeWidth={2.5} /></div>
                           <h3 className="text-xl font-extrabold text-slate-800">Schedule</h3>
                           <p className="text-sm font-bold text-slate-400 mt-1">No upcoming tasks</p>
                        </div>
                     </div>
                  </div>
                ) : activeModule === 'library' ? (
                  isGlobalEditMode ? (
                     // Global Edit Table
                     <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 font-black text-xl text-slate-700 bg-slate-50/50 flex justify-between">
                          <span>Bulk Editor</span>
                          <span className="text-sm font-normal text-slate-500">{pendingGlobalChanges.length} items</span>
                        </div>
                        <div className="overflow-x-auto max-h-[70vh]">
                           <table className="w-full text-left text-xs border-separate border-spacing-0">
                             <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-bold uppercase tracking-wider">
                               <tr>
                                 <th className="p-4 border-b">ID</th>
                                 <th className="p-4 border-b">Title</th>
                                 <th className="p-4 border-b">Description</th>
                                 <th className="p-4 border-b">Type</th>
                                 <th className="p-4 border-b">Color</th>
                                 <th className="p-4 border-b text-center">Hidden</th>
                                 <th className="p-4 border-b">Tags</th>
                                 <th className="p-4 border-b">Cover Image</th>
                               </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-slate-100">
                               {pendingGlobalChanges.map((item, idx) => (
                                 <tr key={item.id} className="hover:bg-slate-50/50">
                                   <td className="p-4 text-slate-400 font-mono text-[10px]">{item.id.substring(0,6)}...</td>
                                   <td className="p-4"><input value={item.title} onChange={e => { const n = [...pendingGlobalChanges]; n[idx].title = e.target.value; setPendingGlobalChanges(n); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none" /></td>
                                   <td className="p-4"><input value={item.description} onChange={e => { const n = [...pendingGlobalChanges]; n[idx].description = e.target.value; setPendingGlobalChanges(n); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:ring-2 focus:ring-indigo-100 outline-none" /></td>
                                   <td className="p-4"><select value={item.type} onChange={e => { const n = [...pendingGlobalChanges]; n[idx].type = e.target.value as any; setPendingGlobalChanges(n); }} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600"><option value="folder">Folder</option><option value="file">File</option></select></td>
                                   <td className="p-4"><select value={item.color} onChange={e => { const n = [...pendingGlobalChanges]; n[idx].color = e.target.value; setPendingGlobalChanges(n); }} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600">{COLOR_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></td>
                                   <td className="p-4 text-center"><input type="checkbox" checked={item.isHiddenForStudents} onChange={e => { const n = [...pendingGlobalChanges]; n[idx].isHiddenForStudents = e.target.checked; setPendingGlobalChanges(n); }} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" /></td>
                                   <td className="p-4"><input value={(item.tags || []).join(', ')} onChange={e => { const n = [...pendingGlobalChanges]; n[idx].tags = e.target.value.split(',').map(s=>s.trim()).filter(Boolean); setPendingGlobalChanges(n); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:ring-2 focus:ring-indigo-100 outline-none" placeholder="Tags..." /></td>
                                   <td className="p-4">
                                     <div className="relative w-8 h-8 rounded border border-slate-200 overflow-hidden group">
                                         {item.coverImage ? <img src={item.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50" />}
                                         <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                             <Upload className="w-4 h-4 text-white" />
                                             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGlobalCoverImageUpload(idx, e)} />
                                         </label>
                                     </div>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        </div>
                     </div>
                  ) : (
                  // Grid/List View
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6" : "flex flex-col gap-3"}>
                     {filteredViewData.map((item) => {
                        const styles = getColorStyles(item.color);
                        const isFolder = item.type === 'folder';
                        const Icon = getIcon(item);
                        const isSelected = selectedItems.has(item.id);
                        const isCreatorAdmin = item.createdBy === 'admin';
                        const showBadge = user.role !== UserRole.STUDENT && !(user.role === UserRole.TEACHER && isCreatorAdmin);

                        if (viewMode === 'list') {
                          return (
                             <div 
                               key={item.id} 
                               onClick={() => handleItemClick(item)} 
                               className={`
                                 group bg-white p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-5 relative
                                 ${isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-transparent shadow-sm hover:border-indigo-200 hover:shadow-md hover:scale-[1.01]'}
                               `}
                             >
                                <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${styles.bg} ${styles.text}`}>
                                     {item.coverImage ? <img src={item.coverImage} className="w-full h-full object-cover rounded-2xl" /> : <Icon className="w-7 h-7" strokeWidth={2} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <h3 className="font-bold text-slate-800 text-lg truncate mb-1">{item.title}</h3>
                                   <p className="text-xs font-bold text-slate-400 truncate uppercase tracking-wide">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   {canEditOrDeleteItem(item) && (
                                     <>
                                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setFormData({ ...item } as any); setModalMode('edit'); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit2 className="w-5 h-5" /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
                                     </>
                                   )}
                                </div>
                             </div>
                          );
                        }

                        // Grid Card
                        return (
                           <div 
                             key={item.id} 
                             onClick={() => handleItemClick(item)} 
                             className={`
                               group bg-white p-3 rounded-[1.5rem] border-2 transition-all cursor-pointer flex items-stretch gap-3 min-h-[5.5rem] h-full relative overflow-visible
                               ${isSelected ? 'border-indigo-500 bg-indigo-50/20' : 'border-transparent shadow-sm hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 hover:border-indigo-100'}
                             `}
                           >
                              {/* Creator Badge Logic */}
                              {showBadge && item.createdBy && (
                                 <div className="absolute -top-2 -right-2 bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-sm z-10 border-2 border-white">
                                   {item.createdBy === 'admin' ? 'Admin' : (item.createdBy === user.id ? 'You' : 'Teacher')}
                                 </div>
                              )}

                              {/* Item Count Badge */}
                              {item.type === 'folder' && (
                                <div className="absolute top-1 left-1 bg-white text-slate-800 text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10 border-2 border-slate-50">
                                   {item.items?.length || 0}
                                </div>
                              )}

                              {/* Left: Icon/Image */}
                              <div className={`w-20 h-20 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 flex items-center justify-center ${styles.bg} ${styles.text} relative overflow-hidden shadow-inner`}>
                                 {isSelectionMode ? (
                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'border-slate-300 bg-white'}`}>
                                       {isSelected && <Check className="w-5 h-5 text-white" strokeWidth={4} />}
                                    </div>
                                 ) : item.coverImage ? (
                                   <img src={item.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                 ) : (
                                   <Icon className="w-10 h-10 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2} />
                                 )}
                              </div>

                              {/* Right: Info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                 <h3 className="font-extrabold text-slate-800 text-sm leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                   {item.title}
                                 </h3>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 line-clamp-1">
                                   {item.description}
                                 </p>

                                 {/* Tags (Bottom) */}
                                 <div className="flex flex-wrap gap-1.5 mt-auto">
                                   {getVisibleTags(item.tags).slice(0, 3).map(tag => (
                                       <span key={tag} className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md border ${getTagStyle(tag)}`}>
                                           {tag}
                                       </span>
                                   ))}
                                   {getVisibleTags(item.tags).length > 3 && (
                                       <span className="px-1.5 py-0.5 text-slate-400 text-[9px] font-bold">+{(getVisibleTags(item.tags).length - 3)}</span>
                                   )}
                                 </div>
                              </div>

                              {/* Hover Actions */}
                              {!isSelectionMode && canEditOrDeleteItem(item) && (
                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 z-10">
                                   <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setFormData({ ...item } as any); setModalMode('edit'); setIsModalOpen(true); }} className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 bg-white/90 backdrop-blur-sm shadow-sm" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                                   <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 bg-white/90 backdrop-blur-sm shadow-sm" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                           </div>
                        );
                     })}

                     {/* Add New Card */}
                     {canAddItem() && (
                        <button 
                          onClick={() => { setModalMode('create'); resetForm(); setIsModalOpen(true); }} 
                          className="border-4 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all gap-3 h-full min-h-[5.5rem] group"
                        >
                           <div className="p-2 bg-slate-100 rounded-full group-hover:bg-white group-hover:shadow-md transition-all group-hover:scale-110">
                              <Plus className="w-6 h-6" strokeWidth={3} />
                           </div>
                           <span className="text-xs font-black uppercase tracking-wider">Create New</span>
                        </button>
                     )}
                  </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                     <Wrench className="w-20 h-20 mb-6 opacity-20 animate-pulse" />
                     <h2 className="text-2xl font-black text-slate-400">Coming Soon!</h2>
                  </div>
                )}
              </main>
            </div>
            
            {/* Bulk Actions Bar */}
            {isSelectionMode && selectedItems.size > 0 && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-6 animate-slide-up border border-white/10">
                 <span className="font-bold text-sm">{selectedItems.size} selected</span>
                 <div className="h-6 w-px bg-white/20"></div>
                 <button onClick={handleBulkDelete} className="flex items-center gap-2 hover:text-rose-300 text-sm font-bold transition-colors hover:scale-105 active:scale-95"><Trash2 className="w-5 h-5" /> Delete</button>
                 <button onClick={() => { setIsSelectionMode(false); setSelectedItems(new Set()); }} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reused Modal (Bubbly Styles) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border-4 border-white/50 ring-4 ring-slate-900/5 transform transition-all scale-100">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-800 tracking-tight">{modalMode === 'create' ? 'Create New Item' : 'Edit Item'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors"><X className="w-6 h-6" strokeWidth={3} /></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                 {/* Full Form Fields */}
                 <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wide mb-2 pl-1">Title</label>
                        <input autoFocus required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="Enter title..." />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wide mb-2 pl-1">Description</label>
                        <textarea rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-slate-800 font-bold placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" placeholder="Short description..." />
                    </div>

                    {/* Type Toggle */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        {['folder', 'file'].map((t) => (
                            <button key={t} onClick={() => setFormData({ ...formData, type: t as any })} className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-wide transition-all ${formData.type === t ? 'bg-white text-indigo-600 shadow-md scale-100' : 'text-slate-400 hover:text-slate-600'}`}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* File Upload (if type is file) */}
                    {formData.type === 'file' && (
                        <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-3xl p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-indigo-50/30 transition-colors relative cursor-pointer group">
                            <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform mb-2">
                                <Upload className="w-6 h-6 text-indigo-500" />
                            </div>
                            <span className="text-xs font-bold text-slate-500">{formData.files && formData.files.length > 0 ? (formData.files.length > 1 ? `${formData.files.length} files selected` : formData.fileName) : "Drag files or click to upload"}</span>
                        </div>
                    )}

                    {/* Tags */}
                    {(user.role === UserRole.ADMIN || user.role === UserRole.TEACHER) && (
                        <div>
                             <label className="block text-xs font-black text-slate-400 uppercase tracking-wide mb-2 pl-1">Tags</label>
                             <div className="flex flex-wrap gap-2 mb-2">
                                {(formData.tags || []).map(tag => (
                                    <span key={tag} className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${getTagStyle(tag)}`}>
                                        {tag} <button onClick={() => removeTag(tag)} className="hover:text-current opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                             </div>
                             <div className="flex gap-2">
                                <select onChange={e => { if(e.target.value && !formData.tags.includes(e.target.value)) setFormData(prev => ({ ...prev, tags: [...prev.tags, e.target.value] })) }} className="px-4 py-2 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-100">
                                   <option value="">Select preset...</option>
                                   {PREDEFINED_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input value={customTagInput} onChange={e => setCustomTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCustomTagAdd()} placeholder="Custom tag..." className="flex-1 px-4 py-2 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-100" />
                                <button onClick={handleCustomTagAdd} className="p-2 bg-slate-100 hover:bg-indigo-100 text-indigo-600 rounded-xl"><Plus className="w-4 h-4" /></button>
                             </div>
                        </div>
                    )}

                    {/* Appearance */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                             <label className="block text-xs font-black text-slate-400 uppercase tracking-wide mb-2 pl-1">Color Theme</label>
                             <div className="flex gap-1.5 flex-wrap">
                                 {COLOR_OPTIONS.map(c => (
                                     <button key={c.id} onClick={() => setFormData({ ...formData, color: c.id })} className={`w-8 h-8 rounded-full border-2 transition-all ${c.bg} ${formData.color === c.id ? `border-indigo-600 scale-110 shadow-sm` : 'border-transparent hover:scale-105'}`} title={c.label} />
                                 ))}
                             </div>
                        </div>
                        <div className="flex-1">
                             <label className="block text-xs font-black text-slate-400 uppercase tracking-wide mb-2 pl-1">Cover Image</label>
                             <div className="relative">
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className={`w-full h-10 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors ${formData.coverImage ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'}`}>
                                   <ImageIcon className="w-4 h-4" /> {formData.coverImage ? 'Change' : 'Upload'}
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="pt-2">
                        <label className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
                            <input type="checkbox" checked={formData.isHiddenForStudents} onChange={e => setFormData({ ...formData, isHiddenForStudents: e.target.checked })} className="w-5 h-5 rounded-md border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 group-hover:border-indigo-400" />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-700 flex items-center gap-2"><EyeOff className="w-4 h-4" /> Hide from Students</span>
                        </label>
                    </div>
                 </div>
                 
                 <button onClick={handleFormSubmit} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-base shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">
                    {modalMode === 'create' ? <><Plus className="w-5 h-5" strokeWidth={3} /> Create Item</> : <><Save className="w-5 h-5" strokeWidth={3} /> Save Changes</>}
                 </button>
              </div>
           </div>
        </div>
      )}
      
      <GeminiAssistant currentContext={activeBook ? `Book: ${activeBook.title}` : currentPath.length > 0 ? `Folder: ${currentPath[currentPath.length-1].title}` : activeModule} />
    </div>
  );
};

export default App;