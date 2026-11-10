# Asset sources (assets-src/)

Raw, freely licensed assets for the browser FPS. They are not wired into the game yet and are not under server/public.
Everything listed is CC0 / public domain. I checked each license on its source page on 2026-11-09. None of the downloads needed a login.

Previews: `previews/contact_sheet_0..2.jpg` (three.js renders of the models).

## Models

Triangle counts, sizes and animations were read from the GLB files with gltf-transform. "Bounds" is the static bounding box in model units (metres for Poly Haven and Grab3D).

| File | Size | Tris | Tex | Rig | Animations | Bounds (x×y×z) | Source | Author | License | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| models/cars/grab3d_1960s-sports-car.glb | 1.10 MB | 18555 | 5 | no | — | 1.732×1.3×4.417 | https://grab3d.com/models/vehicles/1960s-sports-car/ | Grab3D | CC0 (page and schema.org license field) | Car with PBR textures, no rig. Grab3D models start as AI drafts that are then corrected by hand in Blender. I did not check whether the wheels are separate nodes. |
| models/cars/grab3d_1980s-sports-car.glb | 1.16 MB | 18905 | 5 | no | — | 1.826×1.23×4.416 | https://grab3d.com/models/vehicles/1980s-sports-car/ | Grab3D | CC0 (page and schema.org license field) | Car with PBR textures, no rig. Grab3D models start as AI drafts that are then corrected by hand in Blender. I did not check whether the wheels are separate nodes. |
| models/cars/grab3d_1990s-police-car.glb | 1.17 MB | 19930 | 5 | no | — | 1.956×1.819×5.085 | https://grab3d.com/models/vehicles/1990s-police-car/ | Grab3D | CC0 (page and schema.org license field) | Car with PBR textures, no rig. Grab3D models start as AI drafts that are then corrected by hand in Blender. I did not check whether the wheels are separate nodes. |
| models/cars/grab3d_1990s-sports-car.glb | 1.08 MB | 16983 | 5 | no | — | 1.875×1.23×4.418 | https://grab3d.com/models/vehicles/1990s-sports-car/ | Grab3D | CC0 (page and schema.org license field) | Car with PBR textures, no rig. Grab3D models start as AI drafts that are then corrected by hand in Blender. I did not check whether the wheels are separate nodes. |
| models/characters/quaternius_ual_mannequin.glb | 6.36 MB | 13744 | 0 | yes (53 joints) | 46 clips (see notes) | 1.944×1.829×0.37 | https://opengameart.org/content/universal-animation-library | Quaternius | CC0 (OGA page and License.txt in the zip) | Universal Animation Library [Standard], Godot GLB. Untextured mannequin with 45+ clips, including Idle_Loop, Walk_Loop, Jog_Fwd_Loop, Sprint_Loop, Death01, Hit_Chest, Hit_Head, Crouch_*, Pistol_Idle/Aim/Shoot/Reload, Jump_* and Roll. |
| models/characters/soldier_grab3d_rigged.glb | 2.24 MB | 33476 | 3 | yes (24 joints) | run, walk | 0.013×0.018×0.005 | https://grab3d.com/models/characters/soldier/ | Grab3D | CC0 (page and schema.org license field) | Realistic modern soldier: digital camo, helmet, plate carrier. Grab3D says its models start as AI drafts that are then corrected by hand in Blender. The original rigged GLB was 279k tris, 13.5 MB, with 2k textures. I decimated it with gltf-transform weld + simplify (ratio 0.12) and resized the textures to 1024. Checked in three.js: about 1.70 m tall when skinned. The static bounds read 0.018 because of the armature scale; ignore that number. Only walk and run animations; no idle, no death. |
| models/characters/scifi_soldier_grab3d_rigged.glb | 2.46 MB | 33056 | 3 | yes (24 joints) | run (0.625 s), walk (1.0 s) | 0.011×0.018×0.004 | https://grab3d.com/models/characters/sci-fi-soldier/ | Grab3D | CC0 (page and schema.org license field) | Sci-fi soldier: white armour, dark grey joints, cyan accent lines and cyan helmet visor; slim build. Grab3D says its models start as AI drafts that are then corrected by hand in Blender. The original rigged GLB was 239k tris, 12.2 MB, with 2k textures. I decimated it with gltf-transform weld + simplify (one pass at ratio 0.135, which stopped at 37.6k because of UV seams, then a second pass at 0.88) and resized the textures to 1024 JPEG. Checked in three.js: both clips deform the skin cleanly (no torn or stretched faces); about 1.85 m tall in the rest pose and about 1.79 m mid-walk when skinned. The static bounds read 0.018 because of the armature scale; ignore that number. Same 24-joint skeleton (same bone names) as soldier_grab3d_rigged.glb, so clips can be shared between the two. Only walk and run; no idle, no death. Preview: `previews/scifi_soldier.jpg` (rest, walk, run, walk side view). |
| models/weapons/misc/rpg7_lowpoly.glb | 276 KB | 1012 | 1 | no | — | 2.195×0.97×0.215 | https://opengameart.org/content/low-poly-rpg7 | Lucian Pavel | CC0 (OGA page) | Rocket launcher (RPG-7) with the rocket as a separate mesh. Low poly, 512px diffuse texture. Converted FBX to GLB. |
| models/weapons/polyhaven/bolt_action_rifle_7_62.glb | 6.59 MB | 19985 | 7 | no | — | 1.231×0.205×0.067 | https://polyhaven.com/a/bolt_action_rifle_7_62 | Mateusz Sadek | CC0 (Poly Haven, https://polyhaven.com/license) | Bolt sniper rifle with scope. 1k PBR textures. About 6.6 MB, a little over the 5 MB target. |
| models/weapons/polyhaven/fish_knife.glb | 2.44 MB | 2736 | 3 | no | — | 0.029×0.216×0.016 | https://polyhaven.com/a/fish_knife | Mateusz Sadek | CC0 (Poly Haven, https://polyhaven.com/license) | Knife. Stand-in for a combat knife. |
| models/weapons/polyhaven/machete.glb | 2.31 MB | 3032 | 3 | no | — | 0.044×0.755×0.061 | https://polyhaven.com/a/machete | Ulan Cabanilla | CC0 (Poly Haven, https://polyhaven.com/license) | Machete. Alternative melee weapon. |
| models/weapons/polyhaven/service_pistol.glb | 3.14 MB | 27548 | 3 | no | — | 0.302×0.281×0.032 | https://polyhaven.com/a/service_pistol | Mateusz Sadek | CC0 (Poly Haven, https://polyhaven.com/license) | Pistol. Has two grip variants, magazines and a round as separate meshes. 1k PBR textures. |
| models/weapons/polyhaven/stick_grenade.glb | 1.81 MB | 4612 | 3 | no | — | 0.081×0.379×0.081 | https://polyhaven.com/a/stick_grenade | singaii | CC0 (Poly Haven, https://polyhaven.com/license) | WW2 German stick grenade. Stand-in only: this is not a frag grenade. |
| models/weapons/quaternius_fps_animated/P90.glb | 98 KB | 954 | 0 | yes (3 joints) | P90Armature|Fire, P90Armature|Reload | 1.371×3.599×11.083 | https://opengameart.org/content/low-poly-animated-guns | Quaternius | CC0 (OGA page) | Low-poly first-person guns with an armature and Fire/Reload clips. Converted FBX to GLB with FBX2glTF. NOTE: material colours came through as plain white/grey in the conversion; recolour in code or copy the colours from the matching OBJ/.mtl. Units are about 10x too large; scale down. The P90 Fire clip was dropped because it has zero channels in the source. |
| models/weapons/quaternius_fps_animated/Pistol.glb | 152 KB | 1491 | 0 | yes (4 joints) | PistolArmature|Fire, PistolArmature|Reload, PistolArmature|Slide | 9.735×6.304×1.512 | https://opengameart.org/content/low-poly-animated-guns | Quaternius | CC0 (OGA page) | Low-poly first-person guns with an armature and Fire/Reload clips. Converted FBX to GLB with FBX2glTF. NOTE: material colours came through as plain white/grey in the conversion; recolour in code or copy the colours from the matching OBJ/.mtl. Units are about 10x too large; scale down. The P90 Fire clip was dropped because it has zero channels in the source. |
| models/weapons/quaternius_fps_animated/Revolver.glb | 273 KB | 2812 | 0 | yes (6 joints) | RevolverArmature|Fire, RevolverArmature|Reload | 2.861×5.229×9.608 | https://opengameart.org/content/low-poly-animated-guns | Quaternius | CC0 (OGA page) | Low-poly first-person guns with an armature and Fire/Reload clips. Converted FBX to GLB with FBX2glTF. NOTE: material colours came through as plain white/grey in the conversion; recolour in code or copy the colours from the matching OBJ/.mtl. Units are about 10x too large; scale down. The P90 Fire clip was dropped because it has zero channels in the source. |
| models/weapons/quaternius_fps_animated/Rifle.glb | 205 KB | 1912 | 0 | yes (4 joints) | RifleArmature|FireWBullet, RifleArmature|FireWOBullet, RifleArmature|Reload | 0.398×1.681×9.597 | https://opengameart.org/content/low-poly-animated-guns | Quaternius | CC0 (OGA page) | Low-poly first-person guns with an armature and Fire/Reload clips. Converted FBX to GLB with FBX2glTF. NOTE: material colours came through as plain white/grey in the conversion; recolour in code or copy the colours from the matching OBJ/.mtl. Units are about 10x too large; scale down. The P90 Fire clip was dropped because it has zero channels in the source. |
| models/weapons/quaternius_fps_animated/Shotgun.glb | 115 KB | 1033 | 0 | yes (4 joints) | ShotgunArmature|FireWBullet, ShotgunArmature|FireWOBullet, ShotgunArmature|Reload | 0.476×1.689×8.536 | https://opengameart.org/content/low-poly-animated-guns | Quaternius | CC0 (OGA page) | Low-poly first-person guns with an armature and Fire/Reload clips. Converted FBX to GLB with FBX2glTF. NOTE: material colours came through as plain white/grey in the conversion; recolour in code or copy the colours from the matching OBJ/.mtl. Units are about 10x too large; scale down. The P90 Fire clip was dropped because it has zero channels in the source. |
| models/weapons/quaternius_fps_animated/SniperRifle.glb | 185 KB | 1710 | 0 | yes (5 joints) | SniperRifle |FireWBullet, SniperRifle |FireWOBullet, SniperRifle |Reload | 0.492×1.728×9.787 | https://opengameart.org/content/low-poly-animated-guns | Quaternius | CC0 (OGA page) | Low-poly first-person guns with an armature and Fire/Reload clips. Converted FBX to GLB with FBX2glTF. NOTE: material colours came through as plain white/grey in the conversion; recolour in code or copy the colours from the matching OBJ/.mtl. Units are about 10x too large; scale down. The P90 Fire clip was dropped because it has zero channels in the source. |
| models/weapons/quaternius_lowpoly/AssaultRifle2_1.glb | 120 KB | 1930 | 0 | no | — | 5.169×1.79×0.346 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/AssaultRifle_1.glb | 61 KB | 1244 | 0 | no | — | 3.105×1.26×0.196 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/Bipod.glb | 26 KB | 476 | 0 | no | — | 0.145×1.331×1.216 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/Bullpup_1.glb | 133 KB | 2778 | 0 | no | — | 5.248×1.541×0.31 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/Pistol_1.glb | 57 KB | 1040 | 0 | no | — | 1.819×1.162×0.323 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/Revolver_1.glb | 47 KB | 1046 | 0 | no | — | 1.982×0.89×0.294 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/Scope_1.glb | 23 KB | 412 | 0 | no | — | 2.105×0.384×0.31 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/Shotgun_1.glb | 59 KB | 1270 | 0 | no | — | 5.215×0.943×0.247 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/Silencer_1.glb | 13 KB | 248 | 0 | no | — | 1.745×0.315×0.331 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/SniperRifle_1.glb | 71 KB | 1382 | 0 | no | — | 7.295×1.484×0.459 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/quaternius_lowpoly/SubmachineGun_1.glb | 55 KB | 1164 | 0 | no | — | 2.771×1.709×0.319 | https://opengameart.org/content/low-poly-guns-pack | Quaternius | CC0 (OGA page; also quaternius.itch.io/50-lowpoly-guns) | Low poly with flat material colours, no textures. Converted OBJ to GLB with obj2gltf. |
| models/weapons/realistic/ak47_stein.glb | 1.86 MB | 16110 | 3 | yes (17 joints, 2 skins) | — | 0.078×0.287×1.031 | https://stein-indie.itch.io/classic-weapons-pack | Stein Games (stein-indie) | CC0 1.0 (itch page and license.txt in the zip) | Assault rifle (AK-47, wood furniture). Skinned weapon rig (Unreal SKM) with bones for the moving parts; no animations. Textures repacked from Unreal RMAO (R rough, G metal, B AO) to glTF ORM; normal map green channel flipped (DirectX to OpenGL). FBX2glTF left one optional rail-attachment mesh with no skin weights (NaN); I removed it. Wood/metal look, 1k jpeg PBR. Bones: FRAME, MAGAZINE, MAGAZINE_EXTRA, BULLET, SLIDE (bolt carrier), SELECTOR, EJECTOR, TRIGGER, BARREL, IRONSIGHT, plus socket bones FX_FIRE, FX_CASING, ATTACH_SCOPE, ATTACH_SILENCER, REVEAL_RAIL. Bullet material has no texture in the pack; I gave it a flat brass colour. |
| models/weapons/realistic/mp5_stein.glb | 1.70 MB | 12861 | 3 | yes (2 skins) | — | 0.061×0.280×0.715 | https://stein-indie.itch.io/classic-weapons-pack | Stein Games (stein-indie) | CC0 1.0 (itch page and license.txt in the zip) | Submachine gun (MP5 style with rail and retractable stock). Skinned weapon rig (Unreal SKM) with bones for the moving parts; no animations. Textures repacked from Unreal RMAO (R rough, G metal, B AO) to glTF ORM; normal map green channel flipped (DirectX to OpenGL). FBX2glTF left one optional rail-attachment mesh with no skin weights (NaN); I removed it. Wood/metal look, 1k jpeg PBR. Bones: FRAME, MAGASINE (sic), MAGASINE_RELEASE, BULLET, BOLT, BOLT_02, SELECTOR, TRIGGER, BACK_CARABINER_01, IRONSIGHT, plus FX/ATTACH sockets. |
| models/weapons/realistic/m1911_stein.glb | 1.50 MB | 8529 | 3 | yes (3 skins) | — | 0.037×0.160×0.234 | https://stein-indie.itch.io/classic-weapons-pack | Stein Games (stein-indie) | CC0 1.0 (itch page and license.txt in the zip) | Heavy pistol (M1911 style, wood grips). Skinned weapon rig (Unreal SKM) with bones for the moving parts; no animations. Textures repacked from Unreal RMAO (R rough, G metal, B AO) to glTF ORM; normal map green channel flipped (DirectX to OpenGL). FBX2glTF left one optional rail-attachment mesh with no skin weights (NaN); I removed it. Wood/metal look, 1k jpeg PBR. Bones: FRAME, SLIDE, MAGAZINE, BULLET, HAMMER, TRIGGER, SAFETY, LEVER, RELEASE, IRONSIGHT, plus FX/ATTACH sockets. The pack's separate T_1911_R/R1/R2 roughness variants were not used. |
| models/weapons/realistic/m4a1_3dmcc0.glb | 0.60 MB | 9256 | 3 | no | — | 0.064×0.266×0.859 | https://3dmodelscc0.itch.io/free-cc0-guns-explosives-pack | 3dmodelscc0 | CC0 (itch page: "CC0 public domain license"; page also says no generative AI was used) | Carbine (M4A1 with quad rail). Separate mesh nodes per part. 1k jpeg PBR (base colour, normal, metal/rough packed); height map dropped. Nodes: M4A1, Magazine, Base, Parts, Charging_Handle, Sight, Sight_2, Switch1, Switch2, Firemode_Selector, Trigger, Ejector, Ejector_Lid, Ejector_2, Barrel, Stock. Also usable as the AR-15-style assault rifle. |
| models/weapons/realistic/shotgun_3dmcc0.glb | 0.34 MB | 1740 | 3 | no | — | 0.056×0.241×1.219 | https://3dmodelscc0.itch.io/free-cc0-guns-explosives-pack | 3dmodelscc0 | CC0 (itch page: "CC0 public domain license"; page also says no generative AI was used) | Pump shotgun (wood stock, 870-style). Separate mesh nodes per part. 1k jpeg PBR (base colour, normal, metal/rough packed); height map dropped. Nodes: Shotgun, Fore_Stock (the pump), Ejection_Port, Trigger. Low poly but the textures carry the detail. |
| models/weapons/realistic/makarov_3dmcc0.glb | 0.52 MB | 3991 | 3 | no | — | 0.026×0.128×0.168 | https://3dmodelscc0.itch.io/free-cc0-guns-explosives-pack | 3dmodelscc0 | CC0 (itch page: "CC0 public domain license"; page also says no generative AI was used) | Semi-auto pistol (Makarov PM). Stand-in for the Glock-style pistol; I found no CC0 Glock. Separate mesh nodes per part. 1k jpeg PBR (base colour, normal, metal/rough packed); height map dropped. Nodes: Body, Slide, Barrel, Magazine, Hammer, Safety, Trigger. The source placed the magazine outside the gun; I moved the Magazine node from z 0.108 to 0.018 so it sits in the grip. |
| models/weapons/realistic/frag_grenade_3dmcc0.glb | 0.42 MB | 3642 | 3 | no | — | 0.054×0.102×0.063 | https://3dmodelscc0.itch.io/free-cc0-guns-explosives-pack | 3dmodelscc0 | CC0 (itch page: "CC0 public domain license"; page also says no generative AI was used) | Frag grenade (M67-style "GRENADE FRAG, HAND"). Separate mesh nodes per part. 1k jpeg PBR (base colour, normal, metal/rough packed); height map dropped. Nodes: Grenade, Pin (separate, for the pin-pull). |
| models/weapons/realistic/combat_knife_3dmcc0.glb | 0.35 MB | 1550 | 3 | no | — | 0.055×0.297×0.024 | https://3dmodelscc0.itch.io/free-cc0-melee-weapons-pack | 3dmodelscc0 | CC0 (itch page: "CC0 public domain license") | Combat knife (KA-BAR style, black blade). Separate mesh nodes per part. 1k jpeg PBR (base colour, normal, metal/rough packed); height map dropped. One node. |

