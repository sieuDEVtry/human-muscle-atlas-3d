import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useCursor, useGLTF, useProgress } from "@react-three/drei";
import { Activity, Hand, Info, MousePointer2, Rotate3D, X } from "lucide-react";
import * as THREE from "three";
import { MUSCLE_GROUPS, annotationMatchesName, classifyMuscleName } from "./anatomy-data.js";

const GROUP_IDS = new Set(MUSCLE_GROUPS.map((group) => group.id));
const HUMAN_MODEL_URL = "./models/human-muscles.glb";

function groupFromObject(object) {
  let current = object;
  while (current) {
    const semanticGroup = classifyMuscleName(current.name);
    if (semanticGroup) return semanticGroup;

    const prefix = current.name?.split("__")[0];
    if (GROUP_IDS.has(prefix)) return prefix;
    current = current.parent;
  }
  return null;
}

function normalizeAroundOrigin(object, targetSize) {
  object.updateMatrixWorld(true);
  const sourceBounds = new THREE.Box3().setFromObject(object);
  const center = sourceBounds.getCenter(new THREE.Vector3());
  const size = sourceBounds.getSize(new THREE.Vector3());
  const largestAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / largestAxis;
  const wrapper = new THREE.Group();
  wrapper.add(object);
  wrapper.scale.setScalar(scale);
  wrapper.position.copy(center).multiplyScalar(-scale);
  wrapper.updateMatrixWorld(true);
  return wrapper;
}

function isolateRectusAbdominis(geometry) {
  if (!geometry?.index || geometry.userData?.rectusIsolated) return geometry;

  const index = geometry.index.array;
  const position = geometry.attributes.position;
  const vertexCount = position.count;
  const parent = new Int32Array(vertexCount);
  for (let vertex = 0; vertex < vertexCount; vertex += 1) parent[vertex] = vertex;

  const find = (value) => {
    let root = value;
    while (parent[root] !== root) root = parent[root];
    while (parent[value] !== value) {
      const next = parent[value];
      parent[value] = root;
      value = next;
    }
    return root;
  };

  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };

  for (let offset = 0; offset < index.length; offset += 3) {
    union(index[offset], index[offset + 1]);
    union(index[offset + 1], index[offset + 2]);
  }

  const stats = new Map();
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const root = find(vertex);
    const x = position.getX(vertex);
    const z = position.getZ(vertex);
    const stat = stats.get(root) || { root, count: 0, sumX: 0, minZ: Infinity, maxZ: -Infinity };
    stat.count += 1;
    stat.sumX += x;
    stat.minZ = Math.min(stat.minZ, z);
    stat.maxZ = Math.max(stat.maxZ, z);
    stats.set(root, stat);
  }

  const components = [...stats.values()]
    .map((stat) => ({ ...stat, centerX: stat.sumX / stat.count, verticalSpan: stat.maxZ - stat.minZ }))
    .filter((stat) => stat.count > 20);

  const bestOnSide = (sign) => components
    .filter((stat) => Math.sign(stat.centerX) === sign)
    .sort((a, b) => b.verticalSpan - a.verticalSpan || Math.abs(a.centerX) - Math.abs(b.centerX))[0];

  const selected = [bestOnSide(-1), bestOnSide(1)].filter(Boolean);
  if (selected.length < 2) {
    selected.splice(0, selected.length, ...components.sort((a, b) => b.verticalSpan - a.verticalSpan).slice(0, 2));
  }
  if (!selected.length) return geometry;

  const selectedRoots = new Set(selected.map((stat) => stat.root));
  const kept = [];
  for (let offset = 0; offset < index.length; offset += 3) {
    if (selectedRoots.has(find(index[offset]))) {
      kept.push(index[offset], index[offset + 1], index[offset + 2]);
    }
  }

  const isolated = geometry.clone();
  isolated.setIndex(kept);
  isolated.computeBoundingBox();
  isolated.computeBoundingSphere();
  isolated.userData = { ...geometry.userData, rectusIsolated: true };
  return isolated;
}

function createMuscleMaterial(detail = false) {
  return new THREE.MeshPhysicalMaterial({
    color: detail ? "#c7655e" : "#92564f",
    emissive: detail ? "#250708" : "#120506",
    emissiveIntensity: detail ? 0.14 : 0.08,
    roughness: detail ? 0.54 : 0.62,
    metalness: 0,
    clearcoat: detail ? 0.2 : 0.16,
    clearcoatRoughness: detail ? 0.72 : 0.76,
  });
}

