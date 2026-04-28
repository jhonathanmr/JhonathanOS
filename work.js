import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let currentViewDate = new Date(); // Mes y año actual


// Usamos la misma instancia de DB
const db = getDatabase();

// Configuración de tus tarifas (Basado en tu Excel)
const WORK_CONFIG = {
    valorSerenata: 35000, 
    valorTransporte: 20000 
};

// --- RENDERIZADO DE LA VISTA ---
async function renderWork(container) {
    const mesNombre = currentViewDate.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
    
    container.innerHTML = `
    <div class="p-6 pb-32 animate-in fade-in duration-500">
        <header class="mb-6 flex justify-between items-center">
            <button onclick="changeMonth(-1)" class="bg-slate-100 p-3 rounded-2xl">◀</button>
            <div class="text-center">
                <h1 class="text-xl font-black italic uppercase">${mesNombre}</h1>
                <p class="text-[9px] font-bold text-slate-400">FINANZAS MARIACHI</p>
            </div>
            <button onclick="changeMonth(1)" class="bg-slate-100 p-3 rounded-2xl">▶</button>
        </header>

        <div class="mb-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
            <div class="relative z-10">
                <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Caja Disponible (Base $1.5M)</p>
                <h2 id="caja-disponible" class="text-3xl font-black italic">$ 1.500.000</h2>
                <div class="mt-4 h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div id="barra-progreso-caja" class="h-full bg-emerald-500 transition-all duration-1000" style="width: 0%"></div>
                </div>
                <div class="flex justify-between mt-2">
                    <p class="text-[8px] font-bold text-slate-500 uppercase">Progreso de cobro</p>
                    <p id="texto-faltante" class="text-[8px] font-bold text-emerald-400 uppercase italic"></p>
                </div>
            </div>
            <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full"></div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white border border-slate-100 rounded-[2rem] p-4 shadow-sm flex flex-col items-center">
                <p class="text-[8px] font-black uppercase text-slate-400">Serenatas Mes</p>
                <h2 id="total-qty-mes" class="text-xl font-black italic text-slate-800">0</h2>
            </div>
            <div class="bg-orange-50 border border-orange-100 rounded-[2rem] p-4 shadow-sm flex flex-col items-center">
                <p class="text-[8px] font-black uppercase text-orange-400">Por Cobrar</p>
                <h2 id="saldo-pendiente" class="text-xl font-black italic text-orange-600">$ 0</h2>
            </div>
            
            <div class="bg-slate-900 rounded-[2rem] p-5 text-white shadow-lg">
                <p class="text-[8px] font-black uppercase text-slate-400">1ra Quincena</p>
                <h2 id="q1-total" class="text-lg font-black italic">$ 0</h2>
            </div>
            <div class="bg-slate-900 rounded-[2rem] p-5 text-white shadow-lg">
                <p class="text-[8px] font-black uppercase text-slate-400">2da Quincena</p>
                <h2 id="q2-total" class="text-lg font-black italic">$ 0</h2>
            </div>
            <div class="col-span-2 bg-blue-600 rounded-[2rem] p-4 text-white flex justify-between items-center px-8 shadow-xl">
                <p class="text-[10px] font-black uppercase">Total Bruto Mes</p>
                <h2 id="month-total" class="text-2xl font-black italic">$ 0</h2>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-8">
            <button onclick="openWorkModal('ingreso')" class="bg-emerald-500 text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-transform">
                + Serenatas
            </button>
            <button onclick="openWorkModal('adelanto')" class="bg-orange-500 text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-transform">
                - Adelanto
            </button>
        </div>

        <div id="work-history-list" class="space-y-3 pb-10"></div>
    </div>
    `;

    loadWorkData();
}

