# Asset Request — `<ASSET-ID>`

- **Status:** `request-user`
- **Blocked task:** `<VIGIL-XXX>`
- **Target version:** `<v0.x.0>`
- **Purpose:** `<where this is used>`
- **Reference:** `<registry ID/path>`

## Required delivery

| Field               | Requirement                                 |
| ------------------- | ------------------------------------------- |
| Source format       | `<Aseprite / SVG / PSD / PNG / WAV / etc.>` |
| Export format       | `<PNG / WebP / WAV / etc.>`                 |
| Dimensions          | `<width × height>`                          |
| Background          | `<transparent / opaque>`                    |
| States/variants     | `<list>`                                    |
| Colour restrictions | `<list>`                                    |
| Immutable details   | `<list>`                                    |
| Rights/provenance   | `<user-owned / licensed source>`            |

## User-facing request

```markdown
### Gerekli dosya: `<ASSET-ID>`

Bu adıma devam edebilmem için ...

Dosyayı yüklemeden veya açıkça placeholder kullanımına izin vermeden implementasyona devam etmeyeceğim.
```

## Acceptance checks after delivery

- [ ] Correct dimensions and alpha.
- [ ] Every requested state exists.
- [ ] Visual identity is consistent.
- [ ] Rights/provenance recorded.
- [ ] User approval received.
- [ ] Registry status changed to `approved`.
