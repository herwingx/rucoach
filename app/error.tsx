"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to Sentry, LogRocket, etc.
    }
  }, [error]);

  return (
    <div
      id="main-content"
      role="main"
      className="min-h-dvh flex items-center justify-center p-6 bg-background"
      tabIndex={-1}
    >
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>
            <span className="block">
              Ocurrió un error inesperado. Por favor intenta de nuevo.
            </span>
            {process.env.NODE_ENV === "development" && (
              <span className="block mt-2 text-xs opacity-80">
                Si estás en desarrollo, reinicia el servidor (pnpm dev) o recarga
                la página.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={reset} className="w-full">
            Intentar de nuevo
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
