import { useState } from "react";
import { motion } from "framer-motion";
import { User, Globe, Camera, Save } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getUser } from "@/lib/auth";

const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi (हिन्दी)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "bn-IN", label: "Bengali (বাংলা)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
];

interface ProfileData {
  name: string;
  email: string;
  avatar: string | null;
  language: string;
}

const ProfilePage = () => {
  const user = getUser();
  const [profile, setProfile] = useState<ProfileData>(() => {
    const stored = localStorage.getItem("recipeai_profile");
    if (stored) return JSON.parse(stored);
    return {
      name: user?.name || "",
      email: user?.email || "",
      avatar: null,
      language: "en-IN",
    };
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem("recipeai_profile", JSON.stringify(profile));
    // Also update auth user name
    if (user) {
      user.name = profile.name;
      localStorage.setItem("recipe_ai_user", JSON.stringify(user));
    }
    toast.success("Profile saved!");
  };

  return (
    <SidebarLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account details and preferences</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card space-y-6"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
                  <User className="h-10 w-10 text-primary" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Click camera icon to upload avatar</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="bg-background border-border"
              placeholder="Your name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={profile.email}
              disabled
              className="bg-secondary/50 border-border text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Preferred Voice Language
            </label>
            <Select value={profile.language} onValueChange={(v) => setProfile((p) => ({ ...p, language: v }))}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This will be the default language for voice recipe capture</p>
          </div>

          {/* Save */}
          <Button onClick={handleSave} className="w-full glow-orange">
            <Save className="h-4 w-4 mr-2" /> Save Profile
          </Button>
        </motion.div>

        {/* Account Info */}
        <div className="section-card">
          <h3 className="font-display font-semibold mb-3">Account Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user?.role || "user"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfilePage;
