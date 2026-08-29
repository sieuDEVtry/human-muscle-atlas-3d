import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bounds, OrbitControls, useCursor, useGLTF, useProgress } from "@react-three/drei";
import { Activity, Hand, Info, MousePointer2, Rotate3D, X } from "lucide-react";
import * as THREE from "three";

const MUSCLE_GROUPS = [
  {
    id: "abs", label: "Bụng", latin: "Musculi abdominis", index: "01",
    summary: "Nhóm cơ thành bụng trước và bên, tạo nên vùng lõi giúp giữ ổn định thân mình.",
    facts: [
      { title: "Cơ thẳng bụng", body: "Chạy dọc hai bên đường trắng bụng; tham gia gập thân về phía trước." },
      { title: "Cơ chéo bụng ngoài", body: "Lớp cơ nông ở hai bên, hỗ trợ xoay và nghiêng thân mình." },
      { title: "Vai trò chính", body: "Ổn định cột sống, duy trì áp lực ổ bụng và hỗ trợ hô hấp chủ động." },
    ],
  },
  {
    id: "thigh", label: "Đùi", latin: "Musculi femoris", index: "02",
    summary: "Tập hợp các cơ lớn quanh xương đùi, tạo lực cho khớp háng và khớp gối.",
    facts: [
      { title: "Nhóm tứ đầu", body: "Gồm cơ thẳng đùi và ba cơ rộng; chịu trách nhiệm chính khi duỗi gối." },
      { title: "Cơ nhị đầu đùi", body: "Nằm phía sau ngoài đùi, giúp gập gối và hỗ trợ duỗi khớp háng." },
      { title: "Vai trò chính", body: "Tạo lực khi đi, chạy, bật nhảy và kiểm soát cơ thể khi hạ trọng tâm." },
    ],
  },
  {
    id: "shoulder", label: "Vai", latin: "Musculus deltoideus", index: "03",
    summary: "Khối cơ delta bao quanh khớp vai, tạo đường nét vai và điều khiển cánh tay theo nhiều hướng.",
    facts: [
      { title: "Bó trước", body: "Xuất phát từ xương đòn; hỗ trợ đưa cánh tay ra trước và xoay trong." },
      { title: "Bó giữa", body: "Bám từ mỏm cùng vai; là thành phần chính khi dạng cánh tay sang bên." },
      { title: "Bó sau", body: "Xuất phát từ gai vai; đưa cánh tay ra sau và hỗ trợ xoay ngoài." },
    ],
  },
  {
    id: "arm", label: "Bắp tay", latin: "Musculi brachii", index: "04",
    summary: "Nhóm cơ mặt trước và sau cánh tay, phối hợp để gập hoặc duỗi khuỷu tay.",
    facts: [
      { title: "Cơ nhị đầu cánh tay", body: "Hai đầu cơ hội tụ ở cẳng tay; gập khuỷu và xoay ngửa cẳng tay." },
      { title: "Cơ tam đầu cánh tay", body: "Ba đầu cơ ở mặt sau cánh tay; là cơ duỗi khuỷu chính." },
      { title: "Cơ cánh tay", body: "Nằm sâu dưới cơ nhị đầu và tạo lực gập khuỷu ổn định ở nhiều tư thế." },
    ],
  },
  {
    id: "chest", label: "Ngực", latin: "Musculus pectoralis major", index: "05",
    summary: "Cơ ngực lớn phủ mặt trước lồng ngực và nối thân mình với xương cánh tay.",
    facts: [
      { title: "Đầu đòn", body: "Phần trên của cơ ngực, hỗ trợ đưa cánh tay lên trước." },
      { title: "Đầu ức–sườn", body: "Phần lớn nhất, khép cánh tay và kéo cánh tay từ tư thế nâng xuống." },
      { title: "Vai trò chính", body: "Khép và xoay trong cánh tay; tham gia các động tác đẩy và ôm." },
    ],
  },
  {
    id: "glutes", label: "Mông", latin: "Musculi glutei", index: "06",
    summary: "Ba lớp cơ vùng mông ổn định khung chậu và tạo lực mạnh cho chuyển động khớp háng.",
    facts: [
      { title: "Cơ mông lớn", body: "Lớp nông và lớn nhất; tạo lực duỗi háng khi đứng lên hoặc leo dốc." },
      { title: "Cơ mông nhỡ", body: "Ổn định khung chậu khi đứng một chân và dạng đùi sang bên." },
      { title: "Cơ mông bé", body: "Nằm sâu dưới cơ mông nhỡ; hỗ trợ dạng và xoay trong đùi." },
    ],
  },
];

