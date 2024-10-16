import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Play, Pause, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { createSharedModel, calculateDynamicReward, predictNumbers, processCSV } from '@/utils/gameLogic';

interface Player {
  id: number;
  score: number;
}

const PlayPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [csvData, setCsvData] = useState<number[][]>([]);

  useEffect(() => {
    initializePlayers();
    createSharedModel();
  }, []);

  const loadCSV = async (file: File | null) => {
    if (file) {
      const text = await file.text();
      const data = processCSV(text);
      setCsvData(data);
      alert("CSV carregado com sucesso!");
    }
  };

  const initializePlayers = () => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0
    }));
    setPlayers(newPlayers);
  };

  const playGame = () => {
    setIsPlaying(true);
    gameLoop();
  };

  const pauseGame = () => {
    setIsPlaying(false);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGeneration(1);
    setProgress(0);
    setEvolutionData([]);
    setBoardNumbers([]);
    initializePlayers();
  };

  const gameLoop = async () => {
    if (!isPlaying) return;

    const newBoardNumbers = csvData.length > 0 
      ? csvData[Math.floor(Math.random() * csvData.length)]
      : Array.from({ length: 15 }, () => Math.floor(Math.random() * 25) + 1);
    setBoardNumbers(newBoardNumbers);

    const results = await Promise.all(players.map(player => playRound(newBoardNumbers)));
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      score: player.score + results[index]
    }));

    setPlayers(updatedPlayers);
    setProgress((prevProgress) => (prevProgress + 1) % 100);

    if (progress === 99) {
      evolveGeneration();
    } else {
      setTimeout(gameLoop, 100);
    }
  };

  const playRound = async (boardNumbers: number[]): Promise<number> => {
    const playerNumbers = await predictNumbers(boardNumbers);
    const matches = playerNumbers.filter(num => boardNumbers.includes(num)).length;
    return calculateDynamicReward(matches, players.length);
  };

  const evolveGeneration = () => {
    const bestScore = Math.max(...players.map(p => p.score));
    const newPlayers = players.map(player => ({
      ...player,
      score: player.score === bestScore ? player.score : 0
    }));
    
    setPlayers(newPlayers);
    setGeneration(prev => prev + 1);
    setEvolutionData(prev => [...prev, { generation, score: bestScore }]);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Jogar</h2>
      
      <div className="mb-4 space-y-2">
        <div>
          <label htmlFor="csvInput" className="block mb-2">Carregar CSV de Jogos:</label>
          <input
            type="file"
            id="csvInput"
            accept=".csv"
            onChange={(e) => loadCSV(e.target.files ? e.target.files[0] : null)}
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

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Quadro (Banca)</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          {boardNumbers.map((number, index) => (
            <span key={index} className="inline-block bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">
              {number}
            </span>
          ))}
        </div>
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