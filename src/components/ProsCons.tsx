export function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <List
        title="Pros"
        items={pros}
        titleClass="text-emerald-700"
        markerClass="text-emerald-600"
        marker="+"
      />
      <List
        title="Cons"
        items={cons}
        titleClass="text-rose-700"
        markerClass="text-rose-500"
        marker="−"
      />
    </div>
  );
}

function List({
  title,
  items,
  titleClass,
  markerClass,
  marker,
}: {
  title: string;
  items: string[];
  titleClass: string;
  markerClass: string;
  marker: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4
        className={`mb-2 text-xs font-bold tracking-wider uppercase ${titleClass}`}
      >
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug text-stone-600">
            <span aria-hidden className={`mt-px font-bold ${markerClass}`}>
              {marker}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
