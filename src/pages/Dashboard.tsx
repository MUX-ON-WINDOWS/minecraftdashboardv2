import { useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash, RefreshCw, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCards from "@/components/StatsCards";
import { supabase } from "@/integrations/supabase/client";
import AddServerDialog from "@/components/AddServerDialog";
import DeleteServerDialog from "@/components/DeleteServerDialog";
import { useNavigate } from "react-router-dom";
import ServerOverview from "@/components/ServerOverview";
import { checkServerStatus } from "@/utils/serverStatus";

interface Server {
  id: string;
  name: string;
  ip: string;
  port: string;
  url: string | null;
  status: string;
  players: number;
  user_id: string;
  created_at: string;
}

const Dashboard = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<Server | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchServers = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to view servers");
      }

      const { data, error } = await supabase
        .from("servers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (signal?.aborted) return;

      // Check status for each server
      const updatedServers = await Promise.all(
        (data || []).map(async (server) => {
          if (signal?.aborted) return server;
          try {
            const address = server.url || server.ip;
            if (!address) return server;

            const status = await checkServerStatus(address);
            const updatedServer = {
              ...server,
              status: status.online ? "Online" : "Offline",
              players: status.players?.online || 0
            };

            if (signal?.aborted) return server;

            // Update in database
            await supabase
              .from("servers")
              .update({
                status: updatedServer.status,
                players: updatedServer.players
              })
              .eq("id", server.id);

            return updatedServer;
          } catch (error) {
            console.error(`Error checking status for server ${server.name}:`, error);
            return server;
          }
        })
      );

      if (!signal?.aborted) {
        setServers(updatedServers);
      }
    } catch (error: any) {
      if (!signal?.aborted) {
        console.error("Error fetching servers:", error);
        toast({
          title: "Error fetching servers",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const scheduleRefresh = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      setIsAutoRefreshing(true);
      try {
        await fetchServers(abortControllerRef.current.signal);
      } finally {
        setIsAutoRefreshing(false);
        scheduleRefresh();
      }
    }, 2 * 60 * 1000);
  };

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    fetchServers(abortControllerRef.current.signal);
    scheduleRefresh();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const checkAllServerStatuses = async () => {
    const updatedServers = await Promise.all(
      servers.map(async (server) => {
        try {
          const address = server.url || server.ip;
          if (!address) return server;

          const status = await checkServerStatus(address);
          const updatedServer = {
            ...server,
            status: status.online ? "Online" : "Offline",
            players: status.players?.online || 0
          };

          // Update in database
          await supabase
            .from("servers")
            .update({
              status: updatedServer.status,
              players: updatedServer.players
            })
            .eq("id", server.id);

          return updatedServer;
        } catch (error) {
          console.error(`Error checking status for server ${server.name}:`, error);
          return server;
        }
      })
    );

    setServers(updatedServers);
  };

  const handleDeleteClick = (server: Server) => {
    setServerToDelete(server);
    setDeleteDialogOpen(true);
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

  const addServer = (newServer: Server) => {
    setServers([newServer, ...servers]);
    setIsAddServerOpen(false);
    toast({
      title: "Server added",
      description: "The server has been added successfully",
    });
  };

  const refreshServers = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      await fetchServers(abortControllerRef.current.signal);
      toast({
        title: "Refreshed",
        description: "Server statuses have been updated",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const viewServerOverview = (server: Server) => {
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Server List</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={refreshServers}
                  disabled={isRefreshing || isAutoRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${(isRefreshing || isAutoRefreshing) ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="default" 
                  size="icon"
                  onClick={() => setIsAddServerOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
                      <TableCell colSpan={7} className="text-center py-12">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                        <div className="mt-2 text-sm text-muted-foreground">Loading servers...</div>
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
                            onClick={() => handleDeleteClick(server)}
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

      <DeleteServerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        serverName={serverToDelete?.name || ''}
        onConfirm={() => serverToDelete && deleteServer(serverToDelete.id)}
      />
    </div>
  );
};

export default Dashboard;
