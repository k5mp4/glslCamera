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
        if (isStreaming && videoRef.current?.readyState >= 3) {
            createHandLandmarker();
        }
    }, [isStreaming, videoRef.current?.readyState])

    // 手の検出処理
    const detectHands = useCallback(() => {
        if (!isStreaming || !handLandmarkerRef.current || !videoRef.current) return;

        // ✅ video要素の詳細チェック
        const video = videoRef.current;
        if (video.readyState < 2 ||
            !video.srcObject ||
            video.videoWidth === 0 ||
            video.videoHeight === 0 ||
            video.paused ||
            video.ended) {
            return; // 無効な状態では処理をスキップ
        }

        try {
            const results = handLandmarkerRef.current.detectForVideo(
                video,
                performance.now()
            );
            // ✅ 手が検出されたときのみログ
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

        const interval = setInterval(detectHands, 16);// 16ms
        return () => clearInterval(interval);
    }, [isInitialized, detectHands]);

    // コンポーネントアンマウント時のクリーンアップ
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