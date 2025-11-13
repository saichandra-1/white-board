# Collaborative Whiteboard - Product Specification

## 1. Product Overview
A lightweight, single-page collaborative whiteboard web application that enables users to create, edit, and organize visual content through sticky notes, freehand drawing, basic shapes, and text boxes. The app features intuitive drag-and-drop interactions, persistent local/cloud storage, export capabilities, and responsive design optimized for both desktop and mobile experiences with comprehensive accessibility support.

## 2. Component Hierarchy

### App Structure
```
App
├── ThemeProvider (context for light/dark mode)
├── KeyboardShortcutProvider (global keyboard handling)
└── WhiteboardApp
    ├── TopBar
    │   ├── Logo
    │   ├── BoardTitle (editable)
    │   ├── ShareButton
    │   ├── ExportButton
    │   └── ThemeToggle
    ├── MainContent
    │   ├── Toolbar (left sidebar)
    │   │   ├── ToolButton (Select, Draw, Note, Shape, Text, etc.)
    │   │   └── ToolOptions (tool-specific settings)
    │   ├── Canvas (center)
    │   │   ├── CanvasGrid (optional snap-to-grid)
    │   │   ├── ElementLayer
    │   │   │   ├── StickyNote
    │   │   │   ├── Shape (Rectangle, Circle, Triangle, Arrow)
    │   │   │   ├── TextBox
    │   │   │   └── DrawingPath
    │   │   ├── SelectionOverlay
    │   │   └── CanvasControls (zoom, fit-to-screen)
    │   └── PropertiesPanel (right sidebar)
    │       ├── ElementProperties
    │       ├── ColorPicker
    │       └── LayerControls
    └── UndoRedoManager (state management)
```

### Component Props & State

**WhiteboardApp**
- State: `currentBoard`, `selectedElements`, `tool`, `theme`, `zoom`, `pan`
- Props: None (root component)

**Canvas**
- Props: `elements`, `selectedIds`, `tool`, `onElementUpdate`, `onSelectionChange`
- State: `isDragging`, `dragStart`, `drawingPath`

**StickyNote**
- Props: `id`, `x`, `y`, `width`, `height`, `content`, `color`, `selected`, `onUpdate`
- State: `isEditing`, `localContent`

**Toolbar**
- Props: `activeTool`, `onToolChange`, `toolOptions`
- State: `expandedSections`

**PropertiesPanel**
- Props: `selectedElements`, `onElementUpdate`
- State: `activeTab`

## 3. UI Layout Description

### Desktop Layout (1200px+)
- **Top Bar**: Fixed header (60px height) with title, share/export buttons, theme toggle
- **Left Toolbar**: Fixed sidebar (280px width) with tool selection and options
- **Center Canvas**: Flexible area with infinite scroll, zoom controls in bottom-right
- **Right Properties**: Fixed sidebar (320px width) showing selected element properties
- **Grid System**: Canvas with optional 20px snap-to-grid

### Mobile Layout (<768px)
- **Top Bar**: Collapsed with hamburger menu
- **Bottom Toolbar**: Floating toolbar with essential tools
- **Full Canvas**: Expanded canvas area with touch gestures
- **Modal Panels**: Properties and tools open as modal overlays

## 4. Data Model & JSON Schema

### Board Schema
```json
{
  "id": "board_123456789",
  "title": "Project Planning Session",
  "owner": "user_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:45:00Z",
  "settings": {
    "theme": "light",
    "snapToGrid": true,
    "gridSize": 20,
    "canvasSize": {"width": 2000, "height": 1500}
  },
  "elements": [
    {
      "id": "element_1",
      "type": "stickyNote",
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 150,
      "rotation": 0,
      "zIndex": 1,
      "data": {
        "content": "Team meeting at 3 PM",
        "color": "#fef3c7",
        "fontSize": 14
      }
    },
    {
      "id": "element_2",
      "type": "shape",
      "x": 400,
      "y": 200,
      "width": 150,
      "height": 100,
      "rotation": 0,
      "zIndex": 2,
      "data": {
        "shapeType": "rectangle",
        "fillColor": "#dbeafe",
        "strokeColor": "#3b82f6",
        "strokeWidth": 2
      }
    },
    {
      "id": "element_3",
      "type": "drawing",
      "x": 200,
      "y": 300,
      "width": 300,
      "height": 200,
      "rotation": 0,
      "zIndex": 3,
      "data": {
        "paths": [
          {"points": [{"x": 0, "y": 0}, {"x": 50, "y": 30}], "strokeColor": "#000", "strokeWidth": 3}
        ]
      }
    }
  ]
}
```

## 5. REST API Endpoints

