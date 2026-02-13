# 📝 ToDo - Gestor de Tareas

Aplicación web moderna para la gestión de tareas con diseño Interfaz oscura, responsive y fácil de usar.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Descripción

ToDo es un gestor de tareas profesional que permite crear, organizar y dar seguimiento a tus pendientes de manera eficiente. Con una interfaz limpia y moderna, soporta múltiples estados, prioridades, asignación de responsables y fechas límite.

## ✨ Características

- ✅ **Gestión completa de tareas**: Crear, editar, eliminar y completar tareas
- 🎨 **Interfaz oscura moderna**: Diseño inspirado en Notion
- 📱 **Totalmente responsive**: Experiencia optimizada para desktop, tablet y mobile
- 🔍 **Filtros inteligentes**: Ver todas, pendientes o completadas
- 🏷️ **Estados múltiples**: Sin empezar, en progreso, completada
- ⚡ **Prioridades**: Alta, media y baja
- 👤 **Responsables**: Asigna tareas a personas específicas
- 📅 **Fechas límite**: Control de vencimientos con alertas visuales
- 💾 **Persistencia local**: Los datos se guardan en LocalStorage
- 📊 **Estadísticas en tiempo real**: Total, pendientes y completadas
- 🎯 **Panel de detalles**: Vista completa de cada tarea

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con variables CSS y Flexbox/Grid
- **JavaScript (ES6+)**: Lógica de aplicación con arquitectura MVC
- **LocalStorage API**: Persistencia de datos
- **SVG Icons**: Iconos vectoriales escalables

## 📦 Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere instalación de dependencias
- No requiere servidor backend

## 🚀 Instalación

### Opción 1: Clonar repositorio

```bash
# Clonar el repositorio
git clone https://github.com/JeissonAntunez/ToDo.git

# Navegar al directorio
cd todo-app
```

### Opción 2: Descarga directa

1. Descarga el archivo ZIP del repositorio
2. Extrae los archivos en tu carpeta preferida

## ▶️ Ejecución

### Método 1: Abrir directamente

1. Navega a la carpeta del proyecto
2. Abre el archivo `index.html` con tu navegador preferido
3. ¡Listo! La aplicación está funcionando

### Método 2: Servidor local (recomendado)

#### Con Python:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Con Node.js (usando http-server):
```bash
# Instalar http-server globalmente
npm install -g http-server

# Ejecutar servidor
http-server -p 8000
```

#### Con VS Code:
1. Instala la extensión "Live Server"
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

Luego accede a: `http://localhost:8000`

## 📁 Estructura del Proyecto

```
todo-app/
│
├── index.html          # Estructura HTML principal
├── style.css           # Estilos CSS
├── app.js              # Lógica JavaScript
├── README.md           # Documentación
│
└── img/                # Carpeta de imágenes
    └── ToDo.png        # Logo de la aplicación
```

## 📖 Uso

### Crear una Nueva Tarea

1. Click en el botón **"+ Nueva tarea"** (desktop) o **"+"** (mobile)
2. Completa el formulario:
   - **Nombre**: Título de la tarea (obligatorio, mínimo 3 caracteres)
   - **Estado**: Sin empezar / En progreso / Completada
   - **Prioridad**: Baja / Media / Alta (obligatorio)
   - **Responsable**: Nombre de la persona asignada (opcional)
   - **Fecha límite**: Fecha de vencimiento (opcional)
   - **Descripción**: Detalles adicionales (opcional, mínimo 3 caracteres)
3. Click en **"Crear tarea"**

### Gestionar Tareas

- **Completar tarea**: Click en el checkbox ☑️
- **Ver detalles**: Click en cualquier parte de la fila/tarjeta
- **Editar**: Abrir detalles → Click en "Editar"
- **Eliminar**: Abrir detalles → Click en "Eliminar" → Confirmar

### Filtrar Tareas

Usa los filtros en la parte superior:
- **Todas**: Muestra todas las tareas
- **Pendientes**: Solo tareas sin empezar o en progreso
- **Completadas**: Solo tareas finalizadas

