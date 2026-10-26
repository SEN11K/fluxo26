import { sum } from './utils.js';

export function quantiles(values, probabilities = [0,.01,.05,.25,.5,.75,.95,.99,1]) {
  const sorted = values.filter(Number.isFinite).sort((a,b)=>a-b);
  if (!sorted.length) return {};
  return Object.fromEntries(probabilities.map(p=>{const i=(sorted.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i),v=sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo);return [String(p),v]}));
}

export function pearson(x,y) {
  const pairs=x.map((v,i)=>[v,y[i]]).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b));
  if(pairs.length<3)return null;
  const mx=sum(pairs.map(p=>p[0]))/pairs.length,my=sum(pairs.map(p=>p[1]))/pairs.length;
  const num=sum(pairs.map(([a,b])=>(a-mx)*(b-my))),dx=Math.sqrt(sum(pairs.map(([a])=>(a-mx)**2))),dy=Math.sqrt(sum(pairs.map(([,b])=>(b-my)**2)));
  return dx&&dy?num/(dx*dy):null;
}

const median = values => {const a=[...values].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
export function robustOutliers(rows, field, threshold=5) {
  const values=rows.map(r=>r[field]).filter(Number.isFinite), med=median(values), mad=median(values.map(v=>Math.abs(v-med)))||1;
  return rows.map(r=>({...r,robustZ:.6745*(r[field]-med)/mad})).filter(r=>Math.abs(r.robustZ)>=threshold).sort((a,b)=>Math.abs(b.robustZ)-Math.abs(a.robustZ));
}

export function municipalStatistics(rows) {
  const fields=['attendanceChange','abstentionChange','blankChange','nullChange','validChange'];
  const distributions=Object.fromEntries(fields.map(f=>[f,quantiles(rows.map(r=>r[f]))]));
  const eliminated=rows.map(r=>r.eliminatedVotesFirst).filter(Number.isFinite);
  const lula=rows.map(r=>r.lulaChange),flavio=rows.map(r=>r.flavioChange);
  const residuals=rows.map(r=>r.identityResidual).filter(Number.isFinite);
  const correlations=eliminated.length===rows.length?{raw:{eliminatedVsLulaChange:pearson(eliminated,lula),eliminatedVsFlavioChange:pearson(eliminated,flavio)},ratesPer1000Eligible:{eliminatedVsFinalistIncrease:pearson(rows.map(r=>r.eliminatedRatePer1000),rows.map(r=>r.finalistIncreaseRatePer1000)),eliminatedVsLulaChange:pearson(rows.map(r=>r.eliminatedRatePer1000),rows.map(r=>r.lulaChangeRatePer1000)),eliminatedVsFlavioChange:pearson(rows.map(r=>r.eliminatedRatePer1000),rows.map(r=>r.flavioChangeRatePer1000))},warning:'Correlações brutas são dominadas pelo tamanho do município; taxas por mil reduzem, mas não eliminam, confundimento ecológico.'}:{status:'candidate-level municipal data required'};
  return { distributions, correlations, identityByUnit:{tested:residuals.length,exact:residuals.filter(x=>x===0).length,nonzero:residuals.filter(x=>x!==0).length,sumResiduals:sum(residuals),maxAbsoluteResidual:Math.max(0,...residuals.map(Math.abs))},outliers:robustOutliers(rows,'validChange').slice(0,100), ecologicalWarning:'Correlação entre municípios não prova transferência individual.' };
}
