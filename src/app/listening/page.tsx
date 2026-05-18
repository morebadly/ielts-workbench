import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

const ENTRIES = [
  {
    href: "/listening/practice",
    title: "今日精听",
    desc: "Section 1-4 全场景, 听 → 听写 → 看原文 → 收生词"
  },
  {
    href: "/listening/custom",
    title: "我的素材",
    desc: "粘贴自己整理的英文 transcript, 可选填外链 mp3"
  }
];

export default function ListeningHome() {
  return (
    <Container>
      <PageHeader
        title="听力"
        subtitle="自写 8 条 IELTS-style + BBC 6 Minute English 10 集 transcript, 全部 AI 朗读, Section 1-4 全覆盖。"
      />
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
