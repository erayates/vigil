# Product Roadmap

## Phase map

| Phase | Version         | Outcome                                                            | Gate                                       |
| ----- | --------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| P0-A  | `v0.0.1`        | Initial product, architecture and runnable scaffold                | Baseline created                           |
| P0-B  | `v0.0.2`        | Roman pixel dashboard, asset gate and coding standards             | Main UI runs and docs are consistent       |
| P0-C  | `v0.0.3`        | Interaction polish, accessibility baseline and visual-test harness | Deterministic UI checks pass               |
| P0-D  | `v0.0.4`        | Cross-window state, persistence and capability spikes              | Technical choices recorded in ADRs         |
| P1    | `v0.1.0`        | End-to-end local focus vertical slice                              | Five-user task test passes                 |
| P2    | `v0.2.0`        | Daily-use alpha                                                    | Seven-day dogfooding without data loss     |
| P3    | `v0.3.0`        | Healthy progression and camp visualization                         | Progression does not reduce task clarity   |
| P4    | `v0.4.0`        | Reliability, accessibility and OS hardening                        | Windows test matrix passes                 |
| P5    | `v0.5.0–v0.8.0` | Private then public beta                                           | Retention and stability thresholds reached |
| P6    | `v0.9.0–v1.0.0` | Release candidate and stable distribution                          | No release-blocking defects                |
| P7    | `v1.1+`         | Optional intelligence, integrations and social experiments         | Separate validation per feature            |

## Current release — v0.0.2

Delivered foundation:

- componentized Roman pixel-art main dashboard,
- custom Tauri window header scaffold,
- generated 9-slice frame/texture placeholders,
- 64×96 state-driven legionary scaffold sprites,
- user-supplied UI reference analysis,
- mandatory stop-and-request asset protocol,
- asset registry and production-art request definitions,
- TypeScript/React, CSS, Tauri/Rust, testing, security and versioning standards,
- official technical research source register.

## Strategic sequencing

The visual system is established early because it affects component boundaries and validation, but production art lock does not precede the focus loop. The session loop is validated before progression. Progression is validated before AI or social features.

## Asset sequencing

- Scaffold assets support technical implementation only.
- Production UI/character art must be requested from the user through registry IDs.
- Agents stop rather than inventing missing art.
- Screenshot baselines are reviewed only after the relevant assets are approved.

Read each phase contract in `docs/roadmap/phases/`.
