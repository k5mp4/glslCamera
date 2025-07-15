/// <reference types="vite/client" />
// 🔧 GLSLファイルの型定義を追加
declare module '*.frag' {
  const value: string;
  export default value;
}

declare module '*.vert' {
  const value: string;
  export default value;
}

declare module '*.glsl' {
  const value: string;
  export default value;
}

// ?raw パラメータ付きのインポート用
declare module '*.frag?raw' {
  const value: string;
  export default value;
}

declare module '*.vert?raw' {
  const value: string;
  export default value;
}

declare module '*.glsl?raw' {
  const value: string;
  export default value;
}