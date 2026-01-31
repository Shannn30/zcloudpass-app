import { useState } from "react";
import {
  registerUser,
  getVault,
  updateVault,
  login,
  changePassword as apiChangePassword,
  logout as apiLogout,
  getSessionToken,
} from "./api";
import { encryptVault, decryptVault, generateKey } from "./crypto";

interface VaultData {
  passwords: { site: string; username: string; password: string }[];
}

function App() {
  const [email, setEmail] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [vault, setVault] = useState<VaultData>({ passwords: [] });
  const [loggedIn, setLoggedIn] = useState(false);
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [currentPasswordForChange, setCurrentPasswordForChange] = useState("");
  const [newPasswordForChange, setNewPasswordForChange] = useState("");

  const [vaultVersion, setVaultVersion] = useState<number>(0);

  const BACKEND_VAULT_URL = "http://localhost:3000/api/v1/vault";

  const handleRegister = async () => {
    try {
      const key = await generateKey(masterPassword);
      const encryptedVault = await encryptVault(vault, key);
      await registerUser(email, encryptedVault, masterPassword);
      await login(email, masterPassword);
      setLoggedIn(true);
      alert("Registered successfully!");
    } catch (err: any) {
      console.error("Register error:", err);
      alert("Registration failed: " + (err?.message ?? String(err)));
    }
  };

  const handleLogin = async () => {
    try {
      await login(email, masterPassword);
      const data = await getVault(email, masterPassword);
      const encryptedVault = data?.encrypted_vault ?? null;
      const initialVersion =
        typeof data?.vault_version === "number" ? data.vault_version : 0;
      if (encryptedVault) {
        const key = await generateKey(masterPassword);
        const decryptedVault = await decryptVault(encryptedVault, key);
        setVault(decryptedVault);
      } else {
        setVault({ passwords: [] });
      }
      setVaultVersion(initialVersion);
      setLoggedIn(true);
    } catch (err: any) {
      console.error("Login error:", err);
      alert("Login failed: " + (err?.message ?? String(err)));
    }
  };

  const putVaultWithVersion = async (encryptedVault: string) => {
    const token = getSessionToken();
    if (!token) {
      throw new Error("No active session. Please login again.");
    }

    const res = await fetch(BACKEND_VAULT_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        encrypted_vault: encryptedVault,
        vault_version: vaultVersion,
      }),
    });

    if (res.status === 409) {
      const latestData = await getVault(email, masterPassword);
      alert("Conflict detected while updating vault. Reloading latest vault.");
      if (latestData && latestData.encrypted_vault) {
        const key = await generateKey(masterPassword);
        const dec = await decryptVault(latestData.encrypted_vault, key);
        setVault(dec);
        if (typeof latestData.vault_version === "number") {
          setVaultVersion(latestData.vault_version);
        }
      }
      return { ok: false, conflict: true };
    }

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Failed to update vault: ${res.status} ${txt}`);
    }

    setVaultVersion((v) => v + 1);
    return { ok: true, conflict: false };
  };

  const handleAddPassword = async () => {
    const newVault = {
      passwords: [...vault.passwords, { site, username, password }],
    };
    setVault(newVault);

    const key = await generateKey(masterPassword);
    const encryptedVault = await encryptVault(newVault, key);

    try {
      const result = await putVaultWithVersion(encryptedVault);
      if (!result.ok && result.conflict) {
      }
    } catch (err: any) {
      alert(`Failed to save vault: ${err.message || err}`);
    }

    setSite("");
    setUsername("");
    setPassword("");
  };

  const handleLogout = () => {
    apiLogout();
    setLoggedIn(false);
    setVault({ passwords: [] });
    setMasterPassword("");
    setVaultVersion(0);
    alert("Logged out.");
  };

  const handleChangePassword = async () => {
    if (!currentPasswordForChange || !newPasswordForChange) {
      alert("Please provide both current and new passwords.");
      return;
    }

    try {
      const vaultData = await getVault(email, currentPasswordForChange);
      let decVault = { passwords: [] as any[] };
      const encryptedVault = vaultData?.encrypted_vault ?? null;
      if (encryptedVault) {
        const keyOld = await generateKey(currentPasswordForChange);
        decVault = await decryptVault(encryptedVault, keyOld);
      }

      const keyNew = await generateKey(newPasswordForChange);
      const reEncrypted = await encryptVault(decVault, keyNew);

      const putResult = await putVaultWithVersion(reEncrypted);
      if (putResult.conflict) {
        alert("Conflict when updating vault during password change. Aborting.");
        return;
      }

      await apiChangePassword(currentPasswordForChange, newPasswordForChange);

      setMasterPassword(newPasswordForChange);
      setCurrentPasswordForChange("");
      setNewPasswordForChange("");
      alert(
        "Password changed successfully. Vault re-encrypted locally and uploaded.",
      );
    } catch (err: any) {
      alert(`Failed to change password: ${err.message || err}`);
    }
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>ZCloudPass</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Master Password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Your Vault</h1>

      <div style={{ marginBottom: 12 }}>
        <button onClick={handleLogout}>Logout</button>
        <span style={{ marginLeft: 12 }}>Vault version: {vaultVersion}</span>
      </div>

      <div>
        <input
          placeholder="Site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
        />
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleAddPassword}>Add Password</button>
      </div>

      <h2>Saved Passwords</h2>
      {vault.passwords.map((p, i) => (
        <div key={i}>
          <strong>{p.site}</strong>: {p.username} / {p.password}
        </div>
      ))}

      <hr style={{ marginTop: 20, marginBottom: 20 }} />

      <h2>Change Master Password</h2>
      <div>
        <input
          type="password"
          placeholder="Current Master Password"
          value={currentPasswordForChange}
          onChange={(e) => setCurrentPasswordForChange(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Master Password"
          value={newPasswordForChange}
          onChange={(e) => setNewPasswordForChange(e.target.value)}
        />
        <button onClick={handleChangePassword}>
          Change Password (re-encrypt vault)
        </button>
      </div>
    </div>
  );
}

export default App;
