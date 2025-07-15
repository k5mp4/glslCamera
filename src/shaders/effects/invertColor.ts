import type { EffectInfo } from "..";
import invertColorFragmentShader from '../colorChange.frag?raw'

export const invertColorEffect = invertColorFragmentShader;
export const invertColorEffectInfo: EffectInfo = {
  id: 'invertColor',
  name: 'カラー反転(スパイラル)',
  description: '螺旋模様で画面色を反転するエフェクト',
  intensityRange: [0, 2],
  defaultIntensity: 0.5
};