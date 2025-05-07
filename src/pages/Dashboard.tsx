
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCards from "@/components/StatsCards";
import { supabase } from "@/integrations/supabase/client";
import AddServerDialog from "@/components/AddServerDialog";
import { useNavigate } from "react-router-dom";
import ServerOverview from "@/components/ServerOverview";

const Dashboard = () => {
  const [servers, setServers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("servers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setServers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching servers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteServer = async (id: string) => {
    try {
      const { error } = await supabase
        .from("servers")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setServers(servers.filter(server => server.id !== id));
      toast({
        title: "Server deleted",
        description: "The server has been removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting server",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addServer = (newServer: any) => {
    setServers([newServer, ...servers]);
    setIsAddServerOpen(false);
    toast({
      title: "Server added",
      description: "The server has been added successfully",
    });
  };

  const refreshServers = async () => {
    setIsRefreshing(true);
    await fetchServers();
    toast({
      title: "Refreshed",
      description: "Server list has been refreshed",
    });
    setIsRefreshing(false);
  };

  const viewServerOverview = (server: any) => {
    setSelectedServer(server);
  };

  const closeServerOverview = () => {
    setSelectedServer(null);
  };

  // Calculate stats
  const stats = {
    playersOnline: servers.reduce((sum, server) => sum + (server.players || 0), 0),
    serversOnline: servers.filter(server => server.status === "Online").length,
    maintenanceCount: servers.filter(server => server.status === "Maintenance").length,
    issuesCount: servers.filter(server => server.status === "Issue").length,
  };

  if (selectedServer) {
    return <ServerOverview server={selectedServer} onBack={closeServerOverview} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardHeader onAddServer={() => setIsAddServerOpen(true)} />
      
      <main className="container mx-auto px-4 py-6">
        <StatsCards stats={stats} />
        
        <Card className="mt-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle>Server List</CardTitle>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshServers}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Server Name</TableHead>
                    <TableHead>Server IP</TableHead>
                    <TableHead>Server Port</TableHead>
                    <TableHead>Server URL</TableHead>
                    <TableHead>Server Status</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Loading servers...
                      </TableCell>
                    </TableRow>
                  ) : servers.length > 0 ? (
                    servers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell className="font-medium">{server.name}</TableCell>
                        <TableCell>{server.ip}</TableCell>
                        <TableCell>{server.port}</TableCell>
                        <TableCell>{server.url || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            server.status === "Online" 
                              ? "bg-green-100 text-green-800" 
                              : server.status === "Maintenance"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}>
                            {server.status}
                          </span>
                        </TableCell>
                        <TableCell>{server.players}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mr-2"
                            onClick={() => viewServerOverview(server)}
                          >
                            Overview
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteServer(server.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        No servers available. Click "Add server" to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <AddServerDialog 
        open={isAddServerOpen} 
        onOpenChange={setIsAddServerOpen} 
        onServerAdded={addServer}
      />
    </div>
  );
};

export default Dashboard;
