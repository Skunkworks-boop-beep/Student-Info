export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  uni_xp: number;
  badges: string[];
  created_at: string;
  streak: number;
  /** Set when signed in from stored accounts. */
  username?: string;
  /** From signup; shown in shell and dashboards. */
  university_name?: string;
  /** When true, UI shows `username` instead of first name (sidebar, dashboard, leaderboard). */
  anonymous_mode?: boolean;
}

export interface Complaint {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  category: Category;
  priority: 'Low' | 'Medium' | 'High';
  status: Status;
  location: string;
  is_anonymous: boolean;
  upvotes: number;
  upvoted_by_me: boolean;
  created_at: string;
  updated_at: string;
  comments: Comment[];
  status_log: StatusLog[];
  rating?: number;
}

export interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  parent_id: string | null;
  created_at: string;
}

export interface StatusLog {
  old_status: Status;
  new_status: Status;
  changed_by: string;
  note: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'status_change' | 'new_comment' | 'mention' | 'complaint_resolved' | 'system_alert';
  message: string;
  is_read: boolean;
  complaint_id?: string;
  created_at: string;
}

export interface XPTransaction {
  id: string;
  action_type: string;
  points: number;
  created_at: string;
}

export type Status = 'Pending' | 'Reviewed' | 'Processing' | 'Resolved';
export type Category = 'Academic' | 'Administrative' | 'Facilities' | 'IT' | 'Transport' | 'Safety' | 'Other';

export const CATEGORIES: Category[] = ['Academic', 'Administrative', 'Facilities', 'IT', 'Transport', 'Safety', 'Other'];

