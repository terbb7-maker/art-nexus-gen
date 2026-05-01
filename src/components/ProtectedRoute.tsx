import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Sparkles } from "lucide-react";

export const ProtectedRoute = ({ children, requireOnboarding = true }: { children: ReactNode; requireOnboarding?: boolean }) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: pLoading } = useProfile();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav("/login", { replace: true });
      return;
    }
    if (requireOnboarding && profile && !profile.onboarding_completed && loc.pathname !== "/onboarding") {
      nav("/onboarding", { replace: true });
    }
  }, [user, loading, profile, nav, requireOnboarding, loc.pathname]);

  if (loading || pLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }
  return <>{children}</>;
};
