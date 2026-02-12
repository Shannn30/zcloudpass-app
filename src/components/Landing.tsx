import { Link } from "react-router-dom";
import {
  Lock,
  ArrowRight,
  Sun,
  Moon,
  CloudSync,
  ShieldCheckIcon,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface LandingProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function Landing({ theme, toggleTheme }: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="flex items-center justify-between px-4 md:px-6 lg:px-12 py-4 border-b relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
            <img
              src="/favicon.svg"
              alt="zCloudPass"
              className="h-8 w-8 object-contain"
            />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">
            zCloudPass
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg h-9 w-9"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b md:hidden z-50 shadow-lg">
            <div className="flex flex-col p-4 space-y-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 text-center space-y-8 md:space-y-12 max-w-6xl mx-auto py-12 md:py-20">
        <div className="space-y-3 md:space-y-4">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-foreground leading-tight animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            Your Digital Keys,
            <br />
            <span className="underline decoration-primary decoration-4 underline-offset-8">
              Perfectly Secured
            </span>
            .
          </h1>
          <p
            className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 animate-fade-up"
            style={{ animationDelay: "160ms" }}
          >
            A minimalist, open-source password manager focused on speed and
            end-to-end encryption. No bloat. Pure security.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-medium bg-foreground text-background hover:bg-foreground/90 animate-fade-up hover-lift"
              style={{ animationDelay: "240ms" }}
            >
              Create Your Vault
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto sm:hidden">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12 px-6 text-base font-medium animate-fade-up"
              style={{ animationDelay: "260ms" }}
            >
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-12 w-full px-4 md:px-0">
          <div
            className="space-y-3 p-4 md:p-6 border rounded-xl text-left card-animate hover-lift"
            style={{ animationDelay: "320ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-muted w-10 h-10 flex items-center justify-center rounded-lg shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base md:text-lg">Zero Knowledge</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              We never see your master password or your data. Everything is
              encrypted locally.
            </p>
          </div>

          <div
            className="space-y-3 p-4 md:p-6 border rounded-xl text-left card-animate hover-lift"
            style={{ animationDelay: "380ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-muted w-10 h-10 flex items-center justify-center rounded-lg shrink-0">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base md:text-lg">AES-256 GCM</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Bank-grade encryption protocols protect every character of your
              digital life.
            </p>
          </div>

          <div
            className="space-y-3 p-4 md:p-6 border rounded-xl text-left md:col-span-1 col-span-1 card-animate hover-lift"
            style={{ animationDelay: "440ms" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-muted w-10 h-10 flex items-center justify-center rounded-lg shrink-0">
                <CloudSync className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base md:text-lg">Cloud Sync</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Securely sync across all your devices while maintaining full
              privacy control.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 md:py-8 border-t text-center text-muted-foreground text-xs md:text-sm px-4">
        <p>
          &copy; {new Date().getFullYear()} zCloudPass. Secure. Simple.
          Synchronised.
        </p>
      </footer>
    </div>
  );
}
