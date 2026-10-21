import { ScriptTemplate, VoiceProfile, ViralTone } from '../types';

export const PRESET_VOICES: VoiceProfile[] = [
  {
    id: 'Kore',
    name: 'Kore',
    tagline: 'Warm, Organic & Conversational Friend',
    gender: 'Female',
    description: 'Ultra-smooth, natural conversational voice with genuine emotional warmth, subtle breath inflection, and zero robotic monotone.',
    bestFor: ['Storytime Shorts', 'Lifestyle Vlogs', 'Relatable Advice', 'Podcast Co-Host'],
    avatarColor: 'from-rose-500 to-indigo-500',
    accent: 'Casual Natural',
    samplePhrase: 'Honestly, I was so skeptical at first, but this completely changed my daily routine.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    tagline: 'Upbeat, Articulate & Casual Creator',
    gender: 'Male',
    description: 'Fluid, human-driven speech with clean articulation, natural micro-pauses, and upbeat modern creator enthusiasm.',
    bestFor: ['Tech & Gadgets', 'Viral Hooks', 'Product Reviews', 'Top 5 Lists'],
    avatarColor: 'from-emerald-500 to-teal-600',
    accent: 'Modern Conversational',
    samplePhrase: 'Wait until you see how simple this trick actually is when you try it in real life.',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    tagline: 'Silky, Intimate & Soothing Storyteller',
    gender: 'Female',
    description: 'Soft, velvety tone with calm pacing and intimate acoustic warmth. Perfectly tuned for relaxed storytelling and bedtime listening.',
    bestFor: ['Soothing Vlogs', 'Mindfulness & ASMR', 'Bedtime Stories', 'Audio Essays'],
    avatarColor: 'from-purple-500 to-pink-600',
    accent: 'Gentle Expressive',
    samplePhrase: 'Take a slow, deep breath and listen closely to what happened right after midnight...',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    tagline: 'Deep, Resonant & Documentary Narrator',
    gender: 'Male',
    description: 'Smooth baritone with rich vocal resonance, grounded presence, and a natural non-synthetic flow.',
    bestFor: ['Documentary & History', 'Science Explainers', 'Nature & Tech', 'Lore Recaps'],
    avatarColor: 'from-indigo-600 to-blue-700',
    accent: 'Smooth Resonant',
    samplePhrase: 'Surrounding us every day are hidden forces that most people never pause to notice.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    tagline: 'Grounded, Authoritative & Executive Reader',
    gender: 'Male',
    description: 'Steady, trustworthy voice with human pacing and reassuring tone. Ideal for deep breakdowns, financial insights, and commentary.',
    bestFor: ['Finance & Business', 'Industry News', 'Deep Commentaries', 'Executive Briefings'],
    avatarColor: 'from-cyan-600 to-slate-700',
    accent: 'Grounded Professional',
    samplePhrase: 'Here is the exact framework leading teams are using behind closed doors.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    tagline: 'Textured, Dramatic & Movie Trailer',
    gender: 'Male',
    description: 'Textured vocal gravity with natural dramatic pauses and tension. Ideal for high-stakes storytelling and cinematic hooks.',
    bestFor: ['Cinematic Trailers', 'Gaming Highlights', 'True Crime Hooks', 'Epic Teasers'],
    avatarColor: 'from-rose-600 to-red-800',
    accent: 'Dynamic Cinematic',
    samplePhrase: 'When the pressure reached its peak, only one final decision remained.',
  },
];

export const VIRAL_TONES: { id: ViralTone; label: string; description: string; iconName: string }[] = [
  { id: 'tiktok_viral', label: 'TikTok Hook', description: 'Fast, punchy, curiosity-driven pacing with strong initial retention.', iconName: 'Flame' },
  { id: 'storyteller', label: 'Storytime Twist', description: 'Suspenseful, relatable storytelling cadence with emotional beats.', iconName: 'BookOpen' },
  { id: 'tech_reviewer', label: 'Tech & Unboxing', description: 'Enthusiastic, clear, and high-tempo feature breakdown.', iconName: 'Smartphone' },
  { id: 'relatable_comedy', label: 'Relatable Humor', description: 'Conversational, witty, and slightly sarcastic tone.', iconName: 'Smile' },
  { id: 'dramatic_trailer', label: 'Cinematic Movie', description: 'Heavy pauses, dramatic tension, and epic trailer delivery.', iconName: 'Film' },
  { id: 'asmr_calm', label: 'Calm & Relaxing', description: 'Soft, intimate, and soothing rhythm for ASMR or meditation.', iconName: 'Wind' },
  { id: 'hype_motivational', label: 'Hype Motivational', description: 'High-power, inspirational energy with strong emphasis.', iconName: 'Zap' },
];

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'mind_blowing_tech',
    title: 'Mind-Blowing Tech Secret',
    category: 'Tech & Productivity',
    description: 'Hook viewers with a secret feature 99% of people do not know about.',
    suggestedVoice: 'Puck',
    suggestedTone: 'tiktok_viral',
    script: `Stop doing this manually! Here is a hidden feature on your phone that literally saves me 2 hours every single day. 

First, open your settings, scroll down to accessibility, and tap back-tap. Set double tap to screenshot or search.

Most people have no idea this exists, but once you try it, you will never go back. Try it out and let me know in the comments if this worked for you!`,
  },
  {
    id: 'relatable_daily_struggle',
    title: 'Relatable Daily Struggle',
    category: 'Comedy & Lifestyle',
    description: 'A funny, highly relatable observation that drives comments and shares.',
    suggestedVoice: 'Kore',
    suggestedTone: 'relatable_comedy',
    script: `Is it just me, or does everyone calculate how many hours of sleep they will get if they go to sleep *right now*?

You lay in bed at 1:00 AM, do the math... "Okay, if I fall asleep in exactly 4 minutes, I get 6 hours and 12 minutes." Then you check your phone again, and suddenly it's 3:30 AM!

Tell me I am not the only person who does this every single night.`,
  },
  {
    id: 'plot_twist_storytime',
    title: 'Unbelievable Storytime',
    category: 'Storytelling',
    description: 'Curiosity hook with a cliffhanger beat to maximize viewer retention.',
    suggestedVoice: 'Zephyr',
    suggestedTone: 'storyteller',
    script: `I bought an old leather jacket at a thrift store for five dollars. But when I got home and unzipped the inner pocket, I found a tiny key wrapped in vintage newspaper.

The paper was dated October 14th, 1984. Written in red ink was an address just three blocks away from my house.

Part two is coming up, but what would you do if you found this key?`,
  },
  {
    id: 'cinematic_trailer_hype',
    title: 'Epic Gaming & Cinematic Trailer',
    category: 'Entertainment',
    description: 'High stakes, dramatic movie-trailer voiceover with epic pacing.',
    suggestedVoice: 'Fenrir',
    suggestedTone: 'dramatic_trailer',
    script: `For years, they told us it was impossible. They said the final boss could not be defeated without taking damage.

They were wrong. 

After 400 attempts, 12 sleepless nights, and one broken controller... history was finally made. Watch this closely.`,
  },
];
