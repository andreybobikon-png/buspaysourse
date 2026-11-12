const DEFAULTS={
  validity:"Действует: 14 сек.",
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

const tg=window.Telegram?.WebApp;
if(tg){
  tg.ready();
  tg.expand();
  try{tg.setHeaderColor("#000000");tg.setBackgroundColor("#000000");}catch(e){}
}

const $=id=>document.getElementById(id);
let d=load();

function load(){
  try{return {...DEFAULTS,...JSON.parse(localStorage.getItem("buspay_pixel")||"{}")}}
  catch(e){return {...DEFAULTS}}
}
function render(){
  $("validity").textContent=d.validity;
  $("ticketNo").textContent=d.ticket;
  $("carrier").textContent=d.carrier;
  $("route").textContent=d.route;
  $("bus").textContent=d.bus;
  $("cost").textContent=`${d.count} шт., ${d.tariff}, ${d.price}`;
  $("date").textContent=d.date;
  $("time").textContent=d.time;
}
function fill(){
  $("fValidity").value=d.validity;
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
$("openEditor").onclick=()=>{fill();$("editor").classList.remove("hidden")};
$("cancel").onclick=()=>$("editor").classList.add("hidden");
$("save").onclick=()=>{
  d={
    validity:$("fValidity").value||DEFAULTS.validity,
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
};
$("closeApp").onclick=()=>tg?.close?.();
$("closeTicket").onclick=()=>tg?.close?.();
render();
