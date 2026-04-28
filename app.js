import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const SESSION_TIMEOUT_MINS = 120;

// Agregamos una validación simple para evitar errores de "undefined"
if (!window.firebaseConfig) {
    console.error("Firebase Config no encontrada. Revisa el orden de los scripts en el HTML.");
}

const app = initializeApp(window.firebaseConfig);
const db = getDatabase(app);
// 1. Datos de tu Rutina
const USER_DATA = {
    currentWeek: parseInt(localStorage.getItem('gym_current_week')) || 1,
    totalWeeks: 12,
    // Definimos los rangos para saber qué nombre toca
    mesocycles: [
        { name: "Acondicionamiento", start: 1, end: 4 },
        { name: "Explosivo", start: 5, end: 8 },
        { name: "Negativo", start: 9, end: 11 },
        { name: "Descarga Parcial", start: 12, end: 12 }
    ],
    getMesocycleName: function(w) {
        const meso = this.mesocycles.find(m => w >= m.start && w <= m.end);
        return meso ? meso.name : "Mantenimiento";
    },
    routine: {
        "Monday": {
            name: "Chest, Shoulder & Triceps",
            focus: "Mechanical Tension",
            exercises: [
                { id: "m1", name: "Flat Bench Press", sets: 5, goal: "5-10 reps" },
                { id: "m2", name: "Incline Bench Press", sets: 5, goal: "5-10 reps" },
                { id: "m3", name: "Chest Flyes", sets: 4, goal: "10-12 reps" },
                { id: "m4", name: "Dips", sets: 4, goal: "Failure" },
                { id: "m5", name: "Military Press", sets: 4, goal: "8-10 reps" },
                { id: "m6", name: "Lateral Raises", sets: 4, goal: "12-15 reps" },
                { id: "m7", name: "Facepulls", sets: 4, goal: "15 reps" },
                { id: "m8", name: "Tricep Extension", sets: 4, goal: "12 reps" }
            ]
        },
        "Tuesday": {
            name: "Back & Biceps + HIIT",
            focus: "Mechanical Tension",
            exercises: [
                { id: "t1", name: "Wide Grip Pull-up/Down", sets: 4, goal: "8-10 reps" },
                { id: "t2", name: "Close Grip Row", sets: 4, goal: "8-10 reps" },
                { id: "t3", name: "Machine Row", sets: 4, goal: "10 reps" },
                { id: "t4", name: "Alternating Row", sets: 4, goal: "10 reps per arm" },
                { id: "t5", name: "Dumbbell Curls", sets: 4, goal: "10-12 reps" },
                { id: "t6", name: "Cable Curls", sets: 4, goal: "12 reps" },
                { id: "t7", name: "Shrugs (Trapecio)", sets: 4, goal: "15 reps" },
                { id: "t8", name: "HIIT Session", sets: 1, goal: "15-20 min" }
            ]
        },
        "Wednesday": {
            name: "Full Leg + HIIT",
            focus: "Mechanical Tension",
            exercises: [
                { id: "w1", name: "Squats", sets: 5, goal: "6-8 reps" },
                { id: "w2", name: "Deadlift", sets: 4, goal: "5 reps" },
                { id: "w3", name: "Leg Press", sets: 4, goal: "10-12 reps" },
                { id: "w4", name: "Leg Extension", sets: 4, goal: "12-15 reps" },
                { id: "w5", name: "Leg Curl", sets: 4, goal: "12-15 reps" },
                { id: "w6", name: "Calf Raises", sets: 5, goal: "15-20 reps" },
                { id: "w7", name: "HIIT Session", sets: 1, goal: "15 min" }
            ]
        },
        "Thursday": {
            name: "Chest, Shoulder & Triceps",
            focus: "Metabolic Stress",
            exercises: [
                { id: "th1", name: "Flat Bench Press", sets: 4, goal: "15-20 reps" },
                { id: "th2", name: "Incline Bench Press", sets: 4, goal: "15-20 reps" },
                { id: "th3", name: "Chest Flyes", sets: 4, goal: "20 reps" },
                { id: "th4", name: "Dips", sets: 3, goal: "Failure" },
                { id: "th5", name: "Military Press", sets: 4, goal: "15 reps" },
                { id: "th6", name: "Lateral Raises", sets: 4, goal: "20 reps" },
                { id: "th7", name: "Facepulls", sets: 4, goal: "20 reps" },
                { id: "th8", name: "Tricep Extension", sets: 4, goal: "20 reps" }
            ]
        },
        "Friday": {
            name: "Back & Biceps + HIIT",
            focus: "Metabolic Stress",
            exercises: [
                { id: "f1", name: "Wide Grip Pull-down", sets: 4, goal: "15-20 reps" },
                { id: "f2", name: "Close Grip Row", sets: 4, goal: "15-20 reps" },
                { id: "f3", name: "Machine Row", sets: 4, goal: "20 reps" },
                { id: "f4", name: "Alternating Row", sets: 4, goal: "15 reps" },
                { id: "f5", name: "Dumbbell Curls", sets: 4, goal: "15-20 reps" },
                { id: "f6", name: "Cable Curls", sets: 4, goal: "20 reps" },
                { id: "f7", name: "Shrugs", sets: 4, goal: "20 reps" },
                { id: "f8", name: "HIIT Session", sets: 1, goal: "20 min" }
            ]
        },
        "Saturday": {
            name: "Full Leg + HIIT",
            focus: "Metabolic Stress",
            exercises: [
                { id: "s1", name: "Squats", sets: 4, goal: "15-20 reps" },
                { id: "s2", name: "Deadlift", sets: 3, goal: "12 reps" },
                { id: "s3", name: "Leg Press", sets: 4, goal: "20 reps" },
                { id: "s4", name: "Leg Extension", sets: 4, goal: "20 reps" },
                { id: "s5", name: "Leg Curl", sets: 4, goal: "20 reps" },
                { id: "s6", name: "Calf Raises", sets: 4, goal: "25 reps" },
                { id: "s7", name: "HIIT Session", sets: 1, goal: "20 min" }
            ]
        }
    }
};

