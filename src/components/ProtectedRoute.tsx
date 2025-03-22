import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: JSX.Element;
  redirectPath?: string;
}

const ProtectedRoute = ({ children, redirectPath }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event !== "PASSWORD_RECOVERY") {
          setSession(session);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to={redirectPath ?? "/sign-in"} replace />;
  }

  return children;
};

export default ProtectedRoute;
