import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, BookmarkIcon, LucideLibrary, UserPlus, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Authentication Page Component
 * 
 * Handles user login and registration functionality.
 * Upon successful authentication, redirects to the homepage.
 */
export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form state for login
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  
  // Form state for registration (no placeholders)
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    fullName: "",
  });
  
  /**
   * Check if user is already logged in on component mount
   * If already authenticated, redirect to homepage
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/user', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (res.ok) {
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    
    checkAuth();
  }, []);
  
  /**
   * Handle login form field changes
   */
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Handle registration form field changes
   */
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Handle login form submission
   * Authenticates user and redirects to homepage on success
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Validate input
      if (!loginForm.username || !loginForm.password) {
        throw new Error("Username and password are required");
      }
      
      // Perform login request
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(loginForm),
        credentials: 'include'
      });
      
      // Handle failed login
      if (!loginRes.ok) {
        const error = await loginRes.json();
        throw new Error(error.error || "Login failed");
      }
      
      // Parse successful response
      const user = await loginRes.json();
      
      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName || user.username}!`,
      });
      
      // Force page reload to homepage via direct browser navigation
      window.location.href = "/";
    } catch (error) {
      // Show error message
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  /**
   * Handle registration form submission
   * Creates new user account and logs in on success
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    
    try {
      // Validate form fields
      if (!registerForm.username || !registerForm.password || !registerForm.fullName) {
        throw new Error("All fields are required");
      }
      
      // Send registration request
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(registerForm),
        credentials: 'include'
      });
      
      // Handle registration errors
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Registration failed");
      }
      
      // Parse successful response
      const user = await res.json();
      
      // Show success message
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.fullName || user.username}!`,
      });
      
      // Force page reload to homepage via direct browser navigation
      window.location.href = "/";
    } catch (error) {
      // Show error message
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="w-full md:w-1/2 bg-primary text-primary-foreground p-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto space-y-6 text-center">
          <div className="flex justify-center mb-6">
            <LucideLibrary size={80} />
          </div>
          
          <h1 className="text-3xl font-bold">Library Management System</h1>
          <p className="mt-4">
            Your digital library solution for managing books, borrowing, and returns.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <div className="bg-primary-foreground/10 p-4 rounded-lg">
              <BookOpen className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-medium">Browse Books</h3>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Explore our extensive collection of books
              </p>
            </div>
            
            <div className="bg-primary-foreground/10 p-4 rounded-lg">
              <BookmarkIcon className="h-8 w-8 mb-2" />
              <h3 className="text-lg font-medium">Borrow &amp; Return</h3>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Easily borrow and return books
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Forms */}
      <div className="w-full md:w-1/2 bg-background p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Username
                      </label>
                      <Input 
                        placeholder="Enter your username" 
                        name="username"
                        value={loginForm.username}
                        onChange={handleLoginChange}
                        autoComplete="username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Password
                      </label>
                      <Input 
                        type="password" 
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        autoComplete="current-password"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        "Logging in..."
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" /> Login
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Register to borrow books from our library
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Full Name
                      </label>
                      <Input 
                        placeholder="Enter your full name" 
                        name="fullName"
                        value={registerForm.fullName}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Username
                      </label>
                      <Input 
                        placeholder="Choose a username" 
                        name="username"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                        autoComplete="username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Password
                      </label>
                      <Input 
                        type="password" 
                        name="password"
                        placeholder="Create a password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        autoComplete="new-password"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        "Creating account..."
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" /> Register
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}