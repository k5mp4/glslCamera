#ifdef GL_ES
precision mediump float;
#endif
// GLSL Canvas用のユニフォーム変数
// #define PREVIEW_MODE// GLSLcanvasでエフェクトの確認をするための定義

// プレビュー環境の判定
#ifdef PREVIEW_MODE
uniform float u_time;
uniform vec2 u_resolution;

// プレビュー用の設定
#define TIME_VAR u_time
#define INTENSITY_VAR 10.
#define UV_CALC gl_FragCoord.xy/u_resolution.xy

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

void main(){
    // 統一されたUV座標の取得
    vec2 uv=UV_CALC;
    
    vec2 center=vec2(.5,.5);
    vec2 offset=uv-center;
    float distance=length(offset);
    
    // 放射状の歪み
    float distortionStrength=sin(distance*15.+TIME_VAR*3.)*.1*INTENSITY_VAR;
    uv=center+offset*(1.+distortionStrength);
    
    #ifdef PREVIEW_MODE
        vec4 color=vec4(uv.x,uv.y,.5,1.);
        gl_FragColor=color;

    #else
        // 実際のアプリ用：カメラテクスチャを使用
        vec4 color = texture2D(TEXTURE_VAR,uv);
        gl_FragColor=color;
    #endif
}