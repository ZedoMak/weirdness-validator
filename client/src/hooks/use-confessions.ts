import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { 
  CreateConfessionRequest, 
  CreateCommentRequest, 
  VoteRequest,
  ConfessionResponse
} from "@shared/schema";

// --- Confessions ---

export function useConfessions(params?: { sort?: string; category?: string; search?: string }) {
  const queryKey = [api.confessions.list.path, params?.sort, params?.category, params?.search].filter(Boolean);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string manually since simple fetch doesn't handle objects in GET well without a library
      const url = new URL(window.location.origin + api.confessions.list.path);
      if (params?.sort) url.searchParams.set("sort", params.sort);
      if (params?.category) url.searchParams.set("category", params.category);
      if (params?.search) url.searchParams.set("search", params.search);

      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch confessions");
      return api.confessions.list.responses[200].parse(await res.json());
    },
  });
}

export function useConfession(id: number) {
  return useQuery({
    queryKey: [api.confessions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.confessions.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch confession");
      return api.confessions.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateConfession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateConfessionRequest) => {
      const validated = api.confessions.create.input.parse(data);
      const res = await fetch(api.confessions.create.path, {
        method: api.confessions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.confessions.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to post confession");
      }
      return api.confessions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.confessions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "Confession Posted!",
        description: "Your weirdness has been validated (maybe).",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useVoteConfession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, type }: { id: number } & VoteRequest) => {
      const url = buildUrl(api.confessions.vote.path, { id });
      const res = await fetch(url, {
        method: api.confessions.vote.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to vote");
      return api.confessions.vote.responses[200].parse(await res.json());
    },
    onMutate: async ({ id, type }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [api.confessions.list.path] });

      // Snapshot previous value
      const previousConfessions = queryClient.getQueryData<ConfessionResponse[]>([api.confessions.list.path]);

      // Optimistic update
      queryClient.setQueryData([api.confessions.list.path], (old: ConfessionResponse[] | undefined) => {
        if (!old) return [];
        return old.map(c => {
          if (c.id === id) {
            return {
              ...c,
              meTooCount: type === 'meToo' ? c.meTooCount + 1 : c.meTooCount,
              nopeCount: type === 'nope' ? c.nopeCount + 1 : c.nopeCount,
            };
          }
          return c;
        });
      });

      return { previousConfessions };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData([api.confessions.list.path], context?.previousConfessions);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.confessions.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.confessions.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

// --- Comments ---

export function useComments(confessionId: number) {
  return useQuery({
    queryKey: [api.comments.list.path, confessionId],
    queryFn: async () => {
      const url = buildUrl(api.comments.list.path, { id: confessionId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return api.comments.list.responses[200].parse(await res.json());
    },
    enabled: !!confessionId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ confessionId, ...data }: { confessionId: number } & CreateCommentRequest) => {
      const url = buildUrl(api.comments.create.path, { id: confessionId });
      const res = await fetch(url, {
        method: api.comments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to post comment");
      return api.comments.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { confessionId }) => {
      queryClient.invalidateQueries({ queryKey: [api.comments.list.path, confessionId] });
      toast({ title: "Comment Added", description: "Thanks for chiming in!" });
    },
  });
}

export function useLikeComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const url = buildUrl(api.comments.like.path, { id });
      const res = await fetch(url, { method: api.comments.like.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to like comment");
      return api.comments.like.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      // Invalidate all comment lists (simpler than finding the specific one without parent ID)
      queryClient.invalidateQueries({ queryKey: [api.comments.list.path] }); 
    }
  });
}

// --- Stats ---

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
  });
}
