import "./globals.css";

export const metadata = {
  title: "XUANSHU/玄枢 · 机器人学习中枢",
  description: "机器人、ROS 2、运动学、嵌入式与大模型的长期学习路线",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
