// src/App.tsx - デバッグ版
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// カメラ映像を表示するコンポーネント
const CameraPlane = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    console.log('CameraPlane: useEffect開始');
    console.log('videoRef.current:', videoRef.current);
    
    if (videoRef.current) {
      console.log('videoRef.current.videoWidth:', videoRef.current.videoWidth);
      console.log('videoRef.current.videoHeight:', videoRef.current.videoHeight);
      console.log('videoRef.current.readyState:', videoRef.current.readyState);
      
      const texture = new THREE.VideoTexture(videoRef.current);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      
      console.log('VideoTexture作成完了:', texture);
      setVideoTexture(texture);
    }
  }, [videoRef, videoRef.current?.readyState]); // readyStateも監視

  // フレームごとにテクスチャを更新
  useFrame(() => {
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });

  console.log('CameraPlane: render, videoTexture:', videoTexture);

  if (!videoTexture) {
    console.log('videoTextureがnullのため何も表示しません');
    return null;
  }

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[4, 3]} />
      <meshBasicMaterial map={videoTexture} />
    </mesh>
  );
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const startCamera = async () => {
    try {
      console.log('カメラ開始試行中...');
      setDebugInfo('カメラアクセス中...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('ストリーム取得成功:', stream);
      console.log('ビデオトラック:', stream.getVideoTracks());
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // loadedmetadataイベントを待つ
        videoRef.current.addEventListener('loadedmetadata', () => {
          console.log('メタデータ読み込み完了');
          console.log('ビデオサイズ:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setDebugInfo(`ビデオサイズ: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
        });

        // canplayイベントを待つ
        videoRef.current.addEventListener('canplay', () => {
          console.log('ビデオ再生可能');
          setIsStreaming(true);
        });

        // エラーハンドリング
        videoRef.current.addEventListener('error', (e) => {
          console.error('ビデオエラー:', e);
          setDebugInfo('ビデオエラーが発生しました');
        });
        
        console.log('ビデオ要素にストリーム設定完了');
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
      {/* デバッグ用の通常のビデオ表示 */}
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
          zIndex: 1000
        }}
      />
      
      {/* Canvas */}
      <Canvas 
        camera={{ position: [0, 0, 2] }}
        style={{ background: '#333' }} // 背景色を設定してCanvasの境界を確認
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {/* デバッグ用の基本メッシュ */}
        <mesh position={[-2, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* カメラプレーン */}
        {isStreaming && <CameraPlane videoRef={videoRef} />}
      </Canvas>
      
      {/* コントロール */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={startCamera}
          disabled={isStreaming}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isStreaming ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isStreaming ? 'default' : 'pointer',
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
              fontSize: '16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            停止
          </button>
        )}
      </div>
      
      {/* デバッグ情報 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div>ストリーミング: {isStreaming ? 'ON' : 'OFF'}</div>
        <div>デバッグ: {debugInfo}</div>
        <div>ビデオ要素: {videoRef.current ? 'あり' : 'なし'}</div>
        <div>readyState: {videoRef.current?.readyState}</div>
      </div>
    </div>
  );
}

export default App;