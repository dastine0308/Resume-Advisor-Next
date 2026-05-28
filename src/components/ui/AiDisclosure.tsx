import Link from "next/link";
import { cn } from "@/lib/utils";

interface AiDisclosureProps {
  className?: string;
}

export function AiDisclosure({ className }: AiDisclosureProps) {
  return (
    <p className={cn("text-xs text-gray-400", className)}>
      AI features are powered by{" "}
      <Link
        href="https://groq.com/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-gray-600"
      >
        Groq
      </Link>
      .{" "}
      <Link
        href="https://console.groq.com/docs/your-data"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-gray-600"
      >
        Groq does not retain your data
      </Link>{" "}
      from API requests by default.
    </p>
  );
}
