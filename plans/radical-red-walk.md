# Radical Red 4.1 Hardcore: walkthrough research

Unit 3, base `3400658`, session `rr-walkres`, 2026-11-02. Research only; no extractor changes.

## Source keys and reading the route

- `data` = `.src/repos/Radical-Red-Pokedex/data.js`, the pinned 4.1 snapshot in SOURCES.md. Area IDs below are **zero-based array positions**, not ROM map IDs; trainer IDs are `trainers` dictionary keys / `ID`.
- `TO` = `trainers-hardcore.xlsx`, **Trainer Order**; `Main!E44:E78` gives the Hardcore caps. `I` = `drive/Item, TM, and Move Tutor Locations v4.1 - Radical Red.xlsx`, **Overworld Items** unless a tab is named. Cells refer to the original workbook, not line numbers of a text conversion.
- `C4` = `drive/4.1 Changelog - Radical Red.txt`; `C0` = `drive/Changelog up to v4.0 - Radical Red.txt`, version heading specified where material. `Useful Links` = the same-named Drive text, Level Caps and Puzzles sections. Location workbook = `Pokemon Locations & Raid Dens v4.1` (filename uses accented Pokemon).
- `uN` is the **source unlock/default cap step**, `vN` the **recommended visit split**. These are deliberately separate: TO explicitly allows 28/36 and 36/44 sequence breaks, and some area buckets describe only rewards/rod access, not the physical entrance. Never silently replace `trainer.cap` with the visit number.
- Stops in section 2 are the proposed play order. `*` flags a boss/mini-boss or special scaled challenge, not proof it is mandatory; `ALLY` is a partner record, not an opponent. Alternatives and optional battles are explicitly noted. Ordinary trainer order marked G is a proposed route, not a sourced coordinate-level walk.
- **G applies to every row without a TO ordering citation**: within an area the data array supplies membership, not a proved fight order. The proposed list retains that order except leaders last, explicit TO constraints, and the three stale references in section 4. Floors, side rooms, and optional branches are a convenient vanilla-frame sweep, never a claim that all those fights are required.
- The route chooses Misty before Vermilion, Surge before Rock Tunnel, Sabrina before Fuchsia, and a Seafoam excursion before May. These follow the TO spine; taking a legal shortcut earlier is not a source error. Optional circuits can be skipped. Source bucket returns without trainers are scheduled separately in section 3.

## 1. Hardcore split list

| Step | Cap | End / next unlock | Main cell | data.caps key | Trainer Order boundary |
| --- | --- | --- | --- | --- | --- |
| 0 | 16 | Brock; Boulder Badge | E44 | `Brock` (ID 0) | D31/F31 |
| 1 | 23 | Mt. Moon Archer | E46 | `Archer-1` (ID 1) | D43/F43 |
| 2 | 28 | Misty; Cascade Badge | E48 | `Misty` (ID 2) | D80/F80 |
| 3 | 36 | Lt. Surge; Thunder Badge | E50 | `Surge` (ID 3) | D113/F113 |
| 4 | 44 | Erika; Rainbow Badge | E52 | `Erika` (ID 4) | D146/F146 |
| 5 | 47 | Game Corner Giovanni; Silph Scope | E54 | `Giovanni-1` (ID 5) | D162/F162 |
| 6 | 56 | Silph Ariana + Archer tag; ally Brendan | E56 | `Archer-2` (ID 6) | D190/F190 |
| 7 | 57 | Silph Giovanni; Mega Ring access | E58 | `Giovanni-2` (ID 7) | D194/F194 |
| 8 | 59 | Sabrina; Marsh Badge | E60 | `Sabrina` (ID 8) | D218/F218 |
| 9 | 68 | Koga; Soul Badge / Surf access | E62 | `Koga` (ID 9) | D338/F338 |
| 10 | 73 | Cinnabar May | E64 | `May` (ID 10) | D352/F352 |
| 11 | 76 | Blaine; Volcano Badge | E66 | `Blaine` (ID 11) | D382/F382 |
| 12 | 79 | Cerulean Cave Archer THEN Ariana, back-to-back | E68 | `Archer-3` (ID 12) | D394/F394 + D398 |
| 13 | 80 | Cerulean Cave Giovanni tag; ally Lance | E70 | `Giovanni-3` (ID 13) | D402/F402 |
| 14 | 81 | Viridian Clair; eighth badge | E72 | `Clair` (ID 14) | D411/F411 |
| 15 | 82 | Route 23 Brendan, AFTER Route 22 Blue | E74 | `Brendan` (ID 15) | D429/F429 |
| 16 | 85 | Champion Blue after Lorelei -> Bruno -> Agatha -> Lance | E76 | `Elite-4` (ID 16) | D465-D481 / F481 |
| 17 | 100 | No terminal boss; optional islands/chambers/rematches | E78 | `Post-Game` (ID 17) | No postgame entries in TO |

The numeric caps agree in all 18 positions with Useful Links. End rewards live in the **next** bucket: e.g. Scope u6, Blazikenite u11, Clair TM119 u15, Brendan Sceptilite u16. The final pre-League cap is 82 for both final Blue and Brendan; Blue alone does not end it.

## 2. Stop list in recommended play order

Each source area is represented, including empty ship rooms and five separate League entries with identical names. Repeated rows are intentional visits. `Open/content` enumerates all area content buckets, not a guessed physical lock. A dash means no source content at all. For all items/encounters, retain the original bucket and access condition even if the first physical visit is earlier/later.