export const STATUS_COLORS: Record<Status, { bg: string; text: string; hex: string }> = {
  Pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', hex: '#D97706' },
  Reviewed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', hex: '#2563EB' },
  Processing: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', hex: '#7C3AED' },
  Resolved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', hex: '#16A34A' },
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const currentUser: User = {
  id: 'u1',
  name: 'Nora',
  email: 'nora@university.edu',
  role: 'student',
  uni_xp: 385,
  badges: ['Early Adopter', 'Problem Solver', '7-Day Streak'],
  created_at: '2025-09-01',
  streak: 7,
  university_name: 'Sample University',
};

export const adminUser: User = {
  id: 'a1',
  name: 'Damilola',
  email: 'admin@university.edu',
  role: 'admin',
  uni_xp: 0,
  badges: [],
  created_at: '2025-01-15',
  streak: 0,
  university_name: 'Sample University',
};

export const leaderboard: User[] = [
  { id: 'u10', name: 'Erik', email: 'erik@university.edu', role: 'student', uni_xp: 720, badges: ['Top Contributor'], created_at: '2024-08-12', streak: 14 },
  { id: 'u11', name: 'Aseel', email: 'aseel@university.edu', role: 'student', uni_xp: 655, badges: ['Helpful Peer'], created_at: '2024-09-03', streak: 10 },
  { id: 'u12', name: 'Zanela', email: 'zanela@university.edu', role: 'student', uni_xp: 510, badges: ['Active Reporter'], created_at: '2025-01-20', streak: 5 },
  { id: 'u1', name: 'Nora', email: 'nora@university.edu', role: 'student', uni_xp: 385, badges: ['Early Adopter'], created_at: '2025-09-01', streak: 7 },
  { id: 'u13', name: 'Abilio', email: 'abilio@university.edu', role: 'student', uni_xp: 340, badges: [], created_at: '2025-02-14', streak: 3 },
  { id: 'u14', name: 'Lina', email: 'lina@university.edu', role: 'student', uni_xp: 290, badges: [], created_at: '2025-11-01', streak: 2 },
  { id: 'u15', name: 'Mehmet', email: 'mehmet@university.edu', role: 'student', uni_xp: 245, badges: [], created_at: '2026-01-08', streak: 0 },
  { id: 'u16', name: 'Sara', email: 'sara@university.edu', role: 'student', uni_xp: 210, badges: [], created_at: '2026-02-22', streak: 1 },
];

export const complaints: Complaint[] = [
  {
    id: 'c1', user_id: 'u1', user_name: 'Nora',
    title: 'Library AC not working on 3rd floor',
    description: 'The air conditioning on the 3rd floor of the main library has been broken for over a week. It is unbearable during afternoon study sessions, especially between 1-5 PM. Several students have reported this issue verbally but nothing has been done.',
    category: 'Facilities', priority: 'High', status: 'Processing',
    location: 'Main Library - 3rd Floor', is_anonymous: false, upvotes: 24, upvoted_by_me: false,
    created_at: '2026-03-20T10:30:00Z', updated_at: '2026-03-23T14:00:00Z',
    comments: [
      { id: 'cm1', user_id: 'u11', user_name: 'Aseel', text: 'I can confirm this. It has been terrible all week.', parent_id: null, created_at: '2026-03-20T12:00:00Z' },
      { id: 'cm2', user_id: 'a1', user_name: 'Campus admin', text: 'We have contacted the maintenance team. A technician is scheduled for Monday.', parent_id: null, created_at: '2026-03-21T09:00:00Z' },
      { id: 'cm3', user_id: 'u1', user_name: 'Nora', text: 'Thank you for the update!', parent_id: 'cm2', created_at: '2026-03-21T09:30:00Z' },
    ],
    status_log: [
      { old_status: 'Pending', new_status: 'Reviewed', changed_by: 'Admin', note: 'Acknowledged', timestamp: '2026-03-21T08:00:00Z' },
      { old_status: 'Reviewed', new_status: 'Processing', changed_by: 'Admin', note: 'Technician scheduled', timestamp: '2026-03-23T14:00:00Z' },
    ],
  },
  {
    id: 'c2', user_id: 'u10', user_name: 'Erik',
    title: 'WiFi extremely slow in Engineering Building',
    description: 'The WiFi in the Engineering Building (Block B) drops constantly and speed tests show < 2 Mbps. This makes it impossible to attend online lectures or download course materials.',
    category: 'IT', priority: 'High', status: 'Reviewed',
    location: 'Engineering Building - Block B', is_anonymous: false, upvotes: 42, upvoted_by_me: true,
    created_at: '2026-03-18T08:15:00Z', updated_at: '2026-03-22T11:00:00Z',
    comments: [
      { id: 'cm4', user_id: 'u12', user_name: 'Zanela', text: 'Same issue in Block C as well.', parent_id: null, created_at: '2026-03-18T10:00:00Z' },
    ],
    status_log: [
      { old_status: 'Pending', new_status: 'Reviewed', changed_by: 'Admin', note: 'IT team notified', timestamp: '2026-03-22T11:00:00Z' },
    ],
  },
  {
    id: 'c3', user_id: 'u13', user_name: 'Abilio',
    title: 'Cafeteria food quality has declined',
    description: 'Over the past month, the food quality at the main cafeteria has noticeably declined. Meals are often cold, portions are smaller, and vegetarian options are almost non-existent.',
    category: 'Facilities', priority: 'Medium', status: 'Pending',
    location: 'Main Cafeteria', is_anonymous: false, upvotes: 18, upvoted_by_me: false,
    created_at: '2026-03-24T13:00:00Z', updated_at: '2026-03-24T13:00:00Z',
    comments: [],
    status_log: [],
  },
  {
    id: 'c4', user_id: 'u14', user_name: 'Anonymous',
    title: 'Professor consistently late to lectures',
    description: 'A certain professor in the Business department is consistently 15-20 minutes late to scheduled 9 AM lectures. This has happened at least 8 times this semester.',
    category: 'Academic', priority: 'Medium', status: 'Reviewed',
    location: 'Business Faculty - Room 201', is_anonymous: true, upvotes: 31, upvoted_by_me: false,
    created_at: '2026-03-15T16:00:00Z', updated_at: '2026-03-20T10:00:00Z',
    comments: [
      { id: 'cm5', user_id: 'a1', user_name: 'Campus admin', text: 'This has been escalated to the department head. Thank you for bringing this to our attention.', parent_id: null, created_at: '2026-03-20T10:00:00Z' },
    ],
    status_log: [
      { old_status: 'Pending', new_status: 'Reviewed', changed_by: 'Admin', note: 'Escalated to department', timestamp: '2026-03-20T10:00:00Z' },
    ],
  },
  {
    id: 'c5', user_id: 'u11', user_name: 'Aseel',
    title: 'Broken elevator in Dormitory A',
    description: 'The elevator in Dormitory A has been out of service for three days. Students on upper floors (5-8) are forced to use stairs, which is especially difficult for students with disabilities.',
    category: 'Safety', priority: 'High', status: 'Resolved',
    location: 'Dormitory A', is_anonymous: false, upvotes: 56, upvoted_by_me: true,
    created_at: '2026-03-10T09:00:00Z', updated_at: '2026-03-14T16:00:00Z',
    comments: [
      { id: 'cm6', user_id: 'a1', user_name: 'Campus admin', text: 'Elevator has been repaired and is now operational. Thank you for your patience.', parent_id: null, created_at: '2026-03-14T16:00:00Z' },
    ],
    status_log: [
      { old_status: 'Pending', new_status: 'Reviewed', changed_by: 'Admin', note: 'Urgent - maintenance called', timestamp: '2026-03-10T11:00:00Z' },
      { old_status: 'Reviewed', new_status: 'Processing', changed_by: 'Admin', note: 'Repair team on site', timestamp: '2026-03-12T08:00:00Z' },
      { old_status: 'Processing', new_status: 'Resolved', changed_by: 'Admin', note: 'Elevator repaired', timestamp: '2026-03-14T16:00:00Z' },
    ],
    rating: 5,
  },
  {
    id: 'c6', user_id: 'u15', user_name: 'Mehmet',
    title: 'Bus schedule not accurate on app',
    description: 'The shuttle bus schedule shown on the university app does not match actual departure times. Buses frequently leave 5-10 minutes earlier than posted.',
    category: 'Transport', priority: 'Low', status: 'Pending',
    location: 'Main Campus Bus Stop', is_anonymous: false, upvotes: 12, upvoted_by_me: false,
    created_at: '2026-03-25T07:30:00Z', updated_at: '2026-03-25T07:30:00Z',
    comments: [],
    status_log: [],
  },
  {
    id: 'c7', user_id: 'u16', user_name: 'Sara',
    title: 'No printer available in Computer Lab 2',
    description: 'The only printer in Computer Lab 2 (Block D) has been out of ink/paper for the past 2 weeks. Students need to walk to Block A to print, which wastes valuable time.',
    category: 'IT', priority: 'Medium', status: 'Processing',
    location: 'Computer Lab 2 - Block D', is_anonymous: false, upvotes: 8, upvoted_by_me: false,
    created_at: '2026-03-22T14:00:00Z', updated_at: '2026-03-26T09:00:00Z',
    comments: [],
    status_log: [
      { old_status: 'Pending', new_status: 'Reviewed', changed_by: 'Admin', note: 'Supplies ordered', timestamp: '2026-03-24T10:00:00Z' },
      { old_status: 'Reviewed', new_status: 'Processing', changed_by: 'Admin', note: 'Awaiting delivery', timestamp: '2026-03-26T09:00:00Z' },
    ],
  },
];

export const notifications: Notification[] = [
  { id: 'n1', type: 'status_change', message: 'Your complaint "Library AC not working" moved to Processing', is_read: false, complaint_id: 'c1', created_at: '2026-03-23T14:00:00Z' },
  { id: 'n2', type: 'new_comment', message: 'Admin replied to your complaint about library AC', is_read: false, complaint_id: 'c1', created_at: '2026-03-21T09:00:00Z' },
  { id: 'n3', type: 'system_alert', message: 'You earned +25 XP for your 7-day login streak!', is_read: true, created_at: '2026-03-20T00:00:00Z' },
  { id: 'n4', type: 'complaint_resolved', message: 'Complaint "Broken elevator in Dormitory A" has been resolved!', is_read: true, complaint_id: 'c5', created_at: '2026-03-14T16:00:00Z' },
  { id: 'n5', type: 'mention', message: 'You were mentioned in a comment on WiFi complaint', is_read: true, complaint_id: 'c2', created_at: '2026-03-19T15:00:00Z' },
];

export const xpActions = [
  { action: 'Submit a complaint', xp: '+10 XP' },
  { action: 'Comment on a complaint', xp: '+5 XP' },
  { action: 'Complaint resolved (submitter)', xp: '+20 XP' },
  { action: 'Peer solution marked helpful', xp: '+15 XP' },
  { action: 'Donate a Support Token', xp: '+8 XP' },
  { action: '7-day login streak', xp: '+25 XP' },
  { action: 'Rate a resolved complaint', xp: '+5 XP' },
];

export const analyticsData = {
  totalComplaints: 147,
  openComplaints: 38,
  avgResolutionDays: 4.2,
  satisfactionScore: 4.1,
  complaintsOverTime: [
    { month: 'Oct', count: 18 },
    { month: 'Nov', count: 25 },
    { month: 'Dec', count: 12 },
    { month: 'Jan', count: 30 },
    { month: 'Feb', count: 28 },
    { month: 'Mar', count: 34 },
  ],
  byCategory: [
    { name: 'Facilities', value: 42 },
    { name: 'IT', value: 35 },
    { name: 'Academic', value: 28 },
    { name: 'Transport', value: 18 },
    { name: 'Safety', value: 14 },
    { name: 'Administrative', value: 10 },
  ],
  byStatus: [
    { name: 'Pending', value: 15 },
    { name: 'Reviewed', value: 10 },
    { name: 'Processing', value: 13 },
    { name: 'Resolved', value: 109 },
  ],
};
