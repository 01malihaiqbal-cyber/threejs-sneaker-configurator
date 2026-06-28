import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSneakerMaterial } from './three-materials.js';

const host = document.querySelector('#scene');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(6.8, 4.1, 7.8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.prepend(renderer.domElement);

const environmentGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = environmentGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
environmentGenerator.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = true;
controls.minDistance = 4.2;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.52;
controls.target.set(0, 0.9, 0);

const keyLight = new THREE.DirectionalLight(0xffffff, 4.6);
keyLight.position.set(4.5, 7.5, 5.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -5;
keyLight.shadow.camera.right = keyLight.shadow.camera.top = 5;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdde7f8, 2.1);
fillLight.position.set(-5, 4, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 2.4);
rimLight.position.set(2, 5, -5);
scene.add(rimLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(4.5, 96),
  new THREE.ShadowMaterial({ color: 0x24282a, opacity: 0.22 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.04;
floor.receiveShadow = true;
scene.add(floor);

const state = {
  model: 'standard', material: 'leather', upperColor: '#183968',
  laceStyle: 'flat', laceColor: '#754b34'
};
const shoes = { standard: null, sports: null };
const parts = {
  standard: { upper: [], sole: [], laces: [], flat: [], round: [] },
  sports: { upper: [], sole: [], laces: [], flat: [], round: [] }
};
const transitions = [];
const materialTemplates = {
  leather: createSneakerMaterial('leather'),
  mesh: createSneakerMaterial('mesh'),
  knit: createSneakerMaterial('knit')
};

// Replace these placeholder paths with your Blender exports. Keep each editable
// object named Upper, Sole, or Laces (names containing those words also work).
// Apply transforms in Blender before export. The app normalizes model size and
// automatically uses the procedural shoe below if either GLB is not present.
const MODEL_PATHS = {
  standard: './models/Standard.glb?v=20260626-1',
  sports: './models/leather_sports.glb?v=20260626-1'
};

function standardMaterial(color, roughness = 0.55) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, metalness: 0.01 });
}

function roundedBox(width, height, depth, radius, material) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSegments: 4, steps: 1,
    bevelSize: radius * 0.42, bevelThickness: radius * 0.32
  });
  geometry.center();
  return new THREE.Mesh(geometry, material);
}

function addPart(group, mesh, type, category) {
  mesh.name = category;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  parts[type][category.toLowerCase()].push(mesh);
  return mesh;
}

function createPlaceholder(type) {
  const group = new THREE.Group();
  group.name = `${type}-placeholder`;
  group.rotation.y = -0.33;

  const upperMat = standardMaterial(state.upperColor, 0.48);
  const soleMat = standardMaterial(0xf0ede4, 0.72);
  const darkMat = standardMaterial(type === 'sports' ? 0x29443e : 0x9c7659, 0.6);

  const sole = addPart(group, roundedBox(5.25, type === 'sports' ? 0.63 : 0.5, 2.14, 0.38, soleMat), type, 'Sole');
  sole.position.set(0.05, 0.31, 0);
  sole.rotation.z = -0.025;

  if (type === 'sports') {
    const outsole = addPart(group, roundedBox(5.02, 0.2, 2.04, 0.28, darkMat), type, 'Sole');
    outsole.position.set(0.04, 0.07, 0);
  }

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), upperMat);
  body.scale.set(2.3, type === 'sports' ? 0.86 : 0.78, 0.91);
  body.position.set(-0.12, 1.02, 0);
  body.rotation.z = -0.09;
  addPart(group, body, type, 'Upper');

  const toe = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), upperMat.clone());
  toe.scale.set(1.12, 0.5, 0.93);
  toe.position.set(1.7, 0.78, 0);
  addPart(group, toe, type, 'Upper');

  const heel = roundedBox(1.2, 1.4, 1.82, 0.27, upperMat.clone());
  heel.position.set(-1.72, 1.14, 0);
  heel.rotation.z = 0.06;
  addPart(group, heel, type, 'Upper');

  const tongue = roundedBox(1.45, 1.5, 0.15, 0.16, upperMat.clone());
  tongue.position.set(-0.03, 1.5, 0.87);
  tongue.rotation.x = -0.22;
  addPart(group, tongue, type, 'Upper');

  const sideStripe = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.55, 8, 20), darkMat);
  sideStripe.rotation.z = Math.PI / 2 + 0.18;
  sideStripe.scale.z = 0.3;
  sideStripe.position.set(0.1, 1.05, 0.91);
  group.add(sideStripe);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.13, 16, 48), darkMat);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1.25, 1, 0.72);
  collar.position.set(-1.37, 1.65, 0);
  group.add(collar);

  const flatGroup = new THREE.Group();
  const roundGroup = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const x = -0.62 + i * 0.27;
    const width = 1.2 - Math.abs(i - 2.5) * 0.08;
    const y = 1.39 - Math.abs(i - 2.5) * 0.025;

    const flat = roundedBox(width, 0.075, 0.055, 0.022, standardMaterial(state.laceColor, 0.5));
    flat.position.set(x, y, 0.98);
    flat.rotation.z = -0.1;
    flat.castShadow = true;
    flatGroup.add(flat);
    parts[type].laces.push(flat);

    const curve = new THREE.LineCurve3(new THREE.Vector3(-width / 2, 0, 0), new THREE.Vector3(width / 2, 0, 0));
    const round = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.034, 10), standardMaterial(state.laceColor, 0.5));
    round.position.set(x, y, 0.99);
    round.rotation.z = -0.1;
    round.castShadow = true;
    roundGroup.add(round);
    parts[type].laces.push(round);
  }
  group.add(flatGroup, roundGroup);
  parts[type].flat.push(flatGroup);
  parts[type].round.push(roundGroup);
  return group;
}

