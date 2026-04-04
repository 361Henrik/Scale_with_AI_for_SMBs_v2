export type Message = {
  role: 'user' | 'model';
  text: string;
};

export type Mode = 'standard' | 'fast' | 'think';

export type Lang = 'no' | 'en';

export type BilingualText = {
  no: string;
  en: string;
};

export type AgentDefinition = {
  name: BilingualText;
  description: BilingualText;
  baseSkills: { no: string[]; en: string[] };
  mode: 'Autonom' | 'Ko-pilot' | 'Orkestrert';
};

export type SelectedAgent = {
  name: string;
  description: string;
  baseSkills: string[];
  mode: 'Autonom' | 'Ko-pilot' | 'Orkestrert';
};

export type Category = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  no: { title: string; desc: string };
  en: { title: string; desc: string };
};

export type SkillGroup = {
  no: string;
  en: string;
  skills: { no: string[]; en: string[] };
};
