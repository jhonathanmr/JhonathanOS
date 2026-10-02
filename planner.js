import { db, auth } from './config.js';
import { 
    collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let habits = [];
let currentFilter = 'all';
let unsubscribeFirestore = null;

// Obtener fecha local YYYY-MM-DD
const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Generar el HTML de la vista Planner
export function renderPlannerView() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
    <section id="planner-section" class="p-4 pb-28 max-w-xl mx-auto min-h-full">
        <!-- Header -->
        <header class="flex items-center justify-between mb-5 pt-2">
            <div>
                <h1 class="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <span>📝</span> Planner
                </h1>
                <p class="text-xs text-slate-500 font-medium">Hábitos y tareas repetitivas</p>
            </div>
            <button id="btn-open-habit-modal" class="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all">
                <span>+</span> Nuevo
            </button>
        </header>

        <!-- Barra de Progreso del Día -->
        <div class="bg-white border border-slate-200 rounded-2xl p-4 mb-5 shadow-sm">
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-slate-600">Progreso de hoy</span>
                <span id="planner-progress-text" class="text-xs font-black text-blue-600">0%</span>
            </div>
            <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div id="planner-progress-bar" class="bg-blue-600 h-full w-0 transition-all duration-300"></div>
            </div>
        </div>

        <!-- Filtro por frecuencia -->
        <div class="flex gap-2 mb-4 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button data-filter="all" class="planner-filter-btn px-3 py-1.5 rounded-xl font-bold transition bg-blue-600 text-white shadow-sm">Todos</button>
            <button data-filter="diario" class="planner-filter-btn px-3 py-1.5 rounded-xl font-bold transition bg-white text-slate-600 border border-slate-200">Diarios</button>
            <button data-filter="semanal" class="planner-filter-btn px-3 py-1.5 rounded-xl font-bold transition bg-white text-slate-600 border border-slate-200">Semanales</button>
        </div>

        <!-- Lista de Hábitos -->
        <div id="planner-list" class="space-y-2.5">
            <p class="text-center text-xs text-slate-400 py-6">Cargando tareas...</p>
        </div>
    </section>
    `;

    // Asignar eventos
    document.getElementById('btn-open-habit-modal')?.addEventListener('click', openHabitModal);
    
    document.querySelectorAll('.planner-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFilter = e.currentTarget.dataset.filter;
            document.querySelectorAll('.planner-filter-btn').forEach(b => {
                b.className = 'planner-filter-btn px-3 py-1.5 rounded-xl font-bold transition bg-white text-slate-600 border border-slate-200';
            });
            e.currentTarget.className = 'planner-filter-btn px-3 py-1.5 rounded-xl font-bold transition bg-blue-600 text-white shadow-sm';
            renderHabitsList();
        });
    });

    // Escuchar el estado de la autenticación de Firebase
    onAuthStateChanged(auth, (user) => {
        if (user) {
            listenToHabits(user.uid);
        } else {
            if (unsubscribeFirestore) unsubscribeFirestore();
            const listEl = document.getElementById('planner-list');
            if (listEl) {
                listEl.innerHTML = `<p class="text-center text-xs text-slate-400 py-6">Inicia sesión para ver tus tareas.</p>`;
            }
        }
    });
}

// Escuchar Firestore en tiempo real con cleanup
function listenToHabits(userId) {
    if (unsubscribeFirestore) unsubscribeFirestore();

    const q = query(collection(db, "habits"), where("userId", "==", userId));
    unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderHabitsList();
    }, (error) => {
        console.error("Error al escuchar hábitos:", error);
    });
}

// Renderizar la lista de hábitos
function renderHabitsList() {
    const container = document.getElementById('planner-list');
    if (!container) return;

    const today = getTodayStr();
    const filtered = habits.filter(h => currentFilter === 'all' || h.frequency === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center text-xs text-slate-400 py-8">No hay tareas o hábitos aquí aún.</p>`;
        updateProgress(0, 0);
        return;
    }

    let completedCount = 0;

    container.innerHTML = filtered.map(h => {
        const isDone = (h.completedDates || []).includes(today);
        if (isDone) completedCount++;

        return `
            <div class="flex items-center justify-between p-3.5 bg-white border ${isDone ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'} rounded-2xl shadow-sm transition-all">
                <div class="flex items-center gap-3">
                    <button data-id="${h.id}" class="btn-toggle-habit w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white font-black' : 'border-slate-300 hover:border-blue-500 bg-slate-50'}">
                        ${isDone ? '✓' : ''}
                    </button>
                    <div>
                        <h4 class="text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}">${h.title}</h4>
                        <div class="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                            <span>${h.category}</span>
                            <span>•</span>
                            <span class="text-amber-600 font-bold">🔥 ${h.streak || 0} días</span>
                        </div>
                    </div>
                </div>
                <button data-id="${h.id}" class="btn-delete-habit text-slate-300 hover:text-red-500 text-sm p-1.5 transition">🗑</button>
            </div>
        `;
    }).join('');

    // Reasignar eventos tras renderizado
    document.querySelectorAll('.btn-toggle-habit').forEach(btn => {
        btn.addEventListener('click', (e) => toggleHabit(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.btn-delete-habit').forEach(btn => {
        btn.addEventListener('click', (e) => deleteHabit(e.currentTarget.dataset.id));
    });

    updateProgress(completedCount, filtered.length);
}

// Actualizar barra de progreso
function updateProgress(done, total) {
    const textEl = document.getElementById('planner-progress-text');
    const barEl = document.getElementById('planner-progress-bar');
    if (!textEl || !barEl) return;

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    textEl.innerText = `${pct}%`;
    barEl.style.width = `${pct}%`;
}

// Alternar estado de completado
async function toggleHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = getTodayStr();
    let updatedDates = [...(habit.completedDates || [])];
    let streak = habit.streak || 0;

    if (updatedDates.includes(today)) {
        updatedDates = updatedDates.filter(d => d !== today);
        streak = Math.max(0, streak - 1);
    } else {
        updatedDates.push(today);
        streak += 1;
    }

    try {
        await updateDoc(doc(db, "habits", habitId), {
            completedDates: updatedDates,
            streak: streak
        });
    } catch (err) {
        console.error("Error al actualizar hábito:", err);
    }
}

