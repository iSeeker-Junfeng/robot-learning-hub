export const tracks = [
  {
    id: "robot",
    short: "ROBOT",
    name: "机器人系统",
    eyebrow: "SYSTEMS",
    color: "#ff784f",
    intro: "把感知、决策、执行与安全连成可落地的机器人闭环。",
    chapters: [
      { id: "robot-architecture", no: "R01", title: "全栈架构与分层", desc: "驱动层、能力层、任务层、应用层与数据流", time: "4h", level: "基础" },
      { id: "robot-perception", no: "R02", title: "感知与传感器融合", desc: "相机、激光雷达、IMU、力传感器与时间同步", time: "8h", level: "核心" },
      { id: "robot-fsm", no: "R03", title: "状态机与任务编排", desc: "主/子状态机、Context、异常恢复与动作原子", time: "6h", level: "核心" },
      { id: "robot-control", no: "R04", title: "规划、控制与闭环", desc: "任务规划、轨迹生成、运动控制与反馈校正", time: "10h", level: "进阶" },
      { id: "robot-safety", no: "R05", title: "系统安全与可靠性", desc: "急停、限位、避障、看门狗、故障码与降级", time: "6h", level: "工程" },
    ],
  },
  {
    id: "ros2",
    short: "ROS 2",
    name: "ROS 2 工程",
    eyebrow: "MIDDLEWARE",
    color: "#54d8ff",
    intro: "从通信模型走到可维护、可部署、可观测的机器人软件。",
    chapters: [
      { id: "ros2-core", no: "O01", title: "节点与通信模型", desc: "Node、Topic、Service、Action 与接口设计", time: "6h", level: "基础" },
      { id: "ros2-qos", no: "O02", title: "QoS 与执行器", desc: "可靠性、历史策略、Callback Group 与多线程", time: "8h", level: "核心" },
      { id: "ros2-tf", no: "O03", title: "TF2、URDF 与坐标树", desc: "坐标变换、机器人模型、静态/动态 TF", time: "8h", level: "核心" },
      { id: "ros2-runtime", no: "O04", title: "组件化与生命周期", desc: "Components、Lifecycle、Launch 与参数管理", time: "6h", level: "工程" },
      { id: "ros2-stack", no: "O05", title: "Nav2、MoveIt 2、ros2_control", desc: "导航、机械臂规划与硬件控制框架", time: "14h", level: "进阶" },
    ],
  },
  {
    id: "kinematics",
    short: "MOTION",
    name: "机器人运动学",
    eyebrow: "MATHEMATICS",
    color: "#a98bff",
    intro: "用几何、矩阵和微分理解机械臂为什么能到达目标位姿。",
    chapters: [
      { id: "kin-coordinates", no: "K01", title: "坐标系、向量与矩阵", desc: "方向、位移、基变换与矩阵运算直觉", time: "6h", level: "基础" },
      { id: "kin-rotation", no: "K02", title: "旋转、欧拉角与四元数", desc: "SO(3)、旋转次序、xyzw 与奇异性", time: "8h", level: "核心" },
      { id: "kin-transform", no: "K03", title: "齐次变换与 TF 树", desc: "SE(3)、坐标链、复合变换与逆变换", time: "8h", level: "核心" },
      { id: "kin-fk", no: "K04", title: "DH 参数与正运动学", desc: "连杆建模、变换连乘与末端位姿", time: "10h", level: "进阶" },
      { id: "kin-ik", no: "K05", title: "逆运动学、雅可比与轨迹", desc: "解析/数值 IK、速度映射、奇异点与插值", time: "14h", level: "进阶" },
    ],
  },
  {
    id: "embedded",
    short: "EDGE",
    name: "嵌入式系统",
    eyebrow: "HARDWARE",
    color: "#7be495",
    intro: "把协议、驱动、实时性与可靠性落在真实硬件链路上。",
    chapters: [
      { id: "emb-cpp", no: "E01", title: "C/C++ 与 Linux 基础", desc: "内存、线程、进程、系统调用与调试工具", time: "10h", level: "基础" },
      { id: "emb-bus", no: "E02", title: "串口、CAN 与网络协议", desc: "UART/RS485、CAN/CAN FD、TCP/UDP 与帧设计", time: "10h", level: "核心" },
      { id: "emb-rtos", no: "E03", title: "MCU、RTOS 与实时性", desc: "中断、任务调度、锁、队列与时序预算", time: "10h", level: "核心" },
      { id: "emb-driver", no: "E04", title: "传感器与驱动开发", desc: "设备抽象、采集线程、滤波、标定与发布", time: "12h", level: "工程" },
      { id: "emb-reliable", no: "E05", title: "边缘部署与可靠性", desc: "Jetson、服务守护、监控、日志与故障恢复", time: "8h", level: "工程" },
    ],
  },
  {
    id: "llm",
    short: "AI",
    name: "大模型与具身智能",
    eyebrow: "INTELLIGENCE",
    color: "#ffc857",
    intro: "从本地推理走向能调用工具、理解视觉并调度机器人技能的智能层。",
    chapters: [
      { id: "llm-base", no: "A01", title: "Transformer 与模型基础", desc: "Token、Attention、上下文、训练与推理", time: "8h", level: "基础" },
      { id: "llm-serving", no: "A02", title: "本地模型与 vLLM", desc: "Qwen/Qwen-VL、量化、吞吐、显存与服务化", time: "10h", level: "核心" },
      { id: "llm-rag", no: "A03", title: "RAG 与知识工程", desc: "切分、向量检索、重排、GraphRAG 与评测", time: "10h", level: "核心" },
      { id: "llm-agent", no: "A04", title: "MCP、工具调用与 Agent", desc: "工具协议、Registry、工作流、记忆与可观测性", time: "12h", level: "工程" },
      { id: "llm-vla", no: "A05", title: "VLM、VLA 与机器人 Skills", desc: "视觉理解、高/低精任务分流、技能调度与闭环", time: "14h", level: "前沿" },
    ],
  },
];

