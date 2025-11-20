import { FormEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputEnhanced } from "@/components/ui/input-enhanced";
import { Mail, Lock } from "lucide-react";
import { useForm } from "@/hooks/useForm";

interface TenantLoginProps {
  onLogin: (email: string, password: string) => void;
  error?: string | null;
  isLoading?: boolean;
}

export function TenantLogin({ onLogin, error, isLoading }: TenantLoginProps) {
  const { values, handleChange } = useForm({
    email: "",
    password: ""
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(values.email, values.password);
  };

  return (
    <Card className="max-w-md mx-auto bg-macon-navy-800 border-macon-navy-600">
      <CardHeader>
        <CardTitle className="text-center text-macon-navy-50 text-3xl">Tenant Login</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div role="alert" className="mb-6 p-3 bg-macon-navy-700 border border-macon-navy-600 text-macon-navy-100 rounded text-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <InputEnhanced
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            label="Email"
            floatingLabel
            leftIcon={<Mail className="w-5 h-5" />}
            className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
            required
            disabled={isLoading}
          />
          <InputEnhanced
            id="password"
            type="password"
            value={values.password}
            onChange={(e) => handleChange('password', e.target.value)}
            label="Password"
            floatingLabel
            leftIcon={<Lock className="w-5 h-5" />}
            className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500"
            required
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="w-full bg-macon-navy hover:bg-macon-navy-dark text-xl h-14"
            isLoading={isLoading}
            loadingText="Logging in..."
          >
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
