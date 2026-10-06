/** Local coach data is scoped to the existing authenticated user. */
export class TimerStorage {
 constructor(userId){this.prefix=`beatfield-timer-v1:${userId}:`;this.available=true;}
 get(key,fallback){try{return JSON.parse(localStorage.getItem(this.prefix+key))??fallback;}catch{return fallback;}}
 set(key,value){try{localStorage.setItem(this.prefix+key,JSON.stringify(value));return true;}catch{this.available=false;return false;}}
 remove(key){try{localStorage.removeItem(this.prefix+key);}catch{this.available=false;}}
}
export class PresetService {
 constructor(client){this.client=client;}
 async list(){const {data,error}=await this.client.from('workout_timer_presets').select('id,name,config').order('name');if(error)throw error;return data.map(row=>({...row.config,id:row.id,name:row.name}));}
 async save(config,id){const row={name:config.name,config};const query=id?this.client.from('workout_timer_presets').update(row).eq('id',id):this.client.from('workout_timer_presets').insert(row);const {error}=await query.select('id').single();if(error)throw error;}
 async remove(id){const {error}=await this.client.from('workout_timer_presets').delete().eq('id',id);if(error)throw error;}
}
