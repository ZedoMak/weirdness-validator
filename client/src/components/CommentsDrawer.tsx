import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useComments, useCreateComment, useLikeComment } from "@/hooks/use-confessions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommentSchema, type CreateCommentRequest } from "@shared/schema";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Heart, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface CommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confessionId: number;
  confessionContent: string;
}

export function CommentsDrawer({ open, onOpenChange, confessionId, confessionContent }: CommentsDrawerProps) {
  const { data: comments, isLoading } = useComments(confessionId);
  const createComment = useCreateComment();
  const likeComment = useLikeComment();

  const form = useForm<CreateCommentRequest>({
    resolver: zodResolver(insertCommentSchema.omit({ confessionId: true })),
    defaultValues: { content: "" },
  });

  const onSubmit = (data: CreateCommentRequest) => {
    createComment.mutate({ confessionId, ...data }, {
      onSuccess: () => form.reset(),
    });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const getColor = (name: string) => {
    const colors = ["bg-red-200", "bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-purple-200", "bg-pink-200"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md border-l-2 border-black p-0 bg-white flex flex-col h-full">
        <SheetHeader className="p-6 border-b-2 border-black bg-gray-50">
          <SheetTitle className="text-xl font-bold line-clamp-2">Re: "{confessionContent}"</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            Join the conversation. Be nice... or funny.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2 text-4xl">🦗</p>
              <p className="font-mono text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar className="w-8 h-8 border-2 border-black">
                    <AvatarFallback className={cn("text-xs font-bold text-black", getColor(comment.authorName))}>
                      {getInitials(comment.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{comment.authorName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-800 bg-gray-50 p-3 rounded-lg border border-black/10">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 pt-1">
                      <button 
                        onClick={() => likeComment.mutate({ id: comment.id })}
                        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-3 h-3" />
                        {comment.likes} Likes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t-2 border-black bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-grow space-y-0">
                    <FormControl>
                      <Input 
                        placeholder="Say something..." 
                        className="brutal-input h-10 border-black shadow-none focus:shadow-none bg-gray-50 focus:bg-white"
                        autoComplete="off"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <button 
                type="submit" 
                disabled={createComment.isPending || !form.formState.isDirty}
                className="bg-black text-white h-10 w-10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
              >
                {createComment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
import { cn } from "@/lib/utils";
