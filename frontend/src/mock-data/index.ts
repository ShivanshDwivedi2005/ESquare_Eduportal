import type {
  AdmissionApplication, AppNotification, AttendanceDay, CalendarEvent, ClassSession, Conversation,
  Employee, Hackathon, Institution, Opportunity, Organization, Post, Project, StudentProfile,
  Subject, Transaction, User, UserRole,
} from '@/types';

export const institutions: Institution[] = [
  {
    id: 'inst-1', publicId: 'ESQ-SCH-10234', slug: 'greenwood-international-school',
    name: 'Greenwood International School', type: 'School', city: 'Pune, Maharashtra', established: 1998,
    description: 'A CBSE senior secondary school focused on activity-based learning, STEM labs and student-led clubs from Grade I to XII.',
    website: 'greenwoodschool.edu.in', verified: true, followers: 18420, students: 6200,
    departments: ['Primary', 'Middle School', 'Science', 'Commerce', 'Humanities', 'Sports & Arts'],
    programs: ['Grades I–V', 'Grades VI–VIII', 'Grades IX–X', 'Grades XI–XII'], logoColor: '252 72% 56%',
  },
  {
    id: 'inst-2', publicId: 'ESQ-SCH-10871', slug: 'riverdale-public-school',
    name: 'Riverdale Public School', type: 'School', city: 'Bengaluru, Karnataka', established: 1984,
    description: 'A co-educational day school known for its science labs, arts programme and inter-school sports record.',
    website: 'riverdale.edu.in', verified: true, followers: 32110, students: 14300,
    departments: ['Primary', 'Middle School', 'Senior Secondary'],
    programs: ['Grades I–XII'], logoColor: '214 90% 52%',
  },
  {
    id: 'inst-3', publicId: 'ESQ-SCH-10442', slug: 'greenfield-public-school',
    name: 'Greenfield Public School', type: 'School', city: 'Indore, Madhya Pradesh', established: 2004,
    description: 'A CBSE-affiliated senior secondary school emphasising STEM labs and community projects.',
    website: 'greenfield.edu.in', verified: true, followers: 5240, students: 2100,
    departments: ['Science', 'Commerce', 'Humanities'], programs: ['Grades I–XII'], logoColor: '158 64% 38%',
  },
];

export const organizations: Organization[] = [
  { id: 'org-1', publicId: 'ESQ-ORG-20114', slug: 'nimbus-labs', name: 'Nimbus Labs', type: 'Company', industry: 'Cloud & AI Infrastructure', location: 'Bengaluru', description: 'We build developer tooling for distributed systems and hire student interns every term.', verified: true, followers: 9120, logoColor: '252 72% 56%' },
  { id: 'org-2', publicId: 'ESQ-ORG-20233', slug: 'codecraft-community', name: 'CodeCraft Community', type: 'Community', industry: 'Student Developer Community', location: 'Pan-India', description: 'A student-run community organising hackathons, workshops and open-source sprints.', verified: true, followers: 24800, logoColor: '35 92% 48%' },
  { id: 'org-3', publicId: 'ESQ-ORG-20390', slug: 'urjaa-foundation', name: 'Urjaa Foundation', type: 'NGO', industry: 'Sustainability', location: 'Delhi NCR', description: 'Climate-tech volunteering and research fellowships for senior secondary students.', verified: false, followers: 3410, logoColor: '158 64% 38%' },
];

const baseUser = (over: Partial<User> & Pick<User, 'id' | 'name' | 'role'>): User => ({
  publicId: 'ESQ-USR-00000', username: over.name.toLowerCase().replace(/[^a-z]/g, ''),
  email: `${over.name.toLowerCase().replace(/[^a-z]/g, '')}@example.invalid`, verified: true,
  associationStatus: 'verified', ...over,
} as User);

export const mockUsers: Record<UserRole, User> = {
  student: baseUser({
    id: 'u-stu-1', publicId: 'STU-2026-00482', name: 'Rahul Verma', username: 'rahulverma',
    email: 'demo.student@example.invalid', role: 'student', headline: 'Class 10-A • Full-stack & ML enthusiast',
    institutionId: 'inst-1', institutionName: 'Greenwood International School', department: 'Computer Science',
    course: 'Class 10 — Science stream', term: 6, location: 'Pune, Maharashtra',
  }),
  teacher: baseUser({
    id: 'u-tch-1', publicId: 'TCH-2026-00182', name: 'Mrs. Ananya Iyer', role: 'teacher',
    headline: 'Senior Teacher, Computer Science', institutionId: 'inst-1',
    institutionName: 'Greenwood International School', department: 'Computer Science', location: 'Pune',
  }),
  principal: baseUser({
    id: 'u-pri-1', publicId: 'STF-2026-00019', name: 'Dr. S. Raghavan', role: 'principal',
    headline: 'Principal, Greenwood International School', institutionId: 'inst-1',
    institutionName: 'Greenwood International School', department: 'Administration',
  }),
  admin: baseUser({
    id: 'u-adm-1', publicId: 'STF-2026-00312', name: 'Meera Nair', role: 'admin',
    headline: 'Institution Administrator', institutionId: 'inst-1', institutionName: 'Greenwood International School',
  }),
  hr: baseUser({
    id: 'u-hr-1', publicId: 'STF-2026-00455', name: 'Vikram Shetty', role: 'hr',
    headline: 'Head of Human Resources', institutionId: 'inst-1', institutionName: 'Greenwood International School',
  }),
  finance: baseUser({
    id: 'u-fin-1', publicId: 'STF-2026-00521', name: 'Priya Deshmukh', role: 'finance',
    headline: 'Finance Manager', institutionId: 'inst-1', institutionName: 'Greenwood International School',
  }),
  admission: baseUser({
    id: 'u-adms-1', publicId: 'STF-2026-00604', name: 'Karan Malhotra', role: 'admission',
    headline: 'Admissions Lead', institutionId: 'inst-1', institutionName: 'Greenwood International School',
  }),
  organization: baseUser({
    id: 'u-org-1', publicId: 'ESQ-ORG-20114', name: 'Nimbus Labs', role: 'organization',
    headline: 'Cloud & AI infrastructure company', institutionName: 'Nimbus Labs', location: 'Bengaluru',
  }),
  public: baseUser({
    id: 'u-pub-1', publicId: 'ESQ-PUB-90231', name: 'Aditi Sharma', role: 'public',
    headline: 'Exploring institutions and opportunities', verified: false, associationStatus: 'not_connected',
  }),
};

