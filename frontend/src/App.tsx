import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/app/ThemeProvider";
import AppShell from "@/components/app/AppShell";
import { RoleRoute, WorkspaceHome } from "@/components/app/RoleRoute";

import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import JoinPage from "./pages/Join";
import NotFound from "./pages/NotFound";

import Dashboard from "./pages/app/Dashboard";
import Feed from "./pages/app/Feed";
import Explore from "./pages/app/Explore";
import Classes from "./pages/app/Classes";
import ClassDetail from "./pages/app/ClassDetail";
import Attendance from "./pages/app/Attendance";
import Marks from "./pages/app/Marks";
import CalendarPage from "./pages/app/Calendar";
import Messages from "./pages/app/Messages";
import Projects from "./pages/app/Projects";
import ProjectDetail from "./pages/app/ProjectDetail";
import Opportunities from "./pages/app/Opportunities";
import OpportunityDetail from "./pages/app/OpportunityDetail";
import Hackathons from "./pages/app/Hackathons";
import HackathonDetail from "./pages/app/HackathonDetail";
import Notifications from "./pages/app/Notifications";
import Profile from "./pages/app/Profile";
import SettingsPage from "./pages/app/Settings";
import InstitutionProfile from "./pages/app/InstitutionProfile";
import OrganizationProfile from "./pages/app/OrganizationProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/Students";
import AdminTeachers from "./pages/admin/Teachers";
import AdminDepartments from "./pages/admin/Departments";
import AdminAdmissions from "./pages/admin/Admissions";
import AdminHR from "./pages/admin/HR";
import AdminFinance from "./pages/admin/Finance";
import AdminReports from "./pages/admin/Reports";

import OrgDashboard from "./pages/org/OrgDashboard";
import OrgOpportunities from "./pages/org/OrgOpportunities";
import OrgApplications from "./pages/org/OrgApplications";
import OrgPosts from "./pages/org/OrgPosts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/join" element={<JoinPage />} />

            <Route element={<AppShell />}>
              <Route path="/app" element={<WorkspaceHome />} />
              <Route path="/app/feed" element={<Feed />} />
              <Route path="/app/explore" element={<Explore />} />
              <Route path="/app/calendar" element={<CalendarPage />} />
              <Route path="/app/projects" element={<Projects />} />
              <Route path="/app/projects/:id" element={<ProjectDetail />} />
              <Route path="/app/opportunities" element={<Opportunities />} />
              <Route path="/app/opportunities/:id" element={<OpportunityDetail />} />
              <Route path="/app/hackathons" element={<Hackathons />} />
              <Route path="/app/hackathons/:id" element={<HackathonDetail />} />
              <Route path="/app/notifications" element={<Notifications />} />
              <Route path="/app/profile" element={<Profile />} />
              <Route path="/app/settings" element={<SettingsPage />} />
              <Route path="/app/institutions/:slug" element={<InstitutionProfile />} />
              <Route path="/app/organizations/:slug" element={<OrganizationProfile />} />

              <Route element={<RoleRoute allowed={["student", "teacher"]} />}>
                <Route path="/app/dashboard" element={<Dashboard />} />
                <Route path="/app/classes" element={<Classes />} />
                <Route path="/app/classes/:id" element={<ClassDetail />} />
                <Route path="/app/attendance" element={<Attendance />} />
                <Route path="/app/marks" element={<Marks />} />
              </Route>

              <Route element={<RoleRoute allowed={["student", "teacher", "principal", "admin", "hr", "finance", "admission", "organization"]} />}>
                <Route path="/app/messages" element={<Messages />} />
              </Route>

              <Route element={<RoleRoute allowed={["principal", "admin"]} />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>
              <Route element={<RoleRoute allowed={["principal", "admin", "admission"]} />}>
                <Route path="/admin/students" element={<AdminStudents />} />
                <Route path="/admin/admissions" element={<AdminAdmissions />} />
              </Route>
              <Route element={<RoleRoute allowed={["principal", "admin", "hr"]} />}>
                <Route path="/admin/teachers" element={<AdminTeachers />} />
                <Route path="/admin/departments" element={<AdminDepartments />} />
                <Route path="/admin/hr" element={<AdminHR />} />
              </Route>
              <Route element={<RoleRoute allowed={["admin", "finance"]} />}>
                <Route path="/admin/finance" element={<AdminFinance />} />
              </Route>
              <Route element={<RoleRoute allowed={["principal", "admin", "finance"]} />}>
                <Route path="/admin/reports" element={<AdminReports />} />
              </Route>

              <Route element={<RoleRoute allowed={["organization"]} />}>
                <Route path="/organization" element={<Navigate to="/organization/dashboard" replace />} />
                <Route path="/organization/dashboard" element={<OrgDashboard />} />
                <Route path="/organization/opportunities" element={<OrgOpportunities />} />
                <Route path="/organization/applications" element={<OrgApplications />} />
                <Route path="/organization/posts" element={<OrgPosts />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
