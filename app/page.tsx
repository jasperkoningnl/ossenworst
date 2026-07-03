import { FeedList } from "@/components/topic/FeedList";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getPublishedTopics } from "@/lib/data/topics";

export default async function Home() {
  const items = await getPublishedTopics();

  if (items.length === 0) {
    return (
      <div>
        <SectionTitle title="Nieuws" />
        <p className="px-4 py-8 text-sm" style={{ color: "var(--fg2)" }}>
          De nieuwsfeed wordt hier getoond zodra de aggregatiepipeline draait.
        </p>
      </div>
    );
  }

  return <FeedList items={items} />;
}
