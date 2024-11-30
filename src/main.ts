import { encode } from "./encode.js";
import { decode } from "./decode.js";

const main = async () => {
  const encRes = [30, 20] as [number, number];
  const coefficientLengths = [4, 3] as [number, number];
  const decRes = [400, 250] as [number, number];
  const urls = [
    "/images/monkey.png",
    "/images/iceland.jpg",
    "/images/face.jpg",
    "/images/sky.jpg",
  ];
  for (const url of urls) {
    decode(
      await encode(url, encRes, coefficientLengths),
      decRes,
      url,
    ); 
  }
};

main();