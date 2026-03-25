import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface StartAttemptResponse {
  attemptId: string;
  message: string;
}

export interface SubmitQuizRequest {
  answers: number[];       // Selected option index (0–3) for each of the 50 questions, in order
  levelTimes: number[];    // Time in seconds taken to complete each of the 10 levels
}

export interface SubmitQuizResponse {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  grade: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class QuizGameService {
  // ────────────────────────────────────────────────────────────────
  // TODO: Replace this base URL with your actual API base URL
  // ────────────────────────────────────────────────────────────────
  private readonly API_BASE = 'https://your-api-base-url.com/api';

  constructor(private http: HttpClient) {}

  /**
   * Called when the player hits START.
   * Tells the backend to increment the attempt counter in the DB.
   */
  incrementAttempt(): Observable<StartAttemptResponse> {
    // ── PLACEHOLDER ──────────────────────────────────────────────
    // Uncomment the real call and remove the mock once API is ready:
    //
    // return this.http.post<StartAttemptResponse>(
    //   `${this.API_BASE}/quiz/attempt`,
    //   {}
    // );
    // ─────────────────────────────────────────────────────────────

    // Mock response (simulates network delay)
    return of({ attemptId: 'mock-attempt-001', message: 'Attempt recorded' }).pipe(delay(400));
  }

