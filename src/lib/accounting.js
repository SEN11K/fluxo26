export function accounting(first, second, finalists) {
  const [a, b] = finalists;
  const increaseA = second.candidates[a] - first.candidates[a];
  const increaseB = second.candidates[b] - first.candidates[b];
  const eliminatedVotes = Object.entries(first.candidates).filter(([name]) => !finalists.includes(name)).reduce((s, [, v]) => s + v, 0);
  const attendanceIncrease = second.attendance - first.attendance;
  const blankReduction = first.blankVotes - second.blankVotes;
  const nullReduction = first.nullVotes - second.nullVotes;
  const validIncrease = second.validVotes - first.validVotes;
  const finalistIncrease = increaseA + increaseB;
  const rhs = eliminatedVotes + attendanceIncrease + blankReduction + nullReduction;
  return {
    finalists: { [a]: { first: first.candidates[a], second: second.candidates[a], increase: increaseA }, [b]: { first: first.candidates[b], second: second.candidates[b], increase: increaseB } },
    finalistIncrease,
    eliminatedVotes,
    attendanceIncrease,
    abstentionChange: second.abstention - first.abstention,
    blankReduction,
    nullReduction,
    validIncrease,
    identity: { left: finalistIncrease, right: rhs, residual: finalistIncrease - rhs, holds: finalistIncrease === rhs },
    explanation: 'Identidade agregada: decorre da conservação das categorias contábeis. Não identifica trajetórias individuais nem constitui evidência autônoma de fraude.'
  };
}

export function municipalityDifferences(firstRows, secondRows, finalists) {
  const second = new Map(secondRows.map(r => [r.unitKey, r]));
  return firstRows.filter(r => second.has(r.unitKey)).map(a => {
    const b = second.get(a.unitKey);
    const eliminatedVotesFirst = Object.entries(a.candidates ?? {}).filter(([name]) => !finalists.includes(name)).reduce((s,[,v])=>s+v,0);
    const finalistIncrease = finalists.reduce((s,name)=>s+(b.candidates?.[name]??0)-(a.candidates?.[name]??0),0);
    const localRight = eliminatedVotesFirst + (b.attendance-a.attendance) + (a.blankVotes-b.blankVotes) + (a.nullVotes-b.nullVotes);
    return {
      unitKey: a.unitKey, uf: a.uf, municipalityCode: a.municipalityCode, municipalityName: a.municipalityName,
      eligibleFirst: a.eligible,
      eligibleChange: b.eligible - a.eligible,
      attendanceChange: b.attendance - a.attendance,
      abstentionChange: b.abstention - a.abstention,
      blankChange: b.blankVotes - a.blankVotes,
      nullChange: b.nullVotes - a.nullVotes,
      validChange: b.validVotes - a.validVotes,
      eliminatedVotesFirst,
      finalistIncrease,
      identityRight: localRight,
      identityResidual: finalistIncrease-localRight,
      identityHolds: finalistIncrease===localRight,
      eliminatedRatePer1000: a.eligible ? eliminatedVotesFirst/a.eligible*1000 : null,
      finalistIncreaseRatePer1000: a.eligible ? finalistIncrease/a.eligible*1000 : null,
      lulaChangeRatePer1000: a.eligible ? ((b.candidates?.[finalists[0]]??0)-(a.candidates?.[finalists[0]]??0))/a.eligible*1000 : null,
      flavioChangeRatePer1000: a.eligible ? ((b.candidates?.[finalists[1]]??0)-(a.candidates?.[finalists[1]]??0))/a.eligible*1000 : null,
      ...Object.fromEntries(finalists.map(name => [`${name}Change`, (b.candidates?.[name] ?? 0) - (a.candidates?.[name] ?? 0)]))
    };
  });
}
