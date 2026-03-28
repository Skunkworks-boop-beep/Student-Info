import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout';
import { RequireAdmin } from './components/require-admin';
import { LandingPage } from './pages/landing';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { ComplaintsPage } from './pages/complaints';
import { ComplaintDetailPage } from './pages/complaint-detail';
import { SubmitComplaintPage } from './pages/submit-complaint';
import { LeaderboardPage } from './pages/leaderboard';
import { CampusMapPage } from './pages/campus-map';
import { DevSupportPage } from './pages/dev-support';
import { AdminDashboardPage } from './pages/admin-dashboard';
import { AdminComplaintsPage } from './pages/admin-complaints';
import { AdminUsersPage } from './pages/admin-users';
import { AdminHeatmapPage } from './pages/admin-heatmap';
import { AdminRulesPage } from './pages/admin-rules';
import { AIAssistantPage } from './pages/ai-assistant';

export const router = createBrowserRouter([
  { path: '/', Component: LandingPage },
  { path: '/login', Component: LoginPage },
  {
    path: '/app',
    Component: Layout,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'complaints', Component: ComplaintsPage },
      { path: 'complaints/:id', Component: ComplaintDetailPage },
      { path: 'submit', Component: SubmitComplaintPage },
      { path: 'leaderboard', Component: LeaderboardPage },
      { path: 'map', Component: CampusMapPage },
      { path: 'support', Component: DevSupportPage },
      { path: 'assistant', Component: AIAssistantPage },
      {
        Component: RequireAdmin,
        children: [
          { path: 'admin', Component: AdminDashboardPage },
          { path: 'admin/complaints', Component: AdminComplaintsPage },
          { path: 'admin/users', Component: AdminUsersPage },
          { path: 'admin/heatmap', Component: AdminHeatmapPage },
          { path: 'admin/rules', Component: AdminRulesPage },
        ],
      },
    ],
  },
]);
