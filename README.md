# Sneaker Material Textures

Three seamless 1024x1024 PBR texture sets for Three.js:

- `leather/`
- `mesh/`
- `knit/`

Each folder includes:

- `*_basecolor.png` - connect to `map`
- `*_normal.png` - connect to `normalMap`
- `*_roughness.png` - connect to `roughnessMap`
- `*_ao.png` - connect to `aoMap`
- `*_height.png` - optional displacement/bump source
- `*_orm.png` - packed AO, roughness, metalness channels (R/G/B)

Copy this folder to your web project's `public/textures` directory. Import
`three-materials.js`, then call `createSneakerMaterial('leather')`,
`createSneakerMaterial('mesh')`, or `createSneakerMaterial('knit')`.

For `aoMap`, your geometry needs a `uv1` attribute. In modern Three.js:

```js
geometry.setAttribute('uv1', geometry.attributes.uv);
```
