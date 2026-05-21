"use client";

import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  useProfile,
  useUpdateProfile,
  PROFILE_QUERY_KEY,
} from "@/hooks/useProfile";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileSchema } from "@/lib/utils";
import { PLAN_ALLOWANCES } from "@/lib/ai-credits";
import { createStripePortal, getUserData } from "@/lib/api-services";
import type { UserPlan, User } from "@/types/user";
import { UpgradeProCta } from "@/components/ui/UpgradeProCta";

function AccountSettingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [portalLoading, setPortalLoading] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    linkedin: "",
    github: "",
    location: "",
  });

  const { data: userData } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const handleUpdate = async () => {
    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
        linkedin: userData.linkedin || "",
        github: userData.github || "",
        location: userData.location || "",
      });
    }
  }, [userData]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;

    router.replace("/settings#ai-plan");

    if (checkout === "cancel") {
      toast.info("Checkout was cancelled.");
      return;
    }

    if (checkout !== "success") return;

    let cancelled = false;

    const pollForProPlan = async () => {
      const maxAttempts = 15;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelled) return;

        await queryClient.fetchQuery({
          queryKey: PROFILE_QUERY_KEY,
          queryFn: getUserData,
        });

        const profile = queryClient.getQueryData<User>(PROFILE_QUERY_KEY);
        if (profile?.plan === "pro") {
          toast.success("Welcome to Pro! Your AI credits have been updated.");
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      toast.info(
        "Payment received. Your Pro plan should activate shortly — refresh if credits do not update.",
      );
    };

    void pollForProPlan();

    return () => {
      cancelled = true;
    };
  }, [searchParams, queryClient, router]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createStripePortal();
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not open billing portal",
      );
      setPortalLoading(false);
    }
  };

  const plan = (userData?.plan ?? "free") as UserPlan;
  const allowance = PLAN_ALLOWANCES[plan];
  const creditsRemaining = userData?.ai_credits_balance ?? allowance;
  const resetDate = userData?.credits_period_end
    ? new Date(userData.credits_period_end).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="overflow-auto px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Profile Settings
            </h1>
            <p className="text-sm text-gray-600 md:text-base">
              {userData?.email
                ? `You're now signing up as ${userData.email}.`
                : "Manage your profile settings."}
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              Update
            </Button>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-semibold">General</h2>
          <hr className="my-[12px]" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <Input
                label="First Name"
                variant="horizontal"
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange("first_name")}
                placeholder="Enter your first name"
                required
                aria-invalid={!!errors.first_name}
                className="w-full md:w-64"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>
              )}
            </div>
            <div className="flex flex-col">
              <Input
                label="Last Name"
                variant="horizontal"
                id="last_name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange("last_name")}
                placeholder="Enter your name"
                required
                aria-invalid={!!errors.last_name}
                className="w-full md:w-64"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>
              )}
            </div>
            <div>
              <PhoneInput
                label="Phone Number"
                variant="horizontal"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={(value) =>
                  setFormData({ ...formData, phone: value || "" })
                }
                maxLength={14}
                className="w-full md:w-64"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>
            <div className="flex flex-col">
              <Input
                label="Location"
                variant="horizontal"
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange("location")}
                placeholder="Enter your location"
                required
                aria-invalid={!!errors.location}
                className="w-full md:w-64"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Profile Link</h2>
          <hr className="my-[12px]" />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <Input
                label="LinkedIn Profile URL"
                variant="horizontal"
                id="linkedin"
                type="text"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange("linkedin")}
                placeholder="Enter your LinkedIn profile URL"
                required
                aria-invalid={!!errors.linkedin}
                className="w-full md:w-64"
              />
              {errors.linkedin && (
                <p className="mt-1 text-sm text-red-500">{errors.linkedin}</p>
              )}
            </div>
            <div className="flex flex-col">
              <Input
                label="GitHub Profile URL"
                variant="horizontal"
                id="github"
                type="text"
                name="github"
                value={formData.github}
                onChange={handleChange("github")}
                placeholder="Enter your GitHub profile URL"
                required
                aria-invalid={!!errors.github}
                className="w-full md:w-64"
              />
              {errors.github && (
                <p className="mt-1 text-sm text-red-500">{errors.github}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8" id="ai-plan">
          <h2 className="text-lg font-semibold">AI Plan</h2>
          <hr className="my-[12px]" />
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 md:p-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Current plan:{" "}
                  <span className="capitalize text-indigo-600">{plan}</span>
                </p>
                <p className="text-sm text-gray-600">
                  {creditsRemaining} of {allowance} AI credits remaining this
                  month
                </p>
                {resetDate && (
                  <p className="text-sm text-gray-500">Resets on {resetDate}</p>
                )}
              </div>
              {plan === "free" && (
                <UpgradeProCta
                  variant="settings"
                  creditsExhausted={creditsRemaining <= 0}
                />
              )}
              {plan === "pro" && (
                <Button
                  variant="outline"
                  className="w-fit"
                  disabled={portalLoading}
                  onClick={handleManageBilling}
                >
                  {portalLoading ? "Opening…" : "Manage subscription"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2 md:hidden">
        <Button onClick={handleCancel} variant="outline" disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={isPending}>
          Update
        </Button>
      </div>
    </div>
  );
}

export default function AccountSettingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <AccountSettingPageContent />
    </Suspense>
  );
}
