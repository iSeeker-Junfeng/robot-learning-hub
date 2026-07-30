"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import URDFLoader from "urdf-loader";


function disposeObject(object) {
  object?.traverse((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
    else child.material?.dispose?.();
  });
}

function poseOf(link) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  link.updateWorldMatrix(true, false);
  link.matrixWorld.decompose(position, quaternion, scale);
  const euler = new THREE.Euler().setFromQuaternion(quaternion, "XYZ");
  return {
    position: { x: position.x, y: position.y, z: position.z },
    quaternion: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
    rpy: { roll: euler.x, pitch: euler.y, yaw: euler.z },
    matrix: link.matrixWorld.toArray(),
  };
}

const RobotViewport = forwardRef(function RobotViewport(
  { urdfText, assetBaseUrl = "", jointValues, basePose, selectedLink, onPose, onStatus },
  ref,
) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rendererRef = useRef(null);
  const robotRef = useRef(null);

  function resetCamera() {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const robot = robotRef.current;
    if (!camera || !controls) return;
    const bounds = robot ? new THREE.Box3().setFromObject(robot) : null;
    const sphere = bounds && !bounds.isEmpty() ? bounds.getBoundingSphere(new THREE.Sphere()) : new THREE.Sphere(new THREE.Vector3(0, 0, 0.7), 1);
    const distance = Math.max(sphere.radius * 3, 2.2);
    camera.position.set(sphere.center.x + distance, sphere.center.y - distance, sphere.center.z + distance * 0.72);
    camera.up.set(0, 0, 1);
    controls.target.copy(sphere.center);
    controls.update();
  }

  useImperativeHandle(ref, () => ({ resetCamera }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x10131a);
    scene.fog = new THREE.Fog(0x10131a, 8, 24);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    camera.up.set(0, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.screenSpacePanning = false;

    const grid = new THREE.GridHelper(12, 48, 0x354050, 0x232a35);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);
    scene.add(new THREE.AxesHelper(0.45));
    scene.add(new THREE.HemisphereLight(0xbfeaff, 0x25201d, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
    keyLight.position.set(4, -5, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xff7148, 2);
    rimLight.position.set(-5, 3, 4);
    scene.add(rimLight);

    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;
    rendererRef.current = renderer;
    resetCamera();

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let animationFrame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      controls.dispose();
      if (robotRef.current) disposeObject(robotRef.current);
      renderer.dispose();
      renderer.domElement.remove();
      sceneRef.current = null;
      robotRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !urdfText) return;
    if (robotRef.current) {
      scene.remove(robotRef.current);
      disposeObject(robotRef.current);
      robotRef.current = null;
    }
    onStatus?.("loading");
    try {
      const manager = new THREE.LoadingManager();
      manager.onError = (url) => onStatus?.("warning", `资源加载失败：${url.split("/").pop()}`);
      const loader = new URDFLoader(manager);
      loader.workingPath = assetBaseUrl;
      const robot = loader.parse(urdfText, assetBaseUrl);
      robot.name = robot.robotName || "robot";
      robot.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      scene.add(robot);
      robotRef.current = robot;
      requestAnimationFrame(() => {
        resetCamera();
        onStatus?.("ready");
      });
    } catch (error) {
      onStatus?.("error", error.message || "URDF 渲染失败");
    }
  }, [urdfText, assetBaseUrl, onStatus]);

  useEffect(() => {
    const robot = robotRef.current;
    if (!robot) return;
    Object.entries(jointValues || {}).forEach(([name, value]) => {
      robot.setJointValue?.(name, ...(Array.isArray(value) ? value : [value]));
    });
    robot.position.set(basePose.x, basePose.y, basePose.z);
    robot.rotation.set(basePose.roll, basePose.pitch, basePose.yaw, "XYZ");
    robot.updateMatrixWorld(true);
    const link = robot.links?.[selectedLink];
    if (link) onPose?.(poseOf(link));
  }, [jointValues, basePose, selectedLink, onPose]);

  return (
    <div className="sim-viewport" ref={hostRef}>
      <div className="sim-viewport-hint">左键旋转 · 右键平移 · 滚轮缩放</div>
      <div className="sim-axis-legend"><i className="x"></i>X <i className="y"></i>Y <i className="z"></i>Z</div>
    </div>
  );
});

export default RobotViewport;
