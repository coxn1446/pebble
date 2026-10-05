const fs = require('fs');
const path = require('path');

jest.mock('../../server/db', () => ({
  isDbHealthy: jest.fn(() => true),
  query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
}));

const { query } = require('../../server/db');
const pebbleService = require('../../server/services/pebbleService');
const { taxonomyQueries } = require('../../server/queries');

const TOPICS = {
  "Agricultural Science": [
    "Crop Science & Plant Production",
    "Soil Science",
    "Animal Science & Livestock",
    "Food & Agriculture",
    "Sustainable Agriculture",
    "Agricultural Technology",
    "Genetics & Breeding",
    "Pests, Diseases & Crop Protection",
    "Water & Irrigation",
    "Agricultural Economics & Systems"
  ],
  "Astronomy": [
    "Solar System",
    "Stars",
    "Galaxies & the Universe",
    "Planets & Moons",
    "Space Exploration",
    "The Sun & Solar Activity",
    "Earth & Space",
    "Gravity & Orbits",
    "Cosmology",
    "Astrobiology & Life in the Universe"
  ],
  "Biology": [
    "Cell Biology",
    "Genetics & Heredity",
    "Evolution",
    "Ecology & Ecosystems",
    "Biodiversity & Classification",
    "Plants",
    "Animals",
    "Reproduction & Development",
    "Physiology & Body Systems",
    "Behavior",
    "Biotechnology"
  ],
  "Chemistry": [
    "Matter & Its Properties",
    "Atomic Structure",
    "The Periodic Table",
    "Chemical Reactions",
    "Chemical Bonds",
    "Solutions & Mixtures",
    "Acids & Bases",
    "Energy & Thermochemistry",
    "Rates & Equilibrium",
    "Organic Chemistry",
    "Biochemistry"
  ],
  "Climate Science": [
    "Climate Systems",
    "Weather & Atmospheric Processes",
    "Climate Change",
    "Greenhouse Effect",
    "Carbon Cycle",
    "Oceans & Climate",
    "Ice, Snow & Glaciers",
    "Climate Modeling & Data",
    "Climate Impacts",
    "Climate Solutions & Adaptation"
  ],
  "Computer Science": [
    "Computing & Algorithms",
    "Programming & Coding",
    "Data & Data Science",
    "Artificial Intelligence & Machine Learning",
    "Computer Systems & Hardware",
    "Networks & the Internet",
    "Cybersecurity",
    "Human-Computer Interaction",
    "Computational Modeling & Simulation",
    "Robotics & Automation"
  ],
  "Earth Science": [
    "Geology & Rocks",
    "Plate Tectonics",
    "Earthquakes & Volcanoes",
    "Earth's Interior",
    "Minerals & Resources",
    "Weather & Atmosphere",
    "Water Cycle & Freshwater",
    "Oceans",
    "Landforms & Surface Processes",
    "Natural Hazards",
    "Earth's History"
  ],
  "Engineering & Technology": [
    "Mechanical Engineering",
    "Civil & Structural Engineering",
    "Electrical Engineering",
    "Chemical Engineering",
    "Biomedical Engineering",
    "Environmental Engineering",
    "Aerospace Engineering",
    "Robotics & Automation",
    "Energy & Power Systems",
    "Design & Prototyping",
    "Technology & Society"
  ],
  "Environmental Science": [
    "Ecosystems & Biodiversity",
    "Conservation",
    "Pollution",
    "Natural Resources",
    "Water Resources",
    "Waste & Recycling",
    "Environmental Health",
    "Human Impacts",
    "Sustainability",
    "Environmental Monitoring",
    "Restoration & Management"
  ],
  "Health & Medicine": [
    "Human Anatomy",
    "Human Physiology",
    "Nutrition",
    "Disease & Infection",
    "Immunology",
    "Genetics & Genomics",
    "Public Health",
    "Epidemiology",
    "Medical Technology",
    "Pharmacology & Treatments",
    "Reproductive & Developmental Health"
  ],
  "Marine Science": [
    "Marine Ecosystems",
    "Oceanography",
    "Marine Biology",
    "Coral Reefs",
    "Marine Food Webs",
    "Ocean Circulation",
    "Waves, Tides & Currents",
    "Marine Geology",
    "Ocean Chemistry",
    "Marine Conservation",
    "Human Impacts on Oceans"
  ],
  "Materials Science": [
    "Metals",
    "Ceramics & Glass",
    "Polymers & Plastics",
    "Composites",
    "Biomaterials",
    "Nanomaterials",
    "Material Properties",
    "Material Structure",
    "Material Processing & Manufacturing",
    "Material Failure & Durability",
    "Sustainable Materials"
  ],
  "Mathematics": [
    "Number & Quantity",
    "Algebra",
    "Geometry",
    "Measurement",
    "Functions",
    "Statistics",
    "Probability",
    "Data Analysis & Visualization",
    "Calculus",
    "Mathematical Modeling",
    "Logic & Problem Solving"
  ],
  "Microbiology": [
    "Bacteria",
    "Viruses",
    "Fungi",
    "Protists & Microorganisms",
    "Microbial Genetics",
    "Microbial Evolution",
    "Microbial Ecology",
    "Microbiomes",
    "Infectious Disease",
    "Immunology",
    "Biotechnology & Fermentation"
  ],
  "Neuroscience": [
    "Brain Structure & Function",
    "Neurons & Nervous Systems",
    "Sensation & Perception",
    "Learning & Memory",
    "Emotions",
    "Behavior",
    "Sleep & Circadian Rhythms",
    "Brain Development",
    "Neuroplasticity",
    "Neurological Disorders",
    "Neurotechnology"
  ],
  "Paleontology": [
    "Fossils & Fossilization",
    "Dinosaurs",
    "Ancient Life",
    "Evolutionary History",
    "Extinction",
    "Human Evolution",
    "Paleoecology",
    "Ancient Environments & Climate",
    "Geologic Time",
    "Mass Extinctions"
  ],
  "Physics": [
    "Motion & Forces",
    "Energy",
    "Momentum",
    "Gravity",
    "Waves & Sound",
    "Light & Optics",
    "Electricity & Magnetism",
    "Heat & Thermodynamics",
    "Matter & Properties",
    "Nuclear & Particle Physics",
    "Relativity & Quantum Physics"
  ],
  "Psychology": [
    "Human Behavior",
    "Cognition & Thinking",
    "Learning",
    "Memory",
    "Emotion",
    "Motivation",
    "Development Across the Lifespan",
    "Social Behavior",
    "Personality",
    "Mental Health",
    "Perception & Sensation"
  ]
};

