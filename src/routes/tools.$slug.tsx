import { createFileRoute, notFound } from "@tanstack/react-router";
import { ToolPage } from "@/components/tools/ToolPage";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/tools/$slug")({
  beforeLoad: ({ params }) => {
    if (!TOOLS.some((tool) => tool.slug === params.slug)) throw notFound();
  },
  component: ToolRoute,
  head: ({ params }) => {
    const tool = TOOLS.find((t) => t.slug === params.slug);
    return {
      meta: [
        { title: tool ? `${tool.name} — PDFBuddy` : "PDFBuddy" },
        { name: "description", content: tool?.description ?? "PDF tools" },
      ],
    };
  },
});

function ToolRoute() {
  const { slug } = Route.useParams();
  return <ToolPage slug={slug} />;
}
