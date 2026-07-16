"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function demoLoginAction() {
  const cookieStore = await cookies();
  cookieStore.set("demo_session", "true", {
    path: "/",
    maxAge: 60 * 60,
    httpOnly: true,
    sameSite: "lax",
  });
  redirect("/admin");
}