export const chapterGuides = {
  "robot-architecture": {
    materials: ["机器人软件分层：驱动、能力、任务、应用", "数据流、控制流与依赖方向", "模块接口、Registry 与配置驱动设计"],
    project: "为一台移动机械臂画出完整分层架构图，并定义各层输入、输出和故障边界。",
    acceptance: ["任一硬件或算法模块可被替换而不改动上层业务", "能解释一次任务从请求到执行反馈的完整链路"],
  },
  "robot-perception": {
    materials: ["相机、LiDAR、IMU、力传感器的数据特征", "时间戳、坐标系与外参标定", "滤波、同步与多传感器融合基础"],
    project: "建立相机 + IMU 感知管线，记录频率、延迟、丢帧和时间偏差。",
    acceptance: ["输出可复现的传感器频率与延迟报告", "能定位时间不同步和坐标系错误"],
  },
  "robot-fsm": {
    materials: ["状态、事件、转移、守卫条件与动作", "主状态机、子状态机与 Context", "超时、重试、回滚和异常恢复"],
    project: "实现取料—扫码—搬运—放料状态机，加入重试耗尽和人工恢复分支。",
    acceptance: ["非法事件不会破坏当前状态", "程序重启后能依据持久化 Context 安全恢复"],
  },
  "robot-control": {
    materials: ["任务规划、路径规划与轨迹规划的边界", "位置、速度、力矩控制闭环", "前馈、反馈、误差与稳定性"],
    project: "让机械臂完成带速度约束的点到点轨迹，并绘制目标与实际关节曲线。",
    acceptance: ["轨迹连续且不超过速度和加速度限制", "能量化稳态误差、超调和跟踪延迟"],
  },
  "robot-safety": {
    materials: ["物理急停、软件停机与安全状态", "碰撞、限位、看门狗和通信失联", "故障等级、故障码与降级策略"],
    project: "为机器人设计安全矩阵，覆盖人员进入、传感器掉线、电量不足和执行器异常。",
    acceptance: ["每个危险事件都有检测、响应和恢复条件", "任何单点软件故障不会绕过物理急停"],
  },
  "ros2-core": {
    materials: ["Node、Topic、Service、Action 的语义区别", "msg、srv、action 接口设计", "命名空间、参数与 Launch 基础"],
    project: "实现一个传感器发布节点和带反馈、取消能力的机械臂任务 Action。",
    acceptance: ["能根据交互语义选择 Topic、Service 或 Action", "接口包含时间戳、frame_id、错误码和可观测反馈"],
  },
  "ros2-qos": {
    materials: ["Reliability、Durability、History 与 Depth", "Executor、Callback Group 与线程模型", "背压、丢帧、死锁与实时回调"],
    project: "对 300 Hz IMU 和 30 Hz 图像分别设计 QoS，并压测单线程与多线程执行器。",
    acceptance: ["给出吞吐、延迟、CPU 和丢帧对比数据", "回调分组不会产生数据竞争或互相阻塞"],
  },
  "ros2-tf": {
    materials: ["TF 树的父子关系与坐标变换方向", "静态 TF、动态 TF 与时间查询", "URDF link、joint、visual、collision"],
    project: "建立 base_link—arm—camera—tool0 坐标树，并把相机目标转换到机器人基座。",
    acceptance: ["TF 树无环、无多父节点且命名一致", "可手算并验证一次 camera 到 base_link 的变换"],
  },
  "ros2-runtime": {
    materials: ["Composable Node 与进程内通信", "Lifecycle 状态与受控启动", "参数、Launch、诊断和日志"],
    project: "把三个传感器节点组件化，并用 Lifecycle 控制配置、激活与安全停机。",
    acceptance: ["启动顺序和失败回滚可重复", "组件与独立进程模式均可通过配置运行"],
  },
  "ros2-stack": {
    materials: ["Nav2 行为树、代价地图和规划器", "MoveIt 2 Planning Scene 与执行链", "ros2_control 硬件接口与控制器"],
    project: "完成移动底盘到达工位后，机械臂规划抓取并执行的联合演示。",
    acceptance: ["导航失败和抓取失败都有恢复流程", "规划场景、控制器状态与执行结果可观测"],
  },
  "kin-coordinates": {
    materials: ["向量、点、基与坐标表示", "矩阵乘法的几何意义", "主动变换与被动变换"],
    project: "手算二维坐标点在旋转、平移和换基后的结果，再用代码验证。",
    acceptance: ["不混淆点、向量和坐标值", "能解释矩阵乘法顺序为什么不能随意交换"],
  },
  "kin-rotation": {
    materials: ["SO(3) 旋转矩阵", "欧拉角顺序与万向锁", "单位四元数、xyzw 与半角公式"],
    project: "编写欧拉角、旋转矩阵和四元数互转程序，覆盖 z 轴 ±90°。",
    acceptance: ["四元数归一化且 q 与 -q 表示同一姿态", "转换结果通过矩阵正交性和行列式验证"],
  },
  "kin-transform": {
    materials: ["SE(3) 齐次变换矩阵", "旋转和平移的组合顺序", "坐标链、逆变换与 TF 查询"],
    project: "根据已知外参计算物体从相机坐标系到机械臂基坐标系的位姿。",
    acceptance: ["能写出每个变换的上下标和方向", "正向变换与逆变换相乘得到单位矩阵"],
  },
  "kin-fk": {
    materials: ["标准 DH 与改进 DH", "关节轴、连杆参数和坐标系放置", "变换连乘与末端位姿"],
    project: "为 6/7 轴机械臂建立 DH 表，并与 URDF 或仿真末端位姿对比。",
    acceptance: ["零位和多个随机关节角误差满足设定阈值", "能解释 DH 坐标系选择对参数的影响"],
  },
  "kin-ik": {
    materials: ["解析 IK 与数值 IK", "Jacobian、速度映射和奇异值", "关节空间与笛卡尔空间插值"],
    project: "实现阻尼最小二乘 IK，绘制接近奇异位形时的误差和关节速度。",
    acceptance: ["目标可达时稳定收敛，不可达时正确退出", "关节限位和奇异点不会导致速度爆炸"],
  },
  "emb-cpp": {
    materials: ["内存模型、RAII 与智能指针", "进程、线程、锁、条件变量", "Linux 文件、设备与网络 I/O"],
    project: "实现一个多线程数据采集程序，包含生产者消费者队列和安全退出。",
    acceptance: ["无内存泄漏、数据竞争和悬空线程", "能用调试工具定位阻塞与崩溃位置"],
  },
  "emb-bus": {
    materials: ["UART、RS232、RS485 与 Modbus RTU", "CAN 仲裁、帧结构与 CAN FD", "TCP/UDP 粘包、重连与心跳"],
    project: "设计统一传感器协议适配层，兼容串口、CAN、TCP 和 UDP。",
    acceptance: ["支持校验、超时、断线重连和错误统计", "协议解析面对半包、错帧和突发流量仍稳定"],
  },
  "emb-rtos": {
    materials: ["中断、任务和优先级", "互斥锁、信号量、队列与事件组", "周期、抖动、截止时间和优先级反转"],
    project: "设计 1 kHz 控制任务、100 Hz 采集任务和低优先级日志任务的调度方案。",
    acceptance: ["最坏执行时间满足截止时间", "共享资源不会导致不可控的优先级反转"],
  },
  "emb-driver": {
    materials: ["HAL、设备抽象与驱动状态机", "采集频率、缓存、滤波与标定", "线程安全发布与硬件错误映射"],
    project: "实现 IMU 或力传感器驱动节点，输出原始值、滤波值和诊断状态。",
    acceptance: ["频率、延迟、漂移和异常恢复可量化", "拔插、乱码和设备重启不会拖垮主进程"],
  },
  "emb-reliable": {
    materials: ["Jetson/边缘设备部署", "systemd、容器、日志轮转与监控", "健康检查、看门狗、升级和回滚"],
    project: "将 ROS 2 采集服务部署为开机启动服务，并模拟进程崩溃和设备断连。",
    acceptance: ["服务可自动恢复且保留关键故障上下文", "资源占用、版本和运行状态可远程查询"],
  },
  "llm-base": {
    materials: ["Token、Embedding 与位置编码", "Self-Attention 与 Transformer", "预训练、指令微调、推理与上下文窗口"],
    project: "用小规模代码演示 Attention，并观察不同上下文长度的显存和速度变化。",
    acceptance: ["能解释 Q/K/V 和注意力权重", "能区分参数量、激活显存、KV Cache 和吞吐"],
  },
  "llm-serving": {
    materials: ["Qwen/Qwen-VL 模型与量化", "vLLM 调度、PagedAttention 与连续批处理", "张量并行、吞吐、首 Token 延迟"],
    project: "在本地 GPU 部署 OpenAI 兼容服务，并完成并发、显存和稳定性压测。",
    acceptance: ["给出不同并发度的 TTFT、TPS 和显存报告", "服务具备超时、限流、健康检查和自动重启"],
  },
  "llm-rag": {
    materials: ["文档解析、切分和元数据", "向量检索、混合检索与重排", "GraphRAG、引用、评测和幻觉控制"],
    project: "构建 ROS 2 项目文档 RAG，回答问题时返回准确章节来源。",
    acceptance: ["建立可重复的检索与答案评测集", "错误答案能区分检索失败和生成失败"],
  },
  "llm-agent": {
    materials: ["Tool Calling 与结构化输出", "MCP、Registry、工作流和状态", "记忆、权限、追踪与失败恢复"],
    project: "实现一个机器人开发 Agent：查询 Topic、读取诊断并生成可审查的处理计划。",
    acceptance: ["工具参数经过校验，危险动作需要明确授权", "每次调用、结果和失败原因均可追踪"],
  },
  "llm-vla": {
    materials: ["VLM 感知、VLA 策略与动作表示", "高精任务的工具测量与低精任务端到端策略", "技能选择、闭环验证和安全边界"],
    project: "设计 VLA + 视觉测量 + MoveIt 2 的抓取闭环，按精度要求动态选择执行路径。",
    acceptance: ["决策层不直接绕过运动和安全约束", "成功率、定位误差、耗时和失败类型都有量化结果"],
  },
};

