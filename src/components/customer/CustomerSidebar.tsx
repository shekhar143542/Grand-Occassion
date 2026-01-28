import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Crown,
  Home,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'My Bookings', url: '/bookings', icon: Calendar },
];

const requestItems = [
  { title: 'Pending', status: 'pending', url: '/dashboard/pending', icon: Clock, color: 'text-amber-500' },
  { title: 'Payment Required', status: 'payment_pending', url: '/dashboard/payment_pending', icon: CreditCard, color: 'text-purple-500' },
  { title: 'Approved', status: 'approved', url: '/dashboard/approved', icon: CheckCircle, color: 'text-green-500' },
  { title: 'Rejected', status: 'rejected', url: '/dashboard/rejected', icon: XCircle, color: 'text-red-500' },
];

export function CustomerSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();

  // Fetch booking counts by status
  const { data: bookingCounts } = useQuery({
    queryKey: ['booking-counts', user?.id],
    queryFn: async () => {
      if (!user) return {};

      const { data, error } = await supabase
        .from('bookings')
        .select('status')
        .eq('user_id', user.id);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((booking) => {
        counts[booking.status] = (counts[booking.status] || 0) + 1;
      });

      return counts;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-secondary shrink-0" />
          {state !== 'collapsed' && (
            <span className="font-serif font-semibold">Royal Banquets</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2"
                      activeClassName="bg-muted text-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Request Status */}
        <SidebarGroup>
          <SidebarGroupLabel>Requests</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {requestItems.map((item) => {
                const count = bookingCounts?.[item.status] || 0;
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={`${item.title}: ${count}`}
                    >
                      <NavLink
                        to={item.url}
                        className="flex items-center justify-between w-full"
                        activeClassName="bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                          <span>{item.title}</span>
                        </div>
                        {count > 0 && state !== 'collapsed' && (
                          <span className={`text-xs font-medium ${item.color}`}>
                            {count}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New Booking">
                  <Link to="/halls" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>New Booking</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="View Documents">
                  <Link to="/bookings" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>My Documents</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {state !== 'collapsed' && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
        {state !== 'collapsed' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 border-border text-foreground hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
