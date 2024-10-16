import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import * as tf from '@tensorflow/tfjs';
import { Upload, Play, Pause, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const PlayPage: React.FC = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [generation, setGeneration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);

  const loadModel = async (files: FileList | null) => {
    if (files && files[0]) {
      try {
        const jsonFile = files[0];
        const weightsFile = files[1];
        
        const jsonContent = await jsonFile.text();
        JSON.parse(jsonContent);
        
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
    setEvolutionData([]);
    initializePlayers();
  };

  const applyRewardAndPunishment = (player: any, acertos: number) => {
    let reward = 0;
    if (acertos === 13) reward = 50;
    if (acertos === 14) reward = 100;
    if (acertos === 15) reward = 200;
    return { ...player, score: player.score + reward };
  };

  const evolveGeneration = () => {
    // Simples evolução: copiar o melhor jogador e aplicar mutações aos outros
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const bestPlayer = sortedPlayers[0];
    
    const newPlayers = [
      bestPlayer,
      ...Array.from({ length: 9 }, () => ({
        ...bestPlayer,
        weights: bestPlayer.weights.map(w => w + (Math.random() - 0.5) * 0.1)
      }))
    ];
    
    setPlayers(newPlayers);
    setGeneration(prev => prev + 1);
    setEvolutionData(prev => [...prev, { generation: generation, score: bestPlayer.score }]);
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

      <div className="grid grid-cols-5 gap-4 mb-8">
        {players.map(player => (
          <div key={player.id} className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold">Jogador {player.id}</h4>
            <p>Pontuação: {player.score}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Evolução das Gerações</h3>
        <LineChart width={600} height={300} data={evolutionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="score" stroke="#8884d8" />
        </LineChart>
      </div>
    </div>
  );
};

export default PlayPage;