# ARCYN STUDIOS 3D ASSET BIBLE

> **Document Title:** Arcyn Studios 3D Asset Bible (The Official Art Bible)
> **Document Version:** 1.0.0
> **Status:** SINGLE SOURCE OF TRUTH
> **Owner:** Arcyn Studios — Art Direction
> **Audience:** Internal art teams, external 3D art outsourcing partners, technical artists, real-time rendering engineers, and documentation maintainers.
> **Classification:** Internal — Authoritative
> **Last Updated:** 2026-07-11

---

## 0. HOW TO USE THIS DOCUMENT

This document is the **single, authoritative source of truth** for every 3D asset produced for the Arcyn Studios digital product line. It exists to remove ambiguity. Any decision not explicitly contradicted by a later, signed revision of this document is governed by the rules herein. Where this document is silent and a real-world engineering or manufacturing constraint applies, the real-world constraint governs and must be reported back to Art Direction for inclusion in the next revision.

This Bible is written to be read by an experienced 3D artist who has **no prior contact** with the Arcyn brand. After reading, that artist must be able to produce a shippable, specification-compliant asset without asking a single clarifying question. If you, as a reader, find yourself wanting to ask a question, that is a defect in this document, not in you. Please file it with Art Direction.

### 0.1 Reading Order
1. Read **Chapter 1** to internalize the *why* before the *how*.
2. Read **Chapter 2** before touching any DCC tool. These are hard constraints.
3. Reference **Chapter 3** (Material Library) every time you assign a material.
4. Reference **Chapter 4** (Lighting Bible) for scene, presentation, and cinematic context.
5. Build assets against **Chapter 5** (Asset Specifications). One section per asset.
6. Place assets in a world using **Chapter 6** (Environment Bible).
7. Prepare every asset per **Chapter 7** (Animation Preparation), even if animation is not yet scheduled.
8. Validate with **Chapter 8** (Quality Assurance) before submission.

### 0.2 Document Conventions
- **MUST / MUST NOT**: Absolute requirement. Non-compliance fails acceptance.
- **SHOULD / SHOULD NOT**: Strong recommendation. Deviation requires written Art Direction approval.
- **MAY**: Permitted, optional.
- All units are metric unless explicitly stated.
- All color values are given in sRGB hex for art reference and linear/ACEScg notes for rendering where relevant.
- All angular values are in degrees.
- `PascalCase_ObjectName` refers to naming tokens explained in Chapter 2.

### 0.3 Versioning
This is a living document. Revisions follow semantic versioning `MAJOR.MINOR.PATCH`:
- **MAJOR**: Breaking change to the art direction, palette, or global technical standard.
- **MINOR**: New assets, new materials, new chapters.
- **PATCH**: Clarifications, typo fixes, example additions.

Each asset section carries its own `Spec Version` so that a single asset can be updated without forcing a document-wide version bump.

---

## TABLE OF CONTENTS

