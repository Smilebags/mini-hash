import { arrayFn, construct, createImageDataFromURL, FrequencyData, remap } from "./common.js";

// TODO: Make error more sensitive to hue differences
const computeError = (a: ImageData, b: ImageData) => {
  let error = 0;
  const ad = a.data;
  const bd = b.data;
  for (let i = 0; i < a.data.length; i++) {
    error += (bd[i] - ad[i]) ** 2;
  }
  return error;
};


const computeErrorDifference = (original: ImageData, a: ImageData, b: ImageData) => {
  const aError = computeError(original, a);
  const bError = computeError(original, b);
  return bError - aError;
};

export const encode = async (
  url: string,
  resolution: [number, number],
  coefficients: [number, number],
  optimisationIterations = 100,
) => {
  // TODO: Determine whether optimising towards a blurred image helps
  const imageDataOriginal = await createImageDataFromURL(url, resolution);

  let freq: FrequencyData = [
    {
      x: arrayFn(coefficients[0], () => 0),
      y: arrayFn(coefficients[1], () => 0),
      dc: 0,
    },
    {
      x: arrayFn(coefficients[0], () => 0),
      y: arrayFn(coefficients[1], () => 0),
      dc: 0,
    },
    {
      x: arrayFn(coefficients[0], () => 0),
      y: arrayFn(coefficients[1], () => 0),
      dc: 0,
    },
  ];

  let currentBestResult = construct(resolution, freq);

  // if the resulting image from newFreq is better, update the global state freq and currentBestResult
  const choose = (newFreq: FrequencyData) => {
    const b = construct(resolution, newFreq);
    const preference = computeErrorDifference(imageDataOriginal, currentBestResult, b);
    if (preference < 0) {
      freq = newFreq;
      currentBestResult = b;
    }
  };

  const optimiseDc = (temperature, channelIndex) => {
    const newFreq: FrequencyData = [freq[0], freq[1], freq[2]];
    newFreq[channelIndex] = { ...freq[channelIndex], dc: freq[channelIndex].dc + temperature };
    choose(newFreq);
  };

  const optimiseXs = (temperature, channelIndex) => {
    // for each element i in the X frequencies
    for (let i = 0; i < freq[channelIndex].x.length; i++) {
      const copy = [...freq[channelIndex].x];
      copy[i] = copy[i] + temperature;
      const newFreq: FrequencyData = [freq[0], freq[1], freq[2]];
      newFreq[channelIndex] = { ...freq[channelIndex], x: copy };
      choose(newFreq);
    }
  }
  const optimiseYs = (temperature, channelIndex) => {
    // for each element i in the Y frequencies
    for (let i = 0; i < freq[channelIndex].y.length; i++) {
      const copy = [...freq[channelIndex].y];
      copy[i] = copy[i] + temperature;
      const newFreq: FrequencyData = [freq[0], freq[1], freq[2]];
      newFreq[channelIndex] = { ...freq[channelIndex], y: copy };
      choose(newFreq);
    }
  }



  // TODO: Do something less dumb
  for (let epoch = 0; epoch < optimisationIterations; epoch++) {
    const temperature = remap(0, optimisationIterations - 1, 1, 0.05)(epoch) ** 3;
    for (let channel = 0; channel < 3; channel++) {
      optimiseDc(temperature, channel);
      optimiseXs(temperature, channel);
      optimiseYs(temperature, channel);
      optimiseDc(-temperature, channel);
      optimiseXs(-temperature, channel);
      optimiseYs(-temperature, channel);
    }
  }

  return freq;
};
