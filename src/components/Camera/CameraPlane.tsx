import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getEffect } from '../../shaders/index';

export const CameraPlane = ({
    videoRef,
    effectId,
    effectIntensity,
    timeIntensity
}: {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    effectId: string;
    effectIntensity: number;
    timeIntensity: number;
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
    
    // 時間カウンターを作成
    const customTimeRef = useRef<number>(0);

    useEffect(() => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
            const texture = new THREE.VideoTexture(videoRef.current);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            setVideoTexture(texture);
        }
    }, [videoRef, videoRef.current?.readyState]);

    useEffect(() => {
        if (videoTexture) {
            const effect = getEffect(effectId);

            if (effect) {
                console.log(`エフェクト "${effect.info.name}" を適用中...`);

                if (materialRef.current) {
                    materialRef.current.dispose();
                }

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
                    }`,
                    fragmentShader: effect.fragmentShader,
                    transparent: true
                });
                materialRef.current = newMaterial;

                if (meshRef.current) {
                    meshRef.current.material = newMaterial;
                }
            }
        }
    }, [effectId, videoTexture]);

    // 🔧 Delta時間を使って独自の時間を管理
    useFrame((state, delta) => {
        if (materialRef.current) {
            // 前フレームからの経過時間(delta)に速度をかけて加算
            customTimeRef.current += delta * timeIntensity ;
            
            // 独自の時間をシェーダーに渡す
            materialRef.current.uniforms.uTime.value = customTimeRef.current;
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
        </mesh>
    );
};