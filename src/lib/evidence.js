export function fraudAssessment({ accountingIdentity, dataQuality, externalEvidence = [] }) {
  const hasValidatedCausalModel = externalEvidence.some(x => x.type === 'validated-fraud-model' && x.outOfSample === true);
  if (!hasValidatedCausalModel) return {
    probability: null,
    status: 'not-identifiable',
    label: 'Probabilidade de fraude não identificável com estes dados',
    rationale: 'Uma identidade contábil exata tem probabilidade 1 quando as categorias exaustivas são somadas corretamente; ela não é um evento aleatório independente. Totais agregados e correlações ecológicas não fornecem taxa-base, rótulos de fraude nem mecanismo causal para calcular P(fraude|dados).',
    identityResidual: accountingIdentity?.residual ?? null,
    qualityErrors: dataQuality?.errors ?? null,
    permittedOutputs: ['resíduo contábil', 'inconsistências de dados', 'sensibilidade a hipóteses', 'estatísticas descritivas e p-valores sob hipóteses declaradas'],
    prohibitedInterpretation: 'p-valor ou raridade sob um modelo não equivale à probabilidade de fraude.'
  };
  return { probability: null, status: 'requires-implementation', label: 'Modelo externo detectado; calibração específica necessária.' };
}
