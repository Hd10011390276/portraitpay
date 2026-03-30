// Type declarations for @vladmandic/face-api (no official @types package)
declare module "@vladmandic/face-api" {
  export interface IDimensions {
    width: number;
    height: number;
  }

  export interface IFaceDetection {
    box: { x: number; y: number; width: number; height: number; area: number };
    score: number;
    probability: number;
  }

  export interface IFaceLandmarks68Net {
    predictAll: (input: CanvasImageSource | TFImage) => Promise<IFaceLandmark[]>;
  }

  export interface IFaceLandmark {
    shift: (by: { x: number; y: number }) => IFaceLandmark;
    positions: Array<{ x: number; y: number }>;
  }

  export interface IFaceDescriptor {
    descriptor: Float32Array;
  }

  export interface IFaceRecognitionNet {
    loadFromUri: (url: string) => Promise<void>;
  }

  export interface ITinyFaceDetectorOptions {
    inputSize?: number;
    scoreThreshold?: number;
  }

  export class TinyFaceDetectorOptions {
    constructor(options?: ITinyFaceDetectorOptions);
  }

  export class FaceLandmark68Net {
    constructor(options?: object);
    loadFromUri: (url: string) => Promise<void>;
  }

  export const nets: {
    tinyFaceDetector: { loadFromUri: (url: string) => Promise<void> };
    faceLandmark68Net: { loadFromUri: (url: string) => Promise<void> };
    faceRecognitionNet: IFaceRecognitionNet;
  };

  export function detectAllFaces(
    img: CanvasImageSource,
    options?: TinyFaceDetectorOptions
  ): Promise<IFaceDetection[]>;

  export function detectSingleFace(
    img: CanvasImageSource,
    options?: TinyFaceDetectorOptions
  ): {
    withFaceLandmarks: () => {
      withFaceDescriptor: () => Promise<IFaceDetection & IFaceLandmark & { descriptor: Float32Array }>;
    };
  };

  export function fetchImage(url: string): Promise<CanvasImageSource>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceapi: any;
  export default faceapi;
}
