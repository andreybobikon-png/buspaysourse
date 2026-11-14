const APP_VERSION="2026-11-14-8";

const DEFAULTS={
  validity:"Действует: 20 сек.",
  ticket:"1 551 773 539",
  carrier:"ИП Тагачаков В. Г.",
  route:"Спортзал - Академия биатлона",
  bus:"о119се124",
  count:1,
  tariff:"Полный",
  price:"48.00 ₽",
  date:"",
  time:""
};

const MONTHS_RU=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

const FIXED_QR_DATA="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUoAAAFKAQAAAABTUiuoAAAB8klEQVR4nO2aQY7bMAxFH2sBWdo3yFHkmw16pN7APopvYC8DyPhdSHaTybRIZhCPgJKrWHiLDxCkPqmYeDDGH4+S4KijjjrqqKOvRK1EwPrFDFgNlu24f7kAR59BoyRpBsZzApaTgEaSpFv0NQIcfQZdthKKU8DsfMmfZhaOEeDoAxHefQtSIP4KiOUIAY5+IVsGjRi7Jh0kwNFPoK2kAdDAasQZrAckpffoawQ4+jg6mplZB/Y2N7I+n67ZEh4hwNFHwu42T0sHcN8JffNUC2r9VkdmHUB7KaXWLz5vVYeOdpKGNpGHrjgFNADQ+rxVHRrn1WAJWJ/T04g4mTH6vVURujv4JkE7598azxcjDoKxB71SgKNPoOTdUpwbSXMjaBPEGXITjEoZ0fDtWh29yZbStjHcpqxyjXm26kC52tvGGTS0ieIttirz2qoMjbkJlrxJU9jaIfuwXIvW/xjdXEabyINxnE6l1MZsBlf3hNWgpc3tsR03IspdRpXon7fjnJ6BMn4xdmW/W41WR6/ejllOsrcrL9/4LqMadHfw3FiN9q4neiesEY1TQJrMym3VXtxlVIvq5zlhPeQr63gBjv4jdgcvyH/EWEJS2Q2uAQi+J6wG5UPfDuUGy88mfm9Vgt6/Hf8t/O3YUUcdddTR70d/AzT+Hq0MawNTAAAAAElFTkSuQmCC";

