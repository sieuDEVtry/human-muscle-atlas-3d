export const MUSCLE_GROUPS = [
  {
    id: "abs",
    label: "Bụng",
    latin: "Musculus rectus abdominis",
    index: "01",
    summary: "Vùng bụng tương tác tập trung vào cơ thẳng bụng — cặp cơ dọc ở thành bụng trước tạo hình ảnh “six-pack” quen thuộc.",
    annotations: [
      {
        title: "Phần trên",
        body: "Đầu trên bám vào mỏm mũi kiếm và sụn sườn 5–7; đây là vùng cơ ngay dưới bờ lồng ngực.",
        match: ["rectus abdominis", "rectus_abdominis", "rectus-abdominis"],
        anchor: [-0.28, 0.62, 0.92],
      },
      {
        title: "Các giao gân",
        body: "Những dải gân ngang chia cơ thẳng bụng thành các múi; đường trắng bụng nằm giữa hai bó cơ trái và phải.",
        match: ["rectus abdominis", "rectus_abdominis", "rectus-abdominis"],
        anchor: [0.28, 0.02, 0.96],
      },
      {
        title: "Phần dưới",
        body: "Đầu dưới xuất phát từ mào xương mu và khớp mu, tiếp tục lên trên theo chiều dọc của thành bụng trước.",
        match: ["rectus abdominis", "rectus_abdominis", "rectus-abdominis"],
        anchor: [-0.28, -0.64, 0.9],
      },
    ],
  },
  {
    id: "thigh",
    label: "Đùi",
    latin: "Musculi femoris",
    index: "02",
    summary: "Vùng đùi gồm các khoang cơ trước, trong và sau. Ba mốc minh họa dưới đây đại diện cho những cấu trúc nông, dễ nhận diện khi xoay mô hình.",
    annotations: [
      {
        title: "Cơ thẳng đùi",
        body: "Thành phần nông ở giữa nhóm tứ đầu; vừa gấp khớp háng vừa góp phần duỗi khớp gối.",
        match: ["rectus femoris", "rectus_femoris", "rectus-femoris"],
        anchor: [0.28, 0.42, 0.9],
      },
      {
        title: "Cơ rộng ngoài",
        body: "Khối cơ lớn ở mặt trước–ngoài đùi, là một phần của cơ tứ đầu và tạo lực duỗi gối.",
        match: ["vastus lateralis", "vastus_lateralis", "vastus-lateralis"],
        anchor: [0.74, 0.02, 0.82],
      },
      {
        title: "Cơ nhị đầu đùi",
        body: "Nằm ở phía sau–ngoài đùi; tham gia gập gối và, với đầu dài, hỗ trợ duỗi khớp háng.",
        match: ["biceps femoris", "biceps_femoris", "biceps-femoris"],
        anchor: [0.58, -0.12, -0.9],
      },
    ],
  },
  {
    id: "shoulder",
    label: "Vai",
    latin: "Musculus deltoideus",
    index: "03",
    summary: "Cơ delta phủ quanh khớp vai. Ba mốc tương ứng với bó trước, bó giữa và bó sau của cùng một khối cơ.",
    annotations: [
      {
        title: "Bó trước",
        body: "Xuất phát từ phần ngoài xương đòn; hỗ trợ gấp vai và xoay trong cánh tay.",
        match: ["deltoid", "deltoideus"],
        anchor: [0.54, 0.48, 0.82],
      },
      {
        title: "Bó giữa",
        body: "Xuất phát chủ yếu từ mỏm cùng vai; là phần tạo lực chính khi dạng cánh tay sang bên.",
        match: ["deltoid", "deltoideus"],
        anchor: [0.92, 0.34, 0.04],
      },
      {
        title: "Bó sau",
        body: "Xuất phát từ gai vai; hỗ trợ duỗi vai và xoay ngoài cánh tay.",
        match: ["deltoid", "deltoideus"],
        anchor: [0.54, 0.34, -0.82],
      },
    ],
  },
  {
    id: "arm",
    label: "Bắp tay",
    latin: "Musculi brachii",
    index: "04",
    summary: "Khoang cánh tay trước và sau chứa các cơ tạo chuyển động chính ở khuỷu. Các mốc được đặt trên từng cấu trúc tương ứng thay vì dùng điểm ước lượng chung.",
    annotations: [
      {
        title: "Cơ nhị đầu cánh tay",
        body: "Khối cơ nông ở mặt trước cánh tay; gập khuỷu và tạo lực xoay ngửa cẳng tay.",
        match: ["biceps brachii", "biceps_brachii", "biceps-brachii"],
        anchor: [0.42, 0.36, 0.9],
      },
      {
        title: "Cơ cánh tay",
        body: "Nằm sâu dưới cơ nhị đầu; là cơ gập khuỷu mạnh và hoạt động ở nhiều tư thế cẳng tay.",
        match: ["brachialis"],
        anchor: [0.38, -0.18, 0.76],
      },
      {
        title: "Cơ tam đầu cánh tay",
        body: "Khối cơ lớn ở mặt sau cánh tay và là cơ duỗi khuỷu chính.",
        match: ["triceps brachii", "triceps_brachii", "triceps-brachii"],
        anchor: [0.44, 0.22, -0.9],
      },
    ],
  },
  {
    id: "chest",
    label: "Ngực",
    latin: "Musculus pectoralis major",
    index: "05",
    summary: "Cơ ngực lớn hình quạt phủ mặt trước lồng ngực và hội tụ về xương cánh tay. Ba mốc mô tả các phần dễ định hướng nhất trên mô hình.",
    annotations: [
      {
        title: "Phần đòn",
        body: "Các thớ phía trên xuất phát từ nửa trong xương đòn và góp phần đưa cánh tay ra trước.",
        match: ["pectoralis major", "pectoralis_major", "pectoralis-major"],
        anchor: [0.18, 0.7, 0.92],
      },
      {
        title: "Phần ức–sườn",
        body: "Khối lớn hơn xuất phát từ xương ức và các sụn sườn trên; tạo lực khép và xoay trong cánh tay.",
        match: ["pectoralis major", "pectoralis_major", "pectoralis-major"],
        anchor: [0.12, -0.08, 0.94],
      },
      {
        title: "Vùng bám tận",
        body: "Các bó cơ hội tụ về gân bám ở môi ngoài rãnh gian củ của xương cánh tay.",
        match: ["pectoralis major", "pectoralis_major", "pectoralis-major"],
        anchor: [0.84, 0.08, 0.78],
      },
    ],
  },
  {
    id: "glutes",
    label: "Mông",
    latin: "Musculus gluteus maximus",
    index: "06",
    summary: "Vùng mông tương tác tập trung vào cơ mông lớn — lớp cơ nông, lớn nhất và tạo phần lớn khối lượng nhìn thấy của mông.",
    initialView: "posterior",
    annotations: [
      {
        title: "Phần trên",
        body: "Các thớ trên xuất phát chủ yếu từ vùng chậu sau và góp phần ổn định cũng như duỗi khớp háng.",
        match: ["gluteus maximus", "gluteus_maximus", "gluteus-maximus"],
        anchor: [0.34, 0.62, -0.9],
      },
      {
        title: "Bụng cơ mông lớn",
        body: "Khối cơ dày ở mặt sau khung chậu tạo lực mạnh khi đứng lên, leo dốc hoặc tăng tốc.",
        match: ["gluteus maximus", "gluteus_maximus", "gluteus-maximus"],
        anchor: [-0.34, 0.04, -0.94],
      },
      {
        title: "Vùng bám tận",
        body: "Các thớ dưới hội tụ về củ mông của xương đùi; phần lớn các thớ còn lại hòa vào dải chậu–chày.",
        match: ["gluteus maximus", "gluteus_maximus", "gluteus-maximus"],
        anchor: [0.42, -0.58, -0.86],
      },
    ],
  },
];

