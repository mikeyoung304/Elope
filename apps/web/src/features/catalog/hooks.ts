import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: () => api.getPackages(),
  });
}

export function usePackage(slug: string) {
  return useQuery({
    queryKey: ["package", slug],
    queryFn: () => api.getPackageBySlug(slug),
    enabled: !!slug,
  });
}
