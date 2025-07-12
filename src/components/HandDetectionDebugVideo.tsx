// components/HandDetectionDebugVideo.tsx
import React, { useRef, useEffect } from 'react';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';

interface HandDetectionDebugVideoProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  handData: {
    landmarks: any[][];
    handedness: string[];
    isDetected: boolean;
  };
  isStreaming: boolean;
}

export const HandDetectionDebugVideo: React.FC<HandDetectionDebugVideoProps> = ({
  videoRef,
  handData,
  isStreaming
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 手の検出結果をcanvasに描画
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !isStreaming) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // アニメーションフレームで描画を更新
    const drawFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;

      // キャンバスサイズをビデオサイズに合わせる
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;

      // ビデオフレームをcanvasに描画
      ctx.save();
      ctx.scale(-1, 1); // 左右反転（鏡像表示）
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 手の検出結果を描画
      if (handData.isDetected && handData.landmarks.length > 0) {
        handData.landmarks.forEach((landmarks, index) => {
          // 手の骨格（線）を描画
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: '#00FF00', // 緑色
            lineWidth: 2,
          });

          // 手のランドマーク（点）を描画
          drawLandmarks(ctx, landmarks, {
            color: '#FF0000', // 赤色
            lineWidth: 1,
            radius: 3,
          });

          // 手の左右表示
          if (handData.handedness[index]) {
            const wrist = landmarks[0]; // 手首の座標
            if (wrist) {
              ctx.fillStyle = '#FFFF00'; // 黄色
              ctx.font = '16px Arial';
              ctx.fillText(
                handData.handedness[index], 
                wrist.x * canvas.width, 
                wrist.y * canvas.height - 10
              );
            }
          }
        });

        // 検出情報を表示
        ctx.fillStyle = '#00FF00';
        ctx.font = '14px Arial';
        ctx.fillText(
          `Hands detected: ${handData.landmarks.length}`, 
          10, 
          25
        );
      } else {
        // 検出されていない場合
        ctx.fillStyle = '#FF0000';
        ctx.font = '14px Arial';
        ctx.fillText('No hands detected', 10, 25);
      }

      // 次のフレームを描画
      requestAnimationFrame(drawFrame);
    };

    // 描画開始
    drawFrame();
  }, [handData, isStreaming, videoRef]);

  if (!isStreaming) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 1000,
    }}>
      {/* 元のビデオ要素（非表示） */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'none' }} // キャンバスで代用するため非表示
      />
      
      {/* MediaPipe結果表示用キャンバス */}
      <canvas
        ref={canvasRef}
        style={{
          width: '160px',
          height: '90px',
          border: '2px solid red',
          backgroundColor: '#000',
        }}
      />
      
      {/* デバッグ情報オーバーレイ */}
      <div style={{
        position: 'absolute',
        bottom: '-25px',
        left: '0',
        fontSize: '10px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '2px 4px',
        borderRadius: '3px',
        whiteSpace: 'nowrap'
      }}>
        {handData.isDetected ? 
          `${handData.landmarks.length} hands: ${handData.handedness.join(', ')}` : 
          'No detection'
        }
      </div>
    </div>
  );
};