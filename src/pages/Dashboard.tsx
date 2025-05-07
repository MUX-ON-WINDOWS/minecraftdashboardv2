
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCards from "@/components/StatsCards";

// Mock server data
const initialServerData = [
  {
    id: "1",
    name: "SMP met de mannen",
    ip: "192.168.1.100",
    port: "25565", 
    url: "rest-consolidated.gl.joinmc.link",
    status: "Online",
    players: 5,
  }
];

const Dashboard = () => {
  const [servers, setServers] = useState(initialServerData);
  const { toast } = useToast();

  const deleteServer = (id: string) => {
    setServers(servers.filter(server => server.id !== id));
    toast({
      title: "Server deleted",
      description: "The server has been removed successfully",
    });
  };

  const addServer = () => {
    toast({
      title: "Feature coming soon",
      description: "The ability to add new servers will be available soon",
    });
  };

  // Calculate stats
  const stats = {
    playersOnline: servers.reduce((sum, server) => sum + server.players, 0),
    serversOnline: servers.filter(server => server.status === "Online").length,
    maintenanceCount: 2, // Mock data
    issuesCount: 1, // Mock data
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardHeader onAddServer={addServer} />
      
      <main className="container mx-auto px-4 py-6">
        <StatsCards stats={stats} />
        
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle>Server List</CardTitle>
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
                  {servers.map((server) => (
                    <TableRow key={server.id}>
                      <TableCell className="font-medium">{server.name}</TableCell>
                      <TableCell>{server.ip}</TableCell>
                      <TableCell>{server.port}</TableCell>
                      <TableCell>{server.url}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          server.status === "Online" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {server.status}
                        </span>
                      </TableCell>
                      <TableCell>{server.players}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2">
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
                  ))}
                  {servers.length === 0 && (
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
    </div>
  );
};

export default Dashboard;
