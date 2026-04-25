import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChefHat, Users, Trash2, Edit, Eye, Download, Shield, CheckCircle2,
  Server, Wifi, MessageSquare, FileJson, Volume2, Settings, LogOut, Clock, XCircle, Check, Play, Activity, Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getRecipes, deleteLocalRecipe, getPendingRecipes, approveRecipe, rejectRecipe, restoreDemoRecipes, type RecipeData } from "@/lib/api";
import { getUser, isAdmin, logout } from "@/lib/auth";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { getAllDBUsers, getAllDBFeedback, deleteDBUser, deleteDBFeedback, DBUser, DBFeedback, getDBVoiceRecord } from "@/lib/premium-db";

const architectureItems = [
  { icon: Server, label: "Python Backend Server", desc: "FastAPI designed for async WebSocket support — currently using Lovable Cloud edge functions for AI processing", status: "implemented" },
  { icon: Wifi, label: "WebSocket Implementation", desc: "useWebSocket hook with auto-reconnect, max retries, and graceful error handling — ready for backend integration", status: "implemented" },
  { icon: MessageSquare, label: "Speech-to-Text Integration", desc: "Browser Web Speech API with 10 Indian language support", status: "implemented" },
  { icon: FileJson, label: "LLM Structured JSON Output", desc: "Gemini 3 Flash via Lovable AI gateway extracts JSON", status: "implemented" },
  { icon: Volume2, label: "Text-to-Speech Integration", desc: "Browser SpeechSynthesis API reads structured recipe aloud", status: "implemented" },
  { icon: Settings, label: "System Prompt Design", desc: "Expert Indian recipe parser prompt with multilingual support", status: "implemented" },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [pendingRecipes, setPendingRecipes] = useState<RecipeData[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeData | null>(null);
  
  // SaaS Data
  const [dbUsers, setDbUsers] = useState<DBUser[]>([]);
  const [dbFeedbacks, setDbFeedbacks] = useState<DBFeedback[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [playingAudio, setPlayingAudio] = useState<{ id: number, url: string } | null>(null);

  const adminAccess = user && isAdmin();

  const approvedRecipes = useMemo(() =>
    (recipes || []).filter((r) => r && r.status !== "pending" && r.status !== "rejected"),
    [recipes]
  );

  const filteredRecipes = useMemo(() =>
    approvedRecipes.filter((r) => r && (r.title || "").toLowerCase().includes((search || "").toLowerCase())),
    [approvedRecipes, search]
  );

  const fetchStats = async () => {
    try {
      const u = await getAllDBUsers();
      const f = await getAllDBFeedback();
      const r = await getRecipes();
      const p = await getPendingRecipes();
      setDbUsers(u);
      setDbFeedbacks(f);
      setRecipes(r);
      setPendingRecipes(p);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (adminAccess) fetchStats();
    return () => {
      if (playingAudio) URL.revokeObjectURL(playingAudio.url);
    };
  }, [adminAccess]);

  if (!adminAccess) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Admin credentials required.</p>
          <Button onClick={() => navigate("/login")} className="gradient-btn border-0">Go to Login</Button>
        </div>
      </SidebarLayout>
    );
  }

  // Recipes actions
  const refreshRecipes = async () => {
    const r = await getRecipes();
    const p = await getPendingRecipes();
    setRecipes(r);
    setPendingRecipes(p);
  };

  const handleDeleteRecipe = async (id: string) => {
    await deleteLocalRecipe(id);
    await refreshRecipes();
    toast.success("Recipe deleted");
  };

  const handleApprove = async (id: string) => {
    await approveRecipe(id);
    await refreshRecipes();
    toast.success("Recipe approved!");
  };

  const handleReject = async (id: string) => {
    await rejectRecipe(id);
    await refreshRecipes();
    toast.success("Recipe rejected");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRestoreRecipes = async () => {
    if (confirm("Are you sure you want to restore the original demo recipes? This will delete any custom recipes!")) {
      await restoreDemoRecipes();
      await refreshRecipes();
      toast.success("Original recipes restored!");
    }
  };

  // SaaS actions
  const handleDeleteUser = async (email: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await deleteDBUser(email);
      fetchStats();
      toast.success("User deleted");
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (confirm("Are you sure you want to delete this feedback?")) {
      await deleteDBFeedback(id);
      fetchStats();
      toast.success("Feedback deleted");
    }
  };

  const handlePlayVoice = async (recordId: number) => {
    if (playingAudio?.id === recordId) return;
    if (playingAudio) URL.revokeObjectURL(playingAudio.url);
    
    const record = await getDBVoiceRecord(recordId);
    if (record) {
      const url = URL.createObjectURL(record.blob);
      setPlayingAudio({ id: recordId, url });
    } else {
      toast.error("Voice record not found.");
    }
  };

  const filteredUsers = (dbUsers || []).filter(u => 
    u && ((u.name || "").toLowerCase().includes((userSearchQuery || "").toLowerCase()) || 
    (u.email || "").toLowerCase().includes((userSearchQuery || "").toLowerCase()))
  );

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500">Admin Control Center</h1>
            <p className="text-sm text-slate-400">Manage recipes, users, and feedback analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRestoreRecipes} className="border-border text-slate-300 hover:text-white hover:border-white">
              Restore Demo Recipes
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-border text-slate-300">
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="card border-0 p-1 flex-wrap h-auto gap-1 text-slate-300">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white">Analytics</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white">Users</TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white">Feedback</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white">Pending Recipes</TabsTrigger>
            <TabsTrigger value="recipes" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-white">All Recipes</TabsTrigger>
          </TabsList>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="card p-5 border-0 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-400 font-medium">Total Users</p>
                  <div className="p-3 icon-circle rounded-xl"><Users className="h-5 w-5 text-white" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{dbUsers.length}</p>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="card p-5 border-0 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-400 font-medium">Total Feedback</p>
                  <div className="p-3 icon-circle rounded-xl"><MessageSquare className="h-5 w-5 text-white" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{dbFeedbacks.length}</p>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="card p-5 border-0 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-400 font-medium">Approved Recipes</p>
                  <div className="p-3 icon-circle rounded-xl"><ChefHat className="h-5 w-5 text-white" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{approvedRecipes.length}</p>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="card p-5 border-0 hover:-translate-y-1 transition-transform">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-400 font-medium">Pending Approvals</p>
                  <div className="p-3 icon-circle rounded-xl"><Clock className="h-5 w-5 text-white" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{pendingRecipes.length}</p>
              </motion.div>
            </div>
            
            <div className="card p-5 border-0 mt-6">
              <h3 className="font-display font-semibold text-lg mb-4 text-white">System Architecture Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {architectureItems.map(({ icon: Icon, label, desc }, i) => (
                  <div key={label} className="flex items-start gap-4 rounded-lg bg-[#121827]/50 p-4 border border-border/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg icon-circle text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-white">{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative max-w-md mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 bg-[#121827]/50 border-border/20 text-white"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            <div className="card overflow-hidden border-0">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-[#121827]/80 text-slate-400 border-b border-border/20">
                  <tr>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredUsers.map(u => {
                    if (!u) return null;
                    return (
                    <tr key={u.email} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{u.name || "Unknown"}</td>
                      <td className="p-4">{u.email || "No Email"}</td>
                      <td className="p-4">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "Unknown"}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.email)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )})}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {(dbFeedbacks || []).map((fb, i) => {
                if (!fb) return null;
                const fbUser = dbUsers.find(u => u.email === fb.user_email);
                const userName = fbUser ? fbUser.name : "Unknown User";
                return (
                <motion.div key={fb.id || i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay: i*0.05}} className="card p-5 border-0 hover:border-cyan-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-medium">{userName} <span className="text-xs text-slate-500">({fb.user_email})</span></p>
                      <p className="text-xs text-slate-400">{fb.created_at ? new Date(fb.created_at).toLocaleString() : "Unknown Date"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="icon-circle px-3 py-1 rounded-full text-xs font-bold text-white">
                        {fb.rating || 0} / 5
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => fb.id && handleDeleteFeedback(fb.id)} className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
              )})}
              {dbFeedbacks.length === 0 && (
                <div className="col-span-full p-12 text-center card border-0">
                  <p className="text-slate-400">No feedback submitted yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PENDING RECIPES TAB */}
          <TabsContent value="pending" className="space-y-4">
            {pendingRecipes.length === 0 ? (
              <div className="card p-12 text-center border-0">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-400">No pending recipes. All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRecipes.map((recipe) => (
                  <motion.div key={recipe.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 card p-4 border-0">
                    {recipe.image ? (
                      <img src={recipe.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{recipe.title}</p>
                      <p className="text-xs text-slate-400">{recipe.region || "Unknown"} · {recipe.time || "N/A"}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRecipe(recipe)} className="text-white hover:text-white hover:bg-white/10">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => handleApprove(recipe.id)}>
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(recipe.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ALL RECIPES TAB */}
          <TabsContent value="recipes" className="space-y-4">
            <Input
              placeholder="Search approved recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm bg-[#121827]/50 border-border/20 text-white"
            />
            <div className="card overflow-hidden border-0">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-[#121827]/80 text-slate-400 border-b border-border/20">
                  <tr>
                    <th className="p-4 font-medium">Recipe</th>
                    <th className="p-4 font-medium hidden md:table-cell">Region</th>
                    <th className="p-4 font-medium hidden md:table-cell">Time</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredRecipes.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">No recipes found</td></tr>
                  ) : (
                    filteredRecipes.map((recipe) => (
                      <tr key={recipe.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {recipe.image ? (
                              <img src={recipe.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-[#121827] flex items-center justify-center">
                                <ChefHat className="h-4 w-4 text-slate-500" />
                              </div>
                            )}
                            <span className="font-medium text-white">{recipe.title}</span>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell">{recipe.region || "—"}</td>
                        <td className="p-4 hidden md:table-cell">{recipe.time || "—"}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white" onClick={() => setSelectedRecipe(recipe)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white" onClick={() => navigate(`/recipe/${recipe.id}`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleDeleteRecipe(recipe.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </SidebarLayout>
  );
};

export default AdminPanel;