window.updateWeek = (incremento) => {
    const nuevaSemana = USER_DATA.currentWeek + incremento;
    if (nuevaSemana > 0 && nuevaSemana <= USER_DATA.totalWeeks) {
        USER_DATA.currentWeek = nuevaSemana;
        localStorage.setItem('gym_current_week', nuevaSemana); // Guarda en el navegador
        showView('gym'); // Refresca la vista
    }
};

// 2. Sistema de Navegación
function showView(view) {
    const container = document.getElementById('view-container');
    
    // Verificar si ya ingresó la clave en esta sesión
    const isAuthenticated = sessionStorage.getItem('isLogged') === 'true';

    if (!isSessionValid() && view !== 'login') {
        renderLogin(container);
        return;
    }

    if(view === 'gym') {
        renderGymInicio(container);
    } else if(view === 'history') {
        renderHistorial(container);
    } else if(view === 'settings') {
        renderSettings(container);
    }else if(view === 'work') {
    renderWork(container); 
    }
}

// 3. Renderizar Inicio con HISTORIAL y PROGRESO
function renderGymInicio(container) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    
    const currentWeek = USER_DATA.currentWeek;

    // Generar el Roadmap Horizontal
    const roadmapHTML = `
        <div class="flex gap-3 overflow-x-auto pb-6 no-scrollbar mb-4" style="scroll-snap-type: x mandatory;">
            ${Array.from({ length: USER_DATA.totalWeeks }).map((_, i) => {
                const w = i + 1;
                const isPast = w < currentWeek;
                const isCurrent = w === currentWeek;
                const mesoForWeek = USER_DATA.getMesocycleName(w);
                
                return `
                    <div class="min-w-[110px] flex-shrink-0 p-4 rounded-3xl border-2 transition-all duration-500
                        ${isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : 
                        isPast ? 'bg-slate-100 border-slate-200 opacity-50' : 
                        'bg-white border-slate-100 text-slate-400'}"
                        style="scroll-snap-align: center;">
                        <p class="text-[8px] font-black uppercase mb-1 ${isCurrent ? 'text-blue-200' : 'text-slate-400'}">Week ${w}</p>
                        <p class="text-[10px] font-bold leading-tight uppercase mb-2">${mesoForWeek}</p>
                        <div class="text-[12px]">
                            ${isPast ? '✅' : isCurrent ? '<span class="italic font-black">NOW</span>' : '🔒'}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    container.innerHTML = `
        <div class="p-6 pb-32">
            <header class="mb-8 flex justify-between items-start">
                <div>
                    <h1 class="text-3xl font-black italic">JH <span class="text-blue-600">OS</span></h1>
                    <p class="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Software & Music & Fitness</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="showView('settings')" class="bg-slate-100 p-2 rounded-lg text-xs">⚙️</button>
                    <button onclick="updateWeek(-1)" class="bg-slate-100 p-2 rounded-lg text-xs">«</button>
                    <button onclick="updateWeek(1)" class="bg-slate-100 p-2 rounded-lg text-xs">»</button>
                    <button onclick="confirmLogout()" class="bg-red-50 p-2 rounded-lg text-xs opacity-50">🔒</button>
                </div>
            </header>

            <div class="mb-2">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Training Roadmap</p>
                ${roadmapHTML}
            </div>

            <button onclick="showView('history')" class="w-full bg-white border-2 border-slate-100 p-4 rounded-[1.5rem] mb-6 flex justify-between items-center active:scale-95 transition-all">
                <div class="flex items-center gap-3">
                    <span class="text-xl">📅</span>
                    <span class="font-bold text-slate-700">Training History</span>
                </div>
                <span class="text-blue-600">→</span>
            </button>

            <div class="space-y-4">
                ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => {
                    const isToday = day === today;
                    const routineName = USER_DATA.routine[day]?.name || 'Rest Day';
                    
                    return `
                    <div class="bg-white p-5 rounded-[1.5rem] border-2 ${isToday ? 'border-blue-600 shadow-md' : 'border-slate-50 opacity-80'}">
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-[10px] font-black uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}">${day}</p>
                                <p class="font-bold text-lg ${isToday ? 'text-slate-900' : 'text-slate-700'}">${routineName}</p>
                            </div>
                            <button onclick="startWorkout('${day}')" 
                                    class="${isToday ? 'bg-blue-600' : 'bg-slate-800 opacity-50'} text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-md active:scale-95 transition-all">
                                Start
                            </button>
                        </div>
                    </div>
                    `; // <-- Aquí estaba el cierre faltante
                }).join('')}
            </div>
        </div>
    `;
}

