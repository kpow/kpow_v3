import { useQuery } from "@tanstack/react-query";

export default function AdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin"],
    queryFn: async () => {
      const res = await fetch("/api/admin");
      if (!res.ok) throw new Error("Failed to fetch admin data");
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>{data?.message}</p>
    </div>
  );
}
