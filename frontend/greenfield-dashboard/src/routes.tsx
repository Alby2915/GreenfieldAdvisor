
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/dashboard';
import Models from './pages/Models';
import Settings from './pages/Settings';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import ProtectedRoute from './routes/ProtectedRoute';
import Vision from './pages/Vision';
import Home from './pages/home';


export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },


      {
        element: <ProtectedRoute />,
        children: [
          { path: '/', element: <Home /> },           // home -> dashboard
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/vision', element: <Vision /> },
          { path: '/models', element: <Models /> },
          { path: '/settings', element: <Settings /> },
        ]
      },
    ]
  }
]);
