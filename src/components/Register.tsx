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
import { Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

interface RegisterProps {
  onRegisterSuccess: () => void;
}

export default function Register({ onRegisterSuccess }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPasswordStrength = (
    pwd: string,
  ): { strength: string; color: string } => {
    if (pwd.length < 8)
      return { strength: "Weak", color: "text-muted-foreground" };
    if (pwd.length < 12)
      return { strength: "Medium", color: "text-foreground" };
    if (
      pwd.length >= 16 &&
      /[A-Z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[^A-Za-z0-9]/.test(pwd)
    ) {
      return { strength: "Strong", color: "text-primary font-bold" };
    }
    return { strength: "Medium", color: "text-foreground" };
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
      const emptyVault = createEmptyVault();
      const encryptedVault = await encryptVault(emptyVault, password);

      await api.register({
        email,
        master_password: password,
        encrypted_vault: encryptedVault,
      });

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
      <Card
        className="w-full max-w-md border shadow-sm card-animate hover-lift"
        style={{ animationDelay: "80ms" }}
      >
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-2 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center text-foreground animate-fade-up" style={{ animationDelay: "140ms" }}>
            Secure Your World
          </CardTitle>
          <CardDescription className="text-center text-base animate-fade-up" style={{ animationDelay: "160ms" }}>
            Create your master vault in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up" style={{ animationDelay: "180ms" }}>
            {error && (
              <Alert variant="destructive" className="animate-fade-up" style={{ animationDelay: "200ms" }}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium ml-1">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-11"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                title="password"
                className="text-sm font-medium ml-1"
              >
                Master Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                  disabled={loading}
                />
              </div>
              {passwordStrength && (
                <div className="px-1 pt-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
                    <span className="text-muted-foreground">Strength</span>
                    <span className={passwordStrength.color}>
                      {passwordStrength.strength}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-all duration-500 ${
                          i === 1 && passwordStrength.strength !== ""
                            ? passwordStrength.strength === "Weak"
                              ? "bg-muted-foreground/30"
                              : passwordStrength.strength === "Medium"
                                ? "bg-muted-foreground/60"
                                : "bg-foreground"
                            : i === 2 &&
                                (passwordStrength.strength === "Medium" ||
                                  passwordStrength.strength === "Strong")
                              ? passwordStrength.strength === "Medium"
                                ? "bg-muted-foreground/60"
                                : "bg-foreground"
                              : i === 3 &&
                                  passwordStrength.strength === "Strong"
                                ? "bg-foreground"
                                : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                title="confirmPassword"
                className="text-sm font-medium ml-1"
              >
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 h-11"
                  disabled={loading}
                />
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted border flex gap-3 animate-fade-up" style={{ animationDelay: "220ms" }}>
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-[11px] leading-relaxed text-foreground font-medium">
                IMPORTANT: Your master password is the ONLY key to your vault.
                If lost, it cannot be recovered.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold animate-fade-up hover-lift"
              style={{ animationDelay: "260ms" }}
              disabled={loading}
            >
              {loading ? "Securing..." : "Create Master Vault"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col pt-0 pb-6">
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
              Unlock existing
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
