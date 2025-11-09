// src/app/authors/[id]/page.tsx

import AuthorDetailClient from './AuthorDetailClient'

export default async function AuthorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams

  return <AuthorDetailClient authorId={id} initialTab={tab} />
}
