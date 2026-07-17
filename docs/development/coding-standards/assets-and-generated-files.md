# Assets and Generated Files Standards

## Mandatory preflight

Before implementing any task that refers to an image, sprite, UI frame, icon, logo, font, sound, video, copy deck, fixture or other external file:

1. inspect `docs/assets/asset-registry.yaml`,
2. identify the exact asset IDs required by the task,
3. verify status, provenance, dimensions, states and permitted usage,
4. stop and ask the user when any requirement is missing or ambiguous,
5. continue only after the user supplies the file or explicitly authorizes a named placeholder for that task.

The complete stop/request behavior is defined in `docs/agent/asset-request-protocol.md` and is mandatory for every coding agent.

## Source and implementation separation

- User-supplied editable masters belong under `assets/source/` when storage and licence permit.
- Runtime exports belong under `public/assets/`.
- Direction references belong under `docs/assets/` and remain `reference-only` unless explicitly promoted.
- Never overwrite the original user-supplied file.
- Do not crop a composite reference and treat the crop as a production asset.

## Generated files

- Do not hand-edit deterministic generated assets.
- Change the generator, regenerate, then review the diff.
- `scripts/generate_pixel_assets.py` owns scaffold pixel assets.
- `scripts/build_asset_manifest.py` owns `docs/assets/asset-manifest.json`.
- Generated assets must be reproducible from committed inputs and scripts.

## Registry metadata

Every production candidate records:

- stable asset ID,
- owner/provenance,
- source and implementation path,
- dimensions and file type,
- animation/control states,
- permitted and prohibited usage,
- approval status,
- checksum after supply/export.

Only `approved` assets may be treated as shippable production art. `reference-only`, `request-user`, `supplied-pending-review` and `scaffold-only` assets may not be silently promoted.

## Fonts and third-party media

- Do not download or bundle a font without explicit user approval and licence evidence.
- Do not use remote font or image URLs in runtime CSS.
- Do not add stock, generated or scraped media as a substitute for a requested user asset.
- Repository packages must not redistribute external source files unless their licence explicitly permits it.

## Visual approval and tests

- Functional text remains HTML and is not baked into raster assets.
- Establish or update screenshot baselines only after the relevant asset IDs are approved.
- A baseline update must state which approved assets changed and why.
- Do not hide a visual mismatch by raising screenshot thresholds broadly.
