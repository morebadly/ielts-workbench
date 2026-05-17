import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { TEST_BANK } from "@/data/testBank";
import { TEST_BANK_BASE } from "@/lib/testBank";

export const metadata = {
  title: "真题 · IELTS Workbench"
};

export default function TestBankIndexPage() {
  return (
    <Container>
      <PageHeader
        title="真题"
        subtitle="剑桥真题 + 海外考场还原, 仿真考试界面, 错题进复习箱"
      />

      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p>当前 1 套 DEMO 占位中, 文章和题目为自写, 不含官方原文。等数据导入后会替换为剑20 + 25 海外真题。</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEST_BANK.map((t) => (
          <Link key={t.id} href={`${TEST_BANK_BASE}/${t.id}`}>
            <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h3 className="section-title">{t.name}</h3>
                {t.isMock ? (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    DEMO
                  </span>
                ) : null}
              </div>
              {t.subtitle ? (
                <p className="mt-1 text-sm muted">{t.subtitle}</p>
              ) : null}
              <p className="mt-2 text-xs muted">
                阅读 {t.reading.length} 篇 · 听力 {t.listening.length} 段
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