### Realistic weapons (models/weapons/realistic/)

Added 2026-11-09. Preview: `previews/weapons_realistic.jpg` (top row: AK-47, M4A1, MP5, shotgun; bottom row: Makarov, 1911, frag grenade, combat knife).
All three source packs are free itch.io downloads with no login ("No thanks, just take me to the downloads"). They ship FBX + PNG. I converted them with FBX2glTF, re-attached the textures with gltf-transform, and resized every map to 1024 px JPEG. All models are in metres and under 60k tris and 5 MB, so none needed simplifying. Grab3D has no firearms (its weapons category is medieval, plus a toy ray gun and a stylized hunting knife). Poly Haven has only the two firearms already in `polyhaven/`.

The source packs also hold other CC0 models I did not convert: Stein Games has a MAC-10, Tec-9 (colour map only), M14, M700 and lever-action rifle. 3dmodelscc0 has a second AK-47, Suomi KP and M3 grease gun (both SMGs), a Luger, a bolt sniper rifle, a flare gun, a WW2 M24 stick grenade, flash and smoke grenades, C4, a claymore, an AT mine, a pipe bomb and a Molotov. The melee pack also has a machete, a crowbar, a fire axe, a modern tomahawk and more.

Still missing: light machine gun and a realistic rocket launcher (only `misc/rpg7_lowpoly.glb`). I found no CC0, no-login source for either.

