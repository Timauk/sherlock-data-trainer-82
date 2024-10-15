import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as tf from '@tensorflow/tfjs';
import { Upload, Play, Pause, RotateCcw } from 'lucide-react';

const PlayPage: React.FC = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [generation, setGeneration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadModel = async (files: FileList | null) => {
    if (files && files[0]) {
      try {
        const jsonFile = files[0];
        const weightsFile = files[1];
        
        // Read the JSON file content
        const jsonContent = await jsonFile.text();
        
        // Parse the JSON to ensure it's valid
        JSON.parse(jsonContent);
        
        // If parsing succeeds, proceed with loading the model
        const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
        setModel(model);
        alert("Modelo carregado com sucesso!");
      } catch (error) {
        console.error("Erro ao carregar o modelo:", error);
        alert(`Erro ao carregar o modelo: ${error.message}`);
      }
    }
  };

  const loadRealGames = (file: File | null) => {
    if (file) {
      // Implementar lógica para carregar jogos reais do CSV
      alert("Jogos reais carregados!");
    }
  };

  const initializePlayers = () => {
    // Inicializar 10 jogadores com pesos aleatórios
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      weights: tf.randomNormal([25]).arraySync(),
      score: 0
    }));
    setPlayers(newPlayers);
  };

  const playGame = () => {
    setIsPlaying(true);
    // Implementar lógica de jogo aqui
  };

  const pauseGame = () => {
    setIsPlaying(false);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGeneration(1);
    setProgress(0);
    initializePlayers();
  };

  useEffect(() => {
    initializePlayers();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Jogar</h2>
      
      <div className="mb-4 space-y-2">
        <div>
          <label htmlFor="modelInput" className="block mb-2">Carregar Modelo (.json e .bin):</label>
          <input
            type="file"
            id="modelInput"
            accept=".json,.bin"
            multiple
            onChange={(e) => loadModel(e.target.files)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <label htmlFor="gamesInput" className="block mb-2">Carregar Jogos Reais (CSV):</label>
          <input
            type="file"
            id="gamesInput"
            accept=".csv"
            onChange={(e) => loadRealGames(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <Button onClick={playGame} disabled={isPlaying}>
          <Play className="mr-2 h-4 w-4" /> Iniciar
        </Button>
        <Button onClick={pauseGame} disabled={!isPlaying}>
          <Pause className="mr-2 h-4 w-4" /> Pausar
        </Button>
        <Button onClick={resetGame}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
        </Button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Progresso da Geração {generation}</h3>
        <Progress value={progress} className="w-full" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {players.map(player => (
          <div key={player.id} className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold">Jogador {player.id}</h4>
            <p>Pontuação: {player.score}</p>
          </div>
        ))}
      </div>

      {/* Aqui você pode adicionar gráficos para acompanhar o desempenho das gerações */}
    </div>
  );
};

export default PlayPage;