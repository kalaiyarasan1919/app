import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Loader2, Mail, Lock, User } from "lucide-react";
import { UserRole } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation, googleLogin } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>(UserRole.TEAM_MEMBER);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      console.log("User authenticated, redirecting to dashboard");
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      if (loginUsername) {
        await loginMutation.mutateAsync({
          username: loginUsername,
          password: loginPassword,
        });
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
      } else {
        await registerMutation.mutateAsync({
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
          name: registerName,
          role: registerRole,
        });
        toast({
          title: "Account created!",
          description: "Your account has been created successfully.",
        });
      }
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl flex flex-col md:flex-row shadow-lg rounded-lg overflow-hidden">
        {/* Left side - Auth forms */}
        <div className="w-full md:w-1/2 bg-white p-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <CheckSquare className="h-6 w-6 text-indigo-600 mr-2" />
              <h1 className="text-2xl font-bold text-indigo-600">My To Do</h1>
            </div>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loginMutation.isPending}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Choose a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-role">Role</Label>
                  <Select
                    value={registerRole}
                    onValueChange={(value) => setRegisterRole(value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.TEAM_MEMBER}>Team Member</SelectItem>
                      <SelectItem value={UserRole.CLIENT}>Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side - Hero section */}
        <div className="w-full md:w-1/2 bg-indigo-600 p-8 text-white hidden md:block">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">
              Collaborate, Organize, Succeed
            </h2>
            <p className="mb-6 opacity-90">
              My To Do helps teams organize, assign, and track tasks effectively.
              Streamline your workflows and boost productivity with our intuitive
              task management platform.
            </p>
            <ul className="space-y-2 opacity-90">
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Create and assign tasks to team members</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Track project progress with status updates</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Collaborate with real-time messaging</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Share files and documents with your team</span>
              </li>
              <li className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2" />
                <span>Get notifications for important updates</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
