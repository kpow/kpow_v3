import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function Admin() {
  const [, setLocation] = useLocation();

  // Check if user is authenticated
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (error) {
      setLocation("/");
    }
  }, [error, setLocation]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-[100px] w-full mb-4" />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader />
      <main className="container mx-auto p-4">
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Welcome, {user?.email}
          </p>
        </div>
      </main>
    </div>
  );
}