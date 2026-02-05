import { useState } from "react";
import { useConfessions, useStats } from "@/hooks/use-confessions";
import { ConfessionCard } from "@/components/ConfessionCard";
import { CreateConfessionModal } from "@/components/CreateConfessionModal";
import { Marquee } from "@/components/Marquee";
import { Loader2, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [filter, setFilter] = useState("newest");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce logic would go here in production, relying on enter key or blur for now for simplicity
  const { data: confessions, isLoading, error } = useConfessions({ 
    sort: filter, 
    category: category === "All" ? undefined : category,
    search: searchTerm 
  });

  const { data: stats } = useStats();

  const categories = ["All", "Thoughts", "Food", "Sleep", "Home", "Work", "Relationships", "Weird Habits"];

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 text-center max-w-5xl mx-auto">
        <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-white border-2 border-black px-4 py-2 font-mono text-sm shadow-[4px_4px_0px_0px_#000]">
          {stats ? (
            <>
              <span className="font-bold">{stats.totalConfessions}</span> Confessions • 
              <span className="font-bold ml-1">{stats.totalVotes}</span> Votes
            </>
          ) : "Loading stats..."}
        </div>

        <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-[0.9]">
          IS IT JUST ME?
        </h1>
        <p className="text-xl md:text-2xl font-mono text-muted-foreground mb-12 max-w-2xl mx-auto">
          Validate your weirdness. Anonymously.
        </p>

        <div className="max-w-xl mx-auto relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <div className="brutal-input h-16 flex items-center text-muted-foreground text-lg bg-white pointer-events-none select-none">
            I secretly...
          </div>
          <div className="absolute right-2 top-2 bottom-2">
            <button className="h-full px-6 bg-black text-white font-bold uppercase text-sm rounded border-2 border-transparent hover:bg-primary hover:text-black hover:border-black transition-colors">
              Submit
            </button>
          </div>
        </div>
        
        <CreateConfessionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </section>

      {/* Marquee */}
      <Marquee items={[
        "I eat pizza with a fork", 
        "I talk to my plants", 
        "I sleep with socks on", 
        "I rehearse arguments in the shower",
        "I pretend to text to avoid people"
      ]} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 sticky top-4 z-10">
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row gap-2 w-full">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search confessions..." 
                className="pl-9 border-black focus-visible:ring-primary font-mono h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[140px] border-black font-bold h-10 bg-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black bg-white">
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[160px] border-black font-bold h-10 bg-black text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black bg-white">
                  <SelectItem value="newest">✨ Newest</SelectItem>
                  <SelectItem value="popular">🔥 Popular</SelectItem>
                  <SelectItem value="controversial">🌶️ Controversial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Confession Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="font-mono text-muted-foreground animate-pulse">Loading weirdness...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-xl font-bold text-red-500">Something went wrong.</p>
            <p className="font-mono text-muted-foreground">Maybe try again later?</p>
          </div>
        ) : confessions?.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h2 className="text-2xl font-bold mb-2">No confessions found</h2>
            <p className="font-mono text-muted-foreground mb-8">Be the first to validate this specific weirdness.</p>
            <button onClick={() => setIsModalOpen(true)} className="brutal-btn-primary">
              Submit Confession
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {confessions?.map((confession, index) => (
              <ConfessionCard key={confession.id} confession={confession} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
