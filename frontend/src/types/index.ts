export type UserRole =
  | 'student'
  | 'teacher'
  | 'principal'
  | 'admin'
  | 'hr'
  | 'finance'
  | 'admission'
  | 'organization'
  | 'public';

export type AssociationStatus =
  | 'not_connected'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'info_required';

export interface User {
  id: string;
  publicId: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  avatar?: string;
  headline?: string;
  institutionId?: string;
  institutionName?: string;
  department?: string;
  course?: string;
  term?: number;
  location?: string;
  verified?: boolean;
  associationStatus?: AssociationStatus;
}

export interface StudentProfile {
  userId: string;
  bio: string;
  skills: string[];
  interests: string[];
  cgpa: number;
  termGpa: number;
  attendance: number;
  links: { github?: string; linkedin?: string; website?: string };
  achievements: { title: string; issuer: string; year: string }[];
  certifications: { title: string; issuer: string; year: string }[];
  experience: { role: string; org: string; period: string; summary: string }[];
  education: { degree: string; institution: string; period: string }[];
  counters: { posts: number; connections: number; following: number; projects: number };
}

export interface Institution {
  id: string;
  publicId: string;
  slug: string;
  name: string;
  type: 'School' | 'College' | 'University';
  city: string;
  established: number;
  description: string;
  website: string;
  verified: boolean;
  followers: number;
  students: number;
  departments: string[];
  programs: string[];
  logoColor: string;
}

export interface Organization {
  id: string;
  publicId: string;
  slug: string;
  name: string;
  type: 'Company' | 'Club' | 'NGO' | 'Community';
  industry: string;
  location: string;
  description: string;
  verified: boolean;
  followers: number;
  logoColor: string;
}

export type PostCategory =
  | 'General' | 'Announcement' | 'Achievement' | 'Academic' | 'Project' | 'Research'
  | 'Event' | 'Hackathon' | 'Internship' | 'Job' | 'Freelance' | 'Competition' | 'Workshop';

export type PostVisibility = 'Public' | 'Followers' | 'Institution' | 'Department' | 'Class';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorHandle: string;
  authorVerified?: boolean;
  category: PostCategory;
  visibility: PostVisibility;
  content: string;
  tags: string[];
  createdAt: string;
  likes: number;
  comments: Comment[];
  reposts: number;
  liked?: boolean;
  saved?: boolean;
  linkedEntity?: { kind: 'project' | 'hackathon' | 'opportunity'; id: string; label: string };
}

export interface Comment {
  id: string;
  authorName: string;
  authorHandle: string;
  content: string;
  createdAt: string;
}

export type ProjectStatus = 'Idea' | 'Recruiting' | 'In Development' | 'Completed' | 'Archived';

export interface Project {
  id: string;
  title: string;
  summary: string;
  description: string;
  status: ProjectStatus;
  stack: string[];
  tags: string[];
  institution: string;
  creatorId: string;
  creatorName: string;
  team: { name: string; role: string }[];
  teamSize: number;
  openRoles: string[];
  repoUrl?: string;
  demoUrl?: string;
  updates: { date: string; text: string }[];
  requested?: boolean;
}

export type OpportunityType =
  | 'Internship' | 'Job' | 'Freelance' | 'Workshop' | 'Competition' | 'Scholarship' | 'Research';

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  organizationId: string;
  type: OpportunityType;
  mode: 'Remote' | 'On-site' | 'Hybrid';
  location: string;
  duration: string;
  stipend: string;
  paid: boolean;
  experience: 'Fresher' | '0-1 years' | '1-3 years';
  skills: string[];
  deadline: string;
  overview: string;
  requirements: string[];
  eligibility: string[];
  saved?: boolean;
  applied?: boolean;
}

export interface Hackathon {
  id: string;
  title: string;
  organizer: string;
  organizerId: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  host: 'School' | 'Corporate';
  startDate: string;
  endDate: string;
  location: string;
  prize: string;
  teamSize: string;
  tags: string[];
  registrationOpen: boolean;
  status: 'Upcoming' | 'Registration Open' | 'Completed';
  participants: number;
  about: string;
  tracks: string[];
  timeline: { label: string; date: string }[];
  prizes: { place: string; reward: string }[];
  rules: string[];
  judging: string[];
  sponsors: string[];
  registered?: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  faculty: string;
  periods: number;
  room: string;
  attendance: { attended: number; total: number };
  marks: { internal: number; external: number; assignment: number; practical: number; grade: string };
  materials: { title: string; type: string; date: string }[];
  assignments: { title: string; due: string; status: 'Pending' | 'Submitted' | 'Graded'; score?: string }[];
  announcements: { title: string; body: string; date: string }[];
  classmates: number;
}

export interface ClassSession {
  id: string;
  subject: string;
  faculty: string;
  room: string;
  start: string;
  end: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
  online?: boolean;
}

export interface AttendanceDay {
  date: string;
  status: 'present' | 'absent' | 'holiday' | 'late';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: 'Class' | 'Exam' | 'Assignment' | 'Event' | 'Hackathon' | 'Deadline' | 'Meeting';
}

export interface Conversation {
  id: string;
  name: string;
  kind: 'direct' | 'group' | 'class' | 'organization';
  handle: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
  online?: boolean;
  messages: Message[];
}

export interface Message {
  id: string;
  senderName: string;
  self?: boolean;
  content: string;
  at: string;
}

export type NotificationCategory = 'Academic' | 'Social' | 'Opportunities' | 'Requests' | 'Administrative';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  at: string;
  read: boolean;
  action?: { label: string; to: string };
}

export interface AdmissionApplication {
  id: string;
  applicant: string;
  program: string;
  appliedOn: string;
  status: 'Applications' | 'Approved' | 'Rejected' | 'Waitlisted' | 'Enrolled';
  reviewer: string;
  email: string;
  phone: string;
  score: string;
  notes: string;
  documents: string[];
}

export interface Employee {
  id: string;
  publicId: string;
  name: string;
  role: string;
  department: string;
  kind: 'Faculty' | 'Non-teaching';
  joined: string;
  status: 'Active' | 'On leave' | 'Probation';
  email: string;
  attendance: number;
}

export interface Transaction {
  id: string;
  label: string;
  party: string;
  category: 'Fees' | 'Payroll' | 'Expense' | 'Grant';
  amount: number;
  direction: 'in' | 'out';
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}