1. [Arcyn Studios Design Philosophy](#chapter-1-arcyn-studios-design-philosophy)
2. [Global Technical Standards](#chapter-2-global-technical-standards)
3. [Material Library](#chapter-3-material-library)
4. [Lighting Bible](#chapter-4-lighting-bible)
5. [Asset Specifications](#chapter-5-asset-specifications)
6. [Environment Bible](#chapter-6-environment-bible)
7. [Animation Preparation](#chapter-7-animation-preparation)
8. [Quality Assurance](#chapter-8-quality-assurance)

---

# CHAPTER 1 — ARCYN STUDIOS DESIGN PHILOSOPHY

This chapter is the foundation. Every technical rule in later chapters is an attempt to *encode* the feelings and intentions described here into reproducible, measurable constraints. You are not modeling "metal that is shiny." You are modeling "a premium object that makes a person feel they are holding the future in their hand, and that the future is calm, expensive, and trustworthy."

If you ever face a trade-off between two rules, resolve it by asking: *"Which option better serves the philosophy in this chapter?"* Then document your decision.

## 1.1 Brand Identity

**Arcyn** (pronounced *ar-sin*, stylized `ARCYN` in uppercase, monospaced or geometric sans) is a fictional but fully realized premium technology atelier. The brand occupies the same mental territory as a fictional fusion of Teenage Engineering's restraint, Bang & Olufsen's acoustic luxury, Apple's material confidence, and the hard sci-fi prop language of *Blade Runner 2049* and *Dune*. Arcyn does not make "gadgets." It makes **instruments** — objects that feel inevitable, as if physics demanded their exact form.

The brand promise, in one sentence: **"Precision made tangible."**

Brand pillars (each is a rubric every asset is graded against):
- **Inevitability** — The form looks like the only possible solution to its function.
- **Restraint** — Ornament is a crime. Every surface earns its detail.
- **Tactility** — Even on screen, the object must imply how it feels in the hand.
- **Transparency of mechanism** — The way it works should be legible, never hidden behind fake panels.
- **Quiet futurism** — Advanced, but calm. Never aggressive, never gamery, never neon-for-its-own-sake.

## 1.2 Visual Identity

The visual identity is built on the following non-negotiable principles:

- **Geometry first, texture second.** A good Arcyn asset reads correctly as a silhouette in pure black. Detail is added in layers: macro form → panel structure → micro detail → surface imperfection.
- **Planar honesty.** Curved and flat surfaces meet at deliberate, resolved transitions. We do not blur the line between a machined flat and a soft fillet; we celebrate the fillet.
- **Asymmetry with balance.** Symmetric objects are permitted only when function demands (e.g., a lens). Otherwise, mass is offset against void using the golden ratio (see §1.14) to create tension without disorder.
- **Negative space as material.** The absence of material is designed with the same care as the material itself. Light passing through, around, or reflecting off voids is part of the composition.
- **Typography-adjacent detailing.** Engraved model numbers, etched indicator rings, and printed legends must use the Arcyn type system (geometric, humanist, single-weight, tracked-out). Never use system fonts, never use decorative scripts.

## 1.3 Emotional Feeling

The intended emotional response, in priority order:

1. **Calm confidence.** The user should feel the object is in control, not them.
2. **Quiet awe.** A subtle "I didn't know an object could look like this" moment.
3. **Trust.** The object looks engineered to not fail.
4. **Desire.** The user wants to own it, hold it, rotate it.
5. **Timelessness.** It should not read as "2026," but as "always."

To achieve this we forbid: horror, grunge-for-shock, aggressive weaponization cues, celebratory neon, childish exaggeration, and "cyberpunk clutter." Arcyn is *premium*, not *maximalist*.

## 1.4 Gaming Philosophy

Although Arcyn assets are presented in a web-based 3D viewer (`ArcynWebGames`), the philosophy is **game-art discipline applied to product design**, not "game art" as loot-drops-and-explosions. We borrow from AAA game pipelines:
- Strict triangle/texel budgets (Chapter 2).
- LOD discipline.
- PBR correctness.
- Frame-budget awareness.

We reject: cartoon shading, toon outlines (except as a deliberate art-mode toggle documented in §4.13), and any asset that cannot survive a slow 360° orbit at 4K.

The viewer is an *object theater*, not a level. The "game" is the joy of inspection.

## 1.5 Luxury Design Language

Luxury in the Arcyn language is defined by **absence of compromise**, expressed through:
- **Material continuity** — joins between materials are precise, with no gaps wider than specified (Chapter 5 per-asset).
- **Finish consistency** — adjacent surfaces share a coherent roughness story.
- **Weight suggestion** — even light assets imply density through massing and low surface area of "cheap" thin plastic.
- **The reveal** — small, intentional moments of delight: a hidden seam, an interior color, a glowing indicator that only appears on interaction.

## 1.6 Modern Industrial Design

We follow contemporary industrial-design best practice:
- **DFM-aware modeling** — model as if it could be injection-molded, CNC-machined, or die-cast. Sharp internal corners are impossible; every concave corner has a fillet (per-asset bevel radius, default 0.4 mm at real scale, §2.x).
- **Knurling, ribs, and bosses** are real engineering features, drawn from function, not decoration.
- **Fastener honesty** — screws are shown where a real product would be assembled, hidden where a real product would be seamless. Never fake screws.

## 1.7 Futuristic Influences

The future Arcyn depicts is **soft-tech**: believable near-future, not space-opera. References:
- Consumer electronics of the 2020s, refined.
- Aerospace and medical-device language (clean, sealed, precise).
- Brutalist architecture softened by warm materials.
- The " analogue futurism" of *Severance*, *Foundation*, and *Ex Machina*.

Forbidden futures: chrome skulls, exposed glowing tubes that serve no function, floating unconnected panels, gratuitous vents.

## 1.8 Premium Product Design

Premium = the sum of a thousand correct micro-decisions. Concretely:
- No parting-line flash. Parting lines are *designed* and placed where they read as intent.
- No visible support artifacts.
- No unfinished interior if the interior is ever visible (and many Arcyn assets open or reveal interiors — model them).
- Color accents are used like a tailor uses a pocket square: one, placed with intent, never more than 6% of surface area.

## 1.9 Target Audience

Primary: discerning digital collectors, design enthusiasts, and "prosumer" technophiles aged 22–55 who value craft. Secondary: art directors and studios evaluating Arcyn's pipeline for licensing. The audience expects museum-grade presentation. Assume the viewer will zoom to the screw head.

## 1.10 Color Psychology

The Arcyn palette is intentionally narrow to feel curated:

| Role | Name | sRGB Hex | Emotional Role |
|---|---|---|---|
| Base neutral | Arcyn Bone | `#E8E6E1` | Calm, premium, gallery white |
| Base neutral | Arcyn Graphite | `#2B2D31` | Grounding, industrial |
| Base neutral | Arcyn Carbon | `#16181C` | Depth, void, luxury black |
| Metal | Arcyn Champagne | `#C9A86A` | Warm luxury metal |
| Metal | Arcyn Titanium | `#8C8F96` | Honest, technical |
| Accent | Arcyn Cyan | `#3FE0D0` | Life, data, interface (USE SPARINGLY) |
| Accent | Arcyn Amber | `#FFB000` | Warning, warmth, energy |
| Accent | Arcyn Magenta | `#E0457B` | Rare, signature, delight |

Rules:
- Neutral surfaces dominate (≥80% of any asset).
- One accent color per asset, maximum two in rare cases with Art Direction sign-off.
- Cyan is the "system alive" color; it must only appear on active indicators, never as body paint.
- Never use pure `#FFFFFF` or pure `#000000` on a final surface — they break PBR and look cheap.

## 1.11 Material Philosophy

Materials are chosen to *reveal function* and *imply manufacture*:
- **Metals** read as machined or anodized, never as "shiny plastic."
- **Polymers** read as soft-touch, matte, or technical glass.
- **Glass** is optical, with real refraction and edge brightening.
- **Composites** (carbon, forged) appear only where weight-saving is the story.
- Material transitions are physically motivated: a metal bezel holding a glass lens; a soft-touch grip over a metal chassis.

## 1.12 Lighting Philosophy

Lighting is never "lit." It is *composed*:
- Three-point minimum, but the key is soft and large (a studio softbox, not a point light).
- Reflections are the primary storytelling tool — what the object reflects is as important as the object.
- Highlights should be long and controlled, never a hard specular dot.
- We light for *form reading* first, mood second, drama third.

## 1.13 Reflection Philosophy

Arcyn objects live or die by their reflections:
- Every glossy surface must have something meaningful to reflect (environment, not a gray void).
- Reflections should be slightly imperfect — fingerprints, micro-scratches — to read as "real object," not "CGI render."
- Mirror-perfect surfaces are forbidden except for deliberate hero-moment accents.

## 1.14 Shape Language

Shape vocabulary (use consistently):
- **Primary volumes**: cylinders, rounded rectangular prisms, tori, spheres — the "honest solids."
- **Secondary cuts**: chamfers, grooves, vent slots, indicator windows.
- **Tertiary detail**: etched text, witness marks, alignment arrows, screw heads.
- Soft forms imply comfort/safety; hard forms imply precision/power. Arcyn balances both: a soft body with a hard, precise interface.

## 1.15 Silhouette Language

A compliant silhouette obeys:
- **Readability at 32 px** — the asset must be identifiable as its category (watch, lamp, drone) when tiny.
- **One dominant axis** — a clear "up" or "forward."
- **Negative-space signature** — at least one void that is recognizable (e.g., the central bore of a ring, the slot of a speaker grille).
- Avoid silhouettes that read as "a blob with stuff on it."

## 1.16 Motion Philosophy

Even when static, assets imply motion:
- Moving parts sit at rest in a "neutral, charged" pose (slightly open, indicator dimmed but present).
- Hinges, sliders, and rotors imply a single, correct axis of travel.
- We forbid jittery, bouncy, or cartoon motion in all future animation. Motion = damped, weighted, expensive.

## 1.17 Environmental Storytelling

Every asset implies a world:
- It was designed by someone, used by someone, maintained by someone.
- Wear is *earned*: edges that hands touch are lightly polished; edges that hands don't touch keep factory finish.
- The environment (Chapter 6) is a clean, neutral, gallery-like stage — the object is the story, the room is the frame.

---

# CHAPTER 2 — GLOBAL TECHNICAL STANDARDS

This chapter contains **hard constraints**. Compliance is mandatory for every asset, every material, every export. These rules exist so that 45 different artists, working in different time zones, produce assets that are indistinguishable in pipeline behavior and can be dropped into the same Three.js scene without rework.

## 2.1 Units

- **Authoring unit:** 1 Blender unit = 1 meter.
- **Internal modeling scale:** Assets are authored at **real-world scale in meters**. A watch is ~0.045 m, not 45 units. Do not model in centimeters or millimeters as the unit; if you prefer, model at 1 unit = 1 cm but you MUST set the scene unit scale so the exported GLB reports meters. The exporter must report `1.0 = 1 meter`.
- **Tolerance:** Position precision to 0.0001 m. Angular precision to 0.01°.
- **Never** use "generic units." Never leave Blender's default cube as a scale reference without setting unit system to Metric.

## 2.2 Scale

- All assets are normalized so their **largest bounding-box dimension equals 1.0 m** in the *presentation* export variant only when the asset is intended to be a hero standalone. For grouped scenes, keep real relative scale (a watch next to a lamp must be realistically proportioned).
- A single source `.blend` MUST be at real scale. Derive presentation scaling via a parent empty or export transform, never by non-uniformly scaling geometry.
- **Non-uniform scale on exported meshes is FORBIDDEN.** All meshes export with scale (1,1,1). Correct proportion through geometry, not object scale.

## 2.3 Coordinate System & Axis Orientation

- **Up axis:** +Y (Blender native). GLB export converts to +Y up (glTF standard). Confirm the exporter outputs `up = Y`.
- **Forward axis:** -Z (Blender native camera-forward). For assets with a clear "front," the front faces -Z.
- **Right-hand rule** applies. Keep all asset "up" aligned to world +Y unless the asset's function dictates otherwise (e.g., a drone lying flat).
- **Y-up, Z-forward** is the canonical orientation for vehicles/rovers. Document per-asset in Chapter 5 if it deviates.

## 2.4 Naming — General Rules

- **Case:** `PascalCase` for objects/meshes, `kebab-case` or `snake_case` for files (see §2.7). No spaces, no special characters except `_` and `-`. Never use `#`, `@`, `&`, accented characters, or emoji in names.
- **Uniqueness:** Every mesh name is unique within an asset file.
- **Readability:** Names describe function, e.g., `Bezel_Ring`, `Lens_Glass`, `Battery_Cell`, not `Cube.004`.
- **Suffix tokens** (mandatory, see §2.8–§2.14).
- **No Blender auto-suffix collisions:** never let Blender append `.001`; rename manually.

## 2.5 Folder Structure

The canonical repository layout:

```
Arcyn_Studios_3D_Asset_Library/
├── _Standards/                 # this Bible, color charts, LUTs
├── Source/
│   └── <AssetCategory>/
│       └── <AssetName>/
│           ├── <AssetName>.blend
│           ├── textures/
│           │   ├── albedo/
│           │   ├── metalness/
│           │   ├── roughness/
│           │   ├── normal/
│           │   ├── ao/
│           │   ├── emission/
│           │   └── ORM/        # packed Occlusion-Roughness-Metal
│           ├── exports/
│           │   ├── <AssetName>_LOD0.glb
│           │   ├── <AssetName>_LOD1.glb
│           │   └── <AssetName>_LOD2.glb
│           └── docs/
│               └── <AssetName>_spec.md
├── Materials/
│   └── <MaterialName>.blend   # master material scaffolds
├── Environment/
├── Renders/
└── README.md
```

- `Source/` holds editable DCC files. `exports/` holds shippable GLB. Never ship a `.blend` to the web pipeline.
- Category folders: `Devices/`, `Wearables/`, `Structures/`, `Weapons/`, `Vehicles/`, `Relics/`, `Environment/`.

## 2.6 File Names

Format: `<AssetName>[_<Variant>][_LOD<n>].<ext>`

Examples:
- `ArcynCoreHub.blend`
- `ArcynCoreHub_LOD0.glb`
- `ArcynCoreHub_Hero.glb`
- `ArcynCoreHub_TexturePack.zip`

Rules:
- Asset names are prefixed with `Arcyn` exactly once (e.g., `ArcynQuantumWatch`, not `QuantumWatch` or `Arcyn_Quantum_Watch`).
- No version numbers in filenames (`_v2` forbidden); version lives in metadata and this Bible.
- Lowercase extensions (`.glb`, `.png`, `.exr`).

## 2.7 Texture File Names

Format: `<AssetName>_<MaterialSlot>_<MapType>_<Resolution>.png`

Map type tokens: `albedo`, `metalness`, `roughness`, `normal`, `ao`, `emission`, `height`, `orm`.
Resolution token: `1k`, `2k`, `4k`.

Example: `ArcynQuantumWatch_Bezel_albedo_2k.png`

- Normal maps MUST end in `_normal`. Do not use `_nrm`, `_normalGL`, etc.
- ORM maps pack: R = Ambient Occlusion, G = Roughness, B = Metalness. Documented in §2.20.

## 2.8 Mesh Naming

`<PartName>_<TypeSuffix>`

Type suffixes: `_Mesh`, `_Glass`, `_Emissive`, `_Collider`, `_LOD0` etc. If a part is a sub-assembly, nest: `Body_Shell`, `Body_Shell_Button`.

Rules:
- The root object of every asset MUST be named `<AssetName>_Root`.
- All deformable/animatable sub-parts get a clear, stable name; animation rigs reference these by name (Chapter 7).

## 2.9 Material Naming

`MAT_<AssetName>_<Slot>_<MaterialType>`

Example: `MAT_ArcynQuantumWatch_Bezel_AnodizedTitanium`

Shared library materials (Chapter 3) are named `MAT_LIB_<MaterialName>` and reused across assets where identical. Do not duplicate a library material per asset; instance it.

## 2.10 Animation Naming

`ANIM_<AssetName>_<Action>_<Variant>`

Examples: `ANIM_ArcynSentinelDrone_Hover_Idle`, `ANIM_ArcynVaultSafe_Open_01`.

- Actions are lowercase verbs/nouns: `idle`, `open`, `close`, `spin`, `pulse`, `deploy`, `retract`.
- Frame range and FPS recorded in the action's custom properties.

## 2.11 Pivot Naming & Placement

- Pivot objects: `<PartName>_Pivot`.
- Pivots MUST sit at the mechanical center of rotation, not the mesh centroid. A door hinge pivot is on the hinge axis, not the door's center.
- Document every pivot in Chapter 5 per asset.

## 2.12 LOD Naming

- `LOD0` = highest detail (hero). `LOD1` ≈ 50% triangles. `LOD2` ≈ 20% triangles.
- File: `<AssetName>_LOD0.glb` etc.
- LODs share the SAME pivot and world transform as LOD0. Never re-center per LOD.
- LOD0 never has baked AO that conflicts with LOD1; keep AO in texture, not vertex colors, for cross-LOD consistency (unless approved).

## 2.13 Collision Naming

- `<PartName>_Collider` (simple) or `<PartName>_Collider_Convex`.
- Colliders are separate invisible meshes, typically boxes, capsules, or convex hulls. Never use the render mesh as collision.
- For the web viewer, colliders are usually omitted unless interaction requires them; document per asset.

## 2.14 Three.js / GLB Compatibility

- **Format:** glTF 2.0 binary (`.glb`) only.
- **Materials:** `KHR_materials_*` extensions permitted: `clearcoat`, `transmission`, `emissive_strength`, `specular`, `ior`, `volume`. Avoid `KHR_materials_pbrSpecularGlossiness` (deprecated).
- **Textures:** PNG (8-bit) for albedo/normal/emission; PNG or WebP for ORM. HDR environment in `.exr` or `.hdr`, loaded separately (not embedded).
- **No Blender-specific nodes** survive export. Bake all procedural detail to textures or custom attributes before export.
- **Draco/Meshopt:** optionally compress geometry with `KHR_draco_mesh_compression` or `EXT_meshopt_compression` (Chapter 8 checklist). Keep a non-compressed master GLB for archival.
- **Animation:** `KHR_animation_pointer` or standard node animations. No shape-key morph targets unless documented (they bloat GLB).
- **Coordinate check:** After export, verify in a glTF viewer that up = +Y and the asset is not rotated 90°. A common Blender→glTF bug rotates -Z forward to +Z; pre-rotate the export or use the "Y up" export preset.

## 2.15 GitHub Pages Optimization

- Total uncompressed asset weight per page SHOULD be < 15 MB; < 8 MB target for mobile.
- Serve GLB with `Content-Encoding: gzip` or `brotli` (GLB compresses ~60%).
- Use `KTX2`/`Basis` supercompressed textures where supported (`KHR_texture_basisu`) to cut texture weight 4–6×. Provide fallback PNG if target browser不支持.
- Lazy-load assets: only the hero asset loads on first paint; others stream on interaction.
- Precompute and cache. Use `GLTFLoader` with `DRACOLoader` and `KTX2Loader` from the three.js examples.

## 2.16 Compression

- Geometry: Draco (level 7) or Meshopt (`ratio` high). Target < 30% of raw size.
- Textures: KTX2/BasisU (UASTC for normal/ORM where quality matters, ETC1S for albedo where size matters). 
- Never JPEG-compress normal maps (banding). Use PNG or KTX2-UASTC.
- Document final compressed sizes in the asset spec's Optimization section.

## 2.17 Texture Sizes

| Asset Class | Albedo | Normal | ORM | Emission |
|---|---|---|---|---|
| Hero / Wearable | 2K (2048) | 2K | 2K | 1K |
| Device (small) | 2K | 2K | 1K | 1K |
| Structure (large) | 4K (tiled) or 2K | 4K/2K | 2K | 1K |
| Relic / Prop | 2K | 2K | 1K | 1K |

- Powers of two ONLY (512, 1024, 2048, 4096). Never 3000×3000.
- Mipmaps: always generate. Trilinear filtering.
- Final delivery MAY use KTX2 at these logical resolutions.

## 2.18 Triangle Budgets

| Asset Class | LOD0 Tri Target | LOD1 | LOD2 |
|---|---|---|---|
| Wearable (watch, ring) | ≤ 25,000 | ≤ 10,000 | ≤ 3,000 |
| Small device (pen, token) | ≤ 15,000 | ≤ 6,000 | ≤ 2,000 |
| Medium device (hub, lamp) | ≤ 60,000 | ≤ 25,000 | ≤ 8,000 |
| Large structure (arch, tower) | ≤ 120,000 | ≤ 50,000 | ≤ 15,000 |
| Vehicle (rover, drone) | ≤ 90,000 | ≤ 35,000 | ≤ 10,000 |

- These are ceilings, not quotas. Fewer triangles, well placed, is better.
- Hard cap per scene (all visible assets): ≤ 1.5M triangles on desktop, ≤ 400k on mobile.

## 2.19 Vertex Budgets

- Vertices ≈ triangles × 0.5 to × 0.6 for closed meshes. Track both.
- Keep UV seams minimal to limit vertex duplication; shared edges reduce vertex count.
- Hard cap per hero asset: ≤ 1.5× its triangle budget in vertices (due to smoothing/UV splits).

## 2.20 UV Rules

- **One UV channel (UV0)** for all PBR maps. **UV1** reserved for lightmap/ao-bake only if needed (usually not in real-time).
- **No overlapping UVs** on the same material unless intentional tiling (documented).
- **Texel density:** see §2.21. Maintain uniform texel density within a material.
- **Padding:** 4–8 px gutter between UV islands at 2K to prevent mip bleeding.
- **Texel alignment:** align straight edges to texel grid where the detail is engineering-critical (screw threads, panel lines) to avoid shimmer.
- **UDIMs:** NOT used. Single 0–1 UV space per material. For large structures, use tiling materials with triplanar or repeated 0–1.

## 2.21 Texel Density

- Target: **512 texels per meter (tp/m)** for hero assets at 2K. Formula: `textureSize / worldSizeMeters = tp/m`. Adjust texture resolution to hit ~512 tp/m; do not let any surface drop below 256 tp/m or exceed 1024 tp/m (avoid wasteful over-resolution).
- Maintain ±10% consistency across an asset. Drastic density jumps read as "cheap."
- Use a texel-density checker material during authoring.

## 2.22 Export Rules

1. Apply all transforms (Ctrl+A: Rotation, Scale). Location MAY stay if pivot-correct.
2. Delete hidden, disabled, and reference objects.
3. Bake all modifiers you intend to "keep" (e.g., Boolean, Bevel) OR keep them as non-destructive if the pipeline supports it. For final GLB, **apply** Bevel/Subdivision to freeze detail.
4. Merge by material to minimize draw calls (but keep animatable parts separate).
5. Bake ambient occlusion to a texture map (not vertex colors) for portability.
6. Set correct up-axis and apply unit scale.
7. Embed no HDR; reference environment externally.
8. Validate with `gltf-validator` (Khronos) — zero errors, zero warnings ideally.

## 2.23 Blender Version

- **Authoring version:** Blender 4.2 LTS (or later LTS). Do not use nightly/alpha.
- **Add-ons required:** `glTF 2.0 format` (built-in), `Import-Export: glTF` enabled. Optional: `Dream Textures` (not for shipping), `Precision Drawing Tools` (optional).
- **File format:** Save as `.blend` (Blender 4.2+). Keep one LTS-compatible version per asset.
- Never open a 4.2 file in 3.x and re-save; version drift corrupts.

## 2.24 Normals

- All meshes MUST have **custom normals** calculated (or smooth-shaded with correct split). No uninitialized normals.
- **Hard edges** = split normals (sharp). **Soft edges** = averaged. See §2.27–§2.29.
- Verify normals point outward (no inverted faces). Use `Mesh > Normals > Recalculate Outside` and visually confirm.
- Weighted normal modifier recommended for hard-surface to get crisp, even shading on bevels (prevents faceting on fillets).

## 2.25 Smoothing

- Use **Auto Smooth** (Blender) at 30°–45° angle threshold for hard-surface parts. This creates split normals exactly at intended hard edges while keeping large surfaces smooth.
- For organic/soft parts, full smooth shading.
- Never leave a hard-surface mesh fully smooth (looks like melted plastic) or fully flat (looks low-poly).

## 2.26 Subdivision

- **Subdivision Surface** is a modeling aid only. Do NOT ship subdivided meshes unless the asset's budget allows and the detail is real (e.g., organic relic).
- For hard-surface, model the bevel explicitly (§2.30) rather than relying on Subdiv to fake fillets. Subdiv + creases is acceptable for hero pieces but costs triangles; budget accordingly.
- When shipping subdivided, apply the modifier and re-optimize (decimate where safe) to fit budget.

## 2.27 Bevel Rules

- **Every** exterior hard edge that a hand or eye touches MUST have a bevel/fillet. Sharp 0-radius edges are forbidden on visible geometry (they shade poorly and look CG).
- Default bevel radius at real scale: **0.4 mm** for small parts, **1–2 mm** for medium, **3–5 mm** for large structural. Per-asset overrides in Chapter 5.
- Bevel segments: 2–4. More segments only where the radius is large and curvature must read smooth.
- Use the **Weighted Normal** modifier after beveling to keep fillets crisp.

## 2.28 Hard Edge Rules

- A "hard edge" is a deliberate, designed crease (e.g., the meeting of two panels, a chamfer). It is created by a geometry bevel whose faces meet at >45° and a split normal.
- Hard edges communicate **precision and assembly**. Use them at panel joins, parting lines, and functional breaks.
- Hard edges MUST align with real parting lines / assembly seams, never random.

## 2.29 Soft Edge Rules

- A "soft edge" is a gentle fillet (radius per §2.27) where two surfaces of the *same part* meet, signaling "this is one continuous manufactured surface."
- Soft edges communicate **comfort and flow**.
- The transition from soft to hard edge is itself a designed moment (the "edge treatment") — document per asset.

## 2.30 Subdivision Surface Modeling (Hard-Surface Best Practice)

- Use **Boolean** for cuts (vent slots, windows) followed by **Bevel** and **Weighted Normal** to clean up.
- Maintain quad topology where possible for clean shading; triangles tolerated at non-critical areas.
- Keep ngons only on flat, non-reflective interior faces.
- Test the asset under a moving highlight (rotate a bright light across it) to catch shading artifacts before export.

## 2.31 Color Management

- Blender: **AgX** or **Filmic** view transform for authoring previews; final render via ACEScg in the web pipeline.
- Working color space: `Linear Rec.709` (scene), textures tagged correctly (sRGB for albedo/emission, Non-Color for data maps).
- Never deliver an sRGB-tagged normal/ORM map. Data maps are Linear/Non-Color.
- White point D65.

## 2.32 Performance Budget (Per Scene)

- Draw calls: ≤ 200 desktop, ≤ 60 mobile (combine meshes by material).
- Texture memory: ≤ 512 MB desktop, ≤ 128 MB mobile.
- Frame time target: 16.6 ms (60 fps) desktop, 33 ms (30 fps) mobile on mid hardware (e.g., iPhone 12 class).
- Shadow maps: ≤ 2 cascades for the hero stage.

---

# CHAPTER 3 — MATERIAL LIBRARY

This chapter defines the **shared, reusable materials** (Library Materials) that every asset references. Each material is a complete specification: a shader recipe plus authoring instructions. Artists MUST use these where applicable rather than inventing one-off materials. Consistency of material response across assets is what makes the library feel like one designed world.

Each material specification uses this template:
- **Purpose** — what job it does.
- **Appearance** — how it looks to the eye.
- **PBR values** — Metallic, Roughness (base), etc., as 0–1 ranges with target values.
- **Imperfections** — weathering layering.
- **Recommended colors** — base albedo sRGB.
- **Use / Never use** — where it belongs.
- **Examples** — assets (from Chapter 5) that use it.

Global PBR conventions (apply to all materials):
- All data maps (metalness, roughness, normal, ao, orm, height) are **Non-Color / Linear**.
- Albedo and emission are **sRGB**.
- Normals are OpenGL-style (+Y green). If exporting to a pipeline expecting DirectX, flip G — but Arcyn pipeline is OpenGL/Three.js, so keep +Y.
- Base color is never pure white/black (see §1.10).
- Every material MUST have a subtle procedural or baked imperfection layer; flawless CG plastic is forbidden.

---

## 3.1 MAT_LIB_AnodizedTitanium

- **Purpose:** Primary structural metal for frames, bezels, chassis. The "honest technical" metal.
- **Appearance:** Matte-to-satin brushed metal, cool gray, fine directional grain.
- **Metallic:** 1.0
- **Roughness:** 0.35–0.5 (target 0.42). Slight anisotropy via roughness map variation.
- **Normal intensity:** 0.15 (micro grain + machining marks).
- **AO:** baked into ORM.
- **Reflection:** broad, soft, env-driven.
- **Refraction:** none.
- **Transparency:** none.
- **Subsurface:** none.
- **Emission:** none.
- **Edge wear:** light polished edges where handled (roughness↓ to 0.2 at fingertip contact zones).
- **Scratches:** sparse, fine, directional (brushed). Density low.
- **Fingerprints:** subtle oily specular smudge layer, very low opacity (~3%), only on handled zones.
- **Dust:** none on metal (metal reads clean).
- **Imperfections:** brushed anisotropy; occasional machining witness line.
- **Recommended colors:** `#8C8F96` (Titanium), `#7A7D84` (darker variant).
- **Use:** watch cases, drone frames, lamp bodies, device chassis, structural rings.
- **Never use:** as a floor, as a lens, on soft goods, where a warm metal is specified.
- **Examples:** Arcyn Quantum Watch (case), Arcyn Sentinel Drone (frame), Arcyn Fusion Lamp (body).

## 3.2 MAT_LIB_ChampagneGold

- **Purpose:** Warm luxury accent metal. The "premium" signal.
- **Appearance:** Polished warm gold, champagne tone (not yellow), mirror-leaning satin.
- **Metallic:** 1.0
- **Roughness:** 0.18–0.3 (target 0.22). Polished but not mirror.
- **Normal intensity:** 0.05 (near-flawless, only micro pits).
- **Reflection:** strong, crisp.
- **Edge wear:** polished bright at edges.
- **Scratches:** very few, fine swirl.
- **Fingerprints:** visible (gold shows prints) — include 5% smudge.
- **Recommended colors:** `#C9A86A`, highlight `#E4C892`.
- **Use:** accent rings, crown, logo plate, connector tips, diadem band.
- **Never use:** as a large body surface (reserved accent ≤6% area), on functional structural members.
- **Examples:** Arcyn Neural Ring (band), Arcyn Crown Diadem, Arcyn Mech Pen (clip).

## 3.3 MAT_LIB_CarbonComposite

- **Purpose:** Weight-saving structural composite where "light but strong" is the story.
- **Appearance:** 2×2 twill woven carbon fiber, deep near-black with subtle sheen weave.
- **Metallic:** 0.0 (dielectric) — though sometimes modeled with 0.1 sheen.
- **Roughness:** 0.45–0.6 (matte weave).
- **Normal intensity:** 0.3 (woven relief).
- **Clearcoat:** 0.6 clearcoat, clearcoat roughness 0.2 (resin top layer).
- **Reflection:** glossy clearcoat over matte weave.
- **Recommended colors:** `#1A1C20` weave base, `#2A2D33` highlight.
- **Use:** drone shells, vehicle panels, rover arms, gauntlet, helmet shells.
- **Never use:** as a soft interior, on flat non-structural decor.
- **Examples:** Arcyn Sentinel Drone (shell), Arcyn Rover (panels), Arcyn Gauntlet.

## 3.4 MAT_LIB_SoftTouchPolymer

- **Purpose:** Comfort grips, button surrounds, sealed housings.
- **Appearance:** Matte rubberized plastic, fine stippled texture, no specular hotspot.
- **Metallic:** 0.0
- **Roughness:** 0.8–0.95 (target 0.88).
- **Normal intensity:** 0.1 (stipple).
- **Sheen:** 0.2 sheen (optional, for fabric/soft feel).
- **Reflection:** minimal, broad soft.
- **Fingerprints:** none (matte hides them) — but slight dust accumulation 2%.
- **Recommended colors:** `#2B2D31` (Graphite), `#16181C` (Carbon).
- **Use:** grips, button caps, sealed seams, wearable bands (non-metal).
- **Never use:** on reflective hero surfaces, as a lens, where metal is specified.
- **Examples:** Arcyn Pulse Earbuds (case grip), Arcyn Visor (pad), Arcyn Mech Pen (grip).

## 3.5 MAT_LIB_OpticalGlass

- **Purpose:** Lenses, display covers, crystal cores, domes.
- **Appearance:** Clear optical glass, edge brightening, real refraction.
- **Metallic:** 0.0
- **Roughness:** 0.02–0.05 (near-perfect).
- **Transmission:** 0.9–1.0 (glTF `transmission`).
- **IOR:** 1.5 (glass). For sapphire crystal use 1.77.
- **Thickness / Volume:** `KHR_materials_volume` with thickness ~2–5 mm, attenuation slight.
- **Clearcoat:** n/a.
- **Normal intensity:** 0.0 (optical smooth) but micro 0.02 for anti-reflective coating.
- **Reflection:** strong Fresnel at grazing angles.
- **Tint:** very slight cyan or neutral; never colored glass except specified.
- **Recommended colors:** base `#FFFFFF` (but as transmission, not albedo-white); slight `#EAF6FF` tint.
- **Use:** watch crystal, holo projector lens, data crystal, lamp shade, visor lens.
- **Never use:** as a structural opaque part, where metal bezel is required instead.
- **Examples:** Arcyn Quantum Watch (crystal), Arcyn Holo Projector (lens), Arcyn Data Crystal.

## 3.6 MAT_LIB_EmissiveCyan

- **Purpose:** "System alive" indicators, interface glow, data lines.
- **Appearance:** Self-lit cyan, no external light needed, soft bloom.
- **Metallic:** 0.0
- **Roughness:** 0.4 (diffuse emissive surface) or 0.1 if it's a glowing glass.
- **Emission:** color `#3FE0D0`, emission strength 2.0–4.0 (glTF `emissive_strength`).
- **Transmission:** if glowing glass, 0.3 + emission.
- **Use:** indicator rings, status LEDs, data traces, core glow.
- **Never use:** as body paint, on more than one accent per asset, in warm-lit hero moments without reason.
- **Examples:** Arcyn Core Hub (status ring), Arcyn Data Crystal (core), Arcyn Beacon Tower (beam).

## 3.7 MAT_LIB_EmissiveAmber

- **Purpose:** Warning/energy accent, warm glow.
- **Appearance:** Self-lit amber.
- **Emission:** `#FFB000`, strength 2.0–3.0.
- **Use:** power indicators, warning, energy cells.
- **Never use:** as primary interface color (cyan owns that), on cold scenes without intent.
- **Examples:** Arcyn Power Cell, Arcyn Reactor (secondary).

## 3.8 MAT_LIB_AnodizedBlack

- **Purpose:** Stealth structural metal, premium dark frames.
- **Appearance:** Deep black anodized aluminum, fine bead-blast, low sheen.
- **Metallic:** 1.0
- **Roughness:** 0.5–0.65 (matte anodize).
- **Normal intensity:** 0.08 (bead blast).
- **Use:** dark chassis, camera housings, drone arms.
- **Examples:** Arcyn Cyberdeck, Arcyn Helmet (frame).

## 3.9 MAT_LIB_BrushedSteel

- **Purpose:** Mechanical internals, shafts, springs, visible mechanisms.
- **Appearance:** Bright brushed steel, cool, directional.
- **Metallic:** 1.0, **Roughness:** 0.25–0.4.
- **Use:** internal mechanisms, hinges, screws (steel), mechanical reveals.
- **Examples:** Arcyn Vault Safe (bolts), Arcyn Mech Pen (nib mechanism).

## 3.10 MAT_LIB_CeramicWhite

- **Purpose:** Premium ceramic body, gallery-white surfaces.
- **Appearance:** Glossy white ceramic, soft specular, no metal.
- **Metallic:** 0.0, **Roughness:** 0.2–0.35, **Clearcoat:** 0.3.
- **Recommended colors:** `#E8E6E1` (Arcyn Bone).
- **Use:** lamp shades, device tops, relic bases, cradle.
- **Examples:** Arcyn Fusion Lamp (shade), Arcyn Cradle.

## 3.11 MAT_LIB_LeatherComposite

- **Purpose:** Premium soft accessory surfaces (bands, sheaths).
- **Appearance:** Fine-grain matte leather, subtle pore normal.
- **Metallic:** 0.0, **Roughness:** 0.7, **Sheen:** 0.3.
- **Recommended colors:** `#3A2E26` (espresso), `#5A4636` (tan).
- **Use:** watch straps, relic wrapping, sheath.
- **Never use:** on hard structural parts.
- **Examples:** Arcyn Neural Ring (inlay band), Arcyn Scepter (grip wrap).

## 3.12 MAT_LIB_CopperTrace

- **Purpose:** Exposed circuitry, internal tech beauty.
- **Appearance:** Bare copper PCB traces, dark substrate.
- **Metallic:** 1.0 (copper), **Roughness:** 0.3, **AO** strong in gaps.
- **Recommended colors:** `#B87333`.
- **Use:** internal reveals, open devices, energy cores' substrate.
- **Examples:** Arcyn Core Hub (open interior), Arcyn Reactor (core board).

## 3.13 MAT_LIB_DiffuseMatte

- **Purpose:** Neutral display props, interior non-specular parts.
- **Appearance:** Flat matte neutral.
- **Metallic:** 0.0, **Roughness:** 0.95.
- **Recommended colors:** `#9A9CA0` / `#2B2D31`.
- **Use:** backdrops within assets, interior non-reflective.

## 3.14 MAT_LIB_Hologram

- **Purpose:** Volumetric/planar holographic projections (future animation).
- **Appearance:** Transparent cyan scanlines, additive, no depth write.
- **Metallic:** 0.0, **Roughness:** 1.0, **Transmission:** 0.6, **Emission:** cyan 1.5.
- **Use:** hologram planes (Arcyn Holo Projector output), data displays.
- **Examples:** Arcyn Holo Projector (emitted plane), Arcyn Monolith Display (hologram).

## 3.15 MAT_LIB_EnergyField

- **Purpose:** Shield/barrier/force-field effects (future animation).
- **Appearance:** Fresnel rim glow, semi-transparent, animated noise (shader/time).
- **Use:** Arcyn Shield Emitter, Arcyn Beacon Tower field.

## 3.16 MAT_LIB_ForgedMetal

- **Purpose:** Heavy industrial/relic metal with hammered or cast texture.
- **Appearance:** Slightly uneven cast metal, warm or dark.
- **Metallic:** 1.0, **Roughness:** 0.55, **Normal intensity:** 0.4 (cast pits).
- **Use:** Arcyn Relic, Arcyn Scepter head, Arcyn Arch Gate frame.

## 3.17 Material Assignment Matrix

| Asset Category | Primary Body | Accent | Grip | Glass | Internal |
|---|---|---|---|---|---|
| Wearables | AnodizedTitanium | ChampagneGold | SoftTouch / Leather | OpticalGlass | BrushedSteel |
| Devices | AnodizedBlack / Titanium | ChampagneGold | SoftTouch | OpticalGlass | CopperTrace |
| Structures | ForgedMetal / Ceramic | ChampagneGold | — | OpticalGlass | — |
| Vehicles | CarbonComposite | AnodizedTitanium | SoftTouch | OpticalGlass | BrushedSteel |
| Relics | ForgedMetal | ChampagneGold | Leather | OpticalGlass | CopperTrace |

---

# CHAPTER 4 — LIGHTING BIBLE

This chapter governs how Arcyn assets are presented: in the web viewer, in marketing renders, and in future cinematic contexts. Lighting is a *storytelling instrument*. The object is the hero; light is the frame. Even though artists do not ship lights inside GLB (lights are scene-level), every asset MUST be authored and validated under the canonical lighting described here so that it looks correct the moment it enters any compliant scene.

## 4.1 Lighting Philosophy Recap
- Soft, large key. Controlled, long highlights. Reflections as primary story. No hard specular dots. Light for *form reading* first.

## 4.2 Three-Point Base Rig (Canonical Viewer Setup)

Every asset is validated against this rig before submission:

- **Key Light:** Large area/softbox, intensity ~3.0 (arbitrary units), color temperature **5600K** (neutral daylight), positioned upper-front-right at 35° elevation, 30° azimuth. Size large (soft). This defines form.
- **Fill Light:** Large soft area, intensity ~1.2, temperature **6500K** (cool), opposite side, lower elevation (10°), bigger and softer than key. Prevents crushed shadows without flattening.
- **Rim / Back Light:** Narrow-ish area or spot, intensity ~4.0, temperature **4200K** (warm), directly behind/above, to pop the silhouette and create the signature edge glow.
- **Environment:** HDR (see §4.6) provides the omnipresent reflection base; the three lights are accents on top.

Rule: key > rim > fill in intensity for form; rim must not overpower key on the front face. The cyan accent on assets is *self-emissive*, not lit by these lights.

## 4.3 Key Lights

- Shape: rectangular area light (softbox), aspect ~2:3, large enough to cover the asset with soft falloff.
- Avoid point lights as key (produce ugly round highlights). Use area or mesh-emissive softbox geometry.
- Intensity tuned so the brightest non-emissive specular sits around 0.8–0.95 in linear (just under clip) to preserve highlight color (no blown white).
- For metals, the key's *reflection* is what you see, not its direct hit — so the softbox shape should be elegant (a soft vertical gradient, like a studio).

## 4.4 Fill Lights

- Purpose: lift shadow floor to ~0.15 linear so detail remains visible in occlusion, but shadows still read.
- Cool temperature to separate from warm rim.
- MUST NOT create a second key (no competing highlights). If you see two equally bright highlights, reduce fill.

## 4.5 Rim Lights

- The signature Arcyn look: a warm, thin, bright edge along the top/back silhouette.
- Use a focused area or a curved emissive strip behind the asset. For hero renders, a "cyc light" wrapping the back.
- Rim intensity high but narrow; it should trace the silhouette, not wash the back face.
- On dark (Carbon/AnodizedBlack) assets, the rim is essential to separate them from the dark stage.

## 4.6 HDR / Environment Maps

- **Primary HDR:** `Arcyn_Studio.exr` — a neutral, soft, gradient studio environment (bright top, darker floor, subtle warm/cool separation). Resolution 2K×1K equirect or higher. Provides clean, premium reflections.
- **Secondary HDR (cinematic):** `Arcyn_Dusk.exr` — warm low-sun gradient for mood pieces. Used only with Art Direction approval.
- Environment intensity (envMapIntensity): **1.0** baseline; metals may use 1.1, glass 1.0, soft-touch 0.6.
- Never use a busy/chaotic HDR (cityscapes with neon) as the default — it fights the calm brand. A clean studio HDR is mandatory.
- HDR is loaded separately in the web pipeline (`RGBELoader`); it is NOT embedded in GLB.

## 4.7 Reflection Intensity

- `envMapIntensity` per material (§4.6). Tuned so metals reflect the studio softbox elegantly.
- Reflection blur (roughness-driven) must be physically plausible: rougher = blurrier. We do not use sharp reflections on rough materials.
- Reflection planes (Chapter 6) provide ground reflection for hero shots.

## 4.8 Bloom

- **Threshold:** 0.9 linear (only emissive and near-clip highlights bloom).
- **Intensity:** 0.4–0.6 (subtle). Arcyn bloom is a *whisper*, not a glow bomb.
- **Radius:** 0.6 (soft).
- Apply only to `MAT_LIB_Emissive*` and intentional specular clips. Never bloom the whole frame.
- Forbidden: anamorphic lens flares, chromatic-aberration-heavy bloom, "gamey" glow.

## 4.9 Fog

- Default viewer: **no atmospheric fog** (clean gallery). 
- Cinematic mode: exponential height fog, density ~0.002, color `#1A1E24` (cool dark), to ground large structures. Never warm fog on heroes.

## 4.10 Exposure

- Camera exposure (EV) tuned so mid-grays (Graphite `#2B2D31`) sit at ~0.18 linear on screen.
- Use ACES filmic tone mapping in the web pipeline for cinematic consistency.
- Avoid over-exposure (clip) and under (muddy). A reference gray card is included in validation scenes.

## 4.11 Volumetrics

- Default: none (keeps it clean and fast).
- Cinematic: light shafts from key only, very low density, no visible "fog cubes." Use for Beacon Tower / energy assets sparingly.

## 4.12 Shadow Softness

- Shadows soft (PCF soft or VSM), radius ~2–4 px. Contact shadow (ground) must be tight and subtle (opacity ~0.25) to ground the asset without a heavy drop shadow.
- Self-shadowing (AO) primarily from baked AO map, not real-time, for performance.

## 4.13 Color Temperatures (Reference Table)

| Light | Temp (K) | Role |
|---|---|---|
| Key | 5600 | Neutral form |
| Fill | 6500 | Cool lift |
| Rim | 4200 | Warm edge |
| Interior practical | 3000 | Warm cozy (rare) |
| Emissive cyan | ~9000 (appears cool) | System alive |
| Emissive amber | ~2000 (appears warm) | Energy/warning |

## 4.14 Performance Considerations

- Real-time viewer uses: 1 key area + 1 fill area + 1 rim area + HDR IBL + 1 contact shadow. No dynamic shadows from 3 lights (use IBL + baked AO). This keeps it cheap.
- Mobile: drop rim to a cheaper emissive strip; reduce HDR to 1K; disable volumetrics/bloom or reduce.

## 4.15 Art-Mode Toggle (Toon)

- A deliberate "blueprint/toon" mode MAY be offered: flat shading + 1px dark outline (inverted-hull) + reduced env. This is the ONLY permitted stylization and must be clearly a "mode," never the default. Documented for accessibility/curiosity, not brand.

## 4.16 Per-Asset Lighting Notes

Every asset in Chapter 5 includes a "Lighting Behavior" subsection describing how it should be lit (e.g., glass assets need a bright key to show refraction; dark assets need stronger rim). Follow those over generic guidance when they conflict.

---

# CHAPTER 5 — ASSET SPECIFICATIONS

This chapter specifies **all 45 assets** in the Arcyn library. Each asset is a contract. The order follows the asset catalogue:

**Catalogue Index**
1. Arcyn Core Hub · 2. Arcyn Holo Projector · 3. Arcyn Quantum Watch · 4. Arcyn Pulse Earbuds · 5. Arcyn Neural Ring · 6. Arcyn Data Crystal · 7. Arcyn Power Cell · 8. Arcyn Fusion Lamp · 9. Arcyn Sentinel Drone · 10. Arcyn Orbital Speaker · 11. Arcyn Vault Safe · 12. Arcyn Monolith Display · 13. Arcyn Cyberdeck · 14. Arcyn Visor Goggles · 15. Arcyn Keycard · 16. Arcyn Mech Pen · 17. Arcyn Token Coin · 18. Arcyn Cube Puzzle · 19. Arcyn Beacon Tower · 20. Arcyn Thruster Pack · 21. Arcyn Shield Emitter · 22. Arcyn Energy Blade · 23. Arcyn Gauntlet · 24. Arcyn Helmet · 25. Arcyn Crown Diadem · 26. Arcyn Scepter · 27. Arcyn Orb Astrolabe · 28. Arcyn Pylon · 29. Arcyn Ring Torus · 30. Arcyn Prism · 31. Arcyn Capsule · 32. Arcyn Cradle · 33. Arcyn Pedestal · 34. Arcyn Arch Gate · 35. Arcyn Relic · 36. Arcyn Glyph Tablet · 37. Arcyn Compass · 38. Arcyn Lens · 39. Arcyn Filament · 40. Arcyn Engine Block · 41. Arcyn Satellite · 42. Arcyn Rover · 43. Arcyn Turret · 44. Arcyn Antenna · 45. Arcyn Reactor

---

## 5.1 ARCYN CORE HUB

- **Spec Version:** 1.0
- **Category:** Devices / Hero
- **Purpose:** The flagship central command instrument — a palm-sized monolith that anchors the Arcyn world. It is the "home" object users return to.
- **Story:** Forged by Arcyn as the master node linking all other devices. It hums with quiet intelligence.
- **Design inspiration:** Bang & Olufsen speaker × monolith × astronomical instrument. A vertical slab with a recessed glowing core.
- **Silhouette:** Tall rounded rectangular prism, slight taper, dominant vertical axis. Reads as "monolith" at 32px.
- **Shape language:** Primary solid (rounded slab) + secondary cut (recessed core window) + tertiary (etched ring, screw ports).
- **Dimensions:** 0.090 m W × 0.140 m H × 0.050 m D (real). Presentation scale normalized so H=1.0 in hero mode.
- **Golden ratio:** Height:width ≈ 1.55 (φ). Core window positioned at 0.618 of height from base.
- **Construction:** Two-piece anodized titanium shell (front/back) + glass core window + internal copper-trace board (visible when "open" future animation).
- **Mechanical logic:** Magnetic seam split at mid-height; core window is a separate glass insert retained by a champagne ring.
- **Materials:** Body `MAT_LIB_AnodizedTitanium`; core ring `MAT_LIB_ChampagneGold`; window `MAT_LIB_OpticalGlass`; interior `MAT_LIB_CopperTrace`; status `MAT_LIB_EmissiveCyan`.
- **Surface finish:** Bead-blasted satin titanium; polished champagne ring; optical-clear glass.
- **Micro details:** Etched model no. "ARCYN-CORE-01" on base; witness mark alignment arrow; 4 recessed screw ports.
- **Large details:** Recessed core window (12 mm dia), top vent grille (fine slots).
- **Tiny details:** Screw port cross-recess (2 mm), laser-etched serial under window.
- **Bevel radius:** 2 mm on outer edges; 1 mm on panel breaks; 0.4 mm on etched rings.
- **Edge treatment:** Soft outer fillet → hard chamfer at seam.
- **Visible screws:** 4 recessed, hidden under cap; not surface-screwed.
- **Panel gaps:** Seam gap 0.3 mm, uniform.
- **Internal structure:** Copper board with cyan LED; battery cavity (empty, for future).
- **Weight distribution:** Bottom-heavy (implied mass at base) for stability read.
- **Balance:** Vertical center of mass low.
- **Interaction points:** Top capacitive ring (cyan pulse on hover); seam (opens).
- **Reflection behavior:** Reflects studio softbox as a long vertical highlight; glass window shows internal cyan glow.
- **Wear patterns:** Polished edges at base (shelf wear); otherwise factory.
- **Lighting behavior:** Needs strong rim to separate dark slab from dark stage; key to read titanium grain.
- **Animation preparation:** Seam pivot at mid-height hinge; core window slides up 8 mm; LED pulse emissive animation. See Ch.7.
- **Pivot locations:** `CoreHub_Seam_Pivot` at mid-height back edge; `CoreHub_Window_Pivot` center.
- **Mesh separation:** Shell_Front, Shell_Back, CoreWindow_Glass, CoreRing, InteriorBoard, StatusLED_Emissive.
- **LOD recommendations:** LOD0 60k tri; LOD1 25k; LOD2 8k.
- **Triangle budget:** ≤ 60,000 (LOD0).
- **Vertex budget:** ≤ 90,000.
- **UV layout:** One 0–1 for shell (2K), separate 0–1 for glass/interior (1K).
- **Texture resolution:** Albedo/Normal/ORM 2K; Emission 1K.
- **Naming:** `ArcynCoreHub_Root` + parts per §2.8.
- **Folder structure:** `Source/Devices/ArcynCoreHub/`.
- **Export settings:** glTF 2.0, Y-up, Draco optional, KTX2 textures, separate HDR.
- **Optimization:** Merge shell halves by material; keep emissive separate draw call.
- **Mobile optimization:** LOD1 default on mobile; drop emission bloom to intensity 0.3.
- **Three.js optimization:** `meshopt` geometry; `KTX2` textures; `envMapIntensity` 1.0.
- **Accessibility:** High emissive contrast for low-vision; avoid relying on cyan-only signaling (add subtle motion).
- **Quality checklist:** [ ] Seam uniform 0.3mm [ ] No inverted normals [ ] Cyan only on status [ ] Bevels present [ ] Texel ≥256 tp/m.
- **Acceptance criteria:** Passes Khronos validator; loads <2s on mid mobile; reads as monolith at 32px.
- **Common mistakes:** Making it too "speaker-like"; forgetting the recessed window depth; pure-white glass albedo.
- **Things NEVER to do:** Add visible front screws; use neon colors beyond cyan; make it symmetric-boring (offset the core slightly).
- **Future animation:** Seam open/close, core rise, LED breathing, hologram emission from window.
- **Future cinematic:** Hero close-up with rim light tracing the slab; core glow bloom.

## 5.2 ARCYN HOLO PROJECTOR

- **Spec Version:** 1.0 · **Category:** Devices
- **Purpose:** A desktop emitter that casts a volumetric hologram (the Arcyn logo / data).
- **Story:** A presentation instrument for the Arcyn world; the "voice" of the system.
- **Design inspiration:** Braun projector × lens housing × minimalist speaker.
- **Silhouette:** Short wide cylinder with a domed top lens; reads as "projector/lamp" at 32px.
- **Shape language:** Cylinder primary + dome (glass) + base ring.
- **Dimensions:** 0.120 m dia × 0.080 m H.
- **Golden ratio:** Dome height : body height ≈ 0.382.
- **Construction:** Metal base + soft-touch mid + glass dome + internal emitter LED.
- **Mechanical logic:** Dome is a fixed glass cap; emitter hidden below; hologram plane spawns above (future).
- **Materials:** Base `AnodizedTitanium`; mid `SoftTouchPolymer`; dome `OpticalGlass`; emitter `EmissiveCyan`.
- **Surface finish:** Satin base, matte mid, clear dome.
- **Micro details:** Etched ring with "PROJECT" icon; vent slots on base.
- **Large details:** 80 mm dome; 120 mm base.
- **Tiny details:** 1.5 mm indicator dot.
- **Bevel radius:** 1.5 mm outer; 0.5 mm ring edges.
- **Edge treatment:** Soft dome fillet, hard base chamfer.
- **Visible screws:** None (seamless base).
- **Panel gaps:** Base/mid gap 0.3 mm.
- **Internal structure:** Emitter board + lens stack (modeled for open animation).
- **Weight distribution:** Bottom-heavy.
- **Balance:** Stable, low center.
- **Interaction points:** Top dome tap (future); base ring glow.
- **Reflection behavior:** Dome reflects environment as a bright cap; base shows softbox streak.
- **Wear patterns:** Base edge polish.
- **Lighting behavior:** Needs bright key for dome refraction; emit cyan only from inside.
- **Animation preparation:** Dome hinges back 15°; hologram plane scales up; emitter pulses.
- **Pivot locations:** `Holo_Dome_Pivot` at dome back edge.
- **Mesh separation:** Base, Mid, Dome_Glass, Emitter_Emissive, HologramPlane (future).
- **LOD:** 40k / 16k / 5k.
- **Triangle budget:** ≤ 40,000.
- **Vertex budget:** ≤ 60,000.
- **UV:** 0–1 shell 2K, 0–1 glass 1K.
- **Texture resolution:** 2K shell, 1K glass, 1K emission.
- **Naming/Folder/Export:** Per §2 standards; `Source/Devices/ArcynHoloProjector/`.
- **Optimization:** Dome separate (transmission cost); rest merged.
- **Mobile:** LOD1; disable hologram plane default.
- **Three.js:** transmission material; bloom on emitter.
- **Accessibility:** Hologram has high-contrast outline option.
- **Quality checklist:** [ ] Dome IOR 1.5 [ ] No pure-white glass [ ] Emitter centered.
- **Acceptance:** Validator pass; transmission renders correctly in three.js.
- **Common mistakes:** Dome too reflective (mirror); emitter visible from outside.
- **NEVER:** Use colored (non-cyan) emitter; make dome opaque.
- **Future animation:** Hologram scanlines, dome open, emitter spin.
- **Future cinematic:** Volumetric beam, dust catching light.

## 5.3 ARCYN QUANTUM WATCH

- **Spec Version:** 1.0 · **Category:** Wearables / Hero
- **Purpose:** The premium wearable — a statement time instrument.
- **Story:** Arcyn's entry into personal luxury; precise, calm, eternal.
- **Design inspiration:** Cartier × Apple Watch × astronomical complication.
- **Silhouette:** Round case with integrated lugs + strap; reads as "watch" at 32px.
- **Shape language:** Cylinder (case) + torus (bezel) + strap slabs.
- **Dimensions:** Case 0.042 m dia × 0.011 m thick; strap 0.020 m W.
- **Golden ratio:** Case dia : thickness ≈ 3.8 (thin elegance).
- **Construction:** Titanium case + sapphire crystal + champagne bezel + leather/soft strap + internal movement (modeled).
- **Mechanical logic:** Caseback removable (future); crown rotates (future); crystal press-fit.
- **Materials:** Case `AnodizedTitanium`; bezel `ChampagneGold`; crystal `OpticalGlass` (IOR 1.77 sapphire); strap `LeatherComposite` or `SoftTouch`; hands `BrushedSteel`.
- **Surface finish:** Polished bezel, satin case, clear crystal.
- **Micro details:** Etched "ARCYN" at 12 o'clock; tick marks; serial on caseback.
- **Large details:** 42 mm case; 38 mm dial.
- **Tiny details:** 0.3 mm second-hand; screw-down crown 2 mm.
- **Bevel radius:** 0.4 mm case edges; 0.2 mm bezel.
- **Edge treatment:** Polished bezel bevel, soft case fillet.
- **Visible screws:** Caseback 4 screws (intentional, technical).
- **Panel gaps:** Crystal-case 0.1 mm.
- **Internal structure:** Movement plate, gear hints, battery (empty).
- **Weight distribution:** Case-heavy, strap light.
- **Balance:** Wears balanced.
- **Interaction points:** Crown (rotate), caseback (open).
- **Reflection behavior:** Sapphire crystal edge-bright; bezel mirror polish; case satin streak.
- **Wear patterns:** Caseback screw wear; strap creases (future).
- **Lighting behavior:** Strong key for crystal refraction; rim to separate thin case.
- **Animation preparation:** Crown rotates 360°; hands tick; caseback unscrews.
- **Pivot locations:** `Watch_Crown_Pivot` center of crown axis; `Watch_Caseback_Pivot`.
- **Mesh separation:** Case, Bezel, Crystal_Glass, Dial, Hands, Strap_L, Strap_R, Caseback.
- **LOD:** 25k / 10k / 3k.
- **Triangle budget:** ≤ 25,000.
- **Vertex budget:** ≤ 35,000.
- **UV:** Dial 0–1 1K (crisp text); case 0–1 2K; strap 0–1 1K.
- **Texture resolution:** 2K case, 1K dial, 1K strap.
- **Naming/Folder:** `Source/Wearables/ArcynQuantumWatch/`.
- **Optimization:** Merge case+bezel? Keep separate for material; merge non-anim parts.
- **Mobile:** LOD1; reduce crystal transmission samples.
- **Three.js:** transmission + clearcoat off; emissive none (unless digital dial).
- **Accessibility:** Dial high contrast; avoid time-only-cyan.
- **Quality checklist:** [ ] Sapphire IOR 1.77 [ ] No pure white [ ] Hands centered.
- **Acceptance:** Validator pass; crystal refraction visible.
- **Common mistakes:** Too thick; bezel not polished; crystal too reflective.
- **NEVER:** Use neon strap; make digital-only (keep analog hands).
- **Future animation:** Hand sweep, crown wind, complication rotate.
- **Future cinematic:** Macro of crystal catching light, reflection of wearer.

## 5.4 ARCYN PULSE EARBUDS

- **Spec Version:** 1.0 · **Category:** Wearables
- **Purpose:** Premium wireless earbuds + charging case.
- **Story:** Arcyn's intimate audio companion.
- **Design inspiration:** B&O earbuds × pebble case.
- **Silhouette:** Rounded pebble case + two bud shapes; reads as "earbuds" at 32px.
- **Dimensions:** Case 0.055 m × 0.045 m × 0.025 m; bud 0.025 m.
- **Golden ratio:** Case W:H ≈ 1.22.
- **Construction:** Soft-touch case + titanium rim + glass lid + 2 buds (polymer+metal).
- **Materials:** Case `SoftTouchPolymer` + `AnodizedTitanium` rim; buds `SoftTouch` + `BrushedSteel` mesh.
- **Surface finish:** Matte case, polished rim.
- **Micro details:** Etched lid logo; LED dot (cyan).
- **Large details:** Lid glass window.
- **Tiny details:** 0.8 mm bud mesh holes.
- **Bevel radius:** 1 mm case; 0.3 mm buds.
- **Visible screws:** None.
- **Panel gaps:** Lid gap 0.2 mm.
- **Internal:** Buds sit in milled cavities (modeled).
- **Weight:** Even.
- **Interaction:** Lid opens (future); buds lift.
- **Reflection:** Rim polish; case matte no hotspot.
- **Wear:** Lid edge polish.
- **Lighting:** Soft key; rim for rim.
- **Animation:** Lid hinge 110°; buds rise.
- **Pivot:** `Earbuds_Lid_Pivot` back edge.
- **Mesh sep:** Case, Lid_Glass, Rim, Bud_L, Bud_R, LED_Emissive.
- **LOD:** 15k / 6k / 2k.
- **Tri budget:** ≤ 15,000.
- **Vertex:** ≤ 22,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Wearables/ArcynPulseEarbuds/`.
- **Optimization:** Merge case+rim.
- **Mobile:** LOD1.
- **Three.js:** Standard PBR; LED bloom.
- **Quality:** [ ] Lid gap uniform [ ] Buds seated.
- **Acceptance:** Validator pass.
- **Common:** Lid too heavy; buds float.
- **NEVER:** Neon case.
- **Future:** Lid open, buds animate, sound wave (shader).
- **Cinematic:** Case on pedestal, slow rotate.

## 5.5 ARCYN NEURAL RING

- **Spec Version:** 1.0 · **Category:** Wearables
- **Purpose:** A smart ring — subtle, personal, premium.
- **Story:** The most personal Arcyn device; a quiet sensor of intent.
- **Design inspiration:** Signet ring × Oura × titanium band.
- **Silhouette:** Thin torus with a raised sensor bump; reads as "ring" at 32px.
- **Dimensions:** Outer dia 0.021 m, band width 0.007 m, thickness 0.0025 m.
- **Golden ratio:** Band width : outer dia ≈ 0.33.
- **Construction:** Titanium band + champagne inlay + sensor window (glass) + leather liner (optional).
- **Materials:** Band `AnodizedTitanium`; inlay `ChampagneGold`; sensor `OpticalGlass`; liner `LeatherComposite`.
- **Surface finish:** Polished inlay, satin band.
- **Micro:** Etched "A" mark; serial inside.
- **Large:** Sensor bump 3 mm.
- **Tiny:** 0.2 mm engraving.
- **Bevel:** 0.3 mm edges.
- **Visible screws:** None.
- **Panel gaps:** Inlay seam 0.1 mm.
- **Internal:** Sensor cavity modeled.
- **Weight:** Even, light.
- **Interaction:** None visible; sensor glows cyan (future).
- **Reflection:** Mirror inlay, satin band streak.
- **Wear:** Inner band slight polish.
- **Lighting:** Key for inlay; rim for edge.
- **Animation:** Sensor pulse; ring rotates on finger (future).
- **Pivot:** Center axis.
- **Mesh sep:** Band, Inlay, Sensor_Glass, Liner.
- **LOD:** 12k / 5k / 1.5k.
- **Tri:** ≤ 12,000.
- **Vertex:** ≤ 18,000.
- **UV:** 0–1 1K.
- **Tex:** 1K.
- **Folder:** `Source/Wearables/ArcynNeuralRing/`.
- **Optimization:** Single mesh + separate inlay/sensor.
- **Mobile:** LOD1.
- **Three.js:** transmission sensor; emissive pulse.
- **Quality:** [ ] Inlay centered [ ] No seam gap error.
- **Acceptance:** Validator pass.
- **Common:** Too thick; inlay off-center.
- **NEVER:** Colored band.
- **Future:** Sensor breathing glow, spin.
- **Cinematic:** Macro, reflection of environment in inlay.

## 5.6 ARCYN DATA CRYSTAL

- **Spec Version:** 1.0 · **Category:** Relics / Hero
- **Purpose:** A sculptural data artifact — pure Arcyn symbolism.
- **Story:** A shard containing the world's memory; glowing core.
- **Design inspiration:** Quartz crystal × sci-fi data core × gemstone.
- **Silhouette:** Faceted elongated octahedral shard; reads as "crystal" at 32px.
- **Dimensions:** 0.060 m H × 0.025 m W.
- **Golden ratio:** H:W ≈ 2.4 (elegant shard).
- **Construction:** Optical glass body + internal emissive core (cyan) + titanium base cap.
- **Materials:** Body `OpticalGlass` (IOR 1.6, slight tint); core `EmissiveCyan`; cap `AnodizedTitanium`.
- **Surface finish:** Faceted clear; polished cap.
- **Micro:** Etched facet edges (micro bevel 0.1 mm to catch light).
- **Large:** Base cap 20 mm.
- **Tiny:** 0.2 mm facet lines.
- **Bevel:** 0.1 mm facet edges (not sharp).
- **Visible screws:** None.
- **Internal:** Core lattice modeled.
- **Weight:** Base-heavy implied.
- **Interaction:** Core pulses (future).
- **Reflection:** Strong facet reflections; edge brightening.
- **Wear:** Facet edge micro-chip (subtle).
- **Lighting:** Bright key for refraction sparkle; rim for facets.
- **Animation:** Core pulse; slow rotate; float (future).
- **Pivot:** Base center.
- **Mesh sep:** Body_Glass, Core_Emissive, Cap.
- **LOD:** 20k / 8k / 2.5k.
- **Tri:** ≤ 20,000.
- **Vertex:** ≤ 30,000.
- **UV:** 0–1 2K (normal for facets).
- **Tex:** 2K.
- **Folder:** `Source/Relics/ArcynDataCrystal/`.
- **Optimization:** Transmission costly; LOD1 default mobile.
- **Mobile:** LOD1, reduce transmission.
- **Three.js:** transmission + volume; emissive core bloom.
- **Quality:** [ ] Facets not razor [ ] Core centered.
- **Acceptance:** Transmission renders; validator pass.
- **Common:** Too many facets (busy); pure white.
- **NEVER:** Opaque body; colored core (cyan only).
- **Future:** Data streams inside, float, shatter (cinematic).
- **Cinematic:** Light through crystal casting cyan caustics.

## 5.7 ARCYN POWER CELL

- **Spec Version:** 1.0 · **Category:** Devices
- **Purpose:** A portable energy cell — the "battery as object."
- **Story:** Arcyn's universal power source; robust, trustworthy.
- **Silhouette:** Cylindrical can with cap + indicator; reads as "battery/cell" at 32px.
- **Dimensions:** 0.070 m H × 0.028 m dia.
- **Golden ratio:** H:dia ≈ 2.5.
- **Construction:** Titanium can + champagne cap + amber indicator window + internal cell (modeled).
- **Materials:** Can `AnodizedTitanium`; cap `ChampagneGold`; window `OpticalGlass`; indicator `EmissiveAmber`.
- **Surface finish:** Satin can, polished cap.
- **Micro:** Etched capacity "5000mAh"; vent rings.
- **Large:** Cap 20 mm.
- **Tiny:** 0.5 mm vent slots.
- **Bevel:** 1 mm cap; 0.4 mm can edges.
- **Visible screws:** None (cap thread).
- **Panel gaps:** Cap seam 0.3 mm.
- **Internal:** Cell core modeled (for cutaway future).
- **Weight:** Even.
- **Interaction:** Cap unscrews (future); indicator pulses.
- **Reflection:** Can streak; cap mirror.
- **Wear:** Cap edge polish.
- **Lighting:** Key for can; rim.
- **Animation:** Cap thread off; indicator charge pulse.
- **Pivot:** `Cell_Cap_Pivot` center axis.
- **Mesh sep:** Can, Cap, Window_Glass, Indicator_Emissive, Core.
- **LOD:** 18k / 7k / 2k.
- **Tri:** ≤ 18,000.
- **Vertex:** ≤ 27,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynPowerCell/`.
- **Optimization:** Merge can+core.
- **Mobile:** LOD1.
- **Three.js:** Standard + emissive amber.
- **Quality:** [ ] Cap centered [ ] Thread modeled.
- **Acceptance:** Validator pass.
- **Common:** Too toy-like; smooth can (needs vents).
- **NEVER:** Neon; transparent can.
- **Future:** Charge animation, cutaway.
- **Cinematic:** Glow in dark scene.

## 5.8 ARCYN FUSION LAMP

- **Spec Version:** 1.0 · **Category:** Devices / Environment
- **Purpose:** A ambient light object — sculpture that glows.
- **Story:** Arcyn's domestic object; calm illumination.
- **Design inspiration:** Anglepoise minimalism × paper lantern × plasma globe.
- **Silhouette:** Pedestal + curved arm + glowing orb; reads as "lamp" at 32px.
- **Dimensions:** Total H 0.320 m; orb dia 0.090 m; base 0.120 m.
- **Golden ratio:** Arm length : base dia ≈ 1.618.
- **Construction:** Titanium base + soft-touch arm + ceramic shade/orb (emissive) + glass diffuser.
- **Materials:** Base `AnodizedTitanium`; arm `SoftTouchPolymer`; orb `CeramicWhite` + `EmissiveCyan` (warm-white actual `#FFF2E0`); diffuser `OpticalGlass`.
- **Surface finish:** Matte base/arm; glowing orb.
- **Micro:** Etched base logo; touch ring.
- **Large:** Orb 90 mm.
- **Tiny:** 1 mm touch ring.
- **Bevel:** 2 mm base; 1 mm arm.
- **Visible screws:** None.
- **Panel gaps:** Arm/base 0.3 mm.
- **Internal:** LED board modeled.
- **Weight:** Base-heavy.
- **Interaction:** Touch ring dims/brightens (future).
- **Reflection:** Base streak; orb glow dominates.
- **Wear:** Base edge polish.
- **Lighting:** Self-emissive; key for base.
- **Animation:** Arm tilt; brightness pulse; orb float.
- **Pivot:** `Lamp_Arm_Pivot` base joint; `Lamp_Orb_Pivot` center.
- **Mesh sep:** Base, Arm, Orb_Emissive, Diffuser_Glass, TouchRing.
- **LOD:** 30k / 12k / 4k.
- **Tri:** ≤ 30,000.
- **Vertex:** ≤ 45,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynFusionLamp/`.
- **Optimization:** Orb separate (emissive); rest merged.
- **Mobile:** LOD1; reduce bloom.
- **Three.js:** emissive + bloom; IBL for base.
- **Quality:** [ ] Orb centered [ ] No pure white albedo (use warm).
- **Acceptance:** Validator pass; glow reads warm not cyan.
- **Common:** Orb too cyan; arm too thin.
- **NEVER:** Neon colors; opaque diffuser.
- **Future:** Color temp shift, arm articulate.
- **Cinematic:** Lamp in dark room, soft pool of light.

## 5.9 ARCYN SENTINEL DRONE

- **Spec Version:** 1.0 · **Category:** Vehicles / Hero
- **Purpose:** A hovering sentinel — eyes of Arcyn.
- **Story:** Autonomous guardian; precise, watchful.
- **Design inspiration:** DJI × sci-fi probe × insectoid.
- **Silhouette:** Central body + 4 rotor arms + dome eye; reads as "drone" at 32px.
- **Dimensions:** Span 0.260 m; body 0.090 m; H 0.060 m.
- **Golden ratio:** Span : body ≈ 2.9.
- **Construction:** Carbon shell + titanium arms + glass eye + brushed rotors + cyan status.
- **Materials:** Shell `CarbonComposite`; arms `AnodizedTitanium`; eye `OpticalGlass`; rotors `BrushedSteel`; status `EmissiveCyan`.
- **Surface finish:** Matte weave; polished arms; clear eye.
- **Micro:** Etched arm numbers; vent slots.
- **Large:** Rotor dia 70 mm.
- **Tiny:** 0.5 mm screw heads.
- **Bevel:** 1 mm shell; 0.5 mm arms.
- **Visible screws:** 4 arm-mount screws (technical, intentional).
- **Panel gaps:** Shell seam 0.3 mm.
- **Internal:** Rotor motors modeled.
- **Weight:** Centered.
- **Interaction:** Rotors spin (future); eye tracks.
- **Reflection:** Carbon weave subtle; eye glass reflection.
- **Wear:** Rotor edge micro-wear.
- **Lighting:** Key for form; rim for carbon edge.
- **Animation:** Rotors spin (idle), hover bob, eye glow pulse.
- **Pivot:** `Drone_Rotor_FL_Pivot` etc. (4); `Drone_Eye_Pivot` center.
- **Mesh sep:** Body_Shell, Arm_x4, Rotor_x4, Eye_Glass, StatusLED.
- **LOD:** 90k / 35k / 10k.
- **Tri:** ≤ 90,000.
- **Vertex:** ≤ 135,000.
- **UV:** Body 0–1 2K; rotors 0–1 1K.
- **Tex:** 2K body, 1K rotors.
- **Folder:** `Source/Vehicles/ArcynSentinelDrone/`.
- **Optimization:** Instance rotors (4× same mesh); merge arms.
- **Mobile:** LOD1; rotors low-poly.
- **Three.js:** instanced rotors; emissive eye bloom.
- **Quality:** [ ] Rotors coplanar [ ] Eye centered.
- **Acceptance:** Validator pass; spins correctly.
- **Common:** Rotors not centered on arms; weave too shiny.
- **NEVER:** Weapon mounts; neon body.
- **Future:** Flight path, swarm, camera zoom (eye).
- **Cinematic:** Hover in volumetric light, rotors motion-blur.

## 5.10 ARCYN ORBITAL SPEAKER

- **Spec Version:** 1.0 · **Category:** Devices
- **Purpose:** A floating spherical speaker.
- **Story:** Sound as sculpture.
- **Design inspiration:** Teenage Engineering × floating orb.
- **Silhouette:** Sphere with grille band + base ring; reads as "speaker" at 32px.
- **Dimensions:** Dia 0.130 m; grille band 40 mm.
- **Golden ratio:** Grille band : dia ≈ 0.3.
- **Construction:** Titanium sphere halves + soft-touch grille + glass top + champagne base.
- **Materials:** Sphere `AnodizedTitanium`; grille `SoftTouchPolymer` (perforated); top `OpticalGlass`; base `ChampagneGold`; LED `EmissiveCyan`.
- **Surface finish:** Satin sphere; matte grille.
- **Micro:** Perforation pattern (instanced holes); etched logo.
- **Large:** Grille band.
- **Tiny:** 1 mm perforations.
- **Bevel:** 1.5 mm sphere seam.
- **Visible screws:** None.
- **Panel gaps:** Hemisphere seam 0.3 mm.
- **Internal:** Driver modeled (future cutaway).
- **Weight:** Even.
- **Interaction:** Floats (future); LED pulses to beat.
- **Reflection:** Sphere streak; glass top cap.
- **Wear:** Base edge polish.
- **Lighting:** Key for sphere; rim.
- **Animation:** Float bob; LED rhythm; grille pulse.
- **Pivot:** Center.
- **Mesh sep:** Sphere_Top, Sphere_Bottom, Grille, TopGlass, Base, LED.
- **LOD:** 35k / 14k / 4k.
- **Tri:** ≤ 35,000.
- **Vertex:** ≤ 52,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynOrbitalSpeaker/`.
- **Optimization:** Perforations via normal/alpha not geometry (save tris).
- **Mobile:** LOD1.
- **Three.js:** alpha grille or normal; emissive LED.
- **Quality:** [ ] Perforations uniform [ ] Sphere seamless.
- **Acceptance:** Validator pass.
- **Common:** Grille as solid (must read perforated); seam visible.
- **NEVER:** Neon; asymmetric.
- **Future:** Float, sound visualizer.
- **Cinematic:** Orb in dark, LED glow.

## 5.11 ARCYN VAULT SAFE

- **Spec Version:** 1.0 · **Category:** Structures / Devices
- **Purpose:** A secure vault — mass, trust, impenetrability.
- **Story:** Where Arcyn keeps its secrets.
- **Design inspiration:** Bank vault × minimalist monolith.
- **Silhouette:** Heavy cube with circular door; reads as "safe/vault" at 32px.
- **Dimensions:** 0.300 m cube; door dia 0.200 m.
- **Golden ratio:** Door : body ≈ 0.66.
- **Construction:** Forged steel body + titanium door + champagne dial + brushed bolts.
- **Materials:** Body `AnodizedBlack`; door `ForgedMetal`; dial `ChampagneGold`; bolts `BrushedSteel`.
- **Surface finish:** Matte body; brushed bolts.
- **Micro:** Etched "VAULT"; serial; bolt detail.
- **Large:** Door 200 mm.
- **Tiny:** 2 mm bolts (8).
- **Bevel:** 3 mm body edges; 1 mm door.
- **Visible screws:** 8 door bolts (intentional, technical).
- **Panel gaps:** Door gap 0.5 mm (heavy).
- **Internal:** Safe interior modeled (future open).
- **Weight:** Bottom-heavy, massive.
- **Interaction:** Dial rotates; door swings (future).
- **Reflection:** Body soft; dial mirror.
- **Wear:** Dial edge polish; handle wear.
- **Lighting:** Key for mass; rim essential (dark object).
- **Animation:** Dial spin; door hinge 100°; bolts retract.
- **Pivot:** `Vault_Door_Pivot` hinge left edge; `Vault_Dial_Pivot` center.
- **Mesh sep:** Body, Door, Dial, Bolt_x8, Interior.
- **LOD:** 60k / 25k / 8k.
- **Tri:** ≤ 60,000.
- **Vertex:** ≤ 90,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Structures/ArcynVaultSafe/`.
- **Optimization:** Instance bolts.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive none.
- **Quality:** [ ] Door gap uniform [ ] Bolts coplanar.
- **Acceptance:** Validator pass.
- **Common:** Too light-looking; gap uneven.
- **NEVER:** Neon; transparent.
- **Future:** Open reveal interior glow.
- **Cinematic:** Door swing, interior cyan light spill.

## 5.12 ARCYN MONOLITH DISPLAY

- **Spec Version:** 1.0 · **Category:** Structures / Devices
- **Purpose:** A vertical information display.
- **Story:** Arcyn's public face; data rendered in air.
- **Design inspiration:** Monolith × OLED panel × hologram.
- **Silhouette:** Tall thin slab with glowing face; reads as "display" at 32px.
- **Dimensions:** 0.400 m H × 0.220 m W × 0.030 m D.
- **Golden ratio:** H:W ≈ 1.8.
- **Construction:** Titanium frame + glass screen + emissive hologram plane + base.
- **Materials:** Frame `AnodizedTitanium`; screen `OpticalGlass`; hologram `EmissiveCyan` (Hologram mat); base `AnodizedBlack`.
- **Surface finish:** Satin frame; glass screen.
- **Micro:** Etched frame ticks; bezel logo.
- **Large:** Screen 360×180 mm.
- **Tiny:** 0.5 mm bezel.
- **Bevel:** 2 mm frame.
- **Visible screws:** None (seamless frame).
- **Panel gaps:** Screen-frame 0.2 mm.
- **Internal:** Panel board modeled.
- **Weight:** Base-heavy.
- **Interaction:** Hologram animates (future).
- **Reflection:** Frame streak; screen reflects environment subtly.
- **Wear:** Base edge polish.
- **Lighting:** Key for frame; screen self-emissive.
- **Animation:** Hologram scanlines; data flow.
- **Pivot:** Base center.
- **Mesh sep:** Frame, Screen_Glass, HologramPlane, Base, Panel.
- **LOD:** 40k / 16k / 5k.
- **Tri:** ≤ 40,000.
- **Vertex:** ≤ 60,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Structures/ArcynMonolithDisplay/`.
- **Optimization:** Hologram plane separate (additive).
- **Mobile:** LOD1; hologram lower res.
- **Three.js:** transmission screen; emissive hologram + bloom.
- **Quality:** [ ] Screen flat [ ] Hologram not clipping.
- **Acceptance:** Validator pass.
- **Common:** Screen too mirror; hologram too bright.
- **NEVER:** Colored screen (cyan only).
- **Future:** Live data, UI.
- **Cinematic:** Hologram in dark, volumetric.

## 5.13 ARCYN CYBERDECK

- **Spec Version:** 1.0 · **Category:** Devices
- **Purpose:** A portable computing device — the hacker's instrument.
- **Story:** Arcyn's pro tool; serious, powerful.
- **Design inspiration:** Cyberdeck × laptop × rugged tablet.
- **Silhouette:** Clamshell slab with keyboard + screen; reads as "deck" at 32px.
- **Dimensions:** 0.300 m W × 0.210 m D (open) × 0.020 m thick.
- **Golden ratio:** W:D ≈ 1.43.
- **Construction:** Anodized black body + titanium hinges + glass screen + champagne keys accent.
- **Materials:** Body `AnodizedBlack`; hinges `BrushedSteel`; screen `OpticalGlass`; keys `SoftTouch`; accent `ChampagneGold`.
- **Surface finish:** Matte body; polished hinges.
- **Micro:** Key legends (etched); vent slots; port detail.
- **Large:** Screen 280×170 mm.
- **Tiny:** 1 mm keys.
- **Bevel:** 1.5 mm body.
- **Visible screws:** 4 base screws (technical).
- **Panel gaps:** Lid gap 0.3 mm.
- **Internal:** Keyboard mechanism modeled.
- **Weight:** Even.
- **Interaction:** Lid opens 120° (future); keys press.
- **Reflection:** Body soft; screen reflects.
- **Wear:** Hinge polish.
- **Lighting:** Key for body; rim.
- **Animation:** Lid hinge; key press; screen UI.
- **Pivot:** `Deck_Lid_Pivot` hinge axis.
- **Mesh sep:** Base, Lid, Screen_Glass, Keyboard, Hinge_x2.
- **LOD:** 50k / 20k / 6k.
- **Tri:** ≤ 50,000.
- **Vertex:** ≤ 75,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynCyberdeck/`.
- **Optimization:** Keys instanced; merge base.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive screen optional.
- **Quality:** [ ] Hinge centered [ ] Keys uniform.
- **Acceptance:** Validator pass.
- **Common:** Lid too heavy; keys floating.
- **NEVER:** Neon; toy-like.
- **Future:** Type animation, screen UI.
- **Cinematic:** Open on desk, screen glow.

## 5.14 ARCYN VISOR GOGGLES

- **Spec Version:** 1.0 · **Category:** Wearables
- **Purpose:** AR visor — see the Arcyn layer.
- **Story:** The window to the augmented world.
- **Design inspiration:** Ski goggle × AR glasses × minimalist.
- **Silhouette:** Curved visor band + lenses; reads as "goggles" at 32px.
- **Dimensions:** 0.180 m W × 0.070 m H × 0.090 m D.
- **Golden ratio:** W:H ≈ 2.57.
- **Construction:** Soft-touch frame + optical lens + titanium arms + foam pad.
- **Materials:** Frame `SoftTouchPolymer`; lens `OpticalGlass` (tinted); arms `AnodizedTitanium`; pad `LeatherComposite`.
- **Surface finish:** Matte frame; clear lens.
- **Micro:** Etched temple logo; sensor dots.
- **Large:** Lens 160 mm.
- **Tiny:** 1 mm sensors.
- **Bevel:** 1 mm frame.
- **Visible screws:** None.
- **Panel gaps:** Lens-frame 0.2 mm.
- **Internal:** Display modeled behind lens.
- **Weight:** Even.
- **Interaction:** AR display animates (future).
- **Reflection:** Lens reflects environment; frame matte.
- **Wear:** Foam compression (future).
- **Lighting:** Key for lens; rim for frame.
- **Animation:** Display power-on; arms fold.
- **Pivot:** `Visor_Arm_L_Pivot`, `Visor_Arm_R_Pivot`.
- **Mesh sep:** Frame, Lens_L, Lens_R, Arm_L, Arm_R, Pad.
- **LOD:** 25k / 10k / 3k.
- **Tri:** ≤ 25,000.
- **Vertex:** ≤ 37,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Wearables/ArcynVisorGoggles/`.
- **Optimization:** Merge frame+pad.
- **Mobile:** LOD1.
- **Three.js:** transmission lens; emissive display.
- **Quality:** [ ] Lenses symmetric [ ] No pure white.
- **Acceptance:** Validator pass.
- **Common:** Lens too mirror; arms off.
- **NEVER:** Colored lens (slight tint ok).
- **Future:** AR overlay, fold.
- **Cinematic:** Visor reflecting environment.

## 5.15 ARCYN KEYCARD

- **Spec Version:** 1.0 · **Category:** Devices
- **Purpose:** A secure access card — identity as object.
- **Story:** The key to Arcyn; sleek, trusted.
- **Design inspiration:** Smart card × metal business card.
- **Silhouette:** Thin rounded rectangle; reads as "card" at 32px.
- **Dimensions:** 0.086 m × 0.054 m × 0.0012 m.
- **Golden ratio:** W:H ≈ 1.59 (credit-card φ).
- **Construction:** Titanium card + champagne chip + glass inlay + cyan stripe.
- **Materials:** Card `AnodizedTitanium`; chip `ChampagneGold`; inlay `OpticalGlass`; stripe `EmissiveCyan`.
- **Surface finish:** Brushed titanium; polished chip.
- **Micro:** Etched name; serial; contact pad.
- **Large:** Chip 8 mm.
- **Tiny:** 0.2 mm text.
- **Bevel:** 0.2 mm edges (thin card).
- **Visible screws:** None.
- **Panel gaps:** Chip inlay 0.1 mm.
- **Internal:** Chip module modeled.
- **Weight:** Even, light.
- **Interaction:** Stripe pulses on scan (future).
- **Reflection:** Brushed anisotropic streak.
- **Wear:** Edge micro-chamfer wear.
- **Lighting:** Key for brushed; rim.
- **Animation:** Scan pulse; flip.
- **Pivot:** Center.
- **Mesh sep:** Card, Chip, Inlay_Glass, Stripe_Emissive.
- **LOD:** 8k / 3k / 1k.
- **Tri:** ≤ 8,000.
- **Vertex:** ≤ 12,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynKeycard/`.
- **Optimization:** Flat; few tris.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive stripe.
- **Quality:** [ ] Edges beveled [ ] Text crisp.
- **Acceptance:** Validator pass.
- **Common:** Sharp edges (must bevel); too thick.
- **NEVER:** Neon; plastic.
- **Future:** Scan animation.
- **Cinematic:** Card catching light, flip.

## 5.16 ARCYN MECH PEN

- **Spec Version:** 1.0 · **Category:** Devices
- **Purpose:** A precision writing instrument.
- **Story:** Arcyn's everyday object; weighty, exact.
- **Design inspiration:** Machined pen × fountain pen.
- **Silhouette:** Cylinder with clip + tip; reads as "pen" at 32px.
- **Dimensions:** 0.140 m L × 0.012 m dia.
- **Golden ratio:** L:dia ≈ 11.6 (slender).
- **Construction:** Titanium body + champagne clip + steel nib + soft grip.
- **Materials:** Body `AnodizedTitanium`; clip `ChampagneGold`; nib `BrushedSteel`; grip `SoftTouchPolymer`.
- **Surface finish:** Satin body; polished clip.
- **Micro:** Etched logo; grip rings.
- **Large:** Clip 30 mm.
- **Tiny:** 0.5 mm nib slit.
- **Bevel:** 0.5 mm body; 0.3 mm clip.
- **Visible screws:** None (twist mechanism).
- **Panel gaps:** Section seams 0.2 mm.
- **Internal:** Ink mechanism modeled.
- **Weight:** Even.
- **Interaction:** Twist writes (future); cap posts.
- **Reflection:** Body streak; clip mirror.
- **Wear:** Clip edge polish.
- **Lighting:** Key for body; rim.
- **Animation:** Twist; cap; write.
- **Pivot:** `Pen_Cap_Pivot` axis.
- **Mesh sep:** Body, Cap, Clip, Nib, Grip.
- **LOD:** 12k / 5k / 1.5k.
- **Tri:** ≤ 12,000.
- **Vertex:** ≤ 18,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynMechPen/`.
- **Optimization:** Merge body sections.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive none.
- **Quality:** [ ] Clip aligned [ ] Seams uniform.
- **Acceptance:** Validator pass.
- **Common:** Clip floating; too light.
- **NEVER:** Neon; plastic body.
- **Future:** Write animation.
- **Cinematic:** Pen rolling, macro clip.

## 5.17 ARCYN TOKEN COIN

- **Spec Version:** 1.0 · **Category:** Relics
- **Purpose:** A commemorative token — Arcyn identity object.
- **Story:** The mark of belonging.
- **Design inspiration:** Challenge coin × medallion.
- **Silhouette:** Short cylinder with relief; reads as "coin" at 32px.
- **Dimensions:** Dia 0.040 m × 0.004 m thick.
- **Golden ratio:** Dia:thick ≈ 10.
- **Construction:** Champagne gold coin + titanium edge + glass inlay center.
- **Materials:** Coin `ChampagneGold`; edge `AnodizedTitanium`; inlay `OpticalGlass` + `EmissiveCyan`.
- **Surface finish:** Polished coin; satin edge.
- **Micro:** Relief "A" emblem; milled edge; serial.
- **Large:** Inlay 12 mm.
- **Tiny:** 0.3 mm relief.
- **Bevel:** 0.3 mm edge.
- **Visible screws:** None.
- **Panel gaps:** Inlay 0.1 mm.
- **Internal:** None.
- **Weight:** Even, dense.
- **Interaction:** Inlay glows (future).
- **Reflection:** Mirror coin; edge streak.
- **Wear:** Edge handling polish.
- **Lighting:** Key for relief; rim.
- **Animation:** Spin; glow pulse.
- **Pivot:** Center axis.
- **Mesh sep:** Coin, Edge, Inlay_Glass, Emblem_Emissive.
- **LOD:** 10k / 4k / 1.2k.
- **Tri:** ≤ 10,000.
- **Vertex:** ≤ 15,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Relics/ArcynTokenCoin/`.
- **Optimization:** Cylinder low-seg ok (rounded needs more).
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive inlay.
- **Quality:** [ ] Relief crisp [ ] Inlay centered.
- **Acceptance:** Validator pass.
- **Common:** Too flat relief; sharp edge.
- **NEVER:** Plastic; neon.
- **Future:** Spin, glow.
- **Cinematic:** Coin flip, light catch.

## 5.18 ARCYN CUBE PUZZLE

- **Spec Version:** 1.0 · **Category:** Devices / Relics
- **Purpose:** A mechanical puzzle — play as object.
- **Story:** Arcyn's invitation to engage.
- **Design inspiration:** Puzzle cube × machined block.
- **Silhouette:** Cube with segmented faces; reads as "cube" at 32px.
- **Dimensions:** 0.060 m cube.
- **Golden ratio:** n/a (cube).
- **Construction:** Titanium frame + 9 soft-touch tiles/face + champagne core.
- **Materials:** Frame `AnodizedTitanium`; tiles `SoftTouchPolymer`; core `ChampagneGold`; accent `EmissiveCyan` (solved).
- **Surface finish:** Satin frame; matte tiles.
- **Micro:** Etched tile marks; alignment arrows.
- **Large:** 60 mm.
- **Tiny:** 0.5 mm gaps.
- **Bevel:** 1 mm edges.
- **Visible screws:** None (snap).
- **Panel gaps:** Tile gaps 0.5 mm uniform.
- **Internal:** Core modeled.
- **Weight:** Even.
- **Interaction:** Tiles rotate (future); solved glows.
- **Reflection:** Frame streak; tiles matte.
- **Wear:** Tile edge polish.
- **Lighting:** Key for form; rim.
- **Animation:** Rotate faces; solve glow.
- **Pivot:** `Cube_Face_Px_Pivot` etc. (9 per face axis).
- **Mesh sep:** Frame, Tile_xN, Core_Emissive.
- **LOD:** 20k / 8k / 2.5k.
- **Tri:** ≤ 20,000.
- **Vertex:** ≤ 30,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynCubePuzzle/`.
- **Optimization:** Instance tiles.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive core.
- **Quality:** [ ] Gaps uniform [ ] Tiles coplanar.
- **Acceptance:** Validator pass.
- **Common:** Gaps uneven; tiles float.
- **NEVER:** Neon; asymmetric marks.
- **Future:** Solve animation.
- **Cinematic:** Slow rotate, solve glow.

## 5.19 ARCYN BEACON TOWER

- **Spec Version:** 1.0 · **Category:** Structures / Hero
- **Purpose:** A tall signal beacon — Arcyn's landmark.
- **Story:** The lighthouse of the world.
- **Design inspiration:** Monolith tower × radio beacon × obelisk.
- **Silhouette:** Tall tapered tower + glowing crown; reads as "tower" at 32px.
- **Dimensions:** H 1.200 m × base 0.200 m × crown 0.120 m.
- **Golden ratio:** H:base ≈ 6 (tall).
- **Construction:** Forged metal shaft + titanium rings + glass crown + energy field.
- **Materials:** Shaft `ForgedMetal`; rings `AnodizedTitanium`; crown `OpticalGlass`; beam `EmissiveCyan`; field `EnergyField`.
- **Surface finish:** Cast shaft; polished rings.
- **Micro:** Etched banding; rivet rows.
- **Large:** Crown 120 mm.
- **Tiny:** 2 mm rivets.
- **Bevel:** 3 mm shaft; 1 mm rings.
- **Visible screws:** Rivet rows (intentional).
- **Panel gaps:** Ring seams 0.4 mm.
- **Internal:** Emitter core modeled.
- **Weight:** Base-heavy.
- **Interaction:** Beam pulses (future); field activates.
- **Reflection:** Shaft subtle; crown reflection.
- **Wear:** Base weathering (subtle).
- **Lighting:** Key for mass; rim; emissive crown.
- **Animation:** Beam sweep; field shimmer; crown pulse.
- **Pivot:** Base center.
- **Mesh sep:** Shaft, Ring_xN, Crown_Glass, Beam_Emissive, Field.
- **LOD:** 120k / 50k / 15k.
- **Tri:** ≤ 120,000.
- **Vertex:** ≤ 180,000.
- **UV:** 0–1 4K (large) tiled.
- **Tex:** 4K.
- **Folder:** `Source/Structures/ArcynBeaconTower/`.
- **Optimization:** Instance rings/rivets; tiling material.
- **Mobile:** LOD1; beam off default.
- **Three.js:** transmission crown; emissive beam + bloom; field shader.
- **Quality:** [ ] Vertical plumb [ ] Rings even.
- **Acceptance:** Validator pass; loads <3s.
- **Common:** Leaning; rings uneven.
- **NEVER:** Neon body; transparent shaft.
- **Future:** Beam sweep, field.
- **Cinematic:** Tower at dusk, beam through fog.

## 5.20 ARCYN THRUSTER PACK

- **Spec Version:** 1.0 · **Category:** Vehicles / Wearable
- **Purpose:** A personal propulsion pack.
- **Story:** Arcyn's freedom device.
- **Design inspiration:** Jetpack × sci-fi rig.
- **Silhouette:** Backpack with twin nozzles; reads as "jetpack" at 32px.
- **Dimensions:** 0.500 m H × 0.400 m W × 0.250 m D.
- **Golden ratio:** H:W ≈ 1.25.
- **Construction:** Carbon shell + titanium frame + steel nozzles + cyan thruster glow.
- **Materials:** Shell `CarbonComposite`; frame `AnodizedTitanium`; nozzle `BrushedSteel`; glow `EmissiveCyan`/Amber.
- **Surface finish:** Matte weave; polished nozzle.
- **Micro:** Etched panels; vent slots; strap detail.
- **Large:** Nozzles 80 mm.
- **Tiny:** 1 mm screws.
- **Bevel:** 2 mm shell; 1 mm frame.
- **Visible screws:** Panel screws (technical).
- **Panel gaps:** Panels 0.4 mm.
- **Internal:** Thruster core modeled.
- **Weight:** Centered (worn).
- **Interaction:** Nozzles gimbal (future); glow pulses.
- **Reflection:** Weave subtle; nozzle mirror.
- **Wear:** Nozzle soot (subtle).
- **Lighting:** Key for form; rim.
- **Animation:** Nozzle gimbal; flame pulse; straps flex.
- **Pivot:** `Thruster_Nozzle_L_Pivot`, `Thruster_Nozzle_R_Pivot`.
- **Mesh sep:** Shell, Frame, Nozzle_x2, Strap_x2, Glow_Emissive.
- **LOD:** 90k / 35k / 10k.
- **Tri:** ≤ 90,000.
- **Vertex:** ≤ 135,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Vehicles/ArcynThrusterPack/`.
- **Optimization:** Instance nozzles; merge shell.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive glow + bloom.
- **Quality:** [ ] Nozzles symmetric [ ] Panels uniform.
- **Acceptance:** Validator pass.
- **Common:** Nozzles off-center; too toy.
- **NEVER:** Neon body; weapon.
- **Future:** Flight, nozzle gimbal.
- **Cinematic:** Pack firing, glow trail.

## 5.21 ARCYN SHIELD EMITTER

- **Spec Version:** 1.0 · **Category:** Devices / Structures
- **Purpose:** A shield projection device.
- **Story:** Arcyn's protection.
- **Design inspiration:** Buckler × emitter × disc.
- **Silhouette:** Disc with core + emitters; reads as "shield" at 32px.
- **Dimensions:** Dia 0.300 m × 0.040 m thick.
- **Golden ratio:** Dia:thick ≈ 7.5.
- **Construction:** Titanium disc + champagne core + glass lenses + energy field.
- **Materials:** Disc `AnodizedTitanium`; core `ChampagneGold`; lens `OpticalGlass`; field `EnergyField` (cyan).
- **Surface finish:** Satin disc; polished core.
- **Micro:** Etched runes; emitter dots.
- **Large:** Core 60 mm.
- **Tiny:** 1 mm emitters.
- **Bevel:** 2 mm disc edge.
- **Visible screws:** None (seamless).
- **Panel gaps:** Core 0.3 mm.
- **Internal:** Emitter lattice modeled.
- **Weight:** Even, light.
- **Interaction:** Field activates (future); core spins.
- **Reflection:** Disc streak; core mirror.
- **Wear:** Edge handling polish.
- **Lighting:** Key for disc; rim; field glow.
- **Animation:** Field expand; core spin; pulse.
- **Pivot:** Center axis.
- **Mesh sep:** Disc, Core, Lens_xN, Field_Emissive.
- **LOD:** 40k / 16k / 5k.
- **Tri:** ≤ 40,000.
- **Vertex:** ≤ 60,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynShieldEmitter/`.
- **Optimization:** Instance lenses.
- **Mobile:** LOD1; field off default.
- **Three.js:** Standard; field shader + bloom.
- **Quality:** [ ] Disc flat [ ] Core centered.
- **Acceptance:** Validator pass.
- **Common:** Field clipping; core off.
- **NEVER:** Neon; opaque field.
- **Future:** Shield expand, block.
- **Cinematic:** Shield deflecting light.

## 5.22 ARCYN ENERGY BLADE

- **Spec Version:** 1.0 · **Category:** Weapons (ceremonial) / Hero
- **Purpose:** A ceremonial energy blade — Arcyn's icon of resolve.
- **Story:** Forged for defense, not war; calm power.
- **Design inspiration:** Katana × light blade × minimalist.
- **Silhouette:** Hilt + elongated blade; reads as "blade" at 32px.
- **Dimensions:** Total 0.900 m; blade 0.650 m; hilt 0.250 m.
- **Golden ratio:** Blade:hilt ≈ 2.6.
- **Construction:** Titanium hilt + champagne guard + glass blade (cyan emissive core).
- **Materials:** Hilt `AnodizedTitanium`; guard `ChampagneGold`; blade `OpticalGlass` + `EmissiveCyan` core; grip `LeatherComposite`.
- **Surface finish:** Satin hilt; clear blade.
- **Micro:** Etched hilt marks; guard filigree.
- **Large:** Guard 60 mm.
- **Tiny:** 0.3 mm blade edge.
- **Bevel:** 1 mm hilt; blade edge micro 0.1 mm.
- **Visible screws:** None (wrap grip).
- **Panel gaps:** Guard-hilt 0.2 mm.
- **Internal:** Core lattice modeled.
- **Weight:** Hilt-heavy (balance).
- **Interaction:** Blade ignites (future); hum glow.
- **Reflection:** Hilt streak; blade transparent reflection.
- **Wear:** Grip compression (future).
- **Lighting:** Key for hilt; rim; blade self-glow.
- **Animation:** Ignite (blade extends); hum pulse; swing.
- **Pivot:** `Blade_Hilt_Pivot` center; `Blade_Blade_Pivot` base.
- **Mesh sep:** Hilt, Guard, Grip, Blade_Glass, Core_Emissive.
- **LOD:** 35k / 14k / 4k.
- **Tri:** ≤ 35,000.
- **Vertex:** ≤ 52,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Weapons/ArcynEnergyBlade/`.
- **Optimization:** Blade separate (transmission + emissive).
- **Mobile:** LOD1; glow reduced.
- **Three.js:** transmission blade; emissive core + bloom.
- **Quality:** [ ] Blade straight [ ] Guard centered.
- **Acceptance:** Validator pass.
- **Common:** Blade too opaque; hilt toy.
- **NEVER:** Red/neon blade; blood detail.
- **Future:** Ignite, swing, parry.
- **Cinematic:** Blade sweeping, cyan trail.

## 5.23 ARCYN GAUNTLET

- **Spec Version:** 1.0 · **Category:** Wearables / Vehicles
- **Purpose:** A powered gauntlet — strength as object.
- **Story:** Arcyn's tool of making.
- **Design inspiration:** Exoskeleton glove × armor × mech hand.
- **Silhouette:** Hand covering with plates + emitter; reads as "gauntlet" at 32px.
- **Dimensions:** 0.250 m L × 0.120 m W × 0.080 m D.
- **Golden ratio:** L:W ≈ 2.08.
- **Construction:** Carbon plates + titanium joints + soft liner + cyan emitter palm.
- **Materials:** Plates `CarbonComposite`; joints `AnodizedTitanium`; liner `SoftTouch`; emitter `EmissiveCyan`.
- **Surface finish:** Matte weave; polished joints.
- **Micro:** Etched plate lines; hydraulic detail.
- **Large:** Palm emitter 50 mm.
- **Tiny:** 1 mm hydraulics.
- **Bevel:** 1.5 mm plates.
- **Visible screws:** Joint screws (technical).
- **Panel gaps:** Plate gaps 0.4 mm.
- **Internal:** Hydraulic pistons modeled.
- **Weight:** Even, dense.
- **Interaction:** Fingers articulate (future); emitter charges.
- **Reflection:** Weave subtle; joints mirror.
- **Wear:** Knuckle polish.
- **Lighting:** Key for form; rim.
- **Animation:** Finger curl; wrist rotate; charge.
- **Pivot:** Per-finger joints (`Gauntlet_Finger_Index_0_Pivot` etc.).
- **Mesh sep:** Plate_xN, Joint_xN, Liner, Emitter_Emissive.
- **LOD:** 70k / 28k / 8k.
- **Tri:** ≤ 70,000.
- **Vertex:** ≤ 105,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Wearables/ArcynGauntlet/`.
- **Optimization:** Instance plates/joints.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive palm + bloom.
- **Quality:** [ ] Fingers symmetric [ ] Joints aligned.
- **Acceptance:** Validator pass.
- **Common:** Fingers mismatched; too bulky.
- **NEVER:** Weapon spikes; neon.
- **Future:** Grasp, punch charge.
- **Cinematic:** Gauntlet closing fist, glow.

## 5.24 ARCYN HELMET

- **Spec Version:** 1.0 · **Category:** Wearables / Vehicles
- **Purpose:** An interface helmet — perception as object.
- **Story:** Arcyn's window to the field.
- **Design inspiration:** Motorcycle × pilot × minimalist.
- **Silhouette:** Dome + visor + chin; reads as "helmet" at 32px.
- **Dimensions:** 0.300 m H × 0.240 m W × 0.280 m D.
- **Golden ratio:** H:W ≈ 1.25.
- **Construction:** Carbon shell + titanium frame + optical visor + soft interior.
- **Materials:** Shell `CarbonComposite`; frame `AnodizedBlack`; visor `OpticalGlass` (tinted); interior `SoftTouch`.
- **Surface finish:** Matte weave; clear visor.
- **Micro:** Etched vents; sensor dots; logo.
- **Large:** Visor 200 mm.
- **Tiny:** 1 mm vents.
- **Bevel:** 2 mm shell.
- **Visible screws:** None (seamless).
- **Panel gaps:** Visor-frame 0.3 mm.
- **Internal:** Padding modeled.
- **Weight:** Even.
- **Interaction:** Visor raises (future); HUD animates.
- **Reflection:** Weave subtle; visor reflects.
- **Wear:** Interior compression.
- **Lighting:** Key for shell; rim; visor reflection.
- **Animation:** Visor hinge; HUD power.
- **Pivot:** `Helmet_Visor_Pivot` hinge.
- **Mesh sep:** Shell, Frame, Visor_Glass, Interior.
- **LOD:** 60k / 24k / 7k.
- **Tri:** ≤ 60,000.
- **Vertex:** ≤ 90,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Wearables/ArcynHelmet/`.
- **Optimization:** Merge shell+frame.
- **Mobile:** LOD1.
- **Three.js:** transmission visor; emissive HUD.
- **Quality:** [ ] Visor symmetric [ ] No pure white.
- **Acceptance:** Validator pass.
- **Common:** Visor too mirror; shell toy.
- **NEVER:** Neon; skull motifs.
- **Future:** Visor raise, HUD.
- **Cinematic:** Helmet reflecting environment.

## 5.25 ARCYN CROWN DIADEM

- **Spec Version:** 1.0 · **Category:** Wearables / Relics / Hero
- **Purpose:** A ceremonial crown — sovereignty as object.
- **Story:** Arcyn's highest mark.
- **Design inspiration:** Diadem × tiara × minimalist.
- **Silhouette:** Open band with peaks + central gem; reads as "crown" at 32px.
- **Dimensions:** Dia 0.160 m × H 0.060 m (peak).
- **Golden ratio:** Peak:H ≈ relation.
- **Construction:** Champagne gold band + titanium peaks + glass gem (cyan) + leather liner.
- **Materials:** Band `ChampagneGold`; peaks `AnodizedTitanium`; gem `OpticalGlass` + `EmissiveCyan`; liner `LeatherComposite`.
- **Surface finish:** Polished gold; satin peaks.
- **Micro:** Etched filigree; gem facets.
- **Large:** Gem 25 mm.
- **Tiny:** 0.3 mm filigree.
- **Bevel:** 0.4 mm band; 0.2 mm peaks.
- **Visible screws:** None.
- **Panel gaps:** Gem 0.1 mm.
- **Internal:** None.
- **Weight:** Even, light.
- **Interaction:** Gem pulses (future).
- **Reflection:** Gold mirror; gem sparkle.
- **Wear:** Band polish.
- **Lighting:** Key for gold; rim; gem glow.
- **Animation:** Gem pulse; float rotate.
- **Pivot:** Center axis.
- **Mesh sep:** Band, Peak_xN, Gem_Glass, Gem_Emissive, Liner.
- **LOD:** 45k / 18k / 5k.
- **Tri:** ≤ 45,000.
- **Vertex:** ≤ 67,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Relics/ArcynCrownDiadem/`.
- **Optimization:** Instance peaks.
- **Mobile:** LOD1.
- **Three.js:** transmission gem; emissive + bloom.
- **Quality:** [ ] Symmetric [ ] Gem centered.
- **Acceptance:** Validator pass.
- **Common:** Asymmetric; gem off.
- **NEVER:** Neon; plastic.
- **Future:** Gem pulse, rotate.
- **Cinematic:** Crown on pedestal, gem sparkle.

## 5.26 ARCYN SCEPTER

- **Spec Version:** 1.0 · **Category:** Relics / Hero
- **Purpose:** A ceremonial staff — authority as object.
- **Story:** Arcyn's symbol of direction.
- **Design inspiration:** Scepter × staff × wand.
- **Silhouette:** Shaft + head orb; reads as "scepter" at 32px.
- **Dimensions:** Total 0.700 m; shaft 0.550 m; head 0.100 m.
- **Golden ratio:** Head:shaft ≈ 0.18.
- **Construction:** Titanium shaft + forged head + champagne collar + glass orb (cyan).
- **Materials:** Shaft `AnodizedTitanium`; head `ForgedMetal`; collar `ChampagneGold`; orb `OpticalGlass` + `EmissiveCyan`; grip `LeatherComposite`.
- **Surface finish:** Satin shaft; cast head; polished collar.
- **Micro:** Etched scrollwork; grip wrap.
- **Large:** Orb 100 mm.
- **Tiny:** 0.3 mm etch.
- **Bevel:** 0.5 mm shaft; 1 mm head.
- **Visible screws:** None (wrap grip).
- **Panel gaps:** Collar 0.2 mm.
- **Internal:** Core modeled.
- **Weight:** Head-heavy (balance).
- **Interaction:** Orb pulses (future); levitate.
- **Reflection:** Shaft streak; orb sparkle.
- **Wear:** Grip polish.
- **Lighting:** Key for shaft; rim; orb glow.
- **Animation:** Orb pulse; slow rotate; levitate.
- **Pivot:** Center axis.
- **Mesh sep:** Shaft, Head, Collar, Orb_Glass, Orb_Emissive, Grip.
- **LOD:** 40k / 16k / 5k.
- **Tri:** ≤ 40,000.
- **Vertex:** ≤ 60,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Relics/ArcynScepter/`.
- **Optimization:** Merge shaft+grip.
- **Mobile:** LOD1.
- **Three.js:** transmission orb; emissive + bloom.
- **Quality:** [ ] Vertical plumb [ ] Orb centered.
- **Acceptance:** Validator pass.
- **Common:** Bent; orb off.
- **NEVER:** Neon; plastic shaft.
- **Future:** Pulse, levitate.
- **Cinematic:** Scepter raised, orb glow.

## 5.27 ARCYN ORB ASTROLABE

- **Spec Version:** 1.0 · **Category:** Relics / Devices
- **Purpose:** A celestial instrument — cosmos as object.
- **Story:** Arcyn's map of the skies.
- **Design inspiration:** Astrolabe × orrery × armillary.
- **Silhouette:** Nested rings + central orb; reads as "astrolabe" at 32px.
- **Dimensions:** Dia 0.220 m; rings 4; orb 40 mm.
- **Golden ratio:** Ring spacing φ-based.
- **Construction:** Titanium rings + champagne accents + glass orb (cyan) + brass ticks.
- **Materials:** Rings `AnodizedTitanium`; accents `ChampagneGold`; orb `OpticalGlass` + `EmissiveCyan`; ticks `BrushedSteel`.
- **Surface finish:** Satin rings; polished accents.
- **Micro:** Etched degree marks; constellation dots.
- **Large:** Orb 40 mm.
- **Tiny:** 0.2 mm ticks.
- **Bevel:** 0.5 mm rings.
- **Visible screws:** Pivot pins (technical).
- **Panel gaps:** Ring joints 0.2 mm.
- **Internal:** Axle modeled.
- **Weight:** Even.
- **Interaction:** Rings rotate (future); orb glows.
- **Reflection:** Rings streak; orb sparkle.
- **Wear:** Pin polish.
- **Lighting:** Key for rings; rim; orb glow.
- **Animation:** Ring orbit; orb pulse.
- **Pivot:** `Astrolabe_Ring_1_Pivot` etc. (center axes).
- **Mesh sep:** Ring_xN, Accent_xN, Orb_Glass, Orb_Emissive, Axle.
- **LOD:** 50k / 20k / 6k.
- **Tri:** ≤ 50,000.
- **Vertex:** ≤ 75,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Relics/ArcynOrbAstrolabe/`.
- **Optimization:** Instance ticks; merge rings per anim group.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive orb + bloom.
- **Quality:** [ ] Rings concentric [ ] Ticks even.
- **Acceptance:** Validator pass.
- **Common:** Rings off-center; ticks uneven.
- **NEVER:** Neon; plastic.
- **Future:** Orbit, glow.
- **Cinematic:** Astrolabe rotating, starfield.

## 5.28 ARCYN PYLON

- **Spec Version:** 1.0 · **Category:** Structures
- **Purpose:** A structural marker — waypoint as object.
- **Story:** Arcyn's signpost in the world.
- **Design inspiration:** Monolith × obelisk × pylon.
- **Silhouette:** Tall tapering column + cap; reads as "pylon" at 32px.
- **Dimensions:** H 0.800 m × base 0.120 m × cap 0.080 m.
- **Golden ratio:** H:base ≈ 6.6.
- **Construction:** Forged metal column + titanium cap + glass strip (cyan).
- **Materials:** Column `ForgedMetal`; cap `AnodizedTitanium`; strip `OpticalGlass` + `EmissiveCyan`.
- **Surface finish:** Cast column; polished cap.
- **Micro:** Etched banding; rivets.
- **Large:** Cap 80 mm.
- **Tiny:** 2 mm rivets.
- **Bevel:** 3 mm column; 1 mm cap.
- **Visible screws:** Rivet rows.
- **Panel gaps:** Cap seam 0.4 mm.
- **Internal:** Emitter modeled.
- **Weight:** Base-heavy.
- **Interaction:** Strip pulses (future).
- **Reflection:** Column subtle; cap mirror.
- **Wear:** Base weathering.
- **Lighting:** Key for mass; rim; strip glow.
- **Animation:** Strip pulse; energy rise.
- **Pivot:** Base center.
- **Mesh sep:** Column, Cap, Strip_Glass, Strip_Emissive.
- **LOD:** 80k / 32k / 10k.
- **Tri:** ≤ 80,000.
- **Vertex:** ≤ 120,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Structures/ArcynPylon/`.
- **Optimization:** Instance rivets; tiling.
- **Mobile:** LOD1.
- **Three.js:** transmission strip; emissive + bloom.
- **Quality:** [ ] Plumb [ ] Rivets even.
- **Acceptance:** Validator pass.
- **Common:** Leaning; rivets uneven.
- **NEVER:** Neon body.
- **Future:** Energy rise.
- **Cinematic:** Pylon at night, strip glow.

## 5.29 ARCYN RING TORUS

- **Spec Version:** 1.0 · **Category:** Structures / Relics
- **Purpose:** A floating torus — pure form as object.
- **Story:** Arcyn's meditation on the circle.
- **Design inspiration:** Torus × halo × ring.
- **Silhouette:** Large torus with inner glow; reads as "ring" at 32px.
- **Dimensions:** Outer dia 0.400 m; tube 0.060 m.
- **Golden ratio:** Tube:outer ≈ 0.15.
- **Construction:** Titanium torus + champagne inner ring + glass core (cyan).
- **Materials:** Torus `AnodizedTitanium`; inner `ChampagneGold`; core `OpticalGlass` + `EmissiveCyan`.
- **Surface finish:** Satin torus; polished inner.
- **Micro:** Etched groove; symmetric marks.
- **Large:** 400 mm.
- **Tiny:** 0.3 mm groove.
- **Bevel:** 1 mm edges.
- **Visible screws:** None.
- **Panel gaps:** Inner 0.2 mm.
- **Internal:** None.
- **Weight:** Even, light (floats).
- **Interaction:** Rotates (future); core pulses.
- **Reflection:** Torus streak; inner mirror.
- **Wear:** Handling polish.
- **Lighting:** Key for form; rim; core glow.
- **Animation:** Spin axis; pulse.
- **Pivot:** Center axis.
- **Mesh sep:** Torus, InnerRing, Core_Glass, Core_Emissive.
- **LOD:** 40k / 16k / 5k.
- **Tri:** ≤ 40,000.
- **Vertex:** ≤ 60,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Structures/ArcynRingTorus/`.
- **Optimization:** Moderate segments.
- **Mobile:** LOD1.
- **Three.js:** transmission core; emissive + bloom.
- **Quality:** [ ] Concentric [ ] Seamless.
- **Acceptance:** Validator pass.
- **Common:** Seam visible; not round.
- **NEVER:** Neon; dented.
- **Future:** Spin, pulse.
- **Cinematic:** Torus rotating, core glow.

## 5.30 ARCYN PRISM

- **Spec Version:** 1.0 · **Category:** Relics / Structures
- **Purpose:** A refractive prism — light as object.
- **Story:** Arcyn's study of dispersion.
- **Design inspiration:** Optical prism × crystal × obelisk.
- **Silhouette:** Triangular prism; reads as "prism" at 32px.
- **Dimensions:** L 0.180 m × base 0.060 m × H 0.052 m.
- **Golden ratio:** L:base ≈ 3.
- **Construction:** Optical glass body + titanium base cap + cyan emitter.
- **Materials:** Body `OpticalGlass` (IOR 1.52); cap `AnodizedTitanium`; emitter `EmissiveCyan`.
- **Surface finish:** Clear faceted; polished cap.
- **Micro:** Facet micro-bevel 0.1 mm.
- **Large:** 180 mm.
- **Tiny:** 0.2 mm facet lines.
- **Bevel:** 0.1 mm facet edges.
- **Visible screws:** None.
- **Panel gaps:** Cap 0.1 mm.
- **Internal:** Emitter modeled.
- **Weight:** Base-heavy.
- **Interaction:** Light disperses (future); emitter pulses.
- **Reflection:** Strong facet reflections.
- **Wear:** Facet micro-chip.
- **Lighting:** Bright key for dispersion; rim.
- **Animation:** Rotate; disperse; pulse.
- **Pivot:** Base center.
- **Mesh sep:** Body_Glass, Cap, Emitter_Emissive.
- **LOD:** 18k / 7k / 2k.
- **Tri:** ≤ 18,000.
- **Vertex:** ≤ 27,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Relics/ArcynPrism/`.
- **Optimization:** Transmission costly; LOD1 mobile.
- **Mobile:** LOD1.
- **Three.js:** transmission + dispersion; emissive.
- **Quality:** [ ] Facets crisp [ ] Not razor.
- **Acceptance:** Validator pass.
- **Common:** Too many facets; pure white.
- **NEVER:** Opaque; colored.
- **Future:** Dispersion, rotate.
- **Cinematic:** Light through prism, spectrum.

## 5.31 ARCYN CAPSULE

- **Spec Version:** 1.0 · **Category:** Devices / Structures
- **Purpose:** A sealed capsule — containment as object.
- **Story:** Arcyn's vessel of the unknown.
- **Design inspiration:** Capsule × pod × canister.
- **Silhouette:** Ellipsoid capsule + bands; reads as "capsule" at 32px.
- **Dimensions:** L 0.200 m × dia 0.090 m.
- **Golden ratio:** L:dia ≈ 2.2.
- **Construction:** Titanium shell + champagne bands + glass window + cyan interior.
- **Materials:** Shell `AnodizedTitanium`; bands `ChampagneGold`; window `OpticalGlass`; interior `EmissiveCyan`.
- **Surface finish:** Satin shell; polished bands.
- **Micro:** Etched labels; seam lines.
- **Large:** Window 50 mm.
- **Tiny:** 0.3 mm text.
- **Bevel:** 1.5 mm shell.
- **Visible screws:** None (sealed).
- **Panel gaps:** Band seams 0.3 mm.
- **Internal:** Core modeled (glows).
- **Weight:** Even.
- **Interaction:** Window glows (future); opens (future).
- **Reflection:** Shell streak; bands mirror.
- **Wear:** Band edge polish.
- **Lighting:** Key for shell; rim; interior glow.
- **Animation:** Glow pulse; hatch open.
- **Pivot:** `Capsule_Hatch_Pivot` hinge.
- **Mesh sep:** Shell, Band_xN, Window_Glass, Core_Emissive.
- **LOD:** 30k / 12k / 4k.
- **Tri:** ≤ 30,000.
- **Vertex:** ≤ 45,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynCapsule/`.
- **Optimization:** Merge shell+bands.
- **Mobile:** LOD1.
- **Three.js:** transmission window; emissive + bloom.
- **Quality:** [ ] Symmetric [ ] Bands even.
- **Acceptance:** Validator pass.
- **Common:** Bands uneven; window opaque.
- **NEVER:** Neon body.
- **Future:** Hatch, glow.
- **Cinematic:** Capsule glowing in dark.

## 5.32 ARCYN CRADLE

- **Spec Version:** 1.0 · **Category:** Structures / Environment
- **Purpose:** A display cradle — rest as object.
- **Story:** Where Arcyn objects repose.
- **Design inspiration:** Stand × nest × plinth.
- **Silhouette:** Curved cradle + base; reads as "stand" at 32px.
- **Dimensions:** 0.160 m W × 0.120 m D × 0.060 m H.
- **Golden ratio:** W:D ≈ 1.33.
- **Construction:** Ceramic cradle + titanium base + soft pad.
- **Materials:** Cradle `CeramicWhite`; base `AnodizedTitanium`; pad `SoftTouch`.
- **Surface finish:** Glossy ceramic; satin base.
- **Micro:** Etched logo; felt texture.
- **Large:** 160 mm.
- **Tiny:** 0.5 mm logo.
- **Bevel:** 2 mm edges.
- **Visible screws:** None (seamless).
- **Panel gaps:** Cradle-base 0.3 mm.
- **Internal:** None.
- **Weight:** Base-heavy.
- **Interaction:** None (passive).
- **Reflection:** Ceramic soft; base streak.
- **Wear:** Pad compression (future).
- **Lighting:** Key for ceramic; rim.
- **Animation:** None (static prop).
- **Pivot:** Base center.
- **Mesh sep:** Cradle, Base, Pad.
- **LOD:** 15k / 6k / 2k.
- **Tri:** ≤ 15,000.
- **Vertex:** ≤ 22,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Structures/ArcynCradle/`.
- **Optimization:** Simple.
- **Mobile:** LOD1.
- **Three.js:** Standard; clearcoat ceramic.
- **Quality:** [ ] Smooth curve [ ] Stable base.
- **Acceptance:** Validator pass.
- **Common:** Wobbly base; sharp edge.
- **NEVER:** Neon; plastic.
- **Future:** None planned.
- **Cinematic:** Object resting, soft shadow.

## 5.33 ARCYN PEDESTAL

- **Spec Version:** 1.0 · **Category:** Structures / Environment
- **Purpose:** A presentation pedestal — stage as object.
- **Story:** The stage for Arcyn heroes.
- **Design inspiration:** Plinth × column × dais.
- **Silhouette:** Cylinder/trapezoid + top; reads as "pedestal" at 32px.
- **Dimensions:** H 0.600 m × top 0.200 m × base 0.240 m.
- **Golden ratio:** H:top ≈ 3.
- **Construction:** Forged column + titanium top + glass inlay (cyan ring).
- **Materials:** Column `ForgedMetal`; top `AnodizedTitanium`; inlay `OpticalGlass` + `EmissiveCyan`.
- **Surface finish:** Cast column; polished top.
- **Micro:** Etched banding; rivets.
- **Large:** Top 200 mm.
- **Tiny:** 2 mm rivets.
- **Bevel:** 3 mm column; 1 mm top.
- **Visible screws:** Rivet rows.
- **Panel gaps:** Top seam 0.4 mm.
- **Internal:** Emitter modeled.
- **Weight:** Base-heavy.
- **Interaction:** Inlay pulses (future).
- **Reflection:** Column subtle; top mirror.
- **Wear:** Base weathering.
- **Lighting:** Key for mass; rim; inlay glow.
- **Animation:** Inlay pulse.
- **Pivot:** Base center.
- **Mesh sep:** Column, Top, Inlay_Glass, Inlay_Emissive.
- **LOD:** 70k / 28k / 9k.
- **Tri:** ≤ 70,000.
- **Vertex:** ≤ 105,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Structures/ArcynPedestal/`.
- **Optimization:** Instance rivets; tiling.
- **Mobile:** LOD1.
- **Three.js:** transmission inlay; emissive + bloom.
- **Quality:** [ ] Plumb [ ] Top level.
- **Acceptance:** Validator pass.
- **Common:** Leaning; top not level.
- **NEVER:** Neon body.
- **Future:** Inlay pulse.
- **Cinematic:** Hero on pedestal, rim light.

## 5.34 ARCYN ARCH GATE

- **Spec Version:** 1.0 · **Category:** Structures / Hero
- **Purpose:** A portal arch — threshold as object.
- **Story:** Arcyn's gateway between worlds.
- **Design inspiration:** Arch × gateway × monolith pair.
- **Silhouette:** Two pillars + lintel + energy field; reads as "arch" at 32px.
- **Dimensions:** H 1.000 m × W 0.600 m × D 0.150 m.
- **Golden ratio:** H:W ≈ 1.66.
- **Construction:** Forged pillars + titanium lintel + glass inlay + energy field.
- **Materials:** Pillars `ForgedMetal`; lintel `AnodizedTitanium`; inlay `OpticalGlass`; field `EnergyField` (cyan).
- **Surface finish:** Cast pillars; polished lintel.
- **Micro:** Etched runes; rivets.
- **Large:** Lintel 600 mm.
- **Tiny:** 2 mm rivets.
- **Bevel:** 3 mm pillars; 1 mm lintel.
- **Visible screws:** Rivet rows.
- **Panel gaps:** Pillar-lintel 0.4 mm.
- **Internal:** Emitter modeled.
- **Weight:** Base-heavy.
- **Interaction:** Field activates (future).
- **Reflection:** Pillars subtle; lintel mirror.
- **Wear:** Base weathering.
- **Lighting:** Key for mass; rim; field glow.
- **Animation:** Field shimmer; pulse.
- **Pivot:** Base center (per pillar).
- **Mesh sep:** Pillar_x2, Lintel, Inlay_Glass, Field_Emissive.
- **LOD:** 110k / 45k / 14k.
- **Tri:** ≤ 110,000.
- **Vertex:** ≤ 165,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Structures/ArcynArchGate/`.
- **Optimization:** Instance pillars/rivets; tiling.
- **Mobile:** LOD1; field off.
- **Three.js:** transmission inlay; field shader + bloom.
- **Quality:** [ ] Symmetric [ ] Plumb.
- **Acceptance:** Validator pass; loads <4s.
- **Common:** Asymmetric; leaning.
- **NEVER:** Neon body.
- **Future:** Field activate, walk-through.
- **Cinematic:** Figure passing through arch, glow.

## 5.35 ARCYN RELIC

- **Spec Version:** 1.0 · **Category:** Relics / Hero
- **Purpose:** An ancient artifact — mystery as object.
- **Story:** Arcyn's oldest object; origin unknown.
- **Design inspiration:** Idol × totem × artifact.
- **Silhouette:** Abstract totem with markings; reads as "relic" at 32px.
- **Dimensions:** H 0.300 m × W 0.140 m × D 0.100 m.
- **Golden ratio:** H:W ≈ 2.14.
- **Construction:** Forged metal body + champagne inlay + glass core (cyan) + leather wrap.
- **Materials:** Body `ForgedMetal`; inlay `ChampagneGold`; core `OpticalGlass` + `EmissiveCyan`; wrap `LeatherComposite`.
- **Surface finish:** Cast/weathered body; polished inlay.
- **Micro:** Etched glyphs; wear marks; cracks (subtle).
- **Large:** 300 mm.
- **Tiny:** 0.3 mm glyphs.
- **Bevel:** 2 mm edges (worn).
- **Visible screws:** None.
- **Panel gaps:** Inlay 0.2 mm.
- **Internal:** Core modeled.
- **Weight:** Base-heavy.
- **Interaction:** Core pulses (future).
- **Reflection:** Body subtle; inlay mirror.
- **Wear:** Heavy weathering (intentional, aged).
- **Lighting:** Key for form; rim; core glow.
- **Animation:** Core pulse; slow rotate.
- **Pivot:** Base center.
- **Mesh sep:** Body, Inlay_xN, Core_Glass, Core_Emissive, Wrap.
- **LOD:** 60k / 24k / 7k.
- **Tri:** ≤ 60,000.
- **Vertex:** ≤ 90,000.
- **UV:** 0–1 2K.
- **Tex:** 2K (heavy wear map).
- **Folder:** `Source/Relics/ArcynRelic/`.
- **Optimization:** Merge body+wrap.
- **Mobile:** LOD1.
- **Three.js:** transmission core; emissive + bloom; heavy AO.
- **Quality:** [ ] Weathered consistently [ ] Core centered.
- **Acceptance:** Validator pass.
- **Common:** Too clean (must be aged); core off.
- **NEVER:** Neon; plastic.
- **Future:** Pulse, levitate.
- **Cinematic:** Relic glowing in ruins.

## 5.36 ARCYN GLYPH TABLET

- **Spec Version:** 1.0 · **Category:** Relics / Devices
- **Purpose:** An inscribed tablet — language as object.
- **Story:** Arcyn's recorded knowledge.
- **Design inspiration:** Tablet × stele × slate.
- **Silhouette:** Flat slab with glyphs; reads as "tablet" at 32px.
- **Dimensions:** 0.240 m W × 0.320 m H × 0.030 m D.
- **Golden ratio:** H:W ≈ 1.33.
- **Construction:** Forged slate + champagne glyph inlay + glass edge (cyan).
- **Materials:** Slate `ForgedMetal` (dark); glyph `ChampagneGold`; edge `OpticalGlass` + `EmissiveCyan`.
- **Surface finish:** Matte slate; polished glyph.
- **Micro:** Etched glyph rows; border.
- **Large:** 320 mm.
- **Tiny:** 0.3 mm glyphs.
- **Bevel:** 2 mm edges.
- **Visible screws:** None.
- **Panel gaps:** Glyph 0.1 mm.
- **Internal:** None.
- **Weight:** Even.
- **Interaction:** Glyphs illuminate (future).
- **Reflection:** Slate subtle; glyph mirror.
- **Wear:** Edge wear.
- **Lighting:** Key for slab; rim; edge glow.
- **Animation:** Glyph pulse sequence.
- **Pivot:** Center.
- **Mesh sep:** Slate, Glyph_xN, Edge_Glass, Edge_Emissive.
- **LOD:** 35k / 14k / 4k.
- **Tri:** ≤ 35,000.
- **Vertex:** ≤ 52,000.
- **UV:** 0–1 2K.
- **Tex:** 2K (glyph alpha/height).
- **Folder:** `Source/Relics/ArcynGlyphTablet/`.
- **Optimization:** Glyphs via texture not geometry.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive edge + bloom.
- **Quality:** [ ] Glyphs even [ ] Flat slab.
- **Acceptance:** Validator pass.
- **Common:** Slab not flat; glyphs messy.
- **NEVER:** Neon body.
- **Future:** Glyph sequence.
- **Cinematic:** Tablet glowing, slow pan.

## 5.37 ARCYN COMPASS

- **Spec Version:** 1.0 · **Category:** Devices / Wearables
- **Purpose:** A navigation compass — direction as object.
- **Story:** Arcyn's guide.
- **Design inspiration:** Pocket compass × astro-compass.
- **Silhouette:** Disc with needle + glass; reads as "compass" at 32px.
- **Dimensions:** Dia 0.070 m × 0.015 m thick.
- **Golden ratio:** Dia:thick ≈ 4.6.
- **Construction:** Titanium case + champagne bezel + glass + steel needle + cyan mark.
- **Materials:** Case `AnodizedTitanium`; bezel `ChampagneGold`; glass `OpticalGlass`; needle `BrushedSteel`; mark `EmissiveCyan`.
- **Surface finish:** Satin case; polished bezel.
- **Micro:** Etched degree ring; logo.
- **Large:** Needle 50 mm.
- **Tiny:** 0.3 mm ticks.
- **Bevel:** 0.5 mm case.
- **Visible screws:** None (snap).
- **Panel gaps:** Bezel 0.1 mm.
- **Internal:** Movement modeled.
- **Weight:** Even.
- **Interaction:** Needle spins (future); mark pulses.
- **Reflection:** Case streak; glass clear.
- **Wear:** Bezel polish.
- **Lighting:** Key for case; rim; mark glow.
- **Animation:** Needle settle; mark pulse.
- **Pivot:** `Compass_Needle_Pivot` center.
- **Mesh sep:** Case, Bezel, Glass, Needle, Mark_Emissive.
- **LOD:** 18k / 7k / 2k.
- **Tri:** ≤ 18,000.
- **Vertex:** ≤ 27,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynCompass/`.
- **Optimization:** Merge case+bezel.
- **Mobile:** LOD1.
- **Three.js:** transmission glass; emissive mark + bloom.
- **Quality:** [ ] Needle centered [ ] Ticks even.
- **Acceptance:** Validator pass.
- **Common:** Needle off; ticks uneven.
- **NEVER:** Neon; plastic.
- **Future:** Needle spin, pulse.
- **Cinematic:** Compass in hand, mark glow.

## 5.38 ARCYN LENS

- **Spec Version:** 1.0 · **Category:** Devices / Relics
- **Purpose:** A standalone optical lens — focus as object.
- **Story:** Arcyn's study of sight.
- **Design inspiration:** Lens × magnifier × optic.
- **Silhouette:** Thick disc lens + ring; reads as "lens" at 32px.
- **Dimensions:** Dia 0.120 m × 0.030 m thick.
- **Golden ratio:** Dia:thick ≈ 4.
- **Construction:** Optical glass lens + titanium ring + cyan core.
- **Materials:** Lens `OpticalGlass` (IOR 1.5); ring `AnodizedTitanium`; core `EmissiveCyan`.
- **Surface finish:** Clear lens; polished ring.
- **Micro:** Etched focal marks; ring grip.
- **Large:** 120 mm.
- **Tiny:** 0.3 mm marks.
- **Bevel:** 1 mm ring edge.
- **Visible screws:** None.
- **Panel gaps:** Ring 0.1 mm.
- **Internal:** Core modeled.
- **Weight:** Even.
- **Interaction:** Core pulses (future); magnify (shader).
- **Reflection:** Strong lens refraction; ring streak.
- **Wear:** Edge micro-chip.
- **Lighting:** Bright key for refraction; rim.
- **Animation:** Spin; pulse; focus shift.
- **Pivot:** Center axis.
- **Mesh sep:** Lens_Glass, Ring, Core_Emissive.
- **LOD:** 16k / 6k / 2k.
- **Tri:** ≤ 16,000.
- **Vertex:** ≤ 24,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynLens/`.
- **Optimization:** Transmission; LOD1 mobile.
- **Mobile:** LOD1.
- **Three.js:** transmission + IOR; emissive + bloom.
- **Quality:** [ ] True optic curve [ ] Ring concentric.
- **Acceptance:** Validator pass.
- **Common:** Flat lens; pure white.
- **NEVER:** Opaque; colored.
- **Future:** Focus, pulse.
- **Cinematic:** Light bending through lens.

## 5.39 ARCYN FILAMENT

- **Spec Version:** 1.0 · **Category:** Devices / Structures
- **Purpose:** A glowing filament — energy as object.
- **Story:** Arcyn's visible current.
- **Design inspiration:** Filament × wire × tendril.
- **Silhouette:** Curved glowing strand; reads as "filament" at 32px.
- **Dimensions:** L 0.300 m (curve) × dia 0.006 m.
- **Golden ratio:** Curve span relation.
- **Construction:** Steel core + glass sheath + cyan emissive.
- **Materials:** Core `BrushedSteel`; sheath `OpticalGlass`; glow `EmissiveCyan`.
- **Surface finish:** Clear sheath; glowing core.
- **Micro:** Helix winding detail.
- **Large:** 300 mm.
- **Tiny:** 0.5 mm helix.
- **Bevel:** 0.2 mm ends.
- **Visible screws:** Mount caps (technical).
- **Panel gaps:** Cap 0.1 mm.
- **Internal:** Core modeled.
- **Weight:** Light.
- **Interaction:** Glow pulses (future); wave.
- **Reflection:** Sheath clear; core glow.
- **Wear:** None (new).
- **Lighting:** Self-emissive; key for caps.
- **Animation:** Pulse along length; wave.
- **Pivot:** Mount centers.
- **Mesh sep:** Sheath_Glass, Core_Emissive, Cap_x2.
- **LOD:** 12k / 5k / 1.5k.
- **Tri:** ≤ 12,000.
- **Vertex:** ≤ 18,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Devices/ArcynFilament/`.
- **Optimization:** Tube segments moderate.
- **Mobile:** LOD1.
- **Three.js:** transmission sheath; emissive core + bloom.
- **Quality:** [ ] Smooth curve [ ] Glow even.
- **Acceptance:** Validator pass.
- **Common:** Jagged curve; glow uneven.
- **NEVER:** Neon body; opaque sheath.
- **Future:** Pulse wave.
- **Cinematic:** Filament glowing in dark.

## 5.40 ARCYN ENGINE BLOCK

- **Spec Version:** 1.0 · **Category:** Vehicles / Structures / Hero
- **Purpose:** A power engine — mechanism as object.
- **Story:** Arcyn's heart of motion.
- **Design inspiration:** Engine block × reactor core × mechanism.
- **Silhouette:** Block with cylinders + pipes; reads as "engine" at 32px.
- **Dimensions:** 0.400 m W × 0.300 m H × 0.350 m D.
- **Golden ratio:** W:H ≈ 1.33.
- **Construction:** Forged block + titanium heads + steel pipes + copper traces + cyan glow.
- **Materials:** Block `ForgedMetal`; heads `AnodizedTitanium`; pipes `BrushedSteel`; traces `CopperTrace`; glow `EmissiveCyan`.
- **Surface finish:** Cast block; polished heads.
- **Micro:** Etched ports; bolt rows; weld lines.
- **Large:** Block 400 mm.
- **Tiny:** 2 mm bolts.
- **Bevel:** 3 mm block; 1 mm heads.
- **Visible screws:** Bolt rows (technical).
- **Panel gaps:** Head-block 0.4 mm.
- **Internal:** Pistons modeled (cutaway future).
- **Weight:** Dense, heavy.
- **Interaction:** Pistons move (future); glow pulses.
- **Reflection:** Block subtle; heads mirror.
- **Wear:** Bolt polish; oil sheen (subtle).
- **Lighting:** Key for mass; rim; glow.
- **Animation:** Piston cycle; glow pulse; rotate.
- **Pivot:** `Engine_Piston_1_Pivot` etc.
- **Mesh sep:** Block, Head_xN, Pipe_xN, Piston_xN, Glow_Emissive.
- **LOD:** 120k / 50k / 15k.
- **Tri:** ≤ 120,000.
- **Vertex:** ≤ 180,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Vehicles/ArcynEngineBlock/`.
- **Optimization:** Instance bolts/pipes; tiling.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive + bloom; heavy AO.
- **Quality:** [ ] Block square [ ] Pistons aligned.
- **Acceptance:** Validator pass; loads <4s.
- **Common:** Not square; pistons off.
- **NEVER:** Neon body.
- **Future:** Piston cycle, cutaway.
- **Cinematic:** Engine running, glow pulsing.

## 5.41 ARCYN SATELLITE

- **Spec Version:** 1.0 · **Category:** Vehicles / Structures / Hero
- **Purpose:** An orbital satellite — reach as object.
- **Story:** Arcyn's eye in the sky.
- **Design inspiration:** Satellite × probe × dish.
- **Silhouette:** Body + panels + dish; reads as "satellite" at 32px.
- **Dimensions:** Span 0.800 m (panels) × body 0.200 m.
- **Golden ratio:** Span:body ≈ 4.
- **Construction:** Titanium body + carbon panels + steel dish + cyan beacons.
- **Materials:** Body `AnodizedTitanium`; panels `CarbonComposite`; dish `BrushedSteel`; beacon `EmissiveCyan`.
- **Surface finish:** Satin body; matte panels.
- **Micro:** Etched panel lines; antenna detail.
- **Large:** Panels 800 mm.
- **Tiny:** 1 mm screws.
- **Bevel:** 1.5 mm body; 1 mm panels.
- **Visible screws:** Panel mounts (technical).
- **Panel gaps:** Panel-body 0.3 mm.
- **Internal:** Bus modeled.
- **Weight:** Even (orbital).
- **Interaction:** Panels deploy (future); dish rotates; beacon blink.
- **Reflection:** Body streak; panels subtle.
- **Wear:** Micrometeorite pits (subtle).
- **Lighting:** Key for form; rim; beacon.
- **Animation:** Panel deploy; dish rotate; beacon blink.
- **Pivot:** `Sat_Panel_L_Pivot`, `Sat_Dish_Pivot`.
- **Mesh sep:** Body, Panel_x2, Dish, Antenna_xN, Beacon_Emissive.
- **LOD:** 90k / 35k / 10k.
- **Tri:** ≤ 90,000.
- **Vertex:** ≤ 135,000.
- **UV:** 0–1 2K.
- **Tex:** 2K.
- **Folder:** `Source/Vehicles/ArcynSatellite/`.
- **Optimization:** Instance panels/antennae.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive beacon + bloom.
- **Quality:** [ ] Symmetric [ ] Panels aligned.
- **Acceptance:** Validator pass.
- **Common:** Panels uneven; dish off.
- **NEVER:** Neon body.
- **Future:** Deploy, rotate, blink.
- **Cinematic:** Satellite in orbit, Earth behind.

## 5.42 ARCYN ROVER

- **Spec Version:** 1.0 · **Category:** Vehicles / Hero
- **Purpose:** A surface rover — exploration as object.
- **Story:** Arcyn's ground explorer.
- **Design inspiration:** Rover × buggy × sci-fi vehicle.
- **Silhouette:** Chassis + wheels + dome; reads as "rover" at 32px.
- **Dimensions:** L 0.900 m × W 0.500 m × H 0.400 m.
- **Golden ratio:** L:W ≈ 1.8.
- **Construction:** Carbon chassis + titanium wheels + glass dome + steel arms + cyan lights.
- **Materials:** Chassis `CarbonComposite`; wheels `AnodizedTitanium`; dome `OpticalGlass`; arms `BrushedSteel`; lights `EmissiveCyan`.
- **Surface finish:** Matte weave; polished wheels.
- **Micro:** Etched panels; vent slots; rivets.
- **Large:** Wheels 160 mm.
- **Tiny:** 2 mm rivets.
- **Bevel:** 2 mm chassis; 1 mm wheels.
- **Visible screws:** Panel screws (technical).
- **Panel gaps:** Panels 0.4 mm.
- **Internal:** Motor modeled.
- **Weight:** Low center (stable).
- **Interaction:** Wheels roll (future); arm articulates; dome opens.
- **Reflection:** Weave subtle; wheels mirror.
- **Wear:** Wheel tread wear (subtle).
- **Lighting:** Key for form; rim; lights.
- **Animation:** Wheel roll; suspension; arm; dome.
- **Pivot:** `Rover_Wheel_FL_Pivot` etc. (4); `Rover_Arm_Pivot`.
- **Mesh sep:** Chassis, Wheel_x4, Dome_Glass, Arm_xN, Light_Emissive.
- **LOD:** 120k / 50k / 15k.
- **Tri:** ≤ 120,000.
- **Vertex:** ≤ 180,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Vehicles/ArcynRover/`.
- **Optimization:** Instance wheels; tiling.
- **Mobile:** LOD1.
- **Three.js:** transmission dome; emissive + bloom.
- **Quality:** [ ] Wheels coplanar [ ] Symmetric.
- **Acceptance:** Validator pass; loads <4s.
- **Common:** Wheels off; not symmetric.
- **NEVER:** Neon body; weapons.
- **Future:** Drive, articulate, explore.
- **Cinematic:** Rover on terrain, dust.

## 5.43 ARCYN TURRET

- **Spec Version:** 1.0 · **Category:** Vehicles / Structures
- **Purpose:** A defensive turret — vigilance as object.
- **Story:** Arcyn's silent guardian.
- **Design inspiration:** Turret × sensor × emplacement.
- **Silhouette:** Base + rotating head + barrel; reads as "turret" at 32px.
- **Dimensions:** H 0.500 m × base 0.300 m × barrel 0.250 m.
- **Golden ratio:** H:base ≈ 1.66.
- **Construction:** Forged base + titanium head + steel barrel + cyan sensor.
- **Materials:** Base `ForgedMetal`; head `AnodizedTitanium`; barrel `BrushedSteel`; sensor `EmissiveCyan`.
- **Surface finish:** Cast base; polished head.
- **Micro:** Etched panels; bolt rows.
- **Large:** Barrel 250 mm.
- **Tiny:** 2 mm bolts.
- **Bevel:** 3 mm base; 1 mm head.
- **Visible screws:** Bolt rows.
- **Panel gaps:** Head-base 0.4 mm.
- **Internal:** Mechanism modeled.
- **Weight:** Base-heavy.
- **Interaction:** Head rotates (future); barrel elevates; sensor tracks.
- **Reflection:** Base subtle; head mirror.
- **Wear:** Barrel edge wear.
- **Lighting:** Key for mass; rim; sensor.
- **Animation:** Rotate; elevate; track; pulse.
- **Pivot:** `Turret_Head_Pivot` Y; `Turret_Barrel_Pivot` X.
- **Mesh sep:** Base, Head, Barrel, Sensor_Emissive.
- **LOD:** 80k / 32k / 10k.
- **Tri:** ≤ 80,000.
- **Vertex:** ≤ 120,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Vehicles/ArcynTurret/`.
- **Optimization:** Instance bolts; tiling.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive sensor + bloom.
- **Quality:** [ ] Head level [ ] Barrel centered.
- **Acceptance:** Validator pass.
- **Common:** Head tilted; barrel off.
- **NEVER:** Neon body; gratuitous weapon. (Defensive only, no munitions modeled.)
- **Future:** Track, elevate, scan.
- **Cinematic:** Turret scanning, sensor glow.

## 5.44 ARCYN ANTENNA

- **Spec Version:** 1.0 · **Category:** Structures / Vehicles
- **Purpose:** A communication antenna — signal as object.
- **Story:** Arcyn's voice to the world.
- **Design inspiration:** Antenna × tower × array.
- **Silhouette:** Mast + elements + dish; reads as "antenna" at 32px.
- **Dimensions:** H 1.000 m × base 0.150 m.
- **Golden ratio:** H:base ≈ 6.6.
- **Construction:** Titanium mast + carbon elements + steel dish + cyan tip.
- **Materials:** Mast `AnodizedTitanium`; elements `CarbonComposite`; dish `BrushedSteel`; tip `EmissiveCyan`.
- **Surface finish:** Satin mast; matte elements.
- **Micro:** Etched bands; element detail.
- **Large:** Dish 200 mm.
- **Tiny:** 1 mm elements.
- **Bevel:** 1.5 mm mast.
- **Visible screws:** Element mounts.
- **Panel gaps:** Element 0.2 mm.
- **Internal:** Feed modeled.
- **Weight:** Base-heavy.
- **Interaction:** Tip pulses (future); dish rotates.
- **Reflection:** Mast streak; dish mirror.
- **Wear:** Base weathering.
- **Lighting:** Key for mass; rim; tip.
- **Animation:** Tip pulse; dish rotate; sway.
- **Pivot:** Base center; `Antenna_Dish_Pivot`.
- **Mesh sep:** Mast, Element_xN, Dish, Tip_Emissive.
- **LOD:** 70k / 28k / 9k.
- **Tri:** ≤ 70,000.
- **Vertex:** ≤ 105,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Structures/ArcynAntenna/`.
- **Optimization:** Instance elements; tiling.
- **Mobile:** LOD1.
- **Three.js:** Standard; emissive tip + bloom.
- **Quality:** [ ] Plumb [ ] Elements even.
- **Acceptance:** Validator pass.
- **Common:** Leaning; elements uneven.
- **NEVER:** Neon body.
- **Future:** Pulse, rotate, sway.
- **Cinematic:** Antenna at dusk, tip blink.

## 5.45 ARCYN REACTOR

- **Spec Version:** 1.0 · **Category:** Structures / Vehicles / Hero
- **Purpose:** A power reactor — source as object.
- **Story:** Arcyn's ultimate energy.
- **Design inspiration:** Reactor × core × containment.
- **Silhouette:** Vessel + central glowing core; reads as "reactor" at 32px.
- **Dimensions:** H 0.900 m × dia 0.500 m.
- **Golden ratio:** H:dia ≈ 1.8.
- **Construction:** Forged vessel + titanium rings + glass core (cyan) + copper board + steel conduits.
- **Materials:** Vessel `ForgedMetal`; rings `AnodizedTitanium`; core `OpticalGlass` + `EmissiveCyan`; board `CopperTrace`; conduits `BrushedSteel`.
- **Surface finish:** Cast vessel; polished rings.
- **Micro:** Etched bands; bolt rows; conduit routing.
- **Large:** Core 200 mm.
- **Tiny:** 2 mm bolts.
- **Bevel:** 3 mm vessel; 1 mm rings.
- **Visible screws:** Bolt rows.
- **Panel gaps:** Ring seams 0.4 mm.
- **Internal:** Core lattice modeled (visible through glass).
- **Weight:** Base-heavy, massive.
- **Interaction:** Core pulses (future); rings rotate; conduits glow.
- **Reflection:** Vessel subtle; rings mirror; core sparkle.
- **Wear:** Base weathering; conduit soot (subtle).
- **Lighting:** Key for mass; rim; core glow (dominant).
- **Animation:** Core pulse; ring rotate; conduit flow; hum.
- **Pivot:** Base center; `Reactor_Ring_N_Pivot`.
- **Mesh sep:** Vessel, Ring_xN, Core_Glass, Core_Emissive, Board, Conduit_xN.
- **LOD:** 120k / 50k / 15k.
- **Tri:** ≤ 120,000.
- **Vertex:** ≤ 180,000.
- **UV:** 0–1 4K tiled.
- **Tex:** 4K.
- **Folder:** `Source/Structures/ArcynReactor/`.
- **Optimization:** Instance bolts/rings; tiling; transmission core costly.
- **Mobile:** LOD1; core glow reduced.
- **Three.js:** transmission core; emissive + bloom; heavy AO.
- **Quality:** [ ] Plumb [ ] Core centered [ ] Rings even.
- **Acceptance:** Validator pass; loads <4s.
- **Common:** Leaning; core off-center; rings uneven.
- **NEVER:** Neon body; red core (cyan only).
- **Future:** Pulse, rotate, energy surge.
- **Cinematic:** Reactor humming, core bloom, volumetric.

---

### 5.46 CROSS-CUTTING ASSET RULES (applies to ALL 45 assets)

- Every asset MUST have a `<AssetName>_Root` empty at world origin, Y-up.
- Every asset MUST export at real-world meters with scale (1,1,1).
- Every asset MUST include at least one emissive cyan element OR explicitly state "no emissive" with reason (dark objects like Vault still get status logic).
- Every asset MUST be validated against the canonical lighting (§4.2) before submission.
- Every asset MUST pass Khronos glTF Validator with zero errors.
- Every asset MUST ship LOD0/LOD1/LOD2 (or approved exemption for tiny assets <5k tri where LOD1 alone suffices).
- Every asset folder MUST contain `docs/<AssetName>_spec.md` linking back to this section.
- Naming, UV, texel density, bevel, and material rules of Chapters 2–3 are binding.
- No asset may introduce a new material not in Chapter 3 without Art Direction approval and a library addition.
- No asset may use colors outside §1.10 without approval.

---

# CHAPTER 6 — ENVIRONMENT BIBLE

This chapter defines the world the assets live in: the stage, the atmosphere, and the post-processing that frames every Arcyn object. The environment is intentionally minimal — a gallery, not a game level. The object is the hero; the environment is the frame.

## 6.1 Ground

- **Surface:** Seamless infinite cyclorama (curved floor-to-background sweep) or a large subtle reflective plane.
- **Material:** `MAT_LIB_DiffuseMatte` neutral (`#16181C` Carbon for dark stage, `#E8E6E1` Bone for light stage). Roughness 0.9.
- **Reflection:** Optional faint reflection plane (§6.11) for hero shots only; opacity ≤ 0.15.
- **Scale:** Ground plane ≥ 20 m to avoid horizon clipping; or true infinite cyc.
- **Texel density:** Tiling 256 tp/m; subtle noise, no visible repeat within camera frustum.
- **Color:** Never pure black floor; never pure white. Keep within §1.10 neutrals.

## 6.2 Platforms

- **Pedestal/Cradle:** Use Arcyn Pedestal (§5.33) and Arcyn Cradle (§5.32) as the only sanctioned stages.
- **Turntable:** A 1.2 m diameter low platform, `AnodizedTitanium` rim, matte top, for hero rotation. Optional.
- **Placement:** Asset base sits exactly on platform top (Y=0 contact). No floating unless asset is explicitly a flyer (Drone, Satellite, Ring Torus, etc.).

## 6.3 Fog

- **Default:** None (clean gallery).
- **Cinematic:** Exponential height fog, density 0.002, color `#1A1E24`, only for large structures (Tower, Arch, Reactor) to imply scale.
- Never warm fog on heroes. Never volumetric "fog cubes."

## 6.4 Particles

- **Dust:** Sparse, slow, low-opacity (≤2%) floating motes for cinematic only. Not in default viewer (clean). Use GPU points, ≤200 particles, size 1–2 px, soft.
- **Energy:** Emitted from cyan assets (Reactor, Beacon, Filament) as subtle rising sparks/streams in cinematic mode only.
- **Performance:** Particles disabled on mobile by default.

## 6.5 Dust

- Surface dust accumulation is a *texture* property (§3.1), not a scene particle, on most assets. Scene dust only in cinematic mode (§6.4).

## 6.6 Energy

- Energy is expressed via emissive cyan (§3.6) and the `EnergyField` material (§3.15). It is always controlled, never chaotic.
- Energy flows should be slow, directional, and purposeful (e.g., up a pylon, around a reactor core).

## 6.7 Glow

- Glow = bloom (§4.8) applied to emissive materials only. Intensity 0.4–0.6, threshold 0.9. Never bloom the whole frame.
- Glow color is cyan (`#3FE0D0`) or amber (`#FFB000`) only.

## 6.8 Lighting

- Environment lighting per §4.2 (three-point + HDR IBL). The environment itself is not lit separately; it shares the asset lighting rig.
- For large-scale environment shots, add a soft ground bounce light (cool, intensity 0.4) to lift contact shadows.

## 6.9 Sky

- **Default viewer:** No literal sky; the cyc/backdrop is a neutral gradient (top `#2B2D31` to bottom `#16181C`).
- **Cinematic:** `Arcyn_Dusk.exr` gradient sky for outdoor-scale assets (Tower, Antenna, Arch). Warm low horizon, cool zenith.

## 6.10 Background

- **Default:** Neutral gradient cyc (§6.9). No logos, no text, no distractions.
- **Cinematic:** Subtle depth gradient or soft bokeh of studio lights (out of focus) to add richness without competing.

## 6.11 HDR / Reflection Planes

- HDR: `Arcyn_Studio.exr` (default), `Arcyn_Dusk.exr` (cinematic). Loaded externally via `RGBELoader`.
- **Reflection plane:** For hero shots, a mirrored ground plane (opacity 0.12, roughness 0.1) gives the signature Arcyn "floating on a calm mirror" look. Disable on mobile.
- `envMapIntensity` per §4.7.

## 6.12 Post-Processing

Pipeline (three.js `EffectComposer`):
1. **Render** (ACES filmic tone map, exposure per §4.10).
2. **Bloom** (§4.8) — emissive only.
3. **(Optional) Vignette** — very subtle, 0.2 strength, to focus center.
4. **(Optional) Chromatic aberration** — disabled by default; if used, ≤0.5 px, edges only.
5. **(Optional) Film grain** — disabled by default; cinematic ≤1% opacity.
- No lens distortion, no heavy color grading by default. Keep it honest.

## 6.13 Environment Performance Budget

- Environment meshes: ≤ 50k tri (cyc + platform).
- No real-time shadows from environment (use baked AO + 1 contact shadow).
- Particle/energy systems: disabled on mobile, ≤ 1 draw call on desktop.
- Total scene (env + 1 hero asset): desktop ≤ 300k tri, mobile ≤ 80k tri.

---

# CHAPTER 7 — ANIMATION PREPARATION

This chapter does **NOT** animate. It specifies how every asset MUST be prepared so that future animation (in Blender and/or three.js) is possible without re-topology or re-modeling. An asset that cannot be animated per its specification is **non-compliant**, even if it looks correct static.

## 7.1 Guiding Principles

- **Model for the joint, not the pose.** Every moving part must have geometry that supports its range of motion without self-intersection or visible stretching.
- **Separate by motion.** Parts that move independently MUST be separate meshes (or separate vertex groups within a single skinned mesh for organic parts).
- **Pivot at the mechanism.** Pivots sit at the true axis of rotation/translation (§2.11), never at mesh centroids.
- **Name for the rigger.** Every animatable part uses the exact name from its Chapter 5 spec so riggers can bind by name. No renaming after spec sign-off.
- **Rest pose = neutral charged.** Assets sit in a slightly "alive" rest pose (e.g., lids 2° open, indicators dimmed-but-on). Never a dead/closed default unless function demands.
- **No stretching geometry.** Moving parts must have enough geometry resolution at joints to avoid visible pinch (add edge loops at hinge lines).

## 7.2 Hierarchy & Naming Convention

- Root: `<AssetName>_Root` (empty, world origin, Y-up).
- Moving sub-assemblies: `<PartName>` mesh + `<PartName>_Pivot` empty (parented so the mesh inherits the pivot).
- Example (Core Hub): `ArcynCoreHub_Root` → `CoreHub_Seam_Pivot` → `CoreHub_Shell_Front`.

## 7.3 Pivot Placement Rules (recap + detail)

- **Hinges (lids, doors, visors):** pivot on the hinge axis, at the edge where the part meets the body. Example: `Deck_Lid_Pivot` at the rear lid edge.
- **Rotors/propellers:** pivot at the rotor center, coplanar with the arm mount.
- **Wheels:** pivot at wheel center axis; wheel must be circular and centered on its pivot.
- **Needles/indicators:** pivot at the dial center.
- **Rings/orbits:** pivot at the shared center axis.
- **Telescoping/translating parts:** pivot at the start position; animation translates along local axis.

## 7.4 Mesh Separation Strategy

For each asset, the Chapter 5 "Mesh separation" list is binding. Additional rules:
- Keep static-heavy parts merged by material to reduce draw calls, but **never** merge a part that will animate with a part that won't.
- Emissive/transmission parts stay separate (shader cost).
- For organic/flexible parts (straps, grips, pads), use a single skinned mesh with vertex groups + an armature; document the bone chain in the asset doc.

## 7.5 Animation-Ready Geometry Details

- **Edge loops at joints:** Add 2–3 concentric edge loops around every hinge/rotator so deformation is clean.
- **Clearance:** Model moving parts with ≥0.5 mm clearance from neighbors at full range of motion to avoid clipping.
- **Non-destructive modeling:** Keep Booleans/Bevels as modifiers until final; for the shipped GLB, apply them but keep a non-applied `.blend` master for animation iterations.
- **UV stability:** Animatable parts MUST keep UVs stable under deformation (no UV stretching at joints). Test by deforming in a pose and checking texel density.

## 7.6 Emissive Animation Hooks

- Every emissive material (§3.6, §3.7) MUST expose an `emissiveStrength` property (glTF `emissive_strength`) so animators can pulse it 0→max without swapping textures.
- Cyan emissive default intensity ~2.0; animators may ramp to 4.0 for "activation."
- Provide a named empty `<AssetName>_EmissiveDriver` if a global pulse is needed (e.g., Reactor core).

## 7.7 Transform & Scale Hygiene

- All meshes export scale (1,1,1); animation uses local rotation/translation only.
- No animation via object scale (looks cheap). Use real rotation/translation.
- Bake all transforms before export (Ctrl+A).

## 7.8 LOD & Animation

- LOD0 (hero) carries full animation rig/detail.
- LOD1/LOD2 MAY drop animation joints that are not visible at distance (e.g., internal mechanisms), but the visible moving parts (lids, rotors) must remain animatable at LOD1.
- Keep pivot positions identical across all LODs (§2.12).

## 7.9 Per-Asset Animation Readiness (summary table)

| Asset | Primary Animation | Pivot(s) | Key Preps |
|---|---|---|---|
| Core Hub | Seam open, core rise, LED breathe | Seam, Window | Clearance 8mm; LED emissive hook |
| Holo Projector | Dome open, hologram scale | Dome | Hologram plane separate |
| Quantum Watch | Crown rotate, hands tick | Crown, Hands | Hands centered; caseback screw |
| Pulse Earbuds | Lid open, buds rise | Lid | Bud cavities modeled |
| Neural Ring | Sensor pulse, spin | Center | Sensor emissive hook |
| Data Crystal | Pulse, float, rotate | Base | Core lattice separate |
| Power Cell | Cap unscrew, charge | Cap | Thread modeled |
| Fusion Lamp | Arm tilt, brightness | Arm, Orb | Touch ring hook |
| Sentinel Drone | Rotor spin, hover, eye | 4 Rotors, Eye | Rotors instanced & coplanar |
| Orbital Speaker | Float, LED rhythm | Center | LED emissive hook |
| Vault Safe | Dial spin, door swing | Door, Dial | Bolts retract; interior |
| Monolith Display | Hologram scan | Base | Hologram plane |
| Cyberdeck | Lid hinge, key press | Lid | Keys instanced |
| Visor Goggles | Visor raise, AR on | 2 Arms | Display behind lens |
| Keycard | Scan pulse, flip | Center | Stripe emissive |
| Mech Pen | Twist, cap | Cap | Twist thread |
| Token Coin | Spin, glow | Center | Inlay emissive |
| Cube Puzzle | Face rotate, solve | 9 faces | Tiles coplanar |
| Beacon Tower | Beam sweep, field | Base | Beam + field shaders |
| Thruster Pack | Nozzle gimbal, flame | 2 Nozzles | Nozzle symmetric |
| Shield Emitter | Field expand, spin | Center | Field shader |
| Energy Blade | Ignite, swing | Hilt, Blade | Blade transmission |
| Gauntlet | Finger curl, charge | Fingers | Joints aligned |
| Helmet | Visor raise, HUD | Visor | HUD emissive |
| Crown Diadem | Gem pulse, float | Center | Gem emissive |
| Scepter | Pulse, levitate | Center | Orb emissive |
| Orb Astrolabe | Ring orbit | Rings | Concentric |
| Pylon | Strip pulse | Base | Strip emissive |
| Ring Torus | Spin, pulse | Center | Core emissive |
| Prism | Rotate, disperse | Base | Facet transmission |
| Capsule | Glow, hatch | Hatch | Hatch hinge |
| Cradle | None | Base | Static prop |
| Pedestal | Inlay pulse | Base | Inlay emissive |
| Arch Gate | Field activate | Base | Field shader |
| Relic | Pulse, rotate | Base | Core emissive |
| Glyph Tablet | Glyph sequence | Center | Edge emissive |
| Compass | Needle settle | Needle | Needle centered |
| Lens | Spin, focus | Center | Optic transmission |
| Filament | Pulse wave | Mounts | Core emissive |
| Engine Block | Piston cycle | Pistons | Pistons aligned |
| Satellite | Panel deploy, dish | Panels, Dish | Panels symmetric |
| Rover | Wheel roll, arm, dome | 4 Wheels, Arm | Wheels coplanar |
| Turret | Rotate, elevate, track | Head, Barrel | Head level |
| Antenna | Pulse, rotate, sway | Dish | Elements even |
| Reactor | Core pulse, ring rotate | Rings, Core | Core centered |

## 7.10 Animation Technical Constraints (three.js)

- Use node-based animations (glTF `animations`) or `KHR_animation_pointer` for property animation (emissive strength, etc.).
- Target 30/60 fps; keep keyframe counts low (idling loops ≤ 120 frames).
- Avoid morph targets unless explicitly required (they bloat GLB); prefer transform animation.
- Damped easing (ease-in-out) for all motions; no linear snaps; no bounce overshoot beyond 5%.

## 7.11 Future Cinematic Notes

Each asset's "Future cinematic uses" line in Chapter 5 is the seed for cinematic sequences. Maintain a `docs/<AssetName>_cinematic.md` noting intended shots, camera, and lighting per §4/§6.

---

# CHAPTER 8 — QUALITY ASSURANCE

This chapter defines the gates every asset must pass before it is accepted into the library. Non-compliance at any gate blocks merge. The goal is zero ambiguity and zero rework downstream.

## 8.1 Inspection Checklists

### 8.1.1 Geometry Checklist (all assets)
- [ ] Scale is real-world meters; object scale (1,1,1).
- [ ] Y-up, front faces -Z; no 90° export rotation bug.
- [ ] No inverted/inside-out faces (normals outward).
- [ ] Custom/weighted normals applied; Auto Smooth 30–45°.
- [ ] All visible hard edges have bevels per spec (no 0-radius exterior edges).
- [ ] No n-gons on reflective/detail surfaces; quads/triangles clean.
- [ ] No overlapping/coplanar z-fighting surfaces (≥0.5 mm clearance).
- [ ] Watertight where it should be (sealed objects); intentional openings modeled.
- [ ] Texel density 256–1024 tp/m, ±10% within asset.
- [ ] UVs in 0–1, no overlapping islands (except intentional tiling), 4–8px padding.
- [ ] Pivot(s) at mechanical center, named per spec.
- [ ] Animation-ready joints have edge loops & clearance (§7.5).

### 8.1.2 Material Checklist
- [ ] Only Chapter 3 materials used (or approved additions).
- [ ] Data maps Non-Color; albedo/emission sRGB.
- [ ] No pure `#FFFFFF`/`#000000` final surfaces.
- [ ] Imperfections present (not flawless CG).
- [ ] Emissive cyan/amber only; cyan = system alive.
- [ ] Transmission/IOR correct for glass (§3.5).
- [ ] ORM packed R=AO,G=Rough,B=Metal.

### 8.1.3 Lighting/ Presentation Checklist
- [ ] Validated under canonical rig (§4.2).
- [ ] Reads correctly at 32px silhouette.
- [ ] Bloom only on emissive; subtle.
- [ ] Rim separates dark objects from dark stage.
- [ ] Reflections show studio environment, not gray void.

### 8.1.4 Animation Checklist
- [ ] Moving parts separated per spec.
- [ ] Pivots correct and named.
- [ ] Emissive parts expose `emissiveStrength`.
- [ ] No scale-based animation.
- [ ] Rest pose = neutral charged.

## 8.2 Acceptance Criteria (definition of "done")

An asset is **Accepted** only when ALL hold:
1. Passes Khronos glTF Validator: **0 errors, 0 warnings** (warnings acceptable only with documented waiver).
2. Loads in reference three.js viewer within budget (desktop <2s hero / <4s large; mobile <3s).
3. Triangle/vertex count within Chapter 5 budget (≤ ceiling).
4. All textures powers-of-two, correctly tagged, KTX2-ready.
5. Naming/folder structure matches §2 exactly.
6. Silhouette reads at 32px.
7. Material responses match Chapter 3.
8. Art Direction sign-off recorded in `docs/<AssetName>_spec.md`.
9. LOD0/LOD1/LOD2 present (or approved exemption).
10. No new colors/materials outside §1.10/Chapter 3 without approval.

## 8.3 Review Workflow

1. **Self-review (artist):** Run §8.1 checklists; fix all. Commit to feature branch `asset/<AssetName>`.
2. **Peer review (another artist):** Verify checklists; comment on art direction fit. Approve or request changes.
3. **Technical review (tech artist):** Run validator, check budgets, LODs, export settings. Approve or reject.
4. **Art Direction review:** Final aesthetic sign-off against Chapter 1 philosophy. Approve → merge to `main`.
5. **CI gate:** Automated pipeline runs validator + budget check on every PR; fails build on violation.
6. **Documentation:** Update `docs/<AssetName>_spec.md` with Spec Version and sign-offs.

## 8.4 Export Checklist (final pass before PR)

- [ ] All transforms applied (rotation, scale); location correct at pivot.
- [ ] Hidden/disabled/reference objects deleted.
- [ ] Modifiers applied or intentionally kept (documented).
- [ ] Meshes merged by material (static parts); animatable parts separate.
- [ ] AO baked to texture (not vertex colors) for portability.
- [ ] Up-axis Y; unit scale meters.
- [ ] HDR referenced externally (not embedded).
- [ ] Draco/Meshopt + KTX2 settings per §2.15–2.16.
- [ ] Non-compressed master GLB archived.
- [ ] LOD0/1/2 exported with identical pivots.
- [ ] `gltf-validator` passes.
- [ ] File naming per §2.6.

## 8.5 Optimization Checklist

- [ ] Triangle count ≤ Chapter 5 ceiling.
- [ ] Draw calls minimized (merge by material; instance repeated parts — bolts, rotors, tiles).
- [ ] Textures KTX2/BasisU; total per asset ≤ budget (hero <8MB, large <15MB).
- [ ] No unused UV channels / vertex colors.
- [ ] Mobile LOD1 confirmed loads <3s on iPhone 12-class.
- [ ] Transmission/emissive materials isolated (shader cost).
- [ ] No duplicate geometries (reuse instances).
- [ ] Mipmaps generated; trilinear filtering.

## 8.6 Common Defects (watch-list)

| Defect | Cause | Fix |
|---|---|---|
| Black/blank glass | Wrong IOR or transmission flag | Set transmission 0.9+, IOR 1.5, no albedo-white |
| Shimmering panel lines | Insufficient UV padding | 4–8px gutter; align to texel grid |
| Melted plastic look | Fully smooth hard-surface | Auto Smooth + bevels |
| Mirror-perfect (CGI) | No imperfections | Add fingerprints/scratches/dust |
| Floating parts | Pivot/animation error | Re-seat pivot at mechanism |
| Leaning tower | Not plumb | Snap to world axis; check transform |
| Neon violation | Wrong accent color | Use §1.10 palette only |
| Over-budget load | Huge textures/no compression | KTX2 + Draco; LOD1 mobile |
| Validator warnings | Non-color maps tagged sRGB | Retag data maps Non-Color |
| Z-fighting | Coplanar surfaces | Add ≥0.5mm clearance |

## 8.7 Continuous Improvement

- Every defect found in review is logged to `_Standards/defect_log.md` with root cause.
- Recurring defects trigger a Chapter 2/3 clarification (documentation fix, not just asset fix).
- Quarterly Art Direction review updates this Bible (semantic version bump).

## 8.8 Sign-Off Template

```
ASSET: <AssetName>
SPEC VERSION: x.y
DATE: YYYY-MM-DD
ARTIST: <name>
PEER REVIEW: <name> — PASS/FAIL
TECH REVIEW: <name> — PASS/FAIL (validator: 0/0)
ART DIRECTION: <name> — APPROVED
NOTES: <any waivers or future work>
```

---

# APPENDIX A — QUICK REFERENCE

- **Up axis:** +Y. **Forward:** -Z. **Unit:** 1 = 1 meter.
- **Accent colors:** Cyan `#3FE0D0` (system alive), Amber `#FFB000` (energy), Magenta `#E0457B` (rare).
- **Neutrals:** Bone `#E8E6E1`, Graphite `#2B2D31`, Carbon `#16181C`.
- **Metals:** Titanium `#8C8F96`, Champagne `#C9A86A`.
- **Emissive rule:** cyan/amber only; cyan = alive.
- **Bevel default:** 0.4mm small / 1–2mm medium / 3–5mm large.
- **Texel density:** 512 tp/m target, 256–1024 range.
- **Validator:** Khronos glTF 2.0, 0 errors, 0 warnings.

# APPENDIX B — GLOSSARY

- **tp/m:** texels per meter.
- **ORM:** Occlusion-Roughness-Metal packed texture.
- **LOD:** Level of Detail.
- **IBL:** Image-Based Lighting (HDR environment).
- **ACES:** Academy Color Encoding System (film tone map).
- **glTF/GLB:** Graphics Language Transmission Format / Binary.
- **KTX2/BasisU:** GPU-compressed texture container.
- **Draco/Meshopt:** Geometry compression.
- **PBR:** Physically Based Rendering.

# APPENDIX C — REVISION HISTORY

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0.0 | 2026-07-11 | Arcyn Art Direction | Initial Art Bible. 45 assets, 8 chapters. |

---

*End of Arcyn Studios 3D Asset Bible — Single Source of Truth.*


