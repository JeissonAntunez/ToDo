/**
 * Gestor de Tareas - Estilo Notion/Asana
 * Arquitectura: MVC + Module Pattern + Observer Pattern
 */

// ====================================================================
// UTILIDADES
// ====================================================================

const Utils = {
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    },

    isOverdue(dateString) {
        if (!dateString) return false;
        const deadline = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return deadline < today;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    getInitials(name) {
        if (!name) return '';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
};

// ====================================================================
// STORAGE SERVICE
// ====================================================================

const StorageService = (() => {
    const STORAGE_KEY = 'notion_tasks';

    return {
        getTasks() {
            try {
                const tasks = localStorage.getItem(STORAGE_KEY);
                return tasks ? JSON.parse(tasks) : [];
            } catch (error) {
                console.error('Error loading tasks:', error);
                return [];
            }
        },

        saveTasks(tasks) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
                return true;
            } catch (error) {
                console.error('Error saving tasks:', error);
                return false;
            }
        }
    };
})();

// ====================================================================
// TASK MODEL
// ====================================================================

class Task {
    constructor(data) {
        this.id = data.id || Utils.generateId();
        this.name = data.name;
        this.status = data.status || 'todo';
        this.responsible = data.responsible || '';
        this.deadline = data.deadline || '';
        this.priority = data.priority;
        this.summary = data.summary || '';
        this.description = data.description  || '';
        this.tags = data.tags || [];

        this.completed = data.completed || this.status === 'completed';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    update(data) {
        Object.keys(data).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                this[key] = data[key];
            }
        });

        if (data.status === 'completed') {
            this.completed = true;
        } else if (data.status === 'todo' || data.status === 'in-progress') {
            this.completed = false;
        }
        this.updatedAt = new Date().toISOString();
    }

    toggleComplete() {
        this.completed = !this.completed;
        if (this.completed) {
            this.status = 'completed';
        } else {
            this.status = 'todo';
        }
        this.updatedAt = new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

// ====================================================================
// VALIDATOR
// ====================================================================

const Validator = {
    validateTask(data) {
        const errors = {};

        if (!data.name || data.name.trim().length < 3) {
            errors.name = 'El nombre debe tener al menos 3 caracteres';
        }

        if (!data.priority) {
            errors.priority = 'Debes seleccionar una prioridad';
        }

        // Validar SOLO si el usuario escribió algo
        if (!data.description && data.description.trim().length < 3) {
            errors.description = 'La descripción debe tener al menos 3 caracteres';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// ====================================================================
// UI CONTROLLER
// ====================================================================

const UIController = (() => {
    const DOM = {
        // Sidebar
        sidebarTotal: document.getElementById('sidebar-total'),
        sidebarPending: document.getElementById('sidebar-pending'),
        sidebarCompleted: document.getElementById('sidebar-completed'),

        // Header
        newTaskBtn: document.getElementById('new-task-btn'),

        // Project
        projectCount: document.getElementById('project-count'),
        tasksTableBody: document.getElementById('tasks-table-body'),
        completeCount: document.getElementById('complete-count'),
        emptyState: document.getElementById('empty-state'),

        // Side Panel
        sidePanel: document.getElementById('side-panel'),
        panelTitle: document.getElementById('panel-title'),
        panelContent: document.getElementById('panel-content'),
        panelClose: document.getElementById('panel-close'),

        // Modal
        modal: document.getElementById('task-modal'),
        modalOverlay: document.getElementById('modal-overlay'),
        modalTitle: document.getElementById('modal-title'),
        modalClose: document.getElementById('modal-close'),
        taskForm: document.getElementById('task-form'),
        
        // Form fields
        taskName: document.getElementById('task-name'),
        taskStatus: document.getElementById('task-status'),
        taskPriority: document.getElementById('task-priority'),
        taskResponsible: document.getElementById('task-responsible'),
        taskDate: document.getElementById('task-date'),
        taskSummary: document.getElementById('task-summary'),
        taskDescription: document.getElementById('task-description'),
        taskTags: document.getElementById('task-tags'),
        
        // Errors
        nameError: document.getElementById('name-error'),
        priorityError: document.getElementById('priority-error'),
        descriptionError: document.getElementById('description-error'),
        
        // Buttons
        cancelModalBtn: document.getElementById('cancel-modal-btn'),
        submitModalBtn: document.getElementById('submit-modal-btn')
    };

    const statusLabels = {
        'todo': 'Sin empezar',
        'in-progress': 'En progreso',
        'completed': 'Completada'
    };

    const priorityLabels = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta'
    };

    // const renderTask = (task) => {
    //     const isOverdue = Utils.isOverdue(task.deadline) && !task.completed;
    //     const formattedDate = Utils.formatDate(task.deadline);

    //     return `
    //         <div class="table-row" data-task-id="${task.id}">
    //             <div class="table-cell table-cell-checkbox">
    //                 <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
    //                      data-action="toggle"></div>
    //             </div>
    //             <div class="table-cell table-cell-name">
    //                 <span class="task-name ${task.completed ? 'completed' : ''}">${Utils.escapeHtml(task.name)}</span>
    //             </div>
    //             <div class="table-cell table-cell-status">
    //                 <span class="status-badge status-${task.status}">
    //                     <span class="status-badge-dot"></span>
    //                     ${statusLabels[task.status]}
    //                 </span>
    //             </div>
    //             <div class="table-cell table-cell-responsible">
    //                 ${task.responsible ? `
    //                     <div class="task-responsible">
    //                         <div class="responsible-avatar">${Utils.getInitials(task.responsible)}</div>
    //                         <span>${Utils.escapeHtml(task.responsible)}</span>
    //                     </div>
    //                 ` : '<span class="text-tertiary">-</span>'}
    //             </div>
    //             <div class="table-cell table-cell-date">
    //                 ${formattedDate ? `
    //                     <span class="task-date ${isOverdue ? 'overdue' : ''}">${formattedDate}</span>
    //                 ` : '<span class="text-tertiary">-</span>'}
    //             </div>
    //             <div class="table-cell table-cell-priority">
    //                 <span class="priority-badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
    //             </div>
    //             <div class="table-cell table-cell-description">
    //                 <span class="task-description">${task.description ? Utils.escapeHtml(task.description) : '-'}</span>
    //             </div>
    //         </div>
    //     `;
    // };

const renderTask = (task) => {
    const isOverdue = Utils.isOverdue(task.deadline) && !task.completed;
    const formattedDate = Utils.formatDate(task.deadline);

    return `
        <div class="table-row" data-task-id="${task.id}">
            <div class="table-cell table-cell-checkbox">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     data-action="toggle"></div>
            </div>
            <div class="table-cell table-cell-name">
                <span class="task-name ${task.completed ? 'completed' : ''}" 
                      title="${Utils.escapeHtml(task.name)}">
                    ${Utils.escapeHtml(task.name)}
                </span>
            </div>
            <div class="table-cell table-cell-status">
                <span class="status-badge status-${task.status}">
                    <span class="status-badge-dot"></span>
                    ${statusLabels[task.status]}
                </span>
            </div>
            <div class="table-cell table-cell-responsible">
                ${task.responsible ? `
                    <div class="task-responsible">
                        <div class="responsible-avatar">${Utils.getInitials(task.responsible)}</div>
                        <span>${Utils.escapeHtml(task.responsible)}</span>
                    </div>
                ` : '<span class="text-tertiary">-</span>'}
            </div>
            <div class="table-cell table-cell-date">
                ${formattedDate ? `
                    <span class="task-date ${isOverdue ? 'overdue' : ''}">${formattedDate}</span>
                ` : '<span class="text-tertiary">-</span>'}
            </div>
            <div class="table-cell table-cell-priority">
                <span class="priority-badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
            </div>
            <div class="table-cell table-cell-description">
                <span class="task-description" 
                      title="${task.description ? Utils.escapeHtml(task.description) : ''}">
                    ${task.description ? Utils.escapeHtml(task.description) : '-'}
                </span>
            </div>
        </div>
    `;
};

    const renderTasks = (tasks) => {
        if (tasks.length === 0) {
            DOM.tasksTableBody.innerHTML = '';
            DOM.emptyState.classList.add('show');
            document.querySelector('.project-section').style.display = 'none';
        } else {
            DOM.emptyState.classList.remove('show');
            document.querySelector('.project-section').style.display = 'block';
            DOM.tasksTableBody.innerHTML = tasks.map(renderTask).join('');
        }
    };

    const updateStats = (tasks) => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;

        DOM.sidebarTotal.textContent = total;
        DOM.sidebarPending.textContent = pending;
        DOM.sidebarCompleted.textContent = completed;
        DOM.projectCount.textContent = total;
        DOM.completeCount.textContent = `${completed}/${total}`;
    };

    const showModal = (task = null) => {
        if (task) {
            DOM.modalTitle.textContent = 'Editar Tarea';
            DOM.submitModalBtn.textContent = 'Actualizar tarea';
            DOM.taskName.value = task.name;
            DOM.taskStatus.value = task.status;
            DOM.taskPriority.value = task.priority;
            DOM.taskResponsible.value = task.responsible;
            DOM.taskDate.value = task.deadline;
            // DOM.taskSummary.value = task.summary;
            DOM.taskDescription.value = task.description;
            // DOM.taskTags.value = task.tags.join(', ');
            DOM.taskForm.setAttribute('data-edit-id', task.id);
        } else {
            DOM.modalTitle.textContent = 'Nueva Tarea';
            DOM.submitModalBtn.textContent = 'Crear tarea';
            DOM.taskForm.reset();
            DOM.taskForm.removeAttribute('data-edit-id');
        }
        
        clearErrors();
        DOM.modal.classList.add('show');
        DOM.taskName.focus();
    };

    const hideModal = () => {
        DOM.modal.classList.remove('show');
        DOM.taskForm.reset();
        clearErrors();
    };

    const showErrors = (errors) => {
        clearErrors();
        if (errors.name) {
            DOM.nameError.textContent = errors.name;
        }
        if (errors.priority) {
            DOM.priorityError.textContent = errors.priority;
        }
        if(errors.description){
            DOM.descriptionError.textContent = errors.description;
        }
    };

    const clearErrors = () => {
        DOM.nameError.textContent = '';
        DOM.priorityError.textContent = '';
        DOM.descriptionError.textContent = '';
    };

    const showPanel = (task) => {
        const isOverdue = Utils.isOverdue(task.deadline) && !task.completed;
        const formattedDate = Utils.formatDate(task.deadline);

        DOM.panelTitle.textContent = task.name;
        DOM.panelContent.innerHTML = `
            <div class="panel-section">
                <div class="panel-field">
                    <div class="panel-field-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        Estado
                    </div>
                    <div class="panel-field-value">
                        <span class="status-badge status-${task.status}">
                            <span class="status-badge-dot"></span>
                            ${statusLabels[task.status]}
                        </span>
                    </div>
                </div>

                <div class="panel-field">
                    <div class="panel-field-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Responsable
                    </div>
                    <div class="panel-field-value">
                        ${task.responsible ? `
                            <div class="task-responsible">
                                <div class="responsible-avatar">${Utils.getInitials(task.responsible)}</div>
                                <span>${Utils.escapeHtml(task.responsible)}</span>
                            </div>
                        ` : 'Sin asignar'}
                    </div>
                </div>

                <div class="panel-field">
                    <div class="panel-field-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Fecha límite
                    </div>
                    <div class="panel-field-value ${isOverdue ? 'task-date overdue' : ''}">
                        ${formattedDate || 'Sin fecha'}
                        ${isOverdue ? ' (Vencida)' : ''}
                    </div>
                </div>

                <div class="panel-field">
                    <div class="panel-field-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="4"></circle>
                        </svg>
                        Prioridad
                    </div>
                    <div class="panel-field-value">
                        <span class="priority-badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
                    </div>
                </div>

                ${task.tags.length > 0 ? `
                    <div class="panel-field">
                        <div class="panel-field-label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                            Etiquetas
                        </div>
                        <div class="panel-tags">
                            ${task.tags.map(tag => `<span class="panel-tag">${Utils.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            ${task.summary || task.description ? `
                <div class="panel-section">
                    <div class="panel-section-title">Descripción</div>
                    ${task.summary ? `<p style="color: var(--text-secondary); margin-bottom: 12px;"><strong>Resumen:</strong> ${Utils.escapeHtml(task.summary)}</p>` : ''}
                    ${task.description ? `<p style="color: var(--text-secondary); white-space: pre-wrap;">${Utils.escapeHtml(task.description)}</p>` : ''}
                </div>
            ` : ''}

            <div class="panel-actions">
                <button class="panel-btn" data-action="edit">Editar</button>
                <button class="panel-btn panel-btn-danger" data-action="delete">Eliminar</button>
            </div>
        `;

        DOM.sidePanel.classList.add('open');
    };

    const hidePanel = () => {
        DOM.sidePanel.classList.remove('open');
    };

    return {
        DOM,
        renderTasks,
        updateStats,
        showModal,
        hideModal,
        showErrors,
        clearErrors,
        showPanel,
        hidePanel
    };
})();

// ====================================================================
// TASK CONTROLLER
// ====================================================================

const TaskController = (() => {
    let tasks = [];
    let selectedTask = null;
    let currentFilter = 'all'; // Estado actual del filtro

    const init = () => {
        loadTasks();
        setupEventListeners();
        render();
    };

    const loadTasks = () => {
        const storedTasks = StorageService.getTasks();
        tasks = storedTasks.map(taskData => new Task(taskData));
    };

    const saveTasks = () => {
        const tasksData = tasks.map(task => task.toJSON());
        StorageService.saveTasks(tasksData);
    };

    const setupEventListeners = () => {
        const { DOM } = UIController;

        // Modal
        DOM.newTaskBtn.addEventListener('click', () => UIController.showModal());
        DOM.modalClose.addEventListener('click', () => UIController.hideModal());
        DOM.cancelModalBtn.addEventListener('click', () => UIController.hideModal());
        DOM.modalOverlay.addEventListener('click', () => UIController.hideModal());
        DOM.taskForm.addEventListener('submit', handleFormSubmit);

        // Panel
        DOM.panelClose.addEventListener('click', () => UIController.hidePanel());

        // Table events (delegation)
        DOM.tasksTableBody.addEventListener('click', handleTableClick);

        // Panel actions (delegation)
        DOM.panelContent.addEventListener('click', handlePanelAction);

        // Filtros
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Actualizar filtro activo
                document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                currentFilter = e.target.dataset.filter;
                render();
            });
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UIController.hideModal();
                UIController.hidePanel();
            }
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        const { DOM } = UIController;
        const taskData = {
            name: DOM.taskName.value.trim(),
            status: DOM.taskStatus.value,
            priority: DOM.taskPriority.value,
            responsible: DOM.taskResponsible.value.trim(),
            deadline: DOM.taskDate.value,
            // summary: DOM.taskSummary.value.trim(),
            description: DOM.taskDescription.value.trim(),
            // tags: DOM.taskTags.value ? DOM.taskTags.value.split(',').map(t => t.trim()).filter(Boolean) : []
        };

        const validation = Validator.validateTask(taskData);
        if (!validation.isValid) {
            UIController.showErrors(validation.errors);
            return;
        }

        const editId = DOM.taskForm.getAttribute('data-edit-id');
        if (editId) {
            updateTask(editId, taskData);
        } else {
            addTask(taskData);
        }

        UIController.hideModal();
        render();
    };

    const handleTableClick = (e) => {
        const row = e.target.closest('.table-row');
        if (!row) return;

        const taskId = row.dataset.taskId;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        if (e.target.closest('[data-action="toggle"]')) {
            toggleTask(taskId);
        } else {
            selectedTask = task;
            UIController.showPanel(task);
        }
    };

    const handlePanelAction = (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action || !selectedTask) return;

        if (action === 'edit') {
            UIController.showModal(selectedTask);
        } else if (action === 'delete') {
            if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
                deleteTask(selectedTask.id);
                UIController.hidePanel();
                render();
            }
        }
    };

    const addTask = (taskData) => {
        const newTask = new Task(taskData);
        tasks.unshift(newTask);
        saveTasks();
    };

    const updateTask = (id, taskData) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.update(taskData);
            saveTasks();
            if (selectedTask && selectedTask.id === id) {
                selectedTask = task;
                UIController.showPanel(task);
            }
        }
    };

    const toggleTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.toggleComplete();
            saveTasks();
            render();
            if (selectedTask && selectedTask.id === id) {
                selectedTask = task;
                UIController.showPanel(task);
            }
        }
    };

    const deleteTask = (id) => {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        selectedTask = null;
    };

    const getFilteredTasks = () => {
        switch (currentFilter) {
            case 'pending':
                return tasks.filter(task => 
                task.status === 'todo' || task.status === 'in-progress' );
            case 'completed':
                return tasks.filter(task => task.completed || task.status === 'completed' );
            default:
                return tasks;
        }
    };

    const render = () => {
        const filteredTasks = getFilteredTasks();
        UIController.renderTasks(filteredTasks);
        UIController.updateStats(tasks); // Stats siempre con todas las tareas
    };

    return { init };
})();

// ====================================================================
// INIT
// ====================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', TaskController.init);
} else {
    TaskController.init();
}