export const studentProfile: StudentProfile = {
  userId: 'u-stu-1',
  bio: 'Class 10 student building practical systems. Currently working on traffic optimisation with computer vision, and mentoring first-years in the campus coding club.',
  skills: ['React', 'TypeScript', 'Python', 'PyTorch', 'PostgreSQL', 'Docker', 'Figma'],
  interests: ['Machine Learning', 'Systems Design', 'Open Source', 'Product Design'],
  cgpa: 86.2, termGpa: 89.0, attendance: 87,
  links: { github: 'github.com/rahulverma', linkedin: 'linkedin.com/in/rahulverma', website: 'rahulverma.dev' },
  achievements: [
    { title: 'Winner — Smart India Hackathon (Regional)', issuer: 'Ministry of Education', year: '2025' },
    { title: 'Best Student Project, Class 10 Science Fair', issuer: 'Greenwood International School', year: '2025' },
  ],
  certifications: [
    { title: 'Deep Learning Specialization', issuer: 'Coursera', year: '2025' },
    { title: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', year: '2024' },
  ],
  experience: [
    { role: 'Software Engineering Intern', org: 'Nimbus Labs', period: 'May 2025 – Jul 2025', summary: 'Built an internal metrics dashboard used by three platform teams.' },
    { role: 'Technical Lead', org: 'CodeCraft Campus Chapter', period: 'Aug 2024 – Present', summary: 'Runs weekly workshops and the annual 200-participant campus hackathon.' },
  ],
  education: [
    { degree: 'Class 10 (CBSE)', institution: 'Greenwood International School', period: '2025 – 2026' },
    { degree: 'Middle School', institution: 'Greenwood International School', period: '2019 – 2025' },
  ],
  counters: { posts: 34, connections: 612, following: 188, projects: 7 },
};

export const subjects: Subject[] = [
  {
    id: 'sub-1', code: 'MTH-X', name: 'Mathematics', faculty: 'Mrs. Ananya Iyer', periods: 6, room: 'Room 204',
    attendance: { attended: 41, total: 46 },
    marks: { internal: 27, external: 61, assignment: 18, practical: 24, grade: 'A' },
    materials: [{ title: 'Quadratic Equations — Slides', type: 'PDF', date: '12 Aug' }, { title: 'Trigonometry Notes', type: 'PDF', date: '04 Aug' }],
    assignments: [{ title: 'Quadratic Equations Worksheet', due: '24 Aug', status: 'Pending' }, { title: 'Mensuration Worksheet', due: '09 Aug', status: 'Graded', score: '18/20' }],
    announcements: [{ title: 'Unit test on 28 August', body: 'Covers algebra, trigonometry and mensuration. Bring your geometry box.', date: '18 Aug' }],
    classmates: 64,
  },
  {
    id: 'sub-2', code: 'SCI-X', name: 'Science (Physics & Chemistry)', faculty: 'Mr. Rohit Kulkarni', periods: 6, room: 'Lab 1',
    attendance: { attended: 33, total: 44 },
    marks: { internal: 24, external: 55, assignment: 16, practical: 22, grade: 'B+' },
    materials: [{ title: 'Chemical Reactions Worksheet', type: 'PDF', date: '10 Aug' }],
    assignments: [{ title: 'Light & Reflection Lab Report', due: '26 Aug', status: 'Pending' }],
    announcements: [{ title: 'Lab batches swapped', body: 'Section B will now attend the Thursday 2 PM science lab.', date: '15 Aug' }],
    classmates: 62,
  },
  {
    id: 'sub-3', code: 'ENG-X', name: 'English Literature', faculty: 'Mrs. Neha Bansal', periods: 6, room: 'Room 201',
    attendance: { attended: 29, total: 42 },
    marks: { internal: 22, external: 52, assignment: 15, practical: 20, grade: 'B' },
    materials: [{ title: 'Poetry Analysis Handout', type: 'PDF', date: '08 Aug' }],
    assignments: [{ title: 'Essay: The Road Not Taken', due: '30 Aug', status: 'Pending' }],
    announcements: [{ title: 'Attendance shortage notice', body: 'Students below 75% must meet the department office this week.', date: '16 Aug' }],
    classmates: 61,
  },
  {
    id: 'sub-4', code: 'CSC-X', name: 'Computer Applications', faculty: 'Mr. Sameer Khan', periods: 5, room: 'Computer Lab',
    attendance: { attended: 38, total: 40 },
    marks: { internal: 28, external: 66, assignment: 19, practical: 25, grade: 'A+' },
    materials: [{ title: 'Spreadsheet Basics', type: 'PDF', date: '14 Aug' }],
    assignments: [{ title: 'HTML Project Page', due: '21 Aug', status: 'Submitted' }],
    announcements: [{ title: 'Computer project demo day', body: 'Demos on 02 September in Computer Lab. Teams of two.', date: '17 Aug' }],
    classmates: 58,
  },
  {
    id: 'sub-5', code: 'SST-X', name: 'Social Science', faculty: 'Mrs. Pallavi Rao', periods: 6, room: 'Room 110',
    attendance: { attended: 36, total: 43 },
    marks: { internal: 25, external: 58, assignment: 17, practical: 21, grade: 'A' },
    materials: [{ title: 'Nationalism in India — Notes', type: 'PDF', date: '11 Aug' }],
    assignments: [{ title: 'Map Work: Resources', due: '28 Aug', status: 'Pending' }],
    announcements: [{ title: 'Guest lecture', body: 'Career awareness session by Nimbus Labs on 27 August.', date: '19 Aug' }],
    classmates: 63,
  },
  {
    id: 'sub-6', code: 'HIN-X', name: 'Hindi', faculty: 'Mr. Arvind Menon', periods: 5, room: 'Room 305',
    attendance: { attended: 30, total: 39 },
    marks: { internal: 21, external: 49, assignment: 14, practical: 0, grade: 'B' },
    materials: [{ title: 'Vyakaran Abhyas', type: 'PDF', date: '09 Aug' }],
    assignments: [{ title: 'Nibandh Lekhan', due: '25 Aug', status: 'Pending' }],
    announcements: [{ title: 'Doubt-clearing session', body: 'Saturday 11 AM, Room 305.', date: '14 Aug' }],
    classmates: 66,
  },
];

export const todaySchedule: ClassSession[] = [
  { id: 'cl-1', subject: 'Mathematics', faculty: 'Mrs. Ananya Iyer', room: 'Room 204', start: '09:00', end: '10:00', type: 'Lecture' },
  { id: 'cl-2', subject: 'Science (Physics & Chemistry)', faculty: 'Mr. Rohit Kulkarni', room: 'Lab 1', start: '10:15', end: '11:15', type: 'Lecture' },
  { id: 'cl-3', subject: 'Computer Applications', faculty: 'Mr. Sameer Khan', room: 'Computer Lab', start: '11:30', end: '13:00', type: 'Lab' },
  { id: 'cl-4', subject: 'Social Science', faculty: 'Mrs. Pallavi Rao', room: 'Online', start: '14:00', end: '15:00', type: 'Lecture', online: true },
  { id: 'cl-5', subject: 'Hindi', faculty: 'Mr. Arvind Menon', room: 'Room 305', start: '15:15', end: '16:15', type: 'Tutorial' },
];

export const attendanceTrend = [
  { month: 'Mar', value: 92 }, { month: 'Apr', value: 89 }, { month: 'May', value: 84 },
  { month: 'Jun', value: 81 }, { month: 'Jul', value: 86 }, { month: 'Aug', value: 87 },
];

export const marksTrend = [
  { sem: 'Term 1', gpa: 79 }, { sem: 'Term 2', gpa: 81 }, { sem: 'Term 3', gpa: 84 },
  { sem: 'Term 4', gpa: 85 }, { sem: 'Term 5', gpa: 87 }, { sem: 'Term 6', gpa: 89 },
];

export const attendanceCalendar: AttendanceDay[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const status: AttendanceDay['status'] =
    [4, 11, 18, 25].includes(day) ? 'holiday' : [7, 13, 21].includes(day) ? 'absent' : day === 9 ? 'late' : 'present';
  return { date: `2026-08-${String(day).padStart(2, '0')}`, status };
});

