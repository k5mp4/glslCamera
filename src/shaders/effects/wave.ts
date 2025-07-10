export const waveEffect = `
  // 波のエフェクト
  uv.x += sin(uv.y * 10.0 + uTime * 2.0) * 0.02 * uIntensity;
  uv.y += cos(uv.x * 8.0 + uTime * 1.5) * 0.01 * uIntensity;
  
  color = texture2D(uTexture, uv);
`;

export const waveEffectInfo = {
  id: 'wave',
  name: '波',
  description: 'UV座標を波のように変形させるエフェクト',
  intensityRange: [0, 2],
  defaultIntensity: 1.0
};