| Stop | Visit | Area name exactly as data writes it | Area ID | Open/content u-steps | Trainers in proposed fight order (source step) | Gate, event, optionality, uncertainty |
| --- | --- | --- | --- | --- | --- | --- |
| R001 | v0 | Pallet Town Player's House 1F | 0 | 0,17 | - | Start; choose Hardcore. Later postgame cheat items are not story gates. |
| R002 | v0 | Pallet Town Oak's Lab | 3 | 0,17 | 328* Rival Blue [u0]; 327* Rival Blue [u0]; 326* Rival Blue [u0] | Choose starter; Blue IDs are alternatives, not three fights. Postgame Oak challenges are separate. |
| R003 | v0 | Pallet Town Rival's House | 2 | 0 | - | Town Map gift; optional house visit. |
| R004 | v0 | Route 1 | 4 | 0 | - | G: optional room/route sweep; no documented progression gate. |
| R005 | v0 | Viridian City | 5 | 0,3,9,10,15 | - | Collect Old Rod now, not vanilla Vermilion (I D21; area item-standard.0). Roamers only at source step 15. |
| R006 | v0 | Viridian City Poke Center | 6 | 0 | - | G: optional room/route sweep; no documented progression gate. |
| R007 | v0 | Viridian City Trainer School | 7 | 0 | 7* Friendly Teacher [u0] | G: optional room/route sweep; no documented progression gate. |
| R008 | v0 | Viridian City Poke Mart | 8 | 0 | - | Collect Oak's Parcel; return to Pallet (data item-standard.0). |
| R009 | v0 | Pallet Town | 1 | 0,3,9,10 | - | Return to Oak with parcel before heading north (vanilla frame; parcel is I D31/data area 8). |
| R010 | v0 | Route 22 | 10 | 0,3,9,10,15 | 329* Rival Blue [u0]; 330* Rival Blue [u0]; 331* Rival Blue [u0] | Optional early Blue; final Blue is a separate step-15 return. |
| R011 | v0 | Route 2 | 11 | 0,3,9 | - | G: optional room/route sweep; no documented progression gate. |
| R012 | v0 | Viridian Forest | 12 | 0 | 44* PkMn Trainer Brendan [u0]; 4* Lass Anne [u0]; 532 Bug Catcher Charlie [u0]; 103 Bug Catcher Doug [u0]; 102 Bug Catcher Rick [u0] | Brendan -> Anne -> optional Heart detour -> Sammy (TO D10,D14,D19,D23). Ordinary bugs have no sourced exact path. G: ordinary bugs are a proposed branch; early boss order sourced. |
| R013 | v0 | Viridian Forest Heart | 13 | 0,9 | 531 Bug Catcher Anthony [u0]; 21* Ace Trainer Nelle [u0] | Optional Ace Nelle side branch, before Sammy per TO D19; Anthony 531 belongs here by trainer.areaName. |
| R014 | v0 | Viridian Forest | 12 | 0 | 104* Bug Catcher Sammy [u0] | Brendan -> Anne -> optional Heart detour -> Sammy (TO D10,D14,D19,D23). Ordinary bugs have no sourced exact path. Return from optional Heart before Sammy; TO D19 -> D23. |
| R015 | v0 | Diglett's Cave 1F | 14 | 0 | - | Optional northern Diglett entrance TM46; data bucket 0 does not prove the southern exit is reachable before Cut. |
| R016 | v0 | Pewter City | 15 | 0,1 | - | G: optional room/route sweep; no documented progression gate. |
| R017 | v0 | Pewter City Poke Mart | 16 | 0 | - | G: optional room/route sweep; no documented progression gate. |
| R018 | v0 | Pewter City Museum 1F | 17 | 0,3 | - | Museum ground floor now; Old Amber is a Cut/step-3 revisit, not a pre-Brock gift. |
| R019 | v0 | Pewter City Museum 2F | 18 | 0 | 45* Leader Falkner [u0] | Defeat Falkner before Brock (TO D27,D31). |
| R020 | v0 | Pewter City Gym | 19 | 0,1,9 | 142 Camper Liam [u0]; 414* Leader Brock [u0] | Brock ends cap 0. Rematch at step 9 is optional in Hardcore (C0 v4.0 opening bullets). |
| R021 | v1 | Route 3 | 20 | 1 | 89 Youngster Ben [u1]; 105 Bug Catcher Colton [u1]; 116 Lass Janice [u1]; 90 Youngster Calvin [u1]; 106 Bug Catcher Greg [u1]; 117* Lass Sally [u1]; 107 Bug Catcher James [u1]; 118 Lass Robin [u1] | G: optional room/route sweep; no documented progression gate. |
| R022 | v1 | Route 4 Poke Center | 22 | 1 | - | G: optional room/route sweep; no documented progression gate. |
| R023 | v1 | Route 4 | 21 | 1,2,10,14 | - | West before Mt. Moon, east after Archer; one source area spans the one-way ledge. Crissy requires Surf/step 10. Giovanni/Lance rewards at step 14 (I D118-D119). West side only; next stop is Mt. Moon. |
| R024 | v1 | Mt. Moon 1F | 23 | 1 | 181 Hiker Marcos [u1]; 91 Youngster Josh [u1]; 108 Bug Catcher Kent [u1]; 120 Lass Miriam [u1]; 169 Super Nerd Jovan [u1]; 109 Bug Catcher Robby [u1]; 121 Lass Iris [u1] | G: optional room/route sweep; no documented progression gate. |
| R025 | v1 | Mt. Moon B1F | 24 | 1 | - | G: optional room/route sweep; no documented progression gate. |
| R026 | v1 | Mt. Moon B2F | 25 | 1,2,9 | 352 Team Rocket Grunt [u1]; 353 Team Rocket Grunt [u1]; 351 Team Rocket Grunt [u1]; 354 Team Rocket Grunt [u1]; 170* Super Nerd Miguel [u1]; 46* Rocket Admin Archer [u1] | Miguel -> choose ONE Helix/Dome fossil -> Archer; Archer ends cap 1 (I D106; TO D39,D43). G: grunts provisional; Miguel -> Archer is sourced. |
| R027 | v2 | Route 4 | 21 | 1,2,10,14 | - | West before Mt. Moon, east after Archer; one source area spans the one-way ledge. Crissy requires Surf/step 10. Giovanni/Lance rewards at step 14 (I D118-D119). East ledges after Archer; pick fossil-exit rewards. Do not attach Crissy here. |
| R028 | v2 | Cerulean City | 26 | 2,3,9,10 | 332* Rival Blue [u2]; 333* Rival Blue [u2]; 334* Rival Blue [u2] | Blue grants Poke Rider (I D127); ticket excursion north, then Misty; dig-house Grunt can wait until afterward (TO D47-D84). Blue alternatives; leave dig-house Grunt for after Misty. |
| R029 | v2 | Cerulean City Central House | 27 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R030 | v2 | Cerulean City North House | 28 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R031 | v2 | Cerulean City Bike Shop | 29 | 2 | - | Bicycle requires Vermilion Bike Voucher; first visit is only a signpost (I D124). |
| R032 | v2 | Cerulean City Poke Mart | 30 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R033 | v2 | Cerulean City Move Maniac House | 31 | 2 | 6* Friendly PkMnManiac [u2] | G: optional room/route sweep; no documented progression gate. |
| R034 | v2 | Route 24 | 32 | 2,3,9,10 | 143 Camper Shane [u2]; 110* Bug Catcher Cale [u2]; 123* Lass Ali [u2]; 92* Youngster Timmy [u2]; 122* Lass Reli [u2]; 144* Camper Ethan [u2]; 356* Team Rocket Grunt [u2] | Bridge chain Cale -> Ali -> Timmy -> Reli -> Ethan -> Grunt (TO D51-D71); Shane 143 is an optional side trainer. |
| R035 | v2 | Route 25 | 33 | 2,3,4,9,10 | 47* Leader Bugsy [u2]; 125 Lass Haley [u2]; 95 Youngster Chad [u2]; 471 Camper Flint [u2]; 183 Hiker Nob [u2]; 153 Picnicker Kelsey [u2]; 94 Youngster Dan [u2]; 184 Hiker Wayne [u2]; 93 Youngster Joey [u2]; 182 Hiker Franklin [u2] | Bugsy 47 optional before Misty; ID 8 is a later separate source entry, not a duplicate key. Reach Bill. |
| R036 | v2 | Route 25 Bill's House | 34 | 2 | - | Help Bill; S.S. Ticket opens S.S. Anne (I D148). |
| R037 | v2 | Cerulean City Gym | 73 | 2,3,9,17 | 150 Picnicker Diana [u2]; 234 SwimmerM Luis [u2]; 415* Leader Misty [u2] | Misty ends cap 2. Trainer Order permits the nearby cap-2 fights at 28 OR 36; main itinerary chooses Misty first. |
| R038 | v3 | Cerulean City | 26 | 2,3,9,10 | 355* Team Rocket Grunt [u2] | Blue grants Poke Rider (I D127); ticket excursion north, then Misty; dig-house Grunt can wait until afterward (TO D47-D84). Source trainer cap 2; TO F84 allows 28/36, chosen here after Misty. |
| R039 | v3 | Route 5 | 35 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R040 | v3 | Route 5 Daycare | 36 | 2 | 5* Gentleman Komodo [u2] | G: optional room/route sweep; no documented progression gate. |
| R041 | v3 | Underground Path Route 5 Entrance | 37 | 4 | - | Physical entrance is transit before Surge; its only data content is a step-4 trade. Do not infer the doorway is locked until Erika. |
| R042 | v3 | Underground Path Vertical | 38 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R043 | v3 | Route 6 | 39 | 2,3,9,10 | 146* Camper Jeff [u2]; 152 Picnicker Isabelle [u2]; 112 Bug Catcher Elijah [u2]; 151 Picnicker Nancy [u2]; 145 Camper Ricky [u2]; 111 Bug Catcher Keigo [u2] | G: optional room/route sweep; no documented progression gate. |
| R044 | v3 | Vermilion City | 40 | 2,3,9,10 | - | G: optional room/route sweep; no documented progression gate. |
| R045 | v3 | Vermilion City Fisherman's House | 41 | 2 | - | Good Rod gift (I D170); acquired on this suggested post-Misty visit, although source bucket is 2. |
| R046 | v3 | Vermilion City Pokemon Fan Club | 42 | 2,3 | - | Bike Voucher -> return to Cerulean shop; Wishing Pieces require Yamper follower (I D172-D173). Fossil gifts are optional. |
| R047 | v3 | Vermilion City Central House | 43 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R048 | v3 | Vermilion City Poke Mart | 44 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R049 | v3 | Diglett's Cave B1F | 45 | 2 | - | Optional Diglett return to Route 2; exit house and aide can be checked once Cut is obtained. |
| R050 | v3 | Route 2 House | 46 | 2 | - | Optional trade; no story gate. |
| R051 | v3 | Route 11 | 47 | 2,3,9 | 49* Leader Whitney [u2]; 222 Engineer Bernie [u2]; 260 Gambler Dirk [u2]; 99 Youngster Yasu [u2]; 221 Engineer Braxton [u2]; 261 Gambler Darian [u2]; 259 Gambler Jasper [u2]; 100 Youngster Dave [u2]; 98 Youngster Dillon [u2]; 258 Gambler Hugo [u2]; 97 Youngster Eddie [u2] | Optional Whitney (TO D105); Snorlax blocks the east exit until Poke Flute. |
| R052 | v3 | Route 11 Gatehouse 2F | 48 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R053 | v3 | S.S. Anne Port | 49 | 2,3 | - | Use S.S. Ticket, explore ship before captain. |
| R054 | v3 | S.S. Anne 1F | 50 | 2 | 482* Gentleman Brooks [u2]; 126* Lass Ann [u2] | Ann + Brooks are one double battle, not two sequential bosses (TO D92). |
| R055 | v3 | S.S. Anne 1F Room 1 | 51 | - | - | G: optional room/route sweep; no documented progression gate. |
| R056 | v3 | S.S. Anne 1F Room 2 | 52 | 2 | 96 Youngster Tyler [u2] | G: optional room/route sweep; no documented progression gate. |
| R057 | v3 | S.S. Anne 1F Room 3 | 53 | - | - | G: optional room/route sweep; no documented progression gate. |
| R058 | v3 | S.S. Anne 1F Room 4 | 54 | - | - | G: optional room/route sweep; no documented progression gate. |
| R059 | v3 | S.S. Anne 1F Room 5 | 55 | 2 | 422 Gentleman Arthur [u2] | G: optional room/route sweep; no documented progression gate. |
| R060 | v3 | S.S. Anne 1F Room 6 | 56 | - | - | G: optional room/route sweep; no documented progression gate. |
| R061 | v3 | S.S. Anne 1F Room 7 | 57 | 2 | 421 Gentleman Thomas [u2] | G: optional room/route sweep; no documented progression gate. |
| R062 | v3 | S.S. Anne B1F | 58 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R063 | v3 | S.S. Anne B1F Room 1 | 59 | 2 | 140 Sailor Phillip [u2]; 224 Fisherman Barny [u2] | G: optional room/route sweep; no documented progression gate. |
| R064 | v3 | S.S. Anne B1F Room 2 | 60 | 2 | 138 Sailor Huey [u2] | G: optional room/route sweep; no documented progression gate. |
| R065 | v3 | S.S. Anne B1F Room 3 | 61 | 2 | 139 Sailor Dylan [u2] | G: optional room/route sweep; no documented progression gate. |
| R066 | v3 | S.S. Anne B1F Room 4 | 62 | 2 | 136 Sailor Leonard [u2]; 137 Sailor Duncan [u2] | G: optional room/route sweep; no documented progression gate. |
| R067 | v3 | S.S. Anne B1F Room 5 | 63 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R068 | v3 | S.S. Anne Kitchen | 64 | 2 | - | G: optional room/route sweep; no documented progression gate. |
| R069 | v3 | S.S. Anne 2F | 65 | 2 | 134* Sailor Edmond [u2]; 135* Sailor Trevor [u2]; 50* PkMn Trainer Brendan [u2] | Edmond + Trevor double battle, then Brendan (TO D96,D100); not source-array order. Edmond + Trevor, then Brendan (TO D96,D100); source cap 2. |
| R070 | v3 | S.S. Anne 2F Room 1 | 66 | - | - | G: optional room/route sweep; no documented progression gate. |
| R071 | v3 | S.S. Anne 2F Room 2 | 67 | 2 | 223 Fisherman Dale [u2] | G: optional room/route sweep; no documented progression gate. |
| R072 | v3 | S.S. Anne 2F Room 3 | 68 | - | - | G: optional room/route sweep; no documented progression gate. |
| R073 | v3 | S.S. Anne 2F Room 4 | 69 | 2 | 127 Lass Dawn [u2]; 483 Gentleman Lamar [u2] | G: optional room/route sweep; no documented progression gate. |
| R074 | v3 | S.S. Anne 2F Room 5 | 70 | - | - | G: optional room/route sweep; no documented progression gate. |
| R075 | v3 | S.S. Anne 2F Room 6 | 71 | - | - | G: optional room/route sweep; no documented progression gate. |
| R076 | v3 | S.S. Anne Captain's Quarters | 72 | 2 | - | Captain gives HM01 Cut; use it for Surge gym and Route 9 (I D205). |
| R077 | v3 | Cerulean City Bike Shop | 29 | 2 | - | Bicycle requires Vermilion Bike Voucher; first visit is only a signpost (I D124). Bike Voucher exchange; Bicycle before Cycling Road later. |
| R078 | v3 | Route 2 Gatehouse | 74 | 3 | - | Oak aide gives HM05 Flash, via Cut return to Route 2 (I D39). Optional visibility helper, not an asserted hard lock. After Cut, return through Diglett/Route 2 for Flash. |
| R079 | v3 | Vermilion City Gym | 111 | 3,4,9 | 141 Sailor Dwayne [u3]; 220 Engineer Baily [u3]; 423* Gentleman Tucker [u3]; 416* Leader Lt. Surge [u3] | Cut access; Tucker before Surge; Surge ends cap 3 (TO D109,D113). |
| R080 | v4 | Route 9 | 75 | 3 | 149 Camper Drew [u3]; 155* Picnicker Caitlin [u3]; 186 Hiker Brice [u3]; 115 Bug Catcher Conner [u3]; 114 Bug Catcher Brent [u3]; 148 Camper Chris [u3]; 185 Hiker Alan [u3]; 465 Hiker Jeremy [u3]; 154* Picnicker Alicia [u3] | Cut route to Rock Tunnel after Surge on the recommended spine; data permits this at step 3, TO F117/F121 says 36/44. |
| R081 | v4 | Route 10 | 76 | 3,9,10 | 156 Picnicker Heidi [u3]; 188 Hiker Trent [u3]; 163* Pokemaniac Herman [u3]; 187 Hiker Clark [u3]; 157 Picnicker Carol [u3] | North and south of Rock Tunnel are one data area. Herman is after Dana (TO D125,D129); floor-level order remains inferred. |
| R082 | v4 | Route 10 Poke Center | 77 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R083 | v4 | Rock Tunnel 1F | 78 | 3 | 168 Pokemaniac Ashton [u3]; 192 Hiker Lenny [u3]; 193 Hiker Oliver [u3]; 194 Hiker Lucas [u3]; 476 Picnicker Leah [u3]; 475 Picnicker Ariana [u3]; 474* Picnicker Dana [u3] | G: optional room/route sweep; no documented progression gate. |
| R084 | v4 | Rock Tunnel B1F | 79 | 3,9 | 166 Pokemaniac Winston [u3]; 159 Picnicker Martha [u3]; 165 Pokemaniac Steve [u3]; 191 Hiker Eric [u3]; 190 Hiker Allen [u3]; 158 Picnicker Sofia [u3]; 189 Hiker Dudley [u3]; 164 Pokemaniac Cooprt [u3] | G: optional room/route sweep; no documented progression gate. |
| R085 | v4 | Lavender Town Mr. Fuji's House | 80 | 3,6,8 | 52* Leader Morty [u3] | Morty optional first visit; after Tower rescue Fuji gives Poke Flute; after Mega Ring claim Gengarite using max happiness (I D254-D255). |
| R086 | v4 | Lavender Town EXP Farm | 81 | 3 | 10* Friendly Coach [u3]; 11* Friendly Coach [u3]; 12* Friendly Coach [u3]; 13* Friendly Coach [u3]; 9* Friendly Coach [u3]; 27* Friendly Coach [u3] | Optional EXP services, not six mandatory battles; coach 27 has a scaled team. |
| R087 | v4 | Lavender Town Poke Mart | 82 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R088 | v4 | Pokemon Tower 2F | 83 | - | - | Optional early Tower signpost; no Blue trainer record exists here in data.js. |
| R089 | v4 | Pokemon Tower 3F | 84 | 3 | 443 Channeler Hope [u3]; 442 Channeler Carly [u3]; 441 Channeler Patricia [u3] | G: optional room/route sweep; no documented progression gate. |
| R090 | v4 | Pokemon Tower 4F | 85 | 3 | 444 Channeler Paula [u3]; 446 Channeler Jody [u3]; 445 Channeler Laurel [u3] | G: optional room/route sweep; no documented progression gate. |
| R091 | v4 | Pokemon Tower 5F | 86 | 3 | 450 Channeler Janae [u3]; 449 Channeler Karina [u3]; 448* Channeler Ruth [u3] | G: optional room/route sweep; no documented progression gate. |
| R092 | v4 | Pokemon Tower 6F | 87 | 3,6 | 452 Channeler Emilia [u3]; 453 Channeler Jennifer [u3]; 451 Channeler Angelica [u3] | Without Silph Scope stop before Ghost; after Giovanni-1 fight Ghost, then 7F (I D337). |
| R093 | v4 | Route 12 | 88 | 3,6,9,10 | 486 Young Couple Gia & Jes [u3]; 228 Fisherman Elliot [u3]; 227 Fisherman Hank [u3]; 226 Fisherman Chip [u3]; 225 Fisherman Ned [u3] | North pier available early; southern Snorlax requires Flute (source fixed-overworld.6). Main southbound trainer circuit waits until Sabrina per TO. North pier only; Justin 477 deferred to southbound circuit per TO D231. |
| R094 | v4 | Route 12 Gatehouse 2F | 89 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R095 | v4 | Route 8 | 90 | 3,8 | 536 Biker Jaren [u3]; 535 Biker Ricardo [u3]; 484 Twins Eli & Anne [u3]; 171* Super Nerd Aidan [u3]; 262 Gambler Stan [u3]; 130 Lass Megan [u3]; 129 Lass Andrea [u3]; 173 Super Nerd Leslie [u3]; 128 Lass Paige [u3]; 172 Super Nerd Glenn [u3]; 264 Gambler Rich [u3]; 131 Lass Julia [u3] | Aidan on first crossing. Cole is Mega Ring-gated later (I D271-D272). |
| R096 | v4 | Underground Path Horizontal | 91 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R097 | v4 | Route 7 | 92 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R098 | v4 | Celadon City | 93 | 3,9,10 | - | Explore Celadon and collect Tea; Erika before Game Corner Rocket (TO D146,D150). |
| R099 | v4 | Celadon City Department Store 2F | 94 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R100 | v4 | Celadon City Department Store 3F | 95 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R101 | v4 | Celadon City Department Store 4F | 96 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R102 | v4 | Celadon City Department Store 5F | 97 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R103 | v4 | Celadon City Department Store 6F | 98 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R104 | v4 | Celadon City Mansion 1F | 99 | 3 | - | Tea opens Saffron gate access (I D290; vanilla gate mechanism). Starter egg gifts are optional, not story-required. |
| R105 | v4 | Celadon City Mansion 2F | 100 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R106 | v4 | Celadon City Mansion Roof House | 101 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R107 | v4 | Celadon City Restaurant | 102 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R108 | v4 | Celadon City Hotel | 103 | 3,8 | - | Two Beauties need Mega Ring; Sam then Shelly per TO D204,D209, opposite source array. |
| R109 | v4 | Route 16 | 104 | 3,6,9 | 489 Young Couple Lea & Jed [u3] | First visit is northern Fly detour; cycling road requires Bicycle and cleared Snorlax. Main road after Sabrina per TO. |
| R110 | v4 | Route 16 Fly HM House | 105 | 3,17 | - | HM02 Fly now via Cut (I D415). Postgame return for Tri-Pass only after the NPC's prerequisites (I D422). |
| R111 | v4 | Saffron City Poke Mart | 107 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R112 | v4 | Saffron City Trainer Fan Club | 108 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R113 | v4 | Saffron City Mr. Psychic's House | 109 | 3 | - | G: optional room/route sweep; no documented progression gate. |
| R114 | v4 | Route 25 | 33 | 2,3,4,9,10 | 8* Leader Bugsy [u4] | Bugsy 47 optional before Misty; ID 8 is a later separate source entry, not a duplicate key. Reach Bill. Optional later Bugsy source entry; exact trigger relative to initial 47 needs variant research. |
| R115 | v4 | Saffron City Fighting Dojo | 110 | 3 | 318 Black Belt Mike [u3]; 320 Black Belt Aaron [u3]; 319 Black Belt Hideki [u3]; 321 Black Belt Hitoshi [u3]; 317* Leader Chuck [u3] | Optional Chuck/Dojo (TO D214,36+); Tea access does not imply Sabrina is available. Later reward needs Mega Ring. Optional Tea/Dojo detour; source cap 3 (TO says 36+). |
| R116 | v4 | Celadon City Gym | 112 | 4,5,9 | 133 Lass Lisa [u4]; 267 Beauty Lori [u4]; 266 Beauty Tamia [u4]; 160 Picnicker Tina [u4]; 265 Beauty Bridget [u4]; 132 Lass Kay [u4]; 402* Ace Trainer Mary [u4]; 417* Leader Erika [u4] | Mary before Erika; Erika ends cap 4 (TO D142,D146). Optional Erika rematch has Fuchsia Gloom errand prerequisite (I D297). |
| R117 | v5 | Celadon City Game Corner | 113 | 5 | 357* Team Rocket Grunt [u5]; 14* Dumbass Gambler [u5] | Rocket guard opens hideout. Gambler challenge is optional; do not put it between story gate requirements. |
| R118 | v5 | Rocket Hideout B1F | 114 | 5 | 362 Team Rocket Grunt [u5]; 360 Team Rocket Grunt [u5]; 361 Team Rocket Grunt [u5]; 358 Team Rocket Grunt [u5]; 359 Team Rocket Grunt [u5] | G: optional room/route sweep; no documented progression gate. |
| R119 | v5 | Rocket Hideout B2F | 115 | 5 | 363 Team Rocket Grunt [u5] | G: optional room/route sweep; no documented progression gate. |
| R120 | v5 | Rocket Hideout B3F | 116 | 5 | 364 Team Rocket Grunt [u5]; 365 Team Rocket Grunt [u5] | G: optional room/route sweep; no documented progression gate. |
| R121 | v5 | Rocket Hideout B4F | 117 | 5,6 | 368 Team Rocket Grunt [u5]; 366* Team Rocket Grunt [u5]; 367* Team Rocket Grunt [u5]; 348* Boss Giovanni [u5] | Get Lift Key (I D313), defeat guards then Giovanni; Giovanni ends cap 5. Silph Scope is bucket 6, awarded by the just-ended fight (I D322). G: key-grunt identity not inferred from its number; guards then Giovanni. |
| R122 | v6 | Rocket Hideout B4F | 117 | 5,6 | - | Get Lift Key (I D313), defeat guards then Giovanni; Giovanni ends cap 5. Silph Scope is bucket 6, awarded by the just-ended fight (I D322). Claim Silph Scope after Giovanni; return to Tower. |
| R123 | v6 | Celadon City Game Corner Exchange | 118 | 6 | - | Optional Game Corner exchange; reward bucket 6, not a new required story action. |
| R124 | v6 | Pokemon Tower 6F | 87 | 3,6 | 2001 Ghost [u6] | Without Silph Scope stop before Ghost; after Giovanni-1 fight Ghost, then 7F (I D337). Ghost Marowak; fixed level 58 can exceed player cap 56. |
| R125 | v6 | Pokemon Tower 7F | 119 | 6 | 371* Team Rocket Grunt [u6]; 370* Team Rocket Grunt [u6]; 369* Team Rocket Grunt [u6] | Rescue Fuji after three Rocket grunts; TO Grunt 1/2/3 require team matching, not guessing from numeric ID; provisional order retained. G: three grunt IDs need team-to-sheet match to confirm numbering. |
| R126 | v6 | Lavender Town Mr. Fuji's House | 80 | 3,6,8 | - | Morty optional first visit; after Tower rescue Fuji gives Poke Flute; after Mega Ring claim Gengarite using max happiness (I D254-D255). Fuji rescue -> Poke Flute -> Snorlax routes; recommended spine does Silph before southern circuits. |
| R127 | v6 | Route 16 Gatehouse 2F | 120 | 6 | - | G: optional room/route sweep; no documented progression gate. |
| R128 | v6 | Silph Co. 1F | 121 | 6 | - | G: optional room/route sweep; no documented progression gate. |
| R129 | v6 | Silph Co. 2F | 122 | 6 | 336 Scientist Connor [u6]; 373 Team Rocket Grunt [u6]; 337 Scientist Jerry [u6]; 374 Team Rocket Grunt [u6] | G: optional room/route sweep; no documented progression gate. |
| R130 | v6 | Silph Co. 3F | 123 | 6 | 338 Scientist Jose [u6]; 375 Team Rocket Grunt [u6] | G: optional room/route sweep; no documented progression gate. |
| R131 | v6 | Silph Co. 4F | 124 | 6 | 339 Scientist Rodney [u6]; 376 Team Rocket Grunt [u6]; 377 Team Rocket Grunt [u6] | G: optional room/route sweep; no documented progression gate. |
| R132 | v6 | Silph Co. 5F | 125 | 6 | 378 Team Rocket Grunt [u6]; 340 Scientist Beau [u6]; 286 Juggler Dalton [u6]; 379 Team Rocket Grunt [u6] | Collect Card Key on 5F (I D385); opens Silph doors and route to 7F rival/11F. |
| R133 | v6 | Silph Co. 6F | 126 | 6 | 381 Team Rocket Grunt [u6]; 341 Scientist Taylor [u6]; 380 Team Rocket Grunt [u6] | G: optional room/route sweep; no documented progression gate. |
| R134 | v6 | Silph Co. 7F | 127 | 6 | 342 Scientist Joshua [u6]; 385 Team Rocket Grunt [u6]; 384 Team Rocket Grunt [u6]; 383 Team Rocket Grunt [u6]; 432* Rival Blue [u6]; 433* Rival Blue [u6]; 434* Rival Blue [u6] | Blue alternatives fought before Archer/Ariana (TO D186,D190). Free-floor exploration versus warp order is inferred. G: ordinary floors may be swept before rival; Blue variants once. |
| R135 | v6 | Silph Co. 8F | 128 | 6 | 343 Scientist Parkker [u6]; 386 Team Rocket Grunt [u6]; 382 Team Rocket Grunt [u6] | G: optional room/route sweep; no documented progression gate. |
| R136 | v6 | Silph Co. 9F | 129 | 6 | 387 Team Rocket Grunt [u6]; 388 Team Rocket Grunt [u6]; 344 Scientist Ed [u6] | G: optional room/route sweep; no documented progression gate. |
| R137 | v6 | Silph Co. 10F | 130 | 6 | 389 Team Rocket Grunt [u6]; 345 Scientist Travis [u6] | G: optional room/route sweep; no documented progression gate. |
| R138 | v6 | Silph Co. 11F | 131 | 6,7,8 | 391 Team Rocket Grunt [u6]; 390 Team Rocket Grunt [u6]; 53* Rocket Admin Archer [u6]; 54* Rocket Admin Ariana [u6]; 55 ALLY PkMn Trainer Brendan [u6] | Cap 6: Archer + Ariana with ALLY Brendan 55; cap 7: Giovanni; cap 8: president Master Ball and Saffron Mega Ring. Three visits, not one floor clear. G: grunts order; admins are one tag fight, 55 is ALLY, not opponent. |
| R139 | v7 | Silph Co. 11F | 131 | 6,7,8 | 349* Boss Giovanni [u7] | Cap 6: Archer + Ariana with ALLY Brendan 55; cap 7: Giovanni; cap 8: president Master Ball and Saffron Mega Ring. Three visits, not one floor clear. Giovanni ends cap 7. |
| R140 | v8 | Silph Co. 11F | 131 | 6,7,8 | - | Cap 6: Archer + Ariana with ALLY Brendan 55; cap 7: Giovanni; cap 8: president Master Ball and Saffron Mega Ring. Three visits, not one floor clear. Claim Master Ball; leave for assistant/Mega Ring outside. |
| R141 | v8 | Saffron City | 106 | 8 | - | Town transit can precede its only data bucket (8 = Mega Ring). After Silph Giovanni claim Mega Ring from assistant near gym (I D349). |
| R142 | v8 | Saffron City Gian's House 1F | 132 | 8,17 | 25* Dumbass Kid [u8] | Dumbass Kid optional; postgame Gian separate, no mandatory progression gate. |
| R143 | v8 | Saffron City Gian's House 2F | 133 | 8 | - | G: optional room/route sweep; no documented progression gate. |
| R144 | v8 | Saffron City Western House | 134 | 8 | - | G: optional room/route sweep; no documented progression gate. |
| R145 | v8 | Route 8 | 90 | 3,8 | 18* PkMn Trainer Cole [u8] | Aidan on first crossing. Cole is Mega Ring-gated later (I D271-D272). Optional Mega Ring revisit. |
| R146 | v8 | Celadon City Hotel | 103 | 3,8 | 16* PkMn Trainer Sam [u8]; 17* PkMn Trainer Shelly [u8] | Two Beauties need Mega Ring; Sam then Shelly per TO D204,D209, opposite source array. Optional Sam -> Shelly (TO order). |
| R147 | v8 | Lavender Town Mr. Fuji's House | 80 | 3,6,8 | - | Morty optional first visit; after Tower rescue Fuji gives Poke Flute; after Mega Ring claim Gengarite using max happiness (I D254-D255). Optional max-happiness Gengarite pickup, needed for eventual Tri-Pass quest. |
| R148 | v8 | Saffron City Gym | 135 | 8,9 | 281 Psychic Tyron [u8]; 464 Channeler Tasha [u8]; 463 Channeler Stacy [u8]; 462 Channeler Amanda [u8]; 283 Psychic Preston [u8]; 280 Psychic Johan [u8]; 282 Psychic Cameron [u8]; 420* Leader Sabrina [u8] | Sabrina after Silph; she ends cap 8. Gym trainers must precede her, despite source array containing leader second. |
| R149 | v9 | Route 12 | 88 | 3,6,9,10 | 285* Rocker Luca [u9]; 477* Camper Justin [u3]; 447 Channeler Tammy [u9]; 233* Fisherman Andrew [u9] | North pier available early; southern Snorlax requires Flute (source fixed-overworld.6). Main southbound trainer circuit waits until Sabrina per TO. Luca -> Justin -> Andrew per TO D227,D231,D235; Tammy optional source cap 9. |
| R150 | v9 | Route 12 Fisherman's House | 136 | 9 | - | Optional Sharpedonite; Super Rod is in Fuchsia in RR, NOT this vanilla fishing house (I D477; data area 153). |
| R151 | v9 | Route 13 | 137 | 9,10 | 195* Biker Jared [u9]; 301* Bird Keeper Perry [u9]; 302* Bird Keeper Robert [u9]; 469 Picnicker Gwen [u9]; 468 Picnicker Valerie [u9]; 269* Beauty Sheila [u9]; 268* Beauty Lola [u9]; 467* Picnicker Susie [u9]; 300* Bird Keeper Sebastian [u9]; 466* Picnicker Alma [u9] | G: optional room/route sweep; no documented progression gate. |
| R152 | v9 | Route 14 | 138 | 9 | 487 Twins Kiri & Jan [u9]; 304 Bird Keeper Benny [u9]; 207 Biker Lukas [u9]; 313 Bird Keeper Carter [u9]; 314 Bird Keeper Mitch [u9]; 196 Biker Malik [u9]; 208 Biker Isaac [u9]; 316 Bird Keeper Marlon [u9]; 315 Bird Keeper Beck [u9]; 303 Bird Keeper Donald [u9]; 209 Biker Gerald [u9] | G: optional room/route sweep; no documented progression gate. |
| R153 | v9 | Route 15 | 139 | 9 | 15* PkMn Trainer Haley [u9]; 488 Crush Kin Ron & Mya [u9]; 481 Picnicker Celia [u9]; 273 Beauty Grace [u9]; 480 Picnicker Becky [u9]; 197 Biker Ernest [u9]; 198 Biker Alex [u9]; 274 Beauty Olivia [u9]; 479 Picnicker Kindra [u9]; 306 Bird Keeper Chester [u9]; 305 Bird Keeper Edwin [u9]; 478 Picnicker Yazmin [u9] | G: optional room/route sweep; no documented progression gate. |
| R154 | v9 | Route 15 Gatehouse 2F | 140 | 9 | - | G: optional room/route sweep; no documented progression gate. |
| R155 | v9 | Route 16 | 104 | 3,6,9 | 199* Biker Lao [u9]; 249* Cue Ball Koji [u9]; 250* Cue Ball Luke [u9]; 202* Biker Ruben [u9]; 251* Cue Ball Camron [u9]; 201* Biker Hideo [u9] | First visit is northern Fly detour; cycling road requires Bicycle and cleared Snorlax. Main road after Sabrina per TO. Alternative west-side circuit; TO D272-D292 fixes elite biker order. |
| R156 | v9 | Route 17 | 141 | 9 | 205 Biker Jaxon [u9]; 256 Cue Ball Corey [u9]; 254 Cue Ball Zeek [u9]; 255 Cue Ball Jamal [u9]; 203 Biker Billy [u9]; 204 Biker Nikolas [u9]; 252 Cue Ball Raul [u9]; 253 Cue Ball Isaiah [u9]; 470 Biker Virgil [u9] | G: optional room/route sweep; no documented progression gate. |
| R157 | v9 | Route 18 | 142 | 9 | 206* Biker William [u9]; 309* Bird Keeper Jacob [u9]; 308* Dragon Tamer Ramiro [u9]; 307* Ace Trainer Wilton [u9] | William -> Jacob -> optional Ramiro -> Wilton (TO D296-D309). |
| R158 | v9 | Route 18 Gatehouse 2F | 143 | 9 | - | G: optional room/route sweep; no documented progression gate. |
| R159 | v9 | Fuchsia City | 144 | 9 | 57* PkMn Trainer Brendan [u9] | Brendan at Safari entrance -> HM06 Rock Smash; Medicine/Fuchsia Gloom errand for optional Erika rematch (I D485,D297). |
| R160 | v9 | Safari Zone | 145 | - | - | Safari entry signpost. v4.1 is ordinary encounters, no Safari-ball/timer instructions (C4 Safari paragraph). |
| R161 | v9 | Safari Zone Area 1 | 146 | 9,10 | - | G: optional room/route sweep; no documented progression gate. |
| R162 | v9 | Safari Zone Area 2 | 147 | 9,10 | - | G: optional room/route sweep; no documented progression gate. |
| R163 | v9 | Safari Zone Area 3 | 148 | 9,10 | - | G: optional room/route sweep; no documented progression gate. |
| R164 | v9 | Safari Zone Area 4 | 149 | 9,10 | - | Area 3 is west/Gold Teeth zone (I D501,D505; TMs & HMs P4 identifies Area 3). Take Teeth and enter Secret House. |
| R165 | v9 | Safari Zone Secret House | 150 | 9 | - | HM03 Surf in Secret House (I D505); possession at step 9, overworld Surf buckets at 10 after Koga. |
| R166 | v9 | Fuchsia City Poke Mart | 151 | 9 | - | G: optional room/route sweep; no documented progression gate. |
| R167 | v9 | Fuchsia City Warden's House | 152 | 9 | - | Return Gold Teeth for HM04 Strength (I D486). Do not send player to Seafoam/Victory Road without it. |
| R168 | v9 | Fuchsia City Fishing Guru's House | 153 | 9 | - | Super Rod now (I D477); not the vanilla Route 12 reward. Source super-Rod buckets generally open at step 9. |
| R169 | v9 | Pewter City Gym | 19 | 0,1,9 | 56* Leader Brock [u9] | Brock ends cap 0. Rematch at step 9 is optional in Hardcore (C0 v4.0 opening bullets). Optional HC rematch; may be fought sooner after Mega Ring per TO 59/68. |
| R170 | v9 | Cerulean City Gym | 73 | 2,3,9,17 | 48* Leader Misty [u9] | Misty ends cap 2. Trainer Order permits the nearby cap-2 fights at 28 OR 36; main itinerary chooses Misty first. Optional HC rematch; TO 59/68, source chooses 68. |
| R171 | v9 | Vermilion City Gym | 111 | 3,4,9 | 51* Leader Lt. Surge [u9] | Cut access; Tucker before Surge; Surge ends cap 3 (TO D109,D113). Optional HC rematch; TO 59/68, source chooses 68. |
| R172 | v9 | Celadon City Gym | 112 | 4,5,9 | 65* Leader Erika [u9] | Mary before Erika; Erika ends cap 4 (TO D142,D146). Optional Erika rematch has Fuchsia Gloom errand prerequisite (I D297). Optional Erika/Gloom errand -> Ogerpon reward in v4.1. |
| R173 | v9 | Route 19 | 154 | 9,10 | 235 SwimmerM Richard [u9]; 236 SwimmerM Reece [u9] | Optional beach, no Surf asserted until Koga. |
| R174 | v9 | Fuchsia City Gym | 155 | 9,10 | 294 Tamer Phil [u9]; 295 Tamer Edgar [u9]; 288 Juggler Kirk [u9]; 289 Juggler Shawn [u9]; 292* Juggler Kayden [u9]; 293 Juggler Nate [u9]; 418* Leader Koga [u9] | Kayden before Koga; Hardcore does NOT require Brock/Misty/Surge rematches (C0 v4.0). Koga ends cap 9. Kayden last before Koga (TO D334,D338). |
| R175 | v10 | Safari Zone Moltres' Den | 156 | 10 | - | New v4.1 Surf-only Safari extension; Moltres variants and raid den. Optional, do not send player to Victory Road for Moltres (C4). |
| R176 | v10 | Route 10 | 76 | 3,9,10 | 162 Pokemaniac Mark [u10] | North and south of Rock Tunnel are one data area. Herman is after Dana (TO D125,D129); floor-level order remains inferred. Optional Route 10 Surf approach to Power Plant. |
| R177 | v10 | Power Plant | 157 | 10 | 66* Dumbass Jojo Fan [u10] | Optional Jojo Fan/Zapdos via Route 10 Surf; not a Koga prerequisite. |
| R178 | v10 | Route 4 | 21 | 1,2,10,14 | 119 Lass Crissy [u10] | West before Mt. Moon, east after Archer; one source area spans the one-way ledge. Crissy requires Surf/step 10. Giovanni/Lance rewards at step 14 (I D118-D119). Optional Route 4 Surf revisit, not an early Lass. |
| R179 | v10 | Route 19 | 154 | 9,10 | 240 SwimmerM Tony [u10]; 239 SwimmerM David [u10]; 238 SwimmerM Douglas [u10]; 237 SwimmerM Matthew [u10]; 490 Sis And Bro Lia & Luc [u10]; 277 SwimmerF Alice [u10]; 278 SwimmerF Connie [u10]; 241 SwimmerM Axle [u10]; 276 SwimmerF Anya [u10] | G: optional room/route sweep; no documented progression gate. |
| R180 | v10 | Route 20 | 158 | 10 | 270 SwimmerF Tiffany [u10]; 279 SwimmerF Shirley [u10]; 244 SwimmerM Darrin [u10]; 242 SwimmerM Barry [u10]; 473 Picnicker Irene [u10]; 243 SwimmerM Dean [u10]; 310 Bird Keeper Roger [u10]; 271 SwimmerF Nora [u10]; 472 Picnicker Missy [u10]; 272 SwimmerF Melissa [u10]; 58* Leader Pryce [u10]; 59* Leader Pryce [u10]; 60* Leader Pryce [u10] | Seafoam/Pryce excursion optional; route can be bypassed by Surf south from Pallet. Pryce IDs live on Route 20 in data, not a Seafoam-floor area. G: optional water sweep; Pryce three conditional variants, not three fights. |
| R181 | v10 | Seafoam Islands B1F | 159 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R182 | v10 | Seafoam Islands B2F | 160 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R183 | v10 | Seafoam Islands B3F | 161 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R184 | v10 | Seafoam Islands B4F | 162 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R185 | v10 | Seafoam Islands B5F | 163 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R186 | v10 | Route 21 North | 9 | 0,3,9,10 | 491 Sis And Bro Lil & Ian [u10]; 245 SwimmerM Spencer [u10]; 231 Fisherman Wade [u10]; 229 Fisherman Ronald [u10] | G: optional room/route sweep; no documented progression gate. |
| R187 | v10 | Route 21 South | 169 | 10 | 248 SwimmerM Roland [u10]; 247 SwimmerM Jerome [u10]; 246 SwimmerM Jack [u10]; 232 Fisherman Nolan [u10]; 230 Fisherman Claude [u10] | Alternative Pallet -> Cinnabar Surf approach; no mandatory Seafoam traversal. |
| R188 | v10 | Cinnabar Island Poke Mart | 164 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R189 | v10 | Cinnabar Island | 170 | 10,11 | 61* PkMn Trainer May [u10] | May ends cap 10; reward Blazikenite bucket 11 (I and C0 v4.0). May ends cap 10. |
| R190 | v11 | Cinnabar Island Lab | 165 | 10,11,15 | 62* Leader Jasmine [u10]; 63* Leader Jasmine [u10]; 64* Leader Jasmine [u10] | Jasmine optional (TO D357). Three IDs are conditional teams, not three mandatory fights. Revive fossils; post-May Prison Bottle bucket 11. |
| R191 | v11 | Cinnabar Island Lab Meeting Room | 166 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R192 | v11 | Cinnabar Island Lab RnD Room | 167 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R193 | v11 | Cinnabar Island Lab Testing Room | 168 | 10 | - | G: optional room/route sweep; no documented progression gate. |
| R194 | v11 | Cinnabar Island | 170 | 10,11 | - | May ends cap 10; reward Blazikenite bucket 11 (I and C0 v4.0). Claim Blazikenite after May; source item bucket 11. |
| R195 | v11 | Pokemon Mansion 1F | 171 | 11 | 534 Youngster Johnson [u11]; 335* Scientist Ted [u11] | G: optional room/route sweep; no documented progression gate. |
| R196 | v11 | Pokemon Mansion 2F | 172 | 11 | 216 Burglar Arnie [u11] | G: optional room/route sweep; no documented progression gate. |
| R197 | v11 | Pokemon Mansion 3F | 173 | 11 | 346 Scientist Braydon [u11] | G: optional room/route sweep; no documented progression gate. |
| R198 | v11 | Pokemon Mansion B1F | 174 | 11 | 347 Scientist Ivan [u11]; 219* Burglar Lewis [u11] | Secret Key on B1F table opens Blaine gym (I D588); Lewis listed at 73 by TO but source cap is 11/76. |
| R199 | v11 | Cinnabar Island Gym | 175 | 11,12 | 177 Super Nerd Erik [u11]; 214 Burglar Ramon [u11]; 178 Super Nerd Aavery [u11]; 213 Burglar Quinn [u11]; 179* Ace Trainer Derek [u11]; 215* Ace Trainer Lucy [u11]; 180* Ace Trainer Zac [u11]; 419* Leader Blaine [u11] | Derek -> Lucy -> Zac -> Blaine (TO D370,D374,D378,D382); mandatory three aces per C0 v3.1. Blaine ends cap 11. G: ordinary quiz trainers optional path; Derek -> Lucy -> Zac -> Blaine is sourced. |
| R200 | v12 | Cerulean Cave 1F | 176 | 12,13 | 73* Team Rocket Grunt [u12]; 72* Team Rocket Grunt [u12] | Enter after Blaine story; grunts across 1F/2F then Archer -> Ariana BACK-TO-BACK. Pair ends cap 12, not a double battle. G: ordinary/grunt numbering pending team match; do not fight admins yet. |
| R201 | v12 | Cerulean Cave 2F | 177 | 12,14 | 71* Team Rocket Grunt [u12]; 70* Team Rocket Grunt [u12] | Rocket floor traversal before admins; Ketchup optional return only after Giovanni-3 (source cap 14). |
| R202 | v12 | Cerulean Cave 1F | 176 | 12,13 | 67* Rocket Admin Archer [u12]; 68* Rocket Admin Ariana [u12] | Enter after Blaine story; grunts across 1F/2F then Archer -> Ariana BACK-TO-BACK. Pair ends cap 12, not a double battle. Archer THEN Ariana back-to-back (TO D394,D398; Team Rocket E382). |
| R203 | v13 | Cerulean Cave B1F | 178 | 13,17 | 69* Boss Giovanni [u13]; 39 ALLY Champion Lance [u13] | Giovanni with ALLY Lance 39; ends cap 13. Mewtwo catch is postgame bucket 17, not immediate after boss. 69 opponent; 39 ALLY Lance. Do not render a separate Lance boss. |
| R204 | v14 | Route 4 | 21 | 1,2,10,14 | - | West before Mt. Moon, east after Archer; one source area spans the one-way ledge. Crissy requires Surf/step 10. Giovanni/Lance rewards at step 14 (I D118-D119). Optional Giovanni/Lance Mega Stone rewards after cave story (I D118-D119). |
| R205 | v14 | Cerulean Cave 2F | 177 | 12,14 | 19* PkMn Trainer Ketchup [u14]; 20* PkMn Trainer Ketchup [u14] | Rocket floor traversal before admins; Ketchup optional return only after Giovanni-3 (source cap 14). Optional Ketchup alternatives, not two required battles. |
| R206 | v14 | Viridian City Gym | 179 | 14,15,17 | 74* Leader Clair [u14] | Clair replaces Giovanni as eighth leader; ends cap 14. TM119 reward bucket 15 (C4 TM119 paragraph). |
| R207 | v15 | Viridian City | 5 | 0,3,9,10,15 | - | Collect Old Rod now, not vanilla Vermilion (I D21; area item-standard.0). Roamers only at source step 15. Roamers source step 15; optional tracking return. |
| R208 | v15 | Silph Co. B1F | 180 | 15 | - | Scope upgrade on way to Route 22 after badge 8 opens new Silph puzzle (Useful Links puzzles paragraph/C4). Optional. |
| R209 | v15 | Silph Co. Raging Bolt's Office | 181 | 15 | - | Raging Bolt static after optional Silph puzzle (C4); not on original Silph story path. |
| R210 | v15 | Pokemon Mansion 4F | 182 | 15 | 455* Burglar Anson [u15]; 454* Burglar Max [u15] | Scope-upgrade Mansion puzzle; Max then Anson per TO D416,D421; optional. |
| R211 | v15 | Pokemon Mansion Gouging Fire's Room | 183 | 15 | 218 Burglar Simon [u15] | Gouging Fire room; Simon 218 belongs here by trainer.cap/areaName, despite obsolete 3F reference. |
| R212 | v15 | Route 22 | 10 | 0,3,9,10,15 | 435* Rival Blue [u15]; 436* Rival Blue [u15]; 437* Rival Blue [u15] | Optional early Blue; final Blue is a separate step-15 return. Blue starter alternatives; badge-8 Scope upgrade happens on approach per Useful Links. |
| R213 | v15 | Route 23 | 184 | 15,16 | 26* PkMn Trainer Brendan [u15] | Brendan after Route 22 Blue and before Victory Road; ends cap 15. Sceptilite reward bucket 16 (C0 v4.0). |
| R214 | v16 | Victory Road 1F | 185 | 16 | 406* Ace Trainer Naomi [u16]; 396* Ace Trainer Rolando [u16] | G: optional room/route sweep; no documented progression gate. |
| R215 | v16 | Victory Road 2F | 186 | 16 | 290 Juggler Gregory [u16]; 298 Tamer Vincent [u16]; 287 Juggler Nelson [u16]; 325 Black Belt Daisuke [u16]; 167 Pokemaniac Dawson [u16] | G: optional room/route sweep; no documented progression gate. |
| R216 | v16 | Victory Road 3F | 187 | 16 | 393* Ace Trainer George [u16]; 403* Ace Trainer Caroline [u16]; 394* Ace Trainer Colby [u16]; 404* Ace Trainer Alexa [u16]; 485* Cool Couple Ray & Tyra [u16] | George -> Caroline -> Colby -> Alexa -> Ray & Tyra per TO D441-D457. |
| R217 | v16 | Indigo Plateau League Approach | 188 | 16 | 24* Dumbass Creator [u16] | Optional Creator challenge, literal level 250; never a cap-ending story requirement. |
| R218 | v16 | Pokemon League Lobby | 189 | 16 | - | Prepare team/heal; enter League once ready. |
| R219 | v16 | Pokemon League | 190 | 16 | 77* Elite Four Lorelei [u16]; 78* Elite Four Lorelei [u16] | Lorelei team alternatives, choose applicable one; not two successive fights. |
| R220 | v16 | Pokemon League | 191 | 16 | 80* Elite Four Bruno [u16]; 81* Elite Four Bruno [u16] | Bruno alternatives; next League room after Lorelei. |
| R221 | v16 | Pokemon League | 192 | 16 | 83* Elite Four Agatha [u16]; 84* Elite Four Agatha [u16] | Agatha alternatives; next League room after Bruno. |
| R222 | v16 | Pokemon League | 193 | 16 | 86* Elite Four Lance [u16]; 87* Elite Four Lance [u16] | Lance alternatives; next League room after Agatha. |
| R223 | v16 | Pokemon League | 194 | 16 | 438* Champion Blue [u16]; 439* Champion Blue [u16]; 440* Champion Blue [u16] | Champion Blue starter alternatives; Champion ends cap 16 -> postgame 100. |
| R224 | v17 | Route 16 Fly HM House | 105 | 3,17 | - | HM02 Fly now via Cut (I D415). Postgame return for Tri-Pass only after the NPC's prerequisites (I D422). After Champion ask ticket NPC; optional-boss checklist, not a free ferry ticket. |
| R225 | v17 | One Island | 195 | 17 | 40* Dumbass Jojo Fan [u17] | Jojo Fan gives Z-Power Ring/Fightinium Z (data item-standard.17); ring opens Kanto secret chambers (C0 v3.0). |
| R226 | v17 | One Island Poke Center | 200 | 17 | - | Bill/Celio postgame event items; duplicate Tri-Pass listing does not unlock pre-Champion islands. |
| R227 | v17 | Pokemon Tower 8F | 196 | 17 | - | Return to Tower after Z-Power Ring; new upper floors, not vanilla Tower finale. |
| R228 | v17 | Pokemon Tower 9F | 197 | 17 | 124* Ace Trainer Runan [u17]; 82* Ace Trainer Samantha [u17]; 113* Ace Trainer Symes [u17]; 28* Leader Morty [u17] | Upper Tower gauntlet/Morty; exact ordinary-ace sequence needs in-game route confirmation. G: clear upper-floor aces before Morty; precise ace order unconfirmed. |
| R229 | v17 | Rock Tunnel Magearna's Chamber | 198 | 17 | 43* Leader Falkner [u17] | Falkner secret Magearna chamber; Z-Power Ring required (C0 v3.0). |
| R230 | v17 | Seafoam Islands Kyogre's Chamber | 199 | 17 | 79* Leader Pryce [u17] | Pryce secret Kyogre chamber; Z-Power Ring required (C0 v3.0). |
| R231 | v17 | Pallet Town Oak's Lab | 3 | 0,17 | 210* Professor Oak [u17]; 200* Professor Oak [u17] | Choose starter; Blue IDs are alternatives, not three fights. Postgame Oak challenges are separate. Optional Oak challenge variants/reward; not story Oak fight at game start. |
| R232 | v17 | Cerulean City Gym | 73 | 2,3,9,17 | 32* Leader Misty [u17] | Misty ends cap 2. Trainer Order permits the nearby cap-2 fights at 28 OR 36; main itinerary chooses Misty first. Optional Misty postgame rematch. |
| R233 | v17 | Saffron City Gian's House 1F | 132 | 8,17 | 35* Dumbass Gian [u17] | Dumbass Kid optional; postgame Gian separate, no mandatory progression gate. Optional Gian postgame challenge. |
| R234 | v17 | Viridian City Gym | 179 | 14,15,17 | 38* Leader Clair [u17] | Clair replaces Giovanni as eighth leader; ends cap 14. TM119 reward bucket 15 (C4 TM119 paragraph). Optional Clair postgame rematch. |
| R235 | v17 | Cerulean Cave B1F | 178 | 13,17 | - | Giovanni with ALLY Lance 39; ends cap 13. Mewtwo catch is postgame bucket 17, not immediate after boss. Return for Mewtwo static (fixed-overworld.17). |
| R236 | v17 | Treasure Beach | 201 | 17 | 546* SwimmerF Amara [u17]; 3* PkMn Trainer Red [u17] | Optional Red challenge; ordinary Amara approach before Red is inferred. G: beach swimmer then optional Red. |
| R237 | v17 | Kindle Road | 202 | 17 | 557* Crush Kin Mik & Kia [u17]; 556* Picnicker Claire [u17]; 555* Camper Bryce [u17]; 554* Black Belt Hugh [u17]; 553* Black Belt Shea [u17]; 552* Crush Girl Tanya [u17]; 518* Crush Girl Sharon [u17]; 551* Fisherman Tommy [u17]; 550* SwimmerM Garrett [u17]; 549* SwimmerM Finn [u17]; 548* SwimmerF Abigail [u17]; 547* SwimmerF Maria [u17]; 75* Leader Bugsy [u17] | Kindle Road ordinary trainers then optional Bugsy; proposed path, not Trainer Order coverage. G: road sweep; optional Bugsy at endpoint, spatial placement must be checked. |
| R238 | v17 | Ember Spa | 203 | 17 | - | Optional Ember Spa; HM07 Waterfall from old man nearby (I D679), postgame only. |
| R239 | v17 | Mt Ember Exterior | 204 | 17 | 597* PkMn Ranger Beth [u17]; 595* Gatekeeper Logan [u17]; 592* Crush Girl Jocelyn [u17]; 41* Rocket Admin Ariana [u17] | Climb Mt Ember; Rocket Ariana at exterior, Archer at summit (data + Postgame sheet). G: ordinary climb then Ariana. |
| R240 | v17 | Mt Ember Interior | 205 | 17 | - | G: optional room/route sweep; no documented progression gate. |
| R241 | v17 | Mt Ember Interior 2 | 206 | - | - | G: optional room/route sweep; no documented progression gate. |
| R242 | v17 | Mt Ember Interior 3 | 207 | - | - | G: optional room/route sweep; no documented progression gate. |
| R243 | v17 | Mt Ember Interior 4 | 208 | - | - | G: optional room/route sweep; no documented progression gate. |
| R244 | v17 | Mt Ember Summit | 209 | 17 | 42* Rocket Admin Archer [u17] | Rocket Archer summit; exact relation to every island side quest is inferred. |
| R245 | v17 | Two Island | 210 | 17 | - | G: optional room/route sweep; no documented progression gate. |
| R246 | v17 | Two Island Game Corner | 211 | 17 | 2* Ace Trainer Andrew [u17] | Optional Andrew challenge. |
| R247 | v17 | Two Island House | 212 | 17 | 76* Leader Whitney [u17] | Optional Whitney rematch. |
| R248 | v17 | Cape Brink | 213 | 17 | - | G: optional room/route sweep; no documented progression gate. |
| R249 | v17 | Cape Brink House | 214 | 17 | 147* Channeler Rachel [u17] | Optional Rachel challenge. |
| R250 | v17 | Three Isle Port | 215 | 17 | - | G: optional room/route sweep; no documented progression gate. |
| R251 | v17 | Three Isle Path | 216 | 17 | - | G: optional room/route sweep; no documented progression gate. |
| R252 | v17 | Three Island | 217 | 17 | 742* Cue Ball Paxton [u17]; 529* Biker Goon [u17]; 528* Biker Goon [u17]; 527* Biker Goon [u17] | Biker/Cue Ball invasion; story order among individual trainers is inferred from source array. |
| R253 | v17 | Three Island Poke Mart | 218 | 17 | - | G: optional room/route sweep; no documented progression gate. |
| R254 | v17 | Bond Bridge | 219 | 17 | 560* Twins Joy & Meg [u17]; 561* SwimmerF Tisha [u17]; 559* Tuber Alexis [u17]; 519* Tuber Amira [u17]; 558* Aroma Lady Violet [u17]; 523* Aroma Lady Nikki [u17] | G: optional room/route sweep; no documented progression gate. |
| R255 | v17 | Berry Forest | 220 | 17 | 174* Ace Trainer Sharon [u17]; 85* Ace Trainer Nick [u17]; 88* Ace Trainer Barry [u17]; 175* Ace Trainer Janny [u17]; 176* Gatekeeper Owen [u17] | Resolve Lostelle/Berry Forest vanilla frame; RR ace gauntlet/Owen replaces any assumed vanilla boss. Do not invent Hypno trainer. G: forest gauntlet source order; Owen last proposed. |