// --- MODAL DE ENTRADA ---
window.openWorkModal = (tipo) => {
    // Si abrimos el modal normalmente (no desde edit), aseguramos que el ID sea null
    // Pero solo si no estamos ya en un proceso de edición (esto lo maneja editWorkEntry)
    
    const modal = document.getElementById('modal-container');
    const esIngreso = tipo === 'ingreso';
    const hoy = new Date().toISOString().split('T')[0];

    modal.innerHTML = `
        <div class="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl scale-in-center">
            <h3 class="text-xl font-black text-slate-900 mb-6 italic">
                ${currentEditId ? 'Editar Registro' : (esIngreso ? 'Nueva Jornada' : 'Registrar Adelanto')}
            </h3>
            
            <div class="space-y-4 mb-8">
                <div class="relative">
                    <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Fecha del Registro</label>
                    <input type="date" id="w-date" value="${hoy}" 
                        class="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-sm outline-none focus:ring-2 ring-blue-500 text-center">
                </div>

                ${esIngreso ? `
                    <div class="relative">
                        <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Cant. Serenatas</label>
                        <input type="tel" id="w-qty" inputmode="numeric" pattern="[0-9]*" placeholder="0" 
                            class="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-xl outline-none focus:ring-2 ring-emerald-500 text-center">
                    </div>
                    <div class="relative">
                        <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Extras / Transporte</label>
                        <input type="tel" id="w-extra" inputmode="numeric" pattern="[0-9]*" placeholder="0" 
                            oninput="formatCurrency(this)"
                            class="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-xl outline-none text-center">
                    </div>
                ` : `
                    <div class="relative">
                        <label class="text-[9px] font-black text-slate-400 uppercase ml-2">Monto del Adelanto</label>
                        <input type="tel" id="w-monto" inputmode="numeric" pattern="[0-9]*" placeholder="0" 
                            oninput="formatCurrency(this)"
                            class="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-xl outline-none focus:ring-2 ring-orange-500 text-center">
                        <button type="button" onclick="setFullPayment()" class="mt-2 w-full text-[8px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 py-2 rounded-xl">
                            Cobrar saldo total pendiente
                        </button>
                    </div>
                `}
                <input type="text" id="w-note" placeholder="Nota (opcional)" class="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-xs">
            </div>
            
            <div class="flex flex-col gap-3">
                <button onclick="saveWorkEntry('${tipo}')" class="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg">
                    ${currentEditId ? 'Actualizar Cambios' : 'Guardar Registro'}
                </button>
                <button onclick="closeModal()" class="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Cancelar</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

// --- FUNCIÓN PARA FORMATEAR MILES MIENTRAS ESCRIBES ---
window.formatCurrency = (input) => {
    // Quitamos cualquier cosa que no sea número
    let value = input.value.replace(/\D/g, "");
    
    // Formateamos con puntos de mil
    if (value !== "") {
        input.value = new Intl.NumberFormat('de-DE').format(value);
    }
};

// --- GUARDADO LIMPIANDO LOS PUNTOS ---
window.saveWorkEntry = async (tipo) => {
    let monto = 0;
    let desc = "";
    const limpiarPuntos = (val) => parseInt(val.toString().replace(/\./g, "")) || 0;

    if(tipo === 'ingreso') {
        const qty = parseInt(document.getElementById('w-qty').value) || 0;
        const extra = limpiarPuntos(document.getElementById('w-extra').value);
        monto = (qty * WORK_CONFIG.valorSerenata) + extra;
        desc = `${qty} Serenatas ${extra > 0 ? '+ Extras' : ''}`;
    } else {
        monto = limpiarPuntos(document.getElementById('w-monto').value);
        desc = "Adelanto / Pago";
    }

    const nota = document.getElementById('w-note').value;
    if(nota) desc += ` - ${nota}`;
    if(monto <= 0) return;

    const dateVal = document.getElementById('w-date').value;
    const selectedTimestamp = new Date(dateVal + "T12:00:00").getTime();

    // --- EL CAMBIO ESTÁ AQUÍ ---
    // Si es una edición, mantenemos el ID. 
    // Si es nuevo, creamos un ID que combina la fecha + un número aleatorio o la hora exacta
    const recordId = currentEditId || `${selectedTimestamp}_${Date.now()}`; 

    await set(ref(db, 'work_records/' + recordId), {
        tipo, 
        monto, 
        desc, 
        timestamp: selectedTimestamp 
    });

    closeModal();
    renderWork(document.getElementById('view-container'));
};

window.changeMonth = (delta) => {
    currentViewDate.setMonth(currentViewDate.getMonth() + delta);
    renderWork(document.getElementById('view-container'));
};

async function loadWorkData() {
    try {
        const snapshot = await get(child(ref(db), 'work_records'));
        const listDiv = document.getElementById('work-history-list');
        
        const BASE_CAJA = 1500000;
        let totalAdelantosGlobal = 0;
        let q1 = 0, q2 = 0, serenatasContador = 0, saldoPendienteGlobal = 0; 

        if (snapshot.exists()) {
            const allRecords = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));

            allRecords.forEach(reg => {
                const monto = parseInt(reg.monto);
                saldoPendienteGlobal += (reg.tipo === 'ingreso' ? monto : -monto);
                if (reg.tipo === 'adelanto') totalAdelantosGlobal += monto;
            });

            const filteredRecords = allRecords.filter(reg => {
                const d = new Date(reg.timestamp);
                return d.getMonth() === currentViewDate.getMonth() && 
                       d.getFullYear() === currentViewDate.getFullYear();
            }).sort((a, b) => b.timestamp - a.timestamp);

            listDiv.innerHTML = filteredRecords.map(reg => {
                const date = new Date(reg.timestamp);
                const dia = date.getDate();
                const diaSemana = date.toLocaleString('es-CO', { weekday: 'short' }).toUpperCase().replace('.', '');
                const monto = parseInt(reg.monto);
                const esIngreso = reg.tipo === 'ingreso';

                if (esIngreso) {
                    if (dia <= 15) q1 += monto;
                    else q2 += monto;
                    const match = reg.desc.match(/^(\d+)/);
                    if(match) serenatasContador += parseInt(match[1]);
                }

                return `
                    <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="bg-slate-50 h-10 w-10 rounded-xl flex flex-col items-center justify-center font-black text-slate-400">
                                <span class="text-[11px] leading-none">${dia}</span>
                                <span class="text-[7px]">${diaSemana}</span>
                            </div>
                            <div onclick="editWorkEntry('${reg.id}')" class="cursor-pointer"> <p class="font-bold text-slate-800 text-sm leading-tight">${reg.desc}</p>
                                <p class="text-[8px] font-black text-slate-300 uppercase">${dia <= 15 ? '1ra Quincena' : '2da Quincena'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <p class="${esIngreso ? 'text-emerald-500' : 'text-orange-600'} font-black italic text-sm">
                                ${esIngreso ? '+' : '-'}${monto.toLocaleString('de-DE')}
                            </p>
                            <button onclick="editWorkEntry('${reg.id}')" class="text-slate-300 hover:text-blue-500 ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // --- Lógica de la Barra y Caja ---
            const cupoMaximoActual = BASE_CAJA - totalAdelantosGlobal;
            const loQueHeGanado = saldoPendienteGlobal;
            let porcentajeProgreso = cupoMaximoActual > 0 ? Math.min(100, (loQueHeGanado / cupoMaximoActual) * 100) : 0;

            const cajaDispElem = document.getElementById('caja-disponible');
            const barraElem = document.getElementById('barra-progreso-caja');
            const textoFaltanteElem = document.getElementById('texto-faltante');

            if (cajaDispElem) cajaDispElem.innerText = `$ ${cupoMaximoActual.toLocaleString('de-DE')}`;
            
            if (barraElem) {
                barraElem.style.width = `${porcentajeProgreso}%`;
                if (porcentajeProgreso > 80) {
                    barraElem.classList.replace('bg-emerald-500', 'bg-blue-400');
                } else {
                    barraElem.classList.replace('bg-blue-400', 'bg-emerald-500');
                }
            }

            // Aquí integramos las líneas del faltante con lógica de excedente
            if (textoFaltanteElem) {
                const faltante = cupoMaximoActual - loQueHeGanado;
                if (faltante <= 0) {
                    textoFaltanteElem.innerText = "¡META ALCANZADA! 🌟";
                    textoFaltanteElem.classList.replace('text-emerald-400', 'text-blue-400');
                } else {
                    textoFaltanteElem.innerText = `Faltan $ ${faltante.toLocaleString('de-DE')}`;
                    textoFaltanteElem.classList.replace('text-blue-400', 'text-emerald-400');
                }
            }

            // --- Actualizar Totales ---
            document.getElementById('q1-total').innerText = `$ ${q1.toLocaleString('de-DE')}`;
            document.getElementById('q2-total').innerText = `$ ${q2.toLocaleString('de-DE')}`;
            document.getElementById('month-total').innerText = `$ ${(q1 + q2).toLocaleString('de-DE')}`;
            document.getElementById('total-qty-mes').innerText = serenatasContador;
            document.getElementById('saldo-pendiente').innerText = `$ ${saldoPendienteGlobal.toLocaleString('de-DE')}`;

        } else {
            listDiv.innerHTML = `<p class="text-center text-slate-400 text-xs py-10">No hay registros.</p>`;
        }
    } catch (e) { console.error("Error:", e); }
}