async function startWorkout(day) {
    const container = document.getElementById('view-container');
    const routine = USER_DATA.routine[day];
    if (!routine) return;
    
    const secondsToRest = routine.focus === "Mechanical Tension" ? 90 : 60;

    container.innerHTML = `
        <div class="p-6 pb-32">
            <div class="flex justify-between items-center mb-8">
                <button onclick="showView('gym')" class="text-slate-400 font-bold">✕ Back</button>
                <span class="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[10px] font-black uppercase italic">${day}</span>
            </div>

            <h2 class="text-3xl font-black text-slate-900 mb-1">${routine.name}</h2>
            <p class="text-blue-600 font-bold mb-8 italic uppercase text-xs">${routine.focus}</p>

            <div class="space-y-6">
                ${routine.exercises.map((ex, idx) => `
                    <div class="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-black text-slate-800">${ex.name}</h3>
                                <p class="text-slate-400 text-xs font-bold">${ex.goal}</p>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            ${Array.from({length: ex.sets}).map((_, i) => `
                                <div class="flex items-center gap-3 relative">
                                    <span class="text-[10px] font-bold text-slate-300 w-4">S${i+1}</span>
                                    <input type="tel" id="input-kg-${ex.id}-${i}" inputmode="numeric" placeholder="0" 
                                           class="flex-1 bg-slate-50 border-none rounded-xl p-3 text-center font-bold text-sm outline-none">
                                    <input type="tel" id="input-reps-${ex.id}-${i}" inputmode="numeric" placeholder="Rps" 
                                           class="flex-1 bg-slate-50 border-none rounded-xl p-3 text-center font-bold text-sm outline-none">
                                    
                                    <div id="ref-${ex.id}-${i}" class="absolute -top-2 left-12 text-[9px] text-blue-500 font-bold opacity-0"></div>

                                    <button onclick="this.textContent = '🔥'; iniciarDescanso(${i === 0 ? 60 : secondsToRest})" class="bg-slate-100 p-3 rounded-xl">✔️</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>

            <button onclick="finishWorkout('${day}')" class="fixed bottom-24 left-6 right-6 bg-slate-900 text-white p-5 rounded-[2rem] font-black uppercase shadow-2xl z-40">
                Finish Workout
            </button>
        </div>
    `;

    for (let ex of routine.exercises) {
        const ultimoEjercicio = await obtenerUltimoPeso(ex.id);
        if (ultimoEjercicio && ultimoEjercicio.sets) {
            ultimoEjercicio.sets.forEach((setData, i) => {
                const inputKg = document.getElementById(`input-kg-${ex.id}-${i}`);
                const inputReps = document.getElementById(`input-reps-${ex.id}-${i}`);
                const refLabel = document.getElementById(`ref-${ex.id}-${i}`);
                
                if (inputKg && setData.kg > 0) inputKg.placeholder = `${setData.kg}kg`;
                if (inputReps && setData.reps > 0) inputReps.placeholder = `${setData.reps}`;
                if (refLabel && setData.kg > 0) {
                    refLabel.innerText = `Last: ${setData.kg}kg x ${setData.reps}`;
                    refLabel.style.opacity = "1";
                }
            });
        }
    }
}

let timerInterval;
function iniciarDescanso(segundos) {
    clearInterval(timerInterval);
    let timerDiv = document.getElementById('timer-flotante');
    if (!timerDiv) {
        timerDiv = document.createElement('div');
        timerDiv.id = 'timer-flotante';
        timerDiv.className = "fixed top-10 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-4 rounded-full font-black shadow-2xl z-[60] text-2xl flex items-center gap-4";
        document.body.appendChild(timerDiv);
    }
    let tiempoRestante = segundos;
    timerInterval = setInterval(() => {
        const mins = Math.floor(tiempoRestante / 60);
        const segs = tiempoRestante % 60;
        timerDiv.innerHTML = `<span>⏱️</span> ${mins}:${segs < 10 ? '0' : ''}${segs}`;
        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            timerDiv.innerHTML = "<span>🔥</span> READY!";
            timerDiv.classList.replace('bg-orange-500', 'bg-emerald-500');
            if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
            setTimeout(() => timerDiv.remove(), 3000);
        }
        tiempoRestante--;
    }, 1000);
}

async function finishWorkout(day) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const activeDay = (day && day !== 'undefined') ? day : days[new Date().getDay()]; 
    const routine = USER_DATA.routine[activeDay];
    const exerciseCards = document.querySelectorAll('.bg-white.rounded-\\[2rem\\]'); 

    const workoutSession = {
        date: new Date().toISOString(),
        day: activeDay,
        name: routine.name,
        mesocycle: USER_DATA.getMesocycleName(USER_DATA.currentWeek), 
        week: USER_DATA.currentWeek,
        results: []
    };

    exerciseCards.forEach((card, index) => {
        const exercise = routine.exercises[index];
        if (!exercise) return;
        const setsData = [];
        const inputs = card.querySelectorAll('input');
        for (let i = 0; i < inputs.length; i += 2) {
            setsData.push({
                kg: inputs[i]?.value || "0",
                reps: inputs[i+1]?.value || "0"
            });
        }
        workoutSession.results.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            sets: setsData
        });
    });

    try {
        await set(ref(db, 'gym_records/' + Date.now()), workoutSession);
        
        // MODAL DE ÉXITO INTEGRADO
        renderModal(
            "¡Buen trabajo! 🔥", 
            "Tu entrenamiento ha sido sincronizado en la nube con éxito. ¡A descansar!",
            "Volver al Inicio",
            () => showView('gym')
        );

    } catch (e) { 
        renderModal("Error ⚠️", "No pudimos sincronizar: " + e.message, "Reintentar", () => finishWorkout(day));
    }
}

