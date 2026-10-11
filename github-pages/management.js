// Deletions keep a bounded, durable undo history; uploaded images remain intact.
export function removeRecord(v,kind,id){
  const list=kind==='note'?v.notes:v.collections,index=list.findIndex(x=>x.id===id);
  if(index<0)throw Error('内容已不存在，请刷新后重试');
  const data=structuredClone(list[index]);
  const links=kind==='note'?v.collections.filter(c=>c.noteIds.includes(id)).map(c=>({id:c.id,index:c.noteIds.indexOf(id)})):[];
  list.splice(index,1);
  if(kind==='note')v.collections.forEach(c=>{c.noteIds=c.noteIds.filter(x=>x!==id);});
  v.undoHistory=[...(v.undoHistory||[]),{kind,data,index,links}].slice(-10);
}
export function restoreLast(v){
  const entry=v.undoHistory?.at(-1);if(!entry)throw Error('没有可撤销的删除');
  const list=entry.kind==='note'?v.notes:v.collections;
  if(list.some(x=>x.id===entry.data.id))throw Error('内容已经恢复');
  if(list.length>=(entry.kind==='note'?500:50))throw Error('容量已满，请先整理后再撤销');
  const data=structuredClone(entry.data);
  if(entry.kind==='collection')data.noteIds=data.noteIds.filter(id=>v.notes.some(n=>n.id===id));
  list.splice(Math.min(entry.index,list.length),0,data);
  if(entry.kind==='note')for(const link of entry.links){const c=v.collections.find(x=>x.id===link.id);if(c&&!c.noteIds.includes(data.id))c.noteIds.splice(Math.min(link.index,c.noteIds.length),0,data.id);}
  v.undoHistory.pop();return entry;
}
export function moveRecord(v,kind,id,target){
  const destination=v.collections.find(c=>c.id===target);
  if(target&&!destination)throw Error('目标合集已不存在');
  if(kind==='note'){
    if(!v.notes.some(n=>n.id===id))throw Error('记忆已不存在');
    v.collections.forEach(c=>{c.noteIds=c.noteIds.filter(n=>n!==id);});
    if(destination)destination.noteIds.push(id);
  }else{
    const source=v.collections.find(c=>c.id===id);
    if(!source||id===target)throw Error('请选择另一个合集');
    if(destination)destination.noteIds=[...new Set([...destination.noteIds,...source.noteIds])];
    source.noteIds=[];
  }
}
