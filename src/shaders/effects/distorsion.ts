// src/shaders/effects/distortion.ts
export const distortionEffect = `
  // 歪みエフェクト
  vec2 center = vec2(0.5, 0.5);
  vec2 offset = uv - center;
  float distance = length(offset);
  
  // 放射状の歪み
  float distortionStrength = sin(distance * 15.0 + uTime * 3.0) * 0.1 * uIntensity;
  uv = center + offset * (1.0 + distortionStrength);
  
  color = texture2D(uTexture, uv);
`;

export const distortionEffectInfo = {
  id: 'distortion',
  name: '歪み',
  description: '中心から放射状に歪ませるエフェクト',
  intensityRange: [0, 2],
  defaultIntensity: 1.0
};