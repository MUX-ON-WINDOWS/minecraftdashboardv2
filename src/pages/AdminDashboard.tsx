import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Shield, User, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  username: string | null;
  created_at: string;
  avatar_url?: string;
  updated_at: string;
  is_admin?: boolean;
  email?: string;
}

interface User {
  id: string;
  username: string | null;
  created_at: string;
  avatar_url?: string;
  is_admin?: boolean;
  email?: string;
}

interface AnalyticsData {
  date: string;
  newUsers: number;
  activeUsers: number;
}

interface RoleDistribution {
  role: string;
  count: number;
}

type TimePeriod = 'week' | 'month' | 'year';

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchAnalytics();
    // Set up real-time subscription
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [timePeriod]);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, created_at, avatar_url, is_admin')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get current user's email for display
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserEmail = user?.email || '';

      // Map profiles to users
      const mappedUsers = (profiles || []).map(profile => ({
        ...profile,
        email: profile.id === user?.id ? currentUserEmail : '', // Only show email for current user
      }));

      setUsers(mappedUsers);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (period: TimePeriod) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        return { startDate, endDate, interval: 'day' };
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        return { startDate, endDate, interval: 'day' };
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        return { startDate, endDate, interval: 'month' };
    }
  };

  const formatDate = (date: Date, interval: 'day' | 'month') => {
    if (interval === 'day') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const fetchAnalytics = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('created_at, updated_at, is_admin')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const { startDate, endDate, interval } = getDateRange(timePeriod);
      const dates: Date[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        if (interval === 'day') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Calculate user growth and activity
      const analytics = dates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const nextDate = new Date(date);
        if (interval === 'day') {
          nextDate.setDate(date.getDate() + 1);
        } else {
          nextDate.setMonth(date.getMonth() + 1);
        }
        const nextDateStr = nextDate.toISOString().split('T')[0];

        const newUsers = profiles?.filter(p => 
          p.created_at >= dateStr && p.created_at < nextDateStr
        ).length || 0;

        const activeUsers = profiles?.filter(p => 
          p.updated_at && p.updated_at >= dateStr && p.updated_at < nextDateStr
        ).length || 0;

        return {
          date: formatDate(date, interval),
          newUsers,
          activeUsers,
        };
      });

      setAnalyticsData(analytics);

      // Calculate role distribution
      const adminCount = profiles?.filter(p => p.is_admin).length || 0;
      const userCount = (profiles?.length || 0) - adminCount;

      setRoleDistribution([
        { role: 'Admins', count: adminCount },
        { role: 'Users', count: userCount },
      ]);
    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Delete from profiles first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      });

      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleAdminStatus = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !user.is_admin })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Admin status updated",
        description: `User ${user.username || user.email} is now ${!user.is_admin ? 'an admin' : 'a regular user'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating admin status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDisplayName = (user: User) => {
    return user.username || user.email || 'Unnamed User';
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{getDisplayName(user)}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={`${getDisplayName(user)}'s avatar`} 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => toggleAdminStatus(user)}
                              className="flex items-center gap-2"
                            >
                              <Shield className="h-4 w-4" />
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              className="flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-4">
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTimePeriod('week')}>
                    Week
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimePeriod('month')}>
                    Month
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimePeriod('year')}>
                    Year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="newUsers"
                          stroke="#8884d8"
                          strokeWidth={2}
                          name="New Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="activeUsers"
                          fill="#82ca9d"
                          name="Active Users"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>User Role Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="role" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#8884d8"
                          name="Number of Users"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              {selectedUser && ` ${getDisplayName(selectedUser)}`} and all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard; 