Sketchfab fallback (license field reads "CC0 Public Domain" via the Sketchfab API; download needs a free Sketchfab login). These are photogrammetry museum scans; the ones over 60k faces need decimating:
- Special Sniper Rifle VSS Vintorez, Arms Museum, 36k faces: https://sketchfab.com/3d-models/none-4d5d8c1b7b79429abfa4816f18330089
- Infantry Rifle mod. 1891 with Bayonet (Mosin), Arms Museum, 27k faces: https://sketchfab.com/3d-models/none-675e53749e2b4e778b6cee446d66ffaa
- Vis P35(p) pistol, Virtual Museums of Małopolska, 64k faces: https://sketchfab.com/3d-models/none-babe98e5485241f1971c10544f2ff796
- Colt-type revolver, Virtual Museums of Małopolska, 322k faces: https://sketchfab.com/3d-models/none-d0c9d2c989134fefb623c62b25a51daf
- Shotgun, Virtual Museums of Małopolska, 326k faces: https://sketchfab.com/3d-models/none-3c3ed272927c4f3d83d607b2acbf7aab
- Stick Grenade, Arms Museum, 100k faces: https://sketchfab.com/3d-models/none-06954f12f27843b1a9aa38d4c9bdc1d0

### Skeletons (for retargeting)

