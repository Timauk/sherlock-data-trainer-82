import { useState, useCallback, useEffect } from 'react';
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

  useEffect(() => {
    initializePlayers();
  }, [initializePlayers]);

  const makePrediction = (inputData: number[]): number[] => {
    if (!trainedModel) return [];
    const inputTensor = tf.tensor2d([inputData]);
    const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
    const result = Array.from(predictions.dataSync());
    inputTensor.dispose();
    predictions.dispose();
    return result.map(num => Math.round(num * 24) + 1);
  };

  const gameLoop = useCallback(() => {
    if (csvData.length === 0 || !trainedModel) return;

    const currentBoardNumbers = csvData[concursoNumber % csvData.length];
    setBoardNumbers(currentBoardNumbers);

    const updatedPlayers = players.map(player => {
      const playerPredictions = makePrediction([...currentBoardNumbers, concursoNumber]);
      const matches = playerPredictions.filter(num => currentBoardNumbers.includes(num)).length;
      const reward = calculateDynamicReward(matches);
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

    setConcursoNumber(prev => prev + 1);
  }, [players, csvData, concursoNumber, generation, trainedModel]);

  const evolveGeneration = useCallback(() => {
    setGeneration(prev => prev + 1);
    // Implement your evolution logic here if needed
  }, []);

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
    setIsInfiniteMode,
    initializePlayers,
    gameLoop,
    evolveGeneration
  };
};