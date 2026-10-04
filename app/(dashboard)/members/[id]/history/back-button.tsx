"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/button";

export function BackButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="icon"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.push("/members");
        });
      }}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
      ) : (
        <ArrowLeft className="w-4 h-4" />
      )}
    </Button>
  );
}
