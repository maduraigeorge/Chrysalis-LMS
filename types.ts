export enum UserRole {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  ADMIN = 'Admin'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  subscribedTags?: string[]; // e.g. ['Thinkroom', '2025-26']
  gradeId?: string; // Mapped grade for students (e.g., 'g3')
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
}

export interface BreadcrumbItem {
  label: string;
  id: string;
  clickable: boolean;
}

export interface ModuleData {
  id: string;
  title: string;
  description: string;
  items: ModuleData[]; // Recursive for folder structure
  type: 'folder' | 'file' | 'course';
  tags?: string[];
  createdBy?: string; // ID of the user who created this item
  isHiddenForStudents?: boolean;
  coverImage?: string; // URL for cover image
  color?: string; // Color theme key (e.g. 'blue', 'red')
  fileUrl?: string; // Base64 data or URL for the uploaded file content
  fileName?: string; // Original filename
}