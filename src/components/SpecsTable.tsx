import type { Product } from "@/lib/types";

export default function SpecsTable({ specs, title }: { specs: Product["specs"]; title: string }) {
  const entries = Object.entries(specs ?? {});
  if (entries.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-blush/40">
        <table className="w-full text-sm">
          <tbody>
            {entries.map(([key, value], i) => (
              <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-cream/60"}>
                <td className="w-1/2 px-4 py-2.5 font-semibold capitalize text-ink/70">{key}</td>
                <td className="px-4 py-2.5 text-ink">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