document.addEventListener("DOMContentLoaded",()=>{
  const tg=(window.Telegram&&window.Telegram.WebApp)||null;
  if(tg){
    try{tg.ready();}catch(e){}
    try{tg.expand();}catch(e){}
    try{tg.setHeaderColor("#000000");tg.setBackgroundColor("#000000");}catch(e){}
  }

  const $=id=>document.getElementById(id);
  let remaining=20;
  let countdownTimer=null;
  let countdownEnd=0;

  function formatCurrentDate(date=new Date()){
    return `${date.getDate()} ${MONTHS_RU[date.getMonth()]} ${date.getFullYear()} г.`;
  }
  function formatCurrentTime(date=new Date()){
    return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`;
  }
  function priceForCount(count){
    const n=Math.max(1,Number(count)||1);
    return `${(n*48).toFixed(2)} ₽`;
  }
  function nonEmpty(value,fallback){
    return typeof value==="string" && value.trim()!=="" ? value : fallback;
  }
  function load(){
    let saved={};
    try{
      saved=JSON.parse(localStorage.getItem("buspay_pixel")||"{}");
    }catch(e){}
    if(!saved || typeof saved!=="object") saved={};
    const now=new Date();
    const count=Math.max(1,Number(saved.count)||DEFAULTS.count);
    return {
      ...DEFAULTS,
      ticket:nonEmpty(saved.ticket,DEFAULTS.ticket),
      carrier:nonEmpty(saved.carrier,DEFAULTS.carrier),
      route:nonEmpty(saved.route,DEFAULTS.route),
      bus:nonEmpty(saved.bus,DEFAULTS.bus),
      count,
      tariff:nonEmpty(saved.tariff,DEFAULTS.tariff),
      price:priceForCount(count),
      validity:nonEmpty(saved.validity,DEFAULTS.validity),
      date:formatCurrentDate(now),
      time:formatCurrentTime(now)
    };
  }

  let d=load();

  function persist(){
    try{localStorage.setItem("buspay_pixel",JSON.stringify(d));}catch(e){}
  }

  function render(){
    $("validity").textContent=`Действует: ${remaining} сек.`;
    $("ticketNo").textContent=d.ticket;
    $("carrier").textContent=d.carrier;
    $("route").textContent=d.route;
    $("bus").textContent=d.bus;
    $("cost").textContent=`${d.count} шт., ${d.tariff}, ${priceForCount(d.count)}`;
    $("date").textContent=d.date;
    $("time").textContent=d.time;
  }

  function fill(){
    $("fValidity").value=d.validity||DEFAULTS.validity;
    $("fTicket").value=d.ticket;
    $("fCarrier").value=d.carrier;
    $("fRoute").value=d.route;
    $("fBus").value=d.bus;
    $("fCount").value=d.count;
    $("fTariff").value=d.tariff;
    $("fPrice").value=priceForCount(d.count);
    $("fDate").value=d.date;
    $("fTime").value=d.time;
  }

  function startCountdown(){
    if(countdownTimer) clearInterval(countdownTimer);
    remaining=20;
    countdownEnd=Date.now()+20000;
    render();
    countdownTimer=setInterval(()=>{
      const left=Math.ceil((countdownEnd-Date.now())/1000);
      if(left<=0){
        remaining=20;
        countdownEnd=Date.now()+20000;
      }else{
        remaining=left;
      }
      render();
    },200);
  }

  function refreshEntryDateTime(){
    const now=new Date();
    d.date=formatCurrentDate(now);
    d.time=formatCurrentTime(now);
    persist();
    render();
  }

  function showControl(){
    $("ticketDetails").classList.add("hidden");
    $("controlPanel").classList.remove("hidden");
    $("ticketTab").classList.remove("selected");
    $("ticketTab").classList.add("muted");
    $("controlTab").classList.add("selected");
    const qr=$("qrCode");
    if(qr && !qr.querySelector("img")){
      qr.innerHTML=`<img src="${FIXED_QR_DATA}" alt="Тестовый QR-код">`;
    }
  }

  function showTicket(){
    $("controlPanel").classList.add("hidden");
    $("ticketDetails").classList.remove("hidden");
    $("controlTab").classList.remove("selected");
    $("ticketTab").classList.remove("muted");
    $("ticketTab").classList.add("selected");
  }

  // Кнопка с тремя точками
  $("openEditor").addEventListener("click",e=>{
    e.preventDefault();
    e.stopPropagation();
    fill();
    $("editor").classList.remove("hidden");
  });

  $("fCount").addEventListener("input",()=>{
    const count=Math.max(1,Number($("fCount").value)||1);
    $("fPrice").value=priceForCount(count);
  });

  $("cancel").addEventListener("click",()=>{
    $("editor").classList.add("hidden");
  });

  $("save").addEventListener("click",()=>{
    const count=Math.max(1,Number($("fCount").value)||1);
    const oldDate=d.date;
    const oldTime=d.time;
    d={
      validity:$("fValidity").value.trim()||DEFAULTS.validity,
      ticket:$("fTicket").value.trim()||DEFAULTS.ticket,
      carrier:$("fCarrier").value.trim()||DEFAULTS.carrier,
      route:$("fRoute").value.trim()||DEFAULTS.route,
      bus:$("fBus").value.trim()||DEFAULTS.bus,
      count,
      tariff:$("fTariff").value.trim()||DEFAULTS.tariff,
      price:priceForCount(count),
      date:$("fDate").value.trim()||oldDate,
      time:$("fTime").value.trim()||oldTime
    };
    persist();
    $("editor").classList.add("hidden");
    render();
  });

  $("closeTicket").addEventListener("click",()=>{
    if(tg && typeof tg.close==="function"){
      try{tg.close();}catch(e){}
    }
  });

  $("ticketTab").addEventListener("click",showTicket);
  $("controlTab").addEventListener("click",showControl);

  function onAppVisible(){
    refreshEntryDateTime();
    startCountdown();
  }

  window.addEventListener("pageshow",onAppVisible);
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden) onAppVisible();
  });

  // Первый запуск: дата/время = момент открытия приложения.
  refreshEntryDateTime();
  startCountdown();
});