## 3. Optional, postgame, rematches and return buckets

All 221 area records and all 464 trainer records have a row in section 2. There are **zero unplaced areas and zero unplaced trainers**. This is an inventory placement, not an assertion that 464 fights occur in one run: starter/other conditional alternatives and two allies are retained.

### Side-content placement rules

- Optional early rivals/Johto leaders/challenges stay near their reachable stop; skip them without breaking the checklist. Friendly Teacher, PkMnManiac, Komodo, coaches and Gambler are services/challenges, not assumed story blockers. Creator 24 is an optional level-250 challenge.
- Brock 56, Misty 48 and Surge 51 rematches: v9 optional circuit (earliest Mega Ring/59 according to TO); not Koga prerequisites in Hardcore. Erika 65: optional after aiding Gloom in Fuchsia, v9; v4.1 adds Ogerpon reward. Bugsy 8: source u4 separate Route 25 return; do not merge with initial 47.
- Pryce 58/59/60, Jasmine 62/63/64, Ketchup 19/20, E4 pairs, Blue triples and Oak 210/200 are conditional/variant records requiring unit 6 to label conditions from the boss sheets/team comparisons. They are NOT serial checklist battles. Check exact variant conditions rather than assuming every non-Blue variant is random.
- Silph Brendan 55 and Cave Lance 39 account for **two** of the 464 records and must attach as partners (`pt`) to the joint fights; they do not get defeat checkboxes. Silph admins 53+54 are simultaneous opponents; Cave 67 then 68 are sequential back-to-back.
- Postgame: Champion -> Route 16 ticket prerequisite list -> One Island/Z-Power Ring -> secret Kanto chambers and island circuits. No source establishes a mandatory order between all those optional circuits. The listed Kanto-first, then One/Two/Three Island sweep is a suggested completionist order, not a story requirement.
- Empty source areas (see inventory below) become grey signs only if useful for navigation; they still count as placed, not invented encounter tables. Five `Pokemon League` areas must never collapse by name.

