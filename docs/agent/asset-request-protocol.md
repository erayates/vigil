# Asset Request Protocol

## Purpose

This protocol prevents an implementation agent from inventing, approximating or silently substituting visual and file dependencies. It applies to images, product photos, sprites, UI frames, icons, logos, fonts, audio, videos, copy decks, data files and any other external artifact needed to complete a task.

## Mandatory stop conditions

The agent must stop the current task and ask the user when:

- the specification refers to an asset that is not present,
- the only available file is a screenshot rather than the required source asset,
- exact visual fidelity is required but the original file is unavailable,
- dimensions, crop, transparency, states or export format are unclear,
- a character needs additional animation states not included in the sprite sheet,
- a logo, brand name, icon system or font has not been approved,
- an asset's ownership or licence is unknown,
- a supplied reference contains multiple elements and it is unclear which one should be reused,
- an agent would otherwise create a placeholder, use stock media or generate an approximation.

## Prohibited behavior

Unless the user explicitly authorizes it for the named task, an agent must not:

- use AI image generation to fill a missing production asset,
- download images, icons, fonts or audio from the internet,
- crop a screenshot and treat it as a production component,
- redraw a logo or exact product/character from memory,
- change colours, material, proportions, wording or quantities of supplied product imagery,
- proceed with CSS-only approximations while claiming the visual task is complete,
- mark a scaffold asset as approved.

## Asset preflight

Before implementation:

1. Open `docs/assets/asset-registry.yaml`.
2. List the asset IDs required by the task.
3. Verify status, path, permitted usage, dimensions and states.
4. Confirm whether the task allows `scaffold-only` assets.
5. If any check fails, issue one consolidated request and stop.

## User request template

Use this exact structure, adapted to the task:

```markdown
### Gerekli dosya: `<ASSET-ID>`

Bu adıma devam edebilmem için aşağıdaki dosyaya ihtiyacım var:

- **Amaç:** `<where and why it is used>`
- **Dosya türü:** `<PNG / SVG / Aseprite / WAV / JSON / etc.>`
- **Boyut:** `<exact source dimensions>`
- **Arka plan:** `<transparent / opaque>`
- **Gerekli durumlar:** `<idle, hover, pressed...>`
- **Değiştirilmeyecek unsurlar:** `<logo, proportions, colours...>`
- **Referans:** `<reference asset ID/path>`

Dosyayı yüklemeden veya bu bağımlılık için açıkça placeholder kullanımı onayı vermeden implementasyona devam etmeyeceğim.
```

## After the user supplies an asset

The agent must:

1. preserve the source file unchanged under `assets/source/` when licence permits,
2. create implementation exports under `public/assets/` only through a documented conversion step,
3. add checksum, dimensions, provenance and status to the registry,
4. mark the asset `supplied-pending-review`,
5. integrate it only after the user or task owner marks it `approved`,
6. update visual tests after approval.

## Status definitions

| Status                    | Meaning                                                  | May ship?  |
| ------------------------- | -------------------------------------------------------- | ---------- |
| `reference-only`          | Directional reference; never embedded as a component     | No         |
| `scaffold-only`           | Original placeholder for layout/technical development    | No         |
| `request-user`            | User must supply or waive                                | No         |
| `supplied-pending-review` | File exists but fidelity/rights/exports are not approved | No         |
| `approved`                | Approved for the documented use                          | Yes        |
| `deprecated`              | Must be replaced; existing use may remain temporarily    | No new use |
| `rejected`                | Must not be used                                         | No         |

## Exact-fidelity rule

When the user says an item must remain exact, the agent treats the supplied pixels/source geometry as immutable. Generative recreation is not a fidelity-preserving workflow. Integration should use compositing, layout, masks or direct source placement instead.