const NAME_RULES = [
  {
    id: "abs",
    tests: [
      /rectus\s+abdomin/i,
      /obliqu\w*\s+(extern\w*|intern\w*)\s+abdomin/i,
      /(external|internal)\s+oblique/i,
      /transvers\w*\s+abdomin/i,
    ],
  },
  { id: "glutes", tests: [/gluteus/i, /gluteal/i] },
  { id: "chest", tests: [/pectoralis\s+major/i] },
  { id: "shoulder", tests: [/deltoid/i, /deltoideus/i] },
  {
    id: "arm",
    tests: [/biceps\s+brach/i, /triceps\s+brach/i, /\bbrachialis\b/i, /coracobrachialis/i],
  },
  {
    id: "thigh",
    tests: [
      /rectus\s+femor/i,
      /vastus\s+(lateralis|medialis|intermedius)/i,
      /biceps\s+femor/i,
      /semitendinosus/i,
      /semimembranosus/i,
      /adductor\s+(longus|brevis|magnus)/i,
      /\bsartorius\b/i,
      /\bgracilis\b/i,
    ],
  },
];

export function normalizeMuscleName(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyMuscleName(name = "") {
  const normalized = normalizeMuscleName(name);
  for (const rule of NAME_RULES) {
    if (rule.tests.some((test) => test.test(normalized))) return rule.id;
  }
  return null;
}

export function annotationMatchesName(annotation, name = "") {
  const normalized = normalizeMuscleName(name).toLowerCase();
  return annotation.match.some((needle) => normalized.includes(normalizeMuscleName(needle).toLowerCase()));
}
