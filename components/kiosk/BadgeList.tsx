interface BadgeEntry {
  name: string;
  icon: string;
  style: string;
}

interface BadgeListProps {
  badges: BadgeEntry[];
}

export default function BadgeList({ badges }: BadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1.5 border-t border-surface-100 pt-1.5">
      {badges.map((badge, index) => (
        <span
          key={index}
          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.style}`}
        >
          <span>{badge.icon}</span>
          <span>{badge.name}</span>
        </span>
      ))}
    </div>
  );
}
