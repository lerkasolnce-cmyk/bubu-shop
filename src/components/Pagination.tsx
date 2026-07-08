import Link from "next/link";

export default function Pagination({
  total,
  page,
  pageSize,
  makeHref,
  prevLabel,
  nextLabel,
}: {
  total: number;
  page: number;
  pageSize: number;
  makeHref: (page: number) => string;
  prevLabel: string;
  nextLabel: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const keep = new Set<number>([1, totalPages]);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= totalPages) keep.add(p);
  }
  const sorted = Array.from(keep).sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  let prev: number | null = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) items.push("ellipsis");
    items.push(p);
    prev = p;
  }

  const navBtn = "rounded-full border border-blush/60 px-3 py-1.5 text-sm font-medium";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-4" aria-label="Pagination">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className={`${navBtn} bg-white text-ink hover:bg-blush/20`}>
          {prevLabel}
        </Link>
      ) : (
        <span className={`${navBtn} pointer-events-none bg-white text-ink/30`}>{prevLabel}</span>
      )}

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-sm text-ink/40">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={makeHref(item)}
            aria-current={item === page ? "page" : undefined}
            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-medium ${
              item === page ? "bg-accent text-cream" : "border border-blush/60 bg-white text-ink hover:bg-blush/20"
            }`}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={makeHref(page + 1)} className={`${navBtn} bg-white text-ink hover:bg-blush/20`}>
          {nextLabel}
        </Link>
      ) : (
        <span className={`${navBtn} pointer-events-none bg-white text-ink/30`}>{nextLabel}</span>
      )}
    </nav>
  );
}
