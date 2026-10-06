import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface CustomerItem {
  id: string;
  organizationId: string;
  customerCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  taxIdNumber?: string | null;
  taxNumber?: string | null;
  currency: string;
  creditLimit: number;
  paymentTerms: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useCustomers() {
  return useQuery<CustomerItem[]>({
    queryKey: ["customers"],
    queryFn: () => apiClient<CustomerItem[]>("/customers"),
  });
}

export function useCustomer(id: string) {
  return useQuery<CustomerItem>({
    queryKey: ["customer", id],
    queryFn: () => apiClient<CustomerItem>(`/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerCode: string;
      name: string;
      email?: string | undefined;
      phone?: string | undefined;
      address?: string | undefined;
      city?: string | undefined;
      state?: string | undefined;
      country?: string | undefined;
      postalCode?: string | undefined;
      taxIdNumber?: string | undefined;
      taxNumber?: string | undefined;
      currency?: string | undefined;
      creditLimit?: number | undefined;
      paymentTerms?: string | undefined;
      status?: "ACTIVE" | "INACTIVE" | "BLOCKED" | undefined;
    }) =>
      apiClient<CustomerItem>("/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerItem> }) =>
      apiClient<CustomerItem>(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ message: string }>(`/customers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
