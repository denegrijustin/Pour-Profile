(function () {
  const data = window.TRIP_DATA;
  const WEATHER_TTL = 30 * 60 * 1000;
  const state = loadState();
  let activeProfile = state.profile || "elsie";
  let activePage = "today";
  let watchId = null;
  let lastGpsRender = 0;
  let routeMap = null;
  let homeMap = null;
  let exploreMap = null;
  let mapLibreLoading = null;
  let lastRouteOrigin = null;
  let liveRouteResults = {};
  let modalReturnFocus = null;
  const EMBEDDED_TRIP_STOPS = [
  {
    "id": "P1-001",
    "title": "Mahaffie Stagecoach Stop & Farm",
    "name": "Mahaffie Stagecoach Stop & Farm",
    "category": "Historic Site",
    "latitude": 38.8816,
    "longitude": -94.8198,
    "lat": 38.8816,
    "lon": -94.8198,
    "lng": -94.8198,
    "phase": "Phase 1",
    "routeSegment": "Olathe / Kansas City",
    "route_segment": "Olathe / Kansas City",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.mahaffie.org",
    "official_website": "https://www.mahaffie.org",
    "learnMoreUrl": "https://www.mahaffie.org",
    "learn_more": "https://www.mahaffie.org",
    "sourceUrl": "https://www.mahaffie.org",
    "shortSummary": "Santa Fe Trail-era stagecoach stop and working farm in Olathe.",
    "summary": "Santa Fe Trail-era stagecoach stop and working farm in Olathe.",
    "whyItMatters": "Great starting point because it connects your drive to earlier overland travel routes.",
    "why": "Great starting point because it connects your drive to earlier overland travel routes.",
    "notes": {
      "elsie": "Compare old trail travel to this road trip.",
      "katrina": "Ask why towns grew around trails and stopping points.",
      "emma": "Notice how chores, food, and travel worked before cars.",
      "eliette": "Look for small farm details, signs, and tools.",
      "jules": "Stagecoach and farm animals make this an easy first mission.",
      "momdad": "Great starting point because it connects your drive to earlier overland travel routes."
    },
    "profiles": {
      "elsie": "Compare old trail travel to this road trip.",
      "katrina": "Ask why towns grew around trails and stopping points.",
      "emma": "Notice how chores, food, and travel worked before cars.",
      "eliette": "Look for small farm details, signs, and tools.",
      "jules": "Stagecoach and farm animals make this an easy first mission.",
      "momdad": "Great starting point because it connects your drive to earlier overland travel routes."
    },
    "csvOrder": 1
  },
  {
    "id": "P1-002",
    "title": "Ernie Miller Nature Center",
    "name": "Ernie Miller Nature Center",
    "category": "Nature Center",
    "latitude": 38.8844,
    "longitude": -94.8578,
    "lat": 38.8844,
    "lon": -94.8578,
    "lng": -94.8578,
    "phase": "Phase 1",
    "routeSegment": "Olathe / Kansas City",
    "route_segment": "Olathe / Kansas City",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.jcprd.com/Facilities/Facility/Details/Ernie-Miller-Park-Nature-Center-15",
    "official_website": "https://www.jcprd.com/Facilities/Facility/Details/Ernie-Miller-Park-Nature-Center-15",
    "learnMoreUrl": "https://www.jcprd.com/Facilities/Facility/Details/Ernie-Miller-Park-Nature-Center-15",
    "learn_more": "https://www.jcprd.com/Facilities/Facility/Details/Ernie-Miller-Park-Nature-Center-15",
    "sourceUrl": "https://www.jcprd.com/Facilities/Facility/Details/Ernie-Miller-Park-Nature-Center-15",
    "shortSummary": "Local nature center with trails and Kansas wildlife interpretation.",
    "summary": "Local nature center with trails and Kansas wildlife interpretation.",
    "whyItMatters": "Good outdoor reset before the long eastbound drive.",
    "why": "Good outdoor reset before the long eastbound drive.",
    "notes": {
      "elsie": "Look for habitats and animal signs.",
      "katrina": "Ask what animals live near cities and why.",
      "emma": "Spot how nature and suburbs share space.",
      "eliette": "Find one tiny detail on the trail.",
      "jules": "Look for birds, bugs, and tracks.",
      "momdad": "Good outdoor reset before the long eastbound drive."
    },
    "profiles": {
      "elsie": "Look for habitats and animal signs.",
      "katrina": "Ask what animals live near cities and why.",
      "emma": "Spot how nature and suburbs share space.",
      "eliette": "Find one tiny detail on the trail.",
      "jules": "Look for birds, bugs, and tracks.",
      "momdad": "Good outdoor reset before the long eastbound drive."
    },
    "csvOrder": 2
  },
  {
    "id": "P1-003",
    "title": "Museum at Prairiefire",
    "name": "Museum at Prairiefire",
    "category": "Science Museum",
    "latitude": 38.8838,
    "longitude": -94.6358,
    "lat": 38.8838,
    "lon": -94.6358,
    "lng": -94.6358,
    "phase": "Phase 1",
    "routeSegment": "Olathe / Kansas City",
    "route_segment": "Olathe / Kansas City",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://museumatpf.org/",
    "official_website": "https://museumatpf.org/",
    "learnMoreUrl": "https://museumatpf.org/",
    "learn_more": "https://museumatpf.org/",
    "sourceUrl": "https://museumatpf.org/",
    "shortSummary": "Science and discovery museum with a striking colored-glass building.",
    "summary": "Science and discovery museum with a striking colored-glass building.",
    "whyItMatters": "Strong curiosity stop with visual impact and kid-friendly exhibits.",
    "why": "Strong curiosity stop with visual impact and kid-friendly exhibits.",
    "notes": {
      "elsie": "Use the building as a design and science observation.",
      "katrina": "Pick one exhibit and ask how scientists know it is true.",
      "emma": "Connect science to everyday life.",
      "eliette": "Find the coolest color, shape, or object.",
      "jules": "Look for dinosaurs or animals first.",
      "momdad": "Strong curiosity stop with visual impact and kid-friendly exhibits."
    },
    "profiles": {
      "elsie": "Use the building as a design and science observation.",
      "katrina": "Pick one exhibit and ask how scientists know it is true.",
      "emma": "Connect science to everyday life.",
      "eliette": "Find the coolest color, shape, or object.",
      "jules": "Look for dinosaurs or animals first.",
      "momdad": "Strong curiosity stop with visual impact and kid-friendly exhibits."
    },
    "csvOrder": 3
  },
  {
    "id": "P1-004",
    "title": "Overland Park Arboretum & Botanical Gardens",
    "name": "Overland Park Arboretum & Botanical Gardens",
    "category": "Garden",
    "latitude": 38.843,
    "longitude": -94.6885,
    "lat": 38.843,
    "lon": -94.6885,
    "lng": -94.6885,
    "phase": "Phase 1",
    "routeSegment": "Olathe / Kansas City",
    "route_segment": "Olathe / Kansas City",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.opkansas.org/recreation-fun/arboretum-botanical-gardens/",
    "official_website": "https://www.opkansas.org/recreation-fun/arboretum-botanical-gardens/",
    "learnMoreUrl": "https://www.opkansas.org/recreation-fun/arboretum-botanical-gardens/",
    "learn_more": "https://www.opkansas.org/recreation-fun/arboretum-botanical-gardens/",
    "sourceUrl": "https://www.opkansas.org/recreation-fun/arboretum-botanical-gardens/",
    "shortSummary": "Large botanical garden and trail area in southern Overland Park.",
    "summary": "Large botanical garden and trail area in southern Overland Park.",
    "whyItMatters": "A calm outdoor reset before the highway miles.",
    "why": "A calm outdoor reset before the highway miles.",
    "notes": {
      "elsie": "Notice plant patterns and animal habitats.",
      "katrina": "Ask why certain plants thrive here.",
      "emma": "Pick a favorite path or garden space.",
      "eliette": "Look for colors, textures, and small details.",
      "jules": "Find water, flowers, or a bridge.",
      "momdad": "A calm outdoor reset before the highway miles."
    },
    "profiles": {
      "elsie": "Notice plant patterns and animal habitats.",
      "katrina": "Ask why certain plants thrive here.",
      "emma": "Pick a favorite path or garden space.",
      "eliette": "Look for colors, textures, and small details.",
      "jules": "Find water, flowers, or a bridge.",
      "momdad": "A calm outdoor reset before the highway miles."
    },
    "csvOrder": 4
  },
  {
    "id": "P1-005",
    "title": "Deanna Rose Children's Farmstead",
    "name": "Deanna Rose Children's Farmstead",
    "category": "Family Attraction",
    "latitude": 38.8789,
    "longitude": -94.7129,
    "lat": 38.8789,
    "lon": -94.7129,
    "lng": -94.7129,
    "phase": "Phase 1",
    "routeSegment": "Olathe / Kansas City",
    "route_segment": "Olathe / Kansas City",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.opkansas.org/recreation-fun/deanna-rose-childrens-farmstead/",
    "official_website": "https://www.opkansas.org/recreation-fun/deanna-rose-childrens-farmstead/",
    "learnMoreUrl": "https://www.opkansas.org/recreation-fun/deanna-rose-childrens-farmstead/",
    "learn_more": "https://www.opkansas.org/recreation-fun/deanna-rose-childrens-farmstead/",
    "sourceUrl": "https://www.opkansas.org/recreation-fun/deanna-rose-childrens-farmstead/",
    "shortSummary": "Family farmstead with animals, gardens, schoolhouse, and Kansas life exhibits.",
    "summary": "Family farmstead with animals, gardens, schoolhouse, and Kansas life exhibits.",
    "whyItMatters": "Great kid-friendly launch point tied to farming and local history.",
    "why": "Great kid-friendly launch point tied to farming and local history.",
    "notes": {
      "elsie": "Think about how kids learned and worked on farms.",
      "katrina": "Ask how farm life changed over time.",
      "emma": "Compare farm routines to your daily routines.",
      "eliette": "Find the cutest animal or best small detail.",
      "jules": "Animal mission: count goats, cows, and chickens.",
      "momdad": "Great kid-friendly launch point tied to farming and local history."
    },
    "profiles": {
      "elsie": "Think about how kids learned and worked on farms.",
      "katrina": "Ask how farm life changed over time.",
      "emma": "Compare farm routines to your daily routines.",
      "eliette": "Find the cutest animal or best small detail.",
      "jules": "Animal mission: count goats, cows, and chickens.",
      "momdad": "Great kid-friendly launch point tied to farming and local history."
    },
    "csvOrder": 5
  },
  {
    "id": "P1-006",
    "title": "National WWI Museum and Memorial",
    "name": "National WWI Museum and Memorial",
    "category": "History Museum",
    "latitude": 39.0805,
    "longitude": -94.5858,
    "lat": 39.0805,
    "lon": -94.5858,
    "lng": -94.5858,
    "phase": "Phase 1",
    "routeSegment": "Kansas City",
    "route_segment": "Kansas City",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.theworldwar.org/",
    "official_website": "https://www.theworldwar.org/",
    "learnMoreUrl": "https://www.theworldwar.org/",
    "learn_more": "https://www.theworldwar.org/",
    "sourceUrl": "https://www.theworldwar.org/",
    "shortSummary": "National museum and memorial dedicated to World War I.",
    "summary": "National museum and memorial dedicated to World War I.",
    "whyItMatters": "Major Kansas City anchor and one of the strongest history stops on the route.",
    "why": "Major Kansas City anchor and one of the strongest history stops on the route.",
    "notes": {
      "elsie": "Consider how one war changed the modern world.",
      "katrina": "Ask why countries got pulled into the war.",
      "emma": "Notice how technology changed daily life and war.",
      "eliette": "Find one artifact that tells a story.",
      "jules": "Look for flags, uniforms, and big machines.",
      "momdad": "Major Kansas City anchor and one of the strongest history stops on the route."
    },
    "profiles": {
      "elsie": "Consider how one war changed the modern world.",
      "katrina": "Ask why countries got pulled into the war.",
      "emma": "Notice how technology changed daily life and war.",
      "eliette": "Find one artifact that tells a story.",
      "jules": "Look for flags, uniforms, and big machines.",
      "momdad": "Major Kansas City anchor and one of the strongest history stops on the route."
    },
    "csvOrder": 6
  },
  {
    "id": "P1-007",
    "title": "Union Station Kansas City",
    "name": "Union Station Kansas City",
    "category": "Historic Site",
    "latitude": 39.0849,
    "longitude": -94.5856,
    "lat": 39.0849,
    "lon": -94.5856,
    "lng": -94.5856,
    "phase": "Phase 1",
    "routeSegment": "Kansas City",
    "route_segment": "Kansas City",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://unionstation.org/",
    "official_website": "https://unionstation.org/",
    "learnMoreUrl": "https://unionstation.org/",
    "learn_more": "https://unionstation.org/",
    "sourceUrl": "https://unionstation.org/",
    "shortSummary": "Restored historic train station with exhibits and family attractions.",
    "summary": "Restored historic train station with exhibits and family attractions.",
    "whyItMatters": "Connects the road trip to rail travel and city growth.",
    "why": "Connects the road trip to rail travel and city growth.",
    "notes": {
      "elsie": "Compare train travel to car travel.",
      "katrina": "Ask why stations became city landmarks.",
      "emma": "Notice crowds, schedules, and movement.",
      "eliette": "Look for old architecture details.",
      "jules": "Big building mission: find the tallest ceiling.",
      "momdad": "Connects the road trip to rail travel and city growth."
    },
    "profiles": {
      "elsie": "Compare train travel to car travel.",
      "katrina": "Ask why stations became city landmarks.",
      "emma": "Notice crowds, schedules, and movement.",
      "eliette": "Look for old architecture details.",
      "jules": "Big building mission: find the tallest ceiling.",
      "momdad": "Connects the road trip to rail travel and city growth."
    },
    "csvOrder": 7
  },
  {
    "id": "P1-008",
    "title": "Negro Leagues Baseball Museum",
    "name": "Negro Leagues Baseball Museum",
    "category": "History Museum",
    "latitude": 39.0914,
    "longitude": -94.5636,
    "lat": 39.0914,
    "lon": -94.5636,
    "lng": -94.5636,
    "phase": "Phase 1",
    "routeSegment": "Kansas City",
    "route_segment": "Kansas City",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.nlbm.com/",
    "official_website": "https://www.nlbm.com/",
    "learnMoreUrl": "https://www.nlbm.com/",
    "learn_more": "https://www.nlbm.com/",
    "sourceUrl": "https://www.nlbm.com/",
    "shortSummary": "Museum preserving Negro Leagues baseball history.",
    "summary": "Museum preserving Negro Leagues baseball history.",
    "whyItMatters": "Important sports, civil rights, and Kansas City history stop.",
    "why": "Important sports, civil rights, and Kansas City history stop.",
    "notes": {
      "elsie": "Track how sports can tell a bigger justice story.",
      "katrina": "Ask why separate leagues existed and what changed.",
      "emma": "Connect sports to fairness and community.",
      "eliette": "Find a uniform, logo, or photo detail.",
      "jules": "Baseball mission: look for bats, balls, and jerseys.",
      "momdad": "Important sports, civil rights, and Kansas City history stop."
    },
    "profiles": {
      "elsie": "Track how sports can tell a bigger justice story.",
      "katrina": "Ask why separate leagues existed and what changed.",
      "emma": "Connect sports to fairness and community.",
      "eliette": "Find a uniform, logo, or photo detail.",
      "jules": "Baseball mission: look for bats, balls, and jerseys.",
      "momdad": "Important sports, civil rights, and Kansas City history stop."
    },
    "csvOrder": 8
  },
  {
    "id": "P1-009",
    "title": "Arabia Steamboat Museum",
    "name": "Arabia Steamboat Museum",
    "category": "Museum",
    "latitude": 39.108,
    "longitude": -94.5854,
    "lat": 39.108,
    "lon": -94.5854,
    "lng": -94.5854,
    "phase": "Phase 1",
    "routeSegment": "Kansas City",
    "route_segment": "Kansas City",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.1856.com/",
    "official_website": "https://www.1856.com/",
    "learnMoreUrl": "https://www.1856.com/",
    "learn_more": "https://www.1856.com/",
    "sourceUrl": "https://www.1856.com/",
    "shortSummary": "Museum of recovered cargo from the steamboat Arabia.",
    "summary": "Museum of recovered cargo from the steamboat Arabia.",
    "whyItMatters": "Shows what everyday goods looked like in the 1850s.",
    "why": "Shows what everyday goods looked like in the 1850s.",
    "notes": {
      "elsie": "Think about how objects survive and tell stories.",
      "katrina": "Ask what people needed before modern stores.",
      "emma": "Compare old products to things we buy today.",
      "eliette": "Find the weirdest object on display.",
      "jules": "Treasure hunt: spot something shiny or strange.",
      "momdad": "Shows what everyday goods looked like in the 1850s."
    },
    "profiles": {
      "elsie": "Think about how objects survive and tell stories.",
      "katrina": "Ask what people needed before modern stores.",
      "emma": "Compare old products to things we buy today.",
      "eliette": "Find the weirdest object on display.",
      "jules": "Treasure hunt: spot something shiny or strange.",
      "momdad": "Shows what everyday goods looked like in the 1850s."
    },
    "csvOrder": 9
  },
  {
    "id": "P1-010",
    "title": "Science City at Union Station",
    "name": "Science City at Union Station",
    "category": "Science Museum",
    "latitude": 39.0851,
    "longitude": -94.5856,
    "lat": 39.0851,
    "lon": -94.5856,
    "lng": -94.5856,
    "phase": "Phase 1",
    "routeSegment": "Kansas City",
    "route_segment": "Kansas City",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://sciencecity.unionstation.org/",
    "official_website": "https://sciencecity.unionstation.org/",
    "learnMoreUrl": "https://sciencecity.unionstation.org/",
    "learn_more": "https://sciencecity.unionstation.org/",
    "sourceUrl": "https://sciencecity.unionstation.org/",
    "shortSummary": "Hands-on science center inside Union Station.",
    "summary": "Hands-on science center inside Union Station.",
    "whyItMatters": "Useful if the family needs an interactive indoor stop.",
    "why": "Useful if the family needs an interactive indoor stop.",
    "notes": {
      "elsie": "Pick one experiment and explain what happened.",
      "katrina": "Ask what made the experiment work.",
      "emma": "Try one activity and explain it simply.",
      "eliette": "Find the most colorful exhibit.",
      "jules": "Push buttons and test one science idea.",
      "momdad": "Useful if the family needs an interactive indoor stop."
    },
    "profiles": {
      "elsie": "Pick one experiment and explain what happened.",
      "katrina": "Ask what made the experiment work.",
      "emma": "Try one activity and explain it simply.",
      "eliette": "Find the most colorful exhibit.",
      "jules": "Push buttons and test one science idea.",
      "momdad": "Useful if the family needs an interactive indoor stop."
    },
    "csvOrder": 10
  },
  {
    "id": "P1-011",
    "title": "Liberty Jail Historic Site",
    "name": "Liberty Jail Historic Site",
    "category": "Historic Site",
    "latitude": 39.2453,
    "longitude": -94.4183,
    "lat": 39.2453,
    "lon": -94.4183,
    "lng": -94.4183,
    "phase": "Phase 1",
    "routeSegment": "Kansas City Northland",
    "route_segment": "Kansas City Northland",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://history.churchofjesuschrist.org/subsection/historic-sites/missouri/liberty-jail",
    "official_website": "https://history.churchofjesuschrist.org/subsection/historic-sites/missouri/liberty-jail",
    "learnMoreUrl": "https://history.churchofjesuschrist.org/subsection/historic-sites/missouri/liberty-jail",
    "learn_more": "https://history.churchofjesuschrist.org/subsection/historic-sites/missouri/liberty-jail",
    "sourceUrl": "https://history.churchofjesuschrist.org/subsection/historic-sites/missouri/liberty-jail",
    "shortSummary": "Historic reconstruction and interpretation site in Liberty, Missouri.",
    "summary": "Historic reconstruction and interpretation site in Liberty, Missouri.",
    "whyItMatters": "Adds a religious-history and frontier-conflict layer near the route.",
    "why": "Adds a religious-history and frontier-conflict layer near the route.",
    "notes": {
      "elsie": "Consider how place shapes memory.",
      "katrina": "Ask why people preserve difficult places.",
      "emma": "Think about how communities tell history.",
      "eliette": "Look for small reconstructed details.",
      "jules": "Find the stone walls and count steps.",
      "momdad": "Adds a religious-history and frontier-conflict layer near the route."
    },
    "profiles": {
      "elsie": "Consider how place shapes memory.",
      "katrina": "Ask why people preserve difficult places.",
      "emma": "Think about how communities tell history.",
      "eliette": "Look for small reconstructed details.",
      "jules": "Find the stone walls and count steps.",
      "momdad": "Adds a religious-history and frontier-conflict layer near the route."
    },
    "csvOrder": 11
  },
  {
    "id": "P1-012",
    "title": "Jesse James Birthplace Museum",
    "name": "Jesse James Birthplace Museum",
    "category": "Historic Site",
    "latitude": 39.3032,
    "longitude": -94.361,
    "lat": 39.3032,
    "lon": -94.361,
    "lng": -94.361,
    "phase": "Phase 1",
    "routeSegment": "Kearney / Missouri",
    "route_segment": "Kearney / Missouri",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.jessejamesmuseum.org/",
    "official_website": "https://www.jessejamesmuseum.org/",
    "learnMoreUrl": "https://www.jessejamesmuseum.org/",
    "learn_more": "https://www.jessejamesmuseum.org/",
    "sourceUrl": "https://www.jessejamesmuseum.org/",
    "shortSummary": "Museum at the James family farm near Kearney.",
    "summary": "Museum at the James family farm near Kearney.",
    "whyItMatters": "Good route oddity/history stop tied to outlaw mythology.",
    "why": "Good route oddity/history stop tied to outlaw mythology.",
    "notes": {
      "elsie": "Separate legend from fact.",
      "katrina": "Ask how stories about outlaws get exaggerated.",
      "emma": "Notice how fame can come from bad choices.",
      "eliette": "Find one object that feels like a clue.",
      "jules": "Cowboy/outlaw mission with grown-up context.",
      "momdad": "Good route oddity/history stop tied to outlaw mythology."
    },
    "profiles": {
      "elsie": "Separate legend from fact.",
      "katrina": "Ask how stories about outlaws get exaggerated.",
      "emma": "Notice how fame can come from bad choices.",
      "eliette": "Find one object that feels like a clue.",
      "jules": "Cowboy/outlaw mission with grown-up context.",
      "momdad": "Good route oddity/history stop tied to outlaw mythology."
    },
    "csvOrder": 12
  },
  {
    "id": "P1-013",
    "title": "Watkins Woolen Mill State Historic Site",
    "name": "Watkins Woolen Mill State Historic Site",
    "category": "Historic Site",
    "latitude": 39.4992,
    "longitude": -94.0771,
    "lat": 39.4992,
    "lon": -94.0771,
    "lng": -94.0771,
    "phase": "Phase 1",
    "routeSegment": "Missouri I-70 region",
    "route_segment": "Missouri I-70 region",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://mostateparks.com/park/watkins-woolen-mill-state-park-and-state-historic-site",
    "official_website": "https://mostateparks.com/park/watkins-woolen-mill-state-park-and-state-historic-site",
    "learnMoreUrl": "https://mostateparks.com/park/watkins-woolen-mill-state-park-and-state-historic-site",
    "learn_more": "https://mostateparks.com/park/watkins-woolen-mill-state-park-and-state-historic-site",
    "sourceUrl": "https://mostateparks.com/park/watkins-woolen-mill-state-park-and-state-historic-site",
    "shortSummary": "Preserved 19th-century woolen mill and state historic site.",
    "summary": "Preserved 19th-century woolen mill and state historic site.",
    "whyItMatters": "Shows work, industry, and family life before modern factories.",
    "why": "Shows work, industry, and family life before modern factories.",
    "notes": {
      "elsie": "Compare old machines to modern manufacturing.",
      "katrina": "Ask how clothing was made before big stores.",
      "emma": "Connect work, water, machines, and daily life.",
      "eliette": "Look for textures: wool, wood, gears.",
      "jules": "Machine mission: find wheels and belts.",
      "momdad": "Shows work, industry, and family life before modern factories."
    },
    "profiles": {
      "elsie": "Compare old machines to modern manufacturing.",
      "katrina": "Ask how clothing was made before big stores.",
      "emma": "Connect work, water, machines, and daily life.",
      "eliette": "Look for textures: wool, wood, gears.",
      "jules": "Machine mission: find wheels and belts.",
      "momdad": "Shows work, industry, and family life before modern factories."
    },
    "csvOrder": 13
  },
  {
    "id": "P1-014",
    "title": "Battle of Lexington State Historic Site",
    "name": "Battle of Lexington State Historic Site",
    "category": "Civil War Site",
    "latitude": 39.1833,
    "longitude": -93.8811,
    "lat": 39.1833,
    "lon": -93.8811,
    "lng": -93.8811,
    "phase": "Phase 1",
    "routeSegment": "Lexington / Missouri",
    "route_segment": "Lexington / Missouri",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://mostateparks.com/park/battle-lexington-state-historic-site",
    "official_website": "https://mostateparks.com/park/battle-lexington-state-historic-site",
    "learnMoreUrl": "https://mostateparks.com/park/battle-lexington-state-historic-site",
    "learn_more": "https://mostateparks.com/park/battle-lexington-state-historic-site",
    "sourceUrl": "https://mostateparks.com/park/battle-lexington-state-historic-site",
    "shortSummary": "Civil War battlefield site in Lexington, Missouri.",
    "summary": "Civil War battlefield site in Lexington, Missouri.",
    "whyItMatters": "Adds Missouri Civil War context along the outbound corridor.",
    "why": "Adds Missouri Civil War context along the outbound corridor.",
    "notes": {
      "elsie": "Think about how geography affected battles.",
      "katrina": "Ask why Missouri was so divided.",
      "emma": "Notice how towns remember conflict.",
      "eliette": "Find a cannon or marker detail.",
      "jules": "Look for big open spaces and flags.",
      "momdad": "Adds Missouri Civil War context along the outbound corridor."
    },
    "profiles": {
      "elsie": "Think about how geography affected battles.",
      "katrina": "Ask why Missouri was so divided.",
      "emma": "Notice how towns remember conflict.",
      "eliette": "Find a cannon or marker detail.",
      "jules": "Look for big open spaces and flags.",
      "momdad": "Adds Missouri Civil War context along the outbound corridor."
    },
    "csvOrder": 14
  },
  {
    "id": "P1-015",
    "title": "Warm Springs Ranch",
    "name": "Warm Springs Ranch",
    "category": "Family Attraction",
    "latitude": 38.8956,
    "longitude": -92.7282,
    "lat": 38.8956,
    "lon": -92.7282,
    "lng": -92.7282,
    "phase": "Phase 1",
    "routeSegment": "Boonville / Missouri",
    "route_segment": "Boonville / Missouri",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.warmspringsranch.com/",
    "official_website": "https://www.warmspringsranch.com/",
    "learnMoreUrl": "https://www.warmspringsranch.com/",
    "learn_more": "https://www.warmspringsranch.com/",
    "sourceUrl": "https://www.warmspringsranch.com/",
    "shortSummary": "Home of the Budweiser Clydesdales breeding operation near Boonville.",
    "summary": "Home of the Budweiser Clydesdales breeding operation near Boonville.",
    "whyItMatters": "Great family animal stop near the I-70 corridor.",
    "why": "Great family animal stop near the I-70 corridor.",
    "notes": {
      "elsie": "Watch how large animals are cared for.",
      "katrina": "Ask what jobs people do at a horse ranch.",
      "emma": "Notice routines, feeding, and teamwork.",
      "eliette": "Find the best horse detail.",
      "jules": "Big horse mission.",
      "momdad": "Great family animal stop near the I-70 corridor."
    },
    "profiles": {
      "elsie": "Watch how large animals are cared for.",
      "katrina": "Ask what jobs people do at a horse ranch.",
      "emma": "Notice routines, feeding, and teamwork.",
      "eliette": "Find the best horse detail.",
      "jules": "Big horse mission.",
      "momdad": "Great family animal stop near the I-70 corridor."
    },
    "csvOrder": 15
  },
  {
    "id": "P1-016",
    "title": "Rocheport Historic District",
    "name": "Rocheport Historic District",
    "category": "Small Town",
    "latitude": 38.9809,
    "longitude": -92.5615,
    "lat": 38.9809,
    "lon": -92.5615,
    "lng": -92.5615,
    "phase": "Phase 1",
    "routeSegment": "Rocheport / Missouri",
    "route_segment": "Rocheport / Missouri",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.rocheport.com/",
    "official_website": "https://www.rocheport.com/",
    "learnMoreUrl": "https://www.rocheport.com/",
    "learn_more": "https://www.rocheport.com/",
    "sourceUrl": "https://www.rocheport.com/",
    "shortSummary": "Historic Missouri River town near the Katy Trail.",
    "summary": "Historic Missouri River town near the Katy Trail.",
    "whyItMatters": "Strong scenic reset with river-town character.",
    "why": "Strong scenic reset with river-town character.",
    "notes": {
      "elsie": "Notice how rivers shape towns.",
      "katrina": "Ask why trails and rivers attract people.",
      "emma": "Compare small-town routines with city life.",
      "eliette": "Look for signs, shops, and textures.",
      "jules": "River-town walk mission.",
      "momdad": "Strong scenic reset with river-town character."
    },
    "profiles": {
      "elsie": "Notice how rivers shape towns.",
      "katrina": "Ask why trails and rivers attract people.",
      "emma": "Compare small-town routines with city life.",
      "eliette": "Look for signs, shops, and textures.",
      "jules": "River-town walk mission.",
      "momdad": "Strong scenic reset with river-town character."
    },
    "csvOrder": 16
  },
  {
    "id": "P1-017",
    "title": "Katy Trail State Park - Rocheport Trailhead",
    "name": "Katy Trail State Park - Rocheport Trailhead",
    "category": "State Park",
    "latitude": 38.9804,
    "longitude": -92.5605,
    "lat": 38.9804,
    "lon": -92.5605,
    "lng": -92.5605,
    "phase": "Phase 1",
    "routeSegment": "Rocheport / Missouri",
    "route_segment": "Rocheport / Missouri",
    "tier": "Core",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://mostateparks.com/park/katy-trail-state-park",
    "official_website": "https://mostateparks.com/park/katy-trail-state-park",
    "learnMoreUrl": "https://mostateparks.com/park/katy-trail-state-park",
    "learn_more": "https://mostateparks.com/park/katy-trail-state-park",
    "sourceUrl": "https://mostateparks.com/park/katy-trail-state-park",
    "shortSummary": "Trailhead on Missouri's long rail-trail park.",
    "summary": "Trailhead on Missouri's long rail-trail park.",
    "whyItMatters": "Great stretch-your-legs route stop with river and rail history.",
    "why": "Great stretch-your-legs route stop with river and rail history.",
    "notes": {
      "elsie": "Connect old rail lines to new trails.",
      "katrina": "Ask why old transportation routes get reused.",
      "emma": "Notice walkers, cyclists, and town life.",
      "eliette": "Find a trail marker or bridge detail.",
      "jules": "Trail mission: walk to a sign and back.",
      "momdad": "Great stretch-your-legs route stop with river and rail history."
    },
    "profiles": {
      "elsie": "Connect old rail lines to new trails.",
      "katrina": "Ask why old transportation routes get reused.",
      "emma": "Notice walkers, cyclists, and town life.",
      "eliette": "Find a trail marker or bridge detail.",
      "jules": "Trail mission: walk to a sign and back.",
      "momdad": "Great stretch-your-legs route stop with river and rail history."
    },
    "csvOrder": 17
  },
  {
    "id": "P1-018",
    "title": "Shelter Gardens",
    "name": "Shelter Gardens",
    "category": "Garden",
    "latitude": 38.951,
    "longitude": -92.3677,
    "lat": 38.951,
    "lon": -92.3677,
    "lng": -92.3677,
    "phase": "Phase 1",
    "routeSegment": "Columbia / Missouri",
    "route_segment": "Columbia / Missouri",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://www.shelterinsurance.com/aboutshelter/sheltergardens/",
    "official_website": "https://www.shelterinsurance.com/aboutshelter/sheltergardens/",
    "learnMoreUrl": "https://www.shelterinsurance.com/aboutshelter/sheltergardens/",
    "learn_more": "https://www.shelterinsurance.com/aboutshelter/sheltergardens/",
    "sourceUrl": "https://www.shelterinsurance.com/aboutshelter/sheltergardens/",
    "shortSummary": "Public garden in Columbia, Missouri.",
    "summary": "Public garden in Columbia, Missouri.",
    "whyItMatters": "Short, calm reset on a long drive day.",
    "why": "Short, calm reset on a long drive day.",
    "notes": {
      "elsie": "Look for plant design and animal habitats.",
      "katrina": "Ask what makes a garden peaceful.",
      "emma": "Pick a favorite path or flower.",
      "eliette": "Find a tiny detail others miss.",
      "jules": "Flower and fountain mission.",
      "momdad": "Short, calm reset on a long drive day."
    },
    "profiles": {
      "elsie": "Look for plant design and animal habitats.",
      "katrina": "Ask what makes a garden peaceful.",
      "emma": "Pick a favorite path or flower.",
      "eliette": "Find a tiny detail others miss.",
      "jules": "Flower and fountain mission.",
      "momdad": "Short, calm reset on a long drive day."
    },
    "csvOrder": 18
  },
  {
    "id": "P1-019",
    "title": "University of Missouri / Faurot Field",
    "name": "University of Missouri / Faurot Field",
    "category": "College Landmark",
    "latitude": 38.9358,
    "longitude": -92.3333,
    "lat": 38.9358,
    "lon": -92.3333,
    "lng": -92.3333,
    "phase": "Phase 1",
    "routeSegment": "Columbia / Missouri",
    "route_segment": "Columbia / Missouri",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://mutigers.com/",
    "official_website": "https://mutigers.com/",
    "learnMoreUrl": "https://mutigers.com/",
    "learn_more": "https://mutigers.com/",
    "sourceUrl": "https://mutigers.com/",
    "shortSummary": "University of Missouri sports landmark in Columbia.",
    "summary": "University of Missouri sports landmark in Columbia.",
    "whyItMatters": "Adds college-town and sports context near the route.",
    "why": "Adds college-town and sports context near the route.",
    "notes": {
      "elsie": "Think about traditions and school identity.",
      "katrina": "Ask what makes a college town feel different.",
      "emma": "Sports and community lens.",
      "eliette": "Look for logos and colors.",
      "jules": "Tiger spotting mission.",
      "momdad": "Adds college-town and sports context near the route."
    },
    "profiles": {
      "elsie": "Think about traditions and school identity.",
      "katrina": "Ask what makes a college town feel different.",
      "emma": "Sports and community lens.",
      "eliette": "Look for logos and colors.",
      "jules": "Tiger spotting mission.",
      "momdad": "Adds college-town and sports context near the route."
    },
    "csvOrder": 19
  },
  {
    "id": "P1-020",
    "title": "Missouri State Capitol",
    "name": "Missouri State Capitol",
    "category": "Historic Site",
    "latitude": 38.5767,
    "longitude": -92.1735,
    "lat": 38.5767,
    "lon": -92.1735,
    "lng": -92.1735,
    "phase": "Phase 1",
    "routeSegment": "Jefferson City / Missouri",
    "route_segment": "Jefferson City / Missouri",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://capitol.mo.gov/",
    "official_website": "https://capitol.mo.gov/",
    "learnMoreUrl": "https://capitol.mo.gov/",
    "learn_more": "https://capitol.mo.gov/",
    "sourceUrl": "https://capitol.mo.gov/",
    "shortSummary": "Missouri's state capitol building in Jefferson City.",
    "summary": "Missouri's state capitol building in Jefferson City.",
    "whyItMatters": "Excellent government and architecture stop on the Missouri segment.",
    "why": "Excellent government and architecture stop on the Missouri segment.",
    "notes": {
      "elsie": "Consider how public buildings communicate power.",
      "katrina": "Ask what happens in a capitol.",
      "emma": "Connect laws to daily life.",
      "eliette": "Look for murals, columns, and symbols.",
      "jules": "Big dome mission.",
      "momdad": "Excellent government and architecture stop on the Missouri segment."
    },
    "profiles": {
      "elsie": "Consider how public buildings communicate power.",
      "katrina": "Ask what happens in a capitol.",
      "emma": "Connect laws to daily life.",
      "eliette": "Look for murals, columns, and symbols.",
      "jules": "Big dome mission.",
      "momdad": "Excellent government and architecture stop on the Missouri segment."
    },
    "csvOrder": 20
  },
  {
    "id": "P1-021",
    "title": "Missouri State Penitentiary",
    "name": "Missouri State Penitentiary",
    "category": "History Museum",
    "latitude": 38.5689,
    "longitude": -92.173,
    "lat": 38.5689,
    "lon": -92.173,
    "lng": -92.173,
    "phase": "Phase 1",
    "routeSegment": "Jefferson City / Missouri",
    "route_segment": "Jefferson City / Missouri",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.missouripentours.com/",
    "official_website": "https://www.missouripentours.com/",
    "learnMoreUrl": "https://www.missouripentours.com/",
    "learn_more": "https://www.missouripentours.com/",
    "sourceUrl": "https://www.missouripentours.com/",
    "shortSummary": "Historic former prison with guided tours.",
    "summary": "Historic former prison with guided tours.",
    "whyItMatters": "Memorable, older-kid history stop with strong storytelling.",
    "why": "Memorable, older-kid history stop with strong storytelling.",
    "notes": {
      "elsie": "Think about justice, reform, and time.",
      "katrina": "Ask how prisons have changed.",
      "emma": "Compare rules, jobs, and daily routines.",
      "eliette": "Find a detail that feels like a movie set.",
      "jules": "Big door and hallway mission.",
      "momdad": "Memorable, older-kid history stop with strong storytelling."
    },
    "profiles": {
      "elsie": "Think about justice, reform, and time.",
      "katrina": "Ask how prisons have changed.",
      "emma": "Compare rules, jobs, and daily routines.",
      "eliette": "Find a detail that feels like a movie set.",
      "jules": "Big door and hallway mission.",
      "momdad": "Memorable, older-kid history stop with strong storytelling."
    },
    "csvOrder": 21
  },
  {
    "id": "P1-022",
    "title": "Arrow Rock State Historic Site",
    "name": "Arrow Rock State Historic Site",
    "category": "Historic Site",
    "latitude": 39.0687,
    "longitude": -92.9474,
    "lat": 39.0687,
    "lon": -92.9474,
    "lng": -92.9474,
    "phase": "Phase 1",
    "routeSegment": "Arrow Rock / Missouri",
    "route_segment": "Arrow Rock / Missouri",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://mostateparks.com/historic-site/arrow-rock-state-historic-site",
    "official_website": "https://mostateparks.com/historic-site/arrow-rock-state-historic-site",
    "learnMoreUrl": "https://mostateparks.com/historic-site/arrow-rock-state-historic-site",
    "learn_more": "https://mostateparks.com/historic-site/arrow-rock-state-historic-site",
    "sourceUrl": "https://mostateparks.com/historic-site/arrow-rock-state-historic-site",
    "shortSummary": "Preserved Missouri River village and state historic site.",
    "summary": "Preserved Missouri River village and state historic site.",
    "whyItMatters": "A strong historic small-town detour with frontier context.",
    "why": "A strong historic small-town detour with frontier context.",
    "notes": {
      "elsie": "Notice how old towns preserve stories.",
      "katrina": "Ask why this town mattered near the river.",
      "emma": "Compare old and new community life.",
      "eliette": "Look for old buildings and signs.",
      "jules": "Old town exploring mission.",
      "momdad": "A strong historic small-town detour with frontier context."
    },
    "profiles": {
      "elsie": "Notice how old towns preserve stories.",
      "katrina": "Ask why this town mattered near the river.",
      "emma": "Compare old and new community life.",
      "eliette": "Look for old buildings and signs.",
      "jules": "Old town exploring mission.",
      "momdad": "A strong historic small-town detour with frontier context."
    },
    "csvOrder": 22
  },
  {
    "id": "P1-023",
    "title": "Gateway Arch National Park",
    "name": "Gateway Arch National Park",
    "category": "National Park",
    "latitude": 38.6247,
    "longitude": -90.1848,
    "lat": 38.6247,
    "lon": -90.1848,
    "lng": -90.1848,
    "phase": "Phase 1",
    "routeSegment": "St. Louis / Missouri",
    "route_segment": "St. Louis / Missouri",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.nps.gov/jeff/",
    "official_website": "https://www.nps.gov/jeff/",
    "learnMoreUrl": "https://www.nps.gov/jeff/",
    "learn_more": "https://www.nps.gov/jeff/",
    "sourceUrl": "https://www.nps.gov/jeff/",
    "shortSummary": "National park centered on the Gateway Arch and westward expansion.",
    "summary": "National park centered on the Gateway Arch and westward expansion.",
    "whyItMatters": "Major visual landmark and NPS anchor on the route.",
    "why": "Major visual landmark and NPS anchor on the route.",
    "notes": {
      "elsie": "Think about the symbolism of a gateway.",
      "katrina": "Ask why expansion stories are complicated.",
      "emma": "Connect rivers, cities, and travel.",
      "eliette": "Find the best photo angle.",
      "jules": "Giant arch mission.",
      "momdad": "Major visual landmark and NPS anchor on the route."
    },
    "profiles": {
      "elsie": "Think about the symbolism of a gateway.",
      "katrina": "Ask why expansion stories are complicated.",
      "emma": "Connect rivers, cities, and travel.",
      "eliette": "Find the best photo angle.",
      "jules": "Giant arch mission.",
      "momdad": "Major visual landmark and NPS anchor on the route."
    },
    "csvOrder": 23
  },
  {
    "id": "P1-024",
    "title": "City Museum St. Louis",
    "name": "City Museum St. Louis",
    "category": "Roadside Oddity",
    "latitude": 38.6336,
    "longitude": -90.2004,
    "lat": 38.6336,
    "lon": -90.2004,
    "lng": -90.2004,
    "phase": "Phase 1",
    "routeSegment": "St. Louis / Missouri",
    "route_segment": "St. Louis / Missouri",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://citymuseum.org/",
    "official_website": "https://citymuseum.org/",
    "learnMoreUrl": "https://citymuseum.org/",
    "learn_more": "https://citymuseum.org/",
    "sourceUrl": "https://citymuseum.org/",
    "shortSummary": "Highly unusual interactive museum/play structure in St. Louis.",
    "summary": "Highly unusual interactive museum/play structure in St. Louis.",
    "whyItMatters": "One of the best oddball family stops on the route.",
    "why": "One of the best oddball family stops on the route.",
    "notes": {
      "elsie": "Notice how recycled objects become art.",
      "katrina": "Ask why weird design is memorable.",
      "emma": "Move, climb, and compare spaces.",
      "eliette": "Find the strangest detail.",
      "jules": "Climb-and-find mission.",
      "momdad": "One of the best oddball family stops on the route."
    },
    "profiles": {
      "elsie": "Notice how recycled objects become art.",
      "katrina": "Ask why weird design is memorable.",
      "emma": "Move, climb, and compare spaces.",
      "eliette": "Find the strangest detail.",
      "jules": "Climb-and-find mission.",
      "momdad": "One of the best oddball family stops on the route."
    },
    "csvOrder": 24
  },
  {
    "id": "P1-025",
    "title": "Missouri Botanical Garden",
    "name": "Missouri Botanical Garden",
    "category": "Garden",
    "latitude": 38.6156,
    "longitude": -90.258,
    "lat": 38.6156,
    "lon": -90.258,
    "lng": -90.258,
    "phase": "Phase 1",
    "routeSegment": "St. Louis / Missouri",
    "route_segment": "St. Louis / Missouri",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.missouribotanicalgarden.org/",
    "official_website": "https://www.missouribotanicalgarden.org/",
    "learnMoreUrl": "https://www.missouribotanicalgarden.org/",
    "learn_more": "https://www.missouribotanicalgarden.org/",
    "sourceUrl": "https://www.missouribotanicalgarden.org/",
    "shortSummary": "Major botanical garden in St. Louis.",
    "summary": "Major botanical garden in St. Louis.",
    "whyItMatters": "Good calmer alternative to downtown attractions.",
    "why": "Good calmer alternative to downtown attractions.",
    "notes": {
      "elsie": "Look for ecosystems and plant design.",
      "katrina": "Ask why plant conservation matters.",
      "emma": "Connect plants to food, weather, and health.",
      "eliette": "Find a tiny flower or pattern.",
      "jules": "Garden path mission.",
      "momdad": "Good calmer alternative to downtown attractions."
    },
    "profiles": {
      "elsie": "Look for ecosystems and plant design.",
      "katrina": "Ask why plant conservation matters.",
      "emma": "Connect plants to food, weather, and health.",
      "eliette": "Find a tiny flower or pattern.",
      "jules": "Garden path mission.",
      "momdad": "Good calmer alternative to downtown attractions."
    },
    "csvOrder": 25
  },
  {
    "id": "P1-026",
    "title": "Saint Louis Zoo",
    "name": "Saint Louis Zoo",
    "category": "Zoo",
    "latitude": 38.6365,
    "longitude": -90.2946,
    "lat": 38.6365,
    "lon": -90.2946,
    "lng": -90.2946,
    "phase": "Phase 1",
    "routeSegment": "St. Louis / Missouri",
    "route_segment": "St. Louis / Missouri",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://stlzoo.org/",
    "official_website": "https://stlzoo.org/",
    "learnMoreUrl": "https://stlzoo.org/",
    "learn_more": "https://stlzoo.org/",
    "sourceUrl": "https://stlzoo.org/",
    "shortSummary": "Large free-admission zoo in Forest Park.",
    "summary": "Large free-admission zoo in Forest Park.",
    "whyItMatters": "Strong kid-friendly stop if time allows.",
    "why": "Strong kid-friendly stop if time allows.",
    "notes": {
      "elsie": "Think about conservation and animal habitats.",
      "katrina": "Ask why zoos protect endangered animals.",
      "emma": "Pick an animal and describe its routine.",
      "eliette": "Find colors, patterns, and animal details.",
      "jules": "Animal spotting mission.",
      "momdad": "Strong kid-friendly stop if time allows."
    },
    "profiles": {
      "elsie": "Think about conservation and animal habitats.",
      "katrina": "Ask why zoos protect endangered animals.",
      "emma": "Pick an animal and describe its routine.",
      "eliette": "Find colors, patterns, and animal details.",
      "jules": "Animal spotting mission.",
      "momdad": "Strong kid-friendly stop if time allows."
    },
    "csvOrder": 26
  },
  {
    "id": "P1-027",
    "title": "Cahokia Mounds State Historic Site",
    "name": "Cahokia Mounds State Historic Site",
    "category": "Historic Site",
    "latitude": 38.6551,
    "longitude": -90.0618,
    "lat": 38.6551,
    "lon": -90.0618,
    "lng": -90.0618,
    "phase": "Phase 1",
    "routeSegment": "Collinsville / Illinois",
    "route_segment": "Collinsville / Illinois",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://cahokiamounds.org/",
    "official_website": "https://cahokiamounds.org/",
    "learnMoreUrl": "https://cahokiamounds.org/",
    "learn_more": "https://cahokiamounds.org/",
    "sourceUrl": "https://cahokiamounds.org/",
    "shortSummary": "Major Mississippian cultural site near St. Louis.",
    "summary": "Major Mississippian cultural site near St. Louis.",
    "whyItMatters": "Important Native American history stop just east of the Mississippi.",
    "why": "Important Native American history stop just east of the Mississippi.",
    "notes": {
      "elsie": "Think about cities before modern America.",
      "katrina": "Ask how people built and organized Cahokia.",
      "emma": "Connect food, trade, and community.",
      "eliette": "Look for mound shapes and landscape clues.",
      "jules": "Big hill mission.",
      "momdad": "Important Native American history stop just east of the Mississippi."
    },
    "profiles": {
      "elsie": "Think about cities before modern America.",
      "katrina": "Ask how people built and organized Cahokia.",
      "emma": "Connect food, trade, and community.",
      "eliette": "Look for mound shapes and landscape clues.",
      "jules": "Big hill mission.",
      "momdad": "Important Native American history stop just east of the Mississippi."
    },
    "csvOrder": 27
  },
  {
    "id": "P1-028",
    "title": "Lincoln Home National Historic Site",
    "name": "Lincoln Home National Historic Site",
    "category": "National Historic Site",
    "latitude": 39.7975,
    "longitude": -89.645,
    "lat": 39.7975,
    "lon": -89.645,
    "lng": -89.645,
    "phase": "Phase 1",
    "routeSegment": "Springfield / Illinois",
    "route_segment": "Springfield / Illinois",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.nps.gov/liho/",
    "official_website": "https://www.nps.gov/liho/",
    "learnMoreUrl": "https://www.nps.gov/liho/",
    "learn_more": "https://www.nps.gov/liho/",
    "sourceUrl": "https://www.nps.gov/liho/",
    "shortSummary": "National Park Service site preserving Abraham Lincoln's Springfield home.",
    "summary": "National Park Service site preserving Abraham Lincoln's Springfield home.",
    "whyItMatters": "Strong presidential-history anchor on the Illinois corridor.",
    "why": "Strong presidential-history anchor on the Illinois corridor.",
    "notes": {
      "elsie": "Consider Lincoln as a person before president.",
      "katrina": "Ask how a home can tell history.",
      "emma": "Compare old family routines to today.",
      "eliette": "Find household details and street clues.",
      "jules": "President house mission.",
      "momdad": "Strong presidential-history anchor on the Illinois corridor."
    },
    "profiles": {
      "elsie": "Consider Lincoln as a person before president.",
      "katrina": "Ask how a home can tell history.",
      "emma": "Compare old family routines to today.",
      "eliette": "Find household details and street clues.",
      "jules": "President house mission.",
      "momdad": "Strong presidential-history anchor on the Illinois corridor."
    },
    "csvOrder": 28
  },
  {
    "id": "P1-029",
    "title": "Abraham Lincoln Presidential Library and Museum",
    "name": "Abraham Lincoln Presidential Library and Museum",
    "category": "Museum",
    "latitude": 39.8018,
    "longitude": -89.6486,
    "lat": 39.8018,
    "lon": -89.6486,
    "lng": -89.6486,
    "phase": "Phase 1",
    "routeSegment": "Springfield / Illinois",
    "route_segment": "Springfield / Illinois",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://presidentlincoln.illinois.gov/",
    "official_website": "https://presidentlincoln.illinois.gov/",
    "learnMoreUrl": "https://presidentlincoln.illinois.gov/",
    "learn_more": "https://presidentlincoln.illinois.gov/",
    "sourceUrl": "https://presidentlincoln.illinois.gov/",
    "shortSummary": "Major museum focused on Abraham Lincoln's life and presidency.",
    "summary": "Major museum focused on Abraham Lincoln's life and presidency.",
    "whyItMatters": "High-value indoor history stop for the route.",
    "why": "High-value indoor history stop for the route.",
    "notes": {
      "elsie": "Trace Lincoln's life arc.",
      "katrina": "Ask how leaders make choices under pressure.",
      "emma": "Connect leadership to everyday decisions.",
      "eliette": "Find the most dramatic exhibit.",
      "jules": "Lincoln story mission.",
      "momdad": "High-value indoor history stop for the route."
    },
    "profiles": {
      "elsie": "Trace Lincoln's life arc.",
      "katrina": "Ask how leaders make choices under pressure.",
      "emma": "Connect leadership to everyday decisions.",
      "eliette": "Find the most dramatic exhibit.",
      "jules": "Lincoln story mission.",
      "momdad": "High-value indoor history stop for the route."
    },
    "csvOrder": 29
  },
  {
    "id": "P1-030",
    "title": "Pontiac Route 66 Hall of Fame & Museum",
    "name": "Pontiac Route 66 Hall of Fame & Museum",
    "category": "Roadside History",
    "latitude": 40.8793,
    "longitude": -88.6298,
    "lat": 40.8793,
    "lon": -88.6298,
    "lng": -88.6298,
    "phase": "Phase 1",
    "routeSegment": "Pontiac / Illinois",
    "route_segment": "Pontiac / Illinois",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://visitpontiac.org/experience/museums-exhibits/route-66-museum/",
    "official_website": "https://visitpontiac.org/experience/museums-exhibits/route-66-museum/",
    "learnMoreUrl": "https://visitpontiac.org/experience/museums-exhibits/route-66-museum/",
    "learn_more": "https://visitpontiac.org/experience/museums-exhibits/route-66-museum/",
    "sourceUrl": "https://visitpontiac.org/experience/museums-exhibits/route-66-museum/",
    "shortSummary": "Route 66 museum and photo stop in Pontiac, Illinois.",
    "summary": "Route 66 museum and photo stop in Pontiac, Illinois.",
    "whyItMatters": "Good road-trip meta stop about America's driving culture.",
    "why": "Good road-trip meta stop about America's driving culture.",
    "notes": {
      "elsie": "Compare old road trips with this one.",
      "katrina": "Ask why Route 66 became famous.",
      "emma": "Notice signs, cars, maps, and travel ads.",
      "eliette": "Find the best vintage sign.",
      "jules": "Road sign mission.",
      "momdad": "Good road-trip meta stop about America's driving culture."
    },
    "profiles": {
      "elsie": "Compare old road trips with this one.",
      "katrina": "Ask why Route 66 became famous.",
      "emma": "Notice signs, cars, maps, and travel ads.",
      "eliette": "Find the best vintage sign.",
      "jules": "Road sign mission.",
      "momdad": "Good road-trip meta stop about America's driving culture."
    },
    "csvOrder": 30
  },
  {
    "id": "P1-031",
    "title": "Old Joliet Prison",
    "name": "Old Joliet Prison",
    "category": "Historic Site",
    "latitude": 41.535,
    "longitude": -88.0817,
    "lat": 41.535,
    "lon": -88.0817,
    "lng": -88.0817,
    "phase": "Phase 1",
    "routeSegment": "Joliet / Illinois",
    "route_segment": "Joliet / Illinois",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.jolietprison.org/",
    "official_website": "https://www.jolietprison.org/",
    "learnMoreUrl": "https://www.jolietprison.org/",
    "learn_more": "https://www.jolietprison.org/",
    "sourceUrl": "https://www.jolietprison.org/",
    "shortSummary": "Historic prison site known for tours and filming history.",
    "summary": "Historic prison site known for tours and filming history.",
    "whyItMatters": "Memorable odd-history stop near the route.",
    "why": "Memorable odd-history stop near the route.",
    "notes": {
      "elsie": "Think about places changing purpose over time.",
      "katrina": "Ask why old buildings become tourist sites.",
      "emma": "Connect rules, history, and storytelling.",
      "eliette": "Find movie-like details.",
      "jules": "Big wall mission.",
      "momdad": "Memorable odd-history stop near the route."
    },
    "profiles": {
      "elsie": "Think about places changing purpose over time.",
      "katrina": "Ask why old buildings become tourist sites.",
      "emma": "Connect rules, history, and storytelling.",
      "eliette": "Find movie-like details.",
      "jules": "Big wall mission.",
      "momdad": "Memorable odd-history stop near the route."
    },
    "csvOrder": 31
  },
  {
    "id": "P1-032",
    "title": "Indiana Dunes National Park",
    "name": "Indiana Dunes National Park",
    "category": "National Park",
    "latitude": 41.6533,
    "longitude": -87.0524,
    "lat": 41.6533,
    "lon": -87.0524,
    "lng": -87.0524,
    "phase": "Phase 1",
    "routeSegment": "Northern Indiana",
    "route_segment": "Northern Indiana",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.nps.gov/indu/",
    "official_website": "https://www.nps.gov/indu/",
    "learnMoreUrl": "https://www.nps.gov/indu/",
    "learn_more": "https://www.nps.gov/indu/",
    "sourceUrl": "https://www.nps.gov/indu/",
    "shortSummary": "National park along Lake Michigan's southern shore.",
    "summary": "National park along Lake Michigan's southern shore.",
    "whyItMatters": "Major nature anchor before South Bend.",
    "why": "Major nature anchor before South Bend.",
    "notes": {
      "elsie": "Notice dunes, water, plants, and birds.",
      "katrina": "Ask how wind and water make dunes.",
      "emma": "Connect lake weather to daily plans.",
      "eliette": "Find sand patterns and beach textures.",
      "jules": "Giant sand hill mission.",
      "momdad": "Major nature anchor before South Bend."
    },
    "profiles": {
      "elsie": "Notice dunes, water, plants, and birds.",
      "katrina": "Ask how wind and water make dunes.",
      "emma": "Connect lake weather to daily plans.",
      "eliette": "Find sand patterns and beach textures.",
      "jules": "Giant sand hill mission.",
      "momdad": "Major nature anchor before South Bend."
    },
    "csvOrder": 32
  },
  {
    "id": "P1-033",
    "title": "University of Notre Dame",
    "name": "University of Notre Dame",
    "category": "Historic Campus",
    "latitude": 41.7056,
    "longitude": -86.2353,
    "lat": 41.7056,
    "lon": -86.2353,
    "lng": -86.2353,
    "phase": "Phase 1",
    "routeSegment": "South Bend / Indiana",
    "route_segment": "South Bend / Indiana",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.nd.edu/",
    "official_website": "https://www.nd.edu/",
    "learnMoreUrl": "https://www.nd.edu/",
    "learn_more": "https://www.nd.edu/",
    "sourceUrl": "https://www.nd.edu/",
    "shortSummary": "Historic university campus and South Bend overnight anchor.",
    "summary": "Historic university campus and South Bend overnight anchor.",
    "whyItMatters": "Strong overnight-area stop with sports, architecture, and Catholic context.",
    "why": "Strong overnight-area stop with sports, architecture, and Catholic context.",
    "notes": {
      "elsie": "Notice campus symbols and architecture.",
      "katrina": "Ask why traditions make places famous.",
      "emma": "Sports, school, and community lens.",
      "eliette": "Look for gold, stone, and signs.",
      "jules": "Football campus mission.",
      "momdad": "Strong overnight-area stop with sports, architecture, and Catholic context."
    },
    "profiles": {
      "elsie": "Notice campus symbols and architecture.",
      "katrina": "Ask why traditions make places famous.",
      "emma": "Sports, school, and community lens.",
      "eliette": "Look for gold, stone, and signs.",
      "jules": "Football campus mission.",
      "momdad": "Strong overnight-area stop with sports, architecture, and Catholic context."
    },
    "csvOrder": 33
  },
  {
    "id": "P1-034",
    "title": "Basilica of the Sacred Heart",
    "name": "Basilica of the Sacred Heart",
    "category": "Historic Church",
    "latitude": 41.7037,
    "longitude": -86.2375,
    "lat": 41.7037,
    "lon": -86.2375,
    "lng": -86.2375,
    "phase": "Phase 1",
    "routeSegment": "South Bend / Indiana",
    "route_segment": "South Bend / Indiana",
    "tier": "Core",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://basilica.nd.edu/",
    "official_website": "https://basilica.nd.edu/",
    "learnMoreUrl": "https://basilica.nd.edu/",
    "learn_more": "https://basilica.nd.edu/",
    "sourceUrl": "https://basilica.nd.edu/",
    "shortSummary": "Historic basilica on Notre Dame's campus.",
    "summary": "Historic basilica on Notre Dame's campus.",
    "whyItMatters": "Short, meaningful architecture and faith stop.",
    "why": "Short, meaningful architecture and faith stop.",
    "notes": {
      "elsie": "Think about sacred space and design.",
      "katrina": "Ask why churches use art and symbols.",
      "emma": "Notice quiet routines and respect.",
      "eliette": "Find stained glass details.",
      "jules": "Quiet looking mission.",
      "momdad": "Short, meaningful architecture and faith stop."
    },
    "profiles": {
      "elsie": "Think about sacred space and design.",
      "katrina": "Ask why churches use art and symbols.",
      "emma": "Notice quiet routines and respect.",
      "eliette": "Find stained glass details.",
      "jules": "Quiet looking mission.",
      "momdad": "Short, meaningful architecture and faith stop."
    },
    "csvOrder": 34
  },
  {
    "id": "P1-035",
    "title": "Studebaker National Museum",
    "name": "Studebaker National Museum",
    "category": "Museum",
    "latitude": 41.6698,
    "longitude": -86.2513,
    "lat": 41.6698,
    "lon": -86.2513,
    "lng": -86.2513,
    "phase": "Phase 1",
    "routeSegment": "South Bend / Indiana",
    "route_segment": "South Bend / Indiana",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://studebakermuseum.org/",
    "official_website": "https://studebakermuseum.org/",
    "learnMoreUrl": "https://studebakermuseum.org/",
    "learn_more": "https://studebakermuseum.org/",
    "sourceUrl": "https://studebakermuseum.org/",
    "shortSummary": "Vehicle museum preserving Studebaker history.",
    "summary": "Vehicle museum preserving Studebaker history.",
    "whyItMatters": "Great South Bend stop tying vehicles to American industry.",
    "why": "Great South Bend stop tying vehicles to American industry.",
    "notes": {
      "elsie": "Track wagons to cars to modern travel.",
      "katrina": "Ask how companies adapt over time.",
      "emma": "Connect transportation to daily life.",
      "eliette": "Find logos, colors, and details.",
      "jules": "Car and wheel mission.",
      "momdad": "Great South Bend stop tying vehicles to American industry."
    },
    "profiles": {
      "elsie": "Track wagons to cars to modern travel.",
      "katrina": "Ask how companies adapt over time.",
      "emma": "Connect transportation to daily life.",
      "eliette": "Find logos, colors, and details.",
      "jules": "Car and wheel mission.",
      "momdad": "Great South Bend stop tying vehicles to American industry."
    },
    "csvOrder": 35
  },
  {
    "id": "P2-001",
    "title": "South Bend Chocolate Company",
    "name": "South Bend Chocolate Company",
    "category": "Food Stop",
    "latitude": 41.6766,
    "longitude": -86.252,
    "lat": 41.6766,
    "lon": -86.252,
    "lng": -86.252,
    "phase": "Phase 2",
    "routeSegment": "South Bend / Indiana",
    "route_segment": "South Bend / Indiana",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://www.sbchocolate.com/",
    "official_website": "https://www.sbchocolate.com/",
    "learnMoreUrl": "https://www.sbchocolate.com/",
    "learn_more": "https://www.sbchocolate.com/",
    "sourceUrl": "https://www.sbchocolate.com/",
    "shortSummary": "Local chocolate company and family-friendly treat stop.",
    "summary": "Local chocolate company and family-friendly treat stop.",
    "whyItMatters": "Good morale stop around the overnight area.",
    "why": "Good morale stop around the overnight area.",
    "notes": {
      "elsie": "Think about how local businesses become traditions.",
      "katrina": "Ask how chocolate is made and sold.",
      "emma": "Food, work, and community lens.",
      "eliette": "Pick the best wrapper or treat detail.",
      "jules": "Chocolate mission.",
      "momdad": "Good morale stop around the overnight area."
    },
    "profiles": {
      "elsie": "Think about how local businesses become traditions.",
      "katrina": "Ask how chocolate is made and sold.",
      "emma": "Food, work, and community lens.",
      "eliette": "Pick the best wrapper or treat detail.",
      "jules": "Chocolate mission.",
      "momdad": "Good morale stop around the overnight area."
    },
    "csvOrder": 36
  },
  {
    "id": "P2-002",
    "title": "Potawatomi Zoo",
    "name": "Potawatomi Zoo",
    "category": "Zoo",
    "latitude": 41.6629,
    "longitude": -86.2208,
    "lat": 41.6629,
    "lon": -86.2208,
    "lng": -86.2208,
    "phase": "Phase 2",
    "routeSegment": "South Bend / Indiana",
    "route_segment": "South Bend / Indiana",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.potawatomizoo.org/",
    "official_website": "https://www.potawatomizoo.org/",
    "learnMoreUrl": "https://www.potawatomizoo.org/",
    "learn_more": "https://www.potawatomizoo.org/",
    "sourceUrl": "https://www.potawatomizoo.org/",
    "shortSummary": "Family zoo in South Bend.",
    "summary": "Family zoo in South Bend.",
    "whyItMatters": "Good kid-friendly option before heading north.",
    "why": "Good kid-friendly option before heading north.",
    "notes": {
      "elsie": "Compare animal habitats.",
      "katrina": "Ask what animals need to stay healthy.",
      "emma": "Pick one animal and describe its day.",
      "eliette": "Find patterns and colors.",
      "jules": "Animal count mission.",
      "momdad": "Good kid-friendly option before heading north."
    },
    "profiles": {
      "elsie": "Compare animal habitats.",
      "katrina": "Ask what animals need to stay healthy.",
      "emma": "Pick one animal and describe its day.",
      "eliette": "Find patterns and colors.",
      "jules": "Animal count mission.",
      "momdad": "Good kid-friendly option before heading north."
    },
    "csvOrder": 37
  },
  {
    "id": "P2-003",
    "title": "Air Zoo Aerospace & Science Museum",
    "name": "Air Zoo Aerospace & Science Museum",
    "category": "Aviation Museum",
    "latitude": 42.2348,
    "longitude": -85.5536,
    "lat": 42.2348,
    "lon": -85.5536,
    "lng": -85.5536,
    "phase": "Phase 2",
    "routeSegment": "Kalamazoo / Michigan",
    "route_segment": "Kalamazoo / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.airzoo.org/",
    "official_website": "https://www.airzoo.org/",
    "learnMoreUrl": "https://www.airzoo.org/",
    "learn_more": "https://www.airzoo.org/",
    "sourceUrl": "https://www.airzoo.org/",
    "shortSummary": "Aviation and science museum near Kalamazoo.",
    "summary": "Aviation and science museum near Kalamazoo.",
    "whyItMatters": "Strong indoor STEM stop on the Michigan approach.",
    "why": "Strong indoor STEM stop on the Michigan approach.",
    "notes": {
      "elsie": "Think about flight and engineering.",
      "katrina": "Ask why airplane shapes matter.",
      "emma": "Connect machines to travel and weather.",
      "eliette": "Find the best design detail.",
      "jules": "Airplane mission.",
      "momdad": "Strong indoor STEM stop on the Michigan approach."
    },
    "profiles": {
      "elsie": "Think about flight and engineering.",
      "katrina": "Ask why airplane shapes matter.",
      "emma": "Connect machines to travel and weather.",
      "eliette": "Find the best design detail.",
      "jules": "Airplane mission.",
      "momdad": "Strong indoor STEM stop on the Michigan approach."
    },
    "csvOrder": 38
  },
  {
    "id": "P2-004",
    "title": "Gilmore Car Museum",
    "name": "Gilmore Car Museum",
    "category": "Museum",
    "latitude": 42.4622,
    "longitude": -85.408,
    "lat": 42.4622,
    "lon": -85.408,
    "lng": -85.408,
    "phase": "Phase 2",
    "routeSegment": "Hickory Corners / Michigan",
    "route_segment": "Hickory Corners / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://gilmorecarmuseum.org/",
    "official_website": "https://gilmorecarmuseum.org/",
    "learnMoreUrl": "https://gilmorecarmuseum.org/",
    "learn_more": "https://gilmorecarmuseum.org/",
    "sourceUrl": "https://gilmorecarmuseum.org/",
    "shortSummary": "Large automotive museum campus in Michigan.",
    "summary": "Large automotive museum campus in Michigan.",
    "whyItMatters": "Excellent transportation-history stop for the drive.",
    "why": "Excellent transportation-history stop for the drive.",
    "notes": {
      "elsie": "Compare car eras and designs.",
      "katrina": "Ask how cars changed where people could live.",
      "emma": "Connect cars to family road trips.",
      "eliette": "Find colors, hood ornaments, and signs.",
      "jules": "Car spotting mission.",
      "momdad": "Excellent transportation-history stop for the drive."
    },
    "profiles": {
      "elsie": "Compare car eras and designs.",
      "katrina": "Ask how cars changed where people could live.",
      "emma": "Connect cars to family road trips.",
      "eliette": "Find colors, hood ornaments, and signs.",
      "jules": "Car spotting mission.",
      "momdad": "Excellent transportation-history stop for the drive."
    },
    "csvOrder": 39
  },
  {
    "id": "P2-005",
    "title": "Michigan State Capitol",
    "name": "Michigan State Capitol",
    "category": "Historic Site",
    "latitude": 42.7336,
    "longitude": -84.5555,
    "lat": 42.7336,
    "lon": -84.5555,
    "lng": -84.5555,
    "phase": "Phase 2",
    "routeSegment": "Lansing / Michigan",
    "route_segment": "Lansing / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://capitol.michigan.gov/",
    "official_website": "https://capitol.michigan.gov/",
    "learnMoreUrl": "https://capitol.michigan.gov/",
    "learn_more": "https://capitol.michigan.gov/",
    "sourceUrl": "https://capitol.michigan.gov/",
    "shortSummary": "Michigan's state capitol building in Lansing.",
    "summary": "Michigan's state capitol building in Lansing.",
    "whyItMatters": "Adds state-government context on the Michigan leg.",
    "why": "Adds state-government context on the Michigan leg.",
    "notes": {
      "elsie": "Compare state capitols on the trip.",
      "katrina": "Ask what state governments decide.",
      "emma": "Connect laws to parks, roads, and schools.",
      "eliette": "Look for dome and symbol details.",
      "jules": "Big building mission.",
      "momdad": "Adds state-government context on the Michigan leg."
    },
    "profiles": {
      "elsie": "Compare state capitols on the trip.",
      "katrina": "Ask what state governments decide.",
      "emma": "Connect laws to parks, roads, and schools.",
      "eliette": "Look for dome and symbol details.",
      "jules": "Big building mission.",
      "momdad": "Adds state-government context on the Michigan leg."
    },
    "csvOrder": 40
  },
  {
    "id": "P2-006",
    "title": "Potter Park Zoo",
    "name": "Potter Park Zoo",
    "category": "Zoo",
    "latitude": 42.717,
    "longitude": -84.536,
    "lat": 42.717,
    "lon": -84.536,
    "lng": -84.536,
    "phase": "Phase 2",
    "routeSegment": "Lansing / Michigan",
    "route_segment": "Lansing / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://potterparkzoo.org/",
    "official_website": "https://potterparkzoo.org/",
    "learnMoreUrl": "https://potterparkzoo.org/",
    "learn_more": "https://potterparkzoo.org/",
    "sourceUrl": "https://potterparkzoo.org/",
    "shortSummary": "Lansing zoo and family stop.",
    "summary": "Lansing zoo and family stop.",
    "whyItMatters": "Useful kid reset near the Michigan corridor.",
    "why": "Useful kid reset near the Michigan corridor.",
    "notes": {
      "elsie": "Watch animal behavior and habitats.",
      "katrina": "Ask why conservation matters.",
      "emma": "Pick one animal and compare it to home pets.",
      "eliette": "Find the most colorful animal.",
      "jules": "Animal mission.",
      "momdad": "Useful kid reset near the Michigan corridor."
    },
    "profiles": {
      "elsie": "Watch animal behavior and habitats.",
      "katrina": "Ask why conservation matters.",
      "emma": "Pick one animal and compare it to home pets.",
      "eliette": "Find the most colorful animal.",
      "jules": "Animal mission.",
      "momdad": "Useful kid reset near the Michigan corridor."
    },
    "csvOrder": 41
  },
  {
    "id": "P2-007",
    "title": "Uncle John's Cider Mill",
    "name": "Uncle John's Cider Mill",
    "category": "Food Stop",
    "latitude": 43.0014,
    "longitude": -84.377,
    "lat": 43.0014,
    "lon": -84.377,
    "lng": -84.377,
    "phase": "Phase 2",
    "routeSegment": "St. Johns / Michigan",
    "route_segment": "St. Johns / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.ujcidermill.com/",
    "official_website": "https://www.ujcidermill.com/",
    "learnMoreUrl": "https://www.ujcidermill.com/",
    "learn_more": "https://www.ujcidermill.com/",
    "sourceUrl": "https://www.ujcidermill.com/",
    "shortSummary": "Cider mill stop north of Lansing.",
    "summary": "Cider mill stop north of Lansing.",
    "whyItMatters": "Good seasonal food and outdoor reset.",
    "why": "Good seasonal food and outdoor reset.",
    "notes": {
      "elsie": "Think about farms becoming destinations.",
      "katrina": "Ask how apples become cider.",
      "emma": "Connect food, farming, and family routines.",
      "eliette": "Find a label or treat detail.",
      "jules": "Apple mission.",
      "momdad": "Good seasonal food and outdoor reset."
    },
    "profiles": {
      "elsie": "Think about farms becoming destinations.",
      "katrina": "Ask how apples become cider.",
      "emma": "Connect food, farming, and family routines.",
      "eliette": "Find a label or treat detail.",
      "jules": "Apple mission.",
      "momdad": "Good seasonal food and outdoor reset."
    },
    "csvOrder": 42
  },
  {
    "id": "P2-008",
    "title": "Frankenmuth River Place Shops",
    "name": "Frankenmuth River Place Shops",
    "category": "Small Town / Shops",
    "latitude": 43.3314,
    "longitude": -83.7395,
    "lat": 43.3314,
    "lon": -83.7395,
    "lng": -83.7395,
    "phase": "Phase 2",
    "routeSegment": "Frankenmuth / Michigan",
    "route_segment": "Frankenmuth / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://frankenmuthriverplace.com/",
    "official_website": "https://frankenmuthriverplace.com/",
    "learnMoreUrl": "https://frankenmuthriverplace.com/",
    "learn_more": "https://frankenmuthriverplace.com/",
    "sourceUrl": "https://frankenmuthriverplace.com/",
    "shortSummary": "Bavarian-themed shopping village in Frankenmuth.",
    "summary": "Bavarian-themed shopping village in Frankenmuth.",
    "whyItMatters": "Fun walkable stop with strong visual character.",
    "why": "Fun walkable stop with strong visual character.",
    "notes": {
      "elsie": "Notice how towns build identity.",
      "katrina": "Ask why a theme attracts visitors.",
      "emma": "Compare tourist routines and local life.",
      "eliette": "Find the best sign or shop detail.",
      "jules": "Pretend village mission.",
      "momdad": "Fun walkable stop with strong visual character."
    },
    "profiles": {
      "elsie": "Notice how towns build identity.",
      "katrina": "Ask why a theme attracts visitors.",
      "emma": "Compare tourist routines and local life.",
      "eliette": "Find the best sign or shop detail.",
      "jules": "Pretend village mission.",
      "momdad": "Fun walkable stop with strong visual character."
    },
    "csvOrder": 43
  },
  {
    "id": "P2-009",
    "title": "Bronner's Christmas Wonderland",
    "name": "Bronner's Christmas Wonderland",
    "category": "Roadside Oddity",
    "latitude": 43.331,
    "longitude": -83.7344,
    "lat": 43.331,
    "lon": -83.7344,
    "lng": -83.7344,
    "phase": "Phase 2",
    "routeSegment": "Frankenmuth / Michigan",
    "route_segment": "Frankenmuth / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.bronners.com/",
    "official_website": "https://www.bronners.com/",
    "learnMoreUrl": "https://www.bronners.com/",
    "learn_more": "https://www.bronners.com/",
    "sourceUrl": "https://www.bronners.com/",
    "shortSummary": "Huge Christmas-themed store and roadside attraction.",
    "summary": "Huge Christmas-themed store and roadside attraction.",
    "whyItMatters": "One of the most memorable oddity stops in Michigan.",
    "why": "One of the most memorable oddity stops in Michigan.",
    "notes": {
      "elsie": "Think about scale and why giant stores become famous.",
      "katrina": "Ask why people travel for a store.",
      "emma": "Notice retail design and holiday traditions.",
      "eliette": "Find the funniest ornament.",
      "jules": "Christmas mission.",
      "momdad": "One of the most memorable oddity stops in Michigan."
    },
    "profiles": {
      "elsie": "Think about scale and why giant stores become famous.",
      "katrina": "Ask why people travel for a store.",
      "emma": "Notice retail design and holiday traditions.",
      "eliette": "Find the funniest ornament.",
      "jules": "Christmas mission.",
      "momdad": "One of the most memorable oddity stops in Michigan."
    },
    "csvOrder": 44
  },
  {
    "id": "P2-010",
    "title": "Hartwick Pines State Park",
    "name": "Hartwick Pines State Park",
    "category": "State Park",
    "latitude": 44.7603,
    "longitude": -84.6755,
    "lat": 44.7603,
    "lon": -84.6755,
    "lng": -84.6755,
    "phase": "Phase 2",
    "routeSegment": "Grayling / Michigan",
    "route_segment": "Grayling / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/hartwick-pines",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/hartwick-pines",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/hartwick-pines",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/hartwick-pines",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/hartwick-pines",
    "shortSummary": "Old-growth pine forest and logging museum area near Grayling.",
    "summary": "Old-growth pine forest and logging museum area near Grayling.",
    "whyItMatters": "Strong nature/history stop before the Straits.",
    "why": "Strong nature/history stop before the Straits.",
    "notes": {
      "elsie": "Compare old forests and logging history.",
      "katrina": "Ask why old-growth trees matter.",
      "emma": "Connect forests to jobs and conservation.",
      "eliette": "Find bark, needles, and trail details.",
      "jules": "Big tree mission.",
      "momdad": "Strong nature/history stop before the Straits."
    },
    "profiles": {
      "elsie": "Compare old forests and logging history.",
      "katrina": "Ask why old-growth trees matter.",
      "emma": "Connect forests to jobs and conservation.",
      "eliette": "Find bark, needles, and trail details.",
      "jules": "Big tree mission.",
      "momdad": "Strong nature/history stop before the Straits."
    },
    "csvOrder": 45
  },
  {
    "id": "P2-011",
    "title": "Grayling Fish Hatchery",
    "name": "Grayling Fish Hatchery",
    "category": "Nature / History",
    "latitude": 44.6616,
    "longitude": -84.7145,
    "lat": 44.6616,
    "lon": -84.7145,
    "lng": -84.7145,
    "phase": "Phase 2",
    "routeSegment": "Grayling / Michigan",
    "route_segment": "Grayling / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://graylingfishhatchery.org/",
    "official_website": "https://graylingfishhatchery.org/",
    "learnMoreUrl": "https://graylingfishhatchery.org/",
    "learn_more": "https://graylingfishhatchery.org/",
    "sourceUrl": "https://graylingfishhatchery.org/",
    "shortSummary": "Historic fish hatchery in Grayling.",
    "summary": "Historic fish hatchery in Grayling.",
    "whyItMatters": "Good nature stop tied to rivers and conservation.",
    "why": "Good nature stop tied to rivers and conservation.",
    "notes": {
      "elsie": "Think about fish habitats and river health.",
      "katrina": "Ask why people raise fish for streams.",
      "emma": "Connect water, wildlife, and recreation.",
      "eliette": "Look for water movement and fish details.",
      "jules": "Fish mission.",
      "momdad": "Good nature stop tied to rivers and conservation."
    },
    "profiles": {
      "elsie": "Think about fish habitats and river health.",
      "katrina": "Ask why people raise fish for streams.",
      "emma": "Connect water, wildlife, and recreation.",
      "eliette": "Look for water movement and fish details.",
      "jules": "Fish mission.",
      "momdad": "Good nature stop tied to rivers and conservation."
    },
    "csvOrder": 46
  },
  {
    "id": "P2-012",
    "title": "Cross in the Woods National Shrine",
    "name": "Cross in the Woods National Shrine",
    "category": "Religious Site",
    "latitude": 45.4448,
    "longitude": -84.7825,
    "lat": 45.4448,
    "lon": -84.7825,
    "lng": -84.7825,
    "phase": "Phase 2",
    "routeSegment": "Indian River / Michigan",
    "route_segment": "Indian River / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://crossinthewoods.com/",
    "official_website": "https://crossinthewoods.com/",
    "learnMoreUrl": "https://crossinthewoods.com/",
    "learn_more": "https://crossinthewoods.com/",
    "sourceUrl": "https://crossinthewoods.com/",
    "shortSummary": "Outdoor shrine in Indian River with a large crucifix.",
    "summary": "Outdoor shrine in Indian River with a large crucifix.",
    "whyItMatters": "Quiet, distinctive stop near the northern Michigan approach.",
    "why": "Quiet, distinctive stop near the northern Michigan approach.",
    "notes": {
      "elsie": "Notice scale, setting, and sacred art.",
      "katrina": "Ask why outdoor sacred spaces feel different.",
      "emma": "Connect faith, travel, and place.",
      "eliette": "Find small prayer or statue details.",
      "jules": "Big cross mission.",
      "momdad": "Quiet, distinctive stop near the northern Michigan approach."
    },
    "profiles": {
      "elsie": "Notice scale, setting, and sacred art.",
      "katrina": "Ask why outdoor sacred spaces feel different.",
      "emma": "Connect faith, travel, and place.",
      "eliette": "Find small prayer or statue details.",
      "jules": "Big cross mission.",
      "momdad": "Quiet, distinctive stop near the northern Michigan approach."
    },
    "csvOrder": 47
  },
  {
    "id": "P2-013",
    "title": "Call of the Wild Museum",
    "name": "Call of the Wild Museum",
    "category": "Museum",
    "latitude": 45.444,
    "longitude": -84.7835,
    "lat": 45.444,
    "lon": -84.7835,
    "lng": -84.7835,
    "phase": "Phase 2",
    "routeSegment": "Gaylord / Michigan",
    "route_segment": "Gaylord / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://callofthewildmuseum.com/",
    "official_website": "https://callofthewildmuseum.com/",
    "learnMoreUrl": "https://callofthewildmuseum.com/",
    "learn_more": "https://callofthewildmuseum.com/",
    "sourceUrl": "https://callofthewildmuseum.com/",
    "shortSummary": "Wildlife museum and family attraction in Gaylord.",
    "summary": "Wildlife museum and family attraction in Gaylord.",
    "whyItMatters": "Kid-friendly wildlife context before northern Michigan.",
    "why": "Kid-friendly wildlife context before northern Michigan.",
    "notes": {
      "elsie": "Compare animal adaptations.",
      "katrina": "Ask why Michigan animals live where they do.",
      "emma": "Connect wildlife to forests and water.",
      "eliette": "Find the best animal display detail.",
      "jules": "Animal mission.",
      "momdad": "Kid-friendly wildlife context before northern Michigan."
    },
    "profiles": {
      "elsie": "Compare animal adaptations.",
      "katrina": "Ask why Michigan animals live where they do.",
      "emma": "Connect wildlife to forests and water.",
      "eliette": "Find the best animal display detail.",
      "jules": "Animal mission.",
      "momdad": "Kid-friendly wildlife context before northern Michigan."
    },
    "csvOrder": 48
  },
  {
    "id": "P2-014",
    "title": "Historic Mill Creek Discovery Park",
    "name": "Historic Mill Creek Discovery Park",
    "category": "Historic Site",
    "latitude": 45.8646,
    "longitude": -84.7285,
    "lat": 45.8646,
    "lon": -84.7285,
    "lng": -84.7285,
    "phase": "Phase 2",
    "routeSegment": "Mackinaw City / Michigan",
    "route_segment": "Mackinaw City / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.mackinacparks.com/parks-and-attractions/historic-mill-creek-discovery-park/",
    "official_website": "https://www.mackinacparks.com/parks-and-attractions/historic-mill-creek-discovery-park/",
    "learnMoreUrl": "https://www.mackinacparks.com/parks-and-attractions/historic-mill-creek-discovery-park/",
    "learn_more": "https://www.mackinacparks.com/parks-and-attractions/historic-mill-creek-discovery-park/",
    "sourceUrl": "https://www.mackinacparks.com/parks-and-attractions/historic-mill-creek-discovery-park/",
    "shortSummary": "Reconstructed sawmill and nature/history park near Mackinaw City.",
    "summary": "Reconstructed sawmill and nature/history park near Mackinaw City.",
    "whyItMatters": "Excellent hands-on history tied to timber and frontier industry.",
    "why": "Excellent hands-on history tied to timber and frontier industry.",
    "notes": {
      "elsie": "Connect wood, water, and settlement.",
      "katrina": "Ask how sawmills changed northern Michigan.",
      "emma": "Notice how machines use water and gravity.",
      "eliette": "Find gears, boards, and forest details.",
      "jules": "Sawmill machine mission.",
      "momdad": "Excellent hands-on history tied to timber and frontier industry."
    },
    "profiles": {
      "elsie": "Connect wood, water, and settlement.",
      "katrina": "Ask how sawmills changed northern Michigan.",
      "emma": "Notice how machines use water and gravity.",
      "eliette": "Find gears, boards, and forest details.",
      "jules": "Sawmill machine mission.",
      "momdad": "Excellent hands-on history tied to timber and frontier industry."
    },
    "csvOrder": 49
  },
  {
    "id": "P2-015",
    "title": "Colonial Michilimackinac",
    "name": "Colonial Michilimackinac",
    "category": "Historic Fort",
    "latitude": 45.7866,
    "longitude": -84.7272,
    "lat": 45.7866,
    "lon": -84.7272,
    "lng": -84.7272,
    "phase": "Phase 2",
    "routeSegment": "Mackinaw City / Michigan",
    "route_segment": "Mackinaw City / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.mackinacparks.com/parks-and-attractions/colonial-michilimackinac/",
    "official_website": "https://www.mackinacparks.com/parks-and-attractions/colonial-michilimackinac/",
    "learnMoreUrl": "https://www.mackinacparks.com/parks-and-attractions/colonial-michilimackinac/",
    "learn_more": "https://www.mackinacparks.com/parks-and-attractions/colonial-michilimackinac/",
    "sourceUrl": "https://www.mackinacparks.com/parks-and-attractions/colonial-michilimackinac/",
    "shortSummary": "Reconstructed 18th-century fort and fur-trade site.",
    "summary": "Reconstructed 18th-century fort and fur-trade site.",
    "whyItMatters": "One of the strongest Straits history stops.",
    "why": "One of the strongest Straits history stops.",
    "notes": {
      "elsie": "Think about trade, alliances, and conflict.",
      "katrina": "Ask why the Straits mattered so much.",
      "emma": "Connect travel routes, water, and commerce.",
      "eliette": "Look for fort, tools, and costume details.",
      "jules": "Fort mission.",
      "momdad": "One of the strongest Straits history stops."
    },
    "profiles": {
      "elsie": "Think about trade, alliances, and conflict.",
      "katrina": "Ask why the Straits mattered so much.",
      "emma": "Connect travel routes, water, and commerce.",
      "eliette": "Look for fort, tools, and costume details.",
      "jules": "Fort mission.",
      "momdad": "One of the strongest Straits history stops."
    },
    "csvOrder": 50
  },
  {
    "id": "P2-016",
    "title": "Old Mackinac Point Lighthouse",
    "name": "Old Mackinac Point Lighthouse",
    "category": "Lighthouse",
    "latitude": 45.7877,
    "longitude": -84.7276,
    "lat": 45.7877,
    "lon": -84.7276,
    "lng": -84.7276,
    "phase": "Phase 2",
    "routeSegment": "Mackinaw City / Michigan",
    "route_segment": "Mackinaw City / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.mackinacparks.com/parks-and-attractions/old-mackinac-point-lighthouse/",
    "official_website": "https://www.mackinacparks.com/parks-and-attractions/old-mackinac-point-lighthouse/",
    "learnMoreUrl": "https://www.mackinacparks.com/parks-and-attractions/old-mackinac-point-lighthouse/",
    "learn_more": "https://www.mackinacparks.com/parks-and-attractions/old-mackinac-point-lighthouse/",
    "sourceUrl": "https://www.mackinacparks.com/parks-and-attractions/old-mackinac-point-lighthouse/",
    "shortSummary": "Historic lighthouse at the Straits of Mackinac.",
    "summary": "Historic lighthouse at the Straits of Mackinac.",
    "whyItMatters": "Strong maritime navigation stop before the ferry region.",
    "why": "Strong maritime navigation stop before the ferry region.",
    "notes": {
      "elsie": "Think about ships before GPS.",
      "katrina": "Ask why lights mattered in storms and fog.",
      "emma": "Connect weather, water, and safety.",
      "eliette": "Find lens, tower, and stone details.",
      "jules": "Lighthouse mission.",
      "momdad": "Strong maritime navigation stop before the ferry region."
    },
    "profiles": {
      "elsie": "Think about ships before GPS.",
      "katrina": "Ask why lights mattered in storms and fog.",
      "emma": "Connect weather, water, and safety.",
      "eliette": "Find lens, tower, and stone details.",
      "jules": "Lighthouse mission.",
      "momdad": "Strong maritime navigation stop before the ferry region."
    },
    "csvOrder": 51
  },
  {
    "id": "P2-017",
    "title": "Mackinac Bridge",
    "name": "Mackinac Bridge",
    "category": "Scenic / Engineering",
    "latitude": 45.8176,
    "longitude": -84.7278,
    "lat": 45.8176,
    "lon": -84.7278,
    "lng": -84.7278,
    "phase": "Phase 2",
    "routeSegment": "Straits of Mackinac",
    "route_segment": "Straits of Mackinac",
    "tier": "Core",
    "estimatedStopMinutes": 20,
    "estimated_stop_minutes": 20,
    "officialWebsiteUrl": "https://www.mackinacbridge.org/",
    "official_website": "https://www.mackinacbridge.org/",
    "learnMoreUrl": "https://www.mackinacbridge.org/",
    "learn_more": "https://www.mackinacbridge.org/",
    "sourceUrl": "https://www.mackinacbridge.org/",
    "shortSummary": "Major suspension bridge connecting Michigan's peninsulas.",
    "summary": "Major suspension bridge connecting Michigan's peninsulas.",
    "whyItMatters": "Essential engineering landmark for the region.",
    "why": "Essential engineering landmark for the region.",
    "notes": {
      "elsie": "Think about what it takes to connect two peninsulas.",
      "katrina": "Ask why building here was hard.",
      "emma": "Connect bridges to daily life and travel.",
      "eliette": "Look for cables, towers, and water views.",
      "jules": "Big bridge mission.",
      "momdad": "Essential engineering landmark for the region."
    },
    "profiles": {
      "elsie": "Think about what it takes to connect two peninsulas.",
      "katrina": "Ask why building here was hard.",
      "emma": "Connect bridges to daily life and travel.",
      "eliette": "Look for cables, towers, and water views.",
      "jules": "Big bridge mission.",
      "momdad": "Essential engineering landmark for the region."
    },
    "csvOrder": 52
  },
  {
    "id": "P2-018",
    "title": "Icebreaker Mackinaw Maritime Museum",
    "name": "Icebreaker Mackinaw Maritime Museum",
    "category": "Maritime Museum",
    "latitude": 45.777,
    "longitude": -84.727,
    "lat": 45.777,
    "lon": -84.727,
    "lng": -84.727,
    "phase": "Phase 2",
    "routeSegment": "Mackinaw City / Michigan",
    "route_segment": "Mackinaw City / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.themackinaw.org/",
    "official_website": "https://www.themackinaw.org/",
    "learnMoreUrl": "https://www.themackinaw.org/",
    "learn_more": "https://www.themackinaw.org/",
    "sourceUrl": "https://www.themackinaw.org/",
    "shortSummary": "Historic Coast Guard icebreaker museum ship.",
    "summary": "Historic Coast Guard icebreaker museum ship.",
    "whyItMatters": "Great ship and Great Lakes logistics stop.",
    "why": "Great ship and Great Lakes logistics stop.",
    "notes": {
      "elsie": "Think about winter shipping and ice.",
      "katrina": "Ask why icebreakers matter to trade.",
      "emma": "Connect lakes, weather, and supplies.",
      "eliette": "Find ship details and equipment.",
      "jules": "Big boat mission.",
      "momdad": "Great ship and Great Lakes logistics stop."
    },
    "profiles": {
      "elsie": "Think about winter shipping and ice.",
      "katrina": "Ask why icebreakers matter to trade.",
      "emma": "Connect lakes, weather, and supplies.",
      "eliette": "Find ship details and equipment.",
      "jules": "Big boat mission.",
      "momdad": "Great ship and Great Lakes logistics stop."
    },
    "csvOrder": 53
  },
  {
    "id": "P2-019",
    "title": "Headlands International Dark Sky Park",
    "name": "Headlands International Dark Sky Park",
    "category": "Dark Sky Park",
    "latitude": 45.7744,
    "longitude": -84.7515,
    "lat": 45.7744,
    "lon": -84.7515,
    "lng": -84.7515,
    "phase": "Phase 2",
    "routeSegment": "Mackinaw City / Michigan",
    "route_segment": "Mackinaw City / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.emmetcounty.org/experiences/headlands/index.php",
    "official_website": "https://www.emmetcounty.org/experiences/headlands/index.php",
    "learnMoreUrl": "https://www.emmetcounty.org/experiences/headlands/index.php",
    "learn_more": "https://www.emmetcounty.org/experiences/headlands/index.php",
    "sourceUrl": "https://www.emmetcounty.org/experiences/headlands/index.php",
    "shortSummary": "Dark sky park on Lake Michigan near Mackinaw City.",
    "summary": "Dark sky park on Lake Michigan near Mackinaw City.",
    "whyItMatters": "Major night-sky and nature experience near the island route.",
    "why": "Major night-sky and nature experience near the island route.",
    "notes": {
      "elsie": "Think about light pollution and stars.",
      "katrina": "Ask why dark skies need protection.",
      "emma": "Connect sky, weather, and planning.",
      "eliette": "Find constellations or moonlight details.",
      "jules": "Star mission.",
      "momdad": "Major night-sky and nature experience near the island route."
    },
    "profiles": {
      "elsie": "Think about light pollution and stars.",
      "katrina": "Ask why dark skies need protection.",
      "emma": "Connect sky, weather, and planning.",
      "eliette": "Find constellations or moonlight details.",
      "jules": "Star mission.",
      "momdad": "Major night-sky and nature experience near the island route."
    },
    "csvOrder": 54
  },
  {
    "id": "P2-020",
    "title": "Wilderness State Park",
    "name": "Wilderness State Park",
    "category": "State Park",
    "latitude": 45.731,
    "longitude": -84.915,
    "lat": 45.731,
    "lon": -84.915,
    "lng": -84.915,
    "phase": "Phase 2",
    "routeSegment": "Mackinaw City / Michigan",
    "route_segment": "Mackinaw City / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/wilderness",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/wilderness",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/wilderness",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/wilderness",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/wilderness",
    "shortSummary": "Large Lake Michigan shoreline state park.",
    "summary": "Large Lake Michigan shoreline state park.",
    "whyItMatters": "Outdoor anchor for beaches, trails, and northern habitat.",
    "why": "Outdoor anchor for beaches, trails, and northern habitat.",
    "notes": {
      "elsie": "Compare forest, beach, and wetlands.",
      "katrina": "Ask why undeveloped shoreline matters.",
      "emma": "Connect parks to family rest and conservation.",
      "eliette": "Find rocks, waves, and trail details.",
      "jules": "Beach and woods mission.",
      "momdad": "Outdoor anchor for beaches, trails, and northern habitat."
    },
    "profiles": {
      "elsie": "Compare forest, beach, and wetlands.",
      "katrina": "Ask why undeveloped shoreline matters.",
      "emma": "Connect parks to family rest and conservation.",
      "eliette": "Find rocks, waves, and trail details.",
      "jules": "Beach and woods mission.",
      "momdad": "Outdoor anchor for beaches, trails, and northern habitat."
    },
    "csvOrder": 55
  },
  {
    "id": "P2-021",
    "title": "McGulpin Point Lighthouse",
    "name": "McGulpin Point Lighthouse",
    "category": "Lighthouse",
    "latitude": 45.7869,
    "longitude": -84.7727,
    "lat": 45.7869,
    "lon": -84.7727,
    "lng": -84.7727,
    "phase": "Phase 2",
    "routeSegment": "Mackinaw City / Michigan",
    "route_segment": "Mackinaw City / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.emmetcounty.org/experiences/mcgulpin-point-lighthouse/",
    "official_website": "https://www.emmetcounty.org/experiences/mcgulpin-point-lighthouse/",
    "learnMoreUrl": "https://www.emmetcounty.org/experiences/mcgulpin-point-lighthouse/",
    "learn_more": "https://www.emmetcounty.org/experiences/mcgulpin-point-lighthouse/",
    "sourceUrl": "https://www.emmetcounty.org/experiences/mcgulpin-point-lighthouse/",
    "shortSummary": "Historic lighthouse west of Mackinaw City.",
    "summary": "Historic lighthouse west of Mackinaw City.",
    "whyItMatters": "Good scenic maritime stop near Headlands.",
    "why": "Good scenic maritime stop near Headlands.",
    "notes": {
      "elsie": "Compare lighthouse locations around the Straits.",
      "katrina": "Ask how sailors navigated dangerous water.",
      "emma": "Notice tower shape and shoreline clues.",
      "eliette": "Find the best lighthouse angle.",
      "jules": "Lighthouse mission.",
      "momdad": "Good scenic maritime stop near Headlands."
    },
    "profiles": {
      "elsie": "Compare lighthouse locations around the Straits.",
      "katrina": "Ask how sailors navigated dangerous water.",
      "emma": "Notice tower shape and shoreline clues.",
      "eliette": "Find the best lighthouse angle.",
      "jules": "Lighthouse mission.",
      "momdad": "Good scenic maritime stop near Headlands."
    },
    "csvOrder": 56
  },
  {
    "id": "P2-022",
    "title": "Cheboygan State Park",
    "name": "Cheboygan State Park",
    "category": "State Park",
    "latitude": 45.6467,
    "longitude": -84.4306,
    "lat": 45.6467,
    "lon": -84.4306,
    "lng": -84.4306,
    "phase": "Phase 2",
    "routeSegment": "Cheboygan / Michigan",
    "route_segment": "Cheboygan / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/cheboygan",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/cheboygan",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/cheboygan",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/cheboygan",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/cheboygan",
    "shortSummary": "State park on Lake Huron near Cheboygan.",
    "summary": "State park on Lake Huron near Cheboygan.",
    "whyItMatters": "Strong outdoor stop close to ferry logistics.",
    "why": "Strong outdoor stop close to ferry logistics.",
    "notes": {
      "elsie": "Think about lakeshore habitats.",
      "katrina": "Ask how Great Lakes shorelines change.",
      "emma": "Connect beach time, weather, and travel plans.",
      "eliette": "Find rocks, waves, and trees.",
      "jules": "Lake mission.",
      "momdad": "Strong outdoor stop close to ferry logistics."
    },
    "profiles": {
      "elsie": "Think about lakeshore habitats.",
      "katrina": "Ask how Great Lakes shorelines change.",
      "emma": "Connect beach time, weather, and travel plans.",
      "eliette": "Find rocks, waves, and trees.",
      "jules": "Lake mission.",
      "momdad": "Strong outdoor stop close to ferry logistics."
    },
    "csvOrder": 57
  },
  {
    "id": "P2-023",
    "title": "Cheboygan Crib Light",
    "name": "Cheboygan Crib Light",
    "category": "Lighthouse",
    "latitude": 45.648,
    "longitude": -84.4702,
    "lat": 45.648,
    "lon": -84.4702,
    "lng": -84.4702,
    "phase": "Phase 2",
    "routeSegment": "Cheboygan / Michigan",
    "route_segment": "Cheboygan / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://www.cheboygan.com/",
    "official_website": "https://www.cheboygan.com/",
    "learnMoreUrl": "https://www.cheboygan.com/",
    "learn_more": "https://www.cheboygan.com/",
    "sourceUrl": "https://www.cheboygan.com/",
    "shortSummary": "Lighthouse structure marking Cheboygan's harbor area.",
    "summary": "Lighthouse structure marking Cheboygan's harbor area.",
    "whyItMatters": "Quick maritime photo stop near the ferry town.",
    "why": "Quick maritime photo stop near the ferry town.",
    "notes": {
      "elsie": "Think about harbor safety.",
      "katrina": "Ask why boats need lights at channel entrances.",
      "emma": "Connect shipping, weather, and town life.",
      "eliette": "Find the best red lighthouse photo.",
      "jules": "Red lighthouse mission.",
      "momdad": "Quick maritime photo stop near the ferry town."
    },
    "profiles": {
      "elsie": "Think about harbor safety.",
      "katrina": "Ask why boats need lights at channel entrances.",
      "emma": "Connect shipping, weather, and town life.",
      "eliette": "Find the best red lighthouse photo.",
      "jules": "Red lighthouse mission.",
      "momdad": "Quick maritime photo stop near the ferry town."
    },
    "csvOrder": 58
  },
  {
    "id": "P2-024",
    "title": "Cheboygan Opera House",
    "name": "Cheboygan Opera House",
    "category": "Historic Site",
    "latitude": 45.6462,
    "longitude": -84.4745,
    "lat": 45.6462,
    "lon": -84.4745,
    "lng": -84.4745,
    "phase": "Phase 2",
    "routeSegment": "Cheboygan / Michigan",
    "route_segment": "Cheboygan / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://theoperahouse.org/",
    "official_website": "https://theoperahouse.org/",
    "learnMoreUrl": "https://theoperahouse.org/",
    "learn_more": "https://theoperahouse.org/",
    "sourceUrl": "https://theoperahouse.org/",
    "shortSummary": "Historic performing arts venue in Cheboygan.",
    "summary": "Historic performing arts venue in Cheboygan.",
    "whyItMatters": "Adds small-town culture near the ferry base.",
    "why": "Adds small-town culture near the ferry base.",
    "notes": {
      "elsie": "Think about why towns built theaters.",
      "katrina": "Ask what entertainment looked like before screens.",
      "emma": "Connect community, arts, and downtown life.",
      "eliette": "Look for old building details.",
      "jules": "Theater sign mission.",
      "momdad": "Adds small-town culture near the ferry base."
    },
    "profiles": {
      "elsie": "Think about why towns built theaters.",
      "katrina": "Ask what entertainment looked like before screens.",
      "emma": "Connect community, arts, and downtown life.",
      "eliette": "Look for old building details.",
      "jules": "Theater sign mission.",
      "momdad": "Adds small-town culture near the ferry base."
    },
    "csvOrder": 59
  },
  {
    "id": "P2-025",
    "title": "Plaunt Transportation Ferry",
    "name": "Plaunt Transportation Ferry",
    "category": "Ferry",
    "latitude": 45.6469,
    "longitude": -84.4745,
    "lat": 45.6469,
    "lon": -84.4745,
    "lng": -84.4745,
    "phase": "Phase 2",
    "routeSegment": "Cheboygan to Bois Blanc",
    "route_segment": "Cheboygan to Bois Blanc",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://plaunttransportation.com/",
    "official_website": "https://plaunttransportation.com/",
    "learnMoreUrl": "https://plaunttransportation.com/",
    "learn_more": "https://plaunttransportation.com/",
    "sourceUrl": "https://plaunttransportation.com/",
    "shortSummary": "Ferry service connecting Cheboygan and Bois Blanc Island.",
    "summary": "Ferry service connecting Cheboygan and Bois Blanc Island.",
    "whyItMatters": "Essential logistics and island-life stop.",
    "why": "Essential logistics and island-life stop.",
    "notes": {
      "elsie": "Think about how islands depend on ferries.",
      "katrina": "Ask what changes when groceries and cars travel by boat.",
      "emma": "Connect ferry schedules to daily life.",
      "eliette": "Watch ropes, ramps, signs, and loading.",
      "jules": "Cars-on-a-boat mission.",
      "momdad": "Essential logistics and island-life stop."
    },
    "profiles": {
      "elsie": "Think about how islands depend on ferries.",
      "katrina": "Ask what changes when groceries and cars travel by boat.",
      "emma": "Connect ferry schedules to daily life.",
      "eliette": "Watch ropes, ramps, signs, and loading.",
      "jules": "Cars-on-a-boat mission.",
      "momdad": "Essential logistics and island-life stop."
    },
    "csvOrder": 60
  },
  {
    "id": "P2-026",
    "title": "Bois Blanc Township",
    "name": "Bois Blanc Township",
    "category": "Island Community",
    "latitude": 45.7465,
    "longitude": -84.4948,
    "lat": 45.7465,
    "lon": -84.4948,
    "lng": -84.4948,
    "phase": "Phase 2",
    "routeSegment": "Bois Blanc Island",
    "route_segment": "Bois Blanc Island",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.boisblanctownship.org/",
    "official_website": "https://www.boisblanctownship.org/",
    "learnMoreUrl": "https://www.boisblanctownship.org/",
    "learn_more": "https://www.boisblanctownship.org/",
    "sourceUrl": "https://www.boisblanctownship.org/",
    "shortSummary": "Official township anchor for Bois Blanc Island.",
    "summary": "Official township anchor for Bois Blanc Island.",
    "whyItMatters": "Gives civic and island-life context for the stay.",
    "why": "Gives civic and island-life context for the stay.",
    "notes": {
      "elsie": "Think about how small island communities work.",
      "katrina": "Ask what services an island township must handle.",
      "emma": "Compare island routines to Olathe routines.",
      "eliette": "Find signs and community details.",
      "jules": "Island town mission.",
      "momdad": "Gives civic and island-life context for the stay."
    },
    "profiles": {
      "elsie": "Think about how small island communities work.",
      "katrina": "Ask what services an island township must handle.",
      "emma": "Compare island routines to Olathe routines.",
      "eliette": "Find signs and community details.",
      "jules": "Island town mission.",
      "momdad": "Gives civic and island-life context for the stay."
    },
    "csvOrder": 61
  },
  {
    "id": "P2-027",
    "title": "Bois Blanc Island Museum and Library",
    "name": "Bois Blanc Island Museum and Library",
    "category": "Museum / Library",
    "latitude": 45.7465,
    "longitude": -84.4948,
    "lat": 45.7465,
    "lon": -84.4948,
    "lng": -84.4948,
    "phase": "Phase 2",
    "routeSegment": "Bois Blanc Island",
    "route_segment": "Bois Blanc Island",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.boisblanctownship.org/community/museum-and-library/",
    "official_website": "https://www.boisblanctownship.org/community/museum-and-library/",
    "learnMoreUrl": "https://www.boisblanctownship.org/community/museum-and-library/",
    "learn_more": "https://www.boisblanctownship.org/community/museum-and-library/",
    "sourceUrl": "https://www.boisblanctownship.org/community/museum-and-library/",
    "shortSummary": "Island museum and library resource listed by the township.",
    "summary": "Island museum and library resource listed by the township.",
    "whyItMatters": "Best official island history/culture anchor.",
    "why": "Best official island history/culture anchor.",
    "notes": {
      "elsie": "Think about how small places preserve memory.",
      "katrina": "Ask what island stories people save.",
      "emma": "Connect books, photos, and community.",
      "eliette": "Find old photos or tiny artifacts.",
      "jules": "Island story mission.",
      "momdad": "Best official island history/culture anchor."
    },
    "profiles": {
      "elsie": "Think about how small places preserve memory.",
      "katrina": "Ask what island stories people save.",
      "emma": "Connect books, photos, and community.",
      "eliette": "Find old photos or tiny artifacts.",
      "jules": "Island story mission.",
      "momdad": "Best official island history/culture anchor."
    },
    "csvOrder": 62
  },
  {
    "id": "P2-028",
    "title": "Bois Blanc Island Lighthouse",
    "name": "Bois Blanc Island Lighthouse",
    "category": "Lighthouse",
    "latitude": 45.8118,
    "longitude": -84.4183,
    "lat": 45.8118,
    "lon": -84.4183,
    "lng": -84.4183,
    "phase": "Phase 2",
    "routeSegment": "Bois Blanc Island",
    "route_segment": "Bois Blanc Island",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.michigan.org/property/bois-blanc-island-lighthouse",
    "official_website": "https://www.michigan.org/property/bois-blanc-island-lighthouse",
    "learnMoreUrl": "https://www.michigan.org/property/bois-blanc-island-lighthouse",
    "learn_more": "https://www.michigan.org/property/bois-blanc-island-lighthouse",
    "sourceUrl": "https://www.michigan.org/property/bois-blanc-island-lighthouse",
    "shortSummary": "Historic lighthouse associated with Bois Blanc Island.",
    "summary": "Historic lighthouse associated with Bois Blanc Island.",
    "whyItMatters": "Strong island maritime-history stop.",
    "why": "Strong island maritime-history stop.",
    "notes": {
      "elsie": "Compare island lights to mainland lights.",
      "katrina": "Ask why lighthouses were placed here.",
      "emma": "Connect boats, rocks, fog, and safety.",
      "eliette": "Find lighthouse shapes and shoreline details.",
      "jules": "Island lighthouse mission.",
      "momdad": "Strong island maritime-history stop."
    },
    "profiles": {
      "elsie": "Compare island lights to mainland lights.",
      "katrina": "Ask why lighthouses were placed here.",
      "emma": "Connect boats, rocks, fog, and safety.",
      "eliette": "Find lighthouse shapes and shoreline details.",
      "jules": "Island lighthouse mission.",
      "momdad": "Strong island maritime-history stop."
    },
    "csvOrder": 63
  },
  {
    "id": "P2-029",
    "title": "Bois Blanc Island Natural Area",
    "name": "Bois Blanc Island Natural Area",
    "category": "Natural Area",
    "latitude": 45.772,
    "longitude": -84.485,
    "lat": 45.772,
    "lon": -84.485,
    "lng": -84.485,
    "phase": "Phase 2",
    "routeSegment": "Bois Blanc Island",
    "route_segment": "Bois Blanc Island",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/natural-areas/bois-blanc-island",
    "official_website": "https://www.michigan.gov/dnr/places/natural-areas/bois-blanc-island",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/natural-areas/bois-blanc-island",
    "learn_more": "https://www.michigan.gov/dnr/places/natural-areas/bois-blanc-island",
    "sourceUrl": "https://www.michigan.gov/dnr/places/natural-areas/bois-blanc-island",
    "shortSummary": "Michigan DNR natural area on Bois Blanc Island.",
    "summary": "Michigan DNR natural area on Bois Blanc Island.",
    "whyItMatters": "Key official nature anchor for island exploration.",
    "why": "Key official nature anchor for island exploration.",
    "notes": {
      "elsie": "Notice rare habitats and island ecosystems.",
      "katrina": "Ask why island nature can be fragile.",
      "emma": "Connect plants, animals, and conservation.",
      "eliette": "Find textures, leaves, rocks, and tracks.",
      "jules": "Nature detective mission.",
      "momdad": "Key official nature anchor for island exploration."
    },
    "profiles": {
      "elsie": "Notice rare habitats and island ecosystems.",
      "katrina": "Ask why island nature can be fragile.",
      "emma": "Connect plants, animals, and conservation.",
      "eliette": "Find textures, leaves, rocks, and tracks.",
      "jules": "Nature detective mission.",
      "momdad": "Key official nature anchor for island exploration."
    },
    "csvOrder": 64
  },
  {
    "id": "P2-030",
    "title": "Bois Blanc Island Airport",
    "name": "Bois Blanc Island Airport",
    "category": "Transit / Island Logistics",
    "latitude": 45.725,
    "longitude": -84.428,
    "lat": 45.725,
    "lon": -84.428,
    "lng": -84.428,
    "phase": "Phase 2",
    "routeSegment": "Bois Blanc Island",
    "route_segment": "Bois Blanc Island",
    "tier": "Good Reset",
    "estimatedStopMinutes": 20,
    "estimated_stop_minutes": 20,
    "officialWebsiteUrl": "https://www.boisblancairport.com/",
    "official_website": "https://www.boisblancairport.com/",
    "learnMoreUrl": "https://www.boisblancairport.com/",
    "learn_more": "https://www.boisblancairport.com/",
    "sourceUrl": "https://www.boisblancairport.com/",
    "shortSummary": "Small island airport resource.",
    "summary": "Small island airport resource.",
    "whyItMatters": "Good island-logistics point showing another way people connect to the mainland.",
    "why": "Good island-logistics point showing another way people connect to the mainland.",
    "notes": {
      "elsie": "Think about ferry versus airplane access.",
      "katrina": "Ask when a small island airport matters.",
      "emma": "Connect transportation to emergencies and daily life.",
      "eliette": "Look for runway signs and small details.",
      "jules": "Tiny airport mission.",
      "momdad": "Good island-logistics point showing another way people connect to the mainland."
    },
    "profiles": {
      "elsie": "Think about ferry versus airplane access.",
      "katrina": "Ask when a small island airport matters.",
      "emma": "Connect transportation to emergencies and daily life.",
      "eliette": "Look for runway signs and small details.",
      "jules": "Tiny airport mission.",
      "momdad": "Good island-logistics point showing another way people connect to the mainland."
    },
    "csvOrder": 65
  },
  {
    "id": "P2-031",
    "title": "Bois Blanc Pines School",
    "name": "Bois Blanc Pines School",
    "category": "Community",
    "latitude": 45.7465,
    "longitude": -84.4948,
    "lat": 45.7465,
    "lon": -84.4948,
    "lng": -84.4948,
    "phase": "Phase 2",
    "routeSegment": "Bois Blanc Island",
    "route_segment": "Bois Blanc Island",
    "tier": "Good Reset",
    "estimatedStopMinutes": 20,
    "estimated_stop_minutes": 20,
    "officialWebsiteUrl": "https://boisblanc.eupschools.org/",
    "official_website": "https://boisblanc.eupschools.org/",
    "learnMoreUrl": "https://boisblanc.eupschools.org/",
    "learn_more": "https://boisblanc.eupschools.org/",
    "sourceUrl": "https://boisblanc.eupschools.org/",
    "shortSummary": "Island school district site.",
    "summary": "Island school district site.",
    "whyItMatters": "Useful community-life stop for comparing school on an island.",
    "why": "Useful community-life stop for comparing school on an island.",
    "notes": {
      "elsie": "Think about school when the community is small.",
      "katrina": "Ask what would feel different about island school.",
      "emma": "Compare their school day to yours.",
      "eliette": "Look for school signs and community details.",
      "jules": "School mission.",
      "momdad": "Useful community-life stop for comparing school on an island."
    },
    "profiles": {
      "elsie": "Think about school when the community is small.",
      "katrina": "Ask what would feel different about island school.",
      "emma": "Compare their school day to yours.",
      "eliette": "Look for school signs and community details.",
      "jules": "School mission.",
      "momdad": "Useful community-life stop for comparing school on an island."
    },
    "csvOrder": 66
  },
  {
    "id": "P2-032",
    "title": "Mackinac Island State Park",
    "name": "Mackinac Island State Park",
    "category": "State Park",
    "latitude": 45.8492,
    "longitude": -84.6189,
    "lat": 45.8492,
    "lon": -84.6189,
    "lng": -84.6189,
    "phase": "Phase 2",
    "routeSegment": "Mackinac Island / Straits",
    "route_segment": "Mackinac Island / Straits",
    "tier": "Core",
    "estimatedStopMinutes": 180,
    "estimated_stop_minutes": 180,
    "officialWebsiteUrl": "https://www.mackinacparks.com/parks-and-attractions/mackinac-island-state-park/",
    "official_website": "https://www.mackinacparks.com/parks-and-attractions/mackinac-island-state-park/",
    "learnMoreUrl": "https://www.mackinacparks.com/parks-and-attractions/mackinac-island-state-park/",
    "learn_more": "https://www.mackinacparks.com/parks-and-attractions/mackinac-island-state-park/",
    "sourceUrl": "https://www.mackinacparks.com/parks-and-attractions/mackinac-island-state-park/",
    "shortSummary": "State park covering much of Mackinac Island.",
    "summary": "State park covering much of Mackinac Island.",
    "whyItMatters": "Major regional outdoor/history anchor if taking a side trip.",
    "why": "Major regional outdoor/history anchor if taking a side trip.",
    "notes": {
      "elsie": "Think about why islands become parks.",
      "katrina": "Ask why cars are restricted on Mackinac Island.",
      "emma": "Connect tourism, nature, and preservation.",
      "eliette": "Find trails, signs, and shoreline views.",
      "jules": "Island park mission.",
      "momdad": "Major regional outdoor/history anchor if taking a side trip."
    },
    "profiles": {
      "elsie": "Think about why islands become parks.",
      "katrina": "Ask why cars are restricted on Mackinac Island.",
      "emma": "Connect tourism, nature, and preservation.",
      "eliette": "Find trails, signs, and shoreline views.",
      "jules": "Island park mission.",
      "momdad": "Major regional outdoor/history anchor if taking a side trip."
    },
    "csvOrder": 67
  },
  {
    "id": "P2-033",
    "title": "Fort Mackinac",
    "name": "Fort Mackinac",
    "category": "Historic Fort",
    "latitude": 45.8525,
    "longitude": -84.6174,
    "lat": 45.8525,
    "lon": -84.6174,
    "lng": -84.6174,
    "phase": "Phase 2",
    "routeSegment": "Mackinac Island / Straits",
    "route_segment": "Mackinac Island / Straits",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.mackinacparks.com/parks-and-attractions/fort-mackinac/",
    "official_website": "https://www.mackinacparks.com/parks-and-attractions/fort-mackinac/",
    "learnMoreUrl": "https://www.mackinacparks.com/parks-and-attractions/fort-mackinac/",
    "learn_more": "https://www.mackinacparks.com/parks-and-attractions/fort-mackinac/",
    "sourceUrl": "https://www.mackinacparks.com/parks-and-attractions/fort-mackinac/",
    "shortSummary": "Historic military fort on Mackinac Island.",
    "summary": "Historic military fort on Mackinac Island.",
    "whyItMatters": "Excellent military and Straits-history side trip.",
    "why": "Excellent military and Straits-history side trip.",
    "notes": {
      "elsie": "Think about strategic high ground.",
      "katrina": "Ask why forts were built above harbors.",
      "emma": "Connect defense, trade, and water routes.",
      "eliette": "Find cannon and uniform details.",
      "jules": "Fort mission.",
      "momdad": "Excellent military and Straits-history side trip."
    },
    "profiles": {
      "elsie": "Think about strategic high ground.",
      "katrina": "Ask why forts were built above harbors.",
      "emma": "Connect defense, trade, and water routes.",
      "eliette": "Find cannon and uniform details.",
      "jules": "Fort mission.",
      "momdad": "Excellent military and Straits-history side trip."
    },
    "csvOrder": 68
  },
  {
    "id": "P2-034",
    "title": "Arch Rock",
    "name": "Arch Rock",
    "category": "Scenic / Geology",
    "latitude": 45.859,
    "longitude": -84.61,
    "lat": 45.859,
    "lon": -84.61,
    "lng": -84.61,
    "phase": "Phase 2",
    "routeSegment": "Mackinac Island / Straits",
    "route_segment": "Mackinac Island / Straits",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.mackinacparks.com/parks-and-attractions/arch-rock/",
    "official_website": "https://www.mackinacparks.com/parks-and-attractions/arch-rock/",
    "learnMoreUrl": "https://www.mackinacparks.com/parks-and-attractions/arch-rock/",
    "learn_more": "https://www.mackinacparks.com/parks-and-attractions/arch-rock/",
    "sourceUrl": "https://www.mackinacparks.com/parks-and-attractions/arch-rock/",
    "shortSummary": "Natural limestone arch on Mackinac Island.",
    "summary": "Natural limestone arch on Mackinac Island.",
    "whyItMatters": "Strong geology/photo side trip.",
    "why": "Strong geology/photo side trip.",
    "notes": {
      "elsie": "Think about how rock formations change over time.",
      "katrina": "Ask what made the arch shape.",
      "emma": "Connect water, rock, and erosion.",
      "eliette": "Find the best frame for a photo.",
      "jules": "Rock arch mission.",
      "momdad": "Strong geology/photo side trip."
    },
    "profiles": {
      "elsie": "Think about how rock formations change over time.",
      "katrina": "Ask what made the arch shape.",
      "emma": "Connect water, rock, and erosion.",
      "eliette": "Find the best frame for a photo.",
      "jules": "Rock arch mission.",
      "momdad": "Strong geology/photo side trip."
    },
    "csvOrder": 69
  },
  {
    "id": "P2-035",
    "title": "Museum of Ojibwa Culture",
    "name": "Museum of Ojibwa Culture",
    "category": "Museum",
    "latitude": 45.8686,
    "longitude": -84.7278,
    "lat": 45.8686,
    "lon": -84.7278,
    "lng": -84.7278,
    "phase": "Phase 2",
    "routeSegment": "St. Ignace / Straits",
    "route_segment": "St. Ignace / Straits",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.cityofstignace.com/museum-ojibwa-culture",
    "official_website": "https://www.cityofstignace.com/museum-ojibwa-culture",
    "learnMoreUrl": "https://www.cityofstignace.com/museum-ojibwa-culture",
    "learn_more": "https://www.cityofstignace.com/museum-ojibwa-culture",
    "sourceUrl": "https://www.cityofstignace.com/museum-ojibwa-culture",
    "shortSummary": "Museum focused on Ojibwa culture in St. Ignace.",
    "summary": "Museum focused on Ojibwa culture in St. Ignace.",
    "whyItMatters": "Important Indigenous history context for the Straits.",
    "why": "Important Indigenous history context for the Straits.",
    "notes": {
      "elsie": "Think about whose stories came first in the region.",
      "katrina": "Ask how culture and place connect.",
      "emma": "Connect language, art, and daily life.",
      "eliette": "Look for patterns, tools, and symbols.",
      "jules": "Story and culture mission.",
      "momdad": "Important Indigenous history context for the Straits."
    },
    "profiles": {
      "elsie": "Think about whose stories came first in the region.",
      "katrina": "Ask how culture and place connect.",
      "emma": "Connect language, art, and daily life.",
      "eliette": "Look for patterns, tools, and symbols.",
      "jules": "Story and culture mission.",
      "momdad": "Important Indigenous history context for the Straits."
    },
    "csvOrder": 70
  },
  {
    "id": "P3-001",
    "title": "Soo Locks Visitor Center",
    "name": "Soo Locks Visitor Center",
    "category": "Engineering / Maritime",
    "latitude": 46.5036,
    "longitude": -84.3453,
    "lat": 46.5036,
    "lon": -84.3453,
    "lng": -84.3453,
    "phase": "Phase 3",
    "routeSegment": "Eastern Upper Peninsula",
    "route_segment": "Eastern Upper Peninsula",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.lrd.usace.army.mil/Submit-ArticleCS/Recreation/Article/3833525/soo-locks-visitor-center/",
    "official_website": "https://www.lrd.usace.army.mil/Submit-ArticleCS/Recreation/Article/3833525/soo-locks-visitor-center/",
    "learnMoreUrl": "https://www.lrd.usace.army.mil/Submit-ArticleCS/Recreation/Article/3833525/soo-locks-visitor-center/",
    "learn_more": "https://www.lrd.usace.army.mil/Submit-ArticleCS/Recreation/Article/3833525/soo-locks-visitor-center/",
    "sourceUrl": "https://www.lrd.usace.army.mil/Submit-ArticleCS/Recreation/Article/3833525/soo-locks-visitor-center/",
    "shortSummary": "Visitor center for the Soo Locks in Sault Ste. Marie.",
    "summary": "Visitor center for the Soo Locks in Sault Ste. Marie.",
    "whyItMatters": "Great engineering side trip showing Great Lakes shipping.",
    "why": "Great engineering side trip showing Great Lakes shipping.",
    "notes": {
      "elsie": "Think about how ships move between lake levels.",
      "katrina": "Ask why locks are needed.",
      "emma": "Connect shipping to food, cars, and goods.",
      "eliette": "Find big gates and ship details.",
      "jules": "Giant boat gate mission.",
      "momdad": "Great engineering side trip showing Great Lakes shipping."
    },
    "profiles": {
      "elsie": "Think about how ships move between lake levels.",
      "katrina": "Ask why locks are needed.",
      "emma": "Connect shipping to food, cars, and goods.",
      "eliette": "Find big gates and ship details.",
      "jules": "Giant boat gate mission.",
      "momdad": "Great engineering side trip showing Great Lakes shipping."
    },
    "csvOrder": 71
  },
  {
    "id": "P3-002",
    "title": "Tahquamenon Falls State Park",
    "name": "Tahquamenon Falls State Park",
    "category": "State Park / Waterfall",
    "latitude": 46.574,
    "longitude": -85.256,
    "lat": 46.574,
    "lon": -85.256,
    "lng": -85.256,
    "phase": "Phase 3",
    "routeSegment": "Eastern Upper Peninsula",
    "route_segment": "Eastern Upper Peninsula",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/tahquamenon-falls",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/tahquamenon-falls",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/tahquamenon-falls",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/tahquamenon-falls",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/tahquamenon-falls",
    "shortSummary": "Famous Upper Peninsula waterfall park.",
    "summary": "Famous Upper Peninsula waterfall park.",
    "whyItMatters": "Top nature extension near the Straits region.",
    "why": "Top nature extension near the Straits region.",
    "notes": {
      "elsie": "Think about water power and forest ecosystems.",
      "katrina": "Ask why the water color looks different.",
      "emma": "Connect rivers, forests, and erosion.",
      "eliette": "Find foam, color, rocks, and trail details.",
      "jules": "Waterfall mission.",
      "momdad": "Top nature extension near the Straits region."
    },
    "profiles": {
      "elsie": "Think about water power and forest ecosystems.",
      "katrina": "Ask why the water color looks different.",
      "emma": "Connect rivers, forests, and erosion.",
      "eliette": "Find foam, color, rocks, and trail details.",
      "jules": "Waterfall mission.",
      "momdad": "Top nature extension near the Straits region."
    },
    "csvOrder": 72
  },
  {
    "id": "P3-003",
    "title": "Great Lakes Shipwreck Museum / Whitefish Point Light",
    "name": "Great Lakes Shipwreck Museum / Whitefish Point Light",
    "category": "Maritime Museum",
    "latitude": 46.7706,
    "longitude": -84.9571,
    "lat": 46.7706,
    "lon": -84.9571,
    "lng": -84.9571,
    "phase": "Phase 3",
    "routeSegment": "Whitefish Point / Michigan",
    "route_segment": "Whitefish Point / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://shipwreckmuseum.com/",
    "official_website": "https://shipwreckmuseum.com/",
    "learnMoreUrl": "https://shipwreckmuseum.com/",
    "learn_more": "https://shipwreckmuseum.com/",
    "sourceUrl": "https://shipwreckmuseum.com/",
    "shortSummary": "Maritime museum and lighthouse at Whitefish Point.",
    "summary": "Maritime museum and lighthouse at Whitefish Point.",
    "whyItMatters": "Major shipwreck and Great Lakes history stop.",
    "why": "Major shipwreck and Great Lakes history stop.",
    "notes": {
      "elsie": "Think about weather, risk, and navigation.",
      "katrina": "Ask why Lake Superior is dangerous for ships.",
      "emma": "Connect storms, cargo, and lighthouses.",
      "eliette": "Find lighthouse and shipwreck details.",
      "jules": "Shipwreck mission.",
      "momdad": "Major shipwreck and Great Lakes history stop."
    },
    "profiles": {
      "elsie": "Think about weather, risk, and navigation.",
      "katrina": "Ask why Lake Superior is dangerous for ships.",
      "emma": "Connect storms, cargo, and lighthouses.",
      "eliette": "Find lighthouse and shipwreck details.",
      "jules": "Shipwreck mission.",
      "momdad": "Major shipwreck and Great Lakes history stop."
    },
    "csvOrder": 73
  },
  {
    "id": "P3-004",
    "title": "Castle Rock",
    "name": "Castle Rock",
    "category": "Roadside Oddity",
    "latitude": 45.8683,
    "longitude": -84.7264,
    "lat": 45.8683,
    "lon": -84.7264,
    "lng": -84.7264,
    "phase": "Phase 3",
    "routeSegment": "St. Ignace / Michigan",
    "route_segment": "St. Ignace / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://www.stignace.com/attractions/castle-rock/",
    "official_website": "https://www.stignace.com/attractions/castle-rock/",
    "learnMoreUrl": "https://www.stignace.com/attractions/castle-rock/",
    "learn_more": "https://www.stignace.com/attractions/castle-rock/",
    "sourceUrl": "https://www.stignace.com/attractions/castle-rock/",
    "shortSummary": "Classic St. Ignace roadside overlook and attraction.",
    "summary": "Classic St. Ignace roadside overlook and attraction.",
    "whyItMatters": "Quick oddity/photo stop near the Straits.",
    "why": "Quick oddity/photo stop near the Straits.",
    "notes": {
      "elsie": "Think about why overlooks become attractions.",
      "katrina": "Ask what makes a good road-trip photo.",
      "emma": "Look for views and tourist signs.",
      "eliette": "Find the best photo detail.",
      "jules": "Big rock mission.",
      "momdad": "Quick oddity/photo stop near the Straits."
    },
    "profiles": {
      "elsie": "Think about why overlooks become attractions.",
      "katrina": "Ask what makes a good road-trip photo.",
      "emma": "Look for views and tourist signs.",
      "eliette": "Find the best photo detail.",
      "jules": "Big rock mission.",
      "momdad": "Quick oddity/photo stop near the Straits."
    },
    "csvOrder": 74
  },
  {
    "id": "P3-005",
    "title": "Mystery Spot",
    "name": "Mystery Spot",
    "category": "Roadside Oddity",
    "latitude": 45.868,
    "longitude": -84.789,
    "lat": 45.868,
    "lon": -84.789,
    "lng": -84.789,
    "phase": "Phase 3",
    "routeSegment": "St. Ignace / Michigan",
    "route_segment": "St. Ignace / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.mysteryspotstignace.com/",
    "official_website": "https://www.mysteryspotstignace.com/",
    "learnMoreUrl": "https://www.mysteryspotstignace.com/",
    "learn_more": "https://www.mysteryspotstignace.com/",
    "sourceUrl": "https://www.mysteryspotstignace.com/",
    "shortSummary": "Classic roadside mystery attraction near St. Ignace.",
    "summary": "Classic roadside mystery attraction near St. Ignace.",
    "whyItMatters": "Good quirky stop for kids and road-trip fun.",
    "why": "Good quirky stop for kids and road-trip fun.",
    "notes": {
      "elsie": "Think about perception and balance.",
      "katrina": "Ask what feels real versus tricked.",
      "emma": "Connect senses to science.",
      "eliette": "Look for clues in the room design.",
      "jules": "Weird gravity mission.",
      "momdad": "Good quirky stop for kids and road-trip fun."
    },
    "profiles": {
      "elsie": "Think about perception and balance.",
      "katrina": "Ask what feels real versus tricked.",
      "emma": "Connect senses to science.",
      "eliette": "Look for clues in the room design.",
      "jules": "Weird gravity mission.",
      "momdad": "Good quirky stop for kids and road-trip fun."
    },
    "csvOrder": 75
  },
  {
    "id": "P3-006",
    "title": "Levi and Catharine Coffin State Historic Site",
    "name": "Levi and Catharine Coffin State Historic Site",
    "category": "Historic Site",
    "latitude": 39.9565,
    "longitude": -84.9183,
    "lat": 39.9565,
    "lon": -84.9183,
    "lng": -84.9183,
    "phase": "Phase 3",
    "routeSegment": "Indiana return corridor",
    "route_segment": "Indiana return corridor",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "official_website": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "learnMoreUrl": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "learn_more": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "sourceUrl": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "shortSummary": "Underground Railroad historic site in Fountain City, Indiana.",
    "summary": "Underground Railroad historic site in Fountain City, Indiana.",
    "whyItMatters": "Powerful history stop on the return corridor with a direct justice and courage story.",
    "why": "Powerful history stop on the return corridor with a direct justice and courage story.",
    "notes": {
      "elsie": "Think about moral courage and risk.",
      "katrina": "Ask why helping people escape slavery was dangerous.",
      "emma": "Connect fairness, courage, and choices.",
      "eliette": "Look for hidden-room or house details.",
      "jules": "Safe-house mission.",
      "momdad": "Powerful history stop on the return corridor with a direct justice and courage story."
    },
    "profiles": {
      "elsie": "Think about moral courage and risk.",
      "katrina": "Ask why helping people escape slavery was dangerous.",
      "emma": "Connect fairness, courage, and choices.",
      "eliette": "Look for hidden-room or house details.",
      "jules": "Safe-house mission.",
      "momdad": "Powerful history stop on the return corridor with a direct justice and courage story."
    },
    "csvOrder": 76
  },
  {
    "id": "P3-007",
    "title": "Hayes Arboretum",
    "name": "Hayes Arboretum",
    "category": "Nature Preserve",
    "latitude": 39.8286,
    "longitude": -84.856,
    "lat": 39.8286,
    "lon": -84.856,
    "lng": -84.856,
    "phase": "Phase 3",
    "routeSegment": "Richmond / Indiana",
    "route_segment": "Richmond / Indiana",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://hayesarboretum.org/",
    "official_website": "https://hayesarboretum.org/",
    "learnMoreUrl": "https://hayesarboretum.org/",
    "learn_more": "https://hayesarboretum.org/",
    "sourceUrl": "https://hayesarboretum.org/",
    "shortSummary": "Large arboretum and nature area in Richmond, Indiana.",
    "summary": "Large arboretum and nature area in Richmond, Indiana.",
    "whyItMatters": "Good outdoor reset with trees, trails, and local ecology.",
    "why": "Good outdoor reset with trees, trails, and local ecology.",
    "notes": {
      "elsie": "Compare tree shapes and habitats.",
      "katrina": "Ask why people protect tree collections.",
      "emma": "Connect forests to clean air and shade.",
      "eliette": "Find bark, leaves, and trail markers.",
      "jules": "Tree mission.",
      "momdad": "Good outdoor reset with trees, trails, and local ecology."
    },
    "profiles": {
      "elsie": "Compare tree shapes and habitats.",
      "katrina": "Ask why people protect tree collections.",
      "emma": "Connect forests to clean air and shade.",
      "eliette": "Find bark, leaves, and trail markers.",
      "jules": "Tree mission.",
      "momdad": "Good outdoor reset with trees, trails, and local ecology."
    },
    "csvOrder": 77
  },
  {
    "id": "P3-008",
    "title": "Richmond Rose Garden",
    "name": "Richmond Rose Garden",
    "category": "Garden",
    "latitude": 39.8281,
    "longitude": -84.8794,
    "lat": 39.8281,
    "lon": -84.8794,
    "lng": -84.8794,
    "phase": "Phase 3",
    "routeSegment": "Richmond / Indiana",
    "route_segment": "Richmond / Indiana",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://richmondrosegarden.com/",
    "official_website": "https://richmondrosegarden.com/",
    "learnMoreUrl": "https://richmondrosegarden.com/",
    "learn_more": "https://richmondrosegarden.com/",
    "sourceUrl": "https://richmondrosegarden.com/",
    "shortSummary": "Public rose garden in Richmond, Indiana.",
    "summary": "Public rose garden in Richmond, Indiana.",
    "whyItMatters": "Short colorful reset with easy visual interest.",
    "why": "Short colorful reset with easy visual interest.",
    "notes": {
      "elsie": "Notice color, pattern, and plant design.",
      "katrina": "Ask why public gardens matter to towns.",
      "emma": "Connect beauty, parks, and community life.",
      "eliette": "Pick the best rose detail.",
      "jules": "Flower mission.",
      "momdad": "Short colorful reset with easy visual interest."
    },
    "profiles": {
      "elsie": "Notice color, pattern, and plant design.",
      "katrina": "Ask why public gardens matter to towns.",
      "emma": "Connect beauty, parks, and community life.",
      "eliette": "Pick the best rose detail.",
      "jules": "Flower mission.",
      "momdad": "Short colorful reset with easy visual interest."
    },
    "csvOrder": 78
  },
  {
    "id": "P3-009",
    "title": "Wayne County Historical Museum",
    "name": "Wayne County Historical Museum",
    "category": "History Museum",
    "latitude": 39.8285,
    "longitude": -84.895,
    "lat": 39.8285,
    "lon": -84.895,
    "lng": -84.895,
    "phase": "Phase 3",
    "routeSegment": "Richmond / Indiana",
    "route_segment": "Richmond / Indiana",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://waynecountyhistoricalmuseum.org/",
    "official_website": "https://waynecountyhistoricalmuseum.org/",
    "learnMoreUrl": "https://waynecountyhistoricalmuseum.org/",
    "learn_more": "https://waynecountyhistoricalmuseum.org/",
    "sourceUrl": "https://waynecountyhistoricalmuseum.org/",
    "shortSummary": "Local history museum in Richmond, Indiana.",
    "summary": "Local history museum in Richmond, Indiana.",
    "whyItMatters": "Adds small-city history and artifact variety to the return drive.",
    "why": "Adds small-city history and artifact variety to the return drive.",
    "notes": {
      "elsie": "Notice how local objects tell big stories.",
      "katrina": "Ask what makes a town remember certain things.",
      "emma": "Compare old daily life with today.",
      "eliette": "Find the strangest old object.",
      "jules": "Old-stuff mission.",
      "momdad": "Adds small-city history and artifact variety to the return drive."
    },
    "profiles": {
      "elsie": "Notice how local objects tell big stories.",
      "katrina": "Ask what makes a town remember certain things.",
      "emma": "Compare old daily life with today.",
      "eliette": "Find the strangest old object.",
      "jules": "Old-stuff mission.",
      "momdad": "Adds small-city history and artifact variety to the return drive."
    },
    "csvOrder": 79
  },
  {
    "id": "P3-010",
    "title": "Indianapolis Motor Speedway Museum",
    "name": "Indianapolis Motor Speedway Museum",
    "category": "Automotive Museum",
    "latitude": 39.7934,
    "longitude": -86.2352,
    "lat": 39.7934,
    "lon": -86.2352,
    "lng": -86.2352,
    "phase": "Phase 3",
    "routeSegment": "Indianapolis / Indiana",
    "route_segment": "Indianapolis / Indiana",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://imsmuseum.org/",
    "official_website": "https://imsmuseum.org/",
    "learnMoreUrl": "https://imsmuseum.org/",
    "learn_more": "https://imsmuseum.org/",
    "sourceUrl": "https://imsmuseum.org/",
    "shortSummary": "Museum at the Indianapolis Motor Speedway focused on racing history.",
    "summary": "Museum at the Indianapolis Motor Speedway focused on racing history.",
    "whyItMatters": "High-impact stop for cars, engineering, sports, and Indianapolis identity.",
    "why": "High-impact stop for cars, engineering, sports, and Indianapolis identity.",
    "notes": {
      "elsie": "Track how racing technology changed.",
      "katrina": "Ask why one race became world-famous.",
      "emma": "Connect sports, teams, speed, and tradition.",
      "eliette": "Find the best car color or logo.",
      "jules": "Race car mission.",
      "momdad": "High-impact stop for cars, engineering, sports, and Indianapolis identity."
    },
    "profiles": {
      "elsie": "Track how racing technology changed.",
      "katrina": "Ask why one race became world-famous.",
      "emma": "Connect sports, teams, speed, and tradition.",
      "eliette": "Find the best car color or logo.",
      "jules": "Race car mission.",
      "momdad": "High-impact stop for cars, engineering, sports, and Indianapolis identity."
    },
    "csvOrder": 80
  },
  {
    "id": "P3-011",
    "title": "The Children's Museum of Indianapolis",
    "name": "The Children's Museum of Indianapolis",
    "category": "Children's Museum",
    "latitude": 39.8106,
    "longitude": -86.1579,
    "lat": 39.8106,
    "lon": -86.1579,
    "lng": -86.1579,
    "phase": "Phase 3",
    "routeSegment": "Indianapolis / Indiana",
    "route_segment": "Indianapolis / Indiana",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.childrensmuseum.org/",
    "official_website": "https://www.childrensmuseum.org/",
    "learnMoreUrl": "https://www.childrensmuseum.org/",
    "learn_more": "https://www.childrensmuseum.org/",
    "sourceUrl": "https://www.childrensmuseum.org/",
    "shortSummary": "Large children's museum with science, history, and dinosaur exhibits.",
    "summary": "Large children's museum with science, history, and dinosaur exhibits.",
    "whyItMatters": "Excellent high-energy family stop on the return corridor.",
    "why": "Excellent high-energy family stop on the return corridor.",
    "notes": {
      "elsie": "Pick one exhibit and explain its story.",
      "katrina": "Ask what makes a museum fun and educational.",
      "emma": "Connect play with learning.",
      "eliette": "Find one tiny detail others miss.",
      "jules": "Dinosaur and button mission.",
      "momdad": "Excellent high-energy family stop on the return corridor."
    },
    "profiles": {
      "elsie": "Pick one exhibit and explain its story.",
      "katrina": "Ask what makes a museum fun and educational.",
      "emma": "Connect play with learning.",
      "eliette": "Find one tiny detail others miss.",
      "jules": "Dinosaur and button mission.",
      "momdad": "Excellent high-energy family stop on the return corridor."
    },
    "csvOrder": 81
  },
  {
    "id": "P3-012",
    "title": "Indiana State Museum",
    "name": "Indiana State Museum",
    "category": "State Museum",
    "latitude": 39.7687,
    "longitude": -86.1693,
    "lat": 39.7687,
    "lon": -86.1693,
    "lng": -86.1693,
    "phase": "Phase 3",
    "routeSegment": "Indianapolis / Indiana",
    "route_segment": "Indianapolis / Indiana",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.indianamuseum.org/",
    "official_website": "https://www.indianamuseum.org/",
    "learnMoreUrl": "https://www.indianamuseum.org/",
    "learn_more": "https://www.indianamuseum.org/",
    "sourceUrl": "https://www.indianamuseum.org/",
    "shortSummary": "Museum covering Indiana history, science, and culture.",
    "summary": "Museum covering Indiana history, science, and culture.",
    "whyItMatters": "Strong indoor stop for state context on the drive home.",
    "why": "Strong indoor stop for state context on the drive home.",
    "notes": {
      "elsie": "Compare Indiana's story with Kansas and Michigan.",
      "katrina": "Ask what makes a state unique.",
      "emma": "Connect fossils, history, and daily life.",
      "eliette": "Find an object with a surprising story.",
      "jules": "Indiana museum mission.",
      "momdad": "Strong indoor stop for state context on the drive home."
    },
    "profiles": {
      "elsie": "Compare Indiana's story with Kansas and Michigan.",
      "katrina": "Ask what makes a state unique.",
      "emma": "Connect fossils, history, and daily life.",
      "eliette": "Find an object with a surprising story.",
      "jules": "Indiana museum mission.",
      "momdad": "Strong indoor stop for state context on the drive home."
    },
    "csvOrder": 82
  },
  {
    "id": "P3-013",
    "title": "Eiteljorg Museum",
    "name": "Eiteljorg Museum",
    "category": "Art / Native American History",
    "latitude": 39.7681,
    "longitude": -86.1677,
    "lat": 39.7681,
    "lon": -86.1677,
    "lng": -86.1677,
    "phase": "Phase 3",
    "routeSegment": "Indianapolis / Indiana",
    "route_segment": "Indianapolis / Indiana",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://eiteljorg.org/",
    "official_website": "https://eiteljorg.org/",
    "learnMoreUrl": "https://eiteljorg.org/",
    "learn_more": "https://eiteljorg.org/",
    "sourceUrl": "https://eiteljorg.org/",
    "shortSummary": "Museum of Native American and Western art in Indianapolis.",
    "summary": "Museum of Native American and Western art in Indianapolis.",
    "whyItMatters": "Adds art and Indigenous history perspective to the route.",
    "why": "Adds art and Indigenous history perspective to the route.",
    "notes": {
      "elsie": "Think about art as history.",
      "katrina": "Ask whose stories are shown in museums.",
      "emma": "Connect people, places, and images.",
      "eliette": "Find patterns, colors, and symbols.",
      "jules": "Art clue mission.",
      "momdad": "Adds art and Indigenous history perspective to the route."
    },
    "profiles": {
      "elsie": "Think about art as history.",
      "katrina": "Ask whose stories are shown in museums.",
      "emma": "Connect people, places, and images.",
      "eliette": "Find patterns, colors, and symbols.",
      "jules": "Art clue mission.",
      "momdad": "Adds art and Indigenous history perspective to the route."
    },
    "csvOrder": 83
  },
  {
    "id": "P3-014",
    "title": "Conner Prairie",
    "name": "Conner Prairie",
    "category": "Living History Museum",
    "latitude": 39.9844,
    "longitude": -86.0331,
    "lat": 39.9844,
    "lon": -86.0331,
    "lng": -86.0331,
    "phase": "Phase 3",
    "routeSegment": "Fishers / Indiana",
    "route_segment": "Fishers / Indiana",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.connerprairie.org/",
    "official_website": "https://www.connerprairie.org/",
    "learnMoreUrl": "https://www.connerprairie.org/",
    "learn_more": "https://www.connerprairie.org/",
    "sourceUrl": "https://www.connerprairie.org/",
    "shortSummary": "Living history museum in Fishers, Indiana.",
    "summary": "Living history museum in Fishers, Indiana.",
    "whyItMatters": "Hands-on family history stop with immersive pioneer-era interpretation.",
    "why": "Hands-on family history stop with immersive pioneer-era interpretation.",
    "notes": {
      "elsie": "Compare old work and modern life.",
      "katrina": "Ask what chores kids did long ago.",
      "emma": "Connect homes, food, work, and weather.",
      "eliette": "Look for clothing, tools, and craft details.",
      "jules": "Old-time village mission.",
      "momdad": "Hands-on family history stop with immersive pioneer-era interpretation."
    },
    "profiles": {
      "elsie": "Compare old work and modern life.",
      "katrina": "Ask what chores kids did long ago.",
      "emma": "Connect homes, food, work, and weather.",
      "eliette": "Look for clothing, tools, and craft details.",
      "jules": "Old-time village mission.",
      "momdad": "Hands-on family history stop with immersive pioneer-era interpretation."
    },
    "csvOrder": 84
  },
  {
    "id": "P3-015",
    "title": "Fort Wayne Zoo",
    "name": "Fort Wayne Zoo",
    "category": "Zoo",
    "latitude": 41.0929,
    "longitude": -85.1436,
    "lat": 41.0929,
    "lon": -85.1436,
    "lng": -85.1436,
    "phase": "Phase 3",
    "routeSegment": "Fort Wayne / Indiana",
    "route_segment": "Fort Wayne / Indiana",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://fwzoo.com/",
    "official_website": "https://fwzoo.com/",
    "learnMoreUrl": "https://fwzoo.com/",
    "learn_more": "https://fwzoo.com/",
    "sourceUrl": "https://fwzoo.com/",
    "shortSummary": "Regional zoo in Fort Wayne.",
    "summary": "Regional zoo in Fort Wayne.",
    "whyItMatters": "Good kid-friendly stop if taking a northern Indiana return variation.",
    "why": "Good kid-friendly stop if taking a northern Indiana return variation.",
    "notes": {
      "elsie": "Think about animal care and habitats.",
      "katrina": "Ask why conservation matters.",
      "emma": "Pick one animal and describe its routine.",
      "eliette": "Find colors, patterns, and signs.",
      "jules": "Animal mission.",
      "momdad": "Good kid-friendly stop if taking a northern Indiana return variation."
    },
    "profiles": {
      "elsie": "Think about animal care and habitats.",
      "katrina": "Ask why conservation matters.",
      "emma": "Pick one animal and describe its routine.",
      "eliette": "Find colors, patterns, and signs.",
      "jules": "Animal mission.",
      "momdad": "Good kid-friendly stop if taking a northern Indiana return variation."
    },
    "csvOrder": 85
  },
  {
    "id": "P3-016",
    "title": "Foellinger-Freimann Botanical Conservatory",
    "name": "Foellinger-Freimann Botanical Conservatory",
    "category": "Garden",
    "latitude": 41.077,
    "longitude": -85.1374,
    "lat": 41.077,
    "lon": -85.1374,
    "lng": -85.1374,
    "phase": "Phase 3",
    "routeSegment": "Fort Wayne / Indiana",
    "route_segment": "Fort Wayne / Indiana",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.botanicalconservatory.org/",
    "official_website": "https://www.botanicalconservatory.org/",
    "learnMoreUrl": "https://www.botanicalconservatory.org/",
    "learn_more": "https://www.botanicalconservatory.org/",
    "sourceUrl": "https://www.botanicalconservatory.org/",
    "shortSummary": "Indoor botanical conservatory in downtown Fort Wayne.",
    "summary": "Indoor botanical conservatory in downtown Fort Wayne.",
    "whyItMatters": "Weather-proof plant and design stop.",
    "why": "Weather-proof plant and design stop.",
    "notes": {
      "elsie": "Notice how indoor environments can mimic nature.",
      "katrina": "Ask why some plants need special climates.",
      "emma": "Connect temperature, humidity, and plants.",
      "eliette": "Find textures and unusual leaves.",
      "jules": "Jungle plant mission.",
      "momdad": "Weather-proof plant and design stop."
    },
    "profiles": {
      "elsie": "Notice how indoor environments can mimic nature.",
      "katrina": "Ask why some plants need special climates.",
      "emma": "Connect temperature, humidity, and plants.",
      "eliette": "Find textures and unusual leaves.",
      "jules": "Jungle plant mission.",
      "momdad": "Weather-proof plant and design stop."
    },
    "csvOrder": 86
  },
  {
    "id": "P3-017",
    "title": "Kalamazoo Valley Museum",
    "name": "Kalamazoo Valley Museum",
    "category": "Science / History Museum",
    "latitude": 42.2925,
    "longitude": -85.5836,
    "lat": 42.2925,
    "lon": -85.5836,
    "lng": -85.5836,
    "phase": "Phase 2",
    "routeSegment": "Kalamazoo / Michigan",
    "route_segment": "Kalamazoo / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://kalamazoomuseum.org/",
    "official_website": "https://kalamazoomuseum.org/",
    "learnMoreUrl": "https://kalamazoomuseum.org/",
    "learn_more": "https://kalamazoomuseum.org/",
    "sourceUrl": "https://kalamazoomuseum.org/",
    "shortSummary": "Hands-on museum focused on science, technology, and history.",
    "summary": "Hands-on museum focused on science, technology, and history.",
    "whyItMatters": "Good family museum near the Michigan corridor.",
    "why": "Good family museum near the Michigan corridor.",
    "notes": {
      "elsie": "Choose one exhibit and explain it like a teacher.",
      "katrina": "Ask why local inventions matter.",
      "emma": "Connect science to everyday things.",
      "eliette": "Find one odd artifact.",
      "jules": "Museum discovery mission.",
      "momdad": "Good family museum near the Michigan corridor."
    },
    "profiles": {
      "elsie": "Choose one exhibit and explain it like a teacher.",
      "katrina": "Ask why local inventions matter.",
      "emma": "Connect science to everyday things.",
      "eliette": "Find one odd artifact.",
      "jules": "Museum discovery mission.",
      "momdad": "Good family museum near the Michigan corridor."
    },
    "csvOrder": 87
  },
  {
    "id": "P3-018",
    "title": "Kalamazoo Nature Center",
    "name": "Kalamazoo Nature Center",
    "category": "Nature Center",
    "latitude": 42.3825,
    "longitude": -85.5884,
    "lat": 42.3825,
    "lon": -85.5884,
    "lng": -85.5884,
    "phase": "Phase 2",
    "routeSegment": "Kalamazoo / Michigan",
    "route_segment": "Kalamazoo / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://naturecenter.org/",
    "official_website": "https://naturecenter.org/",
    "learnMoreUrl": "https://naturecenter.org/",
    "learn_more": "https://naturecenter.org/",
    "sourceUrl": "https://naturecenter.org/",
    "shortSummary": "Nature center with trails and environmental education.",
    "summary": "Nature center with trails and environmental education.",
    "whyItMatters": "Outdoor reset with a strong nature-learning purpose.",
    "why": "Outdoor reset with a strong nature-learning purpose.",
    "notes": {
      "elsie": "Watch for habitat changes on trails.",
      "katrina": "Ask why protected land matters near cities.",
      "emma": "Connect hiking, weather, and wildlife.",
      "eliette": "Find small trail details.",
      "jules": "Nature walk mission.",
      "momdad": "Outdoor reset with a strong nature-learning purpose."
    },
    "profiles": {
      "elsie": "Watch for habitat changes on trails.",
      "katrina": "Ask why protected land matters near cities.",
      "emma": "Connect hiking, weather, and wildlife.",
      "eliette": "Find small trail details.",
      "jules": "Nature walk mission.",
      "momdad": "Outdoor reset with a strong nature-learning purpose."
    },
    "csvOrder": 88
  },
  {
    "id": "P3-019",
    "title": "Binder Park Zoo",
    "name": "Binder Park Zoo",
    "category": "Zoo",
    "latitude": 42.2764,
    "longitude": -85.1507,
    "lat": 42.2764,
    "lon": -85.1507,
    "lng": -85.1507,
    "phase": "Phase 2",
    "routeSegment": "Battle Creek / Michigan",
    "route_segment": "Battle Creek / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://binderparkzoo.org/",
    "official_website": "https://binderparkzoo.org/",
    "learnMoreUrl": "https://binderparkzoo.org/",
    "learn_more": "https://binderparkzoo.org/",
    "sourceUrl": "https://binderparkzoo.org/",
    "shortSummary": "Large zoo near Battle Creek, Michigan.",
    "summary": "Large zoo near Battle Creek, Michigan.",
    "whyItMatters": "Good family stop if timing favors a zoo reset.",
    "why": "Good family stop if timing favors a zoo reset.",
    "notes": {
      "elsie": "Compare animals and habitats.",
      "katrina": "Ask why some animals need large spaces.",
      "emma": "Connect conservation to daily choices.",
      "eliette": "Find an animal pattern or footprint.",
      "jules": "Zoo mission.",
      "momdad": "Good family stop if timing favors a zoo reset."
    },
    "profiles": {
      "elsie": "Compare animals and habitats.",
      "katrina": "Ask why some animals need large spaces.",
      "emma": "Connect conservation to daily choices.",
      "eliette": "Find an animal pattern or footprint.",
      "jules": "Zoo mission.",
      "momdad": "Good family stop if timing favors a zoo reset."
    },
    "csvOrder": 89
  },
  {
    "id": "P3-020",
    "title": "Grand Rapids Public Museum",
    "name": "Grand Rapids Public Museum",
    "category": "Museum",
    "latitude": 42.9653,
    "longitude": -85.6769,
    "lat": 42.9653,
    "lon": -85.6769,
    "lng": -85.6769,
    "phase": "Phase 2",
    "routeSegment": "Grand Rapids / Michigan",
    "route_segment": "Grand Rapids / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.grpm.org/",
    "official_website": "https://www.grpm.org/",
    "learnMoreUrl": "https://www.grpm.org/",
    "learn_more": "https://www.grpm.org/",
    "sourceUrl": "https://www.grpm.org/",
    "shortSummary": "Public museum on the Grand River in Grand Rapids.",
    "summary": "Public museum on the Grand River in Grand Rapids.",
    "whyItMatters": "Strong indoor stop for regional history and science.",
    "why": "Strong indoor stop for regional history and science.",
    "notes": {
      "elsie": "Think about how cities collect their stories.",
      "katrina": "Ask what artifacts belong in a city museum.",
      "emma": "Connect rivers, work, and city life.",
      "eliette": "Find the carousel or a favorite object.",
      "jules": "Big museum mission.",
      "momdad": "Strong indoor stop for regional history and science."
    },
    "profiles": {
      "elsie": "Think about how cities collect their stories.",
      "katrina": "Ask what artifacts belong in a city museum.",
      "emma": "Connect rivers, work, and city life.",
      "eliette": "Find the carousel or a favorite object.",
      "jules": "Big museum mission.",
      "momdad": "Strong indoor stop for regional history and science."
    },
    "csvOrder": 90
  },
  {
    "id": "P3-021",
    "title": "Frederik Meijer Gardens & Sculpture Park",
    "name": "Frederik Meijer Gardens & Sculpture Park",
    "category": "Garden / Art Museum",
    "latitude": 42.9804,
    "longitude": -85.5909,
    "lat": 42.9804,
    "lon": -85.5909,
    "lng": -85.5909,
    "phase": "Phase 2",
    "routeSegment": "Grand Rapids / Michigan",
    "route_segment": "Grand Rapids / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://www.meijergardens.org/",
    "official_website": "https://www.meijergardens.org/",
    "learnMoreUrl": "https://www.meijergardens.org/",
    "learn_more": "https://www.meijergardens.org/",
    "sourceUrl": "https://www.meijergardens.org/",
    "shortSummary": "Botanical garden and sculpture park in Grand Rapids.",
    "summary": "Botanical garden and sculpture park in Grand Rapids.",
    "whyItMatters": "Major art-and-nature stop with strong visual appeal.",
    "why": "Major art-and-nature stop with strong visual appeal.",
    "notes": {
      "elsie": "Compare sculpture and landscape design.",
      "katrina": "Ask how outdoor art changes a place.",
      "emma": "Connect plants, paths, and creativity.",
      "eliette": "Find the most interesting sculpture detail.",
      "jules": "Giant art mission.",
      "momdad": "Major art-and-nature stop with strong visual appeal."
    },
    "profiles": {
      "elsie": "Compare sculpture and landscape design.",
      "katrina": "Ask how outdoor art changes a place.",
      "emma": "Connect plants, paths, and creativity.",
      "eliette": "Find the most interesting sculpture detail.",
      "jules": "Giant art mission.",
      "momdad": "Major art-and-nature stop with strong visual appeal."
    },
    "csvOrder": 91
  },
  {
    "id": "P3-022",
    "title": "John Ball Zoo",
    "name": "John Ball Zoo",
    "category": "Zoo",
    "latitude": 42.9631,
    "longitude": -85.7047,
    "lat": 42.9631,
    "lon": -85.7047,
    "lng": -85.7047,
    "phase": "Phase 2",
    "routeSegment": "Grand Rapids / Michigan",
    "route_segment": "Grand Rapids / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 120,
    "estimated_stop_minutes": 120,
    "officialWebsiteUrl": "https://jbzoo.org/",
    "official_website": "https://jbzoo.org/",
    "learnMoreUrl": "https://jbzoo.org/",
    "learn_more": "https://jbzoo.org/",
    "sourceUrl": "https://jbzoo.org/",
    "shortSummary": "Grand Rapids zoo with animal exhibits and conservation focus.",
    "summary": "Grand Rapids zoo with animal exhibits and conservation focus.",
    "whyItMatters": "Family-friendly animal stop on the Michigan leg.",
    "why": "Family-friendly animal stop on the Michigan leg.",
    "notes": {
      "elsie": "Think about zoo design and habitats.",
      "katrina": "Ask what animals need from caretakers.",
      "emma": "Connect conservation to local choices.",
      "eliette": "Find animal colors and signs.",
      "jules": "Animal trail mission.",
      "momdad": "Family-friendly animal stop on the Michigan leg."
    },
    "profiles": {
      "elsie": "Think about zoo design and habitats.",
      "katrina": "Ask what animals need from caretakers.",
      "emma": "Connect conservation to local choices.",
      "eliette": "Find animal colors and signs.",
      "jules": "Animal trail mission.",
      "momdad": "Family-friendly animal stop on the Michigan leg."
    },
    "csvOrder": 92
  },
  {
    "id": "P3-023",
    "title": "Holland State Park",
    "name": "Holland State Park",
    "category": "State Park / Beach",
    "latitude": 42.7728,
    "longitude": -86.2097,
    "lat": 42.7728,
    "lon": -86.2097,
    "lng": -86.2097,
    "phase": "Phase 2",
    "routeSegment": "Holland / Michigan",
    "route_segment": "Holland / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/holland",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/holland",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/holland",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/holland",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/holland",
    "shortSummary": "Lake Michigan beach park near Holland Harbor and Big Red views.",
    "summary": "Lake Michigan beach park near Holland Harbor and Big Red views.",
    "whyItMatters": "Great beach/photo stop on a western Michigan variation.",
    "why": "Great beach/photo stop on a western Michigan variation.",
    "notes": {
      "elsie": "Notice waves, dunes, and harbor traffic.",
      "katrina": "Ask why beaches and harbors change over time.",
      "emma": "Connect lake weather to travel plans.",
      "eliette": "Find sand, water, and lighthouse details.",
      "jules": "Beach mission.",
      "momdad": "Great beach/photo stop on a western Michigan variation."
    },
    "profiles": {
      "elsie": "Notice waves, dunes, and harbor traffic.",
      "katrina": "Ask why beaches and harbors change over time.",
      "emma": "Connect lake weather to travel plans.",
      "eliette": "Find sand, water, and lighthouse details.",
      "jules": "Beach mission.",
      "momdad": "Great beach/photo stop on a western Michigan variation."
    },
    "csvOrder": 93
  },
  {
    "id": "P3-024",
    "title": "Windmill Island Gardens",
    "name": "Windmill Island Gardens",
    "category": "Garden / Cultural Site",
    "latitude": 42.798,
    "longitude": -86.1079,
    "lat": 42.798,
    "lon": -86.1079,
    "lng": -86.1079,
    "phase": "Phase 2",
    "routeSegment": "Holland / Michigan",
    "route_segment": "Holland / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.cityofholland.com/471/Windmill-Island-Gardens",
    "official_website": "https://www.cityofholland.com/471/Windmill-Island-Gardens",
    "learnMoreUrl": "https://www.cityofholland.com/471/Windmill-Island-Gardens",
    "learn_more": "https://www.cityofholland.com/471/Windmill-Island-Gardens",
    "sourceUrl": "https://www.cityofholland.com/471/Windmill-Island-Gardens",
    "shortSummary": "Holland attraction with gardens and a Dutch windmill.",
    "summary": "Holland attraction with gardens and a Dutch windmill.",
    "whyItMatters": "Good visual stop with cultural and mechanical hooks.",
    "why": "Good visual stop with cultural and mechanical hooks.",
    "notes": {
      "elsie": "Think about immigrant traditions and place identity.",
      "katrina": "Ask why a town celebrates Dutch heritage.",
      "emma": "Connect machines, gardens, and culture.",
      "eliette": "Find tulip, windmill, or costume details.",
      "jules": "Windmill mission.",
      "momdad": "Good visual stop with cultural and mechanical hooks."
    },
    "profiles": {
      "elsie": "Think about immigrant traditions and place identity.",
      "katrina": "Ask why a town celebrates Dutch heritage.",
      "emma": "Connect machines, gardens, and culture.",
      "eliette": "Find tulip, windmill, or costume details.",
      "jules": "Windmill mission.",
      "momdad": "Good visual stop with cultural and mechanical hooks."
    },
    "csvOrder": 94
  },
  {
    "id": "P3-025",
    "title": "Grand Haven State Park",
    "name": "Grand Haven State Park",
    "category": "State Park / Beach",
    "latitude": 43.0578,
    "longitude": -86.2461,
    "lat": 43.0578,
    "lon": -86.2461,
    "lng": -86.2461,
    "phase": "Phase 2",
    "routeSegment": "Grand Haven / Michigan",
    "route_segment": "Grand Haven / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/grand-haven",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/grand-haven",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/grand-haven",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/grand-haven",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/grand-haven",
    "shortSummary": "Beach park at Grand Haven with lighthouse views.",
    "summary": "Beach park at Grand Haven with lighthouse views.",
    "whyItMatters": "Good Lake Michigan stretch stop if routed along the lakeshore.",
    "why": "Good Lake Michigan stretch stop if routed along the lakeshore.",
    "notes": {
      "elsie": "Compare beach towns and inland towns.",
      "katrina": "Ask how piers and lights help boats.",
      "emma": "Connect recreation, weather, and water.",
      "eliette": "Find lighthouse and wave details.",
      "jules": "Pier mission.",
      "momdad": "Good Lake Michigan stretch stop if routed along the lakeshore."
    },
    "profiles": {
      "elsie": "Compare beach towns and inland towns.",
      "katrina": "Ask how piers and lights help boats.",
      "emma": "Connect recreation, weather, and water.",
      "eliette": "Find lighthouse and wave details.",
      "jules": "Pier mission.",
      "momdad": "Good Lake Michigan stretch stop if routed along the lakeshore."
    },
    "csvOrder": 95
  },
  {
    "id": "P3-026",
    "title": "Silver Lake State Park",
    "name": "Silver Lake State Park",
    "category": "State Park / Dunes",
    "latitude": 43.6409,
    "longitude": -86.5123,
    "lat": 43.6409,
    "lon": -86.5123,
    "lng": -86.5123,
    "phase": "Phase 2",
    "routeSegment": "Mears / Michigan",
    "route_segment": "Mears / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/silver-lake",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/silver-lake",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/silver-lake",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/silver-lake",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/silver-lake",
    "shortSummary": "State park with dunes, lake, and Lake Michigan access.",
    "summary": "State park with dunes, lake, and Lake Michigan access.",
    "whyItMatters": "High-value dunes stop on a western Michigan route variation.",
    "why": "High-value dunes stop on a western Michigan route variation.",
    "notes": {
      "elsie": "Think about how wind shapes land.",
      "katrina": "Ask why dunes move and change.",
      "emma": "Connect sand, vehicles, water, and safety.",
      "eliette": "Find dune textures and patterns.",
      "jules": "Sand mountain mission.",
      "momdad": "High-value dunes stop on a western Michigan route variation."
    },
    "profiles": {
      "elsie": "Think about how wind shapes land.",
      "katrina": "Ask why dunes move and change.",
      "emma": "Connect sand, vehicles, water, and safety.",
      "eliette": "Find dune textures and patterns.",
      "jules": "Sand mountain mission.",
      "momdad": "High-value dunes stop on a western Michigan route variation."
    },
    "csvOrder": 96
  },
  {
    "id": "P3-027",
    "title": "Little Sable Point Lighthouse",
    "name": "Little Sable Point Lighthouse",
    "category": "Lighthouse",
    "latitude": 43.6512,
    "longitude": -86.5384,
    "lat": 43.6512,
    "lon": -86.5384,
    "lng": -86.5384,
    "phase": "Phase 2",
    "routeSegment": "Mears / Michigan",
    "route_segment": "Mears / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.lakeshorekeepers.org/little-sable-point-lighthouse",
    "official_website": "https://www.lakeshorekeepers.org/little-sable-point-lighthouse",
    "learnMoreUrl": "https://www.lakeshorekeepers.org/little-sable-point-lighthouse",
    "learn_more": "https://www.lakeshorekeepers.org/little-sable-point-lighthouse",
    "sourceUrl": "https://www.lakeshorekeepers.org/little-sable-point-lighthouse",
    "shortSummary": "Historic brick lighthouse near Silver Lake State Park.",
    "summary": "Historic brick lighthouse near Silver Lake State Park.",
    "whyItMatters": "Strong maritime photo stop paired with dunes.",
    "why": "Strong maritime photo stop paired with dunes.",
    "notes": {
      "elsie": "Compare this lighthouse to Straits lights.",
      "katrina": "Ask why lighthouses differ in shape and height.",
      "emma": "Connect shorelines, storms, and safety.",
      "eliette": "Find brick, lens, and tower details.",
      "jules": "Tall tower mission.",
      "momdad": "Strong maritime photo stop paired with dunes."
    },
    "profiles": {
      "elsie": "Compare this lighthouse to Straits lights.",
      "katrina": "Ask why lighthouses differ in shape and height.",
      "emma": "Connect shorelines, storms, and safety.",
      "eliette": "Find brick, lens, and tower details.",
      "jules": "Tall tower mission.",
      "momdad": "Strong maritime photo stop paired with dunes."
    },
    "csvOrder": 97
  },
  {
    "id": "P3-028",
    "title": "Big Sable Point Lighthouse",
    "name": "Big Sable Point Lighthouse",
    "category": "Lighthouse",
    "latitude": 44.0556,
    "longitude": -86.5149,
    "lat": 44.0556,
    "lon": -86.5149,
    "lng": -86.5149,
    "phase": "Phase 2",
    "routeSegment": "Ludington / Michigan",
    "route_segment": "Ludington / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.lakeshorekeepers.org/big-sable-point-lighthouse",
    "official_website": "https://www.lakeshorekeepers.org/big-sable-point-lighthouse",
    "learnMoreUrl": "https://www.lakeshorekeepers.org/big-sable-point-lighthouse",
    "learn_more": "https://www.lakeshorekeepers.org/big-sable-point-lighthouse",
    "sourceUrl": "https://www.lakeshorekeepers.org/big-sable-point-lighthouse",
    "shortSummary": "Historic lighthouse in Ludington State Park.",
    "summary": "Historic lighthouse in Ludington State Park.",
    "whyItMatters": "Scenic maritime stop with a walk-to destination feel.",
    "why": "Scenic maritime stop with a walk-to destination feel.",
    "notes": {
      "elsie": "Think about isolation and lighthouse work.",
      "katrina": "Ask what life was like for keepers.",
      "emma": "Connect weather, ships, and daily routines.",
      "eliette": "Find stripes, sand, and shoreline details.",
      "jules": "Lighthouse walk mission.",
      "momdad": "Scenic maritime stop with a walk-to destination feel."
    },
    "profiles": {
      "elsie": "Think about isolation and lighthouse work.",
      "katrina": "Ask what life was like for keepers.",
      "emma": "Connect weather, ships, and daily routines.",
      "eliette": "Find stripes, sand, and shoreline details.",
      "jules": "Lighthouse walk mission.",
      "momdad": "Scenic maritime stop with a walk-to destination feel."
    },
    "csvOrder": 98
  },
  {
    "id": "P3-029",
    "title": "Manistee North Pierhead Lighthouse",
    "name": "Manistee North Pierhead Lighthouse",
    "category": "Lighthouse",
    "latitude": 44.2513,
    "longitude": -86.3465,
    "lat": 44.2513,
    "lon": -86.3465,
    "lng": -86.3465,
    "phase": "Phase 2",
    "routeSegment": "Manistee / Michigan",
    "route_segment": "Manistee / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.lakeshorekeepers.org/manistee-north-pierhead-lighthouse",
    "official_website": "https://www.lakeshorekeepers.org/manistee-north-pierhead-lighthouse",
    "learnMoreUrl": "https://www.lakeshorekeepers.org/manistee-north-pierhead-lighthouse",
    "learn_more": "https://www.lakeshorekeepers.org/manistee-north-pierhead-lighthouse",
    "sourceUrl": "https://www.lakeshorekeepers.org/manistee-north-pierhead-lighthouse",
    "shortSummary": "Historic Manistee lighthouse and pierhead landmark.",
    "summary": "Historic Manistee lighthouse and pierhead landmark.",
    "whyItMatters": "Good quick maritime stop on the western Michigan corridor.",
    "why": "Good quick maritime stop on the western Michigan corridor.",
    "notes": {
      "elsie": "Notice harbor entrances and wave action.",
      "katrina": "Ask why pier lights are different from shore lights.",
      "emma": "Connect towns, boats, and lake weather.",
      "eliette": "Find railings, color, and water details.",
      "jules": "Pier light mission.",
      "momdad": "Good quick maritime stop on the western Michigan corridor."
    },
    "profiles": {
      "elsie": "Notice harbor entrances and wave action.",
      "katrina": "Ask why pier lights are different from shore lights.",
      "emma": "Connect towns, boats, and lake weather.",
      "eliette": "Find railings, color, and water details.",
      "jules": "Pier light mission.",
      "momdad": "Good quick maritime stop on the western Michigan corridor."
    },
    "csvOrder": 99
  },
  {
    "id": "P3-030",
    "title": "Sleeping Bear Dunes National Lakeshore",
    "name": "Sleeping Bear Dunes National Lakeshore",
    "category": "National Lakeshore",
    "latitude": 44.8897,
    "longitude": -86.0467,
    "lat": 44.8897,
    "lon": -86.0467,
    "lng": -86.0467,
    "phase": "Phase 2",
    "routeSegment": "Northwest Michigan",
    "route_segment": "Northwest Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 150,
    "estimated_stop_minutes": 150,
    "officialWebsiteUrl": "https://www.nps.gov/slbe/",
    "official_website": "https://www.nps.gov/slbe/",
    "learnMoreUrl": "https://www.nps.gov/slbe/",
    "learn_more": "https://www.nps.gov/slbe/",
    "sourceUrl": "https://www.nps.gov/slbe/",
    "shortSummary": "National lakeshore with dunes, overlooks, beaches, and trails.",
    "summary": "National lakeshore with dunes, overlooks, beaches, and trails.",
    "whyItMatters": "One of the strongest nature anchors in Lower Michigan.",
    "why": "One of the strongest nature anchors in Lower Michigan.",
    "notes": {
      "elsie": "Think about glacial landscapes and big lake power.",
      "katrina": "Ask how dunes get so high.",
      "emma": "Connect wind, water, sand, and habitats.",
      "eliette": "Find sweeping views and tiny sand patterns.",
      "jules": "Huge dune mission.",
      "momdad": "One of the strongest nature anchors in Lower Michigan."
    },
    "profiles": {
      "elsie": "Think about glacial landscapes and big lake power.",
      "katrina": "Ask how dunes get so high.",
      "emma": "Connect wind, water, sand, and habitats.",
      "eliette": "Find sweeping views and tiny sand patterns.",
      "jules": "Huge dune mission.",
      "momdad": "One of the strongest nature anchors in Lower Michigan."
    },
    "csvOrder": 100
  },
  {
    "id": "P3-031",
    "title": "Pierce Stocking Scenic Drive",
    "name": "Pierce Stocking Scenic Drive",
    "category": "Scenic Drive",
    "latitude": 44.882,
    "longitude": -86.053,
    "lat": 44.882,
    "lon": -86.053,
    "lng": -86.053,
    "phase": "Phase 2",
    "routeSegment": "Sleeping Bear Dunes / Michigan",
    "route_segment": "Sleeping Bear Dunes / Michigan",
    "tier": "Core",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.nps.gov/slbe/planyourvisit/psscenicdrive.htm",
    "official_website": "https://www.nps.gov/slbe/planyourvisit/psscenicdrive.htm",
    "learnMoreUrl": "https://www.nps.gov/slbe/planyourvisit/psscenicdrive.htm",
    "learn_more": "https://www.nps.gov/slbe/planyourvisit/psscenicdrive.htm",
    "sourceUrl": "https://www.nps.gov/slbe/planyourvisit/psscenicdrive.htm",
    "shortSummary": "Scenic loop drive within Sleeping Bear Dunes National Lakeshore.",
    "summary": "Scenic loop drive within Sleeping Bear Dunes National Lakeshore.",
    "whyItMatters": "Efficient way to experience big overlooks without a long hike.",
    "why": "Efficient way to experience big overlooks without a long hike.",
    "notes": {
      "elsie": "Compare viewpoints and landscape layers.",
      "katrina": "Ask why overlooks change how we understand a place.",
      "emma": "Connect driving, stops, and scenery.",
      "eliette": "Find the best photo angle.",
      "jules": "Lookout mission.",
      "momdad": "Efficient way to experience big overlooks without a long hike."
    },
    "profiles": {
      "elsie": "Compare viewpoints and landscape layers.",
      "katrina": "Ask why overlooks change how we understand a place.",
      "emma": "Connect driving, stops, and scenery.",
      "eliette": "Find the best photo angle.",
      "jules": "Lookout mission.",
      "momdad": "Efficient way to experience big overlooks without a long hike."
    },
    "csvOrder": 101
  },
  {
    "id": "P3-032",
    "title": "Charlevoix South Pier Light Station",
    "name": "Charlevoix South Pier Light Station",
    "category": "Lighthouse",
    "latitude": 45.3207,
    "longitude": -85.2584,
    "lat": 45.3207,
    "lon": -85.2584,
    "lng": -85.2584,
    "phase": "Phase 2",
    "routeSegment": "Charlevoix / Michigan",
    "route_segment": "Charlevoix / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://visitcharlevoix.com/Charlevoix-South-Pier-Light-Station",
    "official_website": "https://visitcharlevoix.com/Charlevoix-South-Pier-Light-Station",
    "learnMoreUrl": "https://visitcharlevoix.com/Charlevoix-South-Pier-Light-Station",
    "learn_more": "https://visitcharlevoix.com/Charlevoix-South-Pier-Light-Station",
    "sourceUrl": "https://visitcharlevoix.com/Charlevoix-South-Pier-Light-Station",
    "shortSummary": "Red lighthouse at the Charlevoix channel.",
    "summary": "Red lighthouse at the Charlevoix channel.",
    "whyItMatters": "Quick, bright lighthouse/photo stop approaching northern Michigan.",
    "why": "Quick, bright lighthouse/photo stop approaching northern Michigan.",
    "notes": {
      "elsie": "Think about channel navigation.",
      "katrina": "Ask how boats enter harbors safely.",
      "emma": "Connect water traffic and town life.",
      "eliette": "Find color, shape, and pier details.",
      "jules": "Red light mission.",
      "momdad": "Quick, bright lighthouse/photo stop approaching northern Michigan."
    },
    "profiles": {
      "elsie": "Think about channel navigation.",
      "katrina": "Ask how boats enter harbors safely.",
      "emma": "Connect water traffic and town life.",
      "eliette": "Find color, shape, and pier details.",
      "jules": "Red light mission.",
      "momdad": "Quick, bright lighthouse/photo stop approaching northern Michigan."
    },
    "csvOrder": 102
  },
  {
    "id": "P3-033",
    "title": "Castle Farms",
    "name": "Castle Farms",
    "category": "Historic / Family Attraction",
    "latitude": 45.3121,
    "longitude": -85.2589,
    "lat": 45.3121,
    "lon": -85.2589,
    "lng": -85.2589,
    "phase": "Phase 2",
    "routeSegment": "Charlevoix / Michigan",
    "route_segment": "Charlevoix / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://castlefarms.com/",
    "official_website": "https://castlefarms.com/",
    "learnMoreUrl": "https://castlefarms.com/",
    "learn_more": "https://castlefarms.com/",
    "sourceUrl": "https://castlefarms.com/",
    "shortSummary": "Historic castle-like property and attraction in Charlevoix.",
    "summary": "Historic castle-like property and attraction in Charlevoix.",
    "whyItMatters": "Visual oddity stop with architecture and family appeal.",
    "why": "Visual oddity stop with architecture and family appeal.",
    "notes": {
      "elsie": "Think about how buildings get reused.",
      "katrina": "Ask why a castle-looking place exists in Michigan.",
      "emma": "Connect design, history, and tourism.",
      "eliette": "Find stone, garden, and tower details.",
      "jules": "Castle mission.",
      "momdad": "Visual oddity stop with architecture and family appeal."
    },
    "profiles": {
      "elsie": "Think about how buildings get reused.",
      "katrina": "Ask why a castle-looking place exists in Michigan.",
      "emma": "Connect design, history, and tourism.",
      "eliette": "Find stone, garden, and tower details.",
      "jules": "Castle mission.",
      "momdad": "Visual oddity stop with architecture and family appeal."
    },
    "csvOrder": 103
  },
  {
    "id": "P3-034",
    "title": "Petoskey State Park",
    "name": "Petoskey State Park",
    "category": "State Park / Beach",
    "latitude": 45.3833,
    "longitude": -84.9264,
    "lat": 45.3833,
    "lon": -84.9264,
    "lng": -84.9264,
    "phase": "Phase 2",
    "routeSegment": "Petoskey / Michigan",
    "route_segment": "Petoskey / Michigan",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.michigan.gov/dnr/places/state-parks/petoskey",
    "official_website": "https://www.michigan.gov/dnr/places/state-parks/petoskey",
    "learnMoreUrl": "https://www.michigan.gov/dnr/places/state-parks/petoskey",
    "learn_more": "https://www.michigan.gov/dnr/places/state-parks/petoskey",
    "sourceUrl": "https://www.michigan.gov/dnr/places/state-parks/petoskey",
    "shortSummary": "Lake Michigan state park near Petoskey.",
    "summary": "Lake Michigan state park near Petoskey.",
    "whyItMatters": "Good northern Michigan beach and rock-hunting reset.",
    "why": "Good northern Michigan beach and rock-hunting reset.",
    "notes": {
      "elsie": "Look for shoreline ecology and stones.",
      "katrina": "Ask what makes Petoskey stones special.",
      "emma": "Connect geology, waves, and beaches.",
      "eliette": "Find patterns in rocks and water.",
      "jules": "Rock hunt mission.",
      "momdad": "Good northern Michigan beach and rock-hunting reset."
    },
    "profiles": {
      "elsie": "Look for shoreline ecology and stones.",
      "katrina": "Ask what makes Petoskey stones special.",
      "emma": "Connect geology, waves, and beaches.",
      "eliette": "Find patterns in rocks and water.",
      "jules": "Rock hunt mission.",
      "momdad": "Good northern Michigan beach and rock-hunting reset."
    },
    "csvOrder": 104
  },
  {
    "id": "P3-035",
    "title": "Harbor Springs Bluff Drive / Tunnel of Trees Area",
    "name": "Harbor Springs Bluff Drive / Tunnel of Trees Area",
    "category": "Scenic Drive",
    "latitude": 45.431,
    "longitude": -84.991,
    "lat": 45.431,
    "lon": -84.991,
    "lng": -84.991,
    "phase": "Phase 2",
    "routeSegment": "Harbor Springs / Michigan",
    "route_segment": "Harbor Springs / Michigan",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.harborspringschamber.com/",
    "official_website": "https://www.harborspringschamber.com/",
    "learnMoreUrl": "https://www.harborspringschamber.com/",
    "learn_more": "https://www.harborspringschamber.com/",
    "sourceUrl": "https://www.harborspringschamber.com/",
    "shortSummary": "Scenic northern Michigan area near Harbor Springs and M-119.",
    "summary": "Scenic northern Michigan area near Harbor Springs and M-119.",
    "whyItMatters": "Good scenic route variation near the Straits approach.",
    "why": "Good scenic route variation near the Straits approach.",
    "notes": {
      "elsie": "Think about why roads become scenic attractions.",
      "katrina": "Ask how trees change the driving experience.",
      "emma": "Connect place, pace, and scenery.",
      "eliette": "Find curves, trees, and lake glimpses.",
      "jules": "Tree tunnel mission.",
      "momdad": "Good scenic route variation near the Straits approach."
    },
    "profiles": {
      "elsie": "Think about why roads become scenic attractions.",
      "katrina": "Ask how trees change the driving experience.",
      "emma": "Connect place, pace, and scenery.",
      "eliette": "Find curves, trees, and lake glimpses.",
      "jules": "Tree tunnel mission.",
      "momdad": "Good scenic route variation near the Straits approach."
    },
    "csvOrder": 105
  },
  {
    "id": "P3-036",
    "title": "Minnetrista Museum & Gardens",
    "name": "Minnetrista Museum & Gardens",
    "category": "Museum / Garden",
    "latitude": 40.2019,
    "longitude": -85.3979,
    "lat": 40.2019,
    "lon": -85.3979,
    "lng": -85.3979,
    "phase": "Phase 3",
    "routeSegment": "Muncie / Indiana return corridor",
    "route_segment": "Muncie / Indiana return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.minnetrista.net/",
    "official_website": "https://www.minnetrista.net/",
    "learnMoreUrl": "https://www.minnetrista.net/",
    "learn_more": "https://www.minnetrista.net/",
    "sourceUrl": "https://www.minnetrista.net/",
    "shortSummary": "Museum and gardens tied to the Ball family and Muncie history.",
    "summary": "Museum and gardens tied to the Ball family and Muncie history.",
    "whyItMatters": "Good return-route culture stop with gardens, homes, and community history.",
    "why": "Good return-route culture stop with gardens, homes, and community history.",
    "notes": {
      "elsie": "Connect family businesses to community places.",
      "katrina": "Ask how one company can shape a town.",
      "emma": "Notice gardens, houses, and local routines.",
      "eliette": "Find architecture, flowers, and tiny display details.",
      "jules": "Garden and house mission.",
      "momdad": "Good return-route culture stop with gardens, homes, and community history."
    },
    "profiles": {
      "elsie": "Connect family businesses to community places.",
      "katrina": "Ask how one company can shape a town.",
      "emma": "Notice gardens, houses, and local routines.",
      "eliette": "Find architecture, flowers, and tiny display details.",
      "jules": "Garden and house mission.",
      "momdad": "Good return-route culture stop with gardens, homes, and community history."
    },
    "csvOrder": 106
  },
  {
    "id": "P3-037",
    "title": "Mounds State Park",
    "name": "Mounds State Park",
    "category": "State Park / Earthworks",
    "latitude": 40.0981,
    "longitude": -85.6177,
    "lat": 40.0981,
    "lon": -85.6177,
    "lng": -85.6177,
    "phase": "Phase 3",
    "routeSegment": "Anderson / Indiana return corridor",
    "route_segment": "Anderson / Indiana return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.in.gov/dnr/state-parks/parks-lakes/mounds-state-park/",
    "official_website": "https://www.in.gov/dnr/state-parks/parks-lakes/mounds-state-park/",
    "learnMoreUrl": "https://www.in.gov/dnr/state-parks/parks-lakes/mounds-state-park/",
    "learn_more": "https://www.in.gov/dnr/state-parks/parks-lakes/mounds-state-park/",
    "sourceUrl": "https://www.in.gov/dnr/state-parks/parks-lakes/mounds-state-park/",
    "shortSummary": "Indiana state park preserving prehistoric earthworks.",
    "summary": "Indiana state park preserving prehistoric earthworks.",
    "whyItMatters": "Strong nature and Indigenous history stop near the return corridor.",
    "why": "Strong nature and Indigenous history stop near the return corridor.",
    "notes": {
      "elsie": "Think about ancient places and how they survive.",
      "katrina": "Ask why people built earthworks.",
      "emma": "Connect land, ceremony, and preservation.",
      "eliette": "Look for shapes, trails, and signs.",
      "jules": "Mound trail mission.",
      "momdad": "Strong nature and Indigenous history stop near the return corridor."
    },
    "profiles": {
      "elsie": "Think about ancient places and how they survive.",
      "katrina": "Ask why people built earthworks.",
      "emma": "Connect land, ceremony, and preservation.",
      "eliette": "Look for shapes, trails, and signs.",
      "jules": "Mound trail mission.",
      "momdad": "Strong nature and Indigenous history stop near the return corridor."
    },
    "csvOrder": 107
  },
  {
    "id": "P3-038",
    "title": "Hoosier Gym",
    "name": "Hoosier Gym",
    "category": "Sports / Film Site",
    "latitude": 39.9072,
    "longitude": -85.1614,
    "lat": 39.9072,
    "lon": -85.1614,
    "lng": -85.1614,
    "phase": "Phase 3",
    "routeSegment": "Knightstown / Indiana return corridor",
    "route_segment": "Knightstown / Indiana return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://thehoosiergym.com/",
    "official_website": "https://thehoosiergym.com/",
    "learnMoreUrl": "https://thehoosiergym.com/",
    "learn_more": "https://thehoosiergym.com/",
    "sourceUrl": "https://thehoosiergym.com/",
    "shortSummary": "Historic basketball gym known from the movie Hoosiers.",
    "summary": "Historic basketball gym known from the movie Hoosiers.",
    "whyItMatters": "Fun sports and small-town Indiana stop.",
    "why": "Fun sports and small-town Indiana stop.",
    "notes": {
      "elsie": "Think about why gyms become community symbols.",
      "katrina": "Ask why basketball matters so much in Indiana.",
      "emma": "Connect sports, towns, and teamwork.",
      "eliette": "Find jerseys, wood floor, and old gym details.",
      "jules": "Basketball mission.",
      "momdad": "Fun sports and small-town Indiana stop."
    },
    "profiles": {
      "elsie": "Think about why gyms become community symbols.",
      "katrina": "Ask why basketball matters so much in Indiana.",
      "emma": "Connect sports, towns, and teamwork.",
      "eliette": "Find jerseys, wood floor, and old gym details.",
      "jules": "Basketball mission.",
      "momdad": "Fun sports and small-town Indiana stop."
    },
    "csvOrder": 108
  },
  {
    "id": "P3-039",
    "title": "Indiana Basketball Hall of Fame",
    "name": "Indiana Basketball Hall of Fame",
    "category": "Sports Museum",
    "latitude": 39.9287,
    "longitude": -85.3705,
    "lat": 39.9287,
    "lon": -85.3705,
    "lng": -85.3705,
    "phase": "Phase 3",
    "routeSegment": "New Castle / Indiana return corridor",
    "route_segment": "New Castle / Indiana return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://hoopshall.com/",
    "official_website": "https://hoopshall.com/",
    "learnMoreUrl": "https://hoopshall.com/",
    "learn_more": "https://hoopshall.com/",
    "sourceUrl": "https://hoopshall.com/",
    "shortSummary": "Museum celebrating Indiana basketball history.",
    "summary": "Museum celebrating Indiana basketball history.",
    "whyItMatters": "Great sports-history return stop for basketball context.",
    "why": "Great sports-history return stop for basketball context.",
    "notes": {
      "elsie": "Compare local sports pride with pro sports fame.",
      "katrina": "Ask why high school basketball became such a big tradition.",
      "emma": "Connect teamwork, towns, and fans.",
      "eliette": "Find trophies, photos, and uniform details.",
      "jules": "Hoop mission.",
      "momdad": "Great sports-history return stop for basketball context."
    },
    "profiles": {
      "elsie": "Compare local sports pride with pro sports fame.",
      "katrina": "Ask why high school basketball became such a big tradition.",
      "emma": "Connect teamwork, towns, and fans.",
      "eliette": "Find trophies, photos, and uniform details.",
      "jules": "Hoop mission.",
      "momdad": "Great sports-history return stop for basketball context."
    },
    "csvOrder": 109
  },
  {
    "id": "P3-040",
    "title": "Levi and Catharine Coffin House",
    "name": "Levi and Catharine Coffin House",
    "category": "Historic Site",
    "latitude": 39.9555,
    "longitude": -84.9186,
    "lat": 39.9555,
    "lon": -84.9186,
    "lng": -84.9186,
    "phase": "Phase 3",
    "routeSegment": "Fountain City / Indiana return corridor",
    "route_segment": "Fountain City / Indiana return corridor",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "official_website": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "learnMoreUrl": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "learn_more": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "sourceUrl": "https://www.indianamuseum.org/historic-sites/levi-catharine-coffin-house/",
    "shortSummary": "Underground Railroad historic site in Fountain City.",
    "summary": "Underground Railroad historic site in Fountain City.",
    "whyItMatters": "Powerful courage and justice stop on the way home.",
    "why": "Powerful courage and justice stop on the way home.",
    "notes": {
      "elsie": "Think about risk and moral courage.",
      "katrina": "Ask why helping enslaved people escape was dangerous.",
      "emma": "Connect fairness, choices, and history.",
      "eliette": "Look for house details that protected people.",
      "jules": "Safe-house mission.",
      "momdad": "Powerful courage and justice stop on the way home."
    },
    "profiles": {
      "elsie": "Think about risk and moral courage.",
      "katrina": "Ask why helping enslaved people escape was dangerous.",
      "emma": "Connect fairness, choices, and history.",
      "eliette": "Look for house details that protected people.",
      "jules": "Safe-house mission.",
      "momdad": "Powerful courage and justice stop on the way home."
    },
    "csvOrder": 110
  },
  {
    "id": "P3-041",
    "title": "Model T Museum",
    "name": "Model T Museum",
    "category": "Automotive Museum",
    "latitude": 39.8317,
    "longitude": -84.8902,
    "lat": 39.8317,
    "lon": -84.8902,
    "lng": -84.8902,
    "phase": "Phase 3",
    "routeSegment": "Richmond / Indiana return corridor",
    "route_segment": "Richmond / Indiana return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://www.mtfca.com/museum/",
    "official_website": "https://www.mtfca.com/museum/",
    "learnMoreUrl": "https://www.mtfca.com/museum/",
    "learn_more": "https://www.mtfca.com/museum/",
    "sourceUrl": "https://www.mtfca.com/museum/",
    "shortSummary": "Museum dedicated to the Ford Model T.",
    "summary": "Museum dedicated to the Ford Model T.",
    "whyItMatters": "Strong transportation-history addition for a family road trip.",
    "why": "Strong transportation-history addition for a family road trip.",
    "notes": {
      "elsie": "Compare early cars to your current road trip vehicle.",
      "katrina": "Ask why the Model T changed travel.",
      "emma": "Connect affordability, roads, and family mobility.",
      "eliette": "Find steering, wheels, and dashboard details.",
      "jules": "Old car mission.",
      "momdad": "Strong transportation-history addition for a family road trip."
    },
    "profiles": {
      "elsie": "Compare early cars to your current road trip vehicle.",
      "katrina": "Ask why the Model T changed travel.",
      "emma": "Connect affordability, roads, and family mobility.",
      "eliette": "Find steering, wheels, and dashboard details.",
      "jules": "Old car mission.",
      "momdad": "Strong transportation-history addition for a family road trip."
    },
    "csvOrder": 111
  },
  {
    "id": "P3-042",
    "title": "Gennett Records Walk of Fame",
    "name": "Gennett Records Walk of Fame",
    "category": "Music History",
    "latitude": 39.8272,
    "longitude": -84.8957,
    "lat": 39.8272,
    "lon": -84.8957,
    "lng": -84.8957,
    "phase": "Phase 3",
    "routeSegment": "Richmond / Indiana return corridor",
    "route_segment": "Richmond / Indiana return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://visitrichmond.org/visitors/things-to-do/gennett-walk-of-fame",
    "official_website": "https://visitrichmond.org/visitors/things-to-do/gennett-walk-of-fame",
    "learnMoreUrl": "https://visitrichmond.org/visitors/things-to-do/gennett-walk-of-fame",
    "learn_more": "https://visitrichmond.org/visitors/things-to-do/gennett-walk-of-fame",
    "sourceUrl": "https://visitrichmond.org/visitors/things-to-do/gennett-walk-of-fame",
    "shortSummary": "Outdoor music-history walk honoring Gennett Records artists.",
    "summary": "Outdoor music-history walk honoring Gennett Records artists.",
    "whyItMatters": "Quick culture stop with jazz and recording history.",
    "why": "Quick culture stop with jazz and recording history.",
    "notes": {
      "elsie": "Think about how music gets preserved.",
      "katrina": "Ask why early recordings mattered.",
      "emma": "Connect technology, art, and fame.",
      "eliette": "Look for names, signs, and music details.",
      "jules": "Music walk mission.",
      "momdad": "Quick culture stop with jazz and recording history."
    },
    "profiles": {
      "elsie": "Think about how music gets preserved.",
      "katrina": "Ask why early recordings mattered.",
      "emma": "Connect technology, art, and fame.",
      "eliette": "Look for names, signs, and music details.",
      "jules": "Music walk mission.",
      "momdad": "Quick culture stop with jazz and recording history."
    },
    "csvOrder": 112
  },
  {
    "id": "P3-043",
    "title": "Dayton Aviation Heritage National Historical Park",
    "name": "Dayton Aviation Heritage National Historical Park",
    "category": "National Historical Park",
    "latitude": 39.7561,
    "longitude": -84.2057,
    "lat": 39.7561,
    "lon": -84.2057,
    "lng": -84.2057,
    "phase": "Phase 3",
    "routeSegment": "Dayton / Ohio optional return",
    "route_segment": "Dayton / Ohio optional return",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.nps.gov/daav/",
    "official_website": "https://www.nps.gov/daav/",
    "learnMoreUrl": "https://www.nps.gov/daav/",
    "learn_more": "https://www.nps.gov/daav/",
    "sourceUrl": "https://www.nps.gov/daav/",
    "shortSummary": "National Park Service site tied to the Wright brothers and aviation history.",
    "summary": "National Park Service site tied to the Wright brothers and aviation history.",
    "whyItMatters": "Excellent optional STEM/history stop if routing through Dayton.",
    "why": "Excellent optional STEM/history stop if routing through Dayton.",
    "notes": {
      "elsie": "Think about invention and persistence.",
      "katrina": "Ask why flight changed the world.",
      "emma": "Connect experiments, failure, and travel.",
      "eliette": "Find bicycle and airplane details.",
      "jules": "Flying machine mission.",
      "momdad": "Excellent optional STEM/history stop if routing through Dayton."
    },
    "profiles": {
      "elsie": "Think about invention and persistence.",
      "katrina": "Ask why flight changed the world.",
      "emma": "Connect experiments, failure, and travel.",
      "eliette": "Find bicycle and airplane details.",
      "jules": "Flying machine mission.",
      "momdad": "Excellent optional STEM/history stop if routing through Dayton."
    },
    "csvOrder": 113
  },
  {
    "id": "P3-044",
    "title": "National Museum of the U.S. Air Force",
    "name": "National Museum of the U.S. Air Force",
    "category": "Aviation Museum",
    "latitude": 39.7817,
    "longitude": -84.11,
    "lat": 39.7817,
    "lon": -84.11,
    "lng": -84.11,
    "phase": "Phase 3",
    "routeSegment": "Dayton / Ohio optional return",
    "route_segment": "Dayton / Ohio optional return",
    "tier": "Core",
    "estimatedStopMinutes": 150,
    "estimated_stop_minutes": 150,
    "officialWebsiteUrl": "https://www.nationalmuseum.af.mil/",
    "official_website": "https://www.nationalmuseum.af.mil/",
    "learnMoreUrl": "https://www.nationalmuseum.af.mil/",
    "learn_more": "https://www.nationalmuseum.af.mil/",
    "sourceUrl": "https://www.nationalmuseum.af.mil/",
    "shortSummary": "Massive official U.S. Air Force museum near Dayton.",
    "summary": "Massive official U.S. Air Force museum near Dayton.",
    "whyItMatters": "High-value aviation and technology stop if route timing allows.",
    "why": "High-value aviation and technology stop if route timing allows.",
    "notes": {
      "elsie": "Compare aircraft across eras.",
      "katrina": "Ask how design changes with purpose.",
      "emma": "Connect technology, history, and service.",
      "eliette": "Find nose art, engines, and cockpit details.",
      "jules": "Giant airplane mission.",
      "momdad": "High-value aviation and technology stop if route timing allows."
    },
    "profiles": {
      "elsie": "Compare aircraft across eras.",
      "katrina": "Ask how design changes with purpose.",
      "emma": "Connect technology, history, and service.",
      "eliette": "Find nose art, engines, and cockpit details.",
      "jules": "Giant airplane mission.",
      "momdad": "High-value aviation and technology stop if route timing allows."
    },
    "csvOrder": 114
  },
  {
    "id": "P3-045",
    "title": "Carillon Historical Park",
    "name": "Carillon Historical Park",
    "category": "History Museum",
    "latitude": 39.7334,
    "longitude": -84.2003,
    "lat": 39.7334,
    "lon": -84.2003,
    "lng": -84.2003,
    "phase": "Phase 3",
    "routeSegment": "Dayton / Ohio optional return",
    "route_segment": "Dayton / Ohio optional return",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.daytonhistory.org/visit/dayton-history-sites/carillon-historical-park/",
    "official_website": "https://www.daytonhistory.org/visit/dayton-history-sites/carillon-historical-park/",
    "learnMoreUrl": "https://www.daytonhistory.org/visit/dayton-history-sites/carillon-historical-park/",
    "learn_more": "https://www.daytonhistory.org/visit/dayton-history-sites/carillon-historical-park/",
    "sourceUrl": "https://www.daytonhistory.org/visit/dayton-history-sites/carillon-historical-park/",
    "shortSummary": "Dayton history park with transportation and innovation exhibits.",
    "summary": "Dayton history park with transportation and innovation exhibits.",
    "whyItMatters": "Good optional stop combining invention, industry, and local history.",
    "why": "Good optional stop combining invention, industry, and local history.",
    "notes": {
      "elsie": "Notice how invention changes daily life.",
      "katrina": "Ask why Dayton produced so many innovations.",
      "emma": "Connect bikes, cars, planes, and factories.",
      "eliette": "Find bells, machines, and old signs.",
      "jules": "Invention mission.",
      "momdad": "Good optional stop combining invention, industry, and local history."
    },
    "profiles": {
      "elsie": "Notice how invention changes daily life.",
      "katrina": "Ask why Dayton produced so many innovations.",
      "emma": "Connect bikes, cars, planes, and factories.",
      "eliette": "Find bells, machines, and old signs.",
      "jules": "Invention mission.",
      "momdad": "Good optional stop combining invention, industry, and local history."
    },
    "csvOrder": 115
  },
  {
    "id": "P3-046",
    "title": "Aullwood Audubon Center and Farm",
    "name": "Aullwood Audubon Center and Farm",
    "category": "Nature Center / Farm",
    "latitude": 39.8745,
    "longitude": -84.274,
    "lat": 39.8745,
    "lon": -84.274,
    "lng": -84.274,
    "phase": "Phase 3",
    "routeSegment": "Dayton / Ohio optional return",
    "route_segment": "Dayton / Ohio optional return",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://aullwood.audubon.org/",
    "official_website": "https://aullwood.audubon.org/",
    "learnMoreUrl": "https://aullwood.audubon.org/",
    "learn_more": "https://aullwood.audubon.org/",
    "sourceUrl": "https://aullwood.audubon.org/",
    "shortSummary": "Audubon nature center and farm near Dayton.",
    "summary": "Audubon nature center and farm near Dayton.",
    "whyItMatters": "Good nature reset with birds, trails, and farm context.",
    "why": "Good nature reset with birds, trails, and farm context.",
    "notes": {
      "elsie": "Watch for birds and habitats.",
      "katrina": "Ask why migration and habitat protection matter.",
      "emma": "Connect farms, birds, and weather.",
      "eliette": "Find feathers, tracks, and trail details.",
      "jules": "Bird mission.",
      "momdad": "Good nature reset with birds, trails, and farm context."
    },
    "profiles": {
      "elsie": "Watch for birds and habitats.",
      "katrina": "Ask why migration and habitat protection matter.",
      "emma": "Connect farms, birds, and weather.",
      "eliette": "Find feathers, tracks, and trail details.",
      "jules": "Bird mission.",
      "momdad": "Good nature reset with birds, trails, and farm context."
    },
    "csvOrder": 116
  },
  {
    "id": "P3-047",
    "title": "The Magic House",
    "name": "The Magic House",
    "category": "Children's Museum",
    "latitude": 38.581,
    "longitude": -90.4068,
    "lat": 38.581,
    "lon": -90.4068,
    "lng": -90.4068,
    "phase": "Phase 3",
    "routeSegment": "St. Louis return corridor",
    "route_segment": "St. Louis return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.magichouse.org/",
    "official_website": "https://www.magichouse.org/",
    "learnMoreUrl": "https://www.magichouse.org/",
    "learn_more": "https://www.magichouse.org/",
    "sourceUrl": "https://www.magichouse.org/",
    "shortSummary": "Children's museum in the St. Louis area.",
    "summary": "Children's museum in the St. Louis area.",
    "whyItMatters": "Strong family stop on the return route if kids need interactive time.",
    "why": "Strong family stop on the return route if kids need interactive time.",
    "notes": {
      "elsie": "Pick a hands-on activity and explain it.",
      "katrina": "Ask why play helps learning.",
      "emma": "Connect experiments to everyday life.",
      "eliette": "Find colors, buttons, and design details.",
      "jules": "Play mission.",
      "momdad": "Strong family stop on the return route if kids need interactive time."
    },
    "profiles": {
      "elsie": "Pick a hands-on activity and explain it.",
      "katrina": "Ask why play helps learning.",
      "emma": "Connect experiments to everyday life.",
      "eliette": "Find colors, buttons, and design details.",
      "jules": "Play mission.",
      "momdad": "Strong family stop on the return route if kids need interactive time."
    },
    "csvOrder": 117
  },
  {
    "id": "P3-048",
    "title": "Laumeier Sculpture Park",
    "name": "Laumeier Sculpture Park",
    "category": "Art Park",
    "latitude": 38.5517,
    "longitude": -90.4143,
    "lat": 38.5517,
    "lon": -90.4143,
    "lng": -90.4143,
    "phase": "Phase 3",
    "routeSegment": "St. Louis return corridor",
    "route_segment": "St. Louis return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.laumeiersculpturepark.org/",
    "official_website": "https://www.laumeiersculpturepark.org/",
    "learnMoreUrl": "https://www.laumeiersculpturepark.org/",
    "learn_more": "https://www.laumeiersculpturepark.org/",
    "sourceUrl": "https://www.laumeiersculpturepark.org/",
    "shortSummary": "Outdoor sculpture park in St. Louis County.",
    "summary": "Outdoor sculpture park in St. Louis County.",
    "whyItMatters": "Good walkable art-and-nature reset.",
    "why": "Good walkable art-and-nature reset.",
    "notes": {
      "elsie": "Think about how art changes outdoor space.",
      "katrina": "Ask what makes sculpture different from a statue.",
      "emma": "Connect movement, scale, and creativity.",
      "eliette": "Find the weirdest sculpture detail.",
      "jules": "Giant art mission.",
      "momdad": "Good walkable art-and-nature reset."
    },
    "profiles": {
      "elsie": "Think about how art changes outdoor space.",
      "katrina": "Ask what makes sculpture different from a statue.",
      "emma": "Connect movement, scale, and creativity.",
      "eliette": "Find the weirdest sculpture detail.",
      "jules": "Giant art mission.",
      "momdad": "Good walkable art-and-nature reset."
    },
    "csvOrder": 118
  },
  {
    "id": "P3-049",
    "title": "Ulysses S. Grant National Historic Site",
    "name": "Ulysses S. Grant National Historic Site",
    "category": "National Historic Site",
    "latitude": 38.5511,
    "longitude": -90.3512,
    "lat": 38.5511,
    "lon": -90.3512,
    "lng": -90.3512,
    "phase": "Phase 3",
    "routeSegment": "St. Louis return corridor",
    "route_segment": "St. Louis return corridor",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.nps.gov/ulsg/",
    "official_website": "https://www.nps.gov/ulsg/",
    "learnMoreUrl": "https://www.nps.gov/ulsg/",
    "learn_more": "https://www.nps.gov/ulsg/",
    "sourceUrl": "https://www.nps.gov/ulsg/",
    "shortSummary": "National Park Service site preserving Grant's White Haven home.",
    "summary": "National Park Service site preserving Grant's White Haven home.",
    "whyItMatters": "Strong presidential and Civil War history stop near St. Louis.",
    "why": "Strong presidential and Civil War history stop near St. Louis.",
    "notes": {
      "elsie": "Think about one person's life before and after war.",
      "katrina": "Ask how homes reveal history.",
      "emma": "Connect leadership, family, and place.",
      "eliette": "Look for house and farm details.",
      "jules": "President house mission.",
      "momdad": "Strong presidential and Civil War history stop near St. Louis."
    },
    "profiles": {
      "elsie": "Think about one person's life before and after war.",
      "katrina": "Ask how homes reveal history.",
      "emma": "Connect leadership, family, and place.",
      "eliette": "Look for house and farm details.",
      "jules": "President house mission.",
      "momdad": "Strong presidential and Civil War history stop near St. Louis."
    },
    "csvOrder": 119
  },
  {
    "id": "P3-050",
    "title": "Lone Elk Park",
    "name": "Lone Elk Park",
    "category": "Wildlife / Park",
    "latitude": 38.542,
    "longitude": -90.5318,
    "lat": 38.542,
    "lon": -90.5318,
    "lng": -90.5318,
    "phase": "Phase 3",
    "routeSegment": "St. Louis return corridor",
    "route_segment": "St. Louis return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://stlouiscountymo.gov/st-louis-county-departments/parks/places/lone-elk-park/",
    "official_website": "https://stlouiscountymo.gov/st-louis-county-departments/parks/places/lone-elk-park/",
    "learnMoreUrl": "https://stlouiscountymo.gov/st-louis-county-departments/parks/places/lone-elk-park/",
    "learn_more": "https://stlouiscountymo.gov/st-louis-county-departments/parks/places/lone-elk-park/",
    "sourceUrl": "https://stlouiscountymo.gov/st-louis-county-departments/parks/places/lone-elk-park/",
    "shortSummary": "County park with elk and bison viewing opportunities.",
    "summary": "County park with elk and bison viewing opportunities.",
    "whyItMatters": "Excellent quick wildlife drive-through style stop.",
    "why": "Excellent quick wildlife drive-through style stop.",
    "notes": {
      "elsie": "Observe large animals safely from the car.",
      "katrina": "Ask why wildlife needs protected space.",
      "emma": "Connect animals, parks, and visitor rules.",
      "eliette": "Look for antlers, signs, and movement.",
      "jules": "Elk spotting mission.",
      "momdad": "Excellent quick wildlife drive-through style stop."
    },
    "profiles": {
      "elsie": "Observe large animals safely from the car.",
      "katrina": "Ask why wildlife needs protected space.",
      "emma": "Connect animals, parks, and visitor rules.",
      "eliette": "Look for antlers, signs, and movement.",
      "jules": "Elk spotting mission.",
      "momdad": "Excellent quick wildlife drive-through style stop."
    },
    "csvOrder": 120
  },
  {
    "id": "P3-051",
    "title": "Route 66 State Park",
    "name": "Route 66 State Park",
    "category": "State Park / Road History",
    "latitude": 38.5026,
    "longitude": -90.6843,
    "lat": 38.5026,
    "lon": -90.6843,
    "lng": -90.6843,
    "phase": "Phase 3",
    "routeSegment": "Eureka / Missouri return corridor",
    "route_segment": "Eureka / Missouri return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://mostateparks.com/park/route-66-state-park",
    "official_website": "https://mostateparks.com/park/route-66-state-park",
    "learnMoreUrl": "https://mostateparks.com/park/route-66-state-park",
    "learn_more": "https://mostateparks.com/park/route-66-state-park",
    "sourceUrl": "https://mostateparks.com/park/route-66-state-park",
    "shortSummary": "Missouri state park preserving Route 66 corridor history.",
    "summary": "Missouri state park preserving Route 66 corridor history.",
    "whyItMatters": "Good road-trip themed stop west of St. Louis.",
    "why": "Good road-trip themed stop west of St. Louis.",
    "notes": {
      "elsie": "Compare Route 66 travel with interstate travel.",
      "katrina": "Ask why old roads become historic.",
      "emma": "Connect signs, cars, diners, and maps.",
      "eliette": "Find old-road details.",
      "jules": "Road history mission.",
      "momdad": "Good road-trip themed stop west of St. Louis."
    },
    "profiles": {
      "elsie": "Compare Route 66 travel with interstate travel.",
      "katrina": "Ask why old roads become historic.",
      "emma": "Connect signs, cars, diners, and maps.",
      "eliette": "Find old-road details.",
      "jules": "Road history mission.",
      "momdad": "Good road-trip themed stop west of St. Louis."
    },
    "csvOrder": 121
  },
  {
    "id": "P3-052",
    "title": "Meramec Caverns",
    "name": "Meramec Caverns",
    "category": "Cave / Roadside Attraction",
    "latitude": 38.2434,
    "longitude": -91.0923,
    "lat": 38.2434,
    "lon": -91.0923,
    "lng": -91.0923,
    "phase": "Phase 3",
    "routeSegment": "Stanton / Missouri return corridor",
    "route_segment": "Stanton / Missouri return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://www.americascave.com/",
    "official_website": "https://www.americascave.com/",
    "learnMoreUrl": "https://www.americascave.com/",
    "learn_more": "https://www.americascave.com/",
    "sourceUrl": "https://www.americascave.com/",
    "shortSummary": "Large show cave and classic Missouri roadside attraction.",
    "summary": "Large show cave and classic Missouri roadside attraction.",
    "whyItMatters": "Memorable geology and old-school road-trip stop.",
    "why": "Memorable geology and old-school road-trip stop.",
    "notes": {
      "elsie": "Think about how caves form over time.",
      "katrina": "Ask why caves became tourist attractions.",
      "emma": "Connect water, rock, and time.",
      "eliette": "Find shapes, colors, and cave details.",
      "jules": "Cave mission.",
      "momdad": "Memorable geology and old-school road-trip stop."
    },
    "profiles": {
      "elsie": "Think about how caves form over time.",
      "katrina": "Ask why caves became tourist attractions.",
      "emma": "Connect water, rock, and time.",
      "eliette": "Find shapes, colors, and cave details.",
      "jules": "Cave mission.",
      "momdad": "Memorable geology and old-school road-trip stop."
    },
    "csvOrder": 122
  },
  {
    "id": "P3-053",
    "title": "Onondaga Cave State Park",
    "name": "Onondaga Cave State Park",
    "category": "State Park / Cave",
    "latitude": 38.0726,
    "longitude": -91.2407,
    "lat": 38.0726,
    "lon": -91.2407,
    "lng": -91.2407,
    "phase": "Phase 3",
    "routeSegment": "Leasburg / Missouri return corridor",
    "route_segment": "Leasburg / Missouri return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://mostateparks.com/park/onondaga-cave-state-park",
    "official_website": "https://mostateparks.com/park/onondaga-cave-state-park",
    "learnMoreUrl": "https://mostateparks.com/park/onondaga-cave-state-park",
    "learn_more": "https://mostateparks.com/park/onondaga-cave-state-park",
    "sourceUrl": "https://mostateparks.com/park/onondaga-cave-state-park",
    "shortSummary": "Missouri state park known for cave tours.",
    "summary": "Missouri state park known for cave tours.",
    "whyItMatters": "Official cave-and-nature alternative on the return route.",
    "why": "Official cave-and-nature alternative on the return route.",
    "notes": {
      "elsie": "Notice how water shapes stone.",
      "katrina": "Ask why caves need protection.",
      "emma": "Connect geology, water, and patience.",
      "eliette": "Find formations and patterns.",
      "jules": "Cave shape mission.",
      "momdad": "Official cave-and-nature alternative on the return route."
    },
    "profiles": {
      "elsie": "Notice how water shapes stone.",
      "katrina": "Ask why caves need protection.",
      "emma": "Connect geology, water, and patience.",
      "eliette": "Find formations and patterns.",
      "jules": "Cave shape mission.",
      "momdad": "Official cave-and-nature alternative on the return route."
    },
    "csvOrder": 123
  },
  {
    "id": "P3-054",
    "title": "Missouri Mines State Historic Site",
    "name": "Missouri Mines State Historic Site",
    "category": "Historic Site / Mining",
    "latitude": 37.8359,
    "longitude": -90.4947,
    "lat": 37.8359,
    "lon": -90.4947,
    "lng": -90.4947,
    "phase": "Phase 3",
    "routeSegment": "Park Hills / Missouri optional return",
    "route_segment": "Park Hills / Missouri optional return",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://mostateparks.com/historic-site/missouri-mines-state-historic-site",
    "official_website": "https://mostateparks.com/historic-site/missouri-mines-state-historic-site",
    "learnMoreUrl": "https://mostateparks.com/historic-site/missouri-mines-state-historic-site",
    "learn_more": "https://mostateparks.com/historic-site/missouri-mines-state-historic-site",
    "sourceUrl": "https://mostateparks.com/historic-site/missouri-mines-state-historic-site",
    "shortSummary": "Historic mining and mineral site in Missouri.",
    "summary": "Historic mining and mineral site in Missouri.",
    "whyItMatters": "Good industry and geology stop if using a southern return variation.",
    "why": "Good industry and geology stop if using a southern return variation.",
    "notes": {
      "elsie": "Think about what comes from underground.",
      "katrina": "Ask how mining changed towns and landscapes.",
      "emma": "Connect minerals, jobs, and environmental choices.",
      "eliette": "Find shiny rocks and equipment details.",
      "jules": "Rock and mine mission.",
      "momdad": "Good industry and geology stop if using a southern return variation."
    },
    "profiles": {
      "elsie": "Think about what comes from underground.",
      "katrina": "Ask how mining changed towns and landscapes.",
      "emma": "Connect minerals, jobs, and environmental choices.",
      "eliette": "Find shiny rocks and equipment details.",
      "jules": "Rock and mine mission.",
      "momdad": "Good industry and geology stop if using a southern return variation."
    },
    "csvOrder": 124
  },
  {
    "id": "P3-055",
    "title": "Mark Twain Cave",
    "name": "Mark Twain Cave",
    "category": "Cave / Literature",
    "latitude": 39.7073,
    "longitude": -91.3585,
    "lat": 39.7073,
    "lon": -91.3585,
    "lng": -91.3585,
    "phase": "Phase 3",
    "routeSegment": "Hannibal / Missouri optional return",
    "route_segment": "Hannibal / Missouri optional return",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://marktwaincave.com/",
    "official_website": "https://marktwaincave.com/",
    "learnMoreUrl": "https://marktwaincave.com/",
    "learn_more": "https://marktwaincave.com/",
    "sourceUrl": "https://marktwaincave.com/",
    "shortSummary": "Show cave associated with Mark Twain's Hannibal stories.",
    "summary": "Show cave associated with Mark Twain's Hannibal stories.",
    "whyItMatters": "Combines literature, geology, and classic road-trip energy.",
    "why": "Combines literature, geology, and classic road-trip energy.",
    "notes": {
      "elsie": "Think about how places inspire stories.",
      "katrina": "Ask how a cave becomes part of a book.",
      "emma": "Connect adventure, imagination, and real places.",
      "eliette": "Find story clues and cave textures.",
      "jules": "Tom Sawyer cave mission.",
      "momdad": "Combines literature, geology, and classic road-trip energy."
    },
    "profiles": {
      "elsie": "Think about how places inspire stories.",
      "katrina": "Ask how a cave becomes part of a book.",
      "emma": "Connect adventure, imagination, and real places.",
      "eliette": "Find story clues and cave textures.",
      "jules": "Tom Sawyer cave mission.",
      "momdad": "Combines literature, geology, and classic road-trip energy."
    },
    "csvOrder": 125
  },
  {
    "id": "P3-056",
    "title": "Mark Twain Boyhood Home & Museum",
    "name": "Mark Twain Boyhood Home & Museum",
    "category": "Literary Museum",
    "latitude": 39.7084,
    "longitude": -91.358,
    "lat": 39.7084,
    "lon": -91.358,
    "lng": -91.358,
    "phase": "Phase 3",
    "routeSegment": "Hannibal / Missouri optional return",
    "route_segment": "Hannibal / Missouri optional return",
    "tier": "Core",
    "estimatedStopMinutes": 90,
    "estimated_stop_minutes": 90,
    "officialWebsiteUrl": "https://marktwainmuseum.org/",
    "official_website": "https://marktwainmuseum.org/",
    "learnMoreUrl": "https://marktwainmuseum.org/",
    "learn_more": "https://marktwainmuseum.org/",
    "sourceUrl": "https://marktwainmuseum.org/",
    "shortSummary": "Museum centered on Mark Twain's childhood in Hannibal.",
    "summary": "Museum centered on Mark Twain's childhood in Hannibal.",
    "whyItMatters": "Strong literature/history stop if using a northern Missouri return.",
    "why": "Strong literature/history stop if using a northern Missouri return.",
    "notes": {
      "elsie": "Think about how childhood places shape writers.",
      "katrina": "Ask why Twain's stories lasted so long.",
      "emma": "Connect books, towns, and imagination.",
      "eliette": "Find old house and story details.",
      "jules": "Book-town mission.",
      "momdad": "Strong literature/history stop if using a northern Missouri return."
    },
    "profiles": {
      "elsie": "Think about how childhood places shape writers.",
      "katrina": "Ask why Twain's stories lasted so long.",
      "emma": "Connect books, towns, and imagination.",
      "eliette": "Find old house and story details.",
      "jules": "Book-town mission.",
      "momdad": "Strong literature/history stop if using a northern Missouri return."
    },
    "csvOrder": 126
  },
  {
    "id": "P3-057",
    "title": "Walt Disney Hometown Museum",
    "name": "Walt Disney Hometown Museum",
    "category": "Museum",
    "latitude": 39.4231,
    "longitude": -92.8016,
    "lat": 39.4231,
    "lon": -92.8016,
    "lng": -92.8016,
    "phase": "Phase 3",
    "routeSegment": "Marceline / Missouri optional return",
    "route_segment": "Marceline / Missouri optional return",
    "tier": "Core",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://www.waltdisneymuseum.org/",
    "official_website": "https://www.waltdisneymuseum.org/",
    "learnMoreUrl": "https://www.waltdisneymuseum.org/",
    "learn_more": "https://www.waltdisneymuseum.org/",
    "sourceUrl": "https://www.waltdisneymuseum.org/",
    "shortSummary": "Museum in Walt Disney's childhood hometown of Marceline.",
    "summary": "Museum in Walt Disney's childhood hometown of Marceline.",
    "whyItMatters": "Great family/pop-culture stop with small-town roots.",
    "why": "Great family/pop-culture stop with small-town roots.",
    "notes": {
      "elsie": "Think about how childhood places shape creativity.",
      "katrina": "Ask what Disney may have remembered from Marceline.",
      "emma": "Connect imagination, work, and home towns.",
      "eliette": "Look for photos, trains, and drawing details.",
      "jules": "Mickey hometown mission.",
      "momdad": "Great family/pop-culture stop with small-town roots."
    },
    "profiles": {
      "elsie": "Think about how childhood places shape creativity.",
      "katrina": "Ask what Disney may have remembered from Marceline.",
      "emma": "Connect imagination, work, and home towns.",
      "eliette": "Look for photos, trains, and drawing details.",
      "jules": "Mickey hometown mission.",
      "momdad": "Great family/pop-culture stop with small-town roots."
    },
    "csvOrder": 127
  },
  {
    "id": "P3-058",
    "title": "Gen. John J. Pershing Boyhood Home State Historic Site",
    "name": "Gen. John J. Pershing Boyhood Home State Historic Site",
    "category": "Historic Site",
    "latitude": 39.787,
    "longitude": -93.0638,
    "lat": 39.787,
    "lon": -93.0638,
    "lng": -93.0638,
    "phase": "Phase 3",
    "routeSegment": "Laclede / Missouri optional return",
    "route_segment": "Laclede / Missouri optional return",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 60,
    "estimated_stop_minutes": 60,
    "officialWebsiteUrl": "https://mostateparks.com/historic-site/gen-john-j-pershing-boyhood-home-state-historic-site",
    "official_website": "https://mostateparks.com/historic-site/gen-john-j-pershing-boyhood-home-state-historic-site",
    "learnMoreUrl": "https://mostateparks.com/historic-site/gen-john-j-pershing-boyhood-home-state-historic-site",
    "learn_more": "https://mostateparks.com/historic-site/gen-john-j-pershing-boyhood-home-state-historic-site",
    "sourceUrl": "https://mostateparks.com/historic-site/gen-john-j-pershing-boyhood-home-state-historic-site",
    "shortSummary": "Missouri state historic site honoring General John J. Pershing's boyhood home.",
    "summary": "Missouri state historic site honoring General John J. Pershing's boyhood home.",
    "whyItMatters": "Useful World War I connection paired with Kansas City's WWI museum.",
    "why": "Useful World War I connection paired with Kansas City's WWI museum.",
    "notes": {
      "elsie": "Connect a person’s childhood to world events.",
      "katrina": "Ask how leaders are shaped by early life.",
      "emma": "Compare small-town roots and global history.",
      "eliette": "Find house and military details.",
      "jules": "General house mission.",
      "momdad": "Useful World War I connection paired with Kansas City's WWI museum."
    },
    "profiles": {
      "elsie": "Connect a person’s childhood to world events.",
      "katrina": "Ask how leaders are shaped by early life.",
      "emma": "Compare small-town roots and global history.",
      "eliette": "Find house and military details.",
      "jules": "General house mission.",
      "momdad": "Useful World War I connection paired with Kansas City's WWI museum."
    },
    "csvOrder": 128
  },
  {
    "id": "P3-059",
    "title": "Battle of Westport Museum and Visitor Center",
    "name": "Battle of Westport Museum and Visitor Center",
    "category": "Civil War Site",
    "latitude": 38.9847,
    "longitude": -94.6044,
    "lat": 38.9847,
    "lon": -94.6044,
    "lng": -94.6044,
    "phase": "Phase 3",
    "routeSegment": "Kansas City return corridor",
    "route_segment": "Kansas City return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://battleofwestport.org/",
    "official_website": "https://battleofwestport.org/",
    "learnMoreUrl": "https://battleofwestport.org/",
    "learn_more": "https://battleofwestport.org/",
    "sourceUrl": "https://battleofwestport.org/",
    "shortSummary": "Visitor center and interpretation for the Battle of Westport.",
    "summary": "Visitor center and interpretation for the Battle of Westport.",
    "whyItMatters": "Good Kansas City-area return history stop.",
    "why": "Good Kansas City-area return history stop.",
    "notes": {
      "elsie": "Think about how war reached familiar places.",
      "katrina": "Ask why Westport mattered in the Civil War.",
      "emma": "Connect local streets to national history.",
      "eliette": "Find maps, markers, and battlefield clues.",
      "jules": "Map mission.",
      "momdad": "Good Kansas City-area return history stop."
    },
    "profiles": {
      "elsie": "Think about how war reached familiar places.",
      "katrina": "Ask why Westport mattered in the Civil War.",
      "emma": "Connect local streets to national history.",
      "eliette": "Find maps, markers, and battlefield clues.",
      "jules": "Map mission.",
      "momdad": "Good Kansas City-area return history stop."
    },
    "csvOrder": 129
  },
  {
    "id": "P3-060",
    "title": "Shawnee Town 1929",
    "name": "Shawnee Town 1929",
    "category": "Living History",
    "latitude": 39.0146,
    "longitude": -94.714,
    "lat": 39.0146,
    "lon": -94.714,
    "lng": -94.714,
    "phase": "Phase 3",
    "routeSegment": "Johnson County return corridor",
    "route_segment": "Johnson County return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://www.shawneetown.org/",
    "official_website": "https://www.shawneetown.org/",
    "learnMoreUrl": "https://www.shawneetown.org/",
    "learn_more": "https://www.shawneetown.org/",
    "sourceUrl": "https://www.shawneetown.org/",
    "shortSummary": "Living history museum in Shawnee, Kansas.",
    "summary": "Living history museum in Shawnee, Kansas.",
    "whyItMatters": "Good close-to-home final stop showing everyday life in 1929.",
    "why": "Good close-to-home final stop showing everyday life in 1929.",
    "notes": {
      "elsie": "Compare 1929 daily life with your home today.",
      "katrina": "Ask what changed most in 100 years.",
      "emma": "Connect school, stores, chores, and transportation.",
      "eliette": "Find old signs, rooms, and shop details.",
      "jules": "Old town mission.",
      "momdad": "Good close-to-home final stop showing everyday life in 1929."
    },
    "profiles": {
      "elsie": "Compare 1929 daily life with your home today.",
      "katrina": "Ask what changed most in 100 years.",
      "emma": "Connect school, stores, chores, and transportation.",
      "eliette": "Find old signs, rooms, and shop details.",
      "jules": "Old town mission.",
      "momdad": "Good close-to-home final stop showing everyday life in 1929."
    },
    "csvOrder": 130
  },
  {
    "id": "P3-061",
    "title": "Johnson County Museum",
    "name": "Johnson County Museum",
    "category": "History Museum",
    "latitude": 38.9666,
    "longitude": -94.7013,
    "lat": 38.9666,
    "lon": -94.7013,
    "lng": -94.7013,
    "phase": "Phase 3",
    "routeSegment": "Johnson County return corridor",
    "route_segment": "Johnson County return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 45,
    "estimated_stop_minutes": 45,
    "officialWebsiteUrl": "https://jcprd.com/330/Johnson-County-Museum",
    "official_website": "https://jcprd.com/330/Johnson-County-Museum",
    "learnMoreUrl": "https://jcprd.com/330/Johnson-County-Museum",
    "learn_more": "https://jcprd.com/330/Johnson-County-Museum",
    "sourceUrl": "https://jcprd.com/330/Johnson-County-Museum",
    "shortSummary": "Local museum covering Johnson County history.",
    "summary": "Local museum covering Johnson County history.",
    "whyItMatters": "Useful final reflection stop after returning home.",
    "why": "Useful final reflection stop after returning home.",
    "notes": {
      "elsie": "Think about how home has its own history.",
      "katrina": "Ask what future people will remember about today.",
      "emma": "Connect the trip back to where you live.",
      "eliette": "Find familiar places in old photos.",
      "jules": "Home history mission.",
      "momdad": "Useful final reflection stop after returning home."
    },
    "profiles": {
      "elsie": "Think about how home has its own history.",
      "katrina": "Ask what future people will remember about today.",
      "emma": "Connect the trip back to where you live.",
      "eliette": "Find familiar places in old photos.",
      "jules": "Home history mission.",
      "momdad": "Useful final reflection stop after returning home."
    },
    "csvOrder": 131
  },
  {
    "id": "P3-062",
    "title": "Kauffman Stadium",
    "name": "Kauffman Stadium",
    "category": "Sports Landmark",
    "latitude": 39.0517,
    "longitude": -94.4803,
    "lat": 39.0517,
    "lon": -94.4803,
    "lng": -94.4803,
    "phase": "Phase 3",
    "routeSegment": "Kansas City return corridor",
    "route_segment": "Kansas City return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://www.mlb.com/royals/ballpark",
    "official_website": "https://www.mlb.com/royals/ballpark",
    "learnMoreUrl": "https://www.mlb.com/royals/ballpark",
    "learn_more": "https://www.mlb.com/royals/ballpark",
    "sourceUrl": "https://www.mlb.com/royals/ballpark",
    "shortSummary": "Home of the Kansas City Royals.",
    "summary": "Home of the Kansas City Royals.",
    "whyItMatters": "Quick KC sports landmark on the way back into town.",
    "why": "Quick KC sports landmark on the way back into town.",
    "notes": {
      "elsie": "Think about stadiums as community gathering places.",
      "katrina": "Ask what makes a team feel like home.",
      "emma": "Connect sports, city pride, and family memories.",
      "eliette": "Find logos, fountains, and blue details.",
      "jules": "Royals mission.",
      "momdad": "Quick KC sports landmark on the way back into town."
    },
    "profiles": {
      "elsie": "Think about stadiums as community gathering places.",
      "katrina": "Ask what makes a team feel like home.",
      "emma": "Connect sports, city pride, and family memories.",
      "eliette": "Find logos, fountains, and blue details.",
      "jules": "Royals mission.",
      "momdad": "Quick KC sports landmark on the way back into town."
    },
    "csvOrder": 132
  },
  {
    "id": "P3-063",
    "title": "GEHA Field at Arrowhead Stadium",
    "name": "GEHA Field at Arrowhead Stadium",
    "category": "Sports Landmark",
    "latitude": 39.0489,
    "longitude": -94.4839,
    "lat": 39.0489,
    "lon": -94.4839,
    "lng": -94.4839,
    "phase": "Phase 3",
    "routeSegment": "Kansas City return corridor",
    "route_segment": "Kansas City return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://www.chiefs.com/stadium/",
    "official_website": "https://www.chiefs.com/stadium/",
    "learnMoreUrl": "https://www.chiefs.com/stadium/",
    "learn_more": "https://www.chiefs.com/stadium/",
    "sourceUrl": "https://www.chiefs.com/stadium/",
    "shortSummary": "Home of the Kansas City Chiefs.",
    "summary": "Home of the Kansas City Chiefs.",
    "whyItMatters": "Strong homecoming sports landmark for KC fans.",
    "why": "Strong homecoming sports landmark for KC fans.",
    "notes": {
      "elsie": "Think about why stadiums become city symbols.",
      "katrina": "Ask how traditions make fans feel connected.",
      "emma": "Connect sports, family, and place.",
      "eliette": "Look for red, arrows, and stadium shapes.",
      "jules": "Chiefs mission.",
      "momdad": "Strong homecoming sports landmark for KC fans."
    },
    "profiles": {
      "elsie": "Think about why stadiums become city symbols.",
      "katrina": "Ask how traditions make fans feel connected.",
      "emma": "Connect sports, family, and place.",
      "eliette": "Look for red, arrows, and stadium shapes.",
      "jules": "Chiefs mission.",
      "momdad": "Strong homecoming sports landmark for KC fans."
    },
    "csvOrder": 133
  },
  {
    "id": "P3-064",
    "title": "Powell Gardens",
    "name": "Powell Gardens",
    "category": "Garden",
    "latitude": 38.864,
    "longitude": -94.0407,
    "lat": 38.864,
    "lon": -94.0407,
    "lng": -94.0407,
    "phase": "Phase 3",
    "routeSegment": "Kansas City east return corridor",
    "route_segment": "Kansas City east return corridor",
    "tier": "Worth a Stop",
    "estimatedStopMinutes": 75,
    "estimated_stop_minutes": 75,
    "officialWebsiteUrl": "https://powellgardens.org/",
    "official_website": "https://powellgardens.org/",
    "learnMoreUrl": "https://powellgardens.org/",
    "learn_more": "https://powellgardens.org/",
    "sourceUrl": "https://powellgardens.org/",
    "shortSummary": "Botanical garden east of Kansas City.",
    "summary": "Botanical garden east of Kansas City.",
    "whyItMatters": "Good final outdoor reset before home.",
    "why": "Good final outdoor reset before home.",
    "notes": {
      "elsie": "Notice plant design and prairie landscapes.",
      "katrina": "Ask how gardens teach people about nature.",
      "emma": "Connect beauty, food, pollinators, and weather.",
      "eliette": "Find flowers, paths, and art details.",
      "jules": "Garden mission.",
      "momdad": "Good final outdoor reset before home."
    },
    "profiles": {
      "elsie": "Notice plant design and prairie landscapes.",
      "katrina": "Ask how gardens teach people about nature.",
      "emma": "Connect beauty, food, pollinators, and weather.",
      "eliette": "Find flowers, paths, and art details.",
      "jules": "Garden mission.",
      "momdad": "Good final outdoor reset before home."
    },
    "csvOrder": 134
  },
  {
    "id": "P3-065",
    "title": "Lone Jack Battlefield Museum",
    "name": "Lone Jack Battlefield Museum",
    "category": "Civil War Site",
    "latitude": 38.8706,
    "longitude": -94.1743,
    "lat": 38.8706,
    "lon": -94.1743,
    "lng": -94.1743,
    "phase": "Phase 3",
    "routeSegment": "Missouri return corridor",
    "route_segment": "Missouri return corridor",
    "tier": "Good Reset",
    "estimatedStopMinutes": 30,
    "estimated_stop_minutes": 30,
    "officialWebsiteUrl": "https://historiclonejack.org/",
    "official_website": "https://historiclonejack.org/",
    "learnMoreUrl": "https://historiclonejack.org/",
    "learn_more": "https://historiclonejack.org/",
    "sourceUrl": "https://historiclonejack.org/",
    "shortSummary": "Museum and battlefield site in Lone Jack, Missouri.",
    "summary": "Museum and battlefield site in Lone Jack, Missouri.",
    "whyItMatters": "Small but route-relevant Civil War stop east of KC.",
    "why": "Small but route-relevant Civil War stop east of KC.",
    "notes": {
      "elsie": "Think about local places with national history.",
      "katrina": "Ask why small battles are remembered.",
      "emma": "Connect markers, towns, and memory.",
      "eliette": "Find old photos, maps, and signs.",
      "jules": "Battlefield marker mission.",
      "momdad": "Small but route-relevant Civil War stop east of KC."
    },
    "profiles": {
      "elsie": "Think about local places with national history.",
      "katrina": "Ask why small battles are remembered.",
      "emma": "Connect markers, towns, and memory.",
      "eliette": "Find old photos, maps, and signs.",
      "jules": "Battlefield marker mission.",
      "momdad": "Small but route-relevant Civil War stop east of KC."
    },
    "csvOrder": 135
  }
];

  const phaseLabels = {
    pretrip: "Pre-trip",
    outbound: "Outbound",
    island: "Island stay",
    return: "Return trip",
    complete: "Trip complete"
  };

  const pages = ["today", "route", "explore", "nearby", "learn", "lens", "rewards", "memories", "detail", "weather", "stars", "ferry", "activities", "badges", "saved", "photos", "sources", "settings"];
  const parentPages = ["today", "route", "explore", "nearby", "learn", "lens", "rewards", "memories", "detail", "gps", "weather", "ferry", "stops", "votes", "saved", "badges", "photos", "sources", "settings"];
  const mainMenuItems = [
    ["explore", "Explore Map", "All uploaded trip stops on one clustered map"],
    ["memories", "Trip Summary", "Saved photos, stats, and timeline"],
    ["photos", "Photos", "Captured media"],
    ["rewards", "Badges", "Earned and upcoming trip badges"],
    ["weather", "Weather", "Forecast and radar"],
    ["ferry", "Ferry Information", "Plaunt ferry and weather context"],
    ["settings", "Settings", "Storage, offline, and app status"]
  ];
  const julesFlow = ["Captain Today", "Weather", "Ferry / Boats", "Big Machines", "Stars", "Badges", "Photos", "Done / Next choice"];

  function day1SeedBreadcrumbs() {
    const DAY1_ROUTE = [
      { lat: 38.8814, lon: -94.8191, label: "Home", time: "2026-07-31T08:00:00-05:00" },
      { lat: 38.9517, lon: -92.3341, label: "Columbia, MO", time: "2026-07-31T10:30:00-05:00" },
      { lat: 38.6270, lon: -90.1994, label: "St. Louis, MO", time: "2026-07-31T12:30:00-05:00" },
      { lat: 39.7817, lon: -89.6501, label: "Springfield, IL", time: "2026-07-31T15:00:00-05:00" },
      { lat: 40.4842, lon: -88.9937, label: "Bloomington-Normal, IL", time: "2026-07-31T16:15:00-05:00" },
      { lat: 40.7692, lon: -87.7320, label: "Watseka, IL", time: "2026-07-31T17:30:00-05:00" },
      { lat: 41.4828, lon: -87.3328, label: "Merrillville, IN", time: "2026-07-31T19:30:00-05:00" }
    ];
    return DAY1_ROUTE.map((point) => ({
      id: `crumb-day1-${point.lat}-${point.lon}`,
      latitude: point.lat,
      longitude: point.lon,
      recordedAt: point.time,
      tripLeg: "day1",
      reason: "waypoint-arrival",
      accuracy: null,
      profile: "all",
      label: point.label
    }));
  }

  function defaultState() {
    return {
      phase: "pretrip",
      progress: 0,
      returnProgress: 0,
      profile: "elsie",
      hasChosenProfile: false,
      shortlist: {},
      favorites: {},
      votes: {},
      approved: [],
      dismissed: [],
      completed: [],
      captures: [],
      journal: [],
      draftPhotos: [],
      visitedStops: {},
      tripLeg: "day1",
      includeIndianaDunes: true,
      completedStops: {},
      gpsAutoOn: true,
      julesMarkerStyle: "sonic",
      mapTheme: "light",
      smokeEnabled: false,
      wildfiresEnabled: false,
      profileStopRatings: { elsie: {}, katrina: {}, emma: {} },
      profileCollections: { elsie: {}, katrina: {}, emma: {} },
      pendingAnalyze: false,
      badges: {},
      weather: {},
      actionMessage: "No action yet.",
      gpsStatus: "Off",
      trackingStatus: "Off",
      breadcrumbTrail: day1SeedBreadcrumbs(),
      breadcrumbVisible: true,
      radarEnabled: false,
      radarOpacity: 0.45,
      radarAnimationEnabled: false,
      radarStationsVisible: false,
      radarCachedFrame: null,
      activeElsieSheet: null
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem("tripState")) || {};
      const merged = { ...defaultState(), ...saved };
      merged.shortlist = { ...(saved.shortlist || saved.favorites || {}) };
      merged.badges ||= {};
      merged.weather ||= {};
      return merged;
    } catch {
      return defaultState();
    }
  }

  function ensureCollections() {
    state.shortlist ||= {};
    state.favorites ||= {};
    state.votes ||= {};
    state.approved ||= [];
    state.dismissed ||= [];
    state.completed ||= [];
    state.captures ||= [];
    state.journal ||= [];
    state.draftPhotos ||= [];
    state.visitedStops ||= {};
    state.completedStops ||= {};
    if (typeof state.gpsAutoOn !== "boolean") state.gpsAutoOn = true;
    if (state.julesMarkerStyle !== "sonic" && state.julesMarkerStyle !== "f1") state.julesMarkerStyle = "sonic";
    if (state.mapTheme !== "light" && state.mapTheme !== "dark") state.mapTheme = "light";
    if (typeof state.smokeEnabled !== "boolean") state.smokeEnabled = false;
    if (typeof state.wildfiresEnabled !== "boolean") state.wildfiresEnabled = false;
    state.profileStopRatings ||= {};
    state.profileCollections ||= {};
    MAP_PROFILES.forEach((p) => {
      state.profileStopRatings[p] ||= {};
      state.profileCollections[p] ||= {};
    });
    delete state.routeResults;
    if (typeof state.includeIndianaDunes !== "boolean") state.includeIndianaDunes = true;
    [state.captures, state.journal, state.draftPhotos].forEach((list) => {
      list.forEach((item) => {
        item.id ||= makeId("photo");
        item.notes ||= "";
      });
    });
    state.badges ||= {};
    state.weather ||= {};
    if (!Array.isArray(state.breadcrumbTrail)) state.breadcrumbTrail = [];
    if (!state.breadcrumbTrail.some((crumb) => crumb.id && crumb.id.startsWith("crumb-day1-"))) {
      state.breadcrumbTrail.push(...day1SeedBreadcrumbs());
    }
    if (typeof state.breadcrumbVisible !== "boolean") state.breadcrumbVisible = true;
    if (typeof state.radarEnabled !== "boolean") state.radarEnabled = false;
    if (!Number.isFinite(Number(state.radarOpacity))) state.radarOpacity = 0.45;
    if (typeof state.radarAnimationEnabled !== "boolean") state.radarAnimationEnabled = false;
    if (typeof state.radarStationsVisible !== "boolean") state.radarStationsVisible = false;
  }

  function saveState() {
    ensureCollections();
    state.profile = activeProfile;
    try {
      localStorage.setItem("tripState", JSON.stringify(state));
      state.storageWarning = "";
    } catch {
      state.storageWarning = "Storage is nearly full on this device. Save fewer large photos or remove older entries.";
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function currentProfile() {
    return data.profiles.find((profile) => profile.id === activeProfile) || data.profiles[0];
  }

  function selectedDay() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const exactMatch = data.days.find((d) => d.date === todayStr);
    if (exactMatch) return exactMatch;
    // No exact calendar match: use the most recent day at or before today, clamped to the
    // trip's actual date range (handles days before departure or after the trip ends).
    const sorted = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
    if (todayStr < sorted[0].date) return sorted[0];
    const pastDays = sorted.filter((d) => d.date <= todayStr);
    return pastDays.length ? pastDays[pastDays.length - 1] : sorted[sorted.length - 1];
  }

  function selectedDayDate() {
    return selectedDay().date;
  }

  function isChild(profile = currentProfile()) {
    return !["momdad"].includes(profile.id);
  }

  function isDashboardProfile(profile = currentProfile()) {
    return profile.id !== "jules";
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function haversineMiles(a, b) {
    const radius = 3958.8;
    const toRad = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function allAttractions() {
    const csvStops = Array.isArray(window.TRIP_STOPS) ? window.TRIP_STOPS : [];
    const embeddedStops = Array.isArray(EMBEDDED_TRIP_STOPS) ? EMBEDDED_TRIP_STOPS : [];
    const source = csvStops.length ? csvStops : embeddedStops.length ? embeddedStops : (data.attractions || data.route.routePlaces || []);
    return source
      .map((item) => enrichStop({
        ...item,
        title: item.title || item.name,
        name: item.name || item.title,
        sourceUrl: item.sourceUrl || item.officialWebsiteUrl || item.learnMoreUrl || item.learnMore,
        learnMore: item.learnMore || item.learnMoreUrl || item.officialWebsiteUrl,
        summary: item.summary || item.shortSummary,
        why: item.why || item.whyItMatters
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
  }

  function enrichStop(item) {
    const title = item.title || item.name || "";
    const category = item.category || stopCategory(item);
    const lat = Number(item.lat ?? item.latitude);
    const lon = Number(item.lon ?? item.lng ?? item.longitude);
    const minutes = Number(item.estimatedStopMinutes ?? item.estimated_stop_minutes);
    const estimatedStopTime = item.estimatedStopTime || (Number.isFinite(minutes) ? `${minutes} min` : stopTime({ ...item, category }));
    const profileNotes = item.profiles || item.notes || {};
    return {
      ...item,
      title,
      name: item.name || title,
      lat,
      lon,
      category,
      icon: stopIcon(category),
      tier: item.tier || stopTier(item),
      estimatedStopTime,
      distanceOffRoute: item.distanceOffRoute || offRouteEstimate(item),
      latitude: lat,
      longitude: lon,
      summary: item.summary || item.shortSummary || "",
      why: item.why || item.whyItMatters || item.summary || item.shortSummary || "",
      profiles: {
        momdad: profileNotes.momdad || item.whyItMatters || item.why || item.summary || "",
        elsie: profileNotes.elsie || profileNotes.elsie14 || "",
        katrina: profileNotes.katrina || profileNotes.katrina11 || "",
        emma: profileNotes.emma || profileNotes.emma10 || "",
        eliette: profileNotes.eliette || profileNotes.eliette10 || "",
        jules: profileNotes.jules || profileNotes.jules5 || ""
      }
    };
  }

  function stopCategory(item) {
    const text = `${item.title || item.name} ${item.summary || item.why || ""}`.toLowerCase();
    if (text.includes("ferry") || text.includes("plaunt")) return "Ferry";
    if (text.includes("national park") || text.includes("dunes")) return "National Park";
    if (text.includes("museum") || text.includes("studebaker")) return "Museum";
    if (text.includes("arch") || text.includes("bridge") || text.includes("historic") || text.includes("history")) return "Historic Site";
    if (text.includes("lighthouse")) return "Lighthouse";
    if (text.includes("food") || text.includes("dinner")) return "Food Stop";
    if (text.includes("big things") || text.includes("odd")) return "Oddity";
    return "Photo Stop";
  }

  function stopIcon(category) {
    return {
      "National Park": "△",
      "Historic Site": "▥",
      "Museum": "▦",
      "Lighthouse": "◌",
      "Waterfall": "≈",
      "Food Stop": "⌘",
      "Oddity": "✦",
      "Photo Stop": "◉",
      "Ferry": "▰"
    }[category] || "•";
  }

  function stopTier(item) {
    const name = item.title || item.name || "";
    if (/South Bend|Notre Dame|Plaunt|Gateway Arch|Bois Blanc/i.test(name)) return "Core";
    if (/Studebaker|Speedway|Mackinac|Dunes|Big Things/i.test(name)) return "Worth a stop";
    return "Good reset";
  }

  function stopTime(item) {
    const category = item.category || stopCategory(item);
    if (category === "Ferry") return "45-75 min";
    if (category === "National Park") return "45-90 min";
    if (category === "Museum") return "45-90 min";
    if (category === "Food Stop") return "45-60 min";
    return "15-30 min";
  }

  function offRouteEstimate(item) {
    const name = item.title || item.name || "";
    if (/Gateway Arch|Notre Dame|Studebaker|Plaunt|Columbia|Rocheport/i.test(name)) return "near route";
    if (/Big Things|Speedway|Dunes|Mackinac/i.test(name)) return "short detour";
    return "route context";
  }

  function appleMapsUrl(stop) {
    return `https://maps.apple.com/?daddr=${stop.lat},${stop.lon}&dirflg=d`;
  }

  function stopDistanceLabel(stop) {
    if (state.lastPosition) return `${haversineMiles(state.lastPosition, stop).toFixed(1)} mi away`;
    if (stop.milesFromStart) return `mile ${stop.milesFromStart}`;
    return stop.routeSegment || "route stop";
  }

  function stopKey(stop) {
    return stop.id || (stop.title || stop.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function isStopSaved(stop) {
    const name = stop.title || stop.name;
    return Object.values(state.shortlist || {}).some((item) => item.name === name && (!isMapProfile() || item.profile === activeProfile));
  }

  function isStopVisited(stop) {
    return Boolean(state.visitedStops?.[stopKey(stop)]);
  }

  function attractionForName(name) {
    return allAttractions().find((item) => item.name === name || item.title === name);
  }

  function makeId(prefix = "item") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function nearestAttractions(point = state.lastPosition, limit = 8) {
    if (!point) return allAttractions().slice(0, limit);
    return allAttractions()
      .map((item) => ({ ...item, distance: haversineMiles(point, item) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  function activeDestination() {
    return getActiveTripTarget();
  }

  function activeOrigin() {
    const day = selectedDayDate();
    if (state.phase === "return" || day === "2026-08-08") return data.route.coordinates.islandApprox;
    if (day === "2026-08-01" && state.phase !== "island") return data.route.coordinates.merrillville;
    return data.route.coordinates.start;
  }

  function routeResultKey(target = getActiveTripTarget()) {
    return stopKey(target);
  }

  function plannedRouteResult(target = getActiveTripTarget()) {
    const miles = Number(target.plannedMiles || 0);
    const hours = Number(target.plannedHours || (miles ? miles / 65 : 0));
    return {
      distanceMeters: miles * 1609.344,
      durationSeconds: hours * 3600,
      trafficDurationSeconds: null,
      coordinates: [],
      calculatedAt: Date.now(),
      source: "planned",
      isLive: false,
      isFallback: true
    };
  }

  async function getActiveRoute({ origin, destination, waypoints = [], travelMode = "driving", force = false } = {}) {
    const target = destination || getActiveTripTarget();
    const from = origin || state.lastPosition || activeOrigin();
    const key = routeResultKey(target);
    const cached = liveRouteResults[key];
    if (!force && cached && Date.now() - Number(cached.calculatedAt || 0) < 5 * 60 * 1000) return cached;
    if (!navigator.onLine || document.visibilityState === "hidden") return cached || plannedRouteResult(target);
    const points = [from, ...waypoints, target].map((point) => `${Number(point.lon).toFixed(6)},${Number(point.lat).toFixed(6)}`).join(";");
    try {
      const response = await fetch(`https://router.project-osrm.org/route/v1/${travelMode}/${points}?overview=full&geometries=geojson&steps=false`);
      if (!response.ok) throw new Error("route unavailable");
      const payload = await response.json();
      const route = payload.routes?.[0];
      if (!route) throw new Error("route missing");
      const milesFor65 = route.distance / 1609.344;
      const normalized = {
        distanceMeters: route.distance,
        durationSeconds: (milesFor65 / 65) * 3600,
        trafficDurationSeconds: null,
        encodedPolyline: null,
        coordinates: route.geometry?.coordinates || [],
        calculatedAt: Date.now(),
        source: "OSRM road route",
        isLive: Boolean(state.lastPosition),
        isFallback: false,
        destination: { lat: target.lat, lon: target.lon, label: target.label }
      };
      lastRouteOrigin = { lat: from.lat, lon: from.lon };
      liveRouteResults[key] = normalized;
      state.initialLegDistanceMeters ||= normalized.distanceMeters;
      saveState();
      return normalized;
    } catch {
      if (cached) return { ...cached, isLive: false, source: "cached road route" };
      return plannedRouteResult(target);
    }
  }

  function currentRouteResult() {
    return liveRouteResults[routeResultKey()] || plannedRouteResult();
  }

  function routeShouldRefresh(point) {
    const route = liveRouteResults[routeResultKey()];
    if (!route || Date.now() - Number(route.calculatedAt || 0) > 5 * 60 * 1000) return true;
    return lastRouteOrigin && point && haversineMiles(lastRouteOrigin, point) >= 3;
  }

  function currentTripLegId() {
    const day = selectedDayDate();
    if (state.phase === "return" || day === "2026-08-08" || state.tripLeg === "return") return "return";
    if (state.phase === "island" || state.phase === "complete") return "island";
    if (day === "2026-08-01" || state.tripLeg === "day2") return "day2";
    return "day1";
  }

  function dropPassedWaypoints(waypoints) {
    const point = state.lastPosition;
    if (!point || !waypoints.length) return waypoints;
    const target = getActiveTripTarget();
    const distToTarget = haversineMiles(point, { lat: target.lat, lon: target.lon });
    return waypoints.filter((wp) => {
      const distToWaypoint = haversineMiles(point, wp);
      // If we're already closer to the destination than to this waypoint, we've passed it —
      // routing through it now would mean backtracking, so drop it.
      return distToWaypoint <= distToTarget + 15; // small buffer so we don't drop a waypoint just ahead
    });
  }

  function activeLegWaypoints() {
    const day = selectedDayDate();
    const stops = data.route.coordinates;
    let waypoints;
    if (state.phase === "return" || day === "2026-08-08" || state.tripLeg === "return") {
      waypoints = [{ lat: stops.merrillville.lat, lon: stops.merrillville.lon }];
    } else if (state.phase === "island" || state.phase === "complete") {
      waypoints = [];
    } else if (day === "2026-08-01" || state.tripLeg === "day2") {
      if (state.includeIndianaDunes && !state.completedStops["indiana-dunes"]) {
        waypoints = [];
      } else {
        waypoints = [
          { lat: stops.grandRapids.lat, lon: stops.grandRapids.lon },
          { lat: stops.grayling.lat, lon: stops.grayling.lon }
        ];
      }
    } else {
      waypoints = [
        { lat: stops.columbia.lat, lon: stops.columbia.lon },
        { lat: stops.stLouis.lat, lon: stops.stLouis.lon }
      ];
    }
    return dropPassedWaypoints(waypoints);
  }

  function refreshActiveRoute(force = false) {
    if (document.visibilityState === "hidden") return Promise.resolve(currentRouteResult());
    const waypoints = activeLegWaypoints();
    return getActiveRoute({ force, waypoints }).then((route) => {
      if (route.distanceMeters) state.gpsMilesToActiveDestination = route.distanceMeters / 1609.344;
      if (state.initialLegDistanceMeters && route.distanceMeters) {
        const progress = clamp(1 - route.distanceMeters / state.initialLegDistanceMeters, 0, 1) * 100;
        if (state.phase === "return") state.returnProgress = progress;
        else if (state.phase === "outbound") state.progress = progress;
      }
      saveState();
      const routeSource = homeMap?.getSource?.("elsie-active-route");
      if (routeSource && route.coordinates?.length > 1) routeSource.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route.coordinates } });
      renderElsieRouteTracker();
      refreshElsieEtaPill();
      return route;
    });
  }

  function destinationTimeZone(target = getActiveTripTarget()) {
    if (target === data.route.destinationTargets.cheboygan || target === data.route.destinationTargets.island) return "America/Detroit";
    return "America/Chicago";
  }

  function routeArrivalText(route = currentRouteResult(), target = getActiveTripTarget()) {
    if (!route?.durationSeconds) return "Arrival unavailable";
    const arrival = new Date(Date.now() + route.durationSeconds * 1000);
    const zone = destinationTimeZone(target);
    const time = new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit", timeZone: zone }).format(arrival);
    return `Arrival about ${time} ${zone === "America/Detroit" ? "ET" : "CT"}`;
  }

  function googleMapsNavigationUrl(stop = getActiveTripTarget()) {
    const params = new URLSearchParams({ api: "1", destination: `${stop.lat},${stop.lon}`, travelmode: "driving" });
    if (stop === data.route.destinationTargets.cheboygan && state.includeIndianaDunes && !state.completedStops["indiana-dunes"]) {
      const dunes = data.route.destinationTargets.indianaDunes;
      params.set("waypoints", `${dunes.lat},${dunes.lon}`);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  function getActiveTripTarget() {
    const day = selectedDayDate();
    if (state.phase === "return" || day === "2026-08-08" || state.tripLeg === "return") return data.route.destinationTargets.home;
    if (state.phase === "island" || state.phase === "complete") return data.route.destinationTargets.island;
    if (day === "2026-08-01" || state.tripLeg === "day2") {
      if (state.includeIndianaDunes && !state.completedStops["indiana-dunes"]) return data.route.destinationTargets.indianaDunes;
      return data.route.destinationTargets.cheboygan;
    }
    return data.route.destinationTargets.merrillville;
  }

  function isTravelDay(date = selectedDayDate()) {
    return ["2026-07-31", "2026-08-01", "2026-08-08"].includes(date);
  }

  function isFerryRelevant() {
    const day = selectedDayDate();
    return day === "2026-08-01" || state.phase === "island" || state.phase === "return";
  }

  function progressForPhase() {
    if (state.phase === "outbound") return clamp(state.progress || 0, 0, 100);
    if (state.phase === "return") return clamp(state.returnProgress || 0, 0, 100);
    if (state.phase === "island" || state.phase === "complete") return 100;
    return 0;
  }

  function milesLeft() {
    if (state.gpsMilesToActiveDestination && state.phase !== "pretrip" && state.phase !== "complete") {
      return Math.round(state.gpsMilesToActiveDestination);
    }
    if (state.phase === "island" || state.phase === "complete") return 0;
    const destination = activeDestination();
    const total = state.phase === "return" ? data.route.totalReturnMiles : (destination.plannedMiles || data.route.totalOutboundMiles);
    return Math.round(total * (1 - progressForPhase() / 100));
  }

  function routeProgressMiles() {
    const destination = activeDestination();
    const progress = progressForPhase() / 100;
    if (state.phase === "return") return Math.round(data.route.totalReturnMiles * progress);
    if (selectedDayDate() === "2026-07-31") return Math.round((destination.plannedMiles || 585) * progress);
    if (selectedDayDate() === "2026-08-01") return Math.round(585 + (destination.plannedMiles || 460) * progress);
    return Math.round(data.route.totalOutboundMiles * progress);
  }

  function weatherCodeText(code) {
    const map = {
      0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy", 45: "Fog", 48: "Fog",
      51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain",
      65: "Heavy rain", 71: "Snow", 80: "Showers", 95: "Thunderstorm"
    };
    return map[code] || "Weather changing";
  }

  function weatherFlags(weather) {
    if (!weather || !weather.current) return ["Needs verification"];
    const current = weather.current;
    const daily = weather.daily || {};
    const flags = [];
    const rain = Number(current.precipitation_probability ?? weather.hourly?.precipitation_probability?.[0] ?? 0);
    const gust = Number(current.wind_gusts_10m || daily.wind_gusts_10m_max?.[0] || 0);
    const temp = Number(current.temperature_2m || 0);
    const cloud = Number(current.cloud_cover ?? weather.hourly?.cloud_cover?.[0] ?? 0);
    if (rain >= 45) flags.push("Rain likely");
    if (gust >= 25) flags.push("Windy ferry concern");
    if (cloud >= 65) flags.push("Stargazing risk");
    if (temp <= 58) flags.push("Layer needed");
    if (temp >= 86) flags.push("Heat note");
    if (!flags.length) flags.push("Outdoor window");
    return flags;
  }

  function weatherSummaryFor(profile, weather, locationName) {
    const flags = weatherFlags(weather);
    const current = weather?.current;
    const rainChance = current ? Number(current.precipitation_probability ?? weather.hourly?.precipitation_probability?.[0] ?? 0) : 0;
    const humidity = current ? Number(current.relative_humidity_2m ?? weather.hourly?.relative_humidity_2m?.[0] ?? 0) : 0;
    const base = current ? `${locationName}: ${Math.round(current.temperature_2m)} F, ${weatherCodeText(current.weather_code)}, wind ${Math.round(current.wind_speed_10m || 0)} mph, gusts ${Math.round(current.wind_gusts_10m || 0)} mph, humidity ${humidity}%, rain chance ${rainChance}%.` : `${locationName}: weather is not available yet.`;
    const flagText = flags.join(", ");
    const copy = {
      elsie: `Sky and animal watch: ${base} Look for how clouds, wind, birds, and small animals change. ${flagText}.`,
      katrina: `Why it matters: ${base} Lake air and wind can change a plan faster than temperature alone. ${flagText}.`,
      emma: `Plan window: ${base} Use this to choose outside time, food, shopping, walking, or an indoor backup. ${flagText}.`,
      eliette: `Photo/detail weather: ${base} Keep paper, crafts, and small keepsakes dry if rain or wind shows up. ${flagText}.`,
      jules: `Captain weather: ${flags.includes("Rain likely") ? "rain plan" : "outside may work"}. ${flags.includes("Layer needed") ? "Jacket on." : "Stay with grownups."}`,
      momdad: `Logistics readout: ${base} Flags: ${flagText}. Verify ferry timing and backup plans before depending on this.`
    };
    return copy[profile.id] || copy.elsie;
  }

  function formatWeatherTime(value) {
    if (!value) return "--";
    return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatDaylight(seconds) {
    if (!Number.isFinite(Number(seconds))) return "--";
    const hours = Math.floor(Number(seconds) / 3600);
    const minutes = Math.round((Number(seconds) % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  function weatherMetricList(weather) {
    const current = weather?.current || {};
    const hourly = weather?.hourly || {};
    if (!weather?.current && !hourly?.time?.length) return [];
    const precipitation = Number(current.precipitation ?? hourly.precipitation?.[0] ?? 0);
    const rain = Number(current.rain ?? hourly.rain?.[0] ?? 0);
    const showers = Number(current.showers ?? hourly.showers?.[0] ?? 0);
    const cloud = Number(current.cloud_cover ?? hourly.cloud_cover?.[0] ?? 0);
    const humidity = Number(current.relative_humidity_2m ?? hourly.relative_humidity_2m?.[0] ?? 0);
    const cape = Number(hourly.cape?.[0] ?? 0);
    const cin = Number(hourly.convective_inhibition?.[0] ?? 0);
    return [
      ["Temp", `${Math.round(current.temperature_2m ?? hourly.temperature_2m?.[0] ?? 0)} F`],
      ["Humidity", `${humidity}%`],
      ["Precip", `${precipitation.toFixed(2)} in`],
      ["Rain", `${rain.toFixed(2)} in`],
      ["Showers", `${showers.toFixed(2)} in`],
      ["Clouds", `${cloud}%`],
      ["Wind", `${Math.round(current.wind_speed_10m ?? hourly.wind_speed_10m?.[0] ?? 0)} mph`],
      ["Gusts", `${Math.round(current.wind_gusts_10m ?? hourly.wind_gusts_10m?.[0] ?? 0)} mph`],
      ["CAPE", `${Math.round(cape)} J/kg`],
      ["CIN", `${Math.round(cin)} J/kg`]
    ];
  }

  function weatherSunList(weather) {
    const daily = weather?.daily || {};
    if (!daily.sunrise?.length && !daily.sunset?.length && !daily.daylight_duration?.length) return [];
    return [
      ["Sunrise", formatWeatherTime(daily.sunrise?.[0])],
      ["Sunset", formatWeatherTime(daily.sunset?.[0])],
      ["Daylight", formatDaylight(daily.daylight_duration?.[0])]
    ];
  }

  function renderHourlyWeather(weather) {
    const hourly = weather?.hourly;
    if (!hourly?.time?.length) return `<p class="map-caption">12-hour forecast will appear after refresh.</p>`;
    return `
      <div class="hourly-strip" aria-label="12 hour weather forecast">
        ${hourly.time.slice(0, 12).map((time, index) => `
          <div class="hourly-pill">
            <strong>${formatWeatherTime(time)}</strong>
            <span>${Math.round(hourly.temperature_2m?.[index] ?? 0)} F</span>
            <small>${hourly.precipitation_probability?.[index] ?? 0}% rain</small>
            <small>${Number(hourly.precipitation?.[index] ?? 0).toFixed(2)} in</small>
            <small>${Math.round(hourly.wind_speed_10m?.[index] ?? 0)} mph</small>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderWeatherMetrics(weather) {
    const metrics = weatherMetricList(weather);
    if (!metrics.length) return "";
    return `<div class="weather-metrics">${metrics.map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join("")}</div>`;
  }

  function renderSunMetrics(weather) {
    const metrics = weatherSunList(weather);
    if (!metrics.length) return "";
    return `<div class="weather-metrics sun-metrics">${metrics.map(([label, value]) => `<span><small>${label}</small><strong>${value}</strong></span>`).join("")}</div>`;
  }

  function weatherUrl(location) {
    const current = "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,showers,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m";
    const hourly = "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,showers,cloud_cover,wind_speed_10m,wind_gusts_10m,cape,convective_inhibition";
    const daily = "sunrise,sunset,daylight_duration";
    const params = new URLSearchParams({
      latitude: location.lat,
      longitude: location.lon,
      current,
      hourly,
      daily,
      forecast_hours: "12",
      models: "best_match",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      precipitation_unit: "inch",
      timezone: "America/Chicago"
    });
    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  }

  function weatherCacheFresh(cached, location) {
    if (!cached || Date.now() - cached.fetchedAt >= WEATHER_TTL) return false;
    if (location.id !== "gps" || !cached.location) return true;
    return haversineMiles(cached.location, location) < 2;
  }

  async function getWeather(location) {
    ensureCollections();
    const cached = state.weather[location.id];
    if (weatherCacheFresh(cached, location)) return { ...cached, sourceStatus: "Cached recent" };
    try {
      const response = await fetch(weatherUrl(location));
      if (!response.ok) throw new Error("Weather unavailable");
      const payload = await response.json();
      const next = { ...payload, location: { ...location }, fetchedAt: Date.now(), sourceStatus: "Live from Open-Meteo, imperial units" };
      state.weather[location.id] = next;
      saveState();
      return next;
    } catch {
      if (cached) return { ...cached, sourceStatus: "Cached fallback" };
      return { location, sourceStatus: "Not available" };
    }
  }

  async function refreshWeatherCards() {
    const container = byId("weatherBlocks");
    if (container) container.innerHTML = `<div class="loading-note">Refreshing Open-Meteo weather...</div>`;
    const locations = weatherLocationsForContext();
    const results = await Promise.all(locations.map(getWeather));
    renderWeatherBlocks(results);
    awardBadge("weather-watch");
    if (results.some((weather) => weatherFlags(weather).includes("Stargazing risk"))) awardBadge("cloud-cover-checker");
    saveState();
  }

  function weatherLocationsForContext() {
    const ids = state.phase === "pretrip" ? ["olathe", "southBend", "cheboygan", "boisBlanc"] :
      state.phase === "outbound" ? ["southBend", "cheboygan", "boisBlanc"] :
      state.phase === "return" ? ["cheboygan", "southBend", "olathe"] : ["boisBlanc", "cheboygan"];
    const live = state.lastPosition ? [{ id: "gps", name: "Current GPS location", lat: state.lastPosition.lat, lon: state.lastPosition.lon, role: "Live GPS" }] : [];
    return [...live, ...ids.map((id) => data.weatherLocations.find((location) => location.id === id)).filter(Boolean)];
  }

  function refreshGpsWeatherIfNeeded() {
    if (!state.lastPosition) return;
    const location = { id: "gps", name: "Current GPS location", lat: state.lastPosition.lat, lon: state.lastPosition.lon, role: "Live GPS" };
    if (weatherCacheFresh(state.weather?.gps, location)) return;
    getWeather(location).then(() => {
      const container = byId("weatherBlocks");
      if (container) renderWeatherBlocks(weatherLocationsForContext().map((item) => state.weather[item.id] || { location: item, sourceStatus: "Not available" }));
    });
  }

  function activeRouteUrl() {
    if (state.phase === "return" || selectedDayDate() === "2026-08-08") return data.mapLinks.returnUrl;
    if (selectedDayDate() === "2026-07-31") return data.mapLinks.dayOneUrl;
    if (selectedDayDate() === "2026-08-01") return data.mapLinks.ferryDayUrl;
    return data.mapLinks.outboundUrl;
  }

  function sourceLinkForPlace(place) {
    if (place.source?.url) return place.source.url;
    if (place.sourceUrl) return place.sourceUrl;
    if (place.officialWebsiteUrl) return place.officialWebsiteUrl;
    if (place.learnMoreUrl) return place.learnMoreUrl;
    if (place.official_website) return place.official_website;
    if (place.learn_more) return place.learn_more;
    if (place.learnMore) return place.learnMore;
    const links = data.sourceLinks;
    const name = place.name || place.title || "";
    if (name.includes("Gateway")) return links.gatewayArch.url;
    if (name.includes("Notre")) return links.notreDame.url;
    if (name.includes("Studebaker")) return links.studebaker.url;
    if (name.includes("Dunes")) return links.indianaDunes.url;
    if (name.includes("Mackinac")) return links.mackinacBridge.url;
    if (name.includes("Plaunt")) return links.ferry.url;
    return links.boisBlanc.url;
  }

  function sourceLabelForPlace(place) {
    return place.source?.label || place.sourceLabel || "Learn More";
  }

  function fallbackImageForPlace(place) {
    const title = escapeHtml(place.name || "Trip stop");
    const subtitle = escapeHtml(place.place || "Route discovery");
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
        <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#1f4f3a"/><stop offset="1" stop-color="#f7efd9"/></linearGradient></defs>
        <rect width="900" height="520" fill="url(#g)"/>
        <circle cx="720" cy="120" r="70" fill="#f2c14e" opacity=".85"/>
        <path d="M 170 330 C 265 230 365 370 485 250" fill="none" stroke="#fffdf7" stroke-width="28" stroke-linecap="round"/>
        <rect x="46" y="348" width="808" height="118" rx="22" fill="rgba(255,253,247,.92)"/>
        <text x="78" y="397" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="#17211b">${title}</text>
        <text x="78" y="440" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#536159">${subtitle}</text>
      </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function routeVisualForPlace(place) {
    const imageUrl = place.image?.url || place.imageUrl || (typeof place.image === "string" ? place.image : "");
    if (imageUrl) return imageUrl;
    const name = place.name || place.title || "Trip stop";
    const title = name.replace(" / ", "\n").replace(" National Historical Park", "").replace(" Transportation", "");
    const subtitle = place.place || "Trip stop";
    const kind = name.includes("Notre") ? "campus" :
      name.includes("Studebaker") ? "vehicles" :
      name.includes("Dunes") ? "dunes" :
      name.includes("Mackinac") ? "bridge" :
      name.includes("Plaunt") ? "ferry" :
      name.includes("Gateway") ? "arch" : "history";
    const palette = {
      campus: ["#174a7c", "#f6d483", "M 190 330 L 300 210 L 410 330 Z M 245 330 V 250 H 355 V 330"],
      vehicles: ["#284f3b", "#e9b44c", "M 160 315 H 440 L 405 250 H 235 Z M 210 330 a 28 28 0 1 0 1 0 M 390 330 a 28 28 0 1 0 1 0"],
      dunes: ["#2b6f7f", "#f3d28a", "M 0 335 C 120 260 235 355 360 290 S 520 285 600 225 V 420 H 0 Z"],
      bridge: ["#1f4f3a", "#8bc0d6", "M 85 330 H 515 M 160 330 V 180 M 440 330 V 180 M 160 190 C 255 250 345 250 440 190"],
      ferry: ["#205f86", "#f4f0df", "M 135 300 H 465 L 430 350 H 170 Z M 190 265 H 380 V 300 H 190 Z"],
      arch: ["#244d66", "#d7dde3", "M 185 340 C 210 125 390 125 415 340 M 225 340 C 250 205 350 205 375 340"],
      history: ["#5b4aa0", "#f4d7a1", "M 190 170 H 410 V 340 H 190 Z M 230 220 H 370 M 230 260 H 370 M 230 300 H 335"]
    }[kind];
    const [bg, accent, path] = palette;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
        <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="#f9f5e8"/></linearGradient></defs>
        <rect width="900" height="520" fill="url(#g)"/>
        <circle cx="720" cy="120" r="70" fill="${accent}" opacity=".85"/>
        <path d="${path}" fill="none" stroke="#fffdf7" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="46" y="348" width="808" height="118" rx="22" fill="rgba(255,253,247,.9)"/>
        <text x="78" y="397" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="#17211b">${escapeHtml(title)}</text>
        <text x="78" y="440" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#536159">${escapeHtml(subtitle)}</text>
      </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function badgeOwner(profileId = activeProfile) {
    return profileId || "elsie";
  }

  function badgeStore(profileId = activeProfile) {
    ensureCollections();
    state.badges[badgeOwner(profileId)] ||= {};
    return state.badges[badgeOwner(profileId)];
  }

  function canEarnBadge(badge, profileId = activeProfile) {
    return badge.profiles.includes("all") || badge.profiles.includes(profileId);
  }

  function awardBadge(badgeId, context = {}) {
    const badge = data.badgeCatalog.find((item) => item.id === badgeId);
    if (!badge || !canEarnBadge(badge)) return false;
    const store = badgeStore();
    if (store[badgeId]) return false;
    store[badgeId] = { id: badgeId, earnedAt: new Date().toISOString(), context };
    return true;
  }

  function awardByTrigger(trigger, context = {}) {
    data.badgeCatalog
      .filter((badge) => badge.trigger === trigger && canEarnBadge(badge))
      .slice(0, trigger === "manual" ? 0 : 6)
      .forEach((badge) => awardBadge(badge.id, context));
  }

  function badgesForProfile(profileId = activeProfile) {
    const store = badgeStore(profileId);
    return Object.values(store)
      .map((earned) => ({ ...data.badgeCatalog.find((badge) => badge.id === earned.id), ...earned }))
      .filter((badge) => badge.id)
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
  }

  function upcomingBadges(profileId = activeProfile, limit = 6) {
    const earned = new Set(badgesForProfile(profileId).map((badge) => badge.id));
    return data.badgeCatalog.filter((badge) => canEarnBadge(badge, profileId) && !earned.has(badge.id)).slice(0, limit);
  }

  function renderBadgeShelf(profileId = activeProfile) {
    const earned = badgesForProfile(profileId).slice(0, 6);
    const upcoming = upcomingBadges(profileId, Math.max(0, 6 - earned.length));
    const badges = [...earned, ...upcoming.map((badge) => ({ ...badge, locked: badge.locked, upcoming: true }))];
    return `
      <div class="badge-shelf" aria-label="Badges">
        ${badges.map((badge) => `
          <button type="button" class="badge-pill ${badge.upcoming ? "is-locked" : "is-earned"}" data-badge="${badge.id}" aria-label="${badge.upcoming ? "Upcoming badge" : "Earned badge"}: ${badge.title}">
            <i aria-hidden="true">${badge.upcoming ? "○" : "●"}</i>
            <span>${badge.title}</span>
            <small>${badge.upcoming ? "Upcoming" : badge.category}</small>
          </button>
        `).join("")}
      </div>
    `;
  }

  const adventureBadges = [
    ["mitten-state", "Mitten State", "Trace the trip from the palm to the tip of Michigan.", "state|michigan|welcome|visitor center", 3, "#f2c14e", "mitten"],
    ["great-lakes", "Great Lakes", "Spot stories connected to Michigan, Huron, or the Straits.", "lake|shore|harbor|maritime|straits", 3, "#1f78a4", "waves"],
    ["mackinac-bridge", "Mackinac Bridge", "Find the bridge and Straits stories that connect the peninsulas.", "mackinac bridge|straits of mackinac|bridge", 1, "#244d66", "bridge"],
    ["lighthouse-explorer", "Lighthouse Explorer", "Save or visit lighthouse stops along the water.", "lighthouse|light station", 2, "#205f86", "lighthouse"],
    ["ferry-rider", "Ferry Rider", "Track the ferry pieces of the island arrival.", "ferry|plaunt|boat|dock", 1, "#163f33", "ferry"],
    ["sand-dune-explorer", "Sand Dune Explorer", "Catch a dunes stop or shoreline sand story.", "dune|sand", 1, "#d6a84f", "dune"],
    ["waterfall-hunter", "Waterfall Hunter", "Find a falls or rushing-water stop.", "waterfall|falls|river", 1, "#2b8da8", "falls"],
    ["white-pine", "White Pine", "Notice Michigan forest and nature stops.", "pine|forest|nature|woods|trail", 2, "#2f7d5f", "pine"],
    ["cider-donuts", "Cider & Donuts", "Save a Michigan treat, market, or farm stop.", "cider|donut|farm|market|orchard", 1, "#bd5a36", "donut"],
    ["fudge-finder", "Fudge Finder", "Find a fudge or sweets stop near the island route.", "fudge|candy|sweet|ice cream", 1, "#7c4f3a", "fudge"],
    ["food-stop", "Food Stop", "Save real food stops on the route.", "food|restaurant|diner|cafe|market|grill", 2, "#c65c35", "food"],
    ["museum-explorer", "Museum Explorer", "Open, save, or visit museum stops.", "museum|library|hall of fame", 3, "#174a7c", "museum"],
    ["roadside-oddity", "Roadside Oddity", "Find something weird, giant, tiny, or unexpected.", "oddity|big things|world's largest|quirky|unusual", 1, "#8c5bb0", "spark"],
    ["state-capitol", "State Capitol", "Connect the route to a capitol or government story.", "capitol|statehouse|government", 1, "#5b4aa0", "capitol"],
    ["sports-fan", "Sports Fan", "Find a sports, stadium, racing, or hall-of-fame stop.", "sports|baseball|football|basketball|speedway|stadium|hall of fame", 2, "#cb7a2d", "ball"],
    ["island-explorer", "Island Explorer", "Save or visit Bois Blanc island discoveries.", "bois blanc|island|pointe aux pins", 3, "#2f7d5f", "island"],
    ["dark-sky-observer", "Dark Sky Observer", "Use the sky and stargazing layer during the trip.", "dark sky|stars|observatory|night sky|astronomy", 1, "#26385f", "stars"],
    ["nature-explorer", "Nature Explorer", "Collect parks, preserves, trails, and outdoor stops.", "park|nature|trail|preserve|wildlife|garden", 4, "#4d8b52", "leaf"],
    ["historic-fort", "Historic Fort", "Find forts, old buildings, and historic sites.", "fort|historic|history|heritage", 2, "#7c5d3a", "fort"],
    ["photo-memory", "Photo Memory", "Capture a trip photo and save it to the journal.", "photo|camera|scenic|view|lookout", 1, "#1f78a4", "camera"]
  ].map(([id, title, description, match, required, color, icon]) => ({ id, title, description, match, required, color, icon }));

  function visibleAdventureBadges() {
    if (!isMapProfile()) return adventureBadges;
    if (activeProfile === "momdad") return adventureBadges;
    if (activeProfile === "katrina") {
      const katrinaSet = {
        "historic-fort": ["Story Hunter", "Save 3 places with a story worth retelling.", 3],
        "state-capitol": ["Capitol Story", "Connect the route to a capitol or government story.", 1],
        "mackinac-bridge": ["Bridge Crossing", "Find the bridge and Straits stories that connect the peninsulas.", 1],
        "museum-explorer": ["Fact Collector", "Open, save, or visit museum stops.", 3],
        "mitten-state": ["Route Reader", "Trace the trip from the palm to the tip of Michigan.", 3],
        "lighthouse-explorer": ["Lighthouse Files", "Visit or save 3 lighthouse locations.", 2],
        "great-lakes": ["Lake Effect", "Explore 3 Great Lakes locations.", 3],
        "dark-sky-observer": ["Night Signal", "Use the sky and stargazing layer during the trip.", 1],
        "photo-memory": ["Snapshot Hunter", "Capture a trip photo and save it to the journal.", 1],
        "roadside-oddity": ["Quirky Find", "Find 3 genuinely unusual stops with a good story.", 3],
        "island-explorer": ["Island Arrival", "Reach Bois Blanc Island.", 1],
        "sand-dune-explorer": ["Dunes Discovered", "Visit Indiana Dunes.", 1],
        "waterfall-hunter": ["Falls Finder", "Find a falls or rushing-water stop.", 1],
        "nature-explorer": ["Wild Places", "Collect parks, preserves, trails, and wildlife stops.", 4]
      };
      return adventureBadges.filter((badge) => katrinaSet[badge.id]).map((badge) => {
        const [title, description, required] = katrinaSet[badge.id];
        return { ...badge, title, description, required };
      });
    }
    if (activeProfile === "emma") {
      const emmaSet = {
        "great-lakes": ["Lake Effect", "Explore 3 Great Lakes locations.", 3],
        "sand-dune-explorer": ["Dunes Discovered", "Visit Indiana Dunes.", 1],
        "island-explorer": ["Island Arrival", "Reach Bois Blanc Island.", 1],
        "mitten-state": ["Route Reader", "Trace the trip from the palm to the tip of Michigan.", 3],
        "lighthouse-explorer": ["Lighthouse Files", "Visit or save 3 lighthouse locations.", 2],
        "museum-explorer": ["Try-It Tracker", "Open, save, or visit hands-on stops.", 3],
        "state-capitol": ["Capitol Story", "Connect the route to a capitol or government story.", 1],
        "mackinac-bridge": ["Bridge Crossing", "Find the bridge and Straits stories that connect the peninsulas.", 1],
        "photo-memory": ["Snapshot Hunter", "Capture a trip photo and save it to the journal.", 1],
        "roadside-oddity": ["Real-Life Finds", "Find 3 stops that show how people actually live here.", 3],
        "waterfall-hunter": ["Falls Finder", "Find a falls or rushing-water stop.", 1],
        "nature-explorer": ["Wild Places", "Collect parks, preserves, trails, and wildlife stops.", 4],
        "dark-sky-observer": ["Night Signal", "Use the sky and stargazing layer during the trip.", 1],
        "historic-fort": ["Story Hunter", "Save 3 places with a story worth retelling.", 3]
      };
      return adventureBadges.filter((badge) => emmaSet[badge.id]).map((badge) => {
        const [title, description, required] = emmaSet[badge.id];
        return { ...badge, title, description, required };
      });
    }
    if (activeProfile === "jules") {
      const julesSet = {
        "great-lakes": ["Big Water", "See 3 Great Lakes places.", 3],
        "sand-dune-explorer": ["Sand Mountain", "Visit Indiana Dunes.", 1],
        "island-explorer": ["Island Hero", "Reach Bois Blanc Island.", 1],
        "mackinac-bridge": ["Mega Bridge", "Cross or spot the Mackinac Bridge.", 1],
        "lighthouse-explorer": ["Light Tower", "Spot lighthouses.", 2],
        "photo-memory": ["Photo Mission", "Take a trip photo.", 1],
        "nature-explorer": ["Animal Tracker", "Collect parks and animal stops.", 3],
        "museum-explorer": ["Machine Master", "Visit machine and museum stops.", 3],
        "roadside-oddity": ["Super Spotter", "Find 3 weird and wonderful stops.", 3],
        "dark-sky-observer": ["Star Captain", "Look at the night sky.", 1]
      };
      return adventureBadges.filter((badge) => julesSet[badge.id]).map((badge) => {
        const [title, description, required] = julesSet[badge.id];
        return { ...badge, title, description, required };
      });
    }
    if (activeProfile === "eliette") {
      const elietteSet = {
        "roadside-oddity": ["Tiny Treasure Hunter", "Find 3 stops with a small detail worth remembering.", 3],
        "museum-explorer": ["Detail Detective", "Open, save, or visit museum and story stops.", 3],
        "great-lakes": ["Lake Effect", "Explore 3 Great Lakes locations.", 3],
        "lighthouse-explorer": ["Lighthouse Files", "Visit or save lighthouse locations.", 2],
        "sand-dune-explorer": ["Dunes Discovered", "Visit Indiana Dunes.", 1],
        "island-explorer": ["Island Arrival", "Reach Bois Blanc Island.", 1],
        "mitten-state": ["Route Reader", "Trace the trip from the palm to the tip of Michigan.", 3],
        "photo-memory": ["Snapshot Hunter", "Capture a trip photo and save it to the journal.", 1],
        "nature-explorer": ["Pretty & Wild", "Collect parks, gardens, trails, and wildlife stops.", 4],
        "waterfall-hunter": ["Falls Finder", "Find a falls or rushing-water stop.", 1],
        "historic-fort": ["Story Keeper", "Save 3 places with a story worth retelling.", 3],
        "dark-sky-observer": ["Night Signal", "Use the sky and stargazing layer during the trip.", 1],
        "mackinac-bridge": ["Bridge Crossing", "Find the bridge and Straits stories that connect the peninsulas.", 1],
        "state-capitol": ["Capitol Story", "Connect the route to a capitol or government story.", 1]
      };
      return adventureBadges.filter((badge) => elietteSet[badge.id]).map((badge) => {
        const [title, description, required] = elietteSet[badge.id];
        return { ...badge, title, description, required };
      });
    }
    const mature = {
      "roadside-oddity": ["Oddity Collector", "Find 3 genuinely unusual stops.", 3],
      "historic-fort": ["Story Hunter", "Save 3 places with a story worth retelling.", 3],
      "great-lakes": ["Lake Effect", "Explore 3 Great Lakes locations.", 3],
      "lighthouse-explorer": ["Lighthouse Files", "Visit or save 3 lighthouse locations.", 3],
      "sand-dune-explorer": ["Dunes Discovered", "Visit Indiana Dunes.", 1],
      "island-explorer": ["Island Arrival", "Reach Bois Blanc Island.", 1],
      "mitten-state": ["Route Reader", "Trace the trip from the palm to the tip of Michigan.", 3],
      "dark-sky-observer": ["Night Signal", "Use the sky and stargazing layer during the trip.", 1],
      "museum-explorer": ["Science Detour", "Open, save, or visit museum and science stops.", 3],
      "mackinac-bridge": ["Bridge Crossing", "Find the bridge and Straits stories that connect the peninsulas.", 1],
      "waterfall-hunter": ["Falls Finder", "Find a falls or rushing-water stop.", 1],
      "nature-explorer": ["Wild Places", "Collect parks, preserves, trails, and wildlife stops.", 4],
      "state-capitol": ["Capitol Story", "Connect the route to a capitol or government story.", 1],
      "photo-memory": ["Snapshot Hunter", "Capture a trip photo and save it to the journal.", 1]
    };
    return adventureBadges.filter((badge) => mature[badge.id]).map((badge) => {
      const [title, description, required] = mature[badge.id];
      return { ...badge, title, description, required };
    });
  }

  function relatedStopsForAdventureBadge(badge, limit = 12) {
    const pattern = new RegExp(badge.match, "i");
    return allAttractions().filter((item) => pattern.test(`${item.title} ${item.category} ${item.routeSegment} ${item.summary} ${item.why}`)).slice(0, limit);
  }

  function adventureBadgeProgress(badge) {
    const related = relatedStopsForAdventureBadge(badge, 999);
    const relatedKeys = new Set(related.map(stopKey));
    const saved = Object.values(state.shortlist || {}).filter((item) => (!isMapProfile() || item.profile === activeProfile) && related.some((stop) => stop.title === item.name || stop.name === item.name)).length;
    const visited = Object.entries(state.visitedStops || {}).filter(([key, item]) => relatedKeys.has(key) && (!isMapProfile() || item.profile === activeProfile)).length;
    const photoCount = badge.id === "photo-memory" ? (state.journal || []).length + (state.captures || []).length : 0;
    const count = Math.max(saved, visited, photoCount);
    const value = clamp(count, 0, badge.required);
    return { value, total: badge.required, pct: Math.round((value / badge.required) * 100), earned: value >= badge.required, related };
  }

  function badgeDoodleSvg(badge, progress) {
    const color = badge.color || "#1f78a4";
    const fill = progress.earned ? color : "#fffdf7";
    const ink = progress.earned ? "#fffdf7" : color;
    const shape = {
      mitten: "M30 58 C20 47 18 28 31 18 C42 9 52 18 52 31 L52 14 C52 8 62 8 63 15 L67 48 C68 62 42 70 30 58 Z",
      waves: "M13 43 C24 32 36 54 47 43 S70 54 81 43 M13 58 C24 47 36 69 47 58 S70 69 81 58",
      bridge: "M11 61 H85 M20 61 V31 M76 61 V31 M20 34 C36 48 60 48 76 34",
      lighthouse: "M35 76 H61 L55 20 H41 Z M38 20 H58 L54 10 H42 Z M33 76 H63",
      ferry: "M17 51 H79 L70 68 H26 Z M30 37 H62 V51 H30 Z",
      dune: "M12 63 C28 38 47 67 62 46 C70 36 78 35 86 39 V72 H12 Z",
      falls: "M24 19 H73 V39 C65 43 62 49 62 62 C52 52 43 50 35 63 C34 48 30 40 24 36 Z",
      pine: "M48 12 L25 43 H38 L20 64 H42 V78 H54 V64 H76 L58 43 H71 Z",
      donut: "M48 20 A28 28 0 1 1 47 20 M48 37 A11 11 0 1 0 49 37",
      fudge: "M21 46 L33 28 H75 L64 68 H24 Z",
      food: "M34 18 V72 M27 18 V35 M41 18 V35 M63 18 C76 28 72 46 62 49 V72",
      museum: "M16 32 L48 13 L80 32 Z M23 37 H73 M28 37 V72 M43 37 V72 M58 37 V72 M19 72 H77",
      spark: "M48 11 L55 37 L82 42 L58 56 L63 83 L48 61 L31 83 L37 56 L14 42 L41 37 Z",
      capitol: "M21 75 H75 M27 70 V42 H69 V70 M34 42 C37 25 59 25 62 42 M39 24 H57 M48 14 V24",
      ball: "M48 17 A31 31 0 1 1 47 17 M22 48 C35 40 61 40 74 48 M48 17 C38 31 38 65 48 79 M48 17 C58 31 58 65 48 79",
      island: "M15 62 C30 45 47 56 58 42 C69 30 80 43 85 62 Z M34 42 C37 27 51 24 60 18 M49 38 C52 30 54 22 53 13",
      stars: "M28 30 L33 43 L47 47 L34 53 L29 66 L23 53 L10 48 L24 43 Z M66 16 L70 27 L82 31 L71 37 L67 48 L61 37 L50 32 L62 27 Z",
      leaf: "M20 61 C22 28 53 18 78 18 C78 46 60 72 28 72 M28 72 C42 54 54 45 78 18",
      fort: "M19 75 V28 H31 V18 H43 V28 H55 V18 H67 V28 H79 V75 Z M39 75 V54 H59 V75",
      camera: "M20 34 H35 L40 25 H58 L63 34 H78 V72 H20 Z M49 43 A12 12 0 1 1 48 43"
    }[badge.icon] || "M18 48 A30 30 0 1 1 17 48";
    return `
      <svg class="badge-doodle-svg" viewBox="0 0 96 96" aria-hidden="true">
        <rect x="8" y="8" width="80" height="80" rx="22" fill="${fill}" stroke="${color}" stroke-width="4" stroke-dasharray="7 4"/>
        <path d="${shape}" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function renderTopBadgePreview() {
    const container = byId("topBadgePreview");
    if (!container) return;
    const badges = visibleAdventureBadges().map((badge) => ({ ...badge, progress: adventureBadgeProgress(badge) }));
    container.innerHTML = `
      <div class="adventure-badge-tray" aria-label="Trip badges">
        ${badges.map((badge) => `
          <button type="button" class="adventure-badge ${badge.progress.earned ? "is-earned" : "is-progress"}" data-adventure-badge="${badge.id}" title="${escapeHtml(`${badge.title}: ${badge.progress.value}/${badge.progress.total}. ${badge.description}`)}" aria-label="${escapeHtml(badge.title)} badge, ${badge.progress.value} of ${badge.progress.total}">
            ${badgeDoodleSvg(badge, badge.progress)}
            <span>${escapeHtml(badge.title)}</span>
            <small>${badge.progress.value}/${badge.progress.total}</small>
            <i style="width:${badge.progress.pct}%"></i>
          </button>
        `).join("")}
      </div>
    `;
  }

  function showAdventureBadgeDetail(badgeId) {
    const badge = visibleAdventureBadges().find((item) => item.id === badgeId) || adventureBadges.find((item) => item.id === badgeId);
    if (!badge) return;
    const progress = adventureBadgeProgress(badge);
    modalReturnFocus = document.activeElement;
    document.getElementById("badgeDetailOverlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "badgeDetailOverlay";
    overlay.className = "app-modal";
    overlay.innerHTML = `
      <div class="app-modal-card badge-detail-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(badge.title)}">
        <button type="button" class="modal-close" data-close-modal>Close</button>
        <div class="badge-detail-head">
          ${badgeDoodleSvg(badge, progress)}
          <div>
            <p class="eyebrow">${progress.earned ? "Earned" : "Badge progress"}</p>
            <h3>${escapeHtml(badge.title)}</h3>
            <p>${escapeHtml(badge.description)}</p>
          </div>
        </div>
        <div class="badge-progress-line"><span style="width:${progress.pct}%"></span></div>
        <p><strong>How to earn:</strong> Save or visit ${progress.total} related ${progress.total === 1 ? "stop" : "stops"}. Current progress: ${progress.value}/${progress.total}.</p>
        <div class="badge-related-list">
          ${progress.related.slice(0, 5).map((item) => `
            <article>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.category)} · ${escapeHtml(item.routeSegment || "Route")}</small>
              <div class="compact-actions">
                <button type="button" data-stop-detail="${escapeHtml(item.title)}">View</button>
                <button type="button" data-route-stop="${escapeHtml(item.title)}">Route</button>
                <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">Learn More</a>
              </div>
            </article>
          `).join("") || "<p>No matching route stops yet.</p>"}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    overlay.querySelector("button")?.focus();
  }

  function adventureBadgeHoverText(badgeId) {
    const badge = visibleAdventureBadges().find((item) => item.id === badgeId) || adventureBadges.find((item) => item.id === badgeId);
    if (!badge) return "";
    const progress = adventureBadgeProgress(badge);
    return `${badge.title}: ${progress.value}/${progress.total}. ${badge.description}`;
  }

  function closeBadgeModal() {
    document.getElementById("badgeDetailOverlay")?.remove();
    document.body.classList.remove("modal-open");
    if (modalReturnFocus?.focus) modalReturnFocus.focus();
    modalReturnFocus = null;
  }

  function showBadgeDetail(badgeId) {
    const badge = data.badgeCatalog.find((item) => item.id === badgeId);
    if (!badge) return;
    const earned = badgeStore()[badgeId];
    const profile = currentProfile();
    const includeProfile = profile.id === "momdad";
    document.getElementById("badgeDetailOverlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "badgeDetailOverlay";
    overlay.className = "app-modal";
    overlay.innerHTML = `
      <div class="app-modal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(badge.title)}">
        <button type="button" class="modal-close" data-close-modal>Close</button>
        <p class="eyebrow">${escapeHtml(badge.category || "Badge")}</p>
        <h3>${escapeHtml(badge.title)}</h3>
        <p>${escapeHtml(earned ? badge.earned : badge.locked)}</p>
        <p>${earned ? `Earned ${new Date(earned.earnedAt).toLocaleString()}.` : "Not earned yet. Complete the action or learn about the place to unlock it."}</p>
        ${includeProfile ? `<p><strong>Profile:</strong> ${escapeHtml(profile.name)}</p>` : ""}
        <div class="action-row">
          ${badge.sourceUrl ? `<a class="external-link" href="${badge.sourceUrl}" target="_blank" rel="noopener">Learn More</a>` : ""}
          <button type="button" data-close-modal>Done</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function saveShortlist(item) {
    ensureCollections();
    const key = `${activeProfile}:${item.name || item}:${selectedDayDate()}`;
    state.shortlist[key] = {
      name: item.name || item,
      category: item.category || "Trip item",
      profile: activeProfile,
      date: selectedDayDate(),
      sourceUrl: item.sourceUrl || "",
      addedAt: new Date().toISOString()
    };
    awardBadge("trip-shortlist-starter");
    saveState();
    updateHomeGpsLayer();
    const radar = byId("elsieRadar");
    if (radar && isMapProfile()) radar.outerHTML = renderElsieRadarMarkup();
    if (isMapProfile()) renderTopBadgePreview();
    renderBottomDrawer();
    if (["rewards", "memories"].includes(activePage)) renderProfile();
    setAction(`Saved to Trip Shortlist: ${item.name || item}.`);
  }

  function markStopVisited(name) {
    const stop = attractionForName(name);
    if (!stop) return;
    state.visitedStops[stopKey(stop)] = {
      name: stop.title || stop.name,
      category: stop.category,
      sourceUrl: sourceLinkForPlace(stop),
      visitedAt: new Date().toISOString(),
      profile: activeProfile,
      lat: stop.lat,
      lon: stop.lon
    };
    if (Number.isFinite(stop.lat) && Number.isFinite(stop.lon)) {
      addBreadcrumb({ lat: stop.lat, lon: stop.lon }, "stop-visited", null, `Visited ${stop.title || stop.name}`);
    }
    if (/indiana dunes/i.test(stop.title || stop.name)) {
      state.completedStops["indiana-dunes"] = true;
      state.initialLegDistanceMeters = null;
    }
    awardByTrigger("activity", { title: stop.title || stop.name });
    saveState();
    renderHomeMapPanel();
    renderBottomDrawer();
    if (["memories", "rewards"].includes(activePage)) renderProfile();
    setAction(`Marked visited: ${stop.title || stop.name}.`);
  }

  function removeShortlist(key) {
    delete state.shortlist[key];
    saveState();
    renderProfile();
    setAction("Removed from Trip Shortlist.");
  }

  function familyVote(itemName, choice) {
    const key = `${selectedDayDate()}:${itemName}`;
    state.votes[key] ||= {};
    state.votes[key][activeProfile] = { choice, at: new Date().toISOString() };
    awardBadge("family-vote-starter");
    if (activeProfile === "jules") awardBadge("captain-choice");
    saveState();
    if (activePage === "rewards") renderProfile();
    setAction(`Family Vote saved: ${choice}.`);
  }

  function approvePlan(name) {
    const key = `${selectedDayDate()}:${name}`;
    if (!state.approved.includes(key)) state.approved.push(key);
    awardBadge("plan-approved");
    awardBadge("logistics-captain");
    if (name.toLowerCase().includes("ferry")) awardBadge("ferry-ready");
    saveState();
    if (activePage === "rewards") renderProfile();
    setAction(`Approved into the real plan: ${name}.`);
  }

  function completeActivity(title) {
    const key = `${activeProfile}:${title}`;
    if (!state.completed.some((item) => item.activityKey === key)) {
      state.completed.push({ activityKey: key, activityTitle: title, profile: activeProfile, date: selectedDayDate(), at: new Date().toISOString() });
    }
    awardByTrigger("activity", { title });
    const lower = title.toLowerCase();
    if (lower.includes("animal") || lower.includes("wildlife") || lower.includes("gecko")) awardBadge(activeProfile === "jules" ? "big-machine-spotter" : "wildlife-watcher");
    if (lower.includes("fact") || lower.includes("history") || lower.includes("timeline")) awardBadge(activeProfile === "katrina" ? "hidden-fact-hunter" : "teacher-fact-builder");
    if (lower.includes("detail") || lower.includes("shiny") || lower.includes("treasure")) awardBadge("tiny-treasure-scout");
    if (lower.includes("daily") || lower.includes("life") || lower.includes("community")) awardBadge("real-life-explorer");
    saveState();
    if (["today", "learn", "rewards"].includes(activePage)) renderProfile();
    setAction(`Completed ${title}.`);
  }

  function deleteCapture(index) {
    state.captures.splice(index, 1);
    saveState();
    render();
  }

  function requestDeletePhoto(collection, id) {
    state.pendingDelete = { collection, id };
    saveState();
    renderProfile();
  }

  function cancelDeletePhoto() {
    state.pendingDelete = null;
    saveState();
    renderProfile();
  }

  function confirmDeletePhoto(collection, id) {
    if (collection === "draft") state.draftPhotos = state.draftPhotos.filter((item) => item.id !== id);
    if (collection === "journal") state.journal = state.journal.filter((item) => item.id !== id);
    if (collection === "capture") state.captures = state.captures.filter((item, index) => (item.id || String(index)) !== id);
    state.pendingDelete = null;
    saveState();
    render();
    setAction("Photo removed.");
  }

  function startCapture(label, analyze = false) {
    state.pendingCaptureLabel = label;
    state.pendingAnalyze = analyze;
    saveState();
    byId("captureInput").click();
  }

  async function analyzePhotoEntry(entry) {
    const response = await fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageDataUrl: entry.dataUrl,
        mimeType: entry.type,
        profile: currentProfile().name,
        tripContext: "Family road trip learning hub from Olathe, Kansas to South Bend, Cheboygan, and Bois Blanc Island."
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Image analysis unavailable");
    return payload;
  }

  function wireCaptureInput() {
    byId("captureInput").addEventListener("change", () => {
      const files = Array.from(byId("captureInput").files || []).slice(0, 3);
      if (!files.length) return;
      let remaining = files.length;
      files.forEach((file) => {
        if (file.size > 4500000) {
          state.actionMessage = "That file is too large for offline storage. Try a smaller photo or shorter clip.";
          remaining -= 1;
          if (!remaining) render();
          return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
          const entry = {
            id: makeId("photo"),
            profile: activeProfile,
            date: selectedDayDate(),
            label: state.pendingCaptureLabel || "Trip capture",
            name: file.name,
            type: file.type || "file",
            dataUrl: reader.result,
            gps: state.lastPosition ? { ...state.lastPosition } : null,
            nearest: nearestAttractions(state.lastPosition, 1)[0]?.title || "",
            at: new Date().toISOString(),
            notes: ""
          };
          if (state.pendingAnalyze && entry.type.startsWith("image/")) {
            entry.status = "Ready to analyze";
            entry.notes = "";
            state.draftPhotos.unshift(entry);
            state.actionMessage = "Photo ready. Tap Analyze, then Save.";
          } else {
            state.captures.push(entry);
            state.actionMessage = "Captured to the trip summary on this device.";
          }
          awardBadge("first-photo-captured");
          if (state.phase === "island") awardBadge("first-island-photo");
          if (activeProfile === "eliette") awardBadge("detail-collector");
          remaining -= 1;
          if (!remaining) {
            byId("captureInput").value = "";
            state.pendingAnalyze = false;
            saveState();
            render();
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function draftPhoto(index) {
    ensureCollections();
    return state.draftPhotos[index];
  }

  function analysisViewModel(analysis = {}, profile = currentProfile()) {
    return {
      what: analysis.likelySubject || analysis.whatItIs || analysis.summary || "Photo subject identified after analysis.",
      why: analysis.whyItMatters || analysis.childFriendlyFact || "This connects to the route, place, weather, nature, history, or family story.",
      trip: analysis.tripConnection || "Use this as a route memory and compare it with nearby attractions.",
      kids: analysis.forKids?.[profile.id] || analysis.forKids || analysis.childFriendlyFact || profile.prompts?.[0] || "What do you notice first?",
      fact: analysis.funFact || analysis.childFriendlyFact || "Small details make the best trip memories.",
      tags: Array.isArray(analysis.tags) ? analysis.tags : []
    };
  }

  async function analyzeDraftPhoto(index) {
    const entry = draftPhoto(index);
    if (!entry) return;
    entry.status = "Analyzing...";
    saveState();
    renderProfile();
    try {
      entry.analysis = await analyzePhotoEntry(entry);
      entry.status = "Analyzed";
      awardBadge("first-photo-captured");
      saveState();
      render();
      setAction("Photo analysis complete. Add notes or save to Trip Summary.");
    } catch (error) {
      entry.analysisError = error.message;
      entry.status = "Needs API setup";
      saveState();
      render();
      setAction(`Analysis did not finish: ${error.message}`);
    }
  }

  async function analyzeDraftPhotoById(id) {
    const index = state.draftPhotos.findIndex((item) => item.id === id);
    if (index >= 0) await analyzeDraftPhoto(index);
  }

  function saveDraftPhoto(index) {
    const entry = draftPhoto(index);
    if (!entry) return;
    entry.savedAt = new Date().toISOString();
    entry.status = "Saved";
    state.journal.unshift(entry);
    state.draftPhotos.splice(index, 1);
    awardBadge("first-photo-captured");
    if (state.phase === "island") awardBadge("first-island-photo");
    saveState();
    render();
    setAction("Saved to Trip Summary.");
  }

  function saveDraftPhotoById(id) {
    const index = state.draftPhotos.findIndex((item) => item.id === id);
    if (index >= 0) saveDraftPhoto(index);
  }

  function updateDraftNote(index, value) {
    const entry = draftPhoto(index);
    if (!entry) return;
    entry.notes = value;
    saveState();
  }

  function updateDraftNoteById(id, value) {
    const entry = state.draftPhotos.find((item) => item.id === id);
    if (!entry) return;
    entry.notes = value;
    saveState();
  }

  function updateJournalNote(index, value) {
    const entry = state.journal[index];
    if (!entry) return;
    entry.notes = value;
    saveState();
  }

  function updateJournalNoteById(id, value) {
    const entry = state.journal.find((item) => item.id === id);
    if (!entry) return;
    entry.notes = value;
    saveState();
  }

  function setAction(message) {
    state.actionMessage = message;
    saveState();
    renderTripStatus();
  }

  function setPhase(phase) {
    state.phase = phase;
    if (phase === "outbound") {
      state.startedAt = new Date().toISOString();
      awardBadge("launch-crew");
    }
    if (phase === "island") {
      state.progress = 100;
      awardBadge("island-arrival");
      awardBadge("ferry-crossing-crew");
    }
    if (phase === "return") {
      state.returnStartedAt = new Date().toISOString();
      awardBadge("homeward-bound");
      awardBadge("ferry-return-ready");
    }
    if (phase === "complete") {
      awardBadge("full-route-complete");
    }
    saveState();
    render();
  }

  function updateLiveMapPosition() {
    if (!homeMap || !state.lastPosition) return false;
    const feature = { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [state.lastPosition.lon, state.lastPosition.lat] } };
    const source = homeMap.getSource("current-location");
    if (source && source.setData) {
      source.setData(feature);
    } else if (homeMap.isStyleLoaded && homeMap.isStyleLoaded()) {
      try {
        homeMap.addSource("current-location", { type: "geojson", data: feature });
        if (activeProfile === "jules") {
          registerJulesGpsImage(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": julesGpsImageName(), "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.65, 9, 0.8, 12, 0.95], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "emma") {
          registerEmmaGpsAgent(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "emma-gps-agent", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 6, 0.28, 9, 0.34, 12, 0.4], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "momdad") {
          registerMomdadGpsPhoto(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "momdad-gps-photo", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 6, 0.28, 9, 0.34, 12, 0.4], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "elsie") {
          registerElsieGpsPhoto(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "elsie-gps-photo", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 6, 0.28, 9, 0.34, 12, 0.4], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "eliette") {
          registerElietteGpsImage(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "eliette-gps-jeep", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.19, 6, 0.26, 9, 0.32, 12, 0.38], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (FAMILY_LOCATOR_PROFILES.includes(activeProfile)) {
          registerFamilyGpsImage(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "family-gps-marker", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.16, 6, 0.22, 9, 0.28, 12, 0.33], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else {
          homeMap.addLayer({
            id: "current-location-dot",
            type: "circle",
            source: "current-location",
            paint: { "circle-color": "#c94f34", "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 6, 7, 9, 9, 12, 11], "circle-stroke-width": 4, "circle-stroke-color": "#fffdf7" }
          });
        }
      } catch { return false; }
    } else {
      return false;
    }
    syncBreadcrumbLayers(homeMap);
    return true;
  }

  function updatePosition(position) {
    const now = Date.now();
    if (now - lastGpsRender < 5000) return;
    lastGpsRender = now;
    const point = { lat: position.coords.latitude, lon: position.coords.longitude };
    const destination = activeDestination();
    const shouldRefreshRoute = routeShouldRefresh(point);
    state.lastPosition = { lat: point.lat, lon: point.lon, accuracy: position.coords.accuracy, updatedAt: new Date().toISOString() };
    state.gpsStatus = "Active";
    state.trackingStatus = `Active - ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    maybeRecordBreadcrumb(point, position.coords.accuracy);
    refreshElsieEtaPill();
    state.destinationStatus = `${destination.label} · ${position.coords.accuracy > 100 ? "GPS signal is weak" : "GPS active"}`;
    if (isMapProfile() && isHomeMapPage()) {
      // Surgical update: move the marker without rebuilding the map (fixes flashing)
      if (!updateLiveMapPosition()) renderHomeMapPanel();
    } else {
      renderHomeMapPanel();
    }
    renderRouteMapPanel();
    renderExploreMapPanel();
    offerNearbyBadges(point);
    saveState();
    renderTripStatus();
    if (!isMapProfile()) refreshGpsWeatherIfNeeded();
    if (shouldRefreshRoute) refreshActiveRoute();
  }

  function offerNearbyBadges(point) {
    const nearby = nearestAttractions(point, 1)[0];
    if (nearby && nearby.distance < 10) state.nearbyBadgeMessage = `Nearby learning stop: ${nearby.title || nearby.name}`;
  }

  function useLocation() {
    if (!navigator.geolocation) {
      state.gpsStatus = "Error";
      state.trackingStatus = "GPS unavailable";
      saveState();
      render();
      return;
    }
    if (watchId !== null) {
      setAction("Live trip tracking is already active.");
      return;
    }
    state.gpsStatus = "Requesting";
    state.trackingStatus = "Requesting permission";
    saveState();
    renderTripStatus();
    watchId = navigator.geolocation.watchPosition(updatePosition, () => {
      state.gpsStatus = "Error";
      state.trackingStatus = "Permission denied or unavailable";
      watchId = null;
      saveState();
      render();
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  }

  function stopLocation() {
    if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    state.gpsStatus = "Off";
    state.trackingStatus = "Off";
    saveState();
    render();
  }

  function routePlan() {
    const stops = data.route.coordinates;
    if (state.phase === "return" || selectedDayDate() === "2026-08-08") {
      return {
        origin: { label: "Cheboygan", location: { lat: stops.cheboygan.lat, lon: stops.cheboygan.lon } },
        destination: { label: "Olathe", location: { lat: stops.start.lat, lon: stops.start.lon } },
        waypoints: [
          { label: "Merrillville", location: { lat: stops.merrillville.lat, lon: stops.merrillville.lon } }
        ]
      };
    }
    if (selectedDayDate() === "2026-07-31") {
      return {
        origin: { label: "Olathe", location: { lat: stops.start.lat, lon: stops.start.lon } },
        destination: { label: "Merrillville Overnight", location: { lat: stops.merrillville.lat, lon: stops.merrillville.lon } },
        waypoints: [
          { label: "Columbia", location: { lat: stops.columbia.lat, lon: stops.columbia.lon } },
          { label: "St. Louis", location: { lat: stops.stLouis.lat, lon: stops.stLouis.lon } }
        ]
      };
    }
    if (selectedDayDate() === "2026-08-01") {
      return {
        origin: { label: "Merrillville Overnight", location: { lat: stops.merrillville.lat, lon: stops.merrillville.lon } },
        destination: { label: "Plaunt ferry", location: { lat: stops.cheboygan.lat, lon: stops.cheboygan.lon } },
        waypoints: [
          ...(state.includeIndianaDunes && !state.completedStops["indiana-dunes"] ? [{ label: "Indiana Dunes", location: { lat: stops.indianaDunes.lat, lon: stops.indianaDunes.lon } }] : []),
          { label: "Grand Rapids", location: { lat: stops.grandRapids.lat, lon: stops.grandRapids.lon } },
          { label: "Grayling", location: { lat: stops.grayling.lat, lon: stops.grayling.lon } }
        ]
      };
    }
    return {
      origin: { label: "Olathe", location: { lat: stops.start.lat, lon: stops.start.lon } },
      destination: { label: "Plaunt ferry", location: { lat: stops.cheboygan.lat, lon: stops.cheboygan.lon } },
      waypoints: [
        { label: "Merrillville", location: { lat: stops.merrillville.lat, lon: stops.merrillville.lon } },
        { label: "Grand Rapids", location: { lat: stops.grandRapids.lat, lon: stops.grandRapids.lon } }
      ]
    };
  }

  function renderRouteMapPanel() {
    const container = byId("routeMapPanel");
    if (!container) return;
    const mapMode = byId("mapMode");
    if (mapMode) mapMode.textContent = state.lastPosition ? "Open map with live GPS active" : "Open map; tap Start GPS to show your location";
    if (!window.maplibregl) {
      container.innerHTML = `
        <div class="map-fallback">
          <strong>Loading map</strong>
          <p>The full map loads only when this page is open so the rest of the app stays fast. Phone-map buttons still work immediately.</p>
          <div class="route-steps"><span>Olathe</span><span>South Bend</span><span>Cheboygan ferry</span><span>Bois Blanc Island</span></div>
          <div class="action-row"><a class="external-link" href="${activeRouteUrl()}" target="_blank" rel="noopener">Open driving route</a><a class="external-link" href="${data.mapLinks.returnUrl}" target="_blank" rel="noopener">Open return route</a></div>
        </div>
      `;
      loadMapLibre();
      return;
    }
    container.innerHTML = `<div id="mapLibreCanvas" class="maplibre-canvas" role="img" aria-label="Open trip map"></div>`;
    drawRouteMap();
  }

  function formatRouteDuration(seconds) {
    const minutes = Math.max(0, Math.round(Number(seconds || 0) / 60));
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
  }

  function elsieHeaderCopy() {
    const target = getActiveTripTarget();
    const isKatrina = activeProfile === "katrina";
    const isEmma = activeProfile === "emma";
    const isEliette = activeProfile === "eliette";
    if (isElsieIslandMode()) {
      if (activeProfile === "momdad") return ["ISLAND OVERVIEW", "Every profile's island plans in one view"];
      if (isKatrina) return ["EXPLORE BOIS BLANC", "History, hidden facts, and island mysteries"];
      if (isEmma) return ["EXPLORE BOIS BLANC", "How island life works: ferry, store, beach, and games"];
      if (isEliette) return ["EXPLORE BOIS BLANC", "Tiny treasures, shiny rocks, and hidden details"];
      if (activeProfile === "jules") return ["ISLAND MISSION", "🏝️ 🚤 🐾 ⭐"];
      return ["EXPLORE BOIS BLANC", "Landmarks, wildlife, and island life"];
    }
    if (state.phase === "return" || state.tripLeg === "return") return ["HOMEWARD", "One long road back to Olathe"];
    if (state.phase === "pretrip") {
      if (activeProfile === "momdad") return ["FAMILY OVERVIEW", "All routes, all stops, full planning context"];
      const name = isKatrina ? "KATRINA'S" : isEmma ? "EMMA'S" : isEliette ? "ELIETTE'S" : activeProfile === "jules" ? "CAPTAIN JULES'" : "ELSIE'S";
      return [`${name} ROUTE`, "Merrillville first, Indiana Dunes next, then the ferry"];
    }
    const subtitle = target === data.route.destinationTargets.indianaDunes
      ? "Dunes, wetlands, forest, then north to the ferry"
      : isKatrina ? "Smart facts and quiz-the-car energy along the way"
      : isEmma ? "Real life, sports, and why-people-go-here energy"
      : isEliette ? "Cool facts, hidden details, and the occasional gross truth"
      : activeProfile === "jules" ? "🏁 🏎️ 🦸 ⚾ 🐾"
      : activeProfile === "momdad" ? "The whole family's map in one overview"
      : "Live route context without the clutter";
    return [`${target.label.toUpperCase()} IS NEXT`, subtitle];
  }

  function elsieRouteTrackerMarkup() {
    const target = getActiveTripTarget();
    const route = currentRouteResult();
    const miles = route.distanceMeters ? Math.round(route.distanceMeters / 1609.344) : target.plannedMiles;
    const progress = state.initialLegDistanceMeters && route.distanceMeters ? clamp((1 - route.distanceMeters / state.initialLegDistanceMeters) * 100, 0, 100) : progressForPhase();
    const status = route.isFallback ? (route.source === "planned" ? "PLANNED" : "CACHED") : route.isLive ? "LIVE" : "ROAD ROUTE";
    const updated = route.calculatedAt ? new Date(route.calculatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "not yet";
    return `
      <section id="elsieRouteTracker" class="elsie-route-tracker" aria-label="Elsie route and ETA">
        <div class="elsie-route-heading"><span>NEXT: ${escapeHtml(target.label)}</span><b>${status}</b></div>
        <div class="elsie-route-metrics" aria-live="polite"><strong>${formatRouteDuration(route.durationSeconds)}</strong><span>${Number(miles || 0).toLocaleString()} miles</span></div>
        <p>${routeArrivalText(route, target)}</p>
        <div class="elsie-progress" role="progressbar" aria-label="Active route progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><span style="width:${progress}%"></span></div>
        <small>${escapeHtml(state.gpsStatus || "GPS off")} · ETA updated ${updated} · ${escapeHtml(route.source || "planned")}</small>
        <div class="elsie-tracker-actions">
          ${watchId === null ? `<button type="button" data-start-gps="true">Start Live Trip</button>` : `<button type="button" data-stop-gps>Stop Tracking</button>`}
          <button type="button" data-refresh-route>Refresh ETA</button>
          <a href="${googleMapsNavigationUrl(target)}" target="_blank" rel="noopener">Navigate</a>
        </div>
        ${selectedDayDate() === "2026-08-01" || state.tripLeg === "day2" ? `<label class="dunes-toggle"><input type="checkbox" data-include-dunes ${state.includeIndianaDunes ? "checked" : ""}> Include Indiana Dunes</label>` : ""}
      </section>`;
  }

  function renderElsieRouteTracker() {
    const current = byId("elsieRouteTracker");
    if (!current || !isMapProfile()) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = elsieRouteTrackerMarkup();
    current.replaceWith(wrapper.firstElementChild);
  }

  function elsieRadarLabel(item) {
    const text = `${item.title} ${item.category} ${item.summary} ${item.why}`.toLowerCase();
    if (/animal|wildlife|habitat|zoo|bird/.test(text)) return "ANIMAL WATCH";
    if (/prison|fort|historic|history|shipwreck/.test(text)) return "STRANGE HISTORY";
    if (/odd|weird|largest|unusual/.test(text)) return "WEIRD STOP";
    if (/mystery|legend|underground|ghost/.test(text)) return "MYSTERY";
    return /core|worth/i.test(item.tier || "") ? "WORTH THE DETOUR" : "BEST STORY";
  }

  function elsieRadarStops() {
    const currentMiles = routeProgressMiles();
    return topAttractionsForPanel(allAttractions().filter((item) => {
      if (isStopVisited(item)) return false;
      if (/wisconsin/i.test(`${item.routeSegment} ${item.place}`)) return false;
      if (Number.isFinite(Number(item.milesFromStart)) && Number(item.milesFromStart) + 20 < currentMiles) return false;
      if (!state.includeIndianaDunes && /indiana dunes/i.test(item.title)) return false;
      return true;
    }), "elsie").slice(0, 3);
  }

  function b64encode(str) {
    try { return window.btoa(unescape(encodeURIComponent(str))); }
    catch { return window.btoa(str); }
  }

  function elsieMiniBadgeIcon(badge, progress) {
    const svg = badgeDoodleSvg(badge, progress).replace(
      '<svg class="badge-doodle-svg"',
      '<svg xmlns="http://www.w3.org/2000/svg" class="badge-doodle-svg"'
    );
    const src = `data:image/svg+xml;base64,${b64encode(svg)}`;
    return `<img src="${src}" alt="${escapeHtml(badge.title)}${progress.earned ? " (earned)" : ""}" class="elsie-mini-badge ${progress.earned ? "is-earned" : ""}">`;
  }

  function renderElsieRadarMarkup() {
    const island = isElsieIslandMode();
    const summary = elsieBadgeSummary();
    const trailIcon = `<span class="elsie-mini-badge elsie-mini-badge-emoji ${summary.trail.earned ? "is-earned" : ""}">👣</span>`;
    const icons = summary.items.map(({ badge, progress }) => elsieMiniBadgeIcon(badge, progress)).join("") + trailIcon;
    const islandChip = island ? `
      <div id="elsieRadar" class="elsie-float-bottom" aria-label="Elsie quick controls">
        <button type="button" class="elsie-chip" data-elsie-sheet="island">Island Ideas · ${elsieIslandActivities().board.length}</button>
      </div>` : activeProfile === "jules" ? `
      <div id="elsieRadar" class="elsie-float-bottom" aria-label="Jules quick controls">
        <button type="button" class="elsie-chip jules-games-chip" data-elsie-sheet="julesgames" aria-label="Games">🎮 Games</button>
        <button type="button" class="elsie-chip jules-marker-chip" data-jules-marker-toggle aria-label="Switch GPS marker">${state.julesMarkerStyle === "f1" ? "🏎️ F1 Car" : "🦔 Sonic Car"}</button>
      </div>` : "";
    return `${islandChip}
      <button type="button" class="elsie-badge-tracker" data-elsie-sheet="badges" aria-label="Badges ${summary.earned} of ${summary.total} earned">
        <span class="elsie-badge-tracker-icons">${icons}</span>
        <span class="elsie-badge-tracker-count">${summary.earned}/${summary.total}</span>
      </button>`;
  }


  /* ===================== ELSIE MAP EXPERIENCE ===================== */

  const MAP_PROFILES = ["elsie", "katrina", "emma", "eliette", "jules", "momdad"];
  const MAP_STYLE_URLS = { light: "https://tiles.openfreemap.org/styles/liberty", dark: "https://tiles.openfreemap.org/styles/dark" };
  function activeMapStyleUrl() {
    return MAP_STYLE_URLS[state.mapTheme] || MAP_STYLE_URLS.light;
  }
  function isMapProfile(p = activeProfile) {
    return MAP_PROFILES.includes(p);
  }

  const ELSIE_ICON_OVERRIDES = {
    "P1-012": "legend"
  };

  const ELSIE_ICON_TYPES = ["spooky", "strange-history", "weird-stop", "science", "stars", "anime-vibe", "music-energy", "mystery", "animal-watch", "legend"];

  function getElsieIconType(stop) {
    if (!stop) return "";
    const override = ELSIE_ICON_OVERRIDES[stop.id] || ELSIE_ICON_OVERRIDES[stop.title];
    if (override) return override;
    const text = `${stop.title || ""} ${stop.category || ""} ${stop.summary || ""} ${stop.why || ""} ${stop.profiles?.elsie || ""}`.toLowerCase();
    if (/ghost|haunt|cemeter|grave|prison|jail|tunnel|eerie|abandon|spirit|spook/.test(text)) return "spooky";
    if (/mystery|legend|secret|unexplained|hidden room|cryptic|lost /.test(text)) return "mystery";
    if (/dark sky|astronom|observator|stargaz|planetari|night sky|\bstar\b/.test(text)) return "stars";
    if (/science|aviation|geolog|engineer|invention|technolog|experiment|weather station/.test(text)) return "science";
    if (/music|opera|concert|sound|record|organ|band/.test(text)) return "music-energy";
    if (/largest|giant|odd|weird|unusual|roadside|novelty|quirk/.test(text)) return "weird-stop";
    if (/wildlife|zoo|wetland|bird|habitat|animal|refuge|aquarium/.test(text)) return "animal-watch";
    if (/fort|battle|\bwar\b|outlaw|frontier|historic|history|heritage/.test(text)) return "strange-history";
    if (/waterfall|falls|dune|lighthouse|bridge|overlook|scenic|vista|shoreline|canyon/.test(text)) return "anime-vibe";
    if (/museum|market|farm|food|restaurant|cafe|orchard|fudge|donut|sport|stadium|capitol|state|park|preserve|library/.test(text)) return "weird-stop";
    return "mystery";
  }

  const KATRINA_ICON_OVERRIDES = {
    // "stop-id": "star"
  };

  const KATRINA_ICON_TYPES = ["creature", "star", "cactus", "catdog", "treeflower"];

  function getKatrinaIconType(stop) {
    if (!stop) return "";
    const override = KATRINA_ICON_OVERRIDES[stop.id] || KATRINA_ICON_OVERRIDES[stop.title];
    if (override) return override;
    const text = `${stop.title || ""} ${stop.category || ""} ${stop.summary || ""} ${stop.why || ""} ${stop.profiles?.katrina || ""}`.toLowerCase();
    if (/dark sky|astronom|observator|stargaz|planetari|night sky|\bstar\b/.test(text)) return "star";
    if (/wildlife|zoo|wetland|bird|habitat|refuge|aquarium|nature center|reptile/.test(text)) return "creature";
    if (/farm|petting|stable|ranch|\bdog\b|\bcat\b|kennel|barn/.test(text)) return "catdog";
    if (/park|garden|arboretum|forest|nature|trail|preserve|orchard|dune|meadow/.test(text)) return "treeflower";
    return "cactus";
  }

  const EMMA_ICON_OVERRIDES = {
    // "stop-id": "volleyball"
  };

  const EMMA_ICON_TYPES = ["flower", "volleyball", "cat", "icecream", "nails"];

  function getEmmaIconType(stop) {
    if (!stop) return "";
    const override = EMMA_ICON_OVERRIDES[stop.id] || EMMA_ICON_OVERRIDES[stop.title];
    if (override) return override;
    const text = `${stop.title || ""} ${stop.category || ""} ${stop.summary || ""} ${stop.why || ""} ${stop.profiles?.emma || ""}`.toLowerCase();
    const isBattleSite = /battle|battlefield|fort|war|massacre|skirmish/.test(text);
    if (!isBattleSite && /sport|stadium|ballpark|arena|gym|speedway|raceway|racetrack|team|athletic|ballfield|playing field|soccer|baseball|football|volleyball|hockey/.test(text)) return "volleyball";
    if (isBattleSite) return "flower";
    if (/food|restaurant|cafe|diner|ice cream|fudge|donut|market|orchard|candy|bakery/.test(text)) return "icecream";
    if (/wildlife|zoo|animal|farm|habitat|refuge|aquarium|bird/.test(text)) return "cat";
    if (/park|garden|nature|trail|preserve|dune|forest|flower|meadow|shoreline|falls|scenic/.test(text)) return "flower";
    return "nails";
  }

  function elsieIconSvg(type) {
    const base = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="${fill}" stroke="#141414" stroke-width="4"/>${inner}</svg>`;
    switch (type) {
      case "legend": return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="#c9a24b" stroke="#7a1f00" stroke-width="4" stroke-dasharray="5 3"/><path d="M18 20l10 4 8-5 10 5v22l-10-5-8 5-10-4z" fill="#f3e3ba" stroke="#7a1f00" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 24v22M36 19v22" stroke="#7a1f00" stroke-width="1.6" fill="none" stroke-dasharray="2 2"/><path d="M40 24l6 6M46 24l-6 6" stroke="#c81e1e" stroke-width="3.4" stroke-linecap="round"/><circle cx="24" cy="34" r="1.6" fill="#c81e1e"/></svg>`;
      case "spooky": return base("#3a2a54", `<path d="M32 16c-8 0-12 7-12 14v14l4-3 4 3 4-3 4 3 4-3 4 3V30c0-7-4-14-12-14z" fill="#efe6ff" stroke="#141414" stroke-width="3"/><circle cx="27" cy="30" r="2.6" fill="#141414"/><circle cx="37" cy="30" r="2.6" fill="#141414"/><circle cx="27.9" cy="29.1" r="0.9" fill="#fff"/><path d="M45 15a6 6 0 1 0 4 10 8 8 0 0 1-4-10z" fill="#cbb7f2" stroke="#141414" stroke-width="2.5"/>`);
      case "strange-history": return base("#8a5a2b", `<rect x="20" y="18" width="24" height="30" rx="3" fill="#f2e3c2" stroke="#141414" stroke-width="3"/><path d="M24 26h16M24 32h16M24 38h11" stroke="#141414" stroke-width="2.5" stroke-linecap="round"/><path d="M44 18l6-4M44 48l6 4" stroke="#141414" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="42" r="4.5" fill="#e0aa3e" stroke="#141414" stroke-width="2.5"/>`);
      case "weird-stop": return base("#7a3fa0", `<g transform="rotate(-8 32 32)"><rect x="18" y="22" width="28" height="16" rx="3" fill="#f7c948" stroke="#141414" stroke-width="3"/><path d="M32 38v10" stroke="#141414" stroke-width="4"/><circle cx="32" cy="30" r="5.5" fill="none" stroke="#141414" stroke-width="3"/><circle cx="32" cy="30" r="1.8" fill="#141414"/></g><path d="M50 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ff8b3d" stroke="#141414" stroke-width="2"/>`);
      case "science": return base("#0e5e78", `<ellipse cx="32" cy="32" rx="16" ry="6.5" fill="none" stroke="#7ff0ff" stroke-width="3"/><ellipse cx="32" cy="32" rx="16" ry="6.5" transform="rotate(60 32 32)" fill="none" stroke="#7ff0ff" stroke-width="3"/><ellipse cx="32" cy="32" rx="16" ry="6.5" transform="rotate(120 32 32)" fill="none" stroke="#7ff0ff" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#ffe14d" stroke="#141414" stroke-width="3"/>`);
      case "stars": return base("#141b3f", `<path d="M32 14l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#f4efff" stroke="#141414" stroke-width="2.5"/><circle cx="46" cy="20" r="2" fill="#cfd6ff"/><circle cx="20" cy="44" r="2" fill="#cfd6ff"/><path d="M44 42a7 7 0 1 0 5 11 9 9 0 0 1-5-11z" fill="#c3b6f5" stroke="#141414" stroke-width="2.5"/>`);
      case "anime-vibe": return base("#1c3a63", `<circle cx="32" cy="36" r="10" fill="#ffd24d" stroke="#141414" stroke-width="3"/><path d="M32 18v6M18 36h-6M52 36h-6M22 26l-4-4M42 26l4-4" stroke="#ff5fa2" stroke-width="3.5" stroke-linecap="round"/><path d="M14 47h36" stroke="#66e0ff" stroke-width="4" stroke-linecap="round"/>`);
      case "music-energy": return base("#152417", `<path d="M16 34h4l3-8 4 16 4-22 4 26 4-16 3 4h6" fill="none" stroke="#5dff8a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 18l6-2v8" stroke="#8f7bff" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="43" cy="25" r="3" fill="#8f7bff" stroke="#141414" stroke-width="2"/>`);
      case "mystery": return base("#1a2436", `<circle cx="32" cy="28" r="9" fill="#0e1420" stroke="#d9c069" stroke-width="3"/><path d="M32 28m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M32 31v8l-3 5h6l-3-5" fill="#d9c069" stroke="#d9c069" stroke-width="1.5"/><circle cx="45" cy="18" r="1.6" fill="#aab6d3"/><circle cx="19" cy="45" r="1.6" fill="#aab6d3"/>`);
      case "animal-watch": return base("#22532f", `<ellipse cx="32" cy="38" rx="7" ry="5.5" fill="#f0dcb4" stroke="#141414" stroke-width="3"/><circle cx="24" cy="28" r="3.4" fill="#f0dcb4" stroke="#141414" stroke-width="2.5"/><circle cx="32" cy="24" r="3.4" fill="#f0dcb4" stroke="#141414" stroke-width="2.5"/><circle cx="40" cy="28" r="3.4" fill="#f0dcb4" stroke="#141414" stroke-width="2.5"/>`);
      default: return base("#1f78a4", `<circle cx="32" cy="32" r="8" fill="#fffdf7" stroke="#141414" stroke-width="3"/>`);
    }
  }

  function katrinaIconSvg(type) {
    const base = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="${fill}" stroke="#141414" stroke-width="4"/>${inner}</svg>`;
    switch (type) {
      case "creature": return base("#e8c78a", `<circle cx="32" cy="34" r="10" fill="#fff2d9" stroke="#141414" stroke-width="3"/><path d="M23 24 L27 30 M41 24 L37 30" stroke="#141414" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="33" r="1.8" fill="#141414"/><circle cx="36" cy="33" r="1.8" fill="#141414"/><path d="M29 39q3 3 6 0" stroke="#141414" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M32 44v6" stroke="#141414" stroke-width="3" stroke-linecap="round"/>`);
      case "star": return base("#2a3a6b", `<path d="M32 14l5 11 12 1.5-9 8 2.5 12L32 40l-10.5 6.5L24 34l-9-8 12-1.5z" fill="#ffe25c" stroke="#141414" stroke-width="2.5"/><circle cx="46" cy="20" r="1.8" fill="#fff"/><circle cx="19" cy="42" r="1.8" fill="#fff"/>`);
      case "cactus": return base("#dff0d8", `<rect x="27" y="24" width="10" height="24" rx="5" fill="#4d8b52" stroke="#141414" stroke-width="3"/><path d="M27 32h-6a4 4 0 0 0-4 4v4" stroke="#141414" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M17 40v-4a4 4 0 0 1 4-4" stroke="#4d8b52" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M37 28h6a4 4 0 0 1 4 4v4" stroke="#141414" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M47 36v-4a4 4 0 0 0-4-4" stroke="#4d8b52" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M22 20l3 4M42 20l-3 4M32 16v5" stroke="#e0517a" stroke-width="2.5" stroke-linecap="round"/><rect x="22" y="48" width="20" height="6" rx="2" fill="#c65c35" stroke="#141414" stroke-width="2.5"/>`);
      case "catdog": return base("#f2d9b8", `<path d="M22 26l4 8M42 26l-4 8" stroke="#141414" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="36" r="11" fill="#fbeedd" stroke="#141414" stroke-width="3"/><circle cx="27" cy="34" r="1.8" fill="#141414"/><circle cx="37" cy="34" r="1.8" fill="#141414"/><path d="M32 38l-2 2h4z" fill="#141414"/><path d="M28 42q4 2.5 8 0" stroke="#141414" stroke-width="2" fill="none" stroke-linecap="round"/>`);
      case "treeflower": return base("#dcecd2", `<path d="M32 46V30" stroke="#7c5d3a" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="22" r="10" fill="#5dae5a" stroke="#141414" stroke-width="3"/><circle cx="22" cy="28" r="7" fill="#79c46f" stroke="#141414" stroke-width="2.5"/><circle cx="42" cy="28" r="7" fill="#79c46f" stroke="#141414" stroke-width="2.5"/><circle cx="18" cy="46" r="4" fill="#ff9fc6" stroke="#141414" stroke-width="2"/><circle cx="46" cy="47" r="4" fill="#ffe25c" stroke="#141414" stroke-width="2"/>`);
      default: return base("#c65c35", `<circle cx="32" cy="32" r="8" fill="#fffdf7" stroke="#141414" stroke-width="3"/>`);
    }
  }

  function emmaIconSvg(type) {
    const base = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="${fill}" stroke="#141414" stroke-width="4"/>${inner}</svg>`;
    switch (type) {
      case "flower": return base("#fbe3ef", `<circle cx="32" cy="22" r="6" fill="#ff9fc6" stroke="#141414" stroke-width="2.5"/><circle cx="41" cy="29" r="6" fill="#ff9fc6" stroke="#141414" stroke-width="2.5"/><circle cx="38" cy="40" r="6" fill="#ff9fc6" stroke="#141414" stroke-width="2.5"/><circle cx="26" cy="40" r="6" fill="#ff9fc6" stroke="#141414" stroke-width="2.5"/><circle cx="23" cy="29" r="6" fill="#ff9fc6" stroke="#141414" stroke-width="2.5"/><circle cx="32" cy="32" r="5.5" fill="#ffe25c" stroke="#141414" stroke-width="2.5"/>`);
      case "volleyball": return base("#dbeafe", `<circle cx="32" cy="32" r="14" fill="#fffdf7" stroke="#141414" stroke-width="3"/><path d="M18 32q14-6 28 0M25 20q2 14-4 22M39 20q-2 14 4 22" stroke="#141414" stroke-width="2.2" fill="none"/><path d="M22 24q10 3 20 0" stroke="#4f7fd9" stroke-width="2.4" fill="none"/>`);
      case "cat": return base("#f6e3c9", `<path d="M22 25l4 7M42 25l-4 7" stroke="#141414" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="36" r="11" fill="#fbeedd" stroke="#141414" stroke-width="3"/><circle cx="27" cy="34" r="1.8" fill="#141414"/><circle cx="37" cy="34" r="1.8" fill="#141414"/><path d="M32 37l-1.6 1.8h3.2z" fill="#ff9fc6"/><path d="M18 36h7M18 40h7M39 36h7M39 40h7" stroke="#141414" stroke-width="1.6" stroke-linecap="round"/>`);
      case "icecream": return base("#fff1d6", `<path d="M25 32h14l-7 18z" fill="#e8b06a" stroke="#141414" stroke-width="3" stroke-linejoin="round"/><path d="M26 32h12M27 37h10M29 42h6" stroke="#141414" stroke-width="1.4"/><circle cx="27" cy="26" r="6.5" fill="#ff9fc6" stroke="#141414" stroke-width="2.5"/><circle cx="37" cy="26" r="6.5" fill="#fef3ff" stroke="#141414" stroke-width="2.5"/><circle cx="32" cy="20" r="6" fill="#a8e0c2" stroke="#141414" stroke-width="2.5"/><circle cx="32" cy="14.5" r="2" fill="#e0517a" stroke="#141414" stroke-width="1.5"/>`);
      case "nails": return base("#f3e0f7", `<path d="M22 44V30a3 3 0 0 1 6 0v14M28 44V26a3 3 0 0 1 6 0v18M34 44V28a3 3 0 0 1 6 0v16" fill="#fbeedd" stroke="#141414" stroke-width="2.5" stroke-linejoin="round"/><path d="M23 30a2 2 0 0 1 4 0v2h-4zM29 26a2 2 0 0 1 4 0v2h-4zM35 28a2 2 0 0 1 4 0v2h-4z" fill="#c65cd9" stroke="#141414" stroke-width="1.6"/><path d="M20 48h24" stroke="#141414" stroke-width="3" stroke-linecap="round"/><path d="M46 18l1.5 3.5L51 23l-3.5 1.5L46 28l-1.5-3.5L41 23l3.5-1.5z" fill="#ffe25c" stroke="#141414" stroke-width="1.6"/>`);
      default: return base("#4f7fd9", `<circle cx="32" cy="32" r="8" fill="#fffdf7" stroke="#141414" stroke-width="3"/>`);
    }
  }

  const ELIETTE_ICON_OVERRIDES = {
    "P4-121": "coin",
    "P4-122": "coin",
    "P4-123": "coin",
    "P4-124": "coin",
    "P4-125": "coin"
  };
  const ELIETTE_ICON_TYPES = ["gem", "magnifier", "craft", "trinket", "butterfly", "coin"];

  function getElietteIconType(stop) {
    if (!stop) return "";
    const override = ELIETTE_ICON_OVERRIDES[stop.id] || ELIETTE_ICON_OVERRIDES[stop.title];
    if (override) return override;
    const text = `${stop.title || ""} ${stop.category || ""} ${stop.summary || ""} ${stop.why || ""} ${stop.profiles?.eliette || ""}`.toLowerCase();
    if (/rock|stone|geolog|mineral|gem|crystal|agate|fossil|glass/.test(text)) return "gem";
    if (/craft|handmade|art|studio|quilt|weav|pottery|maker/.test(text)) return "craft";
    if (/shop|store|souvenir|market|gift|bookstore|antique|trading post|boutique|outlet/.test(text)) return "trinket";
    if (/garden|butterfly|nature|wildlife|park|preserve|dune|forest|trail|scenic|falls/.test(text)) return "butterfly";
    return "magnifier";
  }

  function elietteIconSvg(type) {
    const base = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="${fill}" stroke="#141414" stroke-width="4"/>${inner}</svg>`;
    switch (type) {
      case "gem": return base("#274156", `<path d="M22 24h20l6 8-16 18-16-18z" fill="#8fd6e8" stroke="#141414" stroke-width="3" stroke-linejoin="round"/><path d="M22 24l10 8 10-8M16 32h32M32 32v18" stroke="#141414" stroke-width="2" fill="none"/><path d="M46 14l1.4 3.2 3.2 1.4-3.2 1.4L46 23.4l-1.4-3.4-3.2-1.4 3.2-1.4z" fill="#ffe25c"/>`);
      case "magnifier": return base("#5b4aa0", `<circle cx="28" cy="28" r="11" fill="#f4efff" stroke="#141414" stroke-width="3.5"/><circle cx="28" cy="28" r="6.5" fill="none" stroke="#b79ef2" stroke-width="2"/><path d="M36.5 36.5L47 47" stroke="#141414" stroke-width="5" stroke-linecap="round"/><circle cx="24.5" cy="24.5" r="1.8" fill="#fffdf7"/>`);
      case "craft": return base("#a8536b", `<path d="M20 18l16 22M36 18L20 40" stroke="#141414" stroke-width="3.4" stroke-linecap="round"/><circle cx="18" cy="44" r="4.4" fill="#f7c9d8" stroke="#141414" stroke-width="2.6"/><circle cx="30" cy="44" r="4.4" fill="#f7c9d8" stroke="#141414" stroke-width="2.6"/><path d="M40 24q6 2 6 8t-6 8" fill="none" stroke="#ffe25c" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 3"/><circle cx="47" cy="42" r="2.6" fill="#ffe25c" stroke="#141414" stroke-width="1.8"/>`);
      case "trinket": return base("#7c5d3a", `<rect x="18" y="28" width="28" height="17" rx="3" fill="#e9cf9f" stroke="#141414" stroke-width="3"/><path d="M18 30a14 8 0 0 1 28 0" fill="#d8b475" stroke="#141414" stroke-width="3"/><rect x="29" y="26" width="6" height="8" rx="1.6" fill="#ffe25c" stroke="#141414" stroke-width="2.2"/><path d="M23 37h4M37 37h4" stroke="#141414" stroke-width="1.6"/><path d="M48 18l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z" fill="#fffdf7"/>`);
      case "butterfly": return base("#3b6647", `<path d="M32 22v22" stroke="#141414" stroke-width="3.4" stroke-linecap="round"/><path d="M30 20q-2-5-6-4" stroke="#141414" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M34 20q2-5 6-4" stroke="#141414" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30 27c-8-8-18-4-15 4 2 6 10 6 15 2zM34 27c8-8 18-4 15 4-2 6-10 6-15 2z" fill="#f4a8c8" stroke="#141414" stroke-width="2.6"/><path d="M30 36c-6-2-12 1-10 6 1.6 4 8 3 10-1zM34 36c6-2 12 1 10 6-1.6 4-8 3-10-1z" fill="#ffd9a8" stroke="#141414" stroke-width="2.6"/>`);
      case "coin": return base("#8a6d1f", `<circle cx="32" cy="32" r="15" fill="#ffe25c" stroke="#141414" stroke-width="3"/><circle cx="32" cy="32" r="10.5" fill="none" stroke="#8a6d1f" stroke-width="2"/><path d="M32 24v16M27 27h7a3.5 3.5 0 0 1 0 7h-6a3.5 3.5 0 0 0 0 7h8" stroke="#8a6d1f" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
      default: return base("#5b4aa0", `<circle cx="32" cy="32" r="8" fill="#fffdf7" stroke="#141414" stroke-width="3"/>`);
    }
  }

  const JULES_ICON_OVERRIDES = {};
  const JULES_ICON_TYPES = ["ring", "flag", "ball", "stadium", "hero", "machine", "paw"];

  function getJulesIconType(stop) {
    if (!stop) return "";
    const override = JULES_ICON_OVERRIDES[stop.id] || JULES_ICON_OVERRIDES[stop.title];
    if (override) return override;
    const text = `${stop.title || ""} ${stop.category || ""} ${stop.summary || ""} ${stop.profiles?.jules || ""}`.toLowerCase();
    const isBattle = /battle|battlefield|\bfort\b|\bwar\b|massacre/.test(text);
    if (!isBattle && /speedway|raceway|racetrack|race|dragst/.test(text)) return "flag";
    if (!isBattle && /stadium|ballpark|arena|\bgym\b/.test(text)) return "stadium";
    if (/train|locomotive|railroad|boat|ship|ferry|plane|aviation|truck|machine|engine|factory|bridge|lock/.test(text)) return "machine";
    if (/dino|fossil|animal|zoo|wildlife|paw|farm|creature|bird/.test(text)) return "paw";
    if (/soccer|baseball|basketball|hockey|football|\bball\b|sport/.test(text)) return "ball";
    if (isBattle || /hero|castle|tower|lighthouse/.test(text)) return "hero";
    return "ring";
  }

  function julesIconSvg(type) {
    const base = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="${fill}" stroke="#10265c" stroke-width="4.5"/>${inner}</svg>`;
    switch (type) {
      case "ring": return base("#1c4fd6", `<circle cx="32" cy="32" r="12" fill="none" stroke="#ffd93b" stroke-width="7"/><circle cx="32" cy="32" r="12" fill="none" stroke="#b8860b" stroke-width="1.6"/><path d="M46 20l3 2M49 30l4 1M46 42l3-2" stroke="#9fd8ff" stroke-width="3" stroke-linecap="round"/>`);
      case "flag": return base("#e23b3b", `<path d="M24 14v36" stroke="#10265c" stroke-width="4" stroke-linecap="round"/><path d="M24 16h22l-5 7 5 7H24z" fill="#fffdf7" stroke="#10265c" stroke-width="3" stroke-linejoin="round"/><path d="M28 16h5v5h-5zM38 16h5v5h-5zM33 21h5v5h-5zM28 26h5v4h-5zM38 26h5v4h-5z" fill="#10265c"/>`);
      case "ball": return base("#f6a821", `<circle cx="32" cy="32" r="14" fill="#fffdf7" stroke="#10265c" stroke-width="3.4"/><path d="M22 24q10 4 20 0M22 40q10-4 20 0M32 18v28" stroke="#e23b3b" stroke-width="2.6" fill="none"/>`);
      case "stadium": return base("#2f9e5b", `<path d="M14 30a18 9 0 0 1 36 0v6a18 9 0 0 1-36 0z" fill="#eafbef" stroke="#10265c" stroke-width="3"/><ellipse cx="32" cy="30" rx="18" ry="9" fill="#a5eab9" stroke="#10265c" stroke-width="3"/><ellipse cx="32" cy="30" rx="8.5" ry="4" fill="#57d07d" stroke="#10265c" stroke-width="2.4"/><path d="M18 26v8M26 23v10M38 23v10M46 26v8" stroke="#10265c" stroke-width="1.8"/>`);
      case "hero": return base("#5a34c8", `<path d="M32 14l14 5v12c0 10-6 16-14 19-8-3-14-9-14-19V19z" fill="#8fd0ff" stroke="#10265c" stroke-width="3.4" stroke-linejoin="round"/><path d="M32 22l3 6.4 7 .8-5.2 4.6 1.5 6.8L32 37l-6.3 3.6 1.5-6.8L22 29.2l7-.8z" fill="#ffd93b" stroke="#10265c" stroke-width="2"/>`);
      case "machine": return base("#4a5568", `<rect x="16" y="26" width="24" height="14" rx="3" fill="#8fd0ff" stroke="#10265c" stroke-width="3"/><rect x="38" y="30" width="10" height="10" rx="2" fill="#e23b3b" stroke="#10265c" stroke-width="3"/><circle cx="23" cy="44" r="4.6" fill="#10265c"/><circle cx="23" cy="44" r="1.8" fill="#fffdf7"/><circle cx="41" cy="44" r="4.6" fill="#10265c"/><circle cx="41" cy="44" r="1.8" fill="#fffdf7"/><path d="M12 33h-3M12 38h-4" stroke="#9fd8ff" stroke-width="2.6" stroke-linecap="round"/>`);
      case "paw": return base("#c98544", `<ellipse cx="32" cy="38" rx="8" ry="6.4" fill="#fff2d9" stroke="#10265c" stroke-width="3"/><circle cx="23" cy="28" r="3.8" fill="#fff2d9" stroke="#10265c" stroke-width="2.6"/><circle cx="32" cy="24" r="3.8" fill="#fff2d9" stroke="#10265c" stroke-width="2.6"/><circle cx="41" cy="28" r="3.8" fill="#fff2d9" stroke="#10265c" stroke-width="2.6"/>`);
      default: return base("#1c4fd6", `<circle cx="32" cy="32" r="8" fill="#fffdf7" stroke="#10265c" stroke-width="3"/>`);
    }
  }

  const MOMDAD_ICON_TYPES = ["wave", "lighthouse", "compass", "sunburst", "landmark", "pine"];

  function getMomdadIconType(stop) {
    if (!stop) return "";
    const text = `${stop.title || ""} ${stop.category || ""} ${stop.summary || ""}`.toLowerCase();
    if (/lighthouse|light station/.test(text)) return "lighthouse";
    if (/lake|river|falls|ferry|ship|locks|beach|shoreline|island|dune|harbor|marina|water/.test(text)) return "wave";
    if (/forest|pine|park|trail|preserve|nature|wildlife|garden/.test(text)) return "pine";
    if (/scenic|overlook|vista|bridge|drive|sunset/.test(text)) return "sunburst";
    if (/museum|historic|history|memorial|capitol|fort|monument|heritage|home|site/.test(text)) return "landmark";
    return "compass";
  }

  function momdadIconSvg(type) {
    const NAVY = "#123a5c", GOLD = "#d9a441", CREAM = "#f5efdf", TEAL = "#2e7f7a";
    const base = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="${CREAM}"/><circle cx="32" cy="32" r="27" fill="${NAVY}" stroke="${GOLD}" stroke-width="3"/><circle cx="32" cy="32" r="23.5" fill="none" stroke="${GOLD}" stroke-width="1.2"/>${inner}</svg>`;
    switch (type) {
      case "wave": return base(`<path d="M14 36q4.5-6 9 0t9 0 9 0 9 0" fill="none" stroke="${TEAL}" stroke-width="3.4" stroke-linecap="round"/><path d="M14 42q4.5-6 9 0t9 0 9 0 9 0" fill="none" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/><path d="M22 22l3 3 3-3 3 3 3-3 3 3 3-3" fill="none" stroke="${CREAM}" stroke-width="2" stroke-linecap="round"/>`);
      case "lighthouse": return base(`<path d="M28 24h8l2 22H26z" fill="${CREAM}" stroke="${GOLD}" stroke-width="2"/><path d="M27 30h10M26.5 36h11M26 42h12" stroke="${NAVY}" stroke-width="2.4"/><rect x="27.5" y="17" width="9" height="7" rx="1.5" fill="${GOLD}"/><path d="M24 20l-7-3M40 20l7-3" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/><path d="M22 48h20" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>`);
      case "compass": return base(`<circle cx="32" cy="32" r="14" fill="none" stroke="${GOLD}" stroke-width="2.2"/><path d="M32 18v4M32 42v4M18 32h4M42 32h4" stroke="${GOLD}" stroke-width="2"/><path d="M32 22l4 10-4 10-4-10z" fill="${CREAM}" stroke="${GOLD}" stroke-width="1.4"/><path d="M32 22l4 10h-8z" fill="${TEAL}"/>`);
      case "sunburst": return base(`<circle cx="32" cy="38" r="8" fill="${GOLD}" stroke="${CREAM}" stroke-width="1.6"/><path d="M32 24v-7M22 27l-4-5M42 27l4-5M17 36h-5M52 36h-5M25 21l-2-4M39 21l2-4" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/><path d="M14 47h36" stroke="${TEAL}" stroke-width="3" stroke-linecap="round"/>`);
      case "landmark": return base(`<path d="M18 26l14-8 14 8z" fill="${GOLD}" stroke="${CREAM}" stroke-width="1.4"/><path d="M22 28v14M29 28v14M36 28v14M43 28v14" stroke="${CREAM}" stroke-width="3"/><path d="M18 44h28M20 48h24" stroke="${GOLD}" stroke-width="2.6" stroke-linecap="round"/>`);
      case "pine": return base(`<path d="M32 15l8 11h-5l7 9h-6l7 10H21l7-10h-6l7-9h-5z" fill="${TEAL}" stroke="${GOLD}" stroke-width="1.8" stroke-linejoin="round"/><path d="M32 45v6" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`);
      default: return base(`<circle cx="32" cy="32" r="8" fill="${GOLD}"/>`);
    }
  }

  function mapIconType(stop, profile = activeProfile) {
    if (profile === "katrina") return getKatrinaIconType(stop);
    if (profile === "emma") return getEmmaIconType(stop);
    if (profile === "eliette") return getElietteIconType(stop);
    if (profile === "jules") return getJulesIconType(stop);
    if (profile === "momdad") return getMomdadIconType(stop);
    return getElsieIconType(stop);
  }

  function mapIconSvg(type, profile = activeProfile) {
    if (profile === "katrina") return katrinaIconSvg(type);
    if (profile === "emma") return emmaIconSvg(type);
    if (profile === "eliette") return elietteIconSvg(type);
    if (profile === "jules") return julesIconSvg(type);
    if (profile === "momdad") return momdadIconSvg(type);
    return elsieIconSvg(type);
  }

  function mapIconTypes(profile = activeProfile) {
    if (profile === "katrina") return KATRINA_ICON_TYPES;
    if (profile === "emma") return EMMA_ICON_TYPES;
    if (profile === "eliette") return ELIETTE_ICON_TYPES;
    if (profile === "jules") return JULES_ICON_TYPES;
    if (profile === "momdad") return MOMDAD_ICON_TYPES;
    return ELSIE_ICON_TYPES;
  }

  let elsieIconsRegistered = false;
  function registerElsieIcons(map) {
    if (!map) return Promise.resolve();
    const profile = activeProfile;
    const jobs = mapIconTypes(profile).map((type) => new Promise((resolve) => {
      const name = `${profile}-${type}`;
      if (map.hasImage && map.hasImage(name)) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mapIconSvg(type, profile))}`;
    }));
    return Promise.all(jobs).then(() => { elsieIconsRegistered = true; });
  }

  function elsieStopsFeatureCollection() {
    const profile = activeProfile;
    return {
      type: "FeatureCollection",
      features: allAttractions().map((item) => ({
        type: "Feature",
        properties: {
          id: item.id,
          title: item.title,
          elsieIcon: `${profile}-${mapIconType(item, profile) || mapIconTypes(profile)[0]}`
        },
        geometry: { type: "Point", coordinates: [item.lon, item.lat] }
      }))
    };
  }

  function addElsieIconLayer(map) {
    if (!map || map.getLayer("elsie-artwork")) return;
    if (!map.getSource("elsie-stops")) {
      map.addSource("elsie-stops", { type: "geojson", data: elsieStopsFeatureCollection() });
    }
    map.addLayer({
      id: "elsie-artwork",
      type: "symbol",
      source: "elsie-stops",
      layout: {
        "icon-image": ["get", "elsieIcon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "elsie-artwork", (event) => {
      const item = attractionForIdOrTitle(event.features[0].properties.id, event.features[0].properties.title);
      if (item) openElsieMarkerPopup(map, item, event.features[0].geometry.coordinates);
    });
    map.on("mouseenter", "elsie-artwork", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "elsie-artwork", () => { map.getCanvas().style.cursor = ""; });
  }

  const ELSIE_ICON_LABELS = {
    "spooky": "Spooky",
    "strange-history": "Strange History",
    "weird-stop": "Weird Stop",
    "science": "Science",
    "stars": "Stars",
    "anime-vibe": "Anime Vibe",
    "music-energy": "Music Energy",
    "mystery": "Mystery",
    "animal-watch": "Animal Watch"
  };

  let elsieMarkerPopup = null;

  const KATRINA_ICON_LABELS = {
    "creature": "Small Creature",
    "star": "Fun Star",
    "cactus": "Hidden Gem",
    "catdog": "Cats & Dogs",
    "treeflower": "Trees & Flowers"
  };

  function stableIndex(seed, mod) {
    let hash = 0;
    const text = String(seed || "stop");
    for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    return mod > 0 ? hash % mod : 0;
  }

  function katrinaPopupContent(item) {
    const katrinaProfile = data.profiles.find((p) => p.id === "katrina");
    const prompts = katrinaProfile?.prompts || [];
    const seed = item.id || item.title || "stop";
    const historicalFiction = prompts.length ? prompts[stableIndex(seed, prompts.length)] : "What would it feel like to be here 100 years ago?";
    const curated = KATRINA_STOP_FACTS[item.id];
    const whyAngle = curated?.whyAngle || item.profiles?.katrina || item.why || "";
    const hiddenFact = curated?.hiddenFact || (item.why && item.why !== whyAngle ? item.why : (item.summary || ""));
    const quizPrompts = [
      `Quiz the car: what year do you think this got its start?`,
      `Quiz the car: why do you think this ended up right here?`,
      `Quiz the car: what's one detail here nobody else will notice?`
    ];
    const quiz = quizPrompts[stableIndex(`${seed}-quiz`, quizPrompts.length)];
    return { whyAngle, hiddenFact, historicalFiction, quiz };
  }

  const KATRINA_STOP_FACTS = {
    "P1-001": { whyAngle: "Real 1860s stagecoach stop — before this, 'road trip' meant something completely different.", hiddenFact: "Stagecoaches averaged about 5 miles an hour. This whole trip would've taken them weeks." },
    "P1-002": { whyAngle: "Named after a man who never actually owned or lived on this land.", hiddenFact: "Olathe just liked him enough to name the park after him once he'd passed." },
    "P1-003": { whyAngle: "A real natural history museum built into the middle of a shopping center.", hiddenFact: "You can see actual dinosaur bones between stores, like it's completely normal." },
    "P1-004": { whyAngle: "Used to be a private family farm before the city turned it into public gardens.", hiddenFact: "There's a whole treehouse and overlook hidden inside if you go far enough." },
    "P1-005": { whyAngle: "Not named for a fictional farmer — a real Overland Park police officer.", hiddenFact: "She was the department's very first officer killed in the line of duty." },
    "P1-006": { whyAngle: "America's official WWI museum, and genuinely one of the best-designed museums anywhere.", hiddenFact: "The glass bridge you cross is laid over 9,000 fake poppies — each one stands for 1,000 real deaths." },
    "P1-007": { whyAngle: "Once one of the busiest train stations in the country.", hiddenFact: "Gangsters actually shot it out with FBI agents right outside these doors in 1933." },
    "P1-008": { whyAngle: "The only museum on Earth fully dedicated to this chapter of baseball history.", hiddenFact: "A woman, Toni Stone, played professional Negro Leagues baseball with the men — and got a hit off a legendary pitcher." },
    "P1-009": { whyAngle: "Built around cargo pulled from a steamboat that sank in 1856.", hiddenFact: "Pickles from the wreck were found still sealed after 130 years — allegedly still edible." },
    "P1-010": { whyAngle: "A science museum built into a train station's old shed.", hiddenFact: "The exact spot kids run around in used to be filled with steam locomotives." },
    "P1-011": { whyAngle: "A historic jail tied to a major moment in American religious history.", hiddenFact: "The walls were 4 feet thick — 2 feet stone, 2 feet oak — specifically to hold one prisoner." },
    "P1-012": { whyAngle: "The real farmhouse where outlaw Jesse James was born.", hiddenFact: "After he died, his mother sold rocks from his own grave as souvenirs. 25 cents each." },
    "P1-013": { whyAngle: "The only 19th-century wool mill in the country with its original machinery intact.", hiddenFact: "It ran on wool from sheep raised on this very farm." },
    "P1-014": { whyAngle: "A genuine Civil War battlefield you can walk across.", hiddenFact: "Soldiers pushed giant bales of hemp forward as moving shields — nicknamed the Battle of the Hemp Bales." },
    "P1-015": { whyAngle: "The official breeding ranch for every Budweiser Clydesdale in existence.", hiddenFact: "Every horse in every Budweiser commercial you've ever seen started here." },
    "P1-016": { whyAngle: "A river town with real 19th-century buildings still standing.", hiddenFact: "Lewis and Clark camped near here in June 1804." },
    "P1-017": { whyAngle: "A bike trail laid over an old railroad line.", hiddenFact: "It traces the exact stretch of river Lewis and Clark's expedition paddled by canoe." },
    "P1-018": { whyAngle: "Five secret acres of garden behind an insurance company's headquarters.", hiddenFact: "There's a giant working sundial and a real one-room schoolhouse tucked inside." },
    "P1-019": { whyAngle: "The football stadium with a giant stone letter watching over it.", hiddenFact: "Freshmen built the 'M' in 1927 out of leftover rock dug from the stadium's own construction." },
    "P1-020": { whyAngle: "Missouri's capitol, finished in 1917, ceiling covered in painted illusions.", hiddenFact: "The 3D-looking domes on the ceiling are actually completely flat paint." },
    "P1-021": { whyAngle: "A former prison that opened before the Alamo even fell.", hiddenFact: "Boxer Sonny Liston trained here as an inmate before becoming a heavyweight champion." },
    "P1-022": { whyAngle: "A whole preserved 1800s town, officially a National Historic Landmark.", hiddenFact: "Only about 50 people actually live in this historically significant town." },
    "P1-023": { whyAngle: "The tallest arch monument in the world.", hiddenFact: "It's exactly as wide as it is tall — 630 feet in both directions, on purpose." },
    "P1-024": { whyAngle: "A playground built entirely from salvaged buildings and factory scraps.", hiddenFact: "There's a real school bus welded to the roof, ten stories in the air." },
    "P1-025": { whyAngle: "America's oldest botanical garden that's never once closed.", hiddenFact: "Founded in 1859 by a businessman named Henry Shaw who just really loved plants." },
    "P1-026": { whyAngle: "One of the only major zoos in the country that's stayed completely free.", hiddenFact: "It's been free to enter since it opened in 1910." },
    "P1-027": { whyAngle: "Once the largest prehistoric city north of Mexico.", hiddenFact: "Around 1100 AD, more people lived here than in London at the time." },
    "P1-028": { whyAngle: "The only house Abraham Lincoln personally owned.", hiddenFact: "The staircase rail is original — the exact one his hand touched." },
    "P1-029": { whyAngle: "A presidential museum covering Lincoln's full story.", hiddenFact: "It holds the actual gloves he was carrying the night he was shot." },
    "P1-030": { whyAngle: "A museum tracing the full history of Illinois' stretch of Route 66.", hiddenFact: "The painted mural on its back wall is the largest Route 66 sign in the world." },
    "P1-031": { whyAngle: "A decommissioned prison now open as a museum.", hiddenFact: "It's the real filming location used in The Blues Brothers." },
    "P1-032": { whyAngle: "A national park combining beaches, dunes, and forest.", hiddenFact: "The sand actually sings — dragging your feet across it makes a squeaking sound from the quartz." },
    "P1-033": { whyAngle: "One of the most storied college campuses in the country.", hiddenFact: "The football stadium is nicknamed 'The House That Rockne Built.'" },
    "P1-034": { whyAngle: "A basilica with an extraordinary amount of stained glass.", hiddenFact: "Over 3,500 square feet of it, mostly shipped from France in the 1800s." },
    "P1-035": { whyAngle: "A car museum charting one company's whole history.", hiddenFact: "It has the actual carriage Lincoln rode in the night he was assassinated." },
    "P2-001": { whyAngle: "A working chocolate factory with a small museum attached.", hiddenFact: "You can watch real chocolate being made through the factory windows." },
    "P2-002": { whyAngle: "One of the oldest zoos in the country.", hiddenFact: "It traces back to the 1870s — over 150 years running." },
    "P2-003": { whyAngle: "An aerospace museum with genuinely rare retired aircraft.", hiddenFact: "It has the only surviving SR-71B Blackbird trainer on Earth — a plane fast enough to outrun missiles." },
    "P2-004": { whyAngle: "One of the largest classic car collections in North America.", hiddenFact: "It started as one couple's personal hobby that quietly got out of control." },
    "P2-005": { whyAngle: "Michigan's capitol, one of the first built fireproof after the Civil War.", hiddenFact: "The ceiling paintings are optical illusions — flat paint made to look three-dimensional." },
    "P2-006": { whyAngle: "A zoo with its own on-site animal hospital.", hiddenFact: "You can actually watch real checkups through observation windows." },
    "P2-007": { whyAngle: "A working cider mill named after a joke that stuck.", hiddenFact: "Everyone kept asking 'Uncle John, whaddaya want me to do next?' while building it — so that became the name." },
    "P2-008": { whyAngle: "A shopping district styled like a Bavarian village.", hiddenFact: "The whole town commits to the German theme, street signs included." },
    "P2-009": { whyAngle: "The world's largest Christmas store.", hiddenFact: "It's fully decorated for Christmas 361 days out of the year." },
    "P2-010": { whyAngle: "One of the last stretches of untouched old-growth forest left in Michigan.", hiddenFact: "Some of these pines are over 350 years old — older than the country itself." },
    "P2-011": { whyAngle: "A working fish hatchery you can walk right through.", hiddenFact: "The town is named after a fish, the Arctic grayling, that vanished from Michigan entirely by the 1930s." },
    "P2-012": { whyAngle: "Home to one of the largest crucifixes in the world.", hiddenFact: "It's carved from a single redwood tree, 55 feet tall." },
    "P2-013": { whyAngle: "A wildlife museum with over 100 realistic taxidermy displays.", hiddenFact: "Some of the animals here are species most people never see up close." },
    "P2-014": { whyAngle: "A sawmill site that was completely lost, then rediscovered decades later.", hiddenFact: "It sat forgotten in the woods for almost 100 years before anyone found it again." },
    "P2-015": { whyAngle: "A reconstructed 1715 fur-trading fort.", hiddenFact: "In 1763, attackers got inside by using a lacrosse game as a cover story to open the gate." },
    "P2-016": { whyAngle: "A restored lighthouse nicknamed 'Castle of the Straits.'", hiddenFact: "It was switched off in 1957 the moment the new Mackinac Bridge's lights made it unnecessary." },
    "P2-017": { whyAngle: "One of the longest suspension bridges in the world.", hiddenFact: "It's engineered to sway up to 35 feet sideways in high wind, completely on purpose." },
    "P2-018": { whyAngle: "A retired WWII icebreaker you can tour.", hiddenFact: "It was built specifically to smash through ice so wartime iron shipments could keep moving." },
    "P2-019": { whyAngle: "One of the darkest publicly accessible night skies in the Midwest.", hiddenFact: "It was one of the first ten places in the world officially named an International Dark Sky Park." },
    "P2-020": { whyAngle: "A largely undeveloped state park along Lake Michigan.", hiddenFact: "It protects over 26 miles of totally wild, roadless shoreline." },
    "P2-021": { whyAngle: "A lighthouse that was essentially forgotten for decades.", hiddenFact: "Historians had to rediscover and restore it before it could be climbed again." },
    "P2-022": { whyAngle: "A state park hiding a genuinely surprising ruin.", hiddenFact: "There's an 1859 lighthouse ruin tucked in here that most visitors never notice." },
    "P2-023": { whyAngle: "A lighthouse built on a wooden platform in the water instead of a normal tower.", hiddenFact: "It's one of the last crib-style lights left standing on the Great Lakes." },
    "P2-024": { whyAngle: "A restored 19th-century theater in a lumber town.", hiddenFact: "It first opened in 1877, burned, and was rebuilt just a decade later." },
    "P2-025": { whyAngle: "The small ferry connecting Cheboygan to Bois Blanc Island.", hiddenFact: "In hard winters, islanders drive across the frozen lake instead, on an ice road marked with dead Christmas trees." },
    "P2-026": { whyAngle: "The island's main township, home to about 70 year-round residents.", hiddenFact: "It didn't get electricity until 1964." },
    "P2-027": { whyAngle: "The island's small museum and library.", hiddenFact: "It preserves the story of a town with no traffic light and no chain stores at all." },
    "P2-028": { whyAngle: "A historic lighthouse now used as a private home.", hiddenFact: "A light has stood on this exact spot since 1829 — one of the oldest on the Great Lakes." },
    "P2-029": { whyAngle: "A protected natural area with cobble beaches and rare wildflowers.", hiddenFact: "It's home to Michigan's actual state wildflower, which barely grows anywhere else." },
    "P2-030": { whyAngle: "The tiny airport connecting Bois Blanc to the mainland.", hiddenFact: "In winter, it's sometimes the only reliable way on or off the island." },
    "P2-031": { whyAngle: "A real one-room schoolhouse, still in operation.", hiddenFact: "It's one of the last one-room schools left in the entire state." },
    "P2-032": { whyAngle: "Mackinac Island's state park, covering most of the island.", hiddenFact: "Cars have been banned across the whole island since 1898." },
    "P2-033": { whyAngle: "A restored 18th-century fort overlooking the harbor.", hiddenFact: "Soldiers stationed here in the 1800s got maybe one bath a week." },
    "P2-034": { whyAngle: "A natural limestone arch, 146 feet above the water.", hiddenFact: "No cars are allowed anywhere on this island, so you reach it on foot, bike, or horse carriage." },
    "P2-035": { whyAngle: "A museum covering Ojibwe history at the Straits.", hiddenFact: "It sits on the site of a 17th-century mission and burial ground." },
    "P3-001": { whyAngle: "The Soo Locks, where huge freighters get raised or lowered between two lakes.", hiddenFact: "Ships up to 1,000 feet long get lifted 21 feet right in front of you." },
    "P3-002": { whyAngle: "One of the largest waterfalls east of the Mississippi.", hiddenFact: "The water is genuinely root-beer colored — natural tree tannins, not pollution." },
    "P3-003": { whyAngle: "A museum covering Great Lakes shipwrecks.", hiddenFact: "It holds the actual bell from the Edmund Fitzgerald, lost with all 29 crew in 1975." },
    "P3-004": { whyAngle: "A 200-foot limestone formation you climb via staircase.", hiddenFact: "Local legend says an Ojibwe chief once used it as a lookout post." },
    "P3-005": { whyAngle: "A classic roadside gravity-illusion attraction.", hiddenFact: "It's one of several 'mystery spot' attractions that became popular across 1950s America." },
    "P3-006": { whyAngle: "A historic home that was a real stop on the Underground Railroad.", hiddenFact: "Over 1,000 people escaping slavery passed through here safely." },
    "P3-007": { whyAngle: "A protected arboretum with genuinely ancient trees.", hiddenFact: "Some of the oaks here started growing in the 1600s." },
    "P3-008": { whyAngle: "A dedicated public rose garden in a town nicknamed 'Rose City.'", hiddenFact: "Even the hospital and streets are named after roses." },
    "P3-009": { whyAngle: "A small-town museum with a surprisingly big collection.", hiddenFact: "It has a real Egyptian mummy on display." },
    "P3-010": { whyAngle: "The Indianapolis Motor Speedway, home of the Indy 500.", hiddenFact: "It's nicknamed 'The Brickyard' after the 3.2 million bricks laid in 1909." },
    "P3-011": { whyAngle: "The largest children's museum in the world.", hiddenFact: "It has real dinosaur fossils and an actual space capsule." },
    "P3-012": { whyAngle: "Indiana's state history museum.", hiddenFact: "The building is made from stone and brick sourced from every county in the state." },
    "P3-013": { whyAngle: "A museum of real Native American and Western art.", hiddenFact: "Nothing here is replica — it's all authentic." },
    "P3-014": { whyAngle: "A living history village frozen at the year 1836.", hiddenFact: "Staff stay in character no matter what you ask them — it's always 1836." },
    "P3-015": { whyAngle: "A zoo with a shared African savanna exhibit.", hiddenFact: "Giraffes and zebras roam one open space together, just like in the wild." },
    "P3-016": { whyAngle: "A conservatory running three climates under one roof.", hiddenFact: "Rainforest, desert, and a rotating garden, all a few steps apart." },
    "P3-017": { whyAngle: "A free museum with its own planetarium.", hiddenFact: "It covers the real 1980 tornado that tore through downtown Kalamazoo." },
    "P3-018": { whyAngle: "A nature preserve with an 1858 farmstead inside it.", hiddenFact: "It protects over 1,100 acres of forest, prairie, and wetland." },
    "P3-019": { whyAngle: "A zoo with a hands-on African safari section.", hiddenFact: "You can hand-feed a giraffe here." },
    "P3-020": { whyAngle: "A city museum with an unexpected extra feature.", hiddenFact: "There's a fully working 1928 carousel you can ride indoors." },
    "P3-021": { whyAngle: "One of the top-ranked sculpture parks in the country.", hiddenFact: "It holds over 300 sculptures across 158 acres." },
    "P3-022": { whyAngle: "A zoo inside a park donated to the city over a century ago.", hiddenFact: "The land was given specifically so it could stay free forever." },
    "P3-023": { whyAngle: "A popular Lake Michigan beach state park.", hiddenFact: "It's guarded by 'Big Red,' one of the most-photographed lighthouses on the lakes." },
    "P3-024": { whyAngle: "A Dutch-themed garden with a real working windmill.", hiddenFact: "The windmill is a genuine 250-year-old structure shipped over in pieces from the Netherlands." },
    "P3-025": { whyAngle: "A Lake Michigan beach at a harbor entrance.", hiddenFact: "Its lighthouse connects to shore by a raised catwalk built for storm safety." },
    "P3-026": { whyAngle: "A dune park where driving on the sand is actually legal.", hiddenFact: "It's the only place in Michigan where you can legally drive an ORV up real sand dunes." },
    "P3-027": { whyAngle: "A lighthouse with its original unpainted brick still showing.", hiddenFact: "Unlike most Great Lakes lighthouses, it was never painted white." },
    "P3-028": { whyAngle: "A lighthouse reachable only by a beach hike.", hiddenFact: "It's about 1.5 miles each way along the sand, no shortcut available." },
    "P3-029": { whyAngle: "A lighthouse at the very end of a long pier.", hiddenFact: "Walking all the way out to it is a local tradition." },
    "P3-030": { whyAngle: "One of the most famous dune systems in the country.", hiddenFact: "Ojibwe legend says it's a mother bear who swam Lake Michigan escaping a fire, waiting for cubs who never made it." },
    "P3-031": { whyAngle: "A scenic drive built specifically for dune overlooks.", hiddenFact: "Some viewpoints drop over 400 feet straight down to the lake." },
    "P3-032": { whyAngle: "A lighthouse guarding a genuinely tricky boat channel.", hiddenFact: "Boats have to thread a narrow gap between two piers to reach the harbor." },
    "P3-033": { whyAngle: "A real 1918 castle that started life as a model dairy farm.", hiddenFact: "The Beach Boys played concerts here before it became a wedding venue." },
    "P3-034": { whyAngle: "A state park known for a specific kind of fossil hunting.", hiddenFact: "You can find real 350-million-year-old fossilized coral here, called Petoskey stones." },
    "P3-035": { whyAngle: "A scenic 20-mile road known as the Tunnel of Trees.", hiddenFact: "Locals have fought for decades to keep it unpaved on purpose." },
    "P3-036": { whyAngle: "A museum and estate tied to a very specific invention.", hiddenFact: "It belonged to the family who invented the Ball glass canning jar." },
    "P3-037": { whyAngle: "A state park protecting ancient earthworks.", hiddenFact: "The mounds were built around 160 BC — nearly 2,000 years before Columbus." },
    "P3-038": { whyAngle: "A small-town gym turned movie filming location.", hiddenFact: "It's the actual gym used in the basketball movie Hoosiers." },
    "P3-039": { whyAngle: "Indiana's basketball hall of fame.", hiddenFact: "It sits in the town with the largest high school gym in the entire world." },
    "P3-041": { whyAngle: "A museum dedicated to Ford's Model T.", hiddenFact: "This town actually built its own cars before the Model T ever existed." },
    "P3-042": { whyAngle: "A walk honoring a small but historically important record label.", hiddenFact: "Legends like Louis Armstrong recorded some of their earliest music at this tiny label." },
    "P3-043": { whyAngle: "A national park honoring the Wright brothers' later work.", hiddenFact: "They came back to Dayton after Kitty Hawk to actually perfect controlled flight here." },
    "P3-044": { whyAngle: "The largest military aviation museum in the world, and free to enter.", hiddenFact: "It has an actual SR-71 Blackbird, the fastest jet ever built." },
    "P3-045": { whyAngle: "A history park with a rare original aircraft.", hiddenFact: "It has a real 1905 Wright Flyer III — the plane the Wrights called their first truly practical one." },
    "P3-046": { whyAngle: "A wildlife center combining a nature preserve and a working farm.", hiddenFact: "It manages hundreds of restored acres alongside real farm animals." },
    "P3-047": { whyAngle: "A children's museum built inside a converted mansion.", hiddenFact: "You can still spot pieces of the original house inside the exhibits." },
    "P3-048": { whyAngle: "A large outdoor sculpture park.", hiddenFact: "It has over 60 major sculptures spread across 105 acres." },
    "P3-049": { whyAngle: "The historic home of a future president, before he was famous.", hiddenFact: "Ulysses S. Grant built this log cabin himself, years before the Civil War." },
    "P3-050": { whyAngle: "A drive-through park with free-roaming elk and bison.", hiddenFact: "There are no fences between your car and the animals." },
    "P3-051": { whyAngle: "A state park built on the site of a demolished town.", hiddenFact: "The original town, Times Beach, was evacuated and bulldozed after a toxic contamination in the 1980s." },
    "P3-052": { whyAngle: "Missouri's largest and most famous show cave.", hiddenFact: "The owner gave farmers free barn paint jobs across 14 states just to advertise it — and basically invented the bumper sticker doing it." },
    "P3-053": { whyAngle: "One of the most beautiful caves in America, by most accounts.", hiddenFact: "Early explorers reportedly stole boats just to be the first to paddle it." },
    "P3-054": { whyAngle: "A preserved lead-mining complex with original machinery.", hiddenFact: "You can walk through the actual 1907 powerhouse, machinery still in place." },
    "P3-055": { whyAngle: "The real cave that inspired part of a famous novel.", hiddenFact: "Mark Twain based the cave scenes in Tom Sawyer on this exact cave." },
    "P3-056": { whyAngle: "Mark Twain's actual childhood home.", hiddenFact: "The real fence outside inspired the famous fence-painting scene in Tom Sawyer." },
    "P3-057": { whyAngle: "A museum in Walt Disney's childhood hometown.", hiddenFact: "Main Street USA at every Disney park in the world is modeled after this town's actual street." },
    "P3-058": { whyAngle: "The boyhood home of a major American general.", hiddenFact: "General John J. Pershing, who led all U.S. forces in WWI, grew up in this house." },
    "P3-059": { whyAngle: "A museum on the largest Civil War battle west of the Mississippi.", hiddenFact: "Over 30,000 soldiers fought here — across what's now ordinary Kansas City neighborhoods." },
    "P3-060": { whyAngle: "A recreated 1920s town with real and rebuilt historic buildings.", hiddenFact: "It includes an authentic Prohibition-era drugstore and one-room schoolhouse." },
    "P3-061": { whyAngle: "A local history museum with an unusual centerpiece.", hiddenFact: "The main exhibit is an entire real 1950s house you can walk through." },
    "P3-062": { whyAngle: "Kauffman Stadium, home of the Royals.", hiddenFact: "Its crown scoreboard and fountains have been running since it opened in 1973." },
    "P3-063": { whyAngle: "Arrowhead Stadium, home of the Chiefs.", hiddenFact: "It holds the Guinness World Record for loudest outdoor stadium: 142.2 decibels." },
    "P3-064": { whyAngle: "Kansas City's official botanical garden.", hiddenFact: "It includes the largest edible garden in the country, built to show people where food comes from." },
    "P3-065": { whyAngle: "A museum on a brutal single-day Civil War battle.", hiddenFact: "Over 200 soldiers were killed or wounded here in just a few hours." }
  };

  const EMMA_ICON_LABELS = {
    "flower": "Pretty Flowers",
    "volleyball": "Sports Spot",
    "cat": "Cats & Critters",
    "icecream": "Sweet Stop",
    "nails": "Everyday Life"
  };

  const EMMA_STOP_FACTS = {
    "P1-001": { whyGo: "A real stagecoach stop from the 1860s — this is what long-distance travel looked like before cars existed.", funFact: "Stagecoaches like this averaged about 5 mph. Your car ride today is faster than their whole trip." },
    "P1-002": { whyGo: "A real nature center with live animals and miles of trails right outside Kansas City.", funFact: "It's named for a man who never actually owned this land — the city just honored him with it after he passed." },
    "P1-003": { whyGo: "A free-standing natural history museum built right into an outdoor shopping center.", funFact: "You can see real dinosaur bones and then grab food court lunch in the same trip." },
    "P1-004": { whyGo: "A big public garden with a treehouse and butterfly garden built on old farmland.", funFact: "It used to be a private family farm before the city turned it into public space." },
    "P1-005": { whyGo: "A working turn-of-the-century farm you can actually walk through and touch.", funFact: "It's named after a real Overland Park police officer — the department's first ever killed on duty." },
    "P1-006": { // National WWI Museum and Memorial
      whyGo: "It's America's official World War I museum — people come from all over the world because nowhere else tells this story as completely.",
      funFact: "The glass bridge at the entrance crosses a field of 9,000 red poppies — each one stands for 1,000 soldiers who died in the war.",
      discovery: "Kansas Citians raised over $2.5 million in just ten days in 1919 to build the Liberty Memorial — the whole city decided together that this hill was the spot.",
      momDad: "Congress officially designated it the national WWI museum, and the view from the 217-foot Liberty Memorial Tower is the best skyline view in Kansas City."
    },
    "P1-007": { // Union Station Kansas City
      whyGo: "It was once one of the busiest train stations in America — at its peak during WWII, about a million travelers a year passed through this one building.",
      funFact: "The Grand Hall's ceiling is 95 feet high, and each of its three chandeliers weighs 3,500 pounds — as much as a car.",
      discovery: "It opened in 1914; by the 1980s it was nearly abandoned, until voters in BOTH Missouri and Kansas approved the first two-state tax in U.S. history to restore it.",
      momDad: "The 1999 restoration is one of the great building-rescue stories in the country — and there's a science center inside."
    },
    "P1-008": { // Negro Leagues Baseball Museum
      whyGo: "This is the only museum in the world dedicated to the Negro Leagues — the story of players who were shut out of the majors and built something legendary anyway.",
      funFact: "The museum sits at 18th & Vine, the same jazz-and-baseball neighborhood where the leagues were founded in 1920 at a YMCA a few blocks away.",
      discovery: "It started in 1990 in a tiny one-room office, largely thanks to former player Buck O'Neil telling the story until the world finally listened.",
      momDad: "Buck O'Neil is one of the great storytellers in sports history — his statue is inside, and the field of bronze players is unforgettable."
    },
    "P1-009": { // Arabia Steamboat Museum
      whyGo: "You get to see 200 tons of frontier cargo — dishes, tools, boots, even preserved food — from a steamboat that sank in 1856.",
      funFact: "The pickles recovered from the wreck were still sealed — and reportedly still edible — after 130 years underground.",
      discovery: "This one's amazing: the Missouri River moved over time, so a family found the sunken boat in 1988 under a Kansas CORNFIELD, half a mile from the water.",
      momDad: "It's one of the best-preserved time capsules of 1850s frontier life anywhere — everyday objects, not fancy museum pieces."
    },
    "P1-010": { whyGo: "A hands-on science museum built inside Union Station's old train shed.", funFact: "The exact space kids run around in today used to be packed with steam trains." },
    "P1-011": { whyGo: "A historic jail turned museum, tied to a major event in American religious history.", funFact: "The walls were 4 feet thick — 2 feet of stone plus 2 feet of solid oak." },
    "P1-012": { whyGo: "The actual farmhouse where outlaw Jesse James was born in 1847.", funFact: "After he died, his own mother sold souvenir rocks from his grave for 25 cents each." },
    "P1-013": { whyGo: "The only 19th-century wool mill in the country with its original machinery still working.", funFact: "It processed wool from sheep raised on this exact farm." },
    "P1-014": { whyGo: "A real Civil War battlefield you can walk across.", funFact: "Soldiers rolled giant bales of hemp forward as moving shields during the fighting." },
    "P1-015": { whyGo: "The official breeding ranch for every Budweiser Clydesdale horse in existence.", funFact: "Every single Clydesdale in every Budweiser commercial was born on this one property." },
    "P1-016": { whyGo: "A historic river town along the Katy Trail with real 19th-century buildings still standing.", funFact: "Lewis and Clark camped near here in June 1804." },
    "P1-017": { whyGo: "A flat, scenic bike trail built along an old railroad line.", funFact: "It follows the exact route the Lewis and Clark expedition paddled by canoe." },
    "P1-018": { whyGo: "A five-acre hidden garden tucked behind an insurance company's offices.", funFact: "There's a giant working sundial and a real one-room schoolhouse inside." },
    "P1-019": { whyGo: "Mizzou's football stadium and the giant stone 'M' on the hill above it.", funFact: "The M was built in 1927 by freshman students using leftover rock from the stadium's own construction." },
    "P1-020": { whyGo: "Missouri's state capitol, finished in 1917 with hand-painted ceiling murals.", funFact: "The ceiling art is a flat-painted optical illusion designed to look three-dimensional." },
    "P1-021": { whyGo: "A former state prison, open since 1836 and once called one of the toughest in the country.", funFact: "Boxer Sonny Liston trained here as an inmate before becoming a heavyweight champion." },
    "P1-022": { whyGo: "An entire preserved 1800s village that's now a National Historic Landmark.", funFact: "Only about 50 people actually live in this officially historic town." },
    "P1-023": {
      whyGo: "The tallest arch monument in the world, and one of America's most recognized landmarks.",
      funFact: "It's exactly as wide as it is tall — 630 feet both ways.",
      discovery: "Architect Eero Saarinen won a 1947 design competition to build a monument to westward expansion; it was finished October 28, 1965.",
      momDad: "The tram pods to the top are tiny egg-shaped capsules from the 1960s — the engineering is half the fun."
    },
    "P1-024": {
      whyGo: "A wild, climbable playground built out of salvaged buildings and old factory parts.",
      funFact: "There's a real school bus welded to the roof, ten stories up.",
      discovery: "Artist Bob Cassilly opened it in 1997, building almost everything from salvaged city pieces — old bridges, chimneys, tiles, and factory parts.",
      momDad: "It's consistently ranked among the most creative reuse-of-a-building projects in the country — and adults are absolutely allowed to climb."
    },
    "P1-025": { whyGo: "The oldest continuously operating botanical garden in the United States.", funFact: "It was founded in 1859 by a local businessman named Henry Shaw." },
    "P1-026": { whyGo: "One of the few major zoos in the country that's completely free to enter.", funFact: "It's been free since it opened back in 1910." },
    "P1-027": {
      whyGo: "The site of the largest prehistoric city north of Mexico.",
      funFact: "Around 1100 AD, more people lived here than in London at the time.",
      discovery: "Native nations always knew of the mounds; archaeologists later confirmed the city's massive scale, and UNESCO named it a World Heritage Site in 1982.",
      momDad: "It's one of only about two dozen UNESCO World Heritage Sites in the entire U.S. — same list as the Grand Canyon and Statue of Liberty."
    },
    "P1-028": { whyGo: "The only house Abraham Lincoln ever personally owned.", funFact: "The staircase railing inside is the original — the exact one Lincoln used." },
    "P1-029": { whyGo: "A major presidential museum covering Lincoln's full life and assassination.", funFact: "It has the actual gloves Lincoln was carrying the night he was shot." },
    "P1-030": { whyGo: "A museum covering the full history of Route 66 through Illinois.", funFact: "The mural on the back wall is the largest painted Route 66 sign in the world." },
    "P1-031": { whyGo: "A decommissioned 19th-century prison, now a museum and tour site.", funFact: "It's the actual prison used as a filming location in The Blues Brothers." },
    "P1-032": {
      whyGo: "A national park with real sand dunes, beaches, and forest all in one place.",
      funFact: "The sand actually 'sings' — dragging your feet across it makes a squeaky sound from the quartz grains.",
      discovery: "Scientist Henry Cowles studied plant life here in the 1890s and basically helped invent the science of ecology on these dunes.",
      momDad: "Acre for acre it's one of the most biodiverse parks in the national park system — over 1,100 plant species in a park you can cross in a day."
    },
    "P1-033": { whyGo: "One of the most famous college campuses and football programs in the country.", funFact: "The football stadium is nicknamed 'The House That Rockne Built.'" },
    "P1-034": { whyGo: "A stunning basilica right on Notre Dame's campus.", funFact: "It has over 3,500 square feet of stained glass, most shipped from France in the 1800s." },
    "P1-035": { whyGo: "A car museum tracing one company's full history from wagons to automobiles.", funFact: "It holds the actual carriage Lincoln rode in the night he was assassinated." },
    "P2-001": { whyGo: "A real chocolate factory with a small museum of vintage candy-making equipment.", funFact: "You can watch chocolate get made through factory viewing windows." },
    "P2-002": { whyGo: "One of the oldest zoos in the country, dating back to the 1870s.", funFact: "It's been running continuously for over 150 years." },
    "P2-003": { whyGo: "An aerospace museum with real retired military and space aircraft.", funFact: "It has the only SR-71B Blackbird trainer left on Earth — a jet that could outrun missiles." },
    "P2-004": { whyGo: "One of the largest classic car museums in North America.", funFact: "It started as one couple's personal car collection that just kept growing." },
    "P2-005": { whyGo: "Michigan's state capitol, one of the first built after the Civil War to be fireproof.", funFact: "The interior ceiling paintings are flat illusions made to look three-dimensional." },
    "P2-006": { whyGo: "A city zoo with its own on-site veterinary hospital.", funFact: "Visitors can watch real animal checkups through observation windows." },
    "P2-007": { whyGo: "A working cider mill and family farm that's a Michigan fall tradition.", funFact: "It's named 'Uncle John's' because that's what everyone called the family member who ran it." },
    "P2-008": { whyGo: "A shopping district styled to look like a Bavarian village in Germany.", funFact: "The whole town leans into the German theme — street signs included." },
    "P2-009": {
      whyGo: "The world's largest Christmas store.",
      funFact: "It's fully decorated for Christmas 361 days a year.",
      discovery: "Wally Bronner started it in 1945 painting signs and displays for nearby towns, and it just never stopped growing.",
      momDad: "Outside there's a replica of the Silent Night Chapel from Oberndorf, Austria — where that carol was first sung in 1818."
    },
    "P2-010": {
      whyGo: "One of the last patches of untouched old-growth forest in Michigan.",
      funFact: "Some of these pine trees are over 350 years old — older than the United States.",
      discovery: "Karen Hartwick donated the land in 1927 to honor her husband — on the condition the big trees never be cut.",
      momDad: "The logging museum shows how white pine from forests like this literally built Chicago and the Midwest's cities."
    },
    "P2-011": { whyGo: "A real fish hatchery you can walk through and see trout up close.", funFact: "The town is named after a fish, the Arctic grayling, that actually disappeared from Michigan by the 1930s." },
    "P2-012": { whyGo: "Home to one of the largest crucifixes in the world.", funFact: "It's carved from a single redwood tree and stands 55 feet tall." },
    "P2-013": { whyGo: "A wildlife museum with over 100 realistic taxidermy displays.", funFact: "Some of the animals on display are species most visitors have never seen up close." },
    "P2-014": { whyGo: "A historic sawmill site that was completely lost and rediscovered decades later.", funFact: "It was hidden and forgotten in the woods for almost 100 years." },
    "P2-015": {
      whyGo: "A reconstructed 1715 fur-trading fort with costumed reenactors.",
      funFact: "In 1763, attackers got inside by starting a lacrosse game outside the gate.",
      discovery: "The French built it in 1715 to control the fur trade at the Straits; the British took it over, then moved the whole fort to Mackinac Island.",
      momDad: "You can often watch the live archaeological dig in progress — real artifacts coming out of the ground."
    },
    "P2-016": {
      whyGo: "A restored 1892 lighthouse known as the 'Castle of the Straits.'",
      funFact: "It was shut off in 1957 because the brand-new Mackinac Bridge's lights made it unnecessary.",
      discovery: "The Straits were so dangerous for ships that Congress funded a fog signal here first (1890) — the light tower followed two years later.",
      momDad: "You can climb the tower for one of the best straight-on views of the Mackinac Bridge anywhere."
    },
    "P2-017": {
      whyGo: "The Mackinac Bridge, one of the longest suspension bridges in the world.",
      funFact: "It's engineered to sway up to 35 feet sideways in high wind — completely on purpose.",
      discovery: "Engineers said for decades it couldn't be done — designer David Steinman finally proved them wrong, and it opened November 1, 1957.",
      momDad: "It's the longest suspension bridge between anchorages in the Western Hemisphere — and driving it is the whole show."
    },
    "P2-018": { whyGo: "A retired WWII icebreaker ship you can tour.", funFact: "It was built specifically to smash ice so war supplies could keep moving across the Great Lakes." },
    "P2-019": {
      whyGo: "One of the darkest publicly accessible night skies in the Midwest.",
      funFact: "It was one of the first ten parks in the world named an International Dark Sky Park.",
      discovery: "Locals realized the Straits' low light pollution was itself worth protecting — so they preserved darkness the way parks usually preserve land.",
      momDad: "This far north, the aurora borealis (northern lights) makes genuine appearances — worth checking the forecast the night you're near."
    },
    "P2-020": { whyGo: "A large, mostly undeveloped state park along Lake Michigan.", funFact: "It has over 26 miles of totally wild, roadless shoreline." },
    "P2-021": { whyGo: "A historic lighthouse that visitors can climb.", funFact: "It was essentially forgotten for decades before historians rediscovered and restored it." },
    "P2-023": { whyGo: "A distinctive crib-style light marking the entrance to Cheboygan's harbor.", funFact: "It's built on a square wooden platform in the water, not a standard tower." },
    "P2-024": { whyGo: "A restored 19th-century theater in a small lumber town.", funFact: "It first opened in 1877, burned down, and was rebuilt just a decade later." },
    "P2-025": {
      whyGo: "The small ferry that connects Cheboygan to Bois Blanc Island.",
      funFact: "In hard winters, islanders drive across the frozen lake instead, on an ice road marked with old Christmas trees.",
      discovery: "The Plaunt family has been running boats between Cheboygan and Bois Blanc for generations — it's a true family operation.",
      momDad: "Bois Blanc didn't even have electricity until 1964, when a cable was run under the water — this crossing is how everything reaches the island."
    },
    "P2-026": {
      whyGo: "The main township of Bois Blanc Island, home to about 70 year-round residents.",
      funFact: "The island didn't get electricity until 1964.",
      discovery: "Electricity only reached the island in 1964, through a long underwater cable from the mainland.",
      momDad: "In hard winters an ice road forms to the mainland, marked with evergreen trees frozen into the ice — islanders drive across the lake."
    },
    "P2-027": { whyGo: "The island's small museum and library, preserving its local history.", funFact: "It documents a town with no traffic light and no chain stores of any kind." },
    "P2-028": { whyGo: "A historic lighthouse on Bois Blanc Island, now a private residence.", funFact: "A light has stood on this exact spot since 1829 — one of the oldest on the Great Lakes." },
    "P2-029": { whyGo: "A protected natural area on the island with cobble beaches and rare wildflowers.", funFact: "It's home to Michigan's actual state wildflower, which grows almost nowhere else." },
    "P2-030": { whyGo: "The small island airport that connects Bois Blanc to the mainland.", funFact: "In winter, it's sometimes the only reliable way on or off the island." },
    "P2-031": { whyGo: "A real one-room schoolhouse still operating on the island.", funFact: "It's one of the last one-room schools left in the entire state of Michigan." },
    "P2-032": { whyGo: "Mackinac Island's state park, covering most of the island.", funFact: "Cars have been banned on the whole island since 1898." },
    "P2-033": { whyGo: "A restored 18th-century fort overlooking the harbor.", funFact: "Soldiers stationed here in the 1800s got maybe one bath a week." },
    "P2-034": { whyGo: "A natural limestone arch on Mackinac Island, 146 feet above the water.", funFact: "Since cars are banned, you can only reach it by walking, biking, or horse carriage." },
    "P2-035": { whyGo: "A museum covering Ojibwe history and culture at the Straits.", funFact: "It sits on the site of a 17th-century mission and burial ground." },
    "P3-001": {
      whyGo: "The Soo Locks, where massive freighters get raised and lowered between two Great Lakes.",
      funFact: "Ships up to 1,000 feet long get lifted 21 feet right in front of you.",
      discovery: "Before the first lock opened in 1855, ships had to be dragged around the St. Marys rapids on rollers — it could take weeks.",
      momDad: "The free observation platform puts you close enough to wave at freighter crews — check the shipping schedule for arrival times."
    },
    "P3-002": {
      whyGo: "Tahquamenon Falls, one of the largest waterfalls east of the Mississippi.",
      funFact: "The water is genuinely root-beer colored — stained naturally by tree tannins, not pollution.",
      discovery: "The river appears in Longfellow's 1855 poem 'The Song of Hiawatha' — Hiawatha builds his canoe by these waters.",
      momDad: "There's a brewery literally inside the state park at the Upper Falls — one of the only ones in any state park in America."
    },
    "P3-003": {
      whyGo: "A museum covering Great Lakes shipwrecks, including a famous one.",
      funFact: "It has the actual bell from the Edmund Fitzgerald, the freighter lost with all 29 crew in 1975.",
      discovery: "The Fitzgerald sank just 17 miles from this point; the wreck was located within days by aircraft, resting 530 feet down.",
      momDad: "If you know the Gordon Lightfoot song, standing in front of that bell is genuinely moving."
    },
    "P3-004": { whyGo: "A 200-foot limestone rock formation you can climb via staircase.", funFact: "Local legend says an Ojibwe chief once used it as a lookout post." },
    "P3-005": { whyGo: "A classic roadside attraction built around a gravity optical illusion.", funFact: "It's one of several 'mystery spot' attractions that became popular across America in the 1950s." },
    "P3-006": { whyGo: "A historic home that was a major stop on the Underground Railroad.", funFact: "Over 1,000 people escaping slavery passed through here safely." },
    "P3-007": { whyGo: "A large protected arboretum with some genuinely ancient trees.", funFact: "Some of the oak trees here started growing in the 1600s." },
    "P3-008": { whyGo: "A dedicated public rose garden in a town nicknamed 'Rose City.'", funFact: "Even the local streets and hospital are named after roses." },
    "P3-009": { whyGo: "A small-town history museum with a surprisingly big collection.", funFact: "It has a real Egyptian mummy on display." },
    "P3-010": { whyGo: "The Indianapolis Motor Speedway, home of the Indy 500.", funFact: "The track is nicknamed 'The Brickyard' after the 3.2 million bricks laid down in 1909." },
    "P3-011": { whyGo: "The largest children's museum in the world.", funFact: "It has real dinosaur fossils and an actual space capsule on display." },
    "P3-012": { whyGo: "Indiana's state history museum.", funFact: "The building itself is made from stone and brick sourced from every county in the state." },
    "P3-013": { whyGo: "A museum of real Native American and Western art and artifacts.", funFact: "None of it is replica — everything on display is authentic." },
    "P3-014": { whyGo: "A living history village frozen at the year 1836.", funFact: "Every staff member stays in character and insists it's still 1836." },
    "P3-015": { whyGo: "A zoo with a large shared African savanna exhibit.", funFact: "Giraffes and zebras roam together in one open space, just like in the wild." },
    "P3-016": { whyGo: "A conservatory with three different climate zones under one roof.", funFact: "It runs a rainforest, a desert, and a rotating garden all a few steps apart." },
    "P3-017": { whyGo: "A free local museum with its own planetarium.", funFact: "It covers the real 1980 tornado that tore straight through downtown Kalamazoo." },
    "P3-018": { whyGo: "A large nature preserve with an 1858 farmstead inside it.", funFact: "It protects over 1,100 acres of forest, prairie, and wetland." },
    "P3-019": { whyGo: "A zoo with a hands-on African safari section.", funFact: "You can hand-feed a giraffe here." },
    "P3-020": { whyGo: "A city history museum with an unusual permanent feature.", funFact: "There's a fully working 1928 carousel you can ride indoors." },
    "P3-021": { whyGo: "One of the top-ranked sculpture parks in the entire country.", funFact: "It holds over 300 sculptures across 158 acres." },
    "P3-022": { whyGo: "A zoo inside a public park donated to the city over a century ago.", funFact: "The land was given specifically so it could stay free for everyone forever." },
    "P3-023": { whyGo: "A popular Lake Michigan beach state park.", funFact: "It's guarded by 'Big Red,' one of the most-photographed lighthouses on the Great Lakes." },
    "P3-024": { whyGo: "A Dutch-themed garden with a real working windmill.", funFact: "The windmill is a genuine 250-year-old structure shipped over from the Netherlands in pieces." },
    "P3-025": { whyGo: "Another popular Lake Michigan beach at a harbor entrance.", funFact: "Its lighthouse is connected to shore by a raised catwalk built for storm safety." },
    "P3-026": { whyGo: "A dune park where driving ORVs on the sand is actually legal.", funFact: "It's the only place in Michigan where you can legally drive a dune buggy up real sand dunes." },
    "P3-027": { whyGo: "A historic lighthouse with its original unpainted brick tower.", funFact: "Unlike most Great Lakes lighthouses, it was never painted white." },
    "P3-028": { whyGo: "A remote lighthouse reachable only by a beach hike.", funFact: "It's about 1.5 miles each way along the sand, with no shortcut." },
    "P3-029": { whyGo: "A lighthouse at the very end of a long pier into Lake Michigan.", funFact: "Walking out to it is one of the classic things to do in town." },
    "P3-030": { whyGo: "Sleeping Bear Dunes, one of the most famous dune systems in the country.", funFact: "Local legend says the dune is a mother bear who swam Lake Michigan escaping a fire, waiting for cubs who never made it." },
    "P3-031": { whyGo: "A scenic drive built specifically for dune views.", funFact: "Some overlooks along it drop over 400 feet straight down to the lake." },
    "P3-032": { whyGo: "A lighthouse guarding one of the trickiest boat channels on the Great Lakes.", funFact: "Boats have to thread a narrow gap between two piers to reach the harbor." },
    "P3-033": { whyGo: "A real 1918 castle that started as a model dairy farm.", funFact: "The Beach Boys once played concerts here before it became a wedding venue." },
    "P3-034": { whyGo: "A state park known for a specific kind of fossil hunting.", funFact: "You can find real 350-million-year-old fossilized coral here, called Petoskey stones." },
    "P3-035": { whyGo: "A scenic 20-mile drive known as the Tunnel of Trees.", funFact: "Locals have fought for decades to keep the road unpaved and untouched." },
    "P3-036": { whyGo: "A museum and garden estate tied to a famous invention.", funFact: "It belonged to the family who invented the Ball glass canning jar." },
    "P3-037": { whyGo: "A state park protecting ancient Native American earthworks.", funFact: "The mounds were built around 160 BC — nearly 2,000 years before Columbus." },
    "P3-038": { whyGo: "A small-town gym that became a movie filming location.", funFact: "It's the actual gym used in the basketball movie Hoosiers." },
    "P3-039": { whyGo: "Indiana's basketball hall of fame.", funFact: "It's located in the town with the largest high school gymnasium in the world." },
    "P3-041": { whyGo: "A museum dedicated to Ford's Model T.", funFact: "This town actually built its own cars before the Model T existed." },
    "P3-042": { whyGo: "A walk honoring a small but historically important record label.", funFact: "Legends like Louis Armstrong recorded some of their earliest music at this tiny label." },
    "P3-043": { whyGo: "A national park honoring the Wright brothers' early flight work.", funFact: "They came back to Dayton after Kitty Hawk to actually perfect controlled flight here." },
    "P3-045": { whyGo: "A history park with a rare aviation artifact.", funFact: "It has a real 1905 Wright Flyer III, the plane the Wrights called their first practical aircraft." },
    "P3-046": { whyGo: "A wildlife center combining a nature preserve and a working farm.", funFact: "It manages hundreds of restored acres alongside real farm animals." },
    "P3-047": { whyGo: "A hands-on children's museum built inside a converted mansion.", funFact: "You can still spot pieces of the original house inside some exhibit rooms." },
    "P3-048": { whyGo: "A large outdoor sculpture park.", funFact: "It has over 60 major sculptures spread across 105 acres." },
    "P3-049": { whyGo: "The historic home and farm of a future U.S. president and general.", funFact: "Ulysses S. Grant built the log cabin here himself, years before becoming famous." },
    "P3-050": { whyGo: "A drive-through park with free-roaming elk and bison.", funFact: "There are no fences between your car and the animals." },
    "P3-051": { whyGo: "A state park built on the site of a demolished, contaminated town.", funFact: "The original town, Times Beach, was evacuated and bulldozed in the 1980s." },
    "P3-052": { whyGo: "Missouri's largest and most famous show cave.", funFact: "The owner offered farmers free barn paint jobs across 14 states just to advertise it — and basically invented the bumper sticker doing it." },
    "P3-053": { whyGo: "One of the most beautiful caves in America, according to experts.", funFact: "Early explorers reportedly stole boats just to be the first to paddle it." },
    "P3-054": { whyGo: "A preserved lead-mining site with original machinery.", funFact: "You can walk through the actual 1907 powerhouse, machinery still in place." },
    "P3-059": { whyGo: "A museum covering the largest Civil War battle west of the Mississippi.", funFact: "Over 30,000 soldiers fought here — across what's now ordinary Kansas City neighborhoods." },
    "P3-060": { whyGo: "A recreated 1920s town with real and rebuilt historic buildings.", funFact: "It includes an authentic Prohibition-era drugstore and one-room schoolhouse." },
    "P3-061": { whyGo: "A local history museum with an unusual centerpiece exhibit.", funFact: "The main exhibit is an entire real 1950s house you can walk through." },
    "P3-064": { whyGo: "Kansas City's official botanical garden.", funFact: "It includes the largest edible garden in the country, built to teach people where food comes from." },
    "P3-065": { whyGo: "A museum covering a brutal single-day Civil War battle.", funFact: "Over 200 soldiers were killed or wounded here in just a few hours of fighting." },
    "P2-022": { whyGo: "A state park hiding an unexpected historic ruin.", funFact: "There are 1859 lighthouse ruins tucked in the park that most visitors drive right past." },
    "P3-044": { whyGo: "The largest military aviation museum in the world, and it's completely free.", funFact: "It has an actual SR-71 Blackbird, the fastest jet-powered aircraft ever built." },
    "P3-055": { whyGo: "The real cave that inspired part of a famous American novel.", funFact: "Mark Twain based the spooky cave scenes in Tom Sawyer on this exact cave." },
    "P3-056": { whyGo: "Mark Twain's actual childhood home.", funFact: "The real fence outside inspired the famous fence-painting scene in Tom Sawyer." },
    "P3-057": { whyGo: "A museum in Walt Disney's childhood hometown.", funFact: "Main Street USA at every Disney park in the world is modeled after this town's actual street." },
    "P3-058": { whyGo: "The boyhood home of a major American general.", funFact: "General John J. Pershing, who led all U.S. forces in WWI, grew up in this house." },
    "P3-062": { whyGo: "Kauffman Stadium, home of the Kansas City Royals.", funFact: "Its crown scoreboard and fountains have been running since it opened in 1973." },
    "P3-063": { whyGo: "Arrowhead Stadium, home of the Kansas City Chiefs.", funFact: "It holds the Guinness World Record for loudest outdoor stadium: 142.2 decibels." }
  };

  function emmaPopupContent(item) {
    const curated = EMMA_STOP_FACTS[item.id];
    const seed = item.id || item.title || "stop";
    const category = (item.category || "").toLowerCase();
    const angle = item.profiles?.emma || "";
    const whyGo = angle || item.summary || "People come here because it shows how life really works in this part of the country.";
    const funFact = item.why || item.summary || "";
    const discoveryBank = [
      "How was it discovered? Usually the same way: someone traveling through needed a stop, told everyone, and it stuck.",
      "Places like this usually got found by travelers, traders, or locals who knew the land — ask what came first, the road or the town.",
      "Discovery story: look for a founding date on a sign or plaque — then figure out who would have been here first."
    ];
    const discovery = discoveryBank[stableIndex(`${seed}-disc`, discoveryBank.length)];
    const momDadBank = [
      "Mom and Dad will like that this one has a real story behind it, not just a photo op.",
      "This is the kind of stop Mom and Dad point at on the way past and say 'we should have stopped there' — so stop.",
      "Mom and Dad angle: it breaks up the drive AND gives everyone something to talk about for the next twenty miles.",
      "Parents love a stop where the kids learn something without noticing — this is one of those.",
      "Mom and Dad will appreciate that this is a real place locals actually use, not a tourist trap."
    ];
    const momDad = item.profiles?.momdad || item.why || momDadBank[stableIndex(`${seed}-momdad`, momDadBank.length)];
    const jokeBank = [
      `Why did the family stop at ${item.title}? Because the car said it was "wheely" worth it.`,
      `${item.title} called — it said you're going to have an ice day. Wait, wrong stop.`,
      `Knock knock. Who's there? ${(item.title || "This stop").split(" ")[0]}. That's it, that's the whole joke — now go look at it.`,
      `What did the GPS say about ${item.title}? "I've been re-routing everyone here for years."`
    ];
    const joke = jokeBank[stableIndex(`${seed}-joke`, jokeBank.length)];
    if (curated) {
      return {
        whyGo: curated.whyGo || whyGo,
        funFact: curated.funFact || funFact,
        discovery: curated.discovery || discovery,
        momDad: curated.momDad || momDad,
        joke
      };
    }
    return { whyGo, funFact, discovery, momDad, joke };
  }

  const ELIETTE_GROSS_FUNNY = {
    "P1-009": "Gross but true: pickles pulled out of the wrecked steamboat were still sealed after 130 years underground — and reportedly still edible. People have tasted them.",
    "P1-006": "Gross but true: WWI soldiers shared their trenches with rats the size of cats and itchy lice — museums like this one don't hide that part.",
    "P1-021": "Creepy but true: the old prison's dungeon cells had no light at all — tour guides turn off the lamps so you can feel one second of it.",
    "P1-023": "Funny but true: the Arch sways up to 18 inches in wind ON PURPOSE — and the tram pods to the top are tiny 1960s egg capsules that creak the whole way.",
    "P1-024": "Funny but true: there's a full school bus hanging off the roof, and the 10-story slide leaves your legs shaking like jelly.",
    "P1-027": "Gross but true: archaeologists learn the most from ancient trash pits and toilets — a lot of what we know about Cahokia came out of what people threw away.",
    "P1-032": "Funny but true: the dune sand squeaks and 'sings' when you drag your feet — everyone looks ridiculous doing it and everyone does it anyway.",
    "P2-009": "Funny but true: it's Christmas here 361 days a year — employees hear the same carols all summer long.",
    "P2-010": "Gross but true: old-growth pines ooze sticky sap that loggers called 'pitch' — it glued their clothes together and never washed out.",
    "P2-015": "Gross but true: archaeologists here have spent decades digging up 1700s privies — old toilets — because that's where the best artifacts hide.",
    "P2-016": "Funny but true: this whole lighthouse got retired because a BRIDGE with lights showed up next door and stole its job.",
    "P2-017": "Wild but true: the bridge deck can swing up to 35 feet sideways in high wind — completely on purpose, completely safe, completely terrifying to think about.",
    "P2-025": "Funny but true: in winter, islanders skip the ferry and drive across the frozen lake on an ice road marked with old Christmas trees frozen upright.",
    "P2-026": "Funny but true: the island got electricity in 1964 — before that, homework happened by lantern.",
    "P2-032": "Gross but true: Mackinac Island has no cars but around 500 horses — which together produce literal TONS of manure every day. Someone's whole job is scooping it.",
    "P2-033": "Gross but true: soldiers at the fort got one bath a week at best, and their wool uniforms were never really washed. The 1800s smelled.",
    "P3-001": "Wild but true: fish sometimes ride through the locks with the ships — a free 21-foot elevator between two Great Lakes.",
    "P3-002": "Funny but true: the waterfall is root-beer colored with tan foam on top — it genuinely looks like a giant root beer float, but it's just tree tannins.",
    "P3-003": "Eerie but true: the lake is so cold and deep that shipwrecks down there barely decay — some wrecks over a century old still look nearly new."
  };

  const ELIETTE_COOL_FACTS = {
    "P1-001": "This is the only stop left on the entire Santa Fe Trail where you can still ride an actual stagecoach — every other one is gone.",
    "P1-006": "The glass bridge at the entrance crosses 9,000 red poppies — and each single poppy stands for 1,000 people who died in WWI. Do the math while you're standing on it.",
    "P1-007": "In 1933, gangsters ambushed FBI agents right outside these doors in the 'Union Station Massacre' — marks attributed to the gunfight can still be found near the east entrance.",
    "P1-008": "Three women played professional baseball WITH the men in the Negro Leagues — Toni Stone once got a hit off the legendary Satchel Paige.",
    "P1-009": "A whole steamboat was found buried 45 feet under a Kansas CORNFIELD — the river had moved half a mile since it sank in 1856. The pickles on board were still sealed and reportedly still edible.",
    "P1-017": "You're standing on the longest rail-trail in America — about 240 miles of old railroad turned into a path you could walk almost across the entire state.",
    "P1-020": "The famous murals inside scandalized Missouri politicians when unveiled — the artist painted real corruption and rough frontier life instead of flattering scenes, and some wanted them destroyed.",
    "P1-021": "This prison is older than the fall of the Alamo — and boxing champion Sonny Liston learned to fight inside these walls as an inmate.",
    "P1-022": "The entire village is a National Historic Landmark — and only about 50 people live in it. The whole town is basically a museum people happen to live inside.",
    "P1-023": "The Arch is exactly as wide as it is tall — 630 feet both ways — and on the final day of construction, crews sprayed fire hoses on the steel to shrink it enough to fit the last piece in.",
    "P1-024": "Almost everything you climb on was salvaged from demolished buildings around St. Louis — old bridges, chimneys, even airplane parts. There's a real school bus hanging off the roof.",
    "P1-027": "A thousand years ago, this city was BIGGER than London. And its people built a circle of giant posts — 'Woodhenge' — that worked as a sun calendar, like an American Stonehenge made of wood.",
    "P1-028": "This is the only house Abraham Lincoln ever owned — and the stair rail is the original. You can put your hand exactly where his was.",
    "P1-029": "The museum has the actual gloves Lincoln was carrying the night he was assassinated at Ford's Theatre — still stained. One of the most haunting real objects in any American museum.",
    "P1-032": "In 2013 a moving dune here swallowed a 6-year-old boy into a hidden hole — he survived over three hours buried in sand, and scientists discovered a brand-new dune phenomenon trying to explain how the hole existed.",
    "P2-003": "The Air Zoo has the only surviving SR-71B Blackbird trainer on Earth — the Blackbird family are the fastest jets ever built, able to outrun missiles by simply accelerating.",
    "P2-004": "One of the biggest car museums in North America — hundreds of cars — and it's all on an old farm because one couple's hobby completely got out of hand.",
    "P2-009": "It's Christmas here 361 days a year, and outside stands a replica of the tiny Austrian chapel where 'Silent Night' was first sung in 1818.",
    "P2-010": "These white pines are 350+ years old and taller than a 15-story building — they were already giants before the United States existed, and they survived only because one family refused to let them be cut.",
    "P2-014": "This 1790s sawmill site was completely LOST for about a century — until a local history buff rediscovered it in 1972 and it was dug back out of the forest.",
    "P2-015": "In 1763, warriors got inside this fort using a lacrosse game as the trick — the ball 'accidentally' went over the wall, and when the gates opened, the game became an attack. Also: archaeologists here dig up 250-year-old toilets on purpose, because that's where the best artifacts hide.",
    "P2-016": "This lighthouse was fired from its job by a bridge — when the Mackinac Bridge opened in 1957, its lights guided ships better than the lighthouse could, so the light was simply switched off.",
    "P2-017": "The bridge is designed to swing up to 35 feet sideways in high wind — on purpose. And every Labor Day, tens of thousands of people walk all five miles of it.",
    "P2-019": "This is one of the first ten places on the entire planet officially named an International Dark Sky Park — and this far north, the northern lights make real appearances.",
    "P2-022": "Hidden in this park are the ruins of an 1859 lighthouse you can hike to — most visitors drive past without ever knowing it's back there.",
    "P2-025": "In hard winters, islanders skip this ferry entirely and drive across the FROZEN LAKE on an ice road marked with old evergreen trees frozen upright into the ice.",
    "P2-026": "The island didn't get electricity until 1964 — through a cable run underwater from the mainland — and it still runs a one-room schoolhouse, one of the last in Michigan.",
    "P2-027": "The island's school is a real one-room schoolhouse — all grades, one teacher, one room, still operating in the 2020s.",
    "P2-029": "The dwarf lake iris growing here is Michigan's state wildflower — and it grows almost nowhere else on Earth except Great Lakes shorelines like this one.",
    "P2-032": "Cars have been BANNED on Mackinac Island since 1898 — an early automobile scared the horses, so the island simply outlawed cars forever. About 500 horses do all the work instead.",
    "P2-033": "The Officers' Stone Quarters here, built in 1780, is the oldest building in the entire state of Michigan — older than the United States Constitution.",
    "P3-001": "Fish sometimes ride through the locks alongside the freighters — a free 21-foot water elevator between two Great Lakes. About 7,000 ships a year make the trip.",
    "P3-002": "The waterfall is genuinely root-beer colored with tan foam on top — stained by tree tannins — and this exact river appears in Longfellow's 'Song of Hiawatha,' written in 1855.",
    "P3-003": "Lake Superior is so cold and deep that shipwrecks barely decay — and this museum displays the actual bronze bell of the Edmund Fitzgerald, raised from 530 feet down, 20 years after she sank with all 29 crew.",
    "P1-002": "Ernie Miller Nature Center is named for a man who never actually owned or lived on this land — Olathe just named the park in his memory after he died in 1971. It opened in 1985 as Johnson County's very first nature center.",
    "P1-003": "The Museum at Prairiefire is a real natural history museum built right in the middle of an outdoor shopping center — dinosaur skeletons and Egyptian artifacts share the block with stores and restaurants.",
    "P1-004": "Overland Park Arboretum sits on land that was a private family farm before the city turned it into public gardens — walk far enough and you'll find a treehouse, a butterfly garden, and a scenic overlook all in one place.",
    "P1-005": "Everyone assumes Deanna Rose was a farmer who donated this land — she wasn't. It's named after a real Overland Park police officer, the department's first ever killed in the line of duty, honored here since 1985.",
    "P1-010": "Science City fills the old train shed of Union Station — the same soaring space where up to a million travelers a year once caught trains, now packed with hands-on science exhibits instead of locomotives.",
    "P1-011": "Liberty Jail's walls were 4 feet thick — 2 feet of stone plus 2 feet of solid oak logs — built that strong specifically to hold prisoners like Joseph Smith, who was jailed here for four months in the brutal winter of 1838-39.",
    "P1-012": "Jesse James was really born in this farmhouse in 1847 — and after he was killed, his own mother sold souvenir rocks from his grave in the yard for 25 cents each.",
    "P1-013": "This mill still has its ORIGINAL 1860s machinery — the only 19th-century woolen mill left in the whole country where you can see the actual gears and looms that turned sheep's wool into fabric, unchanged for over 160 years.",
    "P1-014": "The Battle of Lexington in 1861 is nicknamed the 'Battle of the Hemp Bales' — soldiers actually rolled giant bales of hemp forward as moving shields to advance under fire, and you can still see a cannonball lodged in a column of the historic courthouse.",
    "P1-015": "Every single Budweiser Clydesdale in the world — every one you've ever seen in a parade or a commercial — was born right here on this one ranch in Boonville, Missouri.",
    "P1-016": "Lewis and Clark camped along these bluffs in June 1804, and a spring inside a nearby cave likely gave their whole expedition fresh water — you can still walk the same riverside route they paddled, now a bike trail instead of a canoe route.",
    "P1-018": "These gardens hide a giant sundial and a real one-room schoolhouse behind an insurance company's offices — five acres of secret garden most people driving past never know is there.",
    "P1-019": "The giant stone 'M' on the hill above the football stadium was built in 1927 by freshman students using leftover rock dug out of the stadium's own construction site.",
    "P1-025": "Missouri Botanical Garden was founded in 1859 by a businessman named Henry Shaw — making it the oldest botanical garden in the United States that has never closed, older than the Statue of Liberty.",
    "P1-026": "The Saint Louis Zoo has been free to enter since the day it opened in 1910 — one of only a handful of major zoos in the whole country where you never pay admission.",
    "P1-030": "The mural on this museum's back wall is the largest painted Route 66 shield in the world — and the road in front of it is paved with real, original Route 66 bricks the town saved and relaid just for photos.",
    "P3-006": "Levi and Catharine Coffin secretly helped over 1,000 escaping enslaved people find freedom through this house — so many passed through that it earned the nickname 'Grand Central Station' of the Underground Railroad, and neither Coffin nor a single person they hid was ever caught.",
    "P3-007": "Hayes Arboretum protects trees that were already old before Indiana became a state — some of the oak trees here started growing in the 1600s, before the United States existed.",
    "P3-008": "Richmond's Rose Garden holds thousands of rose bushes in a city nicknamed 'Rose City' — the whole town leaned into roses so hard that even the local hospital and streets are named for them.",
    "P3-009": "The Wayne County Historical Museum has a real Egyptian mummy on display — one of the more unexpected things to find inside a small-town Indiana museum.",
    "P3-010": "The bricks that gave the Indianapolis Motor Speedway its nickname 'The Brickyard' are still there — 3.2 million of them were laid down in 1909, and one narrow strip of the original bricks is kept exposed at the finish line to this day.",
    "P3-011": "The Children's Museum of Indianapolis is the largest children's museum on Earth — it has actual dinosaur fossils, a real space capsule, and a giant water clock all under one roof.",
    "P3-012": "The Indiana State Museum is built with 792 different types of limestone and brick from every single county in Indiana — the building itself is basically a map of the whole state.",
    "P3-013": "The Eiteljorg Museum's collection includes real Native American and Western art and artifacts — including headdresses, pottery, and paintings most kids never get to see up close.",
    "P3-014": "Conner Prairie is a real 1836 village where every 'townsperson' you meet is an actor in character — ask them what year it is and they'll insist it's still 1836.",
    "P3-015": "Fort Wayne's Children's Zoo groups its animals by continent, and its African Journey exhibit lets giraffes and zebras roam together in one big shared savanna, just like they would in the wild.",
    "P3-016": "The Foellinger-Freimann Botanical Conservatory keeps three totally different climates going at once under one glass roof — a tropical rainforest, a desert, and a rotating showcase garden, all a few steps apart.",
    "P1-031": "Old Joliet Prison opened in 1858, its limestone walls quarried by the convicts themselves. It ran until 2002, held everyone from Leopold and Loeb to Richard Speck, and its castle-like front gate is famous worldwide from The Blues Brothers.",
    "P1-033": "Notre Dame's football stadium is nicknamed 'The House That Rockne Built' after coach Knute Rockne, and the famous 'Touchdown Jesus' mural on the library looks straight down into the end zone from beyond the stadium walls.",
    "P1-034": "The Basilica of the Sacred Heart at Notre Dame has more stained glass than almost any building in North America — over 3,500 square feet of it, most handmade in France in the 1800s.",
    "P1-035": "The Studebaker Museum holds the world's largest collection of U.S. presidential carriages — including the actual carriage Abraham Lincoln rode in to Ford's Theatre on the night he was assassinated.",
    "P2-001": "South Bend Chocolate Company runs its own on-site 'Chocolate Museum' with a collection of vintage candy-making equipment — and you can watch real chocolate being made through factory windows.",
    "P2-002": "Potawatomi Zoo is one of the oldest zoos in the country, tracing back to the 1870s — it started small and just kept growing for over 150 years.",
    "P2-005": "Michigan's 1879 State Capitol was built to be fireproof — one of the first state capitols in the country designed that way on purpose — and its painted ceilings are optical illusions: flat surfaces made to look like 3D domes and carvings.",
    "P2-006": "Potter Park Zoo sits along the Red Cedar River and is one of the few zoos in the country with its own veterinary hospital that visitors can actually watch through observation windows.",
    "P2-007": "Everyone at Uncle John's Cider Mill got tired of asking 'Uncle John, whaddaya want me to do next?' while converting the barn — so that became the mill's name, and it's still run by the same family five generations later.",
    "P2-008": "Frankenmuth's shops sit along the Cass River in a town that models itself after a Bavarian village in Germany — even the street signs and building fronts are designed to look like they belong in the Alps.",
    "P2-009": "Bronner's is open and fully decorated for Christmas 361 days a year — and outside stands a replica of the tiny Austrian chapel where the song 'Silent Night' was first performed in 1818.",
    "P2-010": "These white pines are among the last old-growth trees left in Michigan — some over 350 years old and taller than a 15-story building — and they survived only because one family refused to let loggers cut them down.",
    "P2-011": "Grayling's fish hatchery raises trout in long concrete raceways you can walk right alongside — and the town itself is named after the Arctic grayling, a fish that used to fill Michigan's rivers but disappeared from the state entirely by the 1930s.",
    "P2-012": "The crucifix at Cross in the Woods was carved from a single redwood tree and stands 55 feet tall — the second-largest crucifix in the world, with a bronze figure of Christ that alone weighs about 14,000 pounds.",
    "P2-013": "The Call of the Wild Museum displays over 100 taxidermied animals in realistic dioramas — including some rare and unusual species most visitors have never seen up close in real life.",
    "P2-014": "This historic sawmill site was completely lost and forgotten for almost 100 years — buried in the forest — until a local history enthusiast rediscovered it in 1972 and helped dig it back out.",
    "P2-018": "The icebreaker Mackinaw was built in 1944 specifically to smash through winter ice so WWII iron-ore shipments could keep moving — sailors nicknamed her 'Queen of the Great Lakes,' and you can walk through her real engine rooms today.",
    "P2-020": "Wilderness State Park has over 26 miles of undeveloped Lake Michigan shoreline — one of the longest stretches of truly wild, roadless coastline left anywhere on the Great Lakes.",
    "P2-021": "McGulpin Point Lighthouse was 'lost' for decades — its exact original purpose was forgotten by the public until historians rediscovered and restored it, and you can now climb all the way to the top.",
    "P2-023": "The Cheboygan Crib Light isn't a normal lighthouse tower — it sits on a square wooden 'crib' foundation built right in the water at the harbor entrance, one of the last lights of its kind still standing on the Great Lakes.",
    "P2-024": "Cheboygan's Opera House first opened in 1877, burned down, and was rebuilt in 1888 — a frontier lumber town's ambitious bid to bring real theater to the northern Michigan wilderness.",
    "P2-028": "A light has stood on this spot on Bois Blanc Island since 1829 — one of the very earliest lighthouses anywhere on the Great Lakes — though the tower you'd see today is a later rebuild after storms claimed the originals.",
    "P2-030": "Bois Blanc Island's tiny airport is genuinely how a lot of people and supplies reach the island in winter, when ferry service gets difficult — small planes land here right alongside deer and wild turkeys on the runway edges.",
    "P2-031": "Bois Blanc Pines School is one of the last one-room schoolhouses still operating in the entire state of Michigan — every grade, one teacher, one room.",
    "P2-034": "Arch Rock on Mackinac Island is a natural limestone arch 146 feet above the water — no cars are allowed anywhere on the island, so the only way to reach it is by foot, bike, or horse-drawn carriage.",
    "P2-035": "The Museum of Ojibwa Culture sits on the site of a 17th-century Jesuit mission and an Ojibwe burial ground — one of the oldest continuously significant Native American sites in the Great Lakes region.",
    "P3-004": "Castle Rock is a 200-foot limestone stack you can climb via a staircase for one of the best views of the Mackinac Bridge and Lake Huron anywhere in the Straits area — local legend says an Ojibwe chief once used it as a lookout post.",
    "P3-005": "At the Mystery Spot, balls appear to roll uphill and people seem to lean at impossible angles — it's a classic 1950s roadside optical-illusion attraction, one of several 'gravity house' spots that popped up across America in that era.",
    "P3-017": "The Kalamazoo Valley Museum is completely free and has its own planetarium — including exhibits on the real 1980 tornado that tore straight through downtown Kalamazoo.",
    "P3-018": "Kalamazoo Nature Center protects over 1,100 acres of forest, prairie, and wetland — including a historic 1858 farmstead you can still walk through, right in the middle of all that wild land.",
    "P3-019": "Binder Park Zoo has a real African-style safari section called Wild Africa where giraffes, zebras, and other animals roam a shared savanna — and you can even feed a giraffe by hand.",
    "P3-020": "The Grand Rapids Public Museum has a fully operational 1928 carousel inside the building — one of the only museums in the country where you can ride a century-old carousel indoors.",
    "P3-021": "Frederik Meijer Gardens is one of the most-visited art museums in the country — its collection includes more than 300 sculptures, and its five-story tropical conservatory is the largest in Michigan.",
    "P3-022": "John Ball Zoo sits inside a public park older than the zoo itself, donated to Grand Rapids by a local farmer in the 1800s specifically so the whole city could enjoy it for free.",
    "P3-023": "Holland State Park sits at the mouth of Lake Macatawa where it meets Lake Michigan, guarded by 'Big Red,' one of the most-photographed lighthouses on the entire Great Lakes.",
    "P3-024": "Windmill Island Gardens is home to a real, working 250-year-old Dutch windmill — shipped in pieces from the Netherlands and rebuilt here, one of the few authentic operating Dutch windmills anywhere in America.",
    "P3-025": "Grand Haven's south pier lighthouse is connected to shore by an elevated catwalk built so keepers could reach the light safely even during the worst Lake Michigan winter storms.",
    "P3-026": "Silver Lake State Park is the only place in Michigan where you can legally drive a dune buggy or ORV straight up and down real sand dunes — 450 acres set aside just for that.",
    "P3-027": "Little Sable Point Lighthouse still has its original 1874 tower standing unpainted brick — one of the few Great Lakes lighthouses never painted white, so it looks almost exactly as it did when it was built.",
    "P3-028": "Big Sable Point Lighthouse is a genuine hike to reach — about 1.5 miles each way along the beach — which is part of why its black-and-white striped tower feels like such a discovery when it finally comes into view.",
    "P3-029": "Manistee's lighthouse sits at the very end of a long concrete pier that stretches out into Lake Michigan — walking all the way out to it during a calm sunset is one of the classic things to do in town.",
    "P3-030": "Local Ojibwe legend says the Sleeping Bear Dune itself is a mother bear who swam across Lake Michigan escaping a forest fire and waited on shore for her two cubs — the two Manitou Islands offshore are said to be those cubs, who never made it across.",
    "P3-031": "Pierce Stocking Scenic Drive was built in the 1960s by a local lumberman specifically so people who couldn't hike the dunes could still see the view — some overlooks drop over 400 feet straight down to Lake Michigan.",
    "P3-032": "Charlevoix's South Pier Light guards one of the narrowest, trickiest channels on the Great Lakes — boats have to thread a tight gap between two piers to reach the town's protected harbor.",
    "P3-033": "Castle Farms is a real 1918 castle built by an Ohio industrialist to be a model dairy farm — it later hosted concerts by bands like the Beach Boys before becoming the fairy-tale wedding venue it is today.",
    "P3-034": "Petoskey State Park is one of the best places in the state to hunt for Petoskey stones — fossilized coral over 350 million years old that only exists naturally in this part of Michigan.",
    "P3-035": "The Tunnel of Trees is a 20-mile road so narrow and shaded by trees that it feels like driving through a green tunnel — locals have fought for decades to keep it exactly as unpaved and untouched as possible.",
    "P3-036": "Minnetrista sits on the estate of the family who invented the Ball glass canning jar — the same jars still used for home canning today were invented right here in Muncie.",
    "P3-037": "Mounds State Park protects Native American ceremonial earthworks built around 160 BC — nearly 2,000 years before Columbus, making it one of the oldest human-built structures you can walk on in the entire Midwest.",
    "P3-038": "The Hoosier Gym is the real filming location for the basketball movie 'Hoosiers' — you can shoot free throws on the exact court from the movie.",
    "P3-039": "The Indiana Basketball Hall of Fame sits in New Castle, home of the largest high school gymnasium in the entire world — it seats over 9,000 people, more than some college arenas.",
    "P3-040": "This is the same Levi and Catharine Coffin House listed elsewhere on your route — over 1,000 freedom seekers passed through here safely, earning it the nickname 'Grand Central Station' of the Underground Railroad.",
    "P3-041": "The Model T Museum sits in Richmond, a town that once had dozens of its own car companies before Detroit took over — Richmond actually built cars before Henry Ford's Model T existed.",
    "P3-042": "The Gennett Records Walk of Fame honors a tiny Richmond record label that recorded some of the earliest jazz and country music in America — legends like Louis Armstrong and Hoagy Carmichael cut some of their first records in this small Indiana town.",
    "P3-043": "The Wright brothers didn't just fly at Kitty Hawk once and stop — they came home to Dayton and quietly perfected true controlled flight at Huffman Prairie, right here, over the following two years.",
    "P3-044": "The National Museum of the U.S. Air Force is the largest military aviation museum in the world and completely free — it holds an actual SR-71 Blackbird, the fastest jet-powered aircraft ever built.",
    "P3-045": "Carillon Historical Park has a real 1905 Wright Flyer III on display — the airplane the Wright brothers themselves called their first truly practical flying machine.",
    "P3-046": "Aullwood Audubon Center manages hundreds of acres of restored prairie and farmland — a working farm and wildlife sanctuary combined into one place you can walk through.",
    "P3-047": "The Magic House is a hands-on children's museum built inside an actual converted mansion — you can still see the bones of the original house in some of its exhibit rooms.",
    "P3-048": "Laumeier Sculpture Park has over 60 large-scale sculptures scattered across 105 acres of open land — walking the trails means stumbling onto giant artworks you didn't expect around every bend.",
    "P3-049": "Ulysses S. Grant lived and farmed on this land years before he became a Civil War general or president — the log cabin he actually built with his own hands still stands here.",
    "P3-050": "Lone Elk Park lets you drive right through a herd of free-roaming elk and bison — no cages, no fences between you and the animals, just your car windows.",
    "P3-051": "Route 66 State Park sits on the site of a town called Times Beach that was evacuated and completely demolished in the 1980s after a toxic dioxin contamination — the park was built after the whole town was cleaned up and torn down.",
    "P3-053": "Onondaga Cave is considered one of America's most beautiful caves — early explorers reportedly stole boats just to paddle underground rivers and see it first before anyone else could claim the discovery.",
    "P3-054": "Missouri Mines State Historic Site preserves an enormous abandoned lead-mining complex — you can walk through the original 1907 powerhouse still filled with the original mining machinery.",
    "P3-059": "The Battle of Westport in October 1864 was the largest Civil War battle fought west of the Mississippi River — over 30,000 soldiers fought across what is now suburban Kansas City neighborhoods.",
    "P3-060": "Shawnee Town 1929 is a recreated 1920s town where every building is either historic or a careful reconstruction — you can walk into a real Prohibition-era drugstore, bank, and one-room schoolhouse.",
    "P3-061": "The Johnson County Museum's signature exhibit is an entire real 1950s suburban house you can walk through room by room — a genuine time capsule of postwar American family life.",
    "P3-064": "Powell Gardens is Kansas City's official botanical garden, and its Heartland Harvest Garden is the largest edible garden in the country designed to teach visitors where food actually comes from.",
    "P3-065": "The Battle of Lone Jack in August 1862 was one of the bloodiest single-day fights of the whole Civil War in Missouri — over 200 soldiers were killed or wounded in just a few hours of fighting.",
    "P3-052": "Meramec Caverns became famous through one of the greatest marketing tricks in American history — the owner offered free paint jobs to farmers all over the country if they'd let him paint a giant 'Meramec Caverns' ad on their barn roof, and he even invented the bumper sticker to advertise it.",
    "P3-055": "Mark Twain really did explore a cave like this as a kid growing up in Hannibal — he used what he saw here as the inspiration for the spooky cave scenes in 'The Adventures of Tom Sawyer.'",
    "P3-056": "This is the actual house Mark Twain grew up in — the whitewashed fence out front is the real inspiration for the famous fence-painting scene in 'The Adventures of Tom Sawyer.'",
    "P3-057": "Walt Disney spent part of his childhood in this small Missouri town, and Main Street USA at every Disney park in the world is modeled after the actual street outside this museum.",
    "P3-058": "General John J. Pershing, who led all American forces in World War I, grew up in this small-town Missouri house before becoming one of the most powerful military commanders in U.S. history.",
    "P3-062": "Kauffman Stadium's crown-shaped scoreboard and famous outfield fountains have been running since the stadium opened in 1973, making it one of the oldest ballparks still used in Major League Baseball.",
    "P3-063": "Arrowhead Stadium set the actual Guinness World Record for the loudest outdoor stadium on Earth — 142.2 decibels, louder than a jet taking off, set by the crowd back in 2014.",
    "P4-066": "This cemetery is owned by a labor union, not a church or a city — the only one like it in the entire country. A famous organizer named Mother Jones asked to be buried here among 'her boys,' guarded by two bronze miner statues.",
    "P4-067": "This whole town is basically empty now — an abandoned train depot, an old general store nobody runs anymore — except for one family who still makes maple syrup here every single year, exactly like their great-great-grandparents did.",
    "P4-068": "This cemetery sits on top of a weird, steep hill in the middle of totally flat farmland. It's a leftover chunk of an ancient glacier — geology just decided to leave one lump behind.",
    "P4-069": "Lincoln's body actually lay inside this exact building in 1865, with tens of thousands of people filing past to say goodbye before his funeral train left town.",
    "P4-070": "About 1,000 Confederate soldiers who died as prisoners here are buried right next to thousands of Union soldiers — enemies in life, neighbors forever.",
    "P4-071": "This courthouse cost so much more than planned that it bankrupted the entire county for almost 40 years. People called it the 'Million Dollar Courthouse' — and not as a compliment.",
    "P4-072": "This mile-long bridge has a weird 22-degree bend right in the middle — on purpose, to dodge two water-intake towers. It sat abandoned for over 20 years, and the Army almost blew it up for demolition practice.",
    "P4-073": "This building was already standing before the United States existed — built around 1740, making it one of the oldest buildings west of the Allegheny Mountains.",
    "P4-074": "This restaurant has been open since 1924 and had to physically move buildings twice because the highway kept shifting under it. Same family, almost 100 years.",
    "P4-075": "Bald eagles spend the winter in the exact same river bluffs a French explorer paddled past in 1673 — 350 years later, same view.",
    "P4-076": "Someone here decided old Volkswagen Beetles look like rabbits, so they lined a bunch of them up outside like a real rabbit family — complete with names.",
    "P4-077": "A 28-foot fiberglass spaceman has stood next to this road since 1965 — built to celebrate NASA's Gemini space missions, and he's still there.",
    "P4-078": "This gas station pumped real gas for 66 straight years — from 1933 to 1999 — and still looks almost exactly like it did on day one.",
    "P4-079": "This tiny gas station was already old-fashioned-looking the day it opened in 1932. Nearly a century later, it's one of the best-preserved stations of its kind anywhere.",
    "P4-080": "This diner has a growing crowd of life-sized fiberglass celebrity statues standing outside — Elvis, Marilyn Monroe, even a superhero — like an outdoor wax museum attached to a restaurant.",
    "P4-081": "Abraham Lincoln actually went to parties in this exact house — his campaign manager lived here, and later became a U.S. Supreme Court Justice.",
    "P4-082": "Illinois has held a fair on this exact spot since the 1890s — the oldest barns here have watched over a century of county fairs come and go.",
    "P4-083": "This downtown building is old enough that nobody's totally sure everything that's happened inside it over more than a century of Illinois small-town business.",
    "P4-084": "The stone ruins of a real 1830s grist mill still stand along this river — a whole working mill, left to slowly become part of the landscape.",
    "P4-085": "In 1876, a real gang of counterfeiters tried to steal Lincoln's body out of this tomb to hold it for ransom. They got caught mid-heist — and his coffin was later sealed in concrete just to make sure nobody ever tried again.",
    "P4-086": "A famous poet was born and lived in this exact house — and he didn't just write his poems, he performed them out loud like a one-man show, decades before that was a normal thing to do.",
    "P4-087": "A young, completely unknown lawyer argued cases in this tiny courthouse — years before anyone had any idea he'd become President of the United States.",
    "P4-088": "This town is the only one named after Lincoln while he was still alive — and legend says he helped 'name' it himself by pouring watermelon juice, like a weird 1850s christening ceremony.",
    "P4-089": "This library opened in 1908 and has never stopped running since — over a century of the same small town checking out books from the exact same building.",
    "P4-090": "A newspaper editor was killed defending this exact printing press in 1837 because he refused to stop publishing what he believed. His death became one of the reasons America takes freedom of the press so seriously.",
    "P4-091": "This is the very first house ever built in Springfield — 1837, still standing almost 190 years later, older than the state capitol itself.",
    "P4-092": "A future president used to go to fancy parties in this exact house — and today, the same rooms are filled with local art instead of Lincoln-era guests.",
    "P4-093": "This museum keeps genealogy records that can trace some local families back for literal generations — a real paper trail of who lived here and when.",
    "P4-094": "This museum has real mastodon bones — actual prehistoric elephant relatives that used to roam this exact part of the country thousands of years ago.",
    "P4-095": "Mary Todd Lincoln — the President's wife — actually rented a specific pew in this church, and it's still marked with her name today.",
    "P4-096": "This college got named after Lincoln WHILE he was still alive — most places wait until someone's famous or gone before naming something after them. This one didn't wait for either.",
    "P4-097": "One tiny, muddy observation made in this exact spot — that a canal here could connect two huge water systems — is the actual reason the entire city of Chicago exists.",
    "P4-098": "Illinois governors have actually lived and worked in this exact house since 1855 — over 170 years of the same job, the same building.",
    "P4-099": "Real touring bands played dances inside this building back in the 1920s, in a tiny Illinois coal town most people have never heard of.",
    "P4-100": "This giant painted creature on the cliff is based on a legend that's older than the United States itself — French explorers wrote it down in the 1670s because Native peoples had already been telling it for generations.",
    "P4-101": "Two towers that look like they belong in a fairy tale actually stand in the middle of the Mississippi River — and their whole job is just pumping drinking water to a city.",
    "P4-102": "Nine unusually tall state lawmakers — including a young Lincoln — teamed up and literally moved the entire Illinois state capital to a different city. Nine people, one whole state's map changed.",
    "P4-103": "This isn't the famous, powerful Lincoln — this is Lincoln at your age-ish, just a regular guy working random jobs in a tiny frontier town, years before anyone knew what he'd become.",
    "P4-104": "A 23-year-old Lincoln served his very first term as a lawmaker in this small building — before Springfield was even the state capital.",
    "P4-105": "This one museum ties together a printing-press martyr, a Civil War prison, and a whole river town's story — all under one roof.",
    "P4-106": "One single building here hosts hockey games, concerts, AND graduations — same seats, completely different events, all year round.",
    "P4-107": "This baseball stadium is nicknamed 'the Corn Crib' — yes, really, after a building farmers use to store corn. Great name, real stadium.",
    "P4-108": "The same college football team has played on this exact field since 1963 — over 60 years of the same turf, different players.",
    "P4-109": "This arena somehow works for basketball games, concerts, AND college graduation ceremonies — same building, three totally different jobs.",
    "P4-110": "Athletes here play in Division III, which means no athletic scholarships at all — they're playing purely because they love the sport, nothing else.",
    "P4-111": "This is a real college football stadium, just built smaller and friendlier than the giant ones — sized for an actual community instead of a massive city.",
    "P4-112": "A famous architect designed over 100 pieces of custom furniture just for this ONE house — nothing store-bought, everything built specifically to fit this exact space.",
    "P4-113": "This movie theater was built to look like a French palace, complete with one of the biggest hand-cut crystal chandeliers in the entire country.",
    "P4-114": "This theater is over 100 years old and used to show silent movies — now it hosts live rock concerts in the exact same building.",
    "P4-115": "A real tornado ripped through here in 2013, moving nearly 13 miles in about 11 minutes. That same single day, Illinois had 25 tornadoes — more than any other November on record.",
    "P4-116": "Hail the size of an actual softball fell out of the sky here in 2013 — real chunks of ice big enough to dent a car.",
    "P4-117": "A tornado hit this small town directly in 2004 — a heavy, real story, and one that changed how seriously people take storm warnings across the whole Midwest today.",
    "P4-118": "TWO separate tornadoes hit this city within five minutes of each other in 2006, damaging over 1,000 buildings — and somehow, nobody died. That's a real warning-system success story.",
    "P4-119": "This is literally the other end of the same tornado that started near Coal City — same storm, nearly 13 miles later, still spinning.",
    "P4-120": "You can walk on an actual original stretch of Route 66 pavement here — the real road surface people drove on generations ago, preserved instead of paved over.",
    "P4-121": "An 18-year-old stepped off a train in Kansas City in 1910 with almost no money — just two shoeboxes of postcards. A fire in 1915 destroyed everything he'd built and left him $17,000 in debt. He rebuilt anyway, and that company became Hallmark, the biggest greeting card company in America.",
    "P4-122": "Two brothers started this company in a small Kansas City office in 1955 — and they literally changed how their last name was spelled (from Bloch to Block) on the sign, just so people wouldn't mispronounce it into a joke.",
    "P4-123": "A soap and candle maker bought a struggling, nearly-failing brewery almost as an afterthought in 1860. His son-in-law joined a few years later and turned it into one of the biggest beverage companies on the planet.",
    "P4-124": "In 1876, a shop owner got so annoyed by sawdust on his floor that he invented a mechanical sweeper to fix it. After he died, his wife Anna ran the growing company — becoming one of the first female CEOs in American history.",
    "P4-125": "A real surgeon kept inventing better medical tools and casts to help his own patients in the 1930s and 40s — so he just started a company to build them himself. That company is now worth billions of dollars."
  };

  function eliettePopupContent(item) {
    const seed = item.id || item.title || "stop";
    const coolFact = ELIETTE_COOL_FACTS[item.id] || item.why || item.summary || "";
    const detailPromptBank = [
      "Look closer: find one tiny detail here nobody else in the family will notice.",
      "Look closer: what's the smallest interesting object you can spot at this place?",
      "Look closer: find something handmade, something shiny, or something older than Grandma.",
      "Look closer: if you could keep ONE small thing from here (legally!), what would it be?"
    ];
    const detailPrompt = item.profiles?.eliette || detailPromptBank[stableIndex(`${seed}-detail`, detailPromptBank.length)];
    const grossFunny = ELIETTE_GROSS_FUNNY[item.id] || "";
    return { coolFact, detailPrompt, grossFunny };
  }

  const ELSIE_STOP_FACTS = {
    "P1-001": "Real stagecoach, real farm, zero WiFi in 1860. This is what road trips looked like before someone invented the aux cord.",
    "P1-002": "Named after a guy who never owned this land or lived here. Olathe just liked him enough to slap his name on a park after he died. No notes, just vibes.",
    "P1-003": "A legit dinosaur-and-Egypt museum built inside a shopping center parking lot. You can see a mummy and then go buy a smoothie. Bold choice.",
    "P1-004": "It's a farm. Old, historic. The whole 'Deanna Rose' thing sounds like someone's aunt, but she was a real police officer honored here — not a farmer who never existed, which somehow is even better.",
    "P1-005": "A children's farmstead named for a real cop, not a made-up farmer. Somewhere a marketing team is annoyed nobody let them invent a fake mascot.",
    "P1-006": "The glass bridge you walk across is laid over 9,000 fake poppies — each one stands for 1,000 people who died in WWI. Yes, do that math. It's a lot.",
    "P1-007": "Gangsters actually shot it out with FBI agents right outside this building in 1933. History majors call it the Union Station Massacre. Everyone else calls it 'wildly on brand for the 1930s.'",
    "P1-008": "A guy named Toni Stone — a WOMAN — played pro baseball with the men here and got a hit off one of the best pitchers ever. So next time someone says 'that's not how it worked back then,' show them this.",
    "P1-009": "They found pickles from 1856 down here. Still sealed. Reportedly still edible. Nobody in this family is required to test that theory.",
    "P1-010": "Science museum built inside an old train shed. A million people a year used to pass through this exact spot to catch trains. Now they come to push buttons and set off tiny explosions. Progress.",
    "P1-011": "The jail walls are 4 feet thick — 2 feet of stone, 2 feet of solid oak — built specifically to keep one guy locked up for four months in the dead of winter. Overkill? Historically, yes.",
    "P1-012": "Jesse James was a real outlaw born in this actual house — and after he died, his own mother sold rocks from his grave for 25 cents each. Merch game was strong in 1882. There's also a real, still-unsolved legend attached to this family: people have spent well over a century searching Missouri caves and farmland for gold Jesse supposedly buried and never came back for. Nobody's ever found it. Feel free to start digging, statistically you can't do worse than everyone else.",
    "P1-013": "Only 19th-century wool mill in the entire country with its ORIGINAL machinery still running. So basically the opposite of your phone, which dies if you look at it wrong.",
    "P1-014": "Soldiers stacked giant bales of hemp and rolled them forward like moving shields during a real Civil War battle here. There's still a cannonball stuck in a column. Nobody removed it. Iconic energy.",
    "P1-015": "Every single Budweiser Clydesdale you've ever seen — every commercial, every parade — was born on this one ranch. It's basically a horse celebrity nursery.",
    "P1-016": "Lewis and Clark camped near here in 1804 and probably drank spring water from a cave nearby. You will not be doing that. Use the gas station.",
    "P1-017": "A bike trail built on top of an old railroad. Very scenic. Also very flat, which is the only kind of exercise this family endorses on vacation.",
    "P1-018": "Secret garden behind an insurance company's office building. There's a giant sundial back there like it's 1750 and nobody invented phones yet.",
    "P1-019": "College kids built a giant stone 'M' on a hill in 1927 using literal leftover rock from digging the stadium. Freshmen still have to whitewash it. Some traditions age fine.",
    "P1-020": "Missouri's capitol was built to be fireproof back in 1879, and the painted ceilings are optical illusions — flat paint made to look 3D. It's basically the original filter.",
    "P1-021": "This prison opened before the Alamo fell. It ran until 2004. Time magazine called it 'the bloodiest 47 acres in America,' which is not a compliment, but is objectively a great museum tagline.",
    "P1-022": "The whole town is a National Historic Landmark and only about 50 people live there. So it's less a town and more a very small, very official group chat.",
    "P1-023": "The Arch is exactly as wide as it is tall — 630 feet both ways — and on the last day of construction they had to spray it with fire hoses just to shrink the metal enough to fit the final piece in. Engineering, but make it stressful.",
    "P1-024": "Someone bought old buildings, old airplane parts, and an actual school bus, then welded it all onto the outside of a shoe factory and called it a museum. It works shockingly well.",
    "P1-025": "Oldest botanical garden in the country that has never once closed. Started in 1859 by a guy who apparently just really, really liked plants.",
    "P1-026": "This zoo has been free since 1910. No membership, no upsell, no surprise parking fee that costs more than the animals. A rare win.",
    "P1-027": "A thousand years ago this city was bigger than London. They also played a sport called chunkey that involved throwing spears at a rolling stone disc, which honestly sounds more fun than most gym class units.",
    "P1-028": "The only house Lincoln ever owned. The staircase railing is the original one — meaning your hand can literally touch the exact spot his did. Slightly less impressive when you remember he's been dead 160 years.",
    "P1-029": "They have the actual gloves Lincoln was holding the night he was shot. Still stained. It's less a museum exhibit and more a genuinely unsettling artifact, and that's kind of the point.",
    "P1-030": "The mural on the back wall is the largest painted Route 66 sign in the world, and the road in front of it is paved with real, original Route 66 bricks. Great photo spot, mediocre road surface.",
    "P1-031": "Old Joliet Prison ran for 144 years and held Leopold and Loeb. Also, this is the actual prison from The Blues Brothers. Somewhere a location scout felt very proud of that find.",
    "P1-032": "In 2013 a moving sand dune here swallowed a 6-year-old kid into a hidden hole. He survived over three hours buried underground. Scientists still don't fully understand how the hole formed. Cool sand, deeply unsettling sand.",
    "P1-033": "The football stadium is nicknamed 'The House That Rockne Built,' and there's a mural of Jesus overlooking the end zone that fans call Touchdown Jesus. Even the deity here has stats to watch.",
    "P1-034": "Over 3,500 square feet of stained glass, most of it hand-shipped from France in the 1800s before international shipping meant a tracking number and mild anxiety.",
    "P1-035": "This museum has the ACTUAL carriage Lincoln rode in to Ford's Theatre the night he was assassinated. It is objectively one of the most quietly disturbing objects on this entire trip.",
    "P2-001": "Chocolate factory with a museum attached, so you can watch candy get made through the windows and then go buy some, completing the full capitalism experience.",
    "P2-002": "One of the oldest zoos in the country — going back to the 1870s — which means it has survived longer than most empires.",
    "P2-003": "They have the only SR-71B Blackbird trainer left on Earth. That plane could outrun a missile fired at it by literally just flying faster. Physics said no, the Blackbird said watch me.",
    "P2-004": "Started as one couple's weird car hobby that got so out of control it's now one of the biggest car museums in North America. A cautionary tale and a museum at the same time.",
    "P2-005": "Built to be fireproof in 1879, and every ceiling painting is a flat illusion made to look 3D. So the entire capitol is basically a very expensive, very old Instagram filter.",
    "P2-006": "This zoo has its own vet hospital with windows you can watch through. So yes, you might accidentally witness a raccoon getting a checkup. Priceless, unbooked content.",
    "P2-007": "The whole business is named 'Uncle John's' because everyone kept saying 'Uncle John, whaddaya want me to do next?' while building it. Five generations later, still the name. Nobody had a better idea.",
    "P2-008": "A whole Michigan town styled to look like it's in the Alps. Zero elevation change, maximum commitment to the theme.",
    "P2-009": "This place is fully decorated for Christmas 361 days a year. There's also a replica of the actual tiny chapel where 'Silent Night' was first performed. In July. It's a choice.",
    "P2-010": "These pines are over 350 years old — older than the United States — and they only survived because one family flatly refused to let loggers touch them. Absolute legends.",
    "P2-011": "Michigan's grayling fish disappeared from the entire state by the 1930s. The town is still named after a fish that doesn't live there anymore. Iconic commitment to the bit.",
    "P2-012": "This crucifix is 55 feet tall, carved from one tree, and the bronze Christ figure alone weighs 14,000 pounds. Second largest crucifix in the world. There is, apparently, a bigger one somewhere. Someone out there is really competitive about this.",
    "P2-013": "Over 100 taxidermied animals staring at you in dead silence. Vibes range from 'educational' to 'mildly haunted gift shop.'",
    "P2-014": "This whole sawmill site was completely lost and forgotten for almost 100 years until someone stumbled across it in 1972. Peak 'we found it in the woods' energy.",
    "P2-015": "In 1763, warriors got inside this exact fort by starting a lacrosse game outside the walls — the ball 'accidentally' went over, and the second the gate opened for it, the attack started. Sports as a Trojan horse. Unreal move.",
    "P2-016": "This lighthouse got fired from its job because a bridge showed up with brighter lights. In 1957, the Mackinac Bridge basically said 'I got this' and the lighthouse got switched off.",
    "P2-017": "The bridge is engineered to sway up to 35 feet sideways in high wind. On purpose. Totally safe. Extremely uncomfortable to think about while driving across it.",
    "P2-018": "This icebreaker ship was built in WWII specifically to smash through ice so war supplies could keep moving. Sailors nicknamed her 'Queen of the Great Lakes.' You can walk through the actual engine room.",
    "P2-019": "One of the first ten spots on the ENTIRE PLANET officially recognized as a Dark Sky Park. This far north, you can sometimes catch the actual northern lights. No filter required.",
    "P2-020": "Over 26 miles of totally undeveloped shoreline. No hotels, no shops, nothing. Just water and quiet, which is either peaceful or deeply suspicious depending on your personality.",
    "P2-021": "This lighthouse was basically forgotten by the public for decades until historians rediscovered what it even was. A lighthouse. Lost. In plain sight. On the shore. Sure.",
    "P2-023": "This isn't even a normal lighthouse tower — it's a light sitting on a square wooden platform built right in the water. One of the last ones of its kind left on the Great Lakes.",
    "P2-024": "Built in 1877 by a frontier lumber town that apparently decided, mid-wilderness, that what they really needed was a nice theater. Burned down. Rebuilt anyway. Commitment.",
    "P2-025": "In real bad winters, people skip the ferry entirely and drive their actual cars across the frozen lake on an ice road marked with dead Christmas trees frozen upright in the ice. This is not fiction. This is Tuesday for some people.",
    "P2-026": "This island didn't get electricity until 1964. Somewhere out here someone did their homework by candlelight and nobody thought that was weird yet.",
    "P2-028": "A lighthouse has stood on this exact spot since 1829 — one of the oldest on the entire Great Lakes — though storms have taken out more than one version of it over the centuries. Persistence, but make it a building.",
    "P2-030": "Tiny island airport where planes land next to deer and wild turkeys just casually standing on the runway edge like they pay rent there.",
    "P2-031": "One of the last one-room schoolhouses still operating in the entire state. Every grade, one room, one teacher. No hallway drama possible — there's no hallway.",
    "P2-034": "A 146-foot natural stone arch you can only reach by walking, biking, or horse carriage, because cars are banned on this entire island. Mackinac Island said no thank you to cars over a century ago and never looked back.",
    "P2-035": "This museum sits on the site of a 17th-century mission and burial ground — meaning people have considered this exact spot important for roughly 400 years straight.",
    "P3-001": "Freighters up to 1,000 feet long get raised or lowered 21 feet right in front of you because Lake Superior just sits that much higher than Lake Huron. Basically a giant, extremely slow elevator for boats.",
    "P3-002": "The waterfall is legitimately root-beer colored with tan foam on top. It's not pollution, it's tree tannins, and it looks exactly like a giant root beer float that someone left running for 200 years.",
    "P3-003": "They have the actual bell off the Edmund Fitzgerald — the freighter that sank with all 29 crew in 1975, the one from that Gordon Lightfoot song. Pulled up from 530 feet down, 20 years later. Heavy stop. Worth it.",
    "P3-004": "A 200-foot limestone tower you climb via staircase for one of the best bridge views around. Local legend says a chief once used it as a lookout. Also a great excuse to make everyone else climb stairs while you narrate the legend dramatically.",
    "P3-005": "Balls appear to roll uphill here. It's a 1950s optical-illusion tourist trap and it's fully aware of what it is. Respect the hustle.",
    "P3-010": "3.2 million bricks were laid down here in 1909 — that's why it's called 'The Brickyard.' One tiny strip of the original bricks is still exposed at the finish line, just sitting there being historically significant while everyone drives over it at 200 mph.",
    "P3-017": "Free museum, has its own planetarium, also covers the actual 1980 tornado that ripped straight through downtown Kalamazoo. Free AND slightly terrifying. A combo.",
    "P3-021": "This place has over 300 sculptures and one of the biggest tropical greenhouses in the state. Somebody's grocery-store fortune paid for all of it, which is either inspiring or extremely on brand for capitalism.",
    "P3-023": "Guarded by a lighthouse nicknamed 'Big Red' that gets photographed more than most celebrities. It has its own fan club, basically.",
    "P3-024": "A real, working 250-year-old Dutch windmill shipped over in pieces and rebuilt here. So somewhere there's a windmill-shaped hole in the Netherlands' skyline and nobody talks about it.",
    "P3-026": "The only place in Michigan where driving a dune buggy straight up a sand dune is not just legal, it's the whole point. 450 acres dedicated to controlled chaos.",
    "P3-027": "This lighthouse was never painted white like the others — it's still bare brick from 1874. Everyone else got a makeover, this one just said no.",
    "P3-028": "You have to hike 1.5 miles along the beach just to reach this lighthouse. No shortcuts, no parking lot next to it. It makes you earn the view, which feels aggressive for a building.",
    "P3-030": "Local legend says this dune is a mother bear who swam Lake Michigan escaping a fire and waited for her two cubs, who never made it — the two islands offshore are supposedly them. Heavy lore for a pile of sand, but here we are.",
    "P3-031": "Built in the 1960s by a lumberman so people who didn't want to hike could still see the view. Some overlooks drop 400 feet straight down. Built for lazy people, terrifying for everyone.",
    "P3-033": "A literal 1918 castle built to be... a dairy farm. The Beach Boys played concerts here before it became a wedding venue. Genuinely unclear how any of those sentences connect, but they do.",
    "P3-034": "You can hunt for real 350-million-year-old fossilized coral here — it's called a Petoskey stone and it basically only exists in this one part of Michigan. Free souvenir, older than dinosaurs.",
    "P3-043": "The Wright brothers didn't just fly once at Kitty Hawk and retire — they came back to Dayton and spent two more years quietly perfecting actual controlled flight in a random field here. The famous moment wasn't even the hard part.",
    "P3-044": "Largest military aviation museum on the planet, and it's free. They have an SR-71 Blackbird — the fastest jet ever built, one that could straight up outrun a missile fired at it.",
    "P3-047": "A children's museum built inside an actual old mansion. You can still spot the bones of the original house hiding inside the exhibits if you look.",
    "P3-049": "Ulysses S. Grant lived on this exact land and built this cabin with his own hands years before becoming a general or president. Pre-fame Grant, doing manual labor. Humbling for everyone involved, presumably including him.",
    "P3-050": "You can drive right through free-roaming elk and bison here. No fences between you and them. Your car window is the only thing standing between vacation and a very different kind of vacation.",
    "P3-051": "This park sits on top of a town called Times Beach that was so contaminated with toxic chemicals in the 1980s the entire town had to be evacuated and bulldozed. So enjoy the park, built on the ashes of an actual ghost town, but the legal kind.",
    "P3-052": "The Meramec Caverns guy offered farmers free barn paint jobs across 14 states just to advertise this cave. He also basically invented the bumper sticker. Marketing has never recovered.",
    "P3-055": "Mark Twain explored a cave like this as a kid and used it as the basis for the scary cave scenes in Tom Sawyer. So somewhere down there is the OG inspiration for a book you were probably assigned in school.",
    "P3-056": "This is the real house Twain grew up in, and that famous fence-painting scene in Tom Sawyer is based on the actual fence out front. Tricking your friends into doing your chores: also historically accurate.",
    "P3-057": "Walt Disney lived in this tiny town as a kid, and Main Street USA at every single Disney park in the world is modeled after the actual street outside this museum. So yes, the happiest place on earth is secretly based on rural Missouri.",
    "P3-058": "General John J. Pershing, who commanded the entire U.S. military in WWI, grew up in this small house. Small-town kid, absurdly high ceiling for career growth.",
    "P3-059": "The Battle of Westport in 1864 was the biggest Civil War battle west of the Mississippi. Over 30,000 soldiers fought across what's now just... normal suburban Kansas City neighborhoods. Someone's driveway is probably a battlefield.",
    "P3-062": "The scoreboard and fountains at this stadium have been running since 1973. That's over 50 years of the same water feature doing its thing between innings without a single day off.",
    "P3-063": "This stadium set the actual Guinness World Record for loudest outdoor stadium ever — 142.2 decibels. That's louder than a jet taking off. From a crowd. Yelling.",
    "P2-022": "Hidden in this park are the ruins of an 1859 lighthouse most people drive right past without ever knowing it's back there. History, but make it a secret side quest.",
    "P2-027": "The island's museum and library keep the story of a town that still has no traffic light, no chain store, and about 70 year-round residents. Small town energy, but genuinely small.",
    "P2-029": "Home to Michigan's actual state wildflower, which grows almost nowhere else on Earth except right here on Great Lakes shorelines. Look, don't pick. It's basically a celebrity plant.",
    "P2-032": "Cars have been banned on this entire island since 1898 because one automobile scared the horses. One car. That's all it took. The island held a grudge for over a century.",
    "P2-033": "Soldiers stationed here got maybe one bath a week if they were lucky, and their wool uniforms basically never got washed. History looked cool in movies. History smelled terrible.",
    "P3-006": "Over 1,000 people escaping slavery passed safely through this house — it earned the nickname 'Grand Central Station' of the Underground Railroad, and nobody who stayed here was ever caught.",
    "P3-007": "Some of these trees started growing in the 1600s, before the United States existed. They've been standing here quietly judging every historical event since.",
    "P3-008": "A whole town built its identity around roses. The hospital's named after roses. The streets are named after roses. Someone really committed to a theme.",
    "P3-009": "This small-town museum has an actual Egyptian mummy in it. Nobody expects that walking in, which is exactly why it's worth the stop.",
    "P3-011": "Largest children's museum on the planet, and it has real dinosaur fossils and a real space capsule. Somehow still marketed primarily to people under age 10.",
    "P3-012": "The building itself is made from 792 different types of stone and brick, one from every county in the state. So the museum is technically also a rock collection the size of a building.",
    "P3-013": "Real Native American and Western art and artifacts, no replicas. The kind of museum that makes 'field trip' sound like it's underselling itself.",
    "P3-014": "Everyone working here is in character playing it's still 1836. Ask them what year it is and they will not break. Commitment to the bit, professionally.",
    "P3-015": "The African exhibit lets giraffes and zebras roam one shared space like an actual savanna. No cages in sight, which is either impressive design or slightly concerning depending on how close you get.",
    "P3-016": "Three totally different climates — rainforest, desert, and a rotating garden — under one glass roof, a few feet apart from each other. Somebody's HVAC system is working overtime.",
    "P3-018": "Over 1,100 acres of forest and wetland with an actual 1858 farmstead sitting in the middle of it. Old house, older trees.",
    "P3-019": "You can hand-feed a giraffe here. A giraffe. With your actual hand. No, it will not ask permission first.",
    "P3-020": "There's a fully working 1928 carousel inside the museum. You can ride a century-old carousel indoors, which is either charming or a liability lawyer's nightmare.",
    "P3-022": "This zoo sits inside a park a farmer donated to the city over a century ago, specifically so everyone could use it for free forever. Rare example of a rich guy actually following through.",
    "P3-025": "Guarded by a lighthouse connected to shore by a raised catwalk, built so keepers could reach the light without getting swept off the pier during Lake Michigan's worst storms. Job requirements included 'not dying in a storm.'",
    "P3-029": "The lighthouse sits at the very end of a long concrete pier stretching into Lake Michigan. Walking all the way out feels dramatic. It is, in fact, just a pier.",
    "P3-032": "This light guards one of the narrowest, trickiest boat channels on the whole Great Lakes. Big boats, small gap, no margin for error.",
    "P3-035": "A 20-mile road so narrow and tree-covered it feels like driving through a tunnel. Locals have fought for decades to keep it exactly this unpaved and inconvenient, on purpose.",
    "P3-036": "This estate belonged to the family who invented the Ball glass jar — yes, the same jars people still use to can pickles today. So somewhere in your kitchen there might be a tiny piece of this place.",
    "P3-037": "There are Native American ceremonial mounds here built around 160 BC. That's nearly 2,000 years before Columbus. Older than basically anything else you'll see on this entire trip.",
    "P3-038": "This is the actual gym from the movie Hoosiers. You can shoot free throws on the exact court. Extremely low odds you'll play as well as the movie made it look.",
    "P3-039": "This Hall of Fame sits in the town with the largest high school gym in the entire world — it seats over 9,000 people. More than some actual college arenas. For high schoolers. Playing basketball.",
    "P3-040": "Same house as the other Coffin site on this route — over 1,000 people escaping slavery came through here safely. Nobody who hid here was ever caught. Not once.",
    "P3-041": "This town used to build its own cars before Ford's Model T existed. So technically, this random Indiana town beat Henry Ford to the punch and history just... didn't care.",
    "P3-042": "A tiny record label here recorded some of the earliest jazz and country music in America. Legends like Louis Armstrong cut some of their first records in this small Indiana town nobody's heard of.",
    "P3-045": "They have a real 1905 Wright Flyer here — the plane the Wright brothers themselves considered their first genuinely practical aircraft. Not a replica. The actual plane.",
    "P3-046": "Hundreds of acres of restored prairie and an actual working farm combined into one place. Somewhere in there is probably a chicken with main character energy.",
    "P3-048": "Over 60 giant sculptures scattered across 105 acres of open land. You will be walking along minding your business and suddenly there's a 15-foot metal sculpture just standing there.",
    "P3-053": "Early explorers reportedly stole boats just to paddle underground and see this cave before anyone else could claim they found it first. People will do anything to be first.",
    "P3-054": "An enormous abandoned lead-mining complex you can walk through, original 1907 machinery still sitting exactly where it was left. Nobody cleaned up after themselves. History left the mess for us.",
    "P3-060": "A recreated 1920s town where the buildings are either genuinely historic or careful rebuilds. Real Prohibition-era drugstore, real one-room schoolhouse, zero actual Prohibition enforced.",
    "P3-061": "The main exhibit is an entire real 1950s suburban house you walk through room by room. It's basically a time machine disguised as a museum wing.",
    "P3-064": "This garden includes the largest edible garden in the country — a whole section built just to show people where food actually comes from. Revolutionary concept, apparently.",
    "P3-065": "This one-day battle in 1862 was one of the bloodiest of the entire Civil War in Missouri — over 200 soldiers killed or wounded in just a few hours. Small town, brutal afternoon."
  };

  function openElsieMarkerPopup(map, rawItem, coordinates) {
    const item = enrichStop(rawItem);
    const haunted = hauntedMatchForStop(item);
    if (haunted) return openElsieHauntedPopup(map, haunted, coordinates);
    const emmaThemed = emmaMatchForStop(item);
    if (emmaThemed) return openEmmaRoutePopup(map, emmaThemed, coordinates);
    const quest = katrinaQuestMatchForStop(item);
    if (quest) return openKatrinaQuestPopup(map, quest, coordinates);
    const speedStop = julesMatchForStop(item);
    if (speedStop) return openJulesPopup(map, speedStop, coordinates);
    const profile = activeProfile;
    const iconType = mapIconType(item, profile);
    const link = item.learn_more || item.official_website || sourceLinkForPlace(item);
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    const isKatrina = profile === "katrina";
    const isEmma = profile === "emma";
    const isEliette = profile === "eliette";
    const ELIETTE_ICON_LABELS = { "gem": "Shiny Find", "magnifier": "Hidden Detail", "craft": "Handmade", "trinket": "Treasure & Nicknacks", "butterfly": "Pretty & Wild" };
    const label = isKatrina ? (KATRINA_ICON_LABELS[iconType] || "Worth the Detour")
      : isEmma ? (EMMA_ICON_LABELS[iconType] || "Worth the Detour")
      : isEliette ? (ELIETTE_ICON_LABELS[iconType] || "Worth the Detour")
      : (ELSIE_ICON_LABELS[iconType] || "Worth the Detour");
    if (profile === "jules") {
      const emojiRow = julesLookForEmojis({ title: item.title, why: item.summary || "", mission: item.why || "", theme: item.category || "", character: item.profiles?.jules || "" });
      elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "280px", offset: 18, className: "elsie-marker-popup jules-popup" })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="elsie-popup-card jules-popup-card">
            <div class="jules-popup-emoji" aria-hidden="true">${emojiRow.slice(0, 3).join(" ")}</div>
            <strong>${escapeHtml(item.title)}</strong>
            ${emojiRow.length > 3 ? `<div class="jules-lookfor" aria-label="Things to look for"><span class="jules-lookfor-eyes" aria-hidden="true">👀</span>${emojiRow.slice(3).map((e) => `<span class="jules-lookfor-item">${e}</span>`).join("")}</div>` : ""}
            <div class="elsie-popup-actions jules-popup-actions">
              <button type="button" data-shortlist="${escapeHtml(item.title)}" data-category="${escapeHtml(item.category)}" data-url="${sourceLinkForPlace(item)}" aria-label="Save this stop">⭐</button>
              <button type="button" data-visited-stop="${escapeHtml(item.title)}" aria-label="Mark visited">✅</button>
              <a href="${googleMapsNavigationUrl(item)}" target="_blank" rel="noopener" aria-label="Navigate">🗺️</a>
            </div>
            <details class="jules-adult-notes"><summary>Grown-up notes</summary>
              <p>${escapeHtml(item.summary || "")}</p>
              ${item.profiles?.jules ? `<p><strong>Jules angle (read aloud):</strong> ${escapeHtml(item.profiles.jules)}</p>` : ""}
              ${item.profiles?.momdad || item.why ? `<p><strong>Mom &amp; Dad:</strong> ${escapeHtml(item.profiles?.momdad || item.why)}</p>` : ""}
              <a class="external-link" href="${link}" target="_blank" rel="noopener">Official site</a>
            </details>
          </div>`)
        .addTo(map);
      return;
    }
    let bodyHtml;
    if (isEliette) {
      const content = eliettePopupContent(item);
      bodyHtml = `
        <p>${escapeHtml(item.summary || "")}</p>
        ${content.coolFact ? `<p class="elsie-popup-angle">✨ <strong>Cool fact to know:</strong> ${escapeHtml(content.coolFact)}</p>` : ""}
        <p class="elsie-popup-angle">🔎 ${escapeHtml(content.detailPrompt)}</p>
        ${content.grossFunny ? `<p class="elsie-popup-angle">😝 ${escapeHtml(content.grossFunny)}</p>` : ""}`;
    } else if (isEmma) {
      const content = emmaPopupContent(item);
      bodyHtml = `
        <p><strong>Why do people go here?</strong> ${escapeHtml(content.whyGo)}</p>
        ${content.funFact ? `<p class="elsie-popup-angle"><strong>Fun fact:</strong> ${escapeHtml(content.funFact)}</p>` : ""}
        <p class="elsie-popup-angle"><strong>How it got found:</strong> ${escapeHtml(content.discovery)}</p>
        <p class="elsie-popup-angle"><strong>Mom &amp; Dad would say:</strong> ${escapeHtml(content.momDad)}</p>
        <p class="elsie-popup-angle">😄 ${escapeHtml(content.joke)}</p>`;
    } else if (isKatrina) {
      const content = katrinaPopupContent(item);
      bodyHtml = `
        <p>${escapeHtml(item.summary || item.why || "")}</p>
        ${content.whyAngle ? `<p class="elsie-popup-angle"><strong>Why here?</strong> ${escapeHtml(content.whyAngle)}</p>` : ""}
        ${content.hiddenFact ? `<p class="elsie-popup-angle"><strong>Hidden fact:</strong> ${escapeHtml(content.hiddenFact)}</p>` : ""}
        <p class="elsie-popup-angle"><strong>Historical fiction:</strong> ${escapeHtml(content.historicalFiction)}</p>
        <p class="elsie-popup-angle"><strong>${escapeHtml(content.quiz)}</strong></p>`;
    } else if (profile === "momdad") {
      bodyHtml = `
        <p>${escapeHtml(item.summary || "")}</p>
        ${item.why ? `<p class="elsie-popup-angle"><strong>Why it matters:</strong> ${escapeHtml(item.why)}</p>` : ""}
        ${item.profiles?.momdad && item.profiles.momdad !== item.why ? `<p class="elsie-popup-angle">${escapeHtml(item.profiles.momdad)}</p>` : ""}`;
    } else {
      const coolFact = ELSIE_STOP_FACTS[item.id];
      bodyHtml = `
        <p>${escapeHtml(item.summary || item.why || "")}</p>
        ${coolFact ? `<p class="elsie-popup-angle">${escapeHtml(coolFact)}</p>` : (item.profiles?.elsie ? `<p class="elsie-popup-angle">${escapeHtml(item.profiles.elsie)}</p>` : "")}`;
    }
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "260px", offset: 18, className: "elsie-marker-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card">
          <small>${escapeHtml(label)}</small>
          <strong>${escapeHtml(item.title)}</strong>
          ${bodyHtml}
          <div class="elsie-popup-actions">
            <button type="button" data-shortlist="${escapeHtml(item.title)}" data-category="${escapeHtml(item.category)}" data-url="${sourceLinkForPlace(item)}">${isStopSaved(item) ? "Saved" : "Save"}</button>
            <button type="button" data-visited-stop="${escapeHtml(item.title)}">${isStopVisited(item) ? "Visited" : "Mark visited"}</button>
          </div>
          <div class="elsie-popup-links">
            <a class="external-link" href="${googleMapsNavigationUrl(item)}" target="_blank" rel="noopener">Navigate</a>
            <a class="external-link" href="${link}" target="_blank" rel="noopener">Visit official site</a>
          </div>
        </div>`)
      .addTo(map);
  }

  /* ---------- Elsie haunted route layer ---------- */

  function hauntedStops() {
    return Array.isArray(window.HAUNTED_STOPS) ? window.HAUNTED_STOPS : [];
  }

  function hauntedMatchForStop(item) {
    if (activeProfile !== "elsie" || !item) return null;
    const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const title = norm(item.title || item.name);
    return hauntedStops().find((stop) =>
      norm(stop.title) === title ||
      (Number.isFinite(item.lat) && haversineMiles({ lat: item.lat, lon: item.lon }, { lat: stop.lat, lon: stop.lon }) < 0.35)
    ) || null;
  }

  function elsieGhostIconSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="#241a3d" stroke="#141414" stroke-width="4"/><path d="M32 13c-9 0-14 7.5-14 15.5V45l4.6-3.4 4.7 3.4 4.7-3.4 4.7 3.4 4.7-3.4L46 45V28.5C46 20.5 41 13 32 13z" fill="#f2ebff" stroke="#141414" stroke-width="3"/><path d="M25 28.5q1.8-2.6 3.6 0" stroke="#141414" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="38.5" cy="28" r="2.8" fill="#141414"/><circle cx="39.4" cy="27.1" r="1" fill="#fff"/><path d="M29 35q3 2.4 6 0" stroke="#141414" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="21" cy="18" r="1.5" fill="#b79ef2"/><circle cx="46" cy="16" r="1.2" fill="#b79ef2"/><path d="M47 40l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#b79ef2"/></svg>`;
  }

  function registerElsieGhostIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-ghost"))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage("elsie-ghost")) map.addImage("elsie-ghost", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(elsieGhostIconSvg())}`;
    });
  }

  function addElsieHauntedLayer(map) {
    if (!map || activeProfile !== "elsie" || map.getLayer("elsie-haunted")) return;
    const stops = hauntedStops();
    if (!stops.length) return;
    if (!map.getSource("elsie-haunted-stops")) {
      map.addSource("elsie-haunted-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stops.map((stop) => ({
            type: "Feature",
            properties: { id: stop.id },
            geometry: { type: "Point", coordinates: [stop.lon, stop.lat] }
          }))
        }
      });
    }
    map.addLayer({
      id: "elsie-haunted",
      type: "symbol",
      source: "elsie-haunted-stops",
      layout: {
        "icon-image": "elsie-ghost",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "elsie-haunted", (event) => {
      const stop = hauntedStops().find((item) => item.id === event.features[0].properties.id);
      if (stop) openElsieHauntedPopup(map, stop, event.features[0].geometry.coordinates);
    });
    map.on("mouseenter", "elsie-haunted", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "elsie-haunted", () => { map.getCanvas().style.cursor = ""; });
  }

  function openElsieHauntedPopup(map, stop, coordinates) {
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    const preview = byId("homeAttractionPreview");
    if (preview) { preview.hidden = true; preview.innerHTML = ""; }
    const detour = stop.detourMiles ? `${stop.detourMiles} mi detour` : "";
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "270px", offset: 18, className: "elsie-marker-popup elsie-haunted-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card">
          <small>👻 Haunted Route</small>
          <strong>${escapeHtml(stop.title)}</strong>
          <p class="elsie-sheet-meta">${escapeHtml(stop.city)}, ${escapeHtml(stop.state)} · ${escapeHtml(stop.siteType)}${detour ? ` · ${escapeHtml(detour)}` : ""}</p>
          ${stop.history ? `<p><strong>The history:</strong> ${escapeHtml(stop.history)}</p>` : ""}
          <p class="elsie-popup-angle"><strong>What people report:</strong> ${escapeHtml(stop.phenomenon)}</p>
          <p class="elsie-popup-angle"><strong>Evidence:</strong> ${escapeHtml(stop.evidence)}</p>
          <p class="elsie-popup-angle"><strong>Best visit:</strong> ${escapeHtml(stop.visit)}</p>
          ${stop.access ? `<p class="elsie-popup-angle">⚠️ ${escapeHtml(stop.access)}</p>` : ""}
          <div class="elsie-popup-links">
            <a class="external-link" href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${stop.lat}%2C${stop.lon}" target="_blank" rel="noopener">Navigate</a>
            ${stop.official ? `<a class="external-link" href="${escapeHtml(stop.official)}" target="_blank" rel="noopener">Official site</a>` : ""}
            ${stop.folklore && stop.folklore !== stop.official ? `<a class="external-link" href="${escapeHtml(stop.folklore)}" target="_blank" rel="noopener">The story</a>` : ""}
          </div>
        </div>`)
      .addTo(map);
  }

  /* ---------- Katrina story quest layer (book / ghost / fashion) ---------- */

  function katrinaQuestStops() {
    return Array.isArray(window.KATRINA_STOPS) ? window.KATRINA_STOPS : [];
  }

  function katrinaQuestMatchForStop(item) {
    if (activeProfile !== "katrina" || !item) return null;
    const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const title = norm(item.title || item.name);
    return katrinaQuestStops().find((stop) =>
      norm(stop.title) === title ||
      (Number.isFinite(item.lat) && haversineMiles({ lat: item.lat, lon: item.lon }, { lat: stop.lat, lon: stop.lon }) < 0.35)
    ) || null;
  }

  function katrinaHauntIconSvg(type) {
    const base = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="${fill}" stroke="#141414" stroke-width="4"/>${inner}</svg>`;
    switch (type) {
      case "book": return base("#8a5a2b", `<path d="M32 20c-4-3-9-3.5-13-2v26c4-1.5 9-1 13 2 4-3 9-3.5 13-2V18c-4-1.5-9-1-13 2z" fill="#f2e3c2" stroke="#141414" stroke-width="3" stroke-linejoin="round"/><path d="M32 20v26" stroke="#141414" stroke-width="2.4"/><path d="M23 25h6M23 30h6M35 25h6M35 30h6M35 35h6" stroke="#141414" stroke-width="1.6" stroke-linecap="round"/><circle cx="47" cy="16" r="1.6" fill="#ffe25c"/>`);
      case "fashion": return base("#3d2c52", `<path d="M32 15a3 3 0 1 1 3 3c-1.6 0-3 1.2-3 3" fill="none" stroke="#d9c069" stroke-width="2.6" stroke-linecap="round"/><path d="M32 21L16 30h32z" fill="none" stroke="#d9c069" stroke-width="2.6" stroke-linejoin="round"/><path d="M24 30h16l3 16H21z" fill="#c9b3ef" stroke="#141414" stroke-width="3" stroke-linejoin="round"/><path d="M26 36h12M25 41h14" stroke="#141414" stroke-width="1.5"/><path d="M47 42l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z" fill="#ffe25c" stroke="#141414" stroke-width="1.3"/>`);
      case "ghost": return base("#4b3a6e", `<path d="M32 14c-8.5 0-13 7-13 14.5V45l4.4-3.2 4.3 3.2 4.3-3.2 4.3 3.2 4.3-3.2L45 45V28.5C45 21 40.5 14 32 14z" fill="#efe9ff" stroke="#141414" stroke-width="3"/><circle cx="27" cy="29" r="2.4" fill="#141414"/><circle cx="37" cy="29" r="2.4" fill="#141414"/><circle cx="27.8" cy="28.2" r="0.8" fill="#fff"/><circle cx="37.8" cy="28.2" r="0.8" fill="#fff"/><path d="M28 35q4 3 8 0" stroke="#141414" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 16l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#ffd9f0"/>`);
      default: return base("#a35d2d", `<circle cx="32" cy="32" r="8" fill="#fffdf7" stroke="#141414" stroke-width="3"/>`);
    }
  }

  function registerKatrinaHauntIcons(map) {
    const jobs = ["book", "ghost", "fashion"].map((type) => new Promise((resolve) => {
      const name = `katrina-haunt-${type}`;
      if (!map || (map.hasImage && map.hasImage(name))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(katrinaHauntIconSvg(type))}`;
    }));
    return Promise.all(jobs);
  }

  function addKatrinaQuestLayer(map) {
    if (!map || activeProfile !== "katrina" || map.getLayer("katrina-quest")) return;
    const stops = katrinaQuestStops();
    if (!stops.length) return;
    if (!map.getSource("katrina-quest-stops")) {
      map.addSource("katrina-quest-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stops.map((stop) => ({
            type: "Feature",
            properties: { id: stop.id, questIcon: `katrina-haunt-${stop.icon}` },
            geometry: { type: "Point", coordinates: [stop.lon, stop.lat] }
          }))
        }
      });
    }
    map.addLayer({
      id: "katrina-quest",
      type: "symbol",
      source: "katrina-quest-stops",
      layout: {
        "icon-image": ["get", "questIcon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "katrina-quest", (event) => {
      const stop = katrinaQuestStops().find((item) => item.id === event.features[0].properties.id);
      if (stop) openKatrinaQuestPopup(map, stop, event.features[0].geometry.coordinates);
    });
    map.on("mouseenter", "katrina-quest", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "katrina-quest", () => { map.getCanvas().style.cursor = ""; });
  }

  const KATRINA_QUEST_LABELS = { "book": "Books & Story Places", "ghost": "Mystery & Unusual History", "fashion": "Creative & Crossover" };

  function openKatrinaQuestPopup(map, stop, coordinates) {
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    const preview = byId("homeAttractionPreview");
    if (preview) { preview.hidden = true; preview.innerHTML = ""; }
    const detour = stop.detourMiles ? `${stop.detourMiles} mi detour` : "";
    const time = stop.stopMinutes ? `~${stop.stopMinutes} min` : "";
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "280px", offset: 18, className: "elsie-marker-popup katrina-quest-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card">
          <small>${escapeHtml(KATRINA_QUEST_LABELS[stop.icon] || stop.interest)}</small>
          <strong>${escapeHtml(stop.title)}</strong>
          <p class="elsie-sheet-meta">${escapeHtml(stop.city)}, ${escapeHtml(stop.state)}${detour ? ` · ${escapeHtml(detour)}` : ""}${time ? ` · ${escapeHtml(time)}` : ""}</p>
          <p><strong>The story:</strong> ${escapeHtml(stop.storyConnection)}</p>
          ${stop.suggestedBook ? `<p class="elsie-popup-angle">📚 <strong>Suggested book:</strong> ${escapeHtml(stop.suggestedBook)}</p>` : ""}
          <p>${escapeHtml(stop.experience)}</p>
          <p class="elsie-popup-angle"><strong>Why it fits you:</strong> ${escapeHtml(stop.why)}</p>
          <p class="elsie-popup-angle"><strong>Story quest:</strong> ${escapeHtml(stop.quest)}</p>
          ${stop.sisterCrossover ? `<p class="elsie-popup-angle"><strong>Sister crossover:</strong> ${escapeHtml(stop.sisterCrossover)}</p>` : ""}
          ${stop.access ? `<p class="elsie-popup-angle">⚠️ ${escapeHtml(stop.access)}</p>` : ""}
          <div class="elsie-popup-links">
            <a class="external-link" href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${stop.lat}%2C${stop.lon}" target="_blank" rel="noopener">Navigate</a>
            ${stop.official ? `<a class="external-link" href="${escapeHtml(stop.official)}" target="_blank" rel="noopener">Official site</a>` : ""}
            ${stop.learnMore && stop.learnMore !== stop.official ? `<a class="external-link" href="${escapeHtml(stop.learnMore)}" target="_blank" rel="noopener">Learn more</a>` : ""}
          </div>
        </div>`)
      .addTo(map);
  }

  /* ---------- Jules speed hero layer + games ---------- */

  function julesRouteStops() {
    return Array.isArray(window.JULES_STOPS) ? window.JULES_STOPS : [];
  }

  function julesMatchForStop(item) {
    if (activeProfile !== "jules" || !item) return null;
    const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const title = norm(item.title || item.name);
    return julesRouteStops().find((stop) =>
      norm(stop.title) === title ||
      (Number.isFinite(item.lat) && haversineMiles({ lat: item.lat, lon: item.lon }, { lat: stop.lat, lon: stop.lon }) < 0.35)
    ) || null;
  }

  function addJulesRouteLayer(map) {
    if (!map || activeProfile !== "jules" || map.getLayer("jules-route-layer")) return;
    const stops = julesRouteStops();
    if (!stops.length) return;
    if (!map.getSource("jules-route-stops")) {
      map.addSource("jules-route-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stops.map((stop) => ({
            type: "Feature",
            properties: { id: stop.id, heroIcon: `jules-${stop.icon}` },
            geometry: { type: "Point", coordinates: [stop.lon, stop.lat] }
          }))
        }
      });
    }
    map.addLayer({
      id: "jules-route-layer",
      type: "symbol",
      source: "jules-route-stops",
      layout: {
        "icon-image": ["get", "heroIcon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.4, 6, 0.56, 9, 0.68, 12, 0.78],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "jules-route-layer", (event) => {
      const stop = julesRouteStops().find((item) => item.id === event.features[0].properties.id);
      if (stop) openJulesPopup(map, stop, event.features[0].geometry.coordinates);
    });
    map.on("mouseenter", "jules-route-layer", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "jules-route-layer", () => { map.getCanvas().style.cursor = ""; });
  }

  const FAMILY_LOCATOR_PROFILES = ["katrina"];

  function registerEmmaGpsAgent(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("emma-gps-agent"))) return resolve();
      const image = new Image(240, 240);
      image.onload = () => {
        try { if (!map.hasImage("emma-gps-agent")) map.addImage("emma-gps-agent", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/emma-gps-agent.png";
    });
  }

  function registerElsieGpsPhoto(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-gps-photo"))) return resolve();
      const image = new Image(240, 240);
      image.onload = () => {
        try { if (!map.hasImage("elsie-gps-photo")) map.addImage("elsie-gps-photo", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/elsie-gps-photo.png";
    });
  }

  function registerElietteGpsImage(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("eliette-gps-jeep"))) return resolve();
      const image = new Image(240, 240);
      image.onload = () => {
        try { if (!map.hasImage("eliette-gps-jeep")) map.addImage("eliette-gps-jeep", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/eliette-gps-jeep.png";
    });
  }

  function registerFamilyGpsImage(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("family-gps-marker"))) return resolve();
      const image = new Image(240, 240);
      image.onload = () => {
        try { if (!map.hasImage("family-gps-marker")) map.addImage("family-gps-marker", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/family-gps-marker.png";
    });
  }

  const JULES_MARKER_IMAGES = { sonic: { file: "/jules-gps.png", name: "jules-gps-car-sonic" }, f1: { file: "/jules-gps-f1.png", name: "jules-gps-car-f1" } };

  function julesGpsImageName() {
    return JULES_MARKER_IMAGES[state.julesMarkerStyle]?.name || JULES_MARKER_IMAGES.sonic.name;
  }

  function registerJulesGpsImage(map) {
    const jobs = Object.values(JULES_MARKER_IMAGES).map(({ file, name }) => new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage(name))) return resolve();
      const image = new Image(224, 224);
      image.onload = () => {
        try { if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = file;
    }));
    return Promise.all(jobs);
  }

  const JULES_LOOKFOR_MAP = [
    [/race car|racecar|nascar|stock car/i, "🏎️"], [/pit crew|pit stop/i, "🔧"], [/flag/i, "🏁"],
    [/engine|motor/i, "⚙️"], [/grandstand|crowd|fans|cheer/i, "📣"], [/train|locomotive|railroad|rail/i, "🚂"],
    [/plane|jet|aviation|fly/i, "✈️"], [/rocket|space/i, "🚀"], [/ship|boat|ferry|icebreaker/i, "🚢"],
    [/bridge/i, "🌉"], [/lighthouse/i, "🗼"], [/baseball|home run|bat\b/i, "⚾"], [/soccer/i, "⚽"],
    [/football|helmet/i, "🏈"], [/hockey|puck|ice rink/i, "🏒"], [/basketball/i, "🏀"],
    [/mascot/i, "🎉"], [/horse/i, "🐎"], [/deer|wildlife|animal/i, "🦌"], [/bird|eagle/i, "🦅"],
    [/fish/i, "🐟"], [/dog\b/i, "🐕"], [/dino|fossil/i, "🦕"], [/water|lake|river|falls/i, "💧"],
    [/sand|dune|beach/i, "🏖️"], [/ice cream|treat|snack|food|popcorn|hot dog/i, "🍦"],
    [/truck|machine|crane|tractor/i, "🚛"], [/tunnel|slide|climb/i, "🛝"], [/light|glow|dark sky|star/i, "✨"],
    [/hero|shield|power/i, "🦸"], [/gecko|lizard/i, "🦎"], [/fast|speed|zoom|quick/i, "💨"],
    [/loud|roar|noise/i, "🔊"], [/count|number/i, "🔢"], [/color|paint/i, "🎨"], [/flag.*wave|wave.*flag/i, "👋"]
  ];

  function julesLookForEmojis(stop) {
    const text = `${stop.title} ${stop.why} ${stop.mission} ${stop.theme} ${stop.character}`;
    const found = [];
    for (const [pattern, emoji] of JULES_LOOKFOR_MAP) {
      if (pattern.test(text) && !found.includes(emoji)) found.push(emoji);
      if (found.length >= 6) break;
    }
    return found.length ? found : ["⭐"];
  }

  function openJulesPopup(map, stop, coordinates) {
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    const preview = byId("homeAttractionPreview");
    if (preview) { preview.hidden = true; preview.innerHTML = ""; }
    const markerArt = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(julesIconSvg(stop.icon))}`;
    const lookFor = julesLookForEmojis(stop);
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "280px", offset: 18, className: "elsie-marker-popup jules-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card jules-popup-card">
          <div class="jules-popup-hero">
            <img class="jules-popup-art" src="${markerArt}" alt="" width="72" height="72">
            <div class="jules-popup-emoji" aria-hidden="true">${stop.emoji}</div>
          </div>
          <strong>${escapeHtml(stop.title)}</strong>
          <div class="jules-lookfor" aria-label="Things to look for">
            <span class="jules-lookfor-eyes" aria-hidden="true">👀</span>
            ${lookFor.map((emoji) => `<span class="jules-lookfor-item">${emoji}</span>`).join("")}
          </div>
          ${stop.noise && /loud/i.test(stop.noise) ? `<div class="jules-lookfor"><span class="jules-lookfor-item">🙉</span><span class="jules-lookfor-item">🔊</span></div>` : ""}
          <div class="elsie-popup-actions jules-popup-actions">
            <button type="button" data-shortlist="${escapeHtml(stop.title)}" data-category="${escapeHtml(stop.theme)}" data-url="${escapeHtml(stop.official)}" aria-label="Save this stop">⭐</button>
            <button type="button" data-visited-stop="${escapeHtml(stop.title)}" aria-label="Mark visited">✅</button>
            <a href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${stop.lat}%2C${stop.lon}" target="_blank" rel="noopener" aria-label="Navigate">🗺️</a>
          </div>
          <details class="jules-adult-notes"><summary>Grown-up notes</summary>
            <p><strong>Why he'll like it:</strong> ${escapeHtml(stop.why)}</p>
            <p><strong>Kid mission (read aloud):</strong> ${escapeHtml(stop.mission)}</p>
            <p>${escapeHtml(stop.adultNotes)}${stop.noise ? ` ${escapeHtml(stop.noise)}.` : ""}</p>
            <a class="external-link" href="${escapeHtml(stop.official)}" target="_blank" rel="noopener">Official site</a>
          </details>
        </div>`)
      .addTo(map);
  }

  /* ----- Jules games (Tic-Tac-Toe + I Spy) ----- */

  let julesTicTacToe = { board: Array(9).fill(""), turn: "🔵", winner: null };
  const JULES_ISPY_ITEMS = ["🚛", "🚜", "🏍️", "🚌", "🐄", "🐎", "🚂", "⛽", "🌽", "💧", "🚧", "🇺🇸"];
  let julesISpyFound = new Set();
  let julesRingCount = 0;
  let julesRingBoard = Array(12).fill("💍");
  const JULES_MEMORY_ICONS = ["🐱", "🦉", "🦎", "🦌", "🗼", "⛴️", "🌲", "🦃"];
  let julesMemoryDeck = [];
  let julesMemoryFlipped = [];
  let julesMemoryMatched = new Set();
  let julesMemoryMoves = 0;

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(stableRandom(`shuffle-${i}-${a.length}-${Date.now()}`) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function stableRandom(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return (h % 1000) / 1000;
  }

  function newJulesMemoryDeck() {
    const pairs = shuffleArray([...JULES_MEMORY_ICONS, ...JULES_MEMORY_ICONS]);
    julesMemoryDeck = pairs;
    julesMemoryFlipped = [];
    julesMemoryMatched = new Set();
    julesMemoryMoves = 0;
  }
  if (!julesMemoryDeck.length) newJulesMemoryDeck();

  function julesCheckWinner(board) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.every(Boolean) ? "tie" : null;
  }

  function renderJulesGamesSheet() {
    const t = julesTicTacToe;
    const status = t.winner === "tie" ? "🤝 Tie!" : t.winner ? `${t.winner} wins! 🎉` : `${t.turn}'s turn`;
    return `${elsieSheetHead("🎮 Games")}
      <div class="jules-games">
        <h4>❌⭕ Tic-Tac-Toe</h4>
        <p class="jules-ttt-status">${status}</p>
        <div class="jules-ttt-board" role="grid" aria-label="Tic tac toe board">
          ${t.board.map((cell, index) => `<button type="button" class="jules-ttt-cell" data-jules-ttt="${index}" ${cell || t.winner ? "disabled" : ""} aria-label="Square ${index + 1}">${cell || ""}</button>`).join("")}
        </div>
        <button type="button" class="jules-game-reset" data-jules-ttt-reset>🔄 New game</button>
        <h4>👀 I Spy</h4>
        <p class="jules-ttt-status">Tap it when you spot it out the window!</p>
        <div class="jules-ispy-grid">
          ${JULES_ISPY_ITEMS.map((emoji) => `<button type="button" class="jules-ispy-item ${julesISpyFound.has(emoji) ? "is-found" : ""}" data-jules-ispy="${emoji}" aria-label="I spy item">${emoji}${julesISpyFound.has(emoji) ? "✔️" : ""}</button>`).join("")}
        </div>
        <p class="jules-ttt-status">${julesISpyFound.size}/${JULES_ISPY_ITEMS.length} found${julesISpyFound.size === JULES_ISPY_ITEMS.length ? " — 🏆 ALL FOUND!" : ""}</p>
        <button type="button" class="jules-game-reset" data-jules-ispy-reset>🔄 Start over</button>
        <h4>💍 Ring Dash</h4>
        <p class="jules-ttt-status">Tap the rings to collect them, just like Sonic! Rings: ${julesRingCount}</p>
        <div class="jules-ispy-grid">
          ${julesRingBoard.map((ring, index) => `<button type="button" class="jules-ispy-item" data-jules-ring="${index}" aria-label="Collect ring">${ring}</button>`).join("")}
        </div>
        <button type="button" class="jules-game-reset" data-jules-ring-reset>🔄 Start over</button>
        <h4>🐱🦉 Island Hero Match</h4>
        <p class="jules-ttt-status">Flip two cards to find a match! Matches: ${julesMemoryMatched.size / 2}/${JULES_MEMORY_ICONS.length}${julesMemoryMatched.size === julesMemoryDeck.length ? " — 🏆 ALL MATCHED!" : ""}</p>
        <div class="jules-memory-grid">
          ${julesMemoryDeck.map((icon, index) => {
            const revealed = julesMemoryFlipped.includes(index) || julesMemoryMatched.has(index);
            return `<button type="button" class="jules-memory-card ${revealed ? "is-revealed" : ""} ${julesMemoryMatched.has(index) ? "is-matched" : ""}" data-jules-memory="${index}" aria-label="Memory card">${revealed ? icon : "❓"}</button>`;
          }).join("")}
        </div>
        <button type="button" class="jules-game-reset" data-jules-memory-reset>🔄 New game</button>
      </div>`;
  }

  document.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-jules-ttt]");
    if (cell) {
      const index = Number(cell.dataset.julesTtt);
      if (!julesTicTacToe.board[index] && !julesTicTacToe.winner) {
        julesTicTacToe.board[index] = julesTicTacToe.turn;
        julesTicTacToe.winner = julesCheckWinner(julesTicTacToe.board);
        julesTicTacToe.turn = julesTicTacToe.turn === "🔵" ? "🟡" : "🔵";
        openElsieSheet("julesgames");
      }
      return;
    }
    if (event.target.closest("[data-jules-ttt-reset]")) {
      julesTicTacToe = { board: Array(9).fill(""), turn: "🔵", winner: null };
      openElsieSheet("julesgames");
      return;
    }
    const spy = event.target.closest("[data-jules-ispy]");
    if (spy) {
      const emoji = spy.dataset.julesIspy;
      julesISpyFound.has(emoji) ? julesISpyFound.delete(emoji) : julesISpyFound.add(emoji);
      openElsieSheet("julesgames");
      return;
    }
    if (event.target.closest("[data-jules-ispy-reset]")) {
      julesISpyFound = new Set();
      openElsieSheet("julesgames");
      return;
    }
    const ring = event.target.closest("[data-jules-ring]");
    if (ring) {
      julesRingCount++;
      openElsieSheet("julesgames");
      return;
    }
    if (event.target.closest("[data-jules-ring-reset]")) {
      julesRingCount = 0;
      openElsieSheet("julesgames");
      return;
    }
    const memoryCard = event.target.closest("[data-jules-memory]");
    if (memoryCard) {
      const index = Number(memoryCard.dataset.julesMemory);
      if (julesMemoryMatched.has(index) || julesMemoryFlipped.includes(index) || julesMemoryFlipped.length >= 2) return;
      julesMemoryFlipped.push(index);
      if (julesMemoryFlipped.length === 2) {
        julesMemoryMoves++;
        const [a, b] = julesMemoryFlipped;
        if (julesMemoryDeck[a] === julesMemoryDeck[b]) {
          julesMemoryMatched.add(a);
          julesMemoryMatched.add(b);
          julesMemoryFlipped = [];
          openElsieSheet("julesgames");
        } else {
          openElsieSheet("julesgames");
          setTimeout(() => { julesMemoryFlipped = []; openElsieSheet("julesgames"); }, 850);
        }
      } else {
        openElsieSheet("julesgames");
      }
      return;
    }
    if (event.target.closest("[data-jules-memory-reset]")) {
      newJulesMemoryDeck();
      openElsieSheet("julesgames");
      return;
    }
  });

  /* ---------- Mom & Dad family overlay (all kids' stop sets, deco style) ---------- */

  function momdadDecoOverlayIconSvg(origin) {
    const NAVY = "#123a5c", GOLD = "#d9a441", CREAM = "#f5efdf", TEAL = "#2e7f7a";
    const frame = (inner, accent) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path d="M32 4l6 6h8v8l6 6-6 6v8l4 4-4 4v8h-8l-6 6-6-6h-8v-8l-4-4 4-4v-8l-6-6 6-6v-8h8z" fill="${NAVY}" stroke="${accent}" stroke-width="2.5"/><circle cx="32" cy="32" r="19" fill="none" stroke="${accent}" stroke-width="1.2"/>${inner}</svg>`;
    switch (origin) {
      case "elsie": return frame(`<path d="M32 20c-6 0-9.5 5-9.5 10.5V42l3.2-2.4 3.1 2.4 3.2-2.4 3.1 2.4 3.2-2.4 3.2 2.4V30.5C41.5 25 38 20 32 20z" fill="${CREAM}" stroke="${GOLD}" stroke-width="1.8"/><circle cx="28.5" cy="30" r="1.7" fill="${NAVY}"/><circle cx="35.5" cy="30" r="1.7" fill="${NAVY}"/>`, "#8f7bd9");
      case "katrina": return frame(`<path d="M32 24c-3-2.2-7-2.6-9.5-1.5V41c2.5-1.1 6.5-.7 9.5 1.5 3-2.2 7-2.6 9.5-1.5V22.5C39 21.4 35 21.8 32 24z" fill="${CREAM}" stroke="${GOLD}" stroke-width="1.8"/><path d="M32 24v18.5" stroke="${GOLD}" stroke-width="1.4"/>`, "${GOLD}".replace("${GOLD}", "#d9a441"));
      case "emma": return frame(`<path d="M26 20h9l-4.5 9H36L27 44l3-11h-6z" fill="${GOLD}" stroke="${CREAM}" stroke-width="1.4" stroke-linejoin="round"/>`, "#c97fa8");
      case "jules": return frame(`<circle cx="32" cy="32" r="9" fill="none" stroke="${GOLD}" stroke-width="4.5"/><path d="M44 26l4-2M45 32h5M44 38l4 2" stroke="${TEAL}" stroke-width="2.2" stroke-linecap="round"/>`, "#5aa4d9");
      default: return frame(`<circle cx="32" cy="32" r="7" fill="${GOLD}"/>`, "#d9a441");
    }
  }

  function registerMomdadOverlayIcons(map) {
    const jobs = ["elsie", "katrina", "emma", "jules"].map((origin) => new Promise((resolve) => {
      const name = `momdad-deco-${origin}`;
      if (!map || (map.hasImage && map.hasImage(name))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(momdadDecoOverlayIconSvg(origin))}`;
    }));
    return Promise.all(jobs);
  }

  function addFamilyOverlayLayer(map) {
    if (!map || activeProfile !== "momdad" || map.getLayer("family-overlay")) return;
    const features = [];
    hauntedStops().forEach((stop) => features.push({ type: "Feature", properties: { origin: "elsie", id: stop.id, decoIcon: "momdad-deco-elsie" }, geometry: { type: "Point", coordinates: [stop.lon, stop.lat] } }));
    katrinaQuestStops().forEach((stop) => features.push({ type: "Feature", properties: { origin: "katrina", id: stop.id, decoIcon: "momdad-deco-katrina" }, geometry: { type: "Point", coordinates: [stop.lon, stop.lat] } }));
    emmaRouteStops().forEach((stop) => features.push({ type: "Feature", properties: { origin: "emma", id: stop.id, decoIcon: "momdad-deco-emma" }, geometry: { type: "Point", coordinates: [stop.lon, stop.lat] } }));
    julesRouteStops().forEach((stop) => features.push({ type: "Feature", properties: { origin: "jules", id: stop.id, decoIcon: "momdad-deco-jules" }, geometry: { type: "Point", coordinates: [stop.lon, stop.lat] } }));
    if (!features.length) return;
    if (!map.getSource("family-overlay-stops")) {
      map.addSource("family-overlay-stops", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 46
      });
    }
    map.addLayer({
      id: "family-overlay-clusters",
      type: "circle",
      source: "family-overlay-stops",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#123a5c",
        "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 25, 24],
        "circle-stroke-width": 3,
        "circle-stroke-color": "#d9a441"
      }
    });
    map.addLayer({
      id: "family-overlay-cluster-count",
      type: "symbol",
      source: "family-overlay-stops",
      filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13 },
      paint: { "text-color": "#f5efdf" }
    });
    map.addLayer({
      id: "family-overlay",
      type: "symbol",
      source: "family-overlay-stops",
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": ["get", "decoIcon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.32, 6, 0.46, 9, 0.58, 12, 0.68],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "family-overlay-clusters", (event) => {
      const feature = event.features && event.features[0];
      if (!feature) return;
      const source = map.getSource("family-overlay-stops");
      if (!source || !source.getClusterExpansionZoom) return;
      source.getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => {
        if (error) return;
        map.easeTo({ center: feature.geometry.coordinates, zoom });
      });
    });
    map.on("mouseenter", "family-overlay-clusters", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "family-overlay-clusters", () => { map.getCanvas().style.cursor = ""; });
    map.on("click", "family-overlay", (event) => {
      const { origin, id } = event.features[0].properties;
      const coords = event.features[0].geometry.coordinates;
      if (origin === "elsie") { const stop = hauntedStops().find((s) => s.id === id); if (stop) openElsieHauntedPopup(map, stop, coords); }
      if (origin === "katrina") { const stop = katrinaQuestStops().find((s) => s.id === id); if (stop) openKatrinaQuestPopup(map, stop, coords); }
      if (origin === "emma") { const stop = emmaRouteStops().find((s) => s.id === id); if (stop) openEmmaRoutePopup(map, stop, coords); }
      if (origin === "jules") { const stop = julesRouteStops().find((s) => s.id === id); if (stop) openJulesPopup(map, stop, coords); }
    });
    map.on("mouseenter", "family-overlay", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "family-overlay", () => { map.getCanvas().style.cursor = ""; });
  }

  /* ---------- Emma sports / fashion / storm layer ---------- */

  function emmaRouteStops() {
    return Array.isArray(window.EMMA_STOPS) ? window.EMMA_STOPS : [];
  }

  function emmaMatchForStop(item) {
    if (activeProfile !== "emma" || !item) return null;
    const norm = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const title = norm(item.title || item.name);
    return emmaRouteStops().find((stop) =>
      norm(stop.title) === title ||
      (Number.isFinite(item.lat) && haversineMiles({ lat: item.lat, lon: item.lon }, { lat: stop.lat, lon: stop.lon }) < 0.35)
    ) || null;
  }

  function emmaThemeIconSvg(type) {
    const base = (fill, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29.5" fill="#fffdf7"/><circle cx="32" cy="32" r="27" fill="${fill}" stroke="#141414" stroke-width="4"/>${inner}</svg>`;
    switch (type) {
      case "stadium": return base("#2f6b46", `<path d="M14 30a18 9 0 0 1 36 0v6a18 9 0 0 1-36 0z" fill="#e9f5ec" stroke="#141414" stroke-width="3"/><ellipse cx="32" cy="30" rx="18" ry="9" fill="#bfe3c8" stroke="#141414" stroke-width="3"/><ellipse cx="32" cy="30" rx="9" ry="4.2" fill="#7cc98a" stroke="#141414" stroke-width="2.4"/><path d="M18 26v8M25 23v10M32 22v10M39 23v10M46 26v8" stroke="#141414" stroke-width="1.6"/><path d="M30 12l4-2v6" stroke="#c65c35" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
      case "dress": return base("#f4dceb", `<path d="M26 16h12l-2 7 6 4-4 21H26l-4-21 6-4z" fill="#e07aae" stroke="#141414" stroke-width="3" stroke-linejoin="round"/><path d="M26 16l-4 6M38 16l4 6" stroke="#141414" stroke-width="3" stroke-linecap="round"/><path d="M25 33h14M24 39h16" stroke="#141414" stroke-width="1.6"/><circle cx="32" cy="24" r="1.6" fill="#fffdf7"/><path d="M46 40l1.4 3.2 3.2 1.4-3.2 1.4L46 49.2 44.6 46l-3.2-1.4 3.2-1.4z" fill="#ffe25c" stroke="#141414" stroke-width="1.4"/>`);
      case "tornado": return base("#57616e", `<path d="M16 18h32M20 24h24M25 30h16M28 36h10M31 42h6M33 48h3" stroke="#eef2f6" stroke-width="4" stroke-linecap="round"/><path d="M16 18h32M20 24h24M25 30h16M28 36h10M31 42h6M33 48h3" stroke="#141414" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/><circle cx="47" cy="14" r="2" fill="#ffe25c"/><path d="M13 26l-3 2M12 33l-3 1" stroke="#c8d2dc" stroke-width="2" stroke-linecap="round"/>`);
      case "volleyball": return base("#dbeafe", `<circle cx="32" cy="32" r="16" fill="#fffdf7" stroke="#141414" stroke-width="3.4"/><path d="M20 22q9 4 24 0M18 42q10-4 27 0M32 16v32" stroke="#e0517a" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M23 26q9 3 18 0" stroke="#4f7fd9" stroke-width="2.2" fill="none"/>`);
      case "pink": return base("#ffd6ea", `<path d="M14 30a18 9 0 0 1 36 0v6a18 9 0 0 1-36 0z" fill="#fff0f7" stroke="#141414" stroke-width="3"/><ellipse cx="32" cy="30" rx="18" ry="9" fill="#ffb3d9" stroke="#141414" stroke-width="3"/><ellipse cx="32" cy="30" rx="9" ry="4.2" fill="#ff7ab8" stroke="#141414" stroke-width="2.4"/><path d="M32 12l3.6 7.4 8.2 1.2-6 5.8 1.4 8.1-7.2-3.8-7.2 3.8 1.4-8.1-6-5.8 8.2-1.2z" fill="#e0517a" stroke="#141414" stroke-width="1.6" opacity="0.9"/>`);
      default: return base("#4f7fd9", `<circle cx="32" cy="32" r="8" fill="#fffdf7" stroke="#141414" stroke-width="3"/>`);
    }
  }

  function registerEmmaThemeIcons(map) {
    const jobs = ["stadium", "dress", "tornado", "volleyball", "pink"].map((type) => new Promise((resolve) => {
      const name = `emma-theme-${type}`;
      if (!map || (map.hasImage && map.hasImage(name))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(emmaThemeIconSvg(type))}`;
    }));
    return Promise.all(jobs);
  }

  function addEmmaRouteLayer(map) {
    if (!map || activeProfile !== "emma" || map.getLayer("emma-route-stops-layer")) return;
    const stops = emmaRouteStops();
    if (!stops.length) return;
    if (!map.getSource("emma-route-stops")) {
      map.addSource("emma-route-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stops.map((stop) => ({
            type: "Feature",
            properties: { id: stop.id, themeIcon: `emma-theme-${stop.icon}` },
            geometry: { type: "Point", coordinates: [stop.lon, stop.lat] }
          }))
        }
      });
    }
    map.addLayer({
      id: "emma-route-stops-layer",
      type: "symbol",
      source: "emma-route-stops",
      layout: {
        "icon-image": ["get", "themeIcon"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "emma-route-stops-layer", (event) => {
      const stop = emmaRouteStops().find((item) => item.id === event.features[0].properties.id);
      if (stop) openEmmaRoutePopup(map, stop, event.features[0].geometry.coordinates);
    });
    map.on("mouseenter", "emma-route-stops-layer", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "emma-route-stops-layer", () => { map.getCanvas().style.cursor = ""; });
  }

  const EMMA_THEME_LABELS = { "stadium": "Sports & Stadiums", "dress": "Fashion & Design", "tornado": "Storm & Weather History" };

  function openEmmaRoutePopup(map, stop, coordinates) {
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    const preview = byId("homeAttractionPreview");
    if (preview) { preview.hidden = true; preview.innerHTML = ""; }
    const detour = stop.detourMiles ? `${stop.detourMiles} mi detour` : "";
    const time = stop.stopMinutes ? `~${stop.stopMinutes} min` : "";
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "280px", offset: 18, className: "elsie-marker-popup emma-route-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card">
          <small>${escapeHtml(EMMA_THEME_LABELS[stop.icon] || "Emma's Route")}</small>
          <strong>${escapeHtml(stop.title)}</strong>
          <p class="elsie-sheet-meta">${escapeHtml(stop.city)}, ${escapeHtml(stop.state)}${detour ? ` · ${escapeHtml(detour)}` : ""}${time ? ` · ${escapeHtml(time)}` : ""}${stop.stormEra ? ` · ${escapeHtml(stop.stormEra)}` : ""}</p>
          <p>${escapeHtml(stop.summary)}</p>
          <p><strong>The history:</strong> ${escapeHtml(stop.history)}</p>
          ${stop.why ? `<p class="elsie-popup-angle"><strong>Why it fits you:</strong> ${escapeHtml(stop.why)}</p>` : ""}
          ${stop.mission ? `<p class="elsie-popup-angle"><strong>Your mission:</strong> ${escapeHtml(stop.mission)}</p>` : ""}
          <p class="elsie-popup-angle"><strong>Mom &amp; Dad would say:</strong> ${escapeHtml(stop.momDad)}</p>
          ${stop.access ? `<p class="elsie-popup-angle">⚠️ ${escapeHtml(stop.access)}</p>` : ""}
          <div class="elsie-popup-links">
            <a class="external-link" href="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${stop.lat}%2C${stop.lon}" target="_blank" rel="noopener">Navigate</a>
            ${stop.official ? `<a class="external-link" href="${escapeHtml(stop.official)}" target="_blank" rel="noopener">Official site</a>` : ""}
            ${stop.learnMore && stop.learnMore !== stop.official ? `<a class="external-link" href="${escapeHtml(stop.learnMore)}" target="_blank" rel="noopener">Learn more</a>` : ""}
          </div>
        </div>`)
      .addTo(map);
  }

  /* ---------- Active wildfires (US NIFC/WFIGS + Canada CWFIS) ---------- */

  function registerWildfireIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-wildfire-icon"))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage("elsie-wildfire-icon")) map.addImage("elsie-wildfire-icon", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/wildfire-marker.png";
    });
  }

  let wildfireFeaturesCache = null;
  let wildfireFetchPromise = null;

  const CANADA_STAGE_LABELS = {
    "OUT": "Out / Extinguished",
    "BH": "Being Held",
    "UC": "Under Control",
    "OC": "Out of Control",
    "MO": "Monitored"
  };

  function firstDefined(obj, keys) {
    for (const k of keys) {
      if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
    }
    return null;
  }

  function formatFireDate(value) {
    if (!value) return "Not reported";
    const num = Number(value);
    const date = Number.isFinite(num) && num > 1e11 ? new Date(num) : new Date(value);
    if (isNaN(date.getTime())) return "Not reported";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function normalizeUsFireFeature(feature) {
    const p = feature.properties || {};
    const name = firstDefined(p, ["IncidentName", "poly_IncidentName"]) || "Unnamed fire";
    const start = formatFireDate(firstDefined(p, ["FireDiscoveryDateTime", "poly_CreateDate"]));
    const contained = firstDefined(p, ["PercentContained", "poly_PercentContained"]);
    const containment = contained === null ? "Not reported" : `${contained}% contained`;
    return { name, start, containment, country: "US" };
  }

  function canadaStaticFeatures() {
    const list = Array.isArray(window.CANADA_WILDFIRES) ? window.CANADA_WILDFIRES : [];
    return list.map((fire) => ({
      type: "Feature",
      properties: {
        name: fire.name,
        start: `Last updated ${formatFireDate(fire.lastUpdated)}`,
        containment: `${fire.status} \u00b7 ${Math.round(fire.hectares).toLocaleString()} hectares`,
        country: "CA"
      },
      geometry: { type: "Point", coordinates: [fire.lon, fire.lat] }
    }));
  }

  let wildfireLastError = null;

  let wildfireCountryBreakdown = null;

  function fetchWildfireFeatures() {
    if (wildfireFeaturesCache) return Promise.resolve(wildfireFeaturesCache);
    if (wildfireFetchPromise) return wildfireFetchPromise;
    const usUrl = "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0/query?where=IncidentTypeCategory%3D%27WF%27&outFields=IncidentName,FireDiscoveryDateTime,PercentContained&f=geojson&resultRecordCount=2000";
    wildfireFetchPromise = fetch(usUrl).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((usData) => {
      const features = [];
      let usCount = 0;
      (usData.features || []).forEach((f) => {
        if (!f.geometry || !f.geometry.coordinates) return;
        const info = normalizeUsFireFeature(f);
        features.push({ type: "Feature", properties: info, geometry: f.geometry });
        usCount++;
      });
      const caFeatures = canadaStaticFeatures();
      features.push(...caFeatures);
      wildfireCountryBreakdown = { us: `${usCount} loaded`, ca: `${caFeatures.length} loaded (bundled list, as of Jul 22 2026)` };
      wildfireLastError = null;
      wildfireFeaturesCache = features;
      wildfireFetchPromise = null;
      return features;
    }).catch((error) => {
      console.error("Wildfire US fetch failed:", error);
      const caFeatures = canadaStaticFeatures();
      wildfireCountryBreakdown = { us: `failed (${error?.message || error})`, ca: `${caFeatures.length} loaded (bundled list, as of Jul 22 2026)` };
      wildfireLastError = `US: ${error?.message || error}`;
      wildfireFeaturesCache = caFeatures;
      wildfireFetchPromise = null;
      return caFeatures;
    });
    return wildfireFetchPromise;
  }

  function openWildfirePopup(map, properties, coordinates) {
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "260px", offset: 14, className: "elsie-marker-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card">
          <small>🔥 Active Wildfire (${escapeHtml(properties.country === "CA" ? "Canada" : "US")})</small>
          <strong>${escapeHtml(properties.name)}</strong>
          <p class="elsie-popup-angle"><strong>Start date:</strong> ${escapeHtml(properties.start)}</p>
          <p class="elsie-popup-angle"><strong>Containment:</strong> ${escapeHtml(properties.containment)}</p>
        </div>`)
      .addTo(map);
  }

  function showWildfireToast(message) {
    let toast = byId("elsieWildfireToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "elsieWildfireToast";
      toast.className = "elsie-wildfire-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toast._hideTimer);
    toast._hideTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 6000);
  }

  /* ---------- Easter egg near Columbia ---------- */

  const EASTER_EGG_COORDS = { lat: 38.9633, lon: -92.3502 };
  const EASTER_EGG_LINKS = {
    elsie: "https://youtu.be/dhZTNgAs4Fc?is=5WV7NHEhQ8wqOMDc",
    katrina: "https://youtu.be/au3-hk-pXsM?is=PyLH66oyPf-ZEyp6",
    emma: "https://youtu.be/MtN1YnoL46Q?is=PkU2XWg_cpZ6zNE_",
    eliette: "https://youtu.be/nUsrYVxrDwI?is=GGbWF9jCwwxdAXhv",
    jules: "https://www.miniplay.com/game/sonic-the-hedgehog-sega/play"
  };

  function registerMomdadGpsPhoto(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("momdad-gps-photo"))) return resolve();
      const image = new Image(240, 240);
      image.onload = () => {
        try { if (!map.hasImage("momdad-gps-photo")) map.addImage("momdad-gps-photo", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/momdad-gps-photo.png";
    });
  }

  function registerEasterEggIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-golden-egg"))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage("elsie-golden-egg")) map.addImage("elsie-golden-egg", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/golden-egg.png";
    });
  }

  function addEasterEggLayer(map) {
    if (!map || map.getLayer("elsie-easter-egg")) return;
    const link = EASTER_EGG_LINKS[activeProfile];
    if (!link) return;
    if (!map.getSource("elsie-easter-egg-point")) {
      map.addSource("elsie-easter-egg-point", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [EASTER_EGG_COORDS.lon, EASTER_EGG_COORDS.lat] } }
      });
    }
    map.addLayer({
      id: "elsie-easter-egg",
      type: "symbol",
      source: "elsie-easter-egg-point",
      layout: {
        "icon-image": "elsie-golden-egg",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "elsie-easter-egg", () => {
      window.open(EASTER_EGG_LINKS[activeProfile], "_blank");
    });
    map.on("mouseenter", "elsie-easter-egg", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "elsie-easter-egg", () => { map.getCanvas().style.cursor = ""; });
  }

  /* ---------- NASA Hubble Easter egg ---------- */

  const NASA_EGG_COORD = { lat: 42.2917, lon: -85.5872 };
  const NASA_EGG_LINK = "https://science.nasa.gov/mission/hubble/multimedia/online-activities/the-lost-universe/";

  function registerNasaEggIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-nasa-badge"))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage("elsie-nasa-badge")) map.addImage("elsie-nasa-badge", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/nasa-badge.png";
    });
  }

  function addNasaEggLayer(map) {
    if (!map || map.getLayer("elsie-nasa-egg")) return;
    if (!map.getSource("elsie-nasa-egg-point")) {
      map.addSource("elsie-nasa-egg-point", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [NASA_EGG_COORD.lon, NASA_EGG_COORD.lat] } }
      });
    }
    map.addLayer({
      id: "elsie-nasa-egg",
      type: "symbol",
      source: "elsie-nasa-egg-point",
      layout: {
        "icon-image": "elsie-nasa-badge",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      }
    });
    map.on("click", "elsie-nasa-egg", () => {
      window.open(NASA_EGG_LINK, "_blank");
    });
    map.on("mouseenter", "elsie-nasa-egg", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "elsie-nasa-egg", () => { map.getCanvas().style.cursor = ""; });
  }

  function applyWildfireLayer(map = homeMap) {
    if (!map) return;
    if (!state.wildfiresEnabled) {
      try {
        if (map.getLayer("elsie-wildfire-points")) map.removeLayer("elsie-wildfire-points");
        if (map.getSource("elsie-wildfires")) map.removeSource("elsie-wildfires");
      } catch (error) { console.error("Wildfire layer removal error:", error); }
      return;
    }
    const fab = document.querySelector(".elsie-fire-fab");
    if (fab) { fab.textContent = "\u23f3"; fab.removeAttribute("data-fire-count"); }
    fetchWildfireFeatures().then((features) => {
      const pointFeatures = features.map((f) => {
        if (!f.geometry) return null;
        if (f.geometry.type === "Point" && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length === 2) {
          return f;
        }
        if (f.geometry.type === "MultiPoint" && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length > 0) {
          const first = f.geometry.coordinates[0];
          if (Array.isArray(first) && first.length === 2) {
            return { ...f, geometry: { type: "Point", coordinates: first } };
          }
        }
        return null;
      }).filter((f) => f && Number.isFinite(f.geometry.coordinates[0]) && Number.isFinite(f.geometry.coordinates[1]));
      if (fab) {
        fab.textContent = "\ud83d\udd25";
        fab.setAttribute("data-fire-count", String(pointFeatures.length));
        if (pointFeatures.length === 0) {
          const message = wildfireLastError
            ? `Wildfires: couldn't load data (${wildfireLastError})`
            : "Wildfires: zero fires returned from both sources.";
          fab.title = message;
          showWildfireToast(message);
        } else {
          fab.title = `${pointFeatures.length} active wildfires loaded \u2014 zoom out to see them, most are in the western US/Canada`;
          showWildfireToast(`\ud83d\udd25 ${pointFeatures.length} active wildfires loaded`);
        }
      }
      const currentMap = homeMap;
      if (!currentMap || !state.wildfiresEnabled) return;
      try {
        const collection = { type: "FeatureCollection", features: pointFeatures };
        if (currentMap.getSource("elsie-wildfires")) {
          currentMap.getSource("elsie-wildfires").setData(collection);
          return;
        }
        if (currentMap.getLayer("elsie-wildfire-points")) return;
        currentMap.addSource("elsie-wildfires", { type: "geojson", data: collection });
        currentMap.addLayer({
          id: "elsie-wildfire-points",
          type: "circle",
          source: "elsie-wildfires",
          paint: {
            "circle-color": "#ff6a1a",
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4, 6, 7, 10, 11],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#7a1f00"
          }
        });
        currentMap.on("click", "elsie-wildfire-points", (event) => {
          const feature = event.features && event.features[0];
          if (!feature) return;
          openWildfirePopup(currentMap, feature.properties, feature.geometry.coordinates);
        });
        currentMap.on("mouseenter", "elsie-wildfire-points", () => { currentMap.getCanvas().style.cursor = "pointer"; });
        currentMap.on("mouseleave", "elsie-wildfire-points", () => { currentMap.getCanvas().style.cursor = ""; });
        const breakdown = wildfireCountryBreakdown ? ` \u2014 US: ${wildfireCountryBreakdown.us} | CA: ${wildfireCountryBreakdown.ca}` : "";
        showWildfireToast(`\ud83d\udd25 ${pointFeatures.length} wildfire markers placed${breakdown}`);
      } catch (error) {
        console.error("Wildfire layer render error:", error);
        const message = `Wildfire render error: ${error && error.message ? error.message : error}`;
        if (fab) fab.title = message;
        showWildfireToast(message);
      }
    });
  }

  /* ---------- Bois Blanc Island deco layer ---------- */

  const BOIS_BLANC_STOPS = [
    { id: "BB-002", title: "Pointe aux Pins Marina & Township Dock", lat: 45.72768, lon: -84.45256, confidence: "confirmed", summary: "The island's functional front door — the township marina and ferry dock where almost every visitor arrives. Real working harbor, transient boat slips, and the first solid ground most people set foot on." },
    { id: "BB-004", title: "Northshore Natural Area", lat: 45.78053, lon: -84.38759, confidence: "confirmed", summary: "A Michigan DNR-protected stretch of the northeast shore inside Mackinaw State Forest, known for old-growth hemlock and white pine standing right along a genuinely wild strip of Great Lakes shoreline." },
    { id: "BB-005", title: "North Shore Drive Trail", lat: 45.78053, lon: -84.38759, confidence: "confirmed", summary: "The clearest documented access line along the island's north shore, running through forest-edge terrain with long open windows out to the water." },
    { id: "BB-006", title: "Snake Island & Mud Lake Natural Area", lat: 45.74346, lon: -84.38602, confidence: "confirmed", summary: "One of the island's most biologically rich spots — cobble beach, dune-and-swale terrain, and wetland habitat that Michigan's Natural Features Inventory flags for rare plants and birds." },
    { id: "BB-007", title: "Lake Mary / Liedel Landing", lat: 45.77481, lon: -84.3976, confidence: "confirmed", summary: "A township-managed boat launch on Lake Mary, in the island's northeast corner — the clearest inland-water counterpoint to the open Great Lakes shoreline everywhere else on the island." },
    { id: "BB-008", title: "Nichols Point Park", lat: 45.72864, lon: -84.39915, confidence: "confirmed", summary: "A community-backed public park on the south shore facing the Straits of Mackinac, developed in phases by the township as an open-water viewpoint west of the main dock." },
    { id: "BB-009", title: "Bright Waters Park", lat: 45.81569, lon: -84.58648, confidence: "confirmed", summary: "The island's best-documented west-end public park, tied to the town's kite festival, July 4th fireworks viewing, and a summer 5K run/walk. The best bet for open sunset views." },
    { id: "BB-010", title: "Packard Point", lat: 45.72167, lon: -84.42, confidence: "confirmed", summary: "A named shore point on the south side used as an official NOAA navigation reference — one of the most concretely documented points on the whole island, even without a formal visitor site built around it." },
    { id: "BB-012", title: "UP House (base cabin)", lat: 45.735, lon: -84.505, confidence: "estimated", summary: "Your home base for the stay, along the Lime Kiln Point Rd corridor on the island's south-southwest side. The exact rooftop couldn't be pinned from public records, so this marker is a reasonable estimate along that road, not a surveyed address point." },
    { id: "BB-013", title: "Pointe aux Pins (community)", lat: 45.729, lon: -84.454, confidence: "estimated", summary: "The island's best-defined settlement — the historic resort-era plat that grew up around the marina, museum, and W. Huron Drive. Still the practical center of the island today." },
    { id: "BB-014", title: "Mixed Forest Natural Area", lat: 45.705, lon: -84.4, confidence: "estimated", summary: "A DNR-protected natural area on the island's southeast shoreline — more a habitat than a signed attraction, but one of the core protected landscapes on Bois Blanc." },
    { id: "BB-015", title: "Michigan Nature Association Trail (Erie St.)", lat: 45.74962, lon: -84.386, confidence: "estimated", summary: "A named nature-walk trailhead near Snake Island's protected lands, referenced in township materials — a quieter way into the same rich habitat as the Snake Island/Mud Lake natural area." },
    { id: "BB-016", title: "Packard Bay", lat: 45.722, lon: -84.41, confidence: "estimated", summary: "A gentler, more sheltered stretch of shoreline just east of Packard Point — good for calmer water if the open points feel too exposed." },
    { id: "BB-017", title: "Zela Point", lat: 45.735, lon: -84.508, confidence: "estimated", summary: "A named coastal point on the island's southwest side, about 3 miles west of Pointe aux Pins near the airport corridor, and the source point for the offshore Zela Shoal that NOAA charts as a navigation hazard." },
    { id: "BB-018", title: "Lime Kiln Point", lat: 45.732, lon: -84.503, confidence: "estimated", summary: "The south-shore point the whole Lime Kiln Point Road corridor is named for — more a geographic anchor for shoreline homes than a developed site, tied to the island's lime-kiln history." },
    { id: "BB-019", title: "Martin and Reinhardt Jahn Family Nature Preserve", lat: 45.73, lon: -84.5, confidence: "estimated", summary: "A large 165-acre private conservation preserve with real Lake Huron frontage along the Lime Kiln Point corridor, called out specifically in the township's master plan as one of the island's significant protected shorelines." },
    { id: "BB-020", title: "Sand Bay", lat: 45.75, lon: -84.52, confidence: "estimated", summary: "A wide bay on the island's west side and the site of a former lumber-era settlement — a place where scenery and real 19th-century industrial history overlap." },
    { id: "BB-021", title: "Lafayette Point", lat: 45.8, lon: -84.3, confidence: "estimated", summary: "The island's documented northeast point, noted in both NOAA charts and historic topographic maps — an angular, wave-cut shoreline with a wide-open northeast horizon." },
    { id: "BB-022", title: "Point Detachee", lat: 45.8115, lon: -84.535, confidence: "estimated", category: "Local Landmark", summary: "A real NOAA-named point on the northwest shoreline that separates the long north-shore stretch from the island's west end. Biological surveys note unusual coastal fen habitat around it." },
    { id: "BB-030", title: "North Shore Drive Scenic Corridor", lat: 45.8103, lon: -84.5031, confidence: "confirmed", category: "Scenic Stretch", summary: "Roughly 6.5 miles of shoreline road identified by the township as a single scenic corridor rather than one stop. Watch for Mackinac Island across the water, occasional bridge views, rocky beach, driftwood, and beach glass along the way." },
    { id: "BB-024", title: "Bible Road Primitive Camping Area", lat: 45.815, lon: -84.545, confidence: "estimated", category: "Primitive Recreation", summary: "About six rustic campsites in the woods near the northwest rocky shoreline, reached by Bible Road \u2014 no electricity, historically very limited facilities. Look for the wooden Bible Road sign, short paths through the trees, and Mackinac Island's lights after dark." },
    { id: "BB-025", title: "Point Detachee Fen Area", lat: 45.811, lon: -84.538, confidence: "estimated", category: "Sensitive Habitat", summary: "Biological surveys identify real fens around Point Detachee, including habitat for rare shoreline plants. This is a sensitive nature zone, not an unrestricted hiking attraction \u2014 low wet limestone shoreline, small flowering plants, and cedar rather than a maintained trail." },
    { id: "BB-026", title: "Historic Bible Farm", lat: 45.814, lon: -84.548, confidence: "estimated", category: "Historic Landscape", summary: "Bible Road appears to be named for the family that farmed this area. The remaining property is private, but the historic landscape and road name are worth knowing \u2014 old clearings, apple trees, and fence lines inside otherwise unbroken forest." },
    { id: "BB-027", title: "West End Shoreline", lat: 45.812, lon: -84.575, confidence: "estimated", category: "Scenic Stretch", summary: "The open shoreline beyond Bright Waters Park itself \u2014 one of the island's best sunset and open-water stretches. Long evening light, Mackinac-bound boats, and shallow rocky water rather than a single building or attraction." },
    { id: "BB-028", title: "North Shore View of Mackinac Island", lat: 45.813, lon: -84.51, confidence: "estimated", category: "Scenic Stretch", summary: "A shoreline stretch repeatedly described as a place to see Mackinac Island and, from some openings, the Mackinac Bridge itself. In clear weather look for the Grand Hotel or island buildings, ferry traffic, and lights after sunset." },
    { id: "BB-029", title: "North Shore \"Cross\" Landmark", lat: 45.816, lon: -84.55, confidence: "estimated", category: "Local Landmark", summary: "Township records reference a recognized landmark near the north-shore camping spots known locally as \"the cross.\" A modest roadside or shoreline marker, easy to drive past without knowing it's locally known." },
    { id: "BB-023", title: "Woodland Glade Cemetery", lat: 45.755, lon: -84.495, confidence: "estimated", summary: "The island's only active township cemetery, near the airport and township hall — a modest, contemporary burial ground rather than an elaborate historic site. Please treat this stop with the same quiet respect you'd want for any active cemetery." }

  ];

  function registerIslandDecoIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-island-deco"))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage("elsie-island-deco")) map.addImage("elsie-island-deco", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/island-deco-icon.png";
    });
  }

  function openIslandDecoPopup(map, stopId, coordinates) {
    const stop = BOIS_BLANC_STOPS.find((s) => s.id === stopId);
    if (!stop) return;
    const flag = stop.confidence === "estimated"
      ? `<p class="elsie-popup-angle"><small>\ud83d\udccd Approximate location \u2014 exact coordinates weren't publicly available for this spot.</small></p>`
      : "";
    const categoryLine = stop.category ? `<small>\ud83c\udfdd\ufe0f Bois Blanc Island \u00b7 ${escapeHtml(stop.category)}</small>` : `<small>\ud83c\udfdd\ufe0f Bois Blanc Island</small>`;
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "270px", offset: 16, className: "elsie-marker-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card">
          ${categoryLine}
          <strong>${escapeHtml(stop.title)}</strong>
          <p>${escapeHtml(stop.summary)}</p>
          ${flag}
        </div>`)
      .addTo(map);
  }

  function applyIslandDecoLayer(map = homeMap) {
    if (!map) return;
    registerIslandDecoIcon(map).then(() => {
      const currentMap = homeMap;
      if (!currentMap) return;
      try {
        if (currentMap.getLayer("elsie-island-deco-layer")) return;
        const collection = {
          type: "FeatureCollection",
          features: BOIS_BLANC_STOPS.map((s) => ({
            type: "Feature",
            properties: { id: s.id },
            geometry: { type: "Point", coordinates: [s.lon, s.lat] }
          }))
        };
        currentMap.addSource("elsie-island-deco-source", { type: "geojson", data: collection });
        currentMap.addLayer({
          id: "elsie-island-deco-layer",
          type: "symbol",
          source: "elsie-island-deco-source",
          layout: {
            "icon-image": "elsie-island-deco",
            "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
          }
        });
        currentMap.on("click", "elsie-island-deco-layer", (event) => {
          const feature = event.features && event.features[0];
          if (!feature) return;
          openIslandDecoPopup(currentMap, feature.properties.id, feature.geometry.coordinates);
        });
        currentMap.on("mouseenter", "elsie-island-deco-layer", () => { currentMap.getCanvas().style.cursor = "pointer"; });
        currentMap.on("mouseleave", "elsie-island-deco-layer", () => { currentMap.getCanvas().style.cursor = ""; });
      } catch (error) {
        console.error("Island deco layer render error:", error);
      }
    });
  }

  /* ---------- Smoke / haze layer (NASA GIBS Aerosol Optical Depth) ---------- */

  function smokeTileDate() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1); // yesterday: same-day satellite data is often not yet processed
    return d.toISOString().slice(0, 10);
  }

  /* ---------- Italian heritage layer ---------- */

  const ITALIAN_HERITAGE_STOPS = [
    {
      id: "IH-001",
      title: "The Hill",
      city: "St. Louis",
      state: "MO",
      lat: 38.6103,
      lon: -90.2801,
      content: {
        elsie: {
          history: "Italian immigrants — mostly from Lombardy and Sicily — started arriving here in the 1880s to work the clay mines that used to run under this whole neighborhood. They built it from nothing into one of the most intact Italian-American neighborhoods left in the country.",
          success: "Yogi Berra and Joe Garagiola literally grew up across the street from each other here and both became baseball Hall of Famers. Four of the five St. Louis guys on the 1950 US soccer team that beat England — one of the biggest upsets in World Cup history — were from this exact neighborhood.",
          discrimination: "During WWII, over 600,000 Italian immigrants nationwide — including plenty of families right here — got officially labeled 'enemy aliens' by the U.S. government. Curfew from 8pm to 6am, banned from traveling more than 5 miles from home, radios and cameras confiscated. Some were sent to internment camps. Most people have never heard about this part of WWII history."
        },
        katrina: {
          history: "This neighborhood was built by immigrants who came here in the 1880s to work in clay mines, then slowly turned it into a self-sufficient little world — bakeries, butchers, tailors, all within walking distance, so a family barely had to leave the neighborhood.",
          success: "Two kids who grew up across the street from each other on Elizabeth Avenue — Yogi Berra and Joe Garagiola — both became Hall of Fame baseball players. It's the kind of detail a novelist would think was too on-the-nose to be real.",
          discrimination: "During WWII, the U.S. government labeled over 600,000 Italian immigrants as 'enemy aliens' — including people from neighborhoods just like this one. Curfews, travel restrictions, confiscated belongings. It's a chapter of American history that rarely makes it into the story most people know.",
          quest: "Imagine you're a kid on this street in the 1940s, suddenly told your own family is an 'enemy alien.' Write two sentences about what that week might have felt like."
        },
        emma: {
          summary: "A real Italian-American neighborhood, self-built by immigrant clay miners starting in the 1880s, still about three-quarters Italian-American today.",
          why: "It produced actual sports legends — Yogi Berra and Joe Garagiola grew up across the street from each other here, and this neighborhood sent four players to the U.S. team that pulled off a legendary 1950 World Cup upset over England.",
          momDad: "The WWII 'enemy alien' history here is real and underdiscussed — worth a conversation about how quickly a whole community's citizenship got questioned during wartime, and how that echoes into today."
        },
        eliette: "Yogi Berra and Joe Garagiola — both future baseball Hall of Famers — grew up on the exact same street here, houses across from each other. And in 1950, this one small neighborhood sent four guys to the U.S. soccer team that beat England, considered one of the biggest upsets in the sport's history.",
        jules: {
          why: "A whole neighborhood built by families who came here from Italy a long time ago — and TWO kids who grew up right across the street from each other both became super famous baseball players!",
          mission: "Find something red, white, or green — the colors of the Italian flag — somewhere nearby."
        },
        momdad: "The Hill is one of the most intact Italian-American neighborhoods in the country, built by clay-mining immigrants starting in the 1880s. Still roughly 75% Italian-American, it produced Yogi Berra and Joe Garagiola. It's also a real, underdiscussed piece of WWII history: over 600,000 Italian immigrants nationwide, likely including families here, were officially designated 'enemy aliens' — curfews, travel restrictions, confiscated property, and in some cases internment."
      }
    },
    {
      id: "IH-002",
      title: "Columbus Park (formerly the North End)",
      city: "Kansas City",
      state: "MO",
      lat: 39.1090,
      lon: -94.5750,
      content: {
        elsie: {
          history: "Italian and Sicilian immigrants built this neighborhood starting in the 1880s, right along the Missouri River near the old city market. About 85% came from Sicily specifically.",
          success: "Kids growing up here often translated for their grandparents who never fully learned English — running a household in two languages before they were teenagers. Holy Rosary Catholic Church was the actual center of the whole community for generations.",
          discrimination: "Starting in the mid-1900s, the city ran highways directly through this neighborhood — I-35, I-29, the ASB and Paseo bridges — cutting it off from the rest of Kansas City and shrinking it down. That wasn't random: cutting highways through immigrant and minority neighborhoods happened in cities all over the country during this era, and it's a big reason this neighborhood is so much smaller today than it used to be."
        },
        katrina: {
          history: "This whole neighborhood started because of a railroad — Italian and Sicilian families settled here in the 1880s specifically because it was close to the train lines and the packing houses where they could find work.",
          success: "Picture being 10 years old and being the one who has to translate everything for your own grandparents — that was just normal life for kids growing up here, running between two languages every single day.",
          discrimination: "Later on, the city built highways straight through the middle of this neighborhood, splitting it apart and shrinking it. It wasn't an accident — this happened to immigrant neighborhoods in cities across the whole country during the same era.",
          quest: "If you had to design a highway route through your own town, what's one neighborhood you'd refuse to cut through, and why?"
        },
        emma: {
          summary: "Kansas City's original Italian and Sicilian immigrant neighborhood, founded in the 1880s along the Missouri River.",
          why: "It's a real story about a community that built itself from nothing near the railroad and packing houses, then had highways deliberately routed straight through it decades later, cutting it off and shrinking it for good.",
          momDad: "The highway history here is a real, concrete example of a pattern repeated in cities nationwide — worth pointing out that infrastructure decisions weren't neutral, and this neighborhood is smaller today because of it."
        },
        eliette: "About 85% of the families who built this neighborhood came from Sicily specifically — and kids here often had to translate everything for their own grandparents, running two languages at once before they were even teenagers.",
        jules: {
          why: "A neighborhood built by families from Italy, right next to the river! Kids here helped their grandparents talk to people since they knew both English and Italian.",
          mission: "Say hello in Italian: 'Ciao!' Try it out loud."
        },
        momdad: "Columbus Park (originally called the North End) was Kansas City's Italian-Sicilian immigrant neighborhood, founded in the 1880s near the railroad and river packing houses — about 85% of residents traced back to Sicily. Holy Rosary Catholic Church anchored the community for generations. Starting mid-century, highway construction (I-35, I-29, the ASB and Paseo bridges) was routed directly through the neighborhood, isolating and shrinking it — a pattern repeated against immigrant and minority neighborhoods in cities nationwide during that era."
      }
    },
    {
      id: "IH-003",
      title: "Chicago Heights \u2014 The Hill / San Rocco",
      city: "Chicago Heights",
      state: "IL",
      lat: 41.5061,
      lon: -87.6353,
      content: {
        elsie: {
          history: "Italian immigrants poured into this steel-mill town starting in the 1890s. Almost half settled in a neighborhood literally called 'Hungry Hill,' named for how poor the first residents were. They built their own Catholic church, San Rocco, on the highest point in the neighborhood.",
          success: "Families here came from the exact same small towns back in Italy and stuck together on purpose — whole blocks of the neighborhood were basically transplanted villages. That tight-knit network is a big part of why the community actually made it.",
          discrimination: "The factory jobs immigrants got here were brutal by design: steel mills, chemical factories, dye factories — described at the time as endless heat, grime, and stench, with zero safety equipment. Immigrant labor was treated as expendable."
        },
        katrina: {
          history: "Nearly half the Italian immigrants who came to this steel-mill town ended up in one neighborhood, nicknamed 'Hungry Hill' for how poor it was when they arrived. They built their own church at the very top of the hill.",
          success: "People from the same small Italian towns moved here together on purpose, recreating whole pieces of home inside one American neighborhood — the same street might be full of families who all knew each other back in Italy.",
          discrimination: "The jobs available to immigrants here were genuinely dangerous — steel mills and chemical plants with no safety equipment at all, described at the time as nonstop heat, grime, and toxic fumes.",
          quest: "Imagine writing a letter home to Italy about your first week working in one of these factories. What's one detail you'd include?"
        },
        emma: {
          summary: "A real Italian immigrant steel-mill neighborhood nicknamed 'Hungry Hill,' built around San Rocco Catholic Church.",
          why: "It shows exactly how immigrant communities survived brutal industrial jobs by sticking together — people from the same Italian towns clustered on the same streets on purpose.",
          momDad: "The 'no safety equipment' detail is real and worth pointing out — this is what unregulated industrial labor looked like before modern workplace safety laws existed."
        },
        eliette: "Nearly half the Italian families in this whole town ended up in one neighborhood people literally nicknamed 'Hungry Hill' — and they built their own church right at the very top of it, the highest point around.",
        jules: {
          why: "A neighborhood built by families from Italy who worked really hard at big factories — they even built their own special church on top of the hill!",
          mission: "Point to the highest spot you can see nearby, like where the church was built."
        },
        momdad: "Chicago Heights drew a major wave of Italian immigrants starting in the 1890s to work its steel mills, chemical factories, and foundries. Nearly half settled in a neighborhood nicknamed 'Hungry Hill,' anchored by San Rocco Catholic Church, built at the neighborhood's highest point. Families clustered by hometown of origin, recreating village networks on individual streets. Factory conditions were genuinely dangerous — contemporary accounts describe constant heat, grime, and toxic fumes with no safety equipment, typical of unregulated immigrant industrial labor at the time."
      }
    },
    {
      id: "IH-004",
      title: "Grand Rapids Little Italy",
      city: "Grand Rapids",
      state: "MI",
      lat: 42.9556,
      lon: -85.6653,
      content: {
        elsie: {
          history: "Italian immigrants started showing up in Grand Rapids in the 1880s — first wood carvers and stonemasons from northern Italy, then a bigger wave of Sicilians around 1900. By the 1910s they'd built an actual 'Little Italy' full of their own grocery stores and businesses.",
          success: "A teenager named Giovanni Russo arrived from Sicily in 1902 and opened his own grocery store by 1905. That same family business is still running in Grand Rapids today, over 120 years later.",
          discrimination: "Immigrants who'd arrived earlier from northern Europe openly looked down on the Sicilians specifically — most Sicilian arrivals had no marketable trade skills like the wood carvers did, so their options were basically limited to laborer or street peddler, no matter how capable they actually were."
        },
        katrina: {
          history: "First it was wood carvers and stonemasons from northern Italy in the 1880s, then a much bigger wave of Sicilian families arrived around 1900 — different regions of the same country, arriving in waves, building the same neighborhood.",
          success: "A Sicilian teenager named Giovanni Russo showed up in 1902 with basically nothing and opened a small grocery store three years later. That same family's business is still open in Grand Rapids today — three generations plus.",
          discrimination: "Immigrants who'd arrived a little earlier from northern Europe looked down specifically on the Sicilians, assuming they had no real skills — even though the actual barrier was just opportunity, not ability.",
          quest: "Write one sentence Giovanni Russo might have said to himself the day he opened his store in 1905."
        },
        emma: {
          summary: "Grand Rapids' real 'Little Italy,' built starting in the 1880s by northern Italian craftsmen and then a larger wave of Sicilian immigrants.",
          why: "One family's grocery store, opened in 1905 by a teenage Sicilian immigrant, is still open in Grand Rapids under the same family name well over a century later.",
          momDad: "The internal hierarchy here is worth noting — even within immigrant communities, earlier-arriving northern Italians sometimes looked down on later-arriving Sicilians, showing how prejudice operates on more than one level at once."
        },
        eliette: "A teenager named Giovanni arrived here from Sicily in 1902 with basically nothing, and by 1905 he'd opened his own small grocery store. That exact same family business is STILL open in Grand Rapids today — over 120 years later.",
        jules: {
          why: "Families from Italy built their own neighborhood here, with their own grocery stores! One store a teenager opened is still open today, over 100 years later!",
          mission: "Look for any store nearby that might have been run by the same family for a really long time."
        },
        momdad: "Grand Rapids' Little Italy formed in two waves: northern Italian wood carvers and stonemasons in the 1880s, then a larger wave of Sicilian immigrants around 1900, settling near S. Division and later the Wealthy St./Madison Ave. corridor. Giovanni Baptista Russo arrived from Sicily in 1902 and opened a grocery store in 1905 — the same family business, G.B. Russo & Son, still operates in the area today. Worth noting: earlier-arriving northern Italian immigrants often looked down on the later-arriving Sicilians, who — lacking the same trade skills as the wood carvers — were largely limited to laborer or peddler work regardless of ability."
      }
    }
  ];

  function registerItalianHeritageIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-italian-heritage"))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage("elsie-italian-heritage")) map.addImage("elsie-italian-heritage", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/italian-heritage-icon.png";
    });
  }

  function openItalianHeritagePopup(map, stopId, coordinates) {
    const stop = ITALIAN_HERITAGE_STOPS.find((s) => s.id === stopId);
    if (!stop) return;
    const profile = activeProfile;
    const c = stop.content[profile] || stop.content.momdad;
    let bodyHtml;
    if (profile === "jules") {
      bodyHtml = `<p>${escapeHtml(c.why)}</p><p class="elsie-popup-angle">🎯 ${escapeHtml(c.mission)}</p>`;
    } else if (profile === "eliette") {
      bodyHtml = `<p class="elsie-popup-angle">${escapeHtml(c)}</p>`;
    } else if (profile === "emma") {
      bodyHtml = `<p>${escapeHtml(c.summary)}</p><p class="elsie-popup-angle"><strong>Why it matters:</strong> ${escapeHtml(c.why)}</p><p class="elsie-popup-angle">${escapeHtml(c.momDad)}</p>`;
    } else if (profile === "elsie") {
      bodyHtml = `<p>${escapeHtml(c.history)}</p><p class="elsie-popup-angle"><strong>Success story:</strong> ${escapeHtml(c.success)}</p><p class="elsie-popup-angle"><strong>What they faced:</strong> ${escapeHtml(c.discrimination)}</p>`;
    } else if (profile === "katrina") {
      bodyHtml = `<p>${escapeHtml(c.history)}</p><p class="elsie-popup-angle"><strong>Success story:</strong> ${escapeHtml(c.success)}</p><p class="elsie-popup-angle"><strong>What they faced:</strong> ${escapeHtml(c.discrimination)}</p><p class="elsie-popup-angle">✍️ ${escapeHtml(c.quest)}</p>`;
    } else {
      bodyHtml = `<p>${escapeHtml(typeof c === "string" ? c : JSON.stringify(c))}</p>`;
    }
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "270px", offset: 16, className: "elsie-marker-popup" })
      .setLngLat(coordinates)
      .setHTML(`<div class="elsie-popup-card"><small>🇮🇹 Italian Heritage</small><strong>${escapeHtml(stop.title)}</strong>${bodyHtml}</div>`)
      .addTo(map);
  }

  function applyItalianHeritageLayer(map = homeMap) {
    if (!map) return;
    registerItalianHeritageIcon(map).then(() => {
      const currentMap = homeMap;
      if (!currentMap) return;
      try {
        if (currentMap.getLayer("elsie-italian-heritage-layer")) return;
        const collection = {
          type: "FeatureCollection",
          features: ITALIAN_HERITAGE_STOPS.map((s) => ({
            type: "Feature",
            properties: { id: s.id },
            geometry: { type: "Point", coordinates: [s.lon, s.lat] }
          }))
        };
        currentMap.addSource("elsie-italian-heritage-source", { type: "geojson", data: collection });
        currentMap.addLayer({
          id: "elsie-italian-heritage-layer",
          type: "symbol",
          source: "elsie-italian-heritage-source",
          layout: {
            "icon-image": "elsie-italian-heritage",
            "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
          }
        });
        currentMap.on("click", "elsie-italian-heritage-layer", (event) => {
          const feature = event.features && event.features[0];
          if (!feature) return;
          openItalianHeritagePopup(currentMap, feature.properties.id, feature.geometry.coordinates);
        });
        currentMap.on("mouseenter", "elsie-italian-heritage-layer", () => { currentMap.getCanvas().style.cursor = "pointer"; });
        currentMap.on("mouseleave", "elsie-italian-heritage-layer", () => { currentMap.getCanvas().style.cursor = ""; });
      } catch (error) {
        console.error("Italian heritage layer render error:", error);
      }
    });
  }

  /* ---------- National Parks layer ---------- */

  const NATIONAL_PARK_STOPS = [
    {
      id: "NP-001",
      title: "Acadia National Park",
      city: "",
      state: "ME",
      lat: 44.3386,
      lon: -68.2733,
      summary: "The first national park east of the Mississippi, its granite peaks are among the first places in the entire country to see the sunrise each morning.",
      question: "If you could watch the very first sunrise in the country every day, would you actually get up for it, or is that a once-a-trip thing?",
      elsieSpooky: "Local legend holds that the ghost of a shipwrecked sailor still walks Sand Beach at night, searching for a crew that never made it to shore."
    },
    {
      id: "NP-002",
      title: "American Samoa National Park",
      city: "",
      state: "AS",
      lat: -14.2544,
      lon: -170.679,
      summary: "The only U.S. national park south of the equator, split across several Samoan islands and including coral reefs, rainforest, and traditional Samoan villages.",
      question: "This park is leased from local Samoan villages rather than owned outright by the federal government — why might that matter for how the land gets protected?",
      elsieSpooky: "Local Samoan legend tells of aitu, ancestral spirits believed to still inhabit the rainforest, particularly around old burial grounds hidden in the jungle."
    },
    {
      id: "NP-003",
      title: "Arches National Park",
      city: "",
      state: "UT",
      lat: 38.7331,
      lon: -109.5925,
      summary: "Home to over 2,000 documented natural stone arches, more than anywhere else on Earth, formed over millions of years by erosion.",
      question: "Arches lose pieces to erosion constantly — a famous one, Wall Arch, actually collapsed overnight in 2008. Would that change how you look at the ones still standing?",
      elsieSpooky: "Rangers and visitors have long reported unexplained lights and shadow figures near Delicate Arch at dusk, dismissed officially as light tricks off the sandstone."
    },
    {
      id: "NP-004",
      title: "Badlands National Park",
      city: "",
      state: "SD",
      lat: 43.8554,
      lon: -101.9773,
      summary: "A stark, layered landscape of eroded rock formations that also happens to be one of the richest fossil beds in the world, including ancient rhinos and saber-toothed cats.",
      question: "Fossils here reveal this desert used to be a lush subtropical sea millions of years ago. What do you think this place might look like millions of years from now?",
      elsieSpooky: "The Lakota name for this land translates to 'bad lands' partly because early travelers reported strange voices carried by the wind through the eroded canyons at night."
    },
    {
      id: "NP-005",
      title: "Big Bend National Park",
      city: "",
      state: "TX",
      lat: 29.1275,
      lon: -103.2425,
      summary: "One of the least-visited national parks, it sits in a massive bend of the Rio Grande where desert, mountains, and river ecosystems all meet in one place.",
      question: "This is one of the darkest places in the country at night, with almost zero light pollution. What's something you'd only notice in the sky if there were truly zero city lights around?",
      elsieSpooky: "Locals speak of ghostly lights near the abandoned mining town of Terlingua, once attributed to the restless spirits of miners who never made it out of the old quicksilver mines."
    },
    {
      id: "NP-006",
      title: "Biscayne National Park",
      city: "",
      state: "FL",
      lat: 25.4823,
      lon: -80.2081,
      summary: "95% underwater, this park protects coral reefs, mangrove forests, and dozens of historic shipwrecks just south of Miami.",
      question: "Almost the entire park is underwater and can only really be explored by boat or snorkel. Does a park still feel like a 'place' if you can't walk through most of it?",
      elsieSpooky: "Divers exploring the park's 'Shipwreck Trail' have reported an eerie stillness around the wreck of the Mandalay, a schooner that sank in a storm in 1966."
    },
    {
      id: "NP-007",
      title: "Black Canyon of the Gunnison National Park",
      city: "",
      state: "CO",
      lat: 38.5754,
      lon: -107.7416,
      summary: "Some of the steepest cliffs and oldest exposed rock in North America, plunging over 2,700 feet into shadow so deep parts of the canyon floor barely see sunlight.",
      question: "Some spots down in the canyon get as little as 33 minutes of direct sunlight a day. What do you think it would be like to live somewhere that dark, permanently?",
      elsieSpooky: "Locals call the deepest, darkest stretch 'the Narrows,' and hikers have long reported an unshakeable feeling of being watched in that shadowed section."
    },
    {
      id: "NP-008",
      title: "Bryce Canyon National Park",
      city: "",
      state: "UT",
      lat: 37.593,
      lon: -112.1871,
      summary: "Home to the largest concentration of hoodoos — tall, thin rock spires — anywhere on Earth, carved by frost and rain over millions of years.",
      question: "Local Paiute legend says the hoodoos are 'Legend People' who were turned to stone as punishment. Why do you think ancient peoples so often explained strange rock formations with stories about people?",
      elsieSpooky: "The Paiute name for this canyon translates roughly to 'red rocks standing like men in a bowl-shaped canyon,' tied directly to that legend of a frozen, ancient people."
    },
    {
      id: "NP-009",
      title: "Canyonlands National Park",
      city: "",
      state: "UT",
      lat: 38.3269,
      lon: -109.8783,
      summary: "Utah's largest national park, carved by the Colorado and Green Rivers into a maze of canyons, mesas, and buttes over millions of years.",
      question: "This park is divided into distinct districts that don't directly connect by road, meaning visiting all of it can take real planning. Would you rather explore one small area deeply, or see a little bit of everywhere?",
      elsieSpooky: "Ancient Puebloan rock art and granaries hidden throughout the canyons have fueled long-running legends of vanished cliff-dwelling communities whose fate is still debated by archaeologists."
    },
    {
      id: "NP-010",
      title: "Capitol Reef National Park",
      city: "",
      state: "UT",
      lat: 38.367,
      lon: -111.2615,
      summary: "A 100-mile wrinkle in the Earth's crust called the Waterpocket Fold, with orchards planted by Mormon pioneers still growing fruit that visitors can pick today.",
      question: "Pioneers planted fruit orchards here in the 1880s that are still producing fruit today. What do you think it takes for something planted 140 years ago to still be alive and useful now?",
      elsieSpooky: "The ghost town of Fruita, once a thriving pioneer settlement inside the park, is now completely empty except for its orchards — locals say the old schoolhouse still creaks at night with no wind to explain it."
    },
    {
      id: "NP-011",
      title: "Carlsbad Caverns National Park",
      city: "",
      state: "NM",
      lat: 32.1479,
      lon: -104.5567,
      summary: "An enormous network of limestone caves beneath the desert, including one chamber so large it could hold several football fields side by side.",
      question: "At dusk in summer, hundreds of thousands of bats fly out of the cave entrance in a huge spiraling cloud. Would you rather watch that from a distance, or be brave enough to stand close?",
      elsieSpooky: "Legend holds that early explorers who ventured too deep into the unmapped sections of the cave never found their way back out, and parts of the system remain unexplored to this day."
    },
    {
      id: "NP-012",
      title: "Channel Islands National Park",
      city: "",
      state: "CA",
      lat: 34.0069,
      lon: -119.7785,
      summary: "A chain of remote islands off the California coast, nicknamed the 'Galapagos of North America' for species found nowhere else on Earth.",
      question: "These islands were isolated long enough that unique species evolved here found nowhere else, including a fox the size of a house cat. What do you think isolation does to how a species evolves over time?",
      elsieSpooky: "The islands hold ancient Chumash burial grounds, and local legend says the spirits of shipwrecked sailors and stranded Chumash still walk the fog-covered bluffs at night."
    },
    {
      id: "NP-013",
      title: "Congaree National Park",
      city: "",
      state: "SC",
      lat: 33.7948,
      lon: -80.7797,
      summary: "Home to one of the tallest deciduous forest canopies left in the world, protecting old-growth trees that survived logging because the land kept flooding.",
      question: "This forest survived mainly because it kept flooding, which made it too difficult to log. Can you think of another example where something bad (like flooding) accidentally protected something good?",
      elsieSpooky: "The park's swampy, flood-prone forest has long been the subject of ghost stories tied to escaped enslaved people who hid here before the Civil War, some of whom reportedly never made it out."
    },
    {
      id: "NP-014",
      title: "Crater Lake National Park",
      city: "",
      state: "OR",
      lat: 42.8684,
      lon: -122.1685,
      summary: "The deepest lake in the United States, formed when a massive volcano called Mount Mazama collapsed in on itself about 7,700 years ago.",
      question: "This lake has no rivers flowing in or out — it's filled entirely by rain and snow. How do you think a lake that isolated stays so clear and blue?",
      elsieSpooky: "The Klamath tribe's oral history describes a real battle between two spirit chiefs that caused the mountain's collapse — a legend passed down for thousands of years before geologists confirmed the volcanic event actually happened."
    },
    {
      id: "NP-015",
      title: "Cuyahoga Valley National Park",
      city: "",
      state: "OH",
      lat: 41.2808,
      lon: -81.5678,
      summary: "A park built around the Cuyahoga River, once so polluted it famously caught fire in 1969 — an event that helped spark the modern environmental movement.",
      question: "This river literally caught on fire from pollution before becoming clean enough to be a national park. What do you think that transformation actually took?",
      elsieSpooky: "The Ohio and Erie Canal towpath running through the park is said to be haunted by the ghost of a canal boat captain who drowned in the lock system in the 1800s."
    },
    {
      id: "NP-016",
      title: "Death Valley National Park",
      city: "",
      state: "CA",
      lat: 36.5054,
      lon: -117.0794,
      summary: "The hottest, driest, and lowest national park in the country, holding the record for the highest temperature ever reliably recorded on Earth: 134°F.",
      question: "This is the hottest place on Earth according to official records. Why do you think somewhere this extreme would still be worth protecting as a national park?",
      elsieSpooky: "The area called Devil's Golf Course gets its name from crystallized salt formations so jagged that, as the old saying goes, 'only the devil could play golf on it' — and prospectors who wandered too far into the salt flats sometimes never returned."
    },
    {
      id: "NP-017",
      title: "Denali National Park",
      city: "",
      state: "AK",
      lat: 63.1148,
      lon: -151.1926,
      summary: "Home to Denali, the tallest mountain in North America at over 20,000 feet, so massive it creates its own weather system.",
      question: "The mountain is so tall it makes its own weather, meaning it's often hidden in clouds even on clear days elsewhere. What would it be like to travel a long way to see something and not know if you'd actually get to see it?",
      elsieSpooky: "Early climbers who died on the mountain's most dangerous routes are still up there, too difficult to recover — a somber reality behind Denali's reputation as one of the deadliest peaks in the world to climb."
    },
    {
      id: "NP-018",
      title: "Dry Tortugas National Park",
      city: "",
      state: "FL",
      lat: 24.6285,
      lon: -82.873,
      summary: "A remote cluster of islands 70 miles from Key West, accessible only by boat or seaplane, home to a massive 19th-century fort that was never finished.",
      question: "This fort was built to defend the coast but was never actually attacked or finished as planned. Do you think that makes it more or less interesting than a fort that saw real battles?",
      elsieSpooky: "Fort Jefferson once held Dr. Samuel Mudd, imprisoned for treating John Wilkes Booth's injury after Lincoln's assassination — and locals say his cell still carries an unsettling presence at night."
    },
    {
      id: "NP-019",
      title: "Everglades National Park",
      city: "",
      state: "FL",
      lat: 25.2866,
      lon: -80.8987,
      summary: "The largest subtropical wilderness in the country, a slow-moving 'river of grass' that's home to alligators, crocodiles, and Florida panthers all in one ecosystem.",
      question: "This is the only place on Earth where alligators and crocodiles live side by side naturally. Why do you think that combination is so rare everywhere else?",
      elsieSpooky: "The Everglades are full of real, unexplained disappearances over the decades — swamp so vast and disorienting that search teams have occasionally never found what they were looking for."
    },
    {
      id: "NP-020",
      title: "Gates of the Arctic National Park",
      city: "",
      state: "AK",
      lat: 67.7805,
      lon: -153.3021,
      summary: "The northernmost and least-visited national park in the country, with no roads, trails, or services of any kind inside its boundaries.",
      question: "Fewer than a few thousand people visit this park in a typical year, compared to millions at some others. Does a place have to be crowded to be worth protecting?",
      elsieSpooky: "Indigenous Gwich'in and Inupiat oral traditions describe spirits inhabiting this vast, roadless wilderness — a place so remote that anyone lost here truly has no help nearby."
    },
    {
      id: "NP-021",
      title: "Gateway Arch National Park",
      city: "",
      state: "MO",
      lat: 38.642,
      lon: -90.205,
      summary: "The smallest national park by land area in the whole system, built around the 630-foot Gateway Arch — the tallest man-made monument in the Western Hemisphere.",
      question: "This park is only 91 acres — the smallest in the entire system. What do you think makes a place worth protecting as a National Park, if it isn't the size?",
      elsieSpooky: "The Old Cathedral sits right next to the Arch, on the exact site of the city's original 1770s French cemetery — meaning this shiny, modern park was built directly on top of one of St. Louis's oldest burial grounds."
    },
    {
      id: "NP-022",
      title: "Glacier National Park",
      city: "",
      state: "MT",
      lat: 48.7596,
      lon: -113.787,
      summary: "Nicknamed the 'Crown of the Continent,' its glaciers are melting so fast that scientists predict most could disappear entirely within a few decades.",
      question: "The glaciers this park is named for might not exist here much longer. What do you think a park does once the thing it's named for is gone?",
      elsieSpooky: "Blackfeet oral history describes 'Napi,' the Old Man spirit believed to have shaped this land, and locals still tell of hikers who've reported an unshakeable sense of being watched near the park's oldest glacial valleys."
    },
    {
      id: "NP-023",
      title: "Glacier Bay National Park",
      city: "",
      state: "AK",
      lat: 58.6658,
      lon: -136.9002,
      summary: "A massive bay carved entirely by glaciers, some of which have retreated over 60 miles since explorers first mapped the area in the 1790s.",
      question: "Glaciers here have retreated 60 miles in about 200 years. What do you think this bay looked like the day it was first mapped, compared to today?",
      elsieSpooky: "Tlingit oral history holds that this whole bay was once solid glacier where their ancestors lived, until the ice suddenly and catastrophically began retreating — a story passed down that geologists have since confirmed roughly matches the real glacial timeline."
    },
    {
      id: "NP-024",
      title: "Grand Canyon National Park",
      city: "",
      state: "AZ",
      lat: 36.0544,
      lon: -112.1401,
      summary: "Carved by the Colorado River over roughly 6 million years, it's up to 18 miles wide and over a mile deep in places, exposing nearly 2 billion years of Earth's geologic history in its rock layers.",
      question: "Standing at the rim, you can see almost 2 billion years of Earth's history in the exposed rock layers. What's the oldest thing you've ever actually seen with your own eyes?",
      elsieSpooky: "Hopi oral tradition holds that the canyon is the literal site where their ancestors first emerged into this world — and hikers still report unexplained voices and lights deep in its side canyons, far from any trail."
    },
    {
      id: "NP-025",
      title: "Grand Teton National Park",
      city: "",
      state: "WY",
      lat: 43.7904,
      lon: -110.6818,
      summary: "Its jagged peaks rise dramatically straight up from the valley floor with no foothills in front of them, making them look taller than their actual elevation.",
      question: "These mountains have almost no foothills, so they look more dramatic than their actual height. Why do you think how something looks can matter as much as the actual numbers?",
      elsieSpooky: "Local legend holds that the ghost of a trapper who vanished into the mountains in the 1800s still wanders the Teton backcountry, seen occasionally by hikers who report a figure that vanishes when approached."
    },
    {
      id: "NP-026",
      title: "Great Basin National Park",
      city: "",
      state: "NV",
      lat: 38.9833,
      lon: -114.3,
      summary: "Home to bristlecone pines, some of the oldest living trees on Earth at over 4,000 years old — meaning some were already ancient when the pyramids were built.",
      question: "Some trees here were already over 1,000 years old when the pyramids of Egypt were built. What does it feel like to think about something that's been alive that long?",
      elsieSpooky: "A researcher famously cut down what turned out to be the oldest tree ever recorded here in the 1960s, not realizing its age until after it was already dead — a mistake still discussed as one of the saddest accidents in scientific history."
    },
    {
      id: "NP-027",
      title: "Great Sand Dunes National Park",
      city: "",
      state: "CO",
      lat: 37.7916,
      lon: -105.5943,
      summary: "Home to the tallest sand dunes in North America, rising over 750 feet, formed by wind trapping sand against the base of the Rocky Mountains.",
      question: "These are the tallest sand dunes in North America, yet they sit right at the base of snow-capped mountains. Would you have expected sand dunes and mountains to exist in the exact same place?",
      elsieSpooky: "At night, the dunes are known to make a genuine humming or booming sound as sand shifts internally — a real, documented phenomenon that early travelers understandably found deeply unsettling and hard to explain."
    },
    {
      id: "NP-028",
      title: "Great Smoky Mountains National Park",
      city: "",
      state: "TN",
      lat: 35.6118,
      lon: -83.4895,
      summary: "The most visited national park in the entire country, named for the natural fog that clings to its ancient, heavily forested mountains.",
      question: "This is the most visited national park in the whole country, more than the Grand Canyon or Yellowstone. Why do you think accessibility might matter as much as scenery for how popular a park becomes?",
      elsieSpooky: "The park sits atop land once home to Cherokee communities forced out during the Trail of Tears, and local legend holds that the persistent fog the mountains are named for is tied to spirits who never left."
    },
    {
      id: "NP-029",
      title: "Guadalupe Mountains National Park",
      city: "",
      state: "TX",
      lat: 31.8985,
      lon: -104.863,
      summary: "Home to Guadalupe Peak, the highest point in Texas, and the best-preserved fossil reef from an ancient sea that covered this desert 260 million years ago.",
      question: "This desert mountain was once part of the floor of an ancient sea. What's something around you right now that you'd never guess used to be something completely different?",
      elsieSpooky: "The nearby ghost town of Frijole Ranch and the abandoned Butterfield stagecoach route have long carried stories of travelers who vanished into the surrounding desert in the 1800s, never to be found."
    },
    {
      id: "NP-030",
      title: "Haleakala National Park",
      city: "",
      state: "HI",
      lat: 20.7204,
      lon: -156.1552,
      summary: "Home to a massive dormant volcano whose summit crater is so otherworldly that NASA astronauts trained here before Moon missions.",
      question: "NASA astronauts once trained on this volcano's surface because it looked so much like the Moon. What do you think it takes for a real place on Earth to look convincingly like somewhere completely different?",
      elsieSpooky: "Native Hawaiian legend says the demigod Maui climbed to this summit and literally lassoed the sun to slow its journey across the sky — the mountain's name translates to 'house of the sun.'"
    },
    {
      id: "NP-031",
      title: "Hawaii Volcanoes National Park",
      city: "",
      state: "HI",
      lat: 19.4194,
      lon: -155.2885,
      summary: "Home to two of the most active volcanoes on Earth, Kilauea and Mauna Loa, where you can sometimes watch molten lava reshape the land in real time.",
      question: "This land is still actively being created right now by lava flows. What do you think it's like to visit a place that's literally still being formed while you're standing there?",
      elsieSpooky: "Native Hawaiian tradition holds that Pele, the volcano goddess, still resides in the crater — and locals still leave offerings, believing that disrespecting the volcano invites real misfortune."
    },
    {
      id: "NP-032",
      title: "Hot Springs National Park",
      city: "",
      state: "AR",
      lat: 34.5217,
      lon: -93.0424,
      summary: "The smallest and oldest federally protected park in the system, established in 1832 to protect natural hot springs people believed had healing powers.",
      question: "This land was protected decades before the term 'national park' even existed. What do you think 'protecting' land meant to people in the 1830s compared to today?",
      elsieSpooky: "The historic bathhouses along Bathhouse Row have long-standing ghost stories tied to wealthy visitors who came seeking cures in the early 1900s and, according to local lore, never fully left."
    },
    {
      id: "NP-033",
      title: "Indiana Dunes National Park",
      city: "",
      state: "IN",
      lat: 41.668,
      lon: -87.072,
      summary: "A national park made of 15 miles of Lake Michigan shoreline and towering sand dunes, formed over thousands of years by retreating glaciers and wind.",
      question: "This park sits right next to steel mills and power plants. Should a national park have to be completely wild and untouched, or can protected land and industry exist side by side?",
      elsieSpooky: "In 2013, a moving dune here swallowed a 6-year-old boy into a hidden hole that opened up beneath him — he was buried over three hours before rescue. Scientists still don't fully understand how the hole formed."
    },
    {
      id: "NP-034",
      title: "Isle Royale National Park",
      city: "",
      state: "MI",
      lat: 48.1,
      lon: -88.8,
      summary: "A remote wilderness island in Lake Superior, accessible only by boat or seaplane, home to one of the longest-running predator-prey studies in the world tracking wolves and moose.",
      question: "This island has one of the longest continuous wildlife studies in the world, tracking the same wolf and moose populations for over 60 years. What do you think scientists have learned from watching one place for that long?",
      elsieSpooky: "The island's many shipwrecks in the surrounding waters have long fueled sailor legends of Lake Superior 'never giving up her dead' — bodies and wreckage that vanish into the lake's frigid depths and are never recovered."
    },
    {
      id: "NP-035",
      title: "Joshua Tree National Park",
      city: "",
      state: "CA",
      lat: 33.8734,
      lon: -115.901,
      summary: "Named for the twisted, spiky Joshua trees that Mormon pioneers thought looked like the biblical figure Joshua reaching his arms up in prayer.",
      question: "Joshua trees can't reproduce well in the warming climate here, and scientists worry they could mostly disappear from this park within a century. What would it mean for a park to lose the very tree it's named after?",
      elsieSpooky: "The park sits near the site of decades of reported strange lights and unexplained phenomena, feeding local legends about the high desert's genuinely eerie nighttime stillness."
    },
    {
      id: "NP-036",
      title: "Katmai National Park",
      city: "",
      state: "AK",
      lat: 58.6099,
      lon: -155.0164,
      summary: "Famous for having one of the largest protected populations of brown bears in the world, where rangers livestream bears catching salmon at Brooks Falls every summer.",
      question: "This park livestreams bears catching salmon, watched by millions of people online who will never actually visit in person. Does watching something online count as a real connection to a place?",
      elsieSpooky: "The Valley of Ten Thousand Smokes, formed by a massive 1912 volcanic eruption, was once filled with thousands of steam vents that have since gone eerily silent — a landscape still recovering from one of the largest eruptions of the 20th century."
    },
    {
      id: "NP-037",
      title: "Kenai Fjords National Park",
      city: "",
      state: "AK",
      lat: 59.9169,
      lon: -149.6528,
      summary: "Nearly 40% of the park is covered by the massive Harding Icefield, which feeds glaciers that calve enormous chunks of ice directly into the ocean.",
      question: "You can watch actual glaciers crack and fall into the ocean here, a process called calving. What do you think that sounds like up close?",
      elsieSpooky: "Local Alutiiq oral history describes spirits tied to the icefield, and modern visitors on tour boats have reported an eerie silence right before large ice-calving events, as if the whole fjord holds its breath."
    },
    {
      id: "NP-038",
      title: "Kings Canyon National Park",
      city: "",
      state: "CA",
      lat: 36.8879,
      lon: -118.5551,
      summary: "Home to some of the deepest canyons in the country and General Grant, the second-largest tree on Earth by volume, nicknamed 'the Nation's Christmas Tree.'",
      question: "One tree here is officially designated as a national shrine and lit as 'the Nation's Christmas Tree' every year. Why do you think a single tree earned that kind of honor?",
      elsieSpooky: "Early explorers who ventured into the deepest, least-mapped parts of this canyon in the 1800s reported getting so disoriented that some search parties themselves needed rescuing."
    },
    {
      id: "NP-039",
      title: "Kobuk Valley National Park",
      city: "",
      state: "AK",
      lat: 67.3556,
      lon: -159.2825,
      summary: "One of the least-visited national parks in the country, home to massive Arctic sand dunes that seem completely out of place above the Arctic Circle.",
      question: "Sand dunes exist here despite being above the Arctic Circle, surrounded by tundra and snow most of the year. Why do you think that combination feels so unexpected?",
      elsieSpooky: "This park sees fewer visitors most years than some city parks see in a single afternoon — Indigenous Inupiat communities who still hunt caribou here describe a landscape genuinely too vast and empty for most people to comprehend."
    },
    {
      id: "NP-040",
      title: "Lake Clark National Park",
      city: "",
      state: "AK",
      lat: 60.9679,
      lon: -153.416,
      summary: "A remote wilderness of volcanoes, glaciers, and turquoise lakes, accessible only by small plane, with no roads connecting it to the rest of Alaska.",
      question: "There are no roads to this park at all — the only way in is by small plane. What do you think changes about a place when you literally cannot drive there?",
      elsieSpooky: "Local Dena'ina oral tradition holds this land sacred, describing spirits tied to the volcanic peaks — a belief that predates written record and persists among Indigenous communities in the region today."
    },
    {
      id: "NP-041",
      title: "Lassen Volcanic National Park",
      city: "",
      state: "CA",
      lat: 40.4977,
      lon: -121.4207,
      summary: "One of the few places on Earth with all four types of volcanoes in one park, including Lassen Peak, which last erupted in 1915.",
      question: "This park has all four major types of volcanoes in one place, which is genuinely rare anywhere on Earth. Why do you think that combination doesn't happen very often?",
      elsieSpooky: "The area nicknamed 'Bumpass Hell,' full of boiling mud pots and steam vents, is named after a man who fell through the crust and severely burned his leg in the 1860s — a warning still etched into the landscape's boardwalks today."
    },
    {
      id: "NP-042",
      title: "Mammoth Cave National Park",
      city: "",
      state: "KY",
      lat: 37.1862,
      lon: -86.1,
      summary: "The longest known cave system on Earth, with over 420 mapped miles of passageways and still more being discovered and mapped today.",
      question: "Over 420 miles of this cave system have been mapped, and more keeps being discovered. What do you think it would take to fully map something that keeps surprising the people studying it?",
      elsieSpooky: "Enslaved guides in the 1800s, forced to lead tours through the cave, reported strange sounds deep in unexplored passages — and to this day, cavers still occasionally report unexplained noises in sections far from any tour route."
    },
    {
      id: "NP-043",
      title: "Mesa Verde National Park",
      city: "",
      state: "CO",
      lat: 37.18,
      lon: -108.49,
      summary: "Protects nearly 5,000 archaeological sites, including elaborate cliff dwellings built by Ancestral Puebloans who lived here for over 700 years before leaving around 1300 AD.",
      question: "The people who built these cliff dwellings left around 1300 AD and nobody fully knows why. What are some reasons an entire community might leave a place they'd lived in for 700 years?",
      elsieSpooky: "Descendant Puebloan communities consider these dwellings sacred ancestral sites, and rangers have long reported an unusual, heavy stillness in the cliff rooms — a feeling many visitors describe without being able to explain why."
    },
    {
      id: "NP-044",
      title: "Mount Rainier National Park",
      city: "",
      state: "WA",
      lat: 46.88,
      lon: -121.7269,
      summary: "An active volcano and the most glaciated peak in the contiguous United States, capable of a catastrophic mudflow if it ever erupts again.",
      question: "Scientists consider this one of the most dangerous volcanoes in the country specifically because so many people live near it. Why do you think a volcano's danger depends on more than just how likely it is to erupt?",
      elsieSpooky: "Climbers who've died in the mountain's crevasses over the decades are sometimes never recovered, swallowed permanently by the glaciers — a somber reality behind Rainier's reputation as one of the deadliest peaks to climb in America."
    },
    {
      id: "NP-045",
      title: "New River Gorge National Park",
      city: "",
      state: "WV",
      lat: 37.95,
      lon: -81.07,
      summary: "Despite its name, the New River is actually one of the oldest rivers on Earth, carving a gorge so deep it's crossed by one of the longest steel arch bridges in the world.",
      question: "This 'New' River is actually one of the oldest rivers on the entire planet. Why do you think it got a name that's the exact opposite of what it actually is?",
      elsieSpooky: "The gorge is home to abandoned coal-mining ghost towns, some completely swallowed by forest, where locals say faint sounds of old mining equipment can still be heard on quiet nights."
    },
    {
      id: "NP-046",
      title: "North Cascades National Park",
      city: "",
      state: "WA",
      lat: 48.7718,
      lon: -121.2985,
      summary: "Home to more glaciers than any other park in the lower 48 states, with jagged peaks so remote that less than 1% of visitors ever venture into the backcountry.",
      question: "Less than 1% of visitors here ever leave the main road corridor. What do you think is different about a park where almost nobody actually explores most of it?",
      elsieSpooky: "Search and rescue teams have described this park's remote backcountry as one of the most disorienting landscapes in the Lower 48, where hikers have occasionally gone missing for weeks in terrain that all looks the same."
    },
    {
      id: "NP-047",
      title: "Olympic National Park",
      city: "",
      state: "WA",
      lat: 47.8021,
      lon: -123.6044,
      summary: "One of the only places in the country where you can experience glacier-capped mountains, old-growth rainforest, and rugged coastline all within the same park.",
      question: "This park has glaciers, rainforest, AND coastline all in one place. If you could only pick one of those three environments to explore, which would you choose and why?",
      elsieSpooky: "The Hoh Rainforest's thick, eternally damp moss-covered trees have long been the setting for local ghost stories about hikers who wandered off marked trails and were never seen again in the disorienting green fog."
    },
    {
      id: "NP-048",
      title: "Petrified Forest National Park",
      city: "",
      state: "AZ",
      lat: 34.91,
      lon: -109.8068,
      summary: "Home to one of the largest concentrations of petrified wood on Earth, ancient trees that turned to solid quartz crystal over 200 million years.",
      question: "These aren't wooden logs — they're solid crystal, formed when minerals slowly replaced wood over millions of years. What do you think 200 million years actually looks like, compared to a number you can picture?",
      elsieSpooky: "Visitors who illegally take petrified wood home have reported such consistent bad luck afterward that the park receives thousands of pieces mailed back anonymously every year, apologetically, from people blaming the 'curse.'"
    },
    {
      id: "NP-049",
      title: "Pinnacles National Park",
      city: "",
      state: "CA",
      lat: 36.4906,
      lon: -121.1825,
      summary: "Formed by an ancient volcano that split apart along the San Andreas Fault, with half the volcano now sitting 195 miles away near Los Angeles.",
      question: "Half of the volcano that formed this park is now 195 miles away because of earthquake fault movement over millions of years. Where do you think the missing half actually ended up?",
      elsieSpooky: "The park's talus caves — dark passages formed by boulders wedged into canyons — have long unsettled visitors exploring them at dusk, when the resident bat colonies begin stirring in the total darkness."
    },
    {
      id: "NP-050",
      title: "Redwood National Park",
      city: "",
      state: "CA",
      lat: 41.2132,
      lon: -124.0046,
      summary: "Home to the tallest trees on Earth, coast redwoods that can grow over 350 feet tall and live for more than 2,000 years.",
      question: "These trees can live over 2,000 years — meaning some alive today were already ancient before the Roman Empire fell. What do you think a tree that old has 'seen' happen around it?",
      elsieSpooky: "Local Yurok oral tradition holds these ancient groves sacred, describing spirits tied to the oldest trees — and hikers have long reported an eerie, absolute silence in the deepest groves, where even birdsong seems to disappear."
    },
    {
      id: "NP-051",
      title: "Rocky Mountain National Park",
      city: "",
      state: "CO",
      lat: 40.3428,
      lon: -105.6836,
      summary: "Home to Trail Ridge Road, the highest continuous paved road in the country, cresting over 12,000 feet above sea level through alpine tundra.",
      question: "At the highest point of this park's main road, you're higher up than most airplanes fly during takeoff and landing. What do you think the air actually feels like up there?",
      elsieSpooky: "Longs Peak, the park's tallest mountain, has claimed dozens of climbers' lives over the decades on its notoriously dangerous Keyhole Route, and search teams still occasionally find remains from climbers lost generations ago."
    },
    {
      id: "NP-052",
      title: "Saguaro National Park",
      city: "",
      state: "AZ",
      lat: 32.2967,
      lon: -110.737,
      summary: "Protects the country's largest cacti, giant saguaros that can live over 150 years and don't grow their first arm until they're around 75 years old.",
      question: "A saguaro cactus doesn't grow its first arm until it's about 75 years old. What's something in your own life you're willing to be patient about for that long?",
      elsieSpooky: "The Sonoran Desert surrounding these ancient cacti has long been the setting for stories of lost prospectors and hikers who underestimated the desert heat — a genuinely dangerous landscape behind its beautiful, cactus-covered postcard image."
    },
    {
      id: "NP-053",
      title: "Sequoia National Park",
      city: "",
      state: "CA",
      lat: 36.4864,
      lon: -118.5658,
      summary: "Home to General Sherman, the largest tree on Earth by volume, an estimated 2,200 years old and still growing wider every year.",
      question: "This tree is the largest living thing on Earth by volume and it's still actively growing. What do you think 'still growing' means for something that's already this enormous?",
      elsieSpooky: "A massive fire-scarred tunnel through a fallen sequoia, big enough to drive a car through, has stood for over a century — and old logging-era ghost stories from nearby company towns still linger among long-time residents."
    },
    {
      id: "NP-054",
      title: "Shenandoah National Park",
      city: "",
      state: "VA",
      lat: 38.5322,
      lon: -78.4302,
      summary: "Stretches along 105 miles of the Blue Ridge Mountains, with Skyline Drive offering nearly constant panoramic views the entire length of the park.",
      question: "This park is a narrow 105-mile strip rather than one big block of land. Why do you think protecting a long, thin corridor might be harder than protecting one large area?",
      elsieSpooky: "The park displaced entire mountain communities in the 1930s when it was created, and abandoned homesteads still dot the backcountry — locals have long told stories of families who never fully accepted having to leave."
    },
    {
      id: "NP-055",
      title: "Theodore Roosevelt National Park",
      city: "",
      state: "ND",
      lat: 46.9789,
      lon: -103.5382,
      summary: "Named for the president whose ranching years here shaped his conservation legacy, it's home to wild bison herds and dramatic badlands terrain.",
      question: "Roosevelt said his time ranching here changed how he thought about conservation as president. Do you think spending time somewhere wild can actually change how a person thinks?",
      elsieSpooky: "The nearby badlands terrain has long been the subject of Native American oral history describing spirits tied to the eroded, otherworldly landscape — a place early settlers also found genuinely disorienting after dark."
    },
    {
      id: "NP-056",
      title: "Virgin Islands National Park",
      city: "",
      state: "VI",
      lat: 18.3387,
      lon: -64.738,
      summary: "Protects two-thirds of the island of St. John, including pristine coral reefs and the ruins of 18th-century sugar plantations worked by enslaved people.",
      question: "This park includes plantation ruins built by enslaved labor sitting right next to protected coral reefs. Why do you think it matters to preserve painful history alongside natural beauty in the same place?",
      elsieSpooky: "The plantation ruins scattered throughout the park are the subject of long-standing local stories about the enslaved people who died there, with some residents saying certain ruins are best not visited after dark."
    },
    {
      id: "NP-057",
      title: "Voyageurs National Park",
      city: "",
      state: "MN",
      lat: 48.5,
      lon: -92.88,
      summary: "Named for French-Canadian fur traders, this park is nearly 40% water, best explored by boat across its interconnected lakes right along the Canadian border.",
      question: "Nearly 40% of this park is water rather than land. How do you think exploring a park by boat instead of on foot changes the whole experience?",
      elsieSpooky: "The lakes here have long claimed canoes and boats in sudden storms, and Ojibwe oral tradition describes spirits tied to these waters — a respect for the lake's danger that's been passed down for generations."
    },
    {
      id: "NP-058",
      title: "White Sands National Park",
      city: "",
      state: "NM",
      lat: 32.7796,
      lon: -106.1719,
      summary: "The largest gypsum sand dune field on Earth, its dunes are so bright white they're visible from space and stay cool enough to walk on barefoot even in summer.",
      question: "These dunes are visible from space and made of gypsum instead of regular sand, which is why they stay white and cool. What do you think it would feel like to walk barefoot across sand that doesn't burn your feet in the desert sun?",
      elsieSpooky: "The area was used for early atomic bomb testing at the nearby Trinity Site in 1945, and local ranching families have passed down unsettling stories from that era about strange lights and sounds in the desert night."
    },
    {
      id: "NP-059",
      title: "Wind Cave National Park",
      city: "",
      state: "SD",
      lat: 43.5725,
      lon: -103.4778,
      summary: "One of the longest and most complex cave systems in the world, named for strong winds that blow in and out of its entrance as air pressure changes.",
      question: "This cave literally breathes — air rushes in and out of the entrance depending on outside air pressure. What do you think it would feel like to stand at an entrance that seems to inhale and exhale?",
      elsieSpooky: "The Lakota consider this cave sacred as the site where their people emerged into the world, and cavers exploring its unmapped depths have long reported strange sounds carried through passages that shouldn't connect to anything."
    },
    {
      id: "NP-060",
      title: "Wrangell-St. Elias National Park",
      city: "",
      state: "AK",
      lat: 61.7104,
      lon: -142.9853,
      summary: "The largest national park in the country by far — bigger than nine U.S. states combined — home to some of the tallest peaks in North America.",
      question: "This single park is larger than nine entire U.S. states combined. What do you think it would take to actually explore all of a park that size?",
      elsieSpooky: "The abandoned Kennecott copper mining town inside the park was suddenly deserted in 1938 when the mine closed, leaving buildings and equipment exactly as workers left them — a genuine ghost town frozen in time."
    },
    {
      id: "NP-061",
      title: "Yellowstone National Park",
      city: "",
      state: "WY",
      lat: 44.428,
      lon: -110.5885,
      summary: "The first national park in the entire world, established in 1872, sitting on top of one of the largest active supervolcanoes on Earth.",
      question: "This park sits directly on top of a supervolcano that could someday erupt again. Does knowing that change how you'd feel visiting the geysers and hot springs here?",
      elsieSpooky: "The historic Old Faithful Inn is the subject of long-standing ghost stories among staff, and the park's earliest visitors in the 1870s reported such strange, otherworldly geothermal features that early reports were dismissed by many as tall tales."
    },
    {
      id: "NP-062",
      title: "Yosemite National Park",
      city: "",
      state: "CA",
      lat: 37.8651,
      lon: -119.5383,
      summary: "Famous for its towering granite cliffs like El Capitan and Half Dome, carved by glaciers, and among the first wild lands ever set aside for protection in American history.",
      question: "Yosemite helped inspire the entire idea of national parks before the system even existed. What do you think the world would look like today if nobody had ever had that idea?",
      elsieSpooky: "Climbers who've died attempting El Capitan and Half Dome over the decades have left behind stories among the climbing community of routes considered genuinely cursed, avoided by even experienced climbers after repeated accidents."
    },
    {
      id: "NP-063",
      title: "Zion National Park",
      city: "",
      state: "UT",
      lat: 37.2982,
      lon: -113.0263,
      summary: "Carved by the Virgin River over millions of years, its narrow slot canyons can flood without warning even on a sunny day if a storm hits miles upstream.",
      question: "Flash floods here can happen even when it's sunny where you're standing, if a storm hits far upstream. What do you think it would feel like to be somewhere that's dangerous for a reason you can't even see coming?",
      elsieSpooky: "The Narrows, the park's most famous slot canyon hike, has claimed lives in sudden flash floods over the years — a genuine, sobering reason rangers close the trail immediately at the first sign of storms anywhere in the watershed."
    }
  ];

  function registerNationalParkIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-national-park"))) return resolve();
      const image = new Image(64, 64);
      image.onload = () => {
        try { if (!map.hasImage("elsie-national-park")) map.addImage("elsie-national-park", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/national-park-icon.png";
    });
  }

  function openNationalParkPopup(map, stopId, coordinates) {
    const park = NATIONAL_PARK_STOPS.find((p) => p.id === stopId);
    if (!park) return;
    const spooky = activeProfile === "elsie" && park.elsieSpooky
      ? `<p class="elsie-popup-angle"><strong>Spooky fact:</strong> ${escapeHtml(park.elsieSpooky)}</p>`
      : "";
    if (elsieMarkerPopup) elsieMarkerPopup.remove();
    elsieMarkerPopup = new maplibregl.Popup({ closeButton: true, maxWidth: "270px", offset: 16, className: "elsie-marker-popup" })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="elsie-popup-card">
          <small>\u26f0\ufe0f National Park</small>
          <strong>${escapeHtml(park.title)}</strong>
          <p>${escapeHtml(park.summary)}</p>
          <p class="elsie-popup-angle"><strong>Think about it:</strong> ${escapeHtml(park.question)}</p>
          ${spooky}
        </div>`)
      .addTo(map);
  }

  function applyNationalParkLayer(map = homeMap) {
    if (!map) return;
    registerNationalParkIcon(map).then(() => {
      const currentMap = homeMap;
      if (!currentMap) return;
      try {
        if (currentMap.getLayer("elsie-national-park-layer")) return;
        const collection = {
          type: "FeatureCollection",
          features: NATIONAL_PARK_STOPS.map((p) => ({
            type: "Feature",
            properties: { id: p.id },
            geometry: { type: "Point", coordinates: [p.lon, p.lat] }
          }))
        };
        currentMap.addSource("elsie-national-park-source", { type: "geojson", data: collection });
        currentMap.addLayer({
          id: "elsie-national-park-layer",
          type: "symbol",
          source: "elsie-national-park-source",
          layout: {
            "icon-image": "elsie-national-park",
            "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.34, 6, 0.5, 9, 0.62, 12, 0.72],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true
          }
        });
        currentMap.on("click", "elsie-national-park-layer", (event) => {
          const feature = event.features && event.features[0];
          if (!feature) return;
          openNationalParkPopup(currentMap, feature.properties.id, feature.geometry.coordinates);
        });
        currentMap.on("mouseenter", "elsie-national-park-layer", () => { currentMap.getCanvas().style.cursor = "pointer"; });
        currentMap.on("mouseleave", "elsie-national-park-layer", () => { currentMap.getCanvas().style.cursor = ""; });
      } catch (error) {
        console.error("National park layer render error:", error);
      }
    });
  }

  function applySmokeLayer(map = homeMap) {
    if (!map) return;
    try {
      if (state.smokeEnabled) {
        if (!map.getSource("elsie-smoke")) {
          map.addSource("elsie-smoke", {
            type: "raster",
            tiles: [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Aerosol/default/${smokeTileDate()}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`],
            tileSize: 256,
            maxzoom: 6,
            attribution: "Aerosol/smoke data \u00a9 NASA GIBS / MODIS"
          });
        }
        if (!map.getLayer("elsie-smoke-layer")) {
          map.addLayer({ id: "elsie-smoke-layer", type: "raster", source: "elsie-smoke", paint: { "raster-opacity": 0.55 } });
        }
      } else {
        if (map.getLayer("elsie-smoke-layer")) map.removeLayer("elsie-smoke-layer");
        if (map.getSource("elsie-smoke")) map.removeSource("elsie-smoke");
      }
    } catch { /* non-critical overlay */ }
  }

  /* ---------- Weather radar (RainViewer) ---------- */

  const elsieWeatherRadar = { host: "https://tilecache.rainviewer.com", frames: [], lastFetch: 0, frameIndex: 0, animTimer: null };

  function fetchRadarMeta(force = false) {
    const now = Date.now();
    if (!force && now - elsieWeatherRadar.lastFetch < 5 * 60 * 1000 && elsieWeatherRadar.frames.length) return Promise.resolve(elsieWeatherRadar.frames);
    if (document.visibilityState === "hidden") return Promise.resolve(elsieWeatherRadar.frames);
    elsieWeatherRadar.lastFetch = now;
    return fetch("https://api.rainviewer.com/public/weather-maps.json")
      .then((response) => response.json())
      .then((meta) => {
        elsieWeatherRadar.host = meta.host || elsieWeatherRadar.host;
        elsieWeatherRadar.frames = (meta.radar?.past || []).slice(-8);
        elsieWeatherRadar.frameIndex = Math.max(0, elsieWeatherRadar.frames.length - 1);
        const latest = elsieWeatherRadar.frames[elsieWeatherRadar.frameIndex];
        if (latest) {
          state.radarCachedFrame = { path: latest.path, time: latest.time, host: elsieWeatherRadar.host };
          saveState();
        }
        return elsieWeatherRadar.frames;
      })
      .catch(() => {
        if (state.radarCachedFrame) {
          elsieWeatherRadar.host = state.radarCachedFrame.host || elsieWeatherRadar.host;
          elsieWeatherRadar.frames = [{ path: state.radarCachedFrame.path, time: state.radarCachedFrame.time }];
          elsieWeatherRadar.frameIndex = 0;
        }
        return elsieWeatherRadar.frames;
      });
  }

  function currentRadarFrame() {
    return elsieWeatherRadar.frames[elsieWeatherRadar.frameIndex] || (state.radarCachedFrame ? { path: state.radarCachedFrame.path, time: state.radarCachedFrame.time } : null);
  }

  function getRadarFrame() { return currentRadarFrame(); }

  function radarTileUrl(frame) {
    return `${elsieWeatherRadar.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
  }

  function firstElsieBaseLayerId(map) {
    if (map.getLayer("elsie-breadcrumb-line")) return "elsie-breadcrumb-line";
    if (map.getLayer("home-clusters")) return "home-clusters";
    return undefined;
  }

  function applyRadarLayer(map = homeMap) {
    if (!map || !isMapProfile()) return;
    const frame = currentRadarFrame();
    if (!frame) return;
    const apply = () => {
      if (map.getLayer("elsie-radar-layer")) map.removeLayer("elsie-radar-layer");
      if (map.getSource("elsie-radar")) map.removeSource("elsie-radar");
      map.addSource("elsie-radar", {
        type: "raster",
        tiles: [radarTileUrl(frame)],
        tileSize: 256,
        maxzoom: 9,
        attribution: "Radar © RainViewer"
      });
      map.addLayer({
        id: "elsie-radar-layer",
        type: "raster",
        source: "elsie-radar",
        paint: { "raster-opacity": Number(state.radarOpacity) || 0.45 }
      }, firstElsieBaseLayerId(map));
    };
    if (map.isStyleLoaded && !map.isStyleLoaded()) map.once("load", apply);
    else apply();
  }

  function removeRadarLayer(map = homeMap) {
    if (!map) return;
    try {
      if (map.getLayer("elsie-radar-layer")) map.removeLayer("elsie-radar-layer");
      if (map.getSource("elsie-radar")) map.removeSource("elsie-radar");
    } catch {}
  }

  function stopRadarAnimation() {
    if (elsieWeatherRadar.animTimer) window.clearInterval(elsieWeatherRadar.animTimer);
    elsieWeatherRadar.animTimer = null;
  }

  function startRadarAnimation() {
    stopRadarAnimation();
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!state.radarEnabled || !state.radarAnimationEnabled || reduced || document.visibilityState === "hidden") return;
    if (elsieWeatherRadar.frames.length < 2) return;
    elsieWeatherRadar.animTimer = window.setInterval(() => {
      elsieWeatherRadar.frameIndex = (elsieWeatherRadar.frameIndex + 1) % elsieWeatherRadar.frames.length;
      applyRadarLayer();
    }, 700);
  }

  function setRadarEnabled(enabled) {
    state.radarEnabled = Boolean(enabled);
    saveState();
    if (state.radarEnabled) {
      fetchRadarMeta().then(() => {
        applyRadarLayer();
        startRadarAnimation();
      });
    } else {
      stopRadarAnimation();
      removeRadarLayer();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopRadarAnimation();
    } else if (state.radarEnabled && isMapProfile()) {
      fetchRadarMeta().then(() => {
        applyRadarLayer();
        startRadarAnimation();
      });
    }
  });

  const ELSIE_RADAR_STATIONS = [
    { code: "KEAX", name: "Kansas City / Pleasant Hill NEXRAD", lat: 38.8103, lon: -94.2645 },
    { code: "KLSX", name: "St. Louis NEXRAD", lat: 38.6989, lon: -90.6828 },
    { code: "KIND", name: "Indianapolis NEXRAD", lat: 39.7075, lon: -86.2803 },
    { code: "KLOT", name: "Chicago NEXRAD", lat: 41.6045, lon: -88.0847 },
    { code: "KGRR", name: "Grand Rapids NEXRAD", lat: 42.8939, lon: -85.5449 },
    { code: "KAPX", name: "Gaylord NEXRAD", lat: 44.9072, lon: -84.7198 }
  ];

  function syncRadarStationLayer(map = homeMap) {
    if (!map) return;
    const visible = isMapProfile() && state.radarStationsVisible;
    if (!visible) {
      try { if (map.getLayer("elsie-radar-stations")) map.setLayoutProperty("elsie-radar-stations", "visibility", "none"); } catch {}
      return;
    }
    if (!map.getSource("elsie-radar-stations")) {
      map.addSource("elsie-radar-stations", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: ELSIE_RADAR_STATIONS.map((station) => ({
            type: "Feature",
            properties: { code: station.code, name: station.name },
            geometry: { type: "Point", coordinates: [station.lon, station.lat] }
          }))
        }
      });
      map.addLayer({
        id: "elsie-radar-stations",
        type: "symbol",
        source: "elsie-radar-stations",
        layout: { "text-field": "📡", "text-size": 14, "text-allow-overlap": true }
      });
      map.on("click", "elsie-radar-stations", (event) => {
        const props = event.features[0].properties;
        new maplibregl.Popup({ closeButton: true })
          .setLngLat(event.features[0].geometry.coordinates)
          .setText(`${props.code} · ${props.name} · NOAA/NWS NEXRAD`)
          .addTo(map);
      });
    }
    map.setLayoutProperty("elsie-radar-stations", "visibility", "visible");
  }

  /* ---------- Sasquatch breadcrumb trail ---------- */

  const BREADCRUMB_MAX = 2000;
  const MEANINGFUL_REASONS = ["stop-visited", "waypoint-arrival", "leg-change"];

  function lastBreadcrumb() {
    return state.breadcrumbTrail[state.breadcrumbTrail.length - 1] || null;
  }

  function addBreadcrumb(point, reason, accuracy, label) {
    state.breadcrumbTrail.push({
      id: makeId("crumb"),
      latitude: Number(point.lat.toFixed(5)),
      longitude: Number(point.lon.toFixed(5)),
      recordedAt: new Date().toISOString(),
      tripLeg: currentTripLegId(),
      reason,
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
      profile: activeProfile,
      label: label || ""
    });
    pruneBreadcrumbs();
    saveState();
    syncBreadcrumbLayers();
  }

  function pruneBreadcrumbs() {
    if (state.breadcrumbTrail.length <= BREADCRUMB_MAX) return;
    const meaningful = state.breadcrumbTrail.filter((crumb) => MEANINGFUL_REASONS.includes(crumb.reason));
    const ordinary = state.breadcrumbTrail.filter((crumb) => !MEANINGFUL_REASONS.includes(crumb.reason));
    const half = Math.floor(ordinary.length / 2);
    const thinnedOld = ordinary.slice(0, half).filter((crumb, index) => index % 2 === 0);
    state.breadcrumbTrail = [...meaningful, ...thinnedOld, ...ordinary.slice(half)]
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  }

  function maybeRecordBreadcrumb(point, accuracy) {
    const last = lastBreadcrumb();
    if (!last) return addBreadcrumb(point, "distance", accuracy);
    const previous = { lat: last.latitude, lon: last.longitude };
    const miles = haversineMiles(previous, point);
    const minutes = (Date.now() - Date.parse(last.recordedAt)) / 60000;
    if (miles >= 1) return addBreadcrumb(point, "distance", accuracy);
    if (minutes >= 10 && miles >= 0.1) return addBreadcrumb(point, "time", accuracy);
  }

  function getBreadcrumbGeoJson() {
    const crumbs = state.breadcrumbTrail;
    return {
      line: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: crumbs.map((crumb) => [crumb.longitude, crumb.latitude]) }
      },
      points: {
        type: "FeatureCollection",
        features: crumbs.map((crumb, index) => ({
          type: "Feature",
          properties: {
            rank: MEANINGFUL_REASONS.includes(crumb.reason) ? 0 : index % 20 === 0 ? 1 : index % 5 === 0 ? 2 : 3,
            reason: crumb.reason,
            label: crumb.label || "",
            recordedAt: crumb.recordedAt,
            tripLeg: crumb.tripLeg
          },
          geometry: { type: "Point", coordinates: [crumb.longitude, crumb.latitude] }
        }))
      }
    };
  }

  function registerFootprintIcon(map) {
    return new Promise((resolve) => {
      if (!map || (map.hasImage && map.hasImage("elsie-footprint"))) return resolve();
      const image = new Image(48, 48);
      image.onload = () => {
        try { if (!map.hasImage("elsie-footprint")) map.addImage("elsie-footprint", image, { pixelRatio: 2 }); } catch {}
        resolve();
      };
      image.onerror = () => resolve();
      image.src = "/sasquatch-footprint.png";
    });
  }

  function syncBreadcrumbLayers(map = homeMap) {
    if (!map || !map.getStyle) return;
    const visible = isMapProfile() && state.breadcrumbVisible && state.breadcrumbTrail.length > 0;
    const geo = getBreadcrumbGeoJson();
    try {
      if (!map.getSource("elsie-breadcrumb-line")) {
        if (!map.isStyleLoaded || !map.isStyleLoaded()) {
          // Style isn't ready yet: retry once it is, instead of silently never creating the layer.
          if (map.once) map.once("idle", () => syncBreadcrumbLayers(map));
          return;
        }
        map.addSource("elsie-breadcrumb-line", { type: "geojson", data: geo.line });
        map.addLayer({
          id: "elsie-breadcrumb-line",
          type: "line",
          source: "elsie-breadcrumb-line",
          paint: { "line-color": "#6b4f3a", "line-width": 2, "line-opacity": 0.45, "line-dasharray": [2, 3] }
        }, map.getLayer("home-clusters") ? "home-clusters" : undefined);
        map.addSource("elsie-breadcrumb-steps", { type: "geojson", data: geo.points });
        map.addLayer({
          id: "elsie-breadcrumb-steps",
          type: "circle",
          source: "elsie-breadcrumb-steps",
          paint: {
            "circle-color": "#6b4f3a",
            "circle-radius": ["case", ["==", ["get", "rank"], 0], 9, 5],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fffdf7"
          }
        });
        map.on("click", "elsie-breadcrumb-steps", (event) => {
          const props = event.features[0].properties;
          if (Number(props.rank) !== 0 && map.getZoom() < 9) return;
          const when = new Date(props.recordedAt).toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" });
          const text = props.label ? `${props.label} · ${when}` : `Passed here · ${when} · ${props.tripLeg}`;
          new maplibregl.Popup({ closeButton: true }).setLngLat(event.features[0].geometry.coordinates).setText(text).addTo(map);
        });
      } else {
        map.getSource("elsie-breadcrumb-line").setData(geo.line);
        map.getSource("elsie-breadcrumb-steps").setData(geo.points);
      }
      const visibility = visible ? "visible" : "none";
      map.setLayoutProperty("elsie-breadcrumb-line", "visibility", visibility);
      map.setLayoutProperty("elsie-breadcrumb-steps", "visibility", visibility);
    } catch {}
  }

  function clearBreadcrumbTrail() {
    state.breadcrumbTrail = [];
    saveState();
    syncBreadcrumbLayers();
  }

  function sasquatchTrailProgress() {
    const legs = new Set(state.breadcrumbTrail.map((crumb) => crumb.tripLeg).filter((leg) => ["day1", "day2", "return", "outbound", "island"].includes(leg)));
    const normalized = new Set([...legs].map((leg) => (leg === "outbound" ? "day1" : leg === "island" ? "day2" : leg)));
    const covered = ["day1", "day2", "return"].filter((leg) => normalized.has(leg)).length;
    return { value: covered, total: 3, earned: covered >= 3 };
  }

  /* ---------- Shared bottom sheet ---------- */

  let elsieSheetLastFocus = null;

  function openElsieSheet(type, payload) {
    if (!isMapProfile()) return;
    const sheet = byId("elsieSheet");
    const scrim = byId("elsieSheetScrim");
    if (!sheet) return;
    const isFreshOpen = sheet.hidden || state.activeElsieSheet !== type;
    const previousScrollTop = sheet.scrollTop;
    state.activeElsieSheet = type;
    if (isFreshOpen) elsieSheetLastFocus = document.activeElement;
    sheet.innerHTML = renderElsieSheetContent(type, payload);
    sheet.hidden = false;
    if (scrim) scrim.hidden = false;
    if (isFreshOpen) {
      sheet.querySelector("button, a, input")?.focus?.();
    } else {
      sheet.scrollTop = previousScrollTop;
    }
  }

  function closeElsieSheet() {
    const sheet = byId("elsieSheet");
    const scrim = byId("elsieSheetScrim");
    if (sheet) { sheet.hidden = true; sheet.innerHTML = ""; }
    if (scrim) scrim.hidden = true;
    state.activeElsieSheet = null;
    if (elsieSheetLastFocus?.focus) elsieSheetLastFocus.focus();
    elsieSheetLastFocus = null;
  }

  function elsieSheetHead(title) {
    return `<div class="elsie-sheet-head"><strong>${escapeHtml(title)}</strong><button type="button" data-elsie-close-sheet aria-label="Close sheet">Close</button></div>`;
  }

  function renderElsieSheetContent(type, payload) {
    if (type === "eta") return `${elsieSheetHead("Route + ETA")}${elsieRouteTrackerMarkup()}`;
    if (type === "picks") return renderElsiePicksSheet();
    if (type === "island") return renderElsieIslandSheet();
    if (type === "julesgames") return renderJulesGamesSheet();
    if (type === "radar") return renderElsieRadarSheet();
    if (type === "badges") return renderElsieBadgeSheet();
    if (type === "breadcrumb") return renderElsieTrailSheet();
    return elsieSheetHead("Elsie");
  }

  function renderElsieIslandSheet() {
    const { board, interests } = elsieIslandActivities();
    const stops = elsieIslandStops();
    const groups = {};
    stops.forEach((item) => {
      const group = elsieIslandLandmarkGroup(item);
      groups[group] = groups[group] || [];
      groups[group].push(item);
    });
    return `${elsieSheetHead("Island Ideas")}
      <div class="elsie-island-sheet">
        <p class="elsie-sheet-meta">While you're on Bois Blanc: things to look for, and things to do.</p>
        ${interests.length ? `<div class="elsie-island-interests">${interests.map((idea) => `<span>${escapeHtml(idea)}</span>`).join("")}</div>` : ""}
        ${Object.keys(groups).length ? `<h4>Pinned on the map</h4>${Object.entries(groups).map(([group, items]) => `
          <p class="elsie-sheet-meta"><strong>${escapeHtml(group)}:</strong> ${items.map((i) => escapeHtml(i.title)).join(", ")}</p>
        `).join("")}` : ""}
        <h4>Worth seeking out</h4>
        <p class="elsie-sheet-meta">These don't have an exact map pin yet — ask a local or check the island museum for precise directions.</p>
        <div class="elsie-picks-list">
          ${board.map((item) => `<article>
            <small>${escapeHtml(item.type)}</small><strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.detail)}</p>
            <p class="elsie-popup-angle">Look for: ${escapeHtml(item.lookFor)}</p>
            <div>
              <button type="button" data-complete-activity="${escapeHtml(item.title)}">Done</button>
              <button type="button" data-shortlist="${escapeHtml(item.title)}" data-category="${escapeHtml(item.type)}" data-url="${item.link}">Save</button>
              <a href="${item.link}" target="_blank" rel="noopener">Learn more</a>
            </div>
          </article>`).join("") || "<p>No new island activities right now — check Badges for what's already logged.</p>"}
        </div>
      </div>`;
  }

  function renderElsiePicksSheet() {
    const stops = elsieRadarStops();
    return `${elsieSheetHead("Elsie's Picks")}
      <div class="elsie-picks-list">
        ${stops.length ? stops.map((item) => `<article>
          <small>${elsieRadarLabel(item)}</small><strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.profiles?.elsie || item.summary || "A stop with a story worth retelling.")}</p>
          <div><button type="button" data-preview-stop="${escapeHtml(item.title)}">Preview</button><button type="button" data-shortlist="${escapeHtml(item.title)}" data-category="${escapeHtml(item.category)}" data-url="${sourceLinkForPlace(item)}">${isStopSaved(item) ? "Saved" : "Save"}</button><a href="${googleMapsNavigationUrl(item)}" target="_blank" rel="noopener">Navigate</a></div>
        </article>`).join("") : "<p>No picks ahead on this leg right now.</p>"}
      </div>`;
  }

  function renderElsieRadarSheet() {
    const frame = currentRadarFrame();
    const frameTime = frame ? new Date(frame.time * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "no data yet";
    const opacities = [0, 0.25, 0.45, 0.65];
    return `${elsieSheetHead("Weather radar")}
      <div class="elsie-radar-sheet">
        <label class="elsie-switch"><input type="checkbox" data-radar-toggle ${state.radarEnabled ? "checked" : ""}> Radar on</label>
        <p class="elsie-sheet-meta">Latest frame: ${frameTime}${state.radarEnabled && frame && state.radarCachedFrame && frame.path === state.radarCachedFrame.path && elsieWeatherRadar.frames.length <= 1 ? " · using cached frame" : ""}</p>
        <div class="elsie-opacity-row" role="group" aria-label="Radar opacity">
          ${opacities.map((value) => `<button type="button" data-radar-opacity="${value}" aria-pressed="${Number(state.radarOpacity) === value}">${Math.round(value * 100)}%</button>`).join("")}
        </div>
        <div class="elsie-radar-actions">
          <button type="button" data-radar-anim>${state.radarAnimationEnabled ? "Pause" : "Play"}</button>
          <button type="button" data-radar-refresh>Refresh</button>
        </div>
        <label class="elsie-switch"><input type="checkbox" data-radar-stations ${state.radarStationsVisible ? "checked" : ""}> Show radar stations</label>
        <p class="elsie-sheet-meta">Radar data © RainViewer · Stations: NOAA / NWS NEXRAD</p>
      </div>`;
  }

  function elsieBadgeSummary() {
    const list = visibleAdventureBadges();
    const items = list.map((badge) => ({ badge, progress: adventureBadgeProgress(badge) }));
    const trail = sasquatchTrailProgress();
    const earned = items.filter((entry) => entry.progress.earned).length + (trail.earned ? 1 : 0);
    return { items, trail, earned, total: items.length + 1 };
  }

  function renderElsieBadgeSheet() {
    const summary = elsieBadgeSummary();
    return `${elsieSheetHead(`Badges ${summary.earned}/${summary.total}`)}
      <div class="elsie-badge-list">
        ${summary.items.map(({ badge, progress }) => `
          <article class="${progress.earned ? "is-earned" : ""}">
            <strong>${escapeHtml(badge.title)}</strong>
            <p>${escapeHtml(badge.description || "")}</p>
            <div class="elsie-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${progress.total}" aria-valuenow="${progress.value}" aria-label="${escapeHtml(badge.title)} progress"><span style="width:${progress.pct}%"></span></div>
            <small>${progress.value}/${progress.total}${progress.earned ? " · Earned" : ""}</small>
          </article>`).join("")}
        <article class="${summary.trail.earned ? "is-earned" : ""}">
          <strong>Sasquatch Trail 👣</strong>
          <p>Record breadcrumbs across all three travel legs.</p>
          <div class="elsie-progress" role="progressbar" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${summary.trail.value}" aria-label="Sasquatch Trail progress"><span style="width:${Math.round((summary.trail.value / 3) * 100)}%"></span></div>
          <small>${summary.trail.value}/3 legs${summary.trail.earned ? " · Earned" : ""}</small>
        </article>
      </div>`;
  }

  function renderElsieTrailSheet() {
    const count = state.breadcrumbTrail.length;
    return `${elsieSheetHead("Sasquatch trail")}
      <div class="elsie-trail-sheet">
        <p>${count ? `${count} footprints recorded. A tiny mysterious creature has been following the route.` : "No footprints yet. Start Live Trip and the trail begins."}</p>
        <label class="elsie-switch"><input type="checkbox" data-trail-visible ${state.breadcrumbVisible ? "checked" : ""}> Show trail</label>
        <button type="button" class="elsie-danger" data-trail-clear ${count ? "" : "disabled"}>Clear trail</button>
      </div>`;
  }

  function isElsieIslandMode() {
    return isMapProfile() && (state.phase === "island" || state.phase === "complete");
  }

  function elsieShortLabel(label) {
    return String(label || "").replace(/\s*overnight$/i, "").replace(/\s*ferry$/i, "").trim();
  }

  function elsieEtaPillText() {
    if (isElsieIslandMode()) {
      return `<b>Bois Blanc</b><span>Island mode</span><em>On Island</em>`;
    }
    const target = getActiveTripTarget();
    const route = currentRouteResult();
    const miles = route.distanceMeters ? Math.round(route.distanceMeters / 1609.344) : target.plannedMiles;
    const status = route.isFallback ? (route.source === "planned" ? "Planned" : "Cached") : route.isLive ? "Live" : "Approx";
    return `<b>${escapeHtml(elsieShortLabel(target.label))}</b><span>${formatRouteDuration(route.durationSeconds)} · ${Number(miles || 0).toLocaleString()} mi</span><em>${status}</em>`;
  }

  function elsieIslandActivities() {
    const profile = data.profiles.find((p) => p.id === activeProfile);
    const board = (data.activityBoard[activeProfile] || []).filter((item) => ["Island", "Nature", "Great Lakes"].includes(item.type));
    const interests = profile?.islandInterests || [];
    const completed = new Set(state.completed.filter((item) => item.profile === activeProfile).map((item) => item.activityTitle));
    return { board: board.filter((item) => !completed.has(item.title)), interests };
  }

  function elsieIslandStops() {
    return allAttractions().filter((item) => haversineMiles({ lat: item.lat, lon: item.lon }, { lat: 45.7465, lon: -84.4948 }) <= 6);
  }

  function elsieIslandLandmarkGroup(item) {
    const text = `${item.title} ${item.category}`.toLowerCase();
    if (/lighthouse/.test(text)) return "Landmark";
    if (/natural area|park|forest|shoreline/.test(text)) return "Wildlife & nature";
    if (/museum|library|township|school|community/.test(text)) return "Island life";
    if (/airport|transit/.test(text)) return "Getting around";
    return "Landmark";
  }

  function refreshElsieEtaPill() {
    const pill = byId("elsieEtaPill");
    if (pill) pill.innerHTML = elsieEtaPillText();
  }

  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-elsie-sheet]");
    if (opener) {
      const type = opener.dataset.elsieSheet;
      if (state.activeElsieSheet === type) closeElsieSheet();
      else openElsieSheet(type);
      return;
    }
    if (event.target.closest("[data-elsie-close-sheet]") || event.target.id === "elsieSheetScrim") {
      closeElsieSheet();
      return;
    }
    const opacityButton = event.target.closest("[data-radar-opacity]");
    if (opacityButton) {
      state.radarOpacity = Number(opacityButton.dataset.radarOpacity);
      saveState();
      if (state.radarEnabled && homeMap?.getLayer?.("elsie-radar-layer")) homeMap.setPaintProperty("elsie-radar-layer", "raster-opacity", state.radarOpacity);
      openElsieSheet("radar");
      return;
    }
    if (event.target.closest("[data-radar-refresh]")) {
      fetchRadarMeta(false).then(() => { applyRadarLayer(); openElsieSheet("radar"); });
      return;
    }
    if (event.target.closest("[data-radar-anim]")) {
      state.radarAnimationEnabled = !state.radarAnimationEnabled;
      saveState();
      if (state.radarAnimationEnabled) startRadarAnimation();
      else { stopRadarAnimation(); applyRadarLayer(); }
      openElsieSheet("radar");
      return;
    }
    if (event.target.closest("[data-trail-clear]")) {
      if (window.confirm("Clear the entire Sasquatch trail? This cannot be undone.")) {
        clearBreadcrumbTrail();
        openElsieSheet("breadcrumb");
      }
      return;
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-radar-toggle]")) {
      setRadarEnabled(event.target.checked);
      openElsieSheet("radar");
    }
    if (event.target.matches("[data-radar-stations]")) {
      state.radarStationsVisible = event.target.checked;
      saveState();
      syncRadarStationLayer();
    }
    if (event.target.matches("[data-trail-visible]")) {
      state.breadcrumbVisible = event.target.checked;
      saveState();
      syncBreadcrumbLayers();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.activeElsieSheet) closeElsieSheet();
  });

  /* =================== END ELSIE MAP EXPERIENCE =================== */

  function renderHomeMapPanel() {
    const container = byId("homeRouteMapPanel");
    if (!container) return;
    const attractions = allAttractions();
    const count = byId("mapStopCount");
    if (count) count.textContent = `${attractions.length} stops`;
    const elsie = isMapProfile();
    const [elsieTitle, elsieSubtitle] = elsieHeaderCopy();
    document.body.classList.toggle("elsie-map-active", elsie);
    container.innerHTML = elsie ? `
      <div class="elsie-map-shell">
        <div id="homeClusterMap" class="home-cluster-map maplibre-canvas elsie-map-canvas" role="application" aria-label="${currentProfile().name}'s route map with ${attractions.length} trip stops">
          <div class="map-fallback">
            <strong>Loading Elsie's map</strong>
            <p>${attractions.length} trip stops are ready.</p>
          </div>
        </div>
        <div class="elsie-float-top">
          <button type="button" id="elsieEtaPill" class="elsie-eta-pill" data-elsie-sheet="eta" aria-haspopup="dialog" aria-label="Route and ETA details">${elsieEtaPillText()}</button>
        </div>
        <div class="elsie-float-right">
          <button type="button" class="elsie-map-fab ${state.radarEnabled ? "is-on" : ""}" data-elsie-sheet="radar" aria-haspopup="dialog" aria-label="Weather radar controls">🌦</button>
          <button type="button" class="elsie-map-fab" data-elsie-sheet="breadcrumb" data-crumb-count="${state.breadcrumbTrail.length}" aria-haspopup="dialog" aria-label="Sasquatch trail controls, ${state.breadcrumbTrail.length} points recorded">👣</button>
          <button type="button" class="elsie-map-fab elsie-gps-fab" data-gps-locate aria-label="Find my location">📍</button>
          <button type="button" class="elsie-map-fab elsie-theme-fab" data-map-theme-toggle aria-label="Switch map to ${state.mapTheme === "dark" ? "light" : "dark"} mode">${state.mapTheme === "dark" ? "☀️" : "🌙"}</button>
          <button type="button" class="elsie-map-fab elsie-smoke-fab ${state.smokeEnabled ? "is-on" : ""}" data-smoke-toggle aria-pressed="${state.smokeEnabled}" aria-label="Smoke and haze layer ${state.smokeEnabled ? "on" : "off"}">💨</button>
          <button type="button" class="elsie-map-fab elsie-fire-fab ${state.wildfiresEnabled ? "is-on" : ""}" data-wildfire-toggle aria-pressed="${state.wildfiresEnabled}" aria-label="Active wildfires layer ${state.wildfiresEnabled ? "on" : "off"}">🔥</button>
        </div>
        ${renderElsieRadarMarkup()}
        <div id="elsieSheetScrim" class="elsie-sheet-scrim" hidden></div>
        <section id="elsieSheet" class="elsie-sheet" role="dialog" aria-modal="true" aria-label="Elsie map sheet" hidden></section>
        <div id="clusterDrawer" class="cluster-drawer" hidden></div>
      </div>
    ` : `
      <div id="homeClusterMap" class="home-cluster-map maplibre-canvas" role="application" aria-label="Explore map with ${attractions.length} uploaded trip stops">
        <div class="map-fallback">
          <strong>Loading explore map</strong>
          <p>${attractions.length} uploaded trip stops are ready. Clusters expand as you zoom in.</p>
        </div>
      </div>
      <div id="homeDomMarkerLayer" class="home-dom-marker-layer" aria-label="Visible stop markers"></div>
      ${renderUploadedStopsPanel(attractions)}
      <div id="clusterDrawer" class="cluster-drawer" hidden></div>
    `;
    if (!window.maplibregl) {
      loadMapLibre();
      return;
    }
    drawHomeClusterMap();
  }

  function drawHomeClusterMap() {
    const canvas = byId("homeClusterMap");
    if (!canvas || !window.maplibregl) return;
    const attractions = allAttractions();
    if (!attractions.length) {
      canvas.innerHTML = `<div class="map-fallback"><strong>No route stops loaded</strong><p>Upload the CSV-generated trip-stops.js file to show clustered stops.</p></div>`;
      return;
    }
    if (homeMap) {
      homeMap.remove();
      homeMap = null;
    }
    homeMap = new maplibregl.Map({
      container: canvas,
      style: activeMapStyleUrl(),
      center: [-89.7, 41.8],
      zoom: 4.35,
      attributionControl: true
    });
    homeMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    homeMap.on("error", () => {
      const panel = byId("uploadedStopsPanel");
      if (panel) panel.classList.add("is-map-fallback");
    });
    homeMap.on("load", () => {
      window.setTimeout(() => homeMap?.resize?.(), 80);
      homeMap.addSource("home-attractions", {
        type: "geojson",
        data: attractionFeatureCollection(),
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 30
      });
      homeMap.addLayer({
        id: "home-clusters",
        type: "circle",
        source: "home-attractions",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#1f78a4", 10, "#2f7d5f", 25, "#bd5a36"],
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 25, 31],
          "circle-stroke-width": 4,
          "circle-stroke-color": "#fffdf7",
          "circle-opacity": 0.94
        }
      });
      homeMap.addLayer({
        id: "home-cluster-count",
        type: "symbol",
        source: "home-attractions",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 14 },
        paint: { "text-color": "#fffdf7" }
      });
      homeMap.addLayer({
        id: "home-unclustered-point",
        type: "circle",
        source: "home-attractions",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["match", ["get", "categoryGroup"],
            "nature", "#2f7d5f",
            "history", "#7c5d3a",
            "museum", "#174a7c",
            "food", "#bd5a36",
            "ferry", "#163f33",
            "water", "#1f78a4",
            "#f2c14e"
          ],
          "circle-radius": 8,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#fffdf7"
        }
      });
      homeMap.addLayer({
        id: "home-unclustered-label",
        type: "symbol",
        source: "home-attractions",
        filter: ["!", ["has", "point_count"]],
        minzoom: 7.25,
        layout: { "text-field": ["get", "title"], "text-offset": [0, 1.3], "text-size": 11, "text-anchor": "top" },
        paint: { "text-color": "#17211b", "text-halo-color": "#fffdf7", "text-halo-width": 1.5 }
      });
      homeMap.addLayer({
        id: "home-unclustered-icon",
        type: "symbol",
        source: "home-attractions",
        filter: ["!", ["has", "point_count"]],
        layout: { "text-field": ["get", "icon"], "text-size": 13, "text-allow-overlap": true },
        paint: { "text-color": "#fffdf7" }
      });
      if (isMapProfile()) {
        const islandMode = isElsieIslandMode();
        if (!islandMode) {
          const routed = currentRouteResult().coordinates || [];
          const legTarget = getActiveTripTarget();
          const legOrigin = state.lastPosition || activeOrigin();
          const planned = [legOrigin, ...activeLegWaypoints(), legTarget].map((point) => [point.lon, point.lat]);
          homeMap.addSource("elsie-active-route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routed.length > 1 ? routed : planned } }
          });
          homeMap.addLayer({
            id: "elsie-active-route-line",
            type: "line",
            source: "elsie-active-route",
            paint: { "line-color": "#6f50a0", "line-width": 5, "line-opacity": 0.82 }
          }, "home-unclustered-point");
        }
        syncBreadcrumbLayers(homeMap);
        registerElsieIcons(homeMap).then(() => {
          addElsieIconLayer(homeMap);
          if (activeProfile === "elsie") registerElsieGhostIcon(homeMap).then(() => addElsieHauntedLayer(homeMap));
          if (activeProfile === "emma") registerEmmaThemeIcons(homeMap).then(() => addEmmaRouteLayer(homeMap));
          if (activeProfile === "katrina") registerKatrinaHauntIcons(homeMap).then(() => addKatrinaQuestLayer(homeMap));
          if (activeProfile === "jules") addJulesRouteLayer(homeMap);
          if (activeProfile === "momdad") registerMomdadOverlayIcons(homeMap).then(() => addFamilyOverlayLayer(homeMap));
        });
        if (state.radarEnabled) fetchRadarMeta().then(() => { applyRadarLayer(homeMap); startRadarAnimation(); });
        syncRadarStationLayer(homeMap);
        if (state.smokeEnabled) applySmokeLayer(homeMap);
        if (EASTER_EGG_LINKS[activeProfile]) registerEasterEggIcon(homeMap).then(() => addEasterEggLayer(homeMap));
        registerNasaEggIcon(homeMap).then(() => addNasaEggLayer(homeMap));
        if (state.wildfiresEnabled) applyWildfireLayer(homeMap);
        applyItalianHeritageLayer(homeMap);
        applyNationalParkLayer(homeMap);
        applyIslandDecoLayer(homeMap);
        if (!islandMode) refreshActiveRoute();
        if (!islandMode) try {
          if (!homeMap.getLayer("elsie-day2-preview-line")) {
            const stops = data.route.coordinates;
            const day2Waypoints = state.includeIndianaDunes && !state.completedStops["indiana-dunes"]
              ? [{ lat: stops.indianaDunes.lat, lon: stops.indianaDunes.lon }]
              : [];
            const day2Origin = { lat: stops.merrillville.lat, lon: stops.merrillville.lon };
            const day2Destination = { lat: stops.cheboygan.lat, lon: stops.cheboygan.lon };
            const day2Points = [day2Origin, ...day2Waypoints, day2Destination];
            const isDay2Now = currentTripLegId() === "day2";
            homeMap.addSource("elsie-day2-preview", {
              type: "geojson",
              data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: day2Points.map((p) => [p.lon, p.lat]) } }
            });
            homeMap.addLayer({
              id: "elsie-day2-preview-line",
              type: "line",
              source: "elsie-day2-preview",
              paint: {
                "line-color": "#8b6fc9",
                "line-width": isDay2Now ? 6 : 4,
                "line-opacity": isDay2Now ? 0.9 : 0.6,
                "line-dasharray": isDay2Now ? [1, 0] : [2, 1.4]
              }
            });
            getActiveRoute({ origin: day2Origin, destination: day2Destination, waypoints: day2Waypoints })
              .then((route) => {
                if (route.coordinates?.length > 1) {
                  homeMap?.getSource?.("elsie-day2-preview")?.setData({
                    type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route.coordinates }
                  });
                }
              })
              .catch(() => {});
          }
        } catch { /* non-critical preview layer */ }
        try {
          if (!homeMap.getLayer("elsie-state-outlines")) {
            homeMap.addLayer({
              id: "elsie-state-outlines",
              type: "line",
              source: "openmaptiles",
              "source-layer": "boundary",
              filter: ["all", ["==", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]],
              paint: {
                "line-color": "#4a3f6b",
                "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.1, 6, 1.6, 10, 2.2],
                "line-opacity": 0.75,
                "line-dasharray": [2, 1]
              }
            }, "home-unclustered-point");
          }
        } catch { /* base style source layout may vary; safe to skip */ }
      }
      if (state.lastPosition) {
        homeMap.addSource("current-location", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [state.lastPosition.lon, state.lastPosition.lat] } }
        });
        if (activeProfile === "jules") {
          registerJulesGpsImage(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": julesGpsImageName(), "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.65, 9, 0.8, 12, 0.95], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "emma") {
          registerEmmaGpsAgent(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "emma-gps-agent", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 6, 0.28, 9, 0.34, 12, 0.4], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "momdad") {
          registerMomdadGpsPhoto(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "momdad-gps-photo", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 6, 0.28, 9, 0.34, 12, 0.4], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "elsie") {
          registerElsieGpsPhoto(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "elsie-gps-photo", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.2, 6, 0.28, 9, 0.34, 12, 0.4], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (activeProfile === "eliette") {
          registerElietteGpsImage(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "eliette-gps-jeep", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.19, 6, 0.26, 9, 0.32, 12, 0.38], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else if (FAMILY_LOCATOR_PROFILES.includes(activeProfile)) {
          registerFamilyGpsImage(homeMap).then(() => {
            if (!homeMap || homeMap.getLayer("current-location-dot")) return;
            homeMap.addLayer({
              id: "current-location-dot",
              type: "symbol",
              source: "current-location",
              layout: { "icon-image": "family-gps-marker", "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.16, 6, 0.22, 9, 0.28, 12, 0.33], "icon-allow-overlap": true, "icon-ignore-placement": true }
            });
          });
        } else {
          homeMap.addLayer({
            id: "current-location-dot",
            type: "circle",
            source: "current-location",
            paint: { "circle-color": "#c94f34", "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 6, 7, 9, 9, 12, 11], "circle-stroke-width": 4, "circle-stroke-color": "#fffdf7" }
          });
        }
      }
      homeMap.on("click", "home-clusters", (event) => {
        const features = homeMap.queryRenderedFeatures(event.point, { layers: ["home-clusters"] });
        const feature = features[0];
        if (!feature) return;
        const source = homeMap.getSource("home-attractions");
        showClusterDrawer(feature);
        const expansion = source.getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => {
          if (error) return;
          homeMap.easeTo({ center: feature.geometry.coordinates, zoom });
        });
        if (expansion?.then) expansion.then((zoom) => homeMap.easeTo({ center: feature.geometry.coordinates, zoom })).catch(() => {});
      });
      homeMap.on("mouseenter", "home-clusters", () => { homeMap.getCanvas().style.cursor = "pointer"; });
      homeMap.on("mouseleave", "home-clusters", () => { homeMap.getCanvas().style.cursor = ""; });
      homeMap.on("click", "home-unclustered-point", (event) => {
        const item = attractionForIdOrTitle(event.features[0].properties.id, event.features[0].properties.title);
        if (item) {
          showAttractionPreview(item);
          if (!isMapProfile()) showStopDetailDrawer(item);
        }
      });
      homeMap.on("mousemove", "home-unclustered-point", (event) => {
        const item = attractionForIdOrTitle(event.features[0].properties.id, event.features[0].properties.title);
        if (item) showAttractionPreview(item);
      });
      homeMap.on("mouseenter", "home-unclustered-point", () => { homeMap.getCanvas().style.cursor = "pointer"; });
      homeMap.on("mouseleave", "home-unclustered-point", () => { homeMap.getCanvas().style.cursor = ""; });
      homeMap.on("moveend", refreshUploadedStopsPanel);
      homeMap.on("zoomend", refreshUploadedStopsPanel);
      if (!isMapProfile()) {
        homeMap.on("move", renderHomeDomMarkers);
        homeMap.on("zoom", renderHomeDomMarkers);
        homeMap.on("resize", renderHomeDomMarkers);
      }
      const first = attractions[0];
      const bounds = attractions.reduce((next, item) => next.extend([item.lon, item.lat]), new maplibregl.LngLatBounds([first.lon, first.lat], [first.lon, first.lat]));
      if (isElsieIslandMode()) {
        homeMap.jumpTo({ center: [-84.4948, 45.7465], zoom: 11.2 });
      } else {
        homeMap.fitBounds(bounds, { padding: { top: 92, bottom: 86, left: 42, right: 42 }, maxZoom: 5.8, duration: 0 });
      }
      refreshUploadedStopsPanel();
      if (!isMapProfile()) window.setTimeout(renderHomeDomMarkers, 120);
    });
  }

  function renderHomeDomMarkers() {
    const layer = byId("homeDomMarkerLayer");
    if (!layer || !homeMap?.project) return;
    const bounds = homeMap.getBounds?.();
    const zoom = homeMap.getZoom?.() || 5;
    const stops = allAttractions().filter((item) => {
      try {
        return bounds ? bounds.contains([item.lon, item.lat]) : true;
      } catch {
        return true;
      }
    });
    const width = layer.clientWidth || window.innerWidth;
    const height = layer.clientHeight || window.innerHeight;
    const clusterSize = zoom < 6 ? 86 : zoom < 7.5 ? 64 : zoom < 9 ? 46 : 0;
    const buckets = new Map();
    stops.forEach((item) => {
      const point = homeMap.project([item.lon, item.lat]);
      if (point.x < -60 || point.y < -60 || point.x > width + 60 || point.y > height + 60) return;
      const key = clusterSize ? `${Math.floor(point.x / clusterSize)}:${Math.floor(point.y / clusterSize)}` : stopKey(item);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push({ ...item, screenX: point.x, screenY: point.y });
    });
    layer.innerHTML = "";
    Array.from(buckets.values()).forEach((items) => {
      const x = items.reduce((sum, item) => sum + item.screenX, 0) / items.length;
      const y = items.reduce((sum, item) => sum + item.screenY, 0) / items.length;
      const button = document.createElement("button");
      button.type = "button";
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      if (items.length > 1) {
        button.className = "dom-map-cluster";
        button.textContent = String(items.length);
        button.setAttribute("aria-label", `${items.length} stops in this area`);
        button.addEventListener("click", (event) => {
          event.preventDefault();
          showManualClusterDrawer(items);
          const avg = items.reduce((acc, item) => ({ lat: acc.lat + item.lat / items.length, lon: acc.lon + item.lon / items.length }), { lat: 0, lon: 0 });
          homeMap.easeTo({ center: [avg.lon, avg.lat], zoom: Math.min(10, zoom + 1.8) });
        });
      } else {
        const item = items[0];
        button.className = `dom-map-pin category-${categoryGroup(item.category)}`;
        button.innerHTML = `<span>${escapeHtml(item.icon || "•")}</span>`;
        button.title = `${item.title} - ${item.category}`;
        button.setAttribute("aria-label", `${item.title}, ${item.category}`);
        button.addEventListener("mouseenter", () => showAttractionPreview(item));
        button.addEventListener("focus", () => showAttractionPreview(item));
        button.addEventListener("click", (event) => {
          event.preventDefault();
          showAttractionPreview(item);
          showStopDetailDrawer(item);
        });
      }
      layer.appendChild(button);
    });
  }

  function profileKeywords(profileId = activeProfile) {
    return {
      elsie: ["suspense", "mystery", "story", "historic", "museum", "oddity", "ghost", "fort", "underground", "secret", "weird"],
      katrina: ["historic", "history", "museum", "heritage", "pioneer", "civil war", "state", "church", "campus", "monument", "story"],
      emma: ["sports", "baseball", "hall of fame", "speedway", "community", "farm", "daily", "school", "park", "zoo", "food"],
      eliette: ["craft", "glass", "gem", "shop", "market", "museum", "garden", "story", "oddity", "art", "shiny", "historic"],
      jules: ["truck", "train", "boat", "ferry", "dinosaur", "baseball", "machine", "speedway", "farm", "why", "zoo"],
      momdad: ["food", "fuel", "park", "museum", "historic", "ferry", "rest", "core", "national", "campus", "route"]
    }[profileId] || [];
  }

  function profileStopScore(item, profileId = activeProfile) {
    const text = `${item.title} ${item.category} ${item.routeSegment} ${item.summary} ${item.why} ${item.profiles?.[profileId] || ""}`.toLowerCase();
    const keywords = profileKeywords(profileId);
    let score = 0;
    keywords.forEach((word) => {
      if (text.includes(word)) score += 3;
    });
    if ((item.profiles?.[profileId] || "").length > 20) score += 4;
    if (/core/i.test(item.tier || "")) score += 3;
    if (/worth|high|major/i.test(item.tier || "")) score += 2;
    if (/gateway arch|notre dame|studebaker|indiana dunes|mackinac|plaunt|bois blanc/i.test(item.title)) score += 2;
    if (state.lastPosition && Number.isFinite(item.lat) && Number.isFinite(item.lon)) score += Math.max(0, 6 - haversineMiles(state.lastPosition, item) / 25);
    return score;
  }

  function stopsInCurrentMapView(attractions) {
    if (!homeMap?.getBounds) return attractions;
    try {
      const bounds = homeMap.getBounds();
      const visible = attractions.filter((item) => bounds.contains([item.lon, item.lat]));
      return visible.length ? visible : attractions;
    } catch {
      return attractions;
    }
  }

  function topAttractionsForPanel(attractions, profileId = activeProfile) {
    return [...attractions]
      .map((item) => ({ ...item, profileScore: profileStopScore(item, profileId) }))
      .sort((a, b) => b.profileScore - a.profileScore || String(a.routeSegment || "").localeCompare(String(b.routeSegment || "")) || a.title.localeCompare(b.title))
      .slice(0, 18);
  }

  function refreshUploadedStopsPanel() {
    const panel = byId("uploadedStopsPanel");
    if (!panel) return;
    const wasCollapsed = panel.classList.contains("is-collapsed");
    const allStops = allAttractions();
    const visibleStops = stopsInCurrentMapView(allStops);
    panel.outerHTML = renderUploadedStopsPanel(allStops, visibleStops, wasCollapsed);
  }

  function renderUploadedStopsPanel(attractions, visibleStops = attractions, collapsed = false) {
    const topStops = topAttractionsForPanel(visibleStops);
    const groups = visibleStops.reduce((acc, item) => {
      const key = categoryGroup(item.category);
      acc[key] ||= 0;
      acc[key] += 1;
      return acc;
    }, {});
    const profile = currentProfile();
    return `
      <aside id="uploadedStopsPanel" class="uploaded-stops-panel ${collapsed ? "is-collapsed" : "is-mobile-peek"}" aria-label="Uploaded trip stops">
        <div class="uploaded-stops-head">
          <div>
            <p class="eyebrow">Top attractions in view</p>
            <strong>${topStops.length} for ${escapeHtml(profile.name)}</strong>
            <small>${attractions.length} total uploaded · ${visibleStops.length} in this map view</small>
          </div>
          <button type="button" data-toggle-uploaded-stops>${collapsed ? "Stops" : "Hide"}</button>
        </div>
        <div class="uploaded-category-row">
          ${Object.entries(groups).map(([group, total]) => `<span>${escapeHtml(group)} <b>${total}</b></span>`).join("")}
        </div>
        <div class="uploaded-stop-list">
          ${topStops.map((item) => `
            <article class="uploaded-stop-card">
              <button type="button" data-stop-detail="${escapeHtml(item.title)}">
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.category)} · ${escapeHtml(item.routeSegment || "Route")}</small>
              </button>
              <p>${escapeHtml(item.profiles?.[activeProfile] || item.summary || item.why || "")}</p>
              <div class="compact-actions">
                <button type="button" data-stop-detail="${escapeHtml(item.title)}">Details</button>
                <button type="button" data-route-stop="${escapeHtml(item.title)}">Route</button>
                <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">Learn More</a>
              </div>
            </article>
          `).join("")}
        </div>
      </aside>
    `;
  }

  function updateHomeGpsLayer() {
    if (!homeMap || !state.lastPosition) return;
    const dataPoint = { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [state.lastPosition.lon, state.lastPosition.lat] } };
    const source = homeMap.getSource?.("current-location");
    if (source) {
      source.setData(dataPoint);
      return;
    }
    if (!homeMap.isStyleLoaded?.()) return;
    homeMap.addSource("current-location", { type: "geojson", data: dataPoint });
    homeMap.addLayer({
      id: "current-location-dot",
      type: "circle",
      source: "current-location",
      paint: { "circle-color": "#c94f34", "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 6, 7, 9, 9, 12, 11], "circle-stroke-width": 4, "circle-stroke-color": "#fffdf7" }
    });
  }

  function categoryGroup(category = "") {
    const text = category.toLowerCase();
    if (/park|nature|trail|preserve|garden|dune|forest|waterfall|falls/.test(text)) return "nature";
    if (/historic|history|fort|capitol|heritage/.test(text)) return "history";
    if (/museum|library|hall/.test(text)) return "museum";
    if (/food|restaurant|cafe|market|cider|fudge|donut/.test(text)) return "food";
    if (/ferry|boat|dock/.test(text)) return "ferry";
    if (/lake|lighthouse|shore|harbor|river/.test(text)) return "water";
    return "discovery";
  }

  function attractionForIdOrTitle(id, title) {
    return allAttractions().find((item) => item.id === id || item.title === title || item.name === title);
  }

  function showClusterDrawer(feature) {
    const drawer = byId("clusterDrawer");
    if (!drawer || !homeMap) return;
    const source = homeMap.getSource("home-attractions");
    const clusterId = feature.properties.cluster_id;
    const count = feature.properties.point_count || 0;
    drawer.hidden = false;
    drawer.innerHTML = `
      <div class="cluster-drawer-card">
        <p class="eyebrow">Map cluster</p>
        <h3>Opening ${count} trip stops...</h3>
      </div>
    `;
    const renderLeaves = (leaves) => {
      leaves ||= [];
      if (!leaves.length) {
        const [lon, lat] = feature.geometry.coordinates;
        leaves = allAttractions()
          .map((item) => ({
            properties: {
              id: item.id,
              title: item.title,
              category: item.category,
              segment: item.routeSegment,
              distance: haversineMiles({ lat, lon }, item)
            }
          }))
          .sort((a, b) => a.properties.distance - b.properties.distance)
          .slice(0, Math.min(count || 12, 12));
      }
      const groups = leaves.reduce((acc, leaf) => {
        const category = leaf.properties.category || "Trip Stop";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      drawer.hidden = false;
      drawer.innerHTML = `
        <div class="cluster-drawer-card">
          <button type="button" class="modal-close" data-close-cluster>Close</button>
          <p class="eyebrow">Explore cluster</p>
          <h3>${count} uploaded trip stops here</h3>
          <p class="cluster-help">Showing ${Math.min(leaves.length, 8)} nearby stops. Zoom in to split the cluster, or open any stop below.</p>
          <div class="cluster-chip-row">${Object.entries(groups).slice(0, 8).map(([category, total]) => `<span>${escapeHtml(category)} <b>${total}</b></span>`).join("")}</div>
          <div class="cluster-stop-grid">
            ${leaves.slice(0, 8).map((leaf) => {
              const item = attractionForIdOrTitle(leaf.properties.id, leaf.properties.title) || leaf.properties;
              return `
              <article class="cluster-stop-card">
                <strong>${escapeHtml(leaf.properties.title)}</strong>
                <small>${escapeHtml(leaf.properties.category)} · ${escapeHtml(leaf.properties.segment || "Route")}</small>
                <p>${escapeHtml(item.summary || item.shortSummary || item.why || item.whyItMatters || "")}</p>
                <div class="compact-actions">
                  <button type="button" data-stop-detail="${escapeHtml(leaf.properties.title)}">Details</button>
                  <button type="button" data-route-stop="${escapeHtml(leaf.properties.title)}">Route</button>
                  <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">Learn More</a>
                </div>
              </article>
            `; }).join("")}
          </div>
        </div>
      `;
    };
    const leavesResult = source.getClusterLeaves(clusterId, Math.min(count, 100), 0, (error, leaves) => {
      if (error) return;
      renderLeaves(leaves);
    });
    if (leavesResult?.then) leavesResult.then(renderLeaves).catch(() => {});
    window.setTimeout(() => {
      if (!drawer.hidden && !drawer.querySelector(".cluster-stop-card")) renderLeaves([]);
    }, 250);
  }

  function showManualClusterDrawer(items) {
    const drawer = byId("clusterDrawer");
    if (!drawer) return;
    const normalized = items.map((item) => enrichStop(item));
    const groups = normalized.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    drawer.hidden = false;
    drawer.innerHTML = `
      <div class="cluster-drawer-card">
        <button type="button" class="modal-close" data-close-cluster>Close</button>
        <p class="eyebrow">Visible map cluster</p>
        <h3>${normalized.length} uploaded trip stops here</h3>
        <p class="cluster-help">These are the stops grouped in this part of the map. Zoom in to separate them.</p>
        <div class="cluster-chip-row">${Object.entries(groups).slice(0, 8).map(([category, total]) => `<span>${escapeHtml(category)} <b>${total}</b></span>`).join("")}</div>
        <div class="cluster-stop-grid">
          ${normalized.slice(0, 12).map((item) => `
            <article class="cluster-stop-card">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.category)} · ${escapeHtml(item.routeSegment || "Route")}</small>
              <p>${escapeHtml(item.profiles?.[activeProfile] || item.summary || item.why || "")}</p>
              <div class="compact-actions">
                <button type="button" data-stop-detail="${escapeHtml(item.title)}">Details</button>
                <button type="button" data-route-stop="${escapeHtml(item.title)}">Route</button>
                <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">Learn More</a>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    `;
  }

  function showAttractionPreview(item) {
    item = enrichStop(item);
    if (isMapProfile()) {
      const haunted = hauntedMatchForStop(item);
      if (haunted && homeMap) {
        openElsieHauntedPopup(homeMap, haunted, [item.lon, item.lat]);
        return;
      }
      const emmaThemed = emmaMatchForStop(item);
      if (emmaThemed && homeMap) {
        openEmmaRoutePopup(homeMap, emmaThemed, [item.lon, item.lat]);
        return;
      }
      const quest = katrinaQuestMatchForStop(item);
      if (quest && homeMap) {
        openKatrinaQuestPopup(homeMap, quest, [item.lon, item.lat]);
        return;
      }
      const speedStop = julesMatchForStop(item);
      if (speedStop && homeMap) {
        openJulesPopup(homeMap, speedStop, [item.lon, item.lat]);
        return;
      }
      const preview = byId("homeAttractionPreview") || byId("exploreDetail");
      if (!preview) return;
      preview.hidden = false;
      preview.innerHTML = `
        <article class="attraction-preview-card elsie-preview-card">
          <div>
            <p class="eyebrow">${escapeHtml(item.category)} · ${escapeHtml(item.tier)} · ${escapeHtml(item.estimatedStopTime)}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary || item.why || "")}</p>
            <p><strong>Elsie's angle:</strong> ${escapeHtml(item.profiles?.elsie || "Look for the detail that changes the whole story.")}</p>
            <small>${escapeHtml(stopDistanceLabel(item))} · ${escapeHtml(item.distanceOffRoute)}</small>
            <div class="compact-actions">
              <button type="button" data-stop-detail="${escapeHtml(item.title)}">Details</button>
              <a class="external-link" href="${googleMapsNavigationUrl(item)}" target="_blank" rel="noopener">Navigate</a>
              <button type="button" data-shortlist="${escapeHtml(item.title)}" data-category="${escapeHtml(item.category)}" data-url="${sourceLinkForPlace(item)}">${isStopSaved(item) ? "Saved" : "Save"}</button>
            </div>
          </div>
        </article>`;
      return;
    }
    const profile = currentProfile();
    const previewTargets = [byId("homeAttractionPreview"), byId("exploreDetail")].filter(Boolean);
    const markup = `
      <article class="attraction-preview-card">
        <img src="${routeVisualForPlace(item)}" alt="${escapeHtml(item.title || item.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImageForPlace(item)}';">
        <div>
          <p class="eyebrow">${escapeHtml(item.category)} · ${escapeHtml(item.tier)} · ${escapeHtml(stopDistanceLabel(item))}</p>
          <h3>${escapeHtml(item.title || item.name)}</h3>
          <p>${escapeHtml(item.summary || item.why || "")}</p>
          <p><strong>Off route:</strong> ${escapeHtml(item.distanceOffRoute)} · <strong>Stop time:</strong> ${escapeHtml(item.estimatedStopTime)}</p>
          <p>${escapeHtml(item.profiles?.[profile.id] || item.profiles?.momdad || "")}</p>
          <div class="compact-actions">
            <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">Learn More</a>
            <button type="button" data-route-stop="${escapeHtml(item.title || item.name)}">Route</button>
            <button type="button" data-shortlist="${escapeHtml(item.title || item.name)}" data-category="${escapeHtml(item.category)}" data-url="${sourceLinkForPlace(item)}">${isStopSaved(item) ? "Saved" : "Save"}</button>
            <button type="button" data-stop-detail="${escapeHtml(item.title || item.name)}">Details</button>
          </div>
        </div>
      </article>
    `;
    previewTargets.forEach((target) => {
      target.hidden = false;
      target.innerHTML = markup;
    });
  }

  function showStopDetailDrawer(item) {
    item = enrichStop(item);
    const drawer = byId("bottomDrawer");
    if (!drawer) return;
    const cluster = byId("clusterDrawer");
    if (cluster) cluster.hidden = true;
    const profile = currentProfile();
    if (isMapProfile(profile.id)) {
      const key = stopKey(item);
      const rating = state.profileStopRatings[profile.id][key] || "";
      const collections = state.profileCollections[profile.id][key] || [];
      const collectionChoices = ["Weird", "Historic", "Animal", "Best Story", "Would Visit"];
      const angleLabel = profile.id === "katrina" ? "Katrina's angle" : profile.id === "emma" ? "Emma's angle" : profile.id === "eliette" ? "Eliette's angle" : "Elsie's angle";
      const angleText = profile.id === "katrina" ? katrinaPopupContent(item).whyAngle : profile.id === "emma" ? emmaPopupContent(item).whyGo : profile.id === "eliette" ? eliettePopupContent(item).detailPrompt : (ELSIE_STOP_FACTS[item.id] || item.profiles?.elsie);
      drawer.innerHTML = `
        <section class="stop-detail-drawer elsie-detail-drawer" role="dialog" aria-modal="false" aria-labelledby="elsieStopTitle">
          <div class="elsie-drawer-head"><div><p class="eyebrow">${escapeHtml(item.category)} · ${escapeHtml(item.tier)}</p><h3 id="elsieStopTitle">${escapeHtml(item.title)}</h3></div><button type="button" data-close-stop-drawer aria-label="Close attraction details">Close</button></div>
          <div class="elsie-detail-meta"><span>${escapeHtml(item.routeSegment || "Route")}</span><span>${escapeHtml(stopDistanceLabel(item))}</span><span>${escapeHtml(item.distanceOffRoute)}</span><span>${escapeHtml(item.estimatedStopTime)}</span></div>
          <p>${escapeHtml(item.summary || "")}</p>
          <p><strong>Why it matters:</strong> ${escapeHtml(item.why || item.summary || "")}</p>
          <p><strong>${escapeHtml(angleLabel)}:</strong> ${escapeHtml(angleText || "Look for the detail that changes the whole story.")}</p>
          <p><strong>What to look for:</strong> ${escapeHtml(angleText || item.summary || "")}</p>
          <div class="compact-actions">
            <button type="button" data-shortlist="${escapeHtml(item.title)}" data-category="${escapeHtml(item.category)}" data-url="${sourceLinkForPlace(item)}">${isStopSaved(item) ? "Saved" : "Save"}</button>
            <button type="button" data-visited-stop="${escapeHtml(item.title)}">${isStopVisited(item) ? "Visited" : "Mark visited"}</button>
            <a class="external-link" href="${googleMapsNavigationUrl(item)}" target="_blank" rel="noopener">Navigate</a>
            <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">Learn More</a>
          </div>
          <fieldset class="elsie-collections"><legend>${escapeHtml(profile.name)}'s Collections</legend>${collectionChoices.map((choice) => `<label><input type="checkbox" data-elsie-collection="${escapeHtml(key)}" value="${choice}" ${collections.includes(choice) ? "checked" : ""}> ${choice}</label>`).join("")}</fieldset>
          ${isStopVisited(item) ? `<fieldset class="elsie-rating"><legend>Worth the detour?</legend>${["Skip next time", "Interesting", "Actually great"].map((choice) => `<label><input type="radio" name="elsie-rating-${escapeHtml(key)}" data-elsie-rating="${escapeHtml(key)}" value="${choice}" ${rating === choice ? "checked" : ""}> ${choice}</label>`).join("")}</fieldset>` : ""}
        </section>`;
      return;
    }
    drawer.innerHTML = `
      <details open class="stop-detail-drawer">
        <summary>
          <span><strong>${escapeHtml(item.title || item.name)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.tier)} · ${escapeHtml(stopDistanceLabel(item))}</small></span>
          <b>${isStopVisited(item) ? "Visited" : isStopSaved(item) ? "Saved" : "Stop"}</b>
        </summary>
        <article class="stop-detail-card">
          <img src="${routeVisualForPlace(item)}" alt="${escapeHtml(item.title || item.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImageForPlace(item)}';">
          <div>
            <p class="eyebrow">${escapeHtml(item.category)} · ${escapeHtml(item.estimatedStopTime)} · ${escapeHtml(item.distanceOffRoute)}</p>
            <h3>${escapeHtml(item.title || item.name)}</h3>
            <p>${escapeHtml(item.summary || item.why || "")}</p>
            <p><strong>Why it matters:</strong> ${escapeHtml(item.why || item.summary || "")}</p>
            <p><strong>${escapeHtml(profile.name)} view:</strong> ${escapeHtml(item.profiles?.[profile.id] || item.profiles?.momdad || "")}</p>
            <div class="compact-actions">
              <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">Learn More</a>
              <button type="button" data-route-stop="${escapeHtml(item.title || item.name)}">Route</button>
              <button type="button" data-shortlist="${escapeHtml(item.title || item.name)}" data-category="${escapeHtml(item.category)}" data-url="${sourceLinkForPlace(item)}">${isStopSaved(item) ? "Saved" : "Save"}</button>
              <button type="button" data-visited-stop="${escapeHtml(item.title || item.name)}">${isStopVisited(item) ? "Visited" : "Mark Visited"}</button>
            </div>
          </div>
        </article>
      </details>
    `;
  }

  function renderBottomDrawer() {
    const drawer = byId("bottomDrawer");
    if (!drawer) return;
    if (isHomeMapPage()) {
      drawer.innerHTML = "";
      return;
    }
    const profile = currentProfile();
    const nearest = nearestAttractions(state.lastPosition, 4);
    const weather = weatherLocationsForContext().map((location) => state.weather[location.id]).find(Boolean);
    drawer.innerHTML = `
      <details open>
        <summary>
          <span><strong>${nearest[0]?.title || "Next discovery"}</strong><small>${milesLeft().toLocaleString()} miles left · ${state.gpsStatus || "GPS off"}</small></span>
          <b>${state.phase === "pretrip" ? "Prep" : "Live"}</b>
        </summary>
        <div class="drawer-grid">
          <section>
            <h3>Nearby</h3>
            ${nearest.map((item) => `
              <button type="button" class="drawer-row" data-detail="${escapeHtml(item.title)}">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${Number.isFinite(item.distance) ? `${item.distance.toFixed(1)} mi` : item.routeSegment || item.place}</span>
              </button>
            `).join("")}
          </section>
          <section>
            <h3>Trip Pulse</h3>
            <div class="drawer-chips">
              <button type="button" data-need="Bathroom now">Bathroom</button>
              <button type="button" data-need="Gas now">Gas</button>
              <button type="button" data-need="Food now">Food</button>
              <button type="button" data-nav-global="weather">Weather</button>
              <button type="button" data-nav-global="lens">Lens</button>
            </div>
            <p>${weather ? weatherSummaryFor(profile, weather, weather.location?.name || "Weather") : "Weather appears after refresh or GPS weather check."}</p>
          </section>
          <section>
            <h3>Badges</h3>
            ${renderBadgeShelf(profile.id)}
          </section>
        </div>
      </details>
    `;
  }

  function openAppleRoute(name) {
    const stop = attractionForName(name);
    if (!stop) return;
    window.open(isMapProfile() ? googleMapsNavigationUrl(stop) : appleMapsUrl(stop), "_blank");
  }

  function loadMapLibre() {
    if (window.maplibregl || mapLibreLoading || !navigator.onLine) return;
    if (!document.querySelector('link[data-maplibre-css]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.css";
      link.dataset.maplibreCss = "true";
      document.head.appendChild(link);
    }
    mapLibreLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/maplibre-gl@5.9.0/dist/maplibre-gl.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }).then(() => {
      mapLibreLoading = null;
      if (isHomeMapPage()) renderHomeMapPanel();
      renderRouteMapPanel();
      renderExploreMapPanel();
    }).catch(() => {
      mapLibreLoading = null;
    });
  }

  function mapPoint(stop) {
    return [stop.location.lon, stop.location.lat];
  }

  function drawRouteMap() {
    const canvas = byId("mapLibreCanvas");
    if (!canvas || !window.maplibregl) return;
    const plan = routePlan();
    const stops = [plan.origin, ...plan.waypoints, plan.destination];
    const line = stops.map(mapPoint);
    if (state.lastPosition) line.push([state.lastPosition.lon, state.lastPosition.lat]);
    if (routeMap) {
      routeMap.remove();
      routeMap = null;
    }
    routeMap = new maplibregl.Map({
      container: canvas,
      style: activeMapStyleUrl(),
      center: mapPoint(plan.origin),
      zoom: 5
    });
    routeMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    routeMap.on("load", () => {
      routeMap.addSource("trip-route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: stops.map(mapPoint) } }
      });
      routeMap.addLayer({
        id: "trip-route-line",
        type: "line",
        source: "trip-route",
        paint: { "line-color": "#1f78a4", "line-width": 5, "line-opacity": 0.9 }
      });
      stops.forEach((stop) => addMapMarker(stop.location, stop.label, "route"));
      if (state.lastPosition) addMapMarker(state.lastPosition, "Current GPS location", "gps");
      const bounds = line.reduce((next, coord) => next.extend(coord), new maplibregl.LngLatBounds(line[0], line[0]));
      routeMap.fitBounds(bounds, { padding: 48, maxZoom: 8, duration: 0 });
    });
  }

  function addMapMarker(point, label, type) {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `map-marker ${type === "gps" ? "is-gps" : ""}`;
    marker.title = label;
    marker.textContent = type === "gps" ? "You" : "";
    new maplibregl.Marker({ element: marker }).setLngLat([point.lon, point.lat]).setPopup(new maplibregl.Popup().setText(label)).addTo(routeMap);
  }

  function renderExploreMapPanel() {
    const container = byId("exploreMapPanel");
    if (!container) return;
    if (!window.maplibregl) {
      container.innerHTML = `
        ${renderExploreClusterFallback()}
        <p class="map-caption">Map tiles are loading. These clusters are generated from the same route data and stay visible offline.</p>
      `;
      loadMapLibre();
      return;
    }
    container.innerHTML = `
      <div id="exploreMapCanvas" class="maplibre-canvas" role="img" aria-label="Explore route attractions"></div>
      ${renderExploreClusterFallback()}
    `;
    drawExploreMap();
  }

  function attractionClusterGroups() {
    const groups = new Map();
    allAttractions()
      .sort((a, b) => (a.milesFromStart || 0) - (b.milesFromStart || 0))
      .forEach((item) => {
        const key = item.routeSegment || "Route";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      });
    return Array.from(groups.entries());
  }

  function renderExploreClusterFallback() {
    const groups = attractionClusterGroups();
    return `
      <div class="fallback-cluster-map" aria-label="Route attraction clusters">
        ${groups.map(([segment, items]) => `
          <section class="cluster-card">
            <button type="button" class="cluster-head" data-cluster-segment="${escapeHtml(segment)}">
              <span>${items.length}</span>
              <strong>${escapeHtml(segment)}</strong>
            </button>
            <div class="cluster-items">
              ${items.map((item) => `
                <button type="button" data-detail="${escapeHtml(item.title)}">
                  <strong>${escapeHtml(item.title)}</strong>
                  <small>${escapeHtml(item.place)}${item.milesFromStart ? ` · mile ${item.milesFromStart}` : ""}</small>
                </button>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    `;
  }

  function attractionFeatureCollection() {
    return {
      type: "FeatureCollection",
      features: allAttractions().map((item) => ({
        type: "Feature",
        properties: {
          id: item.id,
          title: item.title,
          category: item.category,
          categoryGroup: categoryGroup(item.category),
          place: item.place || item.routeSegment,
          segment: item.routeSegment,
          tier: item.tier,
          stopTime: item.estimatedStopTime,
          icon: item.icon
        },
        geometry: { type: "Point", coordinates: [item.lon, item.lat] }
      }))
    };
  }

  function drawExploreMap() {
    const canvas = byId("exploreMapCanvas");
    if (!canvas || !window.maplibregl) return;
    const attractions = allAttractions();
    if (exploreMap) {
      exploreMap.remove();
      exploreMap = null;
    }
    exploreMap = new maplibregl.Map({
      container: canvas,
      style: activeMapStyleUrl(),
      center: [-90.1848, 39.8],
      zoom: 4.5
    });
    exploreMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    exploreMap.on("load", () => {
      exploreMap.addSource("attractions", {
        type: "geojson",
        data: attractionFeatureCollection(),
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 48
      });
      exploreMap.addLayer({
        id: "clusters",
        type: "circle",
        source: "attractions",
        filter: ["has", "point_count"],
        paint: { "circle-color": "#1f78a4", "circle-radius": ["step", ["get", "point_count"], 20, 4, 28, 8, 36], "circle-opacity": 0.9 }
      });
      exploreMap.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "attractions",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13 },
        paint: { "text-color": "#fffdf7" }
      });
      exploreMap.addLayer({
        id: "unclustered-attraction",
        type: "circle",
        source: "attractions",
        filter: ["!", ["has", "point_count"]],
        paint: { "circle-color": "#f2c14e", "circle-radius": 9, "circle-stroke-width": 3, "circle-stroke-color": "#163f33" }
      });
      exploreMap.addLayer({
        id: "attraction-labels",
        type: "symbol",
        source: "attractions",
        filter: ["!", ["has", "point_count"]],
        layout: { "text-field": ["get", "title"], "text-offset": [0, 1.25], "text-size": 12 },
        paint: { "text-color": "#17211b", "text-halo-color": "#fffdf7", "text-halo-width": 1 }
      });
      exploreMap.on("click", "clusters", (event) => {
        const features = exploreMap.queryRenderedFeatures(event.point, { layers: ["clusters"] });
        const clusterId = features[0].properties.cluster_id;
        exploreMap.getSource("attractions").getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return;
          exploreMap.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });
      exploreMap.on("click", "unclustered-attraction", (event) => {
        const title = event.features[0].properties.title;
        const item = allAttractions().find((entry) => entry.title === title);
        if (item) showAttractionPreview(item);
      });
      if (!isMapProfile()) attractions.forEach((item) => addExploreAttractionMarker(item));
      if (state.lastPosition) addExploreGpsMarker();
      const first = attractions[0];
      if (first) {
        const bounds = attractions.reduce((next, item) => next.extend([item.lon, item.lat]), new maplibregl.LngLatBounds([first.lon, first.lat], [first.lon, first.lat]));
        exploreMap.fitBounds(bounds, { padding: 44, maxZoom: 7, duration: 0 });
      }
    });
    exploreMap.on("error", () => {
      const status = byId("exploreMapStatus");
      if (status) status.textContent = "Map tiles had trouble loading; route clusters below are still active.";
    });
  }

  function addExploreAttractionMarker(item) {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `map-marker is-attraction category-${item.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")} ${isStopSaved(item) ? "is-saved" : ""} ${isStopVisited(item) ? "is-visited" : ""}`;
    marker.title = item.title;
    marker.textContent = item.icon;
    marker.addEventListener("mouseenter", () => showAttractionPreview(item));
    marker.addEventListener("focus", () => showAttractionPreview(item));
    marker.addEventListener("click", () => showStopDetailDrawer(item));
    new maplibregl.Marker({ element: marker }).setLngLat([item.lon, item.lat]).setPopup(new maplibregl.Popup().setText(item.title)).addTo(exploreMap);
  }

  function addExploreGpsMarker() {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "map-marker is-gps";
    marker.textContent = "You";
    new maplibregl.Marker({ element: marker }).setLngLat([state.lastPosition.lon, state.lastPosition.lat]).setPopup(new maplibregl.Popup().setText("Current GPS location")).addTo(exploreMap);
  }

  function showAttractionDetail(item) {
    const profile = currentProfile();
    const target = byId("exploreDetail");
    if (target) target.innerHTML = placeCard(item, profile);
  }

  function renderDaySelect() {
    return selectedDay();
  }

  function isHomeMapPage() {
    return activePage === "explore" || activePage === "route";
  }

  function renderSplashProfiles() {
    const container = byId("splashProfiles");
    container.innerHTML = "";
    data.profiles.forEach((profile) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "splash-profile";
      button.dataset.profileChoice = profile.id;
      button.style.setProperty("--profile-accent", profile.accent || "#1f78a4");
      const ageLabel = profile.age === "adult" ? "Adult full-detail view" : `Age ${profile.age} view`;
      button.innerHTML = `<strong>${profile.name}</strong><em>${ageLabel}</em><span>${profile.lens}</span>`;
      container.appendChild(button);
    });
  }

  function parseHash() {
    const parts = (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    const profileIds = data.profiles.map((profile) => profile.id);
    if (profileIds.includes(parts[0])) activeProfile = parts[0];
    const profile = currentProfile();
    const validPages = profile.id === "momdad" ? parentPages : pages;
    const aliases = { home: "explore", route: "explore", activities: "learn", stars: "learn", ferry: "learn", badges: "rewards", saved: "rewards" };
    const requestedPage = aliases[parts[1]] || parts[1];
    activePage = validPages.includes(requestedPage) ? requestedPage : "today";
  }

  function chooseProfile(profileId) {
    activeProfile = profileId;
    state.profile = profileId;
    state.hasChosenProfile = true;
    saveState();
    location.hash = `/${profileId}/explore`;
    byId("splash").classList.add("is-hidden");
    render();
    if (!state.lastPosition && state.gpsStatus !== "Active") {
      setAction("Traveler selected. Tap Start GPS when you are ready to allow location tracking.");
    }
  }

  function navTo(page) {
    location.hash = `/${activeProfile}/${page}`;
  }

  function renderBottomNav() {
    const nav = byId("bottomNav");
    if (!nav) return;
    nav.hidden = true;
    nav.innerHTML = "";
  }

  function renderMainMenu() {
    const container = byId("mainMenuLinks");
    if (!container) return;
    container.innerHTML = mainMenuItems.map(([page, title, copy]) => `
      <button type="button" data-menu-nav="${page}" class="menu-link">
        <strong>${title}</strong>
        <span>${copy}</span>
      </button>
    `).join("");
  }

  function toggleMainMenu(open) {
    const menu = byId("mainMenu");
    const button = byId("mainMenuButton");
    if (!menu || !button) return;
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  }

  function renderCountdowns() {
    const now = new Date();
    const depart = new Date(data.dates.depart);
    const complete = new Date(data.dates.complete);
    const totalPrep = depart - new Date("2026-05-30T00:00:00-05:00");
    const prepDone = clamp(((now - new Date("2026-05-30T00:00:00-05:00")) / totalPrep) * 100, 0, 100);
    const wholeTrip = state.phase === "pretrip" ? prepDone : clamp(((now - depart) / (complete - depart)) * 100, 0, 100);
    byId("daysUntil").textContent = Math.max(0, Math.ceil((depart - now) / 86400000));
    byId("milesLeft").textContent = milesLeft().toLocaleString();
    byId("percentLeft").textContent = `${Math.round(100 - progressForPhase())}%`;
    byId("phaseLabel").textContent = phaseLabels[state.phase] || "Pre-trip";
    byId("heroTitle").textContent = state.phase === "return" ? "Homeward Bound" : state.phase === "island" ? selectedDay().title : "Bois Blanc Bound";
    byId("heroText").textContent = "";
    byId("heroText").hidden = true;
    byId("primaryProgressLabel").textContent = state.phase === "pretrip" ? "Countdown to launch" : "Whole trip progress";
    byId("primaryProgressText").textContent = `${Math.round(wholeTrip)}%`;
    byId("primaryProgressBar").style.width = `${wholeTrip}%`;
    byId("phaseProgressLabel").textContent = state.phase === "pretrip" ? "Launch getting closer" : "Current phase progress";
    byId("phaseProgressText").textContent = `${Math.round(state.phase === "pretrip" ? prepDone : progressForPhase())}%`;
    byId("phaseProgressBar").style.width = `${state.phase === "pretrip" ? prepDone : progressForPhase()}%`;
  }

  function renderTripStatus() {
    const profile = currentProfile();
    const destination = activeDestination();
    const mph = destination.plannedHours && destination.plannedMiles ? destination.plannedMiles / destination.plannedHours : 62;
    const minutes = Math.max(10, Math.round((milesLeft() / mph) * 60));
    const timeText = `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
    const childText = profile.id === "jules"
      ? `Next big thing: ${destination.label}.`
      : `${milesLeft().toLocaleString()} miles, about ${timeText}, to ${destination.label}.`;
    byId("onlineStatus").textContent = navigator.onLine ? "Online" : "Offline - using cached trip data";
    byId("nextStop").textContent = state.needNow ? `${state.needNow}: route-aware options below.` : state.phase === "pretrip" ? "Trip has not started. Use planning, route, weather, and badge prep." : `Next target: ${destination.label}.`;
    byId("kidTravelUpdate").innerHTML = `<strong>${profile.id === "momdad" ? "Adult GPS readout" : "Road update"}</strong><p>${childText}</p>${state.nearbyBadgeMessage ? `<p>${state.nearbyBadgeMessage}</p>` : ""}`;
    byId("actionStatus").textContent = state.actionMessage || "No action yet.";
    byId("gpsStatus").textContent = state.gpsStatus || "Off";
    byId("destinationStatus").textContent = state.destinationStatus || destination.label;
    byId("trackingStatus").textContent = state.trackingStatus || "Off";
    renderNeedResults();
  }

  function bestNeedStops() {
    const dayStops = data.route.restStops.filter((stop) => stop.date === selectedDayDate());
    const candidates = dayStops.length ? dayStops : data.route.restStops.filter((stop) => isTravelDay(stop.date));
    const currentMiles = routeProgressMiles();
    return candidates
      .filter((stop) => !state.needNow || !stop.needs || stop.needs.includes(state.needNow))
      .sort((a, b) => Math.abs((a.milesFromStart || 0) - currentMiles) - Math.abs((b.milesFromStart || 0) - currentMiles))
      .slice(0, 3);
  }

  function renderNeedResults() {
    const container = byId("needResults");
    if (!state.needNow) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <div class="choice-card">
        <strong>${state.needNow}</strong>
        <p>${state.phase === "pretrip" ? "Previewing likely route options. Live GPS will sort this better once the trip starts." : "Sorted by the current segment and estimated route position."}</p>
        <ul>${bestNeedStops().map((stop) => `<li><strong>${stop.name}</strong><br>${stop.timing}. ${stop.note}</li>`).join("")}</ul>
      </div>
    `;
  }

  function renderRouteQuest() {
    const container = byId("routeQuest");
    if (!container) return;
    const profile = currentProfile();
    container.innerHTML = `
      <div class="route-actions">
        <a class="external-link" href="${activeRouteUrl()}" target="_blank" rel="noopener">Open phone driving route</a>
        <a class="external-link" href="${data.mapLinks.returnUrl}" target="_blank" rel="noopener">Open return route</a>
      </div>
      <p class="map-caption">The in-app map uses MapLibre and OpenFreeMap with no API key. Phone-map buttons are for turn-by-turn driving.</p>
      ${renderBadgeShelf(profile.id)}
    `;
  }

  function profileHomeTiles(profile) {
    const childTiles = [
      ["today", "Today", "What to look for right now."],
      ["explore", "Explore Map", "Stops, sources, and nearby discoveries."],
      ["weather", "Weather", "Open-Meteo plan guidance."],
      ["stars", "Stars", "STARZ directions and sky checks."],
      ["ferry", "Ferry / Boats", "Water crossing context."],
      ["activities", "Activities", "Your interactive board."],
      ["badges", "Badges", "Earned and upcoming badges."],
      ["saved", "Saved", "Trip Shortlist and votes."],
      ["photos", "Photos", "Captured trip story."]
    ];
    const parentTiles = [
      ["explore", "Explore Map", "Uploaded stops, GPS, and family discovery detail."],
      ["weather", "Weather & Road Risk", "Open-Meteo, ferry wind, backup plans."],
      ["ferry", "Ferry Plan", "Official Plaunt links and reminders."],
      ["stops", "Stops & Supplies", "Clean stops, gas, food, last mainland prep."],
      ["votes", "Family Votes", "Review votes and approve plan items."],
      ["saved", "Trip Shortlist", "Saved ideas by profile."],
      ["badges", "Badges", "Family achievement progress."],
      ["photos", "Photos / Captures", "Trip story media."],
      ["sources", "Sources & Data Status", "Official links and live/cached status."]
    ];
    return (profile.id === "momdad" ? parentTiles : childTiles).map(([page, title, copy]) => `
      <button type="button" class="dashboard-tile" data-nav="${page}">
        <strong>${title}</strong>
        <span>${copy}</span>
      </button>
    `).join("");
  }

  function routePlaceForProfile(profile) {
    const candidates = data.route.routePlaces.filter((place) => place.day === selectedDayDate());
    const pool = candidates.length ? candidates : data.route.routePlaces;
    const preferred = data.profilePlacePreferences?.[profile.id] || [];
    const exact = preferred.map((name) => pool.find((place) => place.name === name)).find(Boolean);
    if (exact) return exact;
    return pool.find((place) => place.profiles?.[profile.id]) || pool[0];
  }

  function placeCard(place, profile) {
    return `
      <article class="choice-card place-preview">
        <img src="${routeVisualForPlace(place)}" alt="${escapeHtml(place.image?.alt || place.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImageForPlace(place)}';">
        <div>
          <strong>${place.name}</strong>
          <p>${place.place}. ${place.why}</p>
          <p>${place.profiles?.[profile.id] || place.profiles?.momdad || ""}</p>
          <div class="action-row">
            <button type="button" data-detail="${escapeHtml(place.name)}">View details</button>
            <a class="external-link" href="${sourceLinkForPlace(place)}" target="_blank" rel="noopener">${sourceLabelForPlace(place)}</a>
            <button type="button" data-source="${escapeHtml(place.name)}">Source checked</button>
            <button type="button" data-shortlist="${escapeHtml(place.name)}" data-category="Place" data-url="${sourceLinkForPlace(place)}">Save to Trip</button>
            <button type="button" data-capture="${escapeHtml(place.name)}">Capture image/video</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderDashboard(profile) {
    return renderTodayPage(profile, routePlaceForProfile(profile));
  }

  function renderJules() {
    const weather = latestWeather("boisBlanc");
    return `
      <div class="jules-flow">
        ${julesFlow.map((title) => `
          <section class="choice-card jules-card">
            <h3>${title}</h3>
            <p>${julesCopy(title, weather)}</p>
            <div class="action-row">
              <button type="button" data-complete-activity="${escapeHtml(title)}">Done</button>
              ${title.includes("Photos") ? `<button type="button" data-capture="Captain Jules photo">Take picture</button>` : ""}
            </div>
          </section>
        `).join("")}
      </div>
    `;
  }

  function julesCopy(title, weather) {
    const map = {
      "Captain Today": "Pick one safe captain choice. Grownups choose the choices.",
      "Weather": weather ? weatherSummaryFor(currentProfile(), weather, weather.location.name) : "Jacket? Rain? Wind? Check with a grownup.",
      "Ferry / Boats": "Cars go on a boat. Captain eyes open.",
      "Big Machines": "Spot trucks, boats, ramps, or bridges. Say what job they do.",
      "Stars": "Look up. Use red light. Stay with grownups.",
      "Badges": "Earn badge cards when you help the trip.",
      "Photos": "Take a picture with help.",
      "Done / Next choice": "Choose the next safe mission."
    };
    return map[title] || "Captain choice.";
  }

  function latestWeather(id) {
    return state.weather?.[id];
  }

  function renderSubpage(profile) {
    if (activePage === "today") return renderTodayPage(profile, routePlaceForProfile(profile));
    const title = activePage === "gps" ? "GPS" : activePage[0].toUpperCase() + activePage.slice(1);
    return `
      <div class="subpage">
        <div class="subpage-head">
          <button type="button" data-nav="today">Back to Today</button>
          <h3>${title}</h3>
        </div>
        ${renderPageContent(profile, activePage)}
      </div>
    `;
  }

  function renderPageContent(profile, page) {
    const place = routePlaceForProfile(profile);
    const map = {
      today: () => renderTodayPage(profile, place),
      route: () => renderRoutePage(profile, place),
      explore: () => renderExplorePage(profile),
      nearby: () => renderNearbyPage(profile),
      learn: () => renderLearnPage(profile, place),
      lens: () => renderLensPage(profile),
      rewards: () => renderRewardsPage(profile),
      memories: () => renderMemoriesPage(profile),
      gps: () => renderGpsPage(),
      detail: () => renderDetailPage(profile),
      weather: () => renderWeatherPage(profile),
      stars: () => renderStarsPage(profile),
      ferry: () => renderFerryPage(profile),
      activities: () => renderActivitiesPage(profile),
      badges: () => renderBadgesPage(profile),
      saved: () => renderSavedPage(profile),
      votes: () => renderVotesPage(true),
      stops: () => renderStopsPage(),
      photos: () => renderPhotosPage(profile),
      sources: () => renderSourcesPage(),
      settings: () => renderSettingsPage()
    };
    return (map[page] || map.today)();
  }

  function renderExplorePage(profile) {
    const attractions = allAttractions();
    return `
      <div class="choice-card">
        <strong>Explore Map</strong>
        <p>Every route-relevant place in the trip data appears here. Tap a marker for a detail card, or open the list below while offline.</p>
        <div class="action-row"><button type="button" data-start-gps="true">Start GPS</button><button type="button" data-nav="nearby">Nearest places</button></div>
      </div>
      <div class="maplibre-panel">
        <div class="section-head compact-head"><strong>Attraction clusters</strong><span class="map-caption">${attractions.length} route places</span></div>
        <p id="exploreMapStatus" class="map-caption">Route clusters and map pins use the same verified attraction list.</p>
        <div id="exploreMapPanel"></div>
      </div>
      <div id="exploreDetail"></div>
      <div class="attraction-list">
        ${attractions.map((item) => placeCard(item, profile)).join("")}
      </div>
    `;
  }

  function renderNearbyPage(profile) {
    const items = nearestAttractions(state.lastPosition, 10);
    return `
      <div class="choice-card">
        <strong>Nearby learning stops</strong>
        <p>${state.lastPosition ? "Sorted from your live GPS location." : "Start GPS to sort these by where you actually are. Until then, this shows the route learning set."}</p>
        <div class="action-row"><button type="button" data-start-gps="true">Start GPS</button><button type="button" data-nav="explore">Open Explore Map</button></div>
      </div>
      <div class="nearby-list">
        ${items.map((item) => `
          <article class="choice-card nearby-card">
            <strong>${item.title}</strong>
            <p>${item.place}. ${item.summary || item.why}</p>
            ${Number.isFinite(item.distance) ? `<p><strong>${item.distance.toFixed(1)} miles away</strong> by straight-line GPS estimate.</p>` : ""}
            <div class="action-row">
              <button type="button" data-detail="${escapeHtml(item.title)}">View details</button>
              <a class="external-link" href="${sourceLinkForPlace(item)}" target="_blank" rel="noopener">${sourceLabelForPlace(item)}</a>
              <button type="button" data-capture="${escapeHtml(item.title)}">Capture image/video</button>
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderLensPage(profile) {
    const drafts = state.draftPhotos.filter((item) => profile.id === "momdad" || item.profile === activeProfile);
    const last = state.journal[0];
    return `
      <div class="choice-card lens-card">
        <strong>Real Life Lens</strong>
        <p>Take or upload a real photo. It stays here after Use Photo, then you can analyze it, add notes, and save it to the Trip Summary.</p>
        <div class="action-row">
          <button type="button" data-capture="Real Life Lens" data-analyze-photo="true">Take Photo</button>
          <button type="button" data-nav="memories">Open Photo Journal</button>
        </div>
      </div>
      <div class="photo-analysis-stack">
        ${drafts.map((item) => renderDraftPhotoCard(item, profile)).join("") || `<p class="map-caption">No photo waiting. Tap Take Photo to start.</p>`}
      </div>
      ${last ? `<h4>Last saved</h4>${renderJournalEntry(last, 0, profile)}` : ""}
    `;
  }

  function renderDraftPhotoCard(item, profile) {
    const analysis = analysisViewModel(item.analysis, profile);
    const pendingDelete = state.pendingDelete?.collection === "draft" && state.pendingDelete?.id === item.id;
    return `
      <article class="photo-analysis-card">
        <img src="${item.dataUrl}" alt="${escapeHtml(item.label)}">
        <div class="photo-analysis-body">
          <div class="section-head compact-head">
            <div>
              <p class="eyebrow">${escapeHtml(item.status || "Ready")}</p>
              <h3>${escapeHtml(item.label || "Photo Analysis")}</h3>
            </div>
            <small>${new Date(item.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small>
          </div>
          <div class="compact-actions">
            <button type="button" data-analyze-draft="${item.id}">Analyze</button>
            <button type="button" data-save-draft="${item.id}">Save</button>
            <button type="button" data-remove-photo="draft:${item.id}">Remove</button>
          </div>
          ${pendingDelete ? renderInlineDelete("draft", item.id) : ""}
          <div class="analysis-result">
            ${item.status === "Analyzing..." ? `<p><strong>Analyzing...</strong></p>` : ""}
            ${item.analysisError ? `<p class="warning-note">${escapeHtml(item.analysisError)}</p>` : ""}
            ${item.analysis ? `
              <h4>What it is</h4><p>${escapeHtml(analysis.what)}</p>
              <h4>Why it matters</h4><p>${escapeHtml(analysis.why)}</p>
              <h4>Trip connection</h4><p>${escapeHtml(analysis.trip)}</p>
              <h4>For kids</h4><p>${escapeHtml(analysis.kids)}</p>
              <h4>Fun fact</h4><p>${escapeHtml(analysis.fact)}</p>
            ` : `<p class="map-caption">Analysis result will appear here.</p>`}
          </div>
          <label class="notes-field">Notes<textarea data-draft-note="${item.id}" placeholder="What made this memorable?">${escapeHtml(item.notes || "")}</textarea></label>
        </div>
      </article>
    `;
  }

  function renderInlineDelete(collection, id) {
    return `
      <div class="inline-confirm">
        <span>Remove this photo?</span>
        <button type="button" data-confirm-remove="${collection}:${id}">Remove</button>
        <button type="button" data-cancel-remove="true">Keep</button>
      </div>
    `;
  }

  function renderLearnPage(profile, place) {
    return `
      <div class="learning-hub">
        <div class="choice-card">
          <strong>Learning hub</strong>
          <p>Pick one thing to notice, learn, or capture. This keeps the trip playful before we leave and useful while we are moving.</p>
          <div class="action-row">
            <button type="button" data-nav="activities">Activities</button>
            <button type="button" data-nav="stars">Stars</button>
            <button type="button" data-nav="ferry">Ferry</button>
            <button type="button" data-nav="weather">Weather</button>
          </div>
        </div>
        ${placeCard(place, profile)}
        ${renderActivitiesPage(profile)}
        ${renderStarsPage(profile)}
        ${renderFerryPage(profile)}
      </div>
    `;
  }

  function renderRewardsPage(profile) {
    return `
      <div class="learning-hub">
        <div class="choice-card">
          <strong>Rewards and family picks</strong>
          <p>See what has been earned, saved, voted on, or approved without hunting through separate tabs.</p>
        </div>
        ${renderBadgesPage(profile)}
        ${renderSavedPage(profile)}
      </div>
    `;
  }

  function renderMemoriesPage(profile) {
    return `
      <div class="learning-hub">
        <div class="choice-card">
          <strong>Trip Summary</strong>
          <p>Saved photos, attraction history, badges, notes, and route stats become the family travel scrapbook.</p>
          ${renderTripStats(profile)}
          ${renderAttractionHistory(profile)}
          <div class="action-row"><button type="button" data-nav="lens">Take Photo</button><button type="button" data-nav="nearby">Nearby attractions</button></div>
        </div>
        ${renderPhotosPage(profile)}
      </div>
    `;
  }

  function renderTripStats(profile) {
    const savedPlaces = Object.values(state.shortlist || {}).filter((item) => profile.id === "momdad" || item.profile === profile.id);
    const badgeCount = badgesForProfile(profile.id).length;
    const historical = allAttractions().filter((item) => /museum|history|historic|arch|dame|studebaker/i.test(`${item.title} ${item.summary}`)).length;
    const parks = allAttractions().filter((item) => /national park|dunes|nps/i.test(`${item.title} ${item.summary}`)).length;
    return `
      <div class="trip-stats">
        <span><strong>${data.route.totalOutboundMiles.toLocaleString()}</strong><small>route miles</small></span>
        <span><strong>6</strong><small>states</small></span>
        <span><strong>${savedPlaces.length}</strong><small>saved</small></span>
        <span><strong>${Object.keys(state.visitedStops || {}).length}</strong><small>visited</small></span>
        <span><strong>${state.journal.length}</strong><small>photos</small></span>
        <span><strong>${badgeCount}</strong><small>badges</small></span>
        <span><strong>${parks}</strong><small>parks</small></span>
        <span><strong>${historical}</strong><small>history stops</small></span>
      </div>
    `;
  }

  function renderAttractionHistory(profile) {
    const saved = Object.values(state.shortlist || {}).filter((item) => profile.id === "momdad" || item.profile === profile.id);
    const visited = Object.values(state.visitedStops || {}).filter((item) => profile.id === "momdad" || item.profile === profile.id);
    return `
      <div class="attraction-history">
        <section>
          <h4>Visited</h4>
          ${visited.map((item) => `<button type="button" data-preview-stop="${escapeHtml(item.name)}"><strong>${escapeHtml(item.name)}</strong><span>${new Date(item.visitedAt).toLocaleDateString()}</span></button>`).join("") || `<p>No visited stops yet.</p>`}
        </section>
        <section>
          <h4>Saved</h4>
          ${saved.map((item) => `<button type="button" data-preview-stop="${escapeHtml(item.name)}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.category || "Saved stop")}</span></button>`).join("") || `<p>No saved stops yet.</p>`}
        </section>
      </div>
    `;
  }

  function selectedDetailPlace() {
    const parts = (location.hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
    const target = decodeURIComponent(parts.slice(2).join("/") || "");
    return data.route.routePlaces.find((place) => place.name === target) || routePlaceForProfile(currentProfile());
  }

  function renderDetailPage(profile) {
    const place = selectedDetailPlace();
    return `
      <article class="choice-card detail-hero">
        <img src="${routeVisualForPlace(place)}" alt="${escapeHtml(place.image?.alt || place.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImageForPlace(place)}';">
        <div>
          <p class="eyebrow">${place.place}</p>
          <h3>${place.name}</h3>
          <p>${place.why}</p>
          <p>${place.profiles?.[profile.id] || place.profiles?.momdad || ""}</p>
          <p><strong>Best fit:</strong> ${profile.name}. <strong>Route context:</strong> ${place.milesFromStart ? `${place.milesFromStart} miles from home area` : "Island or flexible context"}.</p>
          <div class="action-row">
            <a class="external-link" href="${sourceLinkForPlace(place)}" target="_blank" rel="noopener">${sourceLabelForPlace(place)}</a>
            <button type="button" data-shortlist="${escapeHtml(place.name)}" data-category="Place" data-url="${sourceLinkForPlace(place)}">Save to Trip</button>
            <button type="button" data-vote-item="${escapeHtml(place.name)}" data-choice="Yes">Family Vote: Yes</button>
            <button type="button" data-capture="${escapeHtml(place.name)}">Capture image/video</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderTodayPage(profile, place) {
    const features = data.dailyProfileFeatures[profile.id] || data.dailyProfileFeatures.momdad;
    const dayIndex = Math.max(0, data.days.findIndex((day) => day.date === selectedDayDate()));
    const feature = features[dayIndex % features.length];
    return `
      <div class="learning-hub">
        <div class="dashboard-hero">
          <p class="eyebrow">${profile.id === "momdad" ? "Family learning hub" : `${profile.name}'s learning hub`}</p>
          <h3>What can we learn today?</h3>
          <p>${profile.lens}</p>
          <div class="action-row">
            <button type="button" data-nav="route">Route</button>
            <button type="button" data-nav="learn">Learn</button>
            <button type="button" data-nav="rewards">Rewards</button>
            <button type="button" data-nav="memories">Memories</button>
          </div>
        </div>
        <div class="choice-card">
          <strong>${feature.title}</strong>
          <p>${feature.text}</p>
          <p><strong>Look for:</strong> ${feature.lookFor}</p>
          <div class="action-row"><button type="button" data-complete-activity="${escapeHtml(feature.title)}">Done</button><button type="button" data-capture="${escapeHtml(feature.title)}">Capture image/video</button></div>
        </div>
        ${placeCard(place, profile)}
        ${renderBadgesMini(profile)}
      </div>
    `;
  }

  function renderRoutePage(profile, place) {
    const simple = profile.id === "jules";
    return `
      <div class="choice-card">
        <strong>${simple ? "Road, ferry, island" : "Live route and location"}</strong>
        <p>${simple ? "First road. Then boat. Then island. Tap Start GPS so the map can find us." : "The in-app map uses MapLibre with no key. Tap Start GPS to show the current location, distance, and percent to the next destination."}</p>
        <div class="action-row">
          <button type="button" data-start-gps="true">Start GPS</button>
          <a class="external-link" href="${activeRouteUrl()}" target="_blank" rel="noopener">Open phone driving route</a>
          <a class="external-link" href="${data.mapLinks.returnUrl}" target="_blank" rel="noopener">Open return route</a>
        </div>
      </div>
      <div class="maplibre-panel">
        <div class="section-head compact-head">
          <strong>Route map</strong>
          <span id="mapMode" class="map-caption">Open map; tap Start GPS to show your location</span>
        </div>
        <div id="routeMapPanel"></div>
      </div>
      ${placeCard(place, profile)}
      ${renderStopsPage()}
    `;
  }

  function renderGpsPage() {
    const pos = state.lastPosition;
    return `
      <div class="choice-card">
        <strong>GPS status: ${state.gpsStatus || "Off"}</strong>
        <p>${state.trackingStatus || "Off"}</p>
        <dl>
          <div><dt>Accuracy</dt><dd>${pos ? `${Math.round(pos.accuracy)} meters` : "Not available"}</dd></div>
          <div><dt>Coordinates</dt><dd>${pos ? `${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}` : "Not available"}</dd></div>
          <div><dt>Last updated</dt><dd>${pos ? new Date(pos.updatedAt).toLocaleString() : "Not available"}</dd></div>
          <div><dt>Destination miles</dt><dd>${milesLeft().toLocaleString()}</dd></div>
        </dl>
      </div>
    `;
  }

  function renderWeatherPage(profile) {
    return `
      <div class="choice-card">
        <strong>Weather source status</strong>
        <p>Open-Meteo is used with no API key. Data is cached for 30 minutes, follows live GPS when location is enabled, and displays Fahrenheit, mph, and inches.</p>
        <div class="action-row"><button type="button" id="refreshWeather" data-weather-refresh="true">Refresh weather</button><a class="external-link" href="${data.sourceLinks.weather.url}" target="_blank" rel="noopener">Open weather source</a></div>
      </div>
      ${renderRadarPanel()}
      <div id="weatherBlocks" class="weather-grid">${renderWeatherBlocksMarkup(profile, weatherLocationsForContext().map((location) => state.weather[location.id] || { location, sourceStatus: "Not available" }))}</div>
    `;
  }

  function activeRadarStation() {
    if (state.phase === "island" || state.phase === "return") return data.radarStations.find((station) => station.id === "KAPX");
    if (selectedDayDate() === "2026-08-01") return data.radarStations.find((station) => station.id === "KAPX");
    if (selectedDayDate() === "2026-07-31") return data.radarStations.find((station) => station.id === "KIWX");
    return data.radarStations.find((station) => station.id === "KAPX") || data.radarStations[0];
  }

  function renderRadarPanel() {
    const active = activeRadarStation();
    const stations = data.radarStations || [];
    return `
      <article class="choice-card radar-card">
        <strong>Live radar</strong>
        <p>National Weather Service radar station: ${active.label}. If the embedded view is slow, use the station buttons below.</p>
        <iframe title="NWS radar ${active.id}" loading="lazy" src="${active.url}"></iframe>
        <div class="radar-links">
          ${stations.map((station) => `<a class="external-link" href="${station.url}" target="_blank" rel="noopener">${station.id}: ${station.label}</a>`).join("")}
        </div>
      </article>
    `;
  }

  function renderWeatherBlocks(results) {
    const container = byId("weatherBlocks");
    if (container) container.innerHTML = renderWeatherBlocksMarkup(currentProfile(), results);
  }

  function renderWeatherBlocksMarkup(profile, results) {
    return results.map((weather) => `
      <article class="choice-card">
        <strong>${weather.location?.name || "Weather"}</strong>
        <p>${weatherSummaryFor(profile, weather, weather.location?.name || "Location")}</p>
        ${renderWeatherMetrics(weather)}
        ${renderSunMetrics(weather)}
        ${renderHourlyWeather(weather)}
        <p><strong>Status:</strong> ${weather.sourceStatus || "Cached"}${weather.fetchedAt ? `, updated ${new Date(weather.fetchedAt).toLocaleString()}` : ""}</p>
        <ul>${weatherFlags(weather).map((flag) => `<li>${flag}</li>`).join("")}</ul>
      </article>
    `).join("");
  }

  function renderStarsPage(profile) {
    const island = state.weather.boisBlanc;
    const cloud = island?.hourly?.cloud_cover?.[0];
    return `
      <div class="choice-card">
        <strong>STARZ guide</strong>
        <p>${starsCopy(profile, cloud)}</p>
        <p><strong>Source status:</strong> ${island ? `Weather ${island.sourceStatus}, updated ${new Date(island.fetchedAt).toLocaleString()}` : "Needs verification. Use source links before heading out."}</p>
        <p><strong>Overhead:</strong> ${data.stars.overhead.join("; ")}.</p>
        <p><strong>Horizon:</strong> ${data.stars.horizon.join("; ")}.</p>
        <ul>${data.stars.checklist.map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="action-row">
          <a class="external-link" href="${data.stars.clearDarkSky}" target="_blank" rel="noopener">Open Clear Dark Sky chart</a>
          <button type="button" data-complete-activity="Stargazing session">Stargazing done</button>
        </div>
      </div>
    `;
  }

  function starsCopy(profile, cloud) {
    const cloudText = cloud === undefined ? "Cloud cover is not live yet." : `Cloud cover estimate is ${cloud}%.`;
    const copy = {
      elsie: `${cloudText} Let your eyes adjust for 20 minutes. Teach someone Vega, Deneb, and Altair.`,
      katrina: `${cloudText} Why it matters: darker skies reveal patterns people used for navigation and stories.`,
      emma: `${cloudText} Best family setup: blankets, timing, bug spray, and a clear backup if clouds win.`,
      eliette: `${cloudText} Look for color, sparkle, moon reflections, and cozy visual patterns.`,
      jules: `${cloudText} Look up. Find a big shape. Stay with grownups. Use red light.`,
      momdad: `${cloudText} Verify Clear Dark Sky, cloud cover, wind, humidity, and safe viewing location before heading out.`
    };
    return copy[profile.id] || copy.elsie;
  }

  function renderFerryPage(profile) {
    if (profile.id === "elsie") {
      return `<div class="choice-card"><strong>Water crossing facts</strong><p>Look for boats, waves, ropes, ramps, gulls, and shoreline changes. Adults handle schedule pressure.</p><a class="external-link" href="${data.ferry.learnMore}" target="_blank" rel="noopener">Open official ferry site</a></div>`;
    }
    const risk = state.weather.cheboygan ? weatherFlags(state.weather.cheboygan).join(", ") : "Needs weather verification";
    return `
      <div class="choice-card">
        <strong>${profile.id === "jules" ? "Cars go on a boat" : "Plaunt Transportation ferry"}</strong>
        <p>${data.ferry.terminal}. ${data.ferry.route}. Crossing: ${data.ferry.crossing}.</p>
        <p><strong>Schedule status:</strong> Live ferry schedule is not embedded yet. Verify times on the official Plaunt Transportation site before departure.</p>
        <p><strong>Weather/ferry risk:</strong> ${risk}.</p>
        <ul>${data.ferry.reminders.map((item) => `<li>${item}</li>`).join("")}</ul>
        <div class="action-row">
          <a class="external-link" href="${data.ferry.learnMore}" target="_blank" rel="noopener">Open official ferry schedule</a>
          ${profile.id === "momdad" ? `<button type="button" data-approve="Plaunt ferry plan">Approve ferry plan</button>` : ""}
        </div>
      </div>
    `;
  }

  function profileActivities(profile) {
    return data.activityBoard[profile.id] || [];
  }

  function renderActivitiesPage(profile) {
    const completed = new Set(state.completed.filter((item) => item.profile === activeProfile).map((item) => item.activityTitle));
    const items = profileActivities(profile).filter((item) => !completed.has(item.title)).slice(0, 10);
    return `
      <div class="activity-board">
        ${items.map((item) => `
          <article class="activity-item">
            <h4>${item.title}</h4>
            <p>${item.detail}</p>
            <p><strong>Look for:</strong> ${item.lookFor}</p>
            <div class="action-row">
              <a class="external-link" href="${item.link}" target="_blank" rel="noopener">Open official source</a>
              <button type="button" data-complete-activity="${escapeHtml(item.title)}">Done</button>
              <button type="button" data-shortlist="${escapeHtml(item.title)}" data-category="${escapeHtml(item.type)}" data-url="${item.link}">Save to Trip</button>
              <button type="button" data-capture="${escapeHtml(item.title)}">Capture image/video</button>
              <button type="button" data-vote-item="${escapeHtml(item.title)}" data-choice="Yes">Family Vote: Yes</button>
              <button type="button" data-vote-item="${escapeHtml(item.title)}" data-choice="Maybe">Maybe</button>
              <button type="button" data-vote-item="${escapeHtml(item.title)}" data-choice="Skip">Skip</button>
            </div>
          </article>
        `).join("")}
      </div>
      <div class="completed-list">${state.completed.filter((item) => item.profile === activeProfile).slice(-6).map((item) => `<span class="saved-pill">Completed: ${item.activityTitle}</span>`).join("") || `<span class="saved-pill">Complete an activity and a new one appears.</span>`}</div>
    `;
  }

  function renderBadgesMini(profile) {
    return `<h3>Recent badges</h3>${renderBadgeShelf(profile.id)}<button type="button" data-nav="badges">View all badges</button>`;
  }

  function renderBadgesPage(profile) {
    const earned = profile.id === "momdad"
      ? data.profiles.flatMap((p) => badgesForProfile(p.id).map((badge) => ({ ...badge, ownerName: p.name })))
      : badgesForProfile(profile.id);
    const upcoming = upcomingBadges(profile.id, 20);
    return `
      <div class="badge-page">
        <h4>Earned</h4>
        <div class="badge-grid">${earned.map((badge) => badgeCard(badge, profile.id === "momdad")).join("") || `<p>No badges earned yet.</p>`}</div>
        <h4>Upcoming</h4>
        <div class="badge-grid">${upcoming.map((badge) => badgeCard({ ...badge, upcoming: true }, false)).join("")}</div>
      </div>
    `;
  }

  function badgeCard(badge, showOwner) {
    return `
      <button type="button" class="badge-card ${badge.upcoming ? "is-locked" : "is-earned"}" data-badge="${badge.id}">
        <strong>${badge.title}</strong>
        <span>${badge.category} - ${badge.segment}</span>
        <small>${badge.upcoming ? badge.locked : badge.earned}${showOwner && badge.ownerName ? ` (${badge.ownerName})` : ""}</small>
      </button>
    `;
  }

  function renderSavedPage(profile) {
    const entries = Object.entries(state.shortlist).filter(([, item]) => profile.id === "momdad" || item.profile === activeProfile);
    return `
      <div class="saved-list">
        ${entries.map(([key, item]) => `
          <div class="choice-card">
            <strong>${item.name}</strong>
            <p>${item.category || "Trip item"} - ${item.date}${profile.id === "momdad" ? ` - ${profileName(item.profile)}` : ""}</p>
            <div class="action-row">
              ${item.sourceUrl ? `<a class="external-link" href="${item.sourceUrl}" target="_blank" rel="noopener">Open official source</a>` : ""}
              <button type="button" data-remove-shortlist="${escapeHtml(key)}">Remove</button>
              ${profile.id === "momdad" ? `<button type="button" data-approve="${escapeHtml(item.name)}">Approve into plan</button>` : ""}
            </div>
          </div>
        `).join("") || `<p>No Trip Shortlist items yet.</p>`}
      </div>
      ${renderVotesPage(profile.id === "momdad")}
    `;
  }

  function profileName(id) {
    return data.profiles.find((profile) => profile.id === id)?.name || id;
  }

  function renderVotesPage(parentView) {
    const rows = Object.entries(state.votes).map(([key, votes]) => {
      const totals = ["Yes", "Maybe", "Skip"].map((choice) => `${choice}: ${Object.values(votes).filter((vote) => vote.choice === choice).length}`).join(" | ");
      return `<div class="choice-card"><strong>${key.split(":").slice(1).join(":") || key}</strong><p>${totals}</p>${parentView ? `<p>${Object.entries(votes).map(([profile, vote]) => `${profileName(profile)}: ${vote.choice}`).join(", ")}</p><button type="button" data-approve="${escapeHtml(key)}">Approve into plan</button>` : ""}</div>`;
    }).join("");
    return `<div><h4>Family Votes</h4>${rows || `<p>No Family Votes yet.</p>`}</div>`;
  }

  function renderStopsPage() {
    const stops = data.route.restStops.filter((stop) => stop.date === selectedDayDate());
    return `
      <div class="choice-card">
        <strong>${isTravelDay() ? "Route-specific stops and supplies" : "Open island day"}</strong>
        ${isTravelDay() ? `<ul>${stops.map((stop) => `<li><strong>${stop.name}</strong><br>${stop.timing}. ${stop.note}</li>`).join("")}</ul>` : `<p>No road-stop planner today. Use island weather, activities, and family votes.</p>`}
      </div>
      <div class="choice-card">
        <strong>Arrival checklist</strong>
        <ul><li>Before boarding ferry: gas, snacks, water, restroom, weather, ferry confirmation.</li><li>On island: orient, unload, check weather, choose a light first activity.</li><li>If arriving late or weather shifts: keep the plan small and save adventures for the next day.</li></ul>
      </div>
    `;
  }

  function renderPhotosPage(profile) {
    const drafts = state.draftPhotos.filter((item) => profile.id === "momdad" || item.profile === activeProfile);
    const journal = state.journal.map((item, index) => ({ ...item, index })).filter((item) => profile.id === "momdad" || item.profile === activeProfile);
    const captures = state.captures.map((item, index) => ({ ...item, index })).filter((item) => profile.id === "momdad" || item.profile === activeProfile);
    return `
      ${state.storageWarning ? `<p class="warning-note">${escapeHtml(state.storageWarning)}</p>` : ""}
      <div class="action-row"><button type="button" data-nav="lens">Take Photo</button><button type="button" data-capture="Trip photo">Save photo/video</button></div>
      ${drafts.length ? `<h4>Ready to save</h4><div class="photo-analysis-stack">${drafts.map((item) => renderDraftPhotoCard(item, profile)).join("")}</div>` : ""}
      <h4>Photo Journal</h4>
      <div class="journal-list">
        ${journal.map((item) => renderJournalEntry(item, item.index, profile)).join("") || `<p>No analyzed journal entries yet.</p>`}
      </div>
      <h4>Family Memory Timeline</h4>
      <div class="memory-timeline">${journal.map((item) => `<article><strong>${new Date(item.at).toLocaleDateString()}</strong><span>${escapeHtml(item.label)} · ${escapeHtml(item.nearest || "route memory")}</span></article>`).join("") || `<p>No saved timeline entries yet.</p>`}</div>
      <h4>Saved media</h4>
      <div class="summary-grid">
        ${captures.map((item) => `
          <div class="summary-tile">
            ${item.type.startsWith("image/") ? `<img class="summary-photo" src="${item.dataUrl}" alt="${escapeHtml(item.label)}">` : `<span>Video saved: ${escapeHtml(item.name || item.label)}</span>`}
            <span>${escapeHtml(item.label)} - ${new Date(item.at).toLocaleDateString()}${profile.id === "momdad" ? ` - ${profileName(item.profile)}` : ""}</span>
            ${state.pendingDelete?.collection === "capture" && state.pendingDelete?.id === (item.id || String(item.index)) ? renderInlineDelete("capture", item.id || String(item.index)) : ""}
            <button type="button" data-remove-photo="capture:${item.id || item.index}">Delete</button>
          </div>
        `).join("") || `<p>No captured moments yet.</p>`}
      </div>
      <p class="map-caption">Media is stored on this device with a size limit. Delete old captures if storage gets tight.</p>
    `;
  }

  function renderJournalEntry(item, index, profile) {
    const analysis = item.analysis || {};
    const model = analysisViewModel(analysis, profile);
    const summary = analysis.summary || analysis.description || item.analysisError || "Analysis is not available yet.";
    const tags = Array.isArray(analysis.tags) ? analysis.tags : [];
    const pendingDelete = state.pendingDelete?.collection === "journal" && state.pendingDelete?.id === item.id;
    return `
      <article class="choice-card journal-entry">
        ${item.type?.startsWith("image/") ? `<img class="summary-photo" src="${item.dataUrl}" alt="${escapeHtml(item.label)}">` : ""}
        <div>
          <strong>${escapeHtml(item.label || "Trip photo")}</strong>
          <p>${escapeHtml(summary)}</p>
          ${item.analysis ? `<details><summary>Analysis</summary><p><strong>What it is:</strong> ${escapeHtml(model.what)}</p><p><strong>Why it matters:</strong> ${escapeHtml(model.why)}</p><p><strong>Trip connection:</strong> ${escapeHtml(model.trip)}</p><p><strong>For kids:</strong> ${escapeHtml(model.kids)}</p><p><strong>Fun fact:</strong> ${escapeHtml(model.fact)}</p></details>` : ""}
          <p><strong>Nearest:</strong> ${escapeHtml(item.nearest || "Unknown until GPS is enabled")}</p>
          <p><strong>GPS:</strong> ${item.gps ? `${item.gps.lat.toFixed(5)}, ${item.gps.lon.toFixed(5)}` : "Not saved"}</p>
          ${tags.length ? `<div class="tag-list">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          <label class="notes-field">Notes<textarea data-journal-note="${item.id}" placeholder="What made this memorable?">${escapeHtml(item.notes || "")}</textarea></label>
          ${pendingDelete ? renderInlineDelete("journal", item.id) : ""}
          <div class="action-row">
            <button type="button" data-remove-photo="journal:${item.id}">Delete</button>
            ${profile.id === "momdad" ? `<button type="button" data-approve="${escapeHtml(item.label || "Photo Journal item")}">Approve into story</button>` : ""}
          </div>
        </div>
      </article>
    `;
  }

  function renderSourcesPage() {
    const weatherStatus = Object.values(state.weather || {}).length ? "Cached or live Open-Meteo data available" : "Weather not fetched yet";
    return `
      <div class="source-grid">
        <div class="choice-card"><strong>Data status</strong><p>Weather: ${weatherStatus}. GPS: ${state.gpsStatus}. Route map: MapLibre/OpenFreeMap in the app; phone-map links open outside the app for turn-by-turn driving.</p></div>
        ${Object.values(data.sourceLinks).map((source) => `<div class="choice-card"><strong>${source.label}</strong><p><a class="external-link" href="${source.url}" target="_blank" rel="noopener">${source.label}</a></p></div>`).join("")}
      </div>
    `;
  }

  function renderSettingsPage() {
    return `
      <div class="source-grid">
        <div class="choice-card"><strong>Location</strong><p>GPS status: ${state.gpsStatus}. ${state.trackingStatus || ""}</p><button type="button" data-start-gps="true">Start GPS</button></div>
        <div class="choice-card"><strong>Offline cache</strong><p>The app shell and trip data are cached for road use. Cache version: v24.</p></div>
        <div class="choice-card"><strong>Photo storage</strong><p>${state.storageWarning || "Photos are stored on this device for the trip summary."}</p></div>
        <div class="choice-card"><strong>Sources</strong><p>Official links and data status are available in Trip Info.</p><button type="button" data-nav="sources">Trip Info</button></div>
      </div>
    `;
  }

  function renderProfile() {
    parseHash();
    const profile = currentProfile();
    byId("profileView").style.setProperty("--profile-accent", profile.accent || "#1f78a4");
    byId("profileTitle").textContent = profile.id === "jules" ? "Captain Jules" : profile.id === "momdad" ? "Mom/Dad logistics" : `${profile.name}'s dashboard`;
    byId("profileView").innerHTML = `<div class="top-badge-row">${renderBadgeShelf(profile.id)}</div>${renderSubpage(profile)}`;
    byId("activeTraveler").textContent = `${profile.name}'s view`;
    if (activePage === "weather" && navigator.onLine && !Object.keys(state.weather || {}).length) {
      setTimeout(refreshWeatherCards, 0);
    }
  }

  function handleAppTap(event) {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.matches("[data-close-modal]")) {
      closeBadgeModal();
      return;
    }
    if (target.matches("[data-close-cluster]")) {
      const drawer = byId("clusterDrawer");
      if (drawer) drawer.hidden = true;
      return;
    }
    if (target.dataset.closeStopDrawer !== undefined) {
      event.preventDefault();
      const drawer = byId("bottomDrawer");
      if (drawer) drawer.innerHTML = "";
      return;
    }
    if (target.dataset.stopGps !== undefined) {
      event.preventDefault();
      stopLocation();
      return;
    }
    if (target.dataset.refreshRoute !== undefined) {
      event.preventDefault();
      refreshActiveRoute(true);
      return;
    }
    if (target.dataset.toggleElsieRadar !== undefined) {
      event.preventDefault();
      state.elsieRadarCollapsed = !state.elsieRadarCollapsed;
      saveState();
      const radar = byId("elsieRadar");
      if (radar) radar.outerHTML = renderElsieRadarMarkup();
      return;
    }
    if (target.dataset.toggleUploadedStops !== undefined) {
      event.preventDefault();
      const panel = byId("uploadedStopsPanel");
      if (!panel) return;
      panel.classList.toggle("is-collapsed");
      panel.classList.remove("is-mobile-peek");
      target.textContent = panel.classList.contains("is-collapsed") ? "Stops" : "Hide";
      return;
    }
    if (target.id === "activeTraveler") {
      byId("splash")?.classList.remove("is-hidden");
      return;
    }
    if (target.id === "mainMenuButton") {
      event.preventDefault();
      toggleMainMenu(true);
      return;
    }
    if (target.dataset.closeMenu !== undefined) {
      event.preventDefault();
      toggleMainMenu(false);
      return;
    }
    if (target.dataset.menuNav) {
      event.preventDefault();
      toggleMainMenu(false);
      navTo(target.dataset.menuNav);
      return;
    }
    if (target.dataset.previewStop) {
      event.preventDefault();
      const item = attractionForName(target.dataset.previewStop);
      if (item) showAttractionPreview(item);
      return;
    }
    if (target.dataset.stopDetail) {
      event.preventDefault();
      const item = attractionForName(target.dataset.stopDetail);
      if (item) showStopDetailDrawer(item);
      return;
    }
    if (target.dataset.routeStop) {
      event.preventDefault();
      openAppleRoute(target.dataset.routeStop);
      return;
    }
    if (target.dataset.visitedStop) {
      event.preventDefault();
      markStopVisited(target.dataset.visitedStop);
      return;
    }
    if (target.dataset.profileChoice) {
      event.preventDefault();
      chooseProfile(target.dataset.profileChoice);
      return;
    }
    if (target.dataset.nav) {
      event.preventDefault();
      navTo(target.dataset.nav);
      return;
    }
    if (target.dataset.navGlobal) {
      event.preventDefault();
      if (!state.hasChosenProfile) {
        byId("splash")?.classList.remove("is-hidden");
        return;
      }
      navTo(target.dataset.navGlobal);
      return;
    }
    if (target.dataset.detail) {
      event.preventDefault();
      const item = attractionForName(target.dataset.detail) || data.route.routePlaces.find((place) => place.name === target.dataset.detail);
      if (item) showAttractionPreview(item);
      return;
    }
    if (target.dataset.openDetail) {
      event.preventDefault();
      location.hash = `/${activeProfile}/detail/${encodeURIComponent(target.dataset.openDetail)}`;
      return;
    }
    if (target.dataset.badge) {
      event.preventDefault();
      showBadgeDetail(target.dataset.badge);
      return;
    }
    if (target.dataset.adventureBadge) {
      event.preventDefault();
      showAdventureBadgeDetail(target.dataset.adventureBadge);
      return;
    }
    if (target.dataset.shortlist) {
      event.preventDefault();
      saveShortlist({ name: target.dataset.shortlist, category: target.dataset.category, sourceUrl: target.dataset.url });
      return;
    }
    if (target.dataset.need) {
      event.preventDefault();
      state.needNow = target.dataset.need;
      awardByTrigger("need", { need: state.needNow });
      saveState();
      renderBottomDrawer();
      renderNeedResults();
      setAction(`${state.needNow} selected. Showing route-aware options.`);
      return;
    }
    if (target.dataset.removeShortlist) {
      event.preventDefault();
      removeShortlist(target.dataset.removeShortlist);
      return;
    }
    if (target.dataset.voteItem) {
      event.preventDefault();
      familyVote(target.dataset.voteItem, target.dataset.choice);
      return;
    }
    if (target.dataset.approve) {
      event.preventDefault();
      approvePlan(target.dataset.approve);
      return;
    }
    if (target.dataset.completeActivity) {
      event.preventDefault();
      completeActivity(target.dataset.completeActivity);
      return;
    }
    if (target.dataset.capture) {
      event.preventDefault();
      startCapture(target.dataset.capture, target.dataset.analyzePhoto !== undefined);
      return;
    }
    if (target.dataset.analyzeDraft) {
      event.preventDefault();
      analyzeDraftPhotoById(target.dataset.analyzeDraft);
      return;
    }
    if (target.dataset.saveDraft) {
      event.preventDefault();
      saveDraftPhotoById(target.dataset.saveDraft);
      return;
    }
    if (target.dataset.removePhoto) {
      event.preventDefault();
      const [collection, id] = target.dataset.removePhoto.split(":");
      requestDeletePhoto(collection, id);
      return;
    }
    if (target.dataset.confirmRemove) {
      event.preventDefault();
      const [collection, id] = target.dataset.confirmRemove.split(":");
      confirmDeletePhoto(collection, id);
      return;
    }
    if (target.dataset.cancelRemove) {
      event.preventDefault();
      cancelDeletePhoto();
      return;
    }
    if (target.dataset.deleteCapture) {
      event.preventDefault();
      deleteCapture(Number(target.dataset.deleteCapture));
      return;
    }
    if (target.dataset.source) {
      event.preventDefault();
      awardBadge("source-checker", { source: target.dataset.source });
      setAction(`Source checked: ${target.dataset.source}.`);
      return;
    }
    if (target.dataset.weatherRefresh !== undefined) {
      event.preventDefault();
      refreshWeatherCards();
      return;
    }
    if (target.dataset.startGps !== undefined) {
      event.preventDefault();
      useLocation();
    }
    if (target.dataset.mapThemeToggle !== undefined) {
      event.preventDefault();
      state.mapTheme = state.mapTheme === "dark" ? "light" : "dark";
      saveState();
      if (homeMap) { homeMap.remove(); homeMap = null; }
      renderHomeMapPanel();
      return;
    }
    if (target.dataset.wildfireToggle !== undefined) {
      event.preventDefault();
      state.wildfiresEnabled = !state.wildfiresEnabled;
      saveState();
      applyWildfireLayer(homeMap);
      const fab = target.closest(".elsie-fire-fab");
      if (fab) {
        fab.classList.toggle("is-on", state.wildfiresEnabled);
        fab.setAttribute("aria-pressed", String(state.wildfiresEnabled));
      }
      return;
    }
    if (target.dataset.smokeToggle !== undefined) {
      event.preventDefault();
      state.smokeEnabled = !state.smokeEnabled;
      saveState();
      applySmokeLayer(homeMap);
      const fab = target.closest(".elsie-smoke-fab");
      if (fab) {
        fab.classList.toggle("is-on", state.smokeEnabled);
        fab.setAttribute("aria-pressed", String(state.smokeEnabled));
      }
      return;
    }
    if (target.dataset.julesMarkerToggle !== undefined) {
      event.preventDefault();
      state.julesMarkerStyle = state.julesMarkerStyle === "f1" ? "sonic" : "f1";
      saveState();
      if (homeMap) {
        registerJulesGpsImage(homeMap).then(() => {
          if (homeMap && homeMap.getLayer("current-location-dot")) {
            try { homeMap.setLayoutProperty("current-location-dot", "icon-image", julesGpsImageName()); } catch {}
          }
        });
      }
      const radar = byId("elsieRadar");
      if (radar) radar.outerHTML = renderElsieRadarMarkup();
      return;
    }
    if (target.dataset.gpsLocate !== undefined) {
      event.preventDefault();
      stopLocation();
      if (!navigator.geolocation) return;
      const fab = target.closest(".elsie-gps-fab");
      if (fab) fab.textContent = "⏳";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          lastGpsRender = 0;
          updatePosition(position);
          if (fab) fab.textContent = "📍";
        },
        (error) => {
          state.gpsStatus = "Unavailable";
          if (fab) fab.textContent = "📍";
          const reason = !window.isSecureContext
            ? "Location needs the secure site. Open https://michigantrip.elskatemm.com"
            : error && error.code === 1
              ? "Location is blocked for this site. Allow it in your browser's site settings, then try again."
              : error && error.code === 3
                ? "Location timed out. Try again with a clearer sky view."
                : "Location unavailable right now. Try again in a moment.";
          window.alert(reason);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    }
  }

  function wireEvents() {
    const on = (id, eventName, handler) => {
      const element = byId(id);
      if (element) element.addEventListener(eventName, handler);
    };
    on("activeTraveler", "click", () => {
      const splash = byId("splash");
      if (splash) splash.classList.remove("is-hidden");
    });
    on("useLocation", "click", useLocation);
    on("stopLocation", "click", stopLocation);
    on("startTrip", "click", () => setPhase("outbound"));
    on("markArrived", "click", () => setPhase("island"));
    on("startReturn", "click", () => setPhase("return"));
    on("completeTrip", "click", () => setPhase("complete"));
    document.querySelectorAll("[data-need]").forEach((button) => {
      button.addEventListener("click", () => {
        state.needNow = button.dataset.need;
        awardByTrigger("need", { need: state.needNow });
        setAction(`${state.needNow} selected. Showing route-aware options.`);
      });
    });
    window.addEventListener("hashchange", render);
    window.addEventListener("online", renderTripStatus);
    window.addEventListener("offline", renderTripStatus);
    document.addEventListener("click", handleAppTap);
    document.addEventListener("click", (event) => {
      if (event.target?.id === "badgeDetailOverlay") {
        closeBadgeModal();
      }
    });
    document.addEventListener("mouseover", (event) => {
      const target = event.target.closest("[data-preview-stop]");
      if (!target || event.pointerType === "touch") return;
      const item = attractionForName(target.dataset.previewStop);
      if (item) showAttractionPreview(item);
    });
    document.addEventListener("mouseover", (event) => {
      const target = event.target.closest("[data-adventure-badge]");
      if (!target) return;
      target.title = adventureBadgeHoverText(target.dataset.adventureBadge);
    });
    document.addEventListener("focusin", (event) => {
      const target = event.target.closest("[data-preview-stop]");
      if (!target) return;
      const item = attractionForName(target.dataset.previewStop);
      if (item) showAttractionPreview(item);
    });
    document.addEventListener("input", (event) => {
      const target = event.target;
      if (target.dataset?.draftNote) updateDraftNoteById(target.dataset.draftNote, target.value);
      if (target.dataset?.journalNote) updateJournalNoteById(target.dataset.journalNote, target.value);
    });
    document.addEventListener("change", (event) => {
      const target = event.target;
      if (target.matches("[data-include-dunes]")) {
        state.includeIndianaDunes = target.checked;
        state.initialLegDistanceMeters = null;
        saveState();
        render();
        refreshActiveRoute(true);
      }
      if (target.matches("[data-elsie-rating]") && isMapProfile()) {
        state.profileStopRatings[activeProfile] ||= {};
        state.profileStopRatings[activeProfile][target.dataset.elsieRating] = target.value;
        saveState();
      }
      if (target.matches("[data-elsie-collection]") && isMapProfile()) {
        const key = target.dataset.elsieCollection;
        state.profileCollections[activeProfile] ||= {};
        const values = new Set(state.profileCollections[activeProfile][key] || []);
        target.checked ? values.add(target.value) : values.delete(target.value);
        state.profileCollections[activeProfile][key] = [...values];
        saveState();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && isMapProfile() && state.gpsStatus === "Active") refreshActiveRoute();
    });
    document.addEventListener("keydown", (event) => {
      const modal = document.getElementById("badgeDetailOverlay");
      if (event.key === "Tab" && modal) {
        const focusable = [...modal.querySelectorAll("button, a[href], input, [tabindex]:not([tabindex='-1'])")].filter((item) => !item.disabled);
        if (focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        return;
      }
      if (event.key !== "Escape") return;
      closeBadgeModal();
      if (isMapProfile()) {
        const drawer = byId("bottomDrawer");
        if (drawer) drawer.innerHTML = "";
      }
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    let reloadedForUpdate = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadedForUpdate) return;
      reloadedForUpdate = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.update().catch(() => {});
      window.setInterval(() => registration.update().catch(() => {}), 10 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") registration.update().catch(() => {});
      });
    }).catch(() => {});
  }

  function render() {
    parseHash();
    document.body.dataset.page = activePage;
    document.body.dataset.profile = activeProfile;
    if (isMapProfile()) {
      const [title, subtitle] = elsieHeaderCopy();
      byId("topbarTitle").textContent = title;
      byId("topbarMeta").textContent = subtitle;
    } else {
      byId("topbarTitle").textContent = "Family Trip";
      byId("topbarMeta").textContent = `${currentProfile().name}'s view`;
    }
    if (!state.hasChosenProfile) byId("splash").classList.remove("is-hidden");
    renderCountdowns();
    renderTripStatus();
    if (isHomeMapPage()) {
      renderTopBadgePreview();
      renderHomeMapPanel();
      renderBottomDrawer();
      byId("activeTraveler").textContent = `${currentProfile().name}'s view`;
    } else {
      document.body.classList.remove("elsie-map-active");
      stopRadarAnimation();
      closeElsieSheet();
      if (homeMap) {
        homeMap.remove();
        homeMap = null;
      }
      const homePanel = byId("homeRouteMapPanel");
      if (homePanel) homePanel.innerHTML = "";
      const preview = byId("homeAttractionPreview");
      if (preview) {
        preview.hidden = true;
        preview.innerHTML = "";
      }
      const drawer = byId("bottomDrawer");
      if (drawer) drawer.innerHTML = "";
      const badgePreview = byId("topBadgePreview");
      if (badgePreview) badgePreview.innerHTML = "";
      renderProfile();
      renderRouteMapPanel();
      renderExploreMapPanel();
    }
    renderRouteQuest();
    renderBottomNav();
    renderMainMenu();
  }

  renderDaySelect();
  renderSplashProfiles();
  if (state.hasChosenProfile) byId("splash").classList.add("is-hidden");
  if (!location.hash) location.hash = `/${activeProfile}/explore`;
  wireEvents();
  wireCaptureInput();
  registerServiceWorker();
  render();

  // Automatic Sasquatch trail + live ETA tracking: a gentle periodic GPS poll (not continuous
  // watchPosition) so the breadcrumb trail and the ETA pill both update on their own, instead of
  // requiring a manual tap of the locate button every time. Only runs while the tab is
  // visible/foregrounded and on a map profile's home map page, since browsers throttle/suspend
  // JS timers otherwise anyway.
  function backgroundLocationPoll() {
    if (document.visibilityState !== "visible") return;
    if (!isMapProfile() || !isHomeMapPage()) return;
    if (!navigator.geolocation || !window.isSecureContext) return;
    navigator.geolocation.getCurrentPosition(
      (position) => { updatePosition(position); },
      () => { /* silent: this is a background convenience poll, not a user-initiated request */ },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }
  setTimeout(backgroundLocationPoll, 4000); // first fix shortly after load, not a full 3 min later
  setInterval(backgroundLocationPoll, 180000);
})();
