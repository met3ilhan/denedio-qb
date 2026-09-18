import { NextResponse } from "next/server";

import {
  createFingerprintRepository,
  FingerprintLockedError,
  mergeMutableFingerprintUpdate,
} from "@/modules/fingerprints/repository/fingerprint-repository";
import { pedagogicalFingerprintSchema } from "@/shared/validation/pedagogical-fingerprint";
import { prisma } from "@/shared/db/client";

export const runtime = "nodejs";

type Params = { params: Promise<{ versionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { versionId } = await params;
  const repo = createFingerprintRepository(prisma);
  const version = await repo.getVersionById(versionId);
  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ version });
}

export async function PATCH(request: Request, { params }: Params) {
  const { versionId } = await params;
  const body = (await request.json()) as { mutable_surface_notes?: string };
  const repo = createFingerprintRepository(prisma);
  const version = await repo.getVersionById(versionId);
  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const current = pedagogicalFingerprintSchema.parse(version.payload);
    const next = mergeMutableFingerprintUpdate(current, {
      mutable_surface_notes: body.mutable_surface_notes,
    });
    const updated = await repo.updateDraftPayload(versionId, next);
    return NextResponse.json({ version: updated });
  } catch (error) {
    if (error instanceof FingerprintLockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
