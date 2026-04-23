import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic, ArrowRight, Sparkles, ChefHat, FileText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="section-card group hover:border-primary/50 transition-all duration-300"
  >
    <div className="h-12 w-12 rounded-2xl icon-circle flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-xl font-bold font-display mb-3 text-foreground">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">
      {description}
    </p>
  </motion.div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden selection:bg-primary/30">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[50%] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-500/10 blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-white">
              Spoken<span className="text-primary">Spoons</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">How it works</a>
            <Link to="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button className="gradient-btn font-semibold px-6">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-24 pb-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary mb-8 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Meet Ira, Your AI Voice Chef</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]"
          >
            Cook With Your Voice, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-accent">
              Not Your Screen
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Just tell Ira what ingredients you have, and instantly get beautifully structured recipes in any Indian language. Say goodbye to messy screens while cooking.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/login">
              <Button className="gradient-btn h-14 px-8 text-lg font-semibold rounded-2xl w-full sm:w-auto flex items-center gap-2 group">
                <Mic className="h-5 w-5 group-hover:animate-pulse" />
                Start Cooking Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Abstract App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 rounded-3xl" />
            <div className="relative rounded-3xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl overflow-hidden p-2">
              <div className="rounded-2xl border border-white/5 bg-background/50 aspect-[16/9] flex items-center justify-center relative overflow-hidden">
                {/* Mock UI Elements */}
                <div className="absolute top-6 left-6 right-6 flex gap-4 opacity-50">
                  <div className="h-4 w-24 bg-white/10 rounded-full" />
                  <div className="h-4 w-32 bg-white/10 rounded-full" />
                  <div className="h-4 w-16 bg-white/10 rounded-full" />
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse-recording" />
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg relative z-10">
                      <Mic className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="h-6 w-48 bg-gradient-to-r from-primary/50 to-transparent rounded-full mb-3" />
                  <div className="h-4 w-32 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 bg-secondary/30 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-6">Everything you need to be a Master Chef</h2>
            <p className="text-muted-foreground text-lg">Powerful AI features designed to make your cooking experience seamless, hands-free, and magical.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              delay={0.1}
              icon={Mic}
              title="Conversational Voice AI"
              description="Talk naturally to Ira. Say 'Make me Biryani' or 'I have paneer and tomatoes'. She understands context and creates perfect recipes instantly."
            />
            <FeatureCard 
              delay={0.2}
              icon={Globe}
              title="11+ Indian Languages"
              description="Cooking is local. Speak and listen to recipes in Hindi, Tamil, Telugu, Malayalam, Marathi, Bengali, Urdu, and more."
            />
            <FeatureCard 
              delay={0.3}
              icon={FileText}
              title="Beautiful PDF Exports"
              description="Instantly export your generated recipes into gorgeous, printable PDF cards to share with friends or keep in your physical cookbook."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-white">SpokenSpoons</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} SpokenSpoons AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