export const posts: Post[] = [
  {
    id: 'p-1', authorId: 'org-2', authorName: 'CodeCraft Community', authorRole: 'Community', authorHandle: 'codecraft',
    authorVerified: true, category: 'Hackathon', visibility: 'Public',
    content: 'Registrations are open for BuildFest 2026 — a 36-hour hybrid hackathon with tracks in climate tech, health AI and developer tooling. ₹4,00,000 in prizes and mentorship from engineers at Nimbus Labs.',
    tags: ['hackathon', 'buildfest', 'ai'], createdAt: '2h', likes: 342, reposts: 61,
    linkedEntity: { kind: 'hackathon', id: 'h-1', label: 'BuildFest 2026' },
    comments: [
      { id: 'c-1', authorName: 'Sneha Pillai', authorHandle: 'snehap', content: 'Looking for one more ML person for our team — DM me.', createdAt: '1h' },
    ],
  },
  {
    id: 'p-2', authorId: 'org-1', authorName: 'Nimbus Labs', authorRole: 'Company', authorHandle: 'nimbuslabs',
    authorVerified: true, category: 'Internship', visibility: 'Public',
    content: 'We are hiring 12 summer engineering interns across platform, data and frontend. Applications close 15 September. Class 11 and 12 students from any registered school can apply.',
    tags: ['internship', 'hiring'], createdAt: '5h', likes: 512, reposts: 128,
    linkedEntity: { kind: 'opportunity', id: 'o-1', label: 'Software Engineering Intern' },
    comments: [],
  },
  {
    id: 'p-3', authorId: 'u-stu-2', authorName: 'Sneha Pillai', authorRole: 'Student • Riverdale Public School', authorHandle: 'snehap',
    category: 'Project', visibility: 'Public',
    content: 'Our team just shipped the first working prototype of a smart traffic controller that reduced simulated wait time by 31%. Looking for a Flutter developer to help build the citizen-facing app.',
    tags: ['project', 'computervision'], createdAt: '8h', likes: 219, reposts: 24,
    linkedEntity: { kind: 'project', id: 'pr-1', label: 'Smart Traffic Management using AI' },
    comments: [
      { id: 'c-2', authorName: 'Rahul Verma', authorHandle: 'rahulverma', content: 'Great numbers. How are you handling occlusion at night?', createdAt: '6h' },
    ],
  },
  {
    id: 'p-4', authorId: 'inst-1', authorName: 'Greenwood International School', authorRole: 'Institution', authorHandle: 'greenwoodschool',
    authorVerified: true, category: 'Announcement', visibility: 'Institution',
    content: 'Half-yearly examination timetable for Class 10 is published. Exams begin 08 September. Admit cards will be available from 01 September in your student portal.',
    tags: ['exams', 'notice'], createdAt: '1d', likes: 96, reposts: 12, comments: [],
  },
  {
    id: 'p-5', authorId: 'u-tch-1', authorName: 'Mrs. Ananya Iyer', authorRole: 'Senior Teacher • CSE', authorHandle: 'ananyaiyer',
    authorVerified: true, category: 'Academic', visibility: 'Department',
    content: 'Sharing my curated reading list on advanced data structures for students preparing for research internships. Persistent structures are underrated — start there.',
    tags: ['datastructures', 'research'], createdAt: '1d', likes: 187, reposts: 43, comments: [],
  },
  {
    id: 'p-6', authorId: 'u-stu-3', authorName: 'Arjun Mehta', authorRole: 'Student • Greenwood International School', authorHandle: 'arjunm',
    category: 'Achievement', visibility: 'Public',
    content: 'Cleared the final round of the National Robotics Challenge with team Kinetix. Third place overall and a research grant for the next build cycle.',
    tags: ['robotics', 'achievement'], createdAt: '2d', likes: 431, reposts: 37, comments: [],
  },
];

