import { toast } from "sonner";

export function showWarningToast(
  title: string,
  description: string,
  options?: { duration?: number; id?: string },
) {
  toast.warning(title, {
    description,
    duration: options?.duration ?? 6000,
    ...(options?.id ? { id: options.id } : {}),
  });
}
