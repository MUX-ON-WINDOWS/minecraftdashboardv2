import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkServerStatus } from "@/utils/serverStatus";
import { useNavigate } from "react-router-dom";

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerAdded: (server: any) => void;
}

interface ServerData {
  name: string;
  ip: string;
  port: string;
  url: string | null;
  status: string;
  players: number;
  user_id: string;
}

const AddServerDialog = ({ open, onOpenChange, onServerAdded }: AddServerDialogProps) => {
  const [serverName, setServerName] = useState("");
  const [serverIP, setServerIP] = useState("");
  const [serverPort, setServerPort] = useState("");
  const [serverURL, setServerURL] = useState("");
  const [serverStatus, setServerStatus] = useState("Offline");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateServerInfo = () => {
    // Check if we have a URL
    if (serverURL) {
      return true;
    }
    
    // Check if we have both IP and PORT
    if (serverIP && serverPort) {
      return true;
    }
    
    return false;
  };

  const checkStatus = async () => {
    if (!validateServerInfo()) {
      toast({
        title: "Missing information",
        description: "Please enter either a server URL or both IP and Port to check status",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingStatus(true);
    try {
      const address = serverURL || `${serverIP}:${serverPort}`;
      const status = await checkServerStatus(address);
      
      setServerStatus(status.online ? "Online" : "Offline");
      
      if (status.online) {
        toast({
          title: "Server is online",
          description: `Players: ${status.players?.online || 0}/${status.players?.max || 0}`,
        });
      } else {
        toast({
          title: "Server is offline",
          description: "The server appears to be offline",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error checking status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverName || !validateServerInfo()) {
      toast({
        title: "Missing information",
        description: "Please enter a server name and either a server URL or both IP and Port",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("You must be logged in to add a server");
      }

      const serverData: ServerData = {
        name: serverName,
        ip: serverIP || "0.0.0.0", // Default IP if not provided
        port: serverPort || "25565", // Default port if not provided
        url: serverURL || null,
        status: serverStatus,
        players: 0,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from("servers")
        .insert(serverData)
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        onServerAdded(data[0]);
        resetForm();
      }
    } catch (error: any) {
      toast({
        title: "Error adding server",
        description: error.message,
        variant: "destructive",
      });
      
      if (error.message.includes("logged in")) {
        // Redirect to login if not authenticated
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setServerName("");
    setServerIP("");
    setServerPort("");
    setServerURL("");
    setServerStatus("Offline");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="serverName">Server Name *</Label>
            <Input
              id="serverName"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="My Minecraft Server"
              required
            />
          </div>
          
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="serverURL">Server URL (optional)</Label>
            <Input
              id="serverURL"
              value={serverURL}
              onChange={(e) => setServerURL(e.target.value)}
              placeholder="example.joinmc.link"
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            OR
          </div>
          
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="serverIP">Server IP (optional)</Label>
            <Input
              id="serverIP"
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              placeholder="192.168.1.100"
            />
          </div>
          
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="serverPort">Server Port (optional)</Label>
            <Input
              id="serverPort"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              placeholder="25565"
            />
          </div>
          
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="serverStatus">Server Status</Label>
            <div className="flex gap-2">
              <Select value={serverStatus} onValueChange={setServerStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Issue">Issue</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                onClick={checkStatus}
                disabled={isCheckingStatus}
              >
                {isCheckingStatus ? "Checking..." : "Check Status"}
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Server"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServerDialog;
