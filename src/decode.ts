import { construct, createImageDataFromURL, FrequencyData } from "./common.js";

export const decode = async (freq: FrequencyData, resolution: [number, number], original: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const imageData = construct(resolution, freq);
  
  canvas.width = resolution[0];
  canvas.height = resolution[1];
  ctx.putImageData(imageData, 0, 0);
  document.body.appendChild(canvas);
  
  // Preview comparison
  const c2 = document.createElement('canvas');
  const ctx2 = c2.getContext('2d')!;
  const data = await createImageDataFromURL(original, resolution);
  c2.width = resolution[0];
  c2.height = resolution[1];
  ctx2.putImageData(data, 0, 0);
  document.body.appendChild(c2);
};