The realistic soldier only has walk and run. Idle and death exist only on the Quaternius mannequin, which uses a different (Rigify DEF-*) skeleton. To reuse those clips, retarget with `SkeletonUtils.retargetClip` and a name map such as DEF-hips→Hips, DEF-spine.001/.002/.003→Spine/Spine01/Spine02, DEF-neck→neck, DEF-head→Head, DEF-shoulder.L→LeftShoulder, DEF-upper_arm.L→LeftArm, DEF-forearm.L→LeftForeArm, DEF-hand.L→LeftHand, DEF-thigh.L→LeftUpLeg, DEF-shin.L→LeftLeg, DEF-foot.L→LeftFoot, DEF-toe.L→LeftToeBase (same pattern for .R/Right). The rest poses differ (the mannequin is in T-pose), so expect some tuning.

- Soldier joints (24): Hips, LeftUpLeg, LeftLeg, LeftFoot, LeftToeBase, RightUpLeg, RightLeg, RightFoot, RightToeBase, Spine02, Spine01, Spine, LeftShoulder, LeftArm, LeftForeArm, LeftHand, neck, Head, head_end, headfront, RightShoulder, RightArm, RightForeArm, RightHand
- Sci-fi soldier joints (24): Hips, LeftUpLeg, LeftLeg, LeftFoot, LeftToeBase, RightUpLeg, RightLeg, RightFoot, RightToeBase, Spine02, Spine01, Spine, LeftShoulder, LeftArm, LeftForeArm, LeftHand, neck, Head, head_end, headfront, RightShoulder, RightArm, RightForeArm, RightHand (identical to the soldier)
- Sci-fi soldier clips: run (0.625 s, 72 tracks), walk (1.0 s, 72 tracks)
- Mannequin joints (53): root, DEF-hips, DEF-spine.001, DEF-spine.002, DEF-spine.003, DEF-neck, DEF-head, DEF-shoulder.L, DEF-upper_arm.L, DEF-forearm.L, DEF-hand.L, DEF-f_index.01.L, DEF-f_index.02.L, DEF-f_index.03.L, DEF-f_middle.01.L, DEF-f_middle.02.L, DEF-f_middle.03.L, DEF-f_pinky.01.L, DEF-f_pinky.02.L, DEF-f_pinky.03.L, DEF-f_ring.01.L, DEF-f_ring.02.L, DEF-f_ring.03.L, DEF-thumb.01.L, DEF-thumb.02.L, DEF-thumb.03.L, DEF-shoulder.R, DEF-upper_arm.R, DEF-forearm.R, DEF-hand.R, DEF-f_index.01.R, DEF-f_index.02.R, DEF-f_index.03.R, DEF-f_middle.01.R, DEF-f_middle.02.R, DEF-f_middle.03.R, DEF-f_pinky.01.R, DEF-f_pinky.02.R, DEF-f_pinky.03.R, DEF-f_ring.01.R, DEF-f_ring.02.R, DEF-f_ring.03.R, DEF-thumb.01.R, DEF-thumb.02.R, DEF-thumb.03.R, DEF-thigh.L, DEF-shin.L, DEF-foot.L, DEF-toe.L, DEF-thigh.R, DEF-shin.R, DEF-foot.R, DEF-toe.R
- Mannequin clips: A_TPose, Crouch_Fwd_Loop, Crouch_Idle_Loop, Dance_Loop, Death01, Driving_Loop, Fixing_Kneeling, Hit_Chest, Hit_Head, Idle_Loop, Idle_Talking_Loop, Idle_Torch_Loop, Interact, Jog_Fwd_Loop, Jump_Land, Jump_Loop, Jump_Start, PickUp_Table, Pistol_Aim_Down, Pistol_Aim_Neutral, Pistol_Aim_Up, Pistol_Idle_Loop, Pistol_Reload, Pistol_Shoot, Punch_Cross, Punch_Enter, Punch_Jab, Push_Loop, Roll, Roll_RM, Sitting_Enter, Sitting_Exit, Sitting_Idle_Loop, Sitting_Talking_Loop, Spell_Simple_Enter, Spell_Simple_Exit, Spell_Simple_Idle_Loop, Spell_Simple_Shoot, Sprint_Loop, Swim_Fwd_Loop, Swim_Idle_Loop, Sword_Attack, Sword_Attack_RM, Sword_Idle, Walk_Formal_Loop, Walk_Loop

## Sounds

All files are .ogg (Vorbis q5, 44.1 kHz). Gunshots were trimmed: leading silence removed, cut to 1.5–4 s with a 0.3 s fade-out.

