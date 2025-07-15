// components/UI/ControlPanel.tsx
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';
import React from 'react';

/**
 * ControlPanelコンポーネントのProps型定義
 * App.tsxから渡される全ての値と関数を定義
 */
export interface ControlPanelProps {
  // カメラ制御関連
  isStreaming: boolean;
  debugInfo: string;
  onStartCamera: () => void;
  onStopCamera: () => void;
  
  // エフェクト制御関連
  effectId: string;
  setEffectId: (id: string) => void;
  effectIntensity: number;
  setEffectIntensity: (intensity: number) => void;
  handBasedIntensity: number;
  effectList: Array<{ id: string; name: string }>;
  currentEffect: { info: { name: string; description: string } } | null;
  
  // 手の追跡関連
  handResults: HandLandmarkerResult | null;
  isInitialized: boolean;
  error: string | null;
  getHandPosition: (handResults: any) => { u: number; v: number };
}

/**
 * アプリケーションの制御パネルコンポーネント
 * カメラ制御、エフェクト選択、手の追跡情報、デバッグ情報を表示
 */
export const ControlPanel: React.FC<ControlPanelProps> = ({
  // カメラ制御
  isStreaming,
  debugInfo,
  onStartCamera,
  onStopCamera,
  
  // エフェクト制御
  effectId,
  setEffectId,
  effectIntensity,
  setEffectIntensity,
  handBasedIntensity,
  effectList,
  currentEffect,
  
  // 手の追跡
  handResults,
  isInitialized,
  error,
  getHandPosition
}) => {
  return (
    <div style={{ 
      position: 'absolute', 
      bottom: '20px', 
      left: '20px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      zIndex: 1000,
      minWidth: '320px'
    }}>
      {/* カメラ制御セクション */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>カメラ制御</h3>
        <button
          onClick={onStartCamera}
          disabled={isStreaming}
          style={{
            padding: '10px 20px',
            backgroundColor: isStreaming ? '#666' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            marginRight: '10px'
          }}
        >
          {isStreaming ? 'カメラ動作中' : 'カメラ開始'}
        </button>
        
        {isStreaming && (
          <button
            onClick={onStopCamera}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px'
            }}
          >
            停止
          </button>
        )}
      </div>
      
      {/* エフェクト選択セクション */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>エフェクト</h3>
        <select
          value={effectId}
          onChange={(e) => setEffectId(e.target.value)}
          disabled={!isStreaming}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: isStreaming ? 'white' : '#ccc',
            color: 'black'
          }}
        >
          {effectList.map(effect => (
            <option key={effect.id} value={effect.id}>
              {effect.name}
            </option>
          ))}
        </select>
        
        {/* エフェクトの説明 */}
        {currentEffect && (
          <p style={{ 
            margin: '8px 0 0 0', 
            fontSize: '12px', 
            color: '#ccc'
          }}>
            {currentEffect.info.description}
          </p>
        )}
      </div>
      
      {/* エフェクト強度調整セクション */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          ベース強度: {effectIntensity.toFixed(1)}
          {handResults?.landmarks?.length ? 
            ` → 実際の強度: ${handBasedIntensity.toFixed(1)}` : ''
          }
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step="0.1"
          value={effectIntensity}
          onChange={(e) => setEffectIntensity(parseFloat(e.target.value))}
          disabled={!isStreaming}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
          手の縦位置で強度が変わる（上=弱い、下=強い）
        </div>
      </div>
      
      {/* 手による制御情報セクション */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>手による制御</h3>
        <div style={{ fontSize: '12px' }}>
          <div>初期化: {isInitialized ? '✅' : '⏳'}</div>
          <div>検出された手: {handResults?.landmarks?.length || 0}個</div>
          {/* 段階的にnullチェック */}
          {handResults && handResults.landmarks && handResults.landmarks.length > 0 && (
            <>
              <div>手の位置: u={getHandPosition(handResults).u.toFixed(2)}, v={getHandPosition(handResults).v.toFixed(2)}</div>
              <div>位置による強度倍率: {(getHandPosition(handResults).v * 2).toFixed(1)}x</div>
              <div style={{ color: '#4CAF50' }}>
                現在のエフェクト強度: {handBasedIntensity.toFixed(1)}
              </div>
            </>
          )}
          {error && <div style={{ color: '#ff6b6b' }}>エラー: {error}</div>}
        </div>
      </div>
      
      {/* デバッグ情報セクション */}
      <div style={{ 
        fontSize: '11px',
        fontFamily: 'monospace',
        borderTop: '1px solid #555',
        paddingTop: '12px',
        color: '#999'
      }}>
        <div>現在のエフェクト: {currentEffect?.info.name}</div>
        <div>エフェクトID: {effectId}</div>
        <div>デバッグ: {debugInfo}</div>
        {/* 手の詳細情報 */}
        {handResults?.landmarks?.map((hand, index) => (
          <div key={index} style={{ fontSize: '10px', color: '#ccc' }}>
            手{index + 1} - 手首: 
            x:{hand[0]?.x?.toFixed(2)} 
            y:{hand[0]?.y?.toFixed(2)}
            {handResults.handednesses?.[index] && (
              <span> ({handResults.handednesses[index][0].categoryName})</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};