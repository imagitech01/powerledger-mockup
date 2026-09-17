// Zichtbare thema-omschakeling — eis uit EXPERIENCE.md § Accessibility Floor:
// het systeemthema volgt de tijd van de dag, de fysieke lichtsituatie niet.
(function(){
  var K="powerledger-thema";
  try{var t=localStorage.getItem(K); if(t){document.documentElement.dataset.thema=t;}}catch(e){}
  window.wisselThema=function(){
    var h=document.documentElement;
    var nu=h.dataset.thema||(matchMedia("(prefers-color-scheme: dark)").matches?"donker":"licht");
    var nieuw=nu==="donker"?"licht":"donker";
    h.dataset.thema=nieuw;
    try{localStorage.setItem(K,nieuw);}catch(e){}
    document.querySelectorAll("[data-thema-knop]").forEach(function(b){
      b.textContent=nieuw==="donker"?"Licht":"Donker";
    });
  };
  // Beginlabel gelijkzetten met het werkelijke thema; anders belooft de knop het verkeerde.
  function labelSync(){
    var h=document.documentElement;
    var nu=h.dataset.thema||(matchMedia("(prefers-color-scheme: dark)").matches?"donker":"licht");
    var knoppen=document.querySelectorAll("[data-thema-knop]");
    for(var i=0;i<knoppen.length;i++){knoppen[i].textContent=nu==="donker"?"Licht":"Donker";}
  }
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",labelSync);}else{labelSync();}
})();
