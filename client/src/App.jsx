import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PetWidget from './components/PetWidget';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import CreateItem from './pages/CreateItem';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import CreateResource from './pages/CreateResource';
import ErrorBoundary from './components/ErrorBoundary';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Messages from './pages/Messages';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import CreateProject from './pages/CreateProject';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import CreateArticle from './pages/CreateArticle';
import Inspirations from './pages/Inspirations';
import InspirationDetail from './pages/InspirationDetail';
import CreateInspiration from './pages/CreateInspiration';
import ResumeEdit from './pages/ResumeEdit';
import ResumePreview from './pages/ResumePreview';
import UserResume from './pages/UserResume';
import MBTITest from './pages/MBTITest';
import FinanceTracker from './pages/FinanceTracker';
import ImageCropper from './pages/ImageCropper';
import DocumentConverter from './pages/DocumentConverter';
import ResumeBuilder from './pages/ResumeBuilder';
import { useAuth } from './context/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.role || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F0E8]">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/items/create" element={
              <ProtectedRoute><CreateItem /></ProtectedRoute>
            } />
            <Route path="/items/edit/:id" element={
              <ProtectedRoute><CreateItem /></ProtectedRoute>
            } />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/resources/create" element={
              <ProtectedRoute><CreateResource /></ProtectedRoute>
            } />
            <Route path="/resources/edit/:id" element={
              <ProtectedRoute><CreateResource /></ProtectedRoute>
            } />
            <Route path="/users" element={<Users />} />
            <Route path="/profile/edit" element={
              <ProtectedRoute><ResumeEdit /></ProtectedRoute>
            } />
            <Route path="/profile/preview" element={
              <ProtectedRoute><ResumePreview /></ProtectedRoute>
            } />
            <Route path="/profile/:id?" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><Messages /></ProtectedRoute>
            } />
            <Route path="/user/:userId/resume" element={<UserResume />} />
            <Route path="/mbti-test" element={<MBTITest />} />
            <Route path="/finance-tracker" element={<FinanceTracker />} />
            <Route path="/image-cropper" element={<ImageCropper />} />
            <Route path="/doc-converter" element={<DocumentConverter />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/admin/settings" element={
              <AdminRoute><AdminSettings /></AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute><AdminUsers /></AdminRoute>
            } />
            <Route path="/projects" element={<ErrorBoundary key="projects"><Projects /></ErrorBoundary>} />
            <Route path="/projects/create" element={
              <ProtectedRoute><CreateProject /></ProtectedRoute>
            } />
            <Route path="/projects/edit/:id" element={
              <ProtectedRoute><CreateProject /></ProtectedRoute>
            } />
            <Route path="/projects/:id" element={<ErrorBoundary key="project-detail"><ProjectDetail /></ErrorBoundary>} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/create" element={
              <ProtectedRoute><CreateArticle /></ProtectedRoute>
            } />
            <Route path="/articles/edit/:id" element={
              <ProtectedRoute><CreateArticle /></ProtectedRoute>
            } />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/inspirations" element={<Inspirations />} />
            <Route path="/inspirations/create" element={
              <ProtectedRoute><CreateInspiration /></ProtectedRoute>
            } />
            <Route path="/inspirations/edit/:id" element={
              <ProtectedRoute><CreateInspiration /></ProtectedRoute>
            } />
            <Route path="/inspirations/:id" element={<InspirationDetail />} />
          </Routes>
        </main>
        <PetWidget />
      </div>
    </Router>
  );
}

export default App;
