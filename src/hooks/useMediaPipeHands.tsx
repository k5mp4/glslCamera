// hooks/useMediaPipeHands.ts (更新版)
import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export interface HandLandmarks {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmarks[][];
  handedness: string[];
  isDetected: boolean;
  confidence: number[];
}

export const useMediaPipeHands = (
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true
) => {
  const [handData, setHandData] = useState<HandDetectionResult>({
    landmarks: [],
    handedness: [],
    isDetected: false,
    confidence: []
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const initializeMediaPipe = useCallback(async () => {
    if (!videoRef.current || !enabled) return;

    try {
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      // 結果処理（詳細情報付き）
      hands.onResults((results) => {
        console.log('MediaPipe Results:', results); // デバッグログ

        setHandData({
          landmarks: results.multiHandLandmarks || [],
          handedness: results.multiHandedness?.map(h => h.label) || [],
          isDetected: !!(results.multiHandLandmarks && results.multiHandLandmarks.length > 0),
          confidence: results.multiHandedness?.map(h => h.score) || []
        });
      });

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      handsRef.current = hands;
      cameraRef.current = camera;

      await camera.start();
      setIsInitialized(true);
      console.log('✅ MediaPipe Hands初期化完了');

    } catch (error) {
      console.error('❌ MediaPipe初期化エラー:', error);
    }
  }, [videoRef, enabled]);

  const cleanup = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    setIsInitialized(false);
    setHandData({
      landmarks: [],
      handedness: [],
      isDetected: false,
      confidence: []
    });
  }, []);

  useEffect(() => {
    if (enabled && videoRef.current) {
      initializeMediaPipe();
    }
    return cleanup;
  }, [enabled, initializeMediaPipe, cleanup]);

  return {
    handData,
    isInitialized,
    initializeMediaPipe,
    cleanup
  };
};