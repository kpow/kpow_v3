import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Not authenticated");
      return response.json();
    },
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { credentials: "include" });
    setLocation("/");
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-slackey">admin dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Logged in as {user?.email}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
