import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard'; // ✅ تأكد من المسار الصحيح
import AdminAudits from './pages/AdminAudits';
import Settings from './pages/Settings';
import Communities from './pages/Communities';
import Subscription from './pages/Subscription';
import ForgotPassword from './pages/ForgotPassword';
import CommunityDetail from './pages/CommunityDetail';
import CommunityChatPage from './pages/CommunityChatPage';
import AIChat from './pages/AIChat';
import SuggestionsPage from './pages/SuggestionsPage';
import RatingPage from './pages/RatingPage';
import RatingPage2 from './pages/RatingPage2';
import NotificationsPage from './pages/Notifications';
import Footer from './components/Footer';

function App() {
  // فحص حالة التسجيل لمرة واحدة عند تحميل التطبيق
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="font-sans text-right min-h-screen app-bg text-gray-900 dark:text-gray-100" dir="rtl">
        <Routes>
          {/* الصفحة الافتراضية: إذا مسجل يدخل هوم، إذا لأ يدخل لوجن */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Login />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
          <Route path="/rating" element={<RatingPage />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/communities/:id" element={<CommunityDetail />} />
          <Route path="/communities/:id/chat" element={<CommunityChatPage />} />
          <Route path="/ai" element={<AIChat />} />
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/audits" element={<AdminAudits />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/subscribe" element={<Subscription />} />

          {/* إعادة توجيه أي مسار خاطئ للرئيسية */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;