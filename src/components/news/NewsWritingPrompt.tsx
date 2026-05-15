"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  prompt: string;
}

const STORAGE_KEY = "ielts-wb:writing-prompt-handoff";

export function NewsWritingPrompt({ prompt }: Props) {
  const handoff = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prompt, source: "news", at: Date.now() })
      );
    }
  };

  return (
    <Card>
      <h3 className="section-title">写作延伸 · Task 2</h3>
      <p className="mt-2 text-sm leading-relaxed">{prompt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={{
            pathname: "/writing/exam",
            query: { prompt, taskType: "task2", source: "news" }
          }}
          onClick={handoff}
        >
          <Button variant="primary">去写作机考模拟</Button>
        </Link>
        <Link href="/writing/sentence" onClick={handoff}>
          <Button variant="soft">先练单句</Button>
        </Link>
      </div>
    </Card>
  );
}