export const projects: Project[] = [
  {
    id: 'pr-1', title: 'Smart Traffic Management using AI',
    summary: 'Adaptive signal control using computer vision on existing junction cameras.',
    description: 'A vision pipeline that estimates real-time queue length at each approach and re-times signals using a reinforcement learning policy. Currently validated in simulation against four Pune junctions with a 31% reduction in average wait time.',
    status: 'Recruiting', stack: ['Python', 'PyTorch', 'OpenCV', 'FastAPI', 'Flutter'],
    tags: ['computer-vision', 'smart-city', 'reinforcement-learning'], institution: 'Riverdale Public School',
    creatorId: 'u-stu-2', creatorName: 'Sneha Pillai',
    team: [{ name: 'Sneha Pillai', role: 'ML Lead' }, { name: 'Rahul Verma', role: 'Backend' }, { name: 'Imran Qureshi', role: 'Simulation' }],
    teamSize: 5, openRoles: ['Flutter Developer', 'Machine Learning Engineer'],
    repoUrl: 'github.com/snehap/smart-traffic', demoUrl: 'smarttraffic.demo.app',
    updates: [
      { date: '18 Aug', text: 'Prototype v0.3 with night-time detection improvements.' },
      { date: '02 Aug', text: 'Completed junction simulation harness.' },
    ],
  },
  {
    id: 'pr-2', title: 'CampusMesh — Offline Campus Network',
    summary: 'Bluetooth mesh messaging for campuses during network outages.',
    description: 'A peer-to-peer messaging layer that keeps class announcements flowing when campus Wi-Fi fails, with store-and-forward relays on student devices.',
    status: 'In Development', stack: ['React Native', 'Rust', 'SQLite'],
    tags: ['networking', 'mobile'], institution: 'Greenwood International School',
    creatorId: 'u-stu-1', creatorName: 'Rahul Verma',
    team: [{ name: 'Rahul Verma', role: 'Creator' }, { name: 'Divya Menon', role: 'Mobile' }],
    teamSize: 4, openRoles: ['Rust Developer'], repoUrl: 'github.com/rahulverma/campusmesh',
    updates: [{ date: '16 Aug', text: 'Relay handshake stable across 12 devices.' }],
  },
  {
    id: 'pr-3', title: 'GradeLens — Performance Insights for Teacher',
    summary: 'Explains class performance dips with subject and attendance correlation.',
    description: 'A teacher-facing analytics layer that links attendance patterns to assessment outcomes and highlights students who need intervention early in the term.',
    status: 'Completed', stack: ['TypeScript', 'Next.js', 'DuckDB'],
    tags: ['analytics', 'education'], institution: 'Greenwood International School',
    creatorId: 'u-stu-4', creatorName: 'Divya Menon',
    team: [{ name: 'Divya Menon', role: 'Creator' }, { name: 'Arjun Mehta', role: 'Data' }],
    teamSize: 3, openRoles: [], demoUrl: 'gradelens.demo.app',
    updates: [{ date: '28 Jul', text: 'Adopted by the CSE department for pilot use.' }],
  },
  {
    id: 'pr-4', title: 'Solar Yield Predictor',
    summary: 'Forecasts rooftop solar output for campus buildings.',
    description: 'Combines weather feeds with panel telemetry to forecast day-ahead generation and schedule lab loads accordingly.',
    status: 'Idea', stack: ['Python', 'scikit-learn'], tags: ['sustainability', 'ml'],
    institution: 'Greenwood International School', creatorId: 'u-stu-5', creatorName: 'Imran Qureshi',
    team: [{ name: 'Imran Qureshi', role: 'Creator' }], teamSize: 4,
    openRoles: ['Data Engineer', 'Frontend Developer'], updates: [],
  },
];

