"use client";

const fields = [
  ["x", "X", "m"], ["y", "Y", "m"], ["z", "Z", "m"],
  ["roll", "ROLL", "rad"], ["pitch", "PITCH", "rad"], ["yaw", "YAW", "rad"],
];

export default function BasePosePanel({ value, disabled, onChange }) {
  return (
    <section className="sim-panel sim-base-panel">
      <header><span>03</span><div><b>基座位姿</b><small>WORLD → BASE_LINK</small></div></header>
      <div className="sim-pose-inputs">
        {fields.map(([key, label, unit]) => (
          <label key={key}><span>{label}</span><input type="number" step="0.01" value={value[key]} disabled={disabled} onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) || 0 })} /><em>{unit}</em></label>
        ))}
      </div>
    </section>
  );
}
