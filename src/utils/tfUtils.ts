import * as tf from '@tensorflow/tfjs';

export const predictNumbers = (trainedModel: tf.LayersModel, inputData: number[]): tf.Tensor => {
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  inputTensor.dispose();
  return predictions;
};