// Función auxiliar para no repetir código de actualización
function actualizarUI(q1, q2) {
    const totalMes = q1 + q2;
    document.getElementById('q1-total').innerText = `$ ${q1.toLocaleString('de-DE')}`;
    document.getElementById('q2-total').innerText = `$ ${q2.toLocaleString('de-DE')}`;
    document.getElementById('month-total').innerText = `$ ${totalMes.toLocaleString('de-DE')}`;
}

function setFullPayment() {
    const saldoTexto = document.getElementById('saldo-pendiente').innerText;
    const saldoNumerico = saldoTexto.replace(/[^0-9]/g, '');
    
    // CORRECCIÓN: Usar los IDs correctos 'w-monto' y 'w-note'
    const inputMonto = document.getElementById('w-monto'); 
    const inputNota = document.getElementById('w-note');

    if (inputMonto && parseInt(saldoNumerico) > 0) {
        inputMonto.value = new Intl.NumberFormat('de-DE').format(saldoNumerico);
        inputNota.value = "Cobro total de saldo pendiente";
        
        inputMonto.classList.add('ring-2', 'ring-orange-500');
        setTimeout(() => inputMonto.classList.remove('ring-2', 'ring-orange-500'), 1000);
    } else {
        alert("No tienes saldo pendiente por cobrar.");
    }
}

