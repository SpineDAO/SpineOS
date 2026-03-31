import { useState } from "react";
import { CognitoUser, AuthenticationDetails, CognitoUserPool } from "amazon-cognito-identity-js";

const USER_POOL = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "us-east-1_ws3WP5o5t",
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "4qpj0t7lredc029cfrt76kr2dj",
});

const C = {
  canvas:      "#F7F4EE",
  canvasDark:  "#E0D9CC",
  pure:        "#FDFCF9",
  forest:      "#163D2B",
  forestMid:   "#1F5238",
  forestPale:  "#E8F2EC",
  forestBorder:"#A8CCBA",
  teal:        "#2D9D99",
  tealPale:    "#E0F2F2",
  ink:         "#1C1A16",
  inkMed:      "#3D3A32",
  inkSoft:     "#7A7568",
  inkFaint:    "#B8B2A8",
  white:       "#FDFCF9",
  error:       "#991B1B",
  errorBg:     "#FEE2E2",
};

const FONT = {
  display: "'Playfair Display SC', Georgia, serif",
  body:    "'Outfit', system-ui, sans-serif",
  mono:    "'IBM Plex Mono', monospace",
};

const chevron = `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L10 0 L20 10 L10 20 Z' fill='none' stroke='rgba(247,244,238,0.07)' stroke-width='0.7'/%3E%3C/svg%3E")`;

export default function AIRALogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [screen, setScreen] = useState<"login" | "newpassword">("login");
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return;
    setError("");
    setLoading(true);

    const user = new CognitoUser({ Username: email.trim(), Pool: USER_POOL });
    const authDetails = new AuthenticationDetails({
      Username: email.trim(),
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        setLoading(false);
        onLogin(session.getIdToken().getJwtToken());
      },
      onFailure: (err) => {
        setLoading(false);
        setError(err.message || "Sign in failed. Check your credentials.");
      },
      newPasswordRequired: () => {
        setLoading(false);
        setCognitoUser(user);
        setScreen("newpassword");
      },
    });
  };

  const handleNewPassword = () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);

    cognitoUser?.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: (session) => {
        setLoading(false);
        onLogin(session.getIdToken().getJwtToken());
      },
      onFailure: (err) => {
        setLoading(false);
        setError(err.message || "Failed to set password.");
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      screen === "login" ? handleLogin() : handleNewPassword();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.forest,
      backgroundImage: chevron,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: FONT.body,
    }}>
      <div style={{
        position: "fixed",
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(45,157,153,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0, marginBottom: 10 }}>
            <span style={{ fontFamily: FONT.display, fontSize: 15, fontWeight: 900, color: C.white, letterSpacing: "0.12em" }}>Op</span>
            <span style={{ fontFamily: FONT.display, fontSize: 15, fontWeight: 400, color: "#9ECFB2", letterSpacing: "0.10em" }}>Agent</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "#C4973E" }}>.ai</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0 }}>
            <span style={{ fontFamily: FONT.mono, fontSize: 52, fontWeight: 700, color: C.teal, letterSpacing: "0.12em", lineHeight: 1 }}>AI</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 52, fontWeight: 300, color: "rgba(247,244,238,0.7)", letterSpacing: "0.12em", lineHeight: 1 }}>RA</span>
          </div>

          <div style={{ fontFamily: FONT.mono, fontSize: 9, color: "rgba(247,244,238,0.3)", letterSpacing: "3px", textTransform: "uppercase", marginTop: 6 }}>
            Autonomous Intelligent Record Agent
          </div>
        </div>

        <div style={{
          background: C.pure,
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}>

          {screen === "login" && (
            <>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, color: C.teal, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>
                Physician Portal
              </div>

              {error && (
                <div style={{ background: C.errorBg, border: `1px solid rgba(153,27,27,0.2)`, borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontFamily: FONT.body, fontSize: 13, color: C.error }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>Email</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="you@uoi.com"
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    border: `2px solid ${email ? C.forest : C.canvasDark}`,
                    borderRadius: 10,
                    fontFamily: FONT.body,
                    fontSize: 15,
                    color: C.ink,
                    background: C.canvas,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>Password</div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    border: `2px solid ${password ? C.teal : C.canvasDark}`,
                    borderRadius: 10,
                    fontFamily: FONT.body,
                    fontSize: 15,
                    color: C.ink,
                    background: C.canvas,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: loading || !email || !password ? C.canvasDark : C.forest,
                  color: loading || !email || !password ? C.inkFaint : C.white,
                  border: "none",
                  borderRadius: 10,
                  fontFamily: FONT.body,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading || !email || !password ? "not-allowed" : "pointer",
                  letterSpacing: "0.5px",
                  transition: "all 0.15s",
                  boxShadow: (!loading && email && password) ? "0 4px 20px rgba(22,61,43,0.3)" : "none",
                }}
              >
                {loading ? "Signing in..." : "Sign In →"}
              </button>
            </>
          )}

          {screen === "newpassword" && (
            <>
              <div style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 900, color: C.ink, textAlign: "center", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Set Your Password
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 14, color: C.inkSoft, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
                Your account requires a new password to continue.
              </div>

              {error && (
                <div style={{ background: C.errorBg, border: `1px solid rgba(153,27,27,0.2)`, borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontFamily: FONT.body, fontSize: 13, color: C.error }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>New Password</div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Min 8 characters"
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    border: `2px solid ${newPassword ? C.teal : C.canvasDark}`,
                    borderRadius: 10,
                    fontFamily: FONT.body,
                    fontSize: 15,
                    color: C.ink,
                    background: C.canvas,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>Confirm Password</div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Re-enter password"
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    border: `2px solid ${confirmPassword ? (confirmPassword === newPassword ? C.forest : C.error) : C.canvasDark}`,
                    borderRadius: 10,
                    fontFamily: FONT.body,
                    fontSize: 15,
                    color: C.ink,
                    background: C.canvas,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <div style={{ fontFamily: FONT.body, fontSize: 12, color: C.error, marginTop: 6 }}>Passwords do not match</div>
                )}
              </div>

              <button
                onClick={handleNewPassword}
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: (loading || !newPassword || !confirmPassword || newPassword !== confirmPassword) ? C.canvasDark : C.forest,
                  color: (loading || !newPassword || !confirmPassword || newPassword !== confirmPassword) ? C.inkFaint : C.white,
                  border: "none",
                  borderRadius: 10,
                  fontFamily: FONT.body,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                  transition: "all 0.15s",
                }}
              >
                {loading ? "Setting password..." : "Set Password & Sign In →"}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontFamily: FONT.mono, fontSize: 9, color: "rgba(247,244,238,0.2)", letterSpacing: "1px", lineHeight: 1.8 }}>
          HIPAA Compliant · University Orthopedics Inc<br />
          © 2026 Diebo Holdings LLC
        </div>
      </div>
    </div>
  );
}
