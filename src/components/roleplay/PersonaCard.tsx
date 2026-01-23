import { Phone } from 'lucide-react';
import type { ProspectPersona } from '../../types/roleplay';

interface PersonaCardProps {
  persona: ProspectPersona;
  onSelect: (persona: ProspectPersona) => void;
}

const difficultyColors = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const difficultyLabels = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const personalityLabels = {
  friendly: 'Friendly & Open',
  busy: 'Busy Executive',
  skeptical: 'Skeptical',
  analytical: 'Data-Driven',
  gatekeeper: 'Gatekeeper',
};

export function PersonaCard({ persona, onSelect }: PersonaCardProps) {
  return (
    <div
      className="group relative bg-sf-card border border-sf-border rounded-xl p-5 hover:border-sf-green/50 transition-all duration-200 cursor-pointer"
      onClick={() => onSelect(persona)}
    >
      {/* Difficulty badge */}
      <div className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-medium rounded-full border ${difficultyColors[persona.difficulty]}`}>
        {difficultyLabels[persona.difficulty]}
      </div>

      {/* Avatar and name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{persona.avatar}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-lg truncate">{persona.name}</h3>
          <p className="text-sf-muted text-sm">{persona.title}</p>
          <p className="text-sf-green text-sm font-medium">{persona.company}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-sf-bg text-sf-muted text-xs rounded-lg">
          {persona.industry.replace('_', ' ')}
        </span>
        <span className="px-2 py-1 bg-sf-bg text-sf-muted text-xs rounded-lg">
          {personalityLabels[persona.personality]}
        </span>
      </div>

      {/* Pain points preview */}
      <p className="text-sf-muted text-sm line-clamp-2 mb-4">
        {persona.painPoints[0]}
      </p>

      {/* Call button - visible on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-sf-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-center pb-4">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-sf-green text-sf-bg font-semibold rounded-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(persona);
          }}
        >
          <Phone className="w-4 h-4" />
          Practice Call
        </button>
      </div>
    </div>
  );
}
