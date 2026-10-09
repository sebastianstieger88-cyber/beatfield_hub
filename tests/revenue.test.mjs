import test from 'node:test';
import assert from 'node:assert/strict';
import { paidAmount, packageRevenue, wixPaidAmount } from '../lib/revenue.js';
test('missing amounts differ from free voucher purchases', () => {
  for (const value of [null, undefined, '', ' ', false, -1, 'bad']) assert.equal(paidAmount(value), null);
  assert.equal(packageRevenue({paid_amount:null},49),49);
  assert.equal(packageRevenue({paid_amount:0},49),0);
  assert.equal(packageRevenue({paid_amount:'39.20'},49),39.2);
});
test('Wix totals include voucher discount without subtracting twice', () => {
  assert.equal(wixPaidAmount({pricing:{prices:[{price:{total:'39.20',discount:'9.80'}}]}}),39.2);
  assert.equal(wixPaidAmount({pricing:{prices:[{price:{total:'0'}}]}}),0);
  assert.equal(wixPaidAmount({priceDetails:{total:'79'}}),79);
  assert.equal(wixPaidAmount({pricing:{prices:[{},{}]}}),null);
  assert.equal(wixPaidAmount({planPrice:'49',lastPaymentStatus:'PENDING',pricing:{prices:[{price:{total:'0.00',subtotal:'0.00',discount:'0'}}]}}),null);
  assert.equal(wixPaidAmount({planPrice:'49',pricing:{prices:[{price:{total:'0',subtotal:'49',discount:'49'}}]}}),0);
});