export const opportunities: Opportunity[] = [
  {
    id: 'o-1', title: 'Software Engineering Intern', organization: 'Nimbus Labs', organizationId: 'org-1',
    type: 'Internship', mode: 'Hybrid', location: 'Bengaluru', duration: '6 months', stipend: '₹45,000 / month',
    paid: true, experience: 'Fresher', skills: ['TypeScript', 'React', 'Go', 'PostgreSQL'], deadline: '15 Sep 2026',
    overview: 'Join a platform team building developer tooling used by thousands of engineers. Interns own a shippable project end to end with a dedicated mentor.',
    requirements: ['Third or fourth-year senior secondary', 'Comfortable with one typed language', 'Prior project or open-source work'],
    eligibility: ['Verified student on ESQUARE', 'Available for a six-month full-time internship'],
  },
  {
    id: 'o-2', title: 'Frontend Engineer (Fresher)', organization: 'Nimbus Labs', organizationId: 'org-1',
    type: 'Job', mode: 'On-site', location: 'Bengaluru', duration: 'Full time', stipend: '₹12,00,000 / year',
    paid: true, experience: '0-1 years', skills: ['React', 'TypeScript', 'Accessibility'], deadline: '30 Sep 2026',
    overview: 'Build the console that customers use daily. You will work closely with design on complex data-dense interfaces.',
    requirements: ['Strong fundamentals in React', 'Eye for interaction detail'],
    eligibility: ['Graduating in 2026', 'Portfolio of shipped interfaces'],
  },
  {
    id: 'o-3', title: 'Climate Research Fellowship', organization: 'Urjaa Foundation', organizationId: 'org-3',
    type: 'Research', mode: 'Remote', location: 'Remote', duration: '4 months', stipend: '₹20,000 / month',
    paid: true, experience: 'Fresher', skills: ['Python', 'Data Analysis', 'GIS'], deadline: '05 Sep 2026',
    overview: 'Work with the research team on district-level emissions modelling and publish a public dataset.',
    requirements: ['Comfort with data cleaning', 'Interest in climate policy'],
    eligibility: ['Undergraduate or postgraduate students'],
  },
  {
    id: 'o-4', title: 'UI Design Sprint Workshop', organization: 'CodeCraft Community', organizationId: 'org-2',
    type: 'Workshop', mode: 'Remote', location: 'Online', duration: '2 days', stipend: 'Free',
    paid: false, experience: 'Fresher', skills: ['Figma', 'Design Systems'], deadline: '28 Aug 2026',
    overview: 'A hands-on two-day sprint covering design systems, prototyping and critique.',
    requirements: ['Laptop with Figma access'], eligibility: ['Open to all students'],
  },
  {
    id: 'o-5', title: 'Freelance React Developer', organization: 'Nimbus Labs', organizationId: 'org-1',
    type: 'Freelance', mode: 'Remote', location: 'Remote', duration: '8 weeks', stipend: '₹60,000 total',
    paid: true, experience: '0-1 years', skills: ['React', 'Charts', 'REST APIs'], deadline: '10 Sep 2026',
    overview: 'Build an analytics micro-frontend for an internal reporting tool.',
    requirements: ['Prior React project experience'], eligibility: ['Students and recent graduates'],
  },
  {
    id: 'o-6', title: 'National Merit Scholarship 2026', organization: 'Urjaa Foundation', organizationId: 'org-3',
    type: 'Scholarship', mode: 'Remote', location: 'India', duration: 'One year', stipend: '₹1,00,000',
    paid: true, experience: 'Fresher', skills: [], deadline: '20 Sep 2026',
    overview: 'Merit-cum-means scholarship for engineering senior secondarys with demonstrated community work.',
    requirements: ['Overall % above 8.0', 'Documented volunteering'], eligibility: ['Family income below ₹8 LPA'],
  },
];

