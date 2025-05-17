export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Cloudflare",
      });
    }

    if (url.pathname.startsWith("/auth/callback")) {
      // Handle Supabase auth callback
      return Response.redirect(url.origin);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
