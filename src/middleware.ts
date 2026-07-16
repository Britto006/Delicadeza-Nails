import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const publicRoutes = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPrefixes = ["/_next", "/favicon", "/api/slots"];
  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    if (request.cookies.get("demo_session")?.value === "true") {
      return NextResponse.next({ request });
    }
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
