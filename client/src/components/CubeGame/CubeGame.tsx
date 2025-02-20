import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Cube } from './Cube';
import styles from './CubeGame.module.css';
import { useTheme } from '@/hooks/use-theme';

interface CubeGameProps {
  size?: number;
}

export const CubeGame = ({ size = 3 }: CubeGameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cubeRef = useRef<Cube>();
  const [isInitialized, setIsInitialized] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Setup renderer
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Setup camera
    camera.position.set(4, 4, 4);
    camera.lookAt(scene.position);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.69);
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.36);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.19);

    frontLight.position.set(1.5, 5, 3);
    backLight.position.set(-1.5, -5, -3);

    scene.add(ambientLight);
    scene.add(frontLight);
    scene.add(backLight);

    // Initialize cube
    cubeRef.current = new Cube(scene, { size });

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;

      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (cubeRef.current) {
        cubeRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    setIsInitialized(true);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div className={styles.ui}>
      <div className={`${styles.uiBackground} ${theme === 'dark' ? styles.dark : ''}`} />
      <div className={styles.uiGame} ref={containerRef} />
      <div className={styles.uiTexts}>
        <h1 className={styles.textTitle}>
          <span>THE</span>
          <span>CUBE</span>
        </h1>
        <div className={styles.textNote}>
          Double tap to start
        </div>
        <div className={styles.textTimer}>
          0:00
        </div>
      </div>
      <div className={styles.uiStats}>
        <div className={styles.stats}>
          <i>Moves:</i><b>0</b>
        </div>
        <div className={styles.stats}>
          <i>Time:</i><b>0:00</b>
        </div>
      </div>
    </div>
  );
};