| File | Size | Duration | Source | Author | License | Notes |
|---|---|---|---|---|---|---|
| sounds/explosions/rubberduck100_explosion.ogg | 25 KB | 0.56 s | https://opengameart.org/content/100-cc0-sfx | rubberduck | CC0 | explosion.ogg from 100 CC0 SFX (recorded on a phone). |
| sounds/explosions/rubberduck_bang_01.ogg | 36 KB | 1.03 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/explosions/rubberduck_bang_02.ogg | 35 KB | 0.89 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/explosions/rubberduck_bang_04.ogg | 42 KB | 1.09 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/explosions/rubberduck_bang_05.ogg | 45 KB | 1.11 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/explosions/rubberduck_bang_10.ogg | 36 KB | 1.38 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/explosions/rubberduck_cannon_01.ogg | 53 KB | 1.24 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/explosions/rubberduck_cannon_02.ogg | 67 KB | 1.80 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/explosions/rubberduck_cannon_03.ogg | 38 KB | 0.86 s | https://opengameart.org/content/25-cc0-bang-firework-sfx | rubberduck | CC0 | Recorded firework and cannon bangs, used as explosion stand-ins. |
| sounds/footsteps/boot_on_concrete_thimras_01.ogg | 7 KB | 0.13 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/boot_on_concrete_thimras_02.ogg | 6 KB | 0.10 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/boot_on_concrete_thimras_03.ogg | 6 KB | 0.08 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/boot_on_concrete_thimras_04.ogg | 7 KB | 0.14 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/boot_on_concrete_thimras_05.ogg | 7 KB | 0.13 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/boot_on_concrete_thimras_06.ogg | 7 KB | 0.14 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/boot_on_concrete_thimras_07.ogg | 7 KB | 0.14 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/boot_on_concrete_thimras_08.ogg | 7 KB | 0.12 s | https://opengameart.org/content/metal-footsteps-on-concrete | Thimras | CC0 | "Metal foot on concrete", i.e. a hard boot on concrete. These are NOT footsteps on a metal surface. |
| sounds/footsteps/concrete_kenney_000.ogg | 6 KB | 0.11 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | footstep_concrete_00x from the Impact Sounds pack. |
| sounds/footsteps/concrete_kenney_001.ogg | 6 KB | 0.11 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | footstep_concrete_00x from the Impact Sounds pack. |
| sounds/footsteps/concrete_kenney_002.ogg | 6 KB | 0.11 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | footstep_concrete_00x from the Impact Sounds pack. |
| sounds/footsteps/concrete_kenney_003.ogg | 6 KB | 0.11 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | footstep_concrete_00x from the Impact Sounds pack. |
| sounds/footsteps/concrete_kenney_004.ogg | 6 KB | 0.11 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | footstep_concrete_00x from the Impact Sounds pack. |
| sounds/gunshots/carbine_556_ar15.ogg | 40 KB | 2.00 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: AR-15/D_32P.wav (near). |
| sounds/gunshots/lmg_ak47_long_burst.ogg | 76 KB | 4.00 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: AK-47/C_27P.wav (near, long burst; LMG stand-in). |
| sounds/gunshots/pistol_45_1911.ogg | 41 KB | 2.00 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: 1911/A_42P.wav (near). |
| sounds/gunshots/pistol_9mm_walther_ppq.ogg | 39 KB | 2.00 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: Walther PPQ/X_39P.wav (near). |
| sounds/gunshots/revolver_38_sw642.ogg | 38 KB | 2.00 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: Smith & Wesson 642/V_27P.wav (near). |
| sounds/gunshots/rifle_762_ak47_burst.ogg | 49 KB | 2.50 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: AK-47/C_29P.wav (near, short burst). |
| sounds/gunshots/rifle_762_ak47_single.ogg | 38 KB | 2.00 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: AK-47/C_28P.wav (near). |
| sounds/gunshots/rifle_ak47_distant.ogg | 49 KB | 2.50 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: AK-47/C_31P.wav (mid distance). |
| sounds/gunshots/shotgun_12ga_nova_pump.ogg | 47 KB | 2.50 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: Nova/O_21P.wav (Benelli Nova pump, near). |
| sounds/gunshots/smg_9mm_m45_burst.ogg | 49 KB | 2.50 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: Carl Gustav M45/G_33P.wav (near, short burst). |
| sounds/gunshots/smg_9mm_m45_single.ogg | 30 KB | 1.50 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: Carl Gustav M45/G_31P.wav (near). |
| sounds/gunshots/sniper_3006_tikka_bolt.ogg | 55 KB | 3.00 s | https://opengameart.org/content/the-free-firearm-sound-library | Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney (The Free Firearm Sound Library) | CC0 | Recorded live fire from real firearms. Original: Tikka/W_29P.wav (Tikka T3 .30-06 bolt action, near). |
| sounds/impacts/impactGeneric_light_000.ogg | 6 KB | 0.14 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactGeneric_light_001.ogg | 6 KB | 0.12 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactGeneric_light_002.ogg | 6 KB | 0.14 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactGlass_light_000.ogg | 6 KB | 0.21 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactGlass_light_001.ogg | 6 KB | 0.21 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactGlass_light_002.ogg | 6 KB | 0.21 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_heavy_000.ogg | 6 KB | 0.17 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_heavy_001.ogg | 7 KB | 0.36 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_heavy_002.ogg | 6 KB | 0.12 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_light_000.ogg | 7 KB | 0.35 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_light_001.ogg | 7 KB | 0.25 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_light_002.ogg | 7 KB | 0.24 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_medium_000.ogg | 7 KB | 0.27 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_medium_001.ogg | 6 KB | 0.14 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactMetal_medium_002.ogg | 6 KB | 0.12 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactPlate_light_000.ogg | 10 KB | 0.54 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactPlate_light_001.ogg | 11 KB | 0.65 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactPlate_light_002.ogg | 10 KB | 0.49 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactPlate_medium_000.ogg | 11 KB | 0.61 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactPlate_medium_001.ogg | 11 KB | 0.62 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactPlate_medium_002.ogg | 10 KB | 0.52 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactSoft_medium_000.ogg | 5 KB | 0.12 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactSoft_medium_001.ogg | 5 KB | 0.18 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactSoft_medium_002.ogg | 5 KB | 0.14 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactTin_medium_000.ogg | 6 KB | 0.16 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactTin_medium_001.ogg | 6 KB | 0.17 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactTin_medium_002.ogg | 6 KB | 0.13 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactWood_medium_000.ogg | 6 KB | 0.33 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactWood_medium_001.ogg | 6 KB | 0.33 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/impacts/impactWood_medium_002.ogg | 6 KB | 0.33 s | https://kenney.nl/assets/impact-sounds | Kenney | CC0 | Stand-ins for bullet impacts and casings. impactMetal_* and impactPlate_* can also substitute for footsteps on metal floors. |
| sounds/melee/swing_swoosh_qubodup_32.ogg | 28 KB | 1.41 s | https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes | qubodup (Iwan Gabovitch) | CC0 | Recorded bamboo-stick swishes, for the knife swing. Converted from FLAC. |
| sounds/melee/swing_swoosh_qubodup_34.ogg | 20 KB | 0.91 s | https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes | qubodup (Iwan Gabovitch) | CC0 | Recorded bamboo-stick swishes, for the knife swing. Converted from FLAC. |
| sounds/melee/swing_swoosh_qubodup_36.ogg | 12 KB | 0.38 s | https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes | qubodup (Iwan Gabovitch) | CC0 | Recorded bamboo-stick swishes, for the knife swing. Converted from FLAC. |
| sounds/melee/swing_swoosh_qubodup_38.ogg | 21 KB | 0.93 s | https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes | qubodup (Iwan Gabovitch) | CC0 | Recorded bamboo-stick swishes, for the knife swing. Converted from FLAC. |
| sounds/melee/swing_swoosh_qubodup_40.ogg | 14 KB | 0.53 s | https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes | qubodup (Iwan Gabovitch) | CC0 | Recorded bamboo-stick swishes, for the knife swing. Converted from FLAC. |
| sounds/melee/swing_swoosh_qubodup_42.ogg | 12 KB | 0.40 s | https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes | qubodup (Iwan Gabovitch) | CC0 | Recorded bamboo-stick swishes, for the knife swing. Converted from FLAC. |
| sounds/reload/gun_reload_airsoft.ogg | 29 KB | 1.58 s | https://opengameart.org/content/gun-reload-sounds | SpringySpringo | CC0 | Recorded with airsoft guns. |
| sounds/reload/mag_insert_click_1.ogg | 7 KB | 0.26 s | https://opengameart.org/content/gun-reload-sound-effects | BMacZero | CC0 | Recorded clicks. |
| sounds/reload/mag_insert_click_2.ogg | 7 KB | 0.21 s | https://opengameart.org/content/gun-reload-sound-effects | BMacZero | CC0 | Recorded clicks. |
| sounds/reload/pistol_mag_drop_insert_slide_rack.ogg | 29 KB | 1.59 s | https://opengameart.org/content/handgun-reload-sound-effect | zer0_sol | CC0 | Recorded magazine drop, insert and slide rack. |
| sounds/reload/rifle_reload_airsoft.ogg | 26 KB | 1.56 s | https://opengameart.org/content/gun-reload-sounds | SpringySpringo | CC0 | Recorded with airsoft guns. |
| sounds/reload/shotgun_pump_cock_airsoft.ogg | 12 KB | 0.47 s | https://opengameart.org/content/gun-reload-sounds | SpringySpringo | CC0 | Recorded with airsoft guns. |
| sounds/reload/shotgun_pump_rack.ogg | 16 KB | 1.13 s | https://opengameart.org/content/shotgun-reload-sound-effects | zer0_sol | CC0 | Recorded shotgun foley. |
| sounds/reload/shotgun_shell_in_chamber.ogg | 24 KB | 1.94 s | https://opengameart.org/content/shotgun-reload-sound-effects | zer0_sol | CC0 | Recorded shotgun foley. |
| sounds/reload/shotgun_shell_load_first.ogg | 42 KB | 4.16 s | https://opengameart.org/content/shotgun-reload-sound-effects | zer0_sol | CC0 | Recorded shotgun foley. |
| sounds/reload/shotgun_shell_load_next.ogg | 42 KB | 4.08 s | https://opengameart.org/content/shotgun-reload-sound-effects | zer0_sol | CC0 | Recorded shotgun foley. |
| sounds/reload/single_round_load.ogg | 7 KB | 0.30 s | https://opengameart.org/content/gun-reload-sound-effects | BMacZero | CC0 | Recorded clicks. |

