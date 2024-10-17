import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { normalizeData, denormalizeData } from '@/utils/aiModel';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const [players, setPlayers] = useState<{ id: number; score: number; predictions: number[] }[]>([]);
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [currentCsvIndex, setCurrentCsvIndex] = useState(0);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: []
    }));
    setPlayers(newPlayers);
  }, []);

  const gameLoop = useCallback(async (addLog: (message: string) => void) => {
    if (!trainedModel || csvData.length === 0) {
      addLog("Não é possível continuar o jogo. Verifique se o modelo e os dados CSV foram carregados.");
      return;
    }

    if (currentCsvIndex >= csvData.length) {
      addLog("Todos os dados do CSV foram utilizados. Reiniciando o índice.");
      setCurrentCsvIndex(0);
    }

    const newBoardNumbers = csvData[currentCsvIndex];
    setBoardNumbers(newBoardNumbers);
    addLog(`Banca sorteou os números: ${newBoardNumbers.join(', ')}`);

    const inputTensor = tf.tensor2d([newBoardNumbers]);
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
    setCurrentCsvIndex(prevIndex => prevIndex + 1);

    inputTensor.dispose();
    predictions.dispose();
  }, [players, currentCsvIndex, csvData, trainedModel]);

  const evolveGeneration = useCallback(() => {
    const bestScore = Math.max(...players.map(p => p.score));
    const newPlayers = players.map(player => ({
      ...player,
      score: player.score === bestScore ? player.score : 0
    }));
    
    setPlayers(newPlayers);
    setGeneration(prev => {
      const newGeneration = prev + 1;
      return newGeneration;
    });
    setEvolutionData(prev => [...prev, { generation, score: bestScore }]);
  }, [players, generation]);

  const calculateDynamicReward = (matches: number, totalPlayers: number): number => {
    const baseReward = Math.pow(10, matches - 10);
    const competitionFactor = 1 + (totalPlayers / 100);
    return Math.round(baseReward * competitionFactor);
  };

  return {
    players,
    generation,
    evolutionData,
    boardNumbers,
    setGeneration,
    setEvolutionData,
    setBoardNumbers,
    initializePlayers,
    gameLoop,
    evolveGeneration
  };
};