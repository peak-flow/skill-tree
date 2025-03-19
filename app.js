function skillTree() {
    return {
        // Configuration
        minDistance: 150, // Minimum distance between nodes in pixels
        repulsionStrength: 0.5, // Strength of repulsion force
        attractionStrength: 0.1, // Strength of attraction force
        
        // State
        nodes: [],
        selectedNodeId: null,
        canvas: null,
        ctx: null,
        isDragging: false,
        draggedNodeId: null,
        dragOffsetX: 0,
        dragOffsetY: 0,
        showContextMenu: false,
        contextMenuX: 0,
        contextMenuY: 0,
        contextMenuNodeId: null,
        
        // Initialization
        init() {
            // Initialize canvas
            this.canvas = document.getElementById('skill-connections');
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            
            // Add event listener for canvas resize
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // Add initial root node
            this.addNode(null, 'Root Skill', this.canvas.width / 2, this.canvas.height / 3);
            
            // Initial render
            this.renderNodes();
            this.drawConnections();
            
            // Set up global event listeners
            document.addEventListener('click', (e) => {
                // Close context menu when clicking elsewhere
                if (this.showContextMenu && !e.target.closest('.context-menu')) {
                    this.showContextMenu = false;
                    this.renderContextMenu(); // Remove the menu from DOM
                }
            });
        },
        
        // Canvas handling
        resizeCanvas() {
            const container = this.canvas.parentElement;
            this.canvas.width = container.offsetWidth;
            this.canvas.height = container.offsetHeight;
            this.drawConnections();
        },
        
        // Node management
        addNode(parentId, title = 'Skill', x = null, y = null) {
            const newId = Date.now().toString();
            
            // If parent exists, update its children array
            if (parentId) {
                const parentNode = this.nodes.find(node => node.id === parentId);
                if (parentNode) {
                    parentNode.children.push(newId);
                    
                    // Position relative to parent if x/y not provided
                    if (x === null || y === null) {
                        x = parentNode.x + 150;
                        y = parentNode.y + 50;
                    }
                }
            }
            
            // Default position if not specified
            if (x === null || y === null) {
                x = this.canvas.width / 2;
                y = this.canvas.height / 2;
            }
            
            // Create new node
            const newNode = {
                id: newId,
                title: title,
                x: x,
                y: y,
                parentId: parentId,
                children: []
            };
            
            this.nodes.push(newNode);
            this.selectedNodeId = newId;
            
            // Run layout to avoid overlaps
            this.runLayout();
            
            // Render the updated nodes
            this.renderNodes();
            this.drawConnections();
            
            return newId;
        },
        
        removeNode(nodeId) {
            const nodeIndex = this.nodes.findIndex(node => node.id === nodeId);
            if (nodeIndex === -1) return;
            
            const nodeToRemove = this.nodes[nodeIndex];
            
            // If node has children, connect them to the node's parent
            if (nodeToRemove.children.length > 0 && nodeToRemove.parentId) {
                const parentNode = this.nodes.find(node => node.id === nodeToRemove.parentId);
                if (parentNode) {
                    // Add node's children to parent's children
                    nodeToRemove.children.forEach(childId => {
                        if (!parentNode.children.includes(childId)) {
                            parentNode.children.push(childId);
                        }
                        
                        // Update child's parentId
                        const childNode = this.nodes.find(node => node.id === childId);
                        if (childNode) {
                            childNode.parentId = parentNode.id;
                        }
                    });
                }
            }
            
            // Remove the node from its parent's children array
            if (nodeToRemove.parentId) {
                const parentNode = this.nodes.find(node => node.id === nodeToRemove.parentId);
                if (parentNode) {
                    parentNode.children = parentNode.children.filter(id => id !== nodeId);
                }
            }
            
            // Remove the node
            this.nodes.splice(nodeIndex, 1);
            
            // Clear selection if the selected node was removed
            if (this.selectedNodeId === nodeId) {
                this.selectedNodeId = null;
            }
            
            // Run layout to reposition nodes
            this.runLayout();
            
            // Render the updated nodes
            this.renderNodes();
            this.drawConnections();
        },
        
        selectNode(nodeId) {
            this.selectedNodeId = nodeId;
            this.drawConnections();
        },
        
        // Rendering
        renderNodes() {
            const container = document.querySelector('.relative.w-full.h-full');
            
            // Clear existing nodes
            container.innerHTML = '';
            
            // Create node elements
            this.nodes.forEach(node => {
                const nodeElement = document.createElement('div');
                nodeElement.className = `skill-node ${node.id === this.selectedNodeId ? 'selected' : ''}`;
                nodeElement.style.left = `${node.x}px`;
                nodeElement.style.top = `${node.y}px`;
                nodeElement.setAttribute('data-node-id', node.id);
                
                const titleElement = document.createElement('div');
                titleElement.className = 'node-title';
                titleElement.setAttribute('contenteditable', 'true');
                titleElement.textContent = node.title;
                
                // Title editing
                titleElement.addEventListener('blur', (e) => {
                    const newTitle = e.target.textContent.trim();
                    if (newTitle) {
                        node.title = newTitle;
                    } else {
                        e.target.textContent = node.title;
                    }
                });
                
                // Prevent propagation of keydown events to avoid conflicts
                titleElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.target.blur();
                    }
                    e.stopPropagation();
                });
                
                nodeElement.appendChild(titleElement);
                
                // Node selection
                nodeElement.addEventListener('click', (e) => {
                    if (e.target === nodeElement || e.target === titleElement) {
                        this.selectNode(node.id);
                    }
                });
                
                // Node dragging
                nodeElement.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { // Left mouse button
                        this.isDragging = true;
                        this.draggedNodeId = node.id;
                        this.dragOffsetX = e.clientX - node.x;
                        this.dragOffsetY = e.clientY - node.y;
                        this.selectNode(node.id);
                    }
                });
                
                // Context menu (right-click)
                nodeElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu = true;
                    this.contextMenuX = e.clientX;
                    this.contextMenuY = e.clientY;
                    this.contextMenuNodeId = node.id;
                    this.selectNode(node.id);
                    this.renderContextMenu();
                });
                
                container.appendChild(nodeElement);
            });
            
            // Mouse move and up events for dragging
            document.addEventListener('mousemove', (e) => {
                if (this.isDragging && this.draggedNodeId) {
                    const node = this.nodes.find(n => n.id === this.draggedNodeId);
                    if (node) {
                        node.x = e.clientX - this.dragOffsetX;
                        node.y = e.clientY - this.dragOffsetY;
                        
                        // Update node position
                        const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
                        if (nodeElement) {
                            nodeElement.style.left = `${node.x}px`;
                            nodeElement.style.top = `${node.y}px`;
                        }
                        
                        // Redraw connections
                        this.drawConnections();
                    }
                }
            });
            
            document.addEventListener('mouseup', () => {
                this.isDragging = false;
                this.draggedNodeId = null;
            });
        },
        
        renderContextMenu() {
            // Remove existing context menu
            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            if (!this.showContextMenu) return;
            
            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.style.left = `${this.contextMenuX}px`;
            menu.style.top = `${this.contextMenuY}px`;
            
            const addChildItem = document.createElement('div');
            addChildItem.className = 'context-menu-item';
            addChildItem.textContent = 'Add Child Node';
            addChildItem.addEventListener('click', () => {
                this.addNode(this.contextMenuNodeId);
                this.showContextMenu = false;
                this.renderContextMenu(); // Remove the menu from DOM
            });
            
            const removeItem = document.createElement('div');
            removeItem.className = 'context-menu-item';
            removeItem.textContent = 'Remove Node';
            removeItem.addEventListener('click', () => {
                this.removeNode(this.contextMenuNodeId);
                this.showContextMenu = false;
                this.renderContextMenu(); // Remove the menu from DOM
            });
            
            menu.appendChild(addChildItem);
            menu.appendChild(removeItem);
            
            document.body.appendChild(menu);
        },
        
        drawConnections() {
            if (!this.ctx) return;
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw connections
            this.nodes.forEach(node => {
                if (node.parentId) {
                    const parentNode = this.nodes.find(n => n.id === node.parentId);
                    if (parentNode) {
                        // Determine if this connection should be highlighted
                        const isHighlighted = 
                            this.selectedNodeId === node.id || 
                            this.selectedNodeId === parentNode.id;
                        
                        // Draw connection
                        this.drawConnection(
                            parentNode.x + 60, // Center of parent node
                            parentNode.y + 20,
                            node.x + 60, // Center of child node
                            node.y + 20,
                            isHighlighted
                        );
                    }
                }
            });
        },
        
        drawConnection(x1, y1, x2, y2, isHighlighted) {
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            
            // Style based on highlight state
            if (isHighlighted) {
                this.ctx.strokeStyle = '#2563eb'; // Bright blue
                this.ctx.lineWidth = 3;
            } else {
                this.ctx.strokeStyle = '#94a3b8'; // Light gray
                this.ctx.lineWidth = 2;
            }
            
            this.ctx.stroke();
            
            // Draw arrow
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowSize = 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x2, y2);
            this.ctx.lineTo(
                x2 - arrowSize * Math.cos(angle - Math.PI / 6),
                y2 - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.lineTo(
                x2 - arrowSize * Math.cos(angle + Math.PI / 6),
                y2 - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.closePath();
            
            this.ctx.fillStyle = isHighlighted ? '#2563eb' : '#94a3b8';
            this.ctx.fill();
        },
        
        // Layout algorithm
        runLayout(iterations = 50) {
            // Simple force-directed layout
            for (let i = 0; i < iterations; i++) {
                // Apply repulsion between all nodes
                for (let j = 0; j < this.nodes.length; j++) {
                    for (let k = 0; k < this.nodes.length; k++) {
                        if (j !== k) {
                            this.applyRepulsion(this.nodes[j], this.nodes[k]);
                        }
                    }
                }
                
                // Apply attraction along connections
                this.nodes.forEach(node => {
                    if (node.parentId) {
                        const parentNode = this.nodes.find(n => n.id === node.parentId);
                        if (parentNode) {
                            this.applyAttraction(node, parentNode);
                        }
                    }
                    
                    node.children.forEach(childId => {
                        const childNode = this.nodes.find(n => n.id === childId);
                        if (childNode) {
                            this.applyAttraction(childNode, node);
                        }
                    });
                });
            }
        },
        
        applyRepulsion(node1, node2) {
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.minDistance) {
                const force = this.repulsionStrength * (this.minDistance - distance) / distance;
                const forceX = force * dx;
                const forceY = force * dy;
                
                node1.x -= forceX;
                node1.y -= forceY;
                node2.x += forceX;
                node2.y += forceY;
            }
        },
        
        applyAttraction(node1, node2) {
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > this.minDistance) {
                const force = this.attractionStrength * (distance - this.minDistance) / distance;
                const forceX = force * dx;
                const forceY = force * dy;
                
                node1.x += forceX;
                node1.y += forceY;
                node2.x -= forceX;
                node2.y -= forceY;
            }
        }
    };
}
