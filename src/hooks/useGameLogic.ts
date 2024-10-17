import { useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { normalizeData, denormalizeData, createModel } from '@/utils/aiModel';

export const useGameLogic = (csvData: number[][], trainedModel: tf.LayersModel | null) => {
  const [players, setPlayers] = useState<{ id: number; score: number; predictions: number[] }[]>([]);
  const [generation, setGeneration] = useState(1);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [boardNumbers, setBoardNumbers] = useState<number[]>([]);
  const [currentCsvIndex, setCurrentCsvIndex] = useState(0);
  const [concursoNumber, setConcursoNumber] = useState(0);

  const initializePlayers = useCallback(() => {
    const newPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      score: 0,
      predictions: [],
      model: createModel() // Cada jogador tem seu próprio modelo
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

    // Usar os números não normalizados diretamente do CSV para a banca
    const newBoardNumbers = csvData[currentCsvIndex].slice(2, 17);
    setBoardNumbers(newBoardNumbers);
    setConcursoNumber(csvData[currentCsvIndex][0]); // Assumindo que o número do concurso é o primeiro elemento
    addLog(`Banca sorteou os números para o concurso #${csvData[currentCsvIndex][0]}: ${newBoardNumbers.join(', ')}`);

    const inputData = [...csvData[currentCsvIndex].slice(2, 17), csvData[currentCsvIndex][1]]; // Incluindo a data do sorteio
    const normalizedInput = normalizeData([inputData])[0];
    const inputTensor = tf.tensor3d([[normalizedInput]]);
    
    const updatedPlayers = await Promise.all(players.map(async player => {
      // Aplicar parâmetros aleatórios ao modelo do jogador
      const randomizedModel = await randomizeModelParams(player.model);
      const predictions = await randomizedModel.predict(inputTensor) as tf.Tensor;
      const denormalizedPredictions = denormalizeData(await predictions.array() as number[][]);
      const playerPredictions = denormalizedPredictions[0].map(num => Math.round(num * 24) + 1); // Normalizar entre 1 e 25
      const matches = playerPredictions.filter(num => newBoardNumbers.includes(num)).length;
      const reward = calculateDynamicReward(matches);
      addLog(`Jogador ${player.id}: ${matches} acertos, recompensa ${reward}`);
      predictions.dispose();
      return {
        ...player,
        score: player.score + reward,
        predictions: playerPredictions
      };
    }));

    setPlayers(updatedPlayers);
    setCurrentCsvIndex(prevIndex => prevIndex + 1);

    // Atualizar o gráfico de evolução em tempo real para cada jogador
    setEvolutionData(prev => [
      ...prev,
      ...updatedPlayers.map(player => ({
        generation,
        playerId: player.id,
        score: player.score
      }))
    ]);

    inputTensor.dispose();
  }, [players, currentCsvIndex, csvData, trainedModel, generation]);

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

  const randomizeModelParams = async (model: tf.LayersModel): Promise<tf.LayersModel> => {
    const weights = model.getWeights();
    const randomizedWeights = weights.map(w => {
      const newValues = w.dataSync().map(() => Math.random() - 0.5);
      return tf.tensor(newValues, w.shape);
    });
    model.setWeights(randomizedWeights);
    return model;
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