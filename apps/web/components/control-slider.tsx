"use client";

type ControlSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function ControlSlider({ label, value, onChange }: ControlSliderProps) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded bg-slate-700"
      />
    </label>
  );
}
