export function bindImagePicker(form,current,upload){
  const input=form.querySelector("[data-photo-input]"),preview=form.querySelector("[data-photo-preview]"),error=form.querySelector("[data-photo-error]"),reset=form.querySelector("[data-photo-reset]");
  let file=null,objectUrl="",uploaded="",version=0,pending=false;
  const release=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl="";};
  const show=src=>{preview.hidden=!src;if(src)preview.src=src;else preview.removeAttribute("src");};
  show(current);
  input.onchange=async()=>{const selected=input.files[0];if(!selected)return;const revision=++version;error.textContent="";pending=true;
    try{if(!["image/jpeg","image/png","image/webp"].includes(selected.type))throw Error("请选择 JPG、PNG 或 WebP 图片");if(!selected.size||selected.size>5*1024*1024)throw Error("请选择 5MB 以内的图片");
      const url=URL.createObjectURL(selected),img=new Image();img.src=url;
      try{await img.decode();}catch{URL.revokeObjectURL(url);throw Error("这张图片无法读取，请换一张试试");}
      if(revision!==version){URL.revokeObjectURL(url);return;}release();objectUrl=url;file=selected;uploaded="";show(url);reset.hidden=false;
    }catch(e){if(revision===version){error.textContent=e.message;input.value="";}}
    finally{if(revision===version)pending=false;}
  };
  reset.onclick=()=>{version++;pending=false;release();file=null;uploaded="";input.value="";error.textContent="";reset.hidden=true;show(current);};
  return {async value(){if(pending)throw Error("正在读取图片，请稍候");if(!file)return current;input.disabled=true;reset.disabled=true;try{if(!uploaded)uploaded=(await upload(file)).image;return uploaded;}finally{input.disabled=false;reset.disabled=false;}},dispose(){version++;release();}};
}