export const hackathons: Hackathon[] = [
  {
    id: 'h-1', title: 'BuildFest 2026', organizer: 'CodeCraft Community', organizerId: 'org-2', mode: 'Hybrid',
    host: 'Corporate', startDate: '12 Sep 2026', endDate: '14 Sep 2026', location: 'Bengaluru + Online',
    prize: '₹4,00,000', teamSize: '2 – 4', tags: ['ai', 'climate', 'devtools'], registrationOpen: true,
    status: 'Registration Open', participants: 1840,
    about: 'A 36-hour hybrid build sprint where student teams ship a working product against one of three tracks, with mentorship from working engineers and a public demo day.',
    tracks: ['Climate Tech', 'Health AI', 'Developer Tooling'],
    timeline: [
      { label: 'Registration closes', date: '08 Sep' }, { label: 'Team confirmation', date: '10 Sep' },
      { label: 'Kickoff', date: '12 Sep, 9 AM' }, { label: 'Submissions close', date: '13 Sep, 9 PM' },
      { label: 'Demo day & results', date: '14 Sep' },
    ],
    prizes: [{ place: 'Winner', reward: '₹2,00,000 + incubation' }, { place: 'Runner-up', reward: '₹1,20,000' }, { place: 'Track prizes', reward: '₹80,000' }],
    rules: ['Teams of two to four verified students', 'All code written during the event', 'Open-source libraries permitted with attribution'],
    judging: ['Problem clarity', 'Technical depth', 'Working demo', 'Impact potential'],
    sponsors: ['Nimbus Labs', 'Urjaa Foundation'],
  },
  {
    id: 'h-2', title: 'CampusHack Monsoon Edition', organizer: 'Greenwood International School', organizerId: 'inst-1',
    mode: 'Offline', host: 'School', startDate: '27 Aug 2026', endDate: '28 Aug 2026', location: 'Pune Campus',
    prize: '₹1,00,000', teamSize: '3 – 5', tags: ['campus', 'iot'], registrationOpen: true,
    status: 'Registration Open', participants: 320,
    about: 'An intra-campus overnight hackathon focused on solving real campus operations problems submitted by departments.',
    tracks: ['Campus Operations', 'Student Wellbeing'],
    timeline: [{ label: 'Registration closes', date: '25 Aug' }, { label: 'Kickoff', date: '27 Aug, 6 PM' }, { label: 'Results', date: '28 Aug, 4 PM' }],
    prizes: [{ place: 'Winner', reward: '₹60,000' }, { place: 'Runner-up', reward: '₹40,000' }],
    rules: ['Open to enrolled students only', 'One submission per team'],
    judging: ['Usefulness to campus', 'Execution', 'Presentation'], sponsors: ['Alumni Association'],
  },
  {
    id: 'h-3', title: 'DataDive Analytics Challenge', organizer: 'Nimbus Labs', organizerId: 'org-1', mode: 'Online',
    host: 'Corporate', startDate: '02 Jul 2026', endDate: '04 Jul 2026', location: 'Online', prize: '₹2,50,000',
    teamSize: '1 – 3', tags: ['data', 'analytics'], registrationOpen: false, status: 'Completed', participants: 2600,
    about: 'A weekend analytics challenge on anonymised public transport data.',
    tracks: ['Forecasting', 'Visualisation'],
    timeline: [{ label: 'Completed', date: '04 Jul' }],
    prizes: [{ place: 'Winner', reward: '₹1,50,000' }],
    rules: ['Individual or team entries'], judging: ['Accuracy', 'Clarity'], sponsors: ['Nimbus Labs'],
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: 'e-1', title: 'Mathematics — Unit Test', date: '2026-08-28', time: '09:00', category: 'Exam' },
  { id: 'e-2', title: 'AVL Tree Assignment due', date: '2026-08-24', time: '23:59', category: 'Assignment' },
  { id: 'e-3', title: 'CampusHack Monsoon Edition', date: '2026-08-27', time: '18:00', category: 'Hackathon' },
  { id: 'e-4', title: 'Network Security Guest Lecture', date: '2026-08-27', time: '11:00', category: 'Event' },
  { id: 'e-5', title: 'CampusMesh sprint review', date: '2026-08-22', time: '17:00', category: 'Meeting' },
  { id: 'e-6', title: 'Web Dev mini-project demo', date: '2026-09-02', time: '10:00', category: 'Deadline' },
  { id: 'e-7', title: 'Half-yearly exams begin', date: '2026-09-08', time: '09:00', category: 'Exam' },
];

export const conversations: Conversation[] = [
  {
    id: 'cv-1', name: 'Sneha Pillai', kind: 'direct', handle: 'snehap', lastMessage: 'Can you review the detection PR tonight?',
    lastAt: '10:24', unread: 2, online: true,
    messages: [
      { id: 'm-1', senderName: 'Sneha Pillai', content: 'Hey Rahul, the night-time detection branch is ready.', at: '10:18' },
      { id: 'm-2', senderName: 'Rahul Verma', self: true, content: 'Nice. Did the false positives drop?', at: '10:21' },
      { id: 'm-3', senderName: 'Sneha Pillai', content: 'Down from 14% to 6% on the test junctions.', at: '10:23' },
      { id: 'm-4', senderName: 'Sneha Pillai', content: 'Can you review the detection PR tonight?', at: '10:24' },
    ],
  },
  {
    id: 'cv-2', name: 'Class 10-A Group', kind: 'class', handle: 'class10a', lastMessage: 'Mrs. Iyer: Unit test syllabus posted.',
    lastAt: '09:40', unread: 0,
    messages: [
      { id: 'm-5', senderName: 'Mrs. Ananya Iyer', content: 'Unit test syllabus posted in the Mathematics materials tab.', at: '09:40' },
    ],
  },
  {
    id: 'cv-3', name: 'CampusMesh Team', kind: 'group', handle: 'campusmesh', lastMessage: 'Divya: Relay build passes on Android 14.',
    lastAt: 'Yesterday', unread: 0,
    messages: [
      { id: 'm-6', senderName: 'Divya Menon', content: 'Relay build passes on Android 14.', at: 'Yesterday' },
    ],
  },
  {
    id: 'cv-4', name: 'Nimbus Labs Recruiting', kind: 'organization', handle: 'nimbuslabs', lastMessage: 'Your internship application moved to review.',
    lastAt: 'Mon', unread: 1,
    messages: [
      { id: 'm-7', senderName: 'Nimbus Labs', content: 'Your internship application moved to review. Expect an update by 05 September.', at: 'Mon' },
    ],
  },
];

