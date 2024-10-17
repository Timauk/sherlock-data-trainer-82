import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import DataUploader from '@/components/DataUploader';
import GameControls from '@/components/GameControls';
import { createModel, trainModel, normalizeData, denormalizeData, addDerivedFeatures, TrainingConfig } from '@/utils/aiModel';
import { processCSV, extractDateFromCSV } from '@/utils/csvUtils';
import PlayerList from '@/components/PlayerList';
import BoardDisplay from '@/components/BoardDisplay';
import EvolutionChart from '@/components/EvolutionChart';
import LogDisplay from '@/components/LogDisplay';

interface Player {
  id: number;
  score: number;
  predictions: number[];
}

const PlayPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    initializePlayers();
  }, []);

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, message]);
  };

  const loadCSV = async (file: File) => {
    const text = await file.text();
    const data = processCSV(text);
    const dates = extractDateFromCSV(text);
    const normalizedData = normalizeData(data);
    const dataWithFeatures = addDerivedFeatures(normalizedData);
    setCsvData(dataWithFeatures);
    setCsvDates(dates);
    addLog("CSV carregado e processado com sucesso!");
    addLog(`Número de registros carregados: ${dataWithFeatures.length}`);
  };

  const loadModel = async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
      setTrainedModel(model);
      addLog("Modelo treinado carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao carregar o modelo:", error);
      addLog("Erro ao carregar o modelo. Verifique o console para mais detalhes.");
    }
  };

  const initializePlayers = () => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: []
    }));
    setPlayers(newPlayers);
    addLog("Jogadores inicializados.");
  };

  const playGame = () => {
    setIsPlaying(true);
    addLog("Jogo iniciado.");
    gameLoop();
  };

  const pauseGame = () => {
    setIsPlaying(false);
    addLog("Jogo pausado.");
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGeneration(1);
    setProgress(0);
    setEvolutionData([]);
    setBoardNumbers([]);
    initializePlayers();
    setLogs([]);
    addLog("Jogo reiniciado.");
  };

  const gameLoop = async () => {
    if (!isPlaying || !trainedModel || csvData.length === 0) {
      addLog("Não é possível iniciar o jogo. Verifique se o modelo e os dados CSV foram carregados.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * csvData.length);
    const newBoardNumbers = denormalizeData([csvData[randomIndex]])[0];
    setBoardNumbers(newBoardNumbers);

    const normalizedInput = normalizeData([newBoardNumbers])[0];
    const inputTensor = tf.tensor2d([normalizedInput]);
    const predictions = await trainedModel.predict(inputTensor) as tf.Tensor;
    const denormalizedPredictions = denormalizeData(await predictions.array() as number[][]);

    const updatedPlayers = players.map(player => {
      const playerPredictions = denormalizedPredictions[0].map(Math.round);
      const matches = playerPredictions.filter(num => newBoardNumbers.includes(num)).length;
      const reward = calculateDynamicReward(matches, players.length);
      addLog(`Jogador ${player.id}: ${matches} acertos, recompensa ${reward}`);
      return {
        ...player,
        score: player.score + reward,
        predictions: playerPredictions
      };
    });

    setPlayers(updatedPlayers);
    setProgress((prevProgress) => {
      const newProgress = (prevProgress + 1) % 100;
      addLog(`Progresso: ${newProgress}%`);
      return newProgress;
    });

    if (progress === 99) {
      evolveGeneration();
    } else {
      setTimeout(gameLoop, 100);
    }

    inputTensor.dispose();
    predictions.dispose();
  };

  const evolveGeneration = () => {
    const bestScore = Math.max(...players.map(p => p.score));
    const newPlayers = players.map(player => ({
      ...player,
      score: player.score === bestScore ? player.score : 0
    }));
    
    setPlayers(newPlayers);
    setGeneration(prev => {
      const newGeneration = prev + 1;
      addLog(`Geração ${newGeneration} iniciada. Melhor pontuação da geração anterior: ${bestScore}`);
      return newGeneration;
    });
    setEvolutionData(prev => [...prev, { generation, score: bestScore }]);
  };

  const calculateDynamicReward = (matches: number, totalPlayers: number): number => {
    const baseReward = Math.pow(10, matches - 10);
    const competitionFactor = 1 + (totalPlayers / 100);
    return Math.round(baseReward * competitionFactor);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 neon-title">SHERLOK</h2>
      
      <DataUploader onCsvUpload={loadCSV} onModelUpload={loadModel} />

      <GameControls
        isPlaying={isPlaying}
        onPlay={playGame}
        onPause={pauseGame}
        onReset={resetGame}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Progresso da Geração {generation}</h3>
        <Progress value={progress} className="w-full" />
      </div>

      <BoardDisplay numbers={boardNumbers} />
      <PlayerList players={players} />
      <EvolutionChart data={evolutionData} />
      <LogDisplay logs={logs} />
    </div>
  );
};

export default PlayPage;