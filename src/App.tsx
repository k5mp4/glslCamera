// src/App.tsx

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 🔗 ここでshaders/index.tsから関数をインポート
import { getEffect, getEffectList } from './shaders';

// カメラ映像を表示するコンポーネント
const CameraPlane = ({ 
  videoRef, 
  effectId,
  effectIntensity 
}: { 
  videoRef: React.RefObject<HTMLVideoElement | null>;
  effectId: string;
  effectIntensity: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  // ビデオテクスチャの設定
  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const texture = new THREE.VideoTexture(videoRef.current);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      setVideoTexture(texture);
    }
  }, [videoRef, videoRef.current?.readyState]);

  // 🔗 エフェクトが変更されたときにシェーダーを更新
  useEffect(() => {
    if (materialRef.current && videoTexture) {
      // getEffect()を使ってwave.tsのエフェクトを取得
      const effect = getEffect(effectId);
      
      if (effect) {
        console.log(`エフェクト "${effect.info.name}" を適用中...`);
        console.log('GLSLコード:', effect.fragmentShader);
        
        // 新しいシェーダーマテリアルを作成
        const newMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uTexture: { value: videoTexture },
            uTime: { value: 0 },
            uIntensity: { value: effectIntensity }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: effect.fragmentShader,  // ← wave.tsから来たGLSLコード
          transparent: true
        });
        
        // 古いマテリアルを破棄
        materialRef.current.dispose();
        
        // メッシュのマテリアルを更新
        if (meshRef.current) {
          meshRef.current.material = newMaterial;
          materialRef.current = newMaterial;
        }
      }
    }
  }, [effectId, videoTexture]);

  // アニメーションループ
  useFrame((state) => {
    if (materialRef.current) {
      // GLSLのuTime変数を更新（wave.tsで使用）
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uIntensity.value = effectIntensity;
    }
    
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });

  if (!videoTexture) return null;

  const currentEffect = getEffect(effectId);
  if (!currentEffect) return null;

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <planeGeometry args={[4, 3]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uTexture: { value: videoTexture },
          uTime: { value: 0 },
          uIntensity: { value: effectIntensity }
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={currentEffect.fragmentShader}  // ← ここでwave.tsのコードが使われる
        transparent
      />
    </mesh>
  );
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // エフェクト関連の状態
  const [effectId, setEffectId] = useState<string>('wave');  // デフォルトで波エフェクト
  const [effectIntensity, setEffectIntensity] = useState<number>(1.0);
  
  // 🔗 getEffectList()を使って利用可能なエフェクト一覧を取得
  const effectList = getEffectList();  // wave.tsの情報も含まれる
  const currentEffect = getEffect(effectId);  // 現在選択されているエフェクト

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.addEventListener('loadedmetadata', () => {
          setDebugInfo(`ビデオサイズ: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
        });

        videoRef.current.addEventListener('canplay', () => {
          setIsStreaming(true);
        });
      }
    } catch (error) {
      console.error('カメラアクセスエラー:', error);
      setDebugInfo(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
      setDebugInfo('カメラ停止');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* デバッグ用ビデオ */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ 
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '200px',
          height: '150px',
          border: '2px solid red',
          zIndex: 1000,
          transform: 'scaleX(-1)'
        }}
      />
      
      {/* Canvas */}
      <Canvas 
        camera={{ position: [0, 0, 2] }}
        style={{ background: '#333' }}
      >
        <ambientLight intensity={0.5} />
        
        {/* 🔗 ここでwave.tsのエフェクトが適用される */}
        {isStreaming && (
          <CameraPlane 
            videoRef={videoRef} 
            effectId={effectId}        // 'wave' が渡される
            effectIntensity={effectIntensity}
          />
        )}
      </Canvas>
      
      {/* UI コントロール */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        zIndex: 1000,
        minWidth: '320px'
      }}>
        {/* カメラ制御 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>カメラ制御</h3>
          <button
            onClick={startCamera}
            disabled={isStreaming}
            style={{
              padding: '10px 20px',
              backgroundColor: isStreaming ? '#666' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              marginRight: '10px'
            }}
          >
            {isStreaming ? 'カメラ動作中' : 'カメラ開始'}
          </button>
          
          {isStreaming && (
            <button
              onClick={stopCamera}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px'
              }}
            >
              停止
            </button>
          )}
        </div>
        
        {/* 🔗 エフェクト選択（wave.tsも含まれる） */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>エフェクト</h3>
          <select
            value={effectId}
            onChange={(e) => setEffectId(e.target.value)}
            disabled={!isStreaming}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isStreaming ? 'white' : '#ccc',
              color: 'black'
            }}
          >
            {effectList.map(effect => (
              <option key={effect.id} value={effect.id}>
                {effect.name}  {/* wave.tsなら「波」と表示 */}
              </option>
            ))}
          </select>
          
          {/* エフェクトの説明 */}
          {currentEffect && (
            <p style={{ 
              margin: '8px 0 0 0', 
              fontSize: '12px', 
              color: '#ccc'
            }}>
              {currentEffect.info.description}  {/* wave.tsの説明 */}
            </p>
          )}
        </div>
        
        {/* エフェクト強度 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            強度: {effectIntensity.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={2}
            step="0.1"
            value={effectIntensity}
            onChange={(e) => setEffectIntensity(parseFloat(e.target.value))}
            disabled={!isStreaming}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* デバッグ情報 */}
        <div style={{ 
          fontSize: '11px',
          fontFamily: 'monospace',
          borderTop: '1px solid #555',
          paddingTop: '12px',
          color: '#999'
        }}>
          <div>現在のエフェクト: {currentEffect?.info.name}</div>
          <div>エフェクトID: {effectId}</div>
          <div>デバッグ: {debugInfo}</div>
        </div>
      </div>
    </div>
  );
}

export default App;