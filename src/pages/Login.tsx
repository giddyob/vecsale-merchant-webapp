import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Shield, Github, Chrome, Twitter, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { signIn, signUp, signInWithProvider, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignUp) {
        if (!fullName) {
          toast.error("Please enter your full name");
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success("Account created! Check your email to confirm, then sign in.");
        setIsSignUp(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Store className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="font-heading text-3xl font-bold text-background">VecSale</span>
          </div>
          <h1 className="font-heading text-4xl font-bold text-background mb-4 leading-tight">
            Grow your business with VecSale deals.
          </h1>
          <p className="text-background/60 text-lg leading-relaxed">
            Reach thousands of customers in Ghana. Create deals, track sales, and manage payouts — all from one dashboard.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            {["Upload & manage deals easily", "Track redemptions in real-time", "Fast & reliable payouts"].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-background/80">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login/Signup */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-heading text-2xl font-bold">VecSale</span>
          </div>

          <h2 className="font-heading text-2xl font-bold mb-2">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignUp ? "Sign up to start managing your deals" : "Sign in to your merchant dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full h-11 gap-2" size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSignUp ? "Create Account" : "Sign In"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Social logins */}
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" type="button" onClick={() => signInWithProvider("google")} className="h-10">
              <Chrome className="h-4 w-4" />
            </Button>
            <Button variant="outline" type="button" onClick={() => signInWithProvider("twitter")} className="h-10">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="outline" type="button" onClick={() => signInWithProvider("github")} className="h-10">
              <Github className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
