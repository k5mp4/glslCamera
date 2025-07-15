// 1. effectsディレクトリからエフェクトをインポート
import { waveEffect, waveEffectInfo } from './effects/wave';
import { distortionEffect, distortionEffectInfo } from './effects/distorsion';
import { invertColorEffect, invertColorEffectInfo } from './effects/invertColor';

// 2. 基本のシェーダーテンプレート
const createEffectShader = (effectCode: string): string => {
  return `
    precision mediump float;  
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      vec4 color;
      
      ${effectCode}  // ← ここにGLSLのコードが入る
      
      gl_FragColor = color;
    }
  `;
};

// 3. エフェクト情報の型定義
export interface EffectInfo {
  id: string;
  name: string;
  description: string;
  intensityRange: [number, number];
  defaultIntensity: number;
}

export interface Effect {
  info: EffectInfo;
  fragmentShader: string;  // 完成したGLSLコード
}

// 4. 全エフェクトをまとめる
export const effects: Record<string, Effect> = {
  none: {
    info: {
      id: 'none',
      name: 'エフェクトなし',
      description: '元の映像をそのまま表示',
      intensityRange: [0, 1],
      defaultIntensity: 0
    },
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(uTexture, vUv);
      }
    `
  },
  wave: {
    info: waveEffectInfo,  // wave.ts から情報を取得
    fragmentShader: waveEffect  // wave.ts のコードを完全なシェーダーに変換
  },
  distortion: {
    info: distortionEffectInfo,
    fragmentShader: distortionEffect
  },
  invertColor: {
    info: invertColorEffectInfo,
    fragmentShader: invertColorEffect
  }
};



// 6. 使いやすい関数を提供
export const getEffect = (id: string): Effect | null => {
  return effects[id] || null;
};

export const getEffectList = (): EffectInfo[] => {
  return Object.values(effects).map(effect => effect.info);
};