import { Badge } from "@/components/ui/Badge";
import { CATEGORY_COLORS, CATEGORY_LABEL, categoryTextColor } from "@/lib/theme/colors";
import type { TopicCategory } from "@/lib/types/enums";

export function CategoryTag({ category }: { category: TopicCategory }) {
  return (
    <Badge bg={CATEGORY_COLORS[category]} fg={categoryTextColor()}>
      {CATEGORY_LABEL[category]}
    </Badge>
  );
}
