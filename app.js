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
let entryDate=phoneNow();
let d=load();
let remaining=15;
let countdownTimer=null;
let countdownEnd=0;

const MONTHS_RU=[
  "января","февраля","марта","апреля","мая","июня",
  "июля","августа","сентября","октября","ноября","декабря"
];

function phoneNow(){
  // В Telegram WebView часовой пояс иногда отличается от часового пояса
  // самого телефона. Для этого приложения используем часовой пояс UTC+7,
  // в котором отображается время телефона пользователя.
  return new Date(Date.now()+7*60*60*1000);
}

function formatCurrentDate(date=phoneNow()){
  return `${date.getUTCDate()} ${MONTHS_RU[date.getUTCMonth()]} ${date.getUTCFullYear()} г.`;
}

function formatCurrentTime(date=phoneNow()){
  return `${String(date.getUTCHours()).padStart(2,"0")}:${String(date.getUTCMinutes()).padStart(2,"0")}`;
}

function priceForCount(count){
  const n=Math.max(1,Number(count)||1);
  // Заданные тарифные значения: 1 билет — 48 ₽, 2 билета — 98 ₽,
  // 10 билетов — 480 ₽. Для остальных количеств действует базовая
  // стоимость 48 ₽ за билет.
  if(n===2) return "98.00 ₽";
  if(n===10) return "480.00 ₽";
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
    remaining=Math.max(0,Math.ceil((countdownEnd-Date.now())/1000));
    render();
    if(remaining===0){
      clearInterval(countdownTimer);
      countdownTimer=null;
    }
  },100);
}

$("openEditor").onclick=()=>{
  fill();
  $("editor").classList.remove("hidden");
};

$("fCount").addEventListener("input", ()=>{
  const count=Math.max(1,Number($("fCount").value)||1);
  $("fPrice").value=priceForCount(count);
});

function refreshEntryDateTime(){
  const now=phoneNow();
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
  const now=phoneNow();
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

render();
startCountdown();