function groupFromObject(object) {
  let current = object;
  while (current) {
    const prefix = current.name?.split("__")[0];
    if (MUSCLE_GROUPS.some((group) => group.id === prefix)) return prefix;
    current = current.parent;
  }
  return null;
}

function AnatomyModel({ hovered, onHover, onSelect }) {
  const { scene } = useGLTF("./models/human-muscles.glb");
  const invalidate = useThree((state) => state.invalidate);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!object.isMesh) return;
      object.material = object.material.clone();
      object.material.side = THREE.DoubleSide;
      object.material.metalness = 0;
      object.material.roughness = 0.68;
      const group = groupFromObject(object);
      const baseColor = group ? "#a72c35" : "#711e27";
      object.material.color.set(baseColor);
      object.userData.baseColor = new THREE.Color(baseColor);
    });
    return clone;
  }, [scene]);

  useCursor(Boolean(hovered));

  useEffect(() => {
    model.traverse((object) => {
      if (!object.isMesh) return;
      const group = groupFromObject(object);
      const active = group && group === hovered;
      object.material.color.copy(object.userData.baseColor);
      object.material.emissive.set(active ? "#ff554d" : "#160204");
      object.material.emissiveIntensity = active ? 0.78 : 0.1;
      object.material.roughness = active ? 0.48 : 0.68;
    });
    invalidate();
  }, [hovered, invalidate, model]);

  return (
    <primitive
      object={model}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(groupFromObject(event.object));
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event) => {
        const group = groupFromObject(event.object);
        if (!group) return;
        event.stopPropagation();
        onSelect(group);
      }}
    />
  );
}

function ProjectionTracker({ anchors, leaderRefs, svgRef }) {
  useFrame(({ camera, size }) => {
    svgRef.current?.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
    anchors.forEach((anchor, index) => {
      const point = anchor.clone().project(camera);
      const x = Math.round((point.x * 0.5 + 0.5) * size.width);
      const y = Math.round((-point.y * 0.5 + 0.5) * size.height);
      const endY = size.height * ((index + 1) / 4);
      const refs = leaderRefs.current[index];
      if (!refs) return;
      refs.line?.setAttribute("points", `${x},${y} ${size.width * 0.82},${endY} ${size.width},${endY}`);
      refs.outer?.setAttribute("cx", x);
      refs.outer?.setAttribute("cy", y);
      refs.inner?.setAttribute("cx", x);
      refs.inner?.setAttribute("cy", y);
      refs.group?.classList.toggle("is-behind", point.z > 1);
    });
  });
  return null;
}

function DetailModel({ groupId, leaderRefs, svgRef }) {
  const { scene } = useGLTF(`./models/groups/${groupId}.glb`);
  const invalidate = useThree((state) => state.invalidate);
  const { model, anchors } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3();

    clone.traverse((object) => {
      if (!object.isMesh) return;
      object.material = object.material.clone();
      object.material.color.set("#bc303a");
      object.material.emissive.set("#260306");
      object.material.emissiveIntensity = 0.2;
      object.material.metalness = 0;
      object.material.roughness = 0.62;
      object.material.side = THREE.DoubleSide;
    });

    clone.updateMatrixWorld(true);
    clone.traverse((object) => object.isMesh && box.expandByObject(object));

    const size = box.getSize(new THREE.Vector3());
    const min = box.min;
    const positions = [
      new THREE.Vector3(min.x + size.x * 0.32, min.y + size.y * 0.73, min.z + size.z * 0.55),
      new THREE.Vector3(min.x + size.x * 0.63, min.y + size.y * 0.5, min.z + size.z * 0.48),
      new THREE.Vector3(min.x + size.x * 0.42, min.y + size.y * 0.25, min.z + size.z * 0.52),
    ];
    return { model: clone, anchors: positions };
  }, [scene]);

  useEffect(() => invalidate(), [invalidate, model]);

  return (
    <>
      <Bounds fit clip margin={1.28}>
        <primitive object={model} />
      </Bounds>
      <ProjectionTracker anchors={anchors} leaderRefs={leaderRefs} svgRef={svgRef} />
    </>
  );
}

