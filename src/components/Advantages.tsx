function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21c4-4 7-7.5 7-11a7 7 0 0 0-14 0c0 3.5 3 7 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 14h4" />
    </svg>
  );
}

export default function Advantages({ t }: { t: (key: string) => string }) {
  const items = [
    { icon: <TruckIcon />, label: t("advantages.delivery") },
    { icon: <ShieldIcon />, label: t("advantages.warranty") },
    { icon: <StoreIcon />, label: t("advantages.shopOdesa") },
    { icon: <PaymentIcon />, label: t("advantages.payment") },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-lg border border-blush/30 bg-white p-4 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush/40 text-ink">
              {item.icon}
            </span>
            <span className="text-sm font-semibold text-ink">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
