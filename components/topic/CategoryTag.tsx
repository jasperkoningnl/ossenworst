import { Badge } from "@/components/ui/Badge";
import { CATEGORY_COLORS, categoryTextColor } from "@/lib/theme/colors";
import type { TopicCategory } from "@/lib/types/enums";

export function CategoryTag({ category }: { category: TopicCategory }) {
  return (
    <Badge bg={CATEGORY_COLORS[category]} fg={categoryTextColor(category)}>
      {category}
    </Badge>
  );
}
