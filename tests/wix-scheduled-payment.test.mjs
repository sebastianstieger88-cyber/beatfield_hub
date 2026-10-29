import test from 'node:test';
import assert from 'node:assert/strict';
import { isPaidScheduledSinglePayment, normalizeWix } from '../lib/wix-server.js';
const order = {id:'11111111-1111-4111-8111-111111111111',planId:'22222222-2222-4222-8222-222222222222',wixPayOrderId:'33333333-3333-4333-8333-333333333333',updatedDate:'2026-10-29T10:00:00Z',startDate:'2099-11-11T10:00:00Z',type:'ONLINE',status:'PENDING',lastPaymentStatus:'PENDING',planPrice:'49',pricing:{singlePaymentForDuration:{count:4,unit:'WEEK'},prices:[{price:{subtotal:'49',total:'39.20',discount:'9.80'}}]}};
test('paid future online one-time orders import with coupon adjusted amount',()=>{
  assert.equal(isPaidScheduledSinglePayment(order),true);
  const result=normalizeWix('plan',order,{info:{name:{first:'Test',last:'Coach'}}});
  assert.equal(result.action,'upsert');
  assert.equal(result.paid_amount,39.2);
  assert.equal(isPaidScheduledSinglePayment({...order,wixPayOrderId:undefined}),true);
});
test('draft offline failed recurring trial and empty price schedules never qualify',()=>{
  for(const change of [{status:'DRAFT'},{status:'CANCELED'},{type:'OFFLINE'},{lastPaymentStatus:'FAILED'},{freeTrialDays:7},{startDate:'2020-01-01'}, {pricing:{...order.pricing,subscription:{}}},{pricing:{...order.pricing,prices:[{price:{total:'0',subtotal:'0',discount:'0'}}]}}]) assert.equal(isPaidScheduledSinglePayment({...order,...change}),false);
});
