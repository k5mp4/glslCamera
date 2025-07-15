import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'

export const useMediaPipeHands = (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    isStreaming: boolean
) => {

    const [handResults, setHandResults] = useState<HandLandmarkerResult | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);

    const createHandLandmarker = async () => {
        try {
            if (handLandmarkerRef.current) return;// 初期化済みの場合は返す
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            const landmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "../hand_landmarker.task",
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                numHands: 2,
            });

            handLandmarkerRef.current = landmarker;
            setIsInitialized(true);
            console.log('MediaPipe初期化完了')
        } catch (err) {
            setError(err instanceof Error ? err.message : '初期化失敗');
        }
    }
    // 使用可能になったら
    useEffect(() => {
        if (isStreaming && videoRef.current && videoRef.current.readyState >= 3) {
            createHandLandmarker();
        }
    }, [isStreaming, videoRef.current?.readyState])

    // 手の検出処理
    const detectHands = useCallback(() => {
        if (!isStreaming || !handLandmarkerRef.current || !videoRef.current) return;
        try {
            const results = handLandmarkerRef.current.detectForVideo(
                videoRef.current,
                performance.now()
            );
            // 手が検出されたときのみログを出す
            if (results.landmarks && results.landmarks.length > 0) {
                console.log('手が検出されました！', {
                    検出された手の数: results.landmarks.length,
                    時刻: new Date().toLocaleTimeString()
                });
            }
                setHandResults(results);
        } catch (err) {
            if (isStreaming) {
                console.error('検出エラー:', err);
            }
        }
    }, [isStreaming]);

    // 定期実行
    useEffect(() => {
        if (!isInitialized) return;
        const interval = setInterval(detectHands, 16);// 16ms = 60FPS
        return () => clearInterval(interval); //クリーンアップ関数
    }, [isInitialized, detectHands]);

    // アンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            if (handLandmarkerRef.current) {
                handLandmarkerRef.current.close();
                handLandmarkerRef.current = null;
            }
        };
    }, []);

    return {
        handResults,
        isInitialized,
        error
    };


};