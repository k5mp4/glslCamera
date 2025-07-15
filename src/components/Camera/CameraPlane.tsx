// カメラ映像を表示するコンポーネント
// GLSLのエフェクトを適用するため、Three.js(react-three-fiber)を使用
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getEffect, getEffectList } from '../../shaders';

export const CameraPlane = ({
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

    // ビデオテクスチャの設定 エフェクト変更時に実行
    useEffect(() => {
        if (videoRef.current && videoRef.current.readyState >= 2) { // DOM要素があり、現在フレームのデータがあるとき
            const texture = new THREE.VideoTexture(videoRef.current); //Webカメラ映像をテクスチャに流す
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            setVideoTexture(texture);
        }
    }, [videoRef, videoRef.current?.readyState]);//ここの値が変わるたびに実行

    // 🔧 修正: マテリアル作成・更新をuseEffectのみで行う（JSXとの競合を解消）
    useEffect(() => {
        if (videoTexture) {
            const effect = getEffect(effectId);

            if (effect) {
                console.log(`エフェクト "${effect.info.name}" を適用中...`);
                console.log('GLSLコード:', effect.fragmentShader);

                // 古いマテリアルを破棄
                if (materialRef.current) {
                    materialRef.current.dispose();
                }

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
                materialRef.current = newMaterial;

                // メッシュのマテリアルを更新
                if (meshRef.current) {
                    meshRef.current.material = newMaterial;
                }
            }
        }
    }, [effectId, videoTexture]);

    // アニメーションループ(1Fごとに実行)
    useFrame((state) => {
        // console.log('useFrame実行ログ',state.clock.elapsedTime);
        // console.log('materialRef.current:',materialRef.current);
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
            {/* 🔧 修正: JSXのshaderMaterialを削除（useEffectで動的に設定するため） */}
        </mesh>
    );
};