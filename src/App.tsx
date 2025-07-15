import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { getEffect, getEffectList } from './shaders/index';
import { useMediaPipeHands } from './hooks/useMediaPipeHands';
import { useHandDrawing } from './hooks/useHandDrawing';
import { useCamera } from './hooks/useCamera';
import { calculateEffectIntensity, getHandPosition, calcTimeIntensity } from './utils/calculations';
import { CameraPlane } from './components/Camera/CameraPlane';
import { ControlPanel } from './components/UI/ControlPanel';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); //手の骨格描画用Canvas
  const { isStreaming, debugInfo, startCamera, stopCamera } = useCamera({
    width: 1280,
    height: 720
  })
  // handlandmarkerテスト
  const { handResults, isInitialized, error } = useMediaPipeHands(videoRef2, isStreaming);
  // 手の骨格描画フック
  const { syncCanvasSize } = useHandDrawing({
    canvasRef,
    handResults,
    isStreaming,
    videoRef: videoRef2, // 描画用CanvasのサイズをvideoRef2に合わせる
    drawingOptions: {
      connectionColor: "#00FF00",
      landmarkColor: "#FF0000",
      connectionLineWidth: 3,
      landmarkLineWidth: 2,
      differentiateHands: true // 左右の手で色を分ける
    }
  });
  // エフェクト関連の状態
  const [effectId, setEffectId] = useState<string>('wave');  // デフォルトで波エフェクト
  const [effectIntensity, setEffectIntensity] = useState<number>(1.0);

  // エフェクト強度の計算を手の位置ベースに変更
  const handBasedIntensity = calculateEffectIntensity(handResults, effectIntensity);
  const handBasedTimeIntencity = calcTimeIntensity(handResults);

  // 使って利用可能なエフェクト一覧を取得
  const effectList = getEffectList();
  const currentEffect = getEffect(effectId);  // 現在選択されているエフェクト

  const handleStartCamera = () => {
    startCamera(videoRef, videoRef2, syncCanvasSize);
  };
  const handleStopCamera = () => {
    stopCamera(videoRef, videoRef2);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 純粋なwebカメラ映像(右上) */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '160px',
          height: '90px',
          border: '2px solid red',
          zIndex: 1000,
          transform: 'scaleX(-1)'
        }}
      />

      {/* MediaPipeHandsと重畳するwebカメラ映像 */}
      <div style={{
        position: 'absolute',
        top: '110px',
        right: '10px',
        width: '160px',
        height: '90px',
        zIndex: 1000,
      }}>
        <video
          ref={videoRef2}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid blue',
            transform: 'scaleX(-1)',
            position: 'relative',
            zIndex: 1
          }}
        />

        {/* MediaPipeHands表示用Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            background: 'transparent',
            zIndex: 2,
            transform: 'scaleX(-1)' // videoと同じ向きに
          }}
        />
      </div>

      {/* Canvas(メインの表示) */}
      <Canvas
        camera={{ position: [0, 0, 2] }}
        style={{ background: '#333' }}
      >
        {/* エフェクト 適用 */}
        {isStreaming && (
          <CameraPlane
            videoRef={videoRef}
            effectId={effectId} // 'wave' が渡される
            effectIntensity={handBasedIntensity} // 手の座標ベースに変更
            timeIntensity={handBasedTimeIntencity}
          />
        )}
      </Canvas>

      {/*ControlPanelコンポーネントに分離 */}
      <ControlPanel
        // カメラ制御
        isStreaming={isStreaming}
        debugInfo={debugInfo}
        onStartCamera={handleStartCamera}
        onStopCamera={handleStopCamera}

        // エフェクト制御
        effectId={effectId}
        setEffectId={setEffectId}
        effectIntensity={effectIntensity}
        setEffectIntensity={setEffectIntensity}
        handBasedIntensity={handBasedIntensity}
        effectList={effectList}
        currentEffect={currentEffect}

        // 手の追跡
        handResults={handResults}
        isInitialized={isInitialized}
        error={error}
        getHandPosition={getHandPosition}
      />
    </div>
  );
}

export default App;