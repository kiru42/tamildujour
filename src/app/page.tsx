import { DailySession } from "@/components/daily-session";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-4">
      <DailySession />
    </main>
  );
}
