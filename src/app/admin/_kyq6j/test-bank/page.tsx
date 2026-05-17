import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { TEST_BANK } from "@/data/testBank";
import { TEST_BANK_BASE } from "@/lib/testBank";

export const metadata = {
  title: "Test Bank · IELTS",
  robots: { index: false, follow: false }
};

export default function TestBankIndexPage() {
  return (
    <Container>
      <PageHeader
        title="真题题库"
        subtitle="私密区, 不在导航栏出现, 仅地址栏直达。剑20 + 海外真题, 仿真考试界面。"
      />

      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-medium">私密区使用说明</p>
        <ul className="mt-1 list-disc pl-5 text-amber-800">
          <li>本路径下内容仅供站长本人复习用, 不在任何导航中暴露</li>
          <li>当前 1 套 DEMO 占位中, 文章和题目为自写, 不含官方原文</li>
          <li>等 LLM 额度恢复后批量替换为剑20 + 海外真题真数据</li>
        </ul>
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