### Later content: exact return inventory

Every area/category bucket not naturally covered by a visit at that source step is retained below as a deferred **optional return**. Expand these into per-area WK visits at build time, in the section-2 area order within that split, or attach an explicitly labelled later-unlock substop. This includes ubiquitous fishing upgrades and late items, not just new trainers. If a source bucket predates the first suggested visit, show it at that first visit with its real access notes; do not time-travel the player.

| Source unlock | Area ID: categories (visit after prerequisite, not automatic pickup) |
| --- | --- |
| u1 | 15: item-standard; 19: item-standard |
| u2 | 25: item-standard, item-hidden |
| u3 | 1: wild-goodRod; 5: wild-goodRod; 10: wild-goodRod; 11: item-standard; 17: item-standard; 32: wild-goodRod; 33: wild-goodRod; 73: item-standard |
| u4 | 37: fixed-trade; 111: item-standard, item-cheat |
| u5 | 112: item-standard |
| u6 | 88: fixed-overworld; 104: fixed-overworld |
| u9 | 1: wild-superRod; 5: wild-superRod; 10: wild-superRod; 11: item-standard; 13: fixed-overworld, item-standard; 25: fixed-overworld, item-standard, item-hidden; 26: wild-superRod; 32: wild-superRod; 33: wild-superRod; 39: item-standard, wild-superRod; 40: wild-superRod; 47: wild-superRod; 76: wild-superRod; 79: fixed-overworld, item-standard; 93: item-standard, wild-superRod; 135: item-standard |
| u10 | 1: wild-surf; 5: wild-surf, item-standard; 10: wild-surf, item-standard; 26: wild-surf; 32: wild-surf, item-standard; 33: wild-surf; 39: wild-surf; 40: wild-surf, item-standard; 88: wild-surf, item-standard; 93: wild-surf, item-standard; 137: wild-surf; 146: wild-surf, item-standard; 147: wild-surf; 148: wild-surf; 149: wild-surf; 155: item-standard |
| u12 | 175: item-standard |
| u13 | 176: item-standard |
| u15 | 165: item-standard; 179: item-standard, item-cheat |
| u16 | 184: item-standard, item-hidden |
| u17 | 0: item-cheat |

