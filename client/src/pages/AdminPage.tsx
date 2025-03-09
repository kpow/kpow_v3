import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlbumLookup } from "@/components/admin/AlbumLookup";
import { ITunesSearch } from "@/components/admin/iTunesSearch";

interface PendingUser {
  id: number;
  username: string;
  createdAt: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingUsers, isLoading } = useQuery<PendingUser[]>({
    queryKey: ["/api/admin/pending-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pending-users");
      if (!res.ok) throw new Error("Failed to fetch pending users");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to approve user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      toast({
        title: "User approved",
        description: "The user can now log in to their account.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to approve user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* User Approval Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Users</h2>
        {pendingUsers?.length === 0 ? (
          <p className="text-muted-foreground">No pending users to approve.</p>
        ) : (
          <div className="grid gap-4">
            {pendingUsers?.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Registered on: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => approveMutation.mutate(user.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Last.fm Album Lookup Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Last.fm Album Lookup</h2>
        <AlbumLookup />
      </div>

      {/* iTunes Search Section */}
      <ITunesSearch />
    </div>
  );
}