import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { paidAmount, packageRevenue } from '../lib/revenue.js';
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
test('Season revenue renders populated bookings and vouchers without interrupting initialization', () => {
  const start = source.indexOf('  function renderActualRevenue()');
  const end = source.indexOf("  document.querySelector('#revenueSeasonSelect')?.addEventListener", start);
  const cards = {}, breakdown = {};
  const context = {
    document: {querySelector: id => ({'#revenueSeasonSelect':{value:'halloween'}, '#revenueCards':cards, '#revenueBreakdown':breakdown})[id]},
    state: {seasons:[{id:'halloween',name:'Halloween'}], seasonBookings:[
      {season_id:'halloween',package_type:'1x TRAIN',paid_amount:39.2},
      {season_id:'halloween',package_type:'1x TRAIN',paid_amount:0},
      {season_id:'halloween',package_type:'2x BEAT',paid_amount:null},
    ], sessions:[],dropInBookings:[]},
    paidAmount, bookingPackageRevenue: packageRevenue,
    euro: value => value.toFixed(2), escape: value => String(value),
  };
  vm.runInNewContext(source.slice(start,end)+'\nrenderActualRevenue();',context);
  assert.match(cards.innerHTML,/118.20/);
  assert.match(breakdown.innerHTML,/2 rabattiert/);
  assert.match(breakdown.innerHTML,/Vorläufig/);
});
