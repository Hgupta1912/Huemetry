import App from './App.tsx';
import ErrorPage from './pages/ErrorPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import Analyze from './pages/Analyze.tsx';
//import Dashboard from './pages/Dashboard.tsx';
// ...other page imports as they're built

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
      {
        element: <ProtectedRoute />,
        children: [
          //{ path: 'dashboard', element: <Dashboard /> },
          // portfolio, new-project, project detail, collections, settings — added as built
        ],
      },
    ],
  },
];

export default routes;