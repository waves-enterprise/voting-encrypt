export type Point = [string, string]

export type Config = {
  q: string;
  hashLength: string;
  mainKey: Point;
  basePoint: Point;
}

export type RangeProof = [
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  string,
  string,
  string,
  string
]

export type RangeProofWithoutAB = [
  Point,
  Point,
  Point,
  Point,
  string,
  string,
  string,
  string
]

export type EncryptedBulletin = [RangeProof[], RangeProofWithoutAB]
