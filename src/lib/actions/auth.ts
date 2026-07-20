"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/schemas/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    if (
      parsed.data.email !== "admin@delicadeza.com" ||
      parsed.data.password !== "123456"
    ) {
      return { error: "Email ou senha inválidos" };
    }
    const cookieStore = await cookies();
    cookieStore.set("demo_session", "true", {
      path: "/",
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
    });
    revalidatePath("/admin", "layout");
    redirect("/admin");
  }

  const supabase = createAdminClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logoutAction() {
  const supabase = createAdminClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("demo_session");
  revalidatePath("/admin", "layout");
  redirect("/login");
}