export const notifications: AppNotification[] = [
  { id: 'n-1', category: 'Academic', title: 'Marks uploaded', body: 'Computer Applications practical marks published by Mr. Sameer Khan.', at: '20m', read: false, action: { label: 'View marks', to: '/app/marks' } },
  { id: 'n-2', category: 'Requests', title: 'Project invitation', body: 'Sneha Pillai invited you to collaborate on Smart Traffic Management.', at: '2h', read: false, action: { label: 'Open project', to: '/app/projects/pr-1' } },
  { id: 'n-3', category: 'Opportunities', title: 'New internship matches your skills', body: 'Nimbus Labs is hiring Software Engineering Interns — React, TypeScript.', at: '5h', read: false, action: { label: 'View opportunity', to: '/app/opportunities/o-1' } },
  { id: 'n-4', category: 'Social', title: 'Arjun Mehta started following you', body: 'Student • Greenwood International School', at: '1d', read: true },
  { id: 'n-5', category: 'Administrative', title: 'Institution association approved', body: 'You are now a verified member of Greenwood International School.', at: '2d', read: true },
  { id: 'n-6', category: 'Academic', title: 'Attendance updated', body: 'English Literature attendance is now 69% — below the 75% requirement.', at: '2d', read: true, action: { label: 'View attendance', to: '/app/attendance' } },
  { id: 'n-7', category: 'Opportunities', title: 'Hackathon deadline approaching', body: 'BuildFest 2026 registration closes on 08 September.', at: '3d', read: true, action: { label: 'Register', to: '/app/hackathons/h-1' } },
];

export const admissionApplications: AdmissionApplication[] = [
  { id: 'ad-1', applicant: 'Nikhil Barot', program: 'Class 11 — Science', appliedOn: '12 Aug 2026', status: 'Applications', reviewer: 'Karan Malhotra', email: 'applicant1@example.invalid', phone: '+91 00000 00001', score: 'Entrance test 96.4%', notes: 'Strong olympiad record.', documents: ['Previous school report card', 'Entrance test result', 'Photo ID'] },
  { id: 'ad-2', applicant: 'Fatima Sheikh', program: 'Class 11 — Science', appliedOn: '11 Aug 2026', status: 'Applications', reviewer: 'Karan Malhotra', email: 'applicant2@example.invalid', phone: '+91 00000 00002', score: 'Entrance test 94.1%', notes: 'Requested school bus route 4.', documents: ['Previous school report card', 'Entrance test result'] },
  { id: 'ad-3', applicant: 'Rehan Ali', program: 'M.Tech Social Science', appliedOn: '08 Aug 2026', status: 'Waitlisted', reviewer: 'Meera Nair', email: 'applicant3@example.invalid', phone: '+91 00000 00003', score: 'Entrance test 88.0%', notes: 'Awaiting seat release in the second list.', documents: ['Previous school report card', 'GATE scorecard'] },
  { id: 'ad-4', applicant: 'Ishita Roy', program: 'Class 6', appliedOn: '05 Aug 2026', status: 'Approved', reviewer: 'Karan Malhotra', email: 'applicant4@example.invalid', phone: '+91 00000 00004', score: 'Entrance test 91.8%', notes: 'Offer letter sent.', documents: ['Previous school report card', 'Entrance test result'] },
  { id: 'ad-5', applicant: 'Manav Gupta', program: 'Class 9', appliedOn: '02 Aug 2026', status: 'Rejected', reviewer: 'Meera Nair', email: 'applicant5@example.invalid', phone: '+91 00000 00005', score: 'Entrance test 58.0%', notes: 'Below admission cut-off.', documents: ['Previous school report card'] },
  { id: 'ad-6', applicant: 'Tanvi Joshi', program: 'Class 11 — Science', appliedOn: '29 Jul 2026', status: 'Enrolled', reviewer: 'Karan Malhotra', email: 'applicant6@example.invalid', phone: '+91 00000 00006', score: 'Entrance test 97.2%', notes: 'Fees paid, onboarding complete.', documents: ['Previous school report card', 'Entrance test result', 'Fee receipt'] },
];

