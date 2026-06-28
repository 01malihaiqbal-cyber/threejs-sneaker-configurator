import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function texture(path, repeat = 4) {
  const map = loader.load(path);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.flipY = false;
  map.colorSpace = path.includes('basecolor')
    ? THREE.SRGBColorSpace
    : THREE.NoColorSpace;
  return map;
}

export function createSneakerMaterial(type, root = './textures') {
  const repeat = type === 'leather' ? 3 : 5;
  const aoMap = texture(`${root}/${type}/${type}_ao.png`, repeat);
  aoMap.channel = 0;
  return new THREE.MeshStandardMaterial({
    map: texture(`${root}/${type}/${type}_basecolor.png`, repeat),
    normalMap: texture(`${root}/${type}/${type}_normal.png`, repeat),
    roughnessMap: texture(`${root}/${type}/${type}_roughness.png`, repeat),
    aoMap,
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(0.65, 0.65),
  });
}

// Usage:
// sneakerMesh.material = createSneakerMaterial('leather');
// sneakerMesh.material = createSneakerMaterial('mesh');
// sneakerMesh.material = createSneakerMaterial('knit');
