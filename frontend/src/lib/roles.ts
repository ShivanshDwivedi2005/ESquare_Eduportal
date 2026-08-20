import {
  BarChart3, BookOpen, Briefcase, Building2, CalendarDays, ClipboardList, Compass, CreditCard,
  FileBarChart, FolderKanban, GraduationCap, LayoutDashboard, MessageSquare, Newspaper, Rss,
  Settings, Trophy, UserCheck, Users, Wallet, School, BellRing, Layers,
} from 'lucide-react';
import type { UserRole } from '@/types';

export type NavItem = { title: string; url: string; icon: React.ElementType; end?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

const workspace = (extra: NavItem[] = []): NavGroup => ({
  label: 'Workspace',
  items: [
    { title: 'Dashboard', url: '/app/dashboard', icon: LayoutDashboard, end: true },
    { title: 'Feed', url: '/app/feed', icon: Rss },
    ...extra,
  ],
});

const network: NavGroup = {
  label: 'Network',
  items: [
    { title: 'Explore', url: '/app/explore', icon: Compass },
    { title: 'Projects', url: '/app/projects', icon: FolderKanban },
    { title: 'Opportunities', url: '/app/opportunities', icon: Briefcase },
    { title: 'Hackathons', url: '/app/hackathons', icon: Trophy },
  ],
};

const personal: NavGroup = {
  label: 'You',
  items: [
    { title: 'Messages', url: '/app/messages', icon: MessageSquare },
    { title: 'Notifications', url: '/app/notifications', icon: BellRing },
    { title: 'Profile', url: '/app/profile', icon: UserCheck },
    { title: 'Settings', url: '/app/settings', icon: Settings },
  ],
};

const academics: NavGroup = {
  label: 'Academics',
  items: [
    { title: 'My Classes', url: '/app/classes', icon: BookOpen },
    { title: 'Attendance', url: '/app/attendance', icon: ClipboardList },
    { title: 'Marks', url: '/app/marks', icon: FileBarChart },
    { title: 'Calendar', url: '/app/calendar', icon: CalendarDays },
  ],
};

const teaching: NavGroup = {
  label: 'Teaching',
  items: [
    { title: 'My Classes', url: '/app/classes', icon: BookOpen },
    { title: 'Attendance', url: '/app/attendance', icon: ClipboardList },
    { title: 'Marks', url: '/app/marks', icon: FileBarChart },
    { title: 'Calendar', url: '/app/calendar', icon: CalendarDays },
  ],
};

const institutionGroup = (items: NavItem[]): NavGroup => ({ label: 'Institution', items });

const adminItems: NavItem[] = [
  { title: 'Overview', url: '/admin/dashboard', icon: BarChart3, end: true },
  { title: 'Students', url: '/admin/students', icon: GraduationCap },
  { title: 'Teachers', url: '/admin/teachers', icon: Users },
  { title: 'Departments', url: '/admin/departments', icon: Layers },
  { title: 'Admissions', url: '/admin/admissions', icon: School },
  { title: 'HR', url: '/admin/hr', icon: Building2 },
  { title: 'Finance', url: '/admin/finance', icon: Wallet },
  { title: 'Reports', url: '/admin/reports', icon: FileBarChart },
];

export const navByRole: Record<UserRole, NavGroup[]> = {
  student: [workspace(), academics, network, personal],
  teacher: [workspace(), teaching, { ...network, items: network.items.slice(0, 3) }, personal],
  principal: [
    workspace(),
    institutionGroup([
      { title: 'Overview', url: '/admin/dashboard', icon: BarChart3, end: true },
      { title: 'Teachers', url: '/admin/teachers', icon: Users },
      { title: 'Departments', url: '/admin/departments', icon: Layers },
      { title: 'Reports', url: '/admin/reports', icon: FileBarChart },
    ]),
    { label: 'Academics', items: [{ title: 'Calendar', url: '/app/calendar', icon: CalendarDays }] },
    personal,
  ],
  admin: [workspace(), institutionGroup(adminItems), personal],
  hr: [
    workspace(),
    institutionGroup([
      { title: 'HR Overview', url: '/admin/hr', icon: Building2, end: true },
      { title: 'Teachers', url: '/admin/teachers', icon: Users },
      { title: 'Departments', url: '/admin/departments', icon: Layers },
    ]),
    personal,
  ],
  finance: [
    workspace(),
    institutionGroup([
      { title: 'Finance', url: '/admin/finance', icon: Wallet, end: true },
      { title: 'Transactions', url: '/admin/finance', icon: CreditCard },
      { title: 'Reports', url: '/admin/reports', icon: FileBarChart },
    ]),
    personal,
  ],
  admission: [
    workspace(),
    institutionGroup([
      { title: 'Admissions', url: '/admin/admissions', icon: School, end: true },
      { title: 'Students', url: '/admin/students', icon: GraduationCap },
    ]),
    personal,
  ],
  organization: [
    { label: 'Workspace', items: [
      { title: 'Dashboard', url: '/organization/dashboard', icon: LayoutDashboard, end: true },
      { title: 'Feed', url: '/app/feed', icon: Rss },
      { title: 'Posts', url: '/organization/posts', icon: Newspaper },
    ] },
    { label: 'Programs', items: [
      { title: 'Opportunities', url: '/organization/opportunities', icon: Briefcase },
      { title: 'Hackathons', url: '/app/hackathons', icon: Trophy },
      { title: 'Applications', url: '/organization/applications', icon: ClipboardList },
    ] },
    personal,
  ],
  public: [
    { label: 'Discover', items: [
      { title: 'Feed', url: '/app/feed', icon: Rss, end: true },
      { title: 'Explore', url: '/app/explore', icon: Compass },
      { title: 'Opportunities', url: '/app/opportunities', icon: Briefcase },
      { title: 'Hackathons', url: '/app/hackathons', icon: Trophy },
    ] },
    { label: 'You', items: [
      { title: 'Notifications', url: '/app/notifications', icon: BellRing },
      { title: 'Profile', url: '/app/profile', icon: UserCheck },
      { title: 'Settings', url: '/app/settings', icon: Settings },
    ] },
  ],
};

export const roleLabel: Record<UserRole, string> = {
  student: 'Student', teacher: 'Teacher', principal: 'Principal', admin: 'Institution Admin',
  hr: 'HR', finance: 'Finance', admission: 'Admissions', organization: 'Organization', public: 'Public',
};

export const roleHome: Record<UserRole, string> = {
  student: '/app/dashboard', teacher: '/app/dashboard', principal: '/admin/dashboard',
  admin: '/admin/dashboard', hr: '/admin/hr', finance: '/admin/finance',
  admission: '/admin/admissions', organization: '/organization/dashboard', public: '/app/feed',
};

export const mobileNavByRole: Record<UserRole, NavItem[]> = Object.fromEntries(
  (Object.keys(navByRole) as UserRole[]).map((role) => {
    const flat = navByRole[role].flatMap((g) => g.items);
    const picks = [
      flat.find((i) => i.url.includes('dashboard')) ?? flat[0],
      flat.find((i) => i.url.endsWith('/feed')),
      flat.find((i) => i.url.endsWith('/explore')) ?? flat.find((i) => i.url.endsWith('/opportunities')),
      flat.find((i) => i.url.endsWith('/messages')) ?? flat.find((i) => i.url.endsWith('/notifications')),
      flat.find((i) => i.url.endsWith('/profile')),
    ].filter(Boolean) as NavItem[];
    return [role, picks];
  }),
) as Record<UserRole, NavItem[]>;
