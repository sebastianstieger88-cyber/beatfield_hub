import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
function extract(name){const start=source.indexOf(`function ${name}(`);const end=source.indexOf('\nfunction ',start+1);return source.slice(start,end);}
const context=vm.createContext({getBeatOutEntryForParticipantSession:()=>null,getAttendanceRecordForSessionParticipant:()=>null,getAttendanceStateFromRecord:()=> 'open'});
vm.runInContext(extract('getRosterAttendanceState')+'\n'+extract('getDropInPipelineMeta'),context);
test('single bookings distinguish present absent open for all providers',()=>{for(const provider of ['egym','hansefit','dropin']){for(const [status,expected] of [['teilgenommen','present'],['abwesend','absent'],['gebucht','open']]){assert.equal(context.getRosterAttendanceState({is_dropin:true,booking_provider:provider,drop_in_status:status},'session'),expected);}}});
test('absence keeps an accurate single booking label',()=>{assert.equal(context.getDropInPipelineMeta({status:'abwesend'}).label,'Abwesend');assert.equal(context.getDropInPipelineMeta({status:'teilgenommen'}).label,'Teilgenommen');assert.equal(context.getDropInPipelineMeta({status:'abgesagt'}).label,'Storniert');});
