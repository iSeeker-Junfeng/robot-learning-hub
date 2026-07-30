"use client";

function rangeFor(joint) {
  if (joint.type === "continuous") return [-Math.PI, Math.PI, 0.01];
  if (joint.type === "prismatic") return [joint.limit?.lower ?? -1, joint.limit?.upper ?? 1, 0.001];
  return [joint.limit?.lower ?? -Math.PI, joint.limit?.upper ?? Math.PI, 0.01];
}

export default function JointControlPanel({ joints, values, disabled, onChange }) {
  return (
    <section className="sim-panel sim-joints-panel">
      <header><span>02</span><div><b>关节控制</b><small>{disabled ? "LIVE 模式只读" : "MANUAL / RAD & M"}</small></div></header>
      <div className="sim-control-scroll">
        {joints.map((joint) => {
          const fixed = joint.type === "fixed" || Boolean(joint.mimic);
          const multiAxis = joint.type === "floating" || joint.type === "planar";
          const [min, max, step] = rangeFor(joint);
          const value = values[joint.name] ?? (joint.type === "floating" ? [0, 0, 0, 0, 0, 0] : joint.type === "planar" ? [0, 0, 0] : 0);
          return (
            <label className={`sim-joint-control ${fixed ? "fixed" : ""}`} key={joint.name}>
              <div><span>{joint.name}</span><em>{joint.type}</em></div>
              {fixed ? (
                <small>{joint.mimic ? `MIMIC → ${joint.mimic.joint}` : "固定关节"}</small>
              ) : multiAxis ? (
                <div className="sim-multi-joint">
                  {(joint.type === "floating" ? ["X", "Y", "Z", "ROLL", "PITCH", "YAW"] : ["X", "Y", "YAW"]).map((axis, index) => (
                    <label key={axis}>
                      <span>{axis}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={Number(value[index] || 0).toFixed(2)}
                        disabled={disabled}
                        onChange={(event) => {
                          const next = [...value];
                          next[index] = Number(event.target.value) || 0;
                          onChange(joint, next);
                        }}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={Math.min(max, Math.max(min, value))}
                    disabled={disabled}
                    onChange={(event) => onChange(joint, Number(event.target.value))}
                  />
                  <div className="sim-joint-value">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={Number(value).toFixed(joint.type === "prismatic" ? 3 : 2)}
                      disabled={disabled}
                      onChange={(event) => onChange(joint, Number(event.target.value))}
                    />
                    <span>{joint.type === "prismatic" ? "m" : "rad"}</span>
                    <small>{min.toFixed(2)} — {max.toFixed(2)}</small>
                  </div>
                </>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}