export const graphNodes = [
  { id: "emb-cpp", label: "C++ / Linux", track: "embedded", x: 90, y: 115 },
  { id: "emb-bus", label: "串口 · CAN", track: "embedded", x: 90, y: 290 },
  { id: "emb-driver", label: "设备驱动", track: "embedded", x: 260, y: 205 },
  { id: "ros2-core", label: "ROS 2 通信", track: "ros2", x: 430, y: 120 },
  { id: "ros2-qos", label: "QoS · Executor", track: "ros2", x: 430, y: 300 },
  { id: "kin-coordinates", label: "坐标与矩阵", track: "kinematics", x: 600, y: 70 },
  { id: "kin-transform", label: "SE(3) · TF2", track: "kinematics", x: 600, y: 220 },
  { id: "kin-ik", label: "IK · Jacobian", track: "kinematics", x: 600, y: 390 },
  { id: "ros2-stack", label: "MoveIt 2 · Nav2", track: "ros2", x: 770, y: 300 },
  { id: "robot-perception", label: "机器人感知", track: "robot", x: 770, y: 95 },
  { id: "robot-fsm", label: "状态机 · Skills", track: "robot", x: 770, y: 455 },
  { id: "llm-serving", label: "本地模型服务", track: "llm", x: 935, y: 95 },
  { id: "llm-agent", label: "Agent · MCP", track: "llm", x: 935, y: 280 },
  { id: "llm-vla", label: "VLM · VLA", track: "llm", x: 935, y: 455 },
];

export const graphEdges = [
  ["emb-cpp", "emb-driver"], ["emb-bus", "emb-driver"],
  ["emb-driver", "ros2-core"], ["emb-driver", "ros2-qos"],
  ["ros2-core", "ros2-qos"], ["ros2-core", "kin-transform"],
  ["kin-coordinates", "kin-transform"], ["kin-transform", "kin-ik"],
  ["kin-transform", "robot-perception"], ["kin-ik", "ros2-stack"],
  ["ros2-qos", "ros2-stack"], ["ros2-stack", "robot-fsm"],
  ["robot-perception", "llm-vla"], ["llm-serving", "llm-agent"],
  ["llm-agent", "robot-fsm"], ["robot-fsm", "llm-vla"],
];

export const chapterById = Object.fromEntries(
  tracks.flatMap((track) => track.chapters.map((chapter) => [chapter.id, { ...chapter, track }]))
);
