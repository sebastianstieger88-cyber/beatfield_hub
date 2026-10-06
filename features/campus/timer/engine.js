export const TYPES = ['INTERVAL','TABATA','EMOM','AMRAP','FOR_TIME','CUSTOM'];
export function normalizeConfig(input = {}, nested = false) {
  const type = input.type || 'INTERVAL';
  if (!TYPES.includes(type) && !['TIMER','REST','CUSTOM_BLOCK'].includes(type)) throw Error('Ungültiger Workout-Typ');
  const number = (key, fallback, min, max) => {
    const value = Number(input[key] ?? fallback);
    if (!Number.isFinite(value) || value < min || value > max) throw Error(`${key}: Wert außerhalb des erlaubten Bereichs`);
    return value;
  };
  const c = {id: String(input.id || ''), name: String(input.name || type).slice(0,120), type,
    workDuration:number('workDuration',type==='TABATA'?20:45,1,86400),restDuration:number('restDuration',type==='TABATA'?10:15,0,86400),
    rounds:number('rounds',8,1,1000),sets:number('sets',1,1,100),setRest:number('setRest',60,0,86400),
    totalDuration:number('totalDuration',600,1,86400),timeCap:number('timeCap',0,0,86400),precount:number('precount',nested?0:10,0,30),
    exercises:Array.isArray(input.exercises)?input.exercises.map(String).slice(0,100):[], audioSettings:input.audioSettings || {}, blocks:[]};
  c.rounds=Math.floor(c.rounds); c.sets=Math.floor(c.sets);
  if(type==='CUSTOM') {
    if(nested || !Array.isArray(input.blocks) || !input.blocks.length || input.blocks.length>100) throw Error('Custom benötigt 1–100 Blöcke ohne verschachtelte Workouts');
    c.blocks=input.blocks.map(b=>normalizeConfig(b,true));
  }
  return c;
}
export function compileWorkout(input) {
  const c=normalizeConfig(input), phases=[];
  const add=(state,duration,round=1,set=1,blockIndex=0,config=c,label=state,countUp=false)=>phases.push({state,duration:duration*1000,round,set,blockIndex,label,countUp,type:config.type,rounds:config.rounds,sets:config.sets});
  if(c.precount) add('COUNTDOWN',c.precount,0,0,0,c,'GET READY');
  const compile=(w,b=0)=> {
    if(['INTERVAL','TABATA'].includes(w.type)) {
      for(let s=1;s<=w.sets;s++) for(let r=1;r<=w.rounds;r++) {
        add('WORK',w.workDuration,r,s,b,w,w.name);
        if(r<w.rounds && w.restDuration) add('REST',w.restDuration,r,s,b,w,'REST');
        if(r===w.rounds && s<w.sets && w.setRest) add('SET_REST',w.setRest,r,s,b,w,'SET REST');
      }
    } else if(w.type==='EMOM') {
      const minutes=Math.ceil(w.totalDuration/60);
      for(let r=1;r<=minutes;r++) { add('WORK',Math.min(60,w.totalDuration-(r-1)*60),r,1,b,{...w,rounds:minutes},w.exercises.length?w.exercises[(r-1)%w.exercises.length]:'EMOM'); }
    } else if(w.type==='FOR_TIME') add('WORK',w.timeCap||Infinity,1,1,b,w,w.name,true);
    else add(w.type==='REST'?'REST':'WORK',w.totalDuration,1,1,b,w,w.name);
  };
  if(c.type==='CUSTOM') c.blocks.forEach(compile); else compile(c);
  return {config:c,phases};
}
/** Timestamp-based engine. Clock injection makes background and drift behavior testable. */
export class TimerEngine {
  constructor(config,{clock=()=>Date.now(),onEvent=()=>{}}={}) {
    const compiled=compileWorkout(config); Object.assign(this,compiled);
    this.clock=clock;this.onEvent=onEvent;this.index=0;this.state='IDLE';this.fired=new Set();this.amrapRounds=0;this.elapsed=0;this.completed=false;
  }
  start() {if(this.state!=='IDLE')return; const now=this.clock();this.startedAt=now;this.enter(0,now);}
  emit(type,at=this.clock(),extra={}) {this.onEvent({type,at,...extra});}
  enter(index,at,emit=true) {
    this.index=index;this.fired.clear();
    if(index>=this.phases.length){this.state='FINISHED';this.completed=true;this.finishedAt=at;if(emit)this.emit('finish',at);return;}
    const p=this.phases[index];this.state=p.state;this.phaseStart=at;this.phaseEnd=at+p.duration;this.duration=p.duration;
    if(emit)this.emit(p.state==='COUNTDOWN'?'ready':p.state==='WORK'?'work':'rest',at);
  }
  tick(now=this.clock()) {
    if(['IDLE','PAUSED','FINISHED'].includes(this.state))return this.snapshot(now);
    // Catch up all expired phases without replaying stale audio after suspension.
    while(this.state!=='FINISHED' && now>=this.phaseEnd) this.enter(this.index+1,this.phaseEnd,now-this.phaseEnd<1000);
    if(this.state==='FINISHED')return this.snapshot(now);
    const p=this.phases[this.index],remaining=this.phaseEnd-now,elapsed=now-this.phaseStart;
    const cues=[];
    if(p.state==='WORK'&&!p.countUp&&Number.isFinite(this.duration))cues.push(['halfway',this.duration/2]);
    if(!p.countUp&&this.duration>=10000)cues.push(['ten',this.duration-10000]);
    for(let n=3;n>=1;n--) if(this.duration>=n*1000&&!p.countUp)cues.push([`count${n}`,this.duration-n*1000]);
    for(const [type,offset] of cues)if(elapsed>=offset&&!this.fired.has(type)){this.fired.add(type);const at=this.phaseStart+offset;if(now-at<1000)this.emit(type,at);}
    return this.snapshot(now);
  }
  snapshot(now=this.clock()) {const p=this.phases[this.index];const time=this.state==='PAUSED'?this.pausedAt:now;
    return {state:this.state,phase:p,next:this.phases[this.index+1],index:this.index,remaining:this.state==='FINISHED'?0:Math.max(0,this.phaseEnd-time),elapsed:Math.max(0,time-this.phaseStart),amrapRounds:this.amrapRounds,completed:this.completed};}
  pause(){if(['IDLE','PAUSED','FINISHED'].includes(this.state))return;this.tick();if(this.state==='FINISHED')return;this.previousState=this.state;this.pausedAt=this.clock();this.state='PAUSED';}
  resume(){if(this.state!=='PAUSED')return;const delta=this.clock()-this.pausedAt;this.phaseStart+=delta;this.phaseEnd+=delta;this.elapsed+=delta;this.state=this.previousState;}
  skip(){if(['IDLE','FINISHED'].includes(this.state))return;const paused=this.state==='PAUSED';if(paused)this.elapsed+=this.clock()-this.pausedAt;this.enter(this.index+1,this.clock(),!paused);if(paused&&this.state!=='FINISHED')this.pause();}
  adjust(seconds){if(['IDLE','FINISHED'].includes(this.state)||!Number.isFinite(this.duration))return;this.phaseEnd+=seconds*1000;this.duration=Math.max(0,this.phaseEnd-this.phaseStart);if(this.state!=='PAUSED')this.tick();}
  round(delta){this.amrapRounds=Math.max(0,this.amrapRounds+delta);}
  jumpRound(delta){if(['IDLE','FINISHED'].includes(this.state))return;const paused=this.state==='PAUSED';const current=this.phases[this.index];let i=this.index+delta;while(i>=0&&i<this.phases.length){const p=this.phases[i];if(p.state==='WORK'&&(p.round!==current.round||p.set!==current.set||p.blockIndex!==current.blockIndex)){if(paused)this.elapsed+=this.clock()-this.pausedAt;this.enter(i,this.clock(),!paused);if(paused)this.pause();return;}i+=delta;}}
  stop(){if(this.state==='IDLE'||this.state==='FINISHED')return;if(this.state==='PAUSED')this.elapsed+=this.clock()-this.pausedAt;this.finishedAt=this.clock();this.state='FINISHED';this.completed=false;this.emit('stopped');}
  finish(){if(this.state==='IDLE'||this.state==='FINISHED')return;if(this.phases[this.index]?.countUp&&this.index<this.phases.length-1)this.skip();else{this.finishedAt=this.clock();this.state='FINISHED';this.completed=true;this.emit('finish');}}
  serialize(){return {version:1,config:this.config,index:this.index,state:this.state,previousState:this.previousState,phaseStart:this.phaseStart,phaseEnd:Number.isFinite(this.phaseEnd)?this.phaseEnd:null,duration:Number.isFinite(this.duration)?this.duration:null,pausedAt:this.pausedAt,startedAt:this.startedAt,finishedAt:this.finishedAt,elapsed:this.elapsed,amrapRounds:this.amrapRounds,completed:this.completed,fired:[...this.fired]};}
  static restore(data,options={}){if(data.version!==1)throw Error('Unbekannter Speicherstand');const e=new TimerEngine(data.config,options);for(const k of ['index','state','previousState','phaseStart','pausedAt','startedAt','finishedAt','elapsed','amrapRounds','completed'])e[k]=data[k];e.phaseEnd=data.phaseEnd??Infinity;e.duration=data.duration??Infinity;e.fired=new Set(data.fired||[]);if(!Number.isInteger(e.index)||e.index<0||e.index>e.phases.length)throw Error('Ungültiger Speicherstand');e.tick();return e;}
}
export const quickStarts=[...[ [45,15,8],[50,10,10],[60,20,8],[20,10,8] ].map(([workDuration,restDuration,rounds],i)=>normalizeConfig({id:`quick-${i}`,name:i===3?'TABATA CLASSIC':`${workDuration} / ${restDuration} × ${rounds}`,type:i===3?'TABATA':'INTERVAL',workDuration,restDuration,rounds})),normalizeConfig({id:'quick-emom',name:'EMOM 10',type:'EMOM',totalDuration:600}),...[12,20].map(m=>normalizeConfig({id:`quick-amrap-${m}`,name:`AMRAP ${m}`,type:'AMRAP',totalDuration:m*60}))];
