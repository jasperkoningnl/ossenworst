import { FeedList } from "@/components/topic/FeedList";
import { getPublishedTopics } from "@/lib/data/topics";

export default async function Home() {
  const items = await getPublishedTopics();

  if (items.length === 0) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: "var(--fg2)" }}>
          De nieuwsfeed wordt hier getoond zodra de aggregatiepipeline draait.
        </p>
      </div>
    );
  }

  return <FeedList items={items} />;
}
