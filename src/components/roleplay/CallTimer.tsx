interface CallTimerProps {
  seconds: number;
  isActive?: boolean;
}

export function CallTimer({ seconds, isActive = true }: CallTimerProps) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
      <span className={`font-mono text-lg ${isActive ? 'text-white' : 'text-sf-muted'}`}>
        {formattedTime}
      </span>
    </div>
  );
}
