/**
 * Plano pessoal — fonte única de verdade para metas e treino.
 * Alterar valores aqui reflete em todo o app.
 */

export const START_WEIGHT = 123.0;
export const TARGET_WEIGHT = 100.0;
/** Data-alvo em ISO local (YYYY-MM-DD). Evita o bug de fuso do Date em UTC. */
export const TARGET_DATE_ISO = '2027-01-31';

export const DAILY_TARGETS = Object.freeze({
  kcal: 2300,
  protein: 220,
  carb: 180,
  fat: 60,
  waterLiters: 4.0,
});

/** Índice 0 = segunda … 4 = sexta, 5 = fim de semana (descanso ativo). */
export const WORKOUT_SPLIT = Object.freeze([
  {
    day: 'SEGUNDA-FEIRA',
    focus: 'Peito & Tríceps',
    exercises: [
      { name: 'Supino Inclinado c/ Halteres', sets: '4x 10-12' },
      { name: 'Supino Reto (Barra ou Máquina)', sets: '4x 8-10' },
      { name: 'Crossover / Peck Deck', sets: '3x 12-15' },
      { name: 'Tríceps Pulley Corda', sets: '4x 12' },
      { name: 'Tríceps Testa ou Coice', sets: '3x 10' },
    ],
  },
  {
    day: 'TERÇA-FEIRA',
    focus: 'Costas & Bíceps',
    exercises: [
      { name: 'Puxada Alta Frontal', sets: '4x 10-12' },
      { name: 'Remada Curvada ou Remada Baixa', sets: '4x 8-10' },
      { name: 'Pulldown c/ Corda', sets: '3x 12-15' },
      { name: 'Rosca Direta (Barra W)', sets: '4x 10' },
      { name: 'Rosca Martelo c/ Halteres', sets: '3x 12' },
    ],
  },
  {
    day: 'QUARTA-FEIRA',
    focus: 'Pernas Completo',
    exercises: [
      { name: 'Leg Press 45º', sets: '4x 10-12' },
      { name: 'Cadeira Extensora', sets: '4x 12-15' },
      { name: 'Mesa Flexora', sets: '4x 12' },
      { name: 'Agachamento Hack ou Guiado', sets: '3x 10' },
      { name: 'Gêmeos em Pé (Panturrilhas)', sets: '5x 15' },
    ],
  },
  {
    day: 'QUINTA-FEIRA',
    focus: 'Ombros & Abdômen',
    exercises: [
      { name: 'Desenvolvimento c/ Halteres', sets: '4x 10' },
      { name: 'Elevação Lateral', sets: '5x 12-15' },
      { name: 'Crucifixo Invertido (Deltoide Post.)', sets: '4x 12' },
      { name: 'Abdominal Infra no Banco', sets: '4x 15' },
      { name: 'Prancha Abdominal', sets: '3x 45s' },
    ],
  },
  {
    day: 'SEXTA-FEIRA',
    focus: 'Braços Completo & Densidade',
    exercises: [
      { name: 'Super-série: Rosca Direta + Tríceps Testa', sets: '4x 10' },
      { name: 'Rosca Scott', sets: '3x 12' },
      { name: 'Tríceps Francês', sets: '3x 12' },
      { name: 'Elevação Lateral no Cobre', sets: '4x 15' },
      { name: 'Encolhimento Trapézio c/ Halteres', sets: '4x 12' },
    ],
  },
  {
    day: 'SÁBADO / DOMINGO',
    focus: 'Descanso Ativo & Regenerativo',
    exercises: [
      { name: 'Caminhada Leve ao Ar Livre', sets: '45-60 min' },
      { name: 'Mobilidade e Alongamentos', sets: '15 min' },
      { name: 'Hidratação Máxima', sets: '4.0 Litros' },
    ],
  },
]);
