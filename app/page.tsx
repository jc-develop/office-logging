import LogForm from "@/components/LogForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Office Logging
        </h1>
        <p className="mt-2 text-neutral-400">
          Enter your name, take a photo, then log in or out.
        </p>
      </div>

      <LogForm />
    </main>
  );
}
