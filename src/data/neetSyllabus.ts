import { Chapter, Topic, SubjectType } from '../types';

export interface SubjectSyllabus {
  name: SubjectType;
  chapters: Chapter[];
  topicsMap: Record<string, Topic[]>; // chapterId -> topics
}

export const NEET_SYLLABUS: Record<SubjectType, { chapters: { name: string; topics: string[]; highYield?: boolean }[] }> = {
  Physics: {
    chapters: [
      {
        name: 'Electrostatics & Capacitance',
        highYield: true,
        topics: [
          'Coulombs Law and Electric Field',
          'Electric Flux and Gauss Law',
          'Electric Potential and Equipotential Surfaces',
          'Capacitance and Energy Stored in Capacitor',
          'Dielectrics and Combinations'
        ]
      },
      {
        name: 'Current Electricity',
        highYield: true,
        topics: [
          'Ohms Law, Drift Velocity and Resistivity',
          'Series and Parallel Resistors & Color Coding',
          'Kirchhoffs Laws and Circuit Analysis',
          'Wheatstone Bridge and Potentiometer',
          'Electrical Energy and Power'
        ]
      },
      {
        name: 'Ray Optics & Optical Instruments',
        highYield: true,
        topics: [
          'Reflection at Spherical Mirrors',
          'Refraction and Total Internal Reflection',
          'Refraction at Spherical Surfaces and Thin Lenses',
          'Prism Formula and Dispersion',
          'Microscopes and Telescopes'
        ]
      },
      {
        name: 'Thermodynamics & KTG',
        highYield: true,
        topics: [
          'Zeroth and First Law of Thermodynamics',
          'Thermodynamic Processes (Isothermal, Adiabatic)',
          'Heat Engines, Refrigerator and Second Law',
          'Kinetic Theory of Gases & Mean Free Path',
          'Degrees of Freedom and Equipartition'
        ]
      },
      {
        name: 'Magnetic Effects of Current & Magnetism',
        highYield: true,
        topics: [
          'Biot-Savart Law and Applications',
          'Amperes Circuital Law and Solenoid',
          'Force on Moving Charge and Current Conductor',
          'Torque on Magnetic Dipole and Galvanometer',
          'Magnetic Properties of Materials'
        ]
      },
      {
        name: 'Laws of Motion & Work Energy',
        highYield: false,
        topics: [
          'Newtons Laws of Motion and Impulse',
          'Friction and Banking of Roads',
          'Work-Energy Theorem and Conservative Forces',
          'Collisions in 1D and 2D',
          'Circular Motion Dynamics'
        ]
      },
      {
        name: 'Modern Physics & Dual Nature',
        highYield: true,
        topics: [
          'Photoelectric Effect and Einsteins Equation',
          'de Broglie Wavelength and Matter Waves',
          'Bohrs Model of Hydrogen Atom',
          'Radioactivity and Nuclear Binding Energy',
          'Semiconductors and p-n Junction Diode'
        ]
      }
    ]
  },
  Chemistry: {
    chapters: [
      {
        name: 'Chemical Bonding & Molecular Structure',
        highYield: true,
        topics: [
          'Lewis Structures and Octet Rule',
          'VSEPR Theory and Shapes of Molecules',
          'Valence Bond Theory and Hybridization',
          'Molecular Orbital Theory (MOT)',
          'Hydrogen Bonding and Intermolecular Forces'
        ]
      },
      {
        name: 'Organic Chemistry: Basics & Hydrocarbons',
        highYield: true,
        topics: [
          'IUPAC Nomenclature and Isomerism',
          'Electronic Effects (Inductive, Hyperconjugation, Mesomeric)',
          'Alkanes, Alkenes and Markovnikov Addition',
          'Alkynes and Aromatic Hydrocarbons (Benzene)',
          'Electrophilic Aromatic Substitution'
        ]
      },
      {
        name: 'Coordination Compounds',
        highYield: true,
        topics: [
          'Werners Theory and IUPAC Nomenclature',
          'Isomerism in Coordination Compounds',
          'Valence Bond Theory of Complexes',
          'Crystal Field Theory (CFT) and Splitting',
          'Color and Magnetic Properties'
        ]
      },
      {
        name: 'Equilibrium (Chemical & Ionic)',
        highYield: true,
        topics: [
          'Equilibrium Constant (Kc, Kp) and Le Chatelier Principle',
          'pH Scale and Ionization of Acids and Bases',
          'Buffer Solutions and Handerson Equation',
          'Solubility Product (Ksp) and Common Ion Effect'
        ]
      },
      {
        name: 'Solutions & Colligative Properties',
        highYield: true,
        topics: [
          'Concentration Terms (Molarity, Molality, Mole Fraction)',
          'Raoults Law and Ideal/Non-Ideal Solutions',
          'Elevation in Boiling Point and Depression in Freezing Point',
          'Osmotic Pressure and Van t Hoff Factor'
        ]
      },
      {
        name: 'Aldehydes, Ketones & Carboxylic Acids',
        highYield: true,
        topics: [
          'Nucleophilic Addition Reactions',
          'Aldol Condensation and Cannizzaro Reaction',
          'Oxidation and Reduction of Carbonyls',
          'Acidity of Carboxylic Acids and Reactions'
        ]
      }
    ]
  },
  Biology: {
    chapters: [
      {
        name: 'Human Reproduction & Reproductive Health',
        highYield: true,
        topics: [
          'Male and Female Reproductive Systems',
          'Gametogenesis (Spermatogenesis & Oogenesis)',
          'Menstrual Cycle and Hormonal Control',
          'Fertilization, Cleavage and Implantation',
          'Contraceptive Methods and Assisted Reproductive Tech (ART)'
        ]
      },
      {
        name: 'Principles of Inheritance & Variation (Genetics)',
        highYield: true,
        topics: [
          'Mendelian Principles and Monohybrid/Dihybrid Crosses',
          'Incomplete Dominance and Codominance',
          'Chromosomal Theory and Linkage/Recombination',
          'Sex Determination and Pedigree Analysis',
          'Mendelian and Chromosomal Disorders'
        ]
      },
      {
        name: 'Molecular Basis of Inheritance',
        highYield: true,
        topics: [
          'Structure of DNA and RNA',
          'Experiments Proving DNA as Genetic Material',
          'Replication of DNA and Meselson-Stahl Experiment',
          'Transcription and Post-Transcriptional Modifications',
          'Genetic Code and Translation',
          'Lac Operon Regulation and Human Genome Project'
        ]
      },
      {
        name: 'Plant Physiology: Photosynthesis & Respiration',
        highYield: true,
        topics: [
          'Light Reactions and Photophosphorylation (Z-scheme)',
          'Calvin Cycle (C3) and Hatch-Slack Pathway (C4)',
          'Photorespiration and Factors Affecting Photosynthesis',
          'Glycolysis, Krebs Cycle and Electron Transport System (ETS)'
        ]
      },
      {
        name: 'Biotechnology: Principles and Processes',
        highYield: true,
        topics: [
          'Restriction Enzymes and Cloning Vectors (pBR322)',
          'Processes of Recombinant DNA Technology',
          'PCR (Polymerase Chain Reaction) and Gel Electrophoresis',
          'Bioreactors and Downstream Processing'
        ]
      },
      {
        name: 'Human Physiology: Neural & Chemical Coordination',
        highYield: true,
        topics: [
          'Structure of Neuron and Nerve Impulse Conduction',
          'Human Brain and Reflex Action',
          'Endocrine Glands and Major Hormones',
          'Mechanism of Hormone Action'
        ]
      },
      {
        name: 'Ecology & Environment',
        highYield: true,
        topics: [
          'Organisms and Populations (Adaptations, Population Growth)',
          'Ecosystem Structure and Ecological Pyramids',
          'Biodiversity Conservation (In-situ, Ex-situ)',
          'Environmental Issues'
        ]
      }
    ]
  }
};
