import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (isDemo) {
    const cookieStore = await cookies();
    const demoSession = cookieStore.get("demo_session")?.value;

    if (demoSession !== "true") {
      redirect("/admin/login");
    }

    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader userName="Admin (modo demo)" />
          <main className="flex-1 overflow-y-auto bg-muted p-6">{children}</main>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader userName={profile?.name ?? "Admin"} />
        <main className="flex-1 overflow-y-auto bg-muted p-6">{children}</main>
      </div>
    </div>
  );
}
