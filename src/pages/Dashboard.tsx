import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChefHat, TrendingUp, Clock, Plus, Users, MessageSquare, Send, Star, Play } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { getRecipes, RecipeData } from "@/lib/api";
import { getAllDBUsers, getAllDBFeedback, addDBFeedback, addDBVoiceRecord, DBFeedback, getDBVoiceRecord } from "@/lib/premium-db";
import { getUser } from "@/lib/auth";
import { VoiceRecorder } from "@/components/VoiceRecorder";

const Dashboard = () => {
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [feedbacks, setFeedbacks] = useState<DBFeedback[]>([]);
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [usersCount, setUsersCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [playingAudio, setPlayingAudio] = useState<{ id: number, url: string } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const u = await getAllDBUsers();
        const f = await getAllDBFeedback();
        const r = await getRecipes();
        setUsersCount(u.length);
        setFeedbacks(f);
        setTotalFeedback(f.length);
        setRecipes(r);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();

    return () => {
      if (playingAudio) URL.revokeObjectURL(playingAudio.url);
    };
  }, []);

  const handlePlayVoice = async (recordId: number) => {
    if (playingAudio?.id === recordId) return;
    if (playingAudio) URL.revokeObjectURL(playingAudio.url);
    
    const record = await getDBVoiceRecord(recordId);
    if (record) {
      const url = URL.createObjectURL(record.blob);
      setPlayingAudio({ id: recordId, url });
    } else {
      console.error("Voice record not found.");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() && rating === 0 && !voiceBlob) return;
    
    const currentUser = getUser();
    const email = currentUser?.email || "anonymous@demo.com";

    try {
      let voiceRecordId;
      if (voiceBlob) {
        voiceRecordId = await addDBVoiceRecord({
          user_email: email,
          blob: voiceBlob,
          created_at: new Date().toISOString()
        });
      }

      await addDBFeedback({
        user_email: email,
        rating: rating,
        message: feedbackText,
        voice_record_id: voiceRecordId,
        created_at: new Date().toISOString()
      });

      // Update counters
      const f = await getAllDBFeedback();
      setFeedbacks(f);
      setTotalFeedback(f.length);
      
      // Reset form
      setFeedbackText("");
      setRating(0);
      setVoiceBlob(null);
      alert("Feedback submitted successfully!");

    } catch (error) {
      console.error("Failed to submit feedback", error);
    }
  };

  const stats = useMemo(() => {
    let totalTime = 0;
    recipes.forEach((r) => {
      const mins = parseInt(r.time) || 0;
      totalTime += mins;
    });
    return {
      total: recipes.length,
      newThisWeek: Math.min(recipes.length, 8),
      avgTime: recipes.length ? Math.round(totalTime / recipes.length) : 0,
    };
  }, [recipes]);

  const statCards = [
    { label: "Total Recipes", value: stats.total, icon: ChefHat, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "New This Week", value: `+${stats.newThisWeek}`, icon: TrendingUp, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { label: "Avg Cook Time", value: `${stats.avgTime} min`, icon: Clock, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { label: "Total Users", value: usersCount || 1, icon: Users, color: "text-blue-400", bgColor: "bg-blue-400/10" },
    { 
      label: "Feedback Received", 
      value: totalFeedback, 
      icon: MessageSquare, 
      color: "text-purple-400", 
      bgColor: "bg-purple-400/10",
      onClick: () => {
        document.getElementById("community-feedback")?.scrollIntoView({ behavior: "smooth" });
      }
    },
  ];

  return (
    <SidebarLayout>
      <div className="mb-6"></div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bgColor, onClick }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={onClick}
            className={`card p-5 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all ${onClick ? 'cursor-pointer' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-2xl font-bold text-white">{value}</span>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl icon-circle text-white`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <span className="text-sm text-slate-400 font-medium">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* App Feedback Section with Voice Recording */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <div className="card p-6 border-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">App Feedback</h2>
              <p className="text-sm text-slate-400">Share your experience via text or voice recording.</p>
            </div>
            <div className="bg-[#121827] text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-border/50">
              {totalFeedback} submitted
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-full">
                <Star className={`h-6 w-6 ${star <= rating ? "fill-purple-500 text-purple-500" : "text-slate-600"} hover:text-purple-400 transition-all`} />
              </button>
            ))}
          </div>
          
          <div className="mb-4">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what you like and what we should improve..."
              className="w-full min-h-[100px] rounded-lg border border-border/40 bg-[#121827] p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
            />
          </div>

          <div className="mb-6">
            <VoiceRecorder 
              onSave={(blob) => setVoiceBlob(blob)} 
              onClear={() => setVoiceBlob(null)} 
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSubmitFeedback}
              disabled={(!feedbackText.trim() && rating === 0 && !voiceBlob)}
              className="flex items-center gap-2 rounded-lg gradient-btn px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Submit Feedback
            </button>
          </div>
        </div>
      </motion.div>

      {/* Community Feedback List */}
      {feedbacks.length > 0 && (
        <motion.div
          id="community-feedback"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Community Feedback</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {feedbacks.map((fb, i) => (
              <motion.div key={fb.id || i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay: i*0.05}} className="card p-5 border-0 hover:border-cyan-500/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium">{fb.user_email || "Unknown User"}</p>
                    <p className="text-xs text-slate-400">{fb.created_at ? new Date(fb.created_at).toLocaleString() : "Unknown Date"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="icon-circle px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                      {fb.rating || 0} <Star className="h-3 w-3 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 mb-4">{fb.message || ""}</p>
                
                {fb.voice_record_id && (
                  <div className="pt-4 border-t border-border/20 flex items-center gap-3">
                    <Button size="sm" onClick={() => handlePlayVoice(fb.voice_record_id!)} className="bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400">
                      <Play className="h-4 w-4 mr-2" /> Play Audio
                    </Button>
                    {playingAudio?.id === fb.voice_record_id && (
                      <audio src={playingAudio.url} controls autoPlay className="h-8 max-w-[200px] outline-none" />
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Your Recipes Grid */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Your Recipes</h2>
        <Button asChild className="gradient-btn border-0">
          <Link to="/create"><Plus className="h-4 w-4 mr-2" /> Create Recipe</Link>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {recipes.slice(0, 6).map((recipe, i) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={`/recipe/${recipe.id}`} className="block card overflow-hidden hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all group border-0">
              <div className="relative aspect-[16/10] overflow-hidden">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-[#121827] flex items-center justify-center">
                    <ChefHat className="h-10 w-10 text-slate-500" />
                  </div>
                )}
                {recipe.time && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                    <Clock className="h-3 w-3" /> {recipe.time}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-base text-white">{recipe.title}</h3>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;
