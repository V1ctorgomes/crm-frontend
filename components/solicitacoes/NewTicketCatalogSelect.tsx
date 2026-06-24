const SELECT =
  'flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 text-brand-950';

export function NewTicketCatalogSelect({
  label,
  ready,
  value,
  options,
  onChange,
}: {
  label: string;
  ready: boolean;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 space-y-2">
      <label className="text-sm font-medium leading-none text-slate-700">
        {label} <span className="text-red-600">*</span>
      </label>
      <select
        disabled={!ready}
        className={`${SELECT} disabled:bg-slate-100`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Selecione —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export const newTicketInputClass =
  'flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600';

export { SELECT as newTicketSelectClass };