## Not found / gaps

- Realistic (PBR) models for the revolver, SMG, assault rifle, carbine, pump shotgun and LMG: I found no CC0 source that downloads without a login. Low-poly Quaternius models fill these slots. There is no LMG model at all; use AssaultRifle + Bipod as a stand-in.
- Frag grenade: only the WW2 stick grenade. Combat knife: the fish knife and machete are stand-ins.
- Rigged first-person arms/hands: none found under CC0.
- Shell-casing drop sounds: none found under CC0. Kenney impactTin and impactMetal_light are the closest.
- Footsteps on a metal surface: no recording found. Kenney impactMetal and impactPlate are substitutes.
- The explosions are recorded fireworks and cannon, not real explosives.

## Leads not taken

- PSX Guns Pack (amos-makes, CC0, textured GLTF: AK47, Glock, Remington 870, Thompson): https://amos-makes.itch.io/psx-guns-pack. The itch download needs a click in a browser (my scripted download was rejected), so it has to be downloaded by hand.
- Low Poly Rocket Launcher by khairul169 (OGA): the page says CC0 but the README inside the zip says MIT, so I skipped it.
- poly.pizza: behind a Cloudflare bot check, and its API needs a key. Skipped.
- Sketchfab "Firearms Kit 10 (CC0)": needs a login. Skipped.
- The Free Firearm Sound Library covers 25 guns with near and mid-distance shots (194 MB 7z). More variants are on the same page.

## Sounds (added 2026-11-10)

Freesound.org "HQ preview" MP3s (128 kbps; the originals need a login). Each license was checked on the sound's own page on 2026-11-10. Descriptions come from each page, not from listening. Approved for download by Moe on 2026-11-10.

