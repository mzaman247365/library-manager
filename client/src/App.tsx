import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import BrowseBooks from "@/pages/browse-books";
import BorrowedBooks from "@/pages/borrowed-books";
import ManageBooks from "@/pages/manage-books";
import ManageUsers from "@/pages/manage-users";
import { Layout } from "@/components/ui/layout";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";

function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/browse" component={BrowseBooks} />
      <ProtectedRoute path="/borrowed" component={BorrowedBooks} />
      <AdminRoute path="/manage/books" component={ManageBooks} />
      <AdminRoute path="/manage/users" component={ManageUsers} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
