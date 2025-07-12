import { useRef, useEffect, useCallback } from 'react';
import { type HandLandmarkerResult } from '@mediapipe/tasks-vision';

interface UseHandDrawingProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handResults: HandLandmarkerResult | null;
  isStreaming: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>; // サイズ同期用
  drawingOptions?: {
    connectionColor?: string;
    landmarkColor?: string;
    connectionLineWidth?: number;
    landmarkLineWidth?: number;
    differentiateHands?: boolean;
  };
}

export const useHandDrawing = ({
  canvasRef,
  handResults,
  isStreaming,
  videoRef,
  drawingOptions = {}
}: UseHandDrawingProps) => {
  
  // 描画コンテキストの参照
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // デフォルト描画オプション
  const defaultOptions = {
    connectionColor: "#00FF00",
    landmarkColor: "#FF0000",
    connectionLineWidth: 5,
    landmarkLineWidth: 2,
    differentiateHands: false,
    ...drawingOptions
  };

  // キャンバスサイズをvideoに同期
  const syncCanvasSize = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      // スタイルサイズ（表示サイズ）
      canvas.style.width = video.clientWidth + 'px';
      canvas.style.height = video.clientHeight + 'px';
      
      // 描画解像度
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // コンテキストを再取得
      canvasCtxRef.current = canvas.getContext('2d');
    }
  }, [canvasRef, videoRef]);

  // 手の骨格を描画
  const drawHandSkeletons = useCallback(() => {
    if (!canvasCtxRef.current || !handResults || !isStreaming) return;
    
    const ctx = canvasCtxRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // キャンバスクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!handResults.landmarks || handResults.landmarks.length === 0) return;
    
    // 各手の描画
    handResults.landmarks.forEach((landmarks, index) => {
      let connectionColor = defaultOptions.connectionColor;
      let landmarkColor = defaultOptions.landmarkColor;
      
      // 左右の手で色を分ける
      if (defaultOptions.differentiateHands && handResults.handednesses?.[index]) {
        const isLeft = handResults.handednesses[index][0].categoryName === "Left";
        connectionColor = isLeft ? "#00FF00" : "#0000FF";
        landmarkColor = isLeft ? "#FF0000" : "#FF00FF";
      }
      
      // 接続線の描画
      drawConnectors(ctx, landmarks, connectionColor, defaultOptions.connectionLineWidth);
      
      // ランドマークの描画
      drawLandmarks(ctx, landmarks, landmarkColor, defaultOptions.landmarkLineWidth);
    });
  }, [handResults, isStreaming, defaultOptions]);

  // 接続線を描画するヘルパー関数
  const drawConnectors = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{x: number, y: number, z: number}>,
    color: string,
    lineWidth: number
  ) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    // 手の接続定義（MediaPipeの標準）
    const HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4], // 親指
      [0, 5], [5, 6], [6, 7], [7, 8], // 人差し指
      [0, 9], [9, 10], [10, 11], [11, 12], // 中指
      [0, 13], [13, 14], [14, 15], [15, 16], // 薬指
      [0, 17], [17, 18], [18, 19], [19, 20], // 小指
      [5, 9], [9, 13], [13, 17] // 手のひら
    ];
    
    HAND_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
      ctx.stroke();
    });
  }, [canvasRef]);

  // ランドマークを描画するヘルパー関数
  const drawLandmarks = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{x: number, y: number, z: number}>,
    color: string,
    lineWidth: number
  ) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [canvasRef]);

  // 初期化時とvideoサイズ変更時にキャンバスサイズを同期
  useEffect(() => {
    syncCanvasSize();
  }, [syncCanvasSize, isStreaming]);

  // handResultsが更新されたら描画
  useEffect(() => {
    drawHandSkeletons();
  }, [drawHandSkeletons]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (canvasCtxRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        canvasCtxRef.current.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, []);

  return {
    syncCanvasSize, // 外部から手動でサイズ同期したい場合
    drawHandSkeletons // 外部から手動で描画したい場合
  };
};