function classifyLoadedMeshes(model, type) {
  const modelBox = new THREE.Box3().setFromObject(model);
  const modelSize = modelBox.getSize(new THREE.Vector3());
  
  console.log(`Loading ${type} model - mesh names found:`, []);
  model.traverse((mesh) => {
    if (!mesh.isMesh) return;
    console.log(`  - ${mesh.name}`);
  });

  model.traverse((mesh) => {
    if (!mesh.isMesh) return;

    const name = mesh.name.toLowerCase();
    if (name.includes('sole')) {
      parts[type].sole.push(mesh);
      return;
    }
    if (name.includes('lace')) {
      parts[type].laces.push(mesh);
      return;
    }
    if (name.includes('upper')) {
      parts[type].upper.push(mesh);
      return;
    }
    if (name.includes('hardware') || name.includes('eyelet')) return;

    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const x = (center.x - modelBox.min.x) / modelSize.x;
    const y = (center.y - modelBox.min.y) / modelSize.y;
    const width = size.x / modelSize.x;
    const height = size.y / modelSize.y;
    const isSole = y < 0.2 && width > 0.2;
    const isLace = x > 0.32 && x < 0.78 && y > 0.36 && y < 0.82
      && width > 0.035 && width < 0.42 && height < 0.16;

    if (isSole) parts[type].sole.push(mesh);
    else if (isLace) parts[type].laces.push(mesh);
    else parts[type].upper.push(mesh);
  });
}

function prepareLoadedModel(model, type) {
  // Image-to-3D exports often include a flat backing plane. Remove any mesh
  // whose thinnest dimension is effectively zero, leaving only the sneaker.
  const removable = [];
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry.computeBoundingBox();
    const size = child.geometry.boundingBox.getSize(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z);
    const smallest = Math.min(size.x, size.y, size.z);
    if (smallest <= largest * 0.0001) removable.push(child);
  });
  removable.forEach((mesh) => mesh.parent?.remove(mesh));

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 5 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  model.rotation.y = -0.28;
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = child.receiveShadow = true;
    child.material = child.material.clone();
  });
  classifyLoadedMeshes(model, type);
  return model;
}

function loadModel(type) {
  return new Promise((resolve) => {
    new GLTFLoader().load(
      MODEL_PATHS[type],
      (gltf) => {
        console.log(`✓ ${type} model loaded successfully!`);
        console.log(`Meshes in ${type} model:`, gltf.scene.children.map(c => c.name));
        gltf.scene.traverse((node) => {
          if (node.isMesh) console.log(`  └─ ${node.name} (${node.geometry.type})`);
        });
        resolve(prepareLoadedModel(gltf.scene, type));
      },
      undefined,
      (error) => {
        console.error(`${MODEL_PATHS[type]} not found; using the built-in ${type} placeholder.`);
        console.error(error);
        resolve(createPlaceholder(type));
      }
    );
  });
}

function tweenColor(material, color) {
  if (!material?.color) return;
  transitions.push({ material, from: material.color.clone(), to: new THREE.Color(color), time: 0, duration: 0.42 });
}

