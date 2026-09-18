import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function StructuredReviewPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/sources/${id}/review`);
}
