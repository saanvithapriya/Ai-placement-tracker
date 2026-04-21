import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function GlobeModel() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Globe
    const geo = new THREE.SphereGeometry(1.2, 48, 48);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x1e2240,
      emissive: 0x0f1022,
      shininess: 80,
      wireframe: false,
      transparent: true,
      opacity: 0.9,
    });
    const globe = new THREE.Mesh(geo, mat);
    scene.add(globe);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireGlobe = new THREE.Mesh(new THREE.SphereGeometry(1.21, 24, 24), wireMat);
    scene.add(wireGlobe);

    // Glowing dots (job hotspots)
    const dotGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x818cf8 });
    const positions = [
      [0.8, 0.6, 0.8], [-0.9, 0.4, 0.7], [0.5, -0.7, 0.9],
      [-0.6, -0.5, 0.9], [0.9, -0.2, 0.7], [-0.3, 0.9, 0.8],
      [0.3, 0.8, -0.9], [-0.7, 0.3, -0.9], [1.0, 0.1, 0.3],
      [-0.1, -0.9, 0.5], [0.6, 0.5, -0.8], [-0.5, -0.8, 0.5],
    ];
    const dotGroup = new THREE.Group();
    positions.forEach(([x, y, z]) => {
      const r = 1.22;
      const len = Math.sqrt(x * x + y * y + z * z);
      const dot = new THREE.Mesh(dotGeo, dotMat.clone());
      dot.position.set((x / len) * r, (y / len) * r, (z / len) * r);
      dotGroup.add(dot);
    });
    scene.add(dotGroup);

    // Connection arcs (curved lines between dots)
    const arcMat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.4 });
    const pairs = [[0,1],[2,3],[4,5],[6,7],[8,9],[1,10],[3,11]];
    pairs.forEach(([a, b]) => {
      const pa = dotGroup.children[a].position;
      const pb = dotGroup.children[b].position;
      const mid = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5).normalize().multiplyScalar(1.6);
      const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb);
      const pts = curve.getPoints(20);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(arcGeo, arcMat));
    });

    // Atmospheric glow ring
    const ringGeo = new THREE.TorusGeometry(1.35, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.2 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Particles
    const partCount = 200;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + Math.random() * 1.5;
      partPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      partPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      partPos[i * 3 + 2] = r * Math.cos(phi);
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({ color: 0x818cf8, size: 0.025, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(partGeo, partMat));

    // Lights
    scene.add(new THREE.AmbientLight(0x6366f1, 0.4));
    const pointLight = new THREE.PointLight(0x818cf8, 2, 10);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);
    const pointLight2 = new THREE.PointLight(0x06b6d4, 1.5, 10);
    pointLight2.position.set(-3, -2, -2);
    scene.add(pointLight2);

    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Animation
    let animId;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      globe.rotation.y += 0.003;
      wireGlobe.rotation.y += 0.003;
      dotGroup.rotation.y += 0.003;
      ring.rotation.z += 0.001;

      // Pulse dots
      dotGroup.children.forEach((dot, i) => {
        dot.material.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i * 0.5));
      });

      // Mouse parallax
      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
