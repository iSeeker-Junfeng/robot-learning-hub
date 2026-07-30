export const sampleUrdf = `<?xml version="1.0"?>
<robot name="xuanshu_demo_arm">
  <material name="dark"><color rgba="0.12 0.15 0.20 1"/></material>
  <material name="orange"><color rgba="1 0.32 0.12 1"/></material>
  <material name="cyan"><color rgba="0.15 0.75 0.9 1"/></material>
  <link name="base_link">
    <visual><origin xyz="0 0 0.1"/><geometry><cylinder radius="0.24" length="0.2"/></geometry><material name="dark"/></visual>
  </link>
  <link name="shoulder_link">
    <visual><origin xyz="0 0 0.26"/><geometry><box size="0.16 0.18 0.52"/></geometry><material name="orange"/></visual>
  </link>
  <link name="upper_arm_link">
    <visual><origin xyz="0 0 0.32"/><geometry><box size="0.13 0.13 0.64"/></geometry><material name="dark"/></visual>
  </link>
  <link name="forearm_link">
    <visual><origin xyz="0 0 0.28"/><geometry><box size="0.105 0.105 0.56"/></geometry><material name="cyan"/></visual>
  </link>
  <link name="tool_link">
    <visual><origin xyz="0 0 0.08"/><geometry><cylinder radius="0.11" length="0.16"/></geometry><material name="orange"/></visual>
  </link>
  <joint name="base_yaw" type="continuous">
    <parent link="base_link"/><child link="shoulder_link"/><origin xyz="0 0 0.2"/><axis xyz="0 0 1"/>
  </joint>
  <joint name="shoulder_pitch" type="revolute">
    <parent link="shoulder_link"/><child link="upper_arm_link"/><origin xyz="0 0 0.52"/><axis xyz="0 1 0"/>
    <limit lower="-2.2" upper="2.2" velocity="1.5" effort="30"/>
  </joint>
  <joint name="elbow_pitch" type="revolute">
    <parent link="upper_arm_link"/><child link="forearm_link"/><origin xyz="0 0 0.64"/><axis xyz="0 1 0"/>
    <limit lower="-2.5" upper="2.5" velocity="1.8" effort="20"/>
  </joint>
  <joint name="tool_slide" type="prismatic">
    <parent link="forearm_link"/><child link="tool_link"/><origin xyz="0 0 0.56"/><axis xyz="0 0 1"/>
    <limit lower="0" upper="0.18" velocity="0.2" effort="10"/>
  </joint>
</robot>`;

export const sampleModel = {
  id: "builtin-xuanshu-demo",
  name: "玄枢教学机械臂",
  description: "内置四关节 URDF 示例，可直接体验运动树、关节限制和 Link 位姿。",
  root_link: "base_link",
  links: [
    { name: "base_link", visual_count: 1, collision_count: 0 },
    { name: "shoulder_link", visual_count: 1, collision_count: 0 },
    { name: "upper_arm_link", visual_count: 1, collision_count: 0 },
    { name: "forearm_link", visual_count: 1, collision_count: 0 },
    { name: "tool_link", visual_count: 1, collision_count: 0 },
  ],
  joints: [
    { name: "base_yaw", type: "continuous", parent: "base_link", child: "shoulder_link", axis: [0, 0, 1], origin: { xyz: [0, 0, 0.2], rpy: [0, 0, 0] }, limit: null, mimic: null },
    { name: "shoulder_pitch", type: "revolute", parent: "shoulder_link", child: "upper_arm_link", axis: [0, 1, 0], origin: { xyz: [0, 0, 0.52], rpy: [0, 0, 0] }, limit: { lower: -2.2, upper: 2.2, velocity: 1.5, effort: 30 }, mimic: null },
    { name: "elbow_pitch", type: "revolute", parent: "upper_arm_link", child: "forearm_link", axis: [0, 1, 0], origin: { xyz: [0, 0, 0.64], rpy: [0, 0, 0] }, limit: { lower: -2.5, upper: 2.5, velocity: 1.8, effort: 20 }, mimic: null },
    { name: "tool_slide", type: "prismatic", parent: "forearm_link", child: "tool_link", axis: [0, 0, 1], origin: { xyz: [0, 0, 0.56], rpy: [0, 0, 0] }, limit: { lower: 0, upper: 0.18, velocity: 0.2, effort: 10 }, mimic: null },
  ],
  warnings: [],
  missing_assets: [],
  links_count: 5,
  joints_count: 4,
  movable_joints_count: 4,
  builtin: true,
};
