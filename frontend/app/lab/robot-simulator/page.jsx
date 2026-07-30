import RobotSimulator from "../../components/robot-simulator/RobotSimulator";

export const metadata = {
  title: "机器人仿真实验室 · XUANSHU/玄枢",
  description: "加载通用 URDF，检查运动树、调整关节并查看任意 Link 位姿。",
};

export default function RobotSimulatorPage() {
  return <RobotSimulator />;
}
