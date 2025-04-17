import { Switch, Route, Redirect } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import BrowseBooks from "@/pages/browse-books";
import BorrowedBooks from "@/pages/borrowed-books";
import ManageBooks from "@/pages/manage-books";
import ManageUsers from "@/pages/manage-users";

function App() {
  return (
    <Switch>
      <Route path="/" render={() => <Redirect to="/auth" />} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/browse" component={BrowseBooks} />
      <Route path="/borrowed" component={BorrowedBooks} />
      <Route path="/manage/books" component={ManageBooks} />
      <Route path="/manage/users" component={ManageUsers} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
