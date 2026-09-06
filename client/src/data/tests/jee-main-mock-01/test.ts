// ==============================================================================
// EDUSTACK 2.0 — JEE MAIN MOCK TEST 01 (CODE-MANAGED TEST DATA)
// ==============================================================================

import { TestRegistryItem } from '../../../types/test';

export const jeeMainMock01: TestRegistryItem = {
  id: 'jee-main-mock-01',
  title: 'JEE Main Full Mock Test 01',
  subtitle: 'Complete NTA Syllabus — Physics, Chemistry & Mathematics',
  category: 'JEE Main Full Mock Tests',
  folder: 'JEE Main Full Mock Tests',
  durationMinutes: 180,
  totalQuestions: 15, // High-quality curated full syllabus set for comprehensive practice & testing
  totalMarks: 60,
  subjects: ['Physics', 'Chemistry', 'Mathematics'],
  description: 'Comprehensive test covering mechanics, electrostatics, thermodynamics, organic chemistry, physical equilibrium, calculus, and coordinate geometry.',
  questions: [
    // --------------------------------------------------------------------------
    // PHYSICS
    // --------------------------------------------------------------------------
    {
      id: 'mock01-phy-01',
      subject: 'Physics',
      section: 'Section A (MCQ)',
      chapter: 'Kinematics',
      topic: 'Projectile Motion',
      type: 'MCQ',
      questionText: 'A projectile is launched from ground level with speed $u = 20\\text{ m/s}$ at an angle $\\theta = 60^\\circ$ above the horizontal. Taking $g = 10\\text{ m/s}^2$, the radius of curvature of its trajectory at the highest point is:',
      options: [
        { id: 'A', text: '$10\\text{ m}$' },
        { id: 'B', text: '$20\\text{ m}$' },
        { id: 'C', text: '$30\\text{ m}$' },
        { id: 'D', text: '$40\\text{ m}$' },
      ],
      correctAnswer: 'A',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'At the apex (highest point), the vertical velocity $v_y = 0$, so the speed is purely horizontal: $$v = u\\cos 60^\\circ = 20 \\times \\frac{1}{2} = 10\\text{ m/s}$$ The normal acceleration is purely gravity: $a_n = g = 10\\text{ m/s}^2$. Therefore, the radius of curvature $\\rho$ is: $$\\rho = \\frac{v^2}{a_n} = \\frac{10^2}{10} = 10\\text{ m}$$ Hence, Option A is correct.',
    },
    {
      id: 'mock01-phy-02',
      subject: 'Physics',
      section: 'Section A (MCQ)',
      chapter: 'Current Electricity',
      topic: 'Resistor Networks & Kirchhoff Laws',
      type: 'MCQ',
      questionText: 'In the given DC bridge circuit below, a battery of electromotive force $\\mathcal{E} = 12\\text{ V}$ with internal resistance $r = 0$ is connected. Find the equivalent resistance $R_{eq}$ between terminals $A$ and $B$.',
      svgDiagram: `<svg viewBox="0 0 400 160" width="380" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8fafc"/>
        <line x1="40" y1="80" x2="100" y2="80" stroke="#334155" stroke-width="3"/>
        <line x1="100" y1="80" x2="150" y2="30" stroke="#334155" stroke-width="3"/>
        <line x1="100" y1="80" x2="150" y2="130" stroke="#334155" stroke-width="3"/>
        <rect x="140" y="20" width="60" height="20" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2" rx="4"/>
        <text x="170" y="35" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#312e81">4 Ω</text>
        <rect x="140" y="120" width="60" height="20" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2" rx="4"/>
        <text x="170" y="135" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#312e81">6 Ω</text>
        <line x1="200" y1="30" x2="260" y2="80" stroke="#334155" stroke-width="3"/>
        <line x1="200" y1="130" x2="260" y2="80" stroke="#334155" stroke-width="3"/>
        <line x1="260" y1="80" x2="350" y2="80" stroke="#334155" stroke-width="3"/>
        <circle cx="40" cy="80" r="4" fill="#0f172a"/>
        <circle cx="350" cy="80" r="4" fill="#0f172a"/>
        <text x="30" y="85" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">A</text>
        <text x="360" y="85" font-family="sans-serif" font-weight="bold" font-size="14" fill="#0f172a">B</text>
      </svg>`,
      options: [
        { id: 'A', text: '$2.4\\text{ }\\Omega$' },
        { id: 'B', text: '$5.0\\text{ }\\Omega$' },
        { id: 'C', text: '$10.0\\text{ }\\Omega$' },
        { id: 'D', text: '$1.2\\text{ }\\Omega$' },
      ],
      correctAnswer: 'A',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'The two resistors $R_1 = 4\\,\\Omega$ and $R_2 = 6\\,\\Omega$ are in parallel across nodes $A$ and $B$: $$R_{eq} = \\frac{R_1 R_2}{R_1 + R_2} = \\frac{4 \\times 6}{4 + 6} = \\frac{24}{10} = 2.4\\,\\Omega$$ Option A is correct.',
    },
    {
      id: 'mock01-phy-03',
      subject: 'Physics',
      section: 'Section A (MCQ)',
      chapter: 'Thermodynamics',
      topic: 'Carnot Engine Efficiency',
      type: 'MCQ',
      questionText: 'A Carnot engine operates between temperatures $T_H = 500\\text{ K}$ and $T_C = 300\\text{ K}$. If the engine absorbs $Q_H = 1000\\text{ J}$ of heat from the high-temperature reservoir in each cycle, the work done $W$ per cycle is:',
      options: [
        { id: 'A', text: '$200\\text{ J}$' },
        { id: 'B', text: '$400\\text{ J}$' },
        { id: 'C', text: '$600\\text{ J}$' },
        { id: 'D', text: '$800\\text{ J}$' },
      ],
      correctAnswer: 'B',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'The efficiency $\\eta$ of a Carnot engine is: $$\\eta = 1 - \\frac{T_C}{T_H} = 1 - \\frac{300}{500} = 1 - 0.6 = 0.4$$ The work output is: $$W = \\eta \\cdot Q_H = 0.4 \\times 1000 = 400\\text{ J}$$ Hence, Option B is correct.',
    },
    {
      id: 'mock01-phy-04',
      subject: 'Physics',
      section: 'Section B (Numerical)',
      chapter: 'Electrostatics',
      topic: 'Electric Potential of Concentric Spheres',
      type: 'NUMERICAL',
      questionText: 'A conducting spherical shell of radius $R = 0.2\\text{ m}$ carries a net charge $Q = 4\\times 10^{-8}\\text{ C}$. Taking $\\frac{1}{4\\pi\\varepsilon_0} = 9 \\times 10^9\\text{ N}\\cdot\\text{m}^2/\\text{C}^2$, calculate the electric potential $V$ (in volts) at a point $r = 0.1\\text{ m}$ from the centre.',
      numericalAnswer: '1800',
      numericalTolerance: 1,
      markingScheme: { marks: 4, negativeMarks: 0 },
      solution: 'Inside a conducting spherical shell, the electric field is zero ($\\vec{E} = 0$). Hence, the electric potential everywhere inside ($r \\le R$) is constant and equal to the surface potential: $$V = \\frac{1}{4\\pi\\varepsilon_0} \\frac{Q}{R} = \\frac{9 \\times 10^9 \\times 4 \\times 10^{-8}}{0.2} = \\frac{360}{0.2} = 1800\\text{ V}$$ Therefore, the numerical answer is 1800.',
    },
    {
      id: 'mock01-phy-05',
      subject: 'Physics',
      section: 'Section B (Numerical)',
      chapter: 'Modern Physics',
      topic: 'Photoelectric Effect',
      type: 'NUMERICAL',
      questionText: 'Monochromatic light of wavelength $\\lambda = 310\\text{ nm}$ falls on a metal surface whose work function is $\\phi = 2.5\\text{ eV}$. Taking $hc = 1240\\text{ eV}\\cdot\\text{nm}$, find the maximum kinetic energy $K_{\\max}$ of emitted photoelectrons in $\\text{eV}$.',
      numericalAnswer: '1.5',
      numericalTolerance: 0.05,
      markingScheme: { marks: 4, negativeMarks: 0 },
      solution: 'The photon energy $E$ is given by: $$E = \\frac{hc}{\\lambda} = \\frac{1240\\text{ eV}\\cdot\\text{nm}}{310\\text{ nm}} = 4.0\\text{ eV}$$ According to Einstein photoelectric equation: $$K_{\\max} = E - \\phi = 4.0\\text{ eV} - 2.5\\text{ eV} = 1.5\\text{ eV}$$ Thus, the numerical answer is 1.5.',
    },

    // --------------------------------------------------------------------------
    // CHEMISTRY
    // --------------------------------------------------------------------------
    {
      id: 'mock01-chem-01',
      subject: 'Chemistry',
      section: 'Section A (MCQ)',
      chapter: 'Chemical Bonding',
      topic: 'VSEPR Theory & Molecular Geometry',
      type: 'MCQ',
      questionText: 'According to VSEPR theory, the molecular geometry and number of lone pairs on the central xenon atom in $\\text{XeF}_4$ are respectively:',
      options: [
        { id: 'A', text: 'Tetrahedral, 0 lone pairs' },
        { id: 'B', text: 'Square planar, 2 lone pairs' },
        { id: 'C', text: 'See-saw, 1 lone pair' },
        { id: 'D', text: 'Square pyramidal, 1 lone pair' },
      ],
      correctAnswer: 'B',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'Xenon has 8 valence electrons. In $\\text{XeF}_4$, it forms 4 single $\\text{Xe}-\\text{F}$ covalent bonds, consuming 4 electrons. The remaining $8 - 4 = 4$ electrons form $2$ lone pairs. The steric number is $4 + 2 = 6$ ($sp^3d^2$ hybridization). With 4 bonding pairs and 2 lone pairs situated trans to each other, the shape is Square Planar.',
    },
    {
      id: 'mock01-chem-02',
      subject: 'Chemistry',
      section: 'Section A (MCQ)',
      chapter: 'Coordination Compounds',
      topic: 'Crystal Field Stabilization Energy',
      type: 'MCQ',
      questionText: 'The spin-only magnetic moment $\\mu_s$ of an octahedral complex $[\\text{Fe}(\\text{H}_2\\text{O})_6]^{2+}$ (where $\\text{H}_2\\text{O}$ is a weak field ligand) is approximately:',
      options: [
        { id: 'A', text: '$0\\text{ BM}$' },
        { id: 'B', text: '$2.83\\text{ BM}$' },
        { id: 'C', text: '$4.90\\text{ BM}$' },
        { id: 'D', text: '$5.92\\text{ BM}$' },
      ],
      correctAnswer: 'C',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: '$\\text{Fe}^{2+}$ has electronic configuration $[\\text{Ar}] 3d^6$. With a weak field ligand like $\\text{H}_2\\text{O}$, pairing does not occur in $t_{2g}$ before $e_g$ is occupied ($t_{2g}^4 e_g^2$). The number of unpaired electrons $n = 4$. $$\\mu_s = \\sqrt{n(n+2)} = \\sqrt{4(6)} = \\sqrt{24} \\approx 4.90\\text{ BM}$$ Option C is correct.',
    },
    {
      id: 'mock01-chem-03',
      subject: 'Chemistry',
      section: 'Section A (MCQ)',
      chapter: 'Organic Chemistry',
      topic: 'Aldol Condensation & Named Reactions',
      type: 'MCQ',
      questionText: 'Which of the following carbonyl compounds will undergo Cannizzaro reaction upon heating with concentrated $50\\%\\text{ NaOH}$ solution?',
      options: [
        { id: 'A', text: '$\\text{CH}_3\\text{CHO}$ (Acetaldehyde)' },
        { id: 'B', text: '$\\text{CH}_3\\text{COCH}_3$ (Acetone)' },
        { id: 'C', text: '$\\text{C}_6\\text{H}_5\\text{CHO}$ (Benzaldehyde)' },
        { id: 'D', text: '$\\text{CH}_3\\text{CH}_2\\text{CHO}$ (Propanal)' },
      ],
      correctAnswer: 'C',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'The Cannizzaro reaction is characteristic of aldehydes lacking an $\\alpha$-hydrogen atom. Benzaldehyde ($\\text{C}_6\\text{H}_5\\text{CHO}$) has no $\\alpha$-hydrogen on the carbonyl carbon and therefore disproportionates into benzyl alcohol and sodium benzoate.',
    },
    {
      id: 'mock01-chem-04',
      subject: 'Chemistry',
      section: 'Section B (Numerical)',
      chapter: 'Electrochemistry',
      topic: 'Nernst Equation & Cell Potential',
      type: 'NUMERICAL',
      questionText: 'For a galvanic cell: $\\text{Zn}(s) | \\text{Zn}^{2+}(1\\text{ M}) \\;||\\; \\text{Cu}^{2+}(1\\text{ M}) | \\text{Cu}(s)$ with standard reduction potentials $E^\\circ_{\\text{Zn}^{2+}/\\text{Zn}} = -0.76\\text{ V}$ and $E^\\circ_{\\text{Cu}^{2+}/\\text{Cu}} = +0.34\\text{ V}$. Calculate the standard cell electromotive force $E^\\circ_{\\text{cell}}$ in volts.',
      numericalAnswer: '1.1',
      numericalTolerance: 0.05,
      markingScheme: { marks: 4, negativeMarks: 0 },
      solution: '$$E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}} = (+0.34\\text{ V}) - (-0.76\\text{ V}) = 0.34 + 0.76 = 1.10\\text{ V}$$ The correct numerical answer is 1.1.',
    },
    {
      id: 'mock01-chem-05',
      subject: 'Chemistry',
      section: 'Section B (Numerical)',
      chapter: 'Chemical Kinetics',
      topic: 'First Order Reaction Kinetics',
      type: 'NUMERICAL',
      questionText: 'A first-order decomposition reaction has a rate constant $k = 6.93 \\times 10^{-3}\\text{ s}^{-1}$. Calculate the half-life $t_{1/2}$ of this reaction in seconds (use $\\ln 2 = 0.693$).',
      numericalAnswer: '100',
      numericalTolerance: 0.5,
      markingScheme: { marks: 4, negativeMarks: 0 },
      solution: 'For a first-order reaction: $$t_{1/2} = \\frac{\\ln 2}{k} = \\frac{0.693}{6.93 \\times 10^{-3}} = 100\\text{ s}$$ Hence, the numerical value is 100.',
    },

    // --------------------------------------------------------------------------
    // MATHEMATICS
    // --------------------------------------------------------------------------
    {
      id: 'mock01-math-01',
      subject: 'Mathematics',
      section: 'Section A (MCQ)',
      chapter: 'Definite Integrals',
      topic: 'King Property & Trigonometric Integrals',
      type: 'MCQ',
      questionText: 'The value of the definite integral $I = \\int_0^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} \\, dx$ is:',
      options: [
        { id: 'A', text: '$\\frac{\\pi}{4}$' },
        { id: 'B', text: '$\\frac{\\pi}{2}$' },
        { id: 'C', text: '$\\pi$' },
        { id: 'D', text: '$1$' },
      ],
      correctAnswer: 'A',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'Using the King Property $\\int_a^b f(x)dx = \\int_a^b f(a+b-x)dx$: $$I = \\int_0^{\\pi/2} \\frac{\\sqrt{\\sin(\\pi/2 - x)}}{\\sqrt{\\sin(\\pi/2 - x)} + \\sqrt{\\cos(\\pi/2 - x)}} \\, dx = \\int_0^{\\pi/2} \\frac{\\sqrt{\\cos x}}{\\sqrt{\\cos x} + \\sqrt{\\sin x}} \\, dx$$ Adding the two equations: $$2I = \\int_0^{\\pi/2} \\frac{\\sqrt{\\sin x} + \\sqrt{\\cos x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} \\, dx = \\int_0^{\\pi/2} 1 \\, dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$$ Correct option is A.',
    },
    {
      id: 'mock01-math-02',
      subject: 'Mathematics',
      section: 'Section A (MCQ)',
      chapter: 'Matrices & Determinants',
      topic: 'Properties of Adjoint & Inverse',
      type: 'MCQ',
      questionText: 'If $A$ is a $3 \\times 3$ non-singular matrix such that $\\det(A) = 3$, then the determinant of its adjoint matrix $\\det(\\text{adj}(A))$ is equal to:',
      options: [
        { id: 'A', text: '$3$' },
        { id: 'B', text: '$9$' },
        { id: 'C', text: '$27$' },
        { id: 'D', text: '$81$' },
      ],
      correctAnswer: 'B',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'For any $n \\times n$ square matrix, the property holds: $$\\det(\\text{adj}(A)) = (\\det(A))^{n-1}$$ Here $n = 3$ and $\\det(A) = 3$. Therefore: $$\\det(\\text{adj}(A)) = 3^{3-1} = 3^2 = 9$$ Option B is correct.',
    },
    {
      id: 'mock01-math-03',
      subject: 'Mathematics',
      section: 'Section A (MCQ)',
      chapter: 'Vectors & 3D Geometry',
      topic: 'Dot and Cross Products',
      type: 'MCQ',
      questionText: 'Let $\\vec{a} = 2\\hat{i} + \\hat{j} - 2\\hat{k}$ and $\\vec{b} = \\hat{i} + \\hat{j}$. The projection of vector $\\vec{a}$ along the unit vector parallel to $\\vec{b}$ is:',
      options: [
        { id: 'A', text: '$\\frac{3}{\\sqrt{2}}$' },
        { id: 'B', text: '$3\\sqrt{2}$' },
        { id: 'C', text: '$\\sqrt{2}$' },
        { id: 'D', text: '$\\frac{1}{\\sqrt{2}}$' },
      ],
      correctAnswer: 'A',
      markingScheme: { marks: 4, negativeMarks: 1 },
      solution: 'The scalar projection of $\\vec{a}$ onto $\\vec{b}$ is given by: $$\\text{proj}_{\\vec{b}}(\\vec{a}) = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{b}|}$$ Evaluating the dot product: $$\\vec{a} \\cdot \\vec{b} = (2)(1) + (1)(1) + (-2)(0) = 2 + 1 = 3$$ The magnitude is $|\\vec{b}| = \\sqrt{1^2 + 1^2} = \\sqrt{2}$. Hence, projection $= \\frac{3}{\\sqrt{2}}$. Option A is correct.',
    },
    {
      id: 'mock01-math-04',
      subject: 'Mathematics',
      section: 'Section B (Numerical)',
      chapter: 'Limits & Derivatives',
      topic: 'Standard Limits using L-Hopital',
      type: 'NUMERICAL',
      questionText: 'Evaluate the following limit: $$L = \\lim_{x \\to 0} \\frac{1 - \\cos(6x)}{x^2}$$',
      numericalAnswer: '18',
      numericalTolerance: 0.1,
      markingScheme: { marks: 4, negativeMarks: 0 },
      solution: 'Using the standard identity $\\lim_{u \\to 0} \\frac{1 - \\cos u}{u^2} = \\frac{1}{2}$: $$L = \\lim_{x \\to 0} \\frac{1 - \\cos(6x)}{(6x)^2} \\times 36 = \\frac{1}{2} \\times 36 = 18$$ The numerical answer is 18.',
    },
    {
      id: 'mock01-math-05',
      subject: 'Mathematics',
      section: 'Section B (Numerical)',
      chapter: 'Probability',
      topic: 'Binomial Distribution',
      type: 'NUMERICAL',
      questionText: 'An unbiased fair coin is tossed $n = 4$ times. The probability of getting exactly two heads is expressed as a decimal. Enter this value (e.g. 0.375).',
      numericalAnswer: '0.375',
      numericalTolerance: 0.005,
      markingScheme: { marks: 4, negativeMarks: 0 },
      solution: 'Using the binomial distribution formula $P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$ with $n = 4, k = 2, p = 0.5$: $$P(X = 2) = \\binom{4}{2} (0.5)^2 (0.5)^2 = 6 \\times \\frac{1}{16} = \\frac{3}{8} = 0.375$$ The numerical value is 0.375.',
    },
  ],
};
