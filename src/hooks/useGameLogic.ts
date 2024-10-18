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
    
    const predictions = await trainedModel.predict(inputTensor) as tf.Tensor;
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
              clonedLayer = tf.layers.dense(config);
              break;
            case 'Conv2D':
              clonedLayer = tf.layers.conv2d(config);
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