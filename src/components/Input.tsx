import { useId } from "react";

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
    <label htmlFor={id} className="block mb-4 text-sm font-medium text-slate-700">
      {label}

      <input
        {...fields}
        type={type}
        id={id}
        className="mt-1 p-2 w-full border border-slate-300 rounded-md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
