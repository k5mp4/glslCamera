import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getEffect, getEffectList } from './shaders';
import { useMediaPipeHands } from './hooks/useMediaPipeHands';
import { useHandDrawing } from './hooks/useHandDrawing'; 
import { calculateEffectIntensity, getHandPosition } from './utils/calculations';
import { CameraPlane } from './components/Camera/CameraPlane';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); //手の骨格描画用Canvas
  const [isStreaming, setIsStreaming] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
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
  
  // 使って利用可能なエフェクト一覧を取得
  const effectList = getEffectList();  
  const currentEffect = getEffect(effectId);  // 現在選択されているエフェクト

  const startCamera = async () => { // カメラアクセスは時間がかかるため非同期で処理
    try {
      // 1.カメラアクセス要求
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // 2. video要素に映像を設定
      if (videoRef.current) {
        videoRef.current.srcObject = stream; // カメラ映像を設定
        
        // 3. イベントリスナー設定
        videoRef.current.addEventListener('loadedmetadata', () => {
          setDebugInfo(`ビデオサイズ: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
        });

        videoRef.current.addEventListener('canplay', () => {
          setIsStreaming(true);// CameraPlaneのレンダリング
        });
      }
      if (videoRef2.current){// mediaPipe用のVideoDOM
        videoRef2.current.srcObject = stream;
        
        // ★ 新しく追加：videoRef2のメタデータ読み込み時にCanvasサイズを同期
        videoRef2.current.addEventListener('loadedmetadata', () => {
          setTimeout(() => {
            syncCanvasSize(); // 少し遅延させてから実行
          }, 100);
        });
      }
    } catch (error) {
      // 4.エラーハンドリング 
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
    if (videoRef2.current?.srcObject){
      videoRef2.current.srcObject = null;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* デバッグ用ビデオ(右上) */}
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

      {/* ★ 修正：videoRef2のスタイルを相対位置に変更 */}
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
        
        {/* 手の骨格表示用Canvas */}
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
        {/* <ambientLight intensity={0.5} /> */}
        
        {/* エフェクト 適用 */}
        {isStreaming && (
          <CameraPlane 
            videoRef={videoRef} 
            effectId={effectId} // 'wave' が渡される
            effectIntensity={handBasedIntensity} // 手の座標ベースに変更
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
        
        {/* エフェクト選択 */}
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
        
        {/* エフェクト強度スライダーのラベルを変更 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            ベース強度: {effectIntensity.toFixed(1)}
            {handResults?.landmarks?.length ? 
              ` → 実際の強度: ${handBasedIntensity.toFixed(1)}` : ''
            }
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
          <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
            手の縦位置で強度が変わる（上=弱い、下=強い）
          </div>
        </div>
        
        
        {/* 手の位置情報表示を追加 */}
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>手による制御</h3>
          <div style={{ fontSize: '12px' }}>
            <div>初期化: {isInitialized ? '✅' : '⏳'}</div>
            <div>検出された手: {handResults?.landmarks?.length || 0}個</div>
            {handResults?.landmarks?.length > 0 && (
              <>
                <div>手の位置: u={getHandPosition(handResults).u.toFixed(2)}, v={getHandPosition(handResults).v.toFixed(2)}</div>
                <div>位置による強度倍率: {(getHandPosition(handResults).v * 2).toFixed(1)}x</div>
                <div style={{ color: '#4CAF50' }}>
                  現在のエフェクト強度: {handBasedIntensity.toFixed(1)}
                </div>
              </>
            )}
            {error && <div style={{ color: '#ff6b6b' }}>エラー: {error}</div>}
          </div>
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
          {/* 手の詳細情報 */}
          {handResults?.landmarks?.map((hand, index) => (
            <div key={index} style={{ fontSize: '10px', color: '#ccc' }}>
              手{index + 1} - 手首: 
              x:{hand[0]?.x?.toFixed(2)} 
              y:{hand[0]?.y?.toFixed(2)}
              {handResults.handednesses?.[index] && (
                <span> ({handResults.handednesses[index][0].categoryName})</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;