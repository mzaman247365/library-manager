import { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, BookmarkIcon, LucideLibrary, UserPlus, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    fullName: "",
  });
  
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoggingIn(true);
      const res = await apiRequest("POST", "/api/login", loginForm);
      const user = await res.json();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsRegistering(true);
      const res = await apiRequest("POST", "/api/register", {
        ...registerForm,
        isAdmin: false
      });
      const user = await res.json();
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.fullName}!`,
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Unknown error",
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
                    Enter your credentials to login to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Username
                      </label>
                      <Input 
                        placeholder="johndoe" 
                        name="username"
                        value={loginForm.username}
                        onChange={handleLoginChange}
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
                <CardFooter className="flex justify-center text-sm text-muted-foreground">
                  <p>Admin login: username "admin" / password "admin123"</p>
                </CardFooter>
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
                        placeholder="John Doe" 
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
                        placeholder="johndoe" 
                        name="username"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Password
                      </label>
                      <Input 
                        type="password" 
                        name="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
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