export const employees: Employee[] = [
  { id: 'emp-1', publicId: 'TCH-2026-00182', name: 'Mrs. Ananya Iyer', role: 'Senior Teacher', department: 'Computer Science', kind: 'Faculty', joined: '14 Jul 2016', status: 'Active', email: 'employee1@example.invalid', attendance: 96 },
  { id: 'emp-2', publicId: 'TCH-2026-00204', name: 'Mr. Rohit Kulkarni', role: 'Subject Teacher', department: 'Computer Science', kind: 'Faculty', joined: '02 Jan 2019', status: 'Active', email: 'employee2@example.invalid', attendance: 92 },
  { id: 'emp-3', publicId: 'TCH-2026-00219', name: 'Mrs. Neha Bansal', role: 'Teacher', department: 'Information Technology', kind: 'Faculty', joined: '19 Aug 2011', status: 'On leave', email: 'employee3@example.invalid', attendance: 88 },
  { id: 'emp-4', publicId: 'STF-2026-00455', name: 'Vikram Shetty', role: 'Head of HR', department: 'Administration', kind: 'Non-teaching', joined: '05 Mar 2018', status: 'Active', email: 'employee4@example.invalid', attendance: 98 },
  { id: 'emp-5', publicId: 'STF-2026-00612', name: 'Lakshmi Pillai', role: 'Lab Technician', department: 'Electronics', kind: 'Non-teaching', joined: '11 Nov 2021', status: 'Probation', email: 'employee5@example.invalid', attendance: 94 },
  { id: 'emp-6', publicId: 'STF-2026-00521', name: 'Priya Deshmukh', role: 'Finance Manager', department: 'Administration', kind: 'Non-teaching', joined: '23 Jun 2017', status: 'Active', email: 'employee6@example.invalid', attendance: 97 },
];

export const transactions: Transaction[] = [
  { id: 't-1', label: 'Term fees — Term 6 batch', party: 'CSE Department', category: 'Fees', amount: 4820000, direction: 'in', date: '18 Aug 2026', status: 'Completed' },
  { id: 't-2', label: 'Faculty payroll — August', party: 'Payroll run #88', category: 'Payroll', amount: 3140000, direction: 'out', date: '01 Aug 2026', status: 'Completed' },
  { id: 't-3', label: 'Laboratory equipment', party: 'Sigma Instruments', category: 'Expense', amount: 620000, direction: 'out', date: '14 Aug 2026', status: 'Pending' },
  { id: 't-4', label: 'Research grant disbursal', party: 'State Innovation Council', category: 'Grant', amount: 1500000, direction: 'in', date: '09 Aug 2026', status: 'Completed' },
  { id: 't-5', label: 'Hostel fees — Block C', party: 'Hostel Office', category: 'Fees', amount: 980000, direction: 'in', date: '06 Aug 2026', status: 'Pending' },
  { id: 't-6', label: 'Campus maintenance', party: 'Sparkline Facilities', category: 'Expense', amount: 310000, direction: 'out', date: '03 Aug 2026', status: 'Failed' },
];

export const revenueSeries = [
  { month: 'Mar', revenue: 5200000, expense: 3900000 },
  { month: 'Apr', revenue: 6100000, expense: 4100000 },
  { month: 'May', revenue: 4800000, expense: 3800000 },
  { month: 'Jun', revenue: 7400000, expense: 4300000 },
  { month: 'Jul', revenue: 6900000, expense: 4600000 },
  { month: 'Aug', revenue: 8100000, expense: 4400000 },
];

export const institutionEnrolment = [
  { month: 'Mar', students: 5860 }, { month: 'Apr', students: 5940 }, { month: 'May', students: 5980 },
  { month: 'Jun', students: 6080 }, { month: 'Jul', students: 6150 }, { month: 'Aug', students: 6200 },
];

export const departmentPerformance = [
  { department: 'CSE', attendance: 88, average: 76 },
  { department: 'IT', attendance: 84, average: 73 },
  { department: 'ECE', attendance: 81, average: 71 },
  { department: 'MECH', attendance: 79, average: 68 },
  { department: 'CIVIL', attendance: 83, average: 70 },
];

export const teacherClasses = [
  { id: 'tc-1', subject: 'Mathematics', section: 'CSE 6-A', students: 64, time: '09:00 – 10:00', room: 'Room 204', attendanceTaken: false },
  { id: 'tc-2', subject: 'Mathematics', section: 'CSE 6-B', students: 62, time: '11:30 – 12:30', room: 'LH-206', attendanceTaken: true },
  { id: 'tc-3', subject: 'Advanced Algorithms', section: 'M.Tech 2', students: 28, time: '14:00 – 15:30', room: 'LH-401', attendanceTaken: false },
];

export const classRoster = [
  { id: 's-1', publicId: 'STU-2026-00482', name: 'Rahul Verma', attendance: 87, lastScore: 18 },
  { id: 's-2', publicId: 'STU-2026-00491', name: 'Arjun Mehta', attendance: 92, lastScore: 17 },
  { id: 's-3', publicId: 'STU-2026-00503', name: 'Divya Menon', attendance: 74, lastScore: 15 },
  { id: 's-4', publicId: 'STU-2026-00517', name: 'Imran Qureshi', attendance: 68, lastScore: 12 },
  { id: 's-5', publicId: 'STU-2026-00528', name: 'Kavya Reddy', attendance: 96, lastScore: 19 },
  { id: 's-6', publicId: 'STU-2026-00534', name: 'Tanvi Joshi', attendance: 81, lastScore: 16 },
];

export const suggestedPeople = [
  { name: 'Sneha Pillai', handle: 'snehap', headline: 'ML student • Riverdale Public School' },
  { name: 'Arjun Mehta', handle: 'arjunm', headline: 'Robotics • Greenwood International School' },
  { name: 'Divya Menon', handle: 'divyam', headline: 'Mobile developer • XYZ School' },
];

export const trendingTags = ['#buildfest2026', '#internships', '#opensource', '#campusplacements', '#computervision', '#designsystems'];
