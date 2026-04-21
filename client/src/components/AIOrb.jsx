import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function AIOrb({ pulsing = false }) {
  const mountRef = useRef(null);
  const pulsingRef = useRef(pulsing);
  pulsingRef.current = pulsing;

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Core orb
    const coreGeo = new THREE.SphereGeometry(0.7, 64, 64);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x6366f1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.6,
      shininess: 120,
      transparent: true,
      opacity: 0.95,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Inner glow shell
    const shell1Geo = new THREE.SphereGeometry(0.82, 32, 32);
    const shell1Mat = new THREE.MeshBasicMaterial({
      color: 0x818cf8, transparent: true, opacity: 0.12, side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(shell1Geo, shell1Mat));

    // Outer glow
    const shell2Geo = new THREE.SphereGeometry(1.1, 32, 32);
    const shell2Mat = new THREE.MeshBasicMaterial({
      color: 0x6366f1, transparent: true, opacity: 0.05, side: THREE.BackSide,
    });
    const outerShell = new THREE.Mesh(shell2Geo, shell2Mat);
    scene.add(outerShell);

    // Orbiting rings
    const rings = [];
    [0.95, 1.15].forEach((r, i) => {
      const rGeo = new THREE.TorusGeometry(r, 0.012, 16, 80);
      const rMat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0x06b6d4 : 0x818cf8, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = (Math.PI / 3) * (i + 1);
      ring.rotation.y = Math.PI / 4 * i;
      scene.add(ring);
      rings.push(ring);
    });

    // Floating particles around orb
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const angles = [];
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.3 + Math.random() * 0.5;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
      angles.push(theta);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x818cf8, size: 0.03, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(pGeo, pMat));

    // Lights
    scene.add(new THREE.AmbientLight(0x4f46e5, 0.8));
    const pl1 = new THREE.PointLight(0x818cf8, 3, 15);
    pl1.position.set(2, 2, 2);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x06b6d4, 2, 15);
    pl2.position.set(-2, -1, -1);
    scene.add(pl2);

    // Animation
    let animId;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const pulseScale = pulsingRef.current
        ? 1 + 0.08 * Math.sin(t * 6)
        : 1 + 0.02 * Math.sin(t * 1.5);

      core.scale.setScalar(pulseScale);
      core.rotation.y += 0.008;
      core.rotation.x += 0.004;

      rings[0].rotation.x += 0.012;
      rings[0].rotation.y += 0.006;
      rings[1].rotation.x -= 0.008;
      rings[1].rotation.z += 0.01;

      outerShell.material.opacity = 0.05 + 0.04 * Math.sin(t * 2);
      pl1.intensity = 2.5 + 1.5 * Math.sin(t * 2.5);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
