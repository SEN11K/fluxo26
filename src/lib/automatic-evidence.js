import { conditionalFraudProbability } from './bayes.js';

const sq=x=>x*x;
const phi=x=>Math.exp(-.5*x*x)/Math.sqrt(2*Math.PI);
const erf=x=>{const s=Math.sign(x),a=Math.abs(x),t=1/(1+.3275911*a);return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-a*a));};
const normalCdf=x=>.5*(1+erf(x/Math.sqrt(2)));

export function preparePolls(polls){return polls.map(p=>{const validTotal=p.lulaTotal+p.flavioTotal,margin=(p.lulaTotal-p.flavioTotal)/validTotal*100,sd=2*p.marginOfErrorPp/1.96;return {...p,lulaValid:p.lulaTotal/validTotal*100,flavioValid:p.flavioTotal/validTotal*100,marginPp:margin,samplingSdMarginPp:sd};});}

export function randomEffectsMeta(polls){const x=polls.map(p=>p.marginPp),v=polls.map(p=>sq(p.samplingSdMarginPp)),w=v.map(z=>1/z),sw=w.reduce((a,b)=>a+b,0),fixed=x.reduce((s,z,i)=>s+w[i]*z,0)/sw,q=x.reduce((s,z,i)=>s+w[i]*sq(z-fixed),0),c=sw-w.reduce((s,z)=>s+z*z,0)/sw,tau2=Math.max(0,(q-(x.length-1))/c),wr=v.map(z=>1/(z+tau2)),swr=wr.reduce((a,b)=>a+b,0),mean=x.reduce((s,z,i)=>s+wr[i]*z,0)/swr,se=Math.sqrt(1/swr);return {meanMarginPp:mean,metaSePp:se,tauPp:Math.sqrt(tau2),q,pollCount:x.length};}

export function automaticEvidence(pollConfig,observedMarginPp){const polls=preparePolls(pollConfig.polls),meta=randomEffectsMeta(polls),predictiveSd=Math.sqrt(sq(meta.metaSePp)+sq(meta.tauPp)+sq(pollConfig.historicalMarginErrorSdPp)),z=(observedMarginPp-meta.meanMarginPp)/predictiveSd,pTwoSided=2*(1-normalCdf(Math.abs(z)));
  const mechanism={fraudShiftMean:0,fraudShiftSd:4};
  const priors=[.001,.005,.01,.05,.1];
  const posteriorSensitivity=priors.map(priorFraud=>conditionalFraudProbability({observedMargin:observedMarginPp,predictiveMean:meta.meanMarginPp,predictiveSd,priorFraud,...mechanism}));
  const noFraudDensity=phi(z)/predictiveSd,shiftSd=Math.sqrt(sq(predictiveSd)+sq(mechanism.fraudShiftSd)),fraudDensity=phi((observedMarginPp-meta.meanMarginPp)/shiftSd)/shiftSd;
  return {generatedAt:new Date().toISOString(),pollSelectionRule:pollConfig.selectionRule,polls,meta,predictive:{meanMarginPp:meta.meanMarginPp,sdMarginPp:predictiveSd,historicalErrorSdPp:pollConfig.historicalMarginErrorSdPp,observedMarginPp,zScore:z,twoSidedTailProbability:pTwoSided},modelComparison:{conventionalDensity:noFraudDensity,broadUnmodeledShiftDensity:fraudDensity,bayesFactorShiftVsConventional:fraudDensity/noFraudDensity,mechanism,interpretation:'O modelo alternativo representa deslocamento agregado não explicado; não é específico de fraude e também inclui erro de pesquisa, mobilização tardia e mudança real de preferência.'},posteriorSensitivity,identification:{automaticInputs:['pesquisas','margens amostrais','heterogeneidade entre institutos','erro histórico','resultado observado'],notIdentified:['taxa-base de fraude','mecanismo específico','direção causal'],singleFraudProbability:null},warning:'Probabilidade de cauda mede surpresa sob o modelo preditivo; não é probabilidade de fraude.'};}
