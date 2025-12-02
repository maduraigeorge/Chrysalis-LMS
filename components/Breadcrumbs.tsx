import React from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import { BreadcrumbItem } from '../types';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (index: number) => void;
  variant?: 'light' | 'dark';
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate, variant = 'light' }) => {
  const canGoBack = items.length > 1;

  const handleBack = () => {
    if (canGoBack) {
      onNavigate(items.length - 2);
    }
  };

  // Logic to collapse breadcrumbs
  // items[0] is the Root (e.g., Library/Resources).
  // We want to show Root + Ellipsis + Last 2 items (Parent & Current)
  const rootItem = items[0];
  const nonRootItems = items.slice(1);
  const maxVisible = 2;
  const shouldCollapse = nonRootItems.length > maxVisible;
  
  const visibleItems = shouldCollapse 
    ? nonRootItems.slice(-maxVisible) 
    : nonRootItems;

  const isDark = variant === 'dark';

  return (
    <nav className="flex items-center gap-1.5 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
      {/* Back Button */}
      {canGoBack && (
        <button 
          onClick={handleBack}
          className={`
            mr-1 p-1.5 rounded-full shadow-sm hover:shadow-md transition-all flex-shrink-0
            ${isDark 
              ? 'bg-indigo-800 text-indigo-300 hover:text-white hover:bg-indigo-700' 
              : 'bg-white text-slate-400 hover:text-indigo-600'}
          `}
          title="Go Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {/* Root Button (e.g. Library) */}
      <button 
        onClick={() => onNavigate(0)}
        className={`
          flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all flex-shrink-0 font-bold
          ${items.length === 1 
            ? (isDark ? 'bg-indigo-800 text-white shadow-sm' : 'bg-white text-indigo-700 shadow-sm')
            : (isDark ? 'text-indigo-300 hover:bg-indigo-800 hover:text-white hover:shadow-sm' : 'text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm')}
        `}
      >
        <Home className="w-4 h-4" />
        <span className={items.length > 1 ? 'hidden sm:inline' : 'inline'}>
          {rootItem?.label || 'Home'}
        </span>
      </button>

      {/* Ellipsis for collapsed items */}
      {shouldCollapse && (
        <>
          <span className={`font-light ${isDark ? 'text-indigo-500' : 'text-slate-300'}`}>/</span>
          <span className={`px-1 select-none ${isDark ? 'text-indigo-400' : 'text-slate-400'}`}>...</span>
        </>
      )}
      
      {/* Visible Items */}
      {visibleItems.map((item) => {
        // Find original index to ensure navigation works correctly
        const originalIndex = items.findIndex(i => i.id === item.id);
        const isLast = originalIndex === items.length - 1;

        return (
          <React.Fragment key={item.id}>
            <span className={`font-light ${isDark ? 'text-indigo-500' : 'text-slate-300'}`}>/</span>
            <button
              onClick={() => item.clickable && onNavigate(originalIndex)}
              disabled={!item.clickable || isLast}
              className={`
                px-2.5 py-1.5 rounded-xl transition-all truncate max-w-[120px] sm:max-w-[180px] font-bold text-sm
                ${isLast 
                  ? (isDark ? 'text-indigo-900 cursor-default bg-white/90 shadow-sm' : 'text-indigo-900 cursor-default bg-white/60 shadow-sm')
                  : (isDark ? 'text-indigo-300 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60')}
              `}
            >
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};