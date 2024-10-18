import * as tf from '@tensorflow/tfjs';

export const createClonedModel = (trainedModel: tf.LayersModel | null): tf.Sequential => {
  const clonedModel = tf.sequential();
  trainedModel?.layers.forEach((layer) => {
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

export const predictNumbers = (trainedModel: tf.LayersModel, inputData: number[]): tf.Tensor => {
  const inputTensor = tf.tensor2d([inputData]);
  const predictions = trainedModel.predict(inputTensor) as tf.Tensor;
  inputTensor.dispose();
  return predictions;
};