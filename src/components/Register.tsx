import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { encryptVault, createEmptyVault } from "../lib/crypto";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Lock, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";

interface RegisterProps {
  onRegisterSuccess: () => void;
}

export default function Register({ onRegisterSuccess }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPasswordStrength = (
    pwd: string,
  ): { strength: string; color: string } => {
    if (pwd.length < 8) return { strength: "Weak", color: "text-red-500" };
    if (pwd.length < 12)
      return { strength: "Medium", color: "text-yellow-500" };
    if (
      pwd.length >= 16 &&
      /[A-Z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd)
    ) {
      return { strength: "Strong", color: "text-green-500" };
    }
    return { strength: "Medium", color: "text-yellow-500" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Create empty encrypted vault
      const emptyVault = createEmptyVault();
      const encryptedVault = await encryptVault(emptyVault, password);

      // Register user with encrypted vault
      await api.register({
        username: username || undefined,
        email,
        master_password: password,
        encrypted_vault: encryptedVault,
      });

      // Auto-login after registration
      await api.login({
        email,
        master_password: password,
      });

      onRegisterSuccess();
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md animate-slide-in">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Set up your secure password vault
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username (Optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Master Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              {passwordStrength && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`font-medium ${passwordStrength.color}`}>
                    {passwordStrength.strength}
                  </div>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.strength === "Weak"
                          ? "w-1/3 bg-red-500"
                          : passwordStrength.strength === "Medium"
                            ? "w-2/3 bg-yellow-500"
                            : "w-full bg-green-500"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10"
                  disabled={loading}
                />
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your master password cannot be recovered. Make sure to remember
                it!
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
