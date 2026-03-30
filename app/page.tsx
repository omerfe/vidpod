import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-2xl border-0 ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Vidpod ads editor MVP</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Open the ads editor workspace backed by the seeded data already in
            Convex.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/ads/episode-001">Open episode 001</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/ads/episode-002">Open episode 002</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
