
import { Button } from "@/components/ui/button";
import { LogOut, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
  onAddServer: () => void;
}

const DashboardHeader = ({ onAddServer }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username || session.user.email?.split('@')[0] || 'User');
        }
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Server Overview</h1>
          {username && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4 mr-1" />
              <span>{username}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onAddServer} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" /> Add server
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