async function obtenerUltimoPeso(exerciseId) {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'gym_records'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const records = Object.values(data).sort((a, b) => new Date(b.date) - new Date(a.date));
            for (let record of records) {
                const exercise = record.results.find(ex => ex.exerciseId === exerciseId);
                if (exercise && exercise.sets) return exercise;
            }
        }
    } catch (e) { console.error(e); }
    return null;
}

async function renderHistorial(container) {
    container.innerHTML = `
        <div class="p-6 pb-32">
            <div class="flex justify-between items-center mb-8">
                <button onclick="showView('gym')" class="text-slate-400 font-bold">✕ Back</button>
                <h2 class="text-2xl font-black italic text-slate-900">Training Log</h2>
            </div>
            <div id="history-content" class="space-y-6">
                <p class="text-center text-slate-400">Loading your progress...</p>
            </div>
        </div>
    `;

    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'gym_records'));
        const content = document.getElementById('history-content');
        
        if (snapshot.exists()) {
            const records = Object.values(snapshot.val()).sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Agrupamos por nombre de día para que veas todos tus "Monday", etc.
            content.innerHTML = records.map((record, index) => {
                const fecha = new Date(record.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                
                return `
                    <div class="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                        <div class="p-5 bg-slate-50 flex justify-between items-center">
                            <div>
                                <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest">${record.mesocycle}</span>
                                <h3 class="font-black text-slate-800">${record.day} - Sem ${record.week}</h3>
                                <p class="text-[10px] text-slate-400">${fecha}</p>
                            </div>
                            <button onclick="toggleDetail('detail-${index}')" class="bg-white border p-2 rounded-xl text-xs font-bold shadow-sm">Ver Detalle</button>
                        </div>
                        
                        <div id="detail-${index}" class="hidden p-5 space-y-4 border-t border-slate-50 bg-white">
                            ${record.results.map(res => `
                                <div>
                                    <p class="text-xs font-black text-slate-700 mb-2 uppercase">${res.exerciseName}</p>
                                    <div class="grid grid-cols-4 gap-2">
                                        ${res.sets.map((s, i) => `
                                            <div class="bg-slate-50 rounded-lg p-2 text-center">
                                                <p class="text-[8px] text-slate-400 font-bold">S${i+1}</p>
                                                <p class="text-[10px] font-black">${s.kg}kg</p>
                                                <p class="text-[9px] text-blue-500">${s.reps}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) { console.error(e); }
}


function renderRoadmap() {
    return `
        <div class="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            ${Array.from({ length: USER_DATA.totalWeeks }).map((_, i) => {
                const w = i + 1;
                const isPast = w < USER_DATA.currentWeek;
                const isCurrent = w === USER_DATA.currentWeek;
                const mesoName = USER_DATA.getMesocycleName(w);
                
                return `
                    <div class="min-w-[100px] flex-shrink-0 p-3 rounded-2xl border-2 transition-all
                        ${isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' : 
                            isPast ? 'bg-slate-100 border-slate-200 opacity-60' : 
                            'bg-white border-slate-100 text-slate-400'}">
                        <p class="text-[8px] font-black uppercase mb-1 ${isCurrent ? 'text-blue-200' : 'text-slate-400'}">
                            Week ${w}
                        </p>
                        <p class="text-[10px] font-bold leading-tight uppercase">
                            ${mesoName}
                        </p>
                        ${isPast ? '<span class="text-[10px] mt-2 block">✅</span>' : ''}
                        ${isCurrent ? '<span class="text-[10px] mt-2 block font-black italic">NOW 🔥</span>' : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderLogin(container) {
    container.innerHTML = `
        <div class="h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
            <div class="mb-8 text-center">
                <h1 class="text-4xl font-black italic mb-2">JH <span class="text-blue-600">OS</span></h1>
                <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">Restricted Access</p>
            </div>
            
            <div class="w-full max-w-xs bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <p class="text-center text-slate-500 text-sm mb-6 font-medium">Enter Access Code</p>
                <input type="password" id="pass-input" inputmode="numeric" 
                       class="w-full text-center text-3xl letter-spacing-lg font-black bg-slate-50 border-none rounded-2xl p-4 mb-4 outline-none focus:ring-2 ring-blue-500 transition-all"
                       placeholder="••••">
                <button onclick="checkAccess()" 
                        class="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">
                    Unlock
                </button>
                <p id="login-error" class="text-red-500 text-[10px] font-bold text-center mt-4 opacity-0 uppercase">Incorrect Code</p>
            </div>
        </div>
    `;
}

// Función para verificar si la sesión sigue siendo válida
function isSessionValid() {
    const loginTime = localStorage.getItem('loginTimestamp');
    if (!loginTime) return false;

    const now = Date.now();
    const diffInMins = (now - parseInt(loginTime)) / 1000 / 60;
    
    if (diffInMins > SESSION_TIMEOUT_MINS) {
        logout(); // Expiró
        return false;
    }
    return true;
}

window.checkAccess = async () => { // Agregamos async
    const input = document.getElementById('pass-input').value;
    
    // 1. Buscamos la clave real en la Base de Datos
    try {
        const snapshot = await get(child(ref(db), 'config/admin_password'));
        const masterKey = snapshot.exists() ? snapshot.val() : "1234"; // "1234" de respaldo

        if (input === masterKey.toString()) {
            localStorage.setItem('isLogged', 'true');
            localStorage.setItem('loginTimestamp', Date.now().toString());
            showView('gym');
        } else {
            const errorMsg = document.getElementById('login-error');
            errorMsg.classList.replace('opacity-0', 'opacity-100');
            setTimeout(() => errorMsg.classList.replace('opacity-100', 'opacity-0'), 2000);
        }
    } catch (error) {
        console.error("Error al validar acceso:", error);
        alert("Error de conexión con la base de datos.");
    }
};


// Función auxiliar para abrir/cerrar detalles
window.toggleDetail = (id) => {
    const el = document.getElementById(id);
    el.classList.toggle('hidden');
};

//funcion cerrar seccion
window.logout = () => {
    // 1. Limpiamos las credenciales del almacenamiento local
    localStorage.removeItem('isLogged');
    localStorage.removeItem('loginTimestamp');

    // 2. Opcional: Limpiar cualquier dato sensible de la sesión actual
    console.log("Session terminated. Reloading...");

    // 3. Forzamos la recarga completa de la página
    // Esto enviará al usuario de nuevo al index, y como ya no hay 'isLogged',
    // el sistema lo mandará automáticamente al renderLogin.
    window.location.reload();
};


function renderSettings(container) {
    container.innerHTML = `
        <div class="p-6 pb-32">
            <header class="mb-8 flex justify-between items-center">
                <button onclick="showView('gym')" class="text-slate-400 font-bold">✕ Back</button>
                <h2 class="text-xl font-black italic uppercase">Settings</h2>
            </header>

            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <p class="text-slate-900 font-black mb-6 uppercase text-sm tracking-widest">Update Access Code</p>
                
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2">New Password</label>
                        <input type="password" id="new-pass" inputmode="numeric" placeholder="••••"
                            class="w-full bg-slate-50 border-none rounded-2xl p-4 font-black text-xl outline-none focus:ring-2 ring-blue-500">
                    </div>
                    
                    <button onclick="updatePassword()" 
                            class="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-200">
                        Save New Code
                    </button>
                </div>
            </div>

            <button onclick="confirmLogout()" class="mt-12 w-full p-4 border-2 border-red-100 text-red-500 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl active:bg-red-50">
                Close Session & Lock
            </button>
        </div>
    `;
}

window.updatePassword = async () => {
    const newPass = document.getElementById('new-pass').value;
    
    if (newPass.length >= 4) {
        try {
            // Guardamos en Firebase
            await set(ref(db, 'config/admin_password'), newPass);
            
            // Usamos tu modal en lugar de alert()
            renderModal(
                "¡Éxito! 🔥", 
                "La contraseña de acceso ha sido actualizada en la nube correctamente.",
                "Entendido",
                () => showView('gym') // Al cerrar, volvemos al inicio
            );
            
        } catch (error) {
            // Modal de error
            renderModal(
                "Error ⚠️", 
                "No pudimos actualizar la clave: " + error.message, 
                "Reintentar", 
                () => {}, // No hace nada especial, solo cierra
                true      // Color rojo de peligro
            );
        }
    } else {
        // Modal para validación simple
        renderModal(
            "Clave muy corta", 
            "Por seguridad, la contraseña debe tener al menos 4 dígitos.", 
            "Corregir", 
            () => {},
            true
        );
    }
};

window.confirmLogout = () => {
    if(confirm("¿Estás seguro de que quieres cerrar la sesión?")) {
        logout();
    }
};

// Función para renderizar un modal integrado
function renderModal(title, message, confirmText, onConfirm, isDanger = false) {
    const modalContainer = document.getElementById('modal-container');
    const buttonColor = isDanger ? 'bg-red-500' : 'bg-blue-600'; // Azul para éxito, Rojo para peligro
    
    modalContainer.innerHTML = `
        <div class="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl scale-in-center">
            <h3 class="text-xl font-black text-slate-900 mb-2 italic">${title}</h3>
            <p class="text-slate-500 text-sm mb-8 font-medium">${message}</p>
            
            <div class="space-y-3">
                <button id="modal-confirm" class="w-full ${buttonColor} text-white p-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-100">
                    ${confirmText}
                </button>
                <button onclick="closeModal()" class="w-full bg-slate-50 text-slate-400 p-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    modalContainer.classList.remove('hidden');
    document.getElementById('modal-confirm').onclick = () => {
        onConfirm();
        closeModal();
    };
}

window.closeModal = () => {
    document.getElementById('modal-container').classList.add('hidden');
};

// Nueva versión de confirmLogout integrada
window.confirmLogout = () => {
    renderModal(
        "Cerrar Sesión", 
        "¿Estás seguro de que quieres bloquear el dashboard? Deberás ingresar tu clave de nuevo.",
        "Lock Now",
        logout,
        true // <--- Activa el color rojo
    );
};

// EXPORTACIONES
window.showView = showView;
window.startWorkout = startWorkout;
window.finishWorkout = finishWorkout;
window.iniciarDescanso = iniciarDescanso;
window.obtenerUltimoPeso = obtenerUltimoPeso;
window.logout = logout;             
window.confirmLogout = confirmLogout; 
window.updatePassword = updatePassword; 
window.confirmLogout = confirmLogout;
window.closeModal = closeModal;

showView('gym');