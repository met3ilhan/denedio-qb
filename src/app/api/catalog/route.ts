import { NextResponse } from "next/server";

import { listCatalogTree } from "@/modules/catalog";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listCatalogTree());
}
