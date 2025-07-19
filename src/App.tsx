// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login';
import SelectPlan from './pages/select-plan';
import MainPage from './pages/MainPage';
import AdminRoute from './components/AdminRoute';
import { supabase } from './lib/supabase';

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // セッションチェックのみ行い、自動遷移は削除
    };
    checkSession();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/select-plan" element={<SelectPlan />} />
      <Route path="/main" element={<MainPage />} />
      <Route path="/admin" element={<AdminRoute />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