function AnatomyModel({ hovered, onHover, onSelect }) {
  const { scene } = useGLTF(HUMAN_MODEL_URL);
  const invalidate = useThree((state) => state.invalidate);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!object.isMesh) return;
      const group = groupFromObject(object);
      if (group === "abs") object.geometry = isolateRectusAbdominis(object.geometry);
      object.material = createMuscleMaterial(false);
      object.userData.baseColor = object.material.color.clone();
      object.userData.muscleGroup = group;

      if (group) {
        object.material.polygonOffset = true;
        object.material.polygonOffsetFactor = -2;
        object.material.polygonOffsetUnits = -2;
        object.renderOrder = 2;
      } else {
        object.raycast = () => null;
        object.renderOrder = 1;
      }
    });
    return normalizeAroundOrigin(clone, 4.15);
  }, [scene]);

  useCursor(Boolean(hovered));

  useEffect(() => {
    model.traverse((object) => {
      if (!object.isMesh) return;
      const group = object.userData.muscleGroup;
      const active = group && group === hovered;
      object.material.color.copy(object.userData.baseColor);
      object.material.emissive.set(active ? "#ff6d61" : "#120506");
      object.material.emissiveIntensity = active ? 0.82 : 0.08;
      object.material.roughness = active ? 0.44 : 0.62;
    });
    invalidate();
  }, [hovered, invalidate, model]);

  return (
    <primitive
      object={model}
      onPointerOver={(event) => {
        const group = event.object.userData.muscleGroup || groupFromObject(event.object);
        if (!group) return;
        event.stopPropagation();
        onHover(group);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onHover(null);
      }}
      onClick={(event) => {
        const group = event.object.userData.muscleGroup || groupFromObject(event.object);
        if (!group) return;
        event.stopPropagation();
        onSelect(group);
      }}
    />
  );
}

function meshMatchesAnnotation(mesh, annotation) {
  let current = mesh;
  while (current) {
    if (annotationMatchesName(annotation, current.name)) return true;
    current = current.parent;
  }
  return false;
}

function boxFromMeshes(meshes) {
  const box = new THREE.Box3();
  meshes.forEach((mesh) => box.expandByObject(mesh));
  return box;
}

function normalizedBoxPoint(box, [nx, ny, nz]) {
  const center = box.getCenter(new THREE.Vector3());
  const half = box.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  return center.add(new THREE.Vector3(nx * half.x, ny * half.y, nz * half.z));
}

function closestVertex(meshes, target) {
  const best = new THREE.Vector3();
  const local = new THREE.Vector3();
  let bestDistance = Number.POSITIVE_INFINITY;

  meshes.forEach((mesh) => {
    const position = mesh.geometry?.attributes?.position;
    if (!position) return;
    const step = Math.max(1, Math.ceil(position.count / 6500));
    for (let index = 0; index < position.count; index += step) {
      local.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);
      const distance = local.distanceToSquared(target);
      if (distance < bestDistance) {
        bestDistance = distance;
        best.copy(local);
      }
    }
  });

  return Number.isFinite(bestDistance) ? best : target.clone();
}

function buildDetailGeometry(scene, group) {
  const clone = scene.clone(true);
  const toRemove = [];

  clone.traverse((object) => {
    if (!object.isMesh) return;
    if (groupFromObject(object) !== group.id) {
      toRemove.push(object);
      return;
    }
    if (group.id === "abs") object.geometry = isolateRectusAbdominis(object.geometry);
    object.material = createMuscleMaterial(true);
  });

  toRemove.forEach((object) => object.parent?.remove(object));
  const normalizedModel = normalizeAroundOrigin(clone, 3.15);
  normalizedModel.updateMatrixWorld(true);

  const allMeshes = [];
  normalizedModel.traverse((object) => object.isMesh && allMeshes.push(object));
  const wholeBox = boxFromMeshes(allMeshes);

  const anchors = group.annotations.map((annotation) => {
    const namedMeshes = allMeshes.filter((mesh) => meshMatchesAnnotation(mesh, annotation));
    const candidates = namedMeshes.length ? namedMeshes : allMeshes;
    const targetBox = namedMeshes.length ? boxFromMeshes(namedMeshes) : wholeBox;
    const target = normalizedBoxPoint(targetBox, annotation.anchor);
    return closestVertex(candidates, target);
  });

  return { model: normalizedModel, anchors };
}

