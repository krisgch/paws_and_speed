import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../layouts/AppShell.tsx';
import { AuthRoute, HostRoute, GuestRoute } from './guards.tsx';

// Public pages
import Landing from '../pages/Landing.tsx';
import EventDetail from '../pages/EventDetail.tsx';
import EventLive from '../pages/EventLive.tsx';

// Auth pages
import Login from '../pages/Login.tsx';
import Signup from '../pages/Signup.tsx';

// Competitor pages
import CompetitorDashboard from '../pages/competitor/Dashboard.tsx';
import RegisterFlow from '../pages/competitor/RegisterFlow.tsx';

// Host pages
import HostDashboard from '../pages/host/Dashboard.tsx';
import CreateEvent from '../pages/host/CreateEvent.tsx';
import EventHub from '../pages/host/EventHub.tsx';
import ManageRounds from '../pages/host/ManageRounds.tsx';
import ManagePricing from '../pages/host/ManagePricing.tsx';
import RegistrationQueue from '../pages/host/RegistrationQueue.tsx';
import RunningOrderPage from '../pages/host/RunningOrderPage.tsx';
import ScoringPage from '../pages/host/ScoringPage.tsx';
import RankingsPage from '../pages/host/RankingsPage.tsx';

// Competitors page (existing)
import Competitors from '../pages/Competitors.tsx';

export const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  { path: '/', element: <Landing /> },
  { path: '/events/:eventId', element: <EventDetail /> },
  { path: '/events/:eventId/live', element: <EventLive /> },

  // ── Auth routes (redirect to /dashboard if logged in) ──────────────────────
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
    ],
  },

  // ── Protected routes (must be logged in) ───────────────────────────────────
  {
    element: <AuthRoute />,
    children: [
      { path: '/dashboard', element: <CompetitorDashboard /> },
      { path: '/events/:eventId/register', element: <RegisterFlow /> },
    ],
  },

  // ── Host routes (must be logged in + role=host) ─────────────────────────────
  {
    element: <HostRoute />,
    children: [
      { path: '/host', element: <HostDashboard /> },
      { path: '/host/events/new', element: <CreateEvent /> },
      { path: '/host/events/:eventId', element: <EventHub /> },
      { path: '/host/events/:eventId/rounds', element: <ManageRounds /> },
      { path: '/host/events/:eventId/pricing', element: <ManagePricing /> },
      { path: '/host/events/:eventId/registrations', element: <RegistrationQueue /> },
      // AppShell wraps the scoring/running-order/rankings pages (has Header with tabs)
      {
        element: <AppShell />,
        children: [
          { path: '/host/events/:eventId/running-order', element: <RunningOrderPage /> },
          { path: '/host/events/:eventId/scoring', element: <ScoringPage /> },
          { path: '/host/events/:eventId/rankings', element: <RankingsPage /> },
          { path: '/host/events/:eventId/competitors', element: <Competitors /> },
        ],
      },
    ],
  },
]);
