declare module "wav-encoder" {
  export function encode(input: {
    sampleRate: number
    getChannelData: () => Float32Array[]
  }): Promise<ArrayBuffer>
}
