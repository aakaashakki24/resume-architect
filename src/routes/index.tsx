import { createFileRoute } from "@tanstack/react-router";
import { ResumeProvider } from "@/resume/ResumeContext";
import { Wizard } from "@/resume/Wizard";
import { A4Preview } from "@/resume/A4Preview";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <ResumeProvider>
      <main className="grid h-screen w-screen grid-cols-1 overflow-hidden bg-background lg:grid-cols-2">
        {/* Left: Wizard (scrollable) */}
        <section className="h-screen overflow-hidden border-r border-border">
          <Wizard />
        </section>
        {/* Right: Sticky live A4 preview */}
        <aside className="sticky top-0 hidden h-screen lg:block">
          <A4Preview />
        </aside>
      </main>
    </ResumeProvider>
  );
}
