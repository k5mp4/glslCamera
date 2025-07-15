import type { EffectInfo } from "..";
import waveFragmentShader from '../wave.frag?raw'

export const waveEffect = waveFragmentShader;

export const waveEffectInfo : EffectInfo= {
  id: 'wave',
  name: '波',
  description: 'UV座標を波のように変形させるエフェクト',
  intensityRange: [0, 2],
  defaultIntensity: 1.0
};