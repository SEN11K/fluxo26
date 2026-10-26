const phi = (x, mean, sd) => Math.exp(-.5*((x-mean)/sd)**2)/(sd*Math.sqrt(2*Math.PI));
export function conditionalFraudProbability({ observedMargin, predictiveMean, predictiveSd, priorFraud, fraudShiftMean=0, fraudShiftSd }) {
  for (const [name,value] of Object.entries({observedMargin,predictiveMean,predictiveSd,priorFraud,fraudShiftMean,fraudShiftSd})) if(!Number.isFinite(value)) throw new Error(`${name} deve ser numérico.`);
  if(predictiveSd<=0||fraudShiftSd<=0)throw new Error('Desvios-padrão devem ser positivos.');
  if(priorFraud<=0||priorFraud>=1)throw new Error('A taxa-base deve estar entre 0 e 1, sem incluir os extremos.');
  const likelihoodNoFraud=phi(observedMargin,predictiveMean,predictiveSd);
  const likelihoodFraud=phi(observedMargin,predictiveMean+fraudShiftMean,Math.sqrt(predictiveSd**2+fraudShiftSd**2));
  const numerator=priorFraud*likelihoodFraud;
  return {posteriorFraud:numerator/(numerator+(1-priorFraud)*likelihoodNoFraud),likelihoodNoFraud,likelihoodFraud,likelihoodRatio:likelihoodFraud/likelihoodNoFraud,assumptions:{observedMargin,predictiveMean,predictiveSd,priorFraud,fraudShiftMean,fraudShiftSd},status:'conditional-on-user-premises',warning:'Este posterior é válido apenas sob a taxa-base, o modelo preditivo e o mecanismo de fraude informados. Sem validação externa, não é estimativa empírica da fraude real.',accountingIdentityContribution:0};
}
export function sensitivityGrid(input,{priors=[.001,.01,.05,.1],fraudShiftSds=[.5,1,2,4]}={}){return priors.flatMap(priorFraud=>fraudShiftSds.map(fraudShiftSd=>conditionalFraudProbability({...input,priorFraud,fraudShiftSd})));}
