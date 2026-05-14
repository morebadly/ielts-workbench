import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

const ENTRIES = [
  { href: "/writing/guide", title: "格式指导 + 范文结构", desc: "Task 1 / Task 2 段落规范" },
  { href: "/writing/sentence", title: "句子训练", desc: "中译英 / 关键句模仿" },
  { href: "/writing/paragraph", title: "段落训练", desc: "围绕一个主题写一段" },
  { href: "/writing/exam", title: "机考模拟", desc: "倒计时 + 字数 + 段落检测" }
];

export default function WritingHome() {
  return (
    <Container>
      <PageHeader title="写作" subtitle="Academic Writing,Task 1 + Task 2。" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ENTRIES.map((e) => (
          <Link key={e.href} href={e.href}>
            <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
              <h3 className="section-title">{e.title}</h3>
              <p className="mt-1 text-sm muted">{e.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
