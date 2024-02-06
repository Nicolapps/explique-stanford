import { ReactNode, useId } from "react";

export default function Input({
  value,
  onChange,
  label,
  type = "text",
  ...fields
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="block mb-6 text-sm font-medium text-slate-800"
    >
      {label}

      <input
        {...fields}
        type={type}
        id={id}
        className="mt-1 p-2 w-full border border-slate-300 rounded-md text-base disabled:bg-slate-200 disabled:cursor-not-allowed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Textarea({
  value,
  onChange,
  label,
  hint,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  type?: string;
  required?: boolean;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="block mb-6 text-sm font-medium text-slate-800"
    >
      {label}

      <textarea
        id={id}
        className="mt-1 p-2 w-full border border-slate-300 rounded-md resize-none h-52 text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />

      {hint && <p className="text-slate-500 mt-2">{hint}</p>}
    </label>
  );
}

export function Select({
  value,
  onChange,
  label,
  values,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  values: string[];
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="block mb-6 text-sm font-medium text-slate-800"
    >
      {label}

      <select
        id={id}
        className="mt-1 p-2 w-full border border-slate-300 rounded-md font-sans h-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      {hint && <p className="text-slate-500 mt-2">{hint}</p>}
    </label>
  );
}
