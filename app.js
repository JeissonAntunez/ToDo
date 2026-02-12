/**
 * Gestor de Tareas - ToDo App
 * Arquitectura: MVC Pattern + Observer Pattern + Module Pattern
 * 
 * Componentes principales:
 * - StorageService: Manejo de persistencia con localStorage
 * - TaskModel: Modelo de datos de tareas
 * - TaskValidator: Validación de datos
 * - UIController: Controlador de interfaz
 * - TaskController: Controlador principal de lógica
 */

// ====================================================================
// UTILIDADES Y HELPERS
// ====================================================================

/**
 * Genera un ID único basado en timestamp y random
 */
const generateId = () => {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formatea una fecha a formato legible
 */
const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
};

/**
 * Verifica si una fecha es anterior a hoy
 */
const isOverdue = (dateString) => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline < today;
};

/**
 * Debounce function para optimizar eventos
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// ====================================================================
// STORAGE SERVICE - Patrón Singleton
// ====================================================================

const StorageService = (() => {
    const STORAGE_KEY = 'todoApp_tasks';

    return {
        /**
         * Obtiene todas las tareas del localStorage
         */
        getTasks() {
            try {
                const tasks = localStorage.getItem(STORAGE_KEY);
                return tasks ? JSON.parse(tasks) : [];
            } catch (error) {
                console.error('Error al cargar tareas:', error);
                return [];
            }
        },

        /**
         * Guarda las tareas en localStorage
         */
        saveTasks(tasks) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
                return true;
            } catch (error) {
                console.error('Error al guardar tareas:', error);
                return false;
            }
        },

        /**
         * Limpia todas las tareas
         */
        clearTasks() {
            try {
                localStorage.removeItem(STORAGE_KEY);
                return true;
            } catch (error) {
                console.error('Error al limpiar tareas:', error);
                return false;
            }
        }
    };
})();

// ====================================================================
// TASK MODEL - Modelo de datos
// ====================================================================

