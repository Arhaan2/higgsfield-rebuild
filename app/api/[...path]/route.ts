import { env } from "cloudflare:workers";
import { readServerConfig } from "@/src/config/server";
import { handle } from "@/src/server/api";
export const dynamic = "force-dynamic";
function route(request:Request) {
  return handle(request,{db:env.DB,bucket:env.BUCKET,config:readServerConfig(),fetcher:fetch,now:Date.now});
}
export const GET = route;
export const HEAD = route;
export const POST = route;
export const PATCH = route;
export const PUT = route;
export const DELETE = route;
