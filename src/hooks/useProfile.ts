import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserData, updateUserData, type UserUpdateRequest } from "@/lib/api-services";

export const PROFILE_QUERY_KEY = ["profile"] as const;

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getUserData,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserUpdateRequest) => updateUserData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}
