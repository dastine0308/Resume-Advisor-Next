"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useAccountStore } from "@/stores";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { profileSchema } from "@/lib/utils";

export default function AccountSettingPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    linkedin: "",
    github: "",
    location: "",
  });

  const userData = useAccountStore((state) => state.user);
  const setUserData = useAccountStore((state) => state.setUser);

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [field]: e.target.value });
    };

  const handleCancel = () => {
    // Reset user data to original values or perform any cancel logic
    setFormData({
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      phone: userData.phone || "",
      linkedin: userData.linkedin || "",
      github: userData.github || "",
      location: userData.location || "",
    });

    router.push("/");
  };

  const updateUser = async (userData: typeof formData) => {
    const { updateUserData } = await import("@/lib/api-services");
    return updateUserData(userData);
  };

  const handleUpdate = async () => {
    // Validate form data
    const result = profileSchema.safeParse(formData);
    console.log("Validation result:", result);
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

    // If validation passes, clear errors and proceed to save
    setErrors({});
    setIsSaving(true);
    try {
      await updateUser({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        linkedin: formData.linkedin,
        github: formData.github,
        location: formData.location,
      });
      toast.success("Profile updated successfully");
      setUserData({
        ...userData,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        linkedin: formData.linkedin,
        github: formData.github,
        location: formData.location,
      });
      router.push("/");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Initialize form data from user data
    setFormData({
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      phone: userData.phone || "",
      linkedin: userData.linkedin || "",
      github: userData.github || "",
      location: userData.location || "",
    });
  }, [userData]);

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
                ? `You're now signing
            up as ${userData.email}.`
                : "Manage your profile settings."}
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
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
                id="name"
                type="text"
                name="name"
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
                id="name"
                type="text"
                name="name"
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
                defaultCountry="CA"
                maxLength={14}
                className="w-full md:w-64"
              />
              {errors.phone && (
                <p className="mt-0 text-sm text-red-500">{errors.phone}</p>
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
      </div>
      <div className="mt-5 flex flex-col gap-2 md:hidden">
        <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={isSaving}>
          Update
        </Button>
      </div>
    </div>
  );
}
