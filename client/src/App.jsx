import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import CreateItem from './pages/CreateItem';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import CreateResource from './pages/CreateResource';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Messages from './pages/Messages';
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

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-16">
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
            <Route path="/profile/:id?" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><Messages /></ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
