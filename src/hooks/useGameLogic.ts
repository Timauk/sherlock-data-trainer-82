import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

interface Player {
  id: number;
  score: number;
  predictions: number[];
}

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [concursoNumber, setConcursoNumber] = useState(0);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: []
    }));
    setPlayers(newPlayers);
  }, []);

  const gameLoop = useCallback(async (addLog: (message: string) => void) => {
    if (csvData.length === 0 || !trainedModel) {
      addLog("Não é possível continuar o jogo. Verifique se os dados CSV e o modelo foram carregados.");
      return;
    }

    addLog(`Banca sorteou os números para o concurso #${concursoNumber}: ${boardNumbers.join(', ')}`);

    const inputData = [...boardNumbers, concursoNumber];
    const inputTensor = tf.tensor2d([inputData]);
    
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const denormalizedPredictions = await predictions.array() as number[][];
    
    const updatedPlayers = players.map(player => {
      const playerPredictions = denormalizedPredictions[0].map(num => Math.round(num * 25));
      const matches = playerPredictions.filter(num => boardNumbers.includes(num)).length;
      const reward = calculateDynamicReward(matches);
      addLog(`Jogador ${player.id}: ${matches} acertos, recompensa ${reward}`);
      return {
        ...player,
        score: player.score + reward,
        predictions: playerPredictions
      };
    });

    setPlayers(updatedPlayers);

    setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation,
        playerId: player.id,
        score: player.score
      }))
    ]);

    inputTensor.dispose();
    predictions.dispose();
  }, [players, boardNumbers, concursoNumber, generation, trainedModel]);

  const evolveGeneration = useCallback(() => {
    const bestPlayer = players.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    
    const newPlayers = players.map(player => {
      const clonedModel = tf.sequential();
      trainedModel?.layers.forEach((layer) => {
        if (layer instanceof tf.layers.Layer) {
          const config = layer.getConfig();
          let clonedLayer: tf.layers.Layer | null = null;
          
          switch (layer.getClassName()) {
            case 'Dense':
              clonedLayer = tf.layers.dense(config as tf.layers.DenseLayerArgs);
              break;
            case 'Conv2D':
              clonedLayer = tf.layers.conv2d(config as tf.layers.Conv2DLayerArgs);
              break;
            default:
              console.warn(`Unsupported layer type: ${layer.getClassName()}`);
          }

          if (clonedLayer) {
            clonedLayer.setWeights(layer.getWeights().map(w => {
              const randomFactor = 1 + (Math.random() * 0.2 - 0.1); // -10% to +10%
              return w.mul(tf.scalar(randomFactor));
            }));
            clonedModel.add(clonedLayer);
          }
        }
      });
      
      return {
        ...player,
        score: 0,
        predictions: []
      };
    });
    
    setPlayers(newPlayers);
    setGeneration(prev => prev + 1);
  }, [players, trainedModel]);

  const calculateDynamicReward = (matches: number): number => {
    return matches > 12 ? Math.pow(2, matches - 12) : -Math.pow(2, 12 - matches);
  };

  return {
    players,
    generation,
    evolutionData,
    boardNumbers,
    concursoNumber,
    isInfiniteMode,
    setGeneration,
    setEvolutionData,
    setBoardNumbers,
    setConcursoNumber,
    setIsInfiniteMode,
    initializePlayers,
    gameLoop,
    evolveGeneration
  };
};

Now, let's update the `PlayPage.tsx` file:

<lov-write file_path="src/pages/PlayPage.tsx">
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import DataUploader from '@/components/DataUploader';
import GameControls from '@/components/GameControls';
import GameBoard from '@/components/GameBoard';
import LogDisplay from '@/components/LogDisplay';
import { Progress } from "@/components/ui/progress";
import { useGameLogic } from '@/hooks/useGameLogic';
import { Button } from "@/components/ui/button";

const PlayPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState<number[][]>([]);
  const [csvDates, setCsvDates] = useState<Date[]>([]);
  const [trainedModel, setTrainedModel] = useState<tf.LayersModel | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { theme, setTheme } = useTheme();

  const {
    players,
    generation,
    evolutionData,
    boardNumbers,
    concursoNumber,
    isInfiniteMode,
    setGeneration,
    setEvolutionData,
    setBoardNumbers,
    setConcursoNumber,
    setIsInfiniteMode,
    initializePlayers,
    gameLoop,
    evolveGeneration
  } = useGameLogic(csvData, trainedModel);

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  const addLog = useCallback((message: string) => {
    setLogs(prevLogs => [...prevLogs, message]);
  }, []);

  const loadCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.trim().split('\n').slice(1); // Ignorar o cabeçalho
      const data = lines.map(line => {
        const values = line.split(',');
        return {
          concurso: parseInt(values[0], 10),
          data: new Date(values[1].split('/').reverse().join('-')),
          bolas: values.slice(2).map(Number)
        };
      });
      setCsvData(data.map(d => d.bolas));
      setCsvDates(data.map(d => d.data));
      setBoardNumbers(data[0].bolas);
      setConcursoNumber(data[0].concurso);
      addLog("CSV carregado e processado com sucesso!");
      addLog(`Número de registros carregados: ${data.length}`);
    } catch (error) {
      addLog(`Erro ao carregar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const loadModel = async (jsonFile: File, weightsFile: File) => {
    try {
      const model = await tf.loadLayersModel(tf.io.browserFiles([jsonFile, weightsFile]));
      setTrainedModel(model);
      addLog("Modelo carregado com sucesso!");
    } catch (error) {
      addLog(`Erro ao carregar o modelo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      console.error("Detalhes do erro:", error);
    }
  };

  const playGame = useCallback(() => {
    if (!trainedModel || csvData.length === 0) {
      addLog("Não é possível iniciar o jogo. Verifique se o modelo e os dados CSV foram carregados.");
      return;
    }
    setIsPlaying(true);
    addLog("Jogo iniciado.");
    gameLoop(addLog);
  }, [trainedModel, csvData, gameLoop, addLog]);

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

  const toggleInfiniteMode = () => {
    setIsInfiniteMode(!isInfiniteMode);
    addLog(`Modo infinito ${!isInfiniteMode ? 'ativado' : 'desativado'}.`);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying) {
      intervalId = setInterval(() => {
        const currentIndex = Math.floor(progress / 100 * csvData.length);
        if (currentIndex < csvData.length) {
          setBoardNumbers(csvData[currentIndex]);
          setConcursoNumber(currentIndex + 1);
          setProgress((prevProgress) => {
            const newProgress = prevProgress + (100 / csvData.length);
            if (newProgress >= 100) {
              evolveGeneration();
              return isInfiniteMode ? 0 : 100;
            }
            return newProgress;
          });
          gameLoop(addLog);
        } else if (!isInfiniteMode) {
          setIsPlaying(false);
          addLog("Todos os concursos foram processados.");
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, csvData, progress, gameLoop, addLog, evolveGeneration, setBoardNumbers, setConcursoNumber, isInfiniteMode]);

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

      <Button onClick={toggleInfiniteMode} className="mt-2">
        {isInfiniteMode ? 'Desativar' : 'Ativar'} Modo Infinito
      </Button>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Progresso da Geração {generation}</h3>
        <Progress value={progress} className="w-full" />
      </div>

      <GameBoard
        boardNumbers={boardNumbers}
        concursoNumber={concursoNumber}
        players={players}
        evolutionData={evolutionData}
      />
      
      <LogDisplay logs={logs} />
    </div>
  );
};

export default PlayPage;