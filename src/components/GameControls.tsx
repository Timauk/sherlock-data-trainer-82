import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Moon } from 'lucide-react';

interface GameControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onThemeToggle
}) => {
  return (
    <div className="flex space-x-2 mb-4">
      <Button onClick={onPlay} disabled={isPlaying}>
        <Play className="mr-2 h-4 w-4" /> Iniciar
      </Button>
      <Button onClick={onPause} disabled={!isPlaying}>
        <Pause className="mr-2 h-4 w-4" /> Pausar
      </Button>
      <Button onClick={onReset}>
        <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
      </Button>
      <Button onClick={onThemeToggle}>
        <Moon className="mr-2 h-4 w-4" /> Alternar Tema
      </Button>
    </div>
  );
};

export default GameControls;