let currentEditId = null; // Variable global en work.js

window.editWorkEntry = async (id) => {
    currentEditId = id; // Seteamos el ID antes de abrir el modal
    const snapshot = await get(child(ref(db), `work_records/${id}`));
    if (!snapshot.exists()) return;
    
    const data = snapshot.val();
    window.openWorkModal(data.tipo); // Abrimos el modal
    
    setTimeout(() => {
        const fechaFormateada = new Date(data.timestamp).toISOString().split('T')[0];
        document.getElementById('w-date').value = fechaFormateada;
        
        const partesDesc = data.desc.split(' - ');
        if(partesDesc[1]) document.getElementById('w-note').value = partesDesc[1];
        
        if (data.tipo === 'ingreso') {
            const matchQty = data.desc.match(/^(\d+)/);
            if (matchQty) document.getElementById('w-qty').value = matchQty[1];
            const qty = matchQty ? parseInt(matchQty[1]) : 0;
            const extra = data.monto - (qty * WORK_CONFIG.valorSerenata);
            document.getElementById('w-extra').value = new Intl.NumberFormat('de-DE').format(extra);
        } else {
            document.getElementById('w-monto').value = new Intl.NumberFormat('de-DE').format(data.monto);
        }
    }, 50);
};

window.closeModal = () => {
    const modal = document.getElementById('modal-container');
    if(modal) modal.classList.add('hidden');
    currentEditId = null; // Limpiamos la variable global
};


// Exportar para que app.js pueda usarlo
window.renderWork = renderWork;
window.changeMonth = changeMonth;
window.openWorkModal = openWorkModal;
window.saveWorkEntry = saveWorkEntry;
window.formatCurrency = formatCurrency;
window.closeModal = closeModal; 
window.setFullPayment = setFullPayment;