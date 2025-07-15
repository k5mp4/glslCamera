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
#define INTENSITY_VAR 1.0
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
    vec2 uv = UV_CALC;
    
    #ifdef PREVIEW_MODE
        // プレビュー用：カラフルなグラデーション
        vec4 originalColor = vec4(uv.x, uv.y, 0.5, 1.,0);
    #else
        // 実際のアプリ用：カメラテクスチャ
        vec4 originalColor = texture2D(TEXTURE_VAR, uv);
    #endif
    // スパイラル効果
    // 時間ベースの効果を計算
    float timeEffect = 0.5;
    vec2 center = vec2(0.5, 0.5);
    vec2 pos = uv - center;
    float angle = atan(pos.y, pos.x);
    float dist = length(pos);
    float spiral = sin(angle * 5.0 + dist * 20.0 - TIME_VAR * 3.0) * 0.5 + 0.5;
    timeEffect = spiral;

    vec3 invertColor = vec3(1.0) - originalColor.rgb;
    // 最終的な反転の強度を時間効果で変調
    float finalIntensity = INTENSITY_VAR * timeEffect;
    // 元の色と白黒をINTENSITYでミックス
    vec3 finalColor = mix(originalColor.rgb, invertColor, finalIntensity);
    
    gl_FragColor = vec4(finalColor, originalColor.a);
}