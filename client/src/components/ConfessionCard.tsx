import { useState } from "react";
import { type ConfessionResponse } from "@shared/schema";
import { useVoteConfession } from "@/hooks/use-confessions";
import { CommentsDrawer } from "./CommentsDrawer";
import { motion } from "framer-motion";
import { MessageSquare, Flame, Clock, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ConfessionCardProps {
  confession: ConfessionResponse;
  index: number;
}

export function ConfessionCard({ confession, index }: ConfessionCardProps) {
  const [showComments, setShowComments] = useState(false);
  const voteMutation = useVoteConfession();
  const { toast } = useToast();

  const totalVotes = confession.meTooCount + confession.nopeCount;
  const meTooPercentage = totalVotes > 0 
    ? Math.round((confession.meTooCount / totalVotes) * 100) 
    : 0;
  
  const isControversial = totalVotes > 10 && meTooPercentage > 40 && meTooPercentage < 60;
  const isTrending = totalVotes > 50; // Simple trending logic

  // Check if user voted in local storage
  const getStoredVote = () => {
    try {
      const stored = localStorage.getItem(`vote_${confession.id}`);
      return stored as "meToo" | "nope" | null;
    } catch {
      return null;
    }
  };

  const [userVote, setUserVote] = useState<"meToo" | "nope" | null>(getStoredVote());

  const handleVote = (type: "meToo" | "nope") => {
    if (userVote) return;
    
    voteMutation.mutate(
      { id: confession.id, type },
      {
        onSuccess: () => {
          setUserVote(type);
          localStorage.setItem(`vote_${confession.id}`, type);
        },
        onError: () => {
          toast({
            title: "Vote Failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
};


  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/confession/${confession.id}`);
    toast({
      title: "Link Copied!",
      description: "Share it with your weird friends.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="brutal-card flex flex-col h-full relative overflow-hidden group"
    >
      {/* Badges */}
      <div className="absolute top-0 right-0 p-3 flex gap-2">
        {isControversial && (
          <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 border border-black shadow-[2px_2px_0px_0px_#000] rotate-2">
            Hot Take
          </span>
        )}
        {isTrending && (
          <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-1 border border-black shadow-[2px_2px_0px_0px_#000] -rotate-2 flex items-center gap-1">
            <Flame className="w-3 h-3 fill-current" /> Trending
          </span>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="mb-4">
          <span className="inline-block bg-black text-white text-xs font-mono font-bold px-2 py-0.5 mb-3">
            {confession.category.toUpperCase()}
          </span>
          <h3 className="text-xl md:text-2xl font-bold leading-tight min-h-[4rem]">
            "{confession.content}"
          </h3>
        </div>
        
        <div className="mt-auto space-y-4">
          {/* Progress Bar */}
          <div className="relative h-6 w-full border-2 border-black rounded-full overflow-hidden flex">
            <motion.div 
              className="h-full bg-primary flex items-center justify-start px-2"
              initial={{ width: 0 }}
              animate={{ width: `${meTooPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {meTooPercentage > 15 && (
                <span className="text-[10px] font-bold text-white whitespace-nowrap">
                  {meTooPercentage}% ME TOO
                </span>
              )}
            </motion.div>
            <div className="flex-grow bg-gray-100 flex items-center justify-end px-2">
              {(100 - meTooPercentage) > 15 && (
                <span className="text-[10px] font-bold text-black/50 whitespace-nowrap">
                  {100 - meTooPercentage}% NOPE
                </span>
              )}
            </div>
          </div>

          {/* Voting Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleVote("meToo")}
              disabled={!!userVote}
              className={cn(
                "brutal-btn text-sm py-2",
                userVote === "meToo" 
                  ? "bg-primary text-white translate-y-1 translate-x-1 shadow-none" 
                  : "bg-white hover:bg-primary/10",
                userVote && userVote !== "meToo" && "opacity-50 cursor-not-allowed"
              )}
            >
              🙋‍♀️ Me Too
            </button>
            <button
              onClick={() => handleVote("nope")}
              disabled={!!userVote}
              className={cn(
                "brutal-btn text-sm py-2",
                userVote === "nope" 
                  ? "bg-black text-white translate-y-1 translate-x-1 shadow-none" 
                  : "bg-white hover:bg-gray-100",
                userVote && userVote !== "nope" && "opacity-50 cursor-not-allowed"
              )}
            >
              🤦‍♂️ Nope
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t-2 border-black p-3 bg-gray-50 flex justify-between items-center text-xs font-mono">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(confession.createdAt), { addSuffix: true })}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1 hover:text-primary transition-colors font-bold"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comments</span>
          </button>
          <div className="w-px h-4 bg-black/20 self-center" />
          <button 
            onClick={handleShare}
            className="flex items-center gap-1 hover:text-primary transition-colors font-bold"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CommentsDrawer 
        open={showComments} 
        onOpenChange={setShowComments} 
        confessionId={confession.id} 
        confessionContent={confession.content}
      />
    </motion.div>
  );
}
