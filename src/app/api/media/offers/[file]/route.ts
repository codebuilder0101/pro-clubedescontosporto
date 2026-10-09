import { readFile } from "node:fs/promises";
import { getActiveSubscription, getCurrentUser } from "@/lib/auth/guards";
import { offerImagePath } from "@/lib/media";

// Offer photos are member content: only active members and admins get them.

export async function GET(_request: Request, { params }: RouteContext<"/api/media/offers/[file]">) {
  const { file } = await params;
  const filePath = offerImagePath(file);
  if (!filePath) return new Response("Not found", { status: 404 });

  const user = await getCurrentUser();
  const allowed = user && (user.role === "ADMIN" || (await getActiveSubscription(user.id)));
  if (!allowed) return new Response("Not found", { status: 404 });

  try {
    const body = await readFile(filePath);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/webp",
        // File names are unique per upload, so the content never changes.
        "Cache-Control": "private, max-age=2592000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
