import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { getTestById } from "@/data/testBank";
import { TEST_BANK_BASE } from "@/lib/testBank";

export const metadata = {
  title: "Test · IELTS"
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestEntryPage({ params }: Props) {
  const { id } = await params;
  const test = getTestById(id);
  if (!test) notFound();

  const totalReadingQ = test.reading
    .flatMap((p) => p.groups.flatMap((g) => g.questions))
    .length;
  const totalListeningQ = test.listening
    .flatMap((s) => s.groups.flatMap((g) => g.questions))
    .length;

  return (
    <Container>
      <PageHeader
        title={test.name}
        subtitle={test.subtitle}
        right={
          <Link
            href={TEST_BANK_BASE}
            className="text-sm muted hover:text-ink"
          >
            ← 返回列表
          </Link>
        }
      />

      {test.isMock ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          DEMO 占位中: 内容为自写, 用来跑通端到端流程, 等真数据导入后替换。
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href={`${TEST_BANK_BASE}/${test.id}/reading`}>
          <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="section-title">阅读</h3>
            <p className="mt-1 text-sm muted">
              {test.reading.length} 篇文章 · {totalReadingQ} 题 · 60 分钟
            </p>
            <p className="mt-2 text-xs muted">
              左原文右答题, 倒计时结束自动提交
            </p>
          </Card>
        </Link>

        <Link href={`${TEST_BANK_BASE}/${test.id}/listening`}>
          <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="section-title">听力</h3>
            <p className="mt-1 text-sm muted">
              {test.listening.length} 段 · {totalListeningQ} 题 · 30 分钟
            </p>
            <p className="mt-2 text-xs muted">
              逐段播放 mp3, 答题后查看 transcript
            </p>
          </Card>
        </Link>
      </div>
    </Container>
  );
}
