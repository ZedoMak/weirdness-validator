import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useCreateConfession } from "@/hooks/use-confessions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConfessionSchema, type CreateConfessionRequest } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, SendHorizontal } from "lucide-react";

interface CreateConfessionModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function CreateConfessionModal({ children, open, onOpenChange }: CreateConfessionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Handle both controlled and uncontrolled state
  const isControlled = open !== undefined;
  const show = isControlled ? open : isOpen;
  const setShow = isControlled && onOpenChange ? onOpenChange : setIsOpen;

  const createConfession = useCreateConfession();

  const form = useForm<CreateConfessionRequest>({
    resolver: zodResolver(insertConfessionSchema),
    defaultValues: {
      content: "",
      category: "Thoughts",
    },
  });

  const onSubmit = (data: CreateConfessionRequest) => {
    createConfession.mutate(data, {
      onSuccess: () => {
        setShow(false);
        form.reset();
      },
    });
  };

  const categories = ["Thoughts", "Food", "Sleep", "Home", "Work", "Relationships", "Weird Habits", "Secret"];

  return (
    <Dialog open={show} onOpenChange={setShow}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000000] p-0 overflow-hidden gap-0">
        <div className="bg-primary p-6 border-b-2 border-black">
          <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">Spill the tea ☕️</DialogTitle>
          <DialogDescription className="text-white/80 font-mono text-xs mt-1">
            Don't worry, we'll generate a fake name for you.
          </DialogDescription>
        </div>
        
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs tracking-wider">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="brutal-input h-12 bg-white">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="font-mono focus:bg-primary/20 focus:text-black cursor-pointer">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold uppercase text-xs tracking-wider">Your Confession</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea 
                          placeholder="I eat kiwi with the skin on..." 
                          className="brutal-input min-h-[120px] resize-none pr-4 pb-8"
                          {...field} 
                        />
                        <div className="absolute bottom-3 right-3 text-xs font-mono text-muted-foreground bg-white px-1">
                          {field.value.length}/200
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={createConfession.isPending}
                  className="brutal-btn-primary w-full flex items-center justify-center gap-2 group"
                >
                  {createConfession.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Validate Me
                      <SendHorizontal className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
