import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  decryptVault,
  encryptVault,
  generatePassword,
  type Vault,
  type VaultEntry,
} from "../lib/crypto";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Lock,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Settings,
  LogOut,
  AlertCircle,
  RefreshCw,
  KeyRound,
} from "lucide-react";

interface VaultProps {
  onLogout: () => void;
}

export default function Vault({ onLogout }: VaultProps) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const [entryForm, setEntryForm] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    notes: "",
  });

  const loadVault = async () => {
    try {
      setLoading(true);
      const response = await api.getVault();

      if (response.encrypted_vault) {
        // Vault exists but needs to be unlocked
        setVault(null);
        setUnlocked(false);
      } else {
        // No vault yet, create empty one
        setVault({ entries: [] });
        setUnlocked(true);
      }
    } catch (err) {
      console.error("Load vault error:", err);
      setError(err instanceof Error ? err.message : "Failed to load vault");
      if (err instanceof Error && err.message.includes("Session expired")) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVault();
  }, []);

  const handleUnlock = async () => {
    try {
      setError("");
      const response = await api.getVault();

      if (!response.encrypted_vault) {
        setError("No vault found");
        return;
      }

      const decrypted = await decryptVault(
        response.encrypted_vault,
        masterPassword,
      );
      setVault(decrypted);
      setUnlocked(true);
    } catch (err) {
      console.error("Unlock error:", err);
      setError("Failed to unlock vault. Wrong password?");
    }
  };

  const saveVault = async (updatedVault: Vault) => {
    try {
      setSaving(true);
      setError("");
      const encrypted = await encryptVault(updatedVault, masterPassword);
      await api.updateVault({ encrypted_vault: encrypted });
      setVault(updatedVault);
    } catch (err) {
      console.error("Save vault error:", err);
      setError(err instanceof Error ? err.message : "Failed to save vault");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setEntryForm({ name: "", username: "", password: "", url: "", notes: "" });
    setDialogOpen(true);
  };

  const handleEditEntry = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setEntryForm({
      name: entry.name,
      username: entry.username || "",
      password: entry.password || "",
      url: entry.url || "",
      notes: entry.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    if (!vault || !masterPassword) return;

    const newEntry: VaultEntry = {
      id: editingEntry?.id || Date.now().toString(),
      name: entryForm.name,
      username: entryForm.username || undefined,
      password: entryForm.password || undefined,
      url: entryForm.url || undefined,
      notes: entryForm.notes || undefined,
    };

    const updatedEntries = editingEntry
      ? vault.entries.map((e) => (e.id === editingEntry.id ? newEntry : e))
      : [...vault.entries, newEntry];

    await saveVault({ entries: updatedEntries });
    setDialogOpen(false);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!vault || !masterPassword || !confirm("Delete this entry?")) return;
    const updatedEntries = vault.entries.filter((e) => e.id !== id);
    await saveVault({ entries: updatedEntries });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGeneratePassword = () => {
    setEntryForm({ ...entryForm, password: generatePassword(16) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Unlock Vault
            </CardTitle>
            <CardDescription>
              Enter your master password to access your vault
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="masterPassword">Master Password</Label>
              <Input
                id="masterPassword"
                type="password"
                placeholder="••••••••"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              />
            </div>
            <Button onClick={handleUnlock} className="w-full">
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Password Vault</h1>
              <p className="text-sm text-muted-foreground">
                {vault?.entries.length || 0} entries
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add Entry Button */}
        <Button onClick={handleAddEntry} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>

        {/* Entries Table */}
        <Card>
          <CardContent className="p-0">
            {vault && vault.entries.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vault.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.username}
                            {entry.username && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopy(entry.username!)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.password && (
                              <>
                                <span className="font-mono">
                                  {showPassword[entry.id]
                                    ? entry.password
                                    : "••••••••"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    setShowPassword({
                                      ...showPassword,
                                      [entry.id]: !showPassword[entry.id],
                                    })
                                  }
                                >
                                  {showPassword[entry.id] ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleCopy(entry.password!)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.url}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditEntry(entry)}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No entries yet. Click "Add Entry" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Entry Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Entry" : "Add Entry"}
              </DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Update your password entry"
                  : "Create a new password entry"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Gmail, GitHub"
                  value={entryForm.name}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username / Email</Label>
                <Input
                  id="username"
                  placeholder="user@example.com"
                  value={entryForm.username}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    placeholder="••••••••"
                    value={entryForm.password}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, password: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={entryForm.url}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, url: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional information"
                  value={entryForm.notes}
                  onChange={(e) =>
                    setEntryForm({ ...entryForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEntry}
                disabled={!entryForm.name || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