| File | Size | Length | Source | Author | License | Notes |
|---|---|---|---|---|---|---|
| sounds/car/eng-merc-500.mp3 | 42 KB | 1.9 s | https://freesound.org/s/162506/ | Chippy569 | CC0 | Mercedes 190E dyno ~500rpm load |
| sounds/car/eng-merc-2500.mp3 | 105 KB | 4.8 s | https://freesound.org/s/162509/ | Chippy569 | CC0 | ~2500rpm load |
| sounds/car/eng-merc-6500.mp3 | 37 KB | 1.6 s | https://freesound.org/s/162512/ | Chippy569 | CC0 | ~6500rpm load |
| sounds/car/eng-merc-sweep.mp3 | 77 KB | 4.3 s | https://freesound.org/s/162499/ | Chippy569 | CC0 | accel sweep |
| sounds/car/eng-bmw-idle.mp3 | 71 KB | 3.1 s | https://freesound.org/s/401552/ | GiocoSound | CC0 | BMW 120d idle ext |
| sounds/car/eng-bmw-low.mp3 | 49 KB | 2.1 s | https://freesound.org/s/401556/ | GiocoSound | CC0 | low |
| sounds/car/eng-bmw-med.mp3 | 65 KB | 2.8 s | https://freesound.org/s/401555/ | GiocoSound | CC0 | med |
| sounds/car/eng-bmw-high.mp3 | 48 KB | 2.0 s | https://freesound.org/s/401551/ | GiocoSound | CC0 | high |
| sounds/car/passby-dodge.mp3 | 532 KB | 23.7 s | https://freesound.org/s/149789/ | theaudiosynthesist | CC0 | muscle car doppler |
| sounds/car/passby-clean.mp3 | 118 KB | 5.4 s | https://freesound.org/s/171447/ | hinzebeat | CC0 | clean L-R pass |
| sounds/car/passby-lemans.mp3 | 49 KB | 2.1 s | https://freesound.org/s/1930/ | RHumphries | CC-BY-4.0 | RHumphries Le Mans pass |
| sounds/car/backfire-r8.mp3 | 2938 KB | 128.3 s | https://freesound.org/s/457733/ | Jonas_Jocys | CC-BY-4.0 | Jonas_Jocys Audi R8 backfires |
| sounds/car/antilag.mp3 | 238 KB | 11.3 s | https://freesound.org/s/797835/ | modusmogulus | CC0 | raw antilag |
| sounds/car/shift-lotus.mp3 | 303 KB | 13.5 s | https://freesound.org/s/697836/ | conicity | CC0 | manual shifts |
| sounds/car/shift-auto.mp3 | 154 KB | 6.5 s | https://freesound.org/s/116598/ | mrmccormack | CC0 | shifter clunks |
| sounds/car/skid-lhs04.mp3 | 350 KB | 16.5 s | https://freesound.org/s/71739/ | audible-edge | CC0 | sustained squeal |
| sounds/car/skid-lhs02.mp3 | 238 KB | 11.1 s | https://freesound.org/s/71737/ | audible-edge | CC0 | cornering squeals |
| sounds/car/skid-handbrake.mp3 | 221 KB | 10.4 s | https://freesound.org/s/76804/ | audible-edge | CC0 | handbrake slide |
| sounds/car/crash-squareal.mp3 | 94 KB | 4.4 s | https://freesound.org/s/237375/ | squareal | CC0 | layered crash |
| sounds/car/crash-glass.mp3 | 48 KB | 2.6 s | https://freesound.org/s/592388/ | magnuswaker | CC0 | crash with glass |
| sounds/car/crash-metal.mp3 | 103 KB | 4.5 s | https://freesound.org/s/40158/ | moxobna | CC0 | loud metal crash |
| sounds/car/bump-clank.mp3 | 14 KB | 0.5 s | https://freesound.org/s/151624/ | qubodup | CC0 | short clank |
| sounds/battle/bed-marines.mp3 | 5041 KB | 244.1 s | https://freesound.org/s/161346/ | qubodup | CC0 | 4 min real firefight |
| sounds/battle/bed-gunfire.mp3 | 1348 KB | 73.7 s | https://freesound.org/s/205588/ | qubodup | CC0 | mixed distances |
| sounds/battle/bed-loop.mp3 | 544 KB | 23.8 s | https://freesound.org/s/239139/ | qubodup | CC0 | war ambience loop |
| sounds/battle/far-tank.mp3 | 363 KB | 18.0 s | https://freesound.org/s/184275/ | qubodup | CC0 | distant tank shots |
| sounds/battle/far-demolition.mp3 | 758 KB | 33.1 s | https://freesound.org/s/125937/ | alienistcog | CC0 | demolition boom |
| sounds/battle/far-artillery.mp3 | 120 KB | 6.9 s | https://freesound.org/s/239137/ | qubodup | CC0 | artillery |
| sounds/explosion/near-tnt.mp3 | 380 KB | 16.8 s | https://freesound.org/s/165808/ | sidohzen | CC0 | 4kg TNT + debris |
| sounds/explosion/near-punchy.mp3 | 65 KB | 3.0 s | https://freesound.org/s/182429/ | qubodup | CC0 | short explosion |
| sounds/explosion/near-windy.mp3 | 240 KB | 12.2 s | https://freesound.org/s/182797/ | qubodup | CC0 | ammo disposal |
| sounds/debris/rockfall.mp3 | 750 KB | 31.6 s | https://freesound.org/s/381645/ | AlanCat | CC0 | boulders |
| sounds/debris/falling-big.mp3 | 103 KB | 4.7 s | https://freesound.org/s/703247/ | xkeril | CC0 | construction debris |
| sounds/debris/concrete-smash.mp3 | 37 KB | 1.3 s | https://freesound.org/s/522099/ | magnuswaker | CC0 | rubble impact |
| sounds/bullet/flyby-real.mp3 | 3 KB | 0.1 s | https://freesound.org/s/855248/ | qubodup | CC0 | real flyby |
| sounds/bullet/passbys.mp3 | 348 KB | 15.8 s | https://freesound.org/s/134024/ | Audionautics | CC-BY-3.0 | Audionautics whizzes |
| sounds/bullet/crack.mp3 | 12 KB | 0.4 s | https://freesound.org/s/386854/ | morganpurkis | CC0 | synthetic crack |
| sounds/bullet/ric-22.mp3 | 16 KB | 0.8 s | https://freesound.org/s/523403/ | C-V | CC0 | .22 + ricochet |
| sounds/bullet/ric-22-string.mp3 | 56 KB | 3.1 s | https://freesound.org/s/523404/ | C-V | CC0 | string w/ ricochets |
| sounds/bullet/ric-rifle.mp3 | 42 KB | 1.8 s | https://freesound.org/s/148840/ | cedarstudios | CC0 | real ricochets |
| sounds/bullet/ric-granite.mp3 | 22 KB | 0.9 s | https://freesound.org/s/78092/ | Benboncan | CC-BY-4.0 | Benboncan |
| sounds/bullet/imp-metal-45.mp3 | 104 KB | 4.5 s | https://freesound.org/s/148837/ | cedarstudios | CC0 | .45 on steel plate |
| sounds/bullet/imp-metal-pings.mp3 | 316 KB | 12.7 s | https://freesound.org/s/144444/ | pushkin | CC0 | sliceable pings |
| sounds/bullet/imp-metal-foley.mp3 | 440 KB | 20.0 s | https://freesound.org/s/182263/ | martian | CC0 | foley metal hits |
| sounds/bullet/imp-metal-steel.mp3 | 17 KB | 0.7 s | https://freesound.org/s/238923/ | vumseplutten1709 | CC-BY-3.0 | vumseplutten1709 |
| sounds/bullet/imp-wood.mp3 | 5 KB | 0.1 s | https://freesound.org/s/237448/ | NoiseCollector | CC-BY-3.0 | NoiseCollector |
| sounds/handling/mag-glock.mp3 | 2013 KB | 85.1 s | https://freesound.org/s/842729/ | Stoniac | CC0 | many mag in/out |
| sounds/handling/mag-ar15.mp3 | 112 KB | 4.9 s | https://freesound.org/s/263513/ | wadaltmon | CC0 | AR15 mag + actions |
| sounds/handling/reload-m16.mp3 | 169 KB | 7.1 s | https://freesound.org/s/725397/ | serøutōnin--deprivəd | CC0 | full empty reload |
| sounds/handling/slide-1911.mp3 | 313 KB | 13.5 s | https://freesound.org/s/508242/ | shelbyshark | CC0 | mag in + rack |
| sounds/handling/slide-hipower.mp3 | 181 KB | 7.6 s | https://freesound.org/s/674744/ | serøutōnin--deprivəd | CC0 | 5 racks |
| sounds/handling/charge-ak.mp3 | 66 KB | 3.0 s | https://freesound.org/s/171631/ | Pjkasinski3 | CC0 | AK charging handle |
| sounds/handling/bolt-k98.mp3 | 617 KB | 25.7 s | https://freesound.org/s/508747/ | AugustSandberg | CC0 | Mauser bolt reload |
| sounds/handling/bolt-mosin.mp3 | 301 KB | 14.2 s | https://freesound.org/s/370345/ | Zott820 | CC0 | bolt cycles |
| sounds/handling/dryfire.mp3 | 14 KB | 0.5 s | https://freesound.org/s/725402/ | serøutōnin--deprivəd | CC0 | dry fire click |
| sounds/feedback/victory-orch.mp3 | 104 KB | 4.5 s | https://freesound.org/s/470083/ | Sheyvan | CC-BY-4.0 | Sheyvan fanfare |
| sounds/feedback/victory-brass.mp3 | 100 KB | 4.4 s | https://freesound.org/s/456966/ | FunWithSound | CC0 | brass fanfare |
| sounds/feedback/victory-trumpet.mp3 | 97 KB | 4.5 s | https://freesound.org/s/578853/ | JellyDaisies | CC0 | trumpet + chimes |
| sounds/feedback/defeat-dark.mp3 | 81 KB | 3.6 s | https://freesound.org/s/578576/ | nomiqbomi | CC0 | dark crescendo |
| sounds/feedback/defeat-taps.mp3 | 715 KB | 40.1 s | https://freesound.org/s/651204/ | trumpetplayer | CC0 | trumpet Taps (cut opening) |
| sounds/feedback/hit-madpan.mp3 | 9 KB | 0.4 s | https://freesound.org/s/660770/ | MadPanCake | CC0 | hit impact |
| sounds/feedback/hit-tick.mp3 | 6 KB | 0.1 s | https://freesound.org/s/478057/ | Abacagi | CC0 | dry tick |
| sounds/feedback/hit-flesh.mp3 | 7 KB | 0.2 s | https://freesound.org/s/138481/ | JustInvoke | CC0 | flesh layer |
| sounds/feedback/head-madpan.mp3 | 9 KB | 0.4 s | https://freesound.org/s/660769/ | MadPanCake | CC0 | headshot |
| sounds/feedback/head-ping.mp3 | 22 KB | 0.8 s | https://freesound.org/s/837455/ | Wavewire | CC0 | metal ping |
| sounds/feedback/kill.mp3 | 41 KB | 1.7 s | https://freesound.org/s/567849/ | MadPanCake | CC0 | kill |
| sounds/feedback/kill-head.mp3 | 34 KB | 1.7 s | https://freesound.org/s/567850/ | MadPanCake | CC0+szpury CC-BY-4.0 | headshot kill |
| sounds/feedback/kill-bf.mp3 | 33 KB | 1.6 s | https://freesound.org/s/660768/ | MadPanCake | CC0+szpury CC-BY-4.0 | BF-style kill |

