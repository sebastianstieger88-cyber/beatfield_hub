export const defaults={halfway:true,ten:true,countdown:true,voice:false,vibration:false,start:true,finish:true,volume:85};
export class TimerAudio {
  constructor(settings){this.settings={...defaults,...settings};}
  async unlock(){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;this.context ||= new Audio();await this.context.resume();return this.context.state==='running';}
  play(type){const s=this.settings;const key=type.startsWith('count')?'countdown':{work:'start',rest:'start',ready:'start',finish:'finish'}[type]||type;if(s[key]===false)return;
    if(s.vibration&&navigator.vibrate)navigator.vibrate(type==='finish'?[150,70,150]:60);
    if(s.voice&&type.startsWith('count')&&globalThis.speechSynthesis){const u=new SpeechSynthesisUtterance({count3:'Three',count2:'Two',count1:'One'}[type]);u.lang='en-US';speechSynthesis.speak(u);}
    const ctx=this.context;if(!ctx||ctx.state!=='running')return;
    const pattern={halfway:[650],ten:[1050,1050],count3:[800],count2:[800],count1:[950],work:[1200,1600],rest:[450,350],ready:[550],finish:[1000,1250,1600]}[type]||[];
    pattern.forEach((frequency,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),at=ctx.currentTime+i*.19;o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(s.volume/100*.55,at+.01);g.gain.exponentialRampToValueAtTime(.001,at+.16);o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+.18);});
  }
}
