import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-xl border bg-zinc-900/90 text-zinc-100 text-sm px-3.5 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500/30 focus:border-rose-500'
              : 'border-zinc-800 hover:border-zinc-700'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-zinc-400">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
