/**
 * Exact crops from the science-icons sheet, one image per field.
 * The hand-drawn outer circle is left off; chips and map pins already draw the bubble.
 */
import agriculturalScience from '../../resources/fields/agricultural-science.png';
import astronomy from '../../resources/fields/astronomy.png';
import biology from '../../resources/fields/biology.png';
import chemistry from '../../resources/fields/chemistry.png';
import climateScience from '../../resources/fields/climate-science.png';
import computerScience from '../../resources/fields/computer-science.png';
import earthScience from '../../resources/fields/earth-science.png';
import engineering from '../../resources/fields/engineering.png';
import environmentalScience from '../../resources/fields/environmental-science.png';
import healthMedicine from '../../resources/fields/health-medicine.png';
import marineScience from '../../resources/fields/marine-science.png';
import materialsScience from '../../resources/fields/materials-science.png';
import mathematics from '../../resources/fields/mathematics.png';
import microbiology from '../../resources/fields/microbiology.png';
import neuroscience from '../../resources/fields/neuroscience.png';
import paleontology from '../../resources/fields/paleontology.png';
import physics from '../../resources/fields/physics.png';
import psychology from '../../resources/fields/psychology.png';

export const FIELD_GLYPH_SRC = {
  'Agricultural Science': agriculturalScience,
  Astronomy: astronomy,
  Biology: biology,
  Chemistry: chemistry,
  'Climate Science': climateScience,
  'Computer Science': computerScience,
  'Earth Science': earthScience,
  'Engineering & Technology': engineering,
  'Environmental Science': environmentalScience,
  'Health & Medicine': healthMedicine,
  'Marine Science': marineScience,
  'Materials Science': materialsScience,
  Mathematics: mathematics,
  Microbiology: microbiology,
  Neuroscience: neuroscience,
  Paleontology: paleontology,
  Physics: physics,
  Psychology: psychology,
};

export const FIELD_GLYPH_ID = {
  'Agricultural Science': 'agricultural-science',
  Astronomy: 'astronomy',
  Biology: 'biology',
  Chemistry: 'chemistry',
  'Climate Science': 'climate-science',
  'Computer Science': 'computer-science',
  'Earth Science': 'earth-science',
  'Engineering & Technology': 'engineering',
  'Environmental Science': 'environmental-science',
  'Health & Medicine': 'health-medicine',
  'Marine Science': 'marine-science',
  'Materials Science': 'materials-science',
  Mathematics: 'mathematics',
  Microbiology: 'microbiology',
  Neuroscience: 'neuroscience',
  Paleontology: 'paleontology',
  Physics: 'physics',
  Psychology: 'psychology',
};

/** DOM image for map pins, which are plain elements rather than React trees. */
export const createFieldGlyphElement = (name) => {
  const src = FIELD_GLYPH_SRC[name];
  const id = FIELD_GLYPH_ID[name];
  if (!src || !id || typeof document === 'undefined') return null;
  const img = document.createElement('img');
  img.src = src;
  img.alt = '';
  img.className = 'field-glyph';
  img.setAttribute('data-icon', id);
  return img;
};