class TaskModel {
    constructor(data) {
        this.id = data.id || generateId();
        this.title = data.title;
        this.description = data.description || '';
        this.priority = data.priority;
        this.deadline = data.deadline || null;
        this.completed = data.completed || false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Actualiza la tarea con nuevos datos
     */
    update(data) {
        Object.keys(data).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                this[key] = data[key];
            }
        });
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Marca la tarea como completada/pendiente
     */
    toggleComplete() {
        this.completed = !this.completed;
        this.updatedAt = new Date().toISOString();
    }

    /**
     * Convierte el modelo a objeto plano
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            priority: this.priority,
            deadline: this.deadline,
            completed: this.completed,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

// ====================================================================
// TASK VALIDATOR - Validación de datos
// ====================================================================

const TaskValidator = {
    /**
     * Mensajes de error
     */
    errorMessages: {
        titleRequired: 'El título es obligatorio',
        titleMinLength: 'El título debe tener al menos 3 caracteres',
        priorityRequired: 'Debes seleccionar una prioridad'
    },

    /**
     * Valida el título
     */
    validateTitle(title) {
        const errors = [];
        
        if (!title || title.trim() === '') {
            errors.push(this.errorMessages.titleRequired);
        } else if (title.trim().length < 3) {
            errors.push(this.errorMessages.titleMinLength);
        }
        
        return errors;
    },

    /**
     * Valida la prioridad
     */
    validatePriority(priority) {
        const errors = [];
        const validPriorities = ['low', 'medium', 'high'];
        
        if (!priority || !validPriorities.includes(priority)) {
            errors.push(this.errorMessages.priorityRequired);
        }
        
        return errors;
    },

    /**
     * Valida todos los campos del formulario
     */
    validateTask(taskData) {
        const errors = {};
        
        const titleErrors = this.validateTitle(taskData.title);
        if (titleErrors.length > 0) {
            errors.title = titleErrors[0];
        }
        
        const priorityErrors = this.validatePriority(taskData.priority);
        if (priorityErrors.length > 0) {
            errors.priority = priorityErrors[0];
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// ====================================================================
// UI CONTROLLER - Manejo de interfaz
// ====================================================================

const UIController = (() => {
    // Referencias a elementos del DOM
    const DOMElements = {
        // Formulario
        form: document.getElementById('task-form'),
        titleInput: document.getElementById('task-title'),
        prioritySelect: document.getElementById('task-priority'),
        deadlineInput: document.getElementById('task-deadline'),
        descriptionTextarea: document.getElementById('task-description'),
        submitBtn: document.getElementById('submit-btn'),
        cancelBtn: document.getElementById('cancel-btn'),
        
        // Errores
        titleError: document.getElementById('title-error'),
        priorityError: document.getElementById('priority-error'),
        
        // Lista de tareas
        tasksList: document.getElementById('tasks-list'),
        emptyState: document.getElementById('empty-state'),
        
        // Estadísticas
        totalTasks: document.getElementById('total-tasks'),
        pendingTasks: document.getElementById('pending-tasks'),
        completedTasks: document.getElementById('completed-tasks'),
        
        // Filtros
        filterButtons: document.querySelectorAll('.filter-btn'),
        
        // Modal
        modal: document.getElementById('confirm-modal'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn')
    };

    /**
     * Limpia el formulario
     */
    const clearForm = () => {
        DOMElements.form.reset();
        clearErrors();
        DOMElements.submitBtn.innerHTML = `
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Agregar Tarea
        `;
        DOMElements.cancelBtn.style.display = 'none';
        DOMElements.form.removeAttribute('data-edit-id');
    };

    /**
     * Limpia los mensajes de error
     */
    const clearErrors = () => {
        DOMElements.titleError.textContent = '';
        DOMElements.priorityError.textContent = '';
        DOMElements.titleInput.classList.remove('error');
        DOMElements.prioritySelect.classList.remove('error');
    };

    /**
     * Muestra errores de validación
     */
    const showErrors = (errors) => {
        clearErrors();
        
        if (errors.title) {
            DOMElements.titleError.textContent = errors.title;
            DOMElements.titleInput.classList.add('error');
        }
        
        if (errors.priority) {
            DOMElements.priorityError.textContent = errors.priority;
            DOMElements.prioritySelect.classList.add('error');
        }
    };

    /**
     * Crea el HTML de una tarea
     */
    const createTaskHTML = (task) => {
        const priorityLabels = {
            low: 'Baja',
            medium: 'Media',
            high: 'Alta'
        };

        const formattedDeadline = formatDate(task.deadline);
        const isTaskOverdue = isOverdue(task.deadline);

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} task-item--priority-${task.priority}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         role="checkbox" 
                         aria-checked="${task.completed}"
                         aria-label="Marcar tarea como ${task.completed ? 'pendiente' : 'completada'}"
                         tabindex="0">
                    </div>
                    <div class="task-content">
                        <h3 class="task-title">${escapeHtml(task.title)}</h3>
                        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta">
                            <span class="task-badge task-badge--priority-${task.priority}">
                                ${priorityLabels[task.priority]}
                            </span>
                            ${formattedDeadline ? `
                                <span class="task-deadline ${isTaskOverdue && !task.completed ? 'overdue' : ''}">
                                    📅 ${formattedDeadline}
                                    ${isTaskOverdue && !task.completed ? ' (Vencida)' : ''}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn task-action-btn--edit" 
                                data-action="edit"
                                aria-label="Editar tarea">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="task-action-btn task-action-btn--delete" 
                                data-action="delete"
                                aria-label="Eliminar tarea">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Escapa HTML para prevenir XSS
     */
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * Renderiza la lista de tareas
     */
    const renderTasks = (tasks) => {
        if (tasks.length === 0) {
            DOMElements.tasksList.innerHTML = '';
            DOMElements.emptyState.classList.add('show');
        } else {
            DOMElements.emptyState.classList.remove('show');
            DOMElements.tasksList.innerHTML = tasks.map(createTaskHTML).join('');
        }
    };

    /**
     * Actualiza las estadísticas
     */
    const updateStats = (tasks) => {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;

        DOMElements.totalTasks.textContent = total;
        DOMElements.completedTasks.textContent = completed;
        DOMElements.pendingTasks.textContent = pending;
    };

    /**
     * Actualiza el filtro activo
     */
    const updateActiveFilter = (filter) => {
        DOMElements.filterButtons.forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
    };

    /**
     * Carga datos de tarea en el formulario para edición
     */
    const loadTaskIntoForm = (task) => {
        DOMElements.titleInput.value = task.title;
        DOMElements.prioritySelect.value = task.priority;
        DOMElements.deadlineInput.value = task.deadline || '';
        DOMElements.descriptionTextarea.value = task.description;

        DOMElements.submitBtn.innerHTML = `
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Actualizar Tarea
        `;
        DOMElements.cancelBtn.style.display = 'inline-flex';
        DOMElements.form.setAttribute('data-edit-id', task.id);

        // Scroll al formulario
        DOMElements.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        DOMElements.titleInput.focus();
    };

    /**
     * Muestra el modal de confirmación
     */
    const showModal = () => {
        DOMElements.modal.classList.add('show');
        DOMElements.confirmDeleteBtn.focus();
    };

    /**
     * Oculta el modal de confirmación
     */
    const hideModal = () => {
        DOMElements.modal.classList.remove('show');
    };

    return {
        getDOMElements: () => DOMElements,
        clearForm,
        clearErrors,
        showErrors,
        renderTasks,
        updateStats,
        updateActiveFilter,
        loadTaskIntoForm,
        showModal,
        hideModal
    };
})();

// ====================================================================
// TASK CONTROLLER - Controlador principal
// ====================================================================

const TaskController = (() => {
    let tasks = [];
    let currentFilter = 'all';
    let taskToDelete = null;

    /**
     * Inicializa la aplicación
     */
    const init = () => {
        loadTasks();
        setupEventListeners();
        render();
    };

    /**
     * Carga las tareas desde el storage
     */
    const loadTasks = () => {
        const storedTasks = StorageService.getTasks();
        tasks = storedTasks.map(taskData => new TaskModel(taskData));
    };

    /**
     * Guarda las tareas en el storage
     */
    const saveTasks = () => {
        const tasksData = tasks.map(task => task.toJSON());
        StorageService.saveTasks(tasksData);
    };

    /**
     * Configura los event listeners
     */
    const setupEventListeners = () => {
        const DOM = UIController.getDOMElements();

        // Formulario
        DOM.form.addEventListener('submit', handleFormSubmit);
        DOM.cancelBtn.addEventListener('click', handleCancelEdit);

        // Validación en tiempo real
        DOM.titleInput.addEventListener('input', debounce(() => {
            const errors = TaskValidator.validateTitle(DOM.titleInput.value);
            if (errors.length > 0) {
                DOM.titleError.textContent = errors[0];
                DOM.titleInput.classList.add('error');
            } else {
                DOM.titleError.textContent = '';
                DOM.titleInput.classList.remove('error');
            }
        }, 300));

        DOM.prioritySelect.addEventListener('change', () => {
            const errors = TaskValidator.validatePriority(DOM.prioritySelect.value);
            if (errors.length > 0) {
                DOM.priorityError.textContent = errors[0];
                DOM.prioritySelect.classList.add('error');
            } else {
                DOM.priorityError.textContent = '';
                DOM.prioritySelect.classList.remove('error');
            }
        });

        // Filtros
        DOM.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.filter;
                UIController.updateActiveFilter(currentFilter);
                render();
            });
        });

        // Delegación de eventos para tareas
        DOM.tasksList.addEventListener('click', handleTaskAction);
        
        // Soporte para teclado en checkboxes
        DOM.tasksList.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('task-checkbox') && 
                (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleTaskAction(e);
            }
        });

        // Modal
        DOM.confirmDeleteBtn.addEventListener('click', confirmDelete);
        DOM.cancelDeleteBtn.addEventListener('click', () => {
            UIController.hideModal();
            taskToDelete = null;
        });

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM.modal.classList.contains('show')) {
                UIController.hideModal();
                taskToDelete = null;
            }
        });
    };

    /**
     * Maneja el envío del formulario
     */
    const handleFormSubmit = (e) => {
        e.preventDefault();

        const DOM = UIController.getDOMElements();
        const taskData = {
            title: DOM.titleInput.value.trim(),
            priority: DOM.prioritySelect.value,
            deadline: DOM.deadlineInput.value,
            description: DOM.descriptionTextarea.value.trim()
        };

        // Validar
        const validation = TaskValidator.validateTask(taskData);
        
        if (!validation.isValid) {
            UIController.showErrors(validation.errors);
            return;
        }

        const editId = DOM.form.getAttribute('data-edit-id');

        if (editId) {
            // Actualizar tarea existente
            updateTask(editId, taskData);
        } else {
            // Crear nueva tarea
            addTask(taskData);
        }

        UIController.clearForm();
        render();
    };

    /**
     * Agrega una nueva tarea
     */
    const addTask = (taskData) => {
        const newTask = new TaskModel(taskData);
        tasks.unshift(newTask); // Agregar al inicio
        saveTasks();
    };

    /**
     * Actualiza una tarea existente
     */
    const updateTask = (id, taskData) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.update(taskData);
            saveTasks();
        }
    };

    /**
     * Maneja la cancelación de edición
     */
    const handleCancelEdit = () => {
        UIController.clearForm();
    };

    /**
     * Maneja acciones sobre las tareas (completar, editar, eliminar)
     */
    const handleTaskAction = (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = taskItem.dataset.taskId;
        const checkbox = e.target.closest('.task-checkbox');
        const editBtn = e.target.closest('[data-action="edit"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');

        if (checkbox) {
            toggleTaskComplete(taskId);
        } else if (editBtn) {
            editTask(taskId);
        } else if (deleteBtn) {
            requestDeleteTask(taskId);
        }
    };

    /**
     * Alterna el estado de completado de una tarea
     */
    const toggleTaskComplete = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.toggleComplete();
            saveTasks();
            render();
        }
    };

    /**
     * Carga una tarea para edición
     */
    const editTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            UIController.loadTaskIntoForm(task.toJSON());
        }
    };

    /**
     * Solicita confirmación para eliminar tarea
     */
    const requestDeleteTask = (id) => {
        taskToDelete = id;
        UIController.showModal();
    };

    /**
     * Confirma y ejecuta la eliminación
     */
    const confirmDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete);
            taskToDelete = null;
        }
        UIController.hideModal();
    };

    /**
     * Elimina una tarea
     */
    const deleteTask = (id) => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
    };

    /**
     * Obtiene las tareas filtradas
     */
    const getFilteredTasks = () => {
        switch (currentFilter) {
            case 'pending':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            default:
                return tasks;
        }
    };

    /**
     * Renderiza la vista
     */
    const render = () => {
        const filteredTasks = getFilteredTasks();
        UIController.renderTasks(filteredTasks);
        UIController.updateStats(tasks);
    };

    return {
        init
    };
})();

// ====================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ====================================================================

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', TaskController.init);
} else {
    TaskController.init();
}