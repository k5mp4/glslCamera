import type { EffectInfo } from "..";
import distortionFragmentShader from '../distorsion.frag?raw'

export const distortionEffect = distortionFragmentShader;
export const distortionEffectInfo: EffectInfo = {
  id: 'distortion',
  name: '歪み',
  description: '中心から放射状に歪ませるエフェクト',
  intensityRange: [0, 2],
  defaultIntensity: 1.0
};