// Eliminar hábito
async function deleteHabit(habitId) {
    if (confirm("¿Eliminar este hábito?")) {
        try {
            await deleteDoc(doc(db, "habits", habitId));
        } catch (err) {
            console.error("Error al eliminar hábito:", err);
        }
    }
}

// Modal para crear hábito
function openHabitModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;  

    modalContainer.innerHTML = `
    <div class="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl scale-in-center">
        <div class="flex justify-between items-center mb-4">
            <h3 class="font-black text-base text-slate-800">Crear Hábito</h3>
            <button id="btn-close-modal" class="text-slate-400 font-bold text-lg">&times;</button>
        </div>
        <form id="form-habit" class="space-y-3">
            <div>
                <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre</label>
                <input type="text" id="habit-title" required placeholder="Ej: Leer 15 min..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500">
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Frecuencia</label>
                    <select id="habit-freq" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-medium">
                        <option value="diario">Diario</option>
                        <option value="semanal">Semanal</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Categoría</label>
                    <select id="habit-cat" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-medium">
                        <option value="💪 Salud">💪 Salud</option>
                        <option value="🧠 Estudio">🧠 Estudio</option>
                        <option value="💻 Trabajo">💻 Trabajo</option>
                        <option value="🏠 Hogar">🏠 Hogar</option>
                        <option value="✨ Personal">✨ Personal</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-end gap-2 pt-3">
                <button type="button" id="btn-cancel-modal" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancelar</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700">Guardar</button>
            </div>
        </form>
    </div>
    `;

    modalContainer.classList.remove('hidden');

    const closeModal = () => modalContainer.classList.add('hidden');
    document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

    document.getElementById('form-habit')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth?.currentUser;
        if (!user) return alert("Debes iniciar sesión");

        try {
            await addDoc(collection(db, "habits"), {
                userId: user.uid,
                title: document.getElementById('habit-title').value,
                frequency: document.getElementById('habit-freq').value,
                category: document.getElementById('habit-cat').value,
                completedDates: [],
                streak: 0,
                createdAt: serverTimestamp()
            });
            closeModal();
        } catch (err) {
            console.error("Error al guardar el hábito:", err);
        }
    });
}