function eachMaterial(mesh, callback) {
  (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(callback);
}

function updateUpper() {
  const presets = {
    leather: { roughness: 0.38, clearcoat: 0.22, clearcoatRoughness: 0.45, sheen: 0.08 },
    mesh: { roughness: 0.82, clearcoat: 0, sheen: 0.08 },
    knit: { roughness: 0.94, clearcoat: 0, sheen: 0.4 }
  };
  const template = materialTemplates[state.material];
  Object.values(parts).forEach((shoe) => shoe.upper.forEach((mesh) => eachMaterial(mesh, (material) => {
    tweenColor(material, state.upperColor);
    // The supplied base-color images contain baked colors. MeshStandardMaterial
    // multiplies color by map, which makes configurator colors inaccurate.
    // Keep the physical detail maps and let the selected color drive albedo.
    material.map = null;
    material.normalMap = template.normalMap;
    material.roughnessMap = template.roughnessMap;
    material.aoMap = template.aoMap;
    material.normalScale.copy(template.normalScale);
    Object.assign(material, presets[state.material]);
    material.needsUpdate = true;
  })));
  keepSolesWhite();
}

function updateLaces() {
  Object.values(parts).forEach((shoe) => {
    shoe.laces.forEach((mesh) => eachMaterial(mesh, (material) => {
      tweenColor(material, state.laceColor);
      material.roughness = 0.72;
      material.clearcoat = 0;
      material.needsUpdate = true;
    }));
    shoe.flat.forEach((group) => { group.visible = state.laceStyle === 'flat'; });
    shoe.round.forEach((group) => { group.visible = state.laceStyle === 'round'; });
    // Real GLB files can provide one lace style as geometry. Approximate style
    // changes by changing lace thickness while preserving the lace path.
    if (!shoe.flat.length) {
      shoe.laces.forEach((mesh) => {
        mesh.scale.z = state.laceStyle === 'flat' ? 0.5 : 1;
      });
    }
  });
}

function keepSolesWhite() {
  Object.values(parts).forEach((shoe) => shoe.sole.forEach((mesh) => {
    eachMaterial(mesh, (material) => {
      material.color.set('#ffffff');
      material.roughness = 0.7;
      material.needsUpdate = true;
    });
  }));
}

function showModel(type) {
  state.model = type;
  Object.entries(shoes).forEach(([name, model]) => { if (model) model.visible = name === type; });
  document.querySelectorAll('.model-tab').forEach((button) => button.classList.toggle('active', button.dataset.model === type));
  document.querySelectorAll('#soleType [data-value]').forEach((button) => button.classList.toggle('active', button.dataset.value === type));
}

function bindButtons(id, callback) {
  const container = document.querySelector(`#${id}`);
  if (!container) return;
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-value]');
    if (!button) return;
    button.parentElement.querySelectorAll('[data-value]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    callback(button.dataset.value);
  });
}

bindButtons('upperMaterial', (value) => { state.material = value; updateUpper(); });
bindButtons('upperColor', (value) => { state.upperColor = value; updateUpper(); });
bindButtons('laceColor', (value) => { state.laceColor = value; updateLaces(); });
bindButtons('soleType', showModel);
bindButtons('laceStyleOptions', (value) => { state.laceStyle = value; updateLaces(); });

document.querySelector('#laceStyle')?.addEventListener('change', (event) => {
  state.laceStyle = event.target.value;
  updateLaces();
});
document.querySelectorAll('.model-tab').forEach((button) => button.addEventListener('click', () => showModel(button.dataset.model)));
document.querySelector('#resetView').addEventListener('click', () => {
  camera.position.set(6.8, 4.1, 7.8);
  controls.target.set(0, 0.9, 0);
  controls.update();
});

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  for (let i = transitions.length - 1; i >= 0; i -= 1) {
    const item = transitions[i];
    item.time += delta;
    const progress = Math.min(item.time / item.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    item.material.color.copy(item.from).lerp(item.to, eased);
    if (progress === 1) transitions.splice(i, 1);
  }
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', resize);
Promise.all([loadModel('standard'), loadModel('sports')]).then(([standard, sports]) => {
  shoes.standard = standard;
  shoes.sports = sports;
  scene.add(standard, sports);
  sports.visible = false;
  updateUpper();
  updateLaces();
  keepSolesWhite();
  document.querySelector('#loader').classList.add('hidden');
});
resize();
animate();




