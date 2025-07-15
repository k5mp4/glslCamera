import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

// 手の位置を正規化する関数
export const getHandPosition = (handResults: HandLandmarkerResult | null): { u: number; v: number } => {
  if (!handResults?.landmarks?.length) {
    return { u: 0.5, v: 0.5 }; // デフォルト値（中央）
  }

  // 手首の位置（ランドマーク0）を使用
  const wrist = handResults.landmarks[0][0];
  
  // 左右反転を考慮してu座標を調整
  const u = 1.0 - wrist.x; // 左右反転
  const v = wrist.y;       // そのまま
  
  return { 
    u: Math.max(0, Math.min(1, u)), 
    v: Math.max(0, Math.min(1, v)) 
  };
};

// 手の位置からエフェクト強度を計算する関数
export const calculateEffectIntensity = (handResults: HandLandmarkerResult | null, baseIntensity: number): number => {
  if (!handResults?.landmarks?.length) {
    return 0; // 手が検出されない場合はエフェクトなし
  }

  const handPos = getHandPosition(handResults);
  
  // 縦位置(v)でエフェクト強度を制御
  // v=0（上）→ 強度0, v=1（下）→ 最大強度
  const positionBasedIntensity = handPos.v * 2.0; // 0~2の範囲
  
  // ベース強度と組み合わせ
  return Math.min(positionBasedIntensity * baseIntensity, 2.0);
};