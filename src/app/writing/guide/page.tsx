import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TASK1_GUIDE, TASK2_GUIDE } from "@/data/mockWriting";

const COMMON_RULES = [
  "雅思官方没有要求首行缩进",
  "机考建议段落之间空一行",
  "不要写成一整大段",
  "Task 1 至少 150 词,建议 20 分钟,推荐 4 段",
  "Task 2 至少 250 词,建议 40 分钟,推荐 4 段"
];

export default function WritingGuidePage() {
  return (
    <Container>
      <PageHeader
        title="写作格式指导"
        subtitle="先把格式搞清楚,再练内容。"
        right={
          <Link href="/writing">
            <Button variant="ghost">返回</Button>
          </Link>
        }
      />

      <Card className="mb-5">
        <h3 className="section-title">通用规则</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {COMMON_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GuideCard guide={TASK1_GUIDE} />
        <GuideCard guide={TASK2_GUIDE} />
      </div>
    </Container>
  );
}

function GuideCard({
  guide
}: {
  guide: typeof TASK1_GUIDE;
}) {
  return (
    <Card padding="lg">
      <h3 className="section-title">{guide.title}</h3>
      <ol className="mt-3 space-y-3">
        {guide.paragraphs.map((p, i) => (
          <li key={i} className="rounded-xl border border-black/5 bg-bg-soft/50 p-3">
            <div className="text-sm font-medium">{p.label}</div>
            <p className="mt-1 text-sm text-ink-soft">{p.desc}</p>
          </li>
        ))}
      </ol>
      <div className="mt-3 text-xs muted">注意:{guide.rules.join(" · ")}</div>
    </Card>
  );
}