  /**
   * Called when the player hits SUBMIT after answering all 50 questions.
   * Sends the answers array and per-level time array to the backend.
   * The backend calculates and returns the score.
   *
   * @param payload  { answers: number[50], levelTimes: number[10] }
   */
  submitQuiz(payload: SubmitQuizRequest): Observable<SubmitQuizResponse> {
    // ── PLACEHOLDER ──────────────────────────────────────────────
    // Uncomment the real call and remove the mock once API is ready:
    //
    // return this.http.post<SubmitQuizResponse>(
    //   `${this.API_BASE}/quiz/submit`,
    //   payload
    // );
    // ─────────────────────────────────────────────────────────────

    // Mock scoring logic (frontend-side, for prototype only)
    const correct = payload.answers.filter((ans, i) => ans === QUESTIONS[i]?.correctIndex).length;
    const score   = correct * 10;
    const pct     = Math.round((correct / 50) * 100);
    const grade   = pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 45 ? 'C' : 'D';

    return of({
      score,
      totalQuestions: 50,
      correctAnswers: correct,
      percentage: pct,
      grade,
      message: pct >= 60
        ? '🎉 Fantastic work, Particle Champion!'
        : '💡 Keep studying those atomic interactions!'
    }).pipe(delay(1200));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER QUESTION BANK  (50 MCQ across 10 levels)
// Replace question/option text and correctIndex values with real content.
// ─────────────────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  level: number;         // 1 – 10
  host: 'proton' | 'neutron' | 'electron';
  question: string;
  options: [string, string, string, string];
  correctIndex: number;  // 0 – 3
}

export const QUESTIONS: QuizQuestion[] = [
  // ── LEVEL 1 ──────────────────────────────────────────────────────────────
  { level: 1, host: 'proton',   question: 'What is the basic unit of matter?',                          options: ['Atom', 'Molecule', 'Cell', 'Nucleus'],                  correctIndex: 0 },
  { level: 1, host: 'neutron',  question: 'Which particle carries a negative charge?',                 options: ['Proton', 'Neutron', 'Electron', 'Positron'],            correctIndex: 2 },
  { level: 1, host: 'electron', question: 'What does the atomic number represent?',                    options: ['Number of neutrons', 'Number of electrons', 'Number of protons', 'Mass number'], correctIndex: 2 },
  { level: 1, host: 'proton',   question: 'Which element has the symbol "H"?',                         options: ['Helium', 'Hydrogen', 'Hafnium', 'Holmium'],             correctIndex: 1 },
  { level: 1, host: 'neutron',  question: 'What is the speed of light (approx.)?',                     options: ['3×10⁶ m/s', '3×10⁸ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], correctIndex: 1 },

  // ── LEVEL 2 ──────────────────────────────────────────────────────────────
  { level: 2, host: 'electron', question: 'What force holds protons together in the nucleus?',        options: ['Gravity', 'Electromagnetic', 'Strong nuclear', 'Weak nuclear'], correctIndex: 2 },
  { level: 2, host: 'proton',   question: 'How many electrons can the first shell hold?',             options: ['2', '4', '8', '18'],                                   correctIndex: 0 },
  { level: 2, host: 'neutron',  question: 'What is the charge of a neutron?',                         options: ['+1', '-1', '0', '+2'],                                 correctIndex: 2 },
  { level: 2, host: 'electron', question: 'Which model describes electrons in orbitals?',             options: ['Bohr Model', 'Plum Pudding', 'Quantum Mechanical', 'Rutherford'], correctIndex: 2 },
  { level: 2, host: 'proton',   question: 'What is isotopes differing in?',                           options: ['Proton count', 'Electron count', 'Neutron count', 'Charge'],     correctIndex: 2 },

  // ── LEVEL 3 ──────────────────────────────────────────────────────────────
  { level: 3, host: 'neutron',  question: 'What is the half-life of Carbon-14 (approx.)?',            options: ['1,000 years', '5,730 years', '10,000 years', '50,000 years'],    correctIndex: 1 },
  { level: 3, host: 'electron', question: 'What particle was discovered by J.J. Thomson?',            options: ['Proton', 'Neutron', 'Electron', 'Nucleus'],             correctIndex: 2 },
  { level: 3, host: 'proton',   question: 'What is the mass number of an atom?',                      options: ['Protons only', 'Neutrons only', 'Protons + Neutrons', 'Protons + Electrons'], correctIndex: 2 },
  { level: 3, host: 'neutron',  question: 'Radioactive decay that emits a helium nucleus is?',        options: ['Beta decay', 'Alpha decay', 'Gamma decay', 'Fission'],  correctIndex: 1 },
  { level: 3, host: 'electron', question: 'What is the Pauli Exclusion Principle about?',             options: ['No two electrons share all quantum numbers', 'Electrons orbit the nucleus', 'Protons repel each other', 'Neutrons have no spin'], correctIndex: 0 },

  // ── LEVEL 4 ──────────────────────────────────────────────────────────────
  { level: 4, host: 'proton',   question: 'Which equation relates energy and mass?',                  options: ['F=ma', 'E=mc²', 'PV=nRT', 'E=hf'],                     correctIndex: 1 },
  { level: 4, host: 'neutron',  question: 'What type of radiation is most penetrating?',              options: ['Alpha', 'Beta', 'Gamma', 'Delta'],                      correctIndex: 2 },
  { level: 4, host: 'electron', question: 'Quarks combine to form which particles?',                  options: ['Electrons', 'Photons', 'Hadrons', 'Leptons'],           correctIndex: 2 },
  { level: 4, host: 'proton',   question: 'What is nuclear fission?',                                 options: ['Merging of nuclei', 'Splitting of a nucleus', 'Emission of electrons', 'Absorption of photons'], correctIndex: 1 },
  { level: 4, host: 'neutron',  question: 'The photoelectric effect was explained by?',               options: ['Newton', 'Einstein', 'Bohr', 'Heisenberg'],             correctIndex: 1 },

  // ── LEVEL 5 ──────────────────────────────────────────────────────────────
  { level: 5, host: 'electron', question: 'What is the Heisenberg Uncertainty Principle?',            options: ['Energy is quantized', 'Position & momentum cannot both be precise', 'Light has dual nature', 'Matter waves exist'], correctIndex: 1 },
  { level: 5, host: 'proton',   question: 'How many types of quarks are there?',                      options: ['2', '4', '6', '8'],                                    correctIndex: 2 },
  { level: 5, host: 'neutron',  question: 'What mediates the electromagnetic force?',                 options: ['Gluon', 'W boson', 'Z boson', 'Photon'],               correctIndex: 3 },
  { level: 5, host: 'electron', question: 'What is the de Broglie wavelength related to?',            options: ['Temperature', 'Momentum', 'Charge', 'Spin'],            correctIndex: 1 },
  { level: 5, host: 'proton',   question: 'Which experiment proved electrons have wave nature?',      options: ['Photoelectric effect', 'Double slit experiment', 'Gold foil experiment', 'Millikan oil drop'], correctIndex: 1 },

  // ── LEVEL 6 ──────────────────────────────────────────────────────────────
  { level: 6, host: 'neutron',  question: 'What is quantum entanglement?',                            options: ['Particle teleportation', 'Correlated states of separated particles', 'Particle tunnelling', 'Wave collapse'], correctIndex: 1 },
  { level: 6, host: 'electron', question: 'The Higgs boson gives particles what?',                    options: ['Charge', 'Spin', 'Mass', 'Color'],                      correctIndex: 2 },
  { level: 6, host: 'proton',   question: 'What is a lepton?',                                        options: ['Heavy quark', 'Particle unaffected by strong force', 'Type of meson', 'Antimatter particle'], correctIndex: 1 },
  { level: 6, host: 'neutron',  question: 'Which particle carries the strong nuclear force?',         options: ['Photon', 'Graviton', 'Gluon', 'W boson'],               correctIndex: 2 },
  { level: 6, host: 'electron', question: 'What is Schrödinger\'s equation used to find?',            options: ['Particle speed', 'Wave function of a quantum system', 'Electric field', 'Nuclear radius'], correctIndex: 1 },

  // ── LEVEL 7 ──────────────────────────────────────────────────────────────
  { level: 7, host: 'proton',   question: 'What is dark matter primarily detected through?',          options: ['Light emission', 'Gravitational effects', 'Magnetic fields', 'Radiation'],  correctIndex: 1 },
  { level: 7, host: 'neutron',  question: 'What is a neutrino?',                                      options: ['Heavy charged particle', 'Neutral lepton with tiny mass', 'Type of quark', 'Antiproton'], correctIndex: 1 },
  { level: 7, host: 'electron', question: 'Which symmetry is violated in weak interactions?',         options: ['Charge symmetry', 'Parity symmetry', 'Time symmetry', 'Lorentz symmetry'], correctIndex: 1 },
  { level: 7, host: 'proton',   question: 'What is quantum tunnelling?',                              options: ['Faster-than-light travel', 'Passing through a classically forbidden region', 'Electron jumping orbits', 'Nuclear fusion'], correctIndex: 1 },
  { level: 7, host: 'neutron',  question: 'What is the Standard Model of particle physics?',          options: ['Model of atom structure', 'Framework describing fundamental particles & forces', 'Quantum gravity theory', 'Model of the solar system'], correctIndex: 1 },

  // ── LEVEL 8 ──────────────────────────────────────────────────────────────
  { level: 8, host: 'electron', question: 'What is antiparticle of the electron?',                    options: ['Muon', 'Tau', 'Positron', 'Neutrino'],                  correctIndex: 2 },
  { level: 8, host: 'proton',   question: 'What does CPT symmetry stand for?',                        options: ['Charge-Position-Time', 'Charge-Parity-Time', 'Color-Parity-Temperature', 'Current-Phase-Tension'], correctIndex: 1 },
  { level: 8, host: 'neutron',  question: 'In quantum chromodynamics, quarks carry what?',            options: ['Electric charge', 'Magnetic moment', 'Color charge', 'Spin only'],           correctIndex: 2 },
  { level: 8, host: 'electron', question: 'What is Hawking radiation emitted by?',                    options: ['Neutron stars', 'Black holes', 'Pulsars', 'Quasars'],   correctIndex: 1 },
  { level: 8, host: 'proton',   question: 'What unifies electricity and magnetism?',                  options: ['Quantum mechanics', 'Electroweak theory', 'Maxwell\'s equations', 'String theory'], correctIndex: 2 },

  // ── LEVEL 9 ──────────────────────────────────────────────────────────────
  { level: 9, host: 'neutron',  question: 'What is the Casimir effect?',                              options: ['Gravitational lensing', 'Attractive force between uncharged plates in vacuum', 'Quantum tunnelling effect', 'Electromagnetic induction'], correctIndex: 1 },
  { level: 9, host: 'electron', question: 'What does the fine-structure constant approximately equal?', options: ['1/137', '1/100', '1/1000', '3.14'],                   correctIndex: 0 },
  { level: 9, host: 'proton',   question: 'What is string theory\'s fundamental object?',             options: ['Point particle', 'One-dimensional string', 'Membrane', 'Loop'],              correctIndex: 1 },
  { level: 9, host: 'neutron',  question: 'What breaks electroweak symmetry?',                        options: ['Strong force', 'Higgs mechanism', 'Parity violation', 'CPT violation'],      correctIndex: 1 },
  { level: 9, host: 'electron', question: 'What is quantum decoherence?',                             options: ['Loss of quantum coherence due to environment', 'Particle decay', 'Entanglement creation', 'Wave function amplification'], correctIndex: 0 },

  // ── LEVEL 10 ─────────────────────────────────────────────────────────────
  { level: 10, host: 'proton',   question: 'What is the holographic principle?',                      options: ['Light bending around mass', '3D reality encoded on 2D boundary', 'Reflection of quantum states', 'Graviton interaction'],    correctIndex: 1 },
  { level: 10, host: 'neutron',  question: 'What is loop quantum gravity attempting to quantize?',    options: ['Electromagnetism', 'Spacetime itself', 'Strong force', 'Dark energy'],       correctIndex: 1 },
  { level: 10, host: 'electron', question: 'What is the many-worlds interpretation of QM?',           options: ['Parallel universes for each measurement', 'Observer collapses wave function', 'Particles are waves', 'Information is conserved'], correctIndex: 0 },
  { level: 10, host: 'proton',   question: 'What is quantum chromodynamics (QCD)?',                   options: ['Theory of electron behaviour', 'Theory of strong force between quarks', 'Quantum theory of gravity', 'Theory of particle spin'], correctIndex: 1 },
  { level: 10, host: 'neutron',  question: 'What is the cosmological constant related to?',           options: ['Speed of light', 'Dark energy & accelerating expansion', 'Gravitational constant', 'Planck length'], correctIndex: 1 },
];
