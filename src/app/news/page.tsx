import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NewsCard } from "@/components/news/NewsCard";
import { getAllNews, getTodayNews } from "@/data/news/loader";

export const dynamic = "force-static";

export default function NewsHomePage() {
  const today = getTodayNews();
  const all = getAllNews();
  const todayIds = new Set(today.map((n) => n.id));
  const history = all.filter((n) => !todayIds.has(n.id));

  return (
    <Container>
      <PageHeader
        title="每日英文新闻"
        subtitle="精选 1-3 条 IELTS 主题新闻, 每条配 AI 学习摘要、词汇、阅读题、写作延伸和听力文本"
        right={
          <Link href="/news/today">
            <Button variant="primary">进入今日学习</Button>
          </Link>
        }
      />

      <Card padding="md" className="mb-5 bg-accent-warm/5">
        <p className="text-xs leading-relaxed text-ink-soft">
          学习摘要由 AI 根据新闻标题和摘要生成, 请点击原文查看完整报道。本站不保存全文, 仅保存标题、来源、发布时间、原文链接和原始 RSS 摘要。
        </p>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">今日精选</h2>
      {today.length === 0 ? (
        <Card>
          <p className="text-sm muted">今日暂无新闻, 等待自动更新或手动运行 <code>npm run update:news</code>。</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {today.map((n) => (
            <NewsCard key={n.id} item={n} href={`/news/${n.id}`} />
          ))}
        </div>
      )}

      {history.length > 0 ? (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold">历史</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {history.map((n) => (
              <NewsCard key={n.id} item={n} href={`/news/${n.id}`} compact />
            ))}
          </div>
        </>
      ) : null}
    </Container>
  );
}
