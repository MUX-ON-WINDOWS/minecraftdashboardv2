
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Server, Wrench, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  stats: {
    playersOnline: number;
    serversOnline: number;
    maintenanceCount: number;
    issuesCount: number;
  };
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Players Online
          </CardTitle>
          <User className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.playersOnline}</div>
          <CardDescription>
            Players currently online
          </CardDescription>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Servers Online
          </CardTitle>
          <Server className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.serversOnline}</div>
          <CardDescription>
            Servers currently online
          </CardDescription>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Maintenance
          </CardTitle>
          <Wrench className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.maintenanceCount}</div>
          <CardDescription>
            Servers in maintenance
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Issues
          </CardTitle>
          <AlertTriangle className="h-5 w-5 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.issuesCount}</div>
          <CardDescription>
            Servers with issues
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