Empty area IDs: 51, 53, 54, 56, 66, 68, 70, 71, 83, 145, 206, 207, 208.

### Coverage ledger

| Source cap step | Unique trainer IDs placed |
| --- | --- |
| 0 | 18 |
| 1 | 21 |
| 2 | 60 |
| 3 | 76 |
| 4 | 9 |
| 5 | 14 |
| 6 | 40 |
| 7 | 1 |
| 8 | 12 |
| 9 | 69 |
| 10 | 38 |
| 11 | 14 |
| 12 | 6 |
| 13 | 2 |
| 14 | 3 |
| 15 | 7 |
| 16 | 24 |
| 17 | 50 |

Section 2: 255 explicit visit rows; 221 distinct area IDs (0..220); 464 distinct trainer IDs, each exactly once; 462 non-partner records + 2 allies = 464. Raw areas contain 467 trainer references because 218, 447 and 531 are each referenced twice. Zero dangling IDs. The coverage assertions compare sets against the complete parsed source, not just totals.

## 4. Source disagreements and limits

WIP: route and cap inventory complete. Next: finish detailed disagreement ledger, source-cell cross-checks and builder method.

## 5. Method for unit 8

WIP: use the route rows, preserve source unlock versus preferred visit, and match by area ID + trainer ID rather than area name alone. Detailed handoff follows after the audit.
