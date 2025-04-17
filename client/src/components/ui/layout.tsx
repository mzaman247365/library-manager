import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookCopy,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Settings,
  Settings2,
  User,
  Users,
  X,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  isAdmin: boolean;
}

export function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // If not authenticated, redirect to login
          console.log("Authentication failed, redirecting to login");
          navigate("/auth");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        navigate("/auth");
      }
    };
    
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout", {});
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />,
      label: "Dashboard",
      href: "/",
      active: location === "/",
    },
    {
      icon: <BookOpen className="h-5 w-5 mr-3" />,
      label: "Browse Books",
      href: "/browse",
      active: location === "/browse",
    },
    {
      icon: <BookCopy className="h-5 w-5 mr-3" />,
      label: "My Borrowed Books",
      href: "/borrowed",
      active: location === "/borrowed",
    },
  ];

  const adminItems = [
    {
      icon: <Library className="h-5 w-5 mr-3" />,
      label: "Manage Books",
      href: "/manage/books",
      active: location === "/manage/books",
    },
    {
      icon: <Users className="h-5 w-5 mr-3" />,
      label: "Manage Users",
      href: "/manage/users",
      active: location === "/manage/users",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top App Bar */}
      <header className="bg-primary text-primary-foreground shadow-md z-10 flex items-center px-4 h-16">
        <Button
          variant="ghost"
          size="icon"
          className="mr-4 md:hidden text-primary-foreground"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <h1 className="text-xl font-medium flex-1">Library Management System</h1>
        
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-primary-foreground/10 rounded px-2 mx-4 flex-1 max-w-md">
          <Input 
            type="text" 
            placeholder="Search books..." 
            className="bg-transparent border-none text-primary-foreground placeholder:text-primary-foreground/70"
          />
        </div>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">{user?.fullName || user?.username}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-gray-800 hover:bg-gray-100">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation - Desktop */}
        <aside className="w-64 bg-white shadow-sm z-10 hidden md:flex md:flex-col h-[calc(100vh-4rem)]">
          {/* User Info Section */}
          <div className="p-4 bg-primary text-primary-foreground">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary-foreground/20">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user?.fullName || user?.username}</div>
                <div className="text-sm opacity-80">{user?.isAdmin ? "Admin" : "User"}</div>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={`flex items-center px-4 py-3 rounded-md ${
                        item.active
                          ? "text-primary bg-primary/5 font-medium border-r-4 border-primary"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
              
              {user?.isAdmin && (
                <>
                  <li className="pt-4 px-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase">Admin</div>
                  </li>
                  
                  {adminItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          className={`flex items-center px-4 py-3 rounded-md ${
                            item.active
                              ? "text-primary bg-primary/5 font-medium border-r-4 border-primary"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </a>
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </nav>
          
          {/* Settings Link */}
          <div className="p-4 border-t border-gray-200">
            <Link href="#settings">
              <a className="flex items-center text-gray-500">
                <Settings2 className="mr-3 h-5 w-5" />
                <span>Settings</span>
              </a>
            </Link>
          </div>
        </aside>
        
        {/* Mobile Navigation Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0">
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-primary-foreground/20">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user?.fullName || user?.username}</div>
                  <div className="text-sm opacity-80">{user?.isAdmin ? "Admin" : "User"}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-6">
              <ul className="space-y-1 px-2">
                {navItems.map((item) => (
                  <li key={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <Link href={item.href}>
                      <a
                        className={`flex items-center px-4 py-3 rounded-md ${
                          item.active
                            ? "text-primary bg-primary/5 font-medium border-r-4 border-primary"
                            : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    </Link>
                  </li>
                ))}
                
                {user?.isAdmin && (
                  <>
                    <li className="pt-4 px-4">
                      <div className="text-xs font-medium text-muted-foreground uppercase">Admin</div>
                    </li>
                    
                    {adminItems.map((item) => (
                      <li key={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <Link href={item.href}>
                          <a
                            className={`flex items-center px-4 py-3 rounded-md ${
                              item.active
                                ? "text-primary bg-primary/5 font-medium border-r-4 border-primary"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </a>
                        </Link>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="flex justify-around">
          <Link href="/">
            <a className={`flex flex-col items-center py-2 px-3 ${location === "/" ? "text-primary" : "text-gray-500"}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </a>
          </Link>
          
          <Link href="/browse">
            <a className={`flex flex-col items-center py-2 px-3 ${location === "/browse" ? "text-primary" : "text-gray-500"}`}>
              <BookOpen className="h-5 w-5" />
              <span className="text-xs mt-1">Browse</span>
            </a>
          </Link>
          
          <Link href="/borrowed">
            <a className={`flex flex-col items-center py-2 px-3 ${location === "/borrowed" ? "text-primary" : "text-gray-500"}`}>
              <BookCopy className="h-5 w-5" />
              <span className="text-xs mt-1">Borrowed</span>
            </a>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex flex-col items-center py-2 px-3 text-gray-500">
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/manage/books">
                      <a className="flex items-center">
                        <Library className="mr-2 h-4 w-4" />
                        <span>Manage Books</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/manage/users">
                      <a className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Manage Users</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-gray-800 hover:bg-gray-100">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}
