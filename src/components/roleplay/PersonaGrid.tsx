import type { ProspectPersona } from '../../types/roleplay';
import { PERSONAS } from '../../constants/personas';
import { PersonaCard } from './PersonaCard';

interface PersonaGridProps {
  onSelectPersona: (persona: ProspectPersona) => void;
}

export function PersonaGrid({ onSelectPersona }: PersonaGridProps) {
  // Group personas by difficulty for better organization
  const easyPersonas = PERSONAS.filter(p => p.difficulty === 'easy');
  const mediumPersonas = PERSONAS.filter(p => p.difficulty === 'medium');
  const hardPersonas = PERSONAS.filter(p => p.difficulty === 'hard');

  return (
    <div className="space-y-8">
      {/* Easy */}
      {easyPersonas.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-sf-muted mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Warm Up
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {easyPersonas.map(persona => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onSelect={onSelectPersona}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium */}
      {mediumPersonas.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-sf-muted mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            Challenge Yourself
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediumPersonas.map(persona => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onSelect={onSelectPersona}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hard */}
      {hardPersonas.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-sf-muted mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
            Expert Mode
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hardPersonas.map(persona => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onSelect={onSelectPersona}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
