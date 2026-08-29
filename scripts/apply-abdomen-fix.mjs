import fs from "node:fs";

const appPath = "src/App.jsx";
const dataPath = "src/anatomy-data.js";

let app = fs.readFileSync(appPath, "utf8");
let data = fs.readFileSync(dataPath, "utf8");

function assertFound(condition, message) {
  if (!condition) throw new Error(message);
}

const oldFunctionStart = app.indexOf("function isolateRectusAbdominis(geometry) {");
const oldFunctionEnd = app.indexOf("\nfunction createMuscleMaterial", oldFunctionStart);
assertFound(oldFunctionStart >= 0 && oldFunctionEnd > oldFunctionStart, "Could not find old rectus isolation function");

const abdomenFunction = `function extractAbdominalRegion(geometry) {
  if (!geometry?.index || geometry.userData?.abdomenRegion) return geometry;

  const index = geometry.index.array;
  const position = geometry.attributes.position;
  const kept = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let offset = 0; offset < index.length; offset += 3) {
    const ia = index[offset];
    const ib = index[offset + 1];
    const ic = index[offset + 2];
    a.fromBufferAttribute(position, ia);
    b.fromBufferAttribute(position, ib);
    c.fromBufferAttribute(position, ic);

    const x = (a.x + b.x + c.x) / 3;
    const y = (a.y + b.y + c.y) / 3;
    const z = (a.z + b.z + c.z) / 3;

    // Z is head-to-foot in the source mesh; +Y is anterior. Select the
    // visible abdominal wall below the pectorals and above the upper pelvis,
    // including the central rectus and superficial oblique region on both sides.
    if (z < -2.18 || z > 0.62 || Math.abs(x) > 1.24 || y < -0.06) continue;

    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac).normalize();
    if (normal.y < -0.28) continue;

    kept.push(ia, ib, ic);
  }

  if (!kept.length) return geometry;

  const abdomen = geometry.clone();
  abdomen.setIndex(kept);
  abdomen.clearGroups();
  abdomen.computeBoundingBox();
  abdomen.computeBoundingSphere();
  abdomen.userData = { ...geometry.userData, abdomenRegion: true };
  return abdomen;
}
`;

app = app.slice(0, oldFunctionStart) + abdomenFunction + app.slice(oldFunctionEnd);

const anatomyModelOld = `  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!object.isMesh) return;
      const group = groupFromObject(object);
      if (group === "abs") object.geometry = isolateRectusAbdominis(object.geometry);
`;
const anatomyModelNew = `  const model = useMemo(() => {
    const clone = scene.clone(true);
    const bodySource = clone.getObjectByName("body__muscular_study");
    const abdominalGeometry = bodySource?.geometry ? extractAbdominalRegion(bodySource.geometry) : null;

    clone.traverse((object) => {
      if (!object.isMesh) return;
      const group = groupFromObject(object);
      if (group === "abs" && abdominalGeometry) object.geometry = abdominalGeometry.clone();
`;
assertFound(app.includes(anatomyModelOld), "Could not find AnatomyModel abs block");
app = app.replace(anatomyModelOld, anatomyModelNew);

const detailOld = `function buildDetailGeometry(scene, group) {
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
`;
const detailNew = `function buildDetailGeometry(scene, group) {
  const clone = scene.clone(true);
  const toRemove = [];
  const bodySource = clone.getObjectByName("body__muscular_study");
  const abdominalGeometry = group.id === "abs" && bodySource?.geometry
    ? extractAbdominalRegion(bodySource.geometry)
    : null;

  clone.traverse((object) => {
    if (!object.isMesh) return;
    if (groupFromObject(object) !== group.id) {
      toRemove.push(object);
      return;
    }
    if (group.id === "abs" && abdominalGeometry) object.geometry = abdominalGeometry.clone();
    object.material = createMuscleMaterial(true);
  });
`;
assertFound(app.includes(detailOld), "Could not find detail abs block");
app = app.replace(detailOld, detailNew);

const rotationOld = `                minAzimuthAngle={-Math.PI}
                maxAzimuthAngle={0}`;
const rotationNew = `                minAzimuthAngle={-Math.PI / 2}
                maxAzimuthAngle={Math.PI / 2}`;
assertFound(app.includes(rotationOld), "Could not find one-sided rotation limits");
app = app.replace(rotationOld, rotationNew);

const absStart = data.indexOf('  {\n    id: "abs",');
const thighStart = data.indexOf('  {\n    id: "thigh",', absStart);
assertFound(absStart >= 0 && thighStart > absStart, "Could not locate abdominal data block");
const abdomenData = `  {
    id: "abs",
    label: "Bụng",
    latin: "Musculi abdominis",
    index: "01",
    summary: "Vùng bụng tương tác bao phủ thành bụng trước từ bờ sườn xuống vùng chậu, gồm cơ thẳng bụng ở giữa và các cơ chéo bụng ở hai bên.",
    annotations: [
      {
        title: "Cơ thẳng bụng",
        body: "Cặp cơ dọc ở giữa thành bụng trước, được chia bởi các giao gân thành những múi cơ thường gọi là six-pack.",
        match: ["abs__selectable"],
        anchor: [-0.18, 0.2, 0.94],
      },
      {
        title: "Cơ chéo bụng ngoài",
        body: "Lớp cơ nông ở hai bên thành bụng; các thớ chạy chếch xuống dưới và vào trong, hỗ trợ xoay và nghiêng thân.",
        match: ["abs__selectable"],
        anchor: [0.76, 0.08, 0.58],
      },
      {
        title: "Vùng bụng dưới",
        body: "Phần dưới của thành bụng tiếp tục về vùng mu và chậu, góp phần ổn định thân mình và duy trì áp lực ổ bụng.",
        match: ["abs__selectable"],
        anchor: [-0.2, -0.68, 0.9],
      },
    ],
  },
`;
data = data.slice(0, absStart) + abdomenData + data.slice(thighStart);

assertFound(!app.includes("isolateRectusAbdominis"), "Old rectus-only logic still present");
assertFound(app.includes("extractAbdominalRegion"), "Abdominal region extractor missing");
assertFound(app.includes("minAzimuthAngle={-Math.PI / 2}"), "Left rotation limit missing");
assertFound(app.includes("maxAzimuthAngle={Math.PI / 2}"), "Right rotation limit missing");
assertFound(data.includes('latin: "Musculi abdominis"'), "Abdominal group data missing");

fs.writeFileSync(appPath, app);
fs.writeFileSync(dataPath, data);
console.log("Applied abdominal region + symmetric rotation fix");
