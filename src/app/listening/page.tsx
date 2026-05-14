import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

export default function ListeningHome() {
  return (
    <Container>
      <PageHeader title="听力" subtitle="第一版做轻量精听,先听 → 听写 → 看原文 → 收生词。" />
      <Link href="/listening/practice">
        <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="section-title">今日精听</h3>
          <p className="mt-1 text-sm muted">点击开始今天的听力训练。</p>
        </Card>
      </Link>
    </Container>
  );
}
