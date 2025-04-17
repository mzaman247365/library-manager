import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import BrowseBooks from "@/pages/browse-books";
import BorrowedBooks from "@/pages/borrowed-books";
import ManageBooks from "@/pages/manage-books";
import ManageUsers from "@/pages/manage-users";
import { Loader2 } from "lucide-react";

// User interface
interface User {
  id: number;
  username: string;
  fullName: string;
  isAdmin: boolean;
}

// Protected route component that checks authentication
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
          navigate('/auth');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <Component /> : null;
}

// Admin route component that checks admin privileges
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          
          if (!userData.isAdmin) {
            navigate('/');
          }
        } else {
          setUser(null);
          navigate('/auth');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (user && user.isAdmin) ? <Component /> : null;
}

function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/browse">
        <ProtectedRoute component={BrowseBooks} />
      </Route>
      <Route path="/borrowed">
        <ProtectedRoute component={BorrowedBooks} />
      </Route>
      <Route path="/manage/books">
        <AdminRoute component={ManageBooks} />
      </Route>
      <Route path="/manage/users">
        <AdminRoute component={ManageUsers} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;