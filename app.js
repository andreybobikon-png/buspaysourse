const DEFAULTS={
  validity:"Действует: 15 сек.",
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

const tg=window.Telegram?.WebApp;
if(tg){
  tg.ready();
  tg.expand();
  try{tg.setHeaderColor("#000000");tg.setBackgroundColor("#000000");}catch(e){}
}

const $=id=>document.getElementById(id);
let entryDate=new Date();
let d=load();
let remaining=15;
let countdownTimer=null;
let countdownEnd=0;
let controlVisible=false;
let qrInstance=null;

const FIXED_QR_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUoAAAFKAQAAAABTUiuoAAAB8klEQVR4nO2aQY7bMAxFH2sBWdo3yFHkmw16pN7APopvYC8DyPhdSHaTybRIZhCPgJKrWHiLDxCkPqmYeDDGH4+S4KijjjrqqKOvRK1EwPrFDFgNlu24f7kAR59BoyRpBsZzApaTgEaSpFv0NQIcfQZdthKKU8DsfMmfZhaOEeDoAxHefQtSIP4KiOUIAY5+IVsGjRi7Jh0kwNFPoK2kAdDAasQZrAckpffoawQ4+jg6mplZB/Y2N7I+n67ZEh4hwNFHwu42T0sHcN8JffNUC2r9VkdmHUB7KaXWLz5vVYeOdpKGNpGHrjgFNADQ+rxVHRrn1WAJWJ/T04g4mTH6vVURujv4JkE7598azxcjDoKxB71SgKNPoOTdUpwbSXMjaBPEGXITjEoZ0fDtWh29yZbStjHcpqxyjXm26kC52tvGGTS0ieIttirz2qoMjbkJlrxJU9jaIfuwXIvW/xjdXEabyINxnE6l1MZsBlf3hNWgpc3tsR03IspdRpXon7fjnJ6BMn4xdmW/W41WR6/ejllOsrcrL9/4LqMadHfw3FiN9q4neiesEY1TQJrMym3VXtxlVIvq5zlhPeQr63gBjv4jdgcvyH/EWEJS2Q2uAQi+J6wG5UPfDuUGy88mfm9Vgt6/Hf8t/O3YUUcdddTR70d/AzT+Hq0MawNTAAAAAElFTkSuQmCC";

function showControl(){
  controlVisible=true;
  $("ticketDetails").classList.add("hidden");
  $("controlPanel").classList.remove("hidden");
  $("ticketTab").classList.remove("selected");
  $("ticketTab").classList.add("muted");
  $("controlTab").classList.add("selected");

  // Один постоянный QR-код. Он никуда не ведёт и не требует
  // загрузки сторонней библиотеки для отображения.
  $("qrCode").innerHTML = `<img src="${FIXED_QR_DATA}" alt="QR-код">`;
  $("qrText").textContent = "";
}

function showTicket(){
  controlVisible=false;
  $("controlPanel").classList.add("hidden");
  $("ticketDetails").classList.remove("hidden");
  $("controlTab").classList.remove("selected");
  $("ticketTab").classList.add("selected");
}

const MONTHS_RU=[
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря"
];

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

function load(){
  try{
    const saved=JSON.parse(localStorage.getItem("buspay_pixel")||"{}");
    return {
      ...DEFAULTS,
      ...saved,
      ticket:saved.ticket||DEFAULTS.ticket,
      carrier:saved.carrier||DEFAULTS.carrier,
      route:saved.route||DEFAULTS.route,
      bus:saved.bus||DEFAULTS.bus,
      count:Math.max(1,Number(saved.count)||DEFAULTS.count),
      tariff:saved.tariff||DEFAULTS.tariff,
      price:priceForCount(Math.max(1,Number(saved.count)||DEFAULTS.count)),
      date:formatCurrentDate(entryDate),
      time:formatCurrentTime(entryDate)
    };
  }catch(e){
    return {...DEFAULTS};
  }
}

function render(){
  d.price=priceForCount(d.count);
  $("validity").textContent=`Действует: ${remaining} сек.`;
  $("ticketNo").textContent=d.ticket;
  $("carrier").textContent=d.carrier;
  $("route").textContent=d.route;
  $("bus").textContent=d.bus;
  $("cost").textContent=`${d.count} шт., ${d.tariff}, ${d.price}`;
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
  remaining=15;
  countdownEnd=Date.now()+15000;
  render();

  countdownTimer=setInterval(()=>{
    const secondsLeft=Math.max(0,Math.ceil((countdownEnd-Date.now())/1000));
    remaining=secondsLeft;
    render();
    if(secondsLeft===0){
      clearInterval(countdownTimer);
      countdownTimer=null;
    }
  },100);
}

// При повторном открытии/возврате в Mini App запускаем новый 15-секундный цикл.
document.addEventListener("visibilitychange", ()=>{
  if(!document.hidden && !countdownTimer) startCountdown();
});
window.addEventListener("pageshow", ()=>{
  if(!countdownTimer) startCountdown();
});

$("openEditor").onclick=()=>{
  fill();
  $("editor").classList.remove("hidden");
};

$("fCount").addEventListener("input", ()=>{
  const count=Math.max(1,Number($("fCount").value)||1);
  $("fPrice").value=priceForCount(count);
});

function refreshEntryDateTime(){
  const now=new Date();
  d.date=formatCurrentDate(now);
  d.time=formatCurrentTime(now);
  render();
}

window.addEventListener("pageshow", refreshEntryDateTime);
document.addEventListener("visibilitychange", ()=>{
  if(!document.hidden) refreshEntryDateTime();
});

$("cancel").onclick=()=>$("editor").classList.add("hidden");

$("save").onclick=()=>{
  const count=Math.max(1,Number($('fCount').value)||DEFAULTS.count);
  const now=new Date();
  d={
    validity:$('fValidity').value||DEFAULTS.validity,
    ticket:$('fTicket').value||DEFAULTS.ticket,
    carrier:$('fCarrier').value||DEFAULTS.carrier,
    route:$('fRoute').value||DEFAULTS.route,
    bus:$('fBus').value||DEFAULTS.bus,
    count:count,
    tariff:$('fTariff').value||DEFAULTS.tariff,
    price:priceForCount(count),
    date:formatCurrentDate(now),
    time:formatCurrentTime(now)
  };
  localStorage.setItem("buspay_pixel",JSON.stringify(d));
  $("editor").classList.add("hidden");
  render();
};

$("closeTicket").onclick=()=>tg?.close?.();
$("ticketTab").onclick=showTicket;
$("controlTab").onclick=showControl;

render();
startCountdown();
