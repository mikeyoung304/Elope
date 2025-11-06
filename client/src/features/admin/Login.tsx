import { FormEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@/hooks/useForm";

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  error?: string | null;
  isLoading?: boolean;
}

export function Login({ onLogin, error, isLoading }: LoginProps) {
  // Auto-fill for local development/demo
  const { values, handleChange } = useForm({
    email: "admin@elope.com",
    password: "admin123"
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(values.email, values.password);
  };

  return (
    <Card className="max-w-md mx-auto bg-navy-800 border-navy-600">
      <CardHeader>
        <CardTitle className="text-center text-lavender-50 text-3xl">Admin Login</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-6 p-3 bg-navy-700 border border-navy-600 text-lavender-100 rounded text-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-lavender-100 text-lg">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-lavender-100 text-lg">Password</Label>
            <Input
              id="password"
              type="password"
              value={values.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="bg-navy-900 border-navy-600 text-lavender-50 placeholder:text-navy-400 focus:border-lavender-500 text-lg h-12"
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full bg-lavender-500 hover:bg-lavender-600 text-xl h-14" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
