import * as tf from '@tensorflow/tfjs';

let sharedModel: tf.Sequential | null = null;

export async function createSharedModel() {
  if (!sharedModel) {
    sharedModel = tf.sequential();
    sharedModel.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [15] }));
    sharedModel.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    sharedModel.add(tf.layers.dense({ units: 15, activation: 'sigmoid' }));
    sharedModel.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  }
  return sharedModel;
}

export function calculateDynamicReward(matches: number, totalPlayers: number): number {
  const baseReward = Math.pow(10, matches - 10);
  const competitionFactor = 1 + (totalPlayers / 100);
  return Math.round(baseReward * competitionFactor);
}

export async function predictNumbers(input: number[]): Promise<number[]> {
  if (!sharedModel) await createSharedModel();
  const inputTensor = tf.tensor2d([input]);
  const prediction = sharedModel!.predict(inputTensor) as tf.Tensor;
  const result = Array.from(await prediction.data());
  inputTensor.dispose();
  prediction.dispose();
  return result.map(n => Math.round(n * 24) + 1);
}

export function processCSV(text: string): number[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => 
    line.split(',').map(Number).filter((_, index) => index > 1 && index <= 16)
  );
}