### Credits required (CC BY)

- "rbh Le Mans passby 05.wav" by RHumphries (freesound.org/s/1930), CC BY 4.0
- "Audi R8 Idling Reving Backfire.wav" by Jonas_Jocys (freesound.org/s/457733), CC BY 4.0
- "Bullet passbys.wav" by Audionautics (freesound.org/s/134024), CC BY 3.0
- "Ricochet 3_2.wav" by Benboncan (freesound.org/s/78092), CC BY 4.0
- "shot1.wav" by vumseplutten1709 (freesound.org/s/238923), CC BY 3.0
- "bulletimpact_wood1.wav" by NoiseCollector (freesound.org/s/237448), CC BY 3.0
- "Music: Orchestral Victory Fanfare" by Sheyvan (freesound.org/s/470083), CC BY 4.0
- "subbass_hit_001" by szpury (freesound.org/s/233752), CC BY 4.0: used inside MadPanCake's kill-head (567850) and kill-bf (660768)

Provenance notes: qubodup's battle/explosion files are cut from US Government (DVIDS) video, generally public domain; 855248 comes from NATO B-roll. Keep these in mind if provenance matters.

## Animations (added 2026-11-10)

| File | Size | Clips | Rig | Source | Author | License | Notes |
|---|---|---|---|---|---|---|---|
| anim/quaternius_ual2_standard.glb | 8.1 MB | 43 | 65 joints, UE-style names (root, pelvis, spine_01..03, neck_01, Head, clavicle_l, ...) | https://opengameart.org/content/universal-animation-library-2 | Quaternius | CC0 (OGA page and anim/quaternius_ual2_License.txt) | Universal Animation Library 2 [Standard], Unreal/Godot GLB. Clips: A_TPose, Chest_Open, ClimbUp_1m_RM, Consume, Farm_Harvest, Farm_PlantSeed, Farm_Watering, Hit_Knockback, Hit_Knockback_RM, Idle_FoldArms_Loop, Idle_Lantern_Loop, Idle_No_Loop, Idle_Rail_Call, Idle_Rail_Loop, Idle_Shield_Break, Idle_Shield_Loop, Idle_TalkingPhone_Loop, LayToIdle, Melee_Hook, Melee_Hook_Rec, NinjaJump_Idle_Loop, NinjaJump_Land, NinjaJump_Start, OverhandThrow, Shield_Dash_RM, Shield_OneShot, Slide_Exit, Slide_Loop, Slide_Start, Sword_Block, Sword_Dash_RM, Sword_Regular_A, Sword_Regular_A_Rec, Sword_Regular_B, Sword_Regular_B_Rec, Sword_Regular_C, Sword_Regular_Combo, TreeChopping_Loop, Walk_Carry_Loop, Yes, Zombie_Idle_Loop, Zombie_Scratch, Zombie_Walk_Fwd_Loop. |
| anim/quaternius_ual2_mannequin_f.glb | 1.4 MB | 0 | same 65-joint rig | same | Quaternius | CC0 | Female mannequin for the UAL2 rig. |

The UAL1 mannequin (46 clips) was already here: models/characters/quaternius_ual_mannequin.glb.

## Characters for the Business vs IT teams (added 2026-11-10)

| File | Size | Rig | Animations | Source | Author | License | Notes |
|---|---|---|---|---|---|---|---|
| chars/grab3d/grab3d_businessman-rigged.glb | 12.5 MB | 24 joints, Mixamo-style (Hips, LeftUpLeg, ...) | run, walk | https://grab3d.com/models/characters/businessman/ | Grab3D | CC0 (page and schema.org license field) | Bearded businessman, navy pinstripe three-piece suit, orange tie, pocket square. Raw download: decimate and resize textures before shipping, as was done for the soldier. |
| chars/grab3d/grab3d_man-rigged.glb | 13.1 MB | 54 joints, Mixamo-style | walk, run | https://grab3d.com/models/characters/man/ | Grab3D | CC0 | Young bearded man, olive bomber jacket, cream sweater, dark jeans, white sneakers. |
| chars/grab3d/grab3d_woman-rigged.glb | 13.0 MB | 54 joints, Mixamo-style | walk, run | https://grab3d.com/models/characters/woman/ | Grab3D | CC0 | Woman with wavy auburn hair, rust blazer, white top, navy wide-leg trousers, white sneakers. |
| chars/grab3d/grab3d_teen-character-rigged.glb | 14.1 MB | 24 joints, Mixamo-style | run, walk | https://grab3d.com/models/characters/teen-character/ | Grab3D | CC0 | Teen in a blue T-shirt, cargo shorts and sneakers (an "intern" look). |
| chars/quaternius_uacp/*.fbx (13 files, about 1.6 MB each) | 21 MB total | CharacterArmature (Hips, Abdomen, Torso, Neck, Head, Shoulder/UpperArm/LowerArm/Fist, UpperLeg/LowerLeg/Foot, L and R) | Defeat, Idle, PickUp, Punch, RecieveHit, Shoot_OneHanded, SitDown, StandUp, Victory, Walk, Walk_Carry | https://opengameart.org/content/animated-characters-pack | Quaternius | CC0 (OGA page) | Ultimate Animated Character Pack (Nov 2019), only the business and casual outfits: Suit_Male/Female, OldClassy_Male/Female, Casual_Male/Female, Casual2_Male/Female, Casual3_Male/Female, Casual_Bald, Worker_Male/Female. A chibi, cartoon low-poly style, so a fallback only. Preview.png shows the whole pack. |
