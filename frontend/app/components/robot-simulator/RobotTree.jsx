"use client";

export default function RobotTree({ model, selectedLink, onSelectLink }) {
  const jointsByParent = (model.joints || []).reduce((groups, joint) => {
    (groups[joint.parent] ||= []).push(joint);
    return groups;
  }, {});

  function renderLink(name, depth = 0, visited = new Set()) {
    if (visited.has(name)) return null;
    const nextVisited = new Set(visited).add(name);
    return (
      <li key={name}>
        <button
          type="button"
          className={selectedLink === name ? "active" : ""}
          style={{ "--depth": depth }}
          onClick={() => onSelectLink(name)}
        >
          <span className="sim-tree-link">L</span>
          <span>{name}</span>
        </button>
        {(jointsByParent[name] || []).length > 0 && (
          <ul>
            {jointsByParent[name].map((joint) => (
              <li key={joint.name}>
                <div className="sim-tree-joint" style={{ "--depth": depth + 1 }}>
                  <span>J</span><b>{joint.name}</b><em>{joint.type}</em>
                </div>
                <ul>{renderLink(joint.child, depth + 2, nextVisited)}</ul>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <section className="sim-panel sim-tree-panel">
      <header><span>01</span><div><b>运动树</b><small>{model.links_count} LINKS · {model.joints_count} JOINTS</small></div></header>
      <div className="sim-tree-scroll"><ul className="sim-tree">{renderLink(model.root_link)}</ul></div>
    </section>
  );
}
