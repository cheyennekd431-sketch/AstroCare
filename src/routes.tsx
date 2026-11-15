import { RouteObject } from 'react-router';
import { lazy } from 'react';
import HomePage from './pages/index';
import HistoryPage from './pages/history';
import WellbeingPage from './pages/wellbeing';
import RadiationPage from './pages/radiation';
import EnvironmentPage from './pages/environment';
// Eager import so renderToString doesn't hit a Suspense boundary on 404 routes
// and abort to client rendering. The prod 404 page is tiny; the dev-tools
// variant stays lazy because it pulls in dev-only code we don't want in
// production bundles.
import ProdNotFoundPage from './pages/_404';

const NotFoundPage = ProdNotFoundPage;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/history',
    element: <HistoryPage />,
  },
  {
    path: '/wellbeing',
    element: <WellbeingPage />,
  },
  {
    path: '/radiation',
    element: <RadiationPage />,
  },
  {
    path: '/environment',
    element: <EnvironmentPage />,
  },
  {
    id: 'airo-not-found',
    path: '*',
    element: <HomePage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/history' | '/wellbeing' | '/radiation' | '/environment';

export type Params = Record<string, string | undefined>;
