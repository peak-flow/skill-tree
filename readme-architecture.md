# Skill Tree Architecture

## Data Structure

### Nodes
Each skill is represented as a node with the following properties:
- `id`: Unique identifier
- `title`: The skill name
- `x/y`: Position coordinates
- `parentId`: Reference to parent node (null for root node)
- `children`: Array of child node IDs

## Core Components

### Node Management
- Add new skill nodes with optional parent connections
- Remove nodes (children connect to parent's parent when a node is removed)
- Select nodes to highlight their connections

### Canvas Rendering
- Connections between nodes are drawn on an HTML Canvas
- Directional arrows show relationships
- Highlighting for selected nodes

### Force-Directed Layout
- Automatically positions nodes to avoid overlapping
- Physics-based forces:
  - Repulsion between all nodes (configurable minimum distance)
  - Attraction along connections

### User Interaction
- Drag nodes to manually position them
- Right-click context menu for node operations
- Edit node titles

## Technical Implementation

### Alpine.js
- Manages application state and reactivity
- Handles user interactions and DOM updates
- Provides data binding for node properties

### HTML Canvas
- Draws connections between nodes
- Updates in real-time as nodes are moved
- Highlights selected connections

### Tailwind CSS
- Provides styling for nodes and UI elements
- Ensures responsive design

## Application Flow

1. **Initialization**
   - Create canvas for drawing connections
   - Add initial root node
   - Set up event listeners

2. **Adding Skills**
   - Create new node with default "Skill" title
   - Position at minimum distance from parent and other nodes
   - Update parent-child relationships
   - Run layout algorithm to position properly

3. **Drawing Connections**
   - Clear canvas
   - Iterate through nodes
   - Draw lines between connected nodes
   - Add directional arrows
   - Highlight selected connections

4. **User Controls**
   - Rename node titles
   - Right-click for node operations (add/remove)
