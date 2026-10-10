import { BRAND } from "@/lib/brand";

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <h1 className="font-display text-4xl">{BRAND.name}</h1>
    </main>
  );
}
