import { Layout } from "@/components/ui/layout";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ManageUsers() {
  // Fetch all users
  const { data: users, isLoading } = useQuery<Partial<User>[]>({
    queryKey: ["/api/users"],
  });

  // Define table columns
  const columns: ColumnDef<Partial<User>>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "fullName",
      header: "Full Name",
    },
    {
      accessorKey: "isAdmin",
      header: "Role",
      cell: ({ row }) => {
        const isAdmin = row.original.isAdmin;
        return (
          <Badge variant={isAdmin ? "default" : "outline"}>
            {isAdmin ? "Admin" : "User"}
          </Badge>
        );
      },
    }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h2 className="text-2xl font-medium">Manage Users</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={users || []} 
            searchPlaceholder="Search users..."
            searchColumn="username"
          />
        )}
      </div>
    </Layout>
  );
}
