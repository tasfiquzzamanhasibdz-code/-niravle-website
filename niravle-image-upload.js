/* Upload optimization: preserve composition; animated GIF/SVG bypass conversion. */
window.niravlePrepareImage=async function(file,maxSide=1800){
if(!/^image\/(jpeg|png|webp)$/.test(file.type))return file;
const url=URL.createObjectURL(file);
try{const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=url});
const scale=Math.min(1,maxSide/Math.max(im.naturalWidth,im.naturalHeight));
if(scale===1&&file.size<250000)return file;
const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.naturalWidth*scale));canvas.height=Math.max(1,Math.round(im.naturalHeight*scale));
canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);
const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.84));
if(!blob||blob.size>=file.size)return file;
const ext=blob.type==='image/webp'?'webp':blob.type==='image/png'?'png':'jpg';
return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.'+ext,{type:blob.type});
}catch(e){console.warn('Image optimization skipped; uploading original.',e);return file;}finally{URL.revokeObjectURL(url);}
};
