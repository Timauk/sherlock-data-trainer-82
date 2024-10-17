import * as tf from '@tensorflow/tfjs';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
  earlyStoppingPatience: number;
}

export function createModel(): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: 64, inputShape: [15, 1], returnSequences: true }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.lstm({ units: 32 }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });
  return model;
}

export async function trainModel(
  model: tf.LayersModel,
  data: number[][],
  config: TrainingConfig
): Promise<tf.History> {
  const xs = tf.tensor3d(data.map(row => row.slice(0, 15).map(n => [n])));
  const ys = tf.tensor2d(data.map(row => row.slice(15)));

  const earlyStoppingCallback = tf.callbacks.earlyStopping({
    monitor: 'val_loss',
    patience: config.earlyStoppingPatience
  });

  const history = await model.fit(xs, ys, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: config.validationSplit,
    callbacks: [earlyStoppingCallback]
  });

  xs.dispose();
  ys.dispose();

  return history;
}

export function normalizeData(data: number[][]): number[][] {
  const maxValue = 25; // Assuming the maximum number in the lottery is 25
  return data.map(row => row.map(n => n / maxValue));
}

export function denormalizeData(data: number[][]): number[][] {
  const maxValue = 25;
  return data.map(row => row.map(n => Math.round(n * maxValue)));
}

export function addDerivedFeatures(data: number[][]): number[][] {
  const frequencyMap = new Map<number, number>();
  data.forEach(row => {
    row.forEach(n => {
      frequencyMap.set(n, (frequencyMap.get(n) || 0) + 1);
    });
  });

  return data.map(row => {
    const frequencies = row.map(n => frequencyMap.get(n) || 0);
    return [...row, ...frequencies];
  });
}