### Authentication
```
POST /api/auth/login
Request: {"email": "user@example.com", "password": "hash"}
Response: {"token": "jwt_token", "user": {"id": "123", "name": "John"}}

POST /api/auth/register
Request: {"email": "user@example.com", "password": "hash", "name": "John"}
Response: {"token": "jwt_token", "user": {"id": "123", "name": "John"}}
```

### Boards
```
GET /api/boards
Response: {"boards": [{"id": "123", "title": "Board 1", "updatedAt": "..."}]}

POST /api/boards
Request: {"title": "New Board", "elements": []}
Response: {"board": {Board JSON}}

GET /api/boards/:id
Response: {"board": {Board JSON}}

PUT /api/boards/:id
Request: {Board JSON}
Response: {"board": {Board JSON}}

DELETE /api/boards/:id
Response: {"success": true}
```

### Export
```
POST /api/boards/:id/export
Request: {"format": "png|svg", "quality": "high|medium|low"}
Response: {"downloadUrl": "https://cdn.example.com/export.png", "expiresAt": "..."}
```

## 6. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| V | Select tool |
| N | New sticky note |
| D | Drawing tool |
| T | Text tool |
| R | Rectangle tool |
| C | Circle tool |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Y | Redo |
| Ctrl/Cmd + C | Copy |
| Ctrl/Cmd + V | Paste |
| Ctrl/Cmd + A | Select all |
| Delete/Backspace | Delete selected |
| Ctrl/Cmd + G | Group elements |
| Ctrl/Cmd + Shift + G | Ungroup |
| Ctrl/Cmd + ] | Bring forward |
| Ctrl/Cmd + [ | Send backward |
| Space + Drag | Pan canvas |
| Ctrl/Cmd + Scroll | Zoom in/out |
| Ctrl/Cmd + 0 | Fit to screen |
| Ctrl/Cmd + 1 | Zoom to 100% |

## 7. Theming & Persistence

### Theme Configuration
```typescript
const themes = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#e2e8f0',
    text: '#1e293b',
    primary: '#3b82f6',
    secondary: '#64748b'
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    primary: '#60a5fa',
    secondary: '#94a3b8'
  }
}
```

### Persistence Strategy
- **Local Storage**: Theme preference, recent boards, draft changes
- **Session Storage**: Temporary canvas state, undo/redo history
- **IndexedDB**: Offline board data, large drawing paths
- **Cloud Sync**: Automatic save every 30 seconds, manual save on demand

## 8. MVP Milestones & Timeline

### Phase 1: Core Canvas (2 weeks)
- [ ] Basic canvas with pan/zoom
- [ ] Sticky notes creation/editing
- [ ] Selection and drag functionality
- [ ] Local storage save/load

### Phase 2: Drawing & Shapes (1.5 weeks)
- [ ] Freehand drawing tool
- [ ] Basic shapes (rectangle, circle)
- [ ] Text boxes
- [ ] Undo/redo system

### Phase 3: Polish & Export (1 week)
- [ ] Theme toggle functionality
- [ ] Keyboard shortcuts
- [ ] PNG/SVG export
- [ ] Mobile responsiveness

### Phase 4: Advanced Features (2 weeks)
- [ ] Element grouping/alignment
- [ ] Properties panel
- [ ] Cloud save API integration
- [ ] Collaborative features prep

### Phase 5: Testing & Launch (1 week)
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Documentation

## 9. Accessibility & Performance

### Accessibility Features
- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Tab order, focus indicators, keyboard-only operation
- **Screen Reader**: Canvas content description, element announcements
- **High Contrast**: Support for high contrast mode
- **Focus Management**: Proper focus trapping in modals

### Performance Optimizations
- **Canvas Virtualization**: Only render visible elements
- **Debounced Updates**: Batch state updates during interactions
- **Memoized Components**: React.memo for static elements
- **Lazy Loading**: Load tools/panels on demand
- **Web Workers**: Offload heavy computations (export generation)

## 10. Testing Checklist & Acceptance Criteria

### Functional Testing
- [ ] Create, edit, delete all element types
- [ ] Undo/redo operations work correctly
- [ ] Keyboard shortcuts function properly
- [ ] Export generates valid files
- [ ] Theme switching persists across sessions
- [ ] Local storage backup/restore

### Usability Testing
- [ ] New users can create elements within 30 seconds
- [ ] Mobile touch interactions feel natural
- [ ] Loading time under 3 seconds on 3G
- [ ] No memory leaks during extended use

### Accessibility Testing
- [ ] Screen reader compatibility (NVDA, JAWS)
- [ ] Keyboard-only navigation possible
- [ ] Color contrast ratios meet WCAG AA
- [ ] Focus indicators clearly visible

### Browser Compatibility
- [ ] Chrome 90+ (primary target)
- [ ] Firefox 88+, Safari 14+, Edge 90+
- [ ] iOS Safari, Chrome Mobile
- [ ] Tablet landscape/portrait modes
