import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { normalizeData, denormalizeData, createModel } from '@/utils/aiModel';

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
  const [currentCsvIndex, setCurrentCsvIndex] = useState(0);
  const [concursoNumber, setConcursoNumber] = useState(0);

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

    if (currentCsvIndex >= csvData.length) {
      addLog("Todos os dados do CSV foram utilizados. Reiniciando o índice.");
      setCurrentCsvIndex(0);
    }

    const newBoardNumbers = csvData[currentCsvIndex].slice(2, 17);
    setBoardNumbers(newBoardNumbers);
    setConcursoNumber(csvData[currentCsvIndex][0]);
    addLog(`Banca sorteou os números para o concurso #${csvData[currentCsvIndex][0]}: ${newBoardNumbers.join(', ')}`);

    const inputData = [...csvData[currentCsvIndex].slice(2, 17), csvData[currentCsvIndex][1]];
    const normalizedInput = normalizeData([inputData])[0];
    const inputTensor = tf.tensor3d([normalizedInput], [1, 1, normalizedInput.length]);
    
    const predictions = await trainedModel.predict(inputTensor) as tf.Tensor;
    const denormalizedPredictions = denormalizeData(await predictions.array() as number[][]);
    
    const updatedPlayers = players.map(player => {
      const playerPredictions = denormalizedPredictions[0].map(num => Math.round(num));
      const matches = playerPredictions.filter(num => newBoardNumbers.includes(num)).length;
      const reward = calculateDynamicReward(matches);
      addLog(`Jogador ${player.id}: ${matches} acertos, recompensa ${reward}`);
      return {
        ...player,
        score: player.score + reward,
        predictions: playerPredictions
      };
    });

    setPlayers(updatedPlayers);
    setCurrentCsvIndex(prevIndex => prevIndex + 1);

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
  }, [players, currentCsvIndex, csvData, generation, trainedModel]);

  const evolveGeneration = useCallback(() => {
    const bestScore = Math.max(...players.map(p => p.score));
    const newPlayers = players.map(player => ({
      ...player,
      score: player.score === bestScore ? player.score : 0
    }));
    
    setPlayers(newPlayers);
    setGeneration(prev => prev + 1);
  }, [players]);

  const calculateDynamicReward = (matches: number): number => {
    return matches > 12 ? Math.pow(2, matches - 12) : -Math.pow(2, 12 - matches);
  };

  return {
    players,
    generation,
    evolutionData,
    boardNumbers,
    concursoNumber,
    setGeneration,
    setEvolutionData,
    setBoardNumbers,
    initializePlayers,
    gameLoop,
    evolveGeneration
  };
};