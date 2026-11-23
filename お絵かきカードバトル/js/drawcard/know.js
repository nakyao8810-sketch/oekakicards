'use strict';
/* ---- 物ごとの知識を読む（中身は know_life.js / know_world.js / know_things.js）---- */
const RK_RESC={A:'atk1',G:'drAdj',D:'drSelf',C:'gaugeStart',P:'pierce',O:'drawOnDeath',K:'gaugeOnDeath',B:'burnOnDeath',L:'lifeOnDeath',H:'healEnd',R:'regen',T:'thorn',S:'lifeStart',Q:'haste'};
const RK_SPC={d:'drop',f:'flare',r:'raikou',b:'bloom',s:'starfall',n:'sanctuary',g:'gale',t:'tsunami',k:'reap',a:'aurora',x:'gigabolt'};
const RK_ELCODE={F:'fire',W:'water',E:'thunder',P:'forest',L:'light',D:'dark'};
const RK_KNOW={};
for(const part of RK_KNOW_SRC)for(const row of part.split('\n')){
  if(!row.includes('|'))continue;
  const[key,names,res,sp,kind,el,line]=row.split('|');
  RK_KNOW[key]={key,names:names.split(','),
    res:res.split(',').map(s=>({id:RK_RESC[s[0]],n:s.slice(1)})),
    sp:sp.split(',').map(s=>({id:RK_SPC[s[0]],n:s.slice(1)})),
    kind,el:RK_ELCODE[el],line};
}
// インクの色 → テーマの知識
const RK_INKTHEME={'赤':'fire','橙':'fire','黄':'elec','黄緑':'plant','緑':'plant','水色':'water','青':'water','紫':'ghost','茶':'rock','桃':'fluffy','肌':'fluffy','灰':'rock'};