const sqlPair = (field, name) => `('${field.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}')`;

describe('phenomenon topics', () => {
  const schema = fs.readFileSync(
    path.join(__dirname, '../../server/db/schema.sql'),
    'utf8'
  );
  const migration = fs.readFileSync(
    path.join(__dirname, '../../server/db/migrations/08_phenomenon_topics.sql'),
    'utf8'
  );

  test('seeds each discipline topic in schema.sql and the migration', () => {
    expect(taxonomyQueries.listPhenomena).toContain('offered = TRUE');
    expect(schema).not.toContain(sqlPair('Biology', 'evolution'));
    expect(schema).not.toContain(sqlPair('Agricultural Science', 'soil fertility'));
    expect(migration).toContain('DELETE FROM phenomena');
    expect(migration).toContain('pebble_phenomena');

    Object.entries(TOPICS).forEach(([field, names]) => {
      names.forEach((name) => {
        const pair = sqlPair(field, name);
        expect(schema).toContain(pair);
        expect(migration).toContain(pair);
      });
    });
  });

  test('feed payload includes an other tag and a saved phenomenon', async () => {
    query.mockImplementation(async (sql) => {
      const text = String(sql);
      if (text.includes('FROM pebble_other_tags')) {
        return { rows: [{ other_tag_id: 8, name: 'nocturnal hunter' }] };
      }
      if (text.includes('FROM pebble_phenomena')) {
        return {
          rows: [{ phenomenon_id: 40, name: 'photosynthesis', field_id: 2, field_name: 'Biology' }],
        };
      }
      if (text.includes('FROM pebbles p')) {
        return { rows: [{ pebble_id: 21, title: 'Scorpion', author_id: 2, like_count: 0 }] };
      }
      return { rows: [], rowCount: 0 };
    });

    const feed = await pebbleService.getFeed(1, {});
    expect(feed).toHaveLength(1);
    expect(feed[0].title).toBe('Scorpion');
    expect(feed[0].phenomena).toEqual([
      expect.objectContaining({ name: 'photosynthesis' }),
    ]);
    expect(feed[0].other_tags).toEqual([{ other_tag_id: 8, name: 'nocturnal hunter' }]);
  });
});
