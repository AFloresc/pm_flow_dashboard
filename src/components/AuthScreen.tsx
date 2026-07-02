import { useState } from "react";
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  ToggleButton, 
  ToggleButtonGroup, 
  Alert, 
  Divider,
  Paper
} from "@mui/material";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { AppUser, UserRole } from "../types";
import { Lock, Mail, User, ShieldCheck, Zap } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (user: AppUser) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("manager");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRole: UserRole | null,
  ) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Firebase Sign In
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (authErr: any) {
          // Fallback check if user exists locally
          if (email === "manager@demo.com" && password === "demomanager") {
            const mockUser: AppUser = {
              uid: "demo_manager",
              email: "manager@demo.com",
              displayName: "Demo Manager",
              role: "manager"
            };
            localStorage.setItem("pm_current_user", JSON.stringify(mockUser));
            onAuthSuccess(mockUser);
            setLoading(false);
            return;
          } else if (email === "member@demo.com" && password === "demomember") {
            const mockUser: AppUser = {
              uid: "demo_member",
              email: "member@demo.com",
              displayName: "Demo Collaborator",
              role: "member"
            };
            localStorage.setItem("pm_current_user", JSON.stringify(mockUser));
            onAuthSuccess(mockUser);
            setLoading(false);
            return;
          }
          throw authErr;
        }

        const user = userCredential.user;
        let userRole: UserRole = "member";
        let name = user.displayName || "Team Member";

        // Fetch custom role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userRole = data.role || "member";
            name = data.displayName || name;
          }
        } catch {
          console.log("Firestore unreachable, defaulting to member role");
        }

        const authenticatedUser: AppUser = {
          uid: user.uid,
          email: user.email || email,
          displayName: name,
          role: userRole
        };

        localStorage.setItem("pm_current_user", JSON.stringify(authenticatedUser));
        onAuthSuccess(authenticatedUser);

      } else {
        // Firebase Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const newUser: AppUser = {
          uid: user.uid,
          email: email,
          displayName: displayName || email.split("@")[0],
          role: role
        };

        // Store custom role in Firestore
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: email,
            displayName: newUser.displayName,
            role: role
          });
        } catch (err) {
          console.error("Failed to store user role in Firestore:", err);
        }

        localStorage.setItem("pm_current_user", JSON.stringify(newUser));
        onAuthSuccess(newUser);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const loginDemoUser = (demoRole: UserRole) => {
    const mockUser: AppUser = {
      uid: demoRole === "manager" ? "demo_manager" : "demo_member",
      email: demoRole === "manager" ? "manager@demo.com" : "member@demo.com",
      displayName: demoRole === "manager" ? "Demo Project Manager" : "Demo Team Collaborator",
      role: demoRole
    };
    localStorage.setItem("pm_current_user", JSON.stringify(mockUser));
    onAuthSuccess(mockUser);
  };

  return (
    <Box 
      sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        bgcolor: "grey.50",
        p: 3
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 450, boxShadow: 6, borderRadius: 3 }}>
        <Box 
          sx={{ 
            bgcolor: "primary.main", 
            color: "primary.contrastText", 
            py: 4, 
            px: 3, 
            textAlign: "center" 
          }}
        >
          <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
            <ShieldCheck size={36} />
            <Typography variant="h4" fontWeight="bold">PRO-FLOW</Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Enterprise Resource & Task Management
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleAuth} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {!isLogin && (
              <>
                <TextField
                  label="Display Name"
                  fullWidth
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  InputProps={{
                    startAdornment: <User size={20} className="mr-2 text-gray-400" />
                  }}
                />

                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Account Role
                  </Typography>
                  <ToggleButtonGroup
                    value={role}
                    exclusive
                    onChange={handleRoleChange}
                    fullWidth
                    color="primary"
                  >
                    <ToggleButton value="manager" sx={{ textTransform: "none", py: 1 }}>
                      Project Manager
                    </ToggleButton>
                    <ToggleButton value="member" sx={{ textTransform: "none", py: 1 }}>
                      Team Member
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </>
            )}

            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <Mail size={20} className="mr-2 text-gray-400" />
              }}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <Lock size={20} className="mr-2 text-gray-400" />
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, fontWeight: "bold", textTransform: "none" }}
            >
              {loading ? "Authenticating..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              variant="text"
              onClick={() => setIsLogin(!isLogin)}
              sx={{ textTransform: "none" }}
            >
              {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>OR DEMO SIGN-IN</Divider>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => loginDemoUser("manager")}
              startIcon={<Zap size={16} />}
              sx={{ textTransform: "none", py: 1 }}
            >
              Manager Mode
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => loginDemoUser("member")}
              startIcon={<User size={16} />}
              sx={{ textTransform: "none", py: 1 }}
            >
              Collaborator Mode
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