### Navegación Mobile

En dispositivos móviles:
- **☰ Menú**: Abre el sidebar con estadísticas
- **+**: Crear nueva tarea rápidamente
- **Tarjetas**: Vista optimizada para mobile
- **Tap**: Toca cualquier tarjeta para ver detalles

## 🎨 Características Visuales

### Estados de Tareas

- 🔘 **Sin empezar**: Gris
- 🔵 **En progreso**: Azul
- ✅ **Completada**: Verde

### Niveles de Prioridad

- 🟢 **Baja**: Verde
- 🟡 **Media**: Naranja
- 🔴 **Alta**: Rojo

### Indicadores Especiales

- ⚠️ **Fecha vencida**: Texto rojo cuando la fecha límite ha pasado
- ✓ **Tarea completada**: Nombre tachado
- 👤 **Avatar**: Iniciales del responsable

## 📱 Responsive Design

### Desktop (> 768px)
- Vista de tabla completa con 7 columnas
- Sidebar fijo visible
- Todas las características disponibles

### Tablet (768px - 1024px)
- Vista de tabla con 5 columnas
- Oculta: Responsable y Fecha (disponibles en detalles)
- Sidebar fijo visible

### Mobile (< 768px)
- **Vista de tarjetas** en lugar de tabla
- **Menú hamburguesa** para acceder al sidebar
- **Header móvil** con controles esenciales
- **Panel de detalles** en pantalla completa
- **Formularios adaptados** con campos apilados

## 💾 Almacenamiento de Datos

Los datos se guardan automáticamente en **LocalStorage** del navegador:
- Se persisten al crear, editar o eliminar tareas
- No se pierden al recargar la página
- Específicos por navegador y dominio


## ⌨️ Atajos de Teclado

- **ESC**: Cerrar modal/panel abierto
- **Enter**: Enviar formulario (cuando está enfocado)

## 🔧 Personalización

### Cambiar colores:

Edita las variables CSS en `style.css`:

```css
:root {
    --accent-blue: #4a9eff;      /* Color principal */
    --accent-green: #00c875;     /* Color de éxito */
    --accent-red: #e44258;       /* Color de alerta */
    --bg-primary: #191919;       /* Fondo principal */
    /* ... más variables */
}
```


## 🐛 Solución de Problemas

### Las tareas no se guardan
- Verifica que el navegador permita LocalStorage
- Revisa la consola del navegador para errores

### La interfaz no responde
- Limpia la caché del navegador
- Verifica que todos los archivos estén en la misma carpeta

### Problemas en mobile
- Asegúrate de estar usando la última versión
- Prueba en modo incógnito

## 📊 Arquitectura del Código

### Patrón MVC (Model-View-Controller)

```javascript
// Model
class Task { }                    // Modelo de datos

// Controller
const TaskController              // Lógica de negocio

// View
const UIController                // Interfaz de usuario
```

### Módulos principales:

- **Utils**: Funciones de utilidad
- **StorageService**: Gestión de LocalStorage
- **Task**: Modelo de tarea
- **Validator**: Validación de formularios
- **UIController**: Renderizado y eventos de UI
- **TaskController**: Coordinación general

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Mejoras Futuras

- [ ] Modo claro/oscuro
- [ ] Drag & drop para reordenar
- [ ] Categorías personalizadas
- [ ] Sincronización en la nube
- [ ] Recordatorios y notificaciones
- [ ] Exportar a PDF/CSV
- [ ] Subtareas
- [ ] Comentarios en tareas
- [ ] Modo colaborativo

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Jeisson Antunez 

Enlace del Proyecto: [https://github.com/JeissonAntunez/ToDo.git](https://github.com/JeissonAntunez/ToDo.git)


## 🙏 Agradecimientos

- Inspiración de diseño: [Notion](https://notion.so) 
- Iconos: SVG nativos
- Fuentes: System fonts

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
