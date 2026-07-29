import App from './App.tsx';
import ErrorPage from './pages/ErrorPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import Analyze from './pages/Analyze.tsx';
import NewProject from './pages/NewProject.tsx';
import ProjectDetail from './pages/ProjectDetail.tsx';
import LogSession from './pages/LogSession.tsx';
import AddReference from './pages/AddReference.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Portfolio from './pages/Portfolio.tsx';
import Collections from './pages/Collections.tsx';
import AddCollection from './pages/AddCollection.tsx';
import CollectionDetail from './pages/CollectionDetail.tsx';
import AddProjectToCollection from './pages/AddProjectToCollection.tsx';
import Settings from './pages/Settings.tsx';
import DiscoverArtists from './pages/DiscoverArtists.tsx';
import SessionAnalytics from './pages/SessionAnalytics.tsx';
import ReferenceAnalytics from './pages/ReferenceAnalytics.tsx';

const routes = [
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'analyze', element: <Analyze /> },
      { path: 'artists/:username/projects/:projectId', element: <ProjectDetail /> },
      { path: 'artists/:username/portfolio', element: <Portfolio /> },
      { path: 'discover', element: <DiscoverArtists /> },
      { path: 'artists/:username/projects/:projectId/sessions/:sessionId', element: <SessionAnalytics /> },
      { path: 'artists/:username/projects/:projectId/reference/analytics', element: <ReferenceAnalytics /> },
      { element: <ProtectedRoute />,
        children: [
          { path: 'new-project', element: <NewProject /> },
          { path: 'projects/:id', element: <ProjectDetail /> },
          { path: 'projects/:id/edit', element: <NewProject /> },
          { path: 'projects/:id/log-session', element: <LogSession /> },
          { path: 'projects/:id/sessions/:sessionId/edit', element: <LogSession /> },
          { path: 'projects/:id/reference', element: <AddReference /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'portfolio', element: <Portfolio /> },
          { path: 'collections', element: <Collections /> },
          { path: 'collections/new', element: <AddCollection /> },
          { path: 'collections/:id', element: <CollectionDetail /> },
          { path: 'collections/:id/add-project', element: <AddProjectToCollection /> },
          { path: 'settings', element: <Settings /> },
          { path: 'projects/:id/sessions/:sessionId', element: <SessionAnalytics /> },
          { path: 'projects/:id/reference/analytics', element: <ReferenceAnalytics /> },
        ],
      },
    ],
  },
];

export default routes;


