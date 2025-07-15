// hooks/useCamera.ts
import { useState, useCallback, type RefObject } from 'react';

/**
 * カメラの設定オプション
 */
export interface CameraConfig {
  width?: number;
  height?: number;
}

/**
 * useCameraフックの戻り値の型定義
 */
export interface UseCameraReturn {
  isStreaming: boolean;
  debugInfo: string;
  startCamera: (
    videoRef: RefObject<HTMLVideoElement | null>, 
    videoRef2?: RefObject<HTMLVideoElement | null>,
    onCanvasSync?: () => void
  ) => Promise<void>;
  stopCamera: (
    videoRef: RefObject<HTMLVideoElement | null>,
    videoRef2?: RefObject<HTMLVideoElement | null>
  ) => void;
}

/**
 * カメラの開始・停止・状態管理を行うカスタムフック
 * 
 * @param config カメラの設定オプション
 * @returns カメラの状態と制御関数
 */
export const useCamera = (config: CameraConfig = {}): UseCameraReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  /**
   * カメラを開始する
   */
  const startCamera = useCallback(async (
    videoRef: RefObject<HTMLVideoElement | null>, 
    videoRef2?: RefObject<HTMLVideoElement | null>,
    onCanvasSync?: () => void
  ) => {
    try {
      // 1. カメラアクセス要求
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: config.width || 1280 },
          height: { ideal: config.height || 720 }
        }
      });

      // 2. メインビデオ要素に映像を設定
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // 3. メタデータ読み込み時のイベントリスナー
        const handleLoadedMetadata = () => {
          setDebugInfo(
            `ビデオサイズ: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`
          );
        };

        // 4. 再生可能になった時のイベントリスナー
        const handleCanPlay = () => {
          setIsStreaming(true);
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.addEventListener('canplay', handleCanPlay);

        // クリーンアップ関数を設定
        const cleanup = () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoRef.current.removeEventListener('canplay', handleCanPlay);
          }
        };

        // videoRef.current に cleanup 関数を保存（後で使用）
        (videoRef.current as any)._cleanup = cleanup;
      }

      // 5. サブビデオ要素（MediaPipe用）に映像を設定
      if (videoRef2?.current) {
        videoRef2.current.srcObject = stream;
        
        // Canvas同期用のイベントリスナー
        const handleLoadedMetadata2 = () => {
          setTimeout(() => {
            onCanvasSync?.(); // Canvasサイズ同期のコールバック実行
          }, 100);
        };

        videoRef2.current.addEventListener('loadedmetadata', handleLoadedMetadata2);

        // クリーンアップ関数を設定
        const cleanup2 = () => {
          if (videoRef2.current) {
            videoRef2.current.removeEventListener('loadedmetadata', handleLoadedMetadata2);
          }
        };

        (videoRef2.current as any)._cleanup = cleanup2;
      }
      
    } catch (error) {
      // 6. エラーハンドリング
      console.error('カメラアクセスエラー:', error);
      setDebugInfo(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setIsStreaming(false);
    }
  }, [config.width, config.height]);

  /**
   * カメラを停止する
   */
  const stopCamera = useCallback((
    videoRef: RefObject<HTMLVideoElement | null>,
    videoRef2?: RefObject<HTMLVideoElement | null>
  ) => {
    // 1. メインビデオのストリーム停止
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      
      // 全てのトラックを停止
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`トラック停止: ${track.kind} - ${track.label}`);
      });
      
      // ストリームを削除
      videoRef.current.srcObject = null;
      
      // イベントリスナーのクリーンアップ
      const cleanup = (videoRef.current as any)._cleanup;
      if (cleanup) {
        cleanup();
        delete (videoRef.current as any)._cleanup;
      }
    }
    
    // 2. サブビデオのストリーム停止
    if (videoRef2?.current?.srcObject) {
      videoRef2.current.srcObject = null;
      
      // イベントリスナーのクリーンアップ
      const cleanup2 = (videoRef2.current as any)._cleanup;
      if (cleanup2) {
        cleanup2();
        delete (videoRef2.current as any)._cleanup;
      }
    }
    
    // 3. 状態更新
    setIsStreaming(false);
    setDebugInfo('カメラ停止');
  }, []);

  return {
    isStreaming,
    debugInfo,
    startCamera,
    stopCamera
  };
};