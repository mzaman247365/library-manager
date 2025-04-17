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

/**
 * Protected Route Component
 * 
 * Checks user authentication status and:
 * - Redirects to login if not authenticated
 * - Shows a loading spinner during authentication check
 * - Renders the requested component if authenticated
 * 
 * Uses cache-control headers and includes credentials to ensure proper session handling
 */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use cache-busting headers to prevent stale session data
        const res = await fetch('/api/user', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          console.log("Authentication successful:", userData.username);
        } else {
          console.log("Authentication failed, redirecting to login");
          setUser(null);
          window.location.href = '/auth'; // Force hard navigation instead of React routing
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        window.location.href = '/auth'; // Force hard navigation instead of React routing
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <Component /> : null;
}

/**
 * Admin Route Component
 * 
 * Extends ProtectedRoute to also check for admin privileges
 * - Redirects non-admin users to the homepage
 * - Redirects unauthenticated users to login
 * - Renders the requested component only for admin users
 */
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use cache-busting headers to prevent stale session data
        const res = await fetch('/api/user', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          
          // Check admin status
          if (!userData.isAdmin) {
            console.log("Access denied: User is not an admin");
            window.location.href = '/'; // Redirect to homepage if not admin
          } else {
            console.log("Admin access granted for:", userData.username);
          }
        } else {
          console.log("Authentication failed, redirecting to login");
          setUser(null);
          window.location.href = '/auth'; // Force hard navigation
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        window.location.href = '/auth'; // Force hard navigation
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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