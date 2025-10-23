import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await api.getPackages();
      if (response.status !== 200) {
        throw new Error("Failed to fetch packages");
      }
      return response.body;
    },
  });
}

export function usePackage(slug: string) {
  return useQuery({
    queryKey: ["package", slug],
    queryFn: async () => {
      const response = await api.getPackageBySlug({ params: { slug } });
      if (response.status !== 200) {
        throw new Error("Failed to fetch package");
      }
      return response.body;
    },
    enabled: !!slug,
  });
}
