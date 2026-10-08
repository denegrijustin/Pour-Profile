# Bourbon research from the 12-photo manifest

The photo manifest is a research selection, not proof of ownership, tasting, inventory quantity, current store stock, Kansas registration, or a specific batch. Attachment order supplies the photo numbers.

`data/photo-bourbon-selection.json` links 24 identifiable expressions to the built-in reference catalog. Sixteen reuse canonical existing records; eight are new. Gunnar’s Honey is included as a bourbon-based flavored spirit under `american_whiskey`, not straight bourbon.

`data/photo-bourbon-pending.json` keeps 16 brand-level entries pending exact-expression confirmation. These are not new catalog SKUs. Existing researched products under those brands remain searchable, but are not falsely marked as pictured.

## Authored research pipeline

1. Author paraphrased, attributed producer and independent tasting notes in `data/notes/photos/output-*.json`.
2. Run `node tools/merge-notes.mjs` to validate and merge them into `data/expert-notes.json`. The merge includes selection IDs, including new photo records, and deduplicates reused IDs.
3. `fullCatalog()` combines canonical research, Kansas records and the photo selection without duplicate IDs. New records carry sourced facts, descriptive notes, source links and flavor terms; no invented sensory numbers, critic scores, availability or personal ratings.
4. `node tools/build-catalog.mjs` ships the committed catalog and per-bottle note assets. Search and bottle details read these assets rather than requesting live web research.
5. Catalog adoption copies descriptions, age, mash bill, barrel details and producer URL into the saved bottle. User reactions and the existing source-descriptor preference matching still drive personal recommendations.

Existing sensory estimates retain their original provenance when a cited description replaces an older summary. Reusing old source-linked research does not claim that each historical reference was reverified today. New research was checked on 2026-10-07.

## New records and source scope

- High West Barbados rum finish: High West’s distributor-hosted producer sheet plus SavWay’s retailer tasting notes. Ages and ten-month finish refer to the cited release; the pictured blend/batch is not established.
- NuLu French Oak: producer description plus Seelbach’s C289 selection. The photo identifies the finish, not the exact stave/barrel method or C289. Proof, age and mash bill remain unset.
- NuLu Amburana: producer wood description plus Bourbon Culture’s 2023 single-barrel review. No score, age or proof is transferred from that barrel to the photographed bottle.
- Holladay Soft Red Wheat Rickhouse Proof: producer page plus Breaking Bourbon’s October 2024 review. Proof remains unset because releases vary. Minimum six-year maturation comes from the producer.
- Ben Holladay original Rickhouse Proof: producer page plus Whiskeyfellow’s August 2023 review. Kept separate from the wheat recipe; proof remains unset.
- Ben Holladay original Bottled-in-Bond: producer page plus Breaking Bourbon’s Batch 1 review. Fixed 100 proof and the original rye recipe are corroborated; no Batch 1 score is applied to an unknown photographed batch.
- Old Grand-Dad Bonded: official Beam product page plus Breaking Bourbon. At least four years, 100 proof; the review contrasts sweet flavors with prominent cinnamon.
- Gunnar’s Honey: producer-only facts and description. No independent critic consensus or numeric rating was found.

Henry McKenna’s existing producer notes now also link an independent barrel review; the pictured barrel is unknown, so no sample-specific score is assigned.

All source URLs and attribution are stored next to the relevant notes. Current prices, UPCs, barrel IDs and bottle-image matches are not inferred from a wide shelf photo. Existing persistent photo lookup remains available.
