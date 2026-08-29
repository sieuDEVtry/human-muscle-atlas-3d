import assert from "node:assert/strict";
import { MUSCLE_GROUPS, classifyMuscleName } from "../src/anatomy-data.js";

assert.equal(MUSCLE_GROUPS.length, 6, "Phải có đúng 6 nhóm cơ chính");
assert.equal(new Set(MUSCLE_GROUPS.map((group) => group.id)).size, 6, "ID nhóm cơ phải duy nhất");

for (const group of MUSCLE_GROUPS) {
  assert.equal(group.annotations.length, 3, `${group.id} phải có đúng 3 annotation`);
  for (const annotation of group.annotations) {
    assert.equal(annotation.anchor.length, 3, `${group.id}/${annotation.title}: anchor phải là vec3`);
    assert(annotation.anchor.every((value) => value >= -1 && value <= 1), `${group.id}/${annotation.title}: anchor phải nằm trong [-1, 1]`);
    assert(annotation.match.length > 0, `${group.id}/${annotation.title}: thiếu tên mesh mục tiêu`);
  }
}

const samples = new Map([
  ["Rectus_abdominis", "abs"],
  ["Musculus obliquus externus abdominis", "abs"],
  ["Gluteus_maximus_L", "glutes"],
  ["Pectoralis-major-right", "chest"],
  ["Deltoideus posterior", "shoulder"],
  ["Biceps_brachii_L", "arm"],
  ["Triceps brachii", "arm"],
  ["Biceps_femoris_L", "thigh"],
  ["Vastus lateralis", "thigh"],
]);

for (const [name, expected] of samples) {
  assert.equal(classifyMuscleName(name), expected, `${name} phải thuộc ${expected}`);
}

assert.notEqual(classifyMuscleName("Biceps_femoris_L"), "arm", "Không được nhầm biceps femoris với bắp tay");
console.log("Anatomy validation: OK");