function DetailModal({ group, onClose }) {
  const svgRef = useRef(null);
  const leaderRefs = useRef([]);

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
          <div className="detail-visual">
            <Suspense fallback={<div className="detail-loading"><Activity size={17} /> Đang tải nhóm cơ…</div>}>
              <Canvas frameloop="demand" dpr={[1, 1.35]} camera={{ fov: 36, near: 0.01, far: 1000 }} gl={{ antialias: true, alpha: true }}>
                <hemisphereLight intensity={1.8} color="#ffe2d6" groundColor="#241013" />
                <directionalLight position={[3, 6, 7]} intensity={3.7} color="#ffd4c7" />
                <directionalLight position={[-4, -1, -5]} intensity={1.8} color="#9b4f68" />
                <DetailModel groupId={group.id} leaderRefs={leaderRefs} svgRef={svgRef} />
                <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} rotateSpeed={0.75} minPolarAngle={0.28} maxPolarAngle={Math.PI - 0.28} />
              </Canvas>
            </Suspense>

            <svg
              ref={svgRef}
              className="leader-lines"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {[0, 1, 2].map((index) => (
                <g key={index} ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], group: node }; }}>
                  <polyline ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], line: node }; }} />
                  <circle ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], outer: node }; }} r="5" />
                  <circle ref={(node) => { leaderRefs.current[index] = { ...leaderRefs.current[index], inner: node }; }} className="leader-core" r="2" />
                </g>
              ))}
            </svg>

            <div className="detail-rotate-hint"><Rotate3D size={17} /> Kéo để xoay 360°</div>
            <div className="detail-axis">360°</div>
          </div>

          <aside className="detail-info">
            <p className="detail-summary">{group.summary}</p>
            <div className="fact-list">
              {group.facts.map((fact, index) => (
                <article className="fact-card" key={fact.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{fact.title}</h3><p>{fact.body}</p></div>
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
            <span><strong>Kéo để xoay 360°</strong><small>Cuộn để phóng to · thu nhỏ</small></span>
          </div>
        </div>

        <div className="model-stage" aria-label="Mô hình 3D cơ thể người">
          <div className="stage-label"><span>ANTERIOR</span><i /><span>POSTERIOR</span></div>
          <Suspense fallback={<LoadingStatus />}>
            <Canvas frameloop="demand" dpr={[1, 1.35]} camera={{ fov: 31, near: 0.01, far: 1000 }} gl={{ antialias: true, alpha: true }}>
              <hemisphereLight intensity={1.5} color="#ffe1d8" groundColor="#1b090d" />
              <directionalLight position={[4, 7, 6]} intensity={3.2} color="#ffd7c9" />
              <directionalLight position={[-5, 1, -3]} intensity={1.7} color="#bc7890" />
              <Bounds fit clip margin={1.12}>
                <AnatomyModel hovered={hovered} onHover={setHovered} onSelect={setSelected} />
              </Bounds>
              <OrbitControls
                makeDefault
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                rotateSpeed={0.7}
                minPolarAngle={Math.PI / 2 - 0.22}
                maxPolarAngle={Math.PI / 2 + 0.22}
                minDistance={0.4}
                maxDistance={12}
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

      <footer className="credit">Mô hình: BodyParts3D &amp; Z-Anatomy · CC BY-SA</footer>
      {selectedGroup && <DetailModal group={selectedGroup} onClose={() => setSelected(null)} />}
    </main>
  );
}

useGLTF.preload("./models/human-muscles.glb");
