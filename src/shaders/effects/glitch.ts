export const glitchEffect = `
  // グリッチエフェクト
  float noise = fract(sin(dot(uv.xy + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
  
  // ランダムな横線のグリッチ
  if (noise > 0.98 - uIntensity * 0.1) {
    uv.x += (noise - 0.5) * 0.1 * uIntensity;
  
  
  color = texture2D(uTexture, uv);
  
  // RGB分離エフェクト
  if (noise > 0.95 - uIntensity * 0.05) {
    color.r = texture2D(uTexture, uv + vec2(0.01 * uIntensity, 0.0)).r;
    color.b = texture2D(uTexture, uv - vec2(0.01 * uIntensity, 0.0)).b;
  }
  
  // ランダムな色反転
  if (noise > 0.99 - uIntensity * 0.02) {
    color = vec4(1.0 - color.rgb, color.a);
  }
`;

export const glitchEffectInfo = {
  id: 'glitch',
  name: 'グリッチ',
  description: 'デジタルノイズとRGB分離を組み合わせたグリッチエフェクト',
  intensityRange: [0, 2],
  defaultIntensity: 0.5
};