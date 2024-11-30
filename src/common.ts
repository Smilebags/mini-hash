
export const labToRgb = (L, A, B) => {
  const g = L;
  const r = L + A;

  const b = L + B;
  return [r,g,b];
};

export const rgbToLab = (r, g, b) => {
  const L = g;
  const A = r - g;
  const B = b - g;
  return [L, A, B];
};



type FrequencyChannel = {
  x: number[]
  y: number[],
  dc: number,
};
export type FrequencyData = [FrequencyChannel, FrequencyChannel, FrequencyChannel];


export const remap = (low, high, outLow, outHigh) => x => {
  const inProgress = (x - low) / (high - low);
  const outRange = outHigh - outLow;
  return (inProgress * outRange) + outLow; 
};

const s = x => (1 / (1 + Math.E ** -x));

export const arrayFn = <T>(length: number, fn: (i: number) => T) => new Array(length).fill(null).map((_, i) => fn(i));

const construct1D = (dc: number, amplitudes: number[], length: number) => {
  return arrayFn(length, i => {
    const progress = i / length;
    let total = dc;
    for (let freq = 0; freq < amplitudes.length; freq++) {
      // freq + 1 here so that we start with the first non-DC term
      total += Math.cos(Math.PI * progress * (freq + 1)) * amplitudes[freq];
    }
    return total;
  });
}

const populateImageData = (frequency: FrequencyData, imageData: ImageData) => {
  // construct two 1d lists from freq data
  const w = imageData.width;
  const h = imageData.height;

  // channels named wrong
  const xL = construct1D(frequency[0].dc, frequency[0].x, w);
  const yL = construct1D(frequency[0].dc, frequency[0].y, h);
  const xA = construct1D(frequency[1].dc, frequency[1].x, w);
  const yA = construct1D(frequency[1].dc, frequency[1].y, h);
  const xB = construct1D(frequency[2].dc, frequency[2].x, w);
  const yB = construct1D(frequency[2].dc, frequency[2].y, h);

  for (let x = 0; x < imageData.width; x++) {
    for (let y = 0; y < imageData.height; y++) {
      const L = (xL[x] + yL[y]);
      const A = (xA[x] + yA[y]);
      const B = (xB[x] + yB[y]);
      const [r, g, b] = labToRgb(L, A, B).map(s);
      const i = (x + (w * y)) * 4;
      imageData.data[i] = r * 255;
      imageData.data[i + 1] = g * 255;
      imageData.data[i + 2] = b * 255;
      imageData.data[i + 3] = 255;
    }
  }
};

export const construct = (resolution: [number, number], freq: FrequencyData) => {
  const imageData = new ImageData(resolution[0], resolution[1]);
  populateImageData(freq, imageData);
  return imageData;
};

export const convertToLab = (imageData: ImageData) => {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const lab = rgbToLab(d[i], d[i+1], d[i+2]);
    imageData.data[i] = lab[0];
    imageData.data[i+1] = lab[1];
    imageData.data[i+2] = lab[2];
  }
};


export async function createImageDataFromURL(url: string, resolution: [number, number]): Promise<ImageData> {
  return new Promise<ImageData>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const width = resolution[0];
    const height = resolution[1];
    img.onload = () => {
      // Create an offscreen canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      // Draw the image on the canvas at the desired size
      ctx.drawImage(img, 0, 0, width, height);

      // Extract the ImageData
      const imageData = ctx.getImageData(0, 0, width, height);
      resolve(imageData);
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };

    img.src = url; // Set the image source to start loading
  });
}