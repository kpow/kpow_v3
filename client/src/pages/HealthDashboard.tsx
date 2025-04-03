import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCcw, 
  Database, 
  Server, 
  Clock, 
  Activity 
} from "lucide-react";

interface SystemStatus {
  status: string;
  timestamp: string;
  message: string;
}

interface DatabaseStatus {
  status: string;
  timestamp: string;
  database?: {
    connected: boolean;
    serverTime?: string;
  };
  message?: string;
  error?: string;
}

interface DatabaseInfo {
  protocol?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  has_username?: boolean;
  has_password?: boolean;
  search_params?: Record<string, string>;
  pool_total?: number;
  pool_idle?: number;
  pool_waiting?: number;
  error?: string;
  message?: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ok') {
    return <Badge className="bg-green-500 hover:bg-green-600">Healthy</Badge>;
  } 
  if (status === 'warning') {
    return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
  }
  return <Badge className="bg-red-500 hover:bg-red-600">Error</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok') {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  } 
  if (status === 'warning') {
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  }
  return <XCircle className="h-5 w-5 text-red-500" />;
}

function HealthCard({ title, status, children, icon, onRefresh }: {
  title: string;
  status: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onRefresh: () => void;
}) {
  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={status} />
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

export default function HealthDashboard() {
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query for basic health check
  const { 
    data: basicHealth,
    status: basicStatus,
    refetch: refetchBasic,
    isLoading: basicLoading,
    error: basicError
  } = useQuery({
    queryKey: ['health', 'basic', refreshTrigger],
    queryFn: async () => {
      const response = await axios.get<SystemStatus>('/api/health/basic');
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Query for database health
  const { 
    data: dbHealth,
    status: dbStatus,
    refetch: refetchDb,
    isLoading: dbLoading,
    error: dbError
  } = useQuery({
    queryKey: ['health', 'db', refreshTrigger],
    queryFn: async () => {
      const response = await axios.get<DatabaseStatus>('/api/health/db', {
        timeout: 8000 // Longer timeout for DB operations
      });
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Query for database info
  const { 
    data: dbInfo,
    status: dbInfoStatus,
    refetch: refetchDbInfo,
    isLoading: dbInfoLoading,
    error: dbInfoError
  } = useQuery({
    queryKey: ['health', 'dbinfo', refreshTrigger],
    queryFn: async () => {
      const response = await axios.get<DatabaseInfo>('/api/health/db-info', {
        timeout: 5000
      });
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Function to refresh all health checks
  const refreshAll = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Auto refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">System Health Dashboard</h1>
        <Button onClick={refreshAll} className="flex items-center space-x-2">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* API Status Card */}
        <HealthCard 
          title="API Status" 
          status={basicHealth?.status || 'error'}
          icon={<Server className="h-5 w-5 text-blue-500" />}
          onRefresh={() => refetchBasic()}
        >
          {basicLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : basicStatus === 'error' ? (
            <Alert variant="destructive">
              <AlertTitle className="flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Connection Error
              </AlertTitle>
              <AlertDescription>
                Unable to connect to the API: {(basicError as any)?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center">
                <StatusIcon status={basicHealth?.status || 'error'} />
                <span className="ml-2">{basicHealth?.message || 'No status message'}</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Last checked: {basicHealth ? formatDate(basicHealth.timestamp) : 'Never'}
              </div>
            </div>
          )}
        </HealthCard>

        {/* Database Status Card */}
        <HealthCard 
          title="Database Status" 
          status={dbHealth?.status || 'error'}
          icon={<Database className="h-5 w-5 text-purple-500" />}
          onRefresh={() => refetchDb()}
        >
          {dbLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : dbStatus === 'error' || dbHealth?.status === 'error' ? (
            <Alert variant="destructive">
              <AlertTitle className="flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Database Error
              </AlertTitle>
              <AlertDescription>
                {dbHealth?.message || (dbError as any)?.message || 'Unknown database error'}
                {dbHealth?.error && <div className="mt-1 text-xs">{dbHealth.error}</div>}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center">
                <StatusIcon status={dbHealth?.status || 'error'} />
                <span className="ml-2">
                  {dbHealth?.database?.connected 
                    ? 'Database connection established' 
                    : 'Database connection issue'}
                </span>
              </div>
              {dbHealth?.database?.serverTime && (
                <div className="text-sm">
                  <span className="font-semibold">Server time:</span> {formatDate(dbHealth.database.serverTime)}
                </div>
              )}
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Last checked: {dbHealth ? formatDate(dbHealth.timestamp) : 'Never'}
              </div>
            </div>
          )}
        </HealthCard>
      </div>

      {/* Database Connection Details */}
      <div className="mb-6">
        <HealthCard 
          title="Database Connection Details" 
          status={dbInfoError ? 'error' : dbInfo?.error ? 'warning' : 'ok'}
          icon={<Activity className="h-5 w-5 text-indigo-500" />}
          onRefresh={() => refetchDbInfo()}
        >
          {dbInfoLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : dbInfoStatus === 'error' || dbInfo?.error ? (
            <Alert variant={dbInfo?.error ? "warning" : "destructive"}>
              <AlertTitle className="flex items-center">
                {dbInfo?.error ? (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {dbInfo?.error || 'Connection Info Error'}
              </AlertTitle>
              <AlertDescription>
                {dbInfo?.message || (dbInfoError as any)?.message || 'Unable to retrieve connection information'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-1">Connection</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Protocol:</span> {dbInfo?.protocol?.replace(':', '')}</div>
                  <div><span className="font-medium">Host:</span> {dbInfo?.hostname}</div>
                  <div><span className="font-medium">Port:</span> {dbInfo?.port}</div>
                  <div><span className="font-medium">Database:</span> {dbInfo?.pathname?.replace('/', '')}</div>
                  <div><span className="font-medium">Credentials:</span> {
                    dbInfo?.has_username && dbInfo?.has_password 
                      ? 'Configured' 
                      : 'Missing or incomplete'
                  }</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Connection Pool</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Total connections:</span> {dbInfo?.pool_total || 0}</div>
                  <div><span className="font-medium">Idle connections:</span> {dbInfo?.pool_idle || 0}</div>
                  <div><span className="font-medium">Waiting clients:</span> {dbInfo?.pool_waiting || 0}</div>
                </div>
              </div>
            </div>
          )}
        </HealthCard>
      </div>

      <div className="bg-muted p-4 rounded">
        <h3 className="font-semibold mb-2">About This Dashboard</h3>
        <p className="text-sm text-muted-foreground">
          This health dashboard provides real-time monitoring of system components, including API and database connectivity.
          Use the refresh buttons to manually check status, or wait for the automatic refresh every 20 seconds.
        </p>
      </div>
    </div>
  );
}