function ProjectionTracker({ anchors, model, leaderRefs, svgRef, visualRef, factRefs }) {
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, size }) => {
    svgRef.current?.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
    const mobile = size.width < 680;
    const visualRect = visualRef.current?.getBoundingClientRect();

    anchors.forEach((anchor, index) => {
      const projected = anchor.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const refs = leaderRefs.current[index];
      if (!refs) return;

      let endX;
      let endY;
      let kneeX;
      let kneeY;

      if (mobile) {
        endX = size.width * ((index + 1) / 4);
        endY = size.height - 24;
        kneeX = x + (endX - x) * 0.58;
        kneeY = Math.max(y + 12, endY - 38);
      } else {
        const factRect = factRefs.current[index]?.getBoundingClientRect();
        endX = size.width - 1;
        endY = factRect && visualRect
          ? THREE.MathUtils.clamp(factRect.top + factRect.height * 0.5 - visualRect.top, 22, size.height - 22)
          : size.height * ((index + 1) / 4);
        kneeX = size.width * 0.84;
        kneeY = endY;
      }

      refs.line?.setAttribute("points", `${x},${y} ${kneeX},${kneeY} ${endX},${endY}`);
      refs.outer?.setAttribute("cx", x);
      refs.outer?.setAttribute("cy", y);
      refs.inner?.setAttribute("cx", x);
      refs.inner?.setAttribute("cy", y);
      refs.end?.setAttribute("cx", endX);
      refs.end?.setAttribute("cy", endY);
      refs.label?.setAttribute("x", mobile ? endX : endX - 11);
      refs.label?.setAttribute("y", mobile ? endY - 10 : endY - 8);

      direction.copy(anchor).sub(camera.position);
      const anchorDistance = direction.length();
      raycaster.set(camera.position, direction.normalize());
      const occluded = raycaster
        .intersectObject(model, true)
        .some((hit) => hit.distance < anchorDistance - 0.035);

      refs.group?.classList.toggle("is-behind", occluded);
      refs.group?.classList.toggle("is-mobile-route", mobile);
    });
  });

  return null;
}

function DetailModel({ group, leaderRefs, svgRef, visualRef, factRefs }) {
  const { scene } = useGLTF(HUMAN_MODEL_URL);
  const invalidate = useThree((state) => state.invalidate);
  const { model, anchors } = useMemo(() => buildDetailGeometry(scene, group), [scene, group]);

  useEffect(() => invalidate(), [invalidate, model]);

  return (
    <>
      <primitive object={model} />
      <ProjectionTracker
        anchors={anchors}
        model={model}
        leaderRefs={leaderRefs}
        svgRef={svgRef}
        visualRef={visualRef}
        factRefs={factRefs}
      />
    </>
  );
}

function DetailLoading({ label }) {
  return (
    <div className="detail-loading" role="status" aria-live="polite">
      <span className="detail-loader-ring" aria-hidden="true" />
      <div>
        <small>ĐANG TẢI MÔ HÌNH 3D</small>
        <strong>{label}</strong>
        <p>Đang chuẩn bị cấu trúc giải phẫu…</p>
      </div>
    </div>
  );
}

