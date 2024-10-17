import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import * as tf from '@tensorflow/tfjs';
import DataUploader from '@/components/DataUploader';
import GameControls from '@/components/GameControls';
import GameBoard from '@/components/GameBoard';
import LogDisplay from '@/components/LogDisplay';
import { Progress } from "@/components/ui/progress";
import { useGameLogic } from '@/hooks/useGameLogic';
import { processCSV, extractDateFromCSV } from '@/utils/csvUtils';
import { normalizeData, addDerivedFeatures } from '@/utils/aiModel';

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
      const data = processCSV(text);
      const dates = extractDateFromCSV(text);
      const normalizedData = normalizeData(data);
      const dataWithFeatures = addDerivedFeatures(normalizedData);
      setCsvData(dataWithFeatures);
      setCsvDates(dates);
      addLog("CSV carregado e processado com sucesso!");
      addLog(`Número de registros carregados: ${dataWithFeatures.length}`);
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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isPlaying) {
      intervalId = setInterval(() => {
        gameLoop(addLog);
        setProgress((prevProgress) => {
          const newProgress = (prevProgress + 1) % 100;
          if (newProgress === 99) {
            evolveGeneration();
          }
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, gameLoop, addLog, evolveGeneration]);

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

      <GameBoard
        boardNumbers={boardNumbers}
        players={players}
        evolutionData={evolutionData}
      />
      
      <LogDisplay logs={logs} />
    </div>
  );
};

export default PlayPage;