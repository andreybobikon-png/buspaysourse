const DEFAULTS={
  ticket:"1 551 773 539",
  carrier:"ИП Тагачаков В. Г.",
  route:"Спортзал - Академия биатлона",
  bus:"о119се124",
  count:1,
  tariff:"Полный",
  price:"48.00 ₽",
  date:"10 июня 2026 г.",
  time:"20:15"
};

const DEMO_DURATION_SECONDS=15;
const tg=window.Telegram?.WebApp;
if(tg){
  tg.ready();
  tg.expand();
  try{tg.setHeaderColor("#000000");tg.setBackgroundColor("#000000");}catch(e){}
}

const $=id=>document.getElementById(id);
let d=load();
let remaining=DEMO_DURATION_SECONDS;
let timerId=null;

function load(){
  try{return {...DEFAULTS,...JSON.parse(localStorage.getItem("buspay_pixel")||"{}")}}
  catch(e){return {...DEFAULTS}}
}
function render(){
  $("ticketNo").textContent=d.ticket;
  $("carrier").textContent=d.carrier;
  $("route").textContent=d.route;
  $("bus").textContent=d.bus;
  $("cost").textContent=`${d.count} шт., ${d.tariff}, ${d.price}`;
  $("date").textContent=d.date;
  $("time").textContent=d.time;
}
function renderTimer(){
  const mm=String(Math.floor(remaining/60)).padStart(2,"0");
  const ss=String(remaining%60).padStart(2,"0");
  const el=$("validity");
  el.textContent=remaining>0?`Демо действует: ${mm}:${ss}`:"Демо-время истекло";
  el.classList.toggle("expired",remaining===0);
}
function startTimer(){
  if(timerId!==null) clearInterval(timerId);
  remaining=DEMO_DURATION_SECONDS;
  renderTimer();
  timerId=setInterval(()=>{
    remaining=Math.max(0,remaining-1);
    renderTimer();
    if(remaining===0){
      clearInterval(timerId);
      timerId=null;
    }
  },1000);
}
function fill(){
  $("fTicket").value=d.ticket;
  $("fCarrier").value=d.carrier;
  $("fRoute").value=d.route;
  $("fBus").value=d.bus;
  $("fCount").value=d.count;
  $("fTariff").value=d.tariff;
  $("fPrice").value=d.price;
  $("fDate").value=d.date;
  $("fTime").value=d.time;
}
$("openEditor")?.addEventListener("click",()=>{fill();$("editor").classList.remove("hidden")});
$("cancel").addEventListener("click",()=>$("editor").classList.add("hidden"));
$("save").addEventListener("click",()=>{
  d={
    ticket:$("fTicket").value||DEFAULTS.ticket,
    carrier:$("fCarrier").value||DEFAULTS.carrier,
    route:$("fRoute").value||DEFAULTS.route,
    bus:$("fBus").value||DEFAULTS.bus,
    count:Math.max(1,Number($("fCount").value)||1),
    tariff:$("fTariff").value||DEFAULTS.tariff,
    price:$("fPrice").value||DEFAULTS.price,
    date:$("fDate").value||DEFAULTS.date,
    time:$("fTime").value||DEFAULTS.time
  };
  localStorage.setItem("buspay_pixel",JSON.stringify(d));
  render();
  $("editor").classList.add("hidden");
});
$("closeTicket").addEventListener("click",()=>tg?.close?.());
$("controlTab").addEventListener("click",()=>{
  $("ticketTab").classList.remove("selected");
  $("controlTab").classList.add("selected");
});
$("ticketTab").addEventListener("click",()=>{
  $("controlTab").classList.remove("selected");
  $("ticketTab").classList.add("selected");
});
render();
startTimer();
