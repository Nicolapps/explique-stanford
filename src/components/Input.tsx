import { ReactNode, useId } from "react";

export default function Input({
  value,
  onChange,
  label,
  type = "text",
  hint,
  ...fields
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  type?: string;
  hint?: ReactNode;
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
        className="mt-1 p-2 w-full border border-slate-300 rounded-md text-base disabled:bg-slate-200 disabled:cursor-not-allowed focus:ring-2 focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {hint && <p className="text-slate-500 mt-2">{hint}</p>}
    </label>
  );
}

export function Textarea({
  value,
  onChange,
  label,
  hint,
  required = false,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: React.ReactNode;
  type?: string;
  required?: boolean;
  hint?: ReactNode;
  readOnly?: boolean;
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
        className="mt-1 p-2 w-full border border-slate-300 rounded-md resize-none h-52 text-base focus:ring-2 focus:ring-inherit focus:border-inherit focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        readOnly={readOnly}
      />

      {hint && <p className="text-slate-500 mt-2">{hint}</p>}
    </label>
  );
}

type SelectProps<T> = {
  value: T;
  onChange: (value: T) => void;
  label: string;
  values: {
    value: T;
    label: string;
    disabled?: boolean;
  }[];
  hint?: ReactNode;
};

export function Select<T extends string>({
  value,
  onChange,
  label,
  values,
  hint,
}: SelectProps<T>) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="block mb-6 text-sm font-medium text-slate-800"
    >
      {label}

      <select
        id={id}
        className="mt-1 p-2 w-full border border-slate-300 rounded-md font-sans h-10 form-select focus:ring-2 focus:ring-inherit focus:border-inherit focus:outline-none"
        value={value ?? undefined}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {values.map(({ value, label, disabled }) => (
          <option key={value} value={value} disabled={disabled}>
            {label}
          </option>
        ))}
      </select>

      {hint && <p className="text-slate-500 mt-2">{hint}</p>}
    </label>
  );
}

export function SelectWithNone<T extends string>({
  values,
  value,
  ...props
}: Omit<SelectProps<T>, "value"> & {
  value: T | null;
}) {
  const noneValue = `none-07d23f86-f645-46a4-be04-9e79dfbd73cf` as T;

  return (
    <Select
      value={value === null ? noneValue : value}
      values={[
        {
          value: noneValue,
          label: "",
          disabled: true,
        },
        ...values,
      ]}
      {...props}
    />
  );
}
