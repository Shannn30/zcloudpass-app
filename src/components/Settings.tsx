import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

interface SettingsProps {
  onLogout: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess("Password changed successfully! Please log in again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Logout after 2 seconds
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/vault")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account settings
            </p>
          </div>
        </div>

        {/* Change Password Card */}
        <Card className="animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Master Password
            </CardTitle>
            <CardDescription>
              Update your master password. You'll need to log in again after
              changing it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters. Use a strong, unique password.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Warning:</strong> Changing your master password will
                  require you to re-encrypt your vault. Make sure you remember
                  your new password!
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Status</span>
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Session</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