function DetailModal({ group, onClose }) {
  const svgRef = useRef(null);
  const visualRef = useRef(null);
  const leaderRefs = useRef([]);
  const factRefs = useRef([]);
  const initialCamera = group.initialView === "posterior" ? [0, 0, -5.8] : [0, 0, 5.8];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="detail-header">
          <div>
            <span>NHÓM CƠ {group.index}</span>
            <h2 id="detail-title">{group.label}</h2>
            <p>{group.latin}</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Đóng cửa sổ chi tiết" autoFocus>
            <X size={20} />
          </button>
        </header>

        <div className="detail-layout">
          <div className="detail-visual" ref={visualRef}>
            <Suspense fallback={<DetailLoading label={group.label} />}>
              <Canvas
                frameloop="demand"
                dpr={[1, 1.35]}
                camera={{ position: initialCamera, fov: 36, near: 0.1, far: 100 }}
                gl={{ antialias: true, alpha: true }}
              >
                <hemisphereLight intensity={2.15} color="#fff2e9" groundColor="#211418" />
                <directionalLight position={[3, 6, 7]} intensity={3.25} color="#ffe2d5" />
                <directionalLight position={[-4, -1, -5]} intensity={1.5} color="#8f8294" />
                <DetailModel
                  group={group}
                  leaderRefs={leaderRefs}
                  svgRef={svgRef}
                  visualRef={visualRef}
                  factRefs={factRefs}
                />
                <OrbitControls
                  makeDefault
                  target={[0, 0, 0]}
                  enablePan={false}
                  enableDamping
                  dampingFactor={0.08}
                  rotateSpeed={0.75}
                  minDistance={3.7}
                  maxDistance={8}
                  minPolarAngle={0.28}
                  maxPolarAngle={Math.PI - 0.28}
                />
              </Canvas>
            </Suspense>

            <svg ref={svgRef} className="leader-lines" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
              {group.annotations.map((annotation, index) => (
                <g key={annotation.title} ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], group: node }; }}>
                  <polyline ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], line: node }; }} />
                  <circle ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], outer: node }; }} r="5" />
                  <circle ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], inner: node }; }} className="leader-core" r="2" />
                  <circle ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], end: node }; }} className="leader-end" r="3.5" />
                  <text ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], label: node }; }} className="leader-index">
                    {String(index + 1).padStart(2, "0")}
                  </text>
                </g>
              ))}
            </svg>

            <div className="detail-rotate-hint"><Rotate3D size={17} /> Kéo để xoay 360°</div>
            <div className="detail-axis">360°</div>
          </div>

          <aside className="detail-info">
            <p className="detail-summary">{group.summary}</p>
            <div className="fact-list">
              {group.annotations.map((annotation, index) => (
                <article
                  className="fact-card"
                  key={annotation.title}
                  ref={(node) => { factRefs.current[index] = node; }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{annotation.title}</h3><p>{annotation.body}</p></div>
                </article>
              ))}
            </div>
            <div className="medical-note"><Info size={14} /> Nội dung phục vụ mục đích tham khảo giải phẫu.</div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function LoadingStatus() {
  const { progress } = useProgress();
  return (
    <div className="loading-status" role="status" aria-live="polite">
      <Activity size={17} />
      <span>Đang dựng mô hình</span>
      <strong>{Math.round(progress)}%</strong>
    </div>
  );
}

export default function App() {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const selectedGroup = MUSCLE_GROUPS.find((group) => group.id === selected);

  return (
    <main className="atlas-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Muscle Atlas — trang chủ">
          <span className="brand-mark"><Activity size={17} /></span>
          <span><strong>MUSCLE</strong> ATLAS</span>
        </a>
        <div className="topbar-note"><span /> Mô hình giải phẫu tương tác</div>
      </header>

      <section className="workspace" id="top">
        <div className="intro-panel">
          <p className="eyebrow">GIẢI PHẪU CƠ THỂ NGƯỜI · 3D</p>
          <h1>Khám phá<br />hệ cơ <em>từ mọi góc.</em></h1>
          <p className="lede">Xoay mô hình, di chuột để nhận diện và chọn một nhóm cơ để xem cấu trúc chi tiết.</p>

          <div className="muscle-list" aria-label="Danh sách nhóm cơ">
            {MUSCLE_GROUPS.map((group) => (
              <button
                className={hovered === group.id ? "muscle-chip active" : "muscle-chip"}
                key={group.id}
                onMouseEnter={() => setHovered(group.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(group.id)}
                onBlur={() => setHovered(null)}
                onClick={() => setSelected(group.id)}
                type="button"
              >
                <span>{group.index}</span>{group.label}<MousePointer2 size={15} />
              </button>
            ))}
          </div>

          <div className="interaction-hint">
            <Hand size={19} />
            <span><strong>Kéo để xoay 180°</strong><small>Cuộn để phóng to · thu nhỏ</small></span>
          </div>
        </div>

        <div className="model-stage" aria-label="Mô hình 3D cơ thể người">
          <div className="stage-label"><span>ANTERIOR</span><i /><span>POSTERIOR</span></div>
          <Suspense fallback={<LoadingStatus />}>
            <Canvas frameloop="demand" dpr={[1, 1.35]} camera={{ position: [0, 0, 8.5], fov: 31, near: 0.1, far: 100 }} gl={{ antialias: true, alpha: true }}>
              <hemisphereLight intensity={2.05} color="#fff1e9" groundColor="#221318" />
              <directionalLight position={[4, 7, 6]} intensity={2.9} color="#ffe0d4" />
              <directionalLight position={[-5, 1, -3]} intensity={1.35} color="#918497" />
              <AnatomyModel hovered={hovered} onHover={setHovered} onSelect={setSelected} />
              <OrbitControls
                makeDefault
                target={[0, 0, 0]}
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                rotateSpeed={0.7}
                minPolarAngle={Math.PI / 2 - 0.22}
                maxPolarAngle={Math.PI / 2 + 0.22}
                minAzimuthAngle={-Math.PI}
                maxAzimuthAngle={0}
                minDistance={6}
                maxDistance={11}
              />
            </Canvas>
          </Suspense>
          <div className="stage-floor" />
        </div>

        <aside className="side-note" aria-hidden="true">
          <span>01—06</span>
          <p>Sáu vùng cơ chính</p>
        </aside>
      </section>

      <footer className="credit">Mô hình giải phẫu 3D do chủ dự án cung cấp</footer>
      {selectedGroup && <DetailModal group={selectedGroup} onClose={() => setSelected(null)} />}
    </main>
  );
}

useGLTF.preload(HUMAN_MODEL_URL);
