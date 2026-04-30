import { db } from './app.js';
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { rutaAcademica } from './materias_data.js';

// ESTA FUNCIÓN SOLO LA USAS UNA VEZ PARA CARGAR TU EXCEL A FIREBASE
export async function inicializarBaseDeDatosEstudio() {
    try {
        await set(ref(db, 'academia/ruta'), rutaAcademica);
        console.log("✅ Ruta académica cargada con éxito");
    } catch (error) {
        console.error("❌ Error cargando ruta:", error);
    }
}


export async function renderStudy(container) {
    container.innerHTML = `
        <div class="p-6 pb-32">
            <h1 class="text-3xl font-black italic mb-6">STUDY <span class="text-blue-600">HUB</span></h1>
            
            <div id="stats-container" class="bg-slate-900 text-white p-6 rounded-[2.5rem] mb-8 shadow-xl">
                <p class="text-[10px] font-black text-blue-400 uppercase mb-2">Estado Académico</p>
                <div class="flex justify-between items-end mb-2">
                    <div class="text-4xl font-black" id="percent-txt">0%</div>
                    <div class="text-[10px] text-slate-400 uppercase font-bold" id="credits-txt">0 / 140 Créditos</div>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div id="progress-bar" class="bg-blue-500 h-full transition-all duration-1000" style="width: 0%"></div>
                </div>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h2 class="font-black uppercase text-xs tracking-widest text-slate-500">Cuatrimestre Actual (C1)</h2>
            </div>
            <div id="materias-list" class="space-y-3">
                </div>
        </div>
    `;
    
    // Llamamos a la función que trae los datos
    actualizarVistaEstudio();
}

async function actualizarVistaEstudio() {
    // Aquí irá la lógica para pintar las materias y el progreso
}