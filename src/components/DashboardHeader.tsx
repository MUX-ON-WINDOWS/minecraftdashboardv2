
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";

interface DashboardHeaderProps {
  onLogout: () => void;
  onAddServer: () => void;
}

const DashboardHeader = ({ onLogout, onAddServer }: DashboardHeaderProps) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Server Overview</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={onAddServer} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" /> Add server
          </Button>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
