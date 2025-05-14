import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminProtectedRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isAdmin === null) {
    return <div>Loading...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminProtectedRoute; 