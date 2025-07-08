import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei"

function App() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }}>
      <ambientLight intensity={Math.PI / 2} />
      <OrbitControls />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </Canvas>
  );
}

export default App;