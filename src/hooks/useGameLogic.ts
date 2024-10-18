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

  const makePrediction = (inputData: number[]): number[] => {
    if (!trainedModel) return [];
    const inputTensor = tf.tensor2d([inputData]);
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const result = Array.from(predictions.dataSync());
    inputTensor.dispose();
    predictions.dispose();
    return result.map(num => Math.round(num * 25) + 1);
  };

  const gameLoop = useCallback(async (addLog: (message: string) => void) => {
    if (csvData.length === 0 || !trainedModel) {
      addLog("Não é possível continuar o jogo. Verifique se os dados CSV e o modelo foram carregados.");
      return;
    }

    addLog(`Banca sorteou os números para o concurso #${concursoNumber}: ${boardNumbers.join(', ')}`);

    const inputData = [...boardNumbers, concursoNumber];
    
    const updatedPlayers = players.map(player => {
      const playerPredictions = makePrediction(inputData);
      const matches = playerPredictions.filter(num => boardNumbers.includes(num)).length;
      const reward = calculateDynamicReward(matches);
      addLog(`Jogador ${player.id}: ${matches} acertos, recompensa ${reward}`);
      addLog(`Jogador ${player.id} apostou: ${playerPredictions.join(', ')}`);
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

  }, [players, boardNumbers, concursoNumber, generation, trainedModel]);

  const evolveGeneration = useCallback(() => {
    const newPlayers = players.map(() => {
      const clonedModel = createClonedModel(trainedModel);
      return {
        id: Math.random(),
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

  const createClonedModel = (model: tf.LayersModel | null): tf.LayersModel | null => {
    if (!model) return null;
    const clonedModel = tf.sequential();
    model.layers.forEach((layer) => {
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
    return clonedModel;
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