
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerAdded: (server: any) => void;
}

const AddServerDialog = ({ open, onOpenChange, onServerAdded }: AddServerDialogProps) => {
  const [serverName, setServerName] = useState("");
  const [serverIP, setServerIP] = useState("");
  const [serverPort, setServerPort] = useState("");
  const [serverURL, setServerURL] = useState("");
  const [serverStatus, setServerStatus] = useState("Offline");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serverName || !serverIP || !serverPort) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("servers")
        .insert({
          name: serverName,
          ip: serverIP,
          port: serverPort,
          url: serverURL || null,
          status: serverStatus,
          players: 0,
        })
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
            <Label htmlFor="serverIP">Server IP *</Label>
            <Input
              id="serverIP"
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              placeholder="192.168.1.100"
              required
            />
          </div>
          
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="serverPort">Server Port *</Label>
            <Input
              id="serverPort"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              placeholder="25565"
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
          
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="serverStatus">Server Status</Label>
            <Select value={serverStatus} onValueChange={setServerStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Issue">Issue</SelectItem>
              </SelectContent>
            </Select>
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
