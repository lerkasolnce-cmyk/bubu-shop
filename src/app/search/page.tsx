export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <p className="px-4 py-8">Search: {q ?? ""}</p>;
}
