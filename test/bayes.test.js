import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionalFraudProbability, sensitivityGrid } from '../src/lib/bayes.js';
test('posterior depende da taxa-base e do mecanismo',()=>{const base={observedMargin:3.57,predictiveMean:-1.8,predictiveSd:2.6,fraudShiftMean:0,fraudShiftSd:3};const low=conditionalFraudProbability({...base,priorFraud:.001});const high=conditionalFraudProbability({...base,priorFraud:.1});assert.ok(high.posteriorFraud>low.posteriorFraud);assert.equal(low.accountingIdentityContribution,0);assert.equal(sensitivityGrid(base).length,16);});
