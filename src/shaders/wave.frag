#ifdef GL_ES
precision mediump float;
#endif
// GLSL Canvas用のユニフォーム変数
// #define PREVIEW_MODE // GLSLcanvasでエフェクトの確認をするための定義

// プレビュー環境の判定
#ifdef PREVIEW_MODE
    uniform float u_time;
    uniform vec2 u_resolution;
    
    // プレビュー用の設定
    #define TIME_VAR u_time
    #define INTENSITY_VAR 10.0
    #define UV_CALC gl_FragCoord.xy / u_resolution.xy
    
#else
    // 実際のアプリ用の変数
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    
    // 実際のアプリ用の設定
    #define TIME_VAR uTime
    #define INTENSITY_VAR uIntensity
    #define UV_CALC vUv
    #define TEXTURE_VAR uTexture
#endif

void main() {
    // 統一されたUV座標の取得
    vec2 uv = UV_CALC;
    
    // 波のエフェクト（両方で同じコード）
    uv.x += sin(uv.y * 10.0 + TIME_VAR * 2.0) * 0.02 * INTENSITY_VAR;
    uv.y += cos(uv.x * 8.0 + TIME_VAR * 1.5) * 0.01 * INTENSITY_VAR;
    
    #ifdef PREVIEW_MODE
        vec4 color = vec4(uv.x, uv.y,0.5, 1.0);
        gl_FragColor = color;
    #else
        // 実際のアプリ用：カメラテクスチャを使用
        vec4 color = texture2D(TEXTURE_VAR, uv);
        gl_FragColor = color;
    #endif
}