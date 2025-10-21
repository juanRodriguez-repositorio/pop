const canvas = document.getElementById("game");
const container = document.querySelector(".container");
const ctx = canvas.getContext("2d");
const htmlPila1=document.getElementById("pila1");
const htmlPila2=document.getElementById("pila2");
const acumulativo1=document.getElementById("acumulativo1");
const acumulativo2=document.getElementById("acumulativo2");
const botonDesapilar1=document.querySelector(".desapilar-1");
const botonDesapilar2=document.querySelector(".desapilar-2");
const objetivo1=document.getElementById("aim-1");
const objetivo2=document.getElementById("aim-2");
const htmlPuntuacionActual=document.querySelector(".puntuacion-actual");
const botonRecoger=document.querySelector(".accion-recoger");
const elementosCola=document.querySelectorAll(".elemento-cola");
const botonApilarDesdeCola=document.querySelector(".accion-apilar");
const botonIniciarJuego=document.getElementById("btn-iniciar");
const modalInicio=document.querySelector(".modal-inicio");
const modalFinal=document.querySelector(".modal-final");
const botonReiniciarJuego=document.getElementById("btn-reiniciar");
const botonReiniciarJuegoDesdeUi=document.querySelector(".boton-reiniciar-ui");
const vidasContainer=document.querySelector(".vidas-container");
const puntajeGameOver=document.getElementById("texto-puntaje-game-over");
const maxPuntajeGameOver=document.getElementById("texto-max-puntaje-game-over");
const maxPuntajeUi=document.querySelector(".puntuacion-record");

 canvas.width = container.clientWidth * 0.7; // 70% del contenedor
 canvas.height = container.clientHeight; 

let isDragging = false;
let mousePos = { x: 0, y: 0 };

const sounds={
  shoot:new Audio("sonidos/shoot.mp3"),
  impact:new Audio("sonidos/impact.mp3"),
  pop:new Audio("sonidos/desapilar.mp3"),
  winPoints:new Audio("sonidos/winPoints.wav"),
  put:new Audio("sonidos/apilar.wav"),
  gameOver:new Audio("sonidos/gameOver.mp3"),
  winLife:new Audio("sonidos/nuevaVida.wav"),
  gameStart:new Audio("sonidos/comenzarJuego.wav")
}
//funciones para sonidos
function sonidoDisparar() {
  sounds.shoot.currentTime = 0;
  sounds.shoot.play();
}
function sonidoImpactar(){
  sounds.impact.currentTime=0;
  sounds.impact.play()
}
function sonidoDesapilar(){
  sounds.pop.currentTime=0;
  sounds.pop.play()
}
function sonidoGanarPuntos(){
  sounds.winPoints.currentTime=0;
  sounds.winPoints.play()
}
function sonidoApilar(){
  sounds.put.currentTime=0;
  sounds.put.play()
}
function sonidoGameOver(){
  sounds.gameOver.currentTime=0;
  sounds.gameOver.play()
}
function sonidoNuevaVida(){
  sounds.winLife.currentTime=0;
  sounds.winLife.play()
}
function sonidoComenzarJuego(){
  sounds.gameStart.currentTime=0;
  sounds.gameStart.play()
}

//
const cannon = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  baseLength: 120,
  length: 120,
  angle: -Math.PI / 2,
  power: 20,
  color: "gray",
  isSelected: false
};

const projectiles = [];
const bolas=[];
let maxPuntajeLocalStorage=localStorage.getItem("maxPuntaje");
let pilaSeleccionada=null;
let acumulativoParaVidas=0;
let puntuacionActual=0;
let explosiones = [];
let gameOver=false;
let intervaloVida;
let permitirRecoger=false;
let contadorCantidadRecogida=0;
let colaAuxiliar=[];
let setTimeoutRecoger;
botonRecoger.disabled=true;
botonApilarDesdeCola.disabled=true;
let corazones = Array.from(document.querySelectorAll('.vida'));
const Max_bolas=13;
let contadorBolasMuertas=0;
const coloresBolas = [
  "#007BFF", // azul
  "#00C851", // verde
  "#FF8800", // naranja
  "#FF4444", // rojo
  "#9933CC", // violeta
  "#E83E8C"  // cian
];
if (maxPuntajeLocalStorage === null) {
  maxPuntajeLocalStorage = 0; // valor inicial
  localStorage.setItem("maxPuntaje", maxPuntajeLocalStorage);
};
maxPuntajeUi.innerHTML=`<span>Puntuación récord: ${maxPuntajeLocalStorage}</span>`;
class Bola {
  constructor(x, y, r, valor, vx, vy) {
    this.x = x;       // posición en X
    this.y = y;       // posición en Y
    this.r = r;       // radio
    this.valor = valor; // número visible
    this.vx = vx;     // velocidad en X
    this.vy = vy;     // velocidad en Y
    this.viva = true; // indica si está activa o fue destruida
    this.color=coloresBolas[Math.floor(Math.random() * coloresBolas.length)];
  }

  mover() {
    this.x += this.vx;
    this.y += this.vy;
  }

  dibujar(ctx) {
    if (!this.viva) return;

    ctx.beginPath();
    ctx.arc(this.x,this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color; // color de la bola
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // número en el centro
    ctx.fillStyle = "white";
    ctx.font = `${this.r}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.valor, Math.round(this.x),Math.round(this.y));
  }

  // detección de colisión con un proyectil
  colisionaCon(proyectil) {
    const dx = this.x - proyectil.x;
    const dy = this.y - proyectil.y;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    return distancia < this.r + proyectil.r;
  }
};
class Pila {
  constructor(valor,elementoHTML,rellenoHtml,containerHtml,objetivo) {
    this.segmentos=[];
    this.acumulativo = 0;
    this.html = elementoHTML;
    this.relleno=rellenoHtml;
    this.valor=valor;
    this.container=containerHtml;
    this.sobrePasado=false;
    this.exedente=null;
    this.exedentes=[];
    this.viva=true;
    this.htmlObjetivo=objetivo;
  }

  push(valor,color) {
    if(!this.viva){
      return;
    }
    this.acumulativo += valor;
    if(this.sobrePasado){
      this.html.textContent = this.acumulativo;
      this.exedentes.push(valor);
      return;
    }
    if(this.acumulativo>this.valor){
      this.exedente=this.acumulativo-this.valor;
      this.sobrePasado=true;
    }
    const elementoHtml=document.createElement("DIV");
    elementoHtml.classList.add("div-relleno");

    // Guardar el nuevo segmento de color
    if(this.acumulativo===this.valor){
      puntuacionActual+=this.valor;
      acumulativoParaVidas+=this.valor;
      this.viva=false;
      htmlPuntuacionActual.innerHTML=`<span>Puntuación actual: ${puntuacionActual}</span>`
    }
    this.segmentos.push({elementoHtml,color,valorBola:valor});
    this.html.textContent = this.acumulativo;
    this.agregarElementoAlaPila();
    agregarVida();
  }

  pop() {
    if(!this.viva){
      return;
    }
    if(this.sobrePasado && this.exedente==(this.acumulativo-this.valor)){
      const valor = this.peek().valorBola;
      this.eliminarSegmentoDeLaPila(this.segmentos.pop());
      this.acumulativo -= valor;
      this.html.textContent = this.acumulativo;
      this.sobrePasado=false;
      return;

    }else if(this.sobrePasado){
      this.acumulativo -= this.exedentes.pop();
      sonidoDesapilar();
      this.html.textContent = this.acumulativo;
      return;
    }
    if (this.segmentos.length > 0) {
      const valor = this.peek().valorBola;
      this.eliminarSegmentoDeLaPila(this.segmentos.pop());
      this.acumulativo -= valor;
      this.html.textContent = this.acumulativo;
    }
  }
  peek(){
    return this.segmentos[this.segmentos.length-1]
  }

  agregarElementoAlaPila() {
    let porcentaje;
    const segmento=this.peek();
    const actualDiv=segmento.elementoHtml;
    actualDiv.style.backgroundColor = segmento.color;
    if(!this.sobrePasado){
     porcentaje = (segmento.valorBola / this.valor) * 100;
    }else{
      porcentaje=((segmento.valorBola-this.exedente)/this.valor)*100;
    }
    this.relleno.appendChild(actualDiv);
    actualDiv.addEventListener('transitionend', () => {
      if(gameOver){
        return;
      };
      if(!this.viva){
      this.resetPila();
      }
    }, { once: true });
    actualDiv.offsetHeight;
    actualDiv.style.height=`${porcentaje}%`;
  }
  eliminarSegmentoDeLaPila(segmento){
    segmento.elementoHtml.style.height="0px";
    setTimeout(()=>{
      segmento.elementoHtml.remove();
    },1000);
    sonidoDesapilar();
  }
  reiniciar(){
    this.segmentos.forEach(seg => seg.elementoHtml.remove());
    this.segmentos = [];
    this.acumulativo = 0;
    this.sobrePasado = false;
    this.exedente = null;
    this.exedentes = [];
    this.viva=true;
    // nuevo valor máximo
    this.valor = Math.floor(Math.random() * 30) + 20;
    this.html.textContent = "0";
    this.htmlObjetivo.textContent=`${this.valor}`;

    // volver al color normal
    this.relleno.style.backgroundColor = "transparent";
  }
  resetPila() {
  // animación de flash
  this.relleno.style.transition = "background-color 0.5s";
  this.relleno.style.backgroundColor = "#26d320"; // verde brillante
  setTimeout(() => {
    sonidoGanarPuntos();
    // limpiar segmentos
    this.segmentos.forEach(seg => seg.elementoHtml.remove());
    this.segmentos = [];

    // reset acumulativo y sobrepaso
    this.acumulativo = 0;
    this.sobrePasado = false;
    this.exedente = null;
    this.exedentes = [];
    this.viva=true;

    // nuevo valor máximo
    this.valor = Math.floor(Math.random() * 30) + 20;
    this.html.textContent = "0";
    this.htmlObjetivo.textContent=`${this.valor}`;

    // volver al color normal
    this.relleno.style.backgroundColor = "transparent";
  }, 500);
}
}
const pila1 = new Pila(30,acumulativo1,document.getElementById("pila1-barra"),htmlPila1,objetivo1);
const pila2 = new Pila(45,acumulativo2,document.getElementById("pila2-barra"),htmlPila2,objetivo2);
pilaSeleccionada=pila1;
objetivo1.style.color="#26d320ff";
htmlPila1.classList.add("pilaSelected");
botonDesapilar2.disabled=true;
pila1.acumulativo=0;
pila2.acumulativo=0;
class Explosion {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.particles = [];

    // crear pequeñas partículas
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1
      });
    }
  }

  update() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03; // desvanecer
    });
    // eliminar las que ya no se ven
    this.particles = this.particles.filter(p => p.alpha > 0);
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  getFinished() {
    return this.particles.length === 0;
  }
};
//funciones de aparicion de bolas 
function aparecerDesdeArriba() {
  const x = Math.random() * canvas.width;
  const y = -20; // justo fuera del borde superior
  const vx = (Math.random() - 0.5) * 4; // leve variación lateral
  const vy = Math.random() * 4 + 1; // baja hacia el canvas
  return { x, y, vx, vy };
}

function aparecerDesdeAbajo() {
  const x = Math.random() * canvas.width;
  const y = canvas.height + 20; // justo fuera del borde inferior
  const vx = (Math.random() - 0.5) * 4;
  const vy = -(Math.random() * 4 + 1); // sube hacia el canvas
  return { x, y, vx, vy };
}

function aparecerDesdeIzquierda() {
  const x = -20;
  const y = Math.random() * canvas.height;
  const vx = Math.random() * 4 + 1; // entra hacia la derecha
  const vy = (Math.random() - 0.5) * 4;
  return { x, y, vx, vy };
}
function aparecerDesdeDerecha() {
  const x = canvas.width + 20;
  const y = Math.random() * canvas.height;
  const vx = -(Math.random() * 4 + 1); // entra hacia la izquierda
  const vy = (Math.random() - 0.5) * 4;
  return { x, y, vx, vy };
}
function crearBolaAleatoria() {
  const lados = [
    aparecerDesdeArriba,
    aparecerDesdeAbajo,
    aparecerDesdeIzquierda,
    aparecerDesdeDerecha 
  ];

  const spawn = lados[Math.floor(Math.random() * lados.length)]();
  const r = 25;
  const valor = Math.floor(Math.random() * 10) + 1;
  const bola = new Bola(spawn.x, spawn.y,r,valor,spawn.vx, spawn.vy);
  bolas.push(bola);
}
//
//actualizar record
function actualizarMaxPuntaje(puntajeActual) {
  let maxPuntaje = parseInt(localStorage.getItem("maxPuntaje")) || 0;

  if (puntajeActual > maxPuntaje) {
    localStorage.setItem("maxPuntaje", puntajeActual);
    maxPuntajeLocalStorage=puntajeActual;
    maxPuntajeUi.innerHTML=`<span>Puntuación récord: ${maxPuntajeLocalStorage}</span>`;
  };
};
//
//comenzar juego
function agregarVida(){
  if(acumulativoParaVidas>40){
    if(corazones.length===7){
      const corazonParaEliminar=corazones.pop();
      corazonParaEliminar.remove();
    }
    const nuevaVida=document.createElement("DIV");
    nuevaVida.classList.add("vida");
    corazones.splice(corazones.length - 1, 0, nuevaVida);
    vidasContainer.insertBefore(nuevaVida,vidasContainer.lastElementChild);
    acumulativoParaVidas=0;
    sonidoNuevaVida()
  }
}
function perderCorazon() {
  // tomar el último corazón visible
  const ultimo = corazones.filter(c => !c.classList.contains('vida-perdida')).pop();
  if (!ultimo) {
    gameOver=true;
    modalFinal.classList.add("modal-final-visible");
    puntajeGameOver.textContent=`${puntuacionActual}`;
    actualizarMaxPuntaje(puntuacionActual);
    maxPuntajeGameOver.textContent=`${maxPuntajeLocalStorage}`;
    clearInterval(intervaloVida);
    sonidoGameOver();
    return;
  }

  // agregar clase para transición
  ultimo.classList.add('vida-perdida');

  // eliminar del DOM al finalizar la animación
  ultimo.addEventListener('transitionend', () => {
    ultimo.remove(); 
  }, { once: true });
}
function iniciarJuego(){
  setTimeoutRecoger=setTimeout(()=>{
    botonRecoger.disabled=false
  },60000);
  perderCorazon();
  intervaloVida=setInterval(perderCorazon, 15000);
  //
  // Crear algunas bolas con valores aleatorios
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 25;
    const valor = Math.floor(Math.random() * 10) + 1;
    const prevVx=Math.round((Math.random() - 0.5) * 6);
    const prevVy=Math.round((Math.random() - 0.5) * 6);
    const vx = prevVx==0?1:prevVx;
    const vy = prevVy==0?1:prevVy;
    bolas.push(new Bola(x, y, r, valor, vx, vy));
  };
  sonidoComenzarJuego()

}
function reiniciarJuego(){
  gameOver=false;
  acumulativoParaVidas=0;
  puntuacionActual=0;
  pila1.reiniciar();
  pila2.reiniciar();
  permitirRecoger=false;
  contadorCantidadRecogida=0;
  colaAuxiliar=[];
  botonRecoger.disabled=true;
  botonApilarDesdeCola.disabled=true;
  clearInterval(intervaloVida);
  insertarCorazones();
  setTimeout(()=>{perderCorazon()});
  intervaloVida=setInterval(perderCorazon, 15000);
  actualizarHtmlCola();
  htmlPuntuacionActual.innerHTML=`<span>Puntuación actual: 0</span>`;
  clearTimeout(setTimeoutRecoger);
  setTimeoutRecoger=setTimeout(()=>{
    botonRecoger.disabled=false
  },60000);
  sonidoComenzarJuego()
}
function insertarCorazones(){
  vidasContainer.innerHTML="";
  corazones=[];
  for(let i = 0;i<7;i++){
    const corazonDiv=document.createElement("DIV");
    corazonDiv.classList.add("vida");
    vidasContainer.appendChild(corazonDiv);
    corazones.push(corazonDiv);
  }
}
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function isClickOnBarrel(mx, my) {
  const dx = mx - cannon.x;
  const dy = my - cannon.y;

  // Rotamos las coordenadas inversamente al ángulo del cañón
  const cos = Math.cos(-cannon.angle);
  const sin = Math.sin(-cannon.angle);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  return localX > 0 && localX < cannon.length && Math.abs(localY) < 12;
}
function actualizarHtmlCola(){
 for(let i=0;i<4;i++){
  const elementoHtml=elementosCola[i];
  if(!colaAuxiliar[i]){
    elementoHtml.innerHTML="";
    elementoHtml.style.backgroundColor=`transparent`;
    continue;
  }
  elementoHtml.innerHTML=`<span>${colaAuxiliar[i].num}<span>`;
  elementoHtml.style.backgroundColor=`${colaAuxiliar[i].color}`
 }
}

//eventos
botonReiniciarJuegoDesdeUi.addEventListener("click",()=>{
  reiniciarJuego();
})

botonReiniciarJuego.addEventListener("click",()=>{
  modalFinal.classList.remove("modal-final-visible");
  reiniciarJuego();
})

botonIniciarJuego.addEventListener("click",()=>{
  modalInicio.classList.add("invisible");
  iniciarJuego();
})

botonApilarDesdeCola.addEventListener("click",()=>{
  const elemento=colaAuxiliar.shift();
  pilaSeleccionada.push(elemento.num,elemento.color);
  if(colaAuxiliar.length===0){
    botonApilarDesdeCola.disabled=true;
  };
  actualizarHtmlCola();
  sonidoApilar();
});

botonRecoger.addEventListener("click",()=>{
  if(contadorCantidadRecogida===4 && colaAuxiliar.length<4){
    permitirRecoger=true;
    contadorCantidadRecogida=colaAuxiliar.length
  }else if(contadorCantidadRecogida<4){
    permitirRecoger=true;
  }
  botonRecoger.disabled=true;
  setTimeout(()=>{
    botonRecoger.disabled=false
  },60000);
})

botonDesapilar1.addEventListener("click",()=>{
  if(pilaSeleccionada==pila1){
    pila1.pop()
  }
});
botonDesapilar2.addEventListener("click",()=>{
  if(pilaSeleccionada==pila2){
    pila2.pop()
  }
});

htmlPila1.addEventListener("click",()=>{
  if(!htmlPila1.classList.contains("pilaSelected")){
    htmlPila1.classList.add("pilaSelected");
    htmlPila2.classList.remove("pilaSelected");
    objetivo1.style.color="#26d320ff";
    objetivo2.style.color="rgb(113, 161, 117)";
    botonDesapilar2.disabled=true;
    botonDesapilar1.disabled=false;
    pilaSeleccionada=pila1;
  }
});

htmlPila2.addEventListener("click",()=>{
  if(!htmlPila2.classList.contains("pilaSelected")){
    htmlPila2.classList.add("pilaSelected");
    htmlPila1.classList.remove("pilaSelected");
    objetivo2.style.color="#26d320ff";
    objetivo1.style.color="rgb(113, 161, 117)";
    botonDesapilar2.disabled=false;
    botonDesapilar1.disabled=true;
    pilaSeleccionada=pila2;
  }
});

canvas.addEventListener("mousedown", (e) => {
  mousePos = getMousePos(e);
  const dist = distance(mousePos.x, mousePos.y, cannon.x, cannon.y);
  // Solo se activa si el clic ocurre cerca del cañón
  if (dist < 35 || isClickOnBarrel(mousePos.x, mousePos.y)) {
    isDragging = true;
    cannon.isSelected = true;
  }
});

canvas.addEventListener("mousemove", (e) => {
  mousePos = getMousePos(e);
  if (!isDragging) return;

  const dx = mousePos.x - cannon.x;
  const dy = mousePos.y - cannon.y;
  cannon.angle = Math.atan2(dy, dx);

  // Más cerca = más potencia
  const dragVector = distance(cannon.x, cannon.y, mousePos.x, mousePos.y);
  const cal=cannon.baseLength**2/dragVector;
  const dragPower =cal>cannon.baseLength*3?cannon.baseLength*3:cal<cannon.baseLength/3?cannon.baseLength/3:cal;
  cannon.length = dragVector>cannon.baseLength?cannon.baseLength:dragVector<cannon.baseLength/3?cannon.baseLength/3:dragVector; // visual de contracción
  cannon.power = dragPower * 2;
});

canvas.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  cannon.isSelected = false;

  // Disparar
  const vx = Math.cos(cannon.angle) * cannon.power * 0.05;
  const vy = Math.sin(cannon.angle) * cannon.power * 0.05;

  projectiles.push({
    x: cannon.x + Math.cos(cannon.angle) * cannon.length,
    y: cannon.y + Math.sin(cannon.angle) * cannon.length,
    vx,
    vy,
    r: 8
  });

  cannon.length = cannon.baseLength; // restaurar tamaño
  sonidoDisparar();
});
canvas.addEventListener("click", e => {
  if(!permitirRecoger){
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Buscar si hizo clic en alguna bola
  for (let i = 0; i < bolas.length; i++) {
    const b = bolas[i];
    const dist = Math.hypot(b.x - x, b.y - y);
    if (dist <= b.r) {
      // 💥 Explota la bola
      explosiones.push(new Explosion(b.x, b.y, b.color));
      sonidoImpactar();
      // eliminar la bola y el proyectil
      bolas.splice(i, 1);
      colaAuxiliar.push({num:b.valor,color:b.color});
      contadorCantidadRecogida++;
      if(contadorCantidadRecogida==4){
        permitirRecoger=false;
      }
      if(botonApilarDesdeCola.disabled){
        botonApilarDesdeCola.disabled=false;
      }
      contadorBolasMuertas++;
      actualizarHtmlCola();
      break;
    }
  }
});

function update() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;

    // Si la bola sale completamente del canvas, la eliminamos
    if (
      p.x < -p.r ||
      p.x > canvas.width + p.r ||
      p.y < -p.r ||
      p.y > canvas.height + p.r
    ) {
      projectiles.splice(i, 1);
    }
  }
   // Actualizar bolas
  for (let i = bolas.length - 1; i >= 0; i--) {
    const bola = bolas[i];
    bola.mover();

    // Eliminar bola si sale completamente del canvas
    if (
      bola.x < -bola.r ||
      bola.x > canvas.width + bola.r ||
      bola.y < -bola.r ||
      bola.y > canvas.height + bola.r
    ) {
      bolas.splice(i, 1);
      contadorBolasMuertas++
    }
  }

  for (let i =0; i<bolas.length; i++) {
    const b = bolas[i];
    for (let j =0; j < projectiles.length; j++) {
      const p = projectiles[j];
      if (b.colisionaCon(p)) {
        // Crear explosión
        explosiones.push(new Explosion(b.x, b.y, b.color));
        sonidoImpactar();
        // eliminar la bola y el proyectil
        bolas.splice(i, 1);
        contadorBolasMuertas++;
        projectiles.splice(j, 1);
        pilaSeleccionada.push(b.valor,b.color);
        break;
      }
    }
  }
  explosiones.forEach(e => e.update());
  explosiones = explosiones.filter(e => !e.getFinished());

  if(contadorBolasMuertas>5){
    for(let i=0;i<7;i++){
      if(!(bolas.length===Max_bolas)){
        crearBolaAleatoria()
      }else{
        break;
      }
    }
    contadorBolasMuertas=0
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  bolas.forEach(bola => {
    bola.dibujar(ctx);
  });

  // Cañón
  ctx.save();
  ctx.translate(cannon.x, cannon.y);
  ctx.rotate(cannon.angle);
  ctx.fillStyle = cannon.isSelected ? "lightgray" : cannon.color;
  ctx.fillRect(0, -12, cannon.length, 24);
  ctx.restore();

  // Base
  ctx.beginPath();
  ctx.arc(cannon.x, cannon.y, 35, 0, Math.PI * 2);
  ctx.fillStyle = "#555";
  ctx.fill();

  // Proyectiles
  ctx.fillStyle = "red";
  projectiles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  explosiones.forEach(e => e.draw(ctx));
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

// ✅ cambio: aseguramos que el canvas se redimensione correctamente
window.addEventListener("resize", () => {
  canvas.width = container.clientWidth * 0.7; // 70% del contenedor
  canvas.height = container.clientHeight;  
  cannon.x = canvas.width / 2;
  cannon.y = canvas.height - 100;
});