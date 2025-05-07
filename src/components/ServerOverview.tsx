
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ServerOverviewProps {
  server: any;
  onBack: () => void;
}

const ServerOverview = ({ server, onBack }: ServerOverviewProps) => {
  const [serverData, setServerData] = useState(server);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setServerData({ ...serverData, [name]: value });
  };

  const handleStatusChange = (value: string) => {
    setServerData({ ...serverData, status: value });
  };

  const handlePlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const players = parseInt(e.target.value) || 0;
    setServerData({ ...serverData, players });
  };

  const saveChanges = async () => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("servers")
        .update({
          name: serverData.name,
          ip: serverData.ip,
          port: serverData.port,
          url: serverData.url,
          status: serverData.status,
          players: serverData.players,
          updated_at: new Date().toISOString(),
        })
        .eq("id", serverData.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Server updated",
        description: "The server details have been updated successfully",
      });
      
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error updating server",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to servers
        </Button>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Server Details: {serverData.name}</span>
              <Button 
                variant={isEditing ? "default" : "outline"}
                onClick={() => isEditing ? saveChanges() : setIsEditing(true)}
                disabled={isSaving}
              >
                {isEditing ? (isSaving ? "Saving..." : "Save Changes") : "Edit Server"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={serverData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="ip">Server IP</Label>
                <Input
                  id="ip"
                  name="ip"
                  value={serverData.ip}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="port">Server Port</Label>
                <Input
                  id="port"
                  name="port"
                  value={serverData.port}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="url">Server URL</Label>
                <Input
                  id="url"
                  name="url"
                  value={serverData.url || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Server Status</Label>
                {isEditing ? (
                  <Select 
                    value={serverData.status} 
                    onValueChange={handleStatusChange}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Issue">Issue</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={serverData.status}
                    disabled={true}
                    className="mt-1"
                  />
                )}
              </div>
              
              <div>
                <Label htmlFor="players">Players Online</Label>
                <Input
                  id="players"
                  name="players"
                  type="number"
                  min="0"
                  value={serverData.players}
                  onChange={handlePlayersChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Label>Created At</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(serverData.created_at).toLocaleString()}
              </p>
            </div>
            
            <div>
              <Label>Last Updated</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(serverData.updated_at).toLocaleString()}
              </p>
            </div>
            
            {isEditing && (
              <div className="pt-4">
                <Button variant="outline" className="mr-2" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={saveChanges} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ServerOverview;
