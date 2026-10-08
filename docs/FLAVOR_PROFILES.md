# Complete local-store flavor profiles

All 24 confirmed store expressions have 11 numeric intensity estimates (0–10): sweetness, oak, fruit, spice, grain, richness, smoke, body, warmth, finish, and herbal character. These are app-authored research syntheses, not quality scores or measurements assigned by the cited critics.

`data/flavor-profiles/local-store.json` stores values, source URLs, rationale, review date, confidence, lower-confidence axes, and representative batch scope. Source descriptions anchor dominant flavors, texture and length; weaker or undescribed axes use conservative style estimates and are identified as lower confidence. Producer-only Gunnar's Honey and variable NuLu releases have low overall confidence. No estimate establishes the photographed barrel's proof or changes critic ratings.

Profiles are attached during catalog builds and used by recommendation scoring and detail heat maps. An overall Like/Love/Bad reaction can use the linked researched profile as preference evidence when there are no actual questionnaire observations for that bottle. Actual observations take precedence. Repeated reaction-only pours contribute once per bottle using the latest reaction. This inferred preference evidence never writes invented questionnaire answers into the user's tasting record.

Complete-profile recommendations weight available intensity matching 80% and descriptor overlap 20%, retaining personal negative evidence. Only photo-evidenced bottles are eligible for recommendations.

Future confirmed wine and spirit expressions need a reviewed category-specific complete profile before publication. Unknown batch differences remain explicit. A numerical quality review is displayed only when a source actually assigned one, on its original scale.
