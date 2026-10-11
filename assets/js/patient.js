'use strict';
(() => {
 const boxes=[...document.querySelectorAll('[data-consult-check]')];
 const status=document.querySelector('[data-checklist-status]');
 if(boxes.length && status){
  const update=()=>{const count=boxes.filter(box=>box.checked).length;status.textContent=count+' sur '+boxes.length+' repères cochés. Vous pouvez adapter cette liste à votre situation.';};
  boxes.forEach(box=>box.addEventListener('change',update));
  update();
 }
 document.querySelectorAll('[data-print-checklist]').forEach(button=>{
  button.hidden=false;
  button.addEventListener('click',()=>window.print());
 });
})();
