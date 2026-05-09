// ============================================================
// FocusPoint Curriculum Templates
// Read-only blueprint data. User progress belongs in userCourses.
// Add or edit sample templates here; Course Management flattens them
// for the mock database while rendering them by curriculum group.
// ============================================================

export const curriculumTemplateGroups = [
  {
    id: 'igcse-cie',
    label: 'IGCSE CIE',
    description: 'Cambridge IGCSE subjects organized by syllabus area.',
    templates: [
      {
        id: 'tpl-igcse-cie-biology',
        title: 'Biology',
        curriculum: 'IGCSE CIE',
        structureType: 'linear',
        sections: [
          {
            id: 'igcse-cie-biology-cells',
            title: 'Cells and Organization',
            topics: [
              'Cell structure and function',
              'Specialized cells and tissues',
              'Movement in and out of cells',
            ],
          },
          {
            id: 'igcse-cie-biology-plant-nutrition',
            title: 'Plant Nutrition',
            topics: [
              'Photosynthesis requirements',
              'Leaf structure and adaptations',
              'Mineral requirements in plants',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'igcse-edexcel',
    label: 'IGCSE Edexcel',
    description: 'Pearson Edexcel International GCSE subject templates.',
    templates: [
      {
        id: 'tpl-igcse-edexcel-maths-a',
        title: 'Mathematics A',
        curriculum: 'IGCSE Edexcel',
        structureType: 'linear',
        sections: [
          {
            id: 'igcse-edexcel-maths-number',
            title: 'Number and Algebra',
            topics: [
              'Standard form and bounds',
              'Indices and surds',
              'Linear and quadratic equations',
            ],
          },
          {
            id: 'igcse-edexcel-maths-geometry',
            title: 'Geometry and Measures',
            topics: [
              'Circle theorems',
              'Trigonometry',
              'Vectors and transformations',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'edexcel-ial',
    label: 'Edexcel IAL',
    description: 'International Advanced Level modular course structures.',
    templates: [
      {
        id: 'tpl-edexcel-ial-it',
        title: 'Information Technology',
        curriculum: 'Edexcel IAL',
        structureType: 'modular',
        sections: [
          {
            id: 'edexcel-ial-it-unit-1',
            title: 'Unit 1: Data and Information',
            topics: [
              'Data, information, and knowledge',
              'Data encoding and representation',
              'Database fundamentals',
              'Information quality and validation',
            ],
          },
          {
            id: 'edexcel-ial-it-unit-2',
            title: 'Unit 2: Software and Systems',
            topics: [
              'Systems development life cycle',
              'User interface design',
              'Testing strategies',
              'Implementation and maintenance',
            ],
          },
          {
            id: 'edexcel-ial-it-unit-3',
            title: 'Unit 3: Networks and Communication',
            topics: [
              'Network types and topologies',
              'Protocols and data transmission',
              'Cybersecurity principles',
              'Cloud services and remote working',
            ],
          },
          {
            id: 'edexcel-ial-it-unit-4',
            title: 'Unit 4: Applied IT Project',
            topics: [
              'Project planning and requirements',
              'Solution design',
              'Development documentation',
              'Evaluation and review',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cie-a-levels',
    label: 'CIE A Levels',
    description: 'Cambridge International AS and A Level subjects.',
    templates: [
      {
        id: 'tpl-cie-a-level-physics',
        title: 'Physics',
        curriculum: 'CIE A Levels',
        structureType: 'linear',
        sections: [
          {
            id: 'cie-a-level-physics-paper-1',
            title: 'Paper 1: Multiple Choice',
            topics: [
              'Physical quantities and units',
              'Kinematics and dynamics',
              'Waves and superposition',
              'Electric circuits',
            ],
          },
          {
            id: 'cie-a-level-physics-paper-2',
            title: 'Paper 2: AS Structured Questions',
            topics: [
              'Forces, density, and pressure',
              'Work, energy, and power',
              'Materials and deformation',
              'Current of electricity',
            ],
          },
          {
            id: 'cie-a-level-physics-paper-4',
            title: 'Paper 4: A2 Structured Questions',
            topics: [
              'Circular motion and gravitation',
              'Simple harmonic motion',
              'Electric fields and capacitance',
              'Nuclear physics and medical imaging',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ielts',
    label: 'IELTS',
    description: 'Skill-based preparation for IELTS Academic.',
    templates: [
      {
        id: 'tpl-ielts-academic',
        title: 'IELTS Academic',
        curriculum: 'IELTS',
        structureType: 'skill-based',
        sections: [
          {
            id: 'ielts-academic-reading',
            title: 'Reading',
            topics: [
              'Skimming and scanning',
              'Matching headings',
              'True, false, not given',
              'Academic vocabulary in context',
            ],
          },
          {
            id: 'ielts-academic-writing',
            title: 'Writing',
            topics: [
              'Task 1 data description',
              'Task 1 process and map responses',
              'Task 2 essay planning',
              'Coherence, cohesion, and grammar range',
            ],
          },
          {
            id: 'ielts-academic-speaking',
            title: 'Speaking',
            topics: [
              'Part 1 fluency practice',
              'Part 2 cue card structure',
              'Part 3 abstract discussion',
              'Pronunciation and lexical variety',
            ],
          },
          {
            id: 'ielts-academic-listening',
            title: 'Listening',
            topics: [
              'Form completion',
              'Map and diagram labelling',
              'Multiple choice strategy',
              'Lecture note completion',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sat',
    label: 'SAT',
    description: 'Digital SAT preparation grouped by test area.',
    templates: [
      {
        id: 'tpl-sat-digital',
        title: 'Digital SAT',
        curriculum: 'SAT',
        structureType: 'skill-based',
        sections: [
          {
            id: 'sat-reading-writing',
            title: 'Reading and Writing',
            topics: [
              'Central ideas and details',
              'Command of evidence',
              'Transitions and rhetorical synthesis',
            ],
          },
          {
            id: 'sat-math',
            title: 'Math',
            topics: [
              'Linear equations and systems',
              'Advanced math and functions',
              'Problem solving and data analysis',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ged',
    label: 'GED',
    description: 'GED test preparation by subject area.',
    templates: [
      {
        id: 'tpl-ged-core',
        title: 'GED Core Subjects',
        curriculum: 'GED',
        structureType: 'skill-based',
        sections: [
          {
            id: 'ged-math',
            title: 'Mathematical Reasoning',
            topics: [
              'Quantitative problem solving',
              'Algebraic expressions and equations',
              'Graphs and functions',
            ],
          },
          {
            id: 'ged-rla',
            title: 'Reasoning Through Language Arts',
            topics: [
              'Reading comprehension',
              'Argument analysis',
              'Extended response planning',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ossd',
    label: 'OSSD',
    description: 'Ontario Secondary School Diploma course samples.',
    templates: [
      {
        id: 'tpl-ossd-advanced-functions',
        title: 'Advanced Functions',
        curriculum: 'OSSD',
        structureType: 'modular',
        sections: [
          {
            id: 'ossd-advanced-functions-polynomial',
            title: 'Polynomial and Rational Functions',
            topics: [
              'Polynomial function behavior',
              'Rational expressions and equations',
              'Transformations of functions',
            ],
          },
          {
            id: 'ossd-advanced-functions-trig',
            title: 'Trigonometric Functions',
            topics: [
              'Radians and unit circle',
              'Trigonometric identities',
              'Solving trigonometric equations',
            ],
          },
        ],
      },
    ],
  },
];

export const curriculumTemplates = curriculumTemplateGroups.flatMap((group) => group.templates);

export function getCurriculumTemplate(templateId) {
  return curriculumTemplates.find((template) => template.id === templateId) || null;
}

export default curriculumTemplates;
