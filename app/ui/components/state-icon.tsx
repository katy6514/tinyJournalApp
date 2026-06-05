const STATE_ABBR: Record<string, string> = {
  Montana:      "MT",
  Idaho:        "ID",
  Wyoming:      "WY",
  Colorado:     "CO",
  "New Mexico": "NM",
};

interface StateIconProps {
  state: string;
  className?: string;
}

export function StateIcon({ state, className = "" }: StateIconProps) {
  const abbr = STATE_ABBR[state] ?? state.slice(0, 2).toUpperCase();
  return (
    <span className={`text-xs font-bold tracking-wide ${className}`}>
      {abbr